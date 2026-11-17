#!/usr/bin/env node
'use strict';
const fs=require('node:fs'),path=require('node:path'),os=require('node:os');
const {spawn,spawnSync}=require('node:child_process');
const {once}=require('node:events');
const {dependency}=require('./deps.cjs'),{loadProject,renderFrame}=require('./project.cjs'),{writeSfx}=require('./audio.cjs');
function args(argv){
  const o={project:argv[0]};
  for(let i=1;i<argv.length;i++){
    const a=argv[i];if(['--check','--overwrite','--stills'].includes(a))o[a.slice(2)]=true;
    else if(['--out','--width','--height','--timeout'].includes(a)){if(!argv[i+1]||argv[i+1].startsWith('--'))throw Error(`${a} perlu nilai`);o[a.slice(2)]=argv[++i];}
    else throw Error(`Opsi tidak dikenal: ${a}`);
  }return o;
}
function run(cmd,a){const r=spawnSync(cmd,a,{encoding:'utf8',maxBuffer:8*1024*1024});if(r.error)throw r.error;if(r.status!==0)throw Error(`${cmd}: ${r.stderr}`);return r.stdout;}
async function main(){
  const o=args(process.argv.slice(2));if(!o.project){console.log('node scripts/render.cjs project.json --out hasil.mp4 [--check] [--stills] [--width 1080 --height 1920] [--overwrite]');return;}
  const p=loadProject(o.project);p.images={};if(p.assets?.length){const {loadImage}=dependency('@napi-rs/canvas');for(const a of p.assets)p.images[a.id]=await loadImage(path.resolve(p.base,a.path));}
  if(o.width||o.height){if(!o.width||!o.height)throw Error('Tentukan --width dan --height bersamaan');p.width=Number(o.width);p.height=Number(o.height);if(!Number.isInteger(p.width)||!Number.isInteger(p.height)||p.width<2||p.height<2||p.width%2||p.height%2||p.width>3840||p.height>3840)throw Error('Resolusi harus genap, 2..3840');}
  const timeout=Number(o.timeout??1500);if(!Number.isInteger(timeout)||timeout<1||timeout>60000)throw Error('timeout harus 1..60000 ms');
  const {createCanvas}=dependency('@napi-rs/canvas'),canvas=createCanvas(p.width,p.height),events=new Map();
  const out=path.resolve(o.out??'hasil.mp4');if(!out.toLowerCase().endsWith('.mp4'))throw Error('Output harus .mp4');
  if(out===p.sourcePath||out===p.filename)throw Error('Output tidak boleh menimpa sumber');
  if(!o.check&&fs.existsSync(out)&&!o.overwrite)throw Error(`Output sudah ada: ${out}. Pilih nama lain atau --overwrite.`);
  const stillDir=path.join(path.dirname(out),path.basename(out,'.mp4')+'-stills');
  if(o.stills)fs.mkdirSync(stillDir,{recursive:true});
  for(const scene of p.scenes){
    for(const [label,t] of [['awal',0],['tengah',scene.duration/2],['akhir',scene.duration]]){
      renderFrame(canvas,p,scene.start+t,{timeout,sceneOverride:scene,events:label==='awal'?events:undefined});
      if(o.stills)fs.writeFileSync(path.join(stillDir,`scene-${scene.id}-${label}.png`),canvas.toBuffer('image/png'));
    }
  }
  console.log(`Pemeriksaan lolos: ${p.scenes.length} scene, ${p.frames} frame, ${p.duration.toFixed(3)} detik, ${events.size} SFX.`);
  if(o.check)return;
  run('ffmpeg',['-version']);run('ffprobe',['-version']);
  const audio=p.audio??{};
  if(audio.voiceover){const d=Number(run('ffprobe',['-v','error','-show_entries','format=duration','-of','default=nw=1:nk=1',audio.voiceover]).trim());if(!Number.isFinite(d))throw Error('Durasi VO tidak terbaca');if(d>p.frames/p.fps+.05)throw Error(`VO ${d.toFixed(2)}s melebihi timeline ${p.duration.toFixed(2)}s. Sesuaikan durasi scene; VO tidak dipotong otomatis.`);}
  fs.mkdirSync(path.dirname(out),{recursive:true});const temp=fs.mkdtempSync(path.join(os.tmpdir(),'canvas-video-'));
  let encoder=null;
  try{
    const video=path.join(temp,'video.mp4'),err=[];
    encoder=spawn('ffmpeg',['-hide_banner','-loglevel','error','-y','-f','image2pipe','-framerate',String(p.fps),'-vcodec','png','-i','pipe:0','-an','-c:v','libx264','-preset','fast','-crf','18','-pix_fmt','yuv420p','-movflags','+faststart',video],{stdio:['pipe','ignore','pipe']});
    const finished=new Promise((resolve,reject)=>{encoder.once('error',reject);encoder.once('close',code=>code===0?resolve():reject(Error(`FFmpeg gagal (${code}): ${err.join('')}`)));});
    // Attach a handler immediately so an early encoder exit never becomes unhandled.
    finished.catch(()=>{});let pipeError;encoder.stdin.on('error',e=>{pipeError=e;});encoder.stderr.on('data',b=>err.push(b.toString()));
    for(let f=0;f<p.frames;f++){
      renderFrame(canvas,p,f/p.fps,{timeout});if(pipeError)throw pipeError;
      if(!encoder.stdin.write(canvas.toBuffer('image/png')))await once(encoder.stdin,'drain');
      if(f%p.fps===0)console.log(`Render ${Math.round(f/p.frames*100)}% · ${f}/${p.frames}`);
    }
    encoder.stdin.end();await finished;encoder=null;
    const inputs=['-i',video],filters=[],labels=[];let idx=1;
    for(const [key,gain] of [['voiceover',1],['music',.08]])if(audio[key]){if(key==='music')inputs.push('-stream_loop','-1');inputs.push('-i',audio[key]);filters.push(`[${idx}:a]aresample=44100,volume=${audio[key+'Gain']??gain},apad[a${idx}]`);labels.push(`[a${idx++}]`);}
    if(audio.sfx!==false&&events.size){const wav=path.join(temp,'sfx.wav');writeSfx(wav,[...events.values()],p.frames/p.fps);inputs.push('-i',wav);filters.push(`[${idx}:a]apad[a${idx}]`);labels.push(`[a${idx++}]`);}
    const staging=path.join(temp,'final.mp4');
    if(labels.length){filters.push(`${labels.join('')}amix=inputs=${labels.length}:normalize=0:duration=longest,alimiter=limit=0.95:level=false[aout]`);run('ffmpeg',['-hide_banner','-loglevel','error','-y',...inputs,'-filter_complex',filters.join(';'),'-map','0:v:0','-map','[aout]','-c:v','copy','-c:a','aac','-b:a','192k','-ar','44100','-ac','2','-t',String(p.frames/p.fps),'-movflags','+faststart',staging]);}
    else fs.copyFileSync(video,staging);
    const probe=JSON.parse(run('ffprobe',['-v','error','-count_frames','-show_streams','-show_format','-of','json',staging]));
    const v=probe.streams.find(x=>x.codec_type==='video');if(Number(v.nb_read_frames)!==p.frames||v.width!==p.width||v.height!==p.height)throw Error('Verifikasi MP4 gagal: jumlah frame/resolusi berbeda');
    fs.copyFileSync(staging,out);
    const report={output:out,scenes:p.scenes.map(x=>({id:x.id,duration:x.duration,start:x.start})),requestedDuration:p.duration,encodedDuration:p.frames/p.fps,frames:p.frames,width:p.width,height:p.height,fps:p.fps,font:p.font??'DejaVu Sans',videoCodec:v.codec_name,audioCodec:probe.streams.find(x=>x.codec_type==='audio')?.codec_name??null,sfx:audio.sfx===false?[]:[...events.values()],voiceover:!!audio.voiceover,checks:['syntax','awal/tengah/akhir tiap scene','semua frame dirender','ffprobe jumlah frame dan resolusi'],note:'Pemeriksaan visual dan pendengaran audio tetap dilakukan terpisah.'};
    fs.writeFileSync(out.replace(/\.mp4$/i,'.report.json'),JSON.stringify(report,null,2));console.log(`Selesai: ${out}`);
  }finally{if(encoder)encoder.kill('SIGKILL');fs.rmSync(temp,{recursive:true,force:true});}
}
if(require.main===module)main().catch(e=>{console.error(e.message);process.exitCode=1;});
module.exports={args};

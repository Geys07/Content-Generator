const {attachMedia}=require('./media-runtime.cjs');
'use strict';
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const {makeRuntime}=require('./runtime.cjs');
function parseSource(text,name='scenes.js') {
  const lines=text.replace(/^\uFEFF/,'').replace(/\r\n/g,'\n').split('\n');
  const marks=[];lines.forEach((line,i)=>{const m=line.match(/^\s*\/\/ ===== (DUNIA|AKHIR DUNIA|SCENE (\d+)) =====\s*$/);if(m)marks.push({kind:m[1],id:m[2]?Number(m[2]):null,line:i});});
  const world=marks.filter(m=>m.kind==='DUNIA'),end=marks.filter(m=>m.kind==='AKHIR DUNIA');
  if(world.length>1||end.length>1||world.length!==end.length)throw Error(`${name}: pasangan DUNIA / AKHIR DUNIA tidak valid`);
  if(world.length && (world[0].line>=end[0].line||marks.some(m=>m.id!==null&&m.line<end[0].line)))throw Error(`${name}: DUNIA harus selesai sebelum scene pertama`);
  const scenes=new Map(),sceneMarks=marks.filter(m=>m.id!==null);
  if(!sceneMarks.length)throw Error(`${name}: tidak ada penanda // ===== SCENE n =====`);
  // Preserve original line numbers in both syntax and runtime stack traces.
  for(let i=0;i<sceneMarks.length;i++){
    const m=sceneMarks[i];if(scenes.has(m.id))throw Error(`${name}: SCENE ${m.id} duplikat`);
    const finish=i+1<sceneMarks.length?sceneMarks[i+1].line:lines.length;
    const selected=lines.map((l,j)=>(world.length && j>world[0].line&&j<end[0].line)||(j>m.line&&j<finish)?l:'');
    if(!selected.slice(m.line+1,finish).join('').trim())throw Error(`${name}: SCENE ${m.id} kosong`);
    const source='(function(){\n'+selected.join('\n')+'\n})()';
    let script;try{script=new vm.Script(source,{filename:name,lineOffset:-1});}catch(e){throw Error(`SCENE ${m.id}: ${e.stack}`);}
    scenes.set(m.id,{id:m.id,script,startLine:m.line+2});
  }
  return scenes;
}
function loadProject(file) {
  const filename=path.resolve(file),base=path.dirname(filename),p=JSON.parse(fs.readFileSync(filename,'utf8'));
  if(!p.source||!Array.isArray(p.scenes)||!p.scenes.length)throw Error('Manifest perlu source dan scenes');
  p.width=p.width??720;p.height=p.height??1280;p.fps=p.fps??30;
  for(const k of ['width','height','fps'])if(!Number.isInteger(p[k])||p[k]<1)throw Error(`${k} harus bilangan bulat positif`);
  if(p.width%2||p.height%2||p.width>3840||p.height>3840||p.fps>60)throw Error('Ukuran harus genap, maksimal 3840; fps maksimal 60');
  p.logicalWidth=p.logicalWidth??720;p.logicalHeight=p.logicalHeight??1280;
  if(!(p.logicalWidth>0&&p.logicalHeight>0))throw Error('Ukuran logis harus positif');
  const src=path.resolve(base,p.source),parsed=parseSource(fs.readFileSync(src,'utf8'),src);
  const seen=new Set();let cursor=0;
  for(const scene of p.scenes){
    if(!Number.isFinite(scene.duration)||scene.duration<=0)throw Error(`SCENE ${scene.id}: duration harus positif`);
    if(!parsed.has(scene.id))throw Error(`SCENE ${scene.id}: kode tidak ditemukan`);
    if(seen.has(scene.id))throw Error(`SCENE ${scene.id}: manifest duplikat`);seen.add(scene.id);
    Object.assign(scene,parsed.get(scene.id));scene.start=cursor;cursor+=scene.duration;
    scene.theme=scene.theme??'paper';if(!['paper','night','dusk'].includes(scene.theme))throw Error(`SCENE ${scene.id}: tema tidak dikenal`);
    if(scene.words){let previous=-1;for(const w of scene.words){if(typeof w.text!=='string'||!Number.isFinite(w.start)||w.start<0||w.start<previous||w.start>=scene.duration)throw Error(`SCENE ${scene.id}: timing kata tidak valid`);previous=w.start;}}
  }
  if(seen.size!==parsed.size)throw Error('Ada kode scene yang tidak tercantum dalam manifest. Cantumkan semua scene agar tidak terlewat.');
  for(const key of ['voiceoverGain','musicGain'])if(p.audio?.[key]!==undefined&&(!Number.isFinite(p.audio[key])||p.audio[key]<0))throw Error(`${key} harus angka nonnegatif`);
  p.duration=cursor;p.frames=Math.ceil(cursor*p.fps);p.base=base;p.filename=filename;p.sourcePath=src;
  for(const key of ['voiceover','music'])if(p.audio?.[key]){p.audio[key]=path.resolve(base,p.audio[key]);if(!fs.existsSync(p.audio[key]))throw Error(`Audio tidak ditemukan: ${p.audio[key]}`);}
  return p;
}
function sceneAt(p,time){return p.scenes.find(scene=>time<scene.start+scene.duration-1e-9)||p.scenes.at(-1);}
function drawCaption(ctx,p,scene,t){
  if(!scene.caption&&!scene.words?.length)return;
  const font=p.font??'DejaVu Sans',size=p.captionSize??30,max=p.logicalWidth-180,cy=p.captionY??850;
  const words=scene.words??String(scene.caption).split(/\s+/).map(text=>({text,start:0}));
  ctx.save();ctx.font=`700 ${size}px "${font}"`;ctx.textBaseline='middle';ctx.textAlign='left';
  const space=ctx.measureText(' ').width,lines=[];let row=[],width=0;
  for(const w of words){const ww=ctx.measureText(w.text).width;if(width&&width+space+ww>max){lines.push(row);row=[];width=0;}row.push({...w,width:ww});width+=(width?space:0)+ww;}if(row.length)lines.push(row);
  // Show at most two lines at once; timing comes only from supplied cue data.
  let active=-1;words.forEach((w,i)=>{if(t>=w.start)active=i;});let total=0,lineIndex=0;
  lines.forEach((r,i)=>{if(active>=total)lineIndex=i;total+=r.length;});
  const groupStart=Math.floor(lineIndex/2)*2,display=lines.slice(groupStart,groupStart+2);
  display.forEach((r,j)=>{const w=r.reduce((a,b)=>a+b.width,0)+space*(r.length-1);let x=(p.logicalWidth-w)/2,y=cy+(j-(display.length-1)/2)*(size+17);
    ctx.fillStyle='#1c2433';ctx.beginPath();ctx.roundRect(x-15,y-size*.7,w+30,size*1.4,9);ctx.fill();
    for(const item of r){ctx.fillStyle=scene.words&&t<item.start?'#9baab9':'#ffffff';ctx.fillText(item.text,x,y);x+=item.width+space;}
  });ctx.restore();
}
function renderFrame(canvas,p,time,{events,timeout=1500,sceneOverride}={}){
  const ctx=canvas.getContext('2d'),scene=sceneOverride??sceneAt(p,time),t=Math.max(0,Math.min(scene.duration,time-scene.start));
  // Reset context state even when prior user code left an unmatched save().
  ctx.reset();ctx.scale(p.width/p.logicalWidth,p.height/p.logicalHeight);
  const colors={paper:['#eef2f7','#d8e2ec'],night:['#172638','#263e54'],dusk:['#65788d','#a2b0bd']};
  const custom=p.background?.[scene.theme];const bg=custom&&/^#[0-9a-f]{6}$/i.test(custom.top)&&/^#[0-9a-f]{6}$/i.test(custom.bottom)?[custom.top,custom.bottom]:colors[scene.theme],g=ctx.createLinearGradient(0,0,0,p.logicalHeight);g.addColorStop(0,bg[0]);g.addColorStop(1,bg[1]);ctx.fillStyle=g;ctx.fillRect(0,0,p.logicalWidth,p.logicalHeight);
  const emit=e=>{if(events){if(!Number.isFinite(e.time)||e.time<0||e.time>=scene.duration)throw Error(`Waktu SFX tidak valid: ${e.name}`);events.set(`${scene.id}:${e.name}:${e.time}`,{...e,time:e.time+scene.start});}};
  const s=makeRuntime(ctx,t,scene.duration,scene.theme,emit,p.font??'DejaVu Sans');s.w=p.logicalWidth;s.h=p.logicalHeight;
  attachMedia(s,ctx,p.images||{});
  const context=vm.createContext({s,ctx},{codeGeneration:{strings:false,wasm:false}});
  try{scene.script.runInContext(context,{timeout});}catch(e){throw Error(`SCENE ${scene.id}, t=${t.toFixed(3)}s\n${e.stack}`);}
  ctx.resetTransform();ctx.globalAlpha=1;ctx.scale(p.width/p.logicalWidth,p.height/p.logicalHeight);drawCaption(ctx,p,scene,t);
  return scene;
}
module.exports={parseSource,loadProject,sceneAt,renderFrame};

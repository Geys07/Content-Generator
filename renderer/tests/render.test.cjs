'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const {spawnSync}=require('node:child_process');
const {parseSource,loadProject,renderFrame,sceneAt}=require('../scripts/project.cjs');
const {dependency}=require('../scripts/deps.cjs');
const {springResponse,makeRuntime}=require('../scripts/runtime.cjs');
const {createCanvas}=dependency('@napi-rs/canvas');
function fixture(code,scenes){const dir=fs.mkdtempSync(path.join(os.tmpdir(),'renderer-test-'));fs.writeFileSync(path.join(dir,'scenes.js'),code);fs.writeFileSync(path.join(dir,'project.json'),JSON.stringify({source:'scenes.js',width:180,height:320,fps:30,scenes}));return {dir,file:path.join(dir,'project.json'),p:loadProject(path.join(dir,'project.json'))};}
const source='// ===== DUNIA =====\nconst color = "#ff0000";\n// ===== AKHIR DUNIA =====\n// ===== SCENE 4 =====\ns.rect(0,0,720,1280,{fill:color});\n// ===== SCENE 5 =====\ns.rect(0,0,720,1280,{fill:"#0000ff"});';
test('scene IDs need not start at one; scope and boundaries are correct',()=>{
 const f=fixture(source,[{id:4,duration:.2},{id:5,duration:.3}]);try{const c=createCanvas(180,320);assert.equal(sceneAt(f.p,.199).id,4);assert.equal(sceneAt(f.p,.2).id,5);renderFrame(c,f.p,.1);assert.deepEqual([...c.getContext('2d').getImageData(5,5,1,1).data],[255,0,0,255]);renderFrame(c,f.p,.2);assert.deepEqual([...c.getContext('2d').getImageData(5,5,1,1).data],[0,0,255,255]);}finally{fs.rmSync(f.dir,{recursive:true});}
});
test('duplicate IDs, missing duration and omitted scenes fail explicitly',()=>{
 assert.throws(()=>parseSource('// ===== SCENE 1 =====\n1;\n// ===== SCENE 1 =====\n2;'),/duplikat/);
 assert.throws(()=>parseSource('// ===== DUNIA =====\n// ===== SCENE 1 =====\n1;'),/pasangan/);
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'renderer-bad-'));try{fs.writeFileSync(path.join(dir,'s.js'),source);fs.writeFileSync(path.join(dir,'p.json'),JSON.stringify({source:'s.js',scenes:[{id:4,duration:1}]}));assert.throws(()=>loadProject(path.join(dir,'p.json')),/terlewat/);}finally{fs.rmSync(dir,{recursive:true});}
});
test('syntax and runtime errors point to original source lines',()=>{
 assert.throws(()=>parseSource('// ===== SCENE 8 =====\nconst a = ;','bad.js'),/bad\.js:2/);
 const f=fixture('// ===== SCENE 9 =====\nconst a=1;\nnotDefined();',[{id:9,duration:1}]);try{assert.throws(()=>renderFrame(createCanvas(180,320),f.p,0),/scenes\.js:3/);}finally{fs.rmSync(f.dir,{recursive:true});}
});
test('infinite loop times out and unknown APIs stop rendering',()=>{
 for(const [code,match] of [['while(true){}',/timed out/],['s.missingFeature();',/belum didukung/]]){const f=fixture('// ===== SCENE 1 =====\n'+code,[{id:1,duration:1}]);try{assert.throws(()=>renderFrame(createCanvas(180,320),f.p,0,{timeout:30}),match);}finally{fs.rmSync(f.dir,{recursive:true});}}
});
test('fresh frame scope, repeatable rand, and repeatable output',()=>{
 const f=fixture('// ===== SCENE 1 =====\nglobalThis.count=(globalThis.count||0)+1;\ns.rect(0,0,720,1280,{fill:count===1?"#00ff00":"#ff0000"});\ns.circle(s.rand(4)*700,200+s.t*10,30,{fill:"#000000"});',[{id:1,duration:2}]);try{const c=createCanvas(180,320);renderFrame(c,f.p,.3);const a=c.toBuffer('image/png');renderFrame(c,f.p,1);renderFrame(c,f.p,.3);assert.ok(a.equals(c.toBuffer('image/png')));}finally{fs.rmSync(f.dir,{recursive:true});}
});
test('spring physics starts at zero and settles for all presets',()=>{for(const preset of ['smooth','snappy','heavy','bouncy',{damping:50,stiffness:150,mass:1}]){assert.equal(springResponse(-1,preset),0);assert.equal(springResponse(0,preset),0);assert.ok(Math.abs(springResponse(8,preset)-1)<.0001);}});
test('group alpha and transforms restored after exception',()=>{const c=createCanvas(100,100),ctx=c.getContext('2d'),s=makeRuntime(ctx,0,1);ctx.globalAlpha=.5;const before=ctx.globalAlpha;assert.throws(()=>s.group({x:22,alpha:.2},()=>{throw Error('test');}));assert.equal(ctx.globalAlpha,before);assert.equal(ctx.getTransform().e,0);});
test('end-to-end two scenes export all frames with AAC audio',()=>{
 const f=fixture(source.replace('s.rect(0,0,720,1280,{fill:color});','s.rect(0,0,720,1280,{fill:color});s.sfx("click",.1,.2);'),[{id:4,duration:.2},{id:5,duration:.3}]);
 try{const out=path.join(f.dir,'test.mp4');const r=spawnSync(process.execPath,[path.resolve(__dirname,'../scripts/render.cjs'),f.file,'--out',out],{encoding:'utf8',timeout:60000});assert.equal(r.status,0,r.stderr);const report=JSON.parse(fs.readFileSync(out.replace('.mp4','.report.json')));assert.equal(report.frames,15);assert.equal(report.videoCodec,'h264');assert.equal(report.audioCodec,'aac');assert.equal(report.sfx.length,1);assert.ok(fs.statSync(out).size>1000);}finally{fs.rmSync(f.dir,{recursive:true,force:true});}
});

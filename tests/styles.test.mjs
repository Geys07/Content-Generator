import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {styles,ruleFor} from '../dist/styles.js';
import {demoProject} from '../dist/presets.js';
import {animationPrompt} from '../dist/prompts.js';
import {parseCode} from '../dist/model.js';
const require=createRequire(import.meta.url);
const {loadProject,renderFrame}=require('../renderer/scripts/project.cjs');
const {dependency}=require('../renderer/scripts/deps.cjs');
const {createCanvas}=dependency('@napi-rs/canvas');
for(const style of styles)test(`${style.name}: deterministic frames and playable H264 MP4 without an invented audio track`,()=>{
 const demo=demoProject(style.id),dir=fs.mkdtempSync(path.join(os.tmpdir(),'style-'));
 try{fs.writeFileSync(path.join(dir,'scenes.js'),`// ===== DUNIA =====\n${demo.world}\n// ===== AKHIR DUNIA =====\n// ===== SCENE 1 =====\n${demo.scenes[0].code}`);
 const file=path.join(dir,'project.json');fs.writeFileSync(file,JSON.stringify({source:'scenes.js',width:180,height:320,fps:8,scenes:[{id:1,duration:.5,theme:'paper'}]}));
 const p=loadProject(file),canvas=createCanvas(180,320);renderFrame(canvas,p,.2);const first=canvas.toBuffer('image/png');renderFrame(canvas,p,.4);renderFrame(canvas,p,.2);assert.ok(first.equals(canvas.toBuffer('image/png')));
 const out=path.join(dir,'style.mp4'),r=spawnSync(process.execPath,[path.resolve('renderer/scripts/render.cjs'),file,'--out',out],{encoding:'utf8',timeout:60000});assert.equal(r.status,0,r.stderr);const report=JSON.parse(fs.readFileSync(out.replace('.mp4','.report.json')));assert.equal(report.frames,4);assert.equal(report.videoCodec,'h264');assert.equal(report.audioCodec,null);assert.ok(fs.statSync(out).size>1000);
 }finally{fs.rmSync(dir,{recursive:true,force:true});}
});
test('style and project rules reach animation prompts',()=>{const p=demoProject('kinetic');p.rules={animation:'Jaga margin 80 piksel.'};assert.equal(ruleFor(p,'animation'),'Jaga margin 80 piksel.');const prompt=animationPrompt(p,0,1);assert.match(prompt,/Kinetic typography/);assert.match(prompt,/Jaga margin 80 piksel/);});
test('raw HTML is rejected with actionable Canvas guidance',()=>{assert.throws(()=>parseCode('<!doctype html><html></html>'),/HTML|Canvas/);});
test('uploaded image ID renders in native preview and MP4 package',()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'asset-'));
 try{const image=createCanvas(30,20);image.getContext('2d').fillStyle='#ff0000';image.getContext('2d').fillRect(0,0,30,20);fs.writeFileSync(path.join(dir,'image.png'),image.toBuffer('image/png'));
 fs.writeFileSync(path.join(dir,'scenes.js'),'// ===== SCENE 1 =====\ns.photo("gambar_1",0,0,720,1280,{fit:"cover"});');const file=path.join(dir,'project.json');fs.writeFileSync(file,JSON.stringify({source:'scenes.js',width:180,height:320,fps:8,assets:[{id:'gambar_1',path:'image.png'}],scenes:[{id:1,duration:.5}]}));
 const out=path.join(dir,'asset.mp4'),r=spawnSync(process.execPath,[path.resolve('renderer/scripts/render.cjs'),file,'--out',out,'--stills'],{encoding:'utf8',timeout:60000});assert.equal(r.status,0,r.stderr);assert.ok(fs.statSync(out).size>1000);assert.ok(fs.existsSync(path.join(dir,'asset-stills/scene-1-tengah.png')));
 const p=loadProject(file);assert.throws(()=>renderFrame(createCanvas(180,320),p,0),/gambar_1/);
 }finally{fs.rmSync(dir,{recursive:true,force:true});}
});

'use strict';
const fs=require('node:fs');
const groups={
 tick:['tick','click','tap','type','tock','step','snap','clap','stamp','shutter'],
 sweep:['swish','whoosh','swipe','whip','slide','paper','pageflip','chalk','scratch'],
 tone:['ding','beep','blip','notify','correct','coin','cash','sparkle','magic','tada'],
 bass:['thud','boom','impact','kick','heart','rocket'],
 spring:['pop','boing','drop','bubble'],
 rise:['rise','riser','laser','glitch','buzzer']
};
function writeSfx(file,events,duration,rate=44100){
  const samples=new Float32Array(Math.ceil(duration*rate));
  for(const e of events){
    const kind=Object.keys(groups).find(k=>groups[k].includes(e.name));
    if(!kind)throw Error(`SFX ${e.name} belum tersedia; gunakan audio eksternal atau nama dalam kontrak.`);
    if(!Number.isFinite(e.gain)||e.gain<0||!Number.isFinite(e.pitch)||e.pitch<=0)throw Error('gain/pitch SFX tidak valid');
    const len={tick:.07,sweep:.38,tone:.55,bass:.45,spring:.23,rise:.8}[kind],start=Math.round(e.time*rate),n=Math.ceil(len*rate);
    let seed=123456+start,phase=0;
    for(let i=0;i<n && start+i<samples.length;i++){
      seed=(Math.imul(seed,1664525)+1013904223)>>>0;const noise=seed/2147483648-1,t=i/rate,u=t/len;
      let value=0;
      if(kind==='tick')value=noise*Math.exp(-t*90)*.7+Math.sin(t*TAU*1800*e.pitch)*Math.exp(-t*100)*.3;
      if(kind==='sweep')value=noise*Math.sin(Math.PI*u)**2*.45;
      if(kind==='tone')value=(Math.sin(TAU*880*e.pitch*t)+.3*Math.sin(TAU*1320*e.pitch*t))*Math.exp(-t*7)*Math.min(1,t/.007)*.45;
      if(kind==='bass')value=(Math.sin(TAU*65*e.pitch*t)+noise*.12)*Math.exp(-t*10)*Math.min(1,t/.003)*.7;
      if(kind==='spring'){phase+=TAU*(240+700*Math.exp(-t*25))*e.pitch/rate;value=Math.sin(phase)*Math.exp(-t*17)*Math.min(1,t/.003)*.6;}
      if(kind==='rise'){phase+=TAU*(150+1100*u*u)*e.pitch/rate;value=(Math.sin(phase)*.4+noise*.2)*Math.sin(Math.PI*u)**2;}
      samples[start+i]+=value*e.gain*.22;
    }
  }
  const data=Buffer.alloc(44+samples.length*4);data.write('RIFF',0);data.writeUInt32LE(data.length-8,4);data.write('WAVEfmt ',8);data.writeUInt32LE(16,16);data.writeUInt16LE(1,20);data.writeUInt16LE(2,22);data.writeUInt32LE(rate,24);data.writeUInt32LE(rate*4,28);data.writeUInt16LE(4,32);data.writeUInt16LE(16,34);data.write('data',36);data.writeUInt32LE(samples.length*4,40);
  for(let i=0;i<samples.length;i++){const v=Math.round(Math.max(-.95,Math.min(.95,samples[i]))*32767);data.writeInt16LE(v,44+i*4);data.writeInt16LE(v,46+i*4);}fs.writeFileSync(file,data);
}
const TAU=Math.PI*2;
module.exports={writeSfx};

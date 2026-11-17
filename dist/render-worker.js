importScripts('geometry.js','engine.js','media-runtime.js');
let canvas,ctx,run,config;
self.onmessage=async e=>{
  const m=e.data;
  try{
    if(m.type==='init'){
      config=m;config.images={};for(const a of m.assets||[]){config.images[a.id]=await createImageBitmap(a.blob);}canvas=new OffscreenCanvas(m.width,m.height);ctx=canvas.getContext('2d');
      run=new Function('s','ctx','window','document','fetch','XMLHttpRequest','WebSocket','"use strict";\n'+m.world+'\n'+m.scene.code+'\n//# sourceURL=scene-'+m.scene.id+'.js');
      self.postMessage({ready:true});return;
    }
    if(m.type!=='frame')return;
    const {scene}=config,t=m.t,sounds=[];
    ctx.reset();
    const wide=config.aspect==='16:9',w=wide?1280:720,h=wide?720:1280;
    ctx.save();ctx.scale(canvas.width/w,canvas.height/h);
    const colors=scene.theme==='night'?['#172735','#243b4e']:scene.theme==='dusk'?['#d4dce7','#9fb3c7']:['#eef2f7','#dce5ed'];
    const custom=config.background?.[scene.theme];
    if(custom&&/^#[0-9a-f]{6}$/i.test(custom.top)&&/^#[0-9a-f]{6}$/i.test(custom.bottom)){colors[0]=custom.top;colors[1]=custom.bottom;}
    const g=ctx.createLinearGradient(0,0,0,h);g.addColorStop(0,colors[0]);g.addColorStop(1,colors[1]);ctx.fillStyle=g;ctx.fillRect(0,0,w,h);
    const s=makeRuntime(ctx,t,scene.duration,scene.theme,event=>{
      if(!Number.isFinite(event.time)||event.time<0||event.time>=scene.duration||!Number.isFinite(event.gain)||!Number.isFinite(event.pitch))throw Error('Waktu/gain/pitch SFX tidak valid: '+event.name);
      sounds.push(event);
    },'Arial');
    attachMedia(s,ctx,config.images);
    s.w=w;s.h=h;ctx.save();try{run(s,ctx,undefined,undefined,undefined,undefined,undefined);}finally{ctx.restore();}
    ctx.resetTransform();ctx.globalAlpha=1;ctx.scale(canvas.width/w,canvas.height/h);
    if(config.subtitle&&scene.text){
      const list=scene.cues?.length?scene.cues:scene.text.split(/\s+/).map((word,i,a)=>({word,start:i*scene.duration/a.length,end:(i+1)*scene.duration/a.length}));
      let active=list.findIndex(c=>t>=c.start&&t<c.end);if(active<0)active=list.findLastIndex(c=>t>=c.start);
      const start=Math.max(0,Math.floor(active/6)*6),chunk=list.slice(start,start+6);
      ctx.font='600 30px Arial';const max=wide?900:560,lines=[[]];let len=0;
      for(let i=0;i<chunk.length;i++){const c=chunk[i],size=ctx.measureText(c.word+' ').width;if(len+size>max){lines.push([]);len=0;}lines.at(-1).push({...c,index:start+i,size});len+=size;}
      const y=wide?610:842;ctx.fillStyle='#152635e8';ctx.beginPath();ctx.roundRect((w-max-32)/2,y-30,max+32,lines.length*42+20,12);ctx.fill();ctx.textBaseline='middle';
      for(let j=0;j<lines.length;j++){const line=lines[j];let x=(w-line.reduce((v,c)=>v+c.size,0))/2;for(const c of line){ctx.fillStyle=c.index===active?'#a9f5df':'#ffffff';ctx.fillText(c.word,x,y+j*42);x+=c.size;}}
    }
    ctx.restore();const bitmap=canvas.transferToImageBitmap();self.postMessage({bitmap,sounds},[bitmap]);
  }catch(error){
    const match=String(error.stack).match(/scene-\d+\.js:(\d+):(\d+)/),line=match?Number(match[1])-3:null,worldLines=(config?.world||'').split('\n').length;
    const where=line!==null?(line<=worldLines?`DUNIA, baris ${line}`:`Scene ${config.scene.id}, baris ${line-worldLines}`):`Scene ${config?.scene?.id??''}`;
    self.postMessage({error:`${where}: ${error.message}`});
  }
};

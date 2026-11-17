'use strict';
const TAU = 2 * Math.PI;
const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const lerp = (a, b, k) => a + (b - a) * k;
const ease = {
  in: x => clamp(x) ** 3,
  out: x => 1 - (1 - clamp(x)) ** 3,
  inOut: x => (x = clamp(x)) < .5 ? 4*x*x*x : 1 - (-2*x+2)**3/2,
  back: x => 1 + 2.70158 * (clamp(x)-1)**3 + 1.70158 * (clamp(x)-1)**2,
  elastic: x => x <= 0 ? 0 : x >= 1 ? 1 : 2**(-10*x)*Math.sin((10*x-.75)*TAU/3)+1,
  outExpo: x => x >= 1 ? 1 : 1 - 2**(-10*clamp(x)),
  inOutExpo: x => x <= 0 ? 0 : x >= 1 ? 1 : x < .5 ? 2**(20*x-10)/2 : (2-2**(-20*x+10))/2
};
function springResponse(time, preset = 'snappy') {
  if (time <= 0) return 0;
  const presets = {smooth:{damping:28,stiffness:196,mass:1},snappy:{damping:20,stiffness:230,mass:1},bouncy:{damping:11,stiffness:220,mass:1},heavy:{damping:30,stiffness:135,mass:1.6}};
  const {damping:c,stiffness:k,mass:m} = typeof preset === 'string' ? presets[preset] || presets.snappy : {...presets.snappy,...preset};
  if (!(c > 0 && k > 0 && m > 0)) throw Error('spring: damping, stiffness, mass harus positif');
  const w = Math.sqrt(k/m), z = c/(2*Math.sqrt(k*m));
  if (Math.abs(z-1) < 1e-6) return 1-(1+w*time)*Math.exp(-w*time);
  if (z < 1) { const d = w*Math.sqrt(1-z*z); return 1-Math.exp(-z*w*time)*(Math.cos(d*time)+z*w/d*Math.sin(d*time)); }
  const d = Math.sqrt(z*z-1), r1 = -w*(z-d), r2 = -w*(z+d);
  return 1 - (r2*Math.exp(r1*time)-r1*Math.exp(r2*time))/(r2-r1);
}
function makeRuntime(ctx, t, dur, theme = 'paper', emit = () => {}, font = 'DejaVu Sans') {
  const c = {ink:theme==='night'?'#eff5fa':'#24364b',paper:'#f4f7fa',red:'#e03131',pink:'#f06595',orange:'#ff7a45',yellow:'#ffd43b',green:'#12b886',teal:'#31bdac',blue:'#3b5bdb',navy:'#1c2433',purple:'#7950f2',brown:'#99633c',sky:'#4dabf7',white:'#ffffff',gray:'#899aaa',glow:'#d6f8ff'};
  const s = {t,dur,p:clamp(t/dur),theme,c,lerp,clamp,ease,
    rand:i => {let n = (Math.trunc(i) ^ 0x9e3779b9) >>> 0; n = Math.imul(n ^ n >>> 16, 0x21f0aaad);n = Math.imul(n ^ n >>> 15, 0x735a2d97);return ((n ^ n >>> 15) >>> 0)/4294967296;},
    spring:(start=0,preset='snappy')=>springResponse(t-start,preset),
    stagger:(i,start=0,gap=.06,preset='snappy')=>springResponse(t-start-i*gap,preset),
    wave:(freq=1,amp=1,phase=0)=>Math.sin(t*TAU*freq+phase)*amp,
    at:(start,len=.6)=>ease.out((t-start)/Math.max(.0001,len)),
    pop:(start,len=.5)=>ease.back((t-start)/Math.max(.0001,len)),
    keys:(keys,curve='inOut')=>{
      if(!keys.length) throw Error('keys tidak boleh kosong');
      if(t<=keys[0][0])return keys[0][1];
      for(let i=1;i<keys.length;i++)if(t<keys[i][0]) {
        const u=clamp((t-keys[i-1][0])/(keys[i][0]-keys[i-1][0]));
        return lerp(keys[i-1][1],keys[i][1],typeof curve==='function'?curve(u):(ease[curve]||((v)=>v))(u));
      }
      return keys.at(-1)[1];
    },
    sfx:(name,time,gain=1,pitch=1)=>emit({name,time,gain,pitch})
  };
  const style = (o,draw) => {
    if ((o.alpha??1)<=0 || (o.draw??1)<=0) return;
    ctx.save();
    try {ctx.globalAlpha *= clamp(o.alpha??1)*clamp(o.draw??1);ctx.lineJoin='round';ctx.lineCap='round';ctx.lineWidth=o.width??3;draw();}
    finally{ctx.restore();}
  };
  const paint = (o,filled=true) => {
    if(filled && o.fill && o.fill!=='none'){ctx.fillStyle=o.fill;ctx.fill();}
    const stroke=o.stroke??(filled?'none':c.ink);
    if(stroke!=='none'){ctx.strokeStyle=stroke;ctx.stroke();}
  };
  const round = (x,y,w,h,r=0)=>ctx.roundRect(x,y,w,h,Math.max(0,Math.min(r,Math.abs(w)/2,Math.abs(h)/2)));
  s.group=(o={},fn)=>{ctx.save();try{ctx.translate(o.x??0,o.y??0);ctx.rotate(o.rotate??0);const k=o.scale??1;ctx.scale(k,k);ctx.globalAlpha*=clamp(o.alpha??1);fn();}finally{ctx.restore();}};
  s.rect=(x,y,w,h,o={})=>style(o,()=>{ctx.beginPath();round(x,y,w,h,o.r??0);paint(o);});
  s.circle=(x,y,r,o={})=>s.ellipse(x,y,r,r,o);
  s.ellipse=(x,y,rx,ry,o={})=>style(o,()=>{ctx.beginPath();ctx.ellipse(x,y,Math.max(0,rx),Math.max(0,ry),0,0,TAU);paint(o);});
  s.arc=(x,y,r,a,b,o={})=>style(o,()=>{ctx.beginPath();ctx.arc(x,y,Math.max(0,r),a,lerp(a,b,clamp(o.draw??1)));paint(o,false);});
  function linePath(points,o={},closed=false){style(o,()=>{
    if(!points.length)return;ctx.beginPath();ctx.moveTo(...points[0]);let tip=points[0];
    if(!closed && o.draw!==undefined && o.draw<1){
      const lens=points.slice(1).map((p,i)=>Math.hypot(p[0]-points[i][0],p[1]-points[i][1]));let remain=lens.reduce((a,b)=>a+b,0)*clamp(o.draw);
      for(let i=1;i<points.length;i++){const u=Math.min(1,remain/(lens[i-1]||1));tip=[lerp(points[i-1][0],points[i][0],u),lerp(points[i-1][1],points[i][1],u)];ctx.lineTo(...tip);remain-=lens[i-1];if(remain<=0)break;}
    }else points.slice(1).forEach(p=>ctx.lineTo(...p));
    if(closed)ctx.closePath();paint(o,closed);if(o.pen&&o.draw>0&&o.draw<1){ctx.shadowBlur=10;ctx.shadowColor=typeof o.pen==='string'?o.pen:c.glow;ctx.fillStyle=ctx.shadowColor;ctx.beginPath();ctx.arc(...tip,Math.max(2,(o.width??3)*1.4),0,TAU);ctx.fill();}
  });}
  s.line=(x1,y1,x2,y2,o={})=>linePath([[x1,y1],[x2,y2]],o);
  s.polyline=(p,o={})=>linePath(p,o);
  s.shape=(p,o={})=>linePath(p,o,true);
  s.dash=(x1,y1,x2,y2,o={})=>{ctx.save();try{ctx.setLineDash([7,6]);s.line(x1,y1,x2,y2,o);}finally{ctx.restore();}};
  s.curve=(p,o={})=>style(o,()=>{
    if(p.length<2)return;ctx.beginPath();ctx.moveTo(...p[0]);
    for(let i=0;i<p.length-(o.closed?0:1);i++){
      const a=p[o.closed?(i-1+p.length)%p.length:Math.max(0,i-1)],b=p[i],d=p[(i+1)%p.length],e=p[o.closed?(i+2)%p.length:Math.min(p.length-1,i+2)];
      ctx.bezierCurveTo(b[0]+(d[0]-a[0])/6,b[1]+(d[1]-a[1])/6,d[0]-(e[0]-b[0])/6,d[1]-(e[1]-b[1])/6,...d);
    }if(o.closed)ctx.closePath();paint(o,!!o.closed);
  });
  s.text=(str,x,y,o={})=>style(o,()=>{ctx.font=`${o.weight??600} ${o.size??24}px "${font}"`;ctx.textAlign=o.align??'center';ctx.textBaseline='middle';ctx.fillStyle=o.color??c.ink;ctx.fillText(String(str),x,y);});
  s.text3d=(str,x,y,o={})=>{
    s.group({x,y,rotate:o.rotate??0,scale:o.draw??1,alpha:o.alpha??1},()=>{
      const size=o.size??72,align=o.align??'center';ctx.font=`800 ${size}px "${font}"`;ctx.textAlign=align;ctx.textBaseline='middle';
      const w=ctx.measureText(String(str)).width,left=align==='left'?0:align==='right'?-w:-w/2;
      if(o.frame){const f=o.frameColor??'#ffffff';if(o.frame==='circle')s.circle(left+w/2,0,Math.max(w,size)*.66,{fill:f});else if(o.frame==='burst')s.shape(Array.from({length:24},(_,i)=>{const a=i*TAU/24,r=i%2?.85:1;return[left+w/2+Math.cos(a)*(w/2+26)*r,Math.sin(a)*(size*.85)*r];}),{fill:f});else {if(o.frame==='ribbon')s.shape([[left-28,-size*.4],[left+w+28,-size*.4],[left+w+17,0],[left+w+28,size*.5],[left-28,size*.5],[left-17,0]],{fill:f});s.rect(left-14,-size*.68,w+28,size*1.36,{r:o.frame==='pill'?size:10,fill:f});if(o.frame==='bubble')s.shape([[left+12,size*.6],[left+12,size],[left+40,size*.6]],{fill:f});}}
      const depth=o.depth??5;ctx.fillStyle=o.side??'#a0b0c3';for(let d=Math.ceil(depth);d>=1;d--)ctx.fillText(String(str),d*.55,d);
      ctx.fillStyle=o.color??c.ink;ctx.fillText(String(str),0,0);
    });
  };
  s.card=(x,y,w,h,o={})=>style(o,()=>{ctx.beginPath();round(x,y,w,h,o.r??28);if(o.shadow!==false){ctx.shadowColor='#182e4820';ctx.shadowBlur=18;ctx.shadowOffsetY=7;}let fill=o.fill??'#ffffff';if(Array.isArray(fill)){const g=ctx.createLinearGradient(0,y,0,y+h);fill.forEach((v,i)=>g.addColorStop(i/Math.max(1,fill.length-1),v));fill=g;}paint({...o,fill});});
  s.shadow=(x,y,rx)=>{ctx.save();ctx.filter='blur(7px)';s.ellipse(x,y,rx,rx*.14,{fill:'#203040',alpha:.14});ctx.restore();};
  s.ground=(y=760,x1=60,x2=660,o={})=>s.line(x1,y,x2,y,{stroke:'#abb9c8',width:1,...o});
  s.check=(x,y,k,o={})=>s.polyline([[x-k*.45,y],[x-k*.1,y+k*.32],[x+k*.48,y-k*.4]],o);
  s.cross=(x,y,k,o={})=>{s.line(x-k/2,y-k/2,x+k/2,y+k/2,o);s.line(x-k/2,y+k/2,x+k/2,y-k/2,o);};
  s.sparkle=(x,y,k,o={})=>s.shape([[x,y-k],[x+k*.2,y-k*.2],[x+k,y],[x+k*.2,y+k*.2],[x,y+k],[x-k*.2,y+k*.2],[x-k,y],[x-k*.2,y-k*.2]],{fill:o.stroke??c.sky,...o});
  s.rays=(x,y,r1,r2,n,o={})=>{for(let i=0;i<n;i++){const a=i*TAU/n;s.line(x+Math.cos(a)*r1,y+Math.sin(a)*r1,x+Math.cos(a)*r2,y+Math.sin(a)*r2,o);}};
  s.burst=(x,y,r,o={})=>{const k=clamp(o.draw??0);if(k>0&&k<1)s.rays(x,y,r*k,r*(k+.2),o.count??12,{stroke:o.stroke??c.sky,width:2,alpha:Math.sin(k*Math.PI)});};
  s.tag=(str,x,y,o={})=>{ctx.save();ctx.font=`700 ${o.size??16}px "${font}"`;const w=ctx.measureText(str).width+22;ctx.restore();s.rect(x-w/2,y-17,w,34,{r:8,fill:o.fill??c.navy,alpha:o.alpha});s.text(str,x,y,{size:o.size??16,color:o.color??c.white,alpha:o.alpha});};
  s.words=(str,x,y,o={})=>{
    const size=o.size??44,max=o.width??540;ctx.save();ctx.font=`800 ${size}px "${font}"`;
    const space=ctx.measureText(' ').width,lines=[[]];let used=0;
    String(str).split(/\s+/).forEach((w,i)=>{const width=ctx.measureText(w).width;if(used&&used+space+width>max){lines.push([]);used=0;}lines.at(-1).push({w,i,width});used+=(used?space:0)+width;});ctx.restore();
    lines.forEach((line,j)=>{const width=line.reduce((v,w)=>v+w.width,0)+space*(line.length-1);let xx=o.align==='left'?x:x-width/2;for(const word of line){const k=clamp(s.stagger(word.i,o.start??0,o.gap??.07,o.spring??'smooth'));const accent=Array.isArray(o.accent)?o.accent.includes(word.w):o.accent===word.w;s.group({x:xx+(o.mode==='slide'?(1-k)*35:0),y:y+(j-(lines.length-1)/2)*(o.lineHeight??size*1.25)+(o.mode==='rise'||!o.mode?(1-k)*24:0),alpha:k*(o.alpha??1),scale:o.mode==='pop'?lerp(.85,1,k):1},()=>s.text(word.w,0,0,{align:'left',size,weight:800,color:accent?(o.accentColor??c.blue):(o.color??c.ink)}));xx+=word.width+space;}});
  };
  extend3D(s,ctx);
  return new Proxy(s,{get:(target,key)=>{if(key in target || typeof key==='symbol')return target[key];throw Error(`API s.${key} belum didukung renderer ini. Gunakan ctx atau tambahkan implementasi sebelum render.`);}});
}
if(typeof module!=='undefined')module.exports={makeRuntime,springResponse,ease,clamp,lerp};

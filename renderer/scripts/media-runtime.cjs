function attachMedia(s,ctx,images){
 s.photo=(id,x,y,w,h,o={})=>{const im=images[id];if(!im)throw Error('Aset gambar tidak ditemukan: '+id);if(!(w>0&&h>0))return;ctx.save();try{ctx.globalAlpha*=Math.max(0,Math.min(1,o.alpha??1));ctx.beginPath();ctx.roundRect(x,y,w,h,Math.max(0,Math.min(o.r??0,w/2,h/2)));ctx.clip();const k=o.fit==='contain'?Math.min(w/im.width,h/im.height):Math.max(w/im.width,h/im.height);ctx.drawImage(im,x+(w-im.width*k)/2,y+(h-im.height*k)/2,im.width*k,im.height*k);}finally{ctx.restore();}};
}
if(typeof module!=='undefined')module.exports={attachMedia};

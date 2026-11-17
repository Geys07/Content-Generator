import {styles} from './styles.js';
export function styleArt(ctx,s,id){
 const palettes={mechanism:['#e6edf3','#20394e','#365bd7'],collage:['#f3e9d6','#3c382d','#bc5539'],journalism:['#181c21','#f3f1e8','#efc652'],catalog:['#fafaf5','#222827','#ae352e'],vintage:['#e9d8b8','#463625','#92422d'],continuous:['#dce7d9','#213c39','#b44b32'],kinetic:['#26382f','#fbefd7','#f28c50']};
 const [bg,ink,accent]=palettes[id]||palettes.mechanism,t=s.t,k=Math.min(1,t/.8),TAU=Math.PI*2;
 ctx.save();ctx.scale((s.w||720)/720,(s.h||1280)/1280);ctx.fillStyle=bg;ctx.fillRect(0,0,720,1280);
 const rect=(x,y,w,h,c,r=0)=>{ctx.fillStyle=c;ctx.beginPath();ctx.roundRect(x,y,w,h,r);ctx.fill();};
 const line=(pts,c=ink,w=3)=>{ctx.strokeStyle=c;ctx.lineWidth=w;ctx.lineCap='round';ctx.beginPath();pts.forEach((p,i)=>ctx[i?'lineTo':'moveTo'](...p));ctx.stroke();};
 const circle=(x,y,r,c)=>{ctx.fillStyle=c;ctx.beginPath();ctx.arc(x,y,r,0,TAU);ctx.fill();};
 const text=(v,x,y,z=30,c=ink,align='left',font='Arial')=>{ctx.fillStyle=c;ctx.font=`700 ${z}px ${font}`;ctx.textAlign=align;ctx.fillText(v,x,y);};
 const curve=(pts,c)=>{ctx.fillStyle=c;ctx.beginPath();ctx.moveTo(...pts[0]);for(let i=1;i<pts.length;i+=3)ctx.bezierCurveTo(...pts[i],...pts[i+1],...pts[i+2]);ctx.closePath();ctx.fill();};
 const gear=(x,y,r,a,c)=>{ctx.save();ctx.translate(x,y);ctx.rotate(a);for(let j=0;j<16;j++){ctx.save();ctx.rotate(j*TAU/16);rect(r*.72,-r*.12,r*.3,r*.24,c,3);ctx.restore();}circle(0,0,r*.79,c);circle(0,0,r*.44,bg);circle(0,0,r*.1,c);ctx.restore();};
 text('RUANG ADEGAN / CONTOH GAYA',60,92,19);line([[60,120],[660,120]],ink,1);
 if(id==='mechanism'){
 text('Udara bergerak.',60,212,48);text('Katup mengatur jalurnya.',60,269,32,accent);
 ctx.save();ctx.translate(360,570);ctx.rotate(-.12);rect(-265,-80,530,160,'#a9bbc8',70);rect(-245,-60,490,120,'#344f64',55);for(let i=0;i<12;i++){const x=-230+((i*47+t*80)%460);line([[x,-18],[x+35,-18]],'#81dccb',5);}
 const a=.25+.9*(.5+.5*Math.sin(t*.8));ctx.save();ctx.rotate(a);rect(-7,-68,14,136,'#d0dce4',6);ctx.restore();circle(0,0,12,accent);ctx.restore();
 line([[365,595],[430,750],[598,750]],ink,2);text('KATUP',470,790,24);text('Bukaan berubah,',60,940,34);text('aliran ikut berubah.',60,987,34);
 }else if(id==='collage'){
 for(let i=0;i<120;i++)circle((i*97)%720,(i*61)%1280,.9,'#d8c9ae');text('Air terus',60,215,62);text('berputar.',60,282,62,accent);
 circle(532,393,60,'#e4ad42');for(let i=0;i<8;i++){const a=i*TAU/8+t*.08;line([[532+Math.cos(a)*76,393+Math.sin(a)*76],[532+Math.cos(a)*95,393+Math.sin(a)*95]],'#c68b2f',4);}
 rect(90,720,540,100,'#548e94',32);for(let i=0;i<7;i++){const y=700-((t*44+i*62)%280);line([[190+i*12,y],[200+i*12,y-24]],'#548e94',4);}
 [0,1,2].forEach(i=>circle(270+i*70,510+Math.sin(t+i)*4,66,'#d4d8ce'));rect(207,500,270,72,'#d4d8ce',24);for(let i=0;i<7;i++){const y=575+((t*95+i*35)%155);line([[432+i*17,y],[424+i*17,y+19]],'#578b9b',4);}
 text('Menguap',100,890,34,ink,'left','Georgia');text('lalu kembali sebagai hujan.',100,940,28,accent,'left','Georgia');
 }else if(id==='journalism'){
 text('Satu peristiwa.',60,217,48);text('Banyak jejak.',60,275,48,accent);
 const shift=Math.min(t*.04,1)*18;rect(80+shift,373,485,348,'#e6e1d4',4);text('CATATAN / ILUSTRASI',110+shift,422,22,'#26342d');for(let i=0;i<7;i++)rect(110+shift,460+i*29,260+(i%3)*48,7,'#9a9e91',2);rect(108+shift,510,330*k,23,'#efc652');text('BUKTI',170,675,62,'#a14a36');
 const nodes=[[105,865],[242,821],[363,897],[485,810],[612,870]];line(nodes,'#748b92',3);nodes.forEach((p,i)=>{circle(...p,9,accent);text(String(i+1),p[0],p[1]+44,21,ink,'center');});
 text('TELUSURI SUMBERNYA',60,1035,26,accent);text('Dokumen contoh, bukan arsip asli.',60,1080,21,ink);
 }else if(id==='catalog'){
 text('Detail kecil.',60,215,54);text('Fungsi besar.',60,279,54,accent);
 ctx.save();ctx.translate(353,590);ctx.rotate(Math.sin(t*.4)*.025);ctx.shadowColor='#1c363428';ctx.shadowBlur=35;ctx.shadowOffsetY=30;curve([[-143,110],[-165,13],[-117,-148],[0,-167],[122,-148],[163,11],[143,110],[70,139],[-79,139],[-143,110]],'#ced6d4');ctx.shadowBlur=0;ctx.shadowOffsetY=0;rect(-78,-178,156,25,'#556c69',12);line([[121,-64],[222,-91],[183,41],[143,64]],'#899e9a',26);line([[-141,-64],[-228,-79],[-222,63],[-143,66]],'#364d48',23);rect(-136,108,273,23,'#465f58',10);ctx.restore();
 line([[400,470],[560,398],[630,398]],accent,2);text('TUTUP',558,370,22);text('Siluet dan bagian khas',60,969,31);text('tetap mudah dikenali.',60,1014,31);
 }else if(id==='vintage'){
 for(let i=0;i<230;i++)line([[(i*97)%720,(i*53)%1280],[(i*97)%720+3,(i*53)%1280+1]],'#c5ae85',.7);text('Dari putaran,',60,224,48,ink,'left','Georgia');text('lahir gerakan.',60,284,48,accent,'left','Georgia');
 gear(282,583,135,t*.3,ink);gear(477,672,92,-t*.45,accent);for(let i=0;i<16;i++)line([[132+i*17,780],[182+i*17,730]],'#a98c61',1);
 line([[281,447],[360,375],[600,375]],ink,2);text('RODA PENGGERAK',391,352,21,ink,'left','Georgia');line([[476,760],[460,854],[170,854]],accent,2);text('GERAK DITERUSKAN',92,901,24,accent,'left','Georgia');text('Ilustrasi mekanisme',60,1060,27,ink,'left','Georgia');
 }else if(id==='continuous'){
 text('Perjalanan terus',60,210,50);text('bergerak.',60,270,50,accent);
 for(let i=0;i<10;i++){const x=((i*147-t*34)%1300+1300)%1300-200;line([[x,680],[x+64,530],[x+128,680]],'#abc7b7',40);}rect(0,751,720,529,'#c1d2b8');
 for(let i=0;i<15;i++){const x=((i*80-t*210)%1200+1200)%1200-100;line([[x,842],[x-50,875]],'#658073',6);}line([[0,835],[720,835]],ink,5);line([[0,878],[720,878]],ink,5);
 const y=686+Math.sin(t*3)*3;rect(90,y,535,132,'#f2e8cd',35);rect(100,y+82,520,26,accent,9);for(let i=0;i<7;i++)rect(126+i*65,y+23,46,47,'#3d6260',10);circle(170,y+132,20,ink);circle(538,y+132,20,ink);text('SATU SUBJEK / DUNIA BERUBAH',60,1040,25);
 }else{
 const q=Math.min(1,Math.max(0,t/.65)),v=1-Math.pow(1-q,3);rect(46,290,628*v,210,accent,3);text('KATA',70+(1-v)*160,450,142,bg);const next=Math.min(1,Math.max(0,(t-.5)/.8));text('PUNYA',645-next*560,650,110,ink);text('IRAMA.',70,835,110,ink);line([[70,920],[70+580*Math.min(1,t/2),920]],accent,9);text('Ukuran. Jeda. Penekanan.',70,1030,28);
 }
 text('CONTOH VISUAL • TANPA VO',60,1190,19,ink);ctx.restore();
}
export function demoProject(id){const v=styles.find(x=>x.id===id)||styles[0],text='Contoh visual '+v.name+'.';return {version:1,id:crypto.randomUUID(),title:'Contoh · '+v.name,narration:text,style:v.name,styleId:v.id,aspect:'9:16',world:styleArt.toString(),scenes:[{id:1,text,visual:v.description,duration:4,theme:'paper',camera:'Sesuai contoh',code:`styleArt(ctx,s,${JSON.stringify(v.id)});`,cues:[],timing:'perkiraan'}],assets:[],audio:null,music:null,volume:.12,subtitle:false,sfx:false,updated:Date.now()};}

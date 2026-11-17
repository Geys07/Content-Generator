import {referenceTemplate} from './storyboard-template.js';
import {technique} from './technique.js';
import {styleBrief,ruleFor,styleOf} from './styles.js';
const brief=styleBrief;
function legacyStoryboardPrompt(p){if(!p.narration?.trim())throw Error('Masukkan narasi terlebih dahulu.');return `Buat STORYBOARD dari NASKAH FINAL di bawah. Pertahankan semua kata, huruf besar/kecil, dan tanda baca persis. Boleh membagi pada jeda yang wajar. Jangan menulis ulang, menambah CTA, mengubah hook, atau memaksa jumlah scene. Jika akhir naskah belum menyambung pembuka, laporkan pada notes tanpa mengubah teks.
${brief(p)}
${ruleFor(p,"story")}
Untuk setiap scene uraikan objek konkret, aksi yang sesuai gaya, bagian penyebab dan akibatnya, fokus kamera, keadaan awal dan akhir. Urutkan informasi dan aksi menurut naskah. Susun dulu kebutuhan SEMUA komponen, agar dunia lengkap sejak awal. Scene adalah bagian timeline. Pergantian shot dan transisi mengikuti gaya terpilih; beberapa kalimat dapat memakai dunia yang sama. Durasi hanya perkiraan sampai VO diunggah. Tidak ada hentakan kamera otomatis atau pergantian tema otomatis.
Metadata SEO mengikuti isi video, tanpa klaim palsu. Sertakan title, description, short, tags, hashtags. Metadata tidak menjadi teks VO.
Jawab HANYA satu blok JSON valid tanpa komentar. Struktur:
{"title":"judul proyek","notes":[],"seo":{"title":"judul YouTube","description":"deskripsi","short":"caption","tags":[],"hashtags":[]},"background":{"paper":{"top":"#eef2f7","bottom":"#e3e9f1","pattern":"none"}},"scenes":[{"text":"kutipan persis naskah","visual":"bentuk, komponen, aksi dan komposisi","duration":3.5,"theme":"paper","emphasis":"satu kata persis dalam teks","camera":"CAM_A -> CAM_B","startState":"keadaan awal","endState":"keadaan akhir"}]}
NASKAH FINAL:
${p.narration}
Aturan Ide: ${ruleFor(p,"idea")}
=== AKHIR PERINTAH ===`;}
export const api=`Canvas logical 720x1280 (9:16), 1280x720 (16:9). Ilustrasi vertikal y0–800; subtitle y842. Margin teks x90–630. Engine menggambar latar dan subtitle; jangan gambar ulang. ctx adalah CanvasRenderingContext2D (OffscreenCanvas).
Fungsi scene dipanggil per frame dengan s,ctx; tulis body saja. Tidak ada state lintas frame. Jangan DOM/window/fetch/Math.random atau loop tak terbatas. Semua posisi dari s.t; s.dur detik; s.p 0..1; s.theme paper/night/dusk.
Waktu: s.spring(start=0,preset='snappy') spring fisika; smooth/snappy/bouncy/heavy atau {damping,stiffness,mass}. s.stagger(i,start=0,gap=.06,preset); s.keys([[detik,nilai],...],easing='inOut'); s.at(start,len=.6); s.pop(start,len=.5); s.wave(freq=1,amp=1,phase=0); s.rand(i) deterministik; s.lerp(a,b,k); s.clamp(x,a=0,b=1); s.ease.in/out/inOut/back/elastic/outExpo/inOutExpo.
Gunakan spring smooth/heavy atau easing terukur untuk masuk/perpindahan. s.at hanya detail kecil. Jaga kesinambungan keadaan dan komposisi; pergantian shot boleh bila sesuai gaya.
2D opsi {fill,stroke,width,alpha,draw,r}; r untuk rect. Bentuk rapi; tekstur dan arsiran mengikuti gaya aktif. s.line(x1,y1,x2,y2,o), polyline(points,o), shape(points,o), curve(points,{closed,...o}), rect(x,y,w,h,o), circle(x,y,r,o), ellipse(x,y,rx,ry,o), arc(x,y,r,a0,a1,o), dash(x1,y1,x2,y2,o), check(x,y,size,o), cross(x,y,size,o), sparkle(x,y,size,o), rays(x,y,r1,r2,count,o), burst(x,y,r,{draw,count,stroke}), ground(y=760,x1=60,x2=660,o), shadow(x,y,rx).
s.group({x,y,rotate,scale,alpha},()=>{}). Sudut radian. s.card(x,y,w,h,{fill:warna atau [atas,bawah],r=28,stroke,width,alpha,shadow=true}).
s.text(str,x,y,{size,color,align,alpha,weight}); s.text3d(str,x,y,{size,color,side,depth,rotate,alpha,draw,align,frame,frameColor}), frame pill/box/ribbon/burst/bubble/circle. s.tag(str,x,y,{size,fill,color,alpha}). s.words(str,x,y,{size,color,accent,accentColor,mode:'rise'/'pop'/'slide'/'fade',start,gap,spring,width,align,lineHeight,alpha}).
3D opsi {rx,ry,rz,scale,fill,stroke,alpha,draw,edges:'strong'/'soft'/'none',round,ortho}. s.box(x,y,w,h,d,o), cube(x,y,size,o), cylinder(x,y,r,h,o), cone(x,y,r,h,o), sphere(x,y,r,o), extrude(x,y,points,depth,o). Shapes s.shapes.star(n=5,r1=100,r2=45),heart(size=100),arrow(length=200,width=60),bolt(size=120),roundRect(w,h,r),polygon(n,r). s.iso(i,j,z),isoBox(i,j,base,w,h,d,o),isoCylinder(i,j,base,r,h,o).
Palet s.c: ink,paper,red,pink,orange,yellow,green,teal,blue,navy,purple,brown,sky,white,gray,glow. Hex boleh. Teks harus kontras dengan tema.
Suara s.sfx(name,time,gain=1,pitch=1) WAJIB level atas tanpa if, 1–4/scene. Nama: pop,tick,click,tap,thud,boing,swish,whoosh,boom,rise,ding,sparkle,coin,cash,type,shutter,heart,tock,rocket,notify,drop,paper,chalk,beep,blip,laser,step,pageflip,bubble,snap,clap,impact,kick,riser,swipe,whip,glitch,stamp,slide,scratch,buzzer,correct,tada,magic. Efek disintesis; jangan menjadwalkan berulang per frame.
Untuk mekanisme kompleks gunakan helper proyeksi 3D di DUNIA. DUNIA hanya sekali, jangan mengubah helper yang sudah ada. Objek besar dari komponen khas yang menempel. Karakter mengikuti pengaturan proyek. Jangan mengarang angka. Tidak perlu penjelasan di luar satu blok kode js.`;

export function animationPrompt(p,index,count=1){if(!Number.isInteger(count)||count<1)throw Error('Jumlah scene harus bilangan bulat positif.');const rows=p.scenes.slice(index,index+count);if(!rows.length)throw Error('Pilih scene dari storyboard.');const prev=p.scenes[index-1];return `Tulis kode animasi untuk SCENE YANG DIMINTA, sesuai naskah dan visual proyek ini.
${brief(p)}
${ruleFor(p,"story")}
${api}
ATURAN ANIMASI: ${ruleFor(p,"animation")}
ASET TERSEDIA: ${(p.assets||[]).map(a=>a.id+" = "+a.name+"; sumber: "+(a.credit||"unggahan pengguna")).join("; ")||"Belum ada gambar. Buat vektor melalui ctx/s; jangan mengarang ID aset."}
s.photo(id,x,y,w,h,{fit:"contain" atau "cover",alpha,r}) menggambar aset proyek yang sudah dimuat. Jangan fetch gambar dari kode scene.
PRIORITAS KONTRAK: engine mengurus latar dan subtitle. Kamera objek sepenuhnya diatur kode; tidak ada gerak kamera otomatis. Gunakan bentuk dan tekstur yang sesuai gaya aktif. Goresan tinta boleh pada sketsa vintage; efek harus mendukung isi. Gunakan kurva, foto atau bentuk khas yang sesuai isi, jangan semua benda menjadi box. Gerak mekanis boleh konstan; spring smooth/heavy untuk kamera dan bukaan. Semua waktu berasal dari s.t sehingga seek dan render per frame deterministik. Sudut radian. SFX hanya nama yang didukung API, bukan nama rekaman yang tidak tersedia.
${p.world||styleOf(p).id!=="mechanism"?"":"ACUAN TEKNIK 3D, bukan isi proyek. Contoh laptop hanya menunjukkan proyeksi, shading, engsel, kamera, dan overlay. Jangan memasukkan laptop bila narasi bukan laptop. Kontrak DUNIA sekali dan storyboard aktif tetap menang.\n"+technique}
SELURUH STORYBOARD (acuan bentuk dunia, jangan menulis scene di luar pilihan):
${p.scenes.map(r=>`${r.id}. NARASI: ${r.text}
VISUAL: ${r.visual}
KAMERA: ${r.camera||'rancang'}
AWAL: ${r.startState||'sambung sebelumnya'}
AKHIR: ${r.endState||'rancang untuk berikutnya'}`).join('\n')}
${p.world?'DUNIA SUDAH ADA. Gunakan persis, jangan tulis ulang atau mendefinisikan ulang helper di scene:\n```js\n'+p.world+'\n```':'Buat DUNIA SEKALI di antara // ===== DUNIA ===== dan // ===== AKHIR DUNIA =====. Isinya hanya definisi helper, model lengkap, warna, kamera bernama dan world/shoot. Jangan menggambar atau memanggil s.sfx di level atas DUNIA. Semua komponen untuk seluruh storyboard sudah didefinisikan; keadaan animasi dikontrol parameter waktu. Untuk mekanisme, gunakan parameter st.'}\n${prev?'SCENE SEBELUMNYA (jaga kesinambungan; shot baru boleh sesuai storyboard):\n'+prev.text+'\nKamera: '+prev.camera+'\nKeadaan akhir: '+(prev.endState||'ikuti kode')+'\nKode:\n'+(prev.code||'Belum ada; jangan berasumsi kode sudah tersedia.'):'SCENE PERTAMA: tetapkan model dan kamera awal yang bisa dicapai kembali pada akhir video.'}\n
SCENE YANG DIMINTA:
${rows.map(r=>`SCENE ${r.id}
Narasi: ${r.text}
Durasi: ${r.duration.toFixed(3)} detik
Visual: ${r.visual}
Kamera: ${r.camera||'tentukan berkesinambungan'}
Keadaan awal: ${r.startState||'sambung sebelumnya'}
Keadaan akhir: ${r.endState||'sambung berikutnya'}
Tema: ${r.theme}
Penekanan: ${r.emphasis||'tidak ditentukan'}
Timing kata (detik lokal): ${r.cues.length?r.cues.map(c=>c.word+' '+c.start.toFixed(3)).join(' · '):'BELUM ADA. Waktu perkiraan; jangan mengaku sinkron VO.'}`).join('\n\n')}
FORMAT: SATU blok js. ${p.world?'Jangan kirim blok DUNIA.':'DUNIA ditulis sebelum scene.'} Setiap scene diawali penanda persis:
${rows.map(r=>'// ===== SCENE '+r.id+' =====').join('\n')}
Baris pertama kode tiap scene berisi komentar // kamera: CAM_A -> CAM_B. Tulis body function saja tanpa pembungkus. Animasi harus mengisi durasi, aksi utama selesai sebelum durasi - 0.4 bila durasi memungkinkan. Jangan menambahkan penjelasan atau nomor scene lain.
=== AKHIR PERINTAH ===`;}
export function repairPrompt(p,index,error){const r=p.scenes[index];if(!r)throw Error('Pilih scene terlebih dahulu.');return `${animationPrompt(p,index,1)}
PERBAIKI SCENE ${r.id}. Jangan mengubah naskah, durasi, atau DUNIA.
Kesalahan:
${error||'Tinjau bentuk, gerak, dan kesinambungan visual.'}
Kode yang perlu diperbaiki:
\`\`\`js
${r.code}
\`\`\`
Kirim hanya // ===== SCENE ${r.id} ===== dan body yang sudah diperbaiki dalam SATU blok js.
=== AKHIR PERINTAH ===`;}
export function alignmentPrompt(p){return `Cocokkan NASKAH PERSIS dengan file VO yang saya lampirkan di pesan yang sama. Dengarkan audio; jangan memperkirakan waktu dari panjang kalimat. Jawab satu blok JSON {"words":[{"word":"kata persis","start":0.2,"end":0.5}]}. Waktu dalam detik dari awal VO, semua kata berurutan, tidak tumpang tindih. Setiap kata dipisahkan spasi mengikuti naskah. Durasi VO ${p.audio?.duration?.toFixed(3)||'ikuti file'} detik. Jangan membuat atau mengubah VO. Jika rekaman berbeda dari naskah, laporkan perbedaannya dan jangan mengarang timestamp.
Aturan Suara: ${ruleFor(p,"voice")}
NASKAH:
${p.scenes.map(s=>s.text).join(' ')}
=== AKHIR PERINTAH ===`;}

export function splitNarration(text){
 const chunks=String(text).trim().match(/[^.!?]+(?:[.!?]+(?:["”’])?|$)/g)||[];
 const out=[];let carry='';
 for(const chunk of chunks){const next=chunk.trim();if(carry&&((carry+' '+next).split(/\s+/).length>16||carry.split(/\s+/).length>8||next.split(/\s+/).length<6||/^(Kalau|Jika)\b/.test(carry)||carry.split(' ')[0]===next.split(' ')[0])){out.push(carry);carry='';}carry=(carry+' '+next).trim();}
 if(carry)out.push(carry);
 return out;
}
export function storyboardPrompt(p){
 if(!p.narration?.trim())throw Error('Masukkan narasi terlebih dahulu.');
 if(styleOf(p).id!=='mechanism')return legacyStoryboardPrompt(p);
 const rows=splitNarration(p.narration),n=rows.length;
 let result=referenceTemplate.replace(/17 scene/g,n+' scene');
 const start=result.indexOf('1. Kok kita bisa'),end=result.indexOf('\n\n## Tugas',start);
 result=result.slice(0,start)+rows.map((t,i)=>(i+1)+'. '+t).join('\n')+result.slice(end);
 if(p.aspect==='16:9')result=result.replaceAll('vertikal 9:16','horizontal 16:9');
 const extra=[p.styleNotes, p.rules?.story,p.rules?.idea].filter(Boolean).join('\n');
 if(extra){const i=result.lastIndexOf('=== AKHIR PERINTAH ===');result=result.slice(0,i)+'## Arahan tambahan kreator\n'+extra+'\n\n'+result.slice(i);}
 return result;
}

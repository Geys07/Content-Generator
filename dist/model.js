export const words=t=>String(t||'').trim().split(/\s+/).filter(Boolean);
export const norm=t=>String(t).toLocaleLowerCase('id').replace(/[^\p{L}\p{N}]/gu,'');
export const sameNarration=(a,b)=>words(a).join(' ')===words(b).join(' ');
export function invalidate(p,reason,from=0){for(const s of p.scenes.slice(from))if(s.code)s.reviewReason=reason;}
export const total=p=>p.scenes.reduce((n,s)=>n+s.duration,0);
export const fresh=()=>({version:1,id:crypto.randomUUID(),title:'Proyek tanpa judul',narration:'',style:'Cara Kerja 3D',aspect:'9:16',scenes:[],world:'',styleId:'mechanism',assets:[],rules:{},audio:null,music:null,volume:.12,subtitle:true,sfx:true,updated:Date.now()});
export function jsonText(t){
 const raw=t.trim().replace(/^```(?:json)?\s*/i,'').replace(/\s*```$/,'');
 try{JSON.parse(raw);return raw;}catch{}
 return raw.replace(/&#(?:91|x5b);/gi,'[').replace(/&#(?:93|x5d);/gi,']').replace(/\\_/g,'_');
}
export function storyboard(text,narration){
  const obj=JSON.parse(jsonText(text)),rows=Array.isArray(obj)?obj:obj.scenes;
  if(!Array.isArray(rows)||!rows.length)throw Error('JSON harus berisi daftar scenes.');
  const scenes=rows.map((v,i)=>{
    if(typeof v.text!=='string'||!v.text.trim()||typeof v.visual!=='string'||!v.visual.trim())throw Error(`Scene ${i+1}: text dan visual wajib diisi.`);
    const duration=Number(v.duration);
    if(!Number.isFinite(duration)||duration<.1||duration>180)throw Error(`Scene ${i+1}: duration harus 0,1–180 detik.`);
    return{id:i+1,text:v.text.trim(),visual:v.visual.trim(),duration,theme:['paper','night','dusk'].includes(v.theme)?v.theme:'paper',camera:String(v.camera||''),emphasis:String(v.emphasis||''),startState:String(v.startState||''),endState:String(v.endState||''),code:'',cues:[],timing:'perkiraan'};
  });
  const a=words(narration),b=words(scenes.map(v=>v.text).join(' '));
  if(a.length!==b.length||a.some((w,i)=>w!==b[i])){const i=a.findIndex((w,j)=>w!==b[j]);const k=i<0?a.length:i;throw Error(`Teks storyboard berbeda pada kata ${k+1}: seharusnya “${a[k]??'(akhir naskah)'}”, diterima “${b[k]??'(tidak ada)'}”. Pertahankan kata, kapitalisasi, tanda baca, dan urutannya.`);}
  let cursor=0;
  for(const row of scenes){const count=words(row.text).length;row.text=a.slice(cursor,cursor+count).join(' ');cursor+=count;}
  for(const row of scenes)if(row.emphasis&&!words(row.text).includes(row.emphasis)){
 const plain=t=>t.replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu,'');
 const found=words(row.text).find(w=>plain(w)===plain(row.emphasis));
 if(found&&plain(row.emphasis))row.emphasis=found;
 else throw Error(`Scene ${row.id}: emphasis harus satu kata persis dari teks.`);
}
  return scenes;
}
export function parseCode(source){if(/<!doctype|<html[ >]/i.test(source))throw Error('Kode HTML/GSAP mentah belum didukung. Gunakan prompt animasi dari proyek ini untuk memperoleh kode Canvas berpenanda scene.');const clean=source.replace(/^```(?:javascript|js)?\s*$/gm,'').trim();const starts=[...clean.matchAll(/^\/\/ ===== DUNIA =====\s*$/gm)],ends=[...clean.matchAll(/^\/\/ ===== AKHIR DUNIA =====\s*$/gm)];const start=starts[0],end=ends[0];if(starts.length>1||ends.length>1||!!start!==!!end||start&&end.index<start.index)throw Error('Penanda DUNIA harus lengkap, satu kali, dan berurutan.');const world=start?clean.slice(start.index+start[0].length,end.index).trim():null;const matches=[...clean.matchAll(/^\/\/ ===== SCENE (\d+) =====\s*$/gm)];if(!matches.length)throw Error('Tidak ada penanda // ===== SCENE 1 =====.');if(end&&matches[0].index<end.index)throw Error('DUNIA harus selesai sebelum scene pertama.');const seen=new Set(),scenes=matches.map((m,i)=>{const id=Number(m[1]);if(id<1)throw Error('Nomor scene harus positif.');if(seen.has(id))throw Error(`Scene ${id} ditulis dua kali.`);seen.add(id);const code=clean.slice(m.index+m[0].length,matches[i+1]?.index??clean.length).trim();if(!code)throw Error(`Scene ${id} masih kosong.`);return{id,code};});return{world,scenes};}
export function locate(p,t){let start=0;for(let i=0;i<p.scenes.length;i++){const row=p.scenes[i];if(t<start+row.duration||i===p.scenes.length-1)return{index:i,local:Math.max(0,Math.min(row.duration,t-start)),start};start+=row.duration;}return{index:0,local:0,start:0};}
export function align(p,input,duration){const cues=Array.isArray(input)?input:input.words;const expected=words(p.scenes.map(x=>x.text).join(' '));if(!Array.isArray(cues)||cues.length!==expected.length)throw Error(`Butuh ${expected.length} timestamp kata, diterima ${cues?.length??0}.`);let end=0;const checked=cues.map((c,i)=>{const start=Number(c.start),stop=Number(c.end);if(norm(c.word??c.text)!==norm(expected[i]))throw Error(`Kata ${i+1} harus “${expected[i]}”.`);if(!Number.isFinite(start)||!Number.isFinite(stop)||start<end-.001||stop<=start||stop>duration+.03)throw Error(`Waktu kata ${i+1} tidak berurutan atau di luar VO.`);end=stop;return{word:expected[i],start,end:stop};});let cursor=0;return p.scenes.map((row,i)=>{const count=words(row.text).length,part=checked.slice(cursor,cursor+count),start=i===0?0:part[0].start;cursor+=count;const stop=i===p.scenes.length-1?duration:checked[cursor].start;return{...row,duration:stop-start,cues:part.map(c=>({...c,start:c.start-start,end:c.end-start})),timing:'perlu ditinjau',reviewReason:row.code?'Timing VO berubah; tinjau gerakan scene.':undefined};});}
export function globalCues(p){let offset=0;return p.scenes.flatMap(s=>{const a=s.cues.map(c=>({...c,start:c.start+offset,end:c.end+offset}));offset+=s.duration;return a;});}
export function sourceOf(p){return(p.world?`// ===== DUNIA =====\n${p.world}\n// ===== AKHIR DUNIA =====\n\n`:'')+p.scenes.map(s=>`// ===== SCENE ${s.id} =====\n${s.code}`).join('\n\n');}
export function srt(p){const stamp=t=>{const n=Math.round(t*1000);return`${String(Math.floor(n/3600000)).padStart(2,'0')}:${String(Math.floor(n/60000)%60).padStart(2,'0')}:${String(Math.floor(n/1000)%60).padStart(2,'0')},${String(n%1000).padStart(3,'0')}`;};let offset=0,count=0;return p.scenes.map(s=>{const cues=s.cues.length?s.cues:words(s.text).map((word,i,a)=>({word,start:i*s.duration/a.length,end:(i+1)*s.duration/a.length}));let out='';for(let i=0;i<cues.length;i+=6){const chunk=cues.slice(i,i+6);out+=`${++count}\n${stamp(offset+chunk[0].start)} --> ${stamp(offset+chunk.at(-1).end)}\n${chunk.map(c=>c.word).join(' ')}\n\n`;}offset+=s.duration;return out;}).join('');}
export function validateProject(p){if(!p||p.version!==1||typeof p.narration!=='string'||!Array.isArray(p.scenes))throw Error('Berkas bukan proyek Ruang Adegan.');const ids=new Set();for(const s of p.scenes){if(!Number.isInteger(s.id)||ids.has(s.id)||typeof s.code!=='string'||typeof s.text!=='string'||!Number.isFinite(s.duration)||s.duration<=0||s.duration>180)throw Error('Data scene tidak valid.');ids.add(s.id);s.cues??=[];}p.world??='';return p;}

export function storyboardData(text,narration){const obj=JSON.parse(jsonText(text));return {title:typeof obj.title==='string'&&obj.title.trim()?obj.title.trim():undefined,scenes:storyboard(text,narration),seo:obj.seo&&typeof obj.seo==='object'?obj.seo:{},background:obj.background&&typeof obj.background==='object'?obj.background:{},storyNotes:Array.isArray(obj.notes)?obj.notes.map(String):[]};}

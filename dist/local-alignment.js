// Sequence alignment between the locked script and timestamped speech recognition.
const normalize=w=>String(w).toLocaleLowerCase('id').replace(/[^\p{L}\p{N}]/gu,'');
export function alignRecognized(script,chunks,duration){
 const expected=script.trim().split(/\s+/).filter(Boolean);
 const observed=chunks.flatMap(c=>{const parts=String(c.text||'').trim().split(/\s+/).filter(Boolean),[start,end]=c.timestamp||[];if(!Number.isFinite(start)||!Number.isFinite(end)||end<=start)return[];return parts.map((text,i)=>({text,start:start+(end-start)*i/parts.length,end:start+(end-start)*(i+1)/parts.length}));});
 if(!expected.length||!observed.length||!Number.isFinite(duration)||duration<=0)throw Error('Tidak ada kata bertimestamp yang dapat dicocokkan. Coba rekaman yang lebih jelas atau masukkan timing manual.');
 const n=expected.length,m=observed.length;if(n*m>8000000)throw Error('Naskah terlalu panjang untuk pencocokan di perangkat ini. Bagi video menjadi beberapa proyek.');
 const score=new Uint16Array((n+1)*(m+1)),at=(i,j)=>i*(m+1)+j;
 for(let i=n-1;i>=0;i--)for(let j=m-1;j>=0;j--)score[at(i,j)]=normalize(expected[i])===normalize(observed[j].text)?1+score[at(i+1,j+1)]:Math.max(score[at(i+1,j)],score[at(i,j+1)]);
 const anchors=[];let i=0,j=0;while(i<n&&j<m){if(normalize(expected[i])===normalize(observed[j].text)){anchors.push([i,observed[j]]);i++;j++;}else if(score[at(i+1,j)]>=score[at(i,j+1)])i++;else j++;}
 if(anchors.length/n<.35)throw Error('Suara belum cukup cocok dengan narasi. Pastikan file VO menggunakan naskah yang sama, lalu coba lagi atau isi timing manual.');
 const result=new Array(n);let cursor=0;
 for(const [index,a]of anchors){const start=Math.max(cursor,Math.min(duration,a.start)),end=Math.min(duration,Math.max(start+.01,a.end));if(end<=start)continue;result[index]={word:expected[index],start,end,review:false};cursor=end;}
 for(let k=0;k<n;){if(result[k]){k++;continue;}const first=k;while(k<n&&!result[k])k++;const start=first?result[first-1].end:0,end=k<n?result[k].start:duration,count=k-first;
 // No acoustic evidence for these words: interpolate and explicitly require review.
 if(end-start<count*.005)throw Error('Ada kata yang tidak mendapat ruang waktu yang cukup. Koreksi timing manual atau gunakan VO yang sesuai naskah.');
 for(let x=0;x<count;x++)result[first+x]={word:expected[first+x],start:start+(end-start)*x/count,end:start+(end-start)*(x+1)/count,review:true};}
 return {words:result,matched:result.filter(c=>!c.review).length,total:n,review:result.flatMap((c,i)=>c.review?[i]:[]),transcript:observed.map(c=>c.text).join(' ')};
}

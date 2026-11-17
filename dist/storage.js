let pending;
function db(){return pending??=new Promise((resolve,reject)=>{const r=indexedDB.open('ruang-adegan',1);r.onupgradeneeded=()=>r.result.createObjectStore('projects',{keyPath:'id'});r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});}
async function request(mode,fn){const d=await db();return new Promise((resolve,reject)=>{const tx=d.transaction('projects',mode),r=fn(tx.objectStore('projects'));tx.oncomplete=()=>resolve(r.result);tx.onerror=()=>reject(tx.error);});}
export const save=p=>request('readwrite',store=>store.put({...p,updated:Date.now()}));
export const list=()=>request('readonly',store=>store.getAll());

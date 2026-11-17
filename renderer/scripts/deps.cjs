'use strict';
const path=require('node:path');
function dependency(name){
  try{return require(name);}catch(e){
    if(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES){try{return require(path.join(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES,name));}catch{}}
    throw Error(`Dependensi ${name} belum tersedia. Jalankan npm install di folder paket. ${e.code||''}`);
  }
}
module.exports={dependency};

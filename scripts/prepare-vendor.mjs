import {mkdir,copyFile} from 'node:fs/promises';
const source='node_modules/@huggingface/transformers/dist/',target='dist/vendor/transformers/';await mkdir(target,{recursive:true});
for(const name of ['transformers.min.js','ort-wasm-simd-threaded.jsep.mjs','ort-wasm-simd-threaded.jsep.wasm'])await copyFile(source+name,target+name);
await copyFile('node_modules/@huggingface/transformers/LICENSE',target+'LICENSE');
console.log('Browser speech runtime prepared.');

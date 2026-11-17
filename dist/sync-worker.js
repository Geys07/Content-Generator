import {pipeline,env} from './vendor/transformers/transformers.min.js';
import {alignRecognized} from './local-alignment.js';
env.allowLocalModels=false;
env.backends.onnx.wasm.numThreads=1;
env.backends.onnx.wasm.wasmPaths=new URL('./vendor/transformers/',import.meta.url).href;
let recognizer;
self.onmessage=async({data})=>{try{
 self.postMessage({type:'progress',text:'Menyiapkan model suara di perangkat. Unduhan pertama memerlukan internet.'});
 recognizer??=await pipeline('automatic-speech-recognition','onnx-community/whisper-base_timestamped',{device:'wasm',dtype:'q8',progress_callback:p=>{if(p.status==='progress')self.postMessage({type:'progress',text:`Mengunduh model: ${p.file} · ${Math.round(p.progress||0)}%`});}});
 self.postMessage({type:'progress',text:'Mendengarkan VO di perangkat. Audio tidak diunggah.'});
 const output=await recognizer(data.audio,{language:'indonesian',task:'transcribe',return_timestamps:'word',chunk_length_s:25,stride_length_s:4});
 self.postMessage({type:'progress',text:'Mencocokkan hasil suara dengan kata narasi asli…'});
 self.postMessage({type:'done',result:alignRecognized(data.script,output.chunks||[],data.duration)});
 }catch(e){self.postMessage({type:'error',message:e.message||String(e)});}};

import {pipeline} from '@huggingface/transformers';
import fs from 'node:fs';
import {alignRecognized} from '../dist/local-alignment.js';
const path=process.argv[2];if(!path)throw Error('Supply 16kHz mono signed 16-bit PCM file');
const bytes=fs.readFileSync(path),samples=new Float32Array(bytes.length/2);for(let i=0;i<samples.length;i++)samples[i]=bytes.readInt16LE(i*2)/32768;
const recognizer=await pipeline('automatic-speech-recognition','onnx-community/whisper-base_timestamped',{device:'cpu',dtype:'q8'});
const result=await recognizer(samples,{language:'indonesian',task:'transcribe',return_timestamps:'word',chunk_length_s:25,stride_length_s:4});
console.log(JSON.stringify(result));
console.log(JSON.stringify(alignRecognized(process.argv[3]||'Padahal meterannya nggak pakai internet.',result.chunks,samples.length/16000)));

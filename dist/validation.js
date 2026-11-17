import {parse} from './vendor/acorn.mjs';
export function syntax(world,code,id){const prefix='function scene(s,ctx){\n',split=world.split('\n').length;try{parse(prefix+world+'\n'+code+'\n}',{ecmaVersion:'latest',locations:true});}catch(e){const n=e.loc?.line-1;if(n<=split)throw Error(`DUNIA, baris ${n}: ${e.message}`);throw Error(`Scene ${id}, baris ${n-split}: ${e.message}`);}}

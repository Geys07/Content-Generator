import test from 'node:test';
import assert from 'node:assert/strict';
import {storyboardData} from '../dist/model.js';
import {storyboardPrompt,splitNarration} from '../dist/prompts.js';
import {referenceTemplate} from '../dist/storyboard-template.js';
test('reference prompt matches document with its original scene list',()=>{
 const block=referenceTemplate.split('\n1. Kok kita bisa')[1].split('\n\n## Tugas')[0];
 const rows=('1. Kok kita bisa'+block).split('\n').map(x=>x.replace(/^\d+\. /,''));
 assert.deepEqual(splitNarration(rows.join(' ')),rows);
 assert.equal(storyboardPrompt({narration:rows.join(' '),styleId:'mechanism',aspect:'9:16'}),referenceTemplate);
});
test('HTML bracket and markdown escape paste retains narration and punctuated emphasis',()=>{
 const raw='{"scenes":&#91;{"text":"Ada listrik statis.","visual":"Drum", "duration":3,"emphasis":"statis","camera":"CAM\\_A"}&#93;}';
 const p=storyboardData(raw,'Ada listrik statis.');
 assert.equal(p.scenes[0].emphasis,'statis.');assert.equal(p.scenes[0].camera,'CAM_A');
 assert.throws(()=>storyboardData(raw,'Ada Listrik statis.'),/kata 2/);
});
test('split preserves punctuation including ellipsis and final unpunctuated phrase',()=>{
 const text='Cekrek... zzztt... Kok mesin ini bekerja? Ini akhir';
 assert.equal(splitNarration(text).join(' '),text);
});

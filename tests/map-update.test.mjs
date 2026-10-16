import {spawnSync} from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';
import {reviewMods,modExamples} from '../tooling/data/map-review.mjs';
import {updateMaps} from '../tooling/data/map-update.mjs';
const entry=(id,text='Monsters burn',jp='モンスターは燃焼する')=>({sourceIds:[id],mod:jp,engMod:text,value:'',Regex:'燃焼',engRegex:'burn',tradeStatIds:['explicit.1']});
test('source IDs track renamed mods while reporting adds, removes and changed fields',()=>{
 const before={old:entry('stable'),deleted:entry('delete'),keep:entry('keep')};
 const after={renamed:{...entry('stable'),weight:99},new:entry('new'),keep:entry('keep')};
 const report=reviewMods(before,after);
 assert.equal(report.counts.changed,1);assert.equal(report.counts.added,1);assert.equal(report.counts.removed,1);
 assert.equal(report.changes.changed[0].previousKey,'old');assert.ok(report.changes.changed[0].fields.includes('weight'));
 assert.equal(report.blocking.length,0);
});
test('new invalid, empty and mismatching regex block updates; old problems remain visible',()=>{
 const before={bad:{...entry('bad'),Regex:'['},good:entry('good')};
 const after={bad:before.bad,good:{...before.good,engMod:'Monsters freeze'},new:{...entry('new'),Regex:''}};
 const report=reviewMods(before,after);
 assert.ok(report.findings.some(f=>f.code==='invalid'&&f.existing));
 assert.ok(report.blocking.some(f=>f.key==='good'&&f.code==='no-match'));
 assert.ok(report.blocking.some(f=>f.key==='new'&&f.code==='empty'));
 assert.equal(report.blocking.some(f=>f.key==='bad'),false);
});
test('cross matches, missing trade IDs, duplicate Mod IDs and major deletions are reported',()=>{
 const a=entry('a'),b=entry('b','Monsters burn faster','モンスターは激しく燃焼する');
 const report=reviewMods({a,b},{a:{...a,tradeStatIds:[]},b});
 assert.ok(report.findings.some(f=>f.code==='overlap'&&f.matches.includes('b')));
 assert.ok(report.findings.some(f=>f.code==='missing-trade-id'));
 assert.ok(reviewMods({a,b},{a,b:{...b,sourceIds:['a']}}).blocking.some(f=>f.code==='duplicate-source-id'));
 assert.ok(reviewMods({a,b},{a}).blocking.some(f=>f.code==='large-removal'));
});
test('regex examples cover signed numeric ranges and multiple lines',()=>{
 assert.deepEqual(modExamples({mod:'速度(##)%|追加#個',value:'-20--10|3'},'ja'),['速度-20%\n追加3個','速度-15%\n追加3個','速度-10%\n追加3個']);
});
function fixture() {
 const repo=fs.mkdtempSync(path.join(os.tmpdir(),'map-update-test-'));
 fs.mkdirSync(path.join(repo,'data/poe1'),{recursive:true});fs.mkdirSync(path.join(repo,'assets/js'),{recursive:true});
 fs.writeFileSync(path.join(repo,'data/manifest.json'),JSON.stringify({poe1:[{path:'data/poe1/map-mods.json',variable:'mapModList'}]}));
 fs.writeFileSync(path.join(repo,'data/poe1/map-mods.json'),JSON.stringify({a:entry('a')}));
 fs.writeFileSync(path.join(repo,'assets/js/poe1.js'),'old bundle');
 const generate=candidate=>{fs.cpSync(path.join(repo,'data'),path.join(candidate,'data'),{recursive:true});fs.writeFileSync(path.join(candidate,'data/poe1/map-mods.json'),JSON.stringify({a:{...entry('a'),weight:7}}));};
 return {repo,generate,close:()=>fs.rmSync(repo,{recursive:true,force:true})};
}
test('preview preserves live data and writes inspectable candidates and reports',()=>{
 const f=fixture();try {
  const report=updateMaps({...f,dryRun:true,buildSite:()=>assert.fail('Preview built site')});
  assert.equal(report.status,'preview');assert.equal(JSON.parse(fs.readFileSync(path.join(f.repo,'data/poe1/map-mods.json'))).a.weight,undefined);
  assert.ok(fs.readFileSync(path.join(f.repo,'archive/map-updates/latest.html'),'utf8').includes('マップMod更新レポート'));
 }finally{f.close();}
});
test('invalid candidates never replace live data',()=>{
 const f=fixture();try{
  assert.throws(()=>updateMaps({...f,generate:candidate=>{f.generate(candidate);fs.writeFileSync(path.join(candidate,'data/poe1/map-mods.json'),JSON.stringify({a:{...entry('a'),Regex:'['}}));},buildSite:()=>assert.fail('Built invalid candidate')}),/検証エラー/);
  assert.equal(JSON.parse(fs.readFileSync(path.join(f.repo,'data/poe1/map-mods.json'))).a.Regex,'燃焼');
 }finally{f.close();}
});
test('a failed final build restores JSON and all partially emitted bundles',()=>{
 const f=fixture();try{
  assert.throws(()=>updateMaps({...f,buildSite:()=>{fs.writeFileSync(path.join(f.repo,'assets/js/poe1.js'),'partial');fs.writeFileSync(path.join(f.repo,'assets/js/new.js'),'new');throw new Error('build failed');}}),/build failed/);
  assert.equal(JSON.parse(fs.readFileSync(path.join(f.repo,'data/poe1/map-mods.json'))).a.weight,undefined);
  assert.equal(fs.readFileSync(path.join(f.repo,'assets/js/poe1.js'),'utf8'),'old bundle');assert.equal(fs.existsSync(path.join(f.repo,'assets/js/new.js')),false);
  assert.equal(JSON.parse(fs.readFileSync(path.join(f.repo,'archive/map-updates/latest.json'))).status,'failed');
 }finally{f.close();}
});
test('successful update applies candidates and builds once',()=>{
 const f=fixture();try{let builds=0;assert.equal(updateMaps({...f,buildSite:()=>{builds++;}}).status,'applied');assert.equal(builds,1);assert.equal(JSON.parse(fs.readFileSync(path.join(f.repo,'data/poe1/map-mods.json'))).a.weight,7);}finally{f.close();}
});
test('reviewed candidates can be applied later, but stale candidates are rejected',()=>{
 const f=fixture();try{
  updateMaps({...f,dryRun:true,buildSite:()=>{}});
  const run=fs.readdirSync(path.join(f.repo,'archive/map-updates'),{withFileTypes:true}).find(entry=>entry.isDirectory()).name;
  const candidatePath=path.join(f.repo,'archive/map-updates',run,'candidate');
  assert.equal(updateMaps({repo:f.repo,candidatePath,buildSite:()=>{}}).status,'applied');
  assert.throws(()=>updateMaps({repo:f.repo,candidatePath,buildSite:()=>assert.fail('Applied stale candidate')}),/本体データが変わって/);
 }finally{f.close();}
});
test('CLI runs multiple legacy generators without touching live data until validation',()=>{
 const f=fixture();try{
  const repo=f.repo, original=path.resolve(import.meta.dirname,'..');
  fs.mkdirSync(path.join(repo,'tooling/data'),{recursive:true});
  for(const file of ['legacy.mjs','map-update.mjs','map-review.mjs','validate.mjs','regex-audit.mjs','mod-search-text.mjs'])fs.copyFileSync(path.join(original,'tooling/data',file),path.join(repo,'tooling/data',file));
  fs.writeFileSync(path.join(repo,'tooling/build.mjs'),`import fs from 'node:fs';import path from 'node:path';import {fileURLToPath} from 'node:url';export const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');export function build(){fs.writeFileSync(path.join(root,'assets/js/poe1.js'),'built');}`);
  for(const name of ['items','flasks','gems'])fs.mkdirSync(path.join(repo,'data/poe1',name));
  for(const name of ['trade-stats','trade-filters'])fs.writeFileSync(path.join(repo,'data/poe1',name+'.json'),'{}');
  fs.writeFileSync(path.join(repo,'generator.cjs'),`const fs=require('node:fs'),vm=require('node:vm');if(JSON.parse(fs.readFileSync('data/poe1/map-mods.json')).a.weight!==undefined)throw new Error('Live data changed early');const file='scripts/map_mods.js';const data=vm.runInNewContext(fs.readFileSync(file,'utf8')+';mapModList');data.a.weight=(data.a.weight||0)+1;fs.writeFileSync(file,'const mapModList = '+JSON.stringify(data)+';');`);
  const commands=[[process.execPath,['generator.cjs']],[process.execPath,['generator.cjs']]];
  const result=spawnSync(process.execPath,['tooling/data/map-update.mjs','--dry-run','--commands',JSON.stringify(commands)],{cwd:repo,encoding:'utf8'});
  assert.equal(result.status,0,result.stdout+result.stderr);
  assert.equal(JSON.parse(fs.readFileSync(path.join(repo,'data/poe1/map-mods.json'))).a.weight,undefined);
  const run=fs.readdirSync(path.join(repo,'archive/map-updates'),{withFileTypes:true}).find(entry=>entry.isDirectory()).name;
  const candidate=path.join(repo,'archive/map-updates',run,'candidate');
  assert.equal(JSON.parse(fs.readFileSync(path.join(candidate,'data/poe1/map-mods.json'))).a.weight,2);
  assert.equal(fs.existsSync(path.join(repo,'scripts')),false);
  const applied=spawnSync(process.execPath,['tooling/data/map-update.mjs','--candidate',candidate],{cwd:repo,encoding:'utf8'});
  assert.equal(applied.status,0,applied.stdout+applied.stderr);
  assert.equal(fs.readFileSync(path.join(repo,'assets/js/poe1.js'),'utf8'),'built');
 }finally{f.close();}
});
test('different explicit Mod IDs are additions and removals even if their text is identical',()=>{
 const report=reviewMods({same:entry('old')},{same:entry('new')});
 assert.equal(report.counts.added,1);assert.equal(report.counts.removed,1);assert.equal(report.counts.changed,0);
});
test('regex validation detects matches in other Mods tags and reminder text',()=>{
 const before={a:{...entry('a'),engMod:'Physical monsters',engRegex:'Physical'},b:entry('b','Cold monsters','冷気モンスター')};
 const after={...before,b:{...before.b,modTags:[{id:'physical',ja:'物理',en:'Physical'}],reminderText:{ja:[],en:['Physical Damage explanation']}}};
 assert.ok(reviewMods(before,after).findings.some(issue=>issue.key==='a'&&issue.code==='overlap'&&issue.matches.includes('b')));
});

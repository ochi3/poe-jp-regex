import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import test from 'node:test';
import assert from 'node:assert/strict';
import {auditRegex,auditHtml} from '../tooling/data/regex-audit.mjs';
import {modExamples,searchTargets} from '../tooling/data/mod-search-text.mjs';
const base={mod:'物理ダメージが増加する',engMod:'Physical Damage increases',Regex:'物理',engRegex:'Physical',type:'Prefix',value:''};
test('audit identifies exact fields, snippets, offsets and self metadata without flagging own body',()=>{
 const other={mod:'冷気ダメージが増加する',engMod:'Cold Damage increases',Regex:'冷気',engRegex:'Cold',type:'Suffix',value:'',modTags:[{id:'physical',ja:'物理',en:'Physical'}],reminderText:{ja:['物理ダメージの説明'],en:['Physical Damage reminder']}};
 const report=auditRegex({map:{first:{...base,modTags:other.modTags},other}});
 const ja=report.checks.find(check=>check.key==='first'&&check.language==='ja');
 assert.ok(ja.hits.some(hit=>hit.key==='other'&&hit.field==='modTags'&&hit.matched==='物理'&&hit.index===0));
 assert.ok(ja.hits.some(hit=>hit.key==='other'&&hit.field==='reminderText'));
 assert.ok(ja.hits.some(hit=>hit.self&&hit.field==='modTags'));
 assert.equal(ja.hits.some(hit=>hit.self&&hit.field==='mod'),false);
 const en=report.checks.find(check=>check.key==='first'&&check.language==='en');
 assert.ok(en.hits.some(hit=>hit.field==='reminderText'&&hit.text==='Physical Damage reminder'));
 assert.equal(en.hits.some(hit=>hit.field==='mod'),false);
});
test('type is checked as both raw JSON and localized game headers',()=>{
 const report=auditRegex({map:{a:{...base,mod:'プレフィックスモッド',engMod:'Prefix',Regex:'プレフィックス',engRegex:'Prefix'}}});
 assert.ok(report.checks.find(c=>c.language==='ja').hits.some(hit=>hit.field==='type'&&hit.text==='プレフィックスモッド'));
 assert.ok(report.checks.find(c=>c.language==='en').hits.some(hit=>hit.field==='type'&&hit.text==='Prefix'));
});
test('missing, invalid and body-mismatching regex are reported separately',()=>{
 const report=auditRegex({map:{empty:{...base,Regex:''},invalid:{...base,Regex:'['},wrong:{...base,Regex:'呪い',reminderText:{ja:['呪い'],en:[]}}}});
 for(const [key,code] of [['empty','empty'],['invalid','invalid'],['wrong','no-match']])assert.ok(report.checks.find(check=>check.key===key&&check.language==='ja').errors.some(error=>error.code===code));
});
test('numeric endpoints, decimals and game markup are expanded without treating markup pipes as Mod separators',()=>{
 assert.deepEqual(modExamples({mod:'[PhysicalThorns|Physical Thorns] reflect # damage|Second # line',value:'0.2-0.4|5'},'ja'),['Physical Thorns reflect 0.2 damage\nSecond 5 line','Physical Thorns reflect 0.3 damage\nSecond 5 line','Physical Thorns reflect 0.4 damage\nSecond 5 line']);
 const report=auditRegex({map:{a:{...base,mod:'先頭|終了',Regex:'終了$'}}},{languages:['ja']});
 assert.deepEqual(report.checks[0].errors,[]);
});
test('identical Mod text is classified separately from actionable collisions',()=>{
 const report=auditRegex({map:{a:{...base},b:{...base}}});
 assert.equal(report.summary.collisions,0);assert.equal(report.summary.sameEffect,4);
 assert.ok(report.checks[0].hits.every(hit=>hit.sameEffect));
});
test('HTML escapes source text and highlights the actual match',()=>{
 const report=auditRegex({map:{a:{...base,reminderText:{ja:['<script>物理</script>'],en:[]}}}});
 const html=auditHtml(report);assert.ok(html.includes('&lt;script&gt;<mark>物理</mark>&lt;/script&gt;'));assert.ok(!html.includes('<script>物理'));
});
test('CLI writes reports, strict mode signals findings, and input JSON is never modified',()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'regex-audit-'));
 try {
  const file=path.join(dir,'mods.json'),contents=JSON.stringify({a:{...base,Regex:''}});fs.writeFileSync(file,contents);
  const command=path.resolve(import.meta.dirname,'../tooling/data/check-regex.mjs');
  const args=[command,'--file',file,'--out',path.join(dir,'report')];
  assert.equal(spawnSync(process.execPath,args,{encoding:'utf8'}).status,0);
  assert.equal(spawnSync(process.execPath,[...args,'--strict'],{encoding:'utf8'}).status,1);
  assert.ok(fs.existsSync(path.join(dir,'report/latest.html')));assert.ok(fs.existsSync(path.join(dir,'report/latest.json')));
  assert.equal(fs.readFileSync(file,'utf8'),contents);
 }finally{fs.rmSync(dir,{recursive:true,force:true});}
});

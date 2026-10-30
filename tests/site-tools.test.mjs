import assert from 'node:assert/strict';
import path from 'node:path';
import test from 'node:test';
import {loadSite,savedStorage} from './helpers/site.mjs';
const root=path.resolve(import.meta.dirname,'..');
for(const game of ['poe1','poe2'])test(`${game}: backups include both games, merge collisions and reject damaged files atomically`,async()=>{
 const initial={poeProfiles:JSON.stringify({same:{mods:[],settings:{customRegex:'テスト'}}}),poe2_poeProfiles:JSON.stringify({second:{mods:[],settings:{}}})};
 const site=await loadSite(root,game,initial);try{
  const w=site.window,backup=w.createProfileBackup();
  assert.equal(Object.keys(backup.profiles.poeProfiles).length,1);
  assert.equal(Object.keys(backup.profiles.poe2_poeProfiles).length,1);
  const before=savedStorage(w);
  const bad=JSON.parse(JSON.stringify(backup));bad.profiles.itemProfiles={broken:{mods:42}};
  assert.throws(()=>w.restoreProfileBackup(bad),/保存内容が不正/);
  assert.deepEqual(savedStorage(w),before);
  const poisoned=JSON.parse('{"format":"poe-jp-regex-profiles","version":1,"createdAt":"now","profiles":{"__proto__":{}}}');
  assert.throws(()=>w.restoreProfileBackup(poisoned),/利用できないキー/);
  assert.throws(()=>w.restoreProfileBackup({...backup,version:2}),/対応する/);
  const result=w.restoreProfileBackup(backup);
  assert.equal(result.count,2);assert.equal(result.renamed,2);
  assert.ok(JSON.parse(w.localStorage.getItem('poeProfiles'))['same (復元 1)']);
  assert.equal(JSON.parse(w.localStorage.getItem('poeProfiles')).same.settings.customRegex,'テスト');
  assert.ok(w.localStorage.getItem('profileBackupBeforeRestore'));
  assert.deepEqual(site.errors,[]);
 }finally{site.close();}
});
test('failed profile restore rolls back earlier writes and preserves recovery',async()=>{
 const site=await loadSite(root,'poe1',{poeProfiles:'{"old":{"mods":[]}}',itemProfiles:'{"oldItem":{"mods":[]}}'});try{
  const w=site.window,before=savedStorage(w),original=w.Storage.prototype.setItem;
  const backup=w.createProfileBackup();let failed=false;
  w.Storage.prototype.setItem=function(key,value){if(key==='itemProfiles'&&!failed){failed=true;throw Error('quota');}return original.call(this,key,value);};
  assert.throws(()=>w.restoreProfileBackup(backup),/quota/);
  assert.equal(w.localStorage.getItem('poeProfiles'),before.poeProfiles);
  assert.equal(w.localStorage.getItem('itemProfiles'),before.itemProfiles);
  assert.ok(w.localStorage.getItem('profileBackupBeforeRestore'));
  w.Storage.prototype.setItem=original;
 }finally{site.close();}
});

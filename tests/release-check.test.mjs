import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import assert from 'node:assert/strict';
import test from 'node:test';
import {checkRelease} from '../tooling/check-release.mjs';
import {refreshDataStatus} from '../tooling/data/status.mjs';
function fixture(){
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'release-check-'));
 const put=(name,value)=>{const file=path.join(root,name);fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,typeof value==='string'?value:JSON.stringify(value));};
 const mod={mod:'効果',engMod:'Effect',value:'1',Regex:'効果',engRegex:'Effect'};
 put('data/manifest.json',Object.fromEntries(['poe1','poe2'].map(game=>[game,[{path:`data/${game}/map-mods.json`,variable:'mapModList'}]])));
 for(const game of ['poe1','poe2']){put(`data/${game}/map-mods.json`,{first:mod});put(`${game}.html`,'<a href="poe1">PoE1</a>');}
 put('src/example.ts',"const url='data/poe1/map-mods.json';");
 return {root,put,mod,close:()=>fs.rmSync(root,{recursive:true,force:true})};
}
test('release checks block empty Regex, missing files and malformed JSON without changing inputs',()=>{
 const f=fixture();try{
  assert.deepEqual(checkRelease(f.root),[]);
  f.put('data/poe2/map-mods.json',{first:{...f.mod,Regex:''}});
  assert.ok(checkRelease(f.root).some(error=>error.includes('Regex が未設定')));
  f.put('data/poe2/map-mods.json',{first:f.mod});
  f.put('src/example.ts',"const url='data/poe1/missing.json';");
  assert.ok(checkRelease(f.root).some(error=>error.includes('missing.json')));
  f.put('data/poe1/bad.json','{broken');
  assert.ok(checkRelease(f.root).some(error=>error.includes('bad.json')));
  assert.equal(fs.readFileSync(path.join(f.root,'data/poe1/bad.json'),'utf8'),'{broken');
 }finally{f.close();}
});
test('release checks detect missing bilingual affixes and invalid syntax',()=>{
 const f=fixture();try{
  f.put('data/poe1/items/jewel.json',{mods:{prefix:{family:[{key:'mod',name:'接辞',text:'効果',engName:'',engText:'Effect'}]},suffix:{}}});
  assert.ok(checkRelease(f.root).some(error=>error.includes('日英')));
  f.put('data/poe2/map-mods.json',{first:{...f.mod,engRegex:'['}});
  assert.ok(checkRelease(f.root).some(error=>error.includes('構文エラー')));
 }finally{f.close();}
});
test('data timestamps remain stable and separate price changes from Mod changes',()=>{
 const f=fixture();try{
  f.put('data/poe1/prices.json',{item:{regex:'item',chaosValue:'1'}});
  const first=refreshDataStatus(f.root,'2026-10-01T00:00:00Z');
  assert.deepEqual(refreshDataStatus(f.root,'2026-10-02T00:00:00Z'),first);
  f.put('data/poe1/prices.json',{item:{regex:'item',chaosValue:'2'}});
  const second=refreshDataStatus(f.root,'2026-10-03T00:00:00Z');
  assert.equal(second.games.poe1.mods.updatedAt,first.games.poe1.mods.updatedAt);
  assert.equal(second.games.poe1.prices.updatedAt,'2026-10-03T00:00:00Z');
  second.games.poe1.gameVersion='test-version';f.put('data/status.json',second);
  f.put('data/poe1/map-mods.json',{first:{...f.mod,mod:'変更'}});
  const third=refreshDataStatus(f.root,'2026-10-04T00:00:00Z');
  assert.equal(third.games.poe1.mods.updatedAt,'2026-10-04T00:00:00Z');
  assert.equal(third.games.poe1.prices.updatedAt,second.games.poe1.prices.updatedAt);
  assert.equal(third.games.poe1.gameVersion,'test-version');
  assert.equal(third.games.poe2.prices,null);
 }finally{f.close();}
});
test('category dates isolate maps, equipment, flasks and each price catalog',()=>{
 const f=fixture();try{
  f.put('data/poe1/items/test.json',{mods:{prefix:{},suffix:{}}});
  f.put('data/poe1/flasks/test.json',{mods:{prefix:{},suffix:{}}});
  f.put('data/poe1/scarablist.json',{one:{regex:'scarab',chaosValue:'1'}});
  f.put('data/poe1/essencelist.json',{one:{regex:'essence',chaosValue:'2'}});
  const first=refreshDataStatus(f.root,'2026-10-01T00:00:00Z');
  f.put('data/poe1/map-mods.json',{first:{...f.mod,mod:'新しいマップ'}});
  const second=refreshDataStatus(f.root,'2026-10-02T00:00:00Z');
  assert.equal(second.games.poe1.categories.map.mods.updatedAt,'2026-10-02T00:00:00Z');
  for(const category of ['item','flask','scarab','essence'])assert.deepEqual(second.games.poe1.categories[category],first.games.poe1.categories[category]);
  f.put('data/poe1/scarablist.json',{one:{regex:'scarab',chaosValue:'3'}});
  const third=refreshDataStatus(f.root,'2026-10-03T00:00:00Z');
  assert.equal(third.games.poe1.categories.scarab.prices.updatedAt,'2026-10-03T00:00:00Z');
  assert.equal(third.games.poe1.categories.scarab.mods.updatedAt,first.games.poe1.categories.scarab.mods.updatedAt);
  assert.deepEqual(third.games.poe1.categories.essence,first.games.poe1.categories.essence);
  assert.deepEqual(third.games.poe1.categories.item,first.games.poe1.categories.item);
  assert.deepEqual(refreshDataStatus(f.root,'2026-10-04T00:00:00Z'),third);
 }finally{f.close();}
});

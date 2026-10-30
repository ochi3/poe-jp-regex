import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {profiles,matchesJewel,buildJewel,root} from '../tooling/data/jewel-mods.mjs';
const base={domain:'misc',generation_type:'prefix',name:'Brutal',text:'Damage',groups:['Damage'],required_level:1,spawn_weights:[{tag:'not_str',weight:0},{tag:'default',weight:500}],generation_weights:[]};
test('jewel exclusions use first matching weight, and domains prevent equipment leaks',()=>{
 assert.equal(matchesJewel(base,profiles.find(p=>p.type==='jewel_str')),true);
 assert.equal(matchesJewel(base,profiles.find(p=>p.type==='jewel_dex')),false);
 assert.equal(matchesJewel({...base,domain:'item'},profiles[0]),false);
 assert.equal(matchesJewel({...base,is_essence_only:true},profiles[0]),false);
});
test('cluster size and passive-type conditions both apply and keep provenance',()=>{
 const profile={type:'test',base:'test',domain:'affliction_jewel',tags:['expansion_jewel_large','default'],variantTags:['fire','cold']};
 const mod={...base,domain:'affliction_jewel',spawn_weights:[{tag:'fire',weight:600},{tag:'default',weight:0}],generation_weights:[{tag:'expansion_jewel_small',weight:0},{tag:'expansion_jewel_large',weight:100},{tag:'default',weight:0}]};
 const data=buildJewel(profile,{test:mod},{test:{name:'接辞',text:'効果'}});
 assert.deepEqual(data.mods.prefix.Damage[0].variantTags,['fire']);
 assert.equal(matchesJewel(mod,{...profile,tags:['expansion_jewel_small','default']},'fire'),false);
});
test('all published jewel types have unique bilingual named affixes in both columns',()=>{
 assert.equal(profiles.length,11);
 for(const profile of profiles) {
  const data=JSON.parse(fs.readFileSync(`${root}/data/poe1/items/${profile.type}.json`,'utf8'));
  assert.deepEqual(data.bases,[profile.base]);
  const keys=new Set();
  for(const type of ['prefix','suffix']) {
   const rows=Object.values(data.mods[type]).flat();assert.ok(rows.length,profile.type+' '+type);
   for(const mod of rows) {
    assert.ok(mod.name&&mod.engName&&mod.text&&mod.engText);
    assert.equal(mod.generation_type,type);assert.ok(mod.weight>0);
    assert.ok(!keys.has(mod.key));keys.add(mod.key);
   }
  }
 }
});

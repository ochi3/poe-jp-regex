import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {loadSite} from './helpers/site.mjs';
const root=path.resolve(import.meta.dirname,'..');
const expected=['implicit.stat_2563183002|4','implicit.stat_2563183002|3','implicit.stat_2563183002|2','implicit.stat_2563183002|1','implicit.stat_1792283443|2','implicit.stat_1792283443|1'];
test('map trade URLs exclude current individual influence and citadel IDs in both languages',async()=>{
 const data=JSON.parse(fs.readFileSync(path.join(root,'data/poe1/trade-stats.json'),'utf8'));
 const ids=new Set(data.result.flatMap(group=>group.entries).map(entry=>entry.id));
 expected.forEach(id=>assert.ok(ids.has(id),id));
 for(const family of ['implicit.stat_2563183002','implicit.stat_3624393862','implicit.stat_1792283443'])assert.equal(ids.has(family),false);
 const site=await loadSite(root,'poe1');try{
  const w=site.window;
  w.document.getElementById('itemQuantityInput').value='80';
  for(const language of ['ja','en']) {
   w.setLanguage(language);
   const url=new URL(w.buildTradeUrl());
   assert.equal(url.hostname,language==='ja'?'jp.pathofexile.com':'www.pathofexile.com');
   const query=JSON.parse(url.searchParams.get('q')).query;
   const not=query.stats.find(group=>group.type==='not');
   assert.deepEqual(not.filters.map(filter=>filter.id),expected);
   assert.equal(not.filters.some(filter=>filter.id.startsWith('implicit.stat_3624393862')),false);
   assert.ok(not.filters.every(filter=>filter.disabled===false));
  }
  assert.deepEqual(site.errors,[]);
 }finally{site.close();}
});

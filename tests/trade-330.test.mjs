import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import fs from 'node:fs';
import {loadSite} from './helpers/site.mjs';
const root=path.resolve(import.meta.dirname,'..');
const expected={
 MapContainsMirageWorlds:'explicit.stat_2436559047',
 MapContainsBeyondPaleFactionWorlds:'explicit.stat_260515856',
 MapContainsBeyondFleshFactionWorlds:'explicit.stat_1290924623',
 MapContainsBeyondDemonFactionWorlds:'explicit.stat_2896557935',
 MapContainsSentinelPandemoniumWorlds:'explicit.stat_70969043',
 MapContainsSentinelApexWorlds:'explicit.stat_2788592463',
 MapContainsSentinelStalkerWorlds:'explicit.stat_2712450522',
 MapContainsDeliriumMirrorWorlds:'explicit.stat_2398157267',
 MapContainsWildwoodWorlds:'explicit.stat_1975119765'
};
const query=w=>JSON.parse(new URL(w.buildTradeUrl()).searchParams.get('q')).query;

test('all configured map trade IDs exist in the official trade snapshot',()=>{
 const read=name=>JSON.parse(fs.readFileSync(path.join(root,'data/poe1',name+'.json'),'utf8'));
 const ids=new Set(read('trade-stats').result.flatMap(group=>group.entries).map(entry=>entry.id));
 for(const mod of Object.values(read('map-mods'))) {
  for(const id of mod.tradeStatIds||[])if(id)assert.ok(ids.has(id),`${mod.mod}: ${id}`);
 }
 const filters=read('trade-filters').result.find(group=>group.id==='map_filters').filters;
 assert.ok(filters.some(filter=>filter.id==='map_bonus'));
 assert.ok(ids.has('pseudo.pseudo_map_more_scarab_drops'));
});

test('3.30 contents use matched trade IDs for both wanted and NG in Japanese and English',async()=>{
 const site=await loadSite(root,'poe1');
 try {
  const w=site.window,mods=w.eval('mapModList');
  for(const language of ['ja','en']) {
   w.setLanguage(language);
   for(const [source,id] of Object.entries(expected)) {
    const key=Object.keys(mods).find(k=>mods[k].sourceIds.includes(source));
    assert.deepEqual(Array.from(mods[key].tradeStatIds),[id]);
    for(const state of ['wanted','ng']) {
     w.eval(`checkedMods = new Map([[${JSON.stringify(key)}, '${state}']])`);
     const group=query(w).stats.find(g=>g.type===(state==='ng'?'not':'count'));
     assert.ok(group.filters.some(f=>f.id===id));
     if(state==='wanted')assert.equal(group.value.min,1);
    }
   }
  }
  assert.deepEqual(site.errors,[]);
 } finally {site.close();}
});

test('Atlas Drops use map_bonus and Threads retain their current pseudo ID in both yield modes',async()=>{
 const site=await loadSite(root,'poe1');
 try {
  const w=site.window,doc=w.document;w.eval('checkedMods = new Map()');
  doc.getElementById('itemQuantityInput').value='95';doc.getElementById('packSizeInput').value='20';
  doc.getElementById('rarityInput').value='30';doc.getElementById('scarabInput').value='80';doc.getElementById('currencyInput').value='50';
  for(const any of [false,true]) {
   doc.getElementById('searchAnyRadio').checked=any;doc.getElementById('searchAllRadio').checked=!any;
   const q=query(w),filters=q.filters.map_filters.filters;
   assert.equal(filters.map_bonus.min,95);assert.equal(filters.map_iiq,undefined);
   assert.equal(filters.map_packsize.min,20);assert.equal(filters.map_iir.min,30);
   const group=q.stats.find(g=>g.type===(any?'count':'and')&&g.filters.some(f=>f.id==='pseudo.pseudo_map_more_scarab_drops'));
   assert.equal(group.filters.find(f=>f.id==='pseudo.pseudo_map_more_scarab_drops').value.min,80);
   if(any)assert.equal(group.value.min,1);
  }
 } finally {site.close();}
});

test('content choices enter trade OR groups, deduplicate wanted Mods, and never require all Beyond variants',async()=>{
 const site=await loadSite(root,'poe1');
 try {
  const w=site.window,doc=w.document;
  w.eval('checkedMods = new Map([["エリアにミラージュが出現する","wanted"]])');
  w.setMapHighlights(['mirage','wildwood']);
  let group=query(w).stats.find(g=>g.type==='count');
  assert.deepEqual(group.filters.map(f=>f.id).sort(),[expected.MapContainsMirageWorlds,expected.MapContainsWildwoodWorlds].sort());
  w.eval('checkedMods = new Map()');w.setMapHighlights(['beyond','sentinel']);
  doc.getElementById('minModCountInput').value='';doc.getElementById('maxModCountInput').value='';
  doc.getElementById('wantedModModeSelect').value='all';
  const q=query(w);group=q.stats.find(g=>g.type==='count');
  assert.equal(group.filters.length,6);assert.equal(group.value.min,1);
  assert.equal(q.stats.some(g=>g.type==='and'&&g.filters.some(f=>Object.values(expected).includes(f.id))),false);
  assert.deepEqual(site.errors,[]);
 } finally {site.close();}
});

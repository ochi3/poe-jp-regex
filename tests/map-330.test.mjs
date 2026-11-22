import assert from 'node:assert/strict';
import test from 'node:test';
import path from 'node:path';
import {loadSite} from './helpers/site.mjs';
const root=path.resolve(import.meta.dirname,'..');

test('PoE1 new map mods generate matching Japanese and English regex; Atlas Drops sort and badges use new values',async()=>{
 const site=await loadSite(root,'poe1');
 try {
  const w=site.window,doc=w.document;
  w.eval('checkedMods = new Map()');
  for(const language of ['ja','en']) {
   w.eval(`currentLanguage = '${language}'`);
   w.updateModList();
   const item=[...doc.querySelectorAll('#ModList .effect-item')].find(el=>el.dataset.modKey==='エリアにミラージュが出現する');
   assert.ok(item);
   assert.match(item.textContent,/アトラスドロップ 13/);
   item.click();w.updateCombinedRegex();
   const pattern=doc.getElementById('ModListResult').textContent.replaceAll('"','').replace(/^!/, '');
   assert.ok(new RegExp(pattern,'i').test(language==='ja'?'エリアにミラージュが出現する':'Area contains a Mirage'));
   w.eval('checkedMods = new Map()');
  }
  doc.getElementById('modSortSelect').value='quantity_desc';w.updateModList();
  const values=[...doc.querySelectorAll('#ModList .qty-badge')].map(el=>Number(el.textContent.match(/\d+/)[0]));
  assert.ok(values.length>20);
  assert.deepEqual(values,[...values].sort((a,b)=>b-a));
  const poison=Object.entries(w.eval('mapModList')).find(([,m])=>m.sourceIds.includes('MapUberModPoison'));
  assert.ok(poison[0].includes('モンスターによる全てのダメージ'));
  assert.ok(poison[1].mod.includes('モンスターのヒットによる全てのダメージ'));
  const saved=w.generateMapRegexFromProfile({mods:[[poison[0],'ng']],settings:{mapTierChecked:true}});
  assert.ok(saved.includes(poison[1].engRegex));
  assert.deepEqual(site.errors,[]);
 } finally {site.close();}
});

test('PoE1 minimum search matches 3.30 Atlas Drops and Threads in either language',async()=>{
 const site=await loadSite(root,'poe1');
 try {
  const w=site.window,doc=w.document;
  w.eval('checkedMods = new Map()');
  for(const [language,atlas,threads] of [['ja','アトラスドロップ: +','スレッド量が上昇: +'],['en','Atlas Drops: +','More Threads: +']]) {
   w.eval(`currentLanguage = '${language}'`);
   for(const [id,label] of [['itemQuantityInput',atlas],['scarabInput',threads]]) {
    doc.getElementById('itemQuantityInput').value='';doc.getElementById('scarabInput').value='';
    doc.getElementById(id).value='80';w.updateCombinedRegex();
    const pattern=doc.getElementById('combinedRegexOutput').textContent.replaceAll('"','').trim();
    const regex=new RegExp(pattern,'i');
    assert.equal(regex.test(label+'80%'),true,pattern);
    assert.equal(regex.test(label+'79%'),false,pattern);
   }
  }
 } finally {site.close();}
});

test('PoE1 trade still rejects an unmapped Mod instead of omitting it',async()=>{
 const site=await loadSite(root,'poe1');
 try {
  const w=site.window,alerts=[];w.alert=message=>alerts.push(message);
  w.eval('mapModList["エリアにミラージュが出現する"].tradeStatIds = []; checkedMods = new Map([["エリアにミラージュが出現する","wanted"]])');
  assert.equal(w.buildTradeUrl(),null);assert.equal(alerts.length,1);
  w.eval('checkedMods = new Map()');w.setMapHighlights(['mirage']);
  assert.equal(w.buildTradeUrl(),null);assert.equal(alerts.length,2);
 } finally {site.close();}
});

import assert from 'node:assert/strict';
import test from 'node:test';
import path from 'node:path';
import {loadSite} from './helpers/site.mjs';
const root=path.resolve(import.meta.dirname,'..');
const output=w=>w.document.getElementById('combinedRegexOutput').textContent;

test('content choices form one positive OR condition while retaining NG and numeric conditions',async()=>{
 const site=await loadSite(root,'poe1');
 try {
  const w=site.window;
  w.eval('checkedMods = new Map([[Object.keys(mapModList)[0], "ng"]])');
  w.document.getElementById('packSizeInput').value='20';w.updateCombinedRegex();
  const original=output(w);
  const ng=w.document.getElementById('ModListResult').textContent;
  w.setMapHighlights(['mirage','delirium','wildwood']);w.updateCombinedRegex();
  assert.equal(output(w),original.replace(ng,ng+' ージュ|ムの鏡|ディアン'));
  assert.equal(w.document.getElementById('charCount').textContent,`文字数: ${output(w).length}`);
  assert.ok(w.document.getElementById('ModListResult').textContent.startsWith('"!'));
  w.setMapHighlights([]);w.updateCombinedRegex();assert.equal(output(w),original);
  assert.deepEqual(site.errors,[]);
 } finally {site.close();}
});

test('right-clicked wanted Mods are quoted together with their content OR alternatives',async()=>{
 const site=await loadSite(root,'poe1');
 try {
  const w=site.window,mods=w.eval('mapModList');
  const mirage=Object.keys(mods).find(k=>mods[k].sourceIds.includes('MapContainsMirageWorlds'));
  w.eval(`checkedMods = new Map([[${JSON.stringify(mirage)}, 'wanted']])`);
  w.setMapHighlights(['mirage','wildwood']);w.updateCombinedRegex();
  assert.equal(output(w),'"ージュ|ディアン"');
  w.setMapHighlights([]);w.updateCombinedRegex();assert.equal(output(w),'"ージュ"');
  const beyond=Object.keys(mods).find(k=>mods[k].sourceIds.includes('MapContainsBeyondPaleFactionWorlds'));
  assert.ok(/\s/.test(mods[beyond].engRegex));
  w.eval(`currentLanguage = 'en'; checkedMods = new Map([[${JSON.stringify(beyond)}, 'wanted']])`);
  w.setMapHighlights(['mirage']);w.updateCombinedRegex();
  assert.equal(output(w),`"${mods[beyond].engRegex}|irag"`);
 } finally {site.close();}
});

test('all content choices match game descriptions in both languages without unquoted spaces',async()=>{
 const site=await loadSite(root,'poe1');
 try {
  const w=site.window;
  const cases=[['mirage',['MapContainsMirageWorlds']],['delirium',['MapContainsDeliriumMirrorWorlds']],['wildwood',['MapContainsWildwoodWorlds']],['beyond',['MapContainsBeyondPaleFactionWorlds','MapContainsBeyondFleshFactionWorlds','MapContainsBeyondDemonFactionWorlds']],['sentinel',['MapContainsSentinelPandemoniumWorlds','MapContainsSentinelApexWorlds','MapContainsSentinelStalkerWorlds']]];
  for(const lang of ['ja','en']) {
   w.eval(`currentLanguage = '${lang}'`);w.eval('checkedMods = new Map()');
   for(const [choice,ids] of cases) {
    w.setMapHighlights([choice]);w.updateCombinedRegex();
    const regex=output(w);assert.ok(!/["\s]/.test(regex));
    for(const id of ids) {
     const mod=Object.values(w.eval('mapModList')).find(m=>m.sourceIds.includes(id));
     assert.ok(new RegExp(regex,'i').test(lang==='ja'?mod.mod:mod.engMod),`${choice}: ${id}`);
    }
   }
  }
 } finally {site.close();}
});

test('highlight selections survive reload and profiles; preview preserves live selections; reset clears them',async()=>{
 const site=await loadSite(root,'poe1');
 try {
  const w=site.window;
  w.setMapHighlights(['mirage','sentinel']);w.saveInputState();
  const state=w.localStorage.getItem('inputState');
  const restored=await loadSite(root,'poe1',{inputState:state});
  try {assert.deepEqual(Array.from(restored.window.getMapHighlights()),['mirage','sentinel']);} finally {restored.close();}
  w.document.getElementById('profileName').value='追加ハイライト';w.saveProfile();
  const profile=JSON.parse(w.localStorage.getItem('poeProfiles'))['追加ハイライト'];
  assert.deepEqual(profile.settings.highlightContents,['mirage','sentinel']);
  w.setMapHighlights(['beyond']);
  const preview=w.generateMapRegexFromProfile(profile);assert.ok(preview.endsWith('ージュ|センチネル'));
  assert.deepEqual(Array.from(w.getMapHighlights()),['beyond']);
  assert.ok(!w.generateMapRegexFromProfile({mods:[],settings:{}}).includes('召喚者'));
  assert.deepEqual(Array.from(w.getMapHighlights()),['beyond']);
  w.document.getElementById('profileList').value='追加ハイライト';w.loadProfile();
  assert.deepEqual(Array.from(w.getMapHighlights()),['mirage','sentinel']);
  assert.ok(output(w).endsWith('ージュ|センチネル'));
  w.resetAll();assert.deepEqual(Array.from(w.getMapHighlights()),[]);
  assert.equal(w.localStorage.getItem('inputState'),null);
  assert.ok(!output(w).includes('ミラージュ'));
  w.setMapHighlights(['unknown','[']);assert.deepEqual(Array.from(w.getMapHighlights()),[]);
  assert.deepEqual(site.errors,[]);
 } finally {site.close();}
});

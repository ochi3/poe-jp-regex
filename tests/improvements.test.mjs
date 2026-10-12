import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import test from 'node:test';
import ts from 'typescript';
import {fileURLToPath} from 'node:url';
import {loadSite} from './helpers/site.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
test('TypeScript projects isolate game globals and exclude backups', () => {
  const solution=JSON.parse(fs.readFileSync(path.join(root,'tsconfig.json'),'utf8'));
  assert.deepEqual(solution.files,[]);
  for(const game of ['poe1','poe2']) {
    const configPath=path.join(root,'src',game,'tsconfig.json');
    const config=ts.readConfigFile(configPath,ts.sys.readFile);
    const parsed=ts.parseJsonConfigFileContent(config.config,ts.sys,path.dirname(configPath));
    assert.deepEqual(parsed.errors,[]);
    assert.ok(parsed.fileNames.length>20);
    assert.ok(parsed.fileNames.every(file=>!file.includes('/archive/')&&!file.includes(game==='poe1'?'/poe2/':'/poe1/')));
  }
});
for(const game of ['poe1','poe2']) {
  test(`${game}: malformed storage retains valid profiles and original backup`,async()=>{
    const key=game==='poe1'?'poeProfiles':'poe2_poeProfiles';
    const good={mods:[['test','ng']],settings:{itemQuantity:'12'},customMetadata:{version:1}};
    const raw=JSON.stringify({good,bad:null});
    const site=await loadSite(root,game,{[key]:raw},'#saved');
    try {
      const w=site.window;
      assert.deepEqual(site.errors,[]);
      assert.deepEqual(JSON.parse(JSON.stringify(w.readStoredJson(key))),{good});
      assert.equal(w.localStorage.getItem(key),raw);
      assert.equal(w.writeStoredJson(key,{good}),true);
      assert.equal(w.localStorage.getItem(key+'__invalid_backup'),raw);
      assert.deepEqual(JSON.parse(w.localStorage.getItem(key)),{good});
      for(const [suffix,value] of [['inputState','null'],['searchModeState','[]'],['modCheckboxState','{"x":true}']]) {
        const stateKey=(game==='poe1'?'':'poe2_')+suffix;
        w.localStorage.setItem(stateKey,value);
        assert.deepEqual(JSON.parse(JSON.stringify(w.readStoredJson(stateKey))),{});
      }
      const prototype=Object.getPrototypeOf(w.localStorage), original=prototype.setItem;
      prototype.setItem=()=>{throw new Error('QuotaExceededError');};
      assert.equal(w.writeStoredJson(key,{replacement:good}),false);
      prototype.setItem=original;
      assert.deepEqual(JSON.parse(w.localStorage.getItem(key)),{good});
    } finally {site.close();}
  });
}
test('all catalogs sort the visible names in either language and preserve selection',async()=>{
 const site=await loadSite(root,'poe1');
 try {
  for(const lang of ['en','ja']) {
   site.window.setLanguage(lang);
   for(const [name,sort] of [['beast','sortBeasts'],['scarab','sortScarabs'],['essence','sortEssences'],['tattoo','sortTattoos'],['runegraft','sortRunegrafts']]) {
    const checkbox=site.window.document.querySelector('.'+name+'-item input');
    const selectedId=checkbox.id;
    checkbox.checked=true;
    checkbox.dispatchEvent(new site.window.Event('change',{bubbles:true}));
    site.window[sort]('name');
    assert.equal(site.window.document.getElementById(selectedId).checked,true);
    const names=[...site.window.document.querySelectorAll(`.${name}-item .${name==='beast'?'beast':'scarab'}-name`)].map(el=>el.textContent);
    const expected=[...names].sort((a,b)=>a.localeCompare(b,lang));
    // The second language keeps the current name sort and toggles descending.
    assert.deepEqual(names,lang==='en'?expected:expected.reverse());
   }
  }
 } finally {site.close();}
});
test('profile imports validate the complete file before replacing saved profiles',async()=>{
 const good={mods:['legacy-id'],settings:{searchMode:'any'},customMetadata:{version:2}};
 const site=await loadSite(root,'poe1',{poeProfiles:JSON.stringify({existing:good})});
 try {
  const w=site.window;
  const importText=async text=>{
   w.importProfiles({target:{files:[new w.File([text],'profiles.json',{type:'application/json'})]}});
   await new Promise(resolve=>setTimeout(resolve,30));
  };
  w.importProfiles({target:{files:[]}});
  for(const text of ['{broken','null','{"bad":{"mods":123}}','{"bad":{"mods":[],"settings":{"searchMode":"\"["}}}']) {
   await importText(text);
   assert.deepEqual(JSON.parse(w.localStorage.getItem('poeProfiles')),{existing:good});
  }
  await importText(JSON.stringify({imported:good}));
  assert.deepEqual(JSON.parse(w.localStorage.getItem('poeProfiles')),{imported:good});
  assert.ok([...w.document.querySelector('#profileList').options].some(option=>option.value==='imported'));
  assert.deepEqual(site.errors,[]);
 } finally {site.close();}
});
test('a failed profile save restores the editor dictionary and does not run save hooks',async()=>{
 const good={mods:[],settings:{searchMode:'any'}};
 const site=await loadSite(root,'poe1',{poeProfiles:JSON.stringify({existing:good})});
 try {
  const w=site.window;
  w.document.querySelector('#profileName').value='unsaved';
  const prototype=Object.getPrototypeOf(w.localStorage),original=prototype.setItem;
  prototype.setItem=()=>{throw new Error('QuotaExceededError');};
  assert.equal(w.saveProfile(),false);
  prototype.setItem=original;
  await new Promise(resolve=>setTimeout(resolve,180));
  w.updateProfileList();
  assert.equal([...w.document.querySelector('#profileList').options].some(option=>option.value==='unsaved'),false);
  assert.deepEqual(JSON.parse(w.localStorage.getItem('poeProfiles')),{existing:good});
 } finally {site.close();}
});

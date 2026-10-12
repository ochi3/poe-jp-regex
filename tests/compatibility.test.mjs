import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import {loadSite,exercise} from './helpers/site.mjs';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
for(const game of ['poe1','poe2']) {
  test(`${game}: matches the pre-migration behavior fixtures`, async()=>{
    const expected=JSON.parse(fs.readFileSync(path.join(root,`tests/fixtures/${game}.json`),'utf8'));
    const site=await loadSite(root,game);
    try {
      assert.deepEqual(site.errors,[]);
      assert.deepEqual(await exercise(site,game),expected);
      assert.deepEqual(site.errors,[]);
    } finally {site.close();}
  });

  for(const tab of ['saved','vendor','itemTrans',game==='poe1'?'chart':'tablet']) {
    test(`${game}: directly opens #${tab} with existing saved data`,async()=>{
      const fixture=JSON.parse(fs.readFileSync(path.join(root,`tests/fixtures/${game}.json`),'utf8'));
      const site=await loadSite(root,game,fixture.storage,`#${tab}`);
      try {
        if(tab==='saved') await new Promise(resolve=>setTimeout(resolve,220));
        assert.deepEqual(site.errors,[]);
        const w=site.window;
        const content=w.document.getElementById(`${tab}Content`);
        assert.ok(content,`${tab} content exists`);
        assert.notEqual(content.style.display,'none');
        assert.equal(w.location.hash,`#${tab}`);
        assert.ok(w.document.querySelectorAll('#ModList .effect-item').length>0);
        if(tab==='saved') assert.equal(w.document.querySelectorAll('.profile-card').length,1);
      } finally {site.close();}
    });
  }

  test(`${game}: item translation and inline event callbacks remain available`,async()=>{
    const site=await loadSite(root,game);
    try {
      const w=site.window;
      const engine=w.JpPoeUtils||w.JpPoe2Utils;
      const text='アイテムクラス: カレンシー\nレアリティ: カレンシー\nカオスオーブ';
      const translated=engine.translateItemTextAuto(text).result;
      w.document.getElementById('itemTransInput').value=text;
      w.translateItemText();
      assert.equal(w.document.getElementById('itemTransOutput').value,translated);
      w.clearItemTransFields();
      assert.equal(w.document.getElementById('itemTransInput').value,'');
      const source=fs.readFileSync(path.join(root,`${game}.html`),'utf8');
      // Verify public callbacks without submitting feedback or opening external tabs.
      const callbacks=[...source.matchAll(/\bon(?:click|change|input|load)="([^"]*)"/g)].flatMap(match=>[...match[1].matchAll(/(?<![.\w])([a-zA-Z_$][\w$]*)\(/g)].map(m=>m[1])).filter(name=>!['if','Number','String'].includes(name));
      for(const name of new Set(callbacks)) assert.equal(typeof w[name],'function',`callback ${name}`);
      assert.deepEqual(site.errors,[]);
    } finally {site.close();}
  });

  test(`${game}: profile-save hooks retain their global callback behavior`,async()=>{
    const site=await loadSite(root,game);
    try {
      const w=site.window;
      w.hookSaveProfiles();
      const hooked=w.saveProfile;
      assert.equal(hooked._hooked,true);
      w.hookSaveProfiles();
      assert.equal(w.saveProfile,hooked,'hook is not installed twice');
      w.document.getElementById('profileName').value='保存フック';
      w.saveProfile();
      await new Promise(resolve=>setTimeout(resolve,150));
      const profiles=JSON.parse(w.localStorage.getItem(game==='poe1'?'poeProfiles':'poe2_poeProfiles'));
      assert.equal(profiles['保存フック'].timestamp,1780000000000);
      const order=JSON.parse(w.localStorage.getItem(game==='poe1'?'savedRegexOrder':'poe2_savedRegexOrder'));
      assert.deepEqual(order,[{name:'保存フック',type:'map'}]);
      assert.equal(w.document.querySelectorAll('.profile-card').length,1);
      assert.deepEqual(site.errors,[]);
    } finally {site.close();}
  });
}

test('PoE2: trade settings tolerate controls omitted from the HTML',async()=>{
  const site=await loadSite(root,'poe2');
  try {
    assert.equal(site.window.document.getElementById('deliriumMinInput'),null);
    assert.doesNotThrow(()=>site.window.loadTradeSettings());
    assert.doesNotThrow(()=>site.window.saveTradeSettings());
    assert.deepEqual(site.errors,[]);
  } finally {site.close();}
});

test('PoE1: an old trade-links bookmark opens the map tab',async()=>{
  const site=await loadSite(root,'poe1',{},'#trade');
  try {
    assert.equal(site.window.location.hash,'#map');
    assert.notEqual(site.window.document.getElementById('mapContent').style.display,'none');
    assert.deepEqual(site.errors,[]);
  } finally {site.close();}
});

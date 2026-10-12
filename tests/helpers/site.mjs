import fs from 'node:fs';
import path from 'node:path';
import { JSDOM, ResourceLoader, VirtualConsole } from 'jsdom';

export async function loadSite(root, game, storage = {}, hash = '') {
  const errors = [];
  const requests = [];
  const clipboard = [];
  class LocalResources extends ResourceLoader {
    fetch(url) {
      const u = new URL(url);
      if (u.origin !== 'https://test.local') return null;
      const relative = decodeURIComponent(u.pathname.replace('/poe-jp-regex/', ''));
      const target = path.resolve(root, relative);
      if (!target.startsWith(root + path.sep)) throw new Error('Resource escaped root');
      requests.push(relative);
      if (!fs.existsSync(target)) { errors.push(`Missing resource: ${relative}`); return null; }
      return Promise.resolve(fs.readFileSync(target));
    }
  }
  const console = new VirtualConsole();
  console.on('jsdomError', e => {
    if (e.type !== 'not-implemented') errors.push(e.cause?.stack || e.message);
  });
  const dom = new JSDOM(fs.readFileSync(path.join(root, `${game}.html`), 'utf8'), {
    url: `https://test.local/poe-jp-regex/${game}.html${hash}`,
    runScripts: 'dangerously', resources: new LocalResources(), virtualConsole: console,
    pretendToBeVisual: true,
    beforeParse(window) {
      window.Date.now = () => 1780000000000;
      window.alert = () => {};
      window.confirm = () => true;
      window.scrollTo = () => {};
      window.open = () => null;
      window.document.execCommand = () => true;
      Object.defineProperty(window.navigator, 'clipboard', {value: {writeText: async text => {clipboard.push(text);}}});
      for (const [key,value] of Object.entries(storage)) window.localStorage.setItem(key,value);
      window.fetch = async url => {
        const u = new URL(url, window.location.href);
        if (u.origin !== 'https://test.local') throw new Error(`External request in test: ${u}`);
        const relative = decodeURIComponent(u.pathname.replace('/poe-jp-regex/', ''));
        requests.push(relative);
        const target = path.resolve(root,relative);
        const exists = target.startsWith(root+path.sep) && fs.existsSync(target);
        return {ok: exists, status: exists ? 200 : 404, json: async () => JSON.parse(fs.readFileSync(target,'utf8'))};
      };
    }
  });
  await new Promise(resolve => dom.window.addEventListener('load', resolve, {once:true}));
  await new Promise(resolve => setTimeout(resolve,50));
  return {dom, window:dom.window, errors, requests, clipboard, close:()=>dom.window.close()};
}

export function savedStorage(window) {
  return Object.fromEntries(Object.keys(window.localStorage).sort().map(k=>[k,window.localStorage.getItem(k)]));
}

export async function exercise(site, game) {
  const {window:w} = site;
  const doc = w.document;
  const output = id => doc.getElementById(id)?.textContent || '';
  const result = {initial:output('combinedRegexOutput')};
  result.ranges = [-1,0,1,9,10,11,19,20,90,91,99,100,101,109,110,199,200,999,1000,'bad','15.5',''].flatMap(n => [false,true].map(opt => w.getFixedRangeRegex(n, '数量.*', opt)));
  result.text = ['', '一つ', '#%|##%', '(##)%|#%'].flatMap(t => ['', '1','10','10|20'].map(v=>w.formatModText(t,v)));
  const keys = Object.keys(w.eval('mapModList'));
  w.eval(`checkedMods.set(${JSON.stringify(keys[0])}, 'ng'); checkedMods.set(${JSON.stringify(keys[3])}, 'wanted');`);
  doc.getElementById('itemQuantityInput').value = '95';
  doc.getElementById('packSizeInput').value = '20';
  w.updateModList();
  w.updateCombinedRegex();
  result.selectedJA = output('combinedRegexOutput');
  result.tradeJA = w.buildTradeUrl();
  doc.getElementById('profileName').value='互換性テスト';
  w.saveProfile();
  result.mapProfile = JSON.parse(w.localStorage.getItem(game==='poe1'?'poeProfiles':'poe2_poeProfiles'));
  w.resetAll();
  doc.getElementById('profileList').value='互換性テスト';
  w.loadProfile();
  result.restored = output('combinedRegexOutput');
  w.toggleLanguage();
  result.selectedEN = output('combinedRegexOutput');
  result.tradeEN = w.buildTradeUrl();
  w.toggleLanguage();
  doc.getElementById('engRegexInput').value=w.eval(`mapModList[${JSON.stringify(keys[0])}].engRegex`);
  w.convertRegex();
  result.converted=output('jpRegexOutput');
  result.savedRegex=w.generateMapRegexFromProfile(result.mapProfile['互換性テスト']);
  if(game==='poe1') {
    for(const [variable,update,id] of [['beastlist','updateBeastRegex','beastRegexOutput'],['scarablist','updateScarabRegex','scarabRegexOutput'],['essencelist','updateEssenceRegex','essenceRegexOutput'],['tattoolist','updateTattooRegex','tattooRegexOutput'],['runegraftlist','updateRunegraftRegex','runegraftRegexOutput']]) {
      const state={beastlist:'checkedBeasts',scarablist:'checkedScarabs',essencelist:'checkedEssences',tattoolist:'checkedTattoos',runegraftlist:'checkedRunegrafts'}[variable];
      w.eval(`Object.keys(${variable}).slice(0,3).forEach(key=>${state}.add(key));`);
      w[update](); result[variable]=output(id);
    }
    await w.loadFlaskMods();
    await w.loadItemMods();
    result.affixes=w.eval('({flasks:rawFlaskMods.length,items:rawItemMods.length})');
    result.pob=w.parsePobBuildXml('<PathOfBuilding><Build className="Witch" ascendClassName="Elementalist" level="90"/><Skills activeSkillSet="1"><SkillSet id="1" title="Main"><Skill><Gem nameSpec="Fireball" skillId="Fireball" level="20" quality="20" enabled="true"/></Skill></SkillSet></Skills></PathOfBuilding>');
    w.switchTab('vendorContent');
    await w.initializeVendor();
    // Exercise persistence explicitly rather than relying on delayed UI events.
    w.saveVendorSettings();
    result.vendor=w.generateVendorRegexFromProfile({settings:{colors:{rgb:true},movement:{ten:true},weapon:{wand:true},selectedGems:[]}});
    w.switchTab('chartContent');
    result.chart=output('chartCombinedRegexOutput');
  } else {
    w.eval('Object.keys(tabletModList).slice(0,3).forEach(key=>tabletCheckedMods.add(key));');
    w.updateTabletModList(); w.updateTabletCombinedRegex();
    result.tablet=output('tabletCombinedRegexOutput');
    w.switchTab('vendorContent'); await w.initializeVendor();
    result.vendor=w.generateVendorRegexFromProfile({settings:{selected:{movementSpeed:true},weapon:{},excludeWeapons:{}}});
  }
  w.switchTab('savedContent');
  w.updateSavedRegexDisplay();
  result.cards=doc.querySelectorAll('.profile-card').length;
  await w.copyToClipboard();
  await Promise.resolve();
  result.clipboard=site.clipboard;
  result.storage=savedStorage(w);
  return JSON.parse(JSON.stringify(result));
}

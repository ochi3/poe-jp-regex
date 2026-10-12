import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
import test from 'node:test';
import ts from 'typescript';
import {JSDOM} from 'jsdom';
import {validateData} from '../tooling/data/validate.mjs';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const manifest=JSON.parse(fs.readFileSync(path.join(root,'data/manifest.json'),'utf8'));
for(const game of ['poe1','poe2']) {
  test(`${game}: HTML references existing bundles, styles and engines`,()=>{
    const doc=new JSDOM(fs.readFileSync(path.join(root,`${game}.html`),'utf8')).window.document;
    for(const el of doc.querySelectorAll('script[src],link[rel="stylesheet"]')) {
      const url=el.getAttribute('src')||el.getAttribute('href');
      if(/^https?:/.test(url)) continue;
      assert.ok(fs.existsSync(path.join(root,url.split('?')[0])),url);
      assert.ok(!/^(?:scripts|poe2_scripts)\//.test(url));
    }
    assert.equal(doc.querySelector('a[href*="patreon.com"]'),null);
    assert.ok(doc.querySelector('a[href="https://ko-fi.com/ochi3c"]'));
    if(game==='poe1') {
      assert.equal(doc.getElementById('tradeContent'),null);
      assert.equal(doc.querySelector('a[href="#trade"]'),null);
      assert.ok(doc.getElementById('tradeLinkBtn'),'generated trade links remain available');
    }
    doc.defaultView.close();
  });
  test(`${game}: generated data bundles match the JSON source`,()=>{
    const context=vm.createContext({});
    vm.runInContext(fs.readFileSync(path.join(root,`assets/js/data-${game}.js`),'utf8'),context);
    for(const {path:dataPath,variable} of manifest[game]) {
      const expected=JSON.parse(fs.readFileSync(path.join(root,dataPath),'utf8'));
      const actual=JSON.parse(vm.runInContext(`JSON.stringify(${variable})`,context));
      assert.deepEqual(actual,expected,dataPath);
      assert.ok(Object.keys(expected).length>0);
      assert.doesNotThrow(()=>validateData(expected,variable,dataPath));
    }
  });
  test(`${game}: the DOM contract matches actual HTML element types`,()=>{
    const doc=new JSDOM(fs.readFileSync(path.join(root,`${game}.html`),'utf8')).window.document;
    const declaration=fs.readFileSync(path.join(root,`src/${game}/types/elements.d.ts`),'utf8');
    const source=ts.createSourceFile('elements.d.ts',declaration,ts.ScriptTarget.Latest,true);
    const contract=new Map(source.statements[0].members.map(m=>[m.name.text,m.type.getText(source)]));
    for(const el of doc.querySelectorAll('[id]')) {
      assert.ok(contract.has(el.id),`Missing DOM contract: ${el.id}`);
      const type={INPUT:'HTMLInputElement',TEXTAREA:'HTMLTextAreaElement',SELECT:'HTMLSelectElement',BUTTON:'HTMLButtonElement',FORM:'HTMLFormElement',A:'HTMLAnchorElement',IFRAME:'HTMLIFrameElement'}[el.tagName]||'HTMLElement';
      assert.equal(contract.get(el.id),type,el.id);
    }
    doc.defaultView.close();
  });
}

test('malformed generated data fails before it can become a bundle',()=>{
  assert.throws(()=>validateData({},'mapModList','test'),/Empty or invalid/);
  assert.throws(()=>validateData({bad:{mod:'bad',value:'1',Regex:12}},'mapModList','test'),/Expected string Regex/);
  assert.throws(()=>validateData({bad:{mod:'bad',value:'1',Regex:'x',tradeStatIds:[1]}},'mapModList','test'),/Invalid tradeStatIds/);
});

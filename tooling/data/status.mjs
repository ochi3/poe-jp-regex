import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
export function jsonFiles(dir) {
  return fs.existsSync(dir)?fs.readdirSync(dir,{withFileTypes:true}).flatMap(entry=>entry.isDirectory()?jsonFiles(path.join(dir,entry.name)):entry.name.endsWith('.json')?[path.join(dir,entry.name)]:[]):[];
}
const hash=value=>crypto.createHash('sha256').update(JSON.stringify(value)).digest('hex');
function categorySources(root,game) {
  const data=`data/${game}/`;
  const directory=name=>jsonFiles(path.join(root,data,name)).map(file=>path.relative(root,file).replaceAll(path.sep,'/'));
  const candidates={map:[data+'map-mods.json',data+'trade-stats.json',`src/${game}/features/trade/query.ts`],chart:[data+'chart-mods.json'],tablet:[data+'tablet-mods.json'],
    item:directory('items'),flask:directory('flasks'),
    beast:[data+'beastlist.json'],scarab:[data+'scarablist.json'],essence:[data+'essencelist.json'],tattoo:[data+'tattoolist.json'],runegraft:[data+'runegraftlist.json'],
    vendor:[...directory('gems'),`src/${game}/features/vendor.ts`],
    itemtrans:[`assets/vendor/${game==='poe1'?'jp-poe-utils':'jp-poe2-utils'}-translator.js`]};
  candidates.trans=[...candidates.map,'src/shared/features/regex-converter.ts'];
  return Object.fromEntries(Object.entries(candidates).map(([key,files])=>[key,files.filter(file=>fs.existsSync(path.join(root,file)))]).filter(([,files])=>files.length));
}
export function refreshDataStatus(root,now=new Date().toISOString()) {
  const target=path.join(root,'data/status.json');
  const previous=fs.existsSync(target)?JSON.parse(fs.readFileSync(target,'utf8')):{};
  const output={schemaVersion:1,games:{}};
  for(const game of ['poe1','poe2']) {
    const mods=[],prices=[],byFile=new Map();
    for(const file of jsonFiles(path.join(root,'data',game)).sort()) {
      const data=JSON.parse(fs.readFileSync(file,'utf8'));
      const name=path.relative(root,file).replaceAll(path.sep,'/');
      const strip=value=>Array.isArray(value)?value.map(strip):value&&typeof value==='object'?Object.fromEntries(Object.entries(value).filter(([key])=>key!=='chaosValue').map(([key,item])=>[key,strip(item)])):value;
      const modData=strip(data),filePrices=[];
      mods.push([name,modData]);
      const entries=Array.isArray(data)?data:Object.values(data);
      for(const [index,item] of entries.entries())if(item&&typeof item==='object'&&'chaosValue'in item){prices.push([name,index,item.chaosValue]);filePrices.push([index,item.chaosValue]);}
      byFile.set(name,{mods:modData,prices:filePrices});
    }
    const old=previous.games?.[game]||{};
    const next=(kind,values)=>{const fingerprint=hash(values);return {fingerprint,updatedAt:old[kind]?.fingerprint===fingerprint?old[kind].updatedAt:now};};
    const categories={};
    for(const [category,files]of Object.entries(categorySources(root,game))) {
      const modValues=files.map(file=>[file,byFile.get(file)?.mods??fs.readFileSync(path.join(root,file),'utf8')]);
      const priceValues=files.flatMap(file=>byFile.get(file)?.prices.map(entry=>[file,...entry])||[]);
      const oldCategory=old.categories?.[category]||{};
      const stamp=(kind,values)=>{const fingerprint=hash(values);return {fingerprint,updatedAt:oldCategory[kind]?.fingerprint===fingerprint?oldCategory[kind].updatedAt:now};};
      categories[category]={mods:stamp('mods',modValues),prices:priceValues.length?stamp('prices',priceValues):null};
    }
    output.games[game]={gameVersion:old.gameVersion||null,versionNote:old.versionNote||'',mods:next('mods',mods),prices:prices.length?next('prices',prices):null,categories};
  }
  const text=JSON.stringify(output,null,2)+'\n';
  if(!fs.existsSync(target)||fs.readFileSync(target,'utf8')!==text)fs.writeFileSync(target,text);
  return output;
}

import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
export const root=path.resolve(import.meta.dirname,'../..');
export const profiles=JSON.parse(fs.readFileSync(new URL('./jewel-profiles.json',import.meta.url),'utf8'));
export function matchingWeight(weights,tags) {
  return weights?.find(entry=>tags.has(entry.tag))?.weight ?? 0;
}
export function matchesJewel(mod,profile,variant) {
  if(mod.domain!==profile.domain||!['prefix','suffix'].includes(mod.generation_type)||mod.is_essence_only)return false;
  const tags=new Set([...profile.tags,...(variant?[variant]:[])]);
  if(matchingWeight(mod.spawn_weights,tags)<=0)return false;
  return !mod.generation_weights?.length||matchingWeight(mod.generation_weights,tags)>0;
}
export function buildJewel(profile,en,ja) {
  const grouped={prefix:{},suffix:{}};
  for(const [key,mod] of Object.entries(en)) {
    const variants=(profile.variantTags||[null]).filter(variant=>matchesJewel(mod,profile,variant));
    if(!variants.length||!mod.name||!mod.text)continue;
    const local=ja[key];
    if(!local?.name||!local?.text)throw new Error('日本語データがありません: '+key);
    const tags=new Set([...profile.tags,...(variants[0]?[variants[0]]:[])]);
    const weight=matchingWeight(mod.spawn_weights,tags);
    const family=mod.groups?.join('|')||mod.type||key;
    const entry={key,text:local.text,name:local.name,engText:mod.text,engName:mod.name,
      tag:mod.spawn_weights.find(entry=>tags.has(entry.tag))?.tag,
      generation_type:mod.generation_type,required_level:mod.required_level,weight,family,
      ...(profile.variantTags?{variantTags:variants}:{})};
    (grouped[mod.generation_type][family]??=[]).push(entry);
  }
  if(!Object.values(grouped).some(groups=>Object.keys(groups).length))throw new Error('Modが見つかりません: '+profile.type);
  return {bases:[profile.base],...(profile.variantTags?{scopeNote:'小パッシブの種類ごとに付くModが異なります。全種類の候補を表示しています。'}:{}),mods:grouped};
}
export function exportJewels(db=path.resolve(root,'../PoE-DB/data/export/repoe'),out=path.join(root,'data/poe1/items')) {
  const en=JSON.parse(fs.readFileSync(path.join(db,'global/mods.json'),'utf8'));
  const ja=JSON.parse(fs.readFileSync(path.join(db,'japanese/mods.json'),'utf8'));
  const outputs=profiles.map(profile=>[profile,buildJewel(profile,en,ja)]);
  fs.mkdirSync(out,{recursive:true});
  for(const [profile,data] of outputs) {
    fs.writeFileSync(path.join(out,profile.type+'.json'),JSON.stringify(data,null,2)+'\n');
    console.log(`${profile.label}: `+Object.values(data.mods).flatMap(groups=>Object.values(groups).flat()).length+' Mods');
  }
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url))exportJewels(process.argv[2],process.argv[3]);

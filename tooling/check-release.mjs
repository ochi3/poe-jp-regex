import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {validateData} from './data/validate.mjs';
import {jsonFiles} from './data/status.mjs';
export function checkRelease(root) {
  const errors=[];
  const inspect=(label,fn)=>{try{fn();}catch(error){errors.push(label+': '+error.message);}};
  const read=file=>JSON.parse(fs.readFileSync(path.join(root,file),'utf8'));
  const requireFile=file=>{let target=path.resolve(root,file.split(/[?#]/)[0]);if(!path.extname(target)&&fs.existsSync(target+'.html'))target+='.html';if(!target.startsWith(root+path.sep)||!fs.existsSync(target)||!fs.statSync(target).isFile())throw Error('参照先がありません: '+file);};
  inspect('manifest',()=>{
    const manifest=read('data/manifest.json');
    for(const game of ['poe1','poe2']) {
      if(!manifest[game]?.length)throw Error(game+' のmanifestがありません');
      for(const table of manifest[game])inspect(table.path,()=>{
        const data=validateData(read(table.path),table.variable,table.path);
        const fields=['mapModList','chartModList','tabletModList'].includes(table.variable)?['Regex','engRegex']:['regex'];
        for(const [key,entry]of Object.entries(data))for(const field of fields) {
          if(typeof entry[field]!=='string'||!entry[field].trim())throw Error(`${key}: ${field} が未設定です`);
          try{new RegExp(entry[field],'i');}catch(error){throw Error(`${key}: ${field} の構文エラー: ${error.message}`);}
        }
      });
    }
  });
  for(const game of ['poe1','poe2']) {
    for(const folder of ['items','flasks'])for(const file of jsonFiles(path.join(root,'data',game,folder)))inspect(path.relative(root,file),()=>{
      const data=JSON.parse(fs.readFileSync(file,'utf8'));
      for(const kind of ['prefix','suffix'])if(!data.mods?.[kind]||typeof data.mods[kind]!=='object')throw Error('接辞データがありません: '+kind);
      const mods=Object.values(data.mods).flatMap(groups=>Object.values(groups).flat());
      if(!mods.length)throw Error('Modが空です');
      for(const entry of mods)if(!entry.key||!entry.name?.trim()||!entry.text?.trim()||!entry.engName?.trim()||!entry.engText?.trim())throw Error('日英の接辞名/効果文が未設定です: '+entry.key);
    });
    inspect(game+'.html',()=>{
      const html=fs.readFileSync(path.join(root,game+'.html'),'utf8');
      for(const match of html.matchAll(/(?:src|href)=["']([^"']+)["']/g))if(!/^(?:[a-z]+:|#|\/)/i.test(match[1]))requireFile(match[1]);
    });
    for(const file of jsonFiles(path.join(root,'data',game)))inspect(path.relative(root,file),()=>{
      const data=JSON.parse(fs.readFileSync(file,'utf8'));
      const check=(value,label)=>{if(!value||typeof value!=='object')return;for(const [key,item]of Object.entries(value)){
        if(['Regex','engRegex','regex','enRegex'].includes(key)&&(!item||typeof item!=='string'||!item.trim()))throw Error(label+'/'+key+' が未設定です');
        if(item&&typeof item==='object')check(item,label+'/'+key);
      }};
      check(data,'');
    });
  }
  const sources=dir=>fs.readdirSync(dir,{withFileTypes:true}).flatMap(entry=>entry.isDirectory()?sources(path.join(dir,entry.name)):entry.name.endsWith('.ts')?[path.join(dir,entry.name)]:[]);
  if(fs.existsSync(path.join(root,'src')))for(const file of sources(path.join(root,'src'))) {
    const text=fs.readFileSync(file,'utf8');
    for(const match of text.matchAll(/["'](data\/[^"'`\n]+\.json)["']/g))inspect(path.relative(root,file),()=>requireFile(match[1]));
  }
  return errors;
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)) {
  const root=path.resolve(import.meta.dirname,'..'),errors=checkRelease(root);
  if(errors.length){console.error(errors.join('\n'));process.exitCode=1;}
  else console.log('公開前検査OK: Regex空欄・構文・JSON・日英接辞・ファイル参照');
}

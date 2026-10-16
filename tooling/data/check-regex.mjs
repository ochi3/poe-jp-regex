import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {auditRegex,auditHtml} from './regex-audit.mjs';
import {validateData} from './validate.mjs';
const root=path.resolve(import.meta.dirname,'../..');
export function runAudit({game='poe1',table='map',files=[],language='all',out=path.join(root,'archive/regex-checks')}={}) {
  if(!['poe1','poe2'].includes(game))throw new Error('--game は poe1 または poe2 を指定してください');
  if(!['ja','en','all'].includes(language))throw new Error('--lang は ja・en・all を指定してください');
  const tableNames=game==='poe1'?{map:'map-mods',chart:'chart-mods'}:{map:'map-mods',tablet:'tablet-mods'};
  if(!files.length) {
    const selected=table==='all'?Object.values(tableNames):[tableNames[table]];
    if(selected.some(name=>!name))throw new Error('このゲームで利用できない --table です');
    files=selected.map(name=>path.join(root,'data',game,name+'.json'));
  }
  const tables={};
  for(const file of files) {
    const absolute=path.resolve(file);
    tables[path.relative(root,absolute).replaceAll(path.sep,'/')]=validateData(JSON.parse(fs.readFileSync(absolute,'utf8')),'mapModList',file);
  }
  const report=auditRegex(tables,{languages:language==='all'?['ja','en']:[language]});
  fs.mkdirSync(out,{recursive:true});
  const basename=report.createdAt.replace(/[:.]/g,'-');
  for(const [extension,contents] of [['json',JSON.stringify(report,null,2)+'\n'],['html',auditHtml(report)]]) {
    fs.writeFileSync(path.join(out,basename+'.'+extension),contents);
    fs.writeFileSync(path.join(out,'latest.'+extension),contents);
  }
  console.log(`Regex ${report.summary.patterns}件 / 未設定・構文・本文不一致 ${report.summary.errors}件 / 誤一致候補あり ${report.summary.collisions}件 / 同文言への一致あり ${report.summary.sameEffect}件`);
  console.log('HTML: '+path.join(out,'latest.html'));
  console.log('JSON: '+path.join(out,'latest.json'));
  return report;
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)) {
  try {
    const args=process.argv.slice(2),options={files:[]};
    if(args.includes('--help')) {
      console.log('npm run regex:check -- [--game poe1|poe2] [--table map|chart|tablet|all] [--lang ja|en|all] [--file path.json] [--out directory] [--strict]');
    } else {
      const keys={'--game':'game','--table':'table','--lang':'language','--out':'out'};
      let strict=false;
      for(let index=0;index<args.length;index++) {
        const flag=args[index];
        if(flag==='--strict'){strict=true;continue;}
        if(!keys[flag]&&flag!=='--file')throw new Error('不明な引数: '+flag);
        const value=args[++index];if(!value||value.startsWith('--'))throw new Error('値がありません: '+flag);
        if(flag==='--file')options.files.push(value);else options[keys[flag]]=value;
      }
      const report=runAudit(options);
      if(strict&&(report.summary.errors||report.summary.collisions))process.exitCode=1;
    }
  }catch(error){console.error(error.message);process.exitCode=1;}
}

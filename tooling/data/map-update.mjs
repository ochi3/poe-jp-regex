import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {spawnSync} from 'node:child_process';
import {build,root} from '../build.mjs';
import {validateData} from './validate.mjs';
import {reviewMods,reportHtml} from './map-review.mjs';
export function filesIn(directory) {
  if(!fs.existsSync(directory))return [];
  return fs.readdirSync(directory,{withFileTypes:true}).flatMap(entry=>entry.isDirectory()?filesIn(path.join(directory,entry.name)):[path.join(directory,entry.name)]);
}
/** Restore all maintained JSON and emitted bundles if even the final build fails. */
export function applyCandidate(repo,candidate,buildSite) {
  const snapshot=new Map([...filesIn(path.join(repo,'data')),...filesIn(path.join(repo,'assets/js'))].map(file=>[file,fs.readFileSync(file)]));
  try {
    for(const file of filesIn(path.join(candidate,'data'))) {
      const target=path.join(repo,path.relative(candidate,file));
      fs.mkdirSync(path.dirname(target),{recursive:true});fs.copyFileSync(file,target);
    }
    buildSite();
  } catch(error) {
    for(const file of [...filesIn(path.join(repo,'data')),...filesIn(path.join(repo,'assets/js'))])if(!snapshot.has(file))fs.unlinkSync(file);
    for(const [file,contents] of snapshot)fs.writeFileSync(file,contents);
    throw error;
  }
}
function run(command,cwd= root,env=process.env) {
  console.log(`> ${command.join(' ')}`);
  const result=spawnSync(command[0],command.slice(1),{cwd,env,stdio:'inherit',shell:false});
  if(result.error || result.status!==0)throw new Error(result.error?.message || `Command failed (${result.status}): ${command[0]}`);
}
export function updateMaps({game='poe1',source,python='python',dryRun=false,prepare=false,commands,candidatePath,repo=root,buildSite=build,generate}={}) {
  const root=repo;
  if(!['poe1','poe2'].includes(game))throw new Error('game must be poe1 or poe2');
  source ||= game==='poe1'?'poe-db':'poe2db';
  if(!['repoe',game==='poe1'?'poe-db':'poe2db'].includes(source))throw new Error('Invalid source');
  if(candidatePath&&prepare)throw new Error('--candidate cannot be combined with --prepare');
  if(prepare&&source==='repoe')throw new Error('--prepare requires local DB source');
  commands ||= [[python,[game==='poe1'?'tools/extract_map_mods.py':'tools_poe2/extract_map_mods.py','--source',source]]];
  const directory=path.join(root,'archive/map-updates',new Date().toISOString().replace(/[:.]/g,'-')+'-'+crypto.randomUUID().slice(0,8));
  fs.mkdirSync(directory,{recursive:true});
  fs.cpSync(path.join(root,'data'),path.join(directory,'before/data'),{recursive:true});
  fs.cpSync(path.join(root,'assets/js'),path.join(directory,'before/assets/js'),{recursive:true});
  const workDirectories=['scripts','poe2_scripts','item','flask','gems'];
  const preexisting=new Set(workDirectories.filter(dir=>fs.existsSync(path.join(root,dir))));
  const report={createdAt:new Date().toISOString(),game,source,dryRun,status:'generating',sources:{commands,files:[]},tables:{}};
  function saveReport() {
    fs.writeFileSync(path.join(directory,'report.json'),JSON.stringify(report,null,2)+'\n');
    fs.writeFileSync(path.join(directory,'report.html'),reportHtml(report));
    for(const ext of ['json','html'])fs.copyFileSync(path.join(directory,`report.${ext}`),path.join(root,`archive/map-updates/latest.${ext}`));
    console.log(`更新レポート: ${path.relative(root,directory)}/report.html`);
  }
  const lock=path.join(root,'.cache/map-update.lock');
  fs.mkdirSync(path.dirname(lock),{recursive:true});
  try {fs.mkdirSync(lock);}catch{throw new Error('別のマップ更新が実行中です。実行していない場合は.cache/map-update.lockを確認してください。');}
  try {
    const db=path.resolve(root,'..',game==='poe1'?'PoE-DB':'PoE2-DB');
    if(prepare) {
      // The game itself must already have finished updating.
      run(['uv','run','./main.py','prepare'],path.join(db,'data/scripts'));
      run(['uv','run','./main.py','export-repoe-mods'],path.join(db,'data/scripts'));
    }
    for(const file of ['data/export/repoe/global/mods.json','data/export/repoe/japanese/mods.json']) {
      const absolute=path.join(db,file);
      if(fs.existsSync(absolute))report.sources.files.push({path:absolute,modifiedAt:fs.statSync(absolute).mtime.toISOString(),sha256:crypto.createHash('sha256').update(fs.readFileSync(absolute)).digest('hex')});
    }
    const args=commands.flatMap(([executable,args],index)=>[...(index?['--then']:[]),executable,...args]);
    const candidate=path.join(directory,'candidate');
    if(candidatePath) {
      const input=path.resolve(candidatePath);
      const previousReport=JSON.parse(fs.readFileSync(path.join(path.dirname(input),'report.json'),'utf8'));
      if(previousReport.game!==game)throw new Error('候補のゲームと--gameが一致しません。');
      const previousData=path.join(path.dirname(input),'before/data');
      if(!fs.existsSync(previousData))throw new Error('候補の元データが見つかりません。更新レポートのcandidateフォルダを指定してください。');
      if(filesIn(previousData).length!==filesIn(path.join(root,'data')).length)throw new Error('候補作成後に本体ファイル数が変わっています。候補を作り直してください。');
      for(const file of filesIn(previousData)) {
        const live=path.join(root,'data',path.relative(previousData,file));
        if(!fs.existsSync(live)||!fs.readFileSync(file).equals(fs.readFileSync(live)))throw new Error('候補の作成後に本体データが変わっています。候補を作り直してください。');
      }
      fs.cpSync(path.join(input,'data'),path.join(candidate,'data'),{recursive:true});
      report.sources.candidate=input;
    }
    else if(generate)generate(candidate);
    else run([process.execPath,path.join(root,'tooling/data/legacy.mjs'),...args],root,{...process.env,REGEX_CANDIDATE_DIR:candidate,REGEX_NODE_PATH:process.execPath});
    for(const file of filesIn(path.join(candidate,'data'))) {
      if(!file.endsWith('.json'))throw new Error('Unexpected candidate file: '+file);
      JSON.parse(fs.readFileSync(file,'utf8'));
    }
    const manifest=JSON.parse(fs.readFileSync(path.join(root,'data/manifest.json'),'utf8'));
    for(const [entryGame,entries] of Object.entries(manifest))for(const entry of entries) {
      const after=validateData(JSON.parse(fs.readFileSync(path.join(candidate,entry.path),'utf8')),entry.variable,entry.path);
      const before=JSON.parse(fs.readFileSync(path.join(root,entry.path),'utf8'));
      if((entryGame===game || JSON.stringify(before)!==JSON.stringify(after))&&['mapModList','chartModList','tabletModList'].includes(entry.variable)) {
        const review=reviewMods(before,after);report.tables[entry.path]=review;
        console.log(`${entry.path}: 追加 ${review.counts.added} / 変更 ${review.counts.changed} / 削除 ${review.counts.removed} / ID付与 ${review.counts.identified} / 要修正 ${review.blocking.length}`);
      }
    }
    if(Object.values(report.tables).some(table=>table.blocking.length))throw new Error('新たな検証エラーがあります。候補とレポートを確認してください。本体データは変更していません。');
    if(!dryRun)applyCandidate(root,candidate,buildSite);
    report.status=dryRun?'preview':'applied';saveReport();return report;
  } catch(error) {report.status='failed';report.error=error.message;saveReport();throw error;}
  finally {
    // Only relocate working folders created by this run; never touch pre-existing ones.
    for(const name of workDirectories)if(!preexisting.has(name)&&fs.existsSync(path.join(root,name))) {
      const saved=path.join(directory,'working',name);fs.mkdirSync(path.dirname(saved),{recursive:true});
      fs.renameSync(path.join(root,name),saved);
    }
    fs.rmdirSync(lock);
  }
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)) {
  const args=process.argv.slice(2),value=flag=>args[args.indexOf(flag)+1];
  try {updateMaps({game:args.includes('--game')?value('--game'):'poe1',source:args.includes('--source')?value('--source'):undefined,python:args.includes('--python')?value('--python'):'python',dryRun:args.includes('--dry-run'),prepare:args.includes('--prepare'),candidatePath:args.includes('--candidate')?value('--candidate'):undefined,commands:args.includes('--commands')?JSON.parse(value('--commands')):undefined});}
  catch(error) {console.error(error.message);process.exitCode=1;}
}

/** Bridge for the user's existing, git-ignored tools/ and tools_poe2/ generators. */
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import {spawnSync} from 'node:child_process';
import {build,root} from '../build.mjs';
import {validateData} from './validate.mjs';

const manifest=JSON.parse(fs.readFileSync(path.join(root,'data/manifest.json'),'utf8'));
const directories=['scripts','poe2_scripts','item','flask','gems'];
const legacyPath=({path:dataPath},game)=>path.join(root,game==='poe1'?'scripts':'poe2_scripts',path.basename(dataPath,'.json').replaceAll('-','_')+'.js');
const args=process.argv.slice(2);
if(!args.length) throw new Error('Usage: npm run data:legacy -- python tools/extract_map_mods.py --source poe-db');
for(const directory of directories) if(fs.existsSync(path.join(root,directory))) throw new Error(`Legacy directory already exists: ${directory}. Preserve/import its results before retrying.`);
// Validate all input JSON before creating the working copies.
const values=Object.entries(manifest).flatMap(([game,entries])=>entries.map(entry=>({...entry,game,value:JSON.parse(fs.readFileSync(path.join(root,entry.path),'utf8'))})));
for(const directory of directories) fs.mkdirSync(path.join(root,directory));
for(const entry of values) fs.writeFileSync(legacyPath(entry,entry.game),`const ${entry.variable} = ${JSON.stringify(entry.value,null,2)};\n`);
const copies=[['data/poe1/items','item'],['data/poe1/flasks','flask'],['data/poe1/gems','gems']];
for(const [source,target] of copies) fs.cpSync(path.join(root,source),path.join(root,target),{recursive:true});
for(const name of ['trade-stats','trade-filters']) fs.copyFileSync(path.join(root,`data/poe1/${name}.json`),path.join(root,`scripts/${name.replaceAll('-','_')}.json`));

const child=spawnSync(args[0],args.slice(1),{cwd:root,stdio:'inherit',shell:false});
if(child.error||child.status!==0) {
  console.error(child.error?.message||`Generator exited with ${child.status}`);
  console.error('Working copies remain in scripts/, poe2_scripts/, item/, flask/, gems/. The data/ sources were not imported.');
  process.exitCode=child.status||1;
} else {
  // Parse every result before writing the maintained JSON files.
  const results=values.map(entry=>{
    const source=fs.readFileSync(legacyPath(entry,entry.game),'utf8');
    const json=vm.runInNewContext(`${source}\nJSON.stringify(${entry.variable})`,{},{timeout:5000});
    const value=JSON.parse(json);
    validateData(value, entry.variable, entry.path);
    return {...entry,value};
  });
  for(const {path:dataPath,value} of results) fs.writeFileSync(path.join(root,dataPath),JSON.stringify(value,null,2)+'\n');
  for(const [source,target] of copies) fs.cpSync(path.join(root,target),path.join(root,source),{recursive:true});
  for(const name of ['trade-stats','trade-filters']) fs.copyFileSync(path.join(root,`scripts/${name.replaceAll('-','_')}.json`),path.join(root,`data/poe1/${name}.json`));
  // Keep the generators' own snapshots, and remove only the working directories
  // this invocation created. Resolve and verify every target before recursive cleanup.
  for(const directory of directories) {
    const target=path.resolve(root,directory);
    if(path.dirname(target)!==root||!directories.includes(path.basename(target))) throw new Error('Unsafe cleanup target');
    if(directory==='scripts'||directory==='poe2_scripts') for(const name of fs.readdirSync(target).filter(n=>n.includes('backup')||n.includes('.before_'))) {
      const archive=path.join(root,'archive/data-generator-backups',directory);
      fs.mkdirSync(archive,{recursive:true});fs.copyFileSync(path.join(target,name),path.join(archive,name));
    }
    fs.rmSync(target,{recursive:true});
  }
  build();
}

import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { build, root } from './build.mjs';

build();
const port = Number(process.env.PORT || 5173);
const mime = {'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8','.map':'application/json; charset=utf-8','.xml':'application/xml; charset=utf-8'};
const server = http.createServer((request,response) => {
  try {
    const url = new URL(request.url,'http://localhost');
    let relative = decodeURIComponent(url.pathname).replace(/^\/poe-jp-regex\//,'/');
    if(relative==='/') relative='/index.html';
    const target = path.resolve(root, '.' + relative);
    // Serve only the files that belong to the public site.
    if(!target.startsWith(root+path.sep)||!/^\/(?:assets\/|data\/|(?:index|poe1|poe2)(?:\.html)?$|sitemap\.xml$|google[\w]+\.html$)/.test(relative)) {
      response.writeHead(404); response.end('Not found'); return;
    }
    const file = fs.existsSync(target) ? target : target+'.html';
    if(!fs.existsSync(file)||!fs.statSync(file).isFile()) {response.writeHead(404);response.end('Not found');return;}
    response.writeHead(200,{'Content-Type':mime[path.extname(file)]||'application/octet-stream','Cache-Control':'no-store'});
    fs.createReadStream(file).pipe(response);
  } catch {response.writeHead(400);response.end('Bad request');}
});
server.listen(port,'127.0.0.1',()=>console.log(`Preview: http://localhost:${port}/poe1.html (PoE2: /poe2.html)`));

// Debounce saves and rebuild after the current build finishes.
let timer;
const watcher = fs.watch(path.join(root,'src'), {recursive:true}, () => {
  clearTimeout(timer); timer=setTimeout(()=>{try {build();console.log('Reload the browser to see changes.');}catch(error){console.error(error.message);}},150);
});
const dataWatcher = fs.watch(path.join(root,'data'), {recursive:true}, () => {
  clearTimeout(timer); timer=setTimeout(()=>{try {build();}catch(error){console.error(error.message);}},150);
});
function close() {clearTimeout(timer);watcher.close();dataWatcher.close();server.close();}
process.on('SIGINT',close);
process.on('SIGTERM',close);

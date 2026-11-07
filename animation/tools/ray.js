const { chromium } = require('playwright'); const http=require('http'),fs=require('fs'),path=require('path');
const ROOT=path.join(__dirname,'..');
const server=http.createServer((q,r)=>{const p=path.join(ROOT,q.url.split('?')[0]);fs.readFile(p,(e,d)=>{if(e){r.writeHead(404);r.end();return;}r.writeHead(200,{'Content-Type':p.endsWith('.js')?'text/javascript':p.endsWith('.json')?'application/json':'text/html'});r.end(d);});});
(async()=>{await new Promise(r=>server.listen(0,'127.0.0.1',r));const b=await chromium.launch({args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});const p=await b.newPage({viewport:{width:720,height:1280}});
p.on('pageerror',e=>console.log('ERR',e.message));await p.goto(`http://127.0.0.1:${server.address().port}/index.html`);await p.waitForFunction('window.ready');await p.evaluate('window.setup()');
for(const f of process.argv.slice(2)) console.log(f, JSON.stringify(await p.evaluate(f=>window.debugRay(+f),f),null,1));await b.close();server.close();})();

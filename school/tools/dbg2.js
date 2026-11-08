const { chromium } = require('playwright'); const http=require('http'),fs=require('fs'),path=require('path');
const ROOT='/home/user/Tea/school';
const server=http.createServer((q,r)=>{const p=path.join(ROOT,decodeURIComponent(q.url.split('?')[0]));fs.readFile(p,(e,d)=>{if(e){r.writeHead(404);r.end();return;}r.writeHead(200,{'Content-Type':p.endsWith('.js')?'text/javascript':p.endsWith('.json')?'application/json':'text/html'});r.end(d);});});
(async()=>{await new Promise(r=>server.listen(0,'127.0.0.1',r));const b=await chromium.launch({args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 const p=await b.newPage({viewport:{width:1080,height:1920}}); await p.goto(`http://127.0.0.1:${server.address().port}/index.html`); await p.waitForFunction('window.ready'); await p.evaluate(()=>window.setup({ss:2}));
 await p.evaluate(()=>{window.__DBG=1;}); for (const f of [1200,1201,1232,1233,1300]) await p.evaluate(f=>window.renderFrame(f), f); console.log(JSON.stringify(await p.evaluate(()=>window.__dbg),null,0)); await b.close(); server.close();})();

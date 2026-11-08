// node tools/qa.js [step] -> build/qa.json : per-frame clipping report across the whole film
const { chromium } = require('playwright'); const http=require('http'),fs=require('fs'),path=require('path');
const ROOT=path.join(__dirname,'..'); const step=+(process.argv[2]||2);
const server=http.createServer((q,r)=>{const p=path.join(ROOT,decodeURIComponent(q.url.split('?')[0]));fs.readFile(p,(e,d)=>{if(e){r.writeHead(404);r.end();return;}r.writeHead(200,{'Content-Type':p.endsWith('.js')?'text/javascript':p.endsWith('.json')?'application/json':'text/html'});r.end(d);});});
(async()=>{await new Promise(r=>server.listen(0,'127.0.0.1',r));const b=await chromium.launch({args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 const open=async()=>{const p=await b.newPage({viewport:{width:1080,height:1920}});p.on('pageerror',e=>console.log('ERR',e.message));await p.goto(`http://127.0.0.1:${server.address().port}/index.html`);await p.waitForFunction('window.ready');const info=await p.evaluate('window.setup()');return {p,info};};
 const pages=[await open(),await open(),await open()]; const N=pages[0].info.frames; const fr=[]; for(let f=0;f<N;f+=step) fr.push(f);
 const chunk=Math.ceil(fr.length/3); const res=[];
 await Promise.all(pages.map(async({p},i)=>{for(const f of fr.slice(i*chunk,(i+1)*chunk)){const r=await p.evaluate(f=>window.clipCheck(f),f); if(r.issues.length) res.push(r);}}));
 res.sort((a,b)=>a.f-b.f); fs.writeFileSync(path.join(ROOT,'build/qa.json'),JSON.stringify(res,null,1));
 console.log(`checked ${fr.length} frames, ${res.length} with issues`); await b.close(); server.close();})();

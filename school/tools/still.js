// node tools/still.js <page> <time-seconds> <out.png> [ss]  -> one supersampled still
const { chromium } = require('playwright'); const http=require('http'),fs=require('fs'),path=require('path');
const ROOT=path.join(__dirname,'..'); const [page,tsec,out,ss]=process.argv.slice(2);
const server=http.createServer((q,r)=>{const p=path.join(ROOT,decodeURIComponent(q.url.split('?')[0]));fs.readFile(p,(e,d)=>{if(e){r.writeHead(404);r.end();return;}r.writeHead(200,{'Content-Type':p.endsWith('.js')?'text/javascript':p.endsWith('.json')?'application/json':'text/html'});r.end(d);});});
(async()=>{await new Promise(r=>server.listen(0,'127.0.0.1',r));const b=await chromium.launch({args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 const p=await b.newPage({viewport:{width:1080,height:1920}}); p.on('pageerror',e=>console.log('ERR',e.message)); p.on('console',m=>m.type()==='error'&&console.log('console',m.text()));
 await p.goto(`http://127.0.0.1:${server.address().port}/${page}`); await p.waitForFunction('window.ready'); await p.evaluate(s=>window.setup({ss:s}), +(ss||3));
 const u=await p.evaluate(f=>window.renderFrame(f), Math.round(+tsec*30)); fs.writeFileSync(out, Buffer.from(u.split(',')[1],'base64')); await b.close(); server.close();})();

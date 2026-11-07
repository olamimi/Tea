const { chromium } = require('playwright');
(async () => { const [url,out,w,h]=process.argv.slice(2); const b=await chromium.launch(); const p=await b.newPage({viewport:{width:+w||2048,height:+h||1100}});
p.on('console',m=>console.log('console:',m.text())); p.on('pageerror',e=>console.log('ERR',e.message));
await p.goto(url); await p.waitForFunction('window.done',null,{timeout:120000}); await p.screenshot({path:out}); await b.close(); })();

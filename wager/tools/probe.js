// node tools/probe.js [--tl file] t1 t2 ... : segment, camera position and face size at each time
const { chromium } = require('playwright'); const http = require('http'), fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..'); let a = process.argv.slice(2); let tl = ''; if (a[0] === '--tl') { tl = '?tl=' + a[1]; a = a.slice(2); }
const server = http.createServer((q, r) => { const p = path.join(ROOT, decodeURIComponent(q.url.split('?')[0])); fs.readFile(p, (e, d) => { if (e) { r.writeHead(404); r.end(); return; } r.writeHead(200, { 'Content-Type': p.endsWith('.js') ? 'text/javascript' : p.endsWith('.json') ? 'application/json' : 'text/html' }); r.end(d); }); });
(async () => { await new Promise((r) => server.listen(0, '127.0.0.1', r));
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] }); const p = await b.newPage({ viewport: { width: 1080, height: 1920 } });
  p.on('pageerror', (e) => console.log('ERR', e.message)); await p.goto(`http://127.0.0.1:${server.address().port}/index.html${tl}`); await p.waitForFunction('window.ready');
  const info = await p.evaluate(() => window.setup({ ss: 1 }));
  if (!a.length) { info.segs.forEach((s) => console.log(s.join(' '))); }
  for (const t of a) console.log(JSON.stringify(await p.evaluate((f) => { const r = window.faceCheck(f); const c = window.__cam(); return { ...r, cam: c, pos: window.__pos(f) }; }, Math.round(+t * 30))));
  await b.close(); server.close(); })();

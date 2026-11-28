// node tools/snap.js outdir t1 t2 ... (seconds) -> outdir/sNN_<t>.jpg at ss 1, plus a contact sheet via ffmpeg afterwards
const { chromium } = require('playwright'); const http = require('http'), fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..'); const [out, ...ts] = process.argv.slice(2); fs.mkdirSync(out, { recursive: true });
const MIME = { '.js': 'text/javascript', '.html': 'text/html', '.json': 'application/json' };
const server = http.createServer((q, r) => { const p = path.join(ROOT, decodeURIComponent(q.url.split('?')[0])); fs.readFile(p, (e, d) => { if (e) { r.writeHead(404); r.end(); return; } r.writeHead(200, { 'Content-Type': MIME[path.extname(p)] || 'application/octet-stream' }); r.end(d); }); });
(async () => { await new Promise((r) => server.listen(0, '127.0.0.1', r));
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const p = await b.newPage({ viewport: { width: 1080, height: 1920 } }); p.on('pageerror', (e) => console.log('PAGE ERROR', e.message)); p.on('console', (m) => m.type() === 'error' && console.log('console', m.text()));
  await p.goto(`http://127.0.0.1:${server.address().port}/index.html`); await p.waitForFunction('window.ready'); await p.evaluate(() => window.setup({ ss: 1 }));
  for (const [i, t] of ts.entries()) { const url = await p.evaluate((f) => window.renderFrame(f), Math.round(+t * 30)); fs.writeFileSync(path.join(out, `s${String(i).padStart(2, '0')}.jpg`), Buffer.from(url.split(',')[1], 'base64')); }
  await b.close(); server.close(); })();

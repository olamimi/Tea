// node tools/view.js views.json outdir  -> one jpg per view (see window.viewSet in src/main.js)
const { chromium } = require('playwright'); const fs = require('fs'); const path = require('path'); const http = require('http');
const ROOT = path.resolve(__dirname, '..'); const views = JSON.parse(fs.readFileSync(process.argv[2], 'utf8')); const OUT = process.argv[3] || 'build/view'; fs.mkdirSync(OUT, { recursive: true });
const MIME = { '.js': 'text/javascript', '.html': 'text/html', '.json': 'application/json' };
const server = http.createServer((req, res) => { const p = path.join(ROOT, decodeURIComponent(req.url.split('?')[0])); fs.readFile(p, (e, d) => { if (e) { res.writeHead(404); res.end(); return; } res.writeHead(200, { 'Content-Type': MIME[path.extname(p)] || 'application/octet-stream' }); res.end(d); }); });
(async () => { await new Promise((r) => server.listen(0, '127.0.0.1', r));
  const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const p = await browser.newPage({ viewport: { width: 1080, height: 1920 } }); p.on('pageerror', (e) => console.log('PAGE ERROR', e.message)); p.on('console', (m) => m.type() === 'error' && console.log('console', m.text()));
  await p.goto(`http://127.0.0.1:${server.address().port}/index.html`); await p.waitForFunction('window.ready');
  for (const [i, v] of views.entries()) { const url = await p.evaluate((v) => window.viewSet(v), v); fs.writeFileSync(path.join(OUT, `${v.name || 'v' + i}.jpg`), Buffer.from(url.split(',')[1], 'base64')); console.log('view', v.name || i); }
  await browser.close(); server.close(); })();

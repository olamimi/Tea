// Render frames headlessly: node render.js [--from N] [--to N] [--step N] [--workers N] [--out dir]
const { chromium } = require('playwright');
const fs = require('fs'); const path = require('path'); const http = require('http');
const args = Object.fromEntries(process.argv.slice(2).join(' ').split('--').filter(Boolean).map((s) => { const [k, ...v] = s.trim().split(/\s+/); return [k, v]; }));
const OUT = path.resolve(args.out?.[0] || 'build/frames'); fs.mkdirSync(OUT, { recursive: true });
const ROOT = __dirname;
const MIME = { '.js': 'text/javascript', '.html': 'text/html', '.json': 'application/json' };
const server = http.createServer((req, res) => { const p = path.join(ROOT, decodeURIComponent(req.url.split('?')[0])); fs.readFile(p, (e, d) => { if (e) { res.writeHead(404); res.end(); return; } res.writeHead(200, { 'Content-Type': MIME[path.extname(p)] || 'application/octet-stream' }); res.end(d); }); });
(async () => {
  await new Promise((r) => server.listen(0, '127.0.0.1', r)); const port = server.address().port;
  const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const open = async () => { const p = await browser.newPage({ viewport: { width: 720, height: 1280 } }); p.on('pageerror', (e) => console.log('PAGE ERROR', e.message)); p.on('console', (m) => m.type() === 'error' && console.log('console', m.text()));
    await p.goto(`http://127.0.0.1:${port}/index.html`); await p.waitForFunction('window.ready'); const info = await p.evaluate('window.setup()'); return { p, info }; };
  const first = await open();
  const { frames, segs } = first.info;
  const from = +(args.from?.[0] ?? 0), to = Math.min(+(args.to?.[0] ?? frames - 1), frames - 1), step = +(args.step?.[0] ?? 1);
  const nW = +(args.workers?.[0] ?? 2);
  if (args.segs) console.log(JSON.stringify(segs));
  const list = []; for (let f = from; f <= to; f += step) list.push(f);
  console.log(`rendering ${list.length} frames (${from}-${to} step ${step}) with ${nW} workers`);
  const pages = [first]; for (let i = 1; i < nW; i++) pages.push(await open());
  const t0 = Date.now(); let done = 0;
  // contiguous chunks per worker so segment state stays warm
  const chunk = Math.ceil(list.length / nW);
  await Promise.all(pages.map(async ({ p }, wi) => {
    for (const f of list.slice(wi * chunk, (wi + 1) * chunk)) {
      const url = await p.evaluate((f) => window.renderFrame(f), f);
      fs.writeFileSync(path.join(OUT, `f${String(f).padStart(5, '0')}.jpg`), Buffer.from(url.split(',')[1], 'base64'));
      if (++done % 50 === 0) console.log(`${done}/${list.length}  ${((Date.now() - t0) / done).toFixed(0)} ms/frame`);
    }
  }));
  console.log(`done in ${((Date.now() - t0) / 1000).toFixed(0)}s`);
  await browser.close(); server.close();
})();

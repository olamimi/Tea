// Rubric check against the reference numbers: shots, shot length, locations, face size per frame.
// node tools/measure.js [step]
const { chromium } = require('playwright'); const http = require('http'), fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..'); const step = +(process.argv[2] || 6);
const server = http.createServer((q, r) => { const p = path.join(ROOT, decodeURIComponent(q.url.split('?')[0])); fs.readFile(p, (e, d) => { if (e) { r.writeHead(404); r.end(); return; } r.writeHead(200, { 'Content-Type': p.endsWith('.js') ? 'text/javascript' : p.endsWith('.json') ? 'application/json' : 'text/html' }); r.end(d); }); });
(async () => {
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] }); const p = await b.newPage({ viewport: { width: 1080, height: 1920 } });
  p.on('pageerror', (e) => console.log('ERR', e.message));
  await p.goto(`http://127.0.0.1:${server.address().port}/index.html`); await p.waitForFunction('window.ready');
  const info = await p.evaluate(() => window.setup({ ss: 1 }));
  const rows = []; for (let f = 0; f < info.frames; f += step) rows.push(await p.evaluate((f) => window.faceCheck(f), f));
  await b.close(); server.close();
  const dur = info.duration, shots = info.segs.length, lens = info.segs.map((s) => s[3] - s[2]);
  const sets = new Set(rows.map((r) => r.set)); const big = rows.filter((r) => r.face >= 0.30).length / rows.length;
  const perShot = {}; rows.forEach((r) => { const k = `${r.shot}.${r.k}`; (perShot[k] ||= []).push(r.face); });
  console.log(`duration ${dur.toFixed(1)}s  shots ${shots} (ref pace 32-53 per 60s -> ${(32 * dur / 60).toFixed(0)}+ here)  mean shot ${(dur / shots).toFixed(2)}s  longest ${Math.max(...lens).toFixed(2)}s`);
  console.log(`locations ${sets.size} (ref 5-7)   frames with face >=30% of height: ${(big * 100).toFixed(0)}% (target >=70%)`);
  for (const [k, v] of Object.entries(perShot)) console.log(k.padEnd(12), 'face max', Math.max(...v).toFixed(2), 'mean', (v.reduce((a, b) => a + b) / v.length).toFixed(2));
  fs.writeFileSync(path.join(ROOT, 'build/measure.json'), JSON.stringify({ info: info.segs, rows }, null, 1));
})();

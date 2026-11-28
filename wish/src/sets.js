// Sets for "In this world - The Wish".
// Low-frequency painted textures (no thin high-contrast lines -> no shimmer), thin warm-brown ink on set pieces,
// warm field + teal accents, light that lands on characters. Nothing in this world has a wheel, gear or pulley.
import * as THREE from 'three';
import { Puppet } from './puppet.js';
import { Dog } from './dog.js';
import { LineSegments2 } from 'three/addons/lines/LineSegments2.js';
import { LineSegmentsGeometry } from 'three/addons/lines/LineSegmentsGeometry.js';
import { LineMaterial } from 'three/addons/lines/LineMaterial.js';

let _s = 7;
const rnd = () => { _s |= 0; _s = (_s + 0x6D2B79F5) | 0; let t = Math.imul(_s ^ (_s >>> 15), 1 | _s); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
const R = (a, b) => a + (b - a) * rnd();
const V = (x, y, z) => new THREE.Vector3(x, y, z);

function canvasTex(w, h, draw, repeat) {
  const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 16;
  if (repeat) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(...repeat); }
  return t;
}
const spots = (ctx, w, h, n, col, r0, r1, a) => { for (let i = 0; i < n; i++) { const x = R(0, w), y = R(0, h), r = R(r0, r1); const g = ctx.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, `rgba(${col},${a})`); g.addColorStop(1, `rgba(${col},0)`); ctx.fillStyle = g; ctx.fillRect(x - r, y - r, 2 * r, 2 * r); } };
function plaster(base, rep = [1, 1]) { return canvasTex(256, 256, (ctx, w, h) => { ctx.fillStyle = base; ctx.fillRect(0, 0, w, h); spots(ctx, w, h, 30, '255,255,255', 30, 90, 0.07); spots(ctx, w, h, 30, '60,30,10', 30, 90, 0.06); }, rep); }
function cobble(rep) { return canvasTex(256, 256, (ctx, w, h) => { ctx.fillStyle = '#b89a78'; ctx.fillRect(0, 0, w, h); for (let y = 0; y < 4; y++) for (let x = 0; x < 4; x++) { ctx.fillStyle = (x + y) % 2 ? '#c6a984' : '#ad8f6c'; ctx.beginPath(); ctx.roundRect(x * 64 + 4 + (y % 2) * 16, y * 64 + 4, 56, 56, 14); ctx.fill(); } spots(ctx, w, h, 40, '80,50,30', 6, 18, 0.25); }, rep); }
function marble(rep) { return canvasTex(256, 256, (ctx, w, h) => { ctx.fillStyle = '#efe2cc'; ctx.fillRect(0, 0, w, h); for (let y = 0; y < 2; y++) for (let x = 0; x < 2; x++) { ctx.fillStyle = (x + y) % 2 ? '#f4e9d6' : '#e2cfb0'; ctx.fillRect(x * 128 + 2, y * 128 + 2, 124, 124); } spots(ctx, w, h, 16, '200,160,110', 20, 60, 0.18); }, rep); }
function waterTex() { return canvasTex(256, 256, (ctx, w, h) => { const g = ctx.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#4f9db0'); g.addColorStop(1, '#3a8296'); ctx.fillStyle = g; ctx.fillRect(0, 0, w, h); for (let i = 0; i < 40; i++) { ctx.strokeStyle = `rgba(230,250,255,${R(0.2, 0.45)})`; ctx.lineWidth = R(3, 6); const x = R(0, w), y = R(0, h), l = R(20, 50); ctx.beginPath(); ctx.moveTo(x, y); ctx.quadraticCurveTo(x + l / 2, y - 4, x + l, y); ctx.stroke(); } }, [2, 8]); }
function skyTex(stops) { return canvasTex(16, 512, (ctx, w, h) => { const g = ctx.createLinearGradient(0, 0, 0, h); stops.forEach(([o, c]) => g.addColorStop(o, c)); ctx.fillStyle = g; ctx.fillRect(0, 0, w, h); }); }
function glowTex(c = '255,236,200') { return canvasTex(128, 128, (ctx) => { const g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64); g.addColorStop(0, `rgba(${c},1)`); g.addColorStop(1, `rgba(${c},0)`); ctx.fillStyle = g; ctx.fillRect(0, 0, 128, 128); }); }
function signTex(text, bg, fg = '#fff8e6', w = 512, h = 128, font = 64) {
  return canvasTex(w, h, (ctx) => { ctx.fillStyle = bg; ctx.beginPath(); ctx.roundRect(4, 4, w - 8, h - 8, 18); ctx.fill(); ctx.strokeStyle = '#3a2216'; ctx.lineWidth = 8; ctx.stroke();
    ctx.fillStyle = fg; ctx.font = `bold ${font}px "DejaVu Sans", sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; const lines = text.split('\n'); lines.forEach((l, i) => ctx.fillText(l, w / 2, h / 2 + (i - (lines.length - 1) / 2) * font * 1.05, w - 44)); });
}
function windowsTex(wall, glass, rows = 6, cols = 3, lit = 0.3) { // building facade, big soft windows
  return canvasTex(256, 512, (ctx, w, h) => { ctx.fillStyle = wall; ctx.fillRect(0, 0, w, h); spots(ctx, w, h, 20, '255,255,255', 30, 80, 0.06);
    const cw = w / cols, rh = h / rows; for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) { const x = c * cw + cw * 0.2, y = r * rh + rh * 0.2;
      ctx.fillStyle = '#5a3a26'; ctx.fillRect(x - 4, y - 4, cw * 0.6 + 8, rh * 0.6 + 8); ctx.fillStyle = rnd() < lit ? '#ffd890' : glass; ctx.fillRect(x, y, cw * 0.6, rh * 0.6);
      ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.fillRect(x + 4, y + 4, cw * 0.15, rh * 0.45); } });
}

// thin warm-brown ink on set pieces (~2.5 px at 1080)
export const INK_LINES = [];
const lineMat = () => { const m = new LineMaterial({ color: 0x301420, linewidth: 2.4, transparent: true, opacity: 0.9 }); m.resolution.set(1080, 1920); INK_LINES.push(m); return m; };
function ink(mesh) { const e = new LineSegments2(new LineSegmentsGeometry().fromEdgesGeometry(new THREE.EdgesGeometry(mesh.geometry, 35)), lineMat()); e.userData.noCollide = true; mesh.add(e); return mesh; }
const std = (color, rough = 0.55, extra = {}) => new THREE.MeshStandardMaterial({ color, roughness: rough, ...extra });
function box(parent, w, h, d, mat, x, y, z, inked = true) { const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat); b.position.set(x, y, z); b.castShadow = b.receiveShadow = true; if (inked) ink(b); parent.add(b); return b; }
function cyl(parent, r0, r1, h, mat, x, y, z, seg = 20, inked = true) { const b = new THREE.Mesh(new THREE.CylinderGeometry(r0, r1, h, seg), mat); b.position.set(x, y, z); b.castShadow = b.receiveShadow = true; if (inked) ink(b); parent.add(b); return b; }
function plane(parent, w, h, mat, x, y, z, ry = 0, noCol = true) { const p = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat); p.position.set(x, y, z); p.rotation.y = ry; p.receiveShadow = true; p.userData.noCollide = noCol; parent.add(p); return p; }
function ground(scene, mat, size = 200) { const g = new THREE.Mesh(new THREE.PlaneGeometry(size, size), mat); g.rotation.x = -Math.PI / 2; g.receiveShadow = true; g.userData.noCollide = true; scene.add(g); return g; }
function skyDome(scene, tex) { const s = new THREE.Mesh(new THREE.SphereGeometry(400, 32, 16), new THREE.MeshBasicMaterial({ map: tex, side: THREE.BackSide, fog: false, depthWrite: false })); s.userData.noCollide = true; scene.add(s); return s; }
function sunLight(scene, color, I, pos, target = V(0, 0, 0), size = 18) {
  const s = new THREE.DirectionalLight(color, I); s.position.copy(pos); s.target.position.copy(target); scene.add(s, s.target);
  s.castShadow = true; s.shadow.mapSize.set(2048, 2048); Object.assign(s.shadow.camera, { left: -size, right: size, top: size, bottom: -size, near: 1, far: 200 }); s.shadow.bias = -0.0008; s.shadow.normalBias = 0.05; return s;
}
function clouds(scene, n, y0, spread, z0) {
  const m = new THREE.MeshLambertMaterial({ color: 0xffffff, emissive: 0xfff4e6, emissiveIntensity: 0.45 }); const g = new THREE.Group(); scene.add(g);
  for (let i = 0; i < n; i++) { const c = new THREE.Group(); c.position.set(R(-spread, spread), y0 + R(0, 10), z0 + R(-20, 20)); for (let k = 0; k < 5; k++) { const b = new THREE.Mesh(new THREE.SphereGeometry(R(3, 6), 14, 10), m); b.position.set(R(-6, 6), R(-1, 2), R(-2, 2)); b.scale.y = 0.65; c.add(b); } g.add(c); }
  g.traverse((o) => (o.userData.noCollide = true)); return g;
}
function tree(parent, x, z, s = 1) {
  const g = new THREE.Group(); g.position.set(x, 0, z); g.scale.setScalar(s); parent.add(g);
  cyl(g, 0.14, 0.22, 1.6, std(0x6a4426), 0, 0.8, 0, 8, false);
  for (let k = 0; k < 3; k++) { const b = new THREE.Mesh(new THREE.IcosahedronGeometry(R(0.8, 1.1), 1), std([0x5f9a4a, 0x4f8a3e, 0x7aa850][k], 0.8, { flatShading: true })); b.position.set(R(-0.5, 0.5), 2 + R(0, 0.7), R(-0.4, 0.4)); b.castShadow = true; g.add(b); }
  return g;
}
function building(parent, x, z, w, d, h, wall, roof, opts = {}) { // facade building with windows, ink, optional shop sign
  const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = opts.ry || 0; parent.add(g);
  const tex = windowsTex(wall, opts.glass || '#7fb6c6', Math.max(2, Math.round(h / 1.6)), Math.max(2, Math.round(w / 1.6)), opts.lit ?? 0.25);
  const mats = [std(new THREE.Color(wall).multiplyScalar(0.85), 0.7), std(new THREE.Color(wall).multiplyScalar(0.85), 0.7), std(roof, 0.5), std(roof, 0.5), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.6 }), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.6 })];
  const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mats); b.position.y = h / 2; b.castShadow = b.receiveShadow = true; ink(b); g.add(b);
  const cap = box(g, w + 0.3, 0.25, d + 0.3, std(roof, 0.45), 0, h + 0.12, 0);
  if (opts.sign) { const sg = new THREE.Mesh(new THREE.PlaneGeometry(Math.min(w * 0.85, 3.4), 0.8), new THREE.MeshStandardMaterial({ map: signTex(opts.sign, opts.signBg || '#b8452e', '#fff8e6', 512, 128, opts.signFont || 58), roughness: 0.5 })); sg.position.set(0, Math.min(3.2, h * 0.5), d / 2 + 0.03); g.add(sg); }
  if (opts.awning) { const aw = box(g, w * 0.8, 0.08, 0.9, std(opts.awning, 0.5), 0, 2.6, d / 2 + 0.45); aw.rotation.x = 0.25; }
  return g;
}

// ------------------------------------------------------------------ props (no wheels anywhere)
function sign(parent, text, bg, w, h, x, y, z, ry = 0, font = 60) { const s = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshStandardMaterial({ map: signTex(text, bg, '#fff8e6', 512, Math.round(512 * h / w), font), roughness: 0.5, side: THREE.DoubleSide })); s.position.set(x, y, z); s.rotation.y = ry; ink(s); parent.add(s); return s; }

function castOf(scene, list) { const c = {}; list.forEach(([k, spec, opts]) => { c[k] = new Puppet(spec, { seedOffset: Object.keys(c).length + 1, ...(opts || {}) }); scene.add(c[k].root); }); return c; }
function finish(scene, cast, extra = {}) { const up = extra.update; const o = Object.assign({ scene, cast, exposure: 1.0, reset() {} }, extra); o.update = function (t, cam) { up?.call(o, t, cam); Object.values(cast).forEach((c) => { if (c.root.visible) c.update(t, cam); }); }; return o; }
function dynTex(w, h, draw) { const c = document.createElement('canvas'); c.width = w; c.height = h; const ctx = c.getContext('2d'); const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 8; let last = null;
  return { tex, set(st) { const k = JSON.stringify(st); if (k === last) return; last = k; ctx.clearRect(0, 0, w, h); draw(ctx, w, h, st); tex.needsUpdate = true; } }; }
const chalk = (ctx, text, x, y, size, col = '#f4f1e6', align = 'center', weight = 800) => { ctx.font = `${weight} ${size}px "Inter Display Black", Arial, sans-serif`; ctx.textAlign = align; ctx.textBaseline = 'middle'; ctx.fillStyle = col; ctx.fillText(text, x, y); };
const lit = (color, I = 1.5) => new THREE.MeshBasicMaterial({ color: new THREE.Color(color).multiplyScalar(I), toneMapped: false });

// ================================================================== shared FX: particles, sparkles, aura
const TEX = {};
function softTex() { return TEX.soft || (TEX.soft = glowTex('255,255,255')); }
function starTex() { return TEX.star || (TEX.star = canvasTex(128, 128, (ctx) => { ctx.translate(64, 64); const g = ctx.createRadialGradient(0, 0, 0, 0, 0, 22); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(1, 'rgba(255,255,255,0)'); ctx.fillStyle = g; ctx.fillRect(-64, -64, 128, 128);
  ctx.fillStyle = '#ffffff'; ctx.beginPath(); for (let k = 0; k < 8; k++) { const r = k % 2 ? 9 : 60, a = k * Math.PI / 4; ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r); } ctx.closePath(); ctx.fill(); })); }
function mistTex() { return TEX.mist || (TEX.mist = canvasTex(256, 128, (ctx, w, h) => { for (let i = 0; i < 12; i++) { const x = 30 + i * 18, y = 64 + Math.sin(i * 1.7) * 14, r = 40 + (i % 3) * 12; const g = ctx.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, 'rgba(255,255,255,0.16)'); g.addColorStop(1, 'rgba(255,255,255,0)'); ctx.fillStyle = g; ctx.fillRect(0, 0, w, h); } })); }
// drifting particles: kind dust | firefly | speck | mist
function motes(scene, { n = 80, area = [-6, 6, 0.2, 4, -10, 4], color = '255,236,200', size = [0.03, 0.07], kind = 'dust', I = 1 } = {}) {
  const g = new THREE.Group(); scene.add(g); const list = [];
  for (let i = 0; i < n; i++) {
    const mat = new THREE.SpriteMaterial({ map: kind === 'mist' ? mistTex() : softTex(), transparent: true, depthWrite: false, blending: kind === 'mist' ? THREE.NormalBlending : THREE.AdditiveBlending, color: new THREE.Color(`rgb(${color})`).multiplyScalar(I), fog: kind === 'mist' });
    const s = new THREE.Sprite(mat); s.userData.noCollide = true; const sz = R(size[0], size[1]); s.scale.set(kind === 'mist' ? sz * 2.2 : sz, sz, 1);
    s.userData.p = [R(area[0], area[1]), R(area[2], area[3]), R(area[4], area[5]), R(0, 100), sz]; g.add(s); list.push(s);
  }
  return { group: g, update(t, cam) { const cp = cam ? cam.getWorldPosition(new THREE.Vector3()) : null; for (const s of list) { const [x, y, z, o, sz] = s.userData.p;
    if (kind === 'firefly') { s.position.set(x + Math.sin(t * 0.5 + o) * 0.6, y + Math.sin(t * 0.7 + o * 1.3) * 0.35, z + Math.cos(t * 0.4 + o) * 0.6); s.material.opacity = 0.35 + 0.65 * Math.max(0, Math.sin(t * 2.2 + o * 2)); }
    else if (kind === 'mist') { s.position.set(x + ((t * 0.25 + o) % 8) - 4, y, z); const dd = cp ? s.position.distanceTo(cp) : 99; s.material.opacity = (0.45 + 0.25 * Math.sin(t * 0.3 + o)) * Math.min(1, Math.max(0, (dd - sz * 1.2) / (sz * 1.5))); }
    else if (kind === 'speck') { const yy = area[2] + ((y - area[2] + t * 0.18 + o) % (area[3] - area[2])); s.position.set(x + Math.sin(t * 0.6 + o) * 0.3, yy, z + Math.cos(t * 0.5 + o) * 0.3); s.material.opacity = 0.4 + 0.5 * Math.sin(t * 1.5 + o) ** 2; }
    else { s.position.set(x + Math.sin(t * 0.21 + o) * 0.5, y + Math.sin(t * 0.17 + o * 1.7) * 0.3, z + Math.cos(t * 0.13 + o) * 0.4); s.material.opacity = 0.25 + 0.55 * Math.sin(t * 0.9 + o) ** 2; } } } };
}
// sparkle bursts: fire(pos, t0, {n, r, color}) - star sprites pop, spin and fade over 0.9 s
function sparkler(scene) {
  const pool = Array.from({ length: 40 }, () => { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: starTex(), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, color: new THREE.Color(2, 1.8, 1.2) })); s.visible = false; s.userData.noCollide = true; scene.add(s); return s; });
  let bursts = [];
  return { fire(pos, t0, o = {}) { bursts.push({ pos: pos.clone(), t0, n: o.n || 8, r: o.r || 0.5, c: o.color || [2, 1.8, 1.2], s: o.size || 0.16 }); }, clear() { bursts = []; },
    update(t) { let k = 0; pool.forEach((s) => (s.visible = false));
      for (const b of bursts) { const a = (t - b.t0) / 0.9; if (a < 0 || a > 1) continue; for (let i = 0; i < b.n && k < pool.length; i++, k++) { const s = pool[k]; const ang = i / b.n * Math.PI * 2 + b.t0; const rr = b.r * (0.4 + 0.6 * Math.sqrt(a)) * (0.7 + 0.3 * ((i * 7) % 3));
        s.visible = true; s.position.set(b.pos.x + Math.cos(ang) * rr, b.pos.y + Math.sin(ang) * rr * 0.8 + a * 0.15, b.pos.z + Math.sin(ang * 1.3) * 0.1); const sc = b.s * Math.sin(Math.PI * Math.min(1, a * 1.3)); s.scale.set(sc, sc, 1); s.material.rotation = a * 3 + i; s.material.color.setRGB(...b.c); } } } };
}
// ghost aura: soft blue glow + rising wisps attached to a puppet (or dog) root
function aura(target, H = 1.9) {
  const g = new THREE.Group(); g.userData.noCollide = true; target.root.add(g);
  const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: softTex(), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, color: new THREE.Color(0.25, 0.6, 1.0), opacity: 0.55 }));
  glow.scale.set(H * 1.3, H * 1.25, 1); glow.position.y = H * 0.55; glow.renderOrder = -1; g.add(glow);
  const wisps = Array.from({ length: 10 }, (_, i) => { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: softTex(), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, color: new THREE.Color(0.6, 0.9, 1.3) })); s.userData.o = i * 0.37; g.add(s); return s; });
  g.visible = false;
  return { group: g, set(on) { g.visible = !!on; }, update(t) { if (!g.visible) return; glow.material.opacity = 0.45 + 0.12 * Math.sin(t * 1.7);
    wisps.forEach((s, i) => { const a = (t * 0.35 + s.userData.o) % 1; const ang = i * 2.1; s.position.set(Math.cos(ang) * H * 0.22, H * (0.15 + a * 0.95), Math.sin(ang) * H * 0.12); const sc = H * 0.05 * (1 - a); s.scale.set(sc, sc * 1.6, 1); s.material.opacity = Math.sin(Math.PI * a) * 0.9; }); } };
}
// skateboard prop
function skateboard(color = 0xd0322e) { const g = new THREE.Group(); const deck = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.035, 0.86), std(color, 0.45)); deck.position.y = 0.1; deck.castShadow = true; ink(deck); g.add(deck);
  for (const z of [-0.3, 0.3]) for (const x of [-0.1, 0.1]) { const w = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.04, 14), std(0xf2e6c8, 0.4)); w.rotation.z = Math.PI / 2; w.position.set(x, 0.045, z); g.add(w); }
  g.userData.noCollide = true; return g; }
// skateboard deck as a flat wall prop / photo helpers
function photoTex(kind) { return canvasTex(512, 400, (ctx, w, h) => { ctx.fillStyle = '#f4efe2'; ctx.fillRect(0, 0, w, h); ctx.fillStyle = kind === 'memory' ? '#e8d8b8' : '#9fd0f0'; ctx.fillRect(24, 24, w - 48, h - (kind === 'memory' ? 48 : 110)); if (kind !== 'memory') { ctx.fillStyle = '#7ac05a'; ctx.fillRect(24, 200, w - 48, h - 334); }
  const head = (x, y, r, hat) => { if (hat === 'beanie') { ctx.fillStyle = '#d0392f'; ctx.beginPath(); ctx.arc(x, y - r * 0.25, r * 1.02, Math.PI, 0); ctx.fill(); ctx.fillStyle = '#a02a22'; ctx.fillRect(x - r * 1.02, y - r * 0.32, r * 2.04, r * 0.22); ctx.beginPath(); ctx.arc(x, y - r * 1.3, r * 0.22, 0, 7); ctx.fill(); }
    ctx.fillStyle = '#fbf9f4'; ctx.beginPath(); ctx.arc(x, y + r * 0.1, r * 0.92, hat === 'beanie' ? -0.15 : 0, Math.PI * (hat === 'beanie' ? 1.15 : 2)); ctx.fill(); ctx.strokeStyle = '#301420'; ctx.lineWidth = 6; ctx.beginPath(); ctx.arc(x, y + r * 0.1, r * 0.92, 0, 7); ctx.stroke();
    if (hat === 'cap') { ctx.fillStyle = '#2f6fd0'; ctx.beginPath(); ctx.arc(x, y - r * 0.05, r * 0.95, Math.PI, 0); ctx.fill(); ctx.fillRect(x - r * 1.5, y - r * 0.12, r * 0.7, r * 0.18); }
    ctx.fillStyle = '#301420'; for (const sx of [-1, 1]) { ctx.beginPath(); ctx.arc(x + sx * r * 0.3, y + r * 0.2, r * 0.09, 0, 7); ctx.fill(); }
    ctx.beginPath(); ctx.arc(x, y + r * 0.45, r * 0.25, 0.15 * Math.PI, 0.85 * Math.PI); ctx.lineWidth = 6; ctx.stroke();
    if (hat === 'beanie') { ctx.fillStyle = 'rgba(190,110,70,0.8)'; for (const sx of [-1, 1]) for (let k = 0; k < 3; k++) { ctx.beginPath(); ctx.arc(x + sx * r * (0.48 + k * 0.08), y + r * (0.36 + (k % 2) * 0.06), 3, 0, 7); ctx.fill(); } } };
  if (kind === 'memory') { head(256, 170, 90, 'beanie'); ctx.fillStyle = '#e8732e'; ctx.fillRect(176, 270, 160, 70); }
  else { head(180, 150, 70, 'beanie'); head(340, 170, 56, 'cap'); ctx.fillStyle = '#e8732e'; ctx.fillRect(126, 230, 108, 60); ctx.fillStyle = '#3f9a4a'; ctx.fillRect(296, 232, 88, 58);
    chalk(ctx, 'BEST BROS', 256, 345, 52, '#301420'); } }); }
function frame(parent, tex, w, h, x, y, z, ry = 0) { const g = new THREE.Group(); g.position.set(x, y, z); g.rotation.y = ry; parent.add(g); box(g, w + 0.12, h + 0.12, 0.05, std(0x6a4426, 0.5), 0, 0, 0); const p = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.6, emissive: 0xffffff, emissiveMap: tex, emissiveIntensity: 0.15 })); p.position.z = 0.03; g.add(p); return g; }
function asphalt(rep) { return canvasTex(256, 256, (ctx, w, h) => { ctx.fillStyle = '#6a6670'; ctx.fillRect(0, 0, w, h); spots(ctx, w, h, 40, '255,255,255', 10, 40, 0.05); spots(ctx, w, h, 40, '0,0,0', 10, 40, 0.06); }, rep); }

// ================================================================== the truck (red cab, white box, six wheels, headlights)
function makeTruck() { const g = new THREE.Group(); const red = std(0xc8322e, 0.35), white = std(0xf2f0ea, 0.5), dark = std(0x2a2a30, 0.5);
  box(g, 2.4, 2.9, 4.6, white, 0, 2.05, -1.6); box(g, 2.3, 1.9, 1.7, red, 0, 1.55, 1.6); box(g, 2.3, 0.9, 0.9, red, 0, 0.95, 2.75);
  const glass = new THREE.Mesh(new THREE.PlaneGeometry(2.0, 0.85), new THREE.MeshStandardMaterial({ color: 0x9ad0e8, roughness: 0.1, metalness: 0.3, emissive: 0x3a6a8a, emissiveIntensity: 0.3 })); glass.position.set(0, 2.0, 2.46); g.add(glass);
  box(g, 2.5, 0.25, 0.2, dark, 0, 0.6, 3.22); sign(g, 'MOVERS', '#c8322e', 2.6, 0.7, 1.21, 2.6, -1.6, Math.PI / 2, 70);
  for (const z of [2.3, -0.4, -2.6]) for (const x of [-1.15, 1.15]) { const w = cyl(g, 0.48, 0.48, 0.34, dark, x, 0.48, z, 20, false); w.rotation.z = Math.PI / 2; }
  const heads = [-0.85, 0.85].map((x) => { const l = new THREE.Mesh(new THREE.CircleGeometry(0.2, 20), lit(0xfff4d8, 3)); l.position.set(x, 1.05, 3.21); g.add(l);
    const f = new THREE.Sprite(new THREE.SpriteMaterial({ map: softTex(), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, color: new THREE.Color(2.2, 2.0, 1.6) })); f.position.set(x, 1.05, 3.4); f.scale.set(1.6, 1.6, 1); f.userData.noCollide = true; g.add(f); return f; });
  const beam = new THREE.SpotLight(0xfff0d0, 0, 30, 0.5, 0.6, 1.2); beam.position.set(0, 1.1, 3.3); beam.target.position.set(0, 0.5, 12); g.add(beam, beam.target);
  g.userData.flare = (k) => { heads.forEach((f) => f.scale.set(1.2 + 6 * k, 1.2 + 6 * k, 1)); beam.intensity = 40 + 200 * k; };
  return g; }

// ================================================================== town: day / night / ghost (the same street, three lightings)
// road runs along z (x in [-3,3]); WISH DAY gate over the road at z=-34; houses at x=+-8.5
function wishGate(parent, ghost) {
  const g = new THREE.Group(); g.position.set(0, 0, -34); parent.add(g);
  const stone = std(ghost ? 0xb8c0cc : 0xf0e2c8, 0.6), gold = std(ghost ? 0x9aa6b4 : 0xe2b13c, 0.35, { metalness: ghost ? 0.1 : 0.5 });
  for (const x of [-3.9, 3.9]) { box(g, 0.7, 5.2, 0.7, stone, x, 2.6, 0); box(g, 0.95, 0.3, 0.95, gold, x, 5.3, 0); }
  const arch = new THREE.Mesh(new THREE.TorusGeometry(3.9, 0.3, 12, 40, Math.PI), stone); arch.position.y = 5.2; arch.castShadow = true; ink(arch); g.add(arch);
  const st = canvasTex(1024, 300, (ctx, w, h) => { ctx.fillStyle = ghost ? '#8a96a8' : '#7a2a6a'; ctx.beginPath(); ctx.roundRect(8, 8, w - 16, h - 16, 40); ctx.fill(); ctx.strokeStyle = ghost ? '#c8d0dc' : '#f2c440'; ctx.lineWidth = 14; ctx.stroke();
    ctx.shadowColor = ghost ? 'rgba(0,0,0,0)' : '#ffd84a'; ctx.shadowBlur = 30; chalk(ctx, 'WISH DAY', w / 2, 120, 150, ghost ? '#dfe5ee' : '#ffe9a0'); ctx.shadowBlur = 0; chalk(ctx, 'ONE FAMILY · ONE WISH · ONCE A YEAR', w / 2, 238, 54, ghost ? '#c8d0dc' : '#fff6dc'); });
  const sg = new THREE.Mesh(new THREE.PlaneGeometry(5.6, 1.64), new THREE.MeshStandardMaterial({ map: st, emissive: 0xffffff, emissiveMap: st, emissiveIntensity: ghost ? 0.15 : 0.7, side: THREE.DoubleSide })); sg.position.set(0, 6.2, 0.36); g.add(sg); ink(sg);
  const orbs = []; for (const x of [-3.9, 3.9]) { const o = new THREE.Mesh(new THREE.SphereGeometry(0.34, 20, 14), ghost ? std(0xc8d4e4, 0.4) : lit(0xffe2a0, 2.2)); o.position.set(x, 5.85, 0); g.add(o); orbs.push(o);
    if (!ghost) { const l = new THREE.PointLight(0xffd890, 6, 9, 1.6); l.position.set(x, 5.6, 0.6); g.add(l); const hl = new THREE.Sprite(new THREE.SpriteMaterial({ map: softTex(), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, color: new THREE.Color(1.6, 1.2, 0.6) })); hl.scale.set(2.2, 2.2, 1); hl.position.set(x, 5.85, 0); g.add(hl); } }
  return g; }
function turnBoard(parent, ghost) { const g = new THREE.Group(); g.position.set(3.6, 0, -29.5); g.rotation.y = -0.45; parent.add(g); for (const x of [-1.2, 1.2]) box(g, 0.12, 2.6, 0.12, std(0x5a3a26), x, 1.3, 0, false);
  const t = canvasTex(800, 520, (ctx, w, h) => { ctx.fillStyle = ghost ? '#6a7484' : '#2f5a3a'; ctx.fillRect(0, 0, w, h); ctx.strokeStyle = ghost ? '#a8b0bc' : '#c89a5a'; ctx.lineWidth = 24; ctx.strokeRect(12, 12, w - 24, h - 24);
    chalk(ctx, "THIS YEAR'S TURN:", w / 2, 120, 64, ghost ? '#d8dee8' : '#fff4d8'); chalk(ctx, 'THE CARTERS', w / 2, 270, 120, ghost ? '#e8ecf2' : '#ffd84a'); chalk(ctx, '★ ★ ★', w / 2, 410, 90, ghost ? '#c8d0dc' : '#ffb03a'); });
  const p = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 1.7), new THREE.MeshStandardMaterial({ map: t, roughness: 0.6, emissive: 0xffffff, emissiveMap: t, emissiveIntensity: ghost ? 0.1 : 0.25 })); p.position.set(0, 2.2, 0.08); g.add(p); ink(p); return g; }
function bench(parent, x, z, ry = 0, len = 1.8) { const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = ry; parent.add(g); const wd = std(0x9a6a3a, 0.6), mt = std(0x3a3a42, 0.4);
  box(g, len, 0.08, 0.5, wd, 0, 0.5, 0); box(g, len, 0.35, 0.06, wd, 0, 0.82, -0.24); for (const sx of [-1, 1]) box(g, 0.08, 0.5, 0.45, mt, sx * (len / 2 - 0.15), 0.25, 0, false); return g; }
function planter(parent, x, z) { const g = new THREE.Group(); g.position.set(x, 0, z); parent.add(g); box(g, 0.9, 0.5, 0.9, std(0xc87a5a, 0.7), 0, 0.25, 0); for (let i = 0; i < 4; i++) { const f = new THREE.Mesh(new THREE.IcosahedronGeometry(0.22, 0), std([0xf26a8a, 0xffd84a, 0xf2f2f2, 0xb88af2][i], 0.7, { flatShading: true })); f.position.set(R(-0.25, 0.25), 0.62, R(-0.25, 0.25)); g.add(f); } return g; }
function lampPost(parent, x, z, on) { const g = new THREE.Group(); g.position.set(x, 0, z); parent.add(g); cyl(g, 0.07, 0.1, 4.2, std(0x2a2a32, 0.4), 0, 2.1, 0, 10, false); box(g, 0.9, 0.08, 0.08, std(0x2a2a32, 0.4), x > 0 ? -0.4 : 0.4, 4.15, 0, false);
  const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.16, 14, 10), on ? lit(0xffe2a0, 2.5) : std(0xe8e0d0, 0.4)); bulb.position.set(x > 0 ? -0.78 : 0.78, 4.0, 0); g.add(bulb);
  if (on) { const l = new THREE.PointLight(0xffc878, 14, 11, 1.5); l.position.copy(bulb.position).add(V(0, -0.2, 0)); g.add(l); const hl = new THREE.Sprite(new THREE.SpriteMaterial({ map: softTex(), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, color: new THREE.Color(1.5, 1.1, 0.6) })); hl.scale.set(1.6, 1.6, 1); hl.position.copy(bulb.position); g.add(hl);
    const cone = new THREE.Mesh(new THREE.ConeGeometry(1.6, 3.9, 24, 1, true), new THREE.MeshBasicMaterial({ color: 0xffd890, transparent: true, opacity: 0.07, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide })); cone.position.set(bulb.position.x, 2.0, 0); cone.userData.noCollide = true; g.add(cone); }
  return g; }

export function buildWishTown(mode = 'day') {
  _s = 301; const ghost = mode === 'ghost', night = mode === 'night'; const scene = new THREE.Scene();
  const skies = { day: [[0, '#5aa8ec'], [0.45, '#b4daf6'], [0.5, '#fde6c4'], [1, '#fde6c4']], dusk: [[0, '#3a3a7a'], [0.4, '#c86a7a'], [0.5, '#f2a45a'], [1, '#f2a45a']], night: [[0, '#070b22'], [0.45, '#1a2450'], [0.5, '#2a3058'], [1, '#2a3058']],
    gMorning: [[0, '#c8b8d8'], [0.45, '#f2c8d4'], [0.5, '#f4dce0'], [1, '#e8dce4']], gNoon: [[0, '#b8c8d8'], [0.45, '#dfe7ee'], [0.5, '#e8eef2'], [1, '#e8eef2']], gMid: [[0, '#05081a'], [0.45, '#141c38'], [0.5, '#1e2846'], [1, '#1e2846']] };
  const skyT = Object.fromEntries(Object.entries(skies).map(([k, v]) => [k, skyTex(v)])); const dome = skyDome(scene, skyT[ghost ? 'gNoon' : night ? 'night' : 'day']);
  scene.fog = new THREE.Fog(ghost ? 0xd8e0ea : night ? 0x1a2040 : 0xf6e2c2, ghost ? 10 : 30, ghost ? 70 : 150);
  ground(scene, new THREE.MeshStandardMaterial({ color: ghost ? 0xb8c4b8 : night ? 0x3a5a3a : 0x8ac26a, roughness: 0.9 }), 300);
  const road = new THREE.Mesh(new THREE.PlaneGeometry(6, 120), new THREE.MeshStandardMaterial({ map: asphalt([3, 60]), color: ghost ? 0xc8ccd4 : 0xffffff, roughness: 0.8 })); road.rotation.x = -Math.PI / 2; road.position.set(0, 0.01, -20); road.receiveShadow = true; road.userData.noCollide = true; scene.add(road);
  for (let z = 38; z > -80; z -= 3) { const d = new THREE.Mesh(new THREE.PlaneGeometry(0.16, 1.5), new THREE.MeshStandardMaterial({ color: ghost ? 0xe8e8d8 : 0xf2c440, roughness: 0.6 })); d.rotation.x = -Math.PI / 2; d.position.set(0, 0.02, z); d.userData.noCollide = true; scene.add(d); }
  const swm = std(ghost ? 0xd4d8de : 0xd8cfc0, 0.8); for (const sx of [-1, 1]) { const sw = box(scene, 1.8, 0.14, 120, swm, sx * 3.9, 0.07, -20, false); sw.userData.noCollide = true; }
  const walls = ghost ? ['#d4dae2', '#cdd6dc', '#dcdcd8', '#d0d4e0'] : ['#f6c8c0', '#c8e4d4', '#f6e2a8', '#cfd8f2', '#f2d0e4', '#e8d4b8'], roofs = ghost ? [0x9aa6b4, 0x8a96a4] : [0x4f7aa8, 0xc0573a, 0x5a9a7a, 0x8a5aa8];
  for (let i = 0; i < 10; i++) { const z = 30 - i * 7.2; for (const sx of [-1, 1]) { const h = building(scene, sx * 8.6, z, 5.2, 4.4, R(4.2, 6), walls[(i * 2 + (sx > 0 ? 1 : 0)) % walls.length], roofs[(i + (sx > 0 ? 1 : 0)) % roofs.length], { ry: -sx * Math.PI / 2, lit: night ? 0.7 : ghost ? 0 : 0.15, glass: night ? '#2a3a6a' : ghost ? '#aab4c4' : '#8fc4dc' });
    if (i % 2 === 0) tree(scene, sx * 5.6, z - 3.6, ghost ? 0.9 : 1.0); } }
  if (ghost) scene.traverse((o) => { if (o.isMesh && o.material && o.material.color && !o.material.map && o.material.type === 'MeshStandardMaterial') { const c = o.material.color; const l = c.r * 0.3 + c.g * 0.59 + c.b * 0.11; o.material = o.material.clone(); o.material.color.setRGB(l * 0.85 + 0.1, l * 0.88 + 0.12, l * 0.9 + 0.16); } });
  wishGate(scene, ghost); turnBoard(scene, ghost);
  bench(scene, -2.4, -31.2, 0, 2.0); planter(scene, -4.8, -33); planter(scene, 4.8, -33); planter(scene, -4.6, -27);
  const grindBench = bench(scene, -3.9, -6, Math.PI / 2, 3.2);
  const ramp = new THREE.Group(); ramp.position.set(0.8, 0, -17); scene.add(ramp); { const shp = new THREE.Shape(); shp.moveTo(0, 0); shp.lineTo(2.2, 0); shp.lineTo(2.2, 0.9); shp.quadraticCurveTo(0.9, 0.3, 0, 0); const rg = new THREE.ExtrudeGeometry(shp, { depth: 1.8, bevelEnabled: false }); rg.translate(0, 0, -0.9); const rm = new THREE.Mesh(rg, std(ghost ? 0xb0b8c4 : 0x3f7fd6, 0.5)); rm.rotation.y = Math.PI / 2; rm.castShadow = rm.receiveShadow = true; ink(rm); ramp.add(rm); }
  for (let z = 26; z > -60; z -= 11) for (const sx of [-1, 1]) lampPost(scene, sx * 4.3, z + (sx > 0 ? 5 : 0), night);
  const truck = makeTruck(); truck.visible = false; scene.add(truck);
  const boards = { max: skateboard(0xd0322e), leo: skateboard(0xd0322e) }; Object.values(boards).forEach((b) => { b.visible = false; scene.add(b); });
  const upturned = skateboard(0xd0322e); upturned.visible = false; upturned.rotation.z = Math.PI; upturned.position.set(-0.6, 0.18, 4); scene.add(upturned);
  // lights per mode
  const hemi = new THREE.HemisphereLight(0xfff0d8, 0x8a6a4a, 1.05); scene.add(hemi); const sun = sunLight(scene, 0xffe2b8, 3.0, V(-12, 16, 10), V(0, 0, -10), 30); sun.shadow.mapSize.set(4096, 4096);
  const rim = new THREE.DirectionalLight(0x7fe8ff, 0); scene.add(rim, rim.target);
  const P = { day: [0xfff0d8, 0x8a6a4a, 1.05, 0xffe2b8, 3.0, 0xf6e2c2, 'day'], dusk: [0xffb8a0, 0x4a3a5a, 0.55, 0xff9a5a, 1.5, 0xe8a07a, 'dusk'], night: [0x5a6ac8, 0x1a1a2a, 0.35, 0x9ab0ff, 0.45, 0x1a2040, 'night'],
    gMorning: [0xf2d0e0, 0x8a8aa8, 0.95, 0xffd8e0, 1.0, 0xeedae2, 'gMorning'], gNoon: [0xe0ecff, 0x8a9ab0, 1.05, 0xf4f8ff, 1.1, 0xd8e0ea, 'gNoon'], gMid: [0x4a5aa8, 0x101428, 0.35, 0x9ab8ff, 0.5, 0x141a34, 'gMid'] };
  const ENV = { day: 0.55, dusk: 0.3, night: 0.1, gMorning: 0.45, gNoon: 0.55, gMid: 0.12 };
  const setTime = (k) => { scene.userData.envI = ENV[k]; const [hs, hg, hi, sc, si, fc, sk] = P[k]; hemi.color.setHex(hs); hemi.groundColor.setHex(hg); hemi.intensity = hi; sun.color.setHex(sc); sun.intensity = si; scene.fog.color.setHex(fc); dome.material.map = skyT[sk]; dome.material.needsUpdate = true;
    if (k === 'dusk') sun.position.set(-20, 5, 6); else sun.position.set(-12, 16, 10); };
  const fx = [];
  if (mode === 'day') fx.push(motes(scene, { n: 140, area: [-5, 5, 0.3, 4.5, -38, 12], color: '255,226,170', size: [0.03, 0.08], kind: 'dust', I: 1.2 }));
  if (night) fx.push(motes(scene, { n: 70, area: [-6, 6, 0.4, 2.8, -20, 14], color: '220,255,140', size: [0.05, 0.1], kind: 'firefly', I: 1.8 }));
  if (ghost) { fx.push(motes(scene, { n: 26, area: [-9, 9, 0.0, 0.6, -44, 6], color: '225,235,255', size: [2.5, 4.0], kind: 'mist' })); fx.push(motes(scene, { n: 140, area: [-6, 6, 0.2, 5, -40, 10], color: '170,220,255', size: [0.03, 0.08], kind: 'speck', I: 1.6 })); }
  const spark = sparkler(scene);
  const gateSpark = mode === 'day' ? motes(scene, { n: 40, area: [-4, 4, 1, 6.6, -34.6, -33.2], color: '255,230,150', size: [0.06, 0.14], kind: 'firefly', I: 2.2 }) : null; if (gateSpark) fx.push(gateSpark);
  const castList = ghost ? [['max', 'max'], ['g0', 'townA'], ['g1', 'townE'], ['g2', 'townF'], ['g3', 'townD']] : [['max', 'max'], ['leo', 'leo'], ['tA', 'townA'], ['tB', 'townE'], ['tC', 'townF'], ['tD', 'townD']];
  const cast = castOf(scene, castList); const dog = new Dog(); scene.add(dog.root);
  const auras = {}; if (ghost) { for (const k of Object.keys(cast)) auras[k] = aura(cast[k], cast[k].spec.H); auras.dog = aura(dog, 0.9); }
  if (ghost) { hemi.color.setHex(0xe0ecff); rim.intensity = 1.6; }
  return finish(scene, cast, { truck, boards, upturned, ramp, grindBench, dog, spark, auras, setTime, rim, exposure: night ? 1.15 : 1.0,
    reset() { truck.visible = false; Object.values(boards).forEach((b) => (b.visible = false)); upturned.visible = false; dog.reset(); spark.clear(); Object.values(auras).forEach((a) => a.set(ghost)); setTime(ghost ? 'gNoon' : night ? 'night' : 'day'); },
    update(t, cam) { fx.forEach((f) => f.update(t, cam)); spark.update(t); Object.values(auras).forEach((a) => a.update(t)); if (dog.root.visible && cam) dog.update(t, cam);
      if (cam && ghost) { const d = new THREE.Vector3(); cam.getWorldDirection(d); rim.position.copy(cam.position).addScaledVector(d, 30).add(V(0, 6, 0)); rim.target.position.copy(cam.position); } } });
}

// ================================================================== Max's bedroom (night)
export function buildWishBedroom() {
  _s = 331; const scene = new THREE.Scene(); scene.userData.envI = 0.22; scene.background = new THREE.Color(0x141a34);
  const fl = canvasTex(256, 256, (ctx, w, h) => { for (let i = 0; i < 4; i++) { ctx.fillStyle = ['#7a5a42', '#6e4f3a', '#80604a', '#735440'][i]; ctx.fillRect(0, i * 64, w, 62); } }, [4, 4]); ground(scene, new THREE.MeshStandardMaterial({ map: fl, roughness: 0.6 }), 20);
  const wm = new THREE.MeshStandardMaterial({ map: plaster('#4a5f8f'), roughness: 0.8 }); plane(scene, 9, 4, wm, 0, 2, -3); plane(scene, 8, 4, wm, -4, 2, 0.5, Math.PI / 2); plane(scene, 8, 4, wm, 4, 2, 0.5, -Math.PI / 2);
  // moonlit window (left wall)
  const win = plane(scene, 1.4, 1.2, new THREE.MeshBasicMaterial({ map: canvasTex(256, 220, (ctx, w, h) => { ctx.fillStyle = '#0e1a3a'; ctx.fillRect(0, 0, w, h); ctx.fillStyle = '#fbf2c8'; ctx.beginPath(); ctx.arc(170, 70, 34, 0, 7); ctx.fill(); ctx.fillStyle = '#fff'; for (let i = 0; i < 24; i++) ctx.fillRect(R(0, w), R(0, h), 2, 2); ctx.strokeStyle = '#3a2a22'; ctx.lineWidth = 12; ctx.strokeRect(0, 0, w, h); ctx.beginPath(); ctx.moveTo(w / 2, 0); ctx.lineTo(w / 2, h); ctx.moveTo(0, h / 2); ctx.lineTo(w, h / 2); ctx.stroke(); }), toneMapped: false }), -3.98, 2.3, -0.6, Math.PI / 2);
  const moonBeam = new THREE.SpotLight(0x9ab4ff, 14, 12, 0.5, 0.8, 1.2); moonBeam.position.set(-5.5, 3.2, -0.6); moonBeam.target.position.set(-1.6, 0, 0.6); moonBeam.castShadow = true; moonBeam.shadow.bias = -0.003; moonBeam.shadow.normalBias = 0.05; scene.add(moonBeam, moonBeam.target);
  // October calendar: X's fill toward the circled WISH! day
  const cal = dynTex(600, 640, (ctx, w, h, st) => { ctx.fillStyle = '#fbf8f0'; ctx.fillRect(0, 0, w, h); ctx.fillStyle = '#c0392b'; ctx.fillRect(0, 0, w, 110); chalk(ctx, 'OCTOBER', w / 2, 58, 70, '#ffffff');
    const n = st.x ?? 10; for (let d = 1; d <= 31; d++) { const c = (d + 2) % 7, r = Math.floor((d + 2) / 7); const x = 44 + c * 80, y = 150 + r * 92; chalk(ctx, String(d), x, y, 34, '#301420');
      if (d < 31 && d <= n) { ctx.strokeStyle = '#d02a22'; ctx.lineWidth = 9; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(x - 24, y - 26); ctx.lineTo(x + 24, y + 26); ctx.moveTo(x + 24, y - 26); ctx.lineTo(x - 24, y + 26); ctx.stroke(); }
      if (d === 31) { ctx.strokeStyle = '#d02a22'; ctx.lineWidth = 8; ctx.beginPath(); ctx.ellipse(x, y + 6, 40, 44, 0, 0, 7); ctx.stroke(); chalk(ctx, 'WISH!', x - 10, y + 62, 30, '#d02a22'); } } });
  const calM = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.96), new THREE.MeshStandardMaterial({ map: cal.tex, roughness: 0.7, emissive: 0xffffff, emissiveMap: cal.tex, emissiveIntensity: 0.18 })); calM.position.set(1.3, 1.9, -2.97); scene.add(calM); ink(calM); cal.set({ x: 10 });
  const photo = frame(scene, photoTex('bros'), 0.9, 0.7, -0.6, 2.05, -2.96);
  const wallBoard = skateboard(0xd0322e); wallBoard.rotation.set(Math.PI / 2, 0, 0.3); wallBoard.position.set(3.94, 1.4, -0.6); wallBoard.rotation.set(0, Math.PI / 2, 0); wallBoard.children[0].rotation.x = Math.PI / 2 - 0.2; scene.add(wallBoard);
  sign(scene, 'SKATE OR DIE', '#2a2a3a', 1.2, 0.5, 3.97, 2.4, 1.4, -Math.PI / 2, 52);
  const desk = new THREE.Group(); desk.position.set(1.8, 0, -2.45); scene.add(desk); box(desk, 1.6, 0.08, 0.7, std(0x5a3a26, 0.5), 0, 0.78, 0); for (const x of [-0.7, 0.7]) box(desk, 0.08, 0.78, 0.6, std(0x4a2e1e, 0.5), x, 0.39, 0, false);
  cyl(desk, 0.06, 0.18, 0.2, std(0x2a5a4a, 0.4), 0.5, 1.32, 0.05); box(desk, 0.03, 0.5, 0.03, std(0x2a2a30), 0.5, 1.05, 0.05, false);
  const lamp = new THREE.PointLight(0xffc070, 7, 7, 1.6); lamp.position.set(2.3, 1.25, -2.2); lamp.castShadow = true; lamp.shadow.bias = -0.004; lamp.shadow.normalBias = 0.06; lamp.shadow.mapSize.set(1024, 1024); scene.add(lamp);
  const bed = new THREE.Group(); bed.position.set(-2.6, 0, 0.4); scene.add(bed); box(bed, 1.4, 0.5, 2.3, std(0x6a4a3a, 0.6), 0, 0.25, 0); box(bed, 1.3, 0.22, 2.1, std(0xe8e4f4, 0.7), 0, 0.6, 0); box(bed, 1.3, 0.25, 1.3, std(0xd0602a, 0.7), 0, 0.72, 0.35); box(bed, 0.9, 0.18, 0.45, std(0xf4f4f4, 0.8), 0, 0.82, -0.75); box(bed, 1.4, 1.0, 0.1, std(0x5a3a26, 0.5), 0, 0.6, -1.15);
  scene.add(new THREE.HemisphereLight(0x6a7ac8, 0x2a1a2a, 0.6));
  const fx = [motes(scene, { n: 50, area: [-3.5, 3.5, 0.3, 3.2, -2.8, 2], color: '200,210,255', size: [0.02, 0.05], kind: 'dust', I: 0.9 })];
  const cast = castOf(scene, [['max', 'max']]); const spark = sparkler(scene);
  return finish(scene, cast, { calSet: cal.set, cal: calM, photo, bed, lamp, spark, exposure: 1.12, reset() { cal.set({ x: 10 }); spark.clear(); }, update(t, cam) { fx.forEach((f) => f.update(t, cam)); spark.update(t); } });
}

// ================================================================== the real world: warm kitchen
export function buildKitchen() {
  _s = 351; const scene = new THREE.Scene(); scene.userData.envI = 0.45; scene.background = new THREE.Color(0x3a2a22);
  const chk = canvasTex(256, 256, (ctx, w, h) => { for (let y = 0; y < 4; y++) for (let x = 0; x < 4; x++) { ctx.fillStyle = (x + y) % 2 ? '#f2e8d4' : '#c8584a'; ctx.fillRect(x * 64, y * 64, 64, 64); } }, [6, 6]); ground(scene, new THREE.MeshStandardMaterial({ map: chk, roughness: 0.5 }), 20);
  const wm = new THREE.MeshStandardMaterial({ map: plaster('#f2d8a8'), roughness: 0.8 }); plane(scene, 10, 4, wm, 0, 2, -3.2); plane(scene, 8, 4, wm, -4.5, 2, 0.5, Math.PI / 2); plane(scene, 8, 4, wm, 4.5, 2, 0.5, -Math.PI / 2);
  const counter = new THREE.Group(); counter.position.set(2.6, 0, -2.7); scene.add(counter); box(counter, 3.2, 0.9, 0.7, std(0x6a9ac0, 0.5), 0, 0.45, 0); box(counter, 3.3, 0.06, 0.8, std(0xf2eee6, 0.3), 0, 0.93, 0); box(counter, 3.2, 0.8, 0.4, std(0x6a9ac0, 0.5), 0, 2.1, 0.1);
  for (let i = 0; i < 3; i++) box(counter, 0.25, 0.3, 0.25, std([0xe2b13c, 0xc0392b, 0xf2f2f2][i], 0.4), -1 + i * 0.5, 1.11, 0, false);
  const table = new THREE.Group(); table.position.set(-0.4, 0, -0.9); scene.add(table); box(table, 2.2, 0.08, 1.2, std(0x9a6a3a, 0.5), 0, 0.82, 0); for (const [x, z] of [[-1, -0.5], [1, -0.5], [-1, 0.5], [1, 0.5]]) box(table, 0.08, 0.8, 0.08, std(0x7a4a28, 0.5), x, 0.4, z, false);
  box(table, 0.3, 0.02, 0.3, std(0xf4f4f4, 0.4), -0.5, 0.87, 0.1, false); box(table, 0.3, 0.02, 0.3, std(0xf4f4f4, 0.4), 0.5, 0.87, -0.1, false);
  const vase = cyl(table, 0.08, 0.1, 0.3, std(0x3f7fd6, 0.3), 0, 1.0, 0, 14, false); for (let i = 0; i < 3; i++) { const f = new THREE.Mesh(new THREE.IcosahedronGeometry(0.08, 0), std([0xf2f2f2, 0xffd84a, 0xf26a8a][i], 0.7, { flatShading: true })); f.position.set(-0.06 + i * 0.06, 1.22, 0); table.add(f); }
  const memT = canvasTex(512, 520, (ctx, w, h) => { const p = photoTex('memory').image; ctx.fillStyle = '#f4efe2'; ctx.fillRect(0, 0, w, h); ctx.drawImage(p, 0, 0, 512, 400); chalk(ctx, 'IN LOVING MEMORY', w / 2, 450, 44, '#301420'); });
  const mem = frame(scene, memT, 0.85, 0.86, -0.4, 2.15, -3.16); const memLight = new THREE.SpotLight(0xfff0d0, 8, 5, 0.5, 0.7, 1.4); memLight.position.set(-0.4, 3.6, -1.8); memLight.target.position.set(-0.4, 2.1, -3.2); scene.add(memLight, memLight.target);
  const winT = canvasTex(256, 200, (ctx, w, h) => { const g = ctx.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#8ac0e8'); g.addColorStop(1, '#f6e2c0'); ctx.fillStyle = g; ctx.fillRect(0, 0, w, h); ctx.strokeStyle = '#f4f4f4'; ctx.lineWidth = 12; ctx.strokeRect(0, 0, w, h); ctx.beginPath(); ctx.moveTo(w / 2, 0); ctx.lineTo(w / 2, h); ctx.stroke(); });
  plane(scene, 1.5, 1.2, new THREE.MeshBasicMaterial({ map: winT, toneMapped: false }), 4.48, 2.2, -1.0, -Math.PI / 2);
  const pend = new THREE.PointLight(0xffd8a0, 16, 9, 1.4); pend.position.set(-0.4, 2.9, -0.8); pend.castShadow = true; pend.shadow.bias = -0.004; pend.shadow.normalBias = 0.05; pend.shadow.mapSize.set(1024, 1024); scene.add(pend);
  const shade = new THREE.Mesh(new THREE.ConeGeometry(0.35, 0.3, 20, 1, true), std(0xe2b13c, 0.5, { side: THREE.DoubleSide })); shade.position.set(-0.4, 3.15, -0.8); scene.add(shade); box(scene, 0.02, 0.8, 0.02, std(0x2a2a2a), -0.4, 3.6, -0.8, false);
  scene.add(new THREE.HemisphereLight(0xfff0d8, 0x7a4a3a, 0.9));
  const fx = [motes(scene, { n: 50, area: [-3.5, 3.5, 0.3, 3, -3, 2], color: '255,230,190', size: [0.02, 0.05], kind: 'dust', I: 1.0 })];
  const cast = castOf(scene, [['mum', 'mum'], ['dad', 'dadW'], ['leo', 'leo']]); const dog = new Dog(); scene.add(dog.root); const spark = sparkler(scene);
  return finish(scene, cast, { dog, spark, mem, table, exposure: 1.0, reset() { dog.reset(); spark.clear(); }, update(t, cam) { fx.forEach((f) => f.update(t, cam)); spark.update(t); if (dog.root.visible && cam) dog.update(t, cam); } });
}

// ================================================================== cemetery (night): stones, crosses, fence, bare trees, moon, mist, fireflies
function bareTree(parent, x, z, s = 1) { const g = new THREE.Group(); g.position.set(x, 0, z); g.scale.setScalar(s); parent.add(g); const m = std(0x2a2026, 0.8);
  const limb = (p, len, r, ang, tilt, depth) => { const c = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.6, r, len, 6), m); c.geometry.translate(0, len / 2, 0); c.position.copy(p); c.rotation.set(tilt, ang, 0, 'YXZ'); c.castShadow = true; g.add(c); if (depth <= 0) return;
    const tip = new THREE.Vector3(0, len, 0).applyEuler(c.rotation).add(p); for (let k = 0; k < 2; k++) limb(tip, len * 0.7, r * 0.6, ang + (k ? 1.2 : -1.0) + R(-0.3, 0.3), tilt + R(0.35, 0.7), depth - 1); };
  limb(V(0, 0, 0), 2.2, 0.18, 0, 0, 3); return g; }
export function buildCemetery() {
  _s = 371; const scene = new THREE.Scene(); scene.userData.envI = 0.1; scene.fog = new THREE.Fog(0x1a2244, 8, 38);
  skyDome(scene, skyTex([[0, '#060a1e'], [0.45, '#18224a'], [0.5, '#2a3460'], [1, '#2a3460']]));
  ground(scene, new THREE.MeshStandardMaterial({ color: 0x2f4a36, roughness: 0.95 }), 200);
  const moon = new THREE.Mesh(new THREE.CircleGeometry(4.5, 40), lit(0xfff4d0, 1.4)); moon.position.set(-8, 16, -60); scene.add(moon); const mh = new THREE.Sprite(new THREE.SpriteMaterial({ map: softTex(), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, color: new THREE.Color(0.6, 0.65, 0.9) })); mh.scale.set(26, 26, 1); mh.position.copy(moon.position); scene.add(mh);
  const stoneM = std(0x9aa0aa, 0.85), stoneD = std(0x7a808a, 0.85);
  const stones = [];
  for (let r = 0; r < 5; r++) for (let c = 0; c < 7; c++) { const x = -6 + c * 2.0 + (r % 2) * 0.6, z = -2 - r * 2.6; if (Math.abs(x - 0.2) < 1 && r === 1) continue;
    const kind = (r * 7 + c * 3) % 4; const g = new THREE.Group(); g.position.set(x + R(-0.2, 0.2), 0, z + R(-0.2, 0.2)); g.rotation.y = R(-0.12, 0.12); g.rotation.z = R(-0.06, 0.06); scene.add(g);
    if (kind === 0) { box(g, 0.12, 1.1, 0.12, stoneD, 0, 0.55, 0); box(g, 0.6, 0.12, 0.12, stoneD, 0, 0.8, 0); }
    else { const h = R(0.7, 1.1); box(g, 0.7, h, 0.18, kind === 2 ? stoneD : stoneM, 0, h / 2, 0); const top = cyl(g, 0.35, 0.35, 0.18, kind === 2 ? stoneD : stoneM, 0, h, 0, 20, true); top.rotation.x = Math.PI / 2; }
    stones.push(g); }
  // Max's stone: front row centre, flowers, engraving fades in
  const eng = dynTex(512, 640, (ctx, w, h, st) => { ctx.fillStyle = '#a8aeb8'; ctx.fillRect(0, 0, w, h); spots(ctx, w, h, 30, '255,255,255', 20, 60, 0.06); spots(ctx, w, h, 30, '40,40,60', 20, 60, 0.07);
    const a = st.a ?? 0; if (a > 0) { ctx.globalAlpha = a; const cut = (t, y, s) => { chalk(ctx, t, w / 2 + 2, y + 3, s, 'rgba(255,255,255,0.35)'); chalk(ctx, t, w / 2, y, s, '#3a3e4a'); }; cut('HERE LIES', 150, 54); cut('MAX', 260, 120); cut('CARTER', 370, 96); cut('BIG BROTHER', 470, 46); cut('HE SAVED LEO', 540, 46); ctx.globalAlpha = 1; } });
  const ms = new THREE.Group(); ms.position.set(0.2, 0, -4.6); scene.add(ms);
  const slab = new THREE.Mesh(new THREE.BoxGeometry(1.1, 1.3, 0.22), [stoneM, stoneM, stoneM, stoneM, new THREE.MeshStandardMaterial({ map: eng.tex, roughness: 0.85, emissive: 0xffffff, emissiveMap: eng.tex, emissiveIntensity: 0.12 }), stoneM]); slab.position.y = 0.65; slab.castShadow = slab.receiveShadow = true; ink(slab); ms.add(slab);
  const arc = cyl(ms, 0.55, 0.55, 0.22, stoneM, 0, 1.3, 0, 24, true); arc.rotation.x = Math.PI / 2; box(ms, 1.4, 0.12, 0.6, stoneD, 0, 0.06, 0.2);
  for (let i = 0; i < 6; i++) { const f = new THREE.Mesh(new THREE.IcosahedronGeometry(0.09, 0), std([0xf2f2f2, 0xf26a8a, 0xffd84a][i % 3], 0.7, { flatShading: true })); f.position.set(-0.35 + i * 0.14, 0.22, 0.32 + (i % 2) * 0.06); ms.add(f); const st = box(ms, 0.015, 0.16, 0.015, std(0x3f8a3a), -0.35 + i * 0.14, 0.13, 0.32 + (i % 2) * 0.06, false); }
  eng.set({ a: 0 });
  // iron fence + gate posts
  const iron = std(0x1a1a22, 0.4, { metalness: 0.5 }); for (let x = -12; x <= 12; x += 0.35) { if (Math.abs(x) < 1.2) continue; box(scene, 0.04, 1.4, 0.04, iron, x, 0.7, 3.2, false); const tip = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.14, 4), iron); tip.position.set(x, 1.47, 3.2); scene.add(tip); }
  for (const y of [0.3, 1.2]) box(scene, 24, 0.05, 0.05, iron, 0, y, 3.2, false);
  for (const x of [-1.3, 1.3]) box(scene, 0.3, 1.9, 0.3, stoneD, x, 0.95, 3.2);
  bareTree(scene, -5.5, -9, 1.3); bareTree(scene, 5.2, -12, 1.5); bareTree(scene, 7.5, -3, 1.1); bareTree(scene, -8, -2, 1.2);
  scene.add(new THREE.HemisphereLight(0x5a6ad0, 0x101820, 0.5)); const ml = sunLight(scene, 0x9ab4ff, 0.9, V(-8, 14, -12), V(0, 0, -4), 14); ml.shadow.mapSize.set(4096, 4096); Object.assign(ml.shadow.camera, { left: -8, right: 8, top: 8, bottom: -8 }); ml.shadow.camera.updateProjectionMatrix(); ml.shadow.radius = 3;
  const glowL = new THREE.PointLight(0x9ab8ff, 0, 5, 1.5); glowL.position.set(0.2, 1.5, -3.6); scene.add(glowL);
  const fx = [motes(scene, { n: 22, area: [-12, 12, 0.0, 0.45, -16, 0], color: '170,185,230', size: [2.8, 4.5], kind: 'mist' }), motes(scene, { n: 60, area: [-7, 7, 0.4, 2.6, -14, 3], color: '220,255,140', size: [0.05, 0.1], kind: 'firefly', I: 1.8 })];
  const cast = castOf(scene, [['max', 'max']]); const dog = new Dog(); scene.add(dog.root); const spark = sparkler(scene);
  return finish(scene, cast, { dog, spark, engSet: eng.set, stone: ms, slab, glowL, exposure: 1.2, reset() { dog.reset(); spark.clear(); eng.set({ a: 0 }); glowL.intensity = 0; }, update(t, cam) { fx.forEach((f) => f.update(t, cam)); spark.update(t); if (dog.root.visible && cam) dog.update(t, cam); } });
}

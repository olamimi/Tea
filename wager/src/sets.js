// Sets for "In this world, the wheel was never invented".
// Low-frequency painted textures (no thin high-contrast lines -> no shimmer), thin warm-brown ink on set pieces,
// warm field + teal accents, light that lands on characters. Nothing in this world has a wheel, gear or pulley.
import * as THREE from 'three';
import { Puppet } from './puppet.js';
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
export function makeWheel(r = 0.55, thick = 0.12) {
  const g = new THREE.Group(); const rim = new THREE.Mesh(new THREE.TorusGeometry(r, thick * 0.7, 10, 36), std(0x8a5a3a, 0.5)); rim.castShadow = true; ink(rim); g.add(rim);
  for (let k = 0; k < 4; k++) { const sp = box(g, r * 1.9, 0.06, 0.06, std(0x6a4426, 0.5), 0, 0, 0, false); sp.rotation.z = k * Math.PI / 4; }
  const hub = cyl(g, r * 0.22, r * 0.22, thick * 1.6, std(0x3a2a1a, 0.5), 0, 0, 0, 12, false); hub.rotation.x = Math.PI / 2; return g;
}
export function makeCart() { // a crate on four wheels (the first cart on Earth)
  const g = new THREE.Group(); box(g, 1.6, 0.5, 1.0, std(0xb8864c, 0.7), 0, 0.62, 0); box(g, 1.7, 0.08, 1.1, std(0x8a5a3a, 0.6), 0, 0.36, 0);
  g.userData.wheels = []; for (const [x, z] of [[-0.6, 0.6], [0.6, 0.6], [-0.6, -0.6], [0.6, -0.6]]) { const w = makeWheel(0.3, 0.08); w.position.set(x, 0.3, z); g.add(w); g.userData.wheels.push(w); }
  return g;
}
export function piano() { const g = new THREE.Group(); const m = std(0x2a1a14, 0.25, { metalness: 0.1 }); box(g, 1.4, 1.0, 0.6, m, 0, 0.5, 0); box(g, 1.3, 0.08, 0.3, std(0xf4f0e6, 0.4), 0, 0.75, 0.42); for (let i = 0; i < 12; i++) box(g, 0.05, 0.05, 0.18, std(0x111111), -0.55 + i * 0.1, 0.8, 0.38, false); return g; }
export function sofa() { const g = new THREE.Group(); const m = std(0x3f8a8c, 0.6); box(g, 1.6, 0.35, 0.7, m, 0, 0.35, 0); box(g, 1.6, 0.5, 0.2, m, 0, 0.75, -0.28); box(g, 0.2, 0.45, 0.7, m, -0.8, 0.55, 0); box(g, 0.2, 0.45, 0.7, m, 0.8, 0.55, 0); return g; }
export function fridge() { const g = new THREE.Group(); box(g, 0.7, 1.5, 0.65, std(0xe8e4dc, 0.3), 0, 0.75, 0); box(g, 0.05, 0.4, 0.05, std(0x8a929c, 0.3, { metalness: 0.7 }), 0.25, 1.1, 0.35, false); return g; }
export function crate(c = 0xb8864c) { const g = new THREE.Group(); box(g, 0.6, 0.5, 0.5, std(c, 0.7), 0, 0.25, 0); return g; }
function sign(parent, text, bg, w, h, x, y, z, ry = 0, font = 60) { const s = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshStandardMaterial({ map: signTex(text, bg, '#fff8e6', 512, Math.round(512 * h / w), font), roughness: 0.5, side: THREE.DoubleSide })); s.position.set(x, y, z); s.rotation.y = ry; ink(s); parent.add(s); return s; }

function castOf(scene, list) { const c = {}; list.forEach(([k, spec, opts]) => { c[k] = new Puppet(spec, { seedOffset: Object.keys(c).length + 1, ...(opts || {}) }); scene.add(c[k].root); }); return c; }
function finish(scene, cast, extra = {}) { const up = extra.update; const o = Object.assign({ scene, cast, exposure: 1.0, reset() {} }, extra); o.update = function (t, cam) { up?.call(o, t); Object.values(cast).forEach((c) => { if (c.root.visible) c.update(t, cam); }); }; return o; }

// ------------------------------------------------------------------ 1. ground-floor penthouse (gold lobby at street level)
export function buildLobby() {
  _s = 11; const scene = new THREE.Scene(); scene.background = new THREE.Color(0xf2d6a8);
  ground(scene, new THREE.MeshStandardMaterial({ map: marble([10, 10]), roughness: 0.15 }), 40);
  const wall = new THREE.MeshStandardMaterial({ map: plaster('#c9763a'), roughness: 0.6 });
  plane(scene, 16, 6, wall, 0, 3, -5); plane(scene, 12, 6, wall, -6, 3, 0, Math.PI / 2); plane(scene, 12, 6, wall, 6, 3, 0, -Math.PI / 2);
  for (const x of [-4.5, 4.5]) { cyl(scene, 0.35, 0.4, 6, std(0xe2b13c, 0.25, { metalness: 0.7 }), x, 3, -4.2, 20); }
  // big street window: porters walking past outside (painted, scrolling)
  const streetTex = canvasTex(1024, 256, (ctx, w, h) => { const g = ctx.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#9fd0ec'); g.addColorStop(1, '#f6dcb0'); ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#d9a46a'; ctx.fillRect(0, h * 0.72, w, h); for (let i = 0; i < 8; i++) { const x = i * 128 + 40; ctx.fillStyle = '#5a3a26'; ctx.beginPath(); ctx.arc(x, h * 0.48, 16, 0, 7); ctx.fill(); ctx.fillRect(x - 12, h * 0.52, 24, 46); ctx.fillStyle = ['#b8864c', '#3f8a8c', '#e8e4dc', '#2a1a14'][i % 4]; ctx.fillRect(x - 34, h * 0.2, 68, 44); } });
  streetTex.wrapS = THREE.RepeatWrapping;
  const win = plane(scene, 7, 3.2, new THREE.MeshBasicMaterial({ map: streetTex, toneMapped: false }), 0, 2.4, -4.97); win.userData.noCollide = true;
  box(scene, 7.4, 0.2, 0.2, std(0xe2b13c, 0.25, { metalness: 0.7 }), 0, 0.75, -4.9); box(scene, 7.4, 0.2, 0.2, std(0xe2b13c, 0.25, { metalness: 0.7 }), 0, 4.05, -4.9);
  sign(scene, 'PENTHOUSE\nGROUND FLOOR', '#2a1a14', 2.2, 0.9, 4.2, 2.6, -4.85, 0, 46);
  const rug = new THREE.Mesh(new THREE.CircleGeometry(2.6, 40), std(0xa8323a, 0.8)); rug.rotation.x = -Math.PI / 2; rug.position.set(0, 0.01, -1); rug.userData.noCollide = true; scene.add(rug);
  const couch = new THREE.Group(); couch.position.set(0, 0, -2.2); scene.add(couch); const vel = std(0x6a2a5a, 0.55);
  box(couch, 2.6, 0.45, 0.9, vel, 0, 0.3, 0); box(couch, 2.6, 0.8, 0.25, vel, 0, 0.8, -0.38); box(couch, 0.25, 0.6, 0.9, vel, -1.3, 0.55, 0); box(couch, 0.25, 0.6, 0.9, vel, 1.3, 0.55, 0);
  const chand = new THREE.Group(); chand.position.set(0, 5.2, -1); scene.add(chand); for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2; const b = new THREE.Mesh(new THREE.SphereGeometry(0.12, 10, 8), new THREE.MeshBasicMaterial({ color: 0xfff0c0 })); b.position.set(Math.cos(a) * 0.7, 0, Math.sin(a) * 0.7); chand.add(b); }
  const chGlow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex('255,220,150'), blending: THREE.AdditiveBlending, depthWrite: false, opacity: 0.6 })); chGlow.scale.set(4, 4, 1); chand.add(chGlow);
  const plantG = new THREE.Group(); plantG.position.set(-3.6, 0, -3.6); scene.add(plantG); cyl(plantG, 0.3, 0.25, 0.6, std(0x3f8a8c, 0.4), 0, 0.3, 0); for (let i = 0; i < 5; i++) { const l = new THREE.Mesh(new THREE.SphereGeometry(0.35, 10, 8), std(0x4f8a3e, 0.7)); l.position.set(R(-0.3, 0.3), 0.9 + i * 0.2, R(-0.3, 0.3)); l.scale.y = 0.7; plantG.add(l); }
  scene.add(new THREE.HemisphereLight(0xffe6c4, 0x8a5636, 1.1));
  sunLight(scene, 0xffd9a8, 2.6, V(-6, 9, 8), V(0, 0, -2), 10);
  const lamp = new THREE.PointLight(0xffc880, 9, 12, 1.4); lamp.position.set(0, 4.6, -1); scene.add(lamp);
  const cast = castOf(scene, [['rich', 'rich'], ['butler', 'worker', { glasses: false, top: '#1e1e24', bottom: '#1e1e24', tie: '#f2f2f2' }], ['kid', 'kid']]);
  const glass = new THREE.Group(); scene.add(glass); cyl(glass, 0.06, 0.04, 0.18, std(0xf0e0b0, 0.1, { transparent: true, opacity: 0.8 }), 0, 0, 0, 12, false);
  // the wheel as a coffee table: lying flat on short legs under a glass top, a teacup on it
  const table = new THREE.Group(); table.position.set(0, 0, -0.4); scene.add(table);
  const tw = makeWheel(0.62, 0.12); tw.rotation.x = -Math.PI / 2; tw.position.y = 0.42; table.add(tw);
  for (let k = 0; k < 3; k++) { const a = k * Math.PI * 2 / 3; cyl(table, 0.04, 0.04, 0.4, std(0xe2b13c, 0.3, { metalness: 0.7 }), Math.cos(a) * 0.45, 0.2, Math.sin(a) * 0.45, 8, false); }
  const top = new THREE.Mesh(new THREE.CylinderGeometry(0.72, 0.72, 0.03, 40), new THREE.MeshStandardMaterial({ color: 0xcfe8ff, transparent: true, opacity: 0.14, roughness: 0.05, metalness: 0.1 })); top.position.y = 0.52; table.add(top); table.userData.top = top;
  const cup = new THREE.Group(); cup.position.set(0.2, 0.54, 0.1); table.add(cup); cyl(cup, 0.07, 0.05, 0.09, std(0xfbf6e6, 0.3), 0, 0.045, 0, 14, false); cyl(cup, 0.12, 0.12, 0.012, std(0xfbf6e6, 0.3), 0, 0.0, 0, 18, false);
  // glass shards for the crash
  const shards = []; const shardM = new THREE.MeshStandardMaterial({ color: 0xdff2ff, transparent: true, opacity: 0.8, roughness: 0.05, side: THREE.DoubleSide });
  for (let i = 0; i < 40; i++) { const sh = new THREE.Mesh(new THREE.CircleGeometry(R(0.06, 0.18), 3), shardM); sh.visible = false; sh.userData.v = V(R(-3, 3), R(0.5, 3.5), R(3, 7)); sh.userData.p = V(R(-3.2, 3.2), R(1, 3.8), -4.9); sh.userData.r = V(R(-9, 9), R(-9, 9), R(-9, 9)); scene.add(sh); shards.push(sh); }
  const cart = makeCart(); cart.visible = false; scene.add(cart);
  const gold = new THREE.Group(); scene.add(gold); gold.visible = false; const bag = new THREE.Mesh(new THREE.SphereGeometry(0.22, 14, 10), std(0x8a6a3a, 0.8)); bag.scale.set(1, 1.15, 1); ink(bag); gold.add(bag); for (let i = 0; i < 5; i++) cyl(gold, 0.07, 0.07, 0.02, std(0xe2b13c, 0.25, { metalness: 0.8 }), R(-0.25, 0.25), 0.05 + i * 0.02, R(0.1, 0.3), 14, false);
  return finish(scene, cast, { glass, table, cup, shards, cart, gold, crashAt: null,
    reset() { cart.visible = false; gold.visible = false; shards.forEach((s) => (s.visible = false)); this.crashAt = null; table.visible = true; top.visible = true; },
    update(t) { streetTex.offset.x = t * 0.03;
      if (this.crashAt != null) shards.forEach((s) => { const a0 = t - this.crashAt; s.visible = a0 > 0; if (!s.visible) return; const v = s.userData.v, p = s.userData.p;
        const land = (v.y + Math.sqrt(v.y * v.y + 19.6 * (p.y - 0.02))) / 9.8; const a = Math.min(a0, land); // shards stay where they land
        s.position.set(p.x + v.x * a, Math.max(0.02, p.y + v.y * a - 4.9 * a * a), p.z + v.z * a);
        if (a0 >= land) s.rotation.set(-Math.PI / 2, 0, s.userData.r.z * land); else s.rotation.set(s.userData.r.x * a, s.userData.r.y * a, s.userData.r.z * a); }); } });
}

// ------------------------------------------------------------------ 2. prehistoric hill: the wheel that wasn't
export function buildHill() {
  _s = 21; const scene = new THREE.Scene(); scene.fog = new THREE.Fog(0xf4d6a8, 30, 140);
  skyDome(scene, skyTex([[0, '#4f9be0'], [0.4, '#9ccdf0'], [0.5, '#f8e2b8'], [1, '#f8e2b8']]));
  const hillM = std(0x7aa850, 0.85);
  ground(scene, hillM, 300);
  const slope = new THREE.Mesh(new THREE.SphereGeometry(14, 40, 20, 0, Math.PI * 2, 0, Math.PI / 2), hillM); slope.scale.set(1.4, 0.32, 1); slope.position.set(-34, -0.1, -26); slope.receiveShadow = true; slope.userData.noCollide = true; scene.add(slope);
  for (let i = 0; i < 9; i++) { const h = new THREE.Mesh(new THREE.SphereGeometry(R(10, 20), 20, 12), std([0x6f9a48, 0x88b05a, 0x5f8a40][i % 3], 0.9)); h.scale.y = R(0.25, 0.4); h.position.set(R(-60, 60), 0, R(-90, -40)); h.userData.noCollide = true; scene.add(h); }
  for (let i = 0; i < 14; i++) { const r = new THREE.Mesh(new THREE.DodecahedronGeometry(R(0.3, 0.8), 0), std(0x9a8a7a, 0.8, { flatShading: true })); r.position.set(R(-14, 14), 0.2, R(-8, 6)); if (Math.abs(r.position.x) < 4 && Math.abs(r.position.z) < 3) continue; r.castShadow = true; scene.add(r); }
  for (let i = 0; i < 6; i++) tree(scene, R(-20, 20), R(-26, -12), R(1, 1.5));
  const stone = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.55, 0.28, 28), new THREE.MeshStandardMaterial({ map: plaster('#a89884'), roughness: 0.8 })); stone.rotation.x = Math.PI / 2; stone.castShadow = true; ink(stone);
  const stoneG = new THREE.Group(); stoneG.add(stone); scene.add(stoneG);
  clouds(scene, 7, 40, 70, -90);
  scene.add(new THREE.HemisphereLight(0xcfe6ff, 0x6a5a2a, 1.0)); sunLight(scene, 0xfff0d0, 3.2, V(10, 14, 8), V(0, 0, 0), 14);
  const cast = castOf(scene, [['cave1', 'caveman'], ['cave2', 'cavemanB']]);
  return finish(scene, cast, { stoneG, stone });
}

// ------------------------------------------------------------------ 3. street of porters
export function buildStreet() {
  _s = 31; const scene = new THREE.Scene(); scene.fog = new THREE.Fog(0xf2d8b0, 25, 120);
  skyDome(scene, skyTex([[0, '#5aa2e0'], [0.42, '#a8d4f2'], [0.5, '#fbe4bc'], [1, '#fbe4bc']]));
  ground(scene, new THREE.MeshStandardMaterial({ map: cobble([40, 40]), roughness: 0.5 }), 200);
  const walls = ['#e8b88a', '#f2d6a0', '#d98a5a', '#f0c8a0', '#c9a27a', '#e6c08e'], roofs = [0x3f8a8c, 0xa8452e, 0x4f7a9a, 0x8a5a3a];
  const signs = ['PIANOS', 'FURNITURE', 'FRIDGES', 'BAKERY', 'PORTERS\nFOR HIRE', 'MOVING CO.'];
  for (let i = 0; i < 6; i++) { building(scene, -6.2, -2 - i * 5.6, 5, 4, R(7, 11), walls[i % 6], roofs[i % 4], { ry: Math.PI / 2, sign: signs[i], signBg: ['#b8452e', '#3f7f86', '#7a4fa8', '#d4802a'][i % 4], awning: i % 2 ? 0xd4572a : 0x3f8a8c }); building(scene, 6.2, -2 - i * 5.6, 5, 4, R(7, 12), walls[(i + 3) % 6], roofs[(i + 1) % 4], { ry: -Math.PI / 2, sign: signs[(i + 3) % 6], signBg: ['#3f7f86', '#b8452e', '#d4802a', '#7a4fa8'][i % 4] }); }
  sign(scene, 'DELIVERY:\n2 PORTERS PER\nSOFA', '#2a1a14', 1.6, 1.3, -3.9, 2.4, 1.2, Math.PI / 2 - 0.3, 44);
  sign(scene, "PORTERS' GUILD\nCARRYING THE WORLD", '#7a2a2a', 5.2, 1.6, 0, 7.4, -26, 0, 52);
  for (const x of [-2.7, 2.7]) box(scene, 0.14, 7.6, 0.14, std(0x3a2a1a), x, 3.8, -26.05, false);
  box(scene, 0.12, 2.2, 0.12, std(0x3a2a1a), -3.9, 1.1, 1.25);
  const lamp = new THREE.Group(); scene.add(lamp);
  scene.add(new THREE.HemisphereLight(0xffe8c8, 0x7a5a3a, 1.05)); sunLight(scene, 0xffdcac, 3.0, V(-14, 16, 10), V(0, 0, -6), 18);
  const P = { piano: piano(), sofa: sofa(), fridge: fridge(), crateA: crate(), crateB: crate(0xc9a060), crateC: crate(0x9a6a3a), crateD: crate(0xb8864c), crateE: crate(0xa87a4a), cart: makeCart(), cSofa: sofa(), cFridge: fridge(), cPiano: piano(), bigCrate: crate(0x9a6a3a), groceries: crate(0xd4b04a) }; Object.values(P).forEach((p) => { scene.add(p); p.visible = false; }); P.bigCrate.scale.set(1.5, 1.6, 1.5); P.groceries.scale.set(0.7, 0.6, 0.7);
  const cast = castOf(scene, [['p1', 'porter'], ['p2', 'porterB'], ['p3', 'porterC'], ['p4', 'porter', { hatColor: '#7a4fa8' }], ['p5', 'porterB', { top: '#c97a5a' }], ['p6', 'porterC', { top: '#7fb6c6' }], ['p7', 'porter', { top: '#e8d8b0' }], ['p8', 'porterB', { top: '#d4b04a' }], ['p9', 'porterC', { top: '#9ab06a' }], ['p10', 'porter', { top: '#c9a0d0' }], ['kid', 'kid'], ['grandpa', 'inventor', { H: 1.75, top: '#b89a7a', tie: '#7a4fa8' }]]);
  return finish(scene, cast, { P, reset() { Object.values(P).forEach((p) => (p.visible = false)); } });
}

// ------------------------------------------------------------------ 4. canal city
export function buildCanal() {
  _s = 41; const scene = new THREE.Scene(); scene.fog = new THREE.Fog(0xf4dcb4, 30, 150);
  skyDome(scene, skyTex([[0, '#5aa2e0'], [0.42, '#a8d4f2'], [0.5, '#fde6c0'], [1, '#fde6c0']]));
  ground(scene, new THREE.MeshStandardMaterial({ map: cobble([40, 40]), roughness: 0.5 }), 300);
  const wtex = waterTex(); const water = new THREE.Mesh(new THREE.PlaneGeometry(9, 160), new THREE.MeshStandardMaterial({ map: wtex, roughness: 0.08, metalness: 0.15 })); water.rotation.x = -Math.PI / 2; water.position.set(0, 0.05, -60); water.userData.noCollide = true; scene.add(water);
  for (const x of [-4.7, 4.7]) box(scene, 0.4, 0.35, 160, std(0xc9a27a, 0.6), x, 0.17, -60);
  const walls = ['#e8b88a', '#f2d6a0', '#d98a5a', '#f0c8a0', '#c9a27a'], roofs = [0x3f8a8c, 0xa8452e, 0x4f7a9a];
  for (let i = 0; i < 10; i++) { building(scene, -8.5, -i * 6, 6, 5, R(8, 14), walls[i % 5], roofs[i % 3], { ry: Math.PI / 2, lit: 0.2 }); building(scene, 8.5, -i * 6 - 2, 6, 5, R(8, 15), walls[(i + 2) % 5], roofs[(i + 1) % 3], { ry: -Math.PI / 2, lit: 0.2 }); }
  // boats: a jam of hulls, one gondola taxi
  const boats = [];
  const hullM = [std(0x8a4b2a, 0.5), std(0x3f8a8c, 0.5), std(0xd4802a, 0.5), std(0x7a4fa8, 0.5)];
  for (let i = 0; i < 14; i++) { const g = new THREE.Group(); const hull = new THREE.Mesh(new THREE.SphereGeometry(1, 20, 10, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), hullM[i % 4]); hull.material = hull.material.clone(); hull.material.side = THREE.DoubleSide; hull.scale.set(0.8, 0.4, 2.0); hull.position.y = 0.38; hull.castShadow = true; ink(hull); g.add(hull);
    const deck = new THREE.Mesh(new THREE.CircleGeometry(1, 24), std(0xc9a27a, 0.6)); deck.rotation.x = -Math.PI / 2; deck.scale.set(0.74, 1.9, 1); deck.position.y = 0.37; deck.userData.noCollide = true; g.add(deck);
    g.position.set((i % 2 ? 1.8 : -1.8) + R(-0.4, 0.4), 0, -6 - Math.floor(i / 2) * 4.6 + R(-0.6, 0.6)); g.rotation.y = R(-0.15, 0.15); scene.add(g); boats.push(g); }
  const taxi = new THREE.Group(); scene.add(taxi); const th = new THREE.Mesh(new THREE.SphereGeometry(1, 20, 10, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), std(0xe2b13c, 0.4)); th.material.side = THREE.DoubleSide; th.scale.set(0.75, 0.4, 2.3); th.position.y = 0.38; ink(th); taxi.add(th); const tdeck = new THREE.Mesh(new THREE.CircleGeometry(1, 24), std(0x8a5a3a, 0.5)); tdeck.rotation.x = -Math.PI / 2; tdeck.scale.set(0.7, 2.2, 1); tdeck.position.y = 0.37; tdeck.userData.noCollide = true; taxi.add(tdeck);
  const ts = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.35), new THREE.MeshStandardMaterial({ map: signTex('TAXI', '#2a1a14', '#ffd34a', 256, 100, 70), side: THREE.DoubleSide })); ts.position.set(0, 1.3, -1.3); taxi.add(ts);
  const pole = cyl(taxi, 0.03, 0.03, 3.2, std(0x6a4426), 0.5, 1.6, 1.6, 6, false); pole.rotation.z = -0.35;
  clouds(scene, 6, 45, 70, -110);
  scene.add(new THREE.HemisphereLight(0xcfe6ff, 0x7a5a3a, 1.0)); sunLight(scene, 0xffe0b0, 3.0, V(12, 18, 6), V(0, 0, -8), 20);
  const cast = castOf(scene, [['boatman', 'boatman'], ['rider', 'worker', { glasses: false }], ['b2', 'boatman', { top: '#c97a5a' }], ['b3', 'boatman', { hatColor: '#c9a27a' }]]);
  return finish(scene, cast, { taxi, boats, update(t) { wtex.offset.y = -t * 0.12; boats.forEach((b, i) => (b.position.y = Math.sin(t * 1.6 + i) * 0.03)); } });
}

// ------------------------------------------------------------------ 5. stairwell to floor 40
export function buildStairs() {
  _s = 51; const scene = new THREE.Scene(); scene.background = new THREE.Color(0xe8c8a0);
  const wallM = new THREE.MeshStandardMaterial({ map: plaster('#4f8486'), roughness: 0.7 }), stepM = std(0xc9a27a, 0.5), railM = std(0x3a2a1a, 0.4);
  ground(scene, std(0xb89a78, 0.6), 30);
  plane(scene, 12, 30, wallM, 0, 15, -2.2); plane(scene, 12, 30, wallM, -3.2, 15, 0, Math.PI / 2); plane(scene, 12, 30, wallM, 3.2, 15, 0, -Math.PI / 2);
  // zig-zag flights: each floor = 2 flights of 10 steps, 3.0 m per floor
  const STEP = { rise: 0.15, run: 0.3, w: 1.4 };
  for (let f = 0; f < 6; f++) for (let fl = 0; fl < 2; fl++) { const y0 = f * 3 + fl * 1.5, dir = fl ? -1 : 1, x = fl ? 0.85 : -0.85;
    for (let s = 0; s < 10; s++) box(scene, STEP.w, STEP.rise, STEP.run, stepM, x, y0 + (s + 0.5) * STEP.rise, dir * (-1.4 + s * STEP.run), s % 3 === 0);
    box(scene, 3.2, 0.12, 1.0, stepM, 0, y0 + 1.5, dir * 1.65, true);
    const rail = cyl(scene, 0.035, 0.035, 3.4, railM, x + (fl ? 0.72 : -0.72), y0 + 1.6, 0, 6, false); rail.rotation.x = dir * 0.46; }
  for (let f = 0; f < 6; f++) sign(scene, `FLOOR ${36 + f}`, f === 4 ? '#b8452e' : '#2a1a14', 1.1, 0.5, -3.15, f * 3 + 1.9, 1.6, Math.PI / 2, 70);
  sign(scene, 'ELEVATOR?\nWHAT IS AN\nELEVATOR?', '#e2b13c', 1.3, 1.0, 3.15, 14.0, 0.4, -Math.PI / 2, 40);
  const win = plane(scene, 1.2, 1.8, new THREE.MeshBasicMaterial({ map: skyTex([[0, '#8cc6e8'], [1, '#fde2b4']]), toneMapped: false }), 0, 10.8, -2.18);
  const shaft = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 9), new THREE.MeshBasicMaterial({ map: canvasTex(64, 256, (ctx, w, h) => { const g = ctx.createLinearGradient(0, 0, 0, h); g.addColorStop(0, 'rgba(255,236,190,0.5)'); g.addColorStop(1, 'rgba(255,236,190,0)'); ctx.fillStyle = g; ctx.fillRect(0, 0, w, h); }), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }));
  shaft.position.set(0, 8, -0.8); shaft.rotation.x = -0.5; shaft.userData.noCollide = true; scene.add(shaft);
  scene.add(new THREE.HemisphereLight(0xffe6c4, 0x6a4426, 1.05));
  const key = new THREE.PointLight(0xffd9a8, 14, 16, 1.4); key.position.set(0, 13, 0.5); key.castShadow = true; key.shadow.bias = -0.002; scene.add(key);
  const key2 = new THREE.PointLight(0xffd9a8, 10, 14, 1.4); key2.position.set(0, 4, 0.5); scene.add(key2);
  const cast = castOf(scene, [['worker', 'worker'], ['worker2', 'porterB', { top: '#d98a5a' }]]);
  return finish(scene, cast, { STEP, stepPos(f, fl, s) { const dir = fl ? -1 : 1; return V(fl ? 0.85 : -0.85, f * 3 + fl * 1.5 + (s + 1) * STEP.rise, dir * (-1.4 + s * STEP.run)); } });
}

// ------------------------------------------------------------------ 6. skyline: towers wrapped in staircases (spinning pull-back)
export function buildSkyline() {
  _s = 61; const scene = new THREE.Scene(); scene.fog = new THREE.Fog(0xf4b880, 60, 260);
  skyDome(scene, skyTex([[0, '#3a3a8a'], [0.25, '#b86a9a'], [0.42, '#ff9a5a'], [0.5, '#ffd08a'], [1, '#ffd08a']]));
  ground(scene, std(0xc98a5a, 0.8), 600);
  const wtex = waterTex(); const river = new THREE.Mesh(new THREE.PlaneGeometry(14, 400), new THREE.MeshStandardMaterial({ map: wtex, color: 0xffc8a0, roughness: 0.06, metalness: 0.2 })); river.rotation.x = -Math.PI / 2; river.position.set(22, 0.05, -60); river.userData.noCollide = true; scene.add(river);
  const walls = ['#e8b88a', '#f2d6a0', '#d98a5a', '#c9a27a', '#e6c08e', '#4f8486'];
  const stairM = std(0x5a3a26, 0.5); const goldM = std(0xe2b13c, 0.25, { metalness: 0.7 });
  const towers = [];
  for (let i = 0; i < 22; i++) {
    const x = R(-30, 14), z = R(-80, 10); if (Math.hypot(x, z) < 6) continue; const h = R(14, 34), w = R(4, 6);
    const tw = building(scene, x, z, w, w, h, walls[i % 6], [0x3f8a8c, 0xa8452e, 0x7a4fa8][i % 3], { lit: 0.35, glass: '#e8a878' });
    box(tw, w + 0.08, 2.4, w + 0.08, goldM, 0, 1.2, 0, true); // gold, rich ground floors
    // external zig-zag staircase up the front face
    const flights = Math.floor(h / 3);
    for (let f = 0; f < flights; f++) { const st = box(tw, w * 0.8, 0.18, 0.9, stairM, 0, f * 3 + 1.5, w / 2 + 0.5, false); st.rotation.z = (f % 2 ? 1 : -1) * 0.5; st.scale.x = 1; }
    for (let k = 0; k < 3; k++) { const line = box(tw, w * 0.9, 0.03, 0.03, std(0x3a2a1a), 0, h - 1 - k * 0.6, w / 2 + 0.2, false); for (let c = 0; c < 4; c++) box(tw, 0.25, 0.32, 0.02, std([0xe86a5a, 0x7fb6c6, 0xf2e6a0, 0xffffff][c]), -w * 0.3 + c * 0.4, h - 1.2 - k * 0.6, w / 2 + 0.22, false); }
    towers.push(tw);
  }
  // hero tower near the camera with a tiny shack on top ("the poor live at the top")
  const hero = building(scene, 0, 0, 5, 5, 30, '#e8b88a', 0x3f8a8c, { lit: 0.3, glass: '#e8a878' }); box(hero, 5.1, 2.6, 5.1, goldM, 0, 1.3, 0, true);
  for (let f = 0; f < 10; f++) { const st = box(hero, 4, 0.2, 1, stairM, 0, f * 3 + 1.5, 3.0, false); st.rotation.z = (f % 2 ? 1 : -1) * 0.5; }
  const shack = new THREE.Group(); shack.position.set(0, 30.25, 0); hero.add(shack); box(shack, 2.4, 1.6, 2, std(0x9a6a3a, 0.8), 0, 0.8, 0); const sr = box(shack, 2.8, 0.12, 2.4, std(0x7a7a7a, 0.6), 0, 1.75, 0); sr.rotation.z = 0.12;
  sign(hero, 'PENTHOUSE  >', '#2a1a14', 2.4, 0.5, 0, 3.0, 2.56, 0, 60);
  const sun = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex('255,226,170'), blending: THREE.AdditiveBlending, fog: false, depthWrite: false })); sun.position.set(-60, 30, -200); sun.scale.set(140, 140, 1); scene.add(sun);
  clouds(scene, 8, 60, 120, -160);
  scene.add(new THREE.HemisphereLight(0xffb880, 0x5a3070, 1.0)); sunLight(scene, 0xffa860, 3.6, V(-40, 30, -60), V(0, 0, -20), 60);
  const cast = castOf(scene, [['poor', 'porterC', { top: '#9a8a7a' }], ['rich2', 'rich']]);
  return finish(scene, cast, { hero, update(t) { wtex.offset.y = -t * 0.05; } });
}

// ------------------------------------------------------------------ 7. sundial plaza
export function buildPlaza() {
  _s = 71; const scene = new THREE.Scene(); scene.fog = new THREE.Fog(0xf4dcb4, 30, 140);
  skyDome(scene, skyTex([[0, '#5aa2e0'], [0.42, '#a8d4f2'], [0.5, '#fde6c0'], [1, '#fde6c0']]));
  ground(scene, new THREE.MeshStandardMaterial({ map: cobble([40, 40]), roughness: 0.5 }), 300);
  // giant sundial: a round dial with hour marks + a tall gnomon whose shadow is the "clock hand"
  const dialTex = canvasTex(512, 512, (ctx, w, h) => { ctx.fillStyle = '#efe2cc'; ctx.beginPath(); ctx.arc(256, 256, 250, 0, 7); ctx.fill(); ctx.strokeStyle = '#3a2216'; ctx.lineWidth = 10; ctx.stroke();
    ctx.fillStyle = '#3a2216'; ctx.font = 'bold 40px "DejaVu Serif", serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ['VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII', 'I', 'II', 'III', 'IV', 'V', 'VI'].forEach((n, i) => { const a = Math.PI + i * Math.PI / 12; ctx.fillText(n, 256 + Math.cos(a) * 205, 256 + Math.sin(a) * 205); });
    ctx.fillStyle = '#b8452e'; ctx.font = 'bold 34px "DejaVu Sans"'; ctx.fillText('YOU ARE LATE', 256, 330); });
  const dial = new THREE.Mesh(new THREE.CylinderGeometry(3.2, 3.4, 0.4, 48), [std(0xc9a27a, 0.5), new THREE.MeshStandardMaterial({ map: dialTex, roughness: 0.4 }), std(0xc9a27a, 0.5)]); dial.position.set(0, 0.2, -2); dial.rotation.y = Math.PI / 2; dial.castShadow = dial.receiveShadow = true; ink(dial); scene.add(dial);
  const gn = new THREE.Shape(); gn.moveTo(0, 0); gn.lineTo(2.4, 0); gn.lineTo(0, 2.2); gn.lineTo(0, 0);
  const gnomon = new THREE.Mesh(new THREE.ExtrudeGeometry(gn, { depth: 0.12, bevelEnabled: false }), std(0x3a2a1a, 0.4, { metalness: 0.4 })); gnomon.position.set(-0.06, 0.4, -2); gnomon.rotation.y = -Math.PI / 2; gnomon.castShadow = true; ink(gnomon); scene.add(gnomon);
  const walls = ['#e8b88a', '#f2d6a0', '#d98a5a', '#f0c8a0', '#c9a27a'];
  for (let i = 0; i < 7; i++) { const a = -Math.PI * 0.95 + i * Math.PI * 0.32; building(scene, Math.cos(a) * 18, -2 + Math.sin(a) * 14 - 6, 6, 5, R(8, 13), walls[i % 5], [0x3f8a8c, 0xa8452e][i % 2], { ry: -a - Math.PI / 2, sign: ['SHADOW\nWATCHES', 'BAKERY', 'OFFICE', 'BANK', 'SUNDIAL\nREPAIR', 'CAFE', 'HATS'][i], signBg: ['#3f7f86', '#b8452e', '#7a4fa8', '#d4802a'][i % 4] }); }
  for (let i = 0; i < 5; i++) tree(scene, R(-12, 12), R(-16, -10), R(1, 1.3));
  clouds(scene, 6, 45, 70, -100);
  scene.add(new THREE.HemisphereLight(0xcfe6ff, 0x7a5a3a, 1.0)); const sun = sunLight(scene, 0xfff0d0, 3.4, V(-16, 18, 10), V(0, 0, -2), 16);
  const cast = castOf(scene, [['boss', 'boss'], ['worker', 'worker'], ['x1', 'porter'], ['x2', 'porterB']]);
  return finish(scene, cast, { sun });
}

// ------------------------------------------------------------------ 8. the yearly vote: inventor vs the porters' union
export function buildRally() {
  _s = 81; const scene = new THREE.Scene(); scene.fog = new THREE.Fog(0xf4dcb4, 30, 140);
  skyDome(scene, skyTex([[0, '#5aa2e0'], [0.42, '#a8d4f2'], [0.5, '#fde6c0'], [1, '#fde6c0']]));
  ground(scene, new THREE.MeshStandardMaterial({ map: cobble([40, 40]), roughness: 0.5 }), 300);
  const stage = new THREE.Group(); stage.position.set(0, 0, -4); scene.add(stage);
  box(stage, 6, 1.0, 3, std(0x8a5a3a, 0.5), 0, 0.5, 0); box(stage, 6.4, 0.12, 3.4, std(0xa8452e, 0.6), 0, 1.06, 0);
  const wanted = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 3.2), new THREE.MeshStandardMaterial({ map: canvasTex(384, 512, (ctx, w, h) => { ctx.fillStyle = '#f2dfb0'; ctx.fillRect(0, 0, w, h); ctx.strokeStyle = '#5a3a26'; ctx.lineWidth = 14; ctx.strokeRect(10, 10, w - 20, h - 20);
    ctx.fillStyle = '#3a2216'; ctx.font = 'bold 78px "DejaVu Serif", serif'; ctx.textAlign = 'center'; ctx.fillText('WANTED', w / 2, 100);
    ctx.fillStyle = '#fbf9f4'; ctx.beginPath(); ctx.arc(w / 2, 240, 90, 0, 7); ctx.fill(); ctx.lineWidth = 9; ctx.stroke(); ctx.fillStyle = '#3f8a8c'; ctx.beginPath(); ctx.arc(w / 2, 225, 92, Math.PI * 1.05, Math.PI * 1.95); ctx.fill();
    ctx.fillStyle = '#3a2216'; for (const x of [w / 2 - 32, w / 2 + 32]) { ctx.beginPath(); ctx.arc(x, 245, 10, 0, 7); ctx.fill(); } ctx.lineWidth = 7; ctx.beginPath(); ctx.arc(w / 2, 270, 26, 0.2, Math.PI - 0.2); ctx.stroke();
    ctx.font = 'bold 30px "DejaVu Sans"'; ctx.fillText('FOR BUILDING A', w / 2, 380); ctx.fillText('"WHEEL"', w / 2, 418); ctx.fillStyle = '#b8452e'; ctx.font = 'bold 44px "DejaVu Sans"'; ctx.fillText('REWARD: 1000 GOLD', w / 2, 476); }), roughness: 0.7 }));
  wanted.position.set(0, 3.4, -1.4); ink(wanted); stage.add(wanted);
  sign(scene, "PORTERS' GUILD", '#7a2a2a', 6.4, 1.1, 0, 6.2, -5.6, 0, 70);
  for (const x of [-2.6, 2.6]) box(stage, 0.15, 3.4, 0.15, std(0x3a2a1a), x, 2.2, -1.4, false);
  // the wheel itself (a prop, never used)
  const wheel = new THREE.Group(); scene.add(wheel); const rim = new THREE.Mesh(new THREE.TorusGeometry(0.55, 0.08, 10, 32), std(0x8a5a3a, 0.5)); rim.castShadow = true; ink(rim); wheel.add(rim);
  for (let k = 0; k < 4; k++) { const sp = box(wheel, 1.05, 0.06, 0.06, std(0x6a4426, 0.5), 0, 0, 0, false); sp.rotation.z = k * Math.PI / 4; }
  const hub = cyl(wheel, 0.12, 0.12, 0.2, std(0x3a2a1a, 0.5), 0, 0, 0, 12, false); hub.rotation.x = Math.PI / 2;
  const banners = []; const texts = ['NO WHEELS,\nNO LAYOFFS', 'SAVE OUR\nJOBS!', "PORTERS'\nGUILD", 'NO WHEELS!', 'BACKS NOT\nWHEELS', 'CATCH\nTHE KID!'];
  for (let i = 0; i < 6; i++) { const s = new THREE.Group(); scene.add(s); const pl = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 0.75), new THREE.MeshStandardMaterial({ map: signTex(texts[i], ['#b8452e', '#2a1a14', '#3f7f86', '#d4802a', '#7a4fa8', '#b8452e'][i], '#fff8e6', 256, 176, texts[i].length > 6 ? 36 : 52) })); pl.position.y = 0.9; ink(pl); s.add(pl);
    const back = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 0.75), std(0xc9a27a, 0.8)); back.rotation.y = Math.PI; back.position.y = 0.9; s.add(back);
    const st = cyl(s, 0.025, 0.025, 1.0, std(0x6a4426), 0, 0.3, 0, 6, false); banners.push(s); }
  const walls = ['#e8b88a', '#f2d6a0', '#d98a5a', '#f0c8a0', '#c9a27a'];
  for (let i = 0; i < 6; i++) building(scene, -15 + i * 6, -14, 5.6, 4, R(8, 13), walls[i % 5], [0x3f8a8c, 0xa8452e][i % 2], {});
  clouds(scene, 6, 45, 70, -100);
  scene.add(new THREE.HemisphereLight(0xcfe6ff, 0x7a5a3a, 1.0)); sunLight(scene, 0xffe8c8, 3.2, V(-12, 18, 12), V(0, 0, -2), 16);
  const cast = castOf(scene, [['boss', 'rich'], ['inventor', 'inventor'], ['u1', 'porter'], ['u2', 'porterB'], ['u3', 'porterC'], ['u4', 'porter', { hatColor: '#7a4fa8' }], ['u5', 'porterB', { top: '#c97a5a' }], ['u6', 'porterC', { top: '#7fb6c6' }], ['u7', 'porter', { top: '#e8d8b0' }]]);
  return finish(scene, cast, { wheel, banners });
}

// ------------------------------------------------------------------ the kid's workshop shed
export function buildShed() {
  _s = 91; const scene = new THREE.Scene(); scene.background = new THREE.Color(0xd8a870);
  const plank = canvasTex(256, 256, (ctx, w, h) => { for (let i = 0; i < 4; i++) { ctx.fillStyle = ['#a8784a', '#9a6a3e', '#b0804e', '#946638'][i]; ctx.fillRect(0, i * 64, w, 62); } spots(ctx, w, h, 20, '60,30,10', 20, 60, 0.12); }, [3, 2]);
  ground(scene, new THREE.MeshStandardMaterial({ map: plank, roughness: 0.6 }), 30);
  const wm = new THREE.MeshStandardMaterial({ map: plank, roughness: 0.7 });
  plane(scene, 10, 5, wm, 0, 2.5, -3); plane(scene, 10, 5, wm, -4, 2.5, 0, Math.PI / 2); plane(scene, 10, 5, wm, 4, 2.5, 0, -Math.PI / 2);
  const win = plane(scene, 1.4, 1.1, new THREE.MeshBasicMaterial({ map: skyTex([[0, '#8cc6e8'], [1, '#fde2b4']]), toneMapped: false }), -1.6, 2.6, -2.98);
  const ray = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 5), new THREE.MeshBasicMaterial({ map: canvasTex(64, 256, (ctx, w, h) => { const g = ctx.createLinearGradient(0, 0, 0, h); g.addColorStop(0, 'rgba(255,236,190,0.55)'); g.addColorStop(1, 'rgba(255,236,190,0)'); ctx.fillStyle = g; ctx.fillRect(0, 0, w, h); }), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }));
  ray.position.set(-1.0, 1.6, -1.6); ray.rotation.set(-0.9, 0.3, 0); ray.userData.noCollide = true; scene.add(ray);
  const bench = new THREE.Group(); bench.position.set(1.0, 0, -0.9); scene.add(bench); box(bench, 2.4, 0.12, 0.9, std(0x7a4a28, 0.6), 0, 0.95, 0); for (const x of [-1.1, 1.1]) for (const z of [-0.35, 0.35]) box(bench, 0.1, 0.95, 0.1, std(0x5a3a22, 0.6), x, 0.47, z, false);
  for (let i = 0; i < 6; i++) box(scene, R(0.1, 0.4), 0.06, R(0.1, 0.3), std(0xc9a27a, 0.7), R(-2.5, 2.5), 0.03, R(-1.5, 1.5), false); // offcuts
  const sawdust = new THREE.Mesh(new THREE.CircleGeometry(1.4, 24), std(0xe8c890, 0.9)); sawdust.rotation.x = -Math.PI / 2; sawdust.position.set(0.4, 0.005, -0.4); sawdust.userData.noCollide = true; scene.add(sawdust);
  const tries = []; const failed = [['SQUARE', 0x8a5a3a], ['TRIANGLE', 0x7a4a2a]]; failed.forEach(([n, c], i) => { const g = new THREE.Mesh(i ? new THREE.CylinderGeometry(0.4, 0.4, 0.1, 3) : new THREE.BoxGeometry(0.7, 0.7, 0.1), std(c, 0.8)); g.position.set(-2.6 + i * 0.9, 0.38, -2.6); g.rotation.z = i ? Math.PI / 2 : 0; g.castShadow = true; ink(g); scene.add(g); tries.push(g); });
  sign(scene, 'ATTEMPT #47', '#2a1a14', 1.6, 0.45, 1.2, 3.1, -2.95, 0, 60);
  const wheel = makeWheel(0.45, 0.1); scene.add(wheel);
  const hammer = new THREE.Group(); scene.add(hammer); box(hammer, 0.05, 0.42, 0.05, std(0x6a4426), 0, -0.15, 0, false); box(hammer, 0.18, 0.08, 0.08, std(0x5a5a62, 0.4, { metalness: 0.6 }), 0, 0.06, 0, false);
  scene.add(new THREE.HemisphereLight(0xffe2b8, 0x6a4426, 1.0));
  const key = new THREE.SpotLight(0xffd8a0, 60, 20, 0.6, 0.4, 1.2); key.position.set(-2.4, 4.2, -1.5); key.target.position.set(0.6, 0, 0); key.castShadow = true; key.shadow.bias = -0.001; key.shadow.normalBias = 0.05; scene.add(key, key.target);
  const fill = new THREE.PointLight(0xffc890, 6, 10, 1.5); fill.position.set(1.5, 3, 2); scene.add(fill);
  const cast = castOf(scene, [['kid', 'kid']]);
  return finish(scene, cast, { wheel, hammer, square: tries[0], tri: tries[1], reset() { tries[0].position.set(-2.6, 0.38, -2.6); tries[0].rotation.set(0, 0, 0); tries[1].position.set(-1.7, 0.38, -2.6); tries[1].rotation.set(0, 0, Math.PI / 2); } });
}

// ------------------------------------------------------------------ the downhill chase street (stair city)
export const SLOPE = 0.2; // road drops 0.2 m per metre toward -z
export const roadY = (z) => Math.min(0, z) * SLOPE;
export function buildChase() {
  _s = 101; const scene = new THREE.Scene(); scene.fog = new THREE.Fog(0xf4c890, 60, 260);
  skyDome(scene, skyTex([[0, '#4a8ad8'], [0.38, '#9ccdf0'], [0.5, '#fde2b4'], [1, '#fde2b4']]));
  const flat = ground(scene, std(0xc98a5a, 0.8), 900); flat.position.y = -60;
  const road = new THREE.Mesh(new THREE.PlaneGeometry(7, 200), new THREE.MeshStandardMaterial({ map: cobble([4, 100]), roughness: 0.5 })); road.rotation.x = -Math.PI / 2 + Math.atan(SLOPE); road.position.set(0, roadY(-100) / 2 - 0.0, -100 + 100 * (1 - Math.cos(Math.atan(SLOPE))));
  road.position.set(0, -10, -50); road.rotation.x = -Math.PI / 2 - Math.atan(SLOPE) * 0; road.geometry = new THREE.PlaneGeometry(7, 200); road.position.set(0, 0, 0); road.rotation.set(0, 0, 0);
  { const g = new THREE.PlaneGeometry(7, 340, 1, 68); g.rotateX(-Math.PI / 2); const p = g.attributes.position; for (let i = 0; i < p.count; i++) { const z = p.getZ(i) - 125; p.setZ(i, z); p.setY(i, roadY(z)); } g.computeVertexNormals(); road.geometry = g; }
  road.receiveShadow = true; road.userData.noCollide = true; scene.add(road);
  const walls = ['#e8b88a', '#f2d6a0', '#d98a5a', '#f0c8a0', '#c9a27a', '#4f8486'];
  for (let i = -7; i < 32; i++) { const z = 4 - i * 6; for (const side of [-1, 1]) { const h = R(9, 18); const b = building(scene, side * 6.4, z, 5, 5, h, walls[(i + (side > 0 ? 3 : 0)) % 6], [0x3f8a8c, 0xa8452e, 0x7a4fa8][i % 3], { ry: side > 0 ? -Math.PI / 2 : Math.PI / 2, lit: 0.25 }); b.position.y = roadY(z) - 1;
      for (let f = 1; f < Math.floor(h / 3); f++) { box(b, 3.0, 0.16, 0.9, std(0x5a3a26, 0.5), 0, f * 3, 2.95, false); box(b, 3.0, 0.5, 0.06, std(0x3a2a1a, 0.5), 0, f * 3 + 0.33, 3.37, false); for (const x of [-1.45, 1.45]) box(b, 0.06, 0.5, 0.9, std(0x3a2a1a, 0.5), x, f * 3 + 0.33, 2.95, false); } } } // balconies with railings
  const P = { cart: makeCart(), cSofa: sofa(), crates: crate(), flySofa: sofa() }; P.flySofa.visible = false; Object.values(P).forEach((p) => scene.add(p));
  clouds(scene, 7, 40, 80, -120);
  scene.add(new THREE.HemisphereLight(0xcfe6ff, 0x7a5a3a, 1.0)); const sun = sunLight(scene, 0xffe0b0, 3.2, V(-20, 30, 10), V(0, -6, -30), 40);
  const cast = castOf(scene, [['kid', 'kid'], ['c1', 'porter'], ['c2', 'porterB'], ['c3', 'porterC'], ['c4', 'porter', { hatColor: '#7a4fa8' }], ['c5', 'porterB', { top: '#c97a5a' }], ['c6', 'porterC', { top: '#7fb6c6' }], ['c7', 'porter', { top: '#e8d8b0' }], ['c8', 'porterB', { top: '#d4b04a' }], ['c9', 'porterC', { top: '#9ab06a' }], ['c10', 'porter', { top: '#c9a0d0' }], ['c11', 'porterB'], ['c12', 'porterC', { hatColor: '#3f7f86' }]]);
  return finish(scene, cast, { P, reset() { P.flySofa.visible = false; } });
}

// ================================================================== THE BURGER WAGER sets
// dynamic canvas texture: redraws only when its state key changes (deterministic per frame)
function dynTex(w, h, draw) { const c = document.createElement('canvas'); c.width = w; c.height = h; const ctx = c.getContext('2d'); const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 8; let last = null;
  return { tex, set(st) { const k = JSON.stringify(st); if (k === last) return; last = k; ctx.clearRect(0, 0, w, h); draw(ctx, w, h, st); tex.needsUpdate = true; } }; }
const chalk = (ctx, text, x, y, size, col = '#f4f1e6', align = 'center', weight = 800) => { ctx.font = `${weight} ${size}px "Inter Display Black", Arial, sans-serif`; ctx.textAlign = align; ctx.textBaseline = 'middle'; ctx.fillStyle = col; ctx.fillText(text, x, y); };
function burgerIcon(ctx, x, y, s) { ctx.fillStyle = '#e0a040'; ctx.beginPath(); ctx.ellipse(x, y - s * 0.25, s * 0.5, s * 0.3, 0, Math.PI, 0); ctx.fill(); ctx.fillStyle = '#5ab04a'; ctx.fillRect(x - s * 0.52, y - s * 0.22, s * 1.04, s * 0.1); ctx.fillStyle = '#7a3a1a'; ctx.fillRect(x - s * 0.48, y - s * 0.12, s * 0.96, s * 0.18); ctx.fillStyle = '#e0a040'; ctx.fillRect(x - s * 0.5, y + s * 0.06, s, s * 0.14); }
// the wager board: st = {title, grid, c: [lose, heaven, fire, effort], circle, check, perfect, inf, infLabel}
export function makeBoard() {
  const d = dynTex(1024, 1024, (ctx, w, h, st) => {
    ctx.fillStyle = '#26352e'; ctx.fillRect(0, 0, w, h); const g = ctx.createRadialGradient(512, 480, 50, 512, 512, 700); g.addColorStop(0, 'rgba(255,255,255,0.06)'); g.addColorStop(1, 'rgba(0,0,0,0.25)'); ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
    ctx.save(); const ki = Math.min(1, (st.inf || 0) * 3); const sc = 1 - 0.62 * ki; ctx.translate(40 * ki, 40 * ki); ctx.scale(sc, sc);
    if (st.title) { ctx.globalAlpha = Math.min(1, st.title); chalk(ctx, 'THE BURGER WAGER', 455, 110, 66); burgerIcon(ctx, 865, 108, 76); ctx.globalAlpha = 1; }
    if (st.grid) { ctx.strokeStyle = '#f4f1e6'; ctx.lineWidth = 9; ctx.lineCap = 'round'; const k = st.grid;
      const L = (x0, y0, x1, y1, a) => { const u = Math.max(0, Math.min(1, a)); ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x0 + (x1 - x0) * u, y0 + (y1 - y0) * u); ctx.stroke(); };
      L(240, 420, 990, 420, k * 2); L(615, 230, 615, 980, k * 2 - 0.5); L(240, 230, 240, 980, k * 2 - 1);
      ctx.globalAlpha = Math.max(0, Math.min(1, k * 2 - 1)); chalk(ctx, 'GOD REAL', 428, 320, 50); chalk(ctx, 'NOT REAL', 802, 320, 50); chalk(ctx, 'BELIEVE', 120, 590, 38); chalk(ctx, "DON'T", 120, 830, 44); ctx.globalAlpha = 1; }
    const cells = [['LOSE', 'NOTHING', 802, 600, '#f4f1e6'], ['∞ HEAVEN', 'forever', 428, 600, '#ffd84a'], ['∞ FIRE', 'forever', 428, 840, '#ff5a3a'], ['SAVED A', 'LITTLE EFFORT', 802, 840, '#f4f1e6']];
    (st.c || []).forEach((a, i) => { if (!a) return; const [t1, t2, x, y, col] = cells[i]; ctx.globalAlpha = Math.min(1, a); chalk(ctx, t1, x, y - 34, i === 3 ? 48 : 64, col); chalk(ctx, t2, x, y + 40, i === 3 ? 40 : 46, col, 'center', 600); ctx.globalAlpha = 1; });
    if (st.circle) { ctx.strokeStyle = '#ffd84a'; ctx.lineWidth = 10; ctx.beginPath(); ctx.ellipse(428, 600, 170, 105, -0.05, -0.4, -0.4 + Math.PI * 2 * Math.min(1, st.circle)); ctx.stroke(); }
    if (st.check) { ctx.strokeStyle = '#7ad46a'; ctx.lineWidth = 16; ctx.lineCap = 'round'; const k = Math.min(1, st.check); ctx.beginPath(); ctx.moveTo(870, 120); ctx.lineTo(870 + 40 * Math.min(1, k * 2), 120 + 50 * Math.min(1, k * 2)); if (k > 0.5) ctx.lineTo(910 + 90 * (k - 0.5) * 2, 170 - 130 * (k - 0.5) * 2); ctx.stroke(); }
    if (st.perfect) { ctx.globalAlpha = Math.min(1, st.perfect); ctx.save(); ctx.translate(512, 990); ctx.rotate(-0.05); chalk(ctx, 'PERFECT', 0, 0, 80, '#7ad46a'); ctx.restore(); ctx.globalAlpha = 1; }
    ctx.restore();
    if (st.inf) { const gods = ['GOD #2: DOUBT', 'GOD #3: CATS', 'GOD #4: SILENCE', 'GOD #5: TACOS', 'GOD #6: KINDNESS', 'GOD #7: THE SEA', 'GOD #8: NAPS', 'GOD #9: SKEPTICS', 'GOD #10: ODD NUMBERS', 'GOD #11: BEES', 'GOD #12: QUESTIONS', 'GOD #13: JAZZ', 'GOD #14: NOBODY', 'GOD #15: ???', '...'];
      const n = Math.floor(gods.length * Math.max(0, Math.min(1, (st.inf - 0.33) / 0.6))); ctx.strokeStyle = 'rgba(244,241,230,0.8)'; ctx.lineWidth = 4;
      for (let i = 0; i < n; i++) { const col = i % 3, row = Math.floor(i / 3); const x = 70 + col * 310 + (row === 0 ? 0 : 0), y = 470 + row * 105 - (col === 0 && row === 0 ? 0 : 0); if (row === 0 && col === 0) continue; ctx.strokeRect(x - 10 + (col === 0 ? 0 : 0), y - 40, 290, 84); chalk(ctx, gods[i], x + 135, y, 32); }
      for (let i = 0; i < Math.min(n, 3); i++) { const x = 420 + i * 200; ctx.strokeRect(x, 70, 180, 300); chalk(ctx, gods[i + 12] || '?', x + 90, 220, 26); }
      if (st.infLabel) { ctx.globalAlpha = Math.min(1, st.infLabel); ctx.fillStyle = 'rgba(20,30,26,0.75)'; ctx.fillRect(40, 400, 944, 0); chalk(ctx, 'GOD #1: YOURS', 512, 870, 84, '#ffd84a'); chalk(ctx, '(one of ∞)', 512, 950, 56, '#ffd84a', 'center', 600); ctx.globalAlpha = 1; } }
  });
  const g = new THREE.Group(); const board = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 2.2), new THREE.MeshStandardMaterial({ map: d.tex, roughness: 0.9, emissive: 0xffffff, emissiveMap: d.tex, emissiveIntensity: 0.35 })); board.position.y = 1.85; g.add(board);
  const fr = std(0x7a4a28, 0.6); box(g, 2.36, 0.1, 0.08, fr, 0, 2.98, 0); box(g, 2.36, 0.1, 0.08, fr, 0, 0.72, 0); box(g, 0.1, 2.36, 0.08, fr, -1.15, 1.85, 0); box(g, 0.1, 2.36, 0.08, fr, 1.15, 1.85, 0);
  g.userData.easel = [box(g, 0.08, 3.0, 0.08, fr, -0.8, 1.5, -0.25), box(g, 0.08, 3.0, 0.08, fr, 0.8, 1.5, -0.25), box(g, 0.08, 2.8, 0.08, fr, 0, 1.4, -0.7)]; g.userData.easel[2].rotation.x = 0.3;
  board.position.z = 0.05; g.userData.set = d.set; d.set({}); return g;
}
const lit = (color, I = 1.5) => new THREE.MeshBasicMaterial({ color: new THREE.Color(color).multiplyScalar(I), toneMapped: false });
function kneeler(c) { return c; }
function pews(parent, rows, z0, dz, x) { const wood = std(0x7a4a28, 0.5); for (let i = 0; i < rows; i++) { const z = z0 + i * dz; box(parent, 2.4, 0.5, 0.42, wood, x, 0.45, z); box(parent, 2.4, 0.8, 0.1, wood, x, 0.85, z + 0.24); } }
function steeple(parent, x, z, wall = '#f2e6d4', roof = 0x4a6aa8, s = 1) { const g = new THREE.Group(); g.position.set(x, 0, z); g.scale.setScalar(s); parent.add(g);
  const wm = new THREE.MeshStandardMaterial({ map: plaster(wall), roughness: 0.7 }); box(g, 5, 4.5, 6, wm, 0, 2.25, 0); const r = new THREE.Mesh(new THREE.ConeGeometry(4.3, 2.2, 4), std(roof, 0.5)); r.rotation.y = Math.PI / 4; r.scale.set(0.82, 1, 0.98); r.position.y = 5.6; ink(r); g.add(r);
  box(g, 1.6, 4.5, 1.6, wm, 0, 6.7, 2.2); const sp = new THREE.Mesh(new THREE.ConeGeometry(1.25, 3.4, 4), std(roof, 0.5)); sp.rotation.y = Math.PI / 4; sp.position.set(0, 10.6, 2.2); ink(sp); g.add(sp);
  box(g, 0.12, 0.9, 0.12, std(0xe2b13c, 0.3, { metalness: 0.6 }), 0, 12.7, 2.2, false); box(g, 0.55, 0.12, 0.12, std(0xe2b13c, 0.3, { metalness: 0.6 }), 0, 12.85, 2.2, false);
  const glass = canvasTex(256, 256, (ctx, w, h) => { const cols = ['#e8455a', '#3f7fd6', '#f2c440', '#4fb07a', '#a05ad0']; for (let i = 0; i < 12; i++) { ctx.fillStyle = cols[i % 5]; ctx.beginPath(); ctx.moveTo(128, 128); ctx.arc(128, 128, 128, i * Math.PI / 6, (i + 1) * Math.PI / 6); ctx.fill(); } ctx.strokeStyle = '#301420'; ctx.lineWidth = 10; ctx.beginPath(); ctx.arc(128, 128, 122, 0, 7); ctx.stroke(); for (let i = 0; i < 12; i++) { ctx.beginPath(); ctx.moveTo(128, 128); ctx.lineTo(128 + Math.cos(i * Math.PI / 6) * 128, 128 + Math.sin(i * Math.PI / 6) * 128); ctx.stroke(); } });
  const rw = new THREE.Mesh(new THREE.CircleGeometry(0.9, 32), new THREE.MeshStandardMaterial({ map: glass, emissive: 0xffffff, emissiveMap: glass, emissiveIntensity: 0.6 })); rw.position.set(0, 3.2, 3.02); g.add(rw);
  box(g, 1.4, 2.2, 0.1, std(0x6a3a22, 0.5), 0, 1.1, 3.02); return g; }

// 1. devout town street (day)
export function buildTown() {
  _s = 201; const scene = new THREE.Scene(); scene.fog = new THREE.Fog(0xf6e2c2, 40, 160);
  skyDome(scene, skyTex([[0, '#6aaee8'], [0.45, '#b8dcf4'], [0.5, '#fde8c8'], [1, '#fde8c8']]));
  ground(scene, new THREE.MeshStandardMaterial({ map: cobble([40, 40]), roughness: 0.5 }), 200);
  const walls = ['#f6c8c0', '#c8e4d4', '#f6e2a8', '#cfd8f2', '#f2d0e4', '#e8d4b8'], roofs = [0x4f7aa8, 0xc0573a, 0x5a9a7a, 0x8a5aa8];
  for (let i = 0; i < 5; i++) { building(scene, -6.4, 2 - i * 5.4, 4.6, 4, R(5, 7.5), walls[i % 6], roofs[i % 4], { ry: Math.PI / 2, lit: 0.2, awning: i % 2 ? 0xd4572a : 0x3f8a8c });
    building(scene, 6.4, 2 - i * 5.4, 4.6, 4, R(5, 7.5), walls[(i + 3) % 6], roofs[(i + 1) % 4], { ry: -Math.PI / 2, lit: 0.2 }); }
  steeple(scene, 0, -24, '#f2e6d4', 0x4a6aa8, 1);
  const bb = new THREE.Group(); bb.position.set(3.0, 0, -10); bb.rotation.y = -0.35; scene.add(bb); for (const x of [-1.6, 1.6]) box(bb, 0.15, 4.2, 0.15, std(0x5a5a62), x, 2.1, 0, false);
  sign(bb, '99.9% OF EARTH\nBELIEVES', '#2a5aa8', 4.2, 2.0, 0, 5.1, 0.1, 0, 72);
  sign(scene, 'PRAY: EVERY DAY\n· OPEN 24/7 ·', '#7a2a5a', 2.2, 1.0, -4.1, 2.6, -3, Math.PI / 2 - 0.25, 50);
  const bunt = ['#e2b13c', '#ffffff', '#3f7fd6']; for (let r = 0; r < 4; r++) { const z = -2 - r * 5; for (let i = 0; i < 18; i++) { const x = -4 + i * 0.47; const y = 5.2 - Math.sin((i / 17) * Math.PI) * 0.8; const f = new THREE.Mesh(new THREE.ConeGeometry(0.16, 0.36, 3), std(bunt[i % 3], 0.6)); f.rotation.x = Math.PI; f.position.set(x, y - 0.18, z); f.userData.noCollide = true; scene.add(f); } }
  // phone (prayer app) and book props
  const ph = dynTex(256, 512, (ctx, w, h, st) => { ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, w, h); ctx.fillStyle = '#6a3fd0'; ctx.fillRect(0, 0, w, 120); chalk(ctx, 'PRAYR', 128, 62, 56, '#ffffff'); chalk(ctx, '✦', 128, 200, 90, '#f2a43a'); chalk(ctx, (st.n || 9999).toLocaleString('en-US'), 128, 320, 60, '#301420'); chalk(ctx, 'DAY STREAK', 128, 390, 36, '#6a3fd0'); });
  const phone = new THREE.Group(); scene.add(phone); box(phone, 0.12, 0.24, 0.015, std(0x1a1a20, 0.3), 0, 0, 0, false); const scr = new THREE.Mesh(new THREE.PlaneGeometry(0.105, 0.21), new THREE.MeshBasicMaterial({ map: ph.tex, toneMapped: false })); scr.position.z = 0.009; phone.add(scr); ph.set({ n: 9999 });
  const book = new THREE.Group(); scene.add(book); box(book, 0.18, 0.24, 0.05, std(0x3a2a6a, 0.6), 0, 0, 0, false);
  scene.add(new THREE.HemisphereLight(0xfff0d8, 0x8a6a4a, 1.05)); sunLight(scene, 0xffe2b8, 3.0, V(-12, 16, 10), V(0, 0, -6), 18);
  const cast = castOf(scene, [['hero', 'hero'], ['mom', 'mom'], ['bro', 'bro'], ['pastor', 'pastor'], ['tA', 'townA'], ['tB', 'townB'], ['tC', 'townC'], ['tD', 'townD'],
    ...Array.from({ length: 10 }, (_, i) => [`k${i}`, ['townA', 'townB', 'townC', 'townD'][i % 4], { top: ['#c8322e', '#e8c23a', '#7a4fa8', '#3f9a6a', '#d98a5a', '#5a8ad0'][(i * 5) % 6] }])]);
  const fire = new THREE.Group(); scene.add(fire); const fTex = canvasTex(64, 128, (ctx, w, h) => { const g = ctx.createRadialGradient(32, 96, 4, 32, 80, 60); g.addColorStop(0, 'rgba(255,240,160,1)'); g.addColorStop(0.4, 'rgba(255,140,30,0.9)'); g.addColorStop(1, 'rgba(220,40,10,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(32, 0); ctx.quadraticCurveTo(64, 70, 50, 120); ctx.lineTo(14, 120); ctx.quadraticCurveTo(0, 70, 32, 0); ctx.fill(); });
  const flames = Array.from({ length: 16 }, (_, i) => { const f = new THREE.Sprite(new THREE.SpriteMaterial({ map: fTex, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, color: new THREE.Color(2, 1.5, 1.1) })); f.userData.p = [R(-1.6, 1.6), R(-0.6, 0.6), R(0, 3)]; fire.add(f); return f; });
  const fireLight = new THREE.PointLight(0xff6a1a, 0, 9, 1.4); fire.add(fireLight); fireLight.position.y = 0.6;
  return finish(scene, cast, { phone, book, phoneSet: ph.set, fire, fireK: 0, reset() { phone.visible = false; book.visible = false; this.fireK = 0; },
    update(t) { const k = this.fireK; fire.visible = k > 0.01; fireLight.intensity = k * (22 + 6 * Math.sin(t * 9)); flames.forEach((f) => { const [x, z, o] = f.userData.p; const a = (t * 1.4 + o) % 1; f.position.set(x, a * 1.4 * k, z); const sc = ((1 - a) * 1.2 + 0.3) * k; f.scale.set(sc * 0.55, sc, 1); f.material.opacity = 1 - a; }); } });
}

// 2. institute of proof (clinical teal lab)
export function buildInstitute() {
  _s = 211; const scene = new THREE.Scene(); scene.background = new THREE.Color(0x9fd4d0);
  const tiles = canvasTex(256, 256, (ctx, w, h) => { ctx.fillStyle = '#eef4f2'; ctx.fillRect(0, 0, w, h); ctx.strokeStyle = '#c8d8d4'; ctx.lineWidth = 6; for (let i = 0; i <= 2; i++) { ctx.beginPath(); ctx.moveTo(i * 128, 0); ctx.lineTo(i * 128, h); ctx.moveTo(0, i * 128); ctx.lineTo(w, i * 128); ctx.stroke(); } }, [8, 8]);
  ground(scene, new THREE.MeshStandardMaterial({ map: tiles, roughness: 0.35 }), 30);
  const wm = new THREE.MeshStandardMaterial({ map: plaster('#5fb8b0'), roughness: 0.7 }); plane(scene, 14, 6, wm, 0, 3, -4); plane(scene, 12, 6, wm, -5, 3, 1, Math.PI / 2); plane(scene, 12, 6, wm, 5, 3, 1, -Math.PI / 2);
  box(scene, 14, 0.25, 0.1, std(0xf4f4f0), 0, 0.12, -3.95, false);
  const neon = new THREE.Mesh(new THREE.PlaneGeometry(4.6, 1.1), new THREE.MeshBasicMaterial({ map: canvasTex(1024, 256, (ctx, w, h) => { ctx.fillStyle = '#123a3a'; ctx.fillRect(0, 0, w, h); ctx.shadowColor = '#7affe8'; ctx.shadowBlur = 30; chalk(ctx, 'INSTITUTE OF PROOF', 512, 100, 96, '#c8fff4'); chalk(ctx, '~ STILL LOOKING ~', 512, 196, 56, '#ff9ac8'); }), toneMapped: false })); neon.position.set(0, 4.0, -3.92); scene.add(neon);
  sign(scene, 'DAYS WITHOUT PROOF:\n893,012', '#c0392b', 1.8, 0.9, -3.0, 2.4, -3.93, 0, 46);
  // empty evidence case
  const ped = new THREE.Group(); ped.position.set(0, 0, -1.6); scene.add(ped); box(ped, 1.0, 1.0, 1.0, std(0xf4f4f0, 0.4), 0, 0.5, 0);
  const glass = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.9, 0.9), new THREE.MeshStandardMaterial({ color: 0xdff6ff, transparent: true, opacity: 0.22, roughness: 0.05 })); glass.position.y = 1.46; ped.add(glass); ink(glass);
  const label = new THREE.Mesh(new THREE.PlaneGeometry(0.8, 0.4), new THREE.MeshStandardMaterial({ map: canvasTex(512, 256, (ctx, w, h) => { ctx.fillStyle = '#f8f4e8'; ctx.fillRect(0, 0, w, h); ctx.strokeStyle = '#301420'; ctx.lineWidth = 8; ctx.strokeRect(6, 6, w - 12, h - 12); chalk(ctx, 'EVIDENCE OF GOD', 256, 70, 46, '#301420'); chalk(ctx, 'exhibit A:', 256, 140, 38, '#5a4a4a', 'center', 600); chalk(ctx, '(empty)', 256, 198, 44, '#c0392b'); }), roughness: 0.6 })); label.position.set(0, 0.62, 0.51); ped.add(label);
  // telescope, microscope, meteorite
  const tel = new THREE.Group(); tel.position.set(-2.3, 0, -1.2); scene.add(tel); for (const a of [0, 2.1, 4.2]) { const l = box(tel, 0.06, 1.5, 0.06, std(0x4a4a52), Math.sin(a) * 0.3, 0.7, Math.cos(a) * 0.3, false); l.rotation.set(Math.cos(a) * 0.2, 0, -Math.sin(a) * 0.2); }
  const tube = cyl(tel, 0.12, 0.18, 1.5, std(0xf4f4f0, 0.3), 0, 1.65, 0); tube.rotation.x = -0.9; tube.rotation.z = 0.1; const ep = cyl(tel, 0.05, 0.05, 0.2, std(0x2a2a30), 0, 1.25, 0.55); ep.rotation.x = -0.9;
  const table = new THREE.Group(); table.position.set(2.2, 0, -1.2); scene.add(table); box(table, 1.6, 0.08, 0.9, std(0xe8e8e4, 0.4), 0, 0.95, 0); for (const x of [-0.7, 0.7]) for (const z of [-0.35, 0.35]) box(table, 0.06, 0.95, 0.06, std(0x8a929c), x, 0.47, z, false);
  const mic = new THREE.Group(); mic.position.set(-0.35, 0.99, 0); table.add(mic); box(mic, 0.3, 0.05, 0.3, std(0x2a2a30), 0, 0.02, 0, false); box(mic, 0.06, 0.45, 0.08, std(0xf4f4f0), -0.1, 0.25, 0, false); const mt = cyl(mic, 0.05, 0.06, 0.32, std(0x2a2a30), 0.02, 0.42, 0); mt.rotation.z = 0.35;
  const met = new THREE.Mesh(new THREE.IcosahedronGeometry(0.13, 1), std(0x4a3f3a, 0.9)); met.scale.set(1.2, 0.9, 1); met.position.set(0.4, 1.12, 0); table.add(met); ink(met);
  scene.add(new THREE.HemisphereLight(0xf0ffff, 0x5a8a86, 1.1)); const key = new THREE.SpotLight(0xffffff, 50, 20, 0.7, 0.5, 1.3); key.position.set(-2, 5, 3); key.target.position.set(0, 0, -1.5); key.castShadow = true; key.shadow.bias = -0.001; key.shadow.normalBias = 0.05; scene.add(key, key.target);
  const cast = castOf(scene, [['sci', 'scientist'], ['sci2', 'scientist', { hairColor: '#8a6a4a', hat: 'short', tie: '#c0392b', H: 1.95 }], ['sci3', 'scientist', { hat: 'balding', hairColor: '#cfcfcf', tie: '#3f9a5a', belly: 1.15, H: 2.05 }]]);
  return finish(scene, cast, { met, metHome: met.position.clone(), table, reset() { met.parent !== table && table.attach(met); met.position.copy(this.metHome); met.rotation.set(0, 0, 0); } });
}

// 3. agora (sunny Greek square) with the wager board
export function buildAgora() {
  _s = 221; const scene = new THREE.Scene(); scene.fog = new THREE.Fog(0xfbe8c6, 40, 160);
  skyDome(scene, skyTex([[0, '#4f9ae8'], [0.45, '#a8d8f8'], [0.5, '#fdeccc'], [1, '#fdeccc']]));
  ground(scene, new THREE.MeshStandardMaterial({ map: marble([12, 12]), roughness: 0.4 }), 120);
  const mm = std(0xf4ecdc, 0.45); const tp = new THREE.Group(); tp.position.set(0, 0, -9); scene.add(tp);
  box(tp, 12, 0.5, 4, mm, 0, 0.25, 0); box(tp, 11.4, 0.35, 3.6, mm, 0, 0.67, 0); for (let i = 0; i < 7; i++) { const c = cyl(tp, 0.32, 0.36, 4.6, mm, -4.8 + i * 1.6, 3.15, 1.4, 20); }
  box(tp, 12, 0.6, 4, mm, 0, 5.75, 0); const ped = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 6.6, 1.6, 3), mm); ped.rotation.set(Math.PI / 2, 0, 0); ped.scale.set(1, 1, 1); ped.rotation.set(0, 0, 0); ped.geometry = new THREE.CylinderGeometry(0, 1, 1, 3, 1); ped.scale.set(6.6, 1.6, 2.2); ped.rotation.y = Math.PI / 6; ped.position.set(0, 6.85, 0); ped.rotation.set(0, Math.PI / 2, 0);
  const tri = new THREE.Shape(); tri.moveTo(-6, 0); tri.lineTo(6, 0); tri.lineTo(0, 1.6); tri.lineTo(-6, 0); const pd = new THREE.Mesh(new THREE.ExtrudeGeometry(tri, { depth: 3.6, bevelEnabled: false }), mm); pd.position.set(0, 6.05, -1.8); tp.add(pd); ink(pd);
  for (const [x, z] of [[-7, -5], [7.5, -6], [-9, -2], [9, -1]]) { const cp = new THREE.Mesh(new THREE.ConeGeometry(0.7, 5.5, 10), std(0x2f6a3a, 0.8)); cp.position.set(x, 2.75, z); ink(cp); scene.add(cp); cyl(scene, 0.12, 0.15, 0.4, std(0x6a4426), x, 0.2, z, 8, false); }
  tree(scene, -4.2, -3.5, 0.9);
  const board = makeBoard(); board.position.set(1.2, 0, -1.6); board.rotation.y = -0.15; scene.add(board);
  scene.add(new THREE.HemisphereLight(0xfff4dc, 0x9a8a6a, 1.05)); sunLight(scene, 0xffe8c0, 3.2, V(-10, 18, 12), V(0, 0, -3), 16);
  const cast = castOf(scene, [['philo', 'philo'], ['rival', 'rival']]);
  return finish(scene, cast, { board, boardSet: board.userData.set, reset() { board.userData.set({}); } });
}

// 4. bedroom at night: research wall, belief switch, desk, TV
export function buildBedroom() {
  _s = 231; const scene = new THREE.Scene(); scene.background = new THREE.Color(0x1a2240);
  const fl = canvasTex(256, 256, (ctx, w, h) => { for (let i = 0; i < 4; i++) { ctx.fillStyle = ['#7a5a42', '#6e4f3a', '#80604a', '#735440'][i]; ctx.fillRect(0, i * 64, w, 62); } }, [4, 4]); ground(scene, new THREE.MeshStandardMaterial({ map: fl, roughness: 0.6 }), 20);
  const wm = new THREE.MeshStandardMaterial({ map: plaster('#4a5a8a'), roughness: 0.8 }); plane(scene, 9, 4, wm, 0, 2, -3); plane(scene, 8, 4, wm, -4, 2, 0.5, Math.PI / 2); plane(scene, 8, 4, wm, 4, 2, 0.5, -Math.PI / 2);
  const win = plane(scene, 1.3, 1.1, new THREE.MeshBasicMaterial({ map: canvasTex(128, 128, (ctx, w, h) => { ctx.fillStyle = '#0e1a3a'; ctx.fillRect(0, 0, w, h); ctx.fillStyle = '#f8f0c8'; ctx.beginPath(); ctx.arc(88, 36, 16, 0, 7); ctx.fill(); ctx.fillStyle = '#fff'; for (let i = 0; i < 14; i++) ctx.fillRect(R(0, w), R(0, h), 2, 2); }), toneMapped: false }), -3.98, 2.3, -0.8, Math.PI / 2);
  // research wall (dark mode shows a giant red infinity)
  const rw = dynTex(1024, 640, (ctx, w, h, st) => { ctx.fillStyle = '#b8864c'; ctx.fillRect(0, 0, w, h); ctx.fillStyle = 'rgba(80,40,10,0.15)'; for (let i = 0; i < 300; i++) ctx.fillRect((i * 97) % w, (i * 53) % h, 4, 4);
    const notes = [['MANY GODS?', 120, 120, '#fff27a'], ['WHICH HEAVEN?', 420, 90, '#9ae8ff'], ['∞ × 0.001 = ∞ ?!', 760, 140, '#ff9ac8'], ['FAITH ≠ BET', 170, 380, '#b8ff9a'], ['PRIZE → BELIEF?', 520, 330, '#fff27a'], ['BURN?? 🔥', 830, 420, '#ffc87a'], ['HIDDEN ON PURPOSE?', 360, 520, '#9ae8ff']];
    ctx.strokeStyle = '#c0261e'; ctx.lineWidth = 5; ctx.beginPath(); for (let i = 0; i < notes.length; i++) for (let j = i + 1; j < notes.length; j += 2) { ctx.moveTo(notes[i][1], notes[i][2]); ctx.lineTo(notes[j][1], notes[j][2]); } ctx.stroke();
    notes.forEach(([t, x, y, c], i) => { ctx.save(); ctx.translate(x, y); ctx.rotate(((i * 37) % 9 - 4) * 0.02); ctx.fillStyle = c; ctx.fillRect(-120, -55, 240, 110); ctx.fillStyle = '#c0261e'; ctx.beginPath(); ctx.arc(0, -46, 9, 0, 7); ctx.fill(); chalk(ctx, t, 0, 8, t.length > 12 ? 30 : 38, '#301420'); ctx.restore(); });
    if (st.dark) { ctx.fillStyle = `rgba(10,6,12,${0.82 * st.dark})`; ctx.fillRect(0, 0, w, h); ctx.globalAlpha = st.dark; ctx.shadowColor = '#ff2a1a'; ctx.shadowBlur = 40; chalk(ctx, '∞', 512, 250, 300, '#ff3a2a'); chalk(ctx, 'ALWAYS WINS', 512, 500, 110, '#ff3a2a'); ctx.shadowBlur = 0; ctx.globalAlpha = 1; } });
  const wall = new THREE.Mesh(new THREE.PlaneGeometry(2.8, 1.75), new THREE.MeshStandardMaterial({ map: rw.tex, roughness: 0.8, emissive: 0xffffff, emissiveMap: rw.tex, emissiveIntensity: 0.25 })); wall.position.set(-0.9, 1.95, -2.97); scene.add(wall); ink(wall); rw.set({});
  // belief switch
  const sw = new THREE.Group(); sw.position.set(1.6, 1.35, -2.97); scene.add(sw); box(sw, 0.34, 0.5, 0.04, std(0xf4f0e6, 0.4), 0, 0, 0); const lever = box(sw, 0.07, 0.18, 0.07, std(0xd4572a, 0.4), 0, 0, 0.06); lever.geometry.translate(0, 0.07, 0);
  sign(scene, 'BELIEF\nON / OFF', '#301420', 0.5, 0.3, 1.6, 1.82, -2.96, 0, 54);
  // desk, lamp, books
  const desk = new THREE.Group(); desk.position.set(-0.9, 0, -2.4); scene.add(desk); box(desk, 2.0, 0.08, 0.8, std(0x5a3a26, 0.5), 0, 0.78, 0); for (const x of [-0.9, 0.9]) box(desk, 0.08, 0.78, 0.7, std(0x4a2e1e, 0.5), x, 0.39, 0, false);
  for (let i = 0; i < 3; i++) for (let j = 0; j < 4 + i; j++) box(desk, 0.36, 0.07, 0.26, std([0xc0392b, 0x2a5aa8, 0xe2b13c, 0x3f8a5a][(i + j) % 4], 0.6), -0.6 + i * 0.45, 0.85 + j * 0.075, 0.1 - (j % 2) * 0.03, false);
  const lampHead = cyl(desk, 0.06, 0.18, 0.2, std(0x2a5a4a, 0.4), 0.7, 1.32, 0.05); box(desk, 0.03, 0.5, 0.03, std(0x2a2a30), 0.7, 1.05, 0.05, false);
  const lamp = new THREE.PointLight(0xffc878, 9, 7, 1.6); lamp.position.set(-0.2, 1.25, -2.2); lamp.castShadow = true; lamp.shadow.bias = -0.004; lamp.shadow.normalBias = 0.06; lamp.shadow.mapSize.set(1024, 1024); scene.add(lamp);
  // TV with score
  const tvs = dynTex(512, 288, (ctx, w, h, st) => { ctx.fillStyle = '#0a2a1a'; ctx.fillRect(0, 0, w, h); chalk(ctx, 'MY TEAM', 128, 70, 38, '#ffffff'); chalk(ctx, 'THEM', 384, 70, 38, '#ffffff'); chalk(ctx, `${st.a ?? 0}  –  ${st.b ?? 7}`, 256, 180, 110, '#ffd84a'); });
  const tv = new THREE.Group(); tv.position.set(2.7, 0, -1.4); tv.rotation.y = -0.7; scene.add(tv); box(tv, 1.0, 0.6, 0.45, std(0x5a3a26, 0.5), 0, 0.3, 0); box(tv, 1.3, 0.78, 0.08, std(0x1a1a20, 0.3), 0, 1.05, 0); const scr = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 0.675), new THREE.MeshBasicMaterial({ map: tvs.tex, toneMapped: false })); scr.position.set(0, 1.05, 0.045); tv.add(scr); tvs.set({ a: 0, b: 7 });
  const poster = sign(scene, 'QUESTION\nEVERYTHING', '#c0392b', 0.9, 1.2, 3.97, 2.0, 0.6, -Math.PI / 2, 60);
  const bed = new THREE.Group(); bed.position.set(-2.6, 0, 0.6); scene.add(bed); box(bed, 1.4, 0.5, 2.3, std(0x6a4a3a, 0.6), 0, 0.25, 0); box(bed, 1.3, 0.22, 2.1, std(0xe8e4f4, 0.7), 0, 0.6, 0); box(bed, 1.3, 0.25, 1.3, std(0x3f6ab0, 0.7), 0, 0.72, 0.35); box(bed, 0.9, 0.18, 0.45, std(0xf4f4f4, 0.8), 0, 0.82, -0.75); box(bed, 1.4, 1.0, 0.1, std(0x5a3a26, 0.5), 0, 0.6, -1.15);
  const slip = new THREE.Mesh(new THREE.PlaneGeometry(0.22, 0.12), new THREE.MeshStandardMaterial({ map: canvasTex(256, 140, (ctx, w, h) => { ctx.fillStyle = '#fffbe8'; ctx.fillRect(0, 0, w, h); chalk(ctx, 'BET SLIP', 128, 34, 30, '#c0392b'); chalk(ctx, 'MY TEAM TO WIN', 128, 90, 26, '#301420'); }), side: THREE.DoubleSide })); scene.add(slip);
  scene.add(new THREE.HemisphereLight(0x6a7ac8, 0x2a1a2a, 0.55)); const moon = new THREE.DirectionalLight(0x8aa8ff, 0.9); moon.position.set(-6, 5, 2); scene.add(moon);
  const cast = castOf(scene, [['hero', 'hero']]);
  return finish(scene, cast, { lever, slip, wallSet: rw.set, tvSet: tvs.set, lamp, exposure: 1.1, reset() { lamp.intensity = 9; lever.rotation.x = 0; slip.visible = false; rw.set({}); tvs.set({ a: 0, b: 7 }); } });
}

// 5. church interior: rose window, aisle, pews, altar, font
export function buildChurch() {
  _s = 241; const scene = new THREE.Scene(); scene.background = new THREE.Color(0x3a2a3a);
  const stone = new THREE.MeshStandardMaterial({ map: plaster('#e8dcc8'), roughness: 0.8 }); ground(scene, std(0xc8b49a, 0.6), 40);
  plane(scene, 10, 9, stone, 0, 4.5, -9); plane(scene, 20, 9, stone, -5, 4.5, -1, Math.PI / 2); plane(scene, 20, 9, stone, 5, 4.5, -1, -Math.PI / 2);
  const runner = new THREE.Mesh(new THREE.PlaneGeometry(1.3, 16), std(0xa8202a, 0.8)); runner.rotation.x = -Math.PI / 2; runner.position.set(0, 0.01, -1); runner.userData.noCollide = true; scene.add(runner);
  pews(scene, 6, -4.2, 1.25, -1.9); pews(scene, 6, -4.2, 1.25, 1.9);
  const alt = new THREE.Group(); alt.position.set(0, 0, -7.4); scene.add(alt); box(alt, 6, 0.4, 2.4, std(0xd8c8b0, 0.6), 0, 0.2, 0); box(alt, 2.2, 1.0, 0.8, std(0xf4ecdc, 0.5), 0, 0.9, 0); box(alt, 2.3, 0.06, 0.9, std(0xe2b13c, 0.3, { metalness: 0.5 }), 0, 1.42, 0, false);
  const flames = []; for (const x of [-0.8, -0.4, 0.4, 0.8]) { cyl(alt, 0.04, 0.04, 0.4, std(0xf8f4e8, 0.5), x, 1.65, 0, 10, false); const f = new THREE.Mesh(new THREE.SphereGeometry(0.05, 8, 8), lit(0xffb040, 3)); f.scale.set(0.7, 1.4, 0.7); f.position.set(x, 1.9, 0); alt.add(f); flames.push(f); }
  const rose = canvasTex(512, 512, (ctx, w, h) => { const cols = ['#e8455a', '#3f7fd6', '#f2c440', '#4fb07a', '#a05ad0', '#f08a3a']; for (let ring = 3; ring >= 1; ring--) for (let i = 0; i < 16; i++) { ctx.fillStyle = cols[(i + ring) % 6]; ctx.beginPath(); ctx.moveTo(256, 256); ctx.arc(256, 256, ring * 82, i * Math.PI / 8, (i + 1) * Math.PI / 8); ctx.fill(); } ctx.strokeStyle = '#301420'; ctx.lineWidth = 12; for (let ring = 1; ring <= 3; ring++) { ctx.beginPath(); ctx.arc(256, 256, ring * 82, 0, 7); ctx.stroke(); } for (let i = 0; i < 16; i++) { ctx.beginPath(); ctx.moveTo(256, 256); ctx.lineTo(256 + Math.cos(i * Math.PI / 8) * 246, 256 + Math.sin(i * Math.PI / 8) * 246); ctx.stroke(); } });
  const rw = new THREE.Mesh(new THREE.CircleGeometry(2.0, 48), new THREE.MeshBasicMaterial({ map: rose, toneMapped: false, color: new THREE.Color(1.6, 1.6, 1.6) })); rw.position.set(0, 5.6, -8.97); scene.add(rw);
  for (const sd of [-1, 1]) for (let i = 0; i < 3; i++) { const sw = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 2.4), new THREE.MeshBasicMaterial({ map: rose, toneMapped: false, color: new THREE.Color(1.3, 1.3, 1.3) })); sw.position.set(sd * 4.97, 4.2, -5 + i * 3.5); sw.rotation.y = -sd * Math.PI / 2; scene.add(sw); }
  const rays = []; for (let i = 0; i < 4; i++) { const r = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 9), new THREE.MeshBasicMaterial({ map: canvasTex(64, 256, (ctx, w, h) => { const g = ctx.createLinearGradient(0, 0, 0, h); g.addColorStop(0, 'rgba(255,236,200,0.5)'); g.addColorStop(1, 'rgba(255,236,200,0)'); ctx.fillStyle = g; ctx.fillRect(0, 0, w, h); }), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false })); r.position.set(-1.2 + i * 0.8, 3.0, -5.2); r.rotation.set(-0.55, 0, (i - 1.5) * 0.12); r.userData.noCollide = true; scene.add(r); rays.push(r); }
  const font = new THREE.Group(); font.position.set(3.0, 0, -5.2); scene.add(font); cyl(font, 0.2, 0.3, 0.9, std(0xd8ccb8, 0.6), 0, 0.45, 0); cyl(font, 0.55, 0.35, 0.3, std(0xd8ccb8, 0.6), 0, 1.05, 0); const water = new THREE.Mesh(new THREE.CircleGeometry(0.48, 24), std(0x7ab8d8, 0.1)); water.rotation.x = -Math.PI / 2; water.position.y = 1.19; font.add(water);
  const pulpit = new THREE.Group(); pulpit.position.set(-3.0, 0, -6.2); scene.add(pulpit); box(pulpit, 0.9, 1.3, 0.8, std(0x7a4a28, 0.5), 0, 0.65, 0); box(pulpit, 1.0, 0.08, 0.6, std(0x6a3a20, 0.5), 0, 1.35, 0.1);
  const cass = Array.from({ length: 7 }, () => { const g = new THREE.Group(); box(g, 0.34, 0.1, 0.24, std(0xf4f0e6, 0.4), 0, 0, 0, false); box(g, 0.3, 0.05, 0.2, std(0xd8903a, 0.7), 0, 0.06, 0, false); g.visible = false; scene.add(g); return g; });
  const baby = new THREE.Group(); scene.add(baby); const bb = new THREE.Mesh(new THREE.SphereGeometry(0.16, 16, 12), std(0xf4f4f8, 0.8)); bb.scale.set(1, 1.5, 1); baby.add(bb); const bh = new THREE.Mesh(new THREE.SphereGeometry(0.11, 16, 12), std(0xfbf3ea, 0.6)); bh.position.y = 0.27; baby.add(bh); ink(bb); ink(bh);
  const bf = new THREE.Mesh(new THREE.PlaneGeometry(0.14, 0.08), new THREE.MeshBasicMaterial({ map: canvasTex(128, 64, (ctx) => { ctx.fillStyle = '#301420'; for (const x of [40, 88]) { ctx.beginPath(); ctx.arc(x, 26, 13, 0, 7); ctx.fill(); ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(x + 3, 22, 4, 0, 7); ctx.fill(); ctx.fillStyle = '#301420'; } ctx.beginPath(); ctx.arc(64, 52, 6, 0, 7); ctx.fill(); }), transparent: true })); bf.position.set(0, 0.28, 0.105); baby.add(bf);
  scene.add(new THREE.HemisphereLight(0xffe8d0, 0x5a3a3a, 0.9)); const key = new THREE.SpotLight(0xffe0b8, 120, 30, 0.6, 0.5, 1.3); key.position.set(0, 9, -6); key.target.position.set(0, 0, -3); key.castShadow = true; key.shadow.bias = -0.001; key.shadow.normalBias = 0.05; scene.add(key, key.target);
  const fill = new THREE.PointLight(0xffc8a0, 10, 14, 1.5); fill.position.set(0, 3, 4); scene.add(fill);
  const cast = castOf(scene, [['hero', 'hero'], ['old', 'heroOld'], ['mom', 'mom'], ['pastor', 'pastor'], ...Array.from({ length: 8 }, (_, i) => [`c${i}`, ['townA', 'townB', 'townC', 'townD'][i % 4], { top: ['#c8322e', '#e8c23a', '#7a4fa8', '#3f9a6a', '#d98a5a', '#5a8ad0'][(i * 5) % 6] }])]);
  return finish(scene, cast, { cass, baby, flames, rays, reset() { cass.forEach((c) => (c.visible = false)); baby.visible = false; }, update(t) { flames.forEach((f, i) => f.scale.set(0.7, 1.4 + 0.25 * Math.sin(t * 11 + i * 2), 0.7)); rays.forEach((r, i) => (r.material.opacity = 0.8 + 0.2 * Math.sin(t * 0.8 + i))); } });
}

// 6. holy drive-through (exterior)
export function buildDrive() {
  _s = 251; const scene = new THREE.Scene(); scene.fog = new THREE.Fog(0xf6e2c2, 40, 160);
  skyDome(scene, skyTex([[0, '#6aaee8'], [0.45, '#b8dcf4'], [0.5, '#fde8c8'], [1, '#fde8c8']]));
  ground(scene, std(0x6a6a72, 0.8), 200); const lot = new THREE.Mesh(new THREE.PlaneGeometry(6, 30), std(0x8a8a90, 0.85)); lot.rotation.x = -Math.PI / 2; lot.position.set(0, 0.005, 0); lot.userData.noCollide = true; scene.add(lot);
  const ch = steeple(scene, -4.6, -2, '#b8b0a8', 0x7a2a2a, 0.9); ch.rotation.y = Math.PI / 2;
  const win = new THREE.Group(); win.position.set(-1.75, 0, -1.2); scene.add(win); box(win, 0.9, 1.0, 1.8, std(0xd8ccb8, 0.6), 0, 0.5, 0); box(win, 1.0, 0.08, 1.9, std(0xc0261e, 0.4), 0.05, 1.04, 0); box(win, 0.1, 0.12, 1.9, std(0xc0261e, 0.4), 0.45, 2.75, 0); for (const z of [-0.95, 0.95]) box(win, 0.9, 1.7, 0.1, std(0xc0261e, 0.4), 0, 1.9, z); box(win, 0.9, 0.12, 2.0, std(0xc0261e, 0.4), 0, 2.8, 0);
  sign(scene, 'HOLY DRIVE-THROUGH', '#c0261e', 2.4, 0.55, -1.25, 3.2, -1.2, Math.PI / 2, 54);
  const menu = new THREE.Group(); menu.position.set(-1.6, 0, 3.0); menu.rotation.y = Math.PI / 2 - 0.35; scene.add(menu); box(menu, 0.12, 1.2, 0.12, std(0x3a3a42), 0, 0.6, 0, false);
  const mt = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 1.3), new THREE.MeshBasicMaterial({ map: canvasTex(512, 416, (ctx, w, h) => { ctx.fillStyle = '#2a1a14'; ctx.fillRect(0, 0, w, h); chalk(ctx, 'MENU', 256, 50, 54, '#ffd84a'); [['Quick Prayer', 'FREE'], ['Confession', 'TO GO'], ['Blessed Fries', '$2'], ['Holy Water', 'REFILL']].forEach(([a, b], i) => { chalk(ctx, a, 30, 130 + i * 72, 40, '#ffffff', 'left'); chalk(ctx, b, 482, 130 + i * 72, 40, '#ffd84a', 'right'); }); }), toneMapped: false })); mt.position.set(0, 1.85, 0.07); menu.add(mt);
  const car = new THREE.Group(); car.position.set(0.15, 0, -1.2); scene.add(car); box(car, 1.5, 0.55, 2.8, std(0x3f7fd6, 0.3, { metalness: 0.2 }), 0, 0.55, 0); box(car, 1.3, 0.55, 1.5, std(0x3f7fd6, 0.3, { metalness: 0.2 }), 0, 1.1, -0.2);
  for (const z of [-0.2 + 0.76, -0.2 - 0.76]) box(car, 1.32, 0.42, 0.04, std(0x9ad0f0, 0.05), 0, 1.12, z, false); for (const x of [-0.66, 0.66]) box(car, 0.04, 0.42, 1.3, std(0x9ad0f0, 0.05), x, 1.12, -0.2, false);
  for (const [x, z] of [[-0.75, 0.95], [0.75, 0.95], [-0.75, -0.95], [0.75, -0.95]]) { const w = cyl(car, 0.3, 0.3, 0.22, std(0x1a1a1a, 0.8), x, 0.3, z, 18); w.rotation.z = Math.PI / 2; }
  scene.add(new THREE.HemisphereLight(0xfff0d8, 0x8a6a4a, 1.05)); sunLight(scene, 0xffe2b8, 3.0, V(-10, 16, 12), V(-2, 0, 0), 14);
  const cast = castOf(scene, [['pastor', 'pastor'], ['driver', 'townB']]);
  return finish(scene, cast, {});
}

// 7. hospital room with a live heart monitor
export function buildHospital() {
  _s = 261; const scene = new THREE.Scene(); scene.background = new THREE.Color(0xc8dcd8);
  ground(scene, std(0xd8e0dc, 0.5), 20); const wm = new THREE.MeshStandardMaterial({ map: plaster('#cfe4dc'), roughness: 0.8 }); plane(scene, 8, 4, wm, 0, 2, -2.6); plane(scene, 8, 4, wm, -3, 2, 0.5, Math.PI / 2); plane(scene, 8, 4, wm, 3, 2, 0.5, -Math.PI / 2);
  const bed = new THREE.Group(); bed.position.set(-0.3, 0, -0.8); scene.add(bed); box(bed, 1.2, 0.6, 2.3, std(0xd8dce0, 0.4), 0, 0.3, 0); box(bed, 1.1, 0.2, 2.1, std(0xf4f6f8, 0.7), 0, 0.7, 0); box(bed, 1.1, 0.16, 1.4, std(0x8ab8d8, 0.7), 0, 0.82, 0.35); box(bed, 0.8, 0.2, 0.45, std(0xffffff, 0.8), 0, 0.88, -0.75); box(bed, 1.3, 1.1, 0.08, std(0xb8c0c8, 0.4), 0, 0.75, -1.15);
  const ecg = dynTex(512, 320, (ctx, w, h, st) => { ctx.fillStyle = '#071a12'; ctx.fillRect(0, 0, w, h); ctx.strokeStyle = 'rgba(80,200,120,0.15)'; ctx.lineWidth = 2; for (let x = 0; x < w; x += 40) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke(); }
    ctx.strokeStyle = '#5aff8a'; ctx.lineWidth = 6; ctx.shadowColor = '#5aff8a'; ctx.shadowBlur = 12; ctx.beginPath(); const ph = st.ph || 0, flat = st.flat;
    for (let x = 0; x <= 440; x += 4) { const tt = x / 110 + ph; const k = tt % 1; let y = 170; if (!(flat && x > 440 * (1 - Math.min(1, flat)))) { if (k > 0.4 && k < 0.45) y = 170 - 90 * Math.sin((k - 0.4) / 0.05 * Math.PI); else if (k > 0.45 && k < 0.5) y = 170 + 30 * Math.sin((k - 0.45) / 0.05 * Math.PI); } x === 0 ? ctx.moveTo(x + 20, y) : ctx.lineTo(x + 20, y); } ctx.stroke(); ctx.shadowBlur = 0;
    chalk(ctx, flat ? '0' : '72', 470, 80, 56, flat ? '#ff4a3a' : '#5aff8a'); chalk(ctx, 'BPM', 470, 128, 24, '#5aff8a'); });
  const mon = new THREE.Group(); mon.position.set(1.2, 0, -1.6); mon.rotation.y = -0.4; scene.add(mon); box(mon, 0.08, 1.3, 0.08, std(0x8a929c), 0, 0.65, 0, false); box(mon, 0.8, 0.52, 0.12, std(0x2a2e34, 0.4), 0, 1.5, 0); const scr = new THREE.Mesh(new THREE.PlaneGeometry(0.7, 0.44), new THREE.MeshBasicMaterial({ map: ecg.tex, toneMapped: false })); scr.position.set(0, 1.5, 0.065); mon.add(scr); ecg.set({});
  const vase = new THREE.Group(); vase.position.set(-1.6, 0.8, -1.9); scene.add(vase); box(scene, 0.8, 0.8, 0.6, std(0xd8ccb8, 0.5), -1.6, 0.4, -1.9); cyl(vase, 0.1, 0.08, 0.3, std(0x7ab8d8, 0.2), 0, 0.15, 0, 12); for (let i = 0; i < 5; i++) { const f = new THREE.Mesh(new THREE.SphereGeometry(0.07, 10, 8), std([0xe8455a, 0xf2c440, 0xf08ac0][i % 3], 0.6)); f.position.set(Math.sin(i * 1.3) * 0.12, 0.42 + (i % 2) * 0.08, Math.cos(i * 1.3) * 0.08); vase.add(f); }
  const photo = new THREE.Mesh(new THREE.PlaneGeometry(0.6, 0.45), new THREE.MeshStandardMaterial({ map: canvasTex(320, 240, (ctx, w, h) => { ctx.fillStyle = '#e2b13c'; ctx.fillRect(0, 0, w, h); ctx.fillStyle = '#fdf0dc'; ctx.fillRect(16, 16, w - 32, h - 32); for (let i = 0; i < 6; i++) { ctx.fillStyle = ['#c8322e', '#e8c23a', '#7a4fa8', '#3f9a6a', '#e8879a', '#3f6fd6'][i]; ctx.beginPath(); ctx.arc(60 + i * 40, 150, 22, 0, 7); ctx.fill(); ctx.fillStyle = '#fbf6ee'; ctx.beginPath(); ctx.arc(60 + i * 40, 110, 18, 0, 7); ctx.fill(); } chalk(ctx, 'CHURCH FAMILY ♥', 160, 50, 30, '#c0392b'); }) })); photo.position.set(-1.6, 1.8, -2.58); scene.add(photo);
  scene.add(new THREE.HemisphereLight(0xf4fff8, 0x8aa8a0, 1.0)); const key = new THREE.DirectionalLight(0xfff4e8, 1.6); key.position.set(3, 6, 4); key.castShadow = true; scene.add(key);
  const cast = castOf(scene, [['old', 'heroOld']]);
  return finish(scene, cast, { ecgSet: ecg.set, bed });
}

// 8. the white room: endless white floor, God's orb, the pit of fire, a floating board
export function buildWhite() {
  _s = 271; const scene = new THREE.Scene(); scene.background = new THREE.Color(0xf8f6f2); scene.fog = new THREE.Fog(0xf8f6f2, 14, 60);
  const floor = new THREE.Mesh(new THREE.RingGeometry(3.2, 200, 64, 1), std(0xffffff, 0.9)); floor.rotation.x = -Math.PI / 2; floor.position.set(0, 0, -5); floor.receiveShadow = true; floor.userData.noCollide = true; scene.add(floor); /* a real hole: people fall in */
  const orb = new THREE.Group(); orb.position.set(0, 7.5, -14); scene.add(orb);
  const core = new THREE.Mesh(new THREE.SphereGeometry(2.4, 40, 24), new THREE.MeshBasicMaterial({ color: new THREE.Color(3.2, 2.9, 2.1), toneMapped: false })); orb.add(core);
  const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex('255,236,180'), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, color: new THREE.Color(1.6, 1.4, 1.0) })); glow.scale.set(14, 14, 1); orb.add(glow);
  const rays = new THREE.Group(); orb.add(rays); const rayTex = canvasTex(64, 512, (ctx, w, h) => { const g = ctx.createLinearGradient(0, h, 0, 0); g.addColorStop(0, 'rgba(255,240,200,0.7)'); g.addColorStop(1, 'rgba(255,240,200,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(w / 2 - 6, h); ctx.lineTo(w / 2 + 6, h); ctx.lineTo(w, 0); ctx.lineTo(0, 0); ctx.fill(); });
  for (let i = 0; i < 12; i++) { const r = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 12), new THREE.MeshBasicMaterial({ map: rayTex, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide })); r.geometry.translate(0, 6, 0); r.rotation.z = i * Math.PI / 6; rays.add(r); }
  const pit = new THREE.Group(); pit.position.set(0, 0.01, -5); scene.add(pit);
  const pitTex = canvasTex(512, 512, (ctx, w, h) => { const g = ctx.createRadialGradient(256, 256, 20, 256, 256, 256); g.addColorStop(0, '#fff2a0'); g.addColorStop(0.35, '#ff9a20'); g.addColorStop(0.75, '#e2321a'); g.addColorStop(0.95, '#6a0a0a'); g.addColorStop(1, '#2a0606'); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(256, 256, 256, 0, 7); ctx.fill(); });
  const shaftTex = canvasTex(64, 256, (ctx, w, h) => { const g = ctx.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#5a0a06'); g.addColorStop(0.5, '#e2321a'); g.addColorStop(1, '#ffd060'); ctx.fillStyle = g; ctx.fillRect(0, 0, w, h); });
  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(3.2, 3.2, 8, 48, 1, true), new THREE.MeshBasicMaterial({ map: shaftTex, side: THREE.BackSide, toneMapped: false, color: new THREE.Color(1.4, 1.3, 1.2) })); shaft.position.y = -4; pit.add(shaft);
  const hole = new THREE.Mesh(new THREE.CircleGeometry(3.2, 48), new THREE.MeshBasicMaterial({ map: pitTex, toneMapped: false, color: new THREE.Color(1.8, 1.7, 1.5) })); hole.rotation.x = -Math.PI / 2; hole.position.y = -8; pit.add(hole); const rim = new THREE.Mesh(new THREE.RingGeometry(3.2, 3.35, 48), new THREE.MeshBasicMaterial({ color: 0x301420 })); rim.rotation.x = -Math.PI / 2; rim.position.y = 0.005; pit.add(rim);
  const flames = []; const flameTex = canvasTex(64, 128, (ctx, w, h) => { const g = ctx.createRadialGradient(32, 96, 4, 32, 80, 60); g.addColorStop(0, 'rgba(255,240,160,1)'); g.addColorStop(0.4, 'rgba(255,140,30,0.9)'); g.addColorStop(1, 'rgba(220,40,10,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(32, 0); ctx.quadraticCurveTo(64, 70, 50, 120); ctx.lineTo(14, 120); ctx.quadraticCurveTo(0, 70, 32, 0); ctx.fill(); });
  for (let i = 0; i < 22; i++) { const f = new THREE.Sprite(new THREE.SpriteMaterial({ map: flameTex, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, color: new THREE.Color(2, 1.6, 1.2) })); const a = i / 22 * Math.PI * 2, r = R(0.3, 2.8); f.position.set(Math.cos(a) * r, 0.8, Math.sin(a) * r); f.userData.p = [a, r, R(0, 6)]; pit.add(f); flames.push(f); }
  const pitLight = new THREE.PointLight(0xff7a2a, 30, 14, 1.4); pitLight.position.set(0, 1.0, -5); scene.add(pitLight);
  const board = makeBoard(); board.position.set(2.6, 0.6, -2.2); board.rotation.y = -0.35; board.userData.easel.forEach((e) => (e.visible = false)); scene.add(board);
  scene.add(new THREE.HemisphereLight(0xffffff, 0xeeeae2, 1.4)); const key = new THREE.DirectionalLight(0xfff4e0, 1.0); key.position.set(0, 10, -8); key.castShadow = true; scene.add(key);
  const cast = castOf(scene, [['old', 'heroOld'], ['pastor', 'pastor'], ['mom', 'mom'], ['philo', 'philo'], ...Array.from({ length: 6 }, (_, i) => [`f${i}`, ['townA', 'townB', 'townC', 'townD'][i % 4], { top: ['#c8322e', '#e8c23a', '#7a4fa8', '#3f9a6a', '#d98a5a', '#5a8ad0'][(i * 5) % 6] }])]);
  return finish(scene, cast, { orb, core, rays, glow, pit, board, boardSet: board.userData.set, exposure: 1.0, reset() { board.userData.set({}); board.visible = false; },
    update(t) { rays.rotation.z = t * 0.12; flames.forEach((f) => { const [a, r, o] = f.userData.p; const k = ((t * 1.3 + o) % 1); f.position.set(Math.cos(a + t * 0.2) * r, 0.3 + k * 1.6, Math.sin(a + t * 0.2) * r); const s = (1 - k) * 1.6 + 0.3; f.scale.set(s * 0.6, s, 1); f.material.opacity = 1 - k; }); pitLight.intensity = 30 + 6 * Math.sin(t * 9); } });
}

// 9. hell: dark red ground with glowing lava cracks, jagged rocks, embers
export function buildHell() {
  _s = 281; const scene = new THREE.Scene(); scene.fog = new THREE.Fog(0x3a0a08, 18, 70);
  skyDome(scene, skyTex([[0, '#1a0404'], [0.35, '#6a1208'], [0.5, '#e2501a'], [1, '#e2501a']]));
  const crack = canvasTex(512, 512, (ctx, w, h) => { ctx.fillStyle = '#3a0c0a'; ctx.fillRect(0, 0, w, h); ctx.strokeStyle = '#ff8a2a'; ctx.lineCap = 'round'; ctx.shadowColor = '#ffb040'; ctx.shadowBlur = 14; for (let i = 0; i < 14; i++) { ctx.lineWidth = R(3, 8); ctx.beginPath(); let x = R(0, w), y = R(0, h); ctx.moveTo(x, y); for (let k = 0; k < 6; k++) { x += R(-70, 70); y += R(-70, 70); ctx.lineTo(x, y); } ctx.stroke(); } }, [6, 6]);
  const gm = new THREE.MeshStandardMaterial({ map: crack, emissive: 0xffffff, emissiveMap: crack, emissiveIntensity: 0.9, roughness: 0.8 }); ground(scene, gm, 120);
  for (let i = 0; i < 26; i++) { const r = new THREE.Mesh(new THREE.ConeGeometry(R(0.6, 2.2), R(2, 7), 5), std(0x2a0a0a, 0.9)); const a = R(0, Math.PI * 2), d = R(7, 30); r.position.set(Math.cos(a) * d, 0, Math.sin(a) * d - 6); r.position.y = r.geometry.parameters.height / 2 - 0.2; r.rotation.set(R(-0.15, 0.15), R(0, 3), R(-0.15, 0.15)); ink(r); scene.add(r); }
  const embers = []; const et = glowTex('255,160,60'); for (let i = 0; i < 60; i++) { const e = new THREE.Sprite(new THREE.SpriteMaterial({ map: et, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, color: new THREE.Color(2, 1.4, 0.8) })); e.userData.p = [R(-6, 6), R(-8, 3), R(0, 1), R(0.05, 0.14)]; scene.add(e); embers.push(e); }
  const flameTex = canvasTex(64, 128, (ctx, w, h) => { const g = ctx.createRadialGradient(32, 96, 4, 32, 80, 60); g.addColorStop(0, 'rgba(255,240,160,1)'); g.addColorStop(0.4, 'rgba(255,140,30,0.9)'); g.addColorStop(1, 'rgba(220,40,10,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(32, 0); ctx.quadraticCurveTo(64, 70, 50, 120); ctx.lineTo(14, 120); ctx.quadraticCurveTo(0, 70, 32, 0); ctx.fill(); });
  const flames = []; for (let i = 0; i < 18; i++) { const f = new THREE.Sprite(new THREE.SpriteMaterial({ map: flameTex, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, color: new THREE.Color(2, 1.5, 1.1) })); f.userData.p = [R(-4, 4), R(-1, 2.5), R(0, 5)]; scene.add(f); flames.push(f); }
  scene.add(new THREE.HemisphereLight(0xff8a4a, 0x3a0808, 0.9)); const key = new THREE.PointLight(0xff6a2a, 40, 20, 1.3); key.position.set(0, 1.0, 1.5); scene.add(key);
  const rim = new THREE.DirectionalLight(0xffb070, 1.4); rim.position.set(-4, 5, -6); scene.add(rim);
  const cast = castOf(scene, [['old', 'heroOld'], ['pastor', 'pastor'], ['mom', 'mom'], ['philo', 'philo']]);
  return finish(scene, cast, { exposure: 1.05, update(t) { embers.forEach((e) => { const [x, z, o, s] = e.userData.p; const k = (t * 0.25 + o) % 1; e.position.set(x + Math.sin(t + o * 9) * 0.3, k * 5, z); e.scale.setScalar(s); e.material.opacity = 1 - k; });
    flames.forEach((f) => { const [x, z, o] = f.userData.p; const k = (t * 1.1 + o) % 1; f.position.set(x, 0.2 + k * 1.2, z); const s = (1 - k) * 1.3 + 0.3; f.scale.set(s * 0.55, s, 1); f.material.opacity = 1 - k; }); key.intensity = 40 + 8 * Math.sin(t * 7); } });
}

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
    ctx.fillStyle = fg; ctx.font = `bold ${font}px "DejaVu Sans", sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; const lines = text.split('\n'); lines.forEach((l, i) => ctx.fillText(l, w / 2, h / 2 + (i - (lines.length - 1) / 2) * font * 1.05)); });
}
function windowsTex(wall, glass, rows = 6, cols = 3, lit = 0.3) { // building facade, big soft windows
  return canvasTex(256, 512, (ctx, w, h) => { ctx.fillStyle = wall; ctx.fillRect(0, 0, w, h); spots(ctx, w, h, 20, '255,255,255', 30, 80, 0.06);
    const cw = w / cols, rh = h / rows; for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) { const x = c * cw + cw * 0.2, y = r * rh + rh * 0.2;
      ctx.fillStyle = '#5a3a26'; ctx.fillRect(x - 4, y - 4, cw * 0.6 + 8, rh * 0.6 + 8); ctx.fillStyle = rnd() < lit ? '#ffd890' : glass; ctx.fillRect(x, y, cw * 0.6, rh * 0.6);
      ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.fillRect(x + 4, y + 4, cw * 0.15, rh * 0.45); } });
}

// thin warm-brown ink on set pieces (~2.5 px at 1080)
export const INK_LINES = [];
const lineMat = () => { const m = new LineMaterial({ color: 0x3a2216, linewidth: 2.4, transparent: true, opacity: 0.9 }); m.resolution.set(1080, 1920); INK_LINES.push(m); return m; };
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

// Sets for "The New Boy": two classrooms (SS1A / SS1B), the principal's office, Dad's shop, and props.
// Textures are deliberately low-frequency (big soft shapes, no thin high-contrast lines) so they don't shimmer.
import * as THREE from 'three';
import { Puppet } from './puppet.js';
import { LineSegments2 } from 'three/addons/lines/LineSegments2.js';
import { LineSegmentsGeometry } from 'three/addons/lines/LineSegmentsGeometry.js';
import { LineMaterial } from 'three/addons/lines/LineMaterial.js';

let _s = 7;
export const rnd = () => { _s |= 0; _s = (_s + 0x6D2B79F5) | 0; let t = Math.imul(_s ^ (_s >>> 15), 1 | _s); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
const R = (a, b) => a + (b - a) * rnd();

function canvasTex(w, h, draw, repeat) {
  const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 16; t.generateMipmaps = true; t.minFilter = THREE.LinearMipmapLinearFilter;
  if (repeat) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(...repeat); }
  return t;
}
const softSpots = (ctx, w, h, n, cols, r0, r1, a = 0.08) => { for (let i = 0; i < n; i++) { const x = R(0, w), y = R(0, h), r = R(r0, r1); const g = ctx.createRadialGradient(x, y, 0, x, y, r); const c = cols[i % cols.length]; g.addColorStop(0, c.replace(')', `,${a})`).replace('rgb', 'rgba')); g.addColorStop(1, c.replace(')', ',0)').replace('rgb', 'rgba')); ctx.fillStyle = g; ctx.fillRect(x - r, y - r, 2 * r, 2 * r); } };

// painted wall: two-tone with a soft dado band, gentle mottling (no fine lines)
function wallTex(lower, upper, band) {
  return canvasTex(512, 512, (ctx, w, h) => {
    ctx.fillStyle = upper; ctx.fillRect(0, 0, w, h); ctx.fillStyle = lower; ctx.fillRect(0, h * 0.58, w, h * 0.42);
    const g = ctx.createLinearGradient(0, h * 0.55, 0, h * 0.61); g.addColorStop(0, band); g.addColorStop(1, lower); ctx.fillStyle = g; ctx.fillRect(0, h * 0.555, w, h * 0.06);
    softSpots(ctx, w, h, 40, ['rgb(255,255,255)', 'rgb(0,0,0)'], 40, 120, 0.05);
  }, [2, 1]);
}
function floorTex() { // big soft terrazzo tiles
  return canvasTex(512, 512, (ctx, w, h) => {
    ctx.fillStyle = '#c9bfae'; ctx.fillRect(0, 0, w, h);
    for (let y = 0; y < 2; y++) for (let x = 0; x < 2; x++) { ctx.fillStyle = (x + y) % 2 ? '#d3cab9' : '#c2b7a4'; ctx.fillRect(x * 256 + 3, y * 256 + 3, 250, 250); }
    softSpots(ctx, w, h, 140, ['rgb(120,100,80)', 'rgb(250,245,235)'], 6, 18, 0.25);
  }, [6, 7]);
}
function woodTex(base = '#9a6a3c') {
  return canvasTex(256, 256, (ctx, w, h) => {
    ctx.fillStyle = base; ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 9; i++) { ctx.fillStyle = `rgba(60,30,10,${R(0.04, 0.1)})`; ctx.fillRect(0, R(0, h), w, R(10, 30)); }
    softSpots(ctx, w, h, 12, ['rgb(255,220,170)'], 30, 70, 0.08);
  });
}
function boardTex(cls, subject, lines) {
  return canvasTex(1024, 512, (ctx, w, h) => {
    const g = ctx.createLinearGradient(0, 0, w, h); g.addColorStop(0, '#2e5458'); g.addColorStop(1, '#22423f'); ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
    softSpots(ctx, w, h, 30, ['rgb(255,255,255)'], 40, 140, 0.05);
    ctx.fillStyle = 'rgba(245,245,235,0.92)'; ctx.font = 'bold 54px "Comic Sans MS", "DejaVu Sans", sans-serif';
    ctx.fillText(cls, 40, 80); ctx.font = 'bold 46px "DejaVu Sans", sans-serif'; ctx.fillText(subject, 300, 80);
    ctx.font = '36px "DejaVu Sans", sans-serif'; lines.forEach((l, i) => ctx.fillText(l, 60, 170 + i * 62));
    ctx.strokeStyle = 'rgba(245,245,235,0.8)'; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(300, 100); ctx.lineTo(980, 100); ctx.stroke();
  });
}
function noteTex(value) { // stylised dollar bills (not replicas)
  const col = ['#3f7a52', value === 20 ? '#b8dcae' : '#a8d4a0'];
  return canvasTex(256, 128, (ctx, w, h) => {
    const g = ctx.createLinearGradient(0, 0, w, 0); g.addColorStop(0, col[1]); g.addColorStop(1, col[0]); ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = 'rgba(255,255,255,0.7)'; ctx.lineWidth = 6; ctx.strokeRect(8, 8, w - 16, h - 16);
    ctx.fillStyle = '#fff'; ctx.font = 'bold 52px "DejaVu Sans", sans-serif'; ctx.fillText('$' + value, 20, 62); ctx.font = 'bold 22px "DejaVu Sans", sans-serif'; ctx.fillText('DOLLARS', 22, 104);
    ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.beginPath(); ctx.arc(190, 64, 38, 0, 7); ctx.fill();
  });
}
function glowTex(inner = 'rgba(255,230,180,1)') {
  return canvasTex(128, 128, (ctx) => { const g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64); g.addColorStop(0, inner); g.addColorStop(1, 'rgba(0,0,0,0)'); ctx.fillStyle = g; ctx.fillRect(0, 0, 128, 128); });
}
function rayTex() { return canvasTex(64, 256, (ctx, w, h) => { const g = ctx.createLinearGradient(0, 0, 0, h); g.addColorStop(0, 'rgba(255,236,190,0.6)'); g.addColorStop(1, 'rgba(255,236,190,0)'); ctx.fillStyle = g; ctx.fillRect(0, 0, w, h); }); }

const M = {};
function mats() {
  if (M.ok) return M;
  M.wood = new THREE.MeshStandardMaterial({ map: woodTex(), roughness: 0.45 });
  M.darkwood = new THREE.MeshStandardMaterial({ map: woodTex('#6a4426'), roughness: 0.4 });
  M.metal = new THREE.MeshStandardMaterial({ color: 0x8a929c, metalness: 0.8, roughness: 0.3 });
  M.black = new THREE.MeshStandardMaterial({ color: 0x1d1d22, roughness: 0.35 });
  M.white = new THREE.MeshStandardMaterial({ color: 0xf2f0ea, roughness: 0.5 });
  M.glass = new THREE.MeshBasicMaterial({ map: canvasTex(256, 192, (ctx, w, h) => { const g = ctx.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#8cc6e8'); g.addColorStop(0.55, '#fde2b4'); g.addColorStop(1, '#f6c48a'); ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = 'rgba(255,255,255,0.85)'; for (const [x, y, r] of [[60, 50, 26], [90, 44, 30], [120, 54, 22], [190, 70, 20], [212, 64, 24]]) { ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fill(); }
    ctx.fillStyle = '#6a9a5a'; for (let i = 0; i < 9; i++) { ctx.beginPath(); ctx.arc(i * 32 + 10, h - 30 + (i % 3) * 6, 24, 0, 7); ctx.fill(); } }), toneMapped: false });
  M.ok = true; return M;
}
export const INK_LINES = [];
const inkMat = () => { const m = new LineMaterial({ color: 0x3a2216, linewidth: 2.6, transparent: true, opacity: 0.9 }); m.resolution.set(1080, 1920); INK_LINES.push(m); return m; };
const ink = (mesh) => { // thin warm-brown outline on set pieces/props (references ink their worlds lightly)
  const eg = new THREE.EdgesGeometry(mesh.geometry, 35); const g = new LineSegmentsGeometry().fromEdgesGeometry(eg);
  const e = new LineSegments2(g, inkMat()); e.userData.noCollide = true; mesh.add(e); return mesh;
};
function box(parent, w, h, d, mat, x, y, z, edge = true) { const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat); b.position.set(x, y, z); b.castShadow = b.receiveShadow = true; if (edge) ink(b); parent.add(b); return b; }

// ---------------------------------------------------------------- props
export function makeBag(color = 0x2f6a4a) {
  const g = new THREE.Group(); const m = new THREE.MeshStandardMaterial({ color, roughness: 0.55 });
  const b = box(g, 0.5, 0.42, 0.22, m, 0, 0.21, 0); b.geometry = new THREE.BoxGeometry(0.5, 0.42, 0.22, 2, 2, 2);
  const flap = box(g, 0.52, 0.2, 0.24, new THREE.MeshStandardMaterial({ color: new THREE.Color(color).multiplyScalar(0.8), roughness: 0.5 }), 0, 0.36, 0.01); g.userData.flap = flap;
  box(g, 0.08, 0.04, 0.02, M.metal || mats().metal, 0, 0.27, 0.125, false);
  return g;
}
export function makeNotebook(color = 0xe86a9a) {
  const g = new THREE.Group(); box(g, 0.34, 0.03, 0.46, new THREE.MeshStandardMaterial({ color, roughness: 0.5 }), 0, 0, 0);
  const label = new THREE.Mesh(new THREE.PlaneGeometry(0.2, 0.08), new THREE.MeshBasicMaterial({ color: 0xffffff })); label.rotation.x = -Math.PI / 2; label.position.set(0, 0.017, -0.08); g.add(label);
  return g;
}
export function makeNotes(values) { // a small fan of banknotes held in a hand
  const g = new THREE.Group();
  values.forEach((v, i) => { const n = new THREE.Mesh(new THREE.PlaneGeometry(0.34, 0.17), new THREE.MeshStandardMaterial({ map: noteTex(v), roughness: 0.6, side: THREE.DoubleSide })); n.position.set(i * 0.06, i * 0.02, i * 0.004); n.rotation.z = (i - (values.length - 1) / 2) * 0.22; g.add(n); });
  return g;
}

// ---------------------------------------------------------------- classroom
export function buildClassroom({ cls = 'SS1A', wall = ['#4f8486', '#f2c9a0', '#3d6a6c'], seed = 7 } = {}) {
  _s = seed; mats();
  const scene = new THREE.Scene(); scene.background = new THREE.Color(0xf3e6c8);
  const add = (o) => { scene.add(o); return o; };
  const W = 13, D = 15, H = 4.4;
  const floor = add(new THREE.Mesh(new THREE.PlaneGeometry(W, D), new THREE.MeshStandardMaterial({ map: floorTex(), roughness: 0.25, metalness: 0.02 })));
  floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; floor.userData.noCollide = true;
  const wm = new THREE.MeshStandardMaterial({ map: wallTex(...wall), roughness: 0.7 });
  const walls = [[0, H / 2, -D / 2, 0, W], [0, H / 2, D / 2, Math.PI, W], [-W / 2, H / 2, 0, Math.PI / 2, D], [W / 2, H / 2, 0, -Math.PI / 2, D]];
  for (const [x, y, z, ry, len] of walls) { const p = add(new THREE.Mesh(new THREE.PlaneGeometry(len, H), wm)); p.position.set(x, y, z); p.rotation.y = ry; p.receiveShadow = true; p.userData.noCollide = true; }
  const ceil = add(new THREE.Mesh(new THREE.PlaneGeometry(W, D), new THREE.MeshStandardMaterial({ color: 0xf6f1e4, roughness: 0.9 }))); ceil.rotation.x = Math.PI / 2; ceil.position.y = H; ceil.userData.noCollide = true;
  // chalkboard + teacher's table
  const board = add(new THREE.Mesh(new THREE.PlaneGeometry(6.4, 2.0), new THREE.MeshStandardMaterial({ map: boardTex(cls === 'SS1A' ? '7A' : '7B', cls === 'SS1A' ? 'BIOLOGY' : 'ENGLISH', cls === 'SS1A' ? ['Topic: Classification', '- Kingdom, Phylum, Class...', 'NOTE: copy all notes!'] : ['Topic: Comprehension', '- Read page 42', '- Answer questions 1-5']), roughness: 0.55 })));
  board.position.set(-0.5, 2.25, -D / 2 + 0.03); ink(board);
  box(scene, 6.6, 0.12, 0.12, M.darkwood, -0.5, 1.22, -D / 2 + 0.08);
  const ttable = new THREE.Group(); ttable.position.set(3.6, 0, -5.2); add(ttable);
  box(ttable, 1.8, 0.08, 0.9, M.darkwood, 0, 0.92, 0); for (const [x, z] of [[-0.8, -0.38], [0.8, -0.38], [-0.8, 0.38], [0.8, 0.38]]) box(ttable, 0.07, 0.9, 0.07, M.darkwood, x, 0.45, z);
  box(ttable, 0.5, 0.18, 0.35, new THREE.MeshStandardMaterial({ color: 0x3a6fb0, roughness: 0.5 }), -0.4, 1.05, 0); // books
  // windows (left wall) with sunlight shafts
  const glow = glowTex();
  for (const z of [-4.5, -0.5, 3.5]) {
    const win = add(new THREE.Mesh(new THREE.PlaneGeometry(2.2, 1.6), M.glass)); win.position.set(-W / 2 + 0.02, 2.5, z); win.rotation.y = Math.PI / 2;
    for (let k = 0; k < 6; k++) box(scene, 0.04, 0.05, 2.2, M.metal, -W / 2 + 0.06, 1.8 + k * 0.28, z, false); // louvres
    const frame = add(new THREE.Mesh(new THREE.BoxGeometry(0.1, 1.8, 2.4), new THREE.MeshStandardMaterial({ color: 0xf2efe6, roughness: 0.5 }))); frame.position.set(-W / 2 + 0.03, 2.5, z); frame.scale.set(1, 1, 1); frame.material.transparent = true; frame.material.opacity = 0; // invisible spacer
    const ray = add(new THREE.Mesh(new THREE.PlaneGeometry(2.0, 6), new THREE.MeshBasicMaterial({ map: rayTex(), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, opacity: 0.55 })));
    ray.position.set(-W / 2 + 1.8, 1.9, z + 0.6); ray.rotation.set(0, Math.PI / 2, -0.85); ray.userData.noCollide = true;
  }
  // door (right wall, front) — hinged so Kemi can burst in
  const doorPivot = new THREE.Group(); doorPivot.position.set(W / 2 - 0.02, 0, -4.6); add(doorPivot);
  const door = box(doorPivot, 0.08, 2.4, 1.2, new THREE.MeshStandardMaterial({ map: woodTex('#7a4a28'), roughness: 0.4 }), 0, 1.2, 0.6);
  box(doorPivot, 0.12, 0.06, 0.14, M.metal, -0.06, 1.15, 1.05, false);
  // notice board + clock (back/side walls)
  const nb = add(new THREE.Mesh(new THREE.PlaneGeometry(2.6, 1.3), new THREE.MeshStandardMaterial({ map: canvasTex(512, 256, (ctx, w, h) => { ctx.fillStyle = '#b8864c'; ctx.fillRect(0, 0, w, h); const cards = [['#fff7c2', 'LOST', '& FOUND'], ['#c8f0ff', 'NO', 'STEALING!'], ['#ffd0d8', 'STUDENT OF', 'THE MONTH'], ['#d8ffd0', 'NOTES DUE', 'FRIDAY']]; cards.forEach(([c, a, b], i) => { ctx.save(); ctx.translate(70 + i * 120, 80 + (i % 2) * 90); ctx.rotate((i % 2 ? 1 : -1) * 0.08); ctx.fillStyle = c; ctx.fillRect(-55, -42, 110, 84); ctx.fillStyle = '#3a2216'; ctx.font = 'bold 17px "DejaVu Sans"'; ctx.fillText(a, -46, -8); ctx.fillText(b, -46, 16); ctx.restore(); }); }), roughness: 0.8 })));
  nb.position.set(0, 2.4, D / 2 - 0.03); nb.rotation.y = Math.PI; ink(nb);
  const clock = add(new THREE.Mesh(new THREE.CircleGeometry(0.32, 32), new THREE.MeshStandardMaterial({ map: canvasTex(128, 128, (ctx) => { ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(64, 64, 62, 0, 7); ctx.fill(); ctx.strokeStyle = '#222'; ctx.lineWidth = 8; ctx.stroke(); ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(64, 64); ctx.lineTo(64, 24); ctx.moveTo(64, 64); ctx.lineTo(92, 70); ctx.stroke(); }), roughness: 0.4 })));
  clock.position.set(W / 2 - 0.03, 3.5, 1); clock.rotation.y = -Math.PI / 2;
  // ceiling fans
  const fans = [];
  for (const z of [-2.5, 3]) { const f = new THREE.Group(); f.position.set(0, H - 0.5, z); add(f); box(f, 0.05, 0.5, 0.05, M.metal, 0, 0.25, 0, false); const hub = new THREE.Group(); f.add(hub); for (let k = 0; k < 3; k++) { const b = box(hub, 1.1, 0.02, 0.18, M.white, 0.6, 0, 0, false); b.parent.remove(b); const arm = new THREE.Group(); arm.rotation.y = k * Math.PI * 2 / 3; arm.add(b); hub.add(arm); } fans.push(hub); }
  // desks + benches in rows; seats[] are sitting positions (x, z) facing the board (-z)
  const seats = [];
  for (const x of [-3.6, 0, 3.6]) for (const z of [-2.2, 0.4, 3.0, 5.6]) {
    const g = new THREE.Group(); g.position.set(x, 0, z); add(g);
    box(g, 2.2, 0.07, 0.62, M.wood, 0, 0.82, -0.3); for (const dx of [-1.0, 1.0]) { box(g, 0.06, 0.82, 0.06, M.darkwood, dx, 0.41, -0.52); box(g, 0.06, 0.82, 0.06, M.darkwood, dx, 0.41, -0.08); }
    box(g, 2.2, 0.06, 0.34, M.wood, 0, 0.47, 0.32); for (const dx of [-1.0, 1.0]) box(g, 0.06, 0.47, 0.06, M.darkwood, dx, 0.235, 0.32);
    seats.push(new THREE.Vector3(x - 0.5, 0, z + 0.3), new THREE.Vector3(x + 0.5, 0, z + 0.3));
  }
  // lights
  add(new THREE.HemisphereLight(0xffe6c4, 0x8a5636, 1.15));
  const sun = add(new THREE.DirectionalLight(0xffd9a8, 3.0)); sun.position.set(-14, 9, 3); sun.target.position.set(0, 0, 0); add(sun.target);
  sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048); Object.assign(sun.shadow.camera, { left: -10, right: 10, top: 10, bottom: -10, near: 1, far: 40 }); sun.shadow.bias = -0.0008; sun.shadow.normalBias = 0.05;
  const fill = add(new THREE.PointLight(0xffe2c0, 5, 14, 1.5)); fill.position.set(2, 3.6, 2);
  const blinds = add(new THREE.SpotLight(0xffd8a0, 40, 30, 0.42, 0.3, 1.2)); blinds.position.set(-6.2, 2.8, 0.4);
  blinds.map = canvasTex(256, 256, (ctx, w, h) => { ctx.fillStyle = '#000'; ctx.fillRect(0, 0, w, h); ctx.fillStyle = '#fff'; for (let y = 8; y < h; y += 34) ctx.fillRect(0, y, w, 20); });
  blinds.castShadow = true; blinds.shadow.mapSize.set(1024, 1024); blinds.shadow.bias = -0.0008; blinds.shadow.normalBias = 0.05; add(blinds.target); blinds.target.position.set(1.6, 1.5, 0.2);
  const motes = (() => { const g = new THREE.BufferGeometry(); const p = []; for (let i = 0; i < 220; i++) p.push(R(-6, 1), R(0.6, 3.6), R(-6, 6)); g.setAttribute('position', new THREE.Float32BufferAttribute(p, 3));
    return add(new THREE.Points(g, new THREE.PointsMaterial({ map: glowTex('rgba(255,236,200,1)'), size: 0.05, transparent: true, opacity: 0.8, depthWrite: false, blending: THREE.AdditiveBlending }))); })();
  motes.userData.noCollide = true;
  // props
  const bag = makeBag(0x2f6a4a); add(bag); const nbook = makeNotebook(); add(nbook); const notesHeld = makeNotes([10, 10]); add(notesHeld); const note1000 = makeNotes([20]); add(note1000); const pocketNote = makeNotes([10]); add(pocketNote);
  for (const p of [bag, nbook, notesHeld, note1000, pocketNote]) p.visible = false;
  const cast = {
    tobi: new Puppet('tobi', { seedOffset: 1 }), kemi: new Puppet('kemi', { seedOffset: 2 }), ada: new Puppet('ada', { seedOffset: 3 }),
    boyA: new Puppet('boyA', { seedOffset: 4 }), boyB: new Puppet('boyB', { seedOffset: 5 }), girlB: new Puppet('girlB', { seedOffset: 6 }),
    boyC: new Puppet('boyA', { seedOffset: 7, H: 1.84, width: 0.23 }), girlC: new Puppet('kemi', { seedOffset: 8, H: 1.8, blush: false }),
    teacher: new Puppet('teacher', { seedOffset: 9 }), teacherM: new Puppet('teacherM', { seedOffset: 10 }), president: new Puppet('president', { seedOffset: 11 }),
  };
  Object.values(cast).forEach((c) => add(c.root));
  return {
    scene, cast, seats, doorPivot, bag, nbook, notesHeld, note1000, pocketNote, exposure: 1.0,
    reset() { doorPivot.rotation.y = 0; for (const p of [bag, nbook, notesHeld, note1000, pocketNote]) { p.visible = false; p.rotation.set(0, 0, 0); } },
    update(t, cam) { fans.forEach((f, i) => (f.rotation.y = t * (5 + i))); motes.rotation.y = Math.sin(t * 0.1) * 0.05; motes.position.y = Math.sin(t * 0.3) * 0.08; Object.values(cast).forEach((c) => { if (c.root.visible) c.update(t, cam); }); },
  };
}

// ---------------------------------------------------------------- principal's office
export function buildOffice() {
  _s = 31; mats();
  const scene = new THREE.Scene(); scene.background = new THREE.Color(0xe9dcc0);
  const add = (o) => { scene.add(o); return o; };
  const W = 8, D = 8, H = 3.8;
  const floor = add(new THREE.Mesh(new THREE.PlaneGeometry(W, D), new THREE.MeshStandardMaterial({ map: canvasTex(256, 256, (ctx, w, h) => { ctx.fillStyle = '#8a3b2a'; ctx.fillRect(0, 0, w, h); ctx.strokeStyle = '#c99a4a'; ctx.lineWidth = 14; ctx.strokeRect(20, 20, w - 40, h - 40); softSpots(ctx, w, h, 20, ['rgb(0,0,0)'], 30, 80, 0.08); }, [1, 1]), roughness: 0.85 })));
  floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; floor.userData.noCollide = true;
  const floor2 = add(new THREE.Mesh(new THREE.PlaneGeometry(W, D), new THREE.MeshStandardMaterial({ map: woodTex('#a8784a'), roughness: 0.25 }))); floor2.rotation.x = -Math.PI / 2; floor2.position.y = -0.005; floor2.scale.set(1.01, 1.01, 1); floor2.userData.noCollide = true;
  floor.scale.set(0.6, 0.55, 1); floor.position.y = 0.004;
  const wm = new THREE.MeshStandardMaterial({ map: wallTex('#7a5634', '#efe2c4', '#5a3a20'), roughness: 0.65 });
  for (const [x, z, ry, len] of [[0, -D / 2, 0, W], [-W / 2, 0, Math.PI / 2, D], [W / 2, 0, -Math.PI / 2, D], [0, D / 2, Math.PI, W]]) { const p = add(new THREE.Mesh(new THREE.PlaneGeometry(len, H), wm)); p.position.set(x, H / 2, z); p.rotation.y = ry; p.receiveShadow = true; p.userData.noCollide = true; }
  // desk with phone and papers
  const desk = new THREE.Group(); desk.position.set(0, 0, -1.8); add(desk);
  box(desk, 2.6, 0.1, 1.2, M.darkwood, 0, 0.95, 0); box(desk, 2.6, 0.9, 0.08, M.darkwood, 0, 0.47, 0.55); for (const x of [-1.25, 1.25]) box(desk, 0.1, 0.9, 1.1, M.darkwood, x, 0.47, 0);
  const phone = new THREE.Group(); phone.position.set(0.8, 1.0, 0.1); desk.add(phone); box(phone, 0.36, 0.12, 0.26, M.black, 0, 0.06, 0); const handset = box(phone, 0.42, 0.07, 0.1, M.black, 0, 0.16, 0);
  box(desk, 0.5, 0.02, 0.36, M.white, -0.6, 1.01, 0.1); const plate = box(desk, 0.8, 0.16, 0.06, new THREE.MeshStandardMaterial({ color: 0xd8b24a, metalness: 0.7, roughness: 0.3 }), 0, 1.08, 0.5);
  const chair = new THREE.Group(); chair.position.set(0, 0, -2.75); add(chair); box(chair, 0.9, 0.1, 0.8, M.black, 0, 0.55, 0); box(chair, 0.9, 1.2, 0.12, M.black, 0, 1.1, -0.4);
  // bookshelf, certificate, flag, window
  const shelf = new THREE.Group(); shelf.position.set(-2.9, 0, -3.7); add(shelf); box(shelf, 1.8, 2.6, 0.5, M.darkwood, 0, 1.3, 0);
  const bookCols = [0xb03a2e, 0x2e6fb0, 0xe0b040, 0x3a8a5a, 0x7a4aa0];
  for (let r = 0; r < 4; r++) for (let i = 0; i < 6; i++) box(shelf, 0.22, 0.42, 0.36, new THREE.MeshStandardMaterial({ color: bookCols[(i + r) % 5], roughness: 0.6 }), -0.6 + i * 0.24, 0.45 + r * 0.6, 0.08, false);
  const cert = add(new THREE.Mesh(new THREE.PlaneGeometry(1.0, 0.75), new THREE.MeshStandardMaterial({ map: canvasTex(256, 192, (ctx, w, h) => { ctx.fillStyle = '#c9a34a'; ctx.fillRect(0, 0, w, h); ctx.fillStyle = '#fbf6e6'; ctx.fillRect(14, 14, w - 28, h - 28); ctx.fillStyle = '#8a2a2a'; ctx.font = 'bold 26px "DejaVu Sans"'; ctx.fillText('CERTIFICATE', 34, 70); ctx.fillStyle = '#c9a34a'; ctx.beginPath(); ctx.arc(128, 130, 24, 0, 7); ctx.fill(); }), roughness: 0.4 })));
  cert.position.set(1.4, 2.4, -D / 2 + 0.03); ink(cert);
  const pot = box(scene, 0.5, 0.55, 0.5, new THREE.MeshStandardMaterial({ color: 0xc0623a, roughness: 0.5 }), 2.9, 0.28, -3.3);
  for (let i = 0; i < 6; i++) { const lf = add(new THREE.Mesh(new THREE.SphereGeometry(0.3, 12, 8), new THREE.MeshStandardMaterial({ color: 0x4f8a4a, roughness: 0.6 }))); lf.position.set(2.9 + R(-0.25, 0.25), 0.8 + i * 0.12, -3.3 + R(-0.2, 0.2)); lf.scale.set(1, 0.6, 1); }
  const win = add(new THREE.Mesh(new THREE.PlaneGeometry(2.0, 1.5), M.glass)); win.position.set(W / 2 - 0.02, 2.2, -0.5); win.rotation.y = -Math.PI / 2;
  add(new THREE.HemisphereLight(0xfff2dc, 0x6a5040, 1.2));
  const sun = add(new THREE.DirectionalLight(0xffe8c0, 2.2)); sun.position.set(10, 8, 2); sun.target.position.set(0, 0, -1); add(sun.target);
  sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048); Object.assign(sun.shadow.camera, { left: -6, right: 6, top: 6, bottom: -6, near: 1, far: 30 }); sun.shadow.bias = -0.0006; sun.shadow.normalBias = 0.03;
  const lamp = add(new THREE.PointLight(0xffe0b0, 5, 10, 1.5)); lamp.position.set(-1, 3.2, 0);
  const cast = {
    principal: new Puppet('principal', { seedOffset: 20 }), tobi: new Puppet('tobi', { seedOffset: 21 }), kemi: new Puppet('kemi', { seedOffset: 22 }),
    teacher: new Puppet('teacher', { seedOffset: 23 }), teacherM: new Puppet('teacherM', { seedOffset: 24 }), president: new Puppet('president', { seedOffset: 25 }),
  };
  Object.values(cast).forEach((c) => add(c.root));
  return {
    scene, cast, handset, phone, exposure: 1.0,
    reset() { handset.position.set(0, 0.16, 0); handset.rotation.set(0, 0, 0); handset.visible = true; },
    update(t, cam) { Object.values(cast).forEach((c) => { if (c.root.visible) c.update(t, cam); }); },
  };
}

// ---------------------------------------------------------------- Dad's shop (phone call)
export function buildShop() {
  _s = 53; mats();
  const scene = new THREE.Scene(); scene.background = new THREE.Color(0xf6d7a0);
  const add = (o) => { scene.add(o); return o; };
  const floor = add(new THREE.Mesh(new THREE.PlaneGeometry(10, 10), new THREE.MeshStandardMaterial({ map: floorTex(), roughness: 0.4 }))); floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; floor.userData.noCollide = true;
  const wm = new THREE.MeshStandardMaterial({ map: wallTex('#2f7a9a', '#f4e7c4', '#245a72'), roughness: 0.7 });
  const back = add(new THREE.Mesh(new THREE.PlaneGeometry(10, 4), wm)); back.position.set(0, 2, -2.5); back.userData.noCollide = true;
  // shelves of colourful goods
  for (let r = 0; r < 3; r++) { box(scene, 5, 0.08, 0.5, M.wood, 0, 1.0 + r * 0.8, -2.2); for (let i = 0; i < 12; i++) { const c = [0xe04a3a, 0xf0c040, 0x3a8ae0, 0x4ab06a, 0xffffff, 0xe07ab0][(i + r * 2) % 6]; box(scene, 0.32, R(0.35, 0.6), 0.3, new THREE.MeshStandardMaterial({ color: c, roughness: 0.4 }), -2.2 + i * 0.4, 1.0 + r * 0.8 + 0.25, -2.2); } }
  const counter = box(scene, 3.4, 1.0, 0.8, M.darkwood, 0, 0.5, 0.6);
  const sign = add(new THREE.Mesh(new THREE.PlaneGeometry(2.6, 0.6), new THREE.MeshStandardMaterial({ map: canvasTex(512, 128, (ctx, w, h) => { ctx.fillStyle = '#c0392b'; ctx.fillRect(0, 0, w, h); ctx.fillStyle = '#fff'; ctx.font = 'bold 64px "DejaVu Sans"'; ctx.fillText('CORNER STORE', 30, 90); }), roughness: 0.5 }))); sign.position.set(0, 3.55, -2.45); ink(sign);
  add(new THREE.HemisphereLight(0xfff0d8, 0x7a6040, 1.3));
  const sun = add(new THREE.DirectionalLight(0xffe2b0, 2.4)); sun.position.set(6, 8, 6); sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048); Object.assign(sun.shadow.camera, { left: -6, right: 6, top: 6, bottom: -6 }); sun.shadow.bias = -0.0006; sun.shadow.normalBias = 0.03;
  const phone = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.2, 0.03), M.black); add(phone);
  const cast = { dad: new Puppet('dad', { seedOffset: 40 }) }; add(cast.dad.root);
  return { scene, cast, phone, exposure: 1.0, reset() {}, update(t, cam) { Object.values(cast).forEach((c) => { if (c.root.visible) c.update(t, cam); }); } };
}

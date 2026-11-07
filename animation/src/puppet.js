// 3D puppet characters in the reference house style:
// shaded sphere head with a painted face decal that slides when the head turns, soft capsule body with an
// ink outline, rubber-hose arms and stick legs (bezier tubes), 3D hats/hair, props in hand, and an acting
// layer (expression holds, visemes, nods, blinks, leans, walk/run/pull/sit/laugh cycles, sweat drops).
import * as THREE from 'three';

const INK = '#141414';
const D2R = Math.PI / 180;
const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
const ease = (u) => 0.5 - 0.5 * Math.cos(Math.PI * clamp(u, 0, 1));
const backOut = (u) => { u = clamp(u, 0, 1); const s = 1.7; return 1 + (s + 1) * Math.pow(u - 1, 3) + s * Math.pow(u - 1, 2); };
const hash = (n) => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
const noise1 = (t, seed) => { // smooth value noise in [-1,1]
  const i = Math.floor(t), f = t - i, u = f * f * (3 - 2 * f);
  return (hash(i + seed * 17.3) * (1 - u) + hash(i + 1 + seed * 17.3) * u) * 2 - 1;
};

// ------------------------------------------------------------------ face decal (equirectangular canvas)
// Face centre is at u=0.25 (front, +z) / v=0.5 on the sphere texture. 1 px ~ 0.35 degrees.
const FW = 1024, FH = 512, CX = 256, CY = 262;
function strokeP(ctx, w = 9, c = INK) { ctx.lineWidth = w; ctx.strokeStyle = c; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.stroke(); }
function fillP(ctx, c) { ctx.fillStyle = c; ctx.fill(); }
function circ(ctx, x, y, r) { ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); }

function drawEyes(ctx, kind, gx, gy) {
  const L = CX - 58, R = CX + 58, Y = CY - 4;
  const px = gx * 9, py = gy * 6;
  for (const [x, side] of [[L, -1], [R, 1]]) {
    switch (kind) {
      case 'closed': ctx.beginPath(); ctx.moveTo(x - 20, Y - 2); ctx.quadraticCurveTo(x, Y + 12, x + 20, Y - 2); strokeP(ctx, 8); break;
      case 'happy': ctx.beginPath(); ctx.moveTo(x - 20, Y + 6); ctx.quadraticCurveTo(x, Y - 16, x + 20, Y + 6); strokeP(ctx, 8); break;
      case 'half': circ(ctx, x + px, Y + 2, 13); ctx.save(); ctx.clip(); ctx.fillStyle = INK; ctx.fillRect(x - 30, Y + 1, 60, 30); ctx.restore();
        ctx.beginPath(); ctx.moveTo(x - 22, Y + 1); ctx.lineTo(x + 22, Y + 1); strokeP(ctx, 7); break;
      case 'squint': ctx.beginPath(); ctx.moveTo(x - 18, Y); ctx.lineTo(x + 18, Y); strokeP(ctx, 8); break;
      case 'goggle': circ(ctx, x, Y, 22); fillP(ctx, '#fff'); strokeP(ctx, 6); circ(ctx, x + px * 0.5, Y + py * 0.5, 8); fillP(ctx, INK); break;
      case 'wide': circ(ctx, x, Y, 22); fillP(ctx, '#fff'); strokeP(ctx, 6); circ(ctx, x + px, Y + py, 8); fillP(ctx, INK); break;
      case 'evil': ctx.beginPath(); ctx.moveTo(x - 22, Y - 8 * side * -1 - 4); ctx.lineTo(x + 22, Y + 8 * side * -1 - 4); ctx.lineTo(x + 14 * side, Y + 8); ctx.closePath(); fillP(ctx, INK); break;
      case 'skeptic': if (side < 0) { circ(ctx, x + px, Y + py, 12); fillP(ctx, INK); } else { ctx.beginPath(); ctx.moveTo(x - 18, Y + 2); ctx.lineTo(x + 18, Y + 2); strokeP(ctx, 8); } break;
      default: circ(ctx, x + px, Y + py, 12); fillP(ctx, INK); // dot
    }
  }
}
function drawBrows(ctx, kind, eyes) {
  const L = CX - 58, R = CX + 58; const by = CY - 52;
  const seg = (x1, y1, x2, y2) => { ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); strokeP(ctx, 9); };
  const up = eyes === 'goggle' ? -14 : 0;
  switch (kind) {
    case 'none': return;
    case 'raised': seg(L - 22, by - 8 + up, L + 22, by - 14 + up); seg(R - 22, by - 14 + up, R + 22, by - 8 + up); break;
    case 'worried': seg(L - 22, by + 6, L + 22, by - 10); seg(R - 22, by - 10, R + 22, by + 6); break;
    case 'angry': seg(L - 24, by - 8, L + 22, by + 10); seg(R - 22, by + 10, R + 24, by - 8); break;
    case 'skeptic': seg(L - 22, by - 14, L + 22, by - 20); seg(R - 22, by + 4, R + 22, by + 4); break;
    case 'low': seg(L - 22, by + 8, L + 22, by + 8); seg(R - 22, by + 8, R + 22, by + 8); break;
    default: seg(L - 22, by, L + 22, by - 4); seg(R - 22, by - 4, R + 22, by);
  }
}
function drawMouth(ctx, kind) {
  const my = CY + 64;
  const open = (w, h, y = my) => { ctx.beginPath(); ctx.ellipse(CX, y, w, h, 0, 0, Math.PI * 2); fillP(ctx, '#5b1b1b'); strokeP(ctx, 7); };
  const curve = (x1, y1, cx, cy, x2, y2) => { ctx.beginPath(); ctx.moveTo(x1, y1); ctx.quadraticCurveTo(cx, cy, x2, y2); strokeP(ctx, 8); };
  switch (kind) {
    case 'smile': curve(CX - 34, my - 6, CX, my + 26, CX + 34, my - 6); break;
    case 'grin': ctx.beginPath(); ctx.moveTo(CX - 46, my - 10); ctx.quadraticCurveTo(CX, my + 50, CX + 46, my - 10); ctx.closePath(); fillP(ctx, '#fff'); strokeP(ctx, 7);
      ctx.beginPath(); ctx.moveTo(CX - 40, my + 2); ctx.lineTo(CX + 40, my + 2); strokeP(ctx, 4); break;
    case 'frown': curve(CX - 30, my + 12, CX, my - 14, CX + 30, my + 12); break;
    case 'smirk': curve(CX - 30, my + 4, CX + 14, my + 14, CX + 36, my - 12); break;
    case 'flat': curve(CX - 26, my + 2, CX, my + 4, CX + 26, my + 2); break;
    case 'wavy': ctx.beginPath(); ctx.moveTo(CX - 30, my + 4); ctx.bezierCurveTo(CX - 15, my - 8, CX - 5, my + 14, CX + 8, my + 2); ctx.bezierCurveTo(CX + 18, my - 8, CX + 26, my + 8, CX + 32, my + 2); strokeP(ctx, 7); break;
    case 'o': open(12, 13); break;
    case 'O': open(22, 30, my + 6); break;
    case 'open': open(24, 17); break;
    case 'wide': open(30, 12); break;
    case 'laugh': ctx.beginPath(); ctx.moveTo(CX - 52, my - 16); ctx.lineTo(CX + 52, my - 16); ctx.quadraticCurveTo(CX + 50, my + 60, CX, my + 62); ctx.quadraticCurveTo(CX - 50, my + 60, CX - 52, my - 16);
      fillP(ctx, '#5b1b1b'); strokeP(ctx, 7); ctx.fillStyle = '#fff'; ctx.fillRect(CX - 44, my - 12, 88, 16);
      ctx.beginPath(); ctx.ellipse(CX, my + 40, 30, 13, 0, 0, Math.PI * 2); fillP(ctx, '#e8798a'); break;
    case 'grit': ctx.beginPath(); ctx.roundRect(CX - 40, my - 16, 80, 36, 8); fillP(ctx, '#fff'); strokeP(ctx, 7);
      ctx.beginPath(); ctx.moveTo(CX - 40, my + 2); ctx.lineTo(CX + 40, my + 2); for (let k = -2; k <= 2; k++) { ctx.moveTo(CX + k * 14, my - 16); ctx.lineTo(CX + k * 14, my + 20); } strokeP(ctx, 4); break;
    case 'closed': ctx.beginPath(); ctx.moveTo(CX - 22, my); ctx.lineTo(CX + 22, my); strokeP(ctx, 8); break;
    default: curve(CX - 24, my, CX, my + 8, CX + 24, my); // rest
  }
}
function drawFace(spec, f) {
  const c = document.createElement('canvas'); c.width = FW; c.height = FH;
  const ctx = c.getContext('2d');
  ctx.translate(CX, CY); ctx.scale(1.6, 1.6); ctx.translate(-CX, -CY); // features read big on the sphere, like the reference
  drawEyes(ctx, f.eyes, f.gx || 0, f.gy || 0);
  drawBrows(ctx, f.brows, f.eyes);
  drawMouth(ctx, f.mouth);
  if (spec.mustache) {
    const y = CY + 46; ctx.beginPath(); ctx.moveTo(CX, y); ctx.quadraticCurveTo(CX - 50, y - 4, CX - 62, y + 44); ctx.quadraticCurveTo(CX - 42, y + 18, CX, y + 12);
    ctx.quadraticCurveTo(CX + 42, y + 18, CX + 62, y + 44); ctx.quadraticCurveTo(CX + 50, y - 4, CX, y); fillP(ctx, INK);
  }
  if (spec.beard) { ctx.beginPath(); ctx.moveTo(CX - 32, CY + 112); ctx.lineTo(CX + 32, CY + 112); ctx.lineTo(CX, CY + 176); ctx.closePath(); fillP(ctx, '#d9d4c8'); strokeP(ctx, 6); }
  return c;
}
const faceCache = new Map();
function faceTex(specName, spec, f) {
  const key = `${specName}|${f.eyes}|${f.brows}|${f.mouth}|${(f.gx || 0).toFixed(1)}|${(f.gy || 0).toFixed(1)}`;
  let t = faceCache.get(key);
  if (!t) { t = new THREE.CanvasTexture(drawFace(spec, f)); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; faceCache.set(key, t); }
  return t;
}

// ------------------------------------------------------------------ expression presets
export const EXPR = {
  neutral: { eyes: 'dot', brows: 'flat', mouth: 'rest' },
  happy: { eyes: 'happy', brows: 'raised', mouth: 'smile' },
  content: { eyes: 'closed', brows: 'flat', mouth: 'smile' },
  laugh: { eyes: 'happy', brows: 'raised', mouth: 'laugh' },
  smug: { eyes: 'half', brows: 'skeptic', mouth: 'smirk' },
  bored: { eyes: 'half', brows: 'low', mouth: 'flat' },
  skeptic: { eyes: 'skeptic', brows: 'skeptic', mouth: 'flat' },
  worried: { eyes: 'dot', brows: 'worried', mouth: 'wavy', sweat: true },
  sad: { eyes: 'dot', brows: 'worried', mouth: 'frown' },
  shock: { eyes: 'goggle', brows: 'raised', mouth: 'O' },
  panic: { eyes: 'goggle', brows: 'raised', mouth: 'grit', sweat: true },
  angry: { eyes: 'dot', brows: 'angry', mouth: 'grit' },
  evil: { eyes: 'evil', brows: 'angry', mouth: 'grin' },
  sleep: { eyes: 'closed', brows: 'low', mouth: 'o' },
  focus: { eyes: 'squint', brows: 'angry', mouth: 'flat' },
  hopeful: { eyes: 'wide', brows: 'raised', mouth: 'smile' },
};

// ------------------------------------------------------------------ cast specs (heights in world units)
export const SPECS = {
  engineer: { H: 2.0, body: '#3f8f6b', sash: '#e8b23a', collar: '#f4efe4', legs: true, hem: 0.36, width: 0.26, hat: 'scarf', braid: true },
  duke: { H: 2.25, body: '#4a2b72', sash: '#d6332f', sashX: true, collar: '#e9d9a8', legs: false, width: 0.32, hat: 'feather', mustache: true, chain: true, belly: 1.08 },
  guard: { H: 2.2, body: '#8d949e', skirt: '#2b7a8c', legs: true, hem: 0.38, width: 0.28, hat: 'helmet', armor: true, prop: 'spear' },
  councilA: { H: 2.1, body: '#3d6b3a', sash: '#c9a54a', collar: '#efe6cf', legs: false, width: 0.27, hat: 'cone', hatColor: '#2e4f2c', beard: true },
  councilB: { H: 2.05, body: '#7a5534', sash: '#d9c27a', collar: '#efe6cf', legs: false, width: 0.3, hat: 'cone', hatColor: '#4f3420', belly: 1.1 },
};

// body texture: equirect-ish around the lathe (u=0.5 is the front)
function bodyTex(spec) {
  const c = document.createElement('canvas'); c.width = 1024; c.height = 512; const ctx = c.getContext('2d');
  ctx.fillStyle = spec.body; ctx.fillRect(0, 0, 1024, 512);
  if (spec.armor) {
    ctx.fillStyle = spec.skirt; ctx.fillRect(0, 380, 1024, 132);
    ctx.strokeStyle = 'rgba(20,20,20,0.5)'; ctx.lineWidth = 4;
    for (let y = 40; y < 370; y += 26) for (let x = ((y / 26) % 2) * 16; x < 1024; x += 32) { ctx.beginPath(); ctx.arc(x, y, 16, 0.15 * Math.PI, 0.85 * Math.PI); ctx.stroke(); }
    ctx.fillStyle = '#c8a33e'; ctx.fillRect(0, 368, 1024, 16);
  } else {
    const g = ctx.createLinearGradient(0, 0, 1024, 0); g.addColorStop(0, 'rgba(0,0,0,0.18)'); g.addColorStop(0.5, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,0.18)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, 1024, 512);
    if (spec.sashX) {
      ctx.fillStyle = spec.sash; ctx.save(); ctx.translate(512, 170); for (const a of [0.55, -0.55]) { ctx.save(); ctx.rotate(a); ctx.fillRect(-14, -150, 28, 300); ctx.restore(); } ctx.restore();
    } else if (spec.sash) { ctx.fillStyle = spec.sash; ctx.fillRect(0, 250, 1024, 30); }
    if (spec.collar) { ctx.fillStyle = spec.collar; ctx.beginPath(); ctx.moveTo(470, 0); ctx.lineTo(512, 110); ctx.lineTo(554, 0); ctx.fill(); ctx.strokeStyle = INK; ctx.lineWidth = 6; ctx.stroke(); }
    if (spec.chain) { ctx.strokeStyle = '#d9a826'; ctx.lineWidth = 9; ctx.beginPath(); ctx.arc(512, 10, 90, 0.2 * Math.PI, 0.8 * Math.PI); ctx.stroke(); ctx.fillStyle = '#f1c440'; ctx.beginPath(); ctx.arc(512, 102, 18, 0, 7); ctx.fill(); }
    ctx.strokeStyle = 'rgba(0,0,0,0.25)'; ctx.lineWidth = 5; for (const x of [440, 590]) { ctx.beginPath(); ctx.moveTo(x, 300); ctx.quadraticCurveTo(x + 10, 420, x - 6, 512); ctx.stroke(); } // folds
  }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t;
}

const MAT = {};
function mats() {
  if (MAT.ink) return MAT;
  MAT.ink = new THREE.MeshBasicMaterial({ color: 0x141414 });
  MAT.inkBack = new THREE.MeshBasicMaterial({ color: 0x141414, side: THREE.BackSide });
  MAT.skin = new THREE.MeshStandardMaterial({ color: 0xfbf8f2, roughness: 0.9, emissive: 0xfbf8f2, emissiveIntensity: 0.42 });
  MAT.shoe = new THREE.MeshStandardMaterial({ color: 0x2a2320, roughness: 0.6 });
  MAT.metal = new THREE.MeshStandardMaterial({ color: 0xaab2bc, metalness: 0.8, roughness: 0.35 });
  MAT.wood = new THREE.MeshStandardMaterial({ color: 0x7a5a34, roughness: 0.8 });
  MAT.gold = new THREE.MeshStandardMaterial({ color: 0xe2b13c, metalness: 0.9, roughness: 0.3 });
  MAT.sweat = new THREE.MeshStandardMaterial({ color: 0x8fd0f2, roughness: 0.15, emissive: 0x3a7fa8, emissiveIntensity: 0.4 });
  return MAT;
}
const outlined = (geo, mat, thick, parent) => { // inverted-hull ink outline
  const m = new THREE.Mesh(geo, mat); m.castShadow = true; m.receiveShadow = true;
  const o = new THREE.Mesh(geo, mats().inkBack); o.scale.setScalar(1 + thick); m.add(o); parent?.add(m); return m;
};

// ------------------------------------------------------------------ the puppet
// Arm poses: hand target relative to the shoulder, in body space (x outward for that side, y up, z forward),
// in units of H/2. bend = how far the elbow bows outward/downward.
const ARM = {
  idle: [[0.1, -0.56, 0.04, 0.12], [0.1, -0.56, 0.04, 0.12]],
  point: [[0.1, -0.56, 0.04, 0.12], [0.36, 0.22, 0.34, 0.06]],
  raise: [[0.24, 0.5, 0.06, 0.08], [0.24, 0.5, 0.06, 0.08]],
  shrug: [[0.34, -0.1, 0.16, 0.16], [0.34, -0.1, 0.16, 0.16]],
  hold: [[0.1, -0.56, 0.04, 0.12], [0.18, -0.34, 0.2, 0.12]],
  pull: [[-0.02, -0.28, 0.48, 0.06], [0.0, -0.32, 0.44, 0.06]],
  lean: [[0.12, -0.5, 0.06, 0.1], [0.16, -0.16, 0.5, 0.06]],
  hips: [[0.26, -0.36, -0.04, -0.12], [0.26, -0.36, -0.04, -0.12]],
  flex: [[0.38, 0.22, 0.02, -0.16], [0.38, 0.22, 0.02, -0.16]],
  gesture: [[0.1, -0.56, 0.04, 0.12], [0.3, -0.18, 0.32, 0.12]],
  present: [[0.34, -0.14, 0.3, 0.1], [0.1, -0.56, 0.04, 0.12]],
  wave: [[0.1, -0.56, 0.04, 0.12], [0.3, 0.42, 0.12, 0.06]],
  lantern: [[0.1, -0.56, 0.04, 0.12], [0.16, -0.46, 0.2, 0.1]],
  cower: [[0.06, 0.02, 0.36, 0.12], [0.06, 0.02, 0.36, 0.12]],
};

export class Puppet {
  constructor(specName, opts = {}) {
    const s = this.spec = { ...SPECS[specName], ...opts };
    this.name = specName; this.seed = opts.seed ?? hash(specName.length * 13.7 + (opts.seedOffset || 0)) * 100;
    const M = mats(); const H = s.H; const u = H / 2; this.u = u;
    this.root = new THREE.Group(); // at the feet
    this.lean = new THREE.Group(); this.root.add(this.lean); // pivots at the feet (inverted pendulum)
    this.hips = new THREE.Group(); this.lean.add(this.hips);
    const legLen = s.legs ? H * 0.42 : H * 0.1;
    this.hipY = legLen; this.hips.position.y = legLen;
    // body (lathe): from hem to shoulders, slightly bellied
    const bodyH = H * (s.legs ? 0.4 : 0.66) + (s.legs ? 0 : 0);
    const w = s.width * u * 2 * 0.5; const b = s.belly || 1;
    const hemDrop = s.legs ? H * (0.42 - s.hem) : H * 0.1;
    const prof = [];
    const N = 14;
    for (let i = 0; i <= N; i++) {
      const v = i / N; const y = -hemDrop + v * (bodyH + hemDrop);
      let r = w * (1.0 + 0.12 * Math.sin(v * Math.PI) * b + (s.legs ? 0 : 0.22 * Math.pow(1 - v, 2)));
      if (v > 0.82) r *= Math.cos((v - 0.82) / 0.18 * Math.PI / 2) * 0.55 + 0.45; // shoulders round off
      prof.push(new THREE.Vector2(Math.max(0.001, r), y));
    }
    prof.push(new THREE.Vector2(0.001, bodyH + 0.02 * u));
    const bodyGeo = new THREE.LatheGeometry(prof, 40, -Math.PI, Math.PI * 2);
    { const bt = bodyTex(s); this.bodyMat = new THREE.MeshStandardMaterial({ map: bt, roughness: 0.85, emissive: 0xffffff, emissiveMap: bt, emissiveIntensity: 0.3 }); }
    this.torso = new THREE.Group(); this.hips.add(this.torso);
    this.body = outlined(bodyGeo, this.bodyMat, 0.045, this.torso);
    const bottom = new THREE.Mesh(new THREE.CircleGeometry(prof[0].x, 32), this.bodyMat); bottom.rotation.x = Math.PI / 2; bottom.position.y = -hemDrop; this.torso.add(bottom);
    this.bodyH = bodyH;
    this.shoulderY = bodyH * 0.84; this.shoulderX = w * 0.92;
    // head on a neck pivot
    const hr = this.hr = H * 0.172;
    this.neck = new THREE.Group(); this.neck.position.y = bodyH * 0.92; this.torso.add(this.neck);
    this.head = new THREE.Group(); this.head.position.y = hr * 0.9; this.neck.add(this.head);
    this.headMat = M.skin.clone();
    this.headMesh = outlined(new THREE.SphereGeometry(hr, 48, 32), this.headMat, 0.04, this.head);
    this.faceMat = new THREE.MeshStandardMaterial({ transparent: true, alphaTest: 0.3, roughness: 0.85, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2 });
    this.faceMesh = new THREE.Mesh(new THREE.SphereGeometry(hr * 1.004, 48, 32), this.faceMat); this.head.add(this.faceMesh);
    this.faceMesh.scale.set(1, 1.02, 1);
    this.buildHat(s, hr);
    // sweat drop (child of head)
    this.sweat = new THREE.Mesh(new THREE.SphereGeometry(hr * 0.12, 16, 12), M.sweat); this.sweat.scale.set(1, 1.5, 0.7);
    this.sweat.position.set(hr * 0.78, hr * 0.45, hr * 0.45); this.head.add(this.sweat); this.sweat.visible = false;
    // limbs: tubes rebuilt per frame
    this.limbMat = M.ink;
    this.arms = [0, 1].map(() => { const tube = new THREE.Mesh(new THREE.BufferGeometry(), M.ink); tube.castShadow = true; this.torso.add(tube);
      const hand = new THREE.Mesh(new THREE.SphereGeometry(u * 0.055, 14, 10), M.ink); hand.castShadow = true; this.torso.add(hand); return { tube, hand }; });
    this.legs = [0, 1].map(() => { const tube = new THREE.Mesh(new THREE.BufferGeometry(), M.ink); tube.castShadow = true; this.root.add(tube);
      const foot = new THREE.Mesh(new THREE.SphereGeometry(u * 0.08, 14, 10), M.shoe); foot.scale.set(0.8, 0.5, 1.4); foot.castShadow = true; this.root.add(foot); return { tube, foot }; });
    // props
    this.props = {};
    if (s.prop === 'spear') {
      const g = new THREE.Group(); const pole = new THREE.Mesh(new THREE.CylinderGeometry(u * 0.02, u * 0.02, H * 1.15, 8), M.wood); pole.position.y = H * 0.25; g.add(pole);
      const tip = new THREE.Mesh(new THREE.ConeGeometry(u * 0.05, u * 0.18, 8), M.metal); tip.position.y = H * 0.25 + H * 0.575 + u * 0.09; g.add(tip);
      this.torso.add(g); this.props.spear = g;
    }
    const lan = new THREE.Group(); const box = new THREE.Mesh(new THREE.BoxGeometry(u * 0.14, u * 0.2, u * 0.14), new THREE.MeshStandardMaterial({ color: 0xffc860, emissive: 0xffa030, emissiveIntensity: 1.6 }));
    box.position.y = -u * 0.16; lan.add(box); const cap = new THREE.Mesh(new THREE.ConeGeometry(u * 0.11, u * 0.08, 4), M.ink); cap.position.y = -u * 0.04; cap.rotation.y = Math.PI / 4; lan.add(cap);
    lan.visible = false; this.torso.add(lan); this.props.lantern = lan;
    // state
    this.track = []; // acting keys
    this.speech = []; // words {w,start,end}
    this.path = null; this.facing = 0; this.lookAt = null; this.prevFaceKey = '';
    this.root.traverse((o) => { if (o.isMesh) o.castShadow = true; });
  }

  buildHat(s, hr) {
    const M = mats(); const h = this.head;
    const mk = (geo, color, thick = 0.05) => outlined(geo, new THREE.MeshStandardMaterial({ color, roughness: 0.7 }), thick, h);
    switch (s.hat) {
      case 'scarf': {
        const cap = mk(new THREE.SphereGeometry(hr * 1.06, 40, 20, 0, Math.PI * 2, 0, Math.PI * 0.36), 0xe9832f); cap.rotation.x = -0.18;
        const knot = mk(new THREE.SphereGeometry(hr * 0.2, 16, 12), 0xe9832f); knot.position.set(hr * 0.95, hr * 0.15, -hr * 0.25); knot.scale.set(0.6, 1, 1.3);
        for (const x of [-0.24, 0.24]) { const g = new THREE.Mesh(new THREE.TorusGeometry(hr * 0.15, hr * 0.04, 8, 20), M.gold); g.position.set(x * hr, hr * 0.78, hr * 0.62); g.rotation.x = -0.9; h.add(g);
          const lens = new THREE.Mesh(new THREE.CircleGeometry(hr * 0.13, 20), new THREE.MeshStandardMaterial({ color: 0xa8dcec, metalness: 0.3, roughness: 0.1 })); lens.position.copy(g.position); lens.rotation.x = -0.9; lens.translateZ(0.002); h.add(lens); }
        break;
      }
      case 'feather': {
        const brim = mk(new THREE.CylinderGeometry(hr * 1.45, hr * 1.45, hr * 0.08, 40), 0xb0262a); brim.position.y = hr * 0.72; brim.rotation.x = -0.12;
        const crown = mk(new THREE.CylinderGeometry(hr * 0.68, hr * 0.78, hr * 0.62, 32), 0xb0262a); crown.position.y = hr * 1.04; crown.rotation.x = -0.12;
        const band = new THREE.Mesh(new THREE.CylinderGeometry(hr * 0.79, hr * 0.79, hr * 0.12, 32), M.gold); band.position.y = hr * 0.82; band.rotation.x = -0.12; h.add(band);
        const curve = new THREE.CatmullRomCurve3([[0.5, 1.0, -0.1], [0.9, 1.5, -0.4], [1.2, 1.9, -0.9], [1.25, 2.05, -1.3]].map((p) => new THREE.Vector3(p[0] * hr, p[1] * hr, p[2] * hr)));
        this.feather = new THREE.Mesh(new THREE.TubeGeometry(curve, 16, hr * 0.12, 8), new THREE.MeshStandardMaterial({ color: 0xfbfaf5, roughness: 0.9 })); this.feather.scale.set(1, 1, 0.5); h.add(this.feather);
        break;
      }
      case 'helmet': {
        const dome = mk(new THREE.SphereGeometry(hr * 1.07, 40, 20, 0, Math.PI * 2, 0, Math.PI * 0.42), 0xa9b1bb); dome.material.metalness = 0.25; dome.material.roughness = 0.45; dome.material.emissive = new THREE.Color(0x30343a);
        const brim = new THREE.Mesh(new THREE.TorusGeometry(hr * 0.98, hr * 0.08, 10, 40), M.gold); brim.rotation.x = Math.PI / 2; brim.position.y = hr * 0.25; h.add(brim);
        this.plume = mk(new THREE.SphereGeometry(hr * 0.22, 16, 12), 0xd23b30); this.plume.scale.set(0.5, 1.4, 1.6); this.plume.position.set(0, hr * 1.2, -hr * 0.15);
        break;
      }
      case 'cone': {
        const cone = mk(new THREE.ConeGeometry(hr * 0.72, hr * 1.5, 32), new THREE.Color(s.hatColor).getHex()); cone.position.y = hr * 1.35;
        const brim = mk(new THREE.CylinderGeometry(hr * 0.95, hr * 0.95, hr * 0.06, 32), new THREE.Color(s.hatColor).getHex()); brim.position.y = hr * 0.62;
        break;
      }
    }
    if (s.braid) { // chain of beads hanging behind the right ear; animated with lag
      this.braid = [];
      for (let i = 0; i < 6; i++) { const b = outlined(new THREE.SphereGeometry(hr * (0.17 - i * 0.012), 14, 10), new THREE.MeshStandardMaterial({ color: 0x3a2418, roughness: 0.8 }), 0.08, h); this.braid.push(b); }
      const tie = new THREE.Mesh(new THREE.SphereGeometry(hr * 0.08, 10, 8), new THREE.MeshStandardMaterial({ color: 0xe9832f })); h.add(tie); this.braid.push(tie);
    }
  }

  // ---- authoring API
  act(keys) { this.track = keys.slice().sort((a, b) => a.t - b.t); return this; } // [{t, expr?, eyes?, brows?, mouth?, pose?, lean?, tilt?, yaw?, pitch?, look?, sweat?, squash?}]
  say(words) { this.speech = words || []; return this; }
  walk(path) { this.path = path; return this; } // {t0, t1, from:Vector3, to:Vector3, mode:'walk'|'run'|'pull'|'waddle', face?}
  place(p, facing = 0) { this.root.position.copy(p); this.facing = facing; this.path = null; return this; }
  reset() { this.track = []; this.speech = []; this.path = null; this.lookAt = null; this.mode = 'stand'; this.props.lantern.visible = false; this.sitting = null; return this; }

  // value of a numeric channel at t, eased between keys (pose changes snap with overshoot)
  chan(t, name, def) {
    let prev = null, next = null;
    for (const k of this.track) { if (k[name] === undefined) continue; if (k.t <= t) prev = k; else { next = k; break; } }
    if (!prev) return next ? next[name] : def;
    if (!next) return prev[name];
    const dur = next.blend ?? Math.min(0.35, next.t - prev.t);
    const start = next.t - dur;
    if (t < start) return prev[name];
    return prev[name] + (next[name] - prev[name]) * ease((t - start) / dur);
  }
  held(t, name, def) { let v = def; for (const k of this.track) { if (k.t > t) break; if (k[name] !== undefined) v = k[name]; } return v; }
  heldKeyTime(t, name) { let v = -99; for (const k of this.track) { if (k.t > t) break; if (k[name] !== undefined) v = k.t; } return v; }

  viseme(t) {
    for (const w of this.speech) {
      if (t < w.start - 0.02 || t > w.end + 0.02) continue;
      const letters = w.w.toLowerCase().replace(/[^a-z]/g, '');
      const groups = letters.match(/[aeiouy]+|[^aeiouy]+/g) || ['a'];
      const vowels = groups.filter((g) => /[aeiouy]/.test(g)); if (!vowels.length) vowels.push('a');
      const k = Math.min(vowels.length - 1, Math.floor((t - w.start) / Math.max(0.01, w.end - w.start) * vowels.length));
      const frac = ((t - w.start) / Math.max(0.01, w.end - w.start) * vowels.length) % 1;
      if (frac > 0.78 && /[mbp]$/.test(letters) && k === vowels.length - 1) return 'closed';
      const v = vowels[k];
      return /o|u/.test(v) ? 'o' : /a/.test(v) ? 'open' : /e|i|y/.test(v) ? 'wide' : 'open';
    }
    return null;
  }

  // ---- per-frame evaluation (pure function of t: deterministic across render workers)
  update(t, camera) {
    const s = this.spec, u = this.u, sd = this.seed;
    // expression (held keys)
    const exprName = this.held(t, 'expr', 'neutral');
    const base = { ...EXPR[exprName] };
    for (const f of ['eyes', 'brows', 'mouth']) { const v = this.held(t, f, undefined); if (v !== undefined && this.heldKeyTime(t, f) >= this.heldKeyTime(t, 'expr')) base[f] = v; }
    const vis = this.viseme(t);
    const talking = vis !== null;
    if (talking && !['laugh', 'grit'].includes(base.mouth)) base.mouth = vis;
    // blink (deterministic per 2.8 s window) unless eyes are already closed-type
    const win = Math.floor((t + sd) / 2.8); const bStart = win * 2.8 - sd + 0.4 + hash(win + sd) * 2.0;
    if (t >= bStart && t < bStart + 0.09 && ['dot', 'wide', 'half', 'skeptic'].includes(base.eyes)) base.eyes = 'closed';
    // gaze toward look target (eyes first, head follows)
    let yaw = this.chan(t, 'yaw', 0), pitch = this.chan(t, 'pitch', 0);
    const look = this.held(t, 'look', null);
    if (look && camera) {
      const target = look === 'camera' ? camera.position : look;
      const p = this.root.getWorldPosition(new THREE.Vector3()); p.y += s.H * 0.85;
      const d = new THREE.Vector3().subVectors(target, p);
      const ang = Math.atan2(d.x, d.z) - this.root.rotation.y;
      yaw += Math.atan2(Math.sin(ang), Math.cos(ang)) * 0.8; pitch += clamp(-Math.atan2(d.y, Math.hypot(d.x, d.z)) * 0.5, -0.35, 0.35);
    }
    yaw = clamp(yaw, -1.1, 1.1);
    base.gx = clamp(yaw * 1.2, -1, 1); base.gy = clamp(pitch * 1.5, -1, 1);
    const key = `${base.eyes}|${base.brows}|${base.mouth}|${base.gx.toFixed(1)}|${base.gy.toFixed(1)}`;
    if (key !== this.prevFaceKey) { this.faceMat.map = faceTex(this.name, s, base); this.faceMat.needsUpdate = true; this.prevFaceKey = key; }

    // locomotion
    let mode = 'stand', phase = 0, speed = 0;
    if (this.path && t >= this.path.t0 - 0.01) {
      const P = this.path; const k = clamp((t - P.t0) / (P.t1 - P.t0), 0, 1);
      const pos = P.from.clone().lerp(P.to, P.ease === false ? k : (P.ease === 'in' ? k * k : k));
      this.root.position.copy(pos);
      const dir = new THREE.Vector3().subVectors(P.to, P.from);
      this.facing = P.face ?? Math.atan2(dir.x, dir.z);
      const dist = P.from.distanceTo(pos);
      mode = k < 1 ? (P.mode || 'walk') : (P.end || 'stand');
      const stride = { walk: 0.42, run: 0.8, pull: 0.3, waddle: 0.3 }[P.mode || 'walk'] * u;
      phase = dist / stride * Math.PI; speed = 1;
    } else if (this.path && t < this.path.t0) { this.root.position.copy(this.path.from); }
    this.root.rotation.y = this.facing + this.chan(t, 'turn', 0);

    // body lean / tilt / squash
    let leanX = this.chan(t, 'lean', 0) * D2R;   // forward (+) / back (-)
    let leanZ = this.chan(t, 'tilt', 0) * D2R;   // sideways
    let headTilt = this.chan(t, 'headTilt', 0) * D2R, nod = 0, bob = 0, sq = 1;
    // idle life: breathing + slow sway + head micro tilt
    leanZ += noise1(t * 0.45, sd) * 1.6 * D2R; leanX += noise1(t * 0.38, sd + 3) * 1.0 * D2R;
    headTilt += noise1(t * 0.7, sd + 7) * 3.5 * D2R;
    sq *= 1 + Math.sin((t + sd) * 2.2) * 0.012;
    // talking head nods on stressed (longer) words
    for (const w of this.speech) { if (w.w.replace(/[^a-z]/gi, '').length >= 4 && t >= w.start && t < w.start + 0.4) nod += Math.sin((t - w.start) / 0.4 * Math.PI) * 0.09; }
    if (exprName === 'laugh') { const ph = (t + sd) * 4.6 * Math.PI * 2; bob += Math.abs(Math.sin(ph / 2)) * 0.05 * u; headTilt += Math.sin(ph / 2) * 0.12 - 0.05; nod -= 0.18; leanZ += Math.sin(ph / 4) * 0.06; }
    // squash/stretch accent: {squash: t} keys -> anticipation squash then overshoot stretch
    const sqT = this.held(t, 'squash', null);
    if (sqT !== null) { const a = t - this.heldKeyTime(t, 'squash'); if (a < 0.45) sq *= a < 0.1 ? 1 - 0.07 * (a / 0.1) : 1 + 0.09 * Math.exp(-(a - 0.1) * 9) * Math.cos((a - 0.1) * 26); }
    if (this.held(t, 'shake', 0)) { leanZ += Math.sin(t * 22) * 0.02 + Math.sin(t * 31) * 0.015; }
    // locomotion body motion
    const legs = this.legs; const hipW = this.shoulderX * 0.5;
    let feet = [[-hipW, 0, 0.02 * u, 0], [hipW, 0, 0.02 * u, 0]]; // x, lift, z, kneeFwd
    if (mode === 'walk' || mode === 'waddle' || mode === 'run' || mode === 'pull') {
      const amp = { walk: 0.16, waddle: 0.1, run: 0.32, pull: 0.12 }[mode] * u;
      const lift = { walk: 0.09, waddle: 0.06, run: 0.2, pull: 0.06 }[mode] * u;
      feet = [0, 1].map((i) => { const p = phase + i * Math.PI; return [i ? hipW : -hipW, Math.max(0, Math.sin(p)) * lift, Math.cos(p) * amp, Math.max(0, Math.sin(p)) * 0.2 * u]; });
      bob += Math.abs(Math.sin(phase)) * ({ walk: 0.035, waddle: 0.02, run: 0.08, pull: 0.02 }[mode] * u);
      leanZ += Math.sin(phase) * ({ walk: 2.5, waddle: 5.5, run: 6, pull: 2 }[mode]) * D2R;
      leanX += ({ walk: 3, waddle: 1, run: 14, pull: 24 }[mode]) * D2R;
      headTilt -= Math.sin(phase) * 2 * D2R;
    }
    const sitH = this.held(t, 'sit', null);
    this.lean.rotation.set(leanX, 0, leanZ);
    this.hips.position.y = (sitH ?? this.hipY) + bob;
    this.torso.scale.set(1 / Math.sqrt(sq), sq, 1 / Math.sqrt(sq));
    this.neck.rotation.set(nod + pitch * 0.6 + this.chan(t, 'headLean', 0) * D2R, yaw, headTilt);
    if (this.feather) this.feather.rotation.z = Math.sin(t * 3 + sd) * 0.06 - leanZ * 0.5;
    if (this.plume) this.plume.rotation.x = Math.sin(t * 4 + sd) * 0.08 - leanX * 0.6;
    if (this.braid) { // pendulum with lag behind head motion
      this.braid.forEach((b, i) => { const lag = Math.sin(t * 3.2 - i * 0.5 + sd) * 0.03 * (i + 1) - leanZ * (i + 1) * 0.15 - (mode !== 'stand' ? Math.sin(phase - i * 0.6) * 0.03 * (i + 1) : 0);
        b.position.set(this.hr * (0.8 + lag * 0.4), this.hr * (0.05 - i * 0.24), -this.hr * (0.45 + i * 0.05)); });
    }
    // sweat
    const sweatOn = this.held(t, 'sweat', base.sweat ? true : false) || base.sweat;
    if (sweatOn) { const a = t - Math.max(this.heldKeyTime(t, 'expr'), this.heldKeyTime(t, 'sweat')); const sc = backOut(a / 0.18); this.sweat.visible = true; this.sweat.scale.set(sc, 1.5 * sc, 0.7 * sc); this.sweat.position.y = this.hr * (0.45 - Math.min(0.3, a * 0.08)) + Math.sin(t * 40) * 0.004; } else this.sweat.visible = false;

    // ---- arms (pose blend with overshoot on change)
    const poseName = this.held(t, 'pose', 'idle');
    const pt = this.heldKeyTime(t, 'pose');
    let prevPose = 'idle'; for (const k of this.track) { if (k.t >= pt) break; if (k.pose) prevPose = k.pose; }
    const pa = (t - pt) / 0.22; const k = pa >= 1 ? 1 : backOut(pa);
    let A = ARM[poseName] || ARM.idle, B = ARM[prevPose] || ARM.idle;
    if (mode !== 'stand' && ['idle', 'lantern'].includes(poseName)) { // arm swing while walking / pumping while running (lantern hand swings less)
      const sw = Math.sin(phase) * ({ walk: 0.16, waddle: 0.08, run: 0.34, pull: 0 }[mode] || 0);
      const y = mode === 'run' ? -0.26 : -0.54;
      A = [[0.1 + Math.abs(sw) * 0.3, y + sw * 0.4, 0.04 + sw, 0.1], poseName === 'lantern' ? [0.16, -0.46, 0.2 - sw * 0.3, 0.1] : [0.1 + Math.abs(sw) * 0.3, y - sw * 0.4, 0.04 - sw, 0.1]];
      B = A;
    }
    if (exprName === 'laugh' && poseName === 'idle') { const b2 = Math.sin((t + sd) * 4.6 * Math.PI) * 0.05; A = [[0.16, -0.36 + b2, 0.18, 0.12], [0.16, -0.36 - b2, 0.18, 0.12]]; }
    const work = this.held(t, 'work', null); // looping hand motion e.g. 'knit','saw','ring','pull'
    for (let i = 0; i < 2; i++) {
      const side = i === 0 ? -1 : 1;
      const a = A[i].map((v, j) => B[i][j] + (v - B[i][j]) * k);
      if (work === 'saw' && i === 1) a[2] += Math.sin(t * 9) * 0.14;
      if (work === 'pull') { a[2] += Math.sin(phase) * 0.03; }
      if (work === 'gesture' && i === 1) { a[1] += Math.sin(t * 5 + sd) * 0.05; a[0] += Math.sin(t * 3.3 + sd) * 0.04; }
      const sh = new THREE.Vector3(side * this.shoulderX, this.shoulderY, 0);
      const hand = new THREE.Vector3(side * (this.shoulderX + a[0] * u), this.shoulderY + a[1] * u, a[2] * u);
      const mid = sh.clone().lerp(hand, 0.5); mid.x += side * a[3] * u; mid.y -= Math.abs(a[3]) * 0.4 * u;
      this.tube(this.arms[i].tube, [sh, mid, hand], u * 0.024);
      this.arms[i].hand.position.copy(hand);
      if (i === 1) { this.handR = hand; }
    }
    if (this.props.spear) { const h = this.handR; this.props.spear.position.set(h.x, h.y, h.z); this.props.spear.rotation.z = -0.04; }
    this.props.lantern.visible = !!this.held(t, 'lantern', false);
    if (this.props.lantern.visible) { const h = this.handR; this.props.lantern.position.copy(h); this.props.lantern.rotation.z = Math.sin(phase + 0.8) * 0.25 + Math.sin(t * 2) * 0.05; this.props.lantern.rotation.x = -leanX; }

    // ---- legs (root space): hip -> knee -> foot; sitting legs dangle forward
    const hipY = (sitH ?? this.hipY) + bob;
    for (let i = 0; i < 2; i++) {
      const [x, lift, z, kneeF] = feet[i];
      const hip = new THREE.Vector3(x, hipY, 0).applyEuler(this.lean.rotation);
      let foot, knee;
      if (sitH !== null && sitH !== undefined) {
        const sw = Math.sin(t * 2.4 + i * 1.3 + sd) * 0.06 * u;
        knee = new THREE.Vector3(x * 1.1, sitH, 0.32 * u).applyEuler(this.lean.rotation);
        foot = new THREE.Vector3(x * 1.15, Math.max(0.05, sitH - 0.55 * u), 0.36 * u + sw);
      } else {
        foot = new THREE.Vector3(x, lift + 0.03 * u, z);
        knee = hip.clone().lerp(foot, 0.5); knee.z += 0.05 * u + kneeF; knee.x += Math.sign(x) * 0.02 * u;
      }
      if (s.legs || mode !== 'stand' || sitH != null) {
        this.tube(this.legs[i].tube, [hip, knee, foot], u * 0.028); this.legs[i].tube.visible = s.legs || sitH != null;
      } else this.legs[i].tube.visible = false;
      this.legs[i].foot.position.copy(foot); this.legs[i].foot.position.z += 0.04 * u;
      this.legs[i].foot.visible = s.legs || mode !== 'stand' || sitH != null;
    }
  }

  tube(mesh, pts, r) {
    const c = new THREE.QuadraticBezierCurve3(pts[0], pts[1], pts[2]);
    mesh.geometry.dispose(); mesh.geometry = new THREE.TubeGeometry(c, 14, r, 6, false);
  }
}

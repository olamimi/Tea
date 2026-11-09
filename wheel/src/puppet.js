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
const FW = 1024, FH = 512, CX = 256, CY = 290; // features sit a little below the equator: broad white forehead
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
  const seg = (x1, y1, x2, y2) => { ctx.beginPath(); ctx.moveTo(x1 + 3, y1); ctx.lineTo(x2 - 3, y2); strokeP(ctx, 14); };
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
  ctx.translate(CX, CY); ctx.scale(1.3, 1.3); ctx.translate(-CX, -CY);
  if (['happy', 'smile', 'laugh', 'grin'].includes(f.mouth) || f.eyes === 'happy' || f.blush || spec.blush) { ctx.fillStyle = 'rgba(240,120,130,0.45)'; for (const x of [CX - 92, CX + 92]) { ctx.beginPath(); ctx.ellipse(x, CY + 34, 24, 13, 0, 0, Math.PI * 2); ctx.fill(); } }
  drawEyes(ctx, f.eyes, f.gx || 0, f.gy || 0);
  drawBrows(ctx, f.brows, f.eyes);
  drawMouth(ctx, f.mouth);
  if (spec.mustache) {
    const y = CY + 46; ctx.beginPath(); ctx.moveTo(CX, y); ctx.quadraticCurveTo(CX - 50, y - 4, CX - 62, y + 44); ctx.quadraticCurveTo(CX - 42, y + 18, CX, y + 12);
    ctx.quadraticCurveTo(CX + 42, y + 18, CX + 62, y + 44); ctx.quadraticCurveTo(CX + 50, y - 4, CX, y); fillP(ctx, INK);
  }
  if (spec.glasses) { ctx.lineWidth = 9; ctx.strokeStyle = INK; for (const x of [CX - 58, CX + 58]) { ctx.beginPath(); ctx.arc(x, CY - 4, 34, 0, Math.PI * 2); ctx.stroke(); } ctx.beginPath(); ctx.moveTo(CX - 24, CY - 8); ctx.quadraticCurveTo(CX, CY - 16, CX + 24, CY - 8); ctx.stroke(); }
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
  // --- school cast (white heads per the house style; identity via hair, uniform and build)
  tobi:      { H: 1.9, uniform: 'boy', top: '#f6f7fb', bottom: '#28356e', tie: '#8e1d2c', legs: true, legLen: 0.44, width: 0.24, hat: 'short', hairColor: '#2a1c14' },
  kemi:      { H: 1.85, uniform: 'girl', top: '#f6f7fb', bottom: '#28356e', legs: true, legLen: 0.44, width: 0.25, hat: 'puffs', hairColor: '#24160f', blush: true, bow: '#e0453a' },
  ada:       { H: 1.8, uniform: 'girl', top: '#7a4fa8', bottom: '#28356e', legs: true, legLen: 0.43, width: 0.24, hat: 'bun', hairColor: '#3a2416', cardigan: true },
  boyA:      { H: 1.92, uniform: 'boy', top: '#f6f7fb', bottom: '#28356e', tie: '#8e1d2c', legs: true, legLen: 0.44, width: 0.27, hat: 'short', hairColor: '#1a120c' },
  boyB:      { H: 1.86, uniform: 'boy', top: '#f6f7fb', bottom: '#28356e', tie: '#8e1d2c', legs: true, legLen: 0.43, width: 0.26, hat: 'flat', hairColor: '#2a1c14' },
  girlB:     { H: 1.82, uniform: 'girl', top: '#f6f7fb', bottom: '#28356e', legs: true, legLen: 0.43, width: 0.25, hat: 'bun', hairColor: '#20140c' },
  president: { H: 2.3, uniform: 'boy', top: '#f6f7fb', bottom: '#1d2550', tie: '#8e1d2c', badge: '#e2b13c', legs: true, legLen: 0.36, width: 0.44, belly: 1.3, hat: 'short', hairColor: '#120c08' },
  teacher:   { H: 2.05, body: '#3f7f86', collar: '#f3e6d0', legs: false, width: 0.3, belly: 1.1, hat: 'bun', hairColor: '#4a2a1a', earrings: true },
  teacherM:  { H: 2.1, uniform: 'man', top: '#bcd3ea', bottom: '#3a3f4a', tie: '#2c4a7a', legs: true, legLen: 0.44, width: 0.28, hat: 'flat', hairColor: '#1a120c', glasses: true },
  principal: { H: 2.15, uniform: 'suit', top: '#3b4150', bottom: '#2c313c', tie: '#a01e2e', legs: true, legLen: 0.42, width: 0.33, belly: 1.2, hat: 'balding', hairColor: '#8a8a8a', glasses: true, mustache: true },
  rich:      { H: 2.15, uniform: 'suit', top: '#6a2a5a', bottom: '#3a1a34', tie: '#e2b13c', legs: true, legLen: 0.38, width: 0.36, belly: 1.3, hat: 'tophat', hatColor: '#1e1a22', mustache: true },
  porter:    { H: 2.0, uniform: 'man', top: '#c98a4a', bottom: '#5a4a3a', legs: true, legLen: 0.42, width: 0.3, hat: 'cap', hatColor: '#3f6f8a' },
  porterB:   { H: 2.05, uniform: 'man', top: '#5f8a6a', bottom: '#4a3f36', legs: true, legLen: 0.42, width: 0.32, hat: 'short', hairColor: '#2a1c14' },
  porterC:   { H: 1.95, uniform: 'man', top: '#d4b04a', bottom: '#4a4a52', legs: true, legLen: 0.42, width: 0.29, hat: 'cap', hatColor: '#a8402e' },
  caveman:   { H: 1.95, body: '#9a6a3a', print: '#6a4426', legs: true, legLen: 0.4, width: 0.3, hat: 'wild', hairColor: '#4a2e1a', beard: true },
  cavemanB:  { H: 1.9, body: '#8a5a32', print: '#5a3a20', legs: true, legLen: 0.4, width: 0.31, hat: 'wild', hairColor: '#2a1a10' },
  worker:    { H: 2.0, uniform: 'man', top: '#e8eef4', bottom: '#3a4250', tie: '#3a6aa8', legs: true, legLen: 0.42, width: 0.28, hat: 'flat', hairColor: '#2a1c14', glasses: true },
  boss:      { H: 2.1, uniform: 'suit', top: '#2e3a4a', bottom: '#232b36', tie: '#c0392b', legs: true, legLen: 0.4, width: 0.33, belly: 1.15, hat: 'balding', hairColor: '#6a6a6a' },
  inventor:  { H: 2.0, uniform: 'man', top: '#f2f2ee', bottom: '#4a4a52', tie: '#d4572a', legs: true, legLen: 0.42, width: 0.28, hat: 'wild', hairColor: '#e8e8e8', glasses: true },
  boatman:   { H: 1.95, uniform: 'man', top: '#e8e0d0', bottom: '#2a3a5a', legs: true, legLen: 0.4, width: 0.29, hat: 'straw', hatColor: '#d9b45a' },
  dad:       { H: 2.1, uniform: 'man', top: '#d9893f', bottom: '#3a3f4a', legs: true, legLen: 0.42, width: 0.31, hat: 'short', hairColor: '#1a120c', mustache: true },
};

// body texture: equirect-ish around the lathe (u=0.5 is the front)
function bodyTex(spec) {
  const c = document.createElement('canvas'); c.width = 1024; c.height = 512; const ctx = c.getContext('2d');
  ctx.fillStyle = spec.body; ctx.fillRect(0, 0, 1024, 512);
  if (spec.uniform) { // u=0.5 is the front; canvas top = torso top
    const split = spec.uniform === 'girl' ? 0 : 300;
    ctx.fillStyle = spec.top; ctx.fillRect(0, 0, 1024, 512);
    if (spec.uniform === 'girl') { // navy pinafore over a white blouse: blouse shows at the shoulders/collar
      ctx.fillStyle = spec.bottom; ctx.fillRect(0, 70, 1024, 442); ctx.fillStyle = spec.top; ctx.beginPath(); ctx.moveTo(440, 60); ctx.lineTo(512, 150); ctx.lineTo(584, 60); ctx.fill();
      ctx.fillStyle = spec.bottom; for (const x of [380, 644]) ctx.fillRect(x - 18, 0, 36, 80); // straps
      ctx.strokeStyle = 'rgba(0,0,0,0.25)'; ctx.lineWidth = 4; for (const x of [430, 512, 594]) { ctx.beginPath(); ctx.moveTo(x, 330); ctx.lineTo(x + (x - 512) * 0.15, 512); ctx.stroke(); } // pleats
    } else {
      ctx.fillStyle = spec.bottom; ctx.fillRect(0, split, 1024, 512 - split);
      if (spec.uniform === 'suit') { ctx.fillStyle = spec.top; ctx.fillRect(0, 0, 1024, 512); ctx.fillStyle = '#f4f4f4'; ctx.beginPath(); ctx.moveTo(462, 0); ctx.lineTo(512, 170); ctx.lineTo(562, 0); ctx.fill(); ctx.strokeStyle = 'rgba(0,0,0,0.5)'; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(440, 0); ctx.lineTo(500, 230); ctx.moveTo(584, 0); ctx.lineTo(524, 230); ctx.stroke(); }
      ctx.fillStyle = '#1a1a1a'; ctx.fillRect(0, split - 8, 1024, 16); // belt
      ctx.fillStyle = 'rgba(0,0,0,0.2)'; for (const y of [70, 140, 210]) { ctx.beginPath(); ctx.arc(512, y, 6, 0, 7); ctx.fill(); } // buttons
      if (spec.uniform !== 'suit') { ctx.strokeStyle = 'rgba(0,0,0,0.3)'; ctx.lineWidth = 4; ctx.strokeRect(560, 60, 60, 54); } // pocket
    }
    if (spec.cardigan) { ctx.fillStyle = '#f6f7fb'; ctx.beginPath(); ctx.moveTo(452, 0); ctx.lineTo(512, 120); ctx.lineTo(572, 0); ctx.fill(); ctx.fillStyle = 'rgba(255,255,255,0.6)'; for (const y of [150, 220, 290]) { ctx.beginPath(); ctx.arc(512, y, 7, 0, 7); ctx.fill(); } }
    if (spec.tie) { ctx.fillStyle = spec.tie; ctx.beginPath(); ctx.moveTo(498, 0); ctx.lineTo(526, 0); ctx.lineTo(522, 24); ctx.lineTo(534, 210); ctx.lineTo(512, 240); ctx.lineTo(490, 210); ctx.lineTo(502, 24); ctx.closePath(); ctx.fill(); ctx.strokeStyle = 'rgba(0,0,0,0.35)'; ctx.lineWidth = 3; ctx.stroke(); }
    if (spec.badge) { ctx.fillStyle = spec.badge; ctx.beginPath(); ctx.arc(420, 100, 24, 0, 7); ctx.fill(); ctx.strokeStyle = '#7a5a10'; ctx.lineWidth = 4; ctx.stroke(); }
    if (spec.uniform !== 'suit') { ctx.strokeStyle = 'rgba(0,0,0,0.35)'; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(470, 0); ctx.lineTo(512, 34); ctx.lineTo(554, 0); ctx.stroke(); } // collar
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 16; return t;
  }
  if (spec.print) { // ankara / kaftan print: big soft motifs (low frequency: no shimmer)
    for (let y = 30; y < 512; y += 90) for (let x = ((y / 90) % 2) * 60; x < 1024; x += 120) { ctx.fillStyle = spec.print; ctx.globalAlpha = 0.55; ctx.beginPath(); ctx.ellipse(x, y, 26, 18, 0.5, 0, 7); ctx.fill(); ctx.globalAlpha = 1; }
    ctx.strokeStyle = spec.print; ctx.lineWidth = 10; ctx.beginPath(); ctx.moveTo(470, 0); ctx.lineTo(512, 90); ctx.lineTo(554, 0); ctx.stroke();
  }
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
let GRAD = null;
function toonGrad() { if (GRAD) return GRAD; GRAD = new THREE.DataTexture(new Uint8Array([178, 178, 178, 255, 255, 255, 255, 255]), 2, 1, THREE.RGBAFormat); GRAD.minFilter = GRAD.magFilter = THREE.NearestFilter; GRAD.needsUpdate = true; return GRAD; }
export function toon(color, extra = {}) { // near-flat shading: one soft shade step + emissive lift so whites stay white
  return new THREE.MeshToonMaterial({ color, gradientMap: toonGrad(), emissive: 0xffffff, emissiveIntensity: 0.0, ...extra });
}
// ink outline: back faces pushed out along the normal by an absolute world-space width (consistent line weight)
function inkMat(width) {
  return new THREE.ShaderMaterial({ side: THREE.BackSide, uniforms: { w: { value: width } },
    vertexShader: `#include <common>
#include <logdepthbuf_pars_vertex>
uniform float w;
void main() { vec3 n = normalize(normal); vec4 mv = modelViewMatrix * vec4(position, 1.0); vec3 nv = normalize(normalMatrix * n); mv.xyz += nv * w; gl_Position = projectionMatrix * mv;
#include <logdepthbuf_vertex>
}`,
    fragmentShader: `#include <logdepthbuf_pars_fragment>
void main() { gl_FragColor = vec4(0.078, 0.078, 0.078, 1.0);
#include <logdepthbuf_fragment>
}` });
}
function mats() {
  if (MAT.ink) return MAT;
  MAT.ink = new THREE.MeshBasicMaterial({ color: 0x141414 });
  MAT.inkBack = new THREE.MeshBasicMaterial({ color: 0x141414, side: THREE.BackSide });
  MAT.skin = toon(0xfbf9f4, { emissive: 0xfbf9f4, emissiveIntensity: 0.12 }); // scene light tints the white heads
  MAT.shoe = new THREE.MeshStandardMaterial({ color: 0x2a2320, roughness: 0.6 });
  MAT.metal = new THREE.MeshStandardMaterial({ color: 0xaab2bc, metalness: 0.8, roughness: 0.35 });
  MAT.wood = new THREE.MeshStandardMaterial({ color: 0x7a5a34, roughness: 0.8 });
  MAT.gold = new THREE.MeshStandardMaterial({ color: 0xe2b13c, metalness: 0.9, roughness: 0.3 });
  MAT.sweat = new THREE.MeshStandardMaterial({ color: 0x8fd0f2, roughness: 0.15, emissive: 0x3a7fa8, emissiveIntensity: 0.4 });
  return MAT;
}
const outlined = (geo, mat, width, parent) => { // mesh + ink outline of absolute width
  const m = new THREE.Mesh(geo, mat); m.castShadow = true; m.receiveShadow = true; // window/blind light lands on characters
  const o = new THREE.Mesh(geo, inkMat(width)); m.add(o); parent?.add(m); return m;
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
  phone: [[0.1, -0.56, 0.04, 0.12], [0.02, 0.5, 0.16, 0.28]],
  cross: [[-0.14, -0.2, 0.3, 0.05], [-0.14, -0.16, 0.32, 0.05]],
  dig: [[0.0, -0.36, 0.5, 0.08], [0.02, -0.4, 0.5, 0.08]],
  hold2: [[0.1, -0.56, 0.04, 0.12], [0.2, -0.12, 0.42, 0.1]],
};

export class Puppet {
  constructor(specName, opts = {}) {
    const s = this.spec = { ...SPECS[specName], ...opts };
    this.name = specName; this.seed = opts.seed ?? hash(specName.length * 13.7 + (opts.seedOffset || 0)) * 100;
    const M = mats(); const H = s.H; const u = H / 2; this.u = u;
    this.root = new THREE.Group(); // at the feet
    this.lean = new THREE.Group(); this.root.add(this.lean); // pivots at the feet (inverted pendulum)
    this.hips = new THREE.Group(); this.lean.add(this.hips);
    const hr = this.hr = H * 0.135;               // head diameter ~0.27H
    const lineW = this.lineW = H * 0.011;          // outline weight ~1% of height
    const legLen = s.legs ? H * (s.legLen ?? 0.46) : 0;
    this.hipY = legLen; this.hips.position.y = legLen;
    const headC = H - hr;                           // head centre (world, standing)
    const top = headC - hr * 0.62 - legLen;         // torso top tucks under the head (overlap)
    const y0 = s.legs ? -H * 0.035 : 0;             // tunic hem just below the hips; robes reach the ground
    const bodyH = top; const w = s.width * u; const b = s.belly || 1;
    const prof = []; const N = 24;
    const rAt = (v) => { // soft pill (superellipse); robes flare a little toward a flatter hem
      const p = v < 0.5 ? (s.legs ? 2.4 : 5) : 2.2;
      let r = w * Math.pow(Math.max(0, 1 - Math.pow(Math.abs(2 * v - 1), p)), 1 / p);
      r *= 1 + 0.08 * Math.sin(v * Math.PI) * (b - 1) * 5;
      if (!s.legs) r *= 1 + 0.16 * Math.pow(1 - v, 1.5);
      return Math.max(0.001, r);
    };
    for (let i = 0; i <= N; i++) { const v = i / N; prof.push(new THREE.Vector2(i === 0 || i === N ? 0.001 : rAt(v), y0 + v * (top - y0))); }
    const bodyGeo = new THREE.LatheGeometry(prof, 48, -Math.PI, Math.PI * 2); bodyGeo.computeVertexNormals();
    { const bt = bodyTex(s); this.bodyMat = toon(0xffffff, { map: bt, emissiveMap: bt, emissiveIntensity: 0.32 }); }
    this.torso = new THREE.Group(); this.hips.add(this.torso);
    this.body = outlined(bodyGeo, this.bodyMat, lineW, this.torso);
    this.bodyH = bodyH;
    const vS = ((top - hr * 0.35) - y0) / (top - y0); // arms start high on the sides, just under the head
    this.shoulderY = top - hr * 0.35; this.shoulderX = rAt(vS) * 0.92;
    this.hipW = rAt(0.18) * 0.42;
    // head on a neck pivot at the torso top
    this.neck = new THREE.Group(); this.neck.position.y = top - hr * 0.2; this.torso.add(this.neck);
    this.head = new THREE.Group(); this.head.position.y = headC - legLen - (top - hr * 0.2); this.neck.add(this.head);
    this.headMat = M.skin.clone();
    this.tintU = { level: { value: -2 }, color: { value: new THREE.Color(0xd8302a) } };
    this.headMat.onBeforeCompile = (sh) => {
      sh.uniforms.tintLevel = this.tintU.level; sh.uniforms.tintColor = this.tintU.color;
      sh.vertexShader = 'varying float vLY;\n' + sh.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\nvLY = position.y;');
      sh.fragmentShader = 'varying float vLY;\nuniform float tintLevel;\nuniform vec3 tintColor;\n' + sh.fragmentShader
        .replace('#include <color_fragment>', '#include <color_fragment>\nfloat tm = smoothstep(tintLevel + 0.02, tintLevel - 0.02, vLY);\ndiffuseColor.rgb = mix(diffuseColor.rgb, tintColor, tm * 0.9);')
        .replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\ntotalEmissiveRadiance = mix(totalEmissiveRadiance, tintColor * 0.35, tm);');
    };
    this.headMat.customProgramCacheKey = () => 'tinted-head';
    const hg = new THREE.SphereGeometry(hr, 48, 32); hg.scale(1.02, 0.97, 1); // slightly wider than tall
    this.headMesh = outlined(hg, this.headMat, lineW, this.head);
    this.faceMat = new THREE.MeshBasicMaterial({ transparent: true, alphaTest: 0.3, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2 });
    this.faceMesh = new THREE.Mesh(new THREE.SphereGeometry(hr * 1.004, 48, 32), this.faceMat); this.head.add(this.faceMesh);
    this.faceMesh.scale.set(1.02, 0.97, 1);
    this.buildHat(s, hr);
    // steam puffs (anger): deterministic rising puffs at both sides of the head
    this.steam = [];
    for (let i = 0; i < 8; i++) { const p = new THREE.Mesh(new THREE.SphereGeometry(hr * 0.2, 12, 10), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0, depthWrite: false })); this.head.add(p); this.steam.push(p); }
    // sweat drop (child of head)
    this.sweat = new THREE.Mesh(new THREE.SphereGeometry(hr * 0.12, 16, 12), M.sweat); this.sweat.scale.set(1, 1.5, 0.7);
    this.sweat.position.set(hr * 0.78, hr * 0.45, hr * 0.45); this.head.add(this.sweat); this.sweat.visible = false;
    // soft contact shadow so characters sit on the floor
    { const c = document.createElement('canvas'); c.width = c.height = 64; const x = c.getContext('2d'); const g = x.createRadialGradient(32, 32, 0, 32, 32, 32); g.addColorStop(0, 'rgba(40,22,12,0.55)'); g.addColorStop(1, 'rgba(40,22,12,0)'); x.fillStyle = g; x.fillRect(0, 0, 64, 64);
      const tx = new THREE.CanvasTexture(c); this.contact = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: tx, transparent: true, depthWrite: false }));
      this.contact.rotation.x = -Math.PI / 2; this.contact.position.y = 0.008; this.contact.scale.set(s.width * u * 2.6, s.width * u * 1.9, 1); this.contact.renderOrder = -1; this.contact.castShadow = false; this.root.add(this.contact); }
    // limbs: tubes rebuilt per frame
    this.limbMat = M.ink;
    this.arms = [0, 1].map(() => { const tube = new THREE.Mesh(new THREE.BufferGeometry(), M.ink); tube.castShadow = true; this.torso.add(tube);
      const hand = new THREE.Mesh(new THREE.SphereGeometry(H * 0.016, 14, 10), M.ink); hand.castShadow = true; this.torso.add(hand); return { tube, hand }; });
    this.legs = [0, 1].map(() => { const tube = new THREE.Mesh(new THREE.BufferGeometry(), M.ink); tube.castShadow = true; this.root.add(tube);
      const foot = new THREE.Mesh(new THREE.SphereGeometry(H * 0.022, 14, 10), M.ink); foot.scale.set(0.9, 0.6, 1.7); foot.castShadow = true; this.root.add(foot); return { tube, foot }; });
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
    this.root.traverse((o) => { if (o.isMesh) o.castShadow = o !== this.contact; });
  }

  buildHat(s, hr) {
    const M = mats(); const h = this.head;
    const mk = (geo, color) => outlined(geo, toon(color, { emissive: color, emissiveIntensity: 0.18 }), this.lineW * 0.9, h);
    h.scale.setScalar(1); const hs = 1.12; // hats read generously sized
    hr = hr * hs;
    const hairMat = (c) => toon(new THREE.Color(s.hairColor || c || '#222').getHex(), { emissive: new THREE.Color(s.hairColor || c || '#222').getHex(), emissiveIntensity: 0.12 });
    const blob = (r, x, y, z, sx = 1, sy = 1, sz = 1, mat) => { const b = outlined(new THREE.SphereGeometry(r, 20, 14), mat, this.lineW * 0.8, h); b.position.set(x, y, z); b.scale.set(sx, sy, sz); return b; };
    switch (s.hat) {
      case 'tophat': { const m = toon(new THREE.Color(s.hatColor).getHex(), { emissive: 0x111111, emissiveIntensity: 0.2 });
        const crown = outlined(new THREE.CylinderGeometry(hr * 0.62, hr * 0.62, hr * 1.1, 28), m, this.lineW * 0.8, h); crown.position.y = hr * 1.25;
        const brim = outlined(new THREE.CylinderGeometry(hr * 1.05, hr * 1.05, hr * 0.07, 28), m, this.lineW * 0.8, h); brim.position.y = hr * 0.7;
        const band = new THREE.Mesh(new THREE.CylinderGeometry(hr * 0.63, hr * 0.63, hr * 0.16, 28), M.gold); band.position.y = hr * 0.85; h.add(band); break; }
      case 'cap': { const m = toon(new THREE.Color(s.hatColor).getHex(), { emissive: new THREE.Color(s.hatColor).getHex(), emissiveIntensity: 0.15 });
        const dome = outlined(new THREE.SphereGeometry(hr * 0.98, 30, 16, 0, Math.PI * 2, 0, Math.PI * 0.42), m, this.lineW * 0.8, h); dome.rotation.x = -0.15;
        const bill = outlined(new THREE.CylinderGeometry(hr * 0.6, hr * 0.6, hr * 0.06, 24, 1, false, -Math.PI / 2, Math.PI), m, this.lineW * 0.7, h); bill.position.set(0, hr * 0.42, hr * 0.62); bill.rotation.x = 0.15; break; }
      case 'straw': { const m = toon(new THREE.Color(s.hatColor).getHex(), { emissive: new THREE.Color(s.hatColor).getHex(), emissiveIntensity: 0.2 });
        const crown = outlined(new THREE.CylinderGeometry(hr * 0.66, hr * 0.7, hr * 0.42, 26), m, this.lineW * 0.8, h); crown.position.y = hr * 0.9;
        const brim = outlined(new THREE.CylinderGeometry(hr * 1.3, hr * 1.3, hr * 0.05, 30), m, this.lineW * 0.8, h); brim.position.y = hr * 0.7;
        const band = new THREE.Mesh(new THREE.CylinderGeometry(hr * 0.67, hr * 0.67, hr * 0.1, 26), toon(0x2a3a6a)); band.position.y = hr * 0.78; h.add(band); break; }
      case 'wild': { const m = hairMat();
        for (let i = 0; i < 11; i++) { const a = (i / 11) * Math.PI * 2; blob(hr * (0.3 + (i % 3) * 0.05), Math.sin(a) * hr * 0.72, hr * (0.55 + Math.cos(a * 3) * 0.12), Math.cos(a) * hr * 0.55 - hr * 0.15, 1, 0.8, 1, m); }
        blob(hr * 0.5, 0, hr * 0.8, -hr * 0.2, 1.4, 0.7, 1.1, m); break; }
      case 'short': { // close-cropped hair cap, slightly lumpy
        const m = hairMat(); const cap = outlined(new THREE.SphereGeometry(hr * 0.93, 32, 18, 0, Math.PI * 2, 0, Math.PI * 0.4), m, this.lineW * 0.8, h); cap.rotation.x = -0.32; cap.position.y = hr * 0.02;
        for (let i = 0; i < 7; i++) { const a = (i / 7) * Math.PI * 2; blob(hr * 0.2, Math.sin(a) * hr * 0.5, hr * 0.68, Math.cos(a) * hr * 0.42 - hr * 0.12, 1, 0.6, 1, m); }
        break;
      }
      case 'flat': { const m = hairMat(); const cap = outlined(new THREE.SphereGeometry(hr * 0.94, 32, 18, 0, Math.PI * 2, 0, Math.PI * 0.34), m, this.lineW * 0.8, h); cap.rotation.x = -0.3; break; }
      case 'puffs': { const m = hairMat(); const cap = outlined(new THREE.SphereGeometry(hr * 0.93, 32, 18, 0, Math.PI * 2, 0, Math.PI * 0.36), m, this.lineW * 0.8, h); cap.rotation.x = -0.3;
        this.puffs = [-1, 1].map((sd) => blob(hr * 0.42, sd * hr * 0.72, hr * 0.78, -hr * 0.1, 1, 0.95, 1, m)); break; }
      case 'bun': { const m = hairMat(); const cap = outlined(new THREE.SphereGeometry(hr * 0.93, 32, 18, 0, Math.PI * 2, 0, Math.PI * 0.38), m, this.lineW * 0.8, h); cap.rotation.x = -0.3;
        this.puffs = [blob(hr * 0.4, 0, hr * 1.05, -hr * 0.2, 1, 0.9, 1, m)]; break; }
      case 'balding': { const m = hairMat(); for (const sd of [-1, 1]) blob(hr * 0.3, sd * hr * 0.88, hr * 0.12, -hr * 0.2, 0.5, 0.9, 1.2, m); blob(hr * 0.5, 0, hr * 0.1, -hr * 0.75, 1.3, 0.8, 0.5, m); break; }
      case 'gele': { // tall pleated headwrap
        const m = toon(new THREE.Color(s.hatColor).getHex(), { emissive: new THREE.Color(s.hatColor).getHex(), emissiveIntensity: 0.2 });
        const base = outlined(new THREE.SphereGeometry(hr * 1.02, 32, 18, 0, Math.PI * 2, 0, Math.PI * 0.42), m, this.lineW * 0.8, h); base.rotation.x = -0.25;
        for (let i = 0; i < 5; i++) { const f = outlined(new THREE.SphereGeometry(hr * 0.42, 16, 12), m, this.lineW * 0.7, h); f.scale.set(1.6 - i * 0.18, 0.55, 0.9); f.position.set((i - 2) * hr * 0.1, hr * (0.72 + i * 0.16), -hr * 0.1); f.rotation.z = (i % 2 ? 0.25 : -0.25); this.puffs = (this.puffs || []).concat(f); }
        break;
      }
      case 'fila': { const m = toon(new THREE.Color(s.hatColor).getHex(), { emissive: new THREE.Color(s.hatColor).getHex(), emissiveIntensity: 0.2 });
        const cap = outlined(new THREE.CylinderGeometry(hr * 0.86, hr * 0.94, hr * 0.6, 32), m, this.lineW * 0.8, h); cap.position.y = hr * 0.72; cap.rotation.z = 0.12; cap.rotation.x = -0.1; break; }
      case 'scarf': {
        const cap = mk(new THREE.SphereGeometry(hr * 1.06, 40, 20, 0, Math.PI * 2, 0, Math.PI * 0.36), 0xe9832f); cap.rotation.x = -0.18;
        const knot = mk(new THREE.SphereGeometry(hr * 0.2, 16, 12), 0xe9832f); knot.position.set(hr * 0.95, hr * 0.15, -hr * 0.25); knot.scale.set(0.6, 1, 1.3);
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
        const dome = mk(new THREE.SphereGeometry(hr * 1.07, 40, 20, 0, Math.PI * 2, 0, Math.PI * 0.36), 0xa9b1bb); dome.material.metalness = 0.25; dome.material.roughness = 0.45; dome.material.emissive = new THREE.Color(0x30343a);
        const brim = new THREE.Mesh(new THREE.TorusGeometry(hr * 0.98, hr * 0.08, 10, 40), M.gold); brim.rotation.x = Math.PI / 2; brim.position.y = hr * 0.43; brim.scale.setScalar(0.92); h.add(brim);
        this.plume = mk(new THREE.SphereGeometry(hr * 0.22, 16, 12), 0xd23b30); this.plume.scale.set(0.5, 1.4, 1.6); this.plume.position.set(0, hr * 1.2, -hr * 0.15);
        break;
      }
      case 'cone': {
        const cone = mk(new THREE.ConeGeometry(hr * 0.72, hr * 1.5, 32), new THREE.Color(s.hatColor).getHex()); cone.position.y = hr * 1.35;
        const brim = mk(new THREE.CylinderGeometry(hr * 0.95, hr * 0.95, hr * 0.06, 32), new THREE.Color(s.hatColor).getHex()); brim.position.y = hr * 0.62;
        break;
      }
    }
    if (s.bow) { const bm = toon(new THREE.Color(s.bow).getHex(), { emissive: new THREE.Color(s.bow).getHex(), emissiveIntensity: 0.2 }); for (const sd of [-1, 1]) { const b = outlined(new THREE.SphereGeometry(hr * 0.13, 14, 10), bm, this.lineW * 0.7, h); b.scale.set(1.5, 0.9, 0.7); b.position.set(sd * hr * 0.58, hr * 0.62, hr * 0.32); } }
    if (s.earrings) { for (const sd of [-1, 1]) { const e = new THREE.Mesh(new THREE.SphereGeometry(hr * 0.09, 12, 8), M.gold); e.position.set(sd * hr * 0.98, -hr * 0.22, 0.02); h.add(e); } }
    if (s.braid) { // chain of beads hanging behind the right ear; animated with lag
      this.braid = [];
      for (let i = 0; i < 6; i++) { const b = outlined(new THREE.SphereGeometry(hr * (0.17 - i * 0.012), 14, 10), toon(0x5a3828), this.lineW * 0.7, h); this.braid.push(b); }
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
    // settle body facing/position FIRST so head-turn (look) math never uses a stale rotation
    if (this.path && t >= this.path.t0 - 0.01) { const P = this.path; const dir = new THREE.Vector3().subVectors(P.to, P.from); this.facing = P.face ?? Math.atan2(dir.x, dir.z); }
    this.root.rotation.y = this.facing + this.chan(t, 'turn', 0); this.root.updateMatrixWorld(true);
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
    const legs = this.legs; const hipW = this.hipW;
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
    this.contact.visible = sitH == null;
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
    // anger tint (rises from the chin) and steam
    const tint = this.chan(t, 'tint', 0);
    this.tintU.level.value = tint <= 0.001 ? -2 : -this.hr + tint * 2.1 * this.hr;
    const tc = this.held(t, 'tintColor', null); if (tc) this.tintU.color.value.set(tc);
    const steamOn = this.held(t, 'steam', false);
    this.steam.forEach((p, i) => {
      if (!steamOn) { p.material.opacity = 0; return; }
      const side = i % 2 ? 1 : -1; const age = ((t * 1.6 + i * 0.37) % 1);
      p.position.set(side * this.hr * (1.05 + age * 0.5), this.hr * (0.2 + age * 1.3), -this.hr * 0.1);
      p.scale.setScalar(0.6 + age * 1.4); p.material.opacity = Math.sin(age * Math.PI) * 0.9;
    });
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
      if (work === 'dig') { a[1] += Math.sin(t * 9 + i * 2) * 0.06; a[2] += Math.sin(t * 7 + i) * 0.05; a[0] += Math.sin(t * 5.3 + i * 3) * 0.04; }
      if (work === 'count' && i === 0) { a[1] += Math.abs(Math.sin(t * 4)) * 0.08; }
      if (work === 'gesture' && i === 1) { a[1] += Math.sin(t * 5 + sd) * 0.05; a[0] += Math.sin(t * 3.3 + sd) * 0.04; }
      const sh = new THREE.Vector3(side * this.shoulderX, this.shoulderY, 0);
      const hand = new THREE.Vector3(side * (this.shoulderX + a[0] * u), this.shoulderY + a[1] * u, a[2] * u);
      const mid = sh.clone().lerp(hand, 0.5); mid.x += side * a[3] * u; mid.y -= Math.abs(a[3]) * 0.4 * u;
      this.tube(this.arms[i].tube, [sh, mid, hand], s.H * 0.0062);
      this.arms[i].hand.position.copy(hand);
      if (i === 1) { this.handR = hand; } else { this.handL = hand; }
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
        this.tube(this.legs[i].tube, [hip, knee, foot], s.H * 0.0068); this.legs[i].tube.visible = s.legs || sitH != null;
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

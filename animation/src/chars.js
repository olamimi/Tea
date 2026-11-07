// Doodle-style characters: flat 2D canvas drawings placed on billboards in the 3D world.
import * as THREE from 'three';

const W = 512, H = 1024;
const INK = '#141414';
const SKIN = '#f7f4ee';

export const SPECS = {
  engineer: { robe: '#3f8f6b', sash: '#e8b23a', collar: '#f4efe4', hat: 'scarf', braid: true },
  duke:     { robe: '#4a2b72', sash: '#d6332f', sashX: true, collar: '#e9d9a8', hat: 'feather', mustache: true, chain: true },
  guard:    { robe: '#8d949e', armor: true, skirt: '#2b7a8c', hat: 'helmet', spear: true, browDrop: 22 },
  councilA: { robe: '#3d6b3a', sash: '#c9a54a', collar: '#efe6cf', hat: 'cone', hatColor: '#2e4f2c', beard: true },
  councilB: { robe: '#7a5534', sash: '#d9c27a', collar: '#efe6cf', hat: 'cone', hatColor: '#4f3420' },
};

function stroke(ctx, w = 8, c = INK) { ctx.lineWidth = w; ctx.strokeStyle = c; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.stroke(); }
function fill(ctx, c) { ctx.fillStyle = c; ctx.fill(); }
function circle(ctx, x, y, r) { ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); }

const ARMS = {
  idle:  [[170, 445, 118, 590, 140, 735], [342, 445, 394, 590, 372, 735]],
  point: [[170, 445, 118, 590, 140, 735], [342, 445, 440, 420, 482, 300]],
  raise: [[170, 445, 112, 330, 70, 168], [342, 445, 400, 330, 442, 168]],
  pull:  [[170, 445, 300, 520, 470, 610], [342, 445, 420, 520, 488, 585]],
  shrug: [[170, 445, 110, 560, 84, 430], [342, 445, 402, 560, 428, 430]],
  hold:  [[170, 445, 118, 590, 140, 735], [342, 445, 420, 560, 430, 640]],
  lean:  [[170, 445, 230, 560, 300, 560], [342, 445, 430, 470, 486, 360]],
};

function drawBody(ctx, s, pose) {
  // Braid sits behind everything.
  if (s.braid) {
    for (let i = 0; i < 7; i++) {
      ctx.beginPath(); ctx.ellipse(372 + i * 4, 300 + i * 34, 22, 26, 0.2, 0, Math.PI * 2);
      fill(ctx, '#3a2418'); stroke(ctx, 6);
    }
    ctx.beginPath(); ctx.ellipse(400, 548, 16, 10, 0, 0, Math.PI * 2); fill(ctx, '#e9832f'); stroke(ctx, 5);
  }
  if (s.spear) {
    ctx.beginPath(); ctx.moveTo(430, 70); ctx.lineTo(430, 1010); stroke(ctx, 18); stroke(ctx, 10, '#7a5a34');
    ctx.beginPath(); ctx.moveTo(430, 10); ctx.lineTo(452, 80); ctx.lineTo(408, 80); ctx.closePath(); fill(ctx, '#cfd6de'); stroke(ctx, 6);
  }
  // Robe.
  const robe = new Path2D('M150 445 Q150 385 205 380 L307 380 Q362 385 362 445 L402 1000 L110 1000 Z');
  ctx.fillStyle = s.robe; ctx.fill(robe);
  ctx.save(); ctx.clip(robe);
  if (s.armor) {
    ctx.fillStyle = s.skirt; ctx.fillRect(0, 700, W, 400);
    ctx.strokeStyle = 'rgba(20,20,20,0.45)'; ctx.lineWidth = 4;
    for (let y = 400; y < 700; y += 28) for (let x = 100 + ((y / 28) % 2) * 18; x < 420; x += 36) {
      ctx.beginPath(); ctx.arc(x, y, 18, 0.15 * Math.PI, 0.85 * Math.PI); ctx.stroke();
    }
    ctx.fillStyle = '#c8a33e'; ctx.fillRect(0, 690, W, 22);
  } else {
    ctx.fillStyle = 'rgba(0,0,0,0.14)'; ctx.fillRect(256, 380, 200, 700); // fold shading
    if (s.sashX) {
      ctx.fillStyle = s.sash;
      ctx.beginPath(); ctx.moveTo(170, 430); ctx.lineTo(205, 410); ctx.lineTo(360, 640); ctx.lineTo(325, 662); ctx.fill();
      ctx.beginPath(); ctx.moveTo(342, 430); ctx.lineTo(307, 410); ctx.lineTo(152, 640); ctx.lineTo(187, 662); ctx.fill();
    } else {
      ctx.fillStyle = s.sash; ctx.fillRect(0, 585, W, 38);
    }
  }
  ctx.restore();
  ctx.stroke(robe); ctx.lineWidth = 8; ctx.strokeStyle = INK; ctx.stroke(robe);
  // Collar.
  if (s.collar) {
    ctx.beginPath(); ctx.moveTo(212, 382); ctx.lineTo(256, 480); ctx.lineTo(300, 382); fill(ctx, s.collar); stroke(ctx, 7);
    ctx.beginPath(); ctx.moveTo(232, 385); ctx.lineTo(276, 455); stroke(ctx, 5);
  }
  if (s.chain) {
    ctx.beginPath(); ctx.arc(256, 400, 92, 0.2 * Math.PI, 0.8 * Math.PI); stroke(ctx, 9, '#d9a826');
    circle(ctx, 256, 492, 20); fill(ctx, '#f1c440'); stroke(ctx, 6);
  }
  // Feet.
  for (const x of [196, 316]) { ctx.beginPath(); ctx.ellipse(x, 1004, 34, 14, 0, 0, Math.PI * 2); fill(ctx, INK); }
  // Arms.
  for (const [sx, sy, cx, cy, hx, hy] of ARMS[pose] || ARMS.idle) {
    ctx.beginPath(); ctx.moveTo(sx, sy); ctx.quadraticCurveTo(cx, cy, hx, hy); stroke(ctx, 10);
    circle(ctx, hx, hy, 17); fill(ctx, SKIN); stroke(ctx, 6);
  }
}

function brows(ctx, l, r, dy) {
  for (const [a, b, c, d] of [l, r]) { ctx.beginPath(); ctx.moveTo(a, b + dy); ctx.lineTo(c, d + dy); stroke(ctx, 9); }
}

function drawFace(ctx, s, expr, mouth, blink) {
  const dy = s.browDrop || 0;
  const L = 200, R = 312, Y = 258;
  const dot = (x, r = 12) => { circle(ctx, x, Y, r); fill(ctx, INK); };
  const closed = (x, up) => { ctx.beginPath(); ctx.moveTo(x - 20, Y + (up ? 6 : -2)); ctx.quadraticCurveTo(x, Y + (up ? -16 : 12), x + 20, Y + (up ? 6 : -2)); stroke(ctx, 8); };
  const lid = (x) => { ctx.beginPath(); ctx.arc(x, Y, 13, 0, Math.PI); fill(ctx, INK); ctx.beginPath(); ctx.moveTo(x - 22, Y); ctx.lineTo(x + 22, Y); stroke(ctx, 7); };
  const mouthOpen = (w = 24, h = 18, y = 335) => { ctx.beginPath(); ctx.ellipse(256, y, w, h, 0, 0, Math.PI * 2); fill(ctx, '#5b1b1b'); stroke(ctx, 7); };
  const curve = (x1, y1, cx, cy, x2, y2, w = 8) => { ctx.beginPath(); ctx.moveTo(x1, y1); ctx.quadraticCurveTo(cx, cy, x2, y2); stroke(ctx, w); };
  const sweat = (x, y) => {
    ctx.beginPath(); ctx.moveTo(x, y - 26); ctx.quadraticCurveTo(x + 18, y, x, y + 12); ctx.quadraticCurveTo(x - 18, y, x, y - 26);
    fill(ctx, '#8fd0f2'); stroke(ctx, 5);
  };
  const eyesBlink = blink && ['neutral', 'worried', 'angry', 'sad'].includes(expr);

  switch (expr) {
    case 'laugh':
      brows(ctx, [178, 200, 222, 194], [290, 194, 334, 200], dy - 8);
      closed(L, true); closed(R, true);
      ctx.beginPath(); ctx.moveTo(200, 305); ctx.lineTo(312, 305); ctx.quadraticCurveTo(310, 392 + mouth * 10, 256, 392 + mouth * 10); ctx.quadraticCurveTo(202, 392 + mouth * 10, 200, 305);
      fill(ctx, '#5b1b1b'); stroke(ctx, 7);
      ctx.beginPath(); ctx.ellipse(256, 372 + mouth * 6, 30, 14, 0, 0, Math.PI * 2); fill(ctx, '#e8798a');
      ctx.fillStyle = '#fff'; ctx.fillRect(212, 309, 88, 16);
      break;
    case 'happy':
      brows(ctx, [178, 202, 222, 196], [290, 196, 334, 202], dy - 4);
      closed(L, true); closed(R, true);
      mouth ? mouthOpen(26, 20, 330) : curve(214, 315, 256, 356, 298, 315);
      break;
    case 'smug':
      brows(ctx, [176, 196, 222, 184], [290, 206, 334, 206], dy);
      lid(L); lid(R);
      mouth ? mouthOpen(20, 14, 332) : curve(222, 334, 278, 346, 304, 318);
      break;
    case 'bored':
      brows(ctx, [176, 214, 222, 214], [290, 214, 334, 214], dy);
      lid(L); lid(R);
      mouth ? mouthOpen(18, 10, 336) : curve(228, 338, 256, 330, 284, 338);
      break;
    case 'worried': case 'sad':
      brows(ctx, [176, 212, 224, 194], [288, 194, 336, 212], dy);
      eyesBlink ? (closed(L, false), closed(R, false)) : (dot(L), dot(R));
      mouth ? mouthOpen(18, 14, 338) : curve(226, 344, 256, 326, 286, 344);
      if (expr === 'worried') sweat(398, 200);
      break;
    case 'panic':
      brows(ctx, [174, 186, 222, 176], [290, 176, 338, 186], dy - 10);
      for (const x of [L, R]) { circle(ctx, x, Y, 32); fill(ctx, '#fff'); stroke(ctx, 7); circle(ctx, x, Y, 8); fill(ctx, INK); }
      mouthOpen(26, 30 + mouth * 8, 345);
      sweat(400, 196); sweat(116, 214);
      break;
    case 'sleep':
      brows(ctx, [178, 212, 222, 212], [290, 212, 334, 212], dy);
      closed(L, false); closed(R, false);
      circle(ctx, 256, 336, 9); fill(ctx, '#5b1b1b');
      break;
    case 'angry':
      brows(ctx, [176, 192, 224, 214], [288, 214, 336, 192], dy);
      eyesBlink ? (closed(L, false), closed(R, false)) : (dot(L), dot(R));
      mouth ? mouthOpen(22, 16, 338) : curve(224, 344, 256, 322, 288, 344);
      break;
    default: // neutral
      brows(ctx, [178, 206, 222, 202], [290, 202, 334, 206], dy);
      eyesBlink ? (closed(L, false), closed(R, false)) : (dot(L), dot(R));
      mouth ? mouthOpen(20, 15, 334) : curve(232, 334, 256, 340, 280, 334, 7);
  }
  if (s.mustache) {
    ctx.beginPath(); ctx.moveTo(256, 300); ctx.quadraticCurveTo(206, 296, 194, 344); ctx.quadraticCurveTo(214, 318, 256, 312);
    ctx.quadraticCurveTo(298, 318, 318, 344); ctx.quadraticCurveTo(306, 296, 256, 300); fill(ctx, INK);
  }
  if (s.beard) {
    ctx.beginPath(); ctx.moveTo(226, 384); ctx.lineTo(286, 384); ctx.lineTo(256, 450); ctx.closePath(); fill(ctx, '#d9d4c8'); stroke(ctx, 6);
  }
}

function drawHat(ctx, s) {
  switch (s.hat) {
    case 'scarf': {
      ctx.beginPath(); ctx.arc(256, 252, 160, Math.PI * 1.08, Math.PI * 1.92); ctx.quadraticCurveTo(256, 150, 104, 205);
      fill(ctx, '#e9832f'); stroke(ctx, 8);
      ctx.beginPath(); ctx.moveTo(150, 168); ctx.quadraticCurveTo(256, 120, 364, 168); stroke(ctx, 4, 'rgba(0,0,0,0.35)');
      for (const [x, y, a] of [[404, 196, 0.6], [420, 232, -0.3]]) { ctx.beginPath(); ctx.ellipse(x, y, 26, 15, a, 0, Math.PI * 2); fill(ctx, '#e9832f'); stroke(ctx, 6); }
      for (const x of [222, 292]) { circle(ctx, x, 132, 24); fill(ctx, '#a8dcec'); stroke(ctx, 8, '#6b4a1f'); }
      ctx.beginPath(); ctx.moveTo(246, 132); ctx.lineTo(268, 132); stroke(ctx, 7, '#6b4a1f');
      break;
    }
    case 'feather':
      ctx.beginPath(); ctx.moveTo(318, 92); ctx.bezierCurveTo(380, 0, 470, 10, 500, 40); ctx.bezierCurveTo(450, 40, 400, 70, 350, 112);
      fill(ctx, '#fbfaf5'); stroke(ctx, 6);
      ctx.beginPath(); ctx.roundRect(166, 26, 180, 104, 30); fill(ctx, '#b0262a'); stroke(ctx, 8);
      ctx.fillStyle = '#e2b13c'; ctx.fillRect(170, 96, 172, 18); ctx.strokeRect(170, 96, 172, 18);
      ctx.beginPath(); ctx.ellipse(256, 130, 214, 34, 0, 0, Math.PI * 2); fill(ctx, '#b0262a'); stroke(ctx, 8);
      break;
    case 'helmet':
      ctx.beginPath(); ctx.moveTo(250, 64); ctx.quadraticCurveTo(170, 0, 120, 40); ctx.quadraticCurveTo(190, 30, 238, 84); fill(ctx, '#d23b30'); stroke(ctx, 6);
      ctx.beginPath(); ctx.arc(256, 214, 160, Math.PI, 0); ctx.closePath(); fill(ctx, '#a9b1bb'); stroke(ctx, 8);
      ctx.beginPath(); ctx.roundRect(88, 196, 336, 26, 10); fill(ctx, '#c8a33e'); stroke(ctx, 7);
      break;
    case 'cone':
      ctx.beginPath(); ctx.moveTo(176, 152); ctx.lineTo(256, 4); ctx.lineTo(336, 152); ctx.closePath(); fill(ctx, s.hatColor); stroke(ctx, 8);
      ctx.beginPath(); ctx.ellipse(256, 152, 112, 22, 0, 0, Math.PI * 2); fill(ctx, s.hatColor); stroke(ctx, 7);
      break;
  }
}

export function drawCharacter(specName, { expr = 'neutral', mouth = 0, pose = 'idle', blink = 0 } = {}) {
  const s = SPECS[specName];
  const c = document.createElement('canvas'); c.width = W; c.height = H;
  const ctx = c.getContext('2d');
  drawBody(ctx, s, pose);
  circle(ctx, 256, 252, 152); fill(ctx, SKIN); stroke(ctx, 9);
  drawFace(ctx, s, expr, mouth, blink);
  drawHat(ctx, s);
  return c;
}

const texCache = new Map();
function texFor(spec, st) {
  const key = `${spec}|${st.expr}|${st.mouth}|${st.pose}|${st.blink}`;
  let t = texCache.get(key);
  if (!t) {
    t = new THREE.CanvasTexture(drawCharacter(spec, st));
    t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
    texCache.set(key, t);
  }
  return t;
}

export class Character {
  constructor(spec, { height = 2.2, pos = [0, 0, 0] } = {}) {
    this.spec = spec;
    this.state = { expr: 'neutral', mouth: 0, pose: 'idle', blink: 0 };
    this.talking = false; this.bounce = 0; this.run = false; this.shake = 0;
    const geo = new THREE.PlaneGeometry(height / 2, height); geo.translate(0, height / 2, 0);
    const map = texFor(spec, this.state);
    this.mat = new THREE.MeshLambertMaterial({ map, emissive: 0xffffff, emissiveMap: map, emissiveIntensity: 0.6, alphaTest: 0.5, side: THREE.DoubleSide });
    this.mesh = new THREE.Mesh(geo, this.mat);
    this.mesh.castShadow = true;
    this.mesh.customDepthMaterial = new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking, map, alphaTest: 0.5 });
    this.group = new THREE.Group(); this.group.add(this.mesh);
    this.group.position.set(...pos);
    this.seed = Math.random() * 10;
  }
  set(o) { Object.assign(this, o); return this; }
  setState(o) { Object.assign(this.state, o); return this; }
  update(t, camera) {
    const st = { ...this.state };
    if (this.talking) st.mouth = (Math.floor(t * 8.5 + this.seed) % 3 === 0) ? 0 : 1;
    if (this.state.expr === 'laugh') st.mouth = Math.floor(t * 7 + this.seed) % 2;
    st.blink = ((t + this.seed) % 3.1) < 0.12 ? 1 : 0;
    const map = texFor(this.spec, st);
    if (this.mat.map !== map) { this.mat.map = map; this.mat.emissiveMap = map; this.mesh.customDepthMaterial.map = map; }
    // Face the camera (yaw only), with a little life.
    const p = this.group.getWorldPosition(new THREE.Vector3());
    this.mesh.rotation.y = Math.atan2(camera.position.x - p.x, camera.position.z - p.z);
    let hop = 0, sq = 1;
    if (this.state.expr === 'laugh') { hop = Math.abs(Math.sin((t + this.seed) * 11)) * 0.12; sq = 1 + Math.sin((t + this.seed) * 22) * 0.03; }
    if (this.run) { hop = Math.abs(Math.sin(t * 14)) * 0.18; }
    const breathe = 1 + Math.sin((t + this.seed) * 2.4) * 0.012;
    this.mesh.position.y = hop;
    this.mesh.scale.set(1 / Math.sqrt(sq * breathe), sq * breathe, 1);
    this.mesh.position.x = this.shake ? Math.sin(t * 60) * 0.03 * this.shake : 0;
    this.mesh.rotation.z = this.run ? Math.sin(t * 14) * 0.06 : (this.state.expr === 'laugh' ? Math.sin((t + this.seed) * 5) * 0.05 : 0);
  }
}

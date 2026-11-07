// Painterly-ish 3D sets built from primitives + canvas textures.
import * as THREE from 'three';
import { Puppet } from './puppet.js';

// ---------- deterministic randomness ----------
let _s = 1337;
export const rnd = () => { _s |= 0; _s = (_s + 0x6D2B79F5) | 0; let t = Math.imul(_s ^ (_s >>> 15), 1 | _s); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
const R = (a, b) => a + (b - a) * rnd();

// ---------- texture helpers ----------
function canvasTex(w, h, draw, repeat) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
  if (repeat) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(...repeat); }
  return t;
}
function speckle(ctx, w, h, n, cols, rmax = 3) { for (let i = 0; i < n; i++) { ctx.fillStyle = cols[i % cols.length]; ctx.globalAlpha = R(0.15, 0.5); ctx.beginPath(); ctx.arc(R(0, w), R(0, h), R(0.5, rmax), 0, 7); ctx.fill(); } ctx.globalAlpha = 1; }

const TEX = {};
function stoneTex(rep = [4, 4], base = '#9b958c') {
  return canvasTex(512, 512, (ctx, w, h) => {
    ctx.fillStyle = base; ctx.fillRect(0, 0, w, h);
    const bh = 64;
    for (let y = 0; y < h; y += bh) for (let x = -((y / bh) % 2) * 64; x < w; x += 128) {
      const l = R(-14, 14); ctx.fillStyle = `hsl(35, 8%, ${58 + l}%)`; ctx.fillRect(x + 3, y + 3, 122, bh - 6);
    }
    ctx.strokeStyle = 'rgba(40,30,25,0.55)'; ctx.lineWidth = 5;
    for (let y = 0; y < h; y += bh) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke(); for (let x = -((y / bh) % 2) * 64; x < w; x += 128) { ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y + bh); ctx.stroke(); } }
    speckle(ctx, w, h, 900, ['#5d554c', '#d8d2c6'], 2.5);
  }, rep);
}
function grassTex() {
  return canvasTex(512, 512, (ctx, w, h) => {
    ctx.fillStyle = '#5a9238'; ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 60; i++) { ctx.fillStyle = `hsla(${R(75, 105)}, 45%, ${R(35, 55)}%, 0.35)`; ctx.beginPath(); ctx.ellipse(R(0, w), R(0, h), R(20, 90), R(10, 50), R(0, 3), 0, 7); ctx.fill(); }
    speckle(ctx, w, h, 2500, ['#4c7d32', '#9cc767', '#3d6a28'], 2);
  }, [120, 120]);
}
function fieldTex() { // patchwork farmland seen from afar
  return canvasTex(1024, 1024, (ctx, w, h) => {
    ctx.fillStyle = '#7aa850'; ctx.fillRect(0, 0, w, h);
    const cols = ['#8fbf5a', '#c9b45a', '#6b9a3f', '#a7c46a', '#d6c27a', '#5f8d3a'];
    for (let i = 0; i < 140; i++) { ctx.fillStyle = cols[i % cols.length]; ctx.globalAlpha = 0.7; ctx.save(); ctx.translate(R(0, w), R(0, h)); ctx.rotate(R(-0.3, 0.3)); ctx.fillRect(-R(30, 80), -R(20, 60), R(60, 160), R(40, 120)); ctx.restore(); }
    ctx.globalAlpha = 1; speckle(ctx, w, h, 3000, ['#3f6b2a', '#b5d27e'], 2);
  }, [10, 10]);
}
function bannerTex(bg = '#b8282c') {
  return canvasTex(256, 512, (ctx, w, h) => {
    ctx.fillStyle = bg; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(w, 0); ctx.lineTo(w, h); ctx.lineTo(w / 2, h - 70); ctx.lineTo(0, h); ctx.fill();
    ctx.strokeStyle = '#e6b53c'; ctx.lineWidth = 10; ctx.strokeRect(14, 14, w - 28, h - 120);
    // golden bell emblem
    ctx.fillStyle = '#f0c443'; ctx.beginPath(); ctx.moveTo(128, 150); ctx.quadraticCurveTo(80, 160, 82, 250); ctx.lineTo(62, 300); ctx.lineTo(194, 300); ctx.lineTo(174, 250); ctx.quadraticCurveTo(176, 160, 128, 150); ctx.fill();
    ctx.beginPath(); ctx.arc(128, 315, 16, 0, 7); ctx.fill();
  });
}
function carpetTex() {
  return canvasTex(256, 1024, (ctx, w, h) => {
    ctx.fillStyle = '#1f3a7a'; ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#b8282c'; ctx.fillRect(0, 0, 26, h); ctx.fillRect(w - 26, 0, 26, h);
    ctx.fillStyle = '#e6b53c'; ctx.fillRect(26, 0, 8, h); ctx.fillRect(w - 34, 0, 8, h);
    for (let y = 60; y < h; y += 160) { ctx.save(); ctx.translate(w / 2, y); ctx.rotate(Math.PI / 4); ctx.fillStyle = '#b8282c'; ctx.fillRect(-34, -34, 68, 68); ctx.fillStyle = '#e6b53c'; ctx.fillRect(-14, -14, 28, 28); ctx.restore(); }
  }, [1, 3]);
}
function roseTex() {
  return canvasTex(512, 512, (ctx) => {
    const cols = ['#e04848', '#3a6fd8', '#f0c443', '#4bb36a', '#9a4fd0'];
    ctx.fillStyle = '#2b2018'; ctx.beginPath(); ctx.arc(256, 256, 250, 0, 7); ctx.fill();
    for (let ring = 0; ring < 3; ring++) for (let i = 0; i < 12; i++) {
      const a0 = (i / 12) * Math.PI * 2, a1 = a0 + Math.PI * 2 / 12 - 0.06, r0 = 40 + ring * 70, r1 = r0 + 62;
      ctx.fillStyle = cols[(i + ring) % cols.length]; ctx.beginPath(); ctx.arc(256, 256, r1, a0, a1); ctx.arc(256, 256, r0, a1, a0, true); ctx.fill();
    }
    ctx.fillStyle = '#f0c443'; ctx.beginPath(); ctx.arc(256, 256, 34, 0, 7); ctx.fill();
  });
}
function glowTex(inner = 'rgba(255,220,150,1)') {
  return canvasTex(128, 128, (ctx) => { const g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64); g.addColorStop(0, inner); g.addColorStop(0.25, inner.replace(/[\d.]+\)$/, '0.45)')); g.addColorStop(1, 'rgba(0,0,0,0)'); ctx.fillStyle = g; ctx.fillRect(0, 0, 128, 128); });
}
function skyTex(stops) {
  return canvasTex(16, 512, (ctx, w, h) => { const g = ctx.createLinearGradient(0, 0, 0, h); stops.forEach(([o, c]) => g.addColorStop(o, c)); ctx.fillStyle = g; ctx.fillRect(0, 0, w, h); });
}
function waterTex() {
  return canvasTex(256, 256, (ctx, w, h) => {
    ctx.fillStyle = '#3f86b8'; ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 90; i++) { ctx.strokeStyle = `rgba(220,240,255,${R(0.15, 0.45)})`; ctx.lineWidth = R(1, 3); const x = R(0, w), y = R(0, h), l = R(10, 40); ctx.beginPath(); ctx.moveTo(x, y); ctx.quadraticCurveTo(x + l / 2, y - 3, x + l, y); ctx.stroke(); }
  }, [3, 40]);
}
function strataTex() {
  return canvasTex(1024, 1024, (ctx, w, h) => {
    const bands = [['#6b8f3c', 40], ['#7a5232', 120], ['#a8723f', 150], ['#c9925a', 110], ['#8a6a50', 160], ['#6d5a6a', 180], ['#4f4560', 264]];
    let y = 0; for (const [c, bh] of bands) { ctx.fillStyle = c; ctx.beginPath(); ctx.moveTo(0, y); for (let x = 0; x <= w; x += 32) ctx.lineTo(x, y + Math.sin(x * 0.02 + y) * 6); ctx.lineTo(w, h); ctx.lineTo(0, h); ctx.fill(); y += bh; }
    speckle(ctx, w, h, 1800, ['#3b2a20', '#e2c9a0', '#2d2238'], 4);
    for (let i = 0; i < 40; i++) { ctx.fillStyle = 'rgba(60,50,45,0.6)'; ctx.beginPath(); ctx.ellipse(R(0, w), R(200, h), R(8, 22), R(5, 12), R(0, 3), 0, 7); ctx.fill(); }
  });
}

// ---------- materials ----------
const M = {};
function mats() {
  if (M.ready) return M;
  M.bronze = new THREE.MeshStandardMaterial({ color: 0xc8913f, metalness: 1, roughness: 0.3 });
  M.copper = new THREE.MeshStandardMaterial({ color: 0xd07a4a, metalness: 1, roughness: 0.28 });
  M.gold = new THREE.MeshStandardMaterial({ color: 0xe6b53c, metalness: 1, roughness: 0.25 });
  M.wood = new THREE.MeshStandardMaterial({ color: 0x8a5a30, roughness: 0.5 });
  M.darkwood = new THREE.MeshStandardMaterial({ color: 0x5a3822, roughness: 0.55 });
  M.iron = new THREE.MeshStandardMaterial({ color: 0x3a3a40, metalness: 0.7, roughness: 0.5 });
  M.stone = new THREE.MeshStandardMaterial({ map: stoneTex([3, 1]), roughness: 0.62 });
  M.stoneWall = new THREE.MeshStandardMaterial({ map: stoneTex([6, 2], '#b0a796'), roughness: 0.68 });
  M.red = new THREE.MeshStandardMaterial({ color: 0xa8232a, roughness: 0.7 });
  M.velvet = new THREE.MeshStandardMaterial({ color: 0xc8202a, roughness: 0.6 });
  M.cloth = new THREE.MeshStandardMaterial({ color: 0xf3ecdc, roughness: 0.9 });
  M.ready = true; return M;
}

// =====================================================================
// Bell rig: frame + bell + hammer + well + float + chain, with ring animation
// =====================================================================
export function makeBellRig({ well = true } = {}) {
  const m = mats();
  const g = new THREE.Group();
  const box = (w, h, d, mat, x, y, z) => { const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat); b.position.set(x, y, z); b.castShadow = b.receiveShadow = true; g.add(b); return b; };
  box(0.22, 4.6, 0.22, m.wood, -1.35, 2.3, 0); box(0.22, 4.6, 0.22, m.wood, 1.35, 2.3, 0);
  box(3.2, 0.26, 0.3, m.wood, 0, 4.5, 0);
  // little roof
  const roof = new THREE.Mesh(new THREE.ConeGeometry(2.4, 1.0, 4, 1), new THREE.MeshStandardMaterial({ color: 0x9c3b2a, roughness: 0.8 }));
  roof.position.set(0, 5.1, 0); roof.rotation.y = Math.PI / 4; roof.scale.set(1, 1, 0.45); roof.castShadow = true; g.add(roof);
  // bell on a pivot
  const pivot = new THREE.Group(); pivot.position.set(0, 4.36, 0); g.add(pivot);
  const prof = [[0.001, 0], [0.16, 0], [0.24, -0.06], [0.3, -0.25], [0.33, -0.55], [0.38, -0.8], [0.5, -1.02], [0.6, -1.12], [0.58, -1.16], [0.001, -1.16]].map(([r, y]) => new THREE.Vector2(r, y));
  const bell = new THREE.Mesh(new THREE.LatheGeometry(prof, 48), m.bronze); bell.castShadow = true; pivot.add(bell);
  for (const [y, r] of [[-0.3, 0.31], [-0.95, 0.47], [-1.1, 0.585]]) { const band = new THREE.Mesh(new THREE.TorusGeometry(r, 0.025, 8, 48), m.gold); band.rotation.x = Math.PI / 2; band.position.y = y; pivot.add(band); }
  const crown = new THREE.Mesh(new THREE.TorusGeometry(0.1, 0.035, 8, 20), m.bronze); crown.position.y = 0.02; pivot.add(crown);
  // hammer on right post
  const hp = new THREE.Group(); hp.position.set(1.24, 3.75, 0); g.add(hp);
  const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 1.1), m.darkwood); arm.rotation.z = Math.PI / 2; arm.position.x = -0.42; hp.add(arm);
  const head = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.13, 0.32, 16), m.darkwood); head.position.x = -0.62; head.castShadow = true; hp.add(head);
  const tail = new THREE.Mesh(new THREE.SphereGeometry(0.08), m.iron); tail.position.x = 0.12; hp.add(tail);
  // ring waves
  const waveMat = () => new THREE.MeshBasicMaterial({ color: 0xffe7a8, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide });
  const waves = [0, 1, 2, 3].map(() => { const w = new THREE.Mesh(new THREE.RingGeometry(0.95, 1, 64), waveMat()); w.position.set(0, 3.7, 0); g.add(w); return w; });
  let wellParts = null;
  if (well) {
    const wellG = new THREE.Group(); g.add(wellG);
    const outer = new THREE.Mesh(new THREE.CylinderGeometry(0.95, 1.0, 0.9, 32, 1, true), m.stone); outer.position.y = 0.45; outer.castShadow = outer.receiveShadow = true; wellG.add(outer);
    const inner = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 0.8, 0.9, 32, 1, true), new THREE.MeshStandardMaterial({ color: 0x3b3530, side: THREE.BackSide })); inner.position.y = 0.45; wellG.add(inner);
    const rim = new THREE.Mesh(new THREE.TorusGeometry(0.88, 0.1, 10, 40), m.stone); rim.rotation.x = Math.PI / 2; rim.position.y = 0.9; wellG.add(rim);
    const water = new THREE.Mesh(new THREE.CircleGeometry(0.8, 32), new THREE.MeshStandardMaterial({ color: 0x24506e, roughness: 0.1, metalness: 0.2 })); water.rotation.x = -Math.PI / 2; water.position.y = 0.5; wellG.add(water);
    const flt = new THREE.Mesh(new THREE.SphereGeometry(0.22, 24, 16), m.copper); flt.position.set(0.25, 0.6, 0); wellG.add(flt);
    const chain = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 1, 6), m.iron); g.add(chain);
    wellParts = { water, flt, chain };
  }
  const rig = {
    group: g, pivot, hammer: hp, waves, wellParts, strikes: [], continuous: null,
    setStrikes(list) { this.strikes = list; this.continuous = null; },
    setContinuous(t0, period = 0.3) { this.continuous = { t0, period }; },
    update(t, camera) {
      let times = [...this.strikes];
      if (this.continuous && t >= this.continuous.t0) { for (let s = this.continuous.t0; s <= t; s += this.continuous.period) times.push(s); }
      const past = times.filter((s) => s <= t);
      const last = past.length ? past[past.length - 1] : -99;
      const next = times.find((s) => s > t);
      // hammer: wind up before strike, snap on hit, recoil after
      let ang = 0.55;
      if (next !== undefined && next - t < 0.12) ang = 0.55 + (1 - (next - t) / 0.12) * -0.55;
      const a = t - last; if (a < 0.2) ang = Math.min(ang, (a / 0.2) * 0.55);
      if (next === undefined && a < 0.2) ang = (a / 0.2) * 0.55;
      hp.rotation.z = -ang;
      // bell sway: sum of damped responses
      let sway = 0; for (const s of past.slice(-6)) { const d = t - s; sway += Math.sin(d * 9) * Math.exp(-d * 1.6) * 0.09; }
      pivot.rotation.z = Math.max(-0.35, Math.min(0.35, sway));
      pivot.position.x = 0;
      waves.forEach((w, k) => {
        const s0 = past[past.length - 1 - k]; const age = s0 === undefined ? 99 : t - s0; const life = 0.95;
        if (age >= 0 && age < life) { const s = 1 + age * 2.4; w.scale.set(s, s, s); w.material.opacity = Math.pow(1 - age / life, 1.5) * 0.3; } else w.material.opacity = 0;
        w.lookAt(camera.position);
      });
      if (this.wellParts) {
        const { flt, chain } = this.wellParts;
        const tp = hp.localToWorld(new THREE.Vector3(0.12, 0, 0)); g.worldToLocal(tp);
        const fp = flt.position.clone(); fp.y += 0.2;
        const mid = tp.clone().add(fp).multiplyScalar(0.5);
        chain.position.copy(mid); chain.scale.set(1, tp.distanceTo(fp), 1);
        chain.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), tp.clone().sub(fp).normalize());
      }
    },
  };
  return rig;
}

function makeCart(withBell = true) {
  const m = mats(); const g = new THREE.Group();
  const bed = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.15, 1.1), m.wood); bed.position.y = 0.55; bed.castShadow = true; g.add(bed);
  for (const z of [-0.6, 0.6]) { const w = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.08, 20), m.darkwood); w.rotation.x = Math.PI / 2; w.position.set(0, 0.42, z); w.castShadow = true; g.add(w); g.userData.wheels = (g.userData.wheels || []).concat(w); }
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.9), m.wood); pole.rotation.z = Math.PI / 2 - 0.3; pole.position.set(1.15, 0.72, 0); g.add(pole); g.userData.tip = new THREE.Vector3(1.58, 0.86, 0);
  if (withBell) {
    const prof = [[0.001, 0], [0.16, 0], [0.24, -0.06], [0.3, -0.25], [0.33, -0.55], [0.38, -0.8], [0.5, -1.02], [0.6, -1.12], [0.001, -1.12]].map(([r, y]) => new THREE.Vector2(r, y));
    const bell = new THREE.Mesh(new THREE.LatheGeometry(prof, 40), m.bronze); bell.position.y = 0.62 + 1.12; bell.castShadow = true; g.add(bell);
  }
  return g;
}

// =====================================================================
// HALL (interior)
// =====================================================================
export function buildHall() {
  const m = mats();
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x1d1410);
  scene.fog = new THREE.Fog(0x3a2418, 18, 60);
  const add = (o) => { scene.add(o); return o; };
  const floor = add(new THREE.Mesh(new THREE.PlaneGeometry(30, 50), new THREE.MeshStandardMaterial({ map: stoneTex([8, 14], '#8a7f72'), roughness: 0.2, metalness: 0.05 })));
  floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; floor.userData.noCollide = true;
  const carpet = add(new THREE.Mesh(new THREE.PlaneGeometry(3.4, 30), new THREE.MeshStandardMaterial({ map: carpetTex(), roughness: 0.95 })));
  carpet.rotation.x = -Math.PI / 2; carpet.position.set(0, 0.01, -2); carpet.receiveShadow = true; carpet.userData.noCollide = true;
  // walls
  const wallMat = new THREE.MeshStandardMaterial({ map: stoneTex([5, 3], '#a39684'), roughness: 0.7 });
  const back = add(new THREE.Mesh(new THREE.PlaneGeometry(30, 16), wallMat)); back.position.set(0, 8, -17);
  for (const s of [-1, 1]) { const w = add(new THREE.Mesh(new THREE.PlaneGeometry(50, 16), wallMat)); w.rotation.y = -s * Math.PI / 2; w.position.set(s * 12, 8, 0); }
  // rose window
  const rose = add(new THREE.Mesh(new THREE.CircleGeometry(2.4, 48), new THREE.MeshBasicMaterial({ map: roseTex() }))); rose.position.set(0, 10.5, -16.9);
  const roseGlow = add(new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex('rgba(255,200,140,1)'), blending: THREE.AdditiveBlending, opacity: 0.5, depthWrite: false }))); roseGlow.position.set(0, 10.5, -16.5); roseGlow.scale.set(9, 9, 1);
  // columns + arches along both sides
  for (const s of [-1, 1]) for (let i = 0; i < 6; i++) {
    const z = -14 + i * 5.5;
    const col = add(new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.65, 12, 16), m.stone)); col.position.set(s * 7, 6, z); col.castShadow = col.receiveShadow = true;
    const cap = add(new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.5, 1.6), m.stone)); cap.position.set(s * 7, 12.1, z);
    if (i < 5) { const arch = add(new THREE.Mesh(new THREE.TorusGeometry(2.75, 0.35, 8, 24, Math.PI), m.stone)); arch.rotation.y = Math.PI / 2; arch.position.set(s * 7, 12.3, z + 2.75); }
    // tall windows on side walls with light
    if (i % 2 === 0) {
      const win = add(new THREE.Mesh(new THREE.PlaneGeometry(1.6, 4.2), new THREE.MeshBasicMaterial({ color: 0xffe2a8 }))); win.rotation.y = -s * Math.PI / 2; win.position.set(s * 11.95, 8.5, z + 2.7);
    }
    // banners
    if (i % 2 === 1) { const b = add(new THREE.Mesh(new THREE.PlaneGeometry(1.6, 3.6), new THREE.MeshStandardMaterial({ map: bannerTex(), side: THREE.DoubleSide, transparent: true, alphaTest: 0.3 }))); b.rotation.y = -s * Math.PI / 2; b.position.set(s * 11.9, 7.5, z); }
  }
  // god rays from side windows
  const rayMat = new THREE.MeshBasicMaterial({ map: canvasTex(64, 256, (ctx, w, h) => { const g = ctx.createLinearGradient(0, 0, 0, h); g.addColorStop(0, 'rgba(255,214,150,0.55)'); g.addColorStop(1, 'rgba(255,214,150,0)'); ctx.fillStyle = g; ctx.fillRect(0, 0, w, h); }), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide });
  for (const z of [-11.3, -0.3]) for (const s of [-1, 1]) { const ray = add(new THREE.Mesh(new THREE.PlaneGeometry(2.2, 14), rayMat)); ray.position.set(s * 7.5, 5.5, z); ray.rotation.set(0, Math.PI / 2, s * 0.75); }
  // curtains behind throne
  const curtTex = canvasTex(512, 512, (ctx, w, h) => { for (let x = 0; x < w; x += 32) { const g = ctx.createLinearGradient(x, 0, x + 32, 0); g.addColorStop(0, '#6e1016'); g.addColorStop(0.5, '#c22a30'); g.addColorStop(1, '#6e1016'); ctx.fillStyle = g; ctx.fillRect(x, 0, 32, h); } ctx.fillStyle = '#e6b53c'; ctx.fillRect(0, h - 26, w, 14); });
  const curt = add(new THREE.Mesh(new THREE.PlaneGeometry(9, 9), new THREE.MeshStandardMaterial({ map: curtTex, roughness: 0.9 }))); curt.position.set(0, 4.5, -16.8);
  // dais + throne
  const dais = add(new THREE.Mesh(new THREE.BoxGeometry(7, 0.5, 4), m.stone)); dais.position.set(0, 0.25, -14.5); dais.receiveShadow = true;
  const dcarpet = add(new THREE.Mesh(new THREE.BoxGeometry(3.4, 0.52, 4), new THREE.MeshStandardMaterial({ color: 0x1f3a7a }))); dcarpet.position.set(0, 0.26, -14.5);
  const throne = new THREE.Group(); throne.position.set(0, 0.5, -15.4); add(throne);
  const tb = (w, h, d, mat, x, y, z) => { const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat); b.position.set(x, y, z); b.castShadow = true; throne.add(b); return b; };
  tb(2.2, 0.9, 1.4, m.gold, 0, 0.45, 0.3); tb(1.9, 0.25, 1.2, m.velvet, 0, 1.0, 0.35);
  tb(2.2, 4.4, 0.3, m.gold, 0, 2.2, -0.4); tb(1.7, 3.4, 0.32, m.velvet, 0, 2.3, -0.37);
  for (const s of [-1, 1]) { tb(0.3, 1.6, 1.4, m.gold, s * 1.1, 0.8, 0.3); const fin = new THREE.Mesh(new THREE.ConeGeometry(0.18, 0.7, 8), m.gold); fin.position.set(s * 1.0, 4.75, -0.4); throne.add(fin); }
  const crest = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.1, 6), m.bronze); crest.rotation.x = Math.PI / 2; crest.position.set(0, 3.5, -0.2); throne.add(crest);
  // candelabras with real lights
  const glow = glowTex('rgba(255,190,110,1)');
  const flames = [];
  for (const [x, z] of [[-3.4, -13.6], [3.4, -13.6], [-4.8, -4], [4.8, -4]]) {
    const st = add(new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.25, 2.4, 8), m.gold)); st.position.set(x, 1.2, z);
    for (const dx of [-0.3, 0, 0.3]) {
      const c = add(new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.35, 8), m.cloth)); c.position.set(x + dx, 2.55, z);
      const f = add(new THREE.Sprite(new THREE.SpriteMaterial({ map: glow, blending: THREE.AdditiveBlending, depthWrite: false }))); f.position.set(x + dx, 2.82, z); f.scale.set(0.9, 1.1, 1); flames.push(f);
    }
    const pl = add(new THREE.PointLight(0xff9a50, 16, 18, 1.5)); pl.position.set(x, 3.1, z);
  }
  // banquet table (feast)
  const feast = new THREE.Group(); feast.visible = false; add(feast);
  const top = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.15, 14), m.cloth); top.position.set(0, 1.05, -4); top.castShadow = top.receiveShadow = true; feast.add(top);
  const skirt = new THREE.Mesh(new THREE.BoxGeometry(2.0, 1.0, 13.6), m.velvet); skirt.position.set(0, 0.5, -4); feast.add(skirt);
  for (let i = 0; i < 9; i++) {
    const z = -10 + i * 1.5;
    const gob = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.05, 0.3, 10), m.gold); gob.position.set(R(-0.7, 0.7), 1.27, z); feast.add(gob);
    const food = new THREE.Mesh(new THREE.SphereGeometry(R(0.18, 0.3), 12, 8), new THREE.MeshStandardMaterial({ color: [0xc9752f, 0xd9a440, 0x9c3b2a][i % 3], roughness: 0.6 })); food.scale.y = 0.6; food.position.set(R(-0.5, 0.5), 1.22, z + 0.6); feast.add(food);
    const cand = new THREE.Sprite(new THREE.SpriteMaterial({ map: glow, blending: THREE.AdditiveBlending, depthWrite: false })); cand.position.set(0, 1.6, z); cand.scale.set(0.8, 1, 1); feast.add(cand); flames.push(cand);
  }
  // dust motes
  const dg = new THREE.BufferGeometry(); const dp = []; for (let i = 0; i < 500; i++) dp.push(R(-9, 9), R(0.5, 10), R(-16, 8)); dg.setAttribute('position', new THREE.Float32BufferAttribute(dp, 3));
  const dust = add(new THREE.Points(dg, new THREE.PointsMaterial({ map: glow, size: 0.12, transparent: true, opacity: 0.7, blending: THREE.AdditiveBlending, depthWrite: false })));
  // lights
  add(new THREE.HemisphereLight(0xffc890, 0x2a160c, 0.75));
  const sun = add(new THREE.DirectionalLight(0xffcf90, 1.5)); sun.position.set(-10, 14, 6); sun.target.position.set(0, 0, -8); add(sun.target);
  sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048); Object.assign(sun.shadow.camera, { left: -14, right: 14, top: 14, bottom: -14, near: 1, far: 50 }); sun.shadow.bias = -0.0005;

  // cast
  const cast = {
    duke: new Puppet('duke', { seedOffset: 1 }),
    g1: new Puppet('guard', { seedOffset: 2 }), g2: new Puppet('guard', { seedOffset: 3 }),
    c1: new Puppet('councilA', { seedOffset: 4 }), c2: new Puppet('councilB', { seedOffset: 5 }),
    c3: new Puppet('councilA', { seedOffset: 6, H: 2.0 }), c4: new Puppet('councilB', { seedOffset: 7 }),
  };
  Object.values(cast).forEach((c) => add(c.root));
  return {
    scene, cast, feast,
    update(t, cam) {
      flames.forEach((f, i) => { const k = 1 + Math.sin(t * 13 + i * 1.7) * 0.08 + Math.sin(t * 29 + i) * 0.05; f.scale.set(0.85 * k, 1.1 * k, 1); });
      dust.rotation.y = t * 0.01; dust.position.y = Math.sin(t * 0.4) * 0.2;
      Object.values(cast).forEach((c) => { if (c.root.visible) c.update(t, cam); });
    },
  };
}

// =====================================================================
// WORLD (river valley: city, walls, river, mountains)
// =====================================================================
export const MOUNT = new THREE.Vector3(2.5, 0, -150); // where she lives later (west bank, clear of the river)

export function buildWorld() {
  const m = mats();
  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0xcfe3f2, 60, 520);
  const add = (o, p = scene) => { p.add(o); return o; };
  const shadowy = (o) => { o.castShadow = o.receiveShadow = true; return o; };

  // sky dome
  const skyMat = new THREE.MeshBasicMaterial({ side: THREE.BackSide, fog: false, depthWrite: false });
  const sky = add(new THREE.Mesh(new THREE.SphereGeometry(1400, 32, 16), skyMat)); sky.userData.noCollide = true;
  const skies = {
    day: skyTex([[0, '#4f9be0'], [0.42, '#a9d4f2'], [0.5, '#e6f2f8'], [1, '#e6f2f8']]),
    sunset: skyTex([[0, '#2a2560'], [0.3, '#8a4a8a'], [0.44, '#ff8f5a'], [0.5, '#ffd08a'], [1, '#ffd08a']]),
    night: skyTex([[0, '#070b2a'], [0.35, '#16246a'], [0.5, '#3c4f9a'], [1, '#3c4f9a']]),
    morning: skyTex([[0, '#c9b9c8'], [0.4, '#f2d2b8'], [0.5, '#fbe6cf'], [1, '#fbe6cf']]),
  };
  // ground
  const ground = add(new THREE.Mesh(new THREE.PlaneGeometry(3000, 3000), new THREE.MeshStandardMaterial({ map: grassTex(), roughness: 0.85 })));
  ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; ground.userData.noCollide = true;


  // river ribbon along a curve
  const curve = new THREE.CatmullRomCurve3([[10, 0, 120], [10, 0, 40], [10, 0, 0], [10, 0, -40], [16, 0, -80], [8, 0, -120], [12, 0, -150], [24, 0, -200], [10, 0, -280], [0, 0, -400]].map((p) => new THREE.Vector3(...p)));
  const pts = curve.getSpacedPoints(300); const pos = [], uv = [], idx = [];
  pts.forEach((p, i) => {
    const tan = curve.getTangentAt(i / 300); const nrm = new THREE.Vector3(-tan.z, 0, tan.x).normalize();
    const w = 3.6 + Math.sin(i * 0.2) * 0.3;
    pos.push(p.x + nrm.x * w, 0.05, p.z + nrm.z * w, p.x - nrm.x * w, 0.05, p.z - nrm.z * w);
    uv.push(0, i / 8, 1, i / 8);
    if (i < 300) idx.push(i * 2, i * 2 + 1, i * 2 + 2, i * 2 + 1, i * 2 + 3, i * 2 + 2);
  });
  const rg = new THREE.BufferGeometry(); rg.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); rg.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); rg.setIndex(idx); rg.computeVertexNormals();
  const wtex = waterTex(); wtex.repeat.set(1, 1);
  const riverMat = new THREE.MeshStandardMaterial({ map: wtex, color: 0x8cc8f0, roughness: 0.04, metalness: 0.15, side: THREE.DoubleSide });
  const river = add(new THREE.Mesh(rg, riverMat)); river.receiveShadow = true; river.userData.noCollide = true; river.position.y = 0.03;
  // sandy banks
  const bankPos = pos.map((v, i) => (i % 3 === 1 ? 0.03 : v));
  const bank = new THREE.BufferGeometry(); bank.setAttribute('position', new THREE.Float32BufferAttribute(bankPos, 3)); bank.setIndex(idx);
  const bankMesh = add(new THREE.Mesh(bank, new THREE.MeshStandardMaterial({ color: 0xc9b07a, roughness: 1, side: THREE.DoubleSide }))); bankMesh.scale.set(1, 1, 1);
  bankMesh.position.y = -0.01; bankMesh.userData.noCollide = true; bankMesh.geometry = rg.clone(); bankMesh.scale.set(1.0, 1, 1);
  { // widen bank by offsetting each pair outward
    const p = bankMesh.geometry.attributes.position; for (let i = 0; i < p.count; i += 2) { const ax = p.getX(i), az = p.getZ(i), bx = p.getX(i + 1), bz = p.getZ(i + 1); const cx = (ax + bx) / 2, cz = (az + bz) / 2; p.setXYZ(i, cx + (ax - cx) * 1.35, 0.02, cz + (az - cz) * 1.35); p.setXYZ(i + 1, cx + (bx - cx) * 1.35, 0.02, cz + (bz - cz) * 1.35); }
  }

  // city: walls rectangle x[-26,2] z[-18,18]
  const city = add(new THREE.Group());
  const wallH = 8;
  const wallSeg = (x1, z1, x2, z2) => {
    const len = Math.hypot(x2 - x1, z2 - z1); const w = shadowy(new THREE.Mesh(new THREE.BoxGeometry(len, wallH, 1.6), m.stoneWall));
    w.position.set((x1 + x2) / 2, wallH / 2, (z1 + z2) / 2); w.rotation.y = -Math.atan2(z2 - z1, x2 - x1); city.add(w);
    const n = Math.floor(len / 1.2);
    for (let i = 0; i < n; i++) { if (i % 2) continue; const f = (i + 0.5) / n; for (const side of [-1, 1]) { const c = shadowy(new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.8, 0.28), m.stoneWall)); c.position.set(x1 + (x2 - x1) * f, wallH + 0.4, z1 + (z2 - z1) * f); c.rotation.y = w.rotation.y; c.translateZ(side * 0.66); city.add(c); } }
  };
  wallSeg(-26, -18, 2, -18); wallSeg(-26, 18, 2, 18); wallSeg(-26, -18, -26, 18);
  wallSeg(2, -18, 2, -2.2); wallSeg(2, 2.2, 2, 18);
  // gate arch + portcullis
  const gateTop = shadowy(new THREE.Mesh(new THREE.BoxGeometry(1.6, 3, 4.4), m.stoneWall)); gateTop.position.set(2, wallH - 1.5, 0); city.add(gateTop);
  const portc = new THREE.Group(); portc.position.set(2.85, 0, 0); city.add(portc);
  for (let i = -4; i <= 4; i++) { const bar = new THREE.Mesh(new THREE.BoxGeometry(0.1, 5, 0.12), m.wood); bar.position.set(0, 2.5, i * 0.5); portc.add(bar); }
  for (let j = 0; j < 4; j++) { const bar = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.12, 4.4), m.iron); bar.position.set(0.03, 0.8 + j * 1.3, 0); portc.add(bar); }
  portc.visible = false;
  const tower = (x, z, r = 2.2, h = 12, roof = 0x4a6a9a) => {
    const t = shadowy(new THREE.Mesh(new THREE.CylinderGeometry(r, r * 1.05, h, 20), m.stoneWall)); t.position.set(x, h / 2, z); city.add(t);
    const c = shadowy(new THREE.Mesh(new THREE.ConeGeometry(r * 1.25, r * 2.2, 20), new THREE.MeshStandardMaterial({ color: roof, roughness: 0.7 }))); c.position.set(x, h + r * 1.1, z); city.add(c);
    const fl = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 0.7), new THREE.MeshStandardMaterial({ color: 0xc22a30, side: THREE.DoubleSide })); fl.position.set(x + 0.6, h + r * 2.2 + 0.6, z); city.add(fl);
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 1.6), m.iron); pole.position.set(x, h + r * 2.2 + 0.3, z); city.add(pole);
  };
  for (const [x, z] of [[2, -18], [2, 18], [-26, -18], [-26, 18], [-12, -18], [-12, 18], [-26, 0]]) tower(x, z);
  for (const z of [-4.8, 4.8]) tower(0.3, z, 1.7, 11);
  // banners on wall facing river
  for (const z of [-12, -7, 7, 12]) { const b = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 3.2), new THREE.MeshStandardMaterial({ map: bannerTex(), transparent: true, alphaTest: 0.3, side: THREE.DoubleSide })); b.position.set(2.85, 5.2, z); b.rotation.y = Math.PI / 2; city.add(b); }
  // houses
  const roofCols = [0xb3532f, 0x9c3b2a, 0x4a6a9a, 0xc06a3a];
  const wallCols = [0xf1e3c6, 0xe9cfa6, 0xf4d9b8, 0xdcc7a2, 0xeee0cc];
  for (let i = 0; i < 70; i++) {
    const x = R(-24, -1), z = R(-16, 16); if (Math.abs(x + 14) < 5 && Math.abs(z) < 6) continue;
    const w = R(2, 3.4), d = R(2, 3.4), h = R(2.4, 4.2);
    const hb = shadowy(new THREE.Mesh(new THREE.BoxGeometry(w, h, d), new THREE.MeshStandardMaterial({ color: wallCols[i % 5], roughness: 0.6 }))); hb.position.set(x, h / 2, z); city.add(hb);
    const rf = shadowy(new THREE.Mesh(new THREE.ConeGeometry(Math.max(w, d) * 0.78, R(1.4, 2.4), 4), new THREE.MeshStandardMaterial({ color: roofCols[i % 4], roughness: 0.35 }))); rf.position.set(x, h + rf.geometry.parameters.height / 2, z); rf.rotation.y = Math.PI / 4; city.add(rf);
  }
  // palace on a mound
  const mound = shadowy(new THREE.Mesh(new THREE.CylinderGeometry(6, 8, 4, 24), new THREE.MeshStandardMaterial({ color: 0x7da352, roughness: 1 }))); mound.position.set(-14, 2, 0); city.add(mound);
  const keep = shadowy(new THREE.Mesh(new THREE.BoxGeometry(7, 7, 6), m.stoneWall)); keep.position.set(-14, 7.5, 0); city.add(keep);
  for (const [dx, dz] of [[-3.5, -3], [3.5, -3], [-3.5, 3], [3.5, 3]]) tower(-14 + dx, dz, 1.2, 14, 0xb3532f);
  tower(-14, 0, 1.6, 17, 0x4a6a9a);
  // trees
  const treeMat = [0x4f8a3a, 0x3f7a30, 0x6a9c42].map((c) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.9 }));
  const tree = (x, z, s = 1) => {
    const g = new THREE.Group(); g.position.set(x, 0, z); g.scale.setScalar(s);
    const tr = shadowy(new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.25, 1.6), m.darkwood)); tr.position.y = 0.8; g.add(tr);
    for (let k = 0; k < 3; k++) { const b = shadowy(new THREE.Mesh(new THREE.IcosahedronGeometry(R(0.8, 1.2), 1), treeMat[k % 3])); b.position.set(R(-0.5, 0.5), 2 + R(0, 0.8), R(-0.5, 0.5)); g.add(b); }
    scene.add(g); return g;
  };
  for (let i = 0; i < 160; i++) { const z = R(-200, 60); const side = rnd() < 0.5 ? -1 : 1; const x = curve.getPointAt(Math.min(1, Math.max(0, (120 - z) / 520))).x + side * R(7, 45); if (x > -30 && x < 9 && z > -45 && z < 25) continue; if (Math.hypot(x - MOUNT.x, z - MOUNT.z) < 14) continue; tree(x, z, R(0.8, 1.5)); }
  // hills + mountains
  const hillMat = new THREE.MeshStandardMaterial({ color: 0x4f7f34, roughness: 1 });
  for (let i = 0; i < 26; i++) { const h = add(new THREE.Mesh(new THREE.SphereGeometry(R(14, 30), 20, 12), hillMat)); h.scale.y = R(0.25, 0.45); const side = i % 2 ? -1 : 1; h.position.set(10 + side * R(75, 160), 0, R(-160, 60)); h.receiveShadow = true; }
  const mtnMat = new THREE.MeshStandardMaterial({ color: 0x8a8fb0, roughness: 0.75, flatShading: true });
  const snowMat = new THREE.MeshStandardMaterial({ color: 0xf4f6fb, roughness: 0.9, flatShading: true });
  for (let i = 0; i < 18; i++) {
    const r = R(30, 70), h = R(60, 130); const x = (i - 9) * 34 + R(-10, 10); const z = R(-200, -330);
    { const rp = pts.reduce((b, q) => (Math.abs(q.z - z) < Math.abs(b.z - z) ? q : b), pts[0]); if (Math.abs(x - rp.x) < r + 14) continue; }
    const mt = add(new THREE.Mesh(new THREE.ConeGeometry(r, h, 7), mtnMat)); mt.position.set(x, h / 2 - 2, z); mt.rotation.y = R(0, 3);
    const sn = add(new THREE.Mesh(new THREE.ConeGeometry(r * 0.36, h * 0.36, 7), snowMat)); sn.position.set(x, h - 2 - h * 0.18 + 0.4, z); sn.rotation.y = mt.rotation.y;
  }
  // her hut by the mountains
  const hut = new THREE.Group(); hut.position.copy(MOUNT).add(new THREE.Vector3(-6, 0, -1)); add(hut);
  const hb = shadowy(new THREE.Mesh(new THREE.BoxGeometry(3, 2.2, 2.6), m.wood)); hb.position.y = 1.1; hut.add(hb);
  const hr = shadowy(new THREE.Mesh(new THREE.ConeGeometry(2.6, 1.6, 4), new THREE.MeshStandardMaterial({ color: 0x9c3b2a }))); hr.position.y = 3; hr.rotation.y = Math.PI / 4; hut.add(hr);
  const door = new THREE.Mesh(new THREE.PlaneGeometry(0.8, 1.4), new THREE.MeshBasicMaterial({ color: 0xffc070 })); door.position.set(0, 0.7, 1.31); hut.add(door);
  const fireGlow = glowTex('rgba(255,170,80,1)');
  const fire = add(new THREE.Sprite(new THREE.SpriteMaterial({ map: fireGlow, blending: THREE.AdditiveBlending, depthWrite: false }))); fire.position.copy(MOUNT).add(new THREE.Vector3(-3.4, 0.5, 1.6)); fire.scale.set(1.6, 2, 1);
  const fireLight = add(new THREE.PointLight(0xff8a3a, 0, 14, 1.5)); fireLight.position.copy(fire.position).add(new THREE.Vector3(0, 0.6, 0));
  for (let k = 0; k < 5; k++) { const lg = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.9), m.darkwood); lg.position.copy(MOUNT).add(new THREE.Vector3(-3.4, 0.1, 1.6)); lg.rotation.set(Math.PI / 2, (k / 5) * Math.PI, 0); add(lg); }

  // gate torches
  const torchLights = []; const torchSprites = [];
  for (const z of [-2.8, 2.8]) {
    const p = new THREE.Vector3(3.0, 4.2, z);
    const s = add(new THREE.Sprite(new THREE.SpriteMaterial({ map: fireGlow, blending: THREE.AdditiveBlending, depthWrite: false }))); s.position.copy(p); s.scale.set(1.3, 1.7, 1); torchSprites.push(s);
    const l = add(new THREE.PointLight(0xff9a4a, 0, 18, 1.4)); l.position.copy(p).add(new THREE.Vector3(0.8, 0, 0)); torchLights.push(l);
  }

  // sun / moon / stars / clouds
  const sunSprite = add(new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex('rgba(255,236,190,1)'), blending: THREE.AdditiveBlending, fog: false, depthWrite: false })));
  const moon = add(new THREE.Mesh(new THREE.CircleGeometry(16, 32), new THREE.MeshBasicMaterial({ color: 0xf6f3e2, fog: false })));
  const moonGlow = add(new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex('rgba(190,210,255,1)'), blending: THREE.AdditiveBlending, fog: false, depthWrite: false, opacity: 0.3 })));
  const sg = new THREE.BufferGeometry(); const sp = [];
  for (let i = 0; i < 1500; i++) { const th = R(0, Math.PI * 2), ph = R(0.05, 1.3); sp.push(1200 * Math.cos(ph) * Math.cos(th), 1200 * Math.sin(ph), 1200 * Math.cos(ph) * Math.sin(th)); }
  sg.setAttribute('position', new THREE.Float32BufferAttribute(sp, 3));
  const stars = add(new THREE.Points(sg, new THREE.PointsMaterial({ color: 0xffffff, size: 2.2, sizeAttenuation: false, fog: false, transparent: true, opacity: 0.9 })));
  const cloudMat = new THREE.MeshLambertMaterial({ color: 0xffffff, emissive: 0xffffff, emissiveIntensity: 0.25, fog: false });
  const clouds = add(new THREE.Group());
  for (let i = 0; i < 28; i++) {
    const c = new THREE.Group(); const th = R(0, Math.PI * 2), d = R(300, 650);
    c.position.set(Math.cos(th) * d, R(110, 220), Math.sin(th) * d - 100);
    for (let k = 0; k < 6; k++) { const b = new THREE.Mesh(new THREE.SphereGeometry(R(12, 24), 12, 8), cloudMat); b.position.set(R(-30, 30), R(-4, 8), R(-10, 10)); b.scale.y = 0.7; c.add(b); }
    clouds.add(c);
  }
  // storm over the mountains
  const storm = add(new THREE.Group()); storm.position.set(12, 0, -195); storm.visible = false;
  const stormMat = new THREE.MeshLambertMaterial({ color: 0x3a3f55, emissive: 0x141826, fog: false });
  for (let k = 0; k < 26; k++) { const b = new THREE.Mesh(new THREE.SphereGeometry(R(14, 28), 14, 10), stormMat); b.position.set(R(-70, 70), R(42, 62), R(-30, 30)); b.scale.y = 0.6; storm.add(b); }
  const rainG = new THREE.BufferGeometry(); const rp = [];
  for (let i = 0; i < 900; i++) { const x = R(-65, 65), y = R(0, 45), z = R(-25, 25); rp.push(x, y, z, x - 1.5, y - 6, z); }
  rainG.setAttribute('position', new THREE.Float32BufferAttribute(rp, 3));
  const rain = new THREE.LineSegments(rainG, new THREE.LineBasicMaterial({ color: 0x9aaad0, transparent: true, opacity: 0.45, fog: false })); storm.add(rain);
  const boltPts = []; let bx = 0, by = 45; while (by > 0) { const nx = bx + R(-6, 6), ny = by - R(6, 12); boltPts.push(new THREE.Vector3(bx, by, 0), new THREE.Vector3(nx, ny, 0)); bx = nx; by = ny; }
  const bolt = new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(boltPts), new THREE.LineBasicMaterial({ color: 0xfff6c0, fog: false, transparent: true })); bolt.position.x = 18; storm.add(bolt);
  const flash = add(new THREE.PointLight(0xcfd8ff, 0, 600, 0.6)); flash.position.set(12, 40, -185);

  // flood water
  const flood = add(new THREE.Mesh(new THREE.PlaneGeometry(400, 300), new THREE.MeshStandardMaterial({ color: 0x6a7f6a, roughness: 0.25, metalness: 0.2, transparent: true, opacity: 0.93 })));
  flood.rotation.x = -Math.PI / 2; flood.position.set(-10, 3.1, -20); flood.visible = false; flood.userData.noCollide = true;
  const debris = new THREE.Group(); flood.add(debris);
  for (let i = 0; i < 40; i++) { const d = new THREE.Mesh(new THREE.BoxGeometry(R(0.5, 1.6), R(0.2, 0.5), 0.15), m.wood); d.position.set(R(-40, 30), R(-30, 30), 0.05); d.rotation.z = R(0, 3); debris.add(d); }

  // boat
  const boat = new THREE.Group(); add(boat);
  const hull = shadowy(new THREE.Mesh(new THREE.SphereGeometry(1, 20, 10, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), new THREE.MeshStandardMaterial({ color: 0x8a4b2a, roughness: 0.8, side: THREE.DoubleSide })));
  hull.scale.set(0.9, 0.5, 2.2); hull.position.y = 0.4; boat.add(hull);
  const trim = new THREE.Mesh(new THREE.TorusGeometry(1, 0.06, 6, 30), m.gold); trim.rotation.x = Math.PI / 2; trim.scale.set(0.9, 2.2, 1); trim.position.y = 0.4; boat.add(trim);
  const canopyPole = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 2.6), m.gold); canopyPole.position.set(0, 1.6, -1.2); boat.add(canopyPole);
  const pennant = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.5), new THREE.MeshStandardMaterial({ color: 0x6b3fa0, side: THREE.DoubleSide })); pennant.position.set(0.45, 2.7, -1.2); boat.add(pennant);
  boat.position.set(10, 0, 30); boat.visible = false;

  // props
  const rig = makeBellRig(); add(rig.group);
  const cart = makeCart(); add(cart); cart.visible = false;
  const rope = add(new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 1, 6), new THREE.MeshStandardMaterial({ color: 0x8a6a3a, roughness: 0.9 }))); rope.visible = false;
  const lantern = add(new THREE.PointLight(0xffb060, 0, 10, 1.5));

  // lights
  const hemi = add(new THREE.HemisphereLight(0xbfdfff, 0x557a3a, 1.0));
  const sun = add(new THREE.DirectionalLight(0xfff0d8, 2.4));
  sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048); sun.shadow.bias = -0.0004; sun.shadow.normalBias = 0.02;
  add(sun.target);

  const cast = {
    eng: new Puppet('engineer', { seedOffset: 10 }),
    duke: new Puppet('duke', { seedOffset: 11 }),
    g1: new Puppet('guard', { seedOffset: 12 }), g2: new Puppet('guard', { seedOffset: 13 }), g3: new Puppet('guard', { seedOffset: 14 }),
    c1: new Puppet('councilA', { seedOffset: 15 }), c2: new Puppet('councilB', { seedOffset: 16 }),
  };
  Object.values(cast).forEach((c) => add(c.root));

  const LIGHTS = {
    day:     { sky: 'day', fog: [0xa9cdea, 160, 1000], hemi: [0xcfe6ff, 0x3a5a22, 0.8], sun: [0xfff0d0, 3.6], sunDir: [40, 70, 35], sunSprite: [[300, 260, -600], 160], moon: false, stars: false, clouds: true, torches: 0, exposure: 1.0 },
    sunset:  { sky: 'sunset', fog: [0xe8835e, 90, 700], hemi: [0xff9a6a, 0x3a2050, 0.7], sun: [0xff8a40, 4.0], sunDir: [10, 14, -60], sunSprite: [[40, 70, -700], 420], moon: false, stars: false, clouds: true, torches: 0, exposure: 1.0 },
    dusk:    { sky: 'sunset', fog: [0xd9805e, 120, 900], hemi: [0xffb080, 0x4a3060, 1.15], sun: [0xffa060, 3.2], sunDir: [50, 45, 110], sunSprite: [[40, 70, -700], 420], moon: false, stars: false, clouds: true, torches: 0, exposure: 1.0 },
    night:   { sky: 'night', fog: [0x16204a, 60, 520], hemi: [0x4a5ab0, 0x0a1028, 0.6], sun: [0x8aa0ff, 0.55], sunDir: [-30, 60, -40], sunSprite: null, moon: [-120, 150, -520], stars: true, clouds: false, torches: 9, exposure: 0.85 },
    morning: { sky: 'morning', fog: [0xeac39e, 40, 420], hemi: [0xffe0c0, 0x6a5a3a, 1.05], sun: [0xffe0b8, 1.6], sunDir: [60, 40, 20], sunSprite: [[500, 180, 200], 260], moon: false, stars: false, clouds: false, torches: 0, exposure: 1.0 },
  };
  const world = {
    scene, cast, rig, cart, rope, boat, flood, storm, portc, lantern, fire, fireLight, sun, MOUNT, skies, skyMat,
    onWater(p) { let d = 1e9; for (const q of pts) { const dd = Math.hypot(q.x - p.x, q.z - p.z); if (dd < d) d = dd; } return !flood.visible && p.y < 0.5 && d < 3.9; },
    tieRope(puppet) { // taut rope from the cart shafts to the puller's shoulder
      const a = cart.localToWorld(cart.userData.tip.clone()); const b = puppet.torso.localToWorld(new THREE.Vector3(0, puppet.shoulderY, -puppet.shoulderX * 0.6));
      rope.visible = true; rope.position.copy(a).add(b).multiplyScalar(0.5); rope.scale.set(1, a.distanceTo(b), 1); rope.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), b.clone().sub(a).normalize());
    },
    light: null,
    setLight(name, focus = new THREE.Vector3()) {
      const L = LIGHTS[name]; this.light = name;
      skyMat.map = skies[L.sky]; skyMat.needsUpdate = true;
      scene.fog.color.set(L.fog[0]); scene.fog.near = L.fog[1]; scene.fog.far = L.fog[2];
      scene.background = new THREE.Color(L.fog[0]);
      hemi.color.set(L.hemi[0]); hemi.groundColor.set(L.hemi[1]); hemi.intensity = L.hemi[2];
      sun.color.set(L.sun[0]); sun.intensity = L.sun[1];
      sun.position.copy(focus).add(new THREE.Vector3(...L.sunDir)); sun.target.position.copy(focus);
      Object.assign(sun.shadow.camera, { left: -30, right: 30, top: 30, bottom: -30, near: 1, far: 220 }); sun.shadow.camera.updateProjectionMatrix();
      sunSprite.visible = !!L.sunSprite; if (L.sunSprite) { sunSprite.position.set(...L.sunSprite[0]); sunSprite.scale.setScalar(L.sunSprite[1]); }
      moon.visible = moonGlow.visible = !!L.moon; if (L.moon) { moon.position.copy(focus).add(new THREE.Vector3(...L.moon)); moon.lookAt(focus); moonGlow.position.copy(moon.position); moonGlow.scale.setScalar(55); }
      stars.visible = L.stars; clouds.visible = L.clouds;
      torchLights.forEach((l) => (l.intensity = L.torches)); torchSprites.forEach((s) => (s.visible = L.torches > 0));
      fireLight.intensity = name === 'night' ? 10 : 0; fire.visible = name === 'night';
      this.exposure = L.exposure;
    },
    update(t, cam) {
      wtex.offset.y = -t * 0.35;
      clouds.rotation.y = t * 0.004;
      torchSprites.forEach((s, i) => { const k = 1 + Math.sin(t * 14 + i * 2) * 0.1; s.scale.set(1.3 * k, 1.7 * k, 1); });
      fire.scale.set(1.6 + Math.sin(t * 15) * 0.15, 2 + Math.sin(t * 11) * 0.2, 1);
      fireLight.intensity = fire.visible ? 5 + Math.sin(t * 17) * 1.0 : 0;
      if (storm.visible) {
        rain.position.y = -((t * 60) % 6);
        const fl = (t % 2.3) < 0.09 || ((t + 0.8) % 3.1) < 0.06;
        bolt.material.opacity = fl ? 1 : 0; flash.intensity = fl ? 1.0 : 0; bolt.position.x = 18 + Math.floor(t / 2.3) * 13 % 50 - 25;
      } else flash.intensity = 0;
      if (flood.visible) { debris.children.forEach((d, i) => { d.userData.x ??= d.position.x; d.userData.r ??= d.rotation.z; d.position.x = d.userData.x + Math.sin(i) * 0.12 * t; d.rotation.z = d.userData.r + 0.06 * (i % 3 - 1) * t; }); }
      cart.userData.wheels?.forEach((w) => (w.rotation.y = -t * 3));
      rig.update(t, cam);
      Object.values(cast).forEach((c) => { if (c.root.visible) c.update(t, cam); });
    },
  };
  return world;
}

// =====================================================================
// WELL CUTAWAY (how it works)
// =====================================================================
export function buildCutaway() {
  const m = mats();
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0xf2b98a);
  scene.fog = new THREE.Fog(0xf2b98a, 30, 90);
  const add = (o, p = scene) => { p.add(o); return o; };
  const sky = add(new THREE.Mesh(new THREE.PlaneGeometry(200, 80), new THREE.MeshBasicMaterial({ map: skyTex([[0, '#7a6ab0'], [0.5, '#f7a77a'], [1, '#ffe0a0']]), fog: false })));
  sky.position.set(0, 30, -30);
  // earth block with strata on the cut face
  const earth = add(new THREE.Mesh(new THREE.BoxGeometry(44, 12, 14), [
    new THREE.MeshStandardMaterial({ color: 0x5a4a5a }), new THREE.MeshStandardMaterial({ color: 0x5a4a5a }),
    new THREE.MeshStandardMaterial({ color: 0x6fa04a }), new THREE.MeshStandardMaterial({ color: 0x3a3040 }),
    new THREE.MeshStandardMaterial({ map: strataTex(), roughness: 1 }), new THREE.MeshStandardMaterial({ color: 0x5a4a5a }),
  ]));
  earth.position.set(4, -6, -7); earth.receiveShadow = true;
  const grass = add(new THREE.Mesh(new THREE.PlaneGeometry(200, 60), new THREE.MeshStandardMaterial({ map: grassTex(), roughness: 1 }))); grass.rotation.x = -Math.PI / 2; grass.position.set(0, 0.001, -44);
  // well shaft (cut in half, looking in)
  const shaftBack = add(new THREE.Mesh(new THREE.CylinderGeometry(1.15, 1.15, 9, 32, 1, true, Math.PI / 2, Math.PI), new THREE.MeshStandardMaterial({ map: stoneTex([3, 4], '#8a8070'), side: THREE.DoubleSide })));
  shaftBack.position.set(0, -4.5, 0.02);
  const hole = add(new THREE.Mesh(new THREE.BoxGeometry(2.3, 9, 0.05), new THREE.MeshBasicMaterial({ color: 0x1a1420 }))); hole.position.set(0, -4.5, -1.16);
  // pipe to the river (half-cut)
  const pipe = add(new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.55, 15, 24, 1, true, Math.PI / 2, Math.PI), new THREE.MeshStandardMaterial({ color: 0x6a4a2a, metalness: 0.2, roughness: 0.5, side: THREE.DoubleSide })));
  pipe.rotation.z = Math.PI / 2; pipe.position.set(8, -8.2, 0);
  const pipeWaterTex = waterTex(); pipeWaterTex.repeat.set(6, 1);
  const pipeWater = add(new THREE.Mesh(new THREE.BoxGeometry(15, 0.9, 0.9), new THREE.MeshStandardMaterial({ map: pipeWaterTex, color: 0x5aa0d8, transparent: true, opacity: 0.9 }))); pipeWater.position.set(8, -8.2, 0);
  // river section on the right
  const riverWater = add(new THREE.Mesh(new THREE.BoxGeometry(8, 1, 10), new THREE.MeshStandardMaterial({ color: 0x3f86b8, roughness: 0.15, transparent: true, opacity: 0.92 })));
  const riverBed = add(new THREE.Mesh(new THREE.BoxGeometry(8.4, 0.4, 10.4), new THREE.MeshStandardMaterial({ color: 0xc9a46a }))); riverBed.position.set(19, -9, -4);
  // water column in the well
  const col = add(new THREE.Mesh(new THREE.CylinderGeometry(1.1, 1.1, 1, 32, 1, false, Math.PI / 2, Math.PI), new THREE.MeshStandardMaterial({ color: 0x4f9ad8, transparent: true, opacity: 0.85, side: THREE.DoubleSide, roughness: 0.1 })));
  // float + rod + guide + pin
  const flt = add(new THREE.Mesh(new THREE.SphereGeometry(0.55, 32, 20), m.copper)); flt.castShadow = true;
  const rod = add(new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 1, 10), m.iron));
  // rig above ground
  const rig = makeBellRig({ well: false }); rig.group.position.set(0, 0, 0); add(rig.group);
  const rim = add(new THREE.Mesh(new THREE.CylinderGeometry(1.3, 1.35, 0.9, 32, 1, true, Math.PI / 2, Math.PI), new THREE.MeshStandardMaterial({ map: stoneTex([2, 1]), side: THREE.DoubleSide }))); rim.position.y = 0.45;
  const pin = add(new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.6, 12), m.gold)); pin.rotation.z = Math.PI / 2;
  const glow = add(new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex('rgba(255,230,160,1)'), blending: THREE.AdditiveBlending, depthWrite: false, opacity: 0 }))); glow.scale.set(2, 2, 1);
  // labels-free "x-ray" lighting
  add(new THREE.HemisphereLight(0xffe2c0, 0x4a3a5a, 1.5));
  const sun = add(new THREE.DirectionalLight(0xffd0a0, 2.2)); sun.position.set(8, 16, 12); sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048);
  Object.assign(sun.shadow.camera, { left: -15, right: 15, top: 15, bottom: -15 });
  const spot = add(new THREE.PointLight(0xffe0b0, 30, 14, 1.4)); spot.position.set(2, -4, 4);

  const RIVER_BASE = -8.6;
  return {
    scene, rig, flt, pin, glow, water: 0,
    setLevel(level, pinOut) { // level: well water surface y (-8 .. -0.3)
      const bottom = -8.8; const h = Math.max(0.05, level - bottom);
      col.scale.y = h; col.position.y = bottom + h / 2;
      flt.position.set(0, level + 0.15, 0.2);
      const top = flt.position.y + 0.5 + 3.9; // rod length: reaches the pin only at flood level
      rod.scale.y = top - (flt.position.y + 0.5); rod.position.set(0, (top + flt.position.y + 0.5) / 2, 0.2);
      pin.position.set(0.15 + pinOut * 0.9, 4.2, 0.25);
      const rh = Math.max(0.3, level - RIVER_BASE + 0.4); riverWater.scale.y = rh; riverWater.position.set(19, RIVER_BASE + rh / 2 - 0.2, -4);
      this.water = level;
    },
    update(t, cam) { pipeWaterTex.offset.x = t * 1.2; rig.update(t, cam); },
  };
}

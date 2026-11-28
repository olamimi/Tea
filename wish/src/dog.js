// Icey: a hand-drawn 2D cut-out dog, redrawn every frame on a canvas and shown on a camera-facing card.
// Scruffy white dog, gold spot, one ear up and one floppy ear, crooked tail, red collar with a gold tag.
// Acting: act([{t, mode:'stand'|'sit'|'trot'|'run', wag:0..1}]), barks([t...]), walk({t0,t1,from,to}).
import * as THREE from 'three';

const INK = '#301420', FUR = '#f7f5ef', SHADE = '#dcd8ce', GOLD = '#e8b04a';
const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
const ease = (u) => 0.5 - 0.5 * Math.cos(Math.PI * clamp(u, 0, 1));
const CW = 640, CH = 480; // canvas; dog faces +x, feet at y=440

function line(ctx, w = 9) { ctx.lineWidth = w; ctx.strokeStyle = INK; ctx.lineJoin = 'round'; ctx.lineCap = 'round'; ctx.stroke(); }
function fill(ctx, c) { ctx.fillStyle = c; ctx.fill(); }

function drawDog(ctx, st) {
  ctx.clearRect(0, 0, CW, CH);
  const { gait = 0, ph = 0, sit = 0, wag = 0, wagPh = 0, bark = 0, ear = 0, breathe = 0 } = st;
  const bob = gait > 0 ? -Math.abs(Math.sin(ph * Math.PI * 2)) * 10 * gait : Math.sin(breathe) * 2;
  const bx = 300, by = 290 + bob + sit * 30; // body centre
  const tilt = sit * -0.38; // sitting: body tilts up at the front
  // ---- legs (back pair behind body)
  const leg = (x0, y0, ang, len, back) => { ctx.save(); ctx.translate(x0, y0); ctx.rotate(ang); ctx.beginPath(); ctx.roundRect(-18, -30, 36, len + 24, 18); fill(ctx, back ? SHADE : FUR); line(ctx, 8);
    ctx.beginPath(); ctx.ellipse(8, len - 6, 25, 13, 0, 0, Math.PI * 2); fill(ctx, back ? SHADE : FUR); line(ctx, 8); ctx.restore(); };
  const sw = (o) => gait > 0 ? Math.sin((ph + o) * Math.PI * 2) * (0.35 + 0.35 * gait) : 0;
  const legLen = 108;
  ctx.save(); ctx.translate(bx, by); ctx.rotate(tilt); ctx.translate(-bx, -by);
  if (sit > 0.5) { leg(bx - 70, by + 20, -1.25, 80, true); leg(bx + 70, by + 30, 0.05, legLen + 14, true); }
  else { leg(bx - 78, by + 22, sw(0.5), legLen, true); leg(bx + 72, by + 26, sw(0), legLen, true); }
  // ---- tail (crooked: a kink two thirds of the way), wagging
  const wa = Math.sin(wagPh) * (0.25 + 0.6 * wag) - 0.6 - 0.3 * wag;
  ctx.save(); ctx.translate(bx - 118, by - 14 + sit * 22); ctx.rotate(wa);
  ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(-40, -14, -58, -46); ctx.lineTo(-44, -60); ctx.quadraticCurveTo(-66, -88, -60, -110);
  ctx.lineWidth = 26; ctx.strokeStyle = INK; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.stroke(); ctx.lineWidth = 12; ctx.strokeStyle = FUR; ctx.stroke(); ctx.restore();
  // ---- body (scruffy outline)
  ctx.beginPath(); const N = 36;
  for (let i = 0; i <= N; i++) { const a = (i / N) * Math.PI * 2; const tuft = (i % 3 === 0 && Math.sin(a) > 0.2) ? 7 : 0; const rx = 128 + tuft, ry = 66 + tuft; const x = bx + Math.cos(a) * rx, y = by + Math.sin(a) * ry; i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }
  ctx.closePath(); fill(ctx, FUR); line(ctx, 9);
  ctx.save(); ctx.clip(); ctx.beginPath(); ctx.ellipse(bx - 30, by - 44, 52, 30, -0.15, 0, Math.PI * 2); fill(ctx, GOLD); ctx.beginPath(); ctx.ellipse(bx, by + 60, 140, 30, 0, 0, Math.PI * 2); fill(ctx, 'rgba(120,110,100,0.16)'); ctx.restore();
  // ---- front legs
  if (sit > 0.5) { leg(bx + 92, by + 10, 0.12, legLen + 26, false); leg(bx + 62, by + 14, 0.05, legLen + 22, false); }
  else { leg(bx + 92, by + 24, sw(0.5), legLen, false); leg(bx - 64, by + 26, sw(0), legLen, false); }
  ctx.restore();
  // ---- head
  const hx = bx + 132 + sit * 6, hy = by - 92 - sit * 34 + Math.sin(ph * Math.PI * 4) * 3 * gait;
  const jaw = bark; // 0 closed .. 1 wide open
  // standing ear (behind head)
  ctx.beginPath(); ctx.moveTo(hx - 34, hy - 40); ctx.lineTo(hx - 50, hy - 112 + ear * 4); ctx.lineTo(hx - 4, hy - 56); ctx.closePath(); fill(ctx, FUR); line(ctx, 8);
  ctx.beginPath(); ctx.moveTo(hx - 34, hy - 50); ctx.lineTo(hx - 44, hy - 92); ctx.lineTo(hx - 16, hy - 58); ctx.closePath(); fill(ctx, '#f2b8b8');
  // lower jaw
  ctx.save(); ctx.translate(hx + 30, hy + 22); ctx.rotate(0.55 * jaw);
  ctx.beginPath(); ctx.roundRect(-10, -6, 74, 26, 13); fill(ctx, FUR); line(ctx, 8); ctx.restore();
  if (jaw > 0.05) { ctx.beginPath(); ctx.moveTo(hx + 26, hy + 18); ctx.lineTo(hx + 96, hy + 14); ctx.lineTo(hx + 26 + 64 * Math.cos(0.55 * jaw), hy + 22 + 64 * Math.sin(0.55 * jaw)); ctx.closePath(); fill(ctx, '#5b1b1b');
    ctx.beginPath(); ctx.ellipse(hx + 56, hy + 26 + 18 * jaw, 16, 9, 0.4 * jaw, 0, Math.PI * 2); fill(ctx, '#f07a8a'); }
  // skull + muzzle
  ctx.beginPath(); for (let i = 0; i <= 28; i++) { const a = (i / 28) * Math.PI * 2; const tf = (i % 4 === 0 && Math.sin(a) < -0.3) ? 7 : 0; const x = hx + Math.cos(a) * (62 + tf), y = hy + Math.sin(a) * (58 + tf); i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); } ctx.closePath(); fill(ctx, FUR); line(ctx, 9);
  ctx.beginPath(); ctx.ellipse(hx + 60, hy + 6 - 4 * jaw, 46, 26, -0.12 - 0.15 * jaw, 0, Math.PI * 2); fill(ctx, FUR); line(ctx, 8);
  ctx.beginPath(); ctx.ellipse(hx + 100, hy - 4 - 6 * jaw, 13, 10, 0, 0, Math.PI * 2); fill(ctx, INK);
  // eye + brow
  if (st.eyes === 'happy') { ctx.beginPath(); ctx.moveTo(hx + 2, hy - 8); ctx.quadraticCurveTo(hx + 16, hy - 24, hx + 30, hy - 8); line(ctx, 8); }
  else { ctx.beginPath(); ctx.arc(hx + 16, hy - 12, 10, 0, Math.PI * 2); fill(ctx, INK); ctx.beginPath(); ctx.arc(hx + 19, hy - 16, 3.5, 0, Math.PI * 2); fill(ctx, '#ffffff'); }
  ctx.beginPath(); ctx.moveTo(hx - 2, hy - 36 - 6 * jaw); ctx.lineTo(hx + 30, hy - 40 - 8 * jaw); line(ctx, 9);
  // floppy ear (front), bouncing
  ctx.save(); ctx.translate(hx - 40, hy - 40); ctx.rotate(0.55 + ear * 0.5);
  ctx.beginPath(); ctx.moveTo(-8, 0); ctx.quadraticCurveTo(-34, 28, -22, 84); ctx.quadraticCurveTo(-6, 96, 10, 80); ctx.quadraticCurveTo(18, 30, 14, 0); ctx.closePath(); fill(ctx, GOLD); line(ctx, 8); ctx.restore();
  // collar + tag
  ctx.save(); ctx.translate(hx - 46, hy + 40); ctx.rotate(-0.9 + sit * 0.3); ctx.beginPath(); ctx.roundRect(-14, -36, 28, 76, 10); fill(ctx, '#d02e2a'); line(ctx, 6);
  const tg = Math.sin(ph * Math.PI * 4) * 0.4 * gait + 0.2 * jaw; ctx.translate(14, 18); ctx.rotate(tg); ctx.beginPath(); ctx.arc(14, 0, 13, 0, Math.PI * 2); fill(ctx, '#f2c440'); line(ctx, 5); ctx.restore();
}

export class Dog {
  constructor() {
    this.root = new THREE.Group();
    this.canvas = document.createElement('canvas'); this.canvas.width = CW; this.canvas.height = CH; this.ctx = this.canvas.getContext('2d');
    this.tex = new THREE.CanvasTexture(this.canvas); this.tex.colorSpace = THREE.SRGBColorSpace; this.tex.anisotropy = 8;
    const h = 0.95, w = h * CW / CH; const g = new THREE.PlaneGeometry(w, h); g.translate(0, h / 2 - h * (CH - 440) / CH, 0);
    this.mat = new THREE.MeshLambertMaterial({ map: this.tex, transparent: true, alphaTest: 0.04, side: THREE.DoubleSide, emissive: 0xffffff, emissiveMap: this.tex, emissiveIntensity: 0.7 });
    this.card = new THREE.Mesh(g, this.mat); this.root.add(this.card); this.card.userData.noCollide = true;
    const sh = new THREE.Mesh(new THREE.CircleGeometry(0.42, 24), new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.22, depthWrite: false }));
    sh.rotation.x = -Math.PI / 2; sh.position.y = 0.012; sh.scale.set(1.2, 0.5, 1); this.root.add(sh); this.shadow = sh; sh.userData.noCollide = true;
    this.hr = 0.2; this.reset();
  }
  reset() { this.keys = []; this.barkT = []; this.path = null; this.root.visible = false; this.facing = 1; this.dir = new THREE.Vector3(1, 0, 0); return this; }
  place(p, dir) { this.root.position.copy(p); if (dir) this.dir.copy(dir).setY(0).normalize(); this.path = null; return this; }
  act(keys) { this.keys = keys.slice().sort((a, b) => a.t - b.t); return this; }
  barks(ts) { this.barkT = ts.slice(); return this; }
  walk(p) { this.path = p; return this; }
  held(t, k, d) { let v = d; for (const key of this.keys) { if (key.t > t) break; if (key[k] !== undefined) v = key[k]; } return v; }
  // world position of the head (for close-ups)
  get head() { const self = this; return { getWorldPosition(v) { self.root.updateMatrixWorld(true); return v.copy(self.root.position).add(new THREE.Vector3(0, 0.62, 0)); } }; }
  update(t, camera) {
    let gait = 0, moving = false;
    if (this.path) { const { t0, t1, from, to } = this.path; const u = clamp((t - t0) / (t1 - t0), 0, 1); const k = this.path.ease ? ease(u) : u;
      this.root.position.lerpVectors(from, to, k); moving = t > t0 && t < t1; if (moving) this.dir.copy(to).sub(from).setY(0).normalize(); }
    const mode = this.held(t, 'mode', 'stand'); const wag = this.held(t, 'wag', 0.6);
    if (moving || mode === 'trot' || mode === 'run') gait = mode === 'run' ? 1 : 0.6;
    const ph = t * (gait >= 1 ? 3.4 : 2.4);
    let bark = 0; for (const b of this.barkT) { const d = t - b; if (d >= -0.04 && d < 0.35) bark = Math.max(bark, d < 0.05 ? (d + 0.04) / 0.09 : Math.exp(-(d - 0.05) * 9)); }
    const ear = Math.sin(t * 9) * 0.25 * gait + bark * 0.6 + Math.sin(t * 2) * 0.05;
    drawDog(this.ctx, { gait, ph, sit: mode === 'sit' ? 1 : 0, wag, wagPh: t * (6 + 14 * wag), bark, ear, breathe: t * 3, eyes: this.held(t, 'eyes', 'dot') });
    this.tex.needsUpdate = true;
    // card faces the camera (around Y); flip so the dog looks along its heading on screen
    const cp = camera.getWorldPosition(new THREE.Vector3()); const p = this.root.position;
    this.card.rotation.y = Math.atan2(cp.x - p.x, cp.z - p.z);
    const right = new THREE.Vector3(1, 0, 0).applyQuaternion(camera.quaternion).setY(0);
    const sgn = this.dir.dot(right) >= -0.05 ? 1 : -1; this.card.scale.x = sgn;
    this.card.position.y = gait > 0 ? Math.abs(Math.sin(ph * Math.PI * 2)) * 0.03 * gait : 0;
  }
}

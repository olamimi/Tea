import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { BokehPass } from 'three/addons/postprocessing/BokehPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { buildLobby, buildHill, buildStreet, buildCanal, buildStairs, buildSkyline, buildPlaza, buildRally } from './sets.js';
import { buildShots } from './shots.js';

const W = 1080, H = 1920, FPS = 30;
const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
renderer.setSize(W, H); renderer.setPixelRatio(1);
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.outputColorSpace = THREE.SRGBColorSpace;
document.body.appendChild(renderer.domElement);
const camera = new THREE.PerspectiveCamera(40, W / H, 0.05, 2000);
const composer = new EffectComposer(renderer);
const renderPass = new RenderPass(new THREE.Scene(), camera); composer.addPass(renderPass);
const bokeh = new BokehPass(new THREE.Scene(), camera, { focus: 3.0, aperture: 0.0035, maxblur: 0.01 }); composer.addPass(bokeh);
composer.addPass(new UnrealBloomPass(new THREE.Vector2(W / 2, H / 2), 0.2, 0.4, 2.6));
composer.addPass(new OutputPass());
// Grade in display space: warm lifted shadows, saturation, warmth, light vignette (references: p5 luma ~50, corner/centre ~0.8)
const grade = new ShaderPass({
  uniforms: { tDiffuse: { value: null }, sat: { value: 1.3 }, warm: { value: 0.0 }, lift: { value: new THREE.Vector3(0.17, 0.115, 0.095) }, gain: { value: 1.0 }, vig: { value: 0.18 }, tint: { value: new THREE.Vector3(0, 0, 0) } },
  vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
  fragmentShader: `uniform sampler2D tDiffuse; uniform float sat, warm, gain, vig; uniform vec3 lift, tint; varying vec2 vUv;
    void main(){ vec3 c = texture2D(tDiffuse, vUv).rgb; float l = dot(c, vec3(0.299, 0.587, 0.114));
      c = mix(vec3(l), c, sat); c += vec3(0.05, 0.015, -0.05) * warm; c += tint;
      c = lift + c * (vec3(1.0) - lift); c *= gain;
      vec2 q = vUv - 0.5; c *= 1.0 - vig * smoothstep(0.25, 0.75, length(q * vec2(1.0, 0.9)));
      gl_FragColor = vec4(clamp(c, 0.0, 1.0), 1.0); }` });
composer.addPass(grade);
const mblur = new ShaderPass({
  uniforms: { tDiffuse: { value: null }, dirPx: { value: new THREE.Vector2(0, 0) }, radial: { value: 0 }, res: { value: new THREE.Vector2(W, H) } },
  vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
  fragmentShader: `uniform sampler2D tDiffuse; uniform vec2 dirPx, res; uniform float radial; varying vec2 vUv;
    void main(){ if (length(dirPx) < 0.5 && radial < 0.001) { gl_FragColor = texture2D(tDiffuse, vUv); return; }
      vec3 acc = vec3(0.0); vec2 d = dirPx / res; vec2 toC = vUv - 0.5;
      for (int i = 0; i < 24; i++) { float f = float(i) / 23.0 - 0.5; vec2 uv = vUv + d * f - toC * radial * f; acc += texture2D(tDiffuse, clamp(uv, 0.001, 0.999)).rgb; }
      gl_FragColor = vec4(acc / 24.0, 1.0); }` });
composer.addPass(mblur);
// per-beat grade (saturation tracks the emotion: drained when accused, cool at the office, golden at vindication)
const GRADES = {
  default: { sat: 1.3, warm: 0.6, gain: 1.0, tint: [0, 0, 0] },
  hook: { sat: 1.35, warm: 0.9, gain: 1.02, tint: [0.01, 0, -0.01] }, loop: { sat: 1.35, warm: 0.9, gain: 1.02, tint: [0.01, 0, -0.01] },
  rule: { sat: 1.25, warm: 0.5, gain: 1.0, tint: [0, 0, 0] },
  stairs: { sat: 1.15, warm: 0.3, gain: 0.97, tint: [0, 0, 0.01] },
  skyline: { sat: 1.4, warm: 1.0, gain: 1.03, tint: [0.015, 0, 0.005] },
  twist: { sat: 1.3, warm: 0.6, gain: 1.0, tint: [0, 0, 0] },
};
let focusD = 3;
const acc = document.createElement('canvas'); acc.width = W; acc.height = H; const actx = acc.getContext('2d');
let sets, segs, timeline, SS = 1;

window.setup = async (opts = {}) => {
  SS = opts.ss || 1;
  timeline = await (await fetch('build/timeline.json')).json();
  const pmrem = new THREE.PMREMGenerator(renderer); const env = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  sets = { lobby: buildLobby(), hill: buildHill(), street: buildStreet(), canal: buildCanal(), stairs: buildStairs(), skyline: buildSkyline(), plaza: buildPlaza(), rally: buildRally() };
  for (const s of Object.values(sets)) { s.scene.environment = env; s.scene.environmentIntensity = 0.55; }
  const norm = (w) => w.toLowerCase();
  const T = {
    word(shot, word, nth = 1) { let n = 0; for (const ln of timeline.lines) if (ln.shot === shot) for (const w of ln.words) if (norm(w.w) === norm(word) && ++n === nth) return w.start; throw new Error(`word not found: ${shot}/${word}`); },
    words(shot, from, to, nth = 1) {
      const all = timeline.lines.filter((l) => l.shot === shot).flatMap((l) => l.words);
      let i = -1, n = 0; all.forEach((x, k) => { if (i < 0 && norm(x.w) === norm(from) && ++n === nth) i = k; });
      const j = all.findIndex((x, k) => k >= i && norm(x.w) === norm(to)); if (i < 0 || j < 0) throw new Error(`words not found: ${shot}/${from}..${to}`); return all.slice(i, j + 1);
    },
    shot(name) { return timeline.shots.find((s) => s.name === name); },
  };
  const S = buildShots(T);
  segs = [];
  timeline.shots.forEach((sh, si) => {
    const list = S[sh.name](sh.start, sh.dur);
    list.forEach((sg, k) => {
      const start = sh.start + Math.max(0, sg.at); const end = k + 1 < list.length ? sh.start + list[k + 1].at : sh.end;
      segs.push({ ...sg, shot: sh.name, si, k, list, start, end, first: k === 0, last: k === list.length - 1 });
    });
  });
  return { duration: timeline.duration, frames: Math.ceil(timeline.duration * FPS), segs: segs.map((s) => [s.shot, s.k, +s.start.toFixed(2), +s.end.toFixed(2)]) };
};

function resetSet(name) { const s = sets[name]; Object.values(s.cast).forEach((c) => { c.root.visible = false; c.reset(); }); s.reset?.(); }
let active = null;
function activate(seg) {
  if (active === seg) return;
  let lastSet = null;
  for (let k = 0; k <= seg.k; k++) { const sg = seg.list[k]; if (sg.set !== lastSet) { resetSet(sg.set); lastSet = sg.set; } sg.init?.(sets[sg.set]); }
  active = seg;
}
function segAt(t) { let s = segs[0]; for (const sg of segs) if (t >= sg.start) s = sg; return s; }

// ---------------- camera system (measured from the references) ----------------
// constant slow push-in under everything, gentle roll drift, swoops between angles in the same set,
// whip pans (directional blur) or zoom-throughs (radial blur) between sets, rare colour-flash crossfades.
const CAM = { push: 0.03, whipRoll: 0.14, rollDeg: 0.7, swoop: 0.5, whip: 5 / FPS, whipAng: 0.75, zoomOut: 9 / FPS, zoomIn: 8 / FPS, flash: 6 / FPS };
const easeIO = (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
export function transOf(seg) { // transition INTO this segment
  const i = segs.indexOf(seg); const prev = segs[i - 1]; if (!prev) return 'none';
  if (seg.trans) return seg.trans;
  if (prev.set === seg.set) { // swoop only between nearby, similar angles; otherwise whip (never fly through people)
    const a = prev.cam(prev.end - prev.start, 1), b = seg.cam(0, 0);
    const da = a.l.clone().sub(a.p).normalize(), db = b.l.clone().sub(b.p).normalize();
    if (a.p.distanceTo(b.p) < 2.2 && da.dot(db) > 0.6) return 'swoop';
    return 'whip';
  }
  return seg.si % 3 === 0 ? 'zoom' : 'whip';
}
function baseCam(seg, t) {
  const lt = Math.max(0, t - seg.start), u = Math.min(1, lt / Math.max(0.01, seg.end - seg.start));
  const c = seg.cam(lt, u);
  return { p: c.p.clone(), l: c.l.clone(), fov: c.fov * Math.exp(-CAM.push * lt), roll: c.roll || 0, lt, u };
}
function poseCamera(seg, t) {
  const c = baseCam(seg, t); const i = segs.indexOf(seg); const prev = segs[i - 1], next = segs[i + 1];
  const tin = transOf(seg), tout = next ? transOf(next) : 'none';
  // swoop: fly from the previous angle (same set) instead of cutting
  if (tin === 'swoop' && t - seg.start < CAM.swoop) {
    const a = baseCam(prev, seg.start); const k = easeIO((t - seg.start) / CAM.swoop);
    c.p.lerpVectors(a.p, c.p, k); c.l.lerpVectors(a.l, c.l, k); c.fov = a.fov + (c.fov - a.fov) * k;
  }
  let yaw = 0, yawRate = 0, fovK = 1, radial = 0; const dir = i % 2 ? 1 : -1; const per = 1 / FPS / CAM.whip;
  if (tout === 'whip' && seg.end - t < CAM.whip) { const p = 1 - (seg.end - t) / CAM.whip; yaw = dir * CAM.whipAng * p * p; yawRate = dir * CAM.whipAng * 2 * Math.max(p, 0.2) * per; }
  if (tin === 'whip' && t - seg.start < CAM.whip) { const d2 = segs.indexOf(prev) % 2 ? 1 : -1; const p = (t - seg.start) / CAM.whip; yaw = -d2 * CAM.whipAng * (1 - p) * (1 - p); yawRate = d2 * CAM.whipAng * 2 * Math.max(1 - p, 0.2) * per; }
  if (tout === 'zoom' && seg.end - t < CAM.zoomOut) { const p = 1 - (seg.end - t) / CAM.zoomOut; fovK = 1 - 0.8 * p * p; radial = 0.25 * p * p; }
  if (tin === 'zoom' && t - seg.start < CAM.zoomIn) { const p = (t - seg.start) / CAM.zoomIn; fovK = 0.25 + 0.75 * (1 - (1 - p) * (1 - p)); radial = 0.25 * (1 - p) * (1 - p); }
  camera.position.copy(c.p); camera.fov = c.fov * fovK; camera.updateProjectionMatrix();
  camera.position.x += Math.sin(t * 0.9) * 0.012; camera.position.y += Math.sin(t * 1.3 + 1) * 0.01;
  camera.lookAt(c.l); camera.rotateZ(c.roll + CAM.rollDeg * Math.PI / 180 * Math.sin(t * 0.45 + 1.3) + yaw * CAM.whipRoll); camera.rotateY(yaw);
  focusD = camera.position.distanceTo(c.l);
  // motion blur from this frame's camera change (pixels moved per frame)
  const hfov = 2 * Math.atan(Math.tan(camera.fov * Math.PI / 360) * W / H);
  mblur.uniforms.dirPx.value.set(-yawRate * W / hfov, 0);
  mblur.uniforms.radial.value = radial;
  return { lt: c.lt, u: c.u };
}
function renderOnce(t, forced, jitter) {
  const seg = forced || segAt(t); activate(seg);
  const set = sets[seg.set];
  const { u } = poseCamera(seg, t);
  if (jitter) camera.setViewOffset(W, H, jitter[0], jitter[1], W, H); else camera.clearViewOffset();
  if (seg.tick) seg.tick(set, t, u); else if (seg.inherit) for (let k = seg.k - 1; k >= 0; k--) { const sg = seg.list[k]; if (sg.tick && sg.set === seg.set) { sg.tick(set, t, u); break; } }
  set.update(t, camera);
  if (seg.post) seg.post(set, t, u); else for (let k = seg.k - 1; k >= 0; k--) { const sg = seg.list[k]; if (sg.post && sg.set === seg.set) { sg.post(set, t, u); break; } }
  renderer.toneMappingExposure = (set.exposure || 1) * 1.08;
  const G = GRADES[seg.shot] || GRADES.default; grade.uniforms.sat.value = G.sat; grade.uniforms.warm.value = G.warm; grade.uniforms.gain.value = G.gain; grade.uniforms.tint.value.set(...G.tint);
  bokeh.scene = set.scene; bokeh.uniforms.focus.value = focusD;
  renderPass.scene = set.scene; composer.render();
  return seg;
}
// supersampling: average SS renders at sub-pixel offsets (rotated grid) -> no crawling texture/edge shimmer
const JIT = [[0, 0], [0.5, 0.25], [-0.25, 0.5], [0.25, -0.5], [-0.5, -0.25]];
function renderAA(t, seg, into, alpha = 1) {
  for (let i = 0; i < SS; i++) {
    renderOnce(t, seg, SS > 1 ? JIT[i] : null); if (window.__DBG) { const c = sets[seg.set].cast; (window.__dbg = window.__dbg || []).push([Math.round(t * 30), i, ...Object.entries(c).filter(([n, x]) => x.root.visible).map(([n, x]) => n + ':' + x.neck.rotation.y.toFixed(2))]); }
    into.globalAlpha = alpha * (i === 0 ? 1 : 1 / (i + 1)); into.drawImage(renderer.domElement, 0, 0);
  }
}
function speedLines(t, k) {
  const n = 30; actx.save(); actx.globalAlpha = 1; actx.translate(W / 2, H * 0.45);
  for (let i = 0; i < n; i++) { const h = Math.sin(i * 91.7 + Math.floor(t * 30) * 13.3) * 43758.5453; const r = h - Math.floor(h); const a = (i / n) * Math.PI * 2 + r * 0.2; const r0 = 420 + r * 240, r1 = r0 + 240 + r * 380;
    actx.strokeStyle = `rgba(255,255,255,${0.6 * k})`; actx.lineWidth = 3 + r * 5; actx.beginPath(); actx.moveTo(Math.cos(a) * r0, Math.sin(a) * r0 * 1.6); actx.lineTo(Math.cos(a) * r1, Math.sin(a) * r1 * 1.6); actx.stroke(); }
  actx.restore();
}
const tmp = document.createElement('canvas'); tmp.width = W; tmp.height = H; const tctx = tmp.getContext('2d');
window.renderFrame = (f) => {
  const t = f / FPS; const seg = segAt(t);
  actx.globalAlpha = 1;
  if (transOf(seg) === 'flash' && t - seg.start < CAM.flash) {
    const prev = segs[segs.indexOf(seg) - 1]; const k = (t - seg.start + 1 / FPS) / (CAM.flash + 1 / FPS);
    renderAA(t, prev, actx); renderAA(t, seg, tctx); actx.globalAlpha = k; actx.drawImage(tmp, 0, 0); actx.globalAlpha = 1;
    actx.fillStyle = `rgba(214,96,170,${0.45 * Math.sin(Math.PI * k)})`; actx.fillRect(0, 0, W, H);
  } else renderAA(t, seg, actx);
  const sp = seg.speed || seg.list[0].speed;
  if (sp && t >= sp[0] && t < sp[1]) speedLines(t, Math.sin(Math.PI * (t - sp[0]) / (sp[1] - sp[0])));
  return acc.toDataURL('image/jpeg', 0.93);
};
window.ready = true;

window.clipCheck = (f) => {
  const t = f / FPS; const seg = segAt(t); renderOnce(t, seg);
  const set = sets[seg.set]; const out = []; const rc = new THREE.Raycaster();
  const solids = []; set.scene.traverse((o) => { if (o.isMesh && o.visible && !o.userData.noCollide && !(o.material && (o.material.transparent || o.material.blending === THREE.AdditiveBlending))) { let p = o, vis = true; while (p) { if (!p.visible) { vis = false; break; } p = p.parent; } if (vis) solids.push(o); } });
  const owner = new Map(); for (const [n, c] of Object.entries(set.cast)) c.root.traverse((o) => owner.set(o, n));
  for (const [name, c] of Object.entries(set.cast)) {
    if (!c.root.visible) continue;
    const others = solids.filter((o) => owner.get(o) !== name && !(o.parent && o.parent.isMesh && owner.get(o.parent) === name));
    const base = c.root.getWorldPosition(new THREE.Vector3()); const R = c.spec.width * c.u * 0.85;
    const sitting = c.held(t, 'sit', null) != null;
    for (const hf of sitting ? [0.6, 0.8] : [0.3, 0.55, 0.8]) for (let k = 0; k < 8; k++) {
      const a = k / 8 * Math.PI * 2, dir = new THREE.Vector3(Math.sin(a), 0, Math.cos(a)); const p = base.clone().add(new THREE.Vector3(0, c.spec.H * hf, 0));
      for (const D of [2.5, 6]) { rc.set(p.clone().addScaledVector(dir, D), dir.clone().negate()); rc.far = D; const hit = rc.intersectObjects(others, false)[0];
        if (hit && D - hit.distance < R) { out.push(`${name} h${hf} by ${owner.get(hit.object) || hit.object.geometry?.type} depth ${(R - (D - hit.distance)).toFixed(2)}`); break; } }
    }
  }
  return { f, t: +t.toFixed(2), shot: seg.shot, k: seg.k, issues: [...new Set(out)] };
};

import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { buildHall, buildWorld, buildCutaway, MOUNT } from './sets.js';
import { buildShots } from './shots.js';

const W = 720, H = 1280, FPS = 30;
const WHIP = 0; // hard cuts (sub-frame whip blur produced ghosting)

const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true, logarithmicDepthBuffer: true });
renderer.setSize(W, H); renderer.setPixelRatio(1);
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.NeutralToneMapping; renderer.outputColorSpace = THREE.SRGBColorSpace;
document.body.appendChild(renderer.domElement);
const camera = new THREE.PerspectiveCamera(40, W / H, 0.2, 4000);
const composer = new EffectComposer(renderer);
const renderPass = new RenderPass(new THREE.Scene(), camera); composer.addPass(renderPass);
const bloom = new UnrealBloomPass(new THREE.Vector2(W / 2, H / 2), 0.32, 0.55, 0.86); composer.addPass(bloom);
composer.addPass(new OutputPass());
const acc = document.createElement('canvas'); acc.width = W; acc.height = H; const actx = acc.getContext('2d');

let sets, segs, timeline, envTex;

window.setup = async () => {
  timeline = await (await fetch('build/timeline.json')).json();
  const pmrem = new THREE.PMREMGenerator(renderer);
  envTex = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  // Fixed build order keeps seeded randomness identical across render workers.
  sets = { hall: buildHall(), world: buildWorld(), cut: buildCutaway() };
  // Reflections only on metals; everything else is lit purely by each scene's own lights.
  for (const s of Object.values(sets)) s.scene.traverse((o) => { for (const m of [].concat(o.material || [])) if (m.metalness > 0.3) { m.envMap = envTex; m.envMapIntensity = 0.7; m.needsUpdate = true; } });
  const norm = (w) => w.toLowerCase();
  const T = {
    MOUNT,
    word(shot, word, nth = 1) {
      let n = 0;
      for (const ln of timeline.lines) if (ln.shot === shot) for (const w of ln.words) if (norm(w.w) === norm(word) && ++n === nth) return w.start;
      throw new Error(`word not found: ${shot}/${word}`);
    },
    words(shot, from, to) { // narration words of a shot from word `from` to word `to` (inclusive) -> lip-sync track
      const all = timeline.lines.filter((l) => l.shot === shot).flatMap((l) => l.words);
      const i = all.findIndex((x) => norm(x.w) === norm(from)); const j = all.findIndex((x, k) => k >= i && norm(x.w) === norm(to));
      if (i < 0 || j < 0) throw new Error(`words not found: ${shot}/${from}..${to}`);
      return all.slice(i, j + 1);
    },
  };
  const S = buildShots(T);
  segs = [];
  timeline.shots.forEach((sh, si) => {
    const list = S[sh.name](sh.start, sh.dur);
    list.forEach((sg, k) => {
      const start = sh.start + Math.max(0, sg.at);
      const end = k + 1 < list.length ? sh.start + list[k + 1].at : sh.end;
      segs.push({ ...sg, shot: sh.name, si, k, list, start, end, first: k === 0, last: k === list.length - 1 });
    });
  });
  return { duration: timeline.duration, frames: Math.ceil(timeline.duration * FPS), segs: segs.map((s) => [s.shot, s.k, +s.start.toFixed(2), +s.end.toFixed(2)]) };
};

function resetSet(name) {
  const s = sets[name];
  Object.values(s.cast || {}).forEach((c) => { c.root.visible = false; c.reset(); });
  if (name === 'world') {
    s.boat.visible = s.cart.visible = s.flood.visible = s.storm.visible = s.portc.visible = s.rope.visible = false;
    s.lantern.intensity = 0; s.rig.setStrikes([]); s.rig.continuous = null; s.rig.group.position.set(4.6, 0, -7);
  }
  if (name === 'hall') s.feast.visible = false;
  if (name === 'cut') { s.rig.setStrikes([]); s.rig.continuous = null; }
}

let active = null;
function activate(seg) {
  if (active === seg) return;
  // Re-run inits from the start of this shot so any worker can start mid-shot deterministically.
  let lastSet = null;
  for (let k = 0; k <= seg.k; k++) {
    const sg = seg.list[k];
    if (sg.set !== lastSet) { resetSet(sg.set); lastSet = sg.set; }
    if (sg.set === 'world') sets.world.setLight(sg.light, sg.focus || new THREE.Vector3());
    sg.init?.(sets[sg.set]);
  }
  active = seg;
}

function segAt(t) { let s = segs[0]; for (const sg of segs) if (t >= sg.start) s = sg; return s; }

function poseCamera(seg, t) {
  const lt = t - seg.start, u = Math.min(1, lt / Math.max(0.01, seg.end - seg.start));
  const c = seg.cam(lt, u);
  camera.position.copy(c.p); camera.fov = c.fov; camera.updateProjectionMatrix();
  // gentle "handheld" float so nothing is ever perfectly static
  camera.position.x += Math.sin(t * 0.9) * 0.02; camera.position.y += Math.sin(t * 1.3 + 1) * 0.015;
  camera.lookAt(c.l);
  // whip pan into/out of line changes
  let whip = 0; const dir = seg.si % 2 ? 1 : -1;
  if (seg.last && seg.si < timeline.shots.length - 1 && t > seg.end - WHIP) whip = dir * ((t - (seg.end - WHIP)) / WHIP) ** 2;
  if (seg.first && seg.si > 0 && t < seg.start + WHIP) whip = (seg.si % 2 ? -1 : 1) * -((1 - (t - seg.start) / WHIP) ** 2);
  if (whip) camera.rotateY(whip * 0.8);
  return { lt, u, whip };
}

function renderOnce(t, forced) {
  const seg = forced || segAt(t); activate(seg);
  const set = sets[seg.set];
  const { u } = poseCamera(seg, t);
  if (seg.tick) seg.tick(set, t, u); else if (seg.inherit) for (let k = seg.k - 1; k >= 0; k--) { const sg = seg.list[k]; if (sg.tick && sg.set === seg.set) { sg.tick(set, t, u); break; } }
  set.update(t, camera);
  renderer.toneMappingExposure = seg.set === 'world' ? (sets.world.exposure || 1) * 0.92 : 0.95;
  renderPass.scene = set.scene;
  composer.render();
  return seg;
}

const DISSOLVE = 4 / FPS; // the reference cuts with 3-5 frame cross-dissolves while the camera keeps moving
function speedLines(t, k) { // white radial streaks for sudden moves (deterministic per frame)
  const n = 26; actx.save(); actx.translate(W / 2, H * 0.45);
  for (let i = 0; i < n; i++) {
    const h = Math.sin(i * 91.7 + Math.floor(t * 30) * 13.3) * 43758.5453; const r = h - Math.floor(h);
    const a = (i / n) * Math.PI * 2 + r * 0.2; const r0 = 260 + r * 160, r1 = r0 + 160 + r * 260;
    actx.strokeStyle = `rgba(255,255,255,${0.55 * k})`; actx.lineWidth = 2 + r * 4;
    actx.beginPath(); actx.moveTo(Math.cos(a) * r0, Math.sin(a) * r0 * 1.6); actx.lineTo(Math.cos(a) * r1, Math.sin(a) * r1 * 1.6); actx.stroke();
  }
  actx.restore();
}

window.renderFrame = (f) => {
  const t = f / FPS;
  const seg = segAt(t);
  actx.globalAlpha = 1;
  if (seg.first && seg.si > 0 && t - seg.start < DISSOLVE) {
    const prev = segs[segs.indexOf(seg) - 1];
    renderOnce(t, prev); actx.drawImage(renderer.domElement, 0, 0);
    renderOnce(t, seg); actx.globalAlpha = (t - seg.start + 1 / FPS) / (DISSOLVE + 1 / FPS); actx.drawImage(renderer.domElement, 0, 0); actx.globalAlpha = 1;
  } else { renderOnce(t, seg); actx.drawImage(renderer.domElement, 0, 0); }
  const sp = seg.speed || seg.list[0].speed;
  if (sp && t >= sp[0] && t < sp[1]) speedLines(t, Math.sin(Math.PI * (t - sp[0]) / (sp[1] - sp[0])));
  return acc.toDataURL('image/jpeg', 0.93);
};
window.ready = true;
window.debugRay = (f) => {
  window.renderFrame(f);
  const rc = new THREE.Raycaster(); rc.setFromCamera(new THREE.Vector2(0, 0), camera);
  const set = sets[active.set];
  return rc.intersectObjects(set.scene.children, true).slice(0, 4).map((h) => `${h.object.type} ${h.object.geometry?.type} d=${h.distance.toFixed(2)} pos=${h.object.getWorldPosition(new THREE.Vector3()).toArray().map((v) => v.toFixed(1))}`);
};

// ---- QA: does any visible character overlap scene geometry (or another character)? Is the camera inside something?
window.clipCheck = (f) => {
  const t = f / FPS; const seg = segAt(t); renderOnce(t, seg);
  const set = sets[seg.set]; const out = [];
  const rc = new THREE.Raycaster();
  const solids = []; set.scene.traverse((o) => { if (o.isMesh && o.visible && !o.userData.noCollide && !(o.material && (o.material.transparent || o.material.blending === THREE.AdditiveBlending))) { let p = o, vis = true; while (p) { if (!p.visible) { vis = false; break; } p = p.parent; } if (vis) solids.push(o); } });
  const owner = new Map(); for (const [n, c] of Object.entries(set.cast || {})) c.root.traverse((o) => owner.set(o, n));
  for (const [name, c] of Object.entries(set.cast || {})) {
    if (!c.root.visible) continue;
    const others = solids.filter((o) => owner.get(o) !== name && !(o.parent && o.parent.isMesh && owner.get(o.parent) === name));
    const base = c.root.getWorldPosition(new THREE.Vector3()); const R = c.spec.width * c.u * 0.95 + 0.05;
    for (const hf of [0.3, 0.55, 0.8]) for (let k = 0; k < 8; k++) {
      const a = k / 8 * Math.PI * 2, dir = new THREE.Vector3(Math.sin(a), 0, Math.cos(a));
      const p = base.clone().add(new THREE.Vector3(0, c.spec.H * hf, 0));
      for (const D of [2.5, 7]) {
        rc.set(p.clone().addScaledVector(dir, D), dir.clone().negate()); rc.far = D;
        const hit = rc.intersectObjects(others, false)[0];
        if (hit && D - hit.distance < R) { out.push(`${name} h${hf} by ${owner.get(hit.object) || hit.object.geometry?.type} @(${hit.point.toArray().map((v) => v.toFixed(1))}) depth ${(R - (D - hit.distance)).toFixed(2)}`); break; }
      }
    }
  }
  // camera inside geometry: cast rays out in 6 directions; if most hit back-faces nearby it is enclosed
  const cp = camera.position.clone(); let enclosed = 0;
  for (const d of [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]]) { rc.set(cp, new THREE.Vector3(...d)); rc.far = 0.6; if (rc.intersectObjects(solids, false).length) enclosed++; }
  if (enclosed >= 2) out.push(`camera near/inside geometry (${enclosed}/6 within 0.6)`);
  return { f, t: +t.toFixed(2), shot: seg.shot, k: seg.k, issues: [...new Set(out)] };
};

import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { buildHall, buildWorld, buildCutaway, MOUNT } from './sets.js';
import { buildShots } from './shots.js';

const W = 720, H = 1280, FPS = 30;
const WHIP = 0.14; // seconds of whip-pan on each side of a line change

const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
renderer.setSize(W, H); renderer.setPixelRatio(1);
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.NeutralToneMapping; renderer.outputColorSpace = THREE.SRGBColorSpace;
document.body.appendChild(renderer.domElement);
const camera = new THREE.PerspectiveCamera(40, W / H, 0.1, 4000);
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
  Object.values(s.cast || {}).forEach((c) => { c.group.visible = false; c.set({ talking: false, run: false, shake: 0 }); });
  if (name === 'world') {
    s.boat.visible = s.cart.visible = s.flood.visible = s.storm.visible = s.portc.visible = false;
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

function renderOnce(t) {
  const seg = segAt(t); activate(seg);
  const set = sets[seg.set];
  const { u, whip } = poseCamera(seg, t);
  // latest tick defined in this shot up to the current segment
  if (seg.tick) seg.tick(set, t, u); else if (seg.inherit) for (let k = seg.k - 1; k >= 0; k--) { const sg = seg.list[k]; if (sg.tick && sg.set === seg.set) { sg.tick(set, t, u); break; } }
  set.update(t, camera);
  renderer.toneMappingExposure = seg.set === 'world' ? (sets.world.exposure || 1) * 0.92 : 0.95;
  renderPass.scene = set.scene;
  composer.render();
  return whip;
}

window.renderFrame = (f) => {
  const t = f / FPS;
  const whip = renderOnce(t);
  if (!whip) return renderer.domElement.toDataURL('image/jpeg', 0.93);
  // motion blur for whip pans: average sub-frames across the shutter
  const N = 6;
  actx.globalAlpha = 1; actx.clearRect(0, 0, W, H);
  for (let i = 0; i < N; i++) {
    renderOnce(t + (i / N) * (1 / FPS) * 1.4);
    actx.globalAlpha = 1 / (i + 1); actx.drawImage(renderer.domElement, 0, 0);
  }
  return acc.toDataURL('image/jpeg', 0.93);
};
window.ready = true;
window.debugRay = (f) => {
  window.renderFrame(f);
  const rc = new THREE.Raycaster(); rc.setFromCamera(new THREE.Vector2(0, 0), camera);
  const set = sets[active.set];
  return rc.intersectObjects(set.scene.children, true).slice(0, 4).map((h) => `${h.object.type} ${h.object.geometry?.type} d=${h.distance.toFixed(2)} pos=${h.object.getWorldPosition(new THREE.Vector3()).toArray().map((v) => v.toFixed(1))}`);
};

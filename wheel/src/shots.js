// "The kid who built a wheel" (90 s). Camera grammar (user direction): one continuous move inside each scene
// (segments in the same set glide into each other), zoom-through between scenes, a whip + motion blur only where
// the action motivates it ('whip'), and three hard cuts for comedy punches ('cut').
import * as THREE from 'three';
import { roadY } from './sets.js';
const V = (x, y, z) => new THREE.Vector3(x, y, z);
const lerp = (a, b, u) => a + (b - a) * u;
export const ease = (u) => 0.5 - 0.5 * Math.cos(Math.PI * Math.min(1, Math.max(0, u)));
const ramp = (t, a, b) => Math.min(1, Math.max(0, (t - a) / (b - a)));
const outExpo = (u) => (u >= 1 ? 1 : 1 - Math.pow(2, -9 * u));
const path = (keys) => (lt, u) => { let i = 0; while (i < keys.length - 2 && u > keys[i + 1][0]) i++;
  const [u0, p0, l0, f0] = keys[i], [u1, p1, l1, f1] = keys[Math.min(i + 1, keys.length - 1)]; const k = ease((u - u0) / Math.max(1e-6, u1 - u0));
  return { p: p0.clone().lerp(p1, k), l: l0.clone().lerp(l1, k), fov: lerp(f0, f1 ?? f0, k) }; };
const move = (p0, l0, p1, l1, f0 = 40, f1 = f0) => path([[0, p0, l0, f0], [1, p1, l1, f1]]);
const yawTo = (from, to) => Math.atan2(to.x - from.x, to.z - from.z);
function show(c, pos, face, keys = [], words = null) { c.root.visible = true; c.reset(); c.place(pos, typeof face === 'number' ? face : yawTo(pos, face)); c.act(keys); if (words) c.say(words); return c; }
const handW = (c, side = 'R') => c.torso.localToWorld((side === 'R' ? c.handR : c.handL).clone());
const topOf = (c) => c.root.position.clone().add(V(0, c.spec.H + 0.15, 0));
const track = (f) => { f.track = true; return f; }; // camera reads live positions (subject placed before the camera)

// close-up that frames a character's live head at a target size (fraction of frame height).
// az = angle off the face direction, el = elevation, dy = aim below the head (head radii), hk = 1 centres on the head itself
const CU = (who, { az = 0.4, el = 0.08, frac = 0.36, fov = 32, drift = 0.1, dy = 0.8, yaw = null, hk = 0.5 } = {}) => track((lt, u, t, set) => {
  const c = set.cast[who]; c.root.updateMatrixWorld(true); const hw = c.head.getWorldPosition(V(0, 0, 0)); const r = c.root.position; const h = V(r.x * (1 - hk) + hw.x * hk, hw.y, r.z * (1 - hk) + hw.z * hk); const hr = c.hr;
  const d = hr / (frac * Math.tan(fov * Math.PI / 360)); const a = (yaw ?? c.facing) + az + drift * (u - 0.5);
  return { p: V(h.x + Math.sin(a) * Math.cos(el) * d, h.y + Math.sin(el) * d, h.z + Math.cos(a) * Math.cos(el) * d), l: V(h.x, h.y - dy * hr, h.z), fov };
});

export function buildShots(T) {
  const S = {}; const w = (shot, word, n = 1) => T.word(shot, word, n);
  const all = (shot) => T.shotWords(shot);
  const at = (s0, t, lead = 0.1) => t - s0 - lead; // segment start (shot-relative) a beat before a word

  // 1. HOOK: the most illegal object on Earth (the boss's coffee table, glass top hidden)
  const wheelMacro = (lt, u) => { const a = lerp(-0.6, 0.25, ease(u)); const r = lerp(2.2, 1.8, ease(u)); return { p: V(Math.sin(a) * r, 1.95 - 0.15 * u, -0.4 + Math.cos(a) * r), l: V(0, 0.42, -0.4), fov: 40, roll: 0.1 }; };
  const topSpin = (lt, u) => { const a = 0.4 + u * 0.9; return { p: V(Math.sin(a) * 0.35, 2.3 - 0.2 * u, -0.4 + Math.cos(a) * 0.35), l: V(0, 0.42, -0.4), fov: 42, roll: a }; };
  const tableOnly = (L) => { L.table.visible = true; L.cup.visible = false; L.cart.visible = false; L.gold.visible = false; L.table.userData.top.visible = false; };
  S.hook = (s0) => [
    { at: 0, set: 'lobby', init: tableOnly, cam: wheelMacro },
    { at: at(s0, w('hook', 'object')), set: 'lobby', cam: topSpin },
  ];

  // 2. STREET: everything is carried - groceries, sofa, piano... grandpa (sitting on the sofa)
  S.street = (s0, d) => {
    const rows = [['p1', -0.55, -13.5, 'piano'], ['p2', 0.55, -13.5, 'piano'], ['p3', -0.6, -9, 'sofa'], ['p4', 0.6, -9, 'sofa'], ['p5', 0, -17.5, 'fridge'], ['p6', -1.7, -11, 'groceries'], ['p7', 1.6, -15, 'crateB'], ['p8', -2.3, -19, 'crateC'], ['p9', 2.2, -12, 'crateD'], ['p10', -1.4, -16, 'crateE']];
    const speed = 1.1;
    const init = (St) => { ['piano', 'sofa', 'fridge', 'groceries', 'crateB', 'crateC', 'crateD', 'crateE'].forEach((k) => (St.P[k].visible = true));
      rows.forEach(([n, x, z], i) => show(St.cast[n], V(x, 0, z), 0, [{ t: s0 - 1, expr: i < 4 ? 'worried' : (i % 2 ? 'focus' : 'worried'), pose: 'raise', sweat: i < 5, bounce: 0.35 }]).groove(all('street'), 0.6)
        .walk({ t0: s0 - 0.6, t1: s0 + d + 1, from: V(x, 0, z), to: V(x, 0, z + (d + 1.6) * speed), mode: 'waddle', ease: false }));
      show(St.cast.grandpa, V(0, 2.4, -9), 0, [{ t: s0 - 1, expr: 'content', sit: 0.45, pose: 'cross' }, { t: w('street', 'grandpa.') - 0.15, expr: 'happy', pose: 'wave', squash: 1 }, { t: w('street', 'Carrying') + 0.3, expr: 'smug', pose: 'cross' }]); };
    const post = (St) => { const load = (a, b, prop, dy = 0.05) => { const pa = topOf(St.cast[a]), pb = b ? topOf(St.cast[b]) : pa; St.P[prop].position.copy(pa.add(pb).multiplyScalar(0.5)).add(V(0, dy, 0)); St.P[prop].rotation.set(Math.sin(St.cast[a].root.position.z * 2) * 0.04, b ? 0 : Math.PI / 2, 0); };
      load('p1', 'p2', 'piano'); load('p3', 'p4', 'sofa'); load('p5', null, 'fridge', -0.1); load('p6', null, 'groceries'); load('p7', null, 'crateB'); load('p8', null, 'crateC'); load('p9', null, 'crateD'); load('p10', null, 'crateE');
      St.cast.grandpa.root.position.copy(St.P.sofa.position).add(V(0, 0.42, 0.05)); };
    return [
      { at: 0, set: 'street', init, post, cam: move(V(0.8, 1.2, -1.5), V(0, 2.0, -12), V(0.5, 1.4, -3.2), V(0, 2.2, -12), 46, 42) },
      // one continuous glide past each thing as it is named: groceries -> sofa -> piano -> up to grandpa on the sofa
      { at: at(s0, w('street', 'groceries.'), 0.35), set: 'street', post, cam: track((lt, u, t, St) => {
        const P = St.P; St.cast.grandpa.root.updateMatrixWorld(true); const pts = [[w('street', 'groceries.'), P.groceries.position, 2.6], [w('street', 'sofa.'), P.sofa.position, 3.0], [w('street', 'piano.'), P.piano.position, 3.2], [w('street', 'grandpa.') + 0.1, St.cast.grandpa.head.getWorldPosition(V(0, 0, 0)), 1.9]];
        let i = 0; while (i < pts.length - 2 && t > pts[i + 1][0]) i++; const [ta, A, da] = pts[i], [tb, B, db] = pts[i + 1]; const k = ease((t - ta) / (tb - ta));
        const tgt = A.clone().lerp(B, k); const dist = lerp(da, db, k); const off = V(-0.62, 0.22, 0.75).normalize().multiplyScalar(dist);
        return { p: tgt.clone().add(off), l: tgt.clone().add(V(0, -0.15, 0)), fov: 38 }; }) },
      { at: at(s0, w('street', 'Carrying')), set: 'street', post, cam: track((lt, u, t, St) => { const z = St.cast.p3.root.position.z; return { p: V(1.6, 1.6, z + 4.5), l: V(0, 2.0, z), fov: 46 }; }) },
      { at: at(s0, w('street', 'Half')), set: 'street', post, cam: move(V(-1.2, 3.2, 4.0), V(0, 3.5, -20), V(-0.6, 5.2, 2.5), V(0, 6.0, -24), 52, 50) },
    ]; };

  // 3. KID: one kid, really tired of carrying (a crate bigger than he is)
  S.kid = (s0, d) => { const tc = w('kid', 'crate.'), tb = w('kid', 'back.');
    const init = (St) => { St.P.bigCrate.visible = true; ['crateB', 'crateC'].forEach((k) => (St.P[k].visible = true));
      show(St.cast.kid, V(0, 0, -1.5), 0, [{ t: s0 - 1, expr: 'sad', pose: 'raise', sweat: true, bounce: 0.25, headTilt: -6 }, { t: w('kid', 'really'), squash: 1, expr: 'bored' }, { t: tc - 0.1, expr: 'sad', squash: 1 }, { t: tb - 0.3, pose: 'hips', lean: 16, expr: 'worried', headTilt: 12, squash: 1 }])
        .walk({ t0: s0 - 0.3, t1: tb - 0.3, from: V(0, 0, -1.5), to: V(0, 0, -1.5 + (tb - s0) * 0.55), mode: 'waddle', ease: false });
      [['p7', -5, -6, 'crateB'], ['p8', 5, -8, 'crateC']].forEach(([n, x, z]) => show(St.cast[n], V(x, 0, z), x < 0 ? Math.PI / 2 : -Math.PI / 2, [{ t: s0 - 1, expr: 'focus', pose: 'raise', bounce: 0.3 }])
        .walk({ t0: s0 - 1, t1: s0 + d + 1, from: V(x, 0, z), to: V(-x, 0, z), mode: 'waddle', ease: false })); };
    const post = (St) => { { const k = St.cast.kid; k.root.updateMatrixWorld(true); St.P.bigCrate.position.copy(k.head.getWorldPosition(V(0, 0, 0))).add(V(0, k.hr * 0.85, 0)); } St.P.bigCrate.rotation.set(0, 0.1, Math.sin(St.cast.kid.root.position.z * 3) * 0.05);
      St.P.crateB.position.copy(topOf(St.cast.p7)); St.P.crateC.position.copy(topOf(St.cast.p8)); };
    return [
      { at: 0, set: 'street', trans: 'zoom', init, post, cam: track((lt, u, t, St) => { const z = St.cast.kid.root.position.z; return { p: V(0.9, 1.5, z + lerp(6, 4.2, ease(u))), l: V(0, 1.5, z), fov: 44 }; }) },
      { at: at(s0, tc, 0.7), set: 'street', post, cam: CU('kid', { az: 0.3, frac: 0.34, dy: 0.4, el: 0.06 }) },
      { at: at(s0, tb, 0.4), set: 'street', post, cam: CU('kid', { az: 1.3, frac: 0.3, dy: 1.2, hk: 1 }) },
    ]; };

  // 4. SHED: square (doesn't roll), triangle (rolls once, onto his foot), attempt #47... round
  S.shed = (s0, d) => { const tq = w('shed', 'square.'), tr = w('shed', 'roll.'), tt = w('shed', 'triangle.'), th = w('shed', 'hurt.'), ta = w('shed', 'Attempt'), to = w('shed', 'round.'), ttr = w('shed', 'tried');
    const tilt = (t) => ease(ramp(t, tr - 0.35, tr + 0.05)); // the square tips over flat
    const tri = (t) => ease(ramp(t, th - 0.55, th - 0.05)); // the triangle rolls one face toward his foot
    const roll = (t) => ease(ramp(t, to - 0.2, to + 1.2));
    const tick = (Sh, t) => {
      Sh.square.visible = t < tt - 0.2; Sh.square.position.set(-0.4, 0.38 - 0.33 * tilt(t), 0.9 - 0.33 * tilt(t)); Sh.square.rotation.set(-Math.PI / 2 * tilt(t), 0, 0);
      const k = tri(t); Sh.tri.visible = t >= tt - 0.2 && t < ta; Sh.tri.position.set(lerp(-0.4, -1.05, k), 0.2 + 0.12 * Math.sin(Math.PI * k), 0.9); Sh.tri.rotation.set(Math.PI / 2, 0, Math.PI / 2 + (2 * Math.PI / 3) * k);
      const r = roll(t); Sh.wheel.visible = t >= ta - 0.2; const p0 = V(-0.5, 0.45, 0.6), p1 = V(-0.3, 0.45, 2.3); Sh.wheel.position.lerpVectors(p0, p1, r); Sh.wheel.rotation.set(0, Math.PI / 2, (r * p0.distanceTo(p1)) / 0.45);
      Sh.hammer.visible = t < ttr - 0.3; };
    const init = (Sh) => { show(Sh.cast.kid, V(-0.4, 0, -1.8), 0, [
      { t: s0 - 1, expr: 'focus', work: 'hammer', lean: 8 },
      { t: ttr - 0.2, work: null, pose: 'present', expr: 'hopeful', look: V(-0.4, 0.4, 0.9) },
      { t: tr - 0.1, expr: 'bored', pose: 'shrug', squash: 1 },
      { t: tt - 0.1, expr: 'hopeful', pose: 'present', look: V(-0.6, 0.2, 0.9) },
      { t: th - 0.05, expr: 'shock', pose: 'raise', squash: 1, bounce: 1, sweat: true },
      { t: ta - 0.1, expr: 'focus', pose: 'idle', bounce: 0, look: 'camera', sweat: false },
      { t: to - 0.1, expr: 'laugh', pose: 'raise', squash: 1, bounce: 0.6 }])
      .walk({ t0: ttr - 0.6, t1: ttr + 0.1, from: V(-0.4, 0, -1.8), to: V(-1.4, 0, 0.75), mode: 'walk', ease: true }); };
    return [
      { at: 0, set: 'shed', trans: 'zoom', init, tick, post(Sh) { if (Sh.hammer.visible) { Sh.hammer.position.copy(handW(Sh.cast.kid)).add(V(0, 0.1, 0)); Sh.hammer.rotation.set(0, 0, -0.6); } },
        cam: CU('kid', { az: 0.3, frac: 0.3, dy: 1.5, el: 0.12 }) },
      { at: at(s0, tq, 0.4), set: 'shed', tick, cam: move(V(-0.85, 1.5, 4.2), V(-1.0, 0.85, 0.8), V(-0.9, 1.4, 3.8), V(-1.0, 0.85, 0.8), 44, 42) },
      { at: at(s0, th, 0.35), set: 'shed', tick, cam: CU('kid', { yaw: 0.6, az: 0, frac: 0.36, hk: 1 }) },
      { at: at(s0, ta, 0.15), set: 'shed', tick, cam: move(V(1.2, 2.6, 1.6), V(1.2, 3.0, -2.9), V(1.1, 2.9, 0.6), V(1.2, 3.1, -2.9), 40, 34) },
      { at: at(s0, to, 0.25), set: 'shed', tick, cam: (lt, u) => ({ p: V(-0.1, 0.6, 3.6 - 0.3 * u), l: V(-0.5, 0.75, 0.4), fov: 44 }) },
    ]; };

  // 5. CART: his whole house in one trip; CUT on "before breakfast" to ten porters dropping their crates
  S.cart = (s0, d) => { const tm = w('cart', 'moved'), tt = w('cart', 'ten'), tbf = w('cart', 'breakfast.');
    const porters = [['p1', -2.6, -2], ['p2', -2.6, -4], ['p3', -2.6, -6], ['p4', -2.6, -8], ['p5', -2.6, -10], ['p6', 2.6, -3], ['p7', 2.6, -5], ['p8', 2.6, -7], ['p9', 2.6, -9], ['p10', 2.6, -11]];
    const kz = (t) => -16 + (t - s0) * 2.2;
    const tick = (St, t) => { const z = kz(t); const c = St.P.cart; c.position.set(0, 0, z + 1.7); c.rotation.y = Math.PI / 2; c.userData.wheels.forEach((wh) => (wh.rotation.z = -(z) / 0.3));
      St.P.cSofa.position.set(0, 0.88, z + 2.0); St.P.cSofa.rotation.y = Math.PI / 2; St.P.cFridge.position.set(0.35, 1.25, z + 1.75); St.P.cPiano.position.set(-0.2, 1.23, z + 2.3); St.P.cPiano.rotation.y = Math.PI / 2; St.P.cPiano.scale.setScalar(0.55); };
    const crates = ['crateA', 'crateB', 'crateC', 'crateD', 'crateE'];
    const post = (St, t) => { porters.forEach(([n], i) => { if (i >= 5) return; const cr = St.P[crates[i]]; const top = topOf(St.cast[n]);
      const drop = ramp(t, tbf - 0.1 + i * 0.05, tbf + 0.35 + i * 0.05); cr.position.copy(top).add(V(0, -(top.y - 0.25) * drop * drop, 0.3 * drop)); cr.rotation.z = drop * 0.5 * (i % 2 ? 1 : -1); }); };
    const init = (St) => { ['cart', 'cSofa', 'cFridge', 'cPiano', ...crates].forEach((k) => (St.P[k].visible = true));
      show(St.cast.kid, V(0, 0, -16), 0, [{ t: s0 - 1, expr: 'happy', work: 'push', bounce: 0.3 }, { t: tm + 0.2, look: 'camera', expr: 'laugh', squash: 1 }, { t: w('cart', 'trip.') + 0.2, look: null, expr: 'happy' }]).groove(all('cart'), 0.8)
        .walk({ t0: s0 - 0.1, t1: s0 + d + 1, from: V(0, 0, -16), to: V(0, 0, -16 + (d + 1.1) * 2.2), mode: 'walk', ease: false });
      porters.forEach(([n, x, z], i) => show(St.cast[n], V(x, 0, z), x < 0 ? Math.PI / 2 : -Math.PI / 2, [{ t: s0 - 1, expr: 'focus', pose: i < 5 ? 'raise' : 'idle', sweat: true }, { t: tt - 0.1 + i * 0.04, expr: 'shock', look: V(0, 1.4, kz(tt) - 1.5), squash: 1 }, { t: tbf + 0.25 + i * 0.05, expr: 'sad', pose: 'idle', headTilt: -10 }]).groove(all('cart'), 0.4)); };
    return [
      { at: 0, set: 'street', trans: 'zoom', init, tick, post, cam: track((lt, u, t) => { const z = kz(t); return { p: V(-2.0, 1.55, z - 0.9), l: V(0, 1.05, z + 0.5), fov: 50 }; }) },
      { at: at(s0, tm), set: 'street', tick, post, cam: CU('kid', { yaw: 0, az: -1.55, frac: 0.34, el: 0.12, hk: 1 }) },
      { at: at(s0, w('cart', 'trip.')), set: 'street', tick, post, cam: move(V(-0.4, 1.7, 1.8), V(-1.0, 1.4, -8), V(-0.3, 1.7, 1.4), V(-1.0, 1.4, -7), 44, 40) },
      { at: at(s0, tt), set: 'street', tick, post, cam: CU('p9', { yaw: -Math.PI / 2, az: 0.3, frac: 0.36 }) },
      { at: at(s0, w('cart', 'before'), 0.05), set: 'street', trans: 'cut', tick, post, cam: move(V(-1.2, 2.3, 2.8), V(-2.6, 1.3, -6), V(-1.15, 2.2, 2.2), V(-2.6, 1.3, -6), 44, 40) },
    ]; };

  // 6. GUILD: emergency meeting - pianos would roll, grandpas would roll... the boss went red
  const crowd = [['u1', -2.4, 1.2], ['u2', -0.8, 1.0], ['u3', 0.8, 1.1], ['u4', 2.4, 1.3], ['u5', -1.6, 2.6], ['u6', 0.0, 2.5], ['u7', 1.6, 2.7]];
  const banners = (R) => { R.wheel.visible = false; crowd.forEach(([n], i) => { if (i >= 6) return; const b = R.banners[i]; b.position.copy(handW(R.cast[n])).add(V(0, 0.1, 0)); b.rotation.y = Math.PI; }); };
  S.guild = (s0, d) => { const tj = w('guild', 'jobs.'), tp = w('guild', 'Pianos'), tg = w('guild', 'Grandpas'), tn = w('guild', 'Nobody'), tr = w('guild', 'red.');
    const init = (R) => {
      show(R.cast.boss, V(0.9, 1.12, -3.6), 0, [{ t: s0 - 1, expr: 'worried', pose: 'gesture' }, { t: w('guild', 'If') - 0.1, expr: 'angry', pose: 'point', squash: 1 }, { t: tj - 0.1, pose: 'raise', squash: 1, tint: 0.3 },
        { t: tp - 0.1, expr: 'shock', pose: 'gesture', tint: 0.5 }, { t: tn - 0.1, expr: 'angry', pose: 'idle', tint: 0.7, lean: 6 }, { t: tr - 0.1, tint: 1.0, steam: true, squash: 1, pose: 'raise', work: 'shake' }]).groove(all('guild'), 1);
      crowd.forEach(([n, x, z], i) => show(R.cast[n], V(x, 0, z), Math.PI, [{ t: s0 - 1, expr: 'worried', pose: 'raise' }, { t: tj + i * 0.04, expr: 'shock', squash: 1, pose: 'cower' }, { t: tp + i * 0.05, expr: 'panic', squash: 1 }, { t: tg + i * 0.05, expr: 'shock', squash: 1, lean: -8 }, { t: tr + i * 0.04, expr: 'shock', lean: -12, pose: 'cower', squash: 1 }]).groove(all('guild'), 0.8)); };
    return [
      { at: 0, set: 'rally', trans: 'zoom', init, post: banners, cam: move(V(-0.6, 2.4, 6.0), V(0.6, 2.4, -3.6), V(-0.3, 2.3, 4.4), V(0.7, 2.4, -3.6), 48, 44) },
      { at: at(s0, w('guild', 'If')), set: 'rally', post: banners, cam: CU('boss', { az: 0.35, el: -0.12, frac: 0.36 }) },
      { at: at(s0, w('guild', 'half')), set: 'rally', post: banners, cam: move(V(-1.0, 2.9, -5.0), V(0, 1.7, 2.0), V(-0.8, 2.8, -4.4), V(0, 1.7, 2.0), 50, 46) },
      { at: at(s0, tp), set: 'rally', post: banners, cam: CU('u2', { az: 0.3, frac: 0.34, el: 0.1 }) },
      { at: at(s0, tg), set: 'rally', post: banners, cam: CU('u3', { az: -0.35, frac: 0.36, el: 0.1 }) },
      { at: at(s0, tn), set: 'rally', post: banners, cam: CU('boss', { az: -0.3, el: -0.05, frac: 0.36, drift: 0.2 }) },
      { at: at(s0, tr, 0.3), set: 'rally', post: banners, cam: CU('boss', { az: 0.1, el: -0.05, frac: 0.5 }) },
    ]; };

  // 7. BOUNTY: a price on his head - CUT to the WANTED poster
  S.bounty = (s0, d) => { const tp = w('bounty', 'price');
    const init = (R) => { show(R.cast.boss, V(0.9, 1.12, -3.6), 0, [{ t: s0 - 1, expr: 'evil', pose: 'point', tint: 0.4, look: 'camera' }]).groove(all('bounty'), 1);
      crowd.forEach(([n, x, z]) => show(R.cast[n], V(x, 0, z), Math.PI, [{ t: s0 - 1, expr: 'angry', pose: 'raise', work: 'shake' }]).groove(all('bounty'), 0.8)); };
    return [
      { at: 0, set: 'rally', init, post: banners, cam: CU('boss', { az: 0.25, el: -0.08, frac: 0.4 }) },
      { at: at(s0, tp, 0.05), set: 'rally', trans: 'cut', post: banners, cam: move(V(0, 3.4, 0.9), V(0, 3.4, -5.4), V(0, 3.4, -0.7), V(0, 3.4, -5.4), 44, 40) },
    ]; };

  // 8-9. CHASE + HILL: porters from every street; he rolled - down the steepest hill (shared, continuous world state)
  const VMAX = 11, ACC = 9, V0 = 3, TA = (VMAX - V0) / ACC, PA = V0 * TA + 0.5 * ACC * TA * TA;
  const tr = () => w('chase', 'rolled.');
  const cartZ = (t) => { const a = Math.max(0, t - tr()); return -6 - (a < TA ? V0 * a + 0.5 * ACC * a * a : PA + VMAX * (a - TA)); };
  const runners = [['c1', -1.2], ['c2', 1.0], ['c3', -0.4], ['c4', 1.8], ['c5', -2.0], ['c6', 0.4], ['c7', -2.6], ['c8', 2.6], ['c9', -1.6], ['c10', 2.0], ['c11', -0.2], ['c12', 1.4]];
  const RUN = 3.8;
  const chaseInit = (C, s0) => { const R = tr(), tdove = w('hill', 'dove.'), tthrew = w('hill', 'threw'), tsofa = w('hill', 'sofa.'), tstop = w('hill', 'mountain,');
    C.P.cart.visible = true;
    show(C.cast.kid, V(0, roadY(-6) + 0.85, -6), Math.PI, [{ t: s0 - 1, expr: 'panic', sit: 0.42, look: 'camera', sweat: true }, { t: w('chase', 'only') - 0.1, expr: 'focus', squash: 1 }, { t: R - 0.2, expr: 'laugh', work: 'ride', squash: 1, sweat: false }]);
    const tLot = w('chase', 'lot');
    runners.forEach(([n, x], i) => { const t0 = s0 - 0.3; const zA = -2.0 + Math.floor(i / 4) * 1.5 + (i % 2) * 0.4; const z0 = zA + 3.4 * (tLot - t0); const z2 = zA - RUN * (tstop - R);
      const keys = [{ t: s0 - 1, expr: 'angry', pose: i % 3 ? 'raise' : 'flex', work: i % 2 ? 'shake' : null }];
      if (n === 'c2') keys.push({ t: tdove - 0.4, lean: 0 }, { t: tdove - 0.15, pose: 'cower', lean: 70, expr: 'panic', squash: 1, work: null }, { t: tstop - 0.4, lean: 70 });
      if (n === 'c3') keys.push({ t: tthrew - 0.4, pose: 'raise', expr: 'evil', work: null }, { t: tsofa, pose: 'point', squash: 1, expr: 'angry' });
      if (n !== 'c2') keys.push({ t: tstop - 0.4, lean: 0 }, { t: tstop - 0.1, pose: 'hips', expr: 'sad', lean: 18, sweat: true, work: null, squash: 1 });
      const c = show(C.cast[n], V(x, roadY(z0), z0), Math.PI, keys);
      /* two legs: march in and stand behind the kid, then chase him downhill once he rolls (chaseTick picks the leg) */
      c.chaseLegs = [{ t0, t1: tLot, from: V(x, roadY(z0), z0), to: V(x, roadY(zA), zA), mode: 'run', ease: false }, { t0: R, t1: tstop, from: V(x, roadY(zA), zA), to: V(x, roadY(z2), z2), mode: 'run', ease: false }];
      c.walk(c.chaseLegs[0]); }); };
  const chaseTick = (C, t) => { runners.forEach(([n]) => { const c = C.cast[n]; if (c.chaseLegs) c.path = t < tr() ? c.chaseLegs[0] : c.chaseLegs[1]; }); const z = cartZ(t); const c = C.P.cart; c.position.set(0, roadY(z), z); c.rotation.order = 'YXZ'; c.rotation.set(-Math.atan(0.2), Math.PI, 0); c.userData.wheels.forEach((wh) => (wh.rotation.x = z / 0.3));
    C.cast.kid.place(V(0, roadY(z) + 0.85, z), Math.PI); C.P.cSofa.visible = false; C.P.crates.visible = false;
    // thrown sofa: from c3's head, arcs forward and lands short of the cart
    const ts = w('hill', 'sofa.') - 0.2; const k = ramp(t, ts, ts + 0.9); const s = C.P.flySofa; s.visible = t >= ts && t < w('hill', 'Porters', 3) + 0.1;
    if (s.visible) { const c3 = C.cast.c3.root.position; const z0 = c3.z - 0.3, z1 = z0 - 9; const zz = lerp(z0, z1, k); s.position.set(lerp(c3.x, 2.4, k), roadY(zz) + 2.3 + 3 * Math.sin(Math.PI * k) - 2.3 * k, zz); s.rotation.set(k * 4, k * 1.5, 0); } };
  S.chase = (s0, d) => { const R = tr();
    return [
      { at: 0, set: 'chase', trans: 'zoom', init: (C) => chaseInit(C, s0), tick: chaseTick, cam: move(V(2.4, roadY(-13) + 1.7, -13), V(0, 1.7, 4), V(2.0, roadY(-12) + 1.6, -12), V(0, 1.7, 3), 46, 44) },
      { at: at(s0, w('chase', 'strong,')), set: 'chase', tick: chaseTick, cam: CU('c2', { az: 0.25, frac: 0.34, hk: 1 }) },
      { at: at(s0, w('chase', 'angry,')), set: 'chase', tick: chaseTick, cam: CU('c4', { az: -0.35, frac: 0.36 }) },
      { at: at(s0, w('chase', 'lot')), set: 'chase', tick: chaseTick, cam: move(V(-2.5, 4.5, -11), V(0, 0.5, 3), V(-3.2, 7.5, -14), V(0, 0.5, 4), 50, 52) },
      { at: at(s0, w('chase', 'So')), set: 'chase', tick: chaseTick, cam: CU('kid', { yaw: Math.PI, az: 0.45, frac: 0.32, dy: 1.3, el: 0.06 }) },
      { at: at(s0, R, 0.1), set: 'chase', trans: 'whip', tick: chaseTick, cam: track((lt, u, t) => { const z = cartZ(t); const k = outExpo(u); const a = lerp(0.3, 1.9, k), r = lerp(4, 22, k), h = lerp(1.5, 12, k);
          return { p: V(Math.sin(a) * r, roadY(z) + h, z + Math.cos(a) * r), l: V(0, roadY(z) + 0.8, z), fov: lerp(44, 52, k), roll: -0.2 * (1 - k) }; }) },
    ]; };
  S.hill = (s0, d) => {
    const behind = (who, back = 4, up = 2.4, ahead = 14) => track((lt, u, t, C) => { const r = C.cast[who].root.position; return { p: V(r.x + 1.4, r.y + up, r.z + back), l: V(0, roadY(r.z - ahead) + 1.0, r.z - ahead), fov: 48 }; });
    return [
      { at: 0, set: 'chase', init: (C) => chaseInit(C, T.shot('chase').start), tick: chaseTick, speed: [s0, s0 + 3.5], cam: CU('kid', { yaw: Math.PI, az: 1.25, frac: 0.3, dy: 1.2, el: 0.05, hk: 1 }) },
      { at: at(s0, w('hill', 'faster')), set: 'chase', tick: chaseTick, cam: track((lt, u, t) => { const z = cartZ(t); return { p: V(1.8, roadY(z - 9) + 1.0, z - 9), l: V(0, roadY(z) + 1.0, z), fov: 46 }; }) },
      { at: at(s0, w('hill', 'ran.')), set: 'chase', tick: chaseTick, cam: CU('c1', { az: 0.4, frac: 0.3 }) },
      { at: at(s0, w('hill', 'dove.')), set: 'chase', tick: chaseTick, cam: CU('c2', { az: 1.2, frac: 0.26, dy: 0, el: 0.4, hk: 1 }) },
      { at: at(s0, w('hill', 'threw')), set: 'chase', tick: chaseTick, cam: CU('c3', { az: 0.5, frac: 0.2, dy: -0.5 }) },
      { at: at(s0, w('hill', 'sofa.')), set: 'chase', tick: chaseTick, cam: behind('c3', 4.5, 2.6, 12) },
      { at: at(s0, w('hill', 'Porters', 3)), set: 'chase', tick: chaseTick, cam: behind('c6', 3.5, 1.9, 20) },
      { at: at(s0, w('hill', 'nobody')), set: 'chase', tick: chaseTick, speed: [w('hill', 'nobody'), w('hill', 'downhill.') + 0.5], cam: CU('kid', { yaw: Math.PI, az: 0.35, frac: 0.34, dy: 1.1, el: 0.06, hk: 1 }) },
    ]; };

  // 10. CRASH: the guild boss's ground-floor penthouse... WHIP... and its very large window
  S.crash = (s0, d) => { const tw = w('crash', 'window.');
    const cartIn = (t) => ease(ramp(t, tw - 0.25, tw + 0.35));
    const tick = (L, t) => { const k = cartIn(t); L.cart.visible = t > tw - 0.25; L.cart.position.set(0.3, 0, lerp(-7, -0.6, k)); L.cart.rotation.set(0, Math.PI / 2 + k * 0.4, 0); L.cart.userData.wheels.forEach((wh) => (wh.rotation.z = -k * 20));
      const kid = L.cast.kid; kid.root.visible = t > tw - 0.25; kid.place(V(0.3, 0.85, lerp(-7, -0.6, k)), Math.PI * 0.1 + Math.PI); };
    const init = (L) => { L.table.visible = false; L.crashAt = tw;
      show(L.cast.rich, V(0, 0, -2.0), 0, [{ t: s0 - 1, expr: 'content', eyes: 'half', sit: 0.45, pose: 'hold2' }, { t: tw, expr: 'shock', pose: 'raise', squash: 1, lean: -10 }]).groove(all('crash'), 0.4);
      show(L.cast.butler, V(1.7, 0, -1.0), V(0, 0, -2), [{ t: s0 - 1, expr: 'bored', pose: 'hold2' }, { t: tw + 0.1, expr: 'shock', pose: 'cower', squash: 1 }]);
      show(L.cast.kid, V(0.3, 0.85, -7), Math.PI, [{ t: s0 - 1, expr: 'panic', sit: 0.42, work: 'ride', sweat: true }]); };
    const post = (L) => { L.glass.position.copy(handW(L.cast.rich)).add(V(0, 0.1, 0.02)); };
    return [
      { at: 0, set: 'lobby', trans: 'zoom', init, tick, post, cam: move(V(2.6, 1.6, 3.0), V(0, 1.1, -2.0), V(1.0, 1.3, 1.4), V(0, 1.1, -2.0), 46, 40) },
      { at: at(s0, w('crash', "boss's"), 0.3), set: 'lobby', tick, post, cam: CU('rich', { az: 0.3, frac: 0.38, el: 0.05 }) },
      { at: at(s0, w('crash', 'And'), 0.05), set: 'lobby', trans: 'whip', tick, post, cam: move(V(-1.0, 1.3, 3.4), V(0, 1.4, -2.8), V(-0.8, 1.3, 3.0), V(0, 1.4, -2.6), 50, 46) },
    ]; };

  // 11. TWIST: quiet... he bought it (to hide it) - CUT - the only wheel on Earth is his coffee table
  S.twist = (s0, d) => { const tu = w('twist', 'up.'), tk = w('twist', 'kid.'), twh = w('twist', 'wheel.'), tb = w('twist', 'bought'), tg = w('twist', 'gold.'), tnt = w('twist', 'Not'), tn = w('twist', 'Now'), tc = w('twist', 'coffee');
    const init = (L) => { L.crashAt = w('crash', 'window.'); L.table.visible = false; L.cart.visible = true; L.cart.position.set(0.3, 0, -0.6); L.cart.rotation.set(0, Math.PI / 2 + 0.4, 0);
      show(L.cast.kid, V(0.3, 0.85, -0.6), V(0, 0, -2), [{ t: s0 - 1, expr: 'worried', sit: 0.42, sweat: true, headTilt: 10 }, { t: tu, look: V(0, 2.2, -2), expr: 'panic' }, { t: tb + 0.1, expr: 'shock', squash: 1 }, { t: tg - 0.1, expr: 'laugh', pose: 'hold2', squash: 1, bounce: 0.5, sweat: false }]);
      show(L.cast.rich, V(0, 0, -2.0), 0, [{ t: s0 - 1, expr: 'shock', pose: 'raise', sit: 0.45, lean: -10 }, { t: tu - 0.15, sit: null, expr: 'skeptic', pose: 'cross', lean: 0, squash: 1 },
        { t: tk - 0.25, look: V(0.3, 1.3, -0.6), expr: 'skeptic' }, { t: twh - 0.25, look: V(0.8, 0.3, -0.4), eyes: 'half', mouth: 'smirk' }, { t: tb - 0.1, expr: 'evil', pose: 'present', look: V(0.3, 1.3, -0.6), squash: 1 },
        { t: tnt - 0.1, look: 'camera', eyes: 'half', mouth: 'smirk', pose: 'cross' }]).groove(all('twist'), 0.6);
      show(L.cast.butler, V(1.7, 0, -1.0), V(0, 0, -2), [{ t: s0 - 1, expr: 'shock', pose: 'cower' }, { t: tu, expr: 'bored', pose: 'hold2' }]); };
    const post = (L, t) => { L.gold.visible = t > tg - 0.45; const from = handW(L.cast.rich), to = handW(L.cast.kid); const k = ease(ramp(t, tg - 0.45, tg - 0.05)); L.gold.position.copy(from.lerp(to, k)).add(V(0, Math.sin(k * Math.PI) * 0.5, 0)); };
    const wheelCam = track((lt, u, t, L) => { const wp = L.cart.userData.wheels[0].getWorldPosition(V(0, 0, 0)); return { p: V(wp.x + 0.9 - 0.2 * u, wp.y + 0.35, wp.z + 1.0), l: wp, fov: 36 }; });
    const coffee = (L) => { L.crashAt = null; L.shards.forEach((x) => (x.visible = false)); L.cart.visible = false; L.gold.visible = false; L.table.visible = true; L.cup.visible = true; L.table.userData.top.visible = true;
      show(L.cast.rich, V(0, 0, -2.0), 0, [{ t: tn - 1, expr: 'content', sit: 0.45, pose: 'hold2', lean: -8 }, { t: tc - 0.1, eyes: 'half', mouth: 'smirk', look: 'camera', squash: 1 }]).groove(all('twist'), 0.6);
      show(L.cast.butler, V(1.7, 0, -1.0), V(0, 0, -2), [{ t: tn - 1, expr: 'bored', pose: 'hold2' }]); L.cast.kid.root.visible = false; };
    return [
      { at: 0, set: 'lobby', init, post, cam: move(V(3.4, 1.7, 2.6), V(0.2, 1.0, -1.0), V(3.0, 1.65, 2.2), V(0.2, 1.0, -1.0), 48, 44) },
      { at: at(s0, w('twist', 'stood')), set: 'lobby', post, cam: CU('rich', { az: -0.55, frac: 0.36, hk: 1 }) },
      { at: at(s0, tk, 0.4), set: 'lobby', post, cam: CU('kid', { az: 0.4, frac: 0.38, hk: 1 }) },
      { at: at(s0, twh, 0.4), set: 'lobby', post, cam: wheelCam },
      { at: at(s0, tb, 0.15), set: 'lobby', post, cam: move(V(3.2, 1.7, 2.4), V(0.2, 1.2, -1.2), V(3.0, 1.65, 2.2), V(0.2, 1.2, -1.2), 46, 44) },
      { at: at(s0, tg, 0.05), set: 'lobby', post, cam: CU('kid', { az: 0.9, frac: 0.34, el: 0.28, hk: 1 }) },
      { at: at(s0, tnt), set: 'lobby', post, cam: CU('rich', { az: -0.5, frac: 0.42, hk: 1 }) },
      { at: at(s0, tn, 0.05), set: 'lobby', trans: 'cut', init: coffee, post(L) { L.glass.position.copy(handW(L.cast.rich)).add(V(0, 0.1, 0.02)); }, cam: move(V(0.4, 1.3, 2.4), V(0, 0.9, -1.2), V(0.25, 1.2, 1.8), V(0, 0.9, -1.2), 44, 40) },
      { at: at(s0, w('twist', 'uses')), set: 'lobby', cam: CU('rich', { az: 0.15, frac: 0.4, dy: 1.0 }) },
    ]; };

  // 12. LOOP: back to the wheel -> flows into "this is the most illegal object on Earth"
  S.loop = (s0) => [{ at: 0, set: 'lobby', trans: 'zoom', init: tableOnly, cam: (lt, u) => wheelMacro(lt, 1 - u) }];
  return S;
}

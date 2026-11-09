// "The kid who built a wheel" - a counterfactual story. Every beat gives the characters a physical action
// (hammering, pushing, carrying, fist-shaking, riding, crashing), with the narration groove on everyone.
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
const headOf = (c) => c.root.position.clone().add(V(0, c.spec.H * 0.86, 0));
const handW = (c, side = 'R') => c.torso.localToWorld((side === 'R' ? c.handR : c.handL).clone());
const topOf = (c) => c.root.position.clone().add(V(0, c.spec.H + 0.15, 0));

// close-up that frames a character's live head at a target size (fraction of frame height); the reference rubric
// wants faces >= 30% of frame height most of the time. az = angle off the face direction, el = elevation, dy = look below the head (in head radii)
const CU = (who, { az = 0.4, el = 0.08, frac = 0.36, fov = 32, drift = 0.1, dy = 0.8, yaw = null } = {}) => { const f = (lt, u, t, set) => {
  const c = set.cast[who]; const hw = c.head.getWorldPosition(V(0, 0, 0)); const r = c.root.position; const h = V(r.x * 0.5 + hw.x * 0.5, hw.y, r.z * 0.5 + hw.z * 0.5); const hr = c.hr;
  const d = hr / (frac * Math.tan(fov * Math.PI / 360)); const a = (yaw ?? c.facing) + az + drift * (u - 0.5);
  return { p: V(h.x + Math.sin(a) * Math.cos(el) * d, h.y + Math.sin(el) * d, h.z + Math.cos(a) * Math.cos(el) * d), l: V(h.x, h.y - dy * hr, h.z), fov };
}; f.track = true; return f; };

export function buildShots(T) {
  const S = {}; const w = (shot, word, n = 1) => T.word(shot, word, n);
  const all = (shot) => T.shotWords(shot); // narration words of a shot (groove)

  // 1. HOOK: "this is the most illegal object on Earth" - a mystery close-up of a wheel (the boss's coffee table)
  const wheelMacro = (lt, u) => { const a = lerp(-0.6, 0.25, ease(u)); const r = lerp(2.2, 1.8, ease(u)); return { p: V(Math.sin(a) * r, 1.95 - 0.15 * u, -0.4 + Math.cos(a) * r), l: V(0, 0.42, -0.4), fov: 40, roll: 0.1 }; };
  S.hook = (s0) => [
    { at: 0, set: 'lobby', init(L) { L.table.visible = true; L.cup.visible = false; L.table.userData.top.visible = false; }, cam: wheelMacro },
    { at: w('hook', 'object') - s0 - 0.1, set: 'lobby', cam: (lt, u) => { const a = 0.4 + u * 0.9; return { p: V(Math.sin(a) * 0.35, 2.3 - 0.2 * u, -0.4 + Math.cos(a) * 0.35), l: V(0, 0.42, -0.4), fov: 42, roll: a }; } },
  ];

  // 2. SETUP: everything is carried; half the world are porters
  S.setup = (s0, d) => { const te = w('setup', 'Everything'), tb = w('setup', 'biggest');
    const rows = [['p1', -0.55, -9, 'piano'], ['p2', 0.55, -9, 'piano'], ['p3', -0.6, -13.5, 'sofa'], ['p4', 0.6, -13.5, 'sofa'], ['p5', 0, -17.5, 'fridge'], ['p6', -1.7, -11, 'crateA'], ['p7', 1.6, -15, 'crateB'], ['p8', -2.3, -19, 'crateC'], ['p9', 2.2, -12, 'crateD'], ['p10', -1.4, -16, 'crateE']];
    const speed = 1.15;
    const init = (St) => { ['piano', 'sofa', 'fridge', 'crateA', 'crateB', 'crateC', 'crateD', 'crateE'].forEach((k) => (St.P[k].visible = true));
      rows.forEach(([n, x, z], i) => show(St.cast[n], V(x, 0, z), 0, [{ t: s0 - 1, expr: i < 4 ? 'worried' : (i % 2 ? 'focus' : 'worried'), pose: 'raise', sweat: i < 5, bounce: 0.35 }]).groove(all('setup'), 0.6)
        .walk({ t0: s0 - 0.6, t1: s0 + d + 1, from: V(x, 0, z), to: V(x, 0, z + (d + 1.6) * speed), mode: 'waddle', ease: false })); };
    const post = (St) => { const load = (a, b, prop, dy = 0.05) => { const pa = topOf(St.cast[a]), pb = b ? topOf(St.cast[b]) : pa; St.P[prop].position.copy(pa.add(pb).multiplyScalar(0.5)).add(V(0, dy, 0)); St.P[prop].rotation.set(Math.sin(St.cast[a].root.position.z * 2) * 0.04, b ? 0 : Math.PI / 2, 0); };
      load('p1', 'p2', 'piano'); load('p3', 'p4', 'sofa'); load('p5', null, 'fridge', -0.1); load('p6', null, 'crateA'); load('p7', null, 'crateB'); load('p8', null, 'crateC'); load('p9', null, 'crateD'); load('p10', null, 'crateE'); };
    return [
      { at: 0, set: 'street', init, post, cam: move(V(0.8, 1.2, -1.5), V(0, 2.0, -12), V(0.5, 1.25, -2.8), V(0, 2.0, -12), 46, 42) },
      { at: te - s0 - 0.1, set: 'street', post, cam: CU('p1', { az: 0.5, frac: 0.34, dy: 1.2 }) },
      { at: w('setup', 'carrying') - s0 - 0.1, set: 'street', post, cam: (lt, u, t) => { const z = -9 + (t - s0 + 0.6) * speed; return { p: V(1.0, 1.3, z + 3.6), l: V(0, 1.85, z), fov: 44 }; } },
      { at: tb - s0 - 0.1, set: 'street', post, cam: CU('p6', { az: -0.5, frac: 0.36, dy: 1.0 }) },
      { at: w('setup', 'Half') - s0 - 0.1, set: 'street', post, cam: move(V(-1.2, 3.2, 4.0), V(0, 3.5, -20), V(-0.6, 4.8, 2.5), V(0, 6.0, -24), 52, 50) },
    ]; };

  // 3. SHED: a kid built one (hammering, then the wheel rolls at us)
  S.shed = (s0, d) => { const tk = w('shed', 'kid'), tb = w('shed', 'built'), to = w('shed', 'one.');
    const roll = (t) => ease(ramp(t, to - 0.35, to + 0.9));
    const tick = (Sh, t) => { const k = roll(t); const p0 = V(2.0, 0.45, 0.1), p1 = V(-0.4, 0.45, 1.2); Sh.wheel.position.lerpVectors(p0, p1, k); Sh.wheel.rotation.set(0, 0.35, -(k * p0.distanceTo(p1)) / 0.45);
      Sh.hammer.visible = t < to - 0.4; };
    return [
      { at: 0, set: 'shed', init(Sh) { show(Sh.cast.kid, V(0.8, 0, -2.0), 0, [{ t: s0 - 1, expr: 'focus', work: 'hammer', lean: 8 }, { t: tb + 0.1, work: null, pose: 'present', expr: 'hopeful', look: V(2.0, 0.4, 0.1), squash: 1 }, { t: to - 0.1, expr: 'shock', pose: 'raise', squash: 1, look: 'camera', bounce: 0.6 }]); },
        tick, post(Sh) { if (Sh.hammer.visible) { Sh.hammer.position.copy(handW(Sh.cast.kid)).add(V(0, 0.1, 0)); Sh.hammer.rotation.set(0, 0, -0.6); } },
        cam: CU('kid', { az: 0.3, frac: 0.3, dy: 1.5, el: 0.12 }) },
      { at: to - s0 - 0.15, set: 'shed', tick, cam: (lt, u) => ({ p: V(-0.2, 0.55, 2.6), l: V(0.1, 0.5, 0), fov: 46 }) },
    ]; };

  // 4. CART: four wheels under a box - his whole house in one trip; ten porters freeze, crates drop
  S.cart = (s0, d) => { const tm = w('cart', 'moved'), tt = w('cart', 'ten'), tk = w('cart', 'kid.');
    const porters = [['p1', -2.6, -2], ['p2', -2.6, -4], ['p3', -2.6, -6], ['p4', -2.6, -8], ['p5', -2.6, -10], ['p6', 2.6, -3], ['p7', 2.6, -5], ['p8', 2.6, -7], ['p9', 2.6, -9], ['p10', 2.6, -11]];
    const kz = (t) => -14 + (t - s0) * 2.2;
    const tick = (St, t) => { const z = kz(t); const c = St.P.cart; c.position.set(0, 0, z + 1.7); c.rotation.y = Math.PI / 2; c.userData.wheels.forEach((wh) => (wh.rotation.z = -(z) / 0.3));
      St.P.cSofa.position.set(0, 0.88, z + 1.7); St.P.cSofa.rotation.y = Math.PI / 2; St.P.cFridge.position.set(0.35, 1.25, z + 1.35); St.P.cPiano.position.set(-0.2, 1.23, z + 2.0); St.P.cPiano.rotation.y = Math.PI / 2; St.P.cPiano.scale.setScalar(0.55); };
    const post = (St, t) => { porters.forEach(([n], i) => { const cr = St.P[['crateA', 'crateB', 'crateC', 'crateD', 'crateE'][i % 5]]; if (i >= 5) return; const top = topOf(St.cast[n]);
      const drop = ramp(t, tk - 0.1 + i * 0.05, tk + 0.35 + i * 0.05); cr.position.copy(top).add(V(0, -(top.y - 0.25) * drop * drop, 0.3 * drop)); cr.rotation.z = drop * 0.5 * (i % 2 ? 1 : -1); }); };
    const init = (St) => { ['cart', 'cSofa', 'cFridge', 'cPiano', 'crateA', 'crateB', 'crateC', 'crateD', 'crateE'].forEach((k) => (St.P[k].visible = true));
      show(St.cast.kid, V(0, 0, -14), 0, [{ t: s0 - 1, expr: 'happy', work: 'push', bounce: 0.3 }, { t: tm + 0.2, look: 'camera', expr: 'happy', squash: 1 }]).groove(all('cart'), 0.8).walk({ t0: s0 - 0.1, t1: s0 + d + 1, from: V(0, 0, -14), to: V(0, 0, -14 + (d + 1.1) * 2.2), mode: 'walk', ease: false });
      porters.forEach(([n, x, z], i) => show(St.cast[n], V(x, 0, z), x < 0 ? Math.PI / 2 : -Math.PI / 2, [{ t: s0 - 1, expr: 'focus', pose: i < 5 ? 'raise' : 'idle', sweat: true }, { t: tt - 0.1 + i * 0.04, expr: 'shock', look: V(0, 1.4, kz(tt) - 1.5), squash: 1 }, { t: tk + 0.2 + i * 0.05, expr: 'sad', pose: 'idle', headTilt: -10 }]).groove(all('cart'), 0.4)); };
    return [
      { at: 0, set: 'street', init, tick, post, cam: (lt, u, t) => { const z = kz(t); return { p: V(-2.0, 1.55, z - 0.9), l: V(0, 1.05, z + 0.5), fov: 50 }; } },
      { at: tm - s0 - 0.1, set: 'street', tick, post, cam: CU('kid', { yaw: 0, az: -1.05, frac: 0.34, el: 0.12 }) },
      { at: w('cart', 'trip.') - s0 - 0.1, set: 'street', tick, post, cam: move(V(-0.4, 1.7, 1.8), V(-1.0, 1.4, -8), V(-0.3, 1.7, 1.4), V(-1.0, 1.4, -7), 44, 40) },
      { at: tt - s0 - 0.1, set: 'street', tick, post, cam: CU('p9', { yaw: -Math.PI / 2, az: 0.3, frac: 0.36 }) },
      { at: w('cart', 'done') - s0 - 0.1, set: 'street', tick, post, cam: move(V(-0.4, 1.7, 1.8), V(-2.6, 1.6, -6), V(-0.2, 1.7, 1.2), V(-2.6, 1.5, -6), 44, 40) },
    ]; };

  // 5. GUILD: half the world would lose their jobs; a price on his head
  S.guild = (s0, d) => { const tj = w('guild', 'jobs.'), tl = w('guild', 'lunch,'), tp = w('guild', 'price');
    const crowd = [['u1', -2.4, 1.2], ['u2', -0.8, 1.0], ['u3', 0.8, 1.1], ['u4', 2.4, 1.3], ['u5', -1.6, 2.6], ['u6', 0.0, 2.5], ['u7', 1.6, 2.7]];
    const post = (R, t) => { R.wheel.visible = false; crowd.forEach(([n], i) => { if (i >= 6) return; const b = R.banners[i]; b.position.copy(handW(R.cast[n])).add(V(0, 0.1, 0)); b.rotation.y = Math.PI; }); };
    const init = (R) => {
      show(R.cast.boss, V(0.9, 1.12, -3.6), 0, [{ t: s0 - 1, expr: 'angry', pose: 'gesture', work: 'shake', tint: 0.4 }, { t: tj - 0.1, tint: 0.9, steam: true, squash: 1, pose: 'raise' }, { t: tp - 0.1, pose: 'point', work: null, look: V(0, 3.4, -5.4), expr: 'evil' }]).groove(all('guild'), 1);
      crowd.forEach(([n, x, z], i) => show(R.cast[n], V(x, 0, z), Math.PI, [{ t: s0 - 1, expr: 'angry', pose: 'raise', work: 'shake' }, { t: tj + i * 0.04, expr: 'angry', squash: 1 }]).groove(all('guild'), 0.8)); };
    return [
      { at: 0, set: 'rally', init, post, cam: CU('boss', { az: 0.35, el: -0.12, frac: 0.36 }) },
      { at: w('guild', 'half') - s0 - 0.1, set: 'rally', post, cam: move(V(-1.0, 2.9, -5.0), V(0, 1.7, 2.0), V(-0.8, 2.8, -4.4), V(0, 1.7, 2.0), 50, 46) },
      { at: tj - s0 - 0.1, set: 'rally', post, cam: CU('boss', { az: -0.4, el: -0.05, frac: 0.44 }) },
      { at: w('guild', 'So') - s0 - 0.1, set: 'rally', post, cam: CU('u2', { az: 0.3, frac: 0.34, el: 0.1 }) },
      { at: w('guild', 'guild') - s0 - 0.1, set: 'rally', post, cam: move(V(0, 3.4, 0.6), V(0, 3.4, -5.4), V(0, 3.4, -0.6), V(0, 3.4, -5.4), 44, 40) },
    ]; };

  // 6. CHASE: he rolled - downhill on the cart with porters running after him (spinning pull-back)
  const cartZ = (t, t0) => { const a = Math.max(0, t - t0); return -6 - 3 * a - 4.5 * a * a; };
  const chaseTick = (t0) => (C, t) => { const z = cartZ(t, t0); const c = C.P.cart; c.position.set(0, roadY(z), z); c.rotation.set(Math.atan(0.2), Math.PI / 2, 0); c.rotation.order = 'YXZ'; c.rotation.set(-Math.atan(0.2), Math.PI, 0); c.userData.wheels.forEach((wh) => (wh.rotation.x = z / 0.3));
    C.cast.kid.place(V(0, roadY(z) + 0.85, z), Math.PI); C.P.cSofa.visible = false; C.P.crates.visible = false; };
  S.chase = (s0, d) => { const tr = w('chase', 'rolled.');
    const runners = [['c1', -1.2], ['c2', 1.0], ['c3', -0.4], ['c4', 1.8], ['c5', -2.0], ['c6', 0.4]];
    const init = (C) => { C.P.cart.visible = true;
      show(C.cast.kid, V(0, roadY(-6) + 0.85, -6), Math.PI, [{ t: s0 - 1, expr: 'panic', sit: 0.42, look: 'camera', sweat: true }, { t: tr - 0.2, expr: 'happy', work: 'ride', look: V(0, 0, -40), squash: 1 }]);
      runners.forEach(([n, x], i) => show(C.cast[n], V(x, 0, 6 + i), Math.PI, [{ t: s0 - 1, expr: 'angry', pose: 'idle', work: i % 2 ? 'shake' : null }])
        .walk({ t0: s0 - 0.3, t1: s0 + d + 3, from: V(x, roadY(6 + i), 6 + i * 1.2), to: V(x, roadY(-40), -40), mode: 'run', ease: false })); };
    return [
      { at: 0, set: 'chase', init, tick: chaseTick(tr), cam: CU('kid', { yaw: Math.PI, az: 0.45, frac: 0.32, dy: 1.3, el: 0.06 }) },
      { at: tr - s0 - 0.1, set: 'chase', tick: chaseTick(tr), cam: (lt, u) => { const z = cartZ(s0 + tr - s0 + lt, tr); const k = outExpo(u); const a = lerp(0.3, 1.9, k), r = lerp(4, 26, k), h = lerp(1.5, 16, k);
          return { p: V(Math.sin(a) * r, roadY(z) + h, z + Math.cos(a) * r), l: V(0, roadY(z) + 0.8, z), fov: lerp(44, 52, k), roll: -0.2 * (1 - k) }; } },
    ]; };

  // 7. CRASH: down the hill and through the boss's ground-floor penthouse window
  S.crash = (s0, d) => { const tth = w('crash', 'through'), tw = w('crash', 'window.');
    const tr = T.word('chase', 'rolled.');
    const cartIn = (t) => ease(ramp(t, tw - 0.25, tw + 0.35));
    return [
      { at: 0, set: 'chase', tick: chaseTick(tr), init(C) { C.P.cart.visible = true; show(C.cast.kid, V(0, 0, -20), Math.PI, [{ t: s0 - 1, expr: 'panic', sit: 0.42, work: 'ride', sweat: true }]); },
        cam: (lt) => { const z = cartZ(s0 + lt, tr); return { p: V(1.1, roadY(z - 5) + 2.0, z - 5), l: V(0, roadY(z) + 1.0, z), fov: 50 }; } },
      { at: tth - s0 - 0.1, set: 'lobby', trans: 'zoom', init(L) { L.table.visible = false; L.crashAt = tw;
          show(L.cast.rich, V(0, 0, -2.0), 0, [{ t: s0 - 1, expr: 'content', sit: 0.45, pose: 'hold2' }, { t: tw, expr: 'shock', pose: 'raise', squash: 1, shake: 1, sit: null, lean: -10 }]);
          show(L.cast.butler, V(1.7, 0, -1.0), V(0, 0, -2), [{ t: s0 - 1, expr: 'bored', pose: 'hold2' }, { t: tw + 0.1, expr: 'shock', pose: 'cower', squash: 1 }]); },
        tick(L, t) { const k = cartIn(t); L.cart.visible = t > tw - 0.25; L.cart.position.set(0.3, 0, lerp(-7, -0.6, k)); L.cart.rotation.set(0, Math.PI / 2 + k * 0.4, 0); L.cart.userData.wheels.forEach((wh) => (wh.rotation.z = -k * 20));
          const kid = L.cast.kid; kid.root.visible = t > tw - 0.25; kid.place(V(0.3, 0.85, lerp(-7, -0.6, k)), Math.PI * 0.1); },
        post(L) { L.glass.position.copy(handW(L.cast.rich)).add(V(0, 0.1, 0.02)); },
        cam: CU('rich', { az: 0.3, frac: 0.38, el: 0.05 }) },
      { at: w('crash', 'penthouse') - s0 - 0.1, set: 'lobby', inherit: true, cam: move(V(-1.0, 1.3, 3.4), V(0, 1.4, -2.8), V(-0.8, 1.3, 3.0), V(0, 1.4, -2.6), 50, 46) },
    ]; };

  // 8. TWIST: he bought it - and uses it as a coffee table
  S.twist = (s0, d) => { const tl = w('twist', 'looked'), tb = w('twist', 'bought'), tn = w('twist', 'Now'), tc = w('twist', 'coffee');
    return [
      { at: 0, set: 'lobby', init(L) { L.table.visible = false; L.cart.visible = true; L.cart.position.set(0.3, 0, -0.6); L.cart.rotation.set(0, Math.PI / 2 + 0.4, 0);
          show(L.cast.kid, V(1.6, 0, 0.2), V(0, 0, -1.2), [{ t: s0 - 1, expr: 'worried', sweat: true }, { t: tb + 0.15, expr: 'shock', pose: 'hold2', squash: 1 }, { t: tb + 0.6, expr: 'happy', bounce: 0.6 }]);
          show(L.cast.rich, V(-0.9, 0, -1.4), V(0.3, 0, -0.6), [{ t: s0 - 1, expr: 'skeptic', pose: 'cross', look: V(0.3, 0.4, -0.6) }, { t: tl + 0.4, look: V(1.6, 1.5, 0.2), eyes: 'half', mouth: 'smirk' }, { t: tb - 0.1, expr: 'evil', pose: 'present', squash: 1 }]).groove(all('twist'), 0.7); },
        post(L, t) { L.gold.visible = t > tb - 0.1; const from = handW(L.cast.rich), to = handW(L.cast.kid); const k = ease(ramp(t, tb - 0.05, tb + 0.35)); L.gold.position.copy(from.lerp(to, k)).add(V(0, Math.sin(k * Math.PI) * 0.5, 0)); },
        cam: move(V(3.4, 1.7, 2.6), V(0.2, 1.1, -0.7), V(3.0, 1.65, 2.2), V(0.2, 1.1, -0.7), 48, 44) },
      { at: w('twist', 'wheel.') - s0 - 0.1, set: 'lobby', cam: CU('rich', { az: 0.5, frac: 0.38 }) },
      { at: tb - s0 - 0.1, set: 'lobby', cam: move(V(3.2, 1.7, 2.4), V(0.4, 1.3, -0.5), V(3.0, 1.65, 2.2), V(0.4, 1.3, -0.5), 46, 44) },
      { at: tb - s0 + 0.42, set: 'lobby', cam: CU('kid', { az: -0.3, frac: 0.38 }) },
      { at: tn - s0 + 0.38, set: 'lobby', init(L) { L.cart.visible = false; L.gold.visible = false; L.table.visible = true; L.cup.visible = true;
          show(L.cast.rich, V(0, 0, -2.0), 0, [{ t: tn - 1, expr: 'content', sit: 0.45, pose: 'hold2', lean: -8 }, { t: tc - 0.1, eyes: 'half', mouth: 'smirk', look: 'camera', squash: 1 }]).groove(all('twist'), 0.6);
          show(L.cast.butler, V(1.7, 0, -1.0), V(0, 0, -2), [{ t: tn - 1, expr: 'bored', pose: 'hold2' }]); },
        post(L) { L.glass.position.copy(handW(L.cast.rich)).add(V(0, 0.1, 0.02)); },
        cam: move(V(0.4, 1.3, 2.4), V(0, 0.9, -1.2), V(0.25, 1.2, 1.8), V(0, 0.9, -1.2), 44, 40) },
      { at: w('twist', 'and', 2) - s0 - 0.1, set: 'lobby', cam: CU('rich', { az: 0.15, frac: 0.4, dy: 1.0 }) },
    ]; };

  // 9. LOOP: back to the mystery close-up -> flows into "this is the most illegal object on Earth"
  S.loop = (s0) => [
    { at: 0, set: 'lobby', init(L) { L.table.visible = true; L.cup.visible = false; L.cart.visible = false; L.gold.visible = false; L.table.userData.top.visible = false; }, cam: (lt, u) => wheelMacro(lt, 1 - u) },
  ];
  return S;
}

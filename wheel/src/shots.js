// "In this world, the wheel was never invented" — shots, acting and camera, timed to narration word cues.
import * as THREE from 'three';
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

export function buildShots(T) {
  const S = {}; const w = (shot, word, n = 1) => T.word(shot, word, n);

  // 1. HOOK: the penthouse is on the ground floor
  S.hook = (s0) => { const tp = w('hook', 'penthouse'), tg = w('hook', 'ground');
    return [
      { at: 0, set: 'lobby', init(L) {
          show(L.cast.rich, V(0, 0, -2.0), 0, [{ t: s0 - 1, expr: 'smug', sit: 0.45, pose: 'hold2', lean: -8, tilt: 4 }, { t: tg - 0.05, eyes: 'half', mouth: 'smirk', headTilt: 10, squash: 1 }]);
          show(L.cast.butler, V(1.7, 0, -1.0), V(0, 0, -2), [{ t: s0 - 1, expr: 'bored', pose: 'hold2' }]); },
        post(L) { L.glass.position.copy(handW(L.cast.rich)).add(V(0, 0.1, 0.02)); },
        cam: move(V(0, 1.5, 5.2), V(0, 1.6, -3), V(0, 1.45, 3.8), V(0, 1.5, -2.6), 44, 40) },
      { at: tg - s0 - 0.15, set: 'lobby', cam: move(V(0.7, 1.35, 0.6), V(0, 1.3, -2.0), V(0.55, 1.33, 0.2), V(0, 1.3, -2.0), 36, 32) },
    ]; };

  // 2. RULE: nobody invented the wheel (colour-flash in)
  S.rule = (s0) => { const tn = w('rule', 'nobody'), ti = w('rule', 'invented'), tw = w('rule', 'wheel.');
    const x0 = -0.75, x1 = 0.55, r = 0.5;
    const sx = (t) => lerp(x0, x1, ease(ramp(t, s0 + 0.2, ti)));
    return [
      { at: 0, set: 'hill', trans: 'flash', init(H) {
          show(H.cast.cave1, V(-1.45, 0, 0.1), Math.PI / 2, [{ t: s0 - 1, expr: 'happy', pose: 'present', lean: 14 }, { t: ti + 0.05, expr: 'shock', pose: 'raise', lean: -4, squash: 1 }, { t: tw, expr: 'sad', pose: 'idle', headTilt: -10 }]);
          show(H.cast.cave2, V(1.35, 0, 0.1), -Math.PI / 2, [{ t: s0 - 1, expr: 'skeptic', pose: 'hips' }, { t: ti - 0.15, pose: 'point', squash: 1, expr: 'angry', lean: -6 }, { t: tw - 0.1, expr: 'smug', pose: 'cross' }]); },
        tick(H, t) { const x = sx(t); H.stoneG.position.set(x, r, 0); H.stone.rotation.y = -(x - x0) / r; },
        cam: move(V(0, 1.4, 8.6), V(0, 1.05, 0), V(0, 1.38, 7.6), V(0, 1.05, 0), 44, 42) },
      { at: ti - s0 - 0.1, set: 'hill', cam: move(V(-0.4, 1.35, 4.6), V(0.85, 1.1, 0), V(-0.3, 1.35, 4.1), V(0.85, 1.12, 0), 40, 37) },
    ]; };

  // 3. PORTERS: everything arrives on someone's back
  S.porters = (s0, d) => { const te = w('porters', 'Everything');
    const lines = [['p1', -0.55, 'piano'], ['p2', 0.55, 'piano'], ['p3', -0.6, 'sofa'], ['p4', 0.6, 'sofa'], ['p5', 0, 'fridge'], ['p6', -1.6, 'crateA'], ['p7', 1.5, 'crateB'], ['p8', -2.4, 'crateC']];
    const z0 = { piano: -9, sofa: -14, fridge: -18.5, crateA: -11.5, crateB: -16, crateC: -21 };
    const init = (St) => { lines.forEach(([n, x, load], i) => { const zz = z0[load] + (n === 'p8' ? 0 : 0);
      show(St.cast[n], V(x, 0, zz), 0, [{ t: s0 - 1, expr: i < 2 ? 'panic' : (i % 2 ? 'worried' : 'focus'), pose: 'raise', sweat: i < 5, lean: 4 }]).walk({ t0: s0 - 0.5, t1: s0 + d + 1, from: V(x, 0, zz), to: V(x, 0, zz + (d + 1.5) * 1.2), mode: 'waddle', ease: false }); }); };
    const post = (St) => { const load = (a, b, prop, dy = 0.05) => { const pa = topOf(St.cast[a]), pb = b ? topOf(St.cast[b]) : pa; St.P[prop].position.copy(pa.add(pb).multiplyScalar(0.5)).add(V(0, dy, 0)); St.P[prop].rotation.set(0, b ? 0 : Math.PI / 2, 0); };
      load('p1', 'p2', 'piano'); load('p3', 'p4', 'sofa'); load('p5', null, 'fridge', -0.1); load('p6', null, 'crateA'); load('p7', null, 'crateB'); load('p8', null, 'crateC'); };
    return [
      { at: 0, set: 'street', init, post, cam: move(V(0.6, 2.4, 0.5), V(0, 2.2, -14), V(0.4, 2.2, -1.5), V(0, 2.2, -14), 46, 42) },
      { at: te - s0 - 0.1, set: 'street', post, cam: (lt, u) => { const z = -9 + (te - s0 + lt + 0.5) * 1.2; return { p: V(1.1, 1.25, z + 4.4), l: V(0, 1.75, z), fov: 44 }; } },
    ]; };

  // 4. CANAL: boats were the only fast lane
  S.canal = (s0, d) => { const tb = w('canal', 'Boats');
    const tz = (t) => -10 - (t - s0) * 0.5;
    const tick = (C, t) => { const z = tz(t); C.taxi.position.set(0, Math.sin(t * 1.6) * 0.03, z);
      C.cast.boatman.place(V(0, 0.42, z + 1.4), 0); C.cast.rider.place(V(0, 0.42, z - 0.2), 0); };
    return [
      { at: 0, set: 'canal', init(C) { show(C.cast.boatman, V(0, 0.42, -8.6), 0, [{ t: s0 - 1, expr: 'bored', pose: 'hold2' }]); show(C.cast.rider, V(0, 0.42, -10.2), 0, [{ t: s0 - 1, expr: 'bored', sit: 0.45, pose: 'cross' }, { t: tb + 0.3, expr: 'worried', sweat: true }]);
          show(C.cast.b2, V(-1.8, 0.42, -14.6), 0, [{ t: s0 - 1, expr: 'angry', pose: 'point' }]); show(C.cast.b3, V(1.8, 0.42, -6.2), 0, [{ t: s0 - 1, expr: 'bored', pose: 'shrug' }]); },
        tick, cam: path([[0, V(0, 13, 10), V(0, 0, -34), 48], [1, V(0, 9, 5), V(0, 0, -24), 46]]) },
      { at: tb - s0 - 0.1, set: 'canal', tick, cam: (lt) => { const z = tz(s0 + tb - s0 + lt); return { p: V(1.6, 1.5, z + 3.6), l: V(0, 1.1, z), fov: 40 }; } },
    ]; };

  // 5. STAIRS: no pulley, no elevator
  S.stairs = (s0) => { const tp = w('stairs', 'pulley.'), te = w('stairs', 'elevator.');
    return [
      { at: 0, set: 'stairs', init(Sx) {
          const a = Sx.stepPos(4, 0, 0), b = Sx.stepPos(4, 0, 9);
          show(Sx.cast.worker, a, 0, [{ t: s0 - 1, expr: 'panic', sweat: true, lean: 12, pose: 'idle' }, { t: te - 0.1, look: 'camera', expr: 'sad', squash: 1 }]).walk({ t0: s0 - 0.3, t1: te - 0.25, from: a, to: b, mode: 'walk', ease: false });
          const c = Sx.stepPos(3, 1, 2), d2 = Sx.stepPos(3, 1, 8);
          show(Sx.cast.worker2, c, Math.PI, [{ t: s0 - 1, expr: 'worried', sweat: true, lean: 14, pose: 'raise' }]).walk({ t0: s0 - 0.3, t1: te + 2, from: c, to: d2, mode: 'walk', ease: false }); },
        cam: move(V(-0.85, 15.2, 3.0), V(-0.85, 12.9, -0.4), V(-0.8, 15.0, 2.6), V(-0.85, 13.2, 0.2), 50, 46) },
      { at: tp - s0 + 0.05, set: 'stairs', cam: move(V(-2.2, 15.1, 4.0), V(0.4, 14.6, 0.8), V(-2.0, 15.0, 3.6), V(0.5, 14.6, 0.8), 50, 46) },
    ]; };

  // 6. SKYLINE: spinning pull-back reveal; the poor live at the top
  S.skyline = (s0, d) => { const tpo = w('skyline', 'poor');
    return [
      { at: 0, set: 'skyline', trans: 'zoom', init(K) {
          show(K.cast.rich2, V(0.8, 0, 4.0), V(0, 0, 10), [{ t: s0 - 1, expr: 'smug', pose: 'hips', look: 'camera' }]);
          show(K.cast.poor, V(1.5, 30.25, 1.3), V(3, 30, 10), [{ t: s0 - 1, expr: 'sad', sweat: true, pose: 'idle' }, { t: tpo + 0.4, pose: 'wave', look: 'camera', expr: 'worried' }]); },
        cam: (lt, u) => { const k = outExpo(u); const a = lerp(0.2, 1.5, k); const r = lerp(5, 75, k); const h = lerp(1.6, 46, k);
          return { p: V(Math.sin(a) * r, h, Math.cos(a) * r + 2), l: V(0, lerp(1.5, 14, k), lerp(4, -14, k)), fov: lerp(44, 50, k), roll: -0.18 * (1 - k) }; } },
      { at: tpo - s0 - 0.2, set: 'skyline', cam: move(V(5.5, 32.2, 9.5), V(0.8, 31.2, 0.8), V(4.6, 32.0, 8.0), V(0.8, 31.2, 0.8), 38, 34) },
    ]; };

  // 7. SUNDIAL: late is measured in shadows
  S.sundial = (s0) => { const tl = w('sundial', 'late'), ts = w('sundial', 'shadows.');
    return [
      { at: 0, set: 'plaza', init(P) {
          show(P.cast.boss, V(1.9, 0, 0.9), 0.35, [{ t: s0 - 1, expr: 'bored', pose: 'cross' }, { t: tl - 0.1, expr: 'angry', pose: 'point', look: V(0.6, 0.5, -2.4), squash: 1 }, { t: ts - 0.2, look: 'camera', expr: 'skeptic' }]);
          show(P.cast.worker, V(7.5, 0, 1.2), V(0, 0, 0), [{ t: s0 - 1, expr: 'panic', sweat: true }, { t: tl + 0.2, expr: 'worried', pose: 'shrug' }])
            .walk({ t0: s0, t1: tl, from: V(8.5, 0, 1.5), to: V(4.0, 0, 0.8), mode: 'run', ease: false });
          show(P.cast.x1, V(-6, 0, 2), V(0, 0, -2), [{ t: s0 - 1, expr: 'neutral' }]); show(P.cast.x2, V(-5, 0, -6), V(0, 0, -2), [{ t: s0 - 1, expr: 'bored' }]); },
        cam: move(V(0, 7.5, 5.5), V(0, 0, -2), V(0.5, 6.2, 4.5), V(0.4, 0, -2), 46, 44) },
      { at: tl - s0 - 0.15, set: 'plaza', cam: move(V(2.4, 1.6, 5.6), V(2.6, 1.3, 0.8), V(2.4, 1.6, 5.0), V(2.6, 1.3, 0.8), 42, 38) },
    ]; };

  // 8. TWIST: someone invents the wheel again; the porters vote it out (and it rolls away)
  S.twist = (s0, d) => { const tinv = w('twist', 'invents'), tpo = w('twist', 'porters'), tout = w('twist', 'out.');
    const crowd = [['u1', -2.4, 1.2], ['u2', -0.8, 1.0], ['u3', 0.8, 1.1], ['u4', 2.4, 1.3], ['u5', -1.6, 2.6], ['u6', 0.0, 2.5], ['u7', 1.6, 2.7]];
    const wheelAt = (R, t) => { const inv = R.cast.inventor; if (t < tout) { R.wheel.position.copy(handW(inv)).add(V(0, 0.45, 0.1)); R.wheel.rotation.set(0, 0, Math.sin(t * 3) * 0.1); }
      else { const k = t - tout; const x = 0.4 + k * 2.2; const y = Math.max(0.55, 2.6 - k * 4.5); R.wheel.position.set(x, y, -2.4 + Math.min(k, 0.3) * 2); R.wheel.rotation.set(0, 0, -(x - 0.4) / 0.55); } };
    const post = (R, t) => { wheelAt(R, t); crowd.forEach(([n], i) => { const b = R.banners[i % 6]; if (i < 6) { b.position.copy(handW(R.cast[n])).add(V(0, (t > tpo ? 0.15 : -1.0) + Math.max(0, Math.sin(t * 6 + i)) * 0.12 * (t > tpo ? 1 : 0.3), 0)); b.rotation.y = Math.PI; } }); };
    const init = (R) => {
      show(R.cast.inventor, V(0, 1.12, -4.0), 0, [{ t: s0 - 1, expr: 'hopeful', pose: 'raise' }, { t: tinv, expr: 'happy', squash: 1 }, { t: tout - 0.1, expr: 'shock', pose: 'cower', squash: 1 }, { t: tout + 0.6, expr: 'sad', look: V(3, 0.6, -1) }]);
      crowd.forEach(([n, x, z], i) => show(R.cast[n], V(x, 0, z), Math.PI, [{ t: s0 - 1, expr: 'angry', pose: 'hold2' }, { t: tpo + 0.1 + i * 0.05, pose: 'raise', squash: 1 }, { t: tout + 0.2, expr: 'laugh', look: V(3, 0.6, -1) }])); };
    return [
      { at: 0, set: 'rally', init, post, cam: move(V(0.4, 2.4, 6.5), V(0, 2.4, -4), V(0.3, 2.35, 5.4), V(0, 2.5, -4), 44, 40) },
      { at: tpo - s0 - 0.1, set: 'rally', post, cam: move(V(-0.9, 2.9, -4.9), V(0, 1.7, 2.0), V(-0.8, 2.8, -4.5), V(0, 1.7, 2.0), 46, 44) },
      { at: tout - s0 - 0.05, set: 'rally', post, cam: (lt) => { const x = 0.4 + lt * 2.2; return { p: V(x - 1.2, 1.4, 1.6), l: V(x, 0.8, -1.8), fov: 44 }; } },
    ]; };

  // 9. LOOP: back into the gold lobby -> flows into the first line
  S.loop = (s0) => [
    { at: 0, set: 'lobby', trans: 'zoom', init(L) {
        show(L.cast.rich, V(0, 0, -2.0), 0, [{ t: s0 - 1, expr: 'smug', sit: 0.45, pose: 'hold2', lean: -8, look: 'camera' }, { t: s0 + 1.2, eyes: 'closed', mouth: 'smirk' }, { t: s0 + 1.45, eyes: 'half' }]);
        show(L.cast.butler, V(1.7, 0, -1.0), V(0, 0, -2), [{ t: s0 - 1, expr: 'bored', pose: 'hold2' }]); },
      post(L) { L.glass.position.copy(handW(L.cast.rich)).add(V(0, 0.1, 0.02)); },
      cam: move(V(0.2, 1.6, 2.4), V(0, 1.3, -2.2), V(0, 1.5, 5.2), V(0, 1.6, -3), 36, 44) },
  ];
  return S;
}

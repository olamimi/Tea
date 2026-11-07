// Shot list with puppet acting. Each shot = segments; each segment picks a set, lighting, cast, acting and a camera path.
// Acting keys use absolute (global) times taken from the narration's word timings, so faces hit the stressed words.
import * as THREE from 'three';
const V = (x, y, z) => new THREE.Vector3(x, y, z);
const lerp = (a, b, u) => a + (b - a) * u;
export const ease = (u) => 0.5 - 0.5 * Math.cos(Math.PI * Math.min(1, Math.max(0, u)));
const ramp = (t, a, b) => Math.min(1, Math.max(0, (t - a) / (b - a)));

const RIG = V(4.6, 0, -7); // the bell rig on the city quay

const path = (keys) => (lt, u) => { // keys: [[u, pos, look, fov]]
  let i = 0; while (i < keys.length - 2 && u > keys[i + 1][0]) i++;
  const [u0, p0, l0, f0] = keys[i], [u1, p1, l1, f1] = keys[Math.min(i + 1, keys.length - 1)];
  const k = ease((u - u0) / Math.max(1e-6, u1 - u0));
  return { p: p0.clone().lerp(p1, k), l: l0.clone().lerp(l1, k), fov: lerp(f0, f1 ?? f0, k) };
};
const move = (p0, l0, p1, l1, f0 = 40, f1 = f0) => path([[0, p0, l0, f0], [1, p1, l1, f1]]);
const yawTo = (from, to) => Math.atan2(to.x - from.x, to.z - from.z);

// place + act helper: show(c, pos, faceTarget|yaw, keys, words?)
function show(c, pos, face, keys = [], words = null) {
  c.root.visible = true; c.reset(); c.place(pos, typeof face === 'number' ? face : yawTo(pos, face));
  c.act(keys); if (words) c.say(words); return c;
}

export function buildShots(T) {
  const S = {};
  const w = (shot, word, n = 1) => T.word(shot, word, n);
  const head = (c) => c.root.position.clone().add(V(0, c.spec.H * 0.85, 0)); // look target at a puppet's head

  // ------------------------------------------------------------------ 1. hook
  S.hook = (s0) => {
    const tDuke = w('hook', 'Duke:'), tIf = w('hook', 'if'), tRings = w('hook', 'rings,'), tClimb = w('hook', 'climb.');
    const seg0 = {
      init(W) {
        const c = W.cast; W.rig.group.position.copy(RIG);
        const eng = show(c.eng, V(3.9, 0, -4.4), V(5.2, 0, 0.5), [
          { t: s0 - 1, expr: 'smug', pose: 'present', look: V(4.6, 3.6, -7), tilt: 3 },
          { t: s0 + 0.9, pose: 'point', look: 'camera' },
          { t: tDuke - 0.1, look: V(6.6, 1.9, -2.2), eyes: 'half' },
          { t: tIf - 0.05, expr: 'smug', look: 'camera', pose: 'gesture', work: 'gesture' },
          { t: tRings - 0.04, expr: 'shock', pose: 'point', squash: 1, lean: 4 },
          { t: tClimb - 0.08, expr: 'panic', pose: 'raise', squash: 1, lean: -4 },
        ], T.words('hook', 'if', 'climb.'));
        show(c.duke, V(6.6, 0, -2.2), V(3.9, 0, -4.4), [
          { t: s0 - 1, expr: 'bored', pose: 'hips', tilt: -3, look: V(3.9, 1.8, -4.4) },
          { t: tDuke + 0.15, brows: 'skeptic' }, { t: tRings + 0.1, expr: 'skeptic' }]);
        show(c.g1, V(5.9, 0, -3.6), V(3.9, 0, -4.4), [{ t: s0 - 1, pose: 'hold', look: V(3.9, 1.8, -4.4) }]);
        show(c.g2, V(7.5, 0, -3.4), V(3.9, 0, -4.4), [{ t: s0 - 1, pose: 'hold', expr: 'bored' }, { t: tClimb + 0.1, expr: 'skeptic' }]);
        void eng;
      },
    };
    return [
      { at: 0, set: 'world', light: 'day', focus: RIG, ...seg0, cam: move(V(2.6, 1.8, 1.4), V(4.4, 2.0, -6), V(3.1, 1.75, -0.8), V(4.5, 2.1, -6.2), 44, 40) },
      { at: 1.4, set: 'world', light: 'day', focus: RIG, cam: move(V(5.6, 3.3, -5.0), V(4.6, 3.6, -7), V(3.7, 3.4, -5.1), V(4.6, 3.6, -7), 30, 28) },
      { at: tDuke - s0 - 0.12, set: 'world', light: 'day', focus: RIG, cam: move(V(6.4, 2.25, 1.6), V(6.6, 2.0, -2.2), V(6.5, 2.25, 0.8), V(6.6, 2.0, -2.2), 36, 34) },
      { at: tIf - s0 - 0.05, set: 'world', light: 'day', focus: RIG, cam: move(V(2.9, 2.05, -0.9), V(3.9, 1.7, -4.4), V(3.15, 2.05, -1.7), V(3.9, 1.75, -4.4), 38, 35) },
    ];
  };

  // ------------------------------------------------------------------ 2. the council laughs (shared, rippling laughter)
  S.laugh = (s0) => {
    const tb = w('laugh', 'burst');
    return [
      { at: 0, set: 'hall',
        init(H) {
          const c = H.cast; const D = V(0, 0.5, -14.2);
          show(c.duke, D, 0, [{ t: s0 - 1, expr: 'bored', look: 'camera' }, { t: tb - 0.12, expr: 'smug' }, { t: tb + 0.08, expr: 'laugh', squash: 1, headLean: -10 }]);
          show(c.g1, V(-2.2, 0.5, -13.8), 0.3, [{ t: s0 - 1, pose: 'hold', look: 'camera' }, { t: tb + 0.15, look: head(c.duke) }, { t: tb + 0.25, expr: 'laugh' }]);
          show(c.g2, V(2.2, 0.5, -13.8), -0.3, [{ t: s0 - 1, pose: 'hold', look: 'camera' }, { t: tb + 0.2, look: head(c.g1), expr: 'laugh', tilt: -6 }]);
          show(c.c1, V(-2.8, 0, -10.5), 0.4, [{ t: s0 - 1, expr: 'neutral' }, { t: tb + 0.3, expr: 'laugh', look: V(2.8, 1.9, -10.5), tilt: 8 }]);
          show(c.c2, V(2.8, 0, -10.5), -0.4, [{ t: s0 - 1, expr: 'neutral' }, { t: tb + 0.22, expr: 'laugh', pose: 'point', look: V(-2.8, 1.9, -10.5), tilt: -6 }]);
          show(c.c3, V(-3.0, 0, -7.8), 0.5, [{ t: s0 - 1, expr: 'neutral' }, { t: tb + 0.4, expr: 'laugh', look: head(c.c1) }]);
          show(c.c4, V(3.0, 0, -7.8), -0.5, [{ t: s0 - 1, expr: 'neutral' }, { t: tb + 0.35, expr: 'happy', look: head(c.c2) }, { t: tb + 0.7, expr: 'laugh' }]);
        },
        cam: move(V(0.3, 2.55, -9.6), V(0, 2.25, -14.2), V(0.15, 2.5, -10.6), V(0, 2.25, -14.2), 36, 34) },
      { at: w('laugh', 'laughing.') - s0 + 0.15, set: 'hall', cam: move(V(1.2, 4.4, -2.4), V(0, 1.7, -12), V(1.0, 4.2, -3.4), V(0, 1.7, -12), 50, 48) },
    ];
  };

  // ------------------------------------------------------------------ 3. the device (she presents each part)
  S.device = (s0) => {
    const tw = w('device', 'well.'), tf = w('device', 'float.'), th = w('device', 'hammer.');
    return [
      { at: 0, set: 'world', light: 'day', focus: RIG,
        init(W) { W.rig.group.position.copy(RIG);
          show(W.cast.eng, V(2.6, 0, -6.2), V(8, 0, -2), [
            { t: s0 - 1, expr: 'happy', pose: 'present', look: V(4.6, 3.6, -7) },
            { t: tw - 0.1, pose: 'gesture', look: V(4.6, 0.6, -7), eyes: 'wide' },
            { t: tf - 0.1, pose: 'point', look: V(4.8, 0.6, -7), expr: 'hopeful' },
            { t: th - 0.1, pose: 'wave', look: V(5.8, 3.8, -7), expr: 'happy', squash: 1 }]); },
        cam: (lt, u) => { const a = lerp(0.15, 1.15, ease(u * 0.9)); return { p: V(RIG.x + Math.sin(a) * 7.5, 3.2 - u * 0.6, RIG.z + Math.cos(a) * 7.5), l: V(RIG.x - 0.6, 2.0, RIG.z), fov: 44 }; } },
      { at: w('device', 'copper') - s0 - 0.35, set: 'world', light: 'day', focus: RIG,
        cam: move(V(4.6, 3.0, -5.6), V(4.82, 0.55, -7), V(4.62, 2.0, -6.1), V(4.85, 0.55, -7), 40, 34) },
      { at: w('device', 'chain') - s0 - 0.25, set: 'world', light: 'day', focus: RIG,
        cam: move(V(5.2, 0.9, -4.6), V(5.3, 2.2, -7), V(5.3, 1.0, -4.9), V(5.8, 3.8, -7), 42, 40) },
    ];
  };

  // ------------------------------------------------------------------ 4. the walls (Duke looks down his nose; she shrugs)
  S.walls = (s0) => {
    const ta = w('walls', 'And'), tb = w('walls', 'bucket.');
    return [
      { at: 0, set: 'world', light: 'day', focus: V(-6, 0, 0),
        init(W) { const c = W.cast; W.rig.group.position.copy(RIG);
          show(c.duke, V(2.0, 8.0, 0.8), V(8, 8, 5), [{ t: s0 - 1, expr: 'smug', pose: 'hips', look: 'camera', headLean: -8, tilt: -4 }, { t: w('walls', 'tallest') - 0.05, brows: 'raised', squash: 1 }]);
          show(c.g1, V(2.0, 8.0, -1.2), V(8, 8, 3), [{ t: s0 - 1, pose: 'hold', expr: 'bored' }]);
          show(c.g2, V(2.0, 8.0, 2.8), V(8, 8, 3), [{ t: s0 - 1, pose: 'hold', look: head(c.duke) }]);
          show(c.eng, V(3.6, 0, -5.0), V(6.2, 0, -1.2), [{ t: s0 - 1, expr: 'neutral', look: 'camera' }, { t: ta - 0.05, expr: 'smug', pose: 'shrug', squash: 1, tilt: 5 }, { t: tb - 0.1, expr: 'happy' }]); },
        cam: path([[0, V(7.0, 9.3, 4.6), V(2.0, 9.1, 0.8), 34], [0.25, V(8.5, 10.5, 6.0), V(1.5, 8.6, 0.6), 38], [1, V(30, 30, 30), V(-10, 3, -2), 50]]) },
      { at: ta - s0 - 0.05, set: 'world', light: 'day', focus: RIG,
        cam: move(V(6.2, 0.5, -1.2), V(3.6, 3.6, -8), V(6.0, 0.55, -2.0), V(3.6, 3.7, -8), 56, 54) },
    ];
  };

  // ------------------------------------------------------------------ 5. first ring (false alarm)
  S.ring1 = (s0) => {
    const tr = w('ring1', 'rang'), tb = w('ring1', 'But');
    return [
      { at: 0, set: 'world', light: 'day', focus: RIG,
        init(W) { W.rig.group.position.copy(RIG); W.rig.setStrikes([tr]);
          show(W.cast.eng, V(4.6, 0, -5.95), V(3.6, 0, 0.5), [
            { t: s0 - 1, expr: 'bored', sit: 0.92, headTilt: 12, pose: 'idle' },
            { t: tr - 0.12, squash: 1 },
            { t: tr + 0.02, expr: 'shock', sit: null, pose: 'raise', headTilt: 0, lean: -6 },
            { t: tr + 0.45, expr: 'hopeful', pose: 'point', look: V(10, 1, 4), lean: 6 },
            { t: tb - 0.1, expr: 'worried', pose: 'idle' }]); },
        cam: move(V(3.5, 2.2, 0.2), V(5.0, 2.4, -7), V(3.7, 2.3, -1.8), V(5.1, 2.5, -7), 44, 40) },
      { at: tb - s0 - 0.05, set: 'world', light: 'day', focus: V(10, 0, 0),
        cam: move(V(8.6, 1.3, -14), V(10.4, 0.2, 20), V(9.2, 1.5, -9), V(10.4, 0.2, 24), 50, 48) },
    ];
  };

  // ------------------------------------------------------------------ 6. the Duke's calm boat
  S.boat = (s0) => [
    { at: 0, set: 'world', light: 'day', focus: V(10, 0, 12),
      init(W) { W.boat.visible = true; W.boat.position.set(10, 0, 12); W.boat.rotation.y = 0.3;
        show(W.cast.duke, V(10, 0.25, 12.4), V(6, 0, 17), [{ t: s0 - 1, expr: 'bored', pose: 'hips', lean: -8, tilt: 3 }, { t: s0 + 1.2, eyes: 'closed', mouth: 'O' }, { t: s0 + 1.55, expr: 'bored' }]);
        show(W.cast.g3, V(10.1, 0.25, 10.4), V(6, 0, 17), [{ t: s0 - 1, pose: 'hold', expr: 'bored' }]); },
      tick(W, t) { W.boat.position.y = Math.sin(t * 1.3) * 0.01; },
      cam: move(V(6.0, 1.9, 17.0), V(10, 1.2, 12), V(6.8, 1.75, 15.6), V(10, 1.3, 12), 38, 36) },
    { at: 0.95, set: 'world', light: 'day', focus: V(10, 0, 12), inherit: true,
      cam: move(V(8.8, 2.45, 14.8), V(10, 2.3, 12.4), V(9.0, 2.45, 14.2), V(10, 2.3, 12.4), 30, 28) },
  ];

  // ------------------------------------------------------------------ 7. the feast (laughing at each other)
  S.feast = (s0) => {
    const th = w('feast', 'harder.');
    return [
      { at: 0, set: 'hall',
        init(H) { H.feast.visible = true; const c = H.cast;
          show(c.duke, V(0, 0, -11.6), 0, [{ t: s0 - 1, expr: 'laugh', pose: 'point', headLean: -12 }]);
          const pairs = [['c1', V(-1.6, 0, -8.5), 'c2'], ['c2', V(1.6, 0, -7.5), 'c1'], ['c3', V(-1.6, 0, -5.5), 'c4'], ['c4', V(1.6, 0, -4.5), 'c3'], ['g1', V(-1.6, 0, -2.6), 'g2'], ['g2', V(1.6, 0, -1.6), 'g1']];
          const pos = Object.fromEntries(pairs.map(([n, p]) => [n, p]));
          pairs.forEach(([n, p, other], i) => show(c[n], p, pos[other], [
            { t: s0 - 1, expr: 'happy', look: pos[other].clone().add(V(0, 1.8, 0)), pose: n[0] === 'g' ? 'hold' : 'idle' },
            { t: s0 + 0.05 + i * 0.06, expr: 'laugh', tilt: (i % 2 ? -1 : 1) * 7 },
            { t: th - 0.05 + (i % 3) * 0.05, squash: 1, headLean: -14 }]));
        },
        cam: move(V(-4.8, 2.6, 1.0), V(0, 1.6, -6), V(-4.2, 2.4, -3.2), V(0, 1.5, -8.5), 44, 42) },
    ];
  };

  // ------------------------------------------------------------------ 8. the decree (Duke leans into the lens), then she is thrown out
  S.decree = (s0) => {
    const tl = w('decree', 'loudest'), db = w('decree', 'doorbell,'), thr = w('decree', 'threw');
    return [
      { at: 0, set: 'hall',
        init(H) { H.feast.visible = false; const c = H.cast;
          show(c.duke, V(0, 0.5, -14.2), 0, [
            { t: s0 - 1, expr: 'smug', look: 'camera', pose: 'gesture', work: 'gesture' },
            { t: tl - 0.15, lean: 20, headLean: 12, eyes: 'half', brows: 'raised', blend: 0.3 },
            { t: db - 0.05, expr: 'laugh', pose: 'shrug', squash: 1, lean: 4, headLean: -10 }], T.words('decree', 'called', 'doorbell,'));
          show(c.g1, V(-2.2, 0.5, -13.8), 0.3, [{ t: s0 - 1, pose: 'hold', look: head(c.duke) }, { t: db + 0.15, expr: 'laugh' }]);
          show(c.g2, V(2.2, 0.5, -13.8), -0.3, [{ t: s0 - 1, pose: 'hold', expr: 'happy', look: head(c.duke) }, { t: db + 0.1, expr: 'laugh' }]); },
        cam: move(V(0, 2.5, -8.8), V(0, 2.3, -14.2), V(0, 2.45, -10.6), V(0, 2.3, -14.2), 34, 32) },
      { at: thr - s0 - 0.1, set: 'world', light: 'day', focus: V(4, 0, 0),
        init(W) { const c = W.cast; W.rig.group.position.set(0, -50, 0); W.cart.visible = true;
          show(c.eng, V(4.0, 0, 0.4), Math.PI / 2, [{ t: thr - 1, expr: 'sad', pose: 'pull', work: 'pull' }]).walk({ t0: thr - 0.1, t1: thr + 2.6, from: V(4.0, 0, 0.4), to: V(8.4, 0, 0.4), mode: 'pull', ease: false });
          show(c.g1, V(2.4, 0, -2.6), V(6, 0, 0.4), [{ t: thr - 1, expr: 'laugh', pose: 'point', look: V(6, 1.6, 0.4) }]);
          show(c.g2, V(2.4, 0, 2.8), V(6, 0, 0.4), [{ t: thr - 1, expr: 'laugh', pose: 'hold', look: head(c.g1) }]);
          show(c.duke, V(2.0, 8.0, 0.8), V(8, 0, 0.4), [{ t: thr - 1, expr: 'smug', pose: 'wave', look: V(6, 1, 0.4) }]); },
        tick(W) { const p = W.cast.eng.root.position; W.cart.position.set(p.x - 1.9, 0, 0.4); W.cart.rotation.y = 0; },
        cam: move(V(12.5, 2.0, 3.6), V(3.2, 2.4, 0), V(11.4, 1.9, 2.8), V(3.8, 2.3, 0), 44, 42) },
    ];
  };

  // ------------------------------------------------------------------ 9. the haul at sunset (heavy pull), then home by the mountains
  S.haul = (s0, d) => {
    const tl = w('haul', 'and'); const M = T.MOUNT;
    return [
      { at: 0, set: 'world', light: 'sunset', focus: V(4.5, 0, -40),
        init(W) { W.cart.visible = true; W.rig.group.position.set(0, -50, 0);
          show(W.cast.eng, V(4.5, 0, -32), Math.PI, [{ t: s0 - 1, expr: 'sad', pose: 'pull', work: 'pull' }, { t: s0 + 1.5, eyes: 'squint', brows: 'angry' }])
            .walk({ t0: s0 - 0.5, t1: s0 + 6, from: V(4.5, 0, -31.2), to: V(4.5, 0, -38.0), mode: 'pull', ease: false }); },
        tick(W) { const p = W.cast.eng.root.position; W.cart.position.set(4.5, 0, p.z + 1.9); W.cart.rotation.y = Math.PI / 2; },
        cam: (lt) => { const z = -31.2 - (lt + 0.5) * (6.8 / 6.5); return { p: V(-2.5, 1.3, z + 3.5), l: V(4.5, 1.6, z - 1.2), fov: 46 }; } },
      { at: tl - s0 - 0.05, set: 'world', light: 'dusk', focus: V(6, 0, -150),
        init(W) { W.cart.visible = false; W.rig.group.position.copy(W.MOUNT);
          show(W.cast.eng, M.clone().add(V(-3.0, 0, 0.6)), M.clone().add(V(2, 0, 9)), [{ t: tl - 1, expr: 'content', sit: 0.5, lean: -4, look: M.clone().add(V(0, 3.5, 0)) }, { t: tl + 0.6, eyes: 'happy' }]); },
        cam: (lt, u) => { const k = ease(u); return { p: M.clone().add(V(lerp(3, 2, k), lerp(3.2, 2.6, k), lerp(11, 8.5, k))), l: M.clone().add(V(-1.5, 2.0, 0)), fov: 44 }; } },
    ];
  };

  // ------------------------------------------------------------------ 10. the night alarm
  S.night = (s0) => {
    const tr = w('night', 'rang.'); const M = T.MOUNT; const P = M.clone().add(V(-3.0, 0, 0.6));
    return [
      { at: 0, set: 'world', light: 'night', focus: M,
        init(W) { W.rig.group.position.copy(M); W.rig.setStrikes([]); W.rig.setContinuous(tr, 0.34);
          show(W.cast.eng, P, M.clone().add(V(0, 0, 9)), [
            { t: s0 - 1, expr: 'sleep', sit: 0.5, headTilt: 16, lean: -6 },
            { t: tr - 0.02, squash: 1 },
            { t: tr + 0.06, expr: 'shock', headTilt: 0, lean: 2, look: M.clone().add(V(0, 3.6, 0)) },
            { t: tr + 0.3, expr: 'panic', sit: null, pose: 'raise', squash: 1, shake: 1 },
            { t: tr + 1.2, pose: 'cower' }]); },
        cam: (lt, u) => ({ p: M.clone().add(V(lerp(7, 5.5, ease(u)), 3.4, lerp(15, 12.5, ease(u)))), l: M.clone().add(V(-1.5, 3.2, -2)), fov: 48 }) },
      { at: tr - s0 - 0.55, set: 'world', light: 'night', focus: M,
        cam: (lt, u) => ({ p: M.clone().add(V(-2.4, 1.6, 3.6 - u * 0.4)), l: P.clone().add(V(0, 1.5, 0)), fov: 34 }) },
      { at: w('night', 'And') - s0 - 0.05, set: 'world', light: 'night', focus: M,
        cam: (lt, u) => { const sh = 0.035; return { p: M.clone().add(V(1.8 - u * 0.4 + Math.sin(lt * 9) * sh, 1.0 + Math.sin(lt * 12.7) * sh, 4.4 - u * 0.8)), l: M.clone().add(V(0, 3.7, 0)), fov: 46 }; } },
    ];
  };

  // ------------------------------------------------------------------ 11. the run to the gate
  S.gate = (s0) => {
    const te = w('gate', 'Everyone!'), tg = w('gate', 'ground!');
    return [
      { at: 0, set: 'world', light: 'night', focus: V(4, 0, -8), speed: [s0, s0 + 0.7],
        init(W) { W.rig.group.position.set(0, -50, 0); W.portc.visible = true; W.lantern.intensity = 0;
          show(W.cast.eng, V(4.6, 0, -26), 0, [{ t: s0 - 1, expr: 'panic', pose: 'lantern', lantern: true }])
            .walk({ t0: s0 - 0.5, t1: te + 0.2, from: V(4.6, 0, -27), to: V(4.6, 0, -27 + (te + 0.7 - s0) * 6), mode: 'run', ease: false }); },
        cam: (lt) => { const z = -27 + (lt + 0.5) * 6; return { p: V(7.2, 1.3, z + 4.2), l: V(4.6, 1.5, z), fov: 46 }; } },
      { at: te - s0 - 0.25, set: 'world', light: 'night', focus: V(3, 0, 0),
        init(W) { W.portc.visible = true;
          show(W.cast.eng, V(5.4, 0, 0.3), V(0, 0, 0.3), [
            { t: te - 1, expr: 'panic', pose: 'lantern', lantern: true, look: 'camera' },
            { t: te - 0.08, pose: 'raise', squash: 1, lean: 8, headLean: 8 },
            { t: tg - 0.1, pose: 'wave', work: 'gesture' }], T.words('gate', 'Everyone!', 'ground!')); },
        cam: move(V(0.0, 1.95, 0.4), V(5.4, 1.75, 0.3), V(0.7, 1.95, 0.3), V(5.4, 1.8, 0.3), 42, 38) },
    ];
  };

  // ------------------------------------------------------------------ 12. the guard's taunt, then she trudges away
  S.guard = (s0) => {
    const tt = w('guard', 'They'), tth = w('guard', 'thirsty');
    return [
      { at: 0, set: 'world', light: 'night', focus: V(2, 0, 0),
        init(W) { const c = W.cast; W.portc.visible = true;
          show(c.g1, V(2.3, 8.0, 0.6), V(5.6, 8, 2.6), [
            { t: s0 - 1, expr: 'smug', pose: 'lean', look: 'camera', lean: 12, headLean: 6 },
            { t: tth - 0.05, eyes: 'squint', mouth: 'smirk', headTilt: 12, squash: 1 },
            { t: tt - 0.3, expr: 'laugh', lean: 4 }], T.words('guard', 'Hey,', 'again?'));
          show(c.g2, V(2.2, 8.0, -1.8), V(5.6, 8, 2.6), [{ t: s0 - 1, expr: 'bored', pose: 'hold', look: head(c.g1) }, { t: tth + 0.1, expr: 'happy' }]); },
        cam: move(V(5.8, 9.9, 2.8), V(2.3, 9.6, 0.6), V(5.2, 9.9, 2.4), V(2.3, 9.6, 0.6), 38, 36) },
      { at: tt - s0 - 0.05, set: 'world', light: 'night', focus: V(6, 0, 4),
        init(W) { const c = W.cast; W.lantern.intensity = 0;
          show(c.g1, V(2.3, 8.0, -1.0), V(8, 0, 4), [{ t: tt - 1, expr: 'laugh', pose: 'point', look: V(9, 1, 2) }]);
          show(c.g2, V(2.4, 8.0, -3.0), V(8, 0, 4), [{ t: tt - 1, expr: 'laugh', pose: 'hold', look: head(c.g1) }]);
          show(c.g3, V(2.3, 8.0, 1.4), V(8, 0, 4), [{ t: tt - 1, expr: 'laugh', pose: 'hold', look: head(c.g1) }]);
          show(c.eng, V(8, 0, 4), 0, [{ t: tt - 1, expr: 'sad', pose: 'lantern', lantern: true, headTilt: -8 }])
            .walk({ t0: tt - 0.1, t1: tt + 3.5, from: V(8, 0, 4), to: V(11.2, 0, -1.6), mode: 'waddle', ease: false }); },
        cam: move(V(0.6, 11.6, 2.6), V(9, 0.6, 1.5), V(0.6, 11.9, 3.0), V(10, 0.6, 0.5), 50, 48) },
    ];
  };

  // ------------------------------------------------------------------ 13. the flood
  S.flood = (s0) => [
    { at: 0, set: 'world', light: 'morning', focus: V(-10, 0, 0),
      init(W) { W.flood.visible = true; W.portc.visible = false; W.rig.group.position.set(0, -50, 0);
        show(W.cast.duke, V(2.1, 8.0, -7.0), V(8, 9, -3), [{ t: s0 - 1, expr: 'panic', pose: 'raise', shake: 1, look: V(6, 3, -5) }, { t: s0 + 1.3, expr: 'shock', squash: 1, look: 'camera', pose: 'cower' }]);
        show(W.cast.g1, V(2.1, 8.0, -9.0), V(8, 9, -3), [{ t: s0 - 1, expr: 'worried', pose: 'hold', look: head(W.cast.duke) }]); },
      tick(W, t) { W.flood.position.y = 3.25 + Math.sin(t * 0.8) * 0.04; },
      cam: move(V(26, 20, 28), V(-10, 2, -2), V(31, 25, 35), V(-10, 2, -2), 48, 50) },
    { at: 1.05, set: 'world', light: 'morning', focus: V(2, 0, -6), inherit: true,
      cam: move(V(8.0, 9.6, -3.0), V(2.1, 9.5, -7.4), V(7.0, 9.65, -4.0), V(2.1, 9.5, -7.4), 38, 36) },
  ];

  // ------------------------------------------------------------------ 14. inside the well (mechanism)
  S.inside = (s0) => {
    const wl = w('inside', 'little'), wf = w('inside', 'flood'), wy = w('inside', 'yanked'), wh = w('inside', 'hammer');
    const level = (t) => -8.0 + 2.2 * ease(ramp(t, wl, wl + 1.0)) + 5.5 * ease(ramp(t, wf, wf + 1.5));
    const pinOut = (t) => ease(ramp(t, wy - 0.1, wy + 0.2));
    const tick = (C, t) => C.setLevel(level(t), pinOut(t));
    return [
      { at: 0, set: 'cut', init(C) { C.rig.setStrikes([]); C.rig.setContinuous(wy + 0.15, 0.3); }, tick,
        cam: move(V(0, 7.5, 10), V(0, 2.5, 0), V(0, -3.0, 10.5), V(0, -5.5, 0), 46, 46) },
      { at: w('inside', 'pipe') - s0 - 0.1, set: 'cut', tick, cam: move(V(3.5, -6.6, 7.5), V(3.5, -8.2, 0), V(15, -6.4, 7.5), V(17, -8.4, -1), 42, 44) },
      { at: wl - s0 - 0.15, set: 'cut', tick, cam: (lt) => { const y = level(s0 + lt); return { p: V(2.2, y + 1.2, 5.0), l: V(0, y + 0.1, 0), fov: 40 }; } },
      { at: wf - s0 - 0.15, set: 'cut', tick, cam: (lt) => { const y = level(s0 + lt); return { p: V(3.2, Math.min(4.2, y + 2.4), 8.5), l: V(0, Math.min(4.0, y + 3.0), 0), fov: 46 }; } },
      { at: wh - s0 - 0.35, set: 'cut', tick, cam: (lt, u) => { const a = lerp(-0.55, 0.35, ease(u)); return { p: V(Math.sin(a) * 6.8, 3.6, Math.cos(a) * 6.8), l: V(0, 3.4, 0), fov: 44 }; } },
    ];
  };

  // ------------------------------------------------------------------ 15. finale (she looks at us, knowingly)
  S.finale = (s0) => {
    const tr = w('finale', 'ring'), ta = w('finale', 'And'), tc = w('finale', 'closer'); const M = T.MOUNT;
    return [
      { at: 0, set: 'world', light: 'dusk', focus: M,
        init(W) { W.storm.visible = true; W.flood.visible = false; W.portc.visible = false; W.rig.group.position.copy(M); W.rig.setStrikes([tr]);
          show(W.cast.eng, M.clone().add(V(-2.2, 0, 1.5)), M.clone().add(V(5, 0, 14)), [
            { t: s0 - 1, expr: 'worried', look: V(12, 30, -195), pose: 'idle' },
            { t: tr - 0.05, expr: 'shock', squash: 1, look: M.clone().add(V(0, 3.6, 0)) },
            { t: tr + 0.5, expr: 'skeptic', look: V(12, 30, -195), pose: 'point' },
            { t: ta - 0.2, expr: 'smug', look: 'camera', pose: 'hips', tilt: 5 },
            { t: tc - 0.1, eyes: 'half', squash: 1 }]); },
        cam: (lt, u) => ({ p: M.clone().add(V(lerp(5, 4.2, ease(u)), 1.7, lerp(14, 12, ease(u)))), l: M.clone().add(V(-1.5, 7, -40)), fov: 60 }) },
      { at: ta - s0 - 0.1, set: 'world', light: 'dusk', focus: M,
        init(W) { W.rig.setStrikes([]); W.rig.setContinuous(ta + 0.4, 1.4); },
        tick(W) { W.scene.fog.near = 120; W.scene.fog.far = 1500; },
        cam: path([[0, V(16, 5.5, -141), V(12, 3.0, -150), 44], [0.35, V(24, 28, -110), V(12, 6, -165), 48], [1, V(46, 175, 240), V(6, 0, -110), 46]]) },
    ];
  };

  return S;
}

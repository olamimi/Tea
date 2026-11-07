// Shot list. Each shot = segments; each segment picks a set, lighting, cast, and a camera path.
import * as THREE from 'three';
const V = (x, y, z) => new THREE.Vector3(x, y, z);
const lerp = (a, b, u) => a + (b - a) * u;
export const ease = (u) => 0.5 - 0.5 * Math.cos(Math.PI * Math.min(1, Math.max(0, u)));
const ramp = (t, a, b) => Math.min(1, Math.max(0, (t - a) / (b - a)));

// Rig location in the city (on the quay outside the river gate).
const RIG = V(4.6, 0, -7);

function place(c, p, state = {}, extra = {}) { c.group.visible = true; c.group.position.copy(p); c.setState({ expr: 'neutral', pose: 'idle', ...state }); c.set({ talking: false, run: false, shake: 0, ...extra }); }
const path = (keys) => (lt, u) => { // keys: [[u, pos, look, fov]]
  let i = 0; while (i < keys.length - 2 && u > keys[i + 1][0]) i++;
  const [u0, p0, l0, f0] = keys[i], [u1, p1, l1, f1] = keys[Math.min(i + 1, keys.length - 1)];
  const k = ease((u - u0) / Math.max(1e-6, u1 - u0));
  return { p: p0.clone().lerp(p1, k), l: l0.clone().lerp(l1, k), fov: lerp(f0, f1 ?? f0, k) };
};
const move = (p0, l0, p1, l1, f0 = 40, f1 = f0) => path([[0, p0, l0, f0], [1, p1, l1, f1]]);

export function buildShots(T) {
  // T.word(shot, word, nth) -> global time; T.shot(name) -> {start,end}
  const S = {};

  S.hook = (s0) => [
    { at: 0, set: 'world', light: 'day', focus: RIG,
      init(W) { const c = W.cast; place(c.eng, V(3.9, 0, -4.4), { expr: 'smug', pose: 'point' }); place(c.duke, V(6.6, 0, -2.2), { expr: 'bored' }); place(c.g1, V(5.9, 0, -3.6), { pose: 'hold' }); place(c.g2, V(7.5, 0, -3.4), { pose: 'hold' }); W.rig.group.position.copy(RIG); },
      cam: move(V(2.6, 1.8, 1.4), V(4.4, 2.0, -6), V(3.1, 1.75, -0.8), V(4.5, 2.1, -6.2), 44, 40) },
    { at: 1.4, set: 'world', light: 'day', focus: RIG,
      cam: move(V(5.6, 3.3, -5.0), V(4.6, 3.6, -7), V(3.7, 3.4, -5.1), V(4.6, 3.6, -7), 30, 28) },
    { at: T.word('hook', 'Duke:') - s0 - 0.12, set: 'world', light: 'day', focus: RIG,
      cam: move(V(6.4, 1.95, 1.6), V(6.6, 1.75, -2.2), V(6.5, 1.95, 0.7), V(6.6, 1.75, -2.2), 36, 34) },
    { at: T.word('hook', 'if') - s0 - 0.05, set: 'world', light: 'day', focus: RIG,
      tick(W, t) { const c = W.cast.eng; c.talking = t < T.word('hook', 'climb.') + 0.4; if (t > T.word('hook', 'climb.') - 0.05) c.setState({ pose: 'raise', expr: 'worried' }); else c.setState({ pose: 'point', expr: 'smug' }); },
      cam: move(V(3.0, 1.95, -1.9), V(3.9, 1.85, -4.4), V(3.25, 1.95, -2.6), V(3.9, 1.85, -4.4), 34, 32) },
  ];

  S.laugh = () => [
    { at: 0, set: 'hall',
      init(H) { const c = H.cast; place(c.duke, V(0, 0.5, -14.2), { expr: 'laugh' }); place(c.g1, V(-2.2, 0.5, -13.8), { expr: 'laugh', pose: 'hold' }); place(c.g2, V(2.2, 0.5, -13.8), { expr: 'laugh', pose: 'hold' });
        place(c.c1, V(-2.8, 0, -10.5), { expr: 'laugh' }); place(c.c2, V(2.8, 0, -10.5), { expr: 'laugh', pose: 'point' }); place(c.c3, V(-3.0, 0, -7.8), { expr: 'laugh' }); place(c.c4, V(3.0, 0, -7.8), { expr: 'happy' }); },
      cam: move(V(0.3, 2.15, -10.2), V(0, 1.85, -14.2), V(0.15, 2.1, -11.4), V(0, 1.85, -14.2), 34, 32) },
    { at: 0.8, set: 'hall', cam: move(V(4.6, 3.0, -3.8), V(0, 1.5, -12), V(3.9, 2.8, -4.6), V(0, 1.5, -12), 46, 44) },
  ];

  S.device = (s0, d) => [
    { at: 0, set: 'world', light: 'day', focus: RIG,
      init(W) { const c = W.cast; place(c.eng, V(2.6, 0, -6.2), { expr: 'happy', pose: 'point' }); W.rig.group.position.copy(RIG); },
      cam: (lt, u) => { const a = lerp(0.15, 1.15, ease(u * 0.9)); return { p: V(RIG.x + Math.sin(a) * 7.5, 3.2 - u * 0.6, RIG.z + Math.cos(a) * 7.5), l: V(RIG.x, 2.1, RIG.z), fov: 44 }; } },
    { at: T.word('device', 'copper') - s0 - 0.35, set: 'world', light: 'day', focus: RIG,
      cam: move(V(4.6, 3.0, -5.6), V(4.82, 0.55, -7), V(4.62, 2.0, -6.1), V(4.85, 0.55, -7), 40, 34) },
    { at: T.word('device', 'chain') - s0 - 0.25, set: 'world', light: 'day', focus: RIG,
      cam: move(V(5.2, 0.9, -4.6), V(5.3, 2.2, -7), V(5.3, 1.0, -4.9), V(5.8, 3.8, -7), 42, 40) },
  ];

  S.walls = (s0) => [
    { at: 0, set: 'world', light: 'day', focus: V(-6, 0, 0),
      init(W) { const c = W.cast; place(c.duke, V(2.0, 8.0, 0.8), { expr: 'smug' }); place(c.g1, V(2.0, 8.0, -1.2), { pose: 'hold' }); place(c.g2, V(2.0, 8.0, 2.8), { pose: 'hold' }); place(c.eng, V(3.4, 0, -5.2), { expr: 'smug', pose: 'shrug' }); W.rig.group.position.copy(RIG); },
      cam: path([[0, V(7.0, 9.3, 4.6), V(2.0, 9.1, 0.8), 34], [0.25, V(8.5, 10.5, 6.0), V(1.5, 8.6, 0.6), 38], [1, V(30, 30, 30), V(-10, 3, -2), 50]]) },
    { at: T.word('walls', 'And') - s0 - 0.05, set: 'world', light: 'day', focus: RIG,
      cam: move(V(6.2, 0.45, -1.2), V(3.6, 3.8, -8), V(6.0, 0.5, -2.0), V(3.6, 3.9, -8), 56, 54) },
  ];

  S.ring1 = (s0) => {
    const tr = T.word('ring1', 'rang');
    return [
      { at: 0, set: 'world', light: 'day', focus: RIG,
        init(W) { const c = W.cast; place(c.eng, V(6.4, 0, -5.4), { expr: 'bored' }); W.rig.group.position.copy(RIG); W.rig.setStrikes([tr]); },
        tick(W, t) { W.cast.eng.setState(t < tr ? { expr: 'bored', pose: 'idle' } : t < tr + 0.5 ? { expr: 'panic', pose: 'raise' } : { expr: 'happy', pose: 'point' }); },
        cam: move(V(3.5, 2.2, 0.2), V(5.1, 2.5, -7), V(3.7, 2.3, -1.8), V(5.2, 2.6, -7), 44, 40) },
      { at: T.word('ring1', 'But') - s0 - 0.05, set: 'world', light: 'day', focus: V(10, 0, 0),
        cam: move(V(8.6, 1.3, -14), V(10.4, 0.2, 20), V(9.2, 1.5, -9), V(10.4, 0.2, 24), 50, 48) },
    ];
  };

  S.boat = () => [
    { at: 0, set: 'world', light: 'day', focus: V(10, 0, 12),
      init(W) { W.boat.visible = true; W.boat.position.set(10, 0, 12); W.boat.rotation.y = 0.3; place(W.cast.duke, V(10, 0.25, 12.4), { expr: 'bored' }); place(W.cast.g3, V(10.1, 0.25, 10.4), { pose: 'hold' }); },
      tick(W, t) { W.boat.position.y = Math.sin(t * 1.3) * 0.01; },
      cam: move(V(6.0, 1.9, 17.0), V(10, 1.2, 12), V(6.8, 1.75, 15.6), V(10, 1.3, 12), 38, 36) },
    { at: 0.95, set: 'world', light: 'day', focus: V(10, 0, 12), inherit: true,
      cam: move(V(8.9, 2.1, 14.6), V(10, 1.95, 12.4), V(9.1, 2.1, 14.0), V(10, 1.95, 12.4), 28, 26) },
  ];

  S.feast = () => [
    { at: 0, set: 'hall',
      init(H) { H.feast.visible = true; const c = H.cast; place(c.duke, V(0, 0, -11.6), { expr: 'laugh' });
        place(c.c1, V(-1.6, 0, -8.5), { expr: 'laugh' }); place(c.c2, V(1.6, 0, -7.5), { expr: 'laugh', pose: 'point' }); place(c.c3, V(-1.6, 0, -5.5), { expr: 'laugh' }); place(c.c4, V(1.6, 0, -4.5), { expr: 'laugh', pose: 'shrug' });
        place(c.g1, V(-1.6, 0, -2.6), { expr: 'laugh', pose: 'hold' }); place(c.g2, V(1.6, 0, -1.6), { expr: 'laugh', pose: 'hold' }); },
      cam: move(V(-4.8, 2.6, 1.0), V(0, 1.6, -6), V(-4.2, 2.4, -3.2), V(0, 1.5, -8.5), 44, 42) },
  ];

  S.decree = (s0) => {
    const db = T.word('decree', 'doorbell,');
    const thr = T.word('decree', 'threw');
    return [
      { at: 0, set: 'hall',
        init(H) { H.feast.visible = false; const c = H.cast; place(c.duke, V(0, 0.5, -14.2), { expr: 'smug' }); place(c.g1, V(-2.2, 0.5, -13.8), { pose: 'hold' }); place(c.g2, V(2.2, 0.5, -13.8), { pose: 'hold', expr: 'happy' }); },
        tick(H, t) { const d = H.cast.duke; d.talking = true; d.setState({ pose: t > db - 0.2 ? 'shrug' : 'idle' }); },
        cam: move(V(0, 2.15, -9.0), V(0, 1.95, -14.2), V(0, 2.1, -11.0), V(0, 2.0, -14.2), 32, 30) },
      { at: thr - s0 - 0.1, set: 'world', light: 'day', focus: V(4, 0, 0),
        init(W) { const c = W.cast; W.rig.group.position.set(0, -50, 0); W.cart.visible = true;
          place(c.eng, V(4.0, 0, 0.4), { expr: 'sad', pose: 'pull' }); place(c.g1, V(2.4, 0, -2.6), { expr: 'laugh', pose: 'point' }); place(c.g2, V(2.4, 0, 2.8), { expr: 'laugh', pose: 'hold' }); place(c.duke, V(2.0, 8.0, 0.8), { expr: 'smug' }); },
        tick(W, t) { const k = t - thr; const x = 4.0 + k * 1.6; W.cast.eng.group.position.x = x; W.cart.position.set(x - 1.9, 0, 0.4); W.cart.rotation.y = 0; W.cast.eng.run = false; },
        cam: move(V(12.5, 2.0, 3.6), V(3.2, 2.6, 0), V(11.4, 1.9, 2.8), V(3.6, 2.5, 0), 44, 42) },
    ];
  };

  S.haul = (s0, d) => {
    const tl = T.word('haul', 'and');
    return [
      { at: 0, set: 'world', light: 'sunset', focus: V(4.5, 0, -40),
        init(W) { const c = W.cast; W.cart.visible = true; W.rig.group.position.set(0, -50, 0); place(c.eng, V(4.5, 0, -32), { expr: 'sad', pose: 'pull' }); },
        tick(W, t) { const k = t - s0; const z = -32 - k * 1.5; W.cast.eng.group.position.set(4.5, 0, z); W.cart.position.set(4.5, 0, z + 1.9); W.cart.rotation.y = Math.PI / 2; W.cast.eng.mesh.position.y = Math.abs(Math.sin(k * 6)) * 0.05; },
        cam: (lt, u) => { const z = -32 - lt * 1.5; return { p: V(-2.5, 1.3, z + 3.5), l: V(4.5, 1.7, z - 1.2), fov: 46 }; } },
      { at: tl - s0 - 0.05, set: 'world', light: 'dusk', focus: V(6, 0, -150),
        init(W) { const c = W.cast; W.cart.visible = false; W.rig.group.position.copy(W.MOUNT); place(c.eng, W.MOUNT.clone().add(V(-3.0, 0, 0.6)), { expr: 'happy' }); },
        cam: (lt, u) => { const M = T.MOUNT; const k = ease(u); return { p: M.clone().add(V(lerp(3, 2, k), lerp(3.2, 2.6, k), lerp(11, 8.5, k))), l: M.clone().add(V(-1.5, 2.2, 0)), fov: 44 }; } },
    ];
  };

  S.night = (s0) => {
    const tr = T.word('night', 'rang.');
    return [
      { at: 0, set: 'world', light: 'night', focus: T.MOUNT,
        init(W) { const c = W.cast; W.rig.group.position.copy(W.MOUNT); W.rig.setStrikes([]); W.rig.setContinuous(tr, 0.34); place(c.eng, W.MOUNT.clone().add(V(-3.0, 0, 0.6)), { expr: 'sleep' }); },
        tick(W, t) { W.cast.eng.setState(t < tr + 0.08 ? { expr: 'sleep', pose: 'idle' } : { expr: 'panic', pose: 'raise' }); W.cast.eng.shake = t > tr ? 1 : 0; },
        cam: (lt, u) => { const M = T.MOUNT; return { p: M.clone().add(V(lerp(7, 5.5, ease(u)), 3.4, lerp(15, 12.5, ease(u)))), l: M.clone().add(V(-1.5, 3.6, -2)), fov: 48 }; } },
      { at: tr - s0 - 0.55, set: 'world', light: 'night', focus: T.MOUNT, inherit: true,
        cam: (lt, u) => { const M = T.MOUNT; return { p: M.clone().add(V(-2.2, 1.85, 3.6 - u * 0.3)), l: M.clone().add(V(-3.0, 1.75, 0.6)), fov: 34 }; } },
      { at: T.word('night', 'And') - s0 - 0.05, set: 'world', light: 'night', focus: T.MOUNT, inherit: true,
        cam: (lt, u) => { const M = T.MOUNT; const sh = 0.035; return { p: M.clone().add(V(1.8 - u * 0.4 + Math.sin(lt * 9) * sh, 1.0 + Math.sin(lt * 12.7) * sh, 4.4 - u * 0.8)), l: M.clone().add(V(0, 3.7, 0)), fov: 46 }; } },
    ];
  };

  S.gate = (s0) => {
    const te = T.word('gate', 'Everyone!');
    return [
      { at: 0, set: 'world', light: 'night', focus: V(4, 0, -8),
        init(W) { const c = W.cast; W.rig.group.position.set(0, -50, 0); W.portc.visible = true; place(c.eng, V(4.6, 0, -30), { expr: 'panic', pose: 'raise' }, { run: true }); W.lantern.intensity = 8; },
        tick(W, t) { const k = t - s0; const z = -24 + k * 6; W.cast.eng.group.position.set(4.6, 0, z); W.lantern.position.set(4.9, 1.6, z + 0.3); },
        cam: (lt) => { const z = -24 + lt * 6; return { p: V(5.6, 1.1, z + 5.5), l: V(4.6, 1.6, z), fov: 44 }; } },
      { at: te - s0 - 0.25, set: 'world', light: 'night', focus: V(3, 0, 0),
        init(W) { W.portc.visible = true; place(W.cast.eng, V(5.4, 0, 0.3), { expr: 'panic', pose: 'raise' }, { talking: true }); W.lantern.position.set(5.8, 1.6, 0.6); },
        cam: move(V(0.0, 1.85, 0.4), V(5.4, 1.85, 0.3), V(0.7, 1.85, 0.3), V(5.4, 1.9, 0.3), 40, 36) },
    ];
  };

  S.guard = (s0) => {
    const tt = T.word('guard', 'They');
    return [
      { at: 0, set: 'world', light: 'night', focus: V(2, 0, 0),
        init(W) { const c = W.cast; W.portc.visible = true; W.lantern.intensity = 0; place(c.g1, V(2.3, 8.0, 0.6), { expr: 'smug', pose: 'lean' }, { talking: true }); place(c.g2, V(2.2, 8.0, -1.8), { expr: 'happy', pose: 'hold' }); },
        tick(W, t) { W.cast.g1.talking = t < tt - 0.3; },
        cam: move(V(5.6, 9.6, 2.6), V(2.3, 9.3, 0.6), V(5.0, 9.6, 2.2), V(2.3, 9.3, 0.6), 36, 34) },
      { at: tt - s0 - 0.05, set: 'world', light: 'night', focus: V(6, 0, 4),
        init(W) { const c = W.cast; place(c.g1, V(2.3, 8.0, -1.0), { expr: 'laugh', pose: 'point' }); place(c.g2, V(2.4, 8.0, -3.0), { expr: 'laugh', pose: 'hold' }); place(c.g3, V(2.3, 8.0, 1.4), { expr: 'laugh', pose: 'hold' }); place(c.eng, V(8, 0, 4), { expr: 'sad' }); W.lantern.intensity = 5; },
        tick(W, t) { const k = t - tt; W.cast.eng.group.position.set(8 + k * 0.9, 0, 4 - k * 1.6); W.lantern.position.set(8.3 + k * 0.9, 1.5, 4.2 - k * 1.6); },
        cam: move(V(0.6, 11.6, 2.6), V(9, 0.6, 1.5), V(0.6, 11.9, 3.0), V(10, 0.6, 0.5), 50, 48) },
    ];
  };

  S.flood = () => [
    { at: 0, set: 'world', light: 'morning', focus: V(-10, 0, 0),
      init(W) { W.flood.visible = true; W.portc.visible = false; W.lantern.intensity = 0; W.rig.group.position.set(0, -50, 0); place(W.cast.duke, V(2.1, 8.0, -7.0), { expr: 'panic', pose: 'raise' }); place(W.cast.g1, V(2.1, 8.0, -9.0), { expr: 'worried', pose: 'hold' }); },
      tick(W, t) { W.flood.position.y = 3.25 + Math.sin(t * 0.8) * 0.04; },
      cam: move(V(26, 20, 28), V(-10, 2, -2), V(31, 25, 35), V(-10, 2, -2), 48, 50) },
    { at: 1.05, set: 'world', light: 'morning', focus: V(2, 0, -6), inherit: true,
      cam: move(V(8.0, 9.0, -3.0), V(2.1, 9.1, -7.6), V(7.0, 9.1, -4.0), V(2.1, 9.1, -7.6), 36, 34) },
  ];

  S.inside = (s0) => {
    const wl = T.word('inside', 'little'), wf = T.word('inside', 'flood'), wy = T.word('inside', 'yanked'), wh = T.word('inside', 'hammer');
    const level = (t) => -8.0 + 2.2 * ease(ramp(t, wl, wl + 1.0)) + 5.5 * ease(ramp(t, wf, wf + 1.5));
    const pinOut = (t) => ease(ramp(t, wy - 0.1, wy + 0.2));
    return [
      { at: 0, set: 'cut',
        init(C) { C.rig.setStrikes([]); C.rig.setContinuous(wy + 0.15, 0.3); },
        tick(C, t) { C.setLevel(level(t), pinOut(t)); },
        cam: move(V(0, 7.5, 10), V(0, 2.5, 0), V(0, -3.0, 10.5), V(0, -5.5, 0), 46, 46) },
      { at: T.word('inside', 'pipe') - s0 - 0.1, set: 'cut', tick(C, t) { C.setLevel(level(t), pinOut(t)); },
        cam: move(V(3.5, -6.6, 7.5), V(3.5, -8.2, 0), V(15, -6.4, 7.5), V(17, -8.4, -1), 42, 44) },
      { at: wl - s0 - 0.15, set: 'cut', tick(C, t) { C.setLevel(level(t), pinOut(t)); },
        cam: (lt) => { const y = level(s0 + lt); return { p: V(2.2, y + 1.2, 5.0), l: V(0, y + 0.1, 0), fov: 40 }; } },
      { at: wf - s0 - 0.15, set: 'cut', tick(C, t) { C.setLevel(level(t), pinOut(t)); },
        cam: (lt, u) => { const y = level(s0 + lt); return { p: V(3.2, Math.min(4.2, y + 2.4), 8.5), l: V(0, Math.min(4.0, y + 3.0), 0), fov: 46 }; } },
      { at: wh - s0 - 0.35, set: 'cut', tick(C, t) { C.setLevel(level(t), pinOut(t)); },
        cam: (lt, u) => { const a = lerp(-0.55, 0.35, ease(u)); return { p: V(Math.sin(a) * 6.8, 3.6, Math.cos(a) * 6.8), l: V(0, 3.4, 0), fov: 44 }; } },
    ];
  };

  S.finale = (s0, d) => {
    const tr = T.word('finale', 'ring');
    const ta = T.word('finale', 'And');
    return [
      { at: 0, set: 'world', light: 'dusk', focus: T.MOUNT,
        init(W) { W.storm.visible = true; W.flood.visible = false; W.portc.visible = false; W.rig.group.position.copy(W.MOUNT); W.rig.setStrikes([tr]); place(W.cast.eng, W.MOUNT.clone().add(V(-2.2, 0, 1.5)), { expr: 'worried', pose: 'point' }); },
        cam: (lt, u) => { const M = T.MOUNT; return { p: M.clone().add(V(lerp(5, 4.2, ease(u)), 1.7, lerp(14, 12, ease(u)))), l: M.clone().add(V(-1.5, 8, -40)), fov: 60 }; } },
      { at: ta - s0 - 0.1, set: 'world', light: 'dusk', focus: T.MOUNT,
        init(W) { W.rig.setStrikes([]); W.rig.setContinuous(ta + 0.4, 1.4); },
        tick(W, t, u) { W.scene.fog.near = 120; W.scene.fog.far = 1500; },
        cam: path([[0, V(16, 5.5, -141), V(12, 3.2, -150), 44], [0.35, V(24, 28, -110), V(12, 6, -165), 48], [1, V(46, 175, 240), V(6, 0, -110), 46]]) },
    ];
  };

  return S;
}

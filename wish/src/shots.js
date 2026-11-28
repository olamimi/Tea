// "The Wish" (In this world...). Camera grammar: one continuous move per scene (segments in the same set glide into
// each other), zoom-throughs between scenes, white flashes on the memory beats, a few hard cuts, shake only on barks.
import * as THREE from 'three';
const V = (x, y, z) => new THREE.Vector3(x, y, z);
const lerp = (a, b, u) => a + (b - a) * u;
export const ease = (u) => 0.5 - 0.5 * Math.cos(Math.PI * Math.min(1, Math.max(0, u)));
const ramp = (t, a, b) => Math.min(1, Math.max(0, (t - a) / (b - a)));
const path = (keys) => (lt, u) => { let i = 0; while (i < keys.length - 2 && u > keys[i + 1][0]) i++;
  const [u0, p0, l0, f0] = keys[i], [u1, p1, l1, f1] = keys[Math.min(i + 1, keys.length - 1)]; const k = ease((u - u0) / Math.max(1e-6, u1 - u0));
  return { p: p0.clone().lerp(p1, k), l: l0.clone().lerp(l1, k), fov: lerp(f0, f1 ?? f0, k) }; };
const move = (p0, l0, p1, l1, f0 = 40, f1 = f0) => path([[0, p0, l0, f0], [1, p1, l1, f1]]);
const yawTo = (from, to) => Math.atan2(to.x - from.x, to.z - from.z);
function show(c, pos, face, keys = [], words = null) { c.root.visible = true; c.reset(); c.place(pos, typeof face === 'number' ? face : yawTo(pos, face)); c.act(keys); if (words) c.say(words); return c; }
function showDog(S, pos, dir, keys = [], barks = []) { const d = S.dog; d.reset(); d.root.visible = true; d.place(pos, dir); d.act(keys); d.barks(barks); return d; }
const handW = (c, side = 'R') => { c.root.updateMatrixWorld(true); const h = side === 'R' ? c.handR : c.handL; if (!h) return c.root.position.clone().add(V(0, c.spec.H * 0.9, 0)); return c.torso.localToWorld(h.clone()); };
const track = (f) => { f.track = true; return f; };
const CU = (who, { az = 0.35, el = 0.08, frac = 0.36, fov = 32, drift = 0.1, dy = 0.8, yaw = null, hk = 1 } = {}) => track((lt, u, t, set) => {
  const c = set.cast[who]; c.root.updateMatrixWorld(true); const hw = c.head.getWorldPosition(V(0, 0, 0)); const r = c.root.position; const h = V(r.x * (1 - hk) + hw.x * hk, hw.y, r.z * (1 - hk) + hw.z * hk); const hr = c.hr;
  const d = hr / (frac * Math.tan(fov * Math.PI / 360)); const a = (yaw ?? c.facing) + az + drift * (u - 0.5);
  return { p: V(h.x + Math.sin(a) * Math.cos(el) * d, h.y + Math.sin(el) * d, h.z + Math.cos(a) * Math.cos(el) * d), l: V(h.x, h.y - dy * hr, h.z), fov };
});
// dog close-up: camera at angle a (world yaw) around the dog, aimed at a point on the card (side: + toward the head, - toward the tail)
const dogCU = ({ a = 0, dist = 1.4, h = 0.55, side = 0, fov = 34, push = 0.15, el = 0.05 } = {}) => track((lt, u, t, S) => { const d = S.dog; const p = d.root.position;
  const cp = V(p.x + Math.sin(a) * dist * (1 - push * u), p.y + h + el * dist, p.z + Math.cos(a) * dist * (1 - push * u)); const right = V(Math.cos(a), 0, -Math.sin(a)); const sgn = d.dir.dot(right) >= -0.05 ? 1 : -1;
  const l = V(p.x, p.y + h, p.z).addScaledVector(right, side * sgn); return { p: cp.addScaledVector(right, side * sgn), l, fov }; });
const follow = (who, off, look = V(0, 1.2, 0), fov = 40) => track((lt, u, t, S) => { const r = (who === 'dog' ? S.dog : S.cast[who]).root.position; return { p: r.clone().add(off), l: r.clone().add(look), fov }; });
const KNEEL = { sit: 0.62, lean: 14, headTilt: 0 };
const board = (S, who, extra = {}) => { const c = S.cast[who], b = S.boards[who]; b.visible = true; b.position.set(c.root.position.x, c.root.position.y - 0.13 + (extra.dy || 0), c.root.position.z); b.rotation.set(extra.rx || 0, c.facing, extra.rz || 0); };

export function buildShots(T) {
  const S = {}; const w = (shot, word, n = 1) => T.word(shot, word, n);
  const all = (shot) => T.shotWords(shot);
  const at = (s0, t, lead = 0.12) => t - s0 - lead;

  // 1. HOOK: crane down onto the glowing WISH DAY gate; townsfolk stroll past
  S.hook = (s0, d) => {
    const init = (Tn) => {
      show(Tn.cast.tA, V(-3.2, 0, -27), Math.PI / 2, [{ t: s0 - 1, expr: 'happy' }]).walk({ t0: s0 - 1, t1: s0 + d + 1, from: V(-3.2, 0, -27), to: V(1.6, 0, -27.6), mode: 'walk', ease: false });
      show(Tn.cast.tB, V(2.8, 0, -29), -Math.PI / 2, [{ t: s0 - 1, expr: 'content' }]).walk({ t0: s0 - 1, t1: s0 + d + 1, from: V(2.8, 0, -29), to: V(-1.2, 0, -29.4), mode: 'walk', ease: false });
      show(Tn.cast.tC, V(-1.6, 0, -31.5), 0.4, [{ t: s0 - 1, expr: 'happy', pose: 'wave' }]);
      show(Tn.cast.tD, V(1.2, 0, -24), Math.PI, [{ t: s0 - 1, expr: 'content' }]).walk({ t0: s0 - 1, t1: s0 + d + 1, from: V(1.2, 0, -24), to: V(0.6, 0, -30), mode: 'walk', ease: false }); };
    return [{ at: 0, set: 'town', init, cam: path([[0, V(0, 15, -14), V(0, 7.5, -34), 40], [0.7, V(1.2, 3.6, -19), V(0, 4.4, -34), 44], [1, V(1.4, 2.6, -20.5), V(0, 4.2, -34), 44]]) }]; };

  // 2. HUSS: dark bedroom, extreme close-up, panting, heaving on each breath
  S.huss = (s0, d) => { const hw_ = all('huss');
    const init = (B) => { B.lamp.intensity = 2.5; show(B.cast.max, V(-1.2, 0, 0.9), 0.5, [{ t: s0 - 1, expr: 'panic', sweat: true, pose: 'cower' }, ...hw_.map((x) => ({ t: x.start, squash: 1 }))]); };
    return [{ at: 0, set: 'bedroom', trans: 'cut', init, cam: CU('max', { az: 0.1, frac: 0.62, dy: 0.2, fov: 30, drift: 0.04 }) }]; };

  // 3. TURN: the town board, then Max throws a fist in the air (sparkles)
  S.turn = (s0, d) => { const tf = w('turn', 'finally'), tt = w('turn', 'turn.');
    const init = (Tn) => { show(Tn.cast.max, V(2.1, 0, -27.6), 0.3, [{ t: s0 - 1, expr: 'hopeful', look: V(3.6, 2.2, -29.5) }, { t: tt - 0.25, pose: 'fist', expr: 'laugh', squash: 1, look: 'camera' }]).groove(all('turn'), 0.8); };
    const post = (Tn, t) => { if (t >= tt - 0.1 && !Tn.__sp) { } };
    const tick = (Tn) => { Tn.spark.clear(); Tn.spark.fire(handW(Tn.cast.max).add(V(0, 0.15, 0)), tt - 0.05, { n: 10, r: 0.5 }); };
    return [
      { at: 0, set: 'town', trans: 'zoom', init, tick, cam: move(V(1.6, 2.3, -25.4), V(3.6, 2.2, -29.5), V(2.3, 2.25, -26.5), V(3.6, 2.15, -29.5), 40, 36) },
      { at: at(s0, tf, 0.25), set: 'town', tick, post, cam: CU('max', { az: -0.3, frac: 0.26, dy: 1.6, fov: 36, drift: 0.12 }) },
    ]; };

  // 4. FUZZY: bedroom close-up, scratching his head, brows knitting
  S.fuzzy = (s0, d) => { const tc = w('fuzzy', "can't"), tz = w('fuzzy', 'fuzzy.');
    const init = (B) => { B.lamp.intensity = 7; show(B.cast.max, V(-0.6, 0, -0.4), 0.25, [{ t: s0 - 1, expr: 'neutral' }, { t: tc - 0.2, pose: 'scratch', eyes: 'skeptic', brows: 'worried', mouth: 'wavy' }, { t: tz - 0.2, expr: 'worried', sweat: false, pose: 'scratch', look: V(0.6, 2.4, 1) }]); };
    return [{ at: 0, set: 'bedroom', trans: 'zoom', init, cam: CU('max', { az: 0.3, frac: 0.36, dy: 0.9, drift: 0.12 }) }]; };

  // 5. PHOTO: slow push-in on the BEST BROS photo
  S.photo = (s0, d) => [{ at: 0, set: 'bedroom', init: (B) => { B.lamp.intensity = 7; }, cam: move(V(-0.45, 1.95, -0.2), V(-0.6, 2.05, -2.96), V(-0.58, 2.04, -1.75), V(-0.6, 2.05, -2.96), 40, 36) }];

  // 6. SKATE: tracking alongside Max and Leo skating down the sunny street
  const skaters = (Tn, s0, t1, z0, z1, keysM = [], keysL = []) => {
    show(Tn.cast.max, V(-1.0, 0.13, z0), Math.PI, [{ t: s0 - 1, pose: 'balance', expr: 'happy', lean: 8 }, ...keysM]).walk({ t0: s0 - 0.5, t1, from: V(-1.0, 0.13, z0), to: V(-1.0, 0.13, z1), mode: 'skate', ease: false });
    show(Tn.cast.leo, V(0.4, 0.13, z0 - 0.6), Math.PI, [{ t: s0 - 1, pose: 'balance', expr: 'laugh', lean: 8 }, ...keysL]).walk({ t0: s0 - 0.5, t1, from: V(0.4, 0.13, z0 - 0.6), to: V(0.4, 0.13, z1 - 0.6), mode: 'skate', ease: false }); };
  S.skate = (s0, d) => {
    const init = (Tn) => skaters(Tn, s0, s0 + d + 3, 14, 14 - (d + 3.5) * 3.2, [{ t: s0 + 1.0, look: V(0.4, 1.4, 0) }], [{ t: s0 + 0.6, look: 'camera' }]);
    const post = (Tn) => { board(Tn, 'max'); board(Tn, 'leo'); };
    return [{ at: 0, set: 'town', trans: 'zoom', init, post, cam: track((lt, u, t, Tn) => { const r = Tn.cast.leo.root.position; return { p: V(r.x + 2.6, 1.35, r.z - 3.0), l: V(r.x - 0.6, 1.05, r.z + 0.2), fov: 42 }; }) }]; };

  // 7. TRICKS: Leo's kickflip (spinning board + stars), Max grinds the bench, both launch off the jump
  S.tricks = (s0, d) => { const tk = w('tricks', 'Kickflips.'), tg = w('tricks', 'Grinds.'), te = w('tricks', 'Even'), tm = w('tricks', 'Mum'), td = w('tricks', 'doing.');
    const kick = (Tn) => { show(Tn.cast.leo, V(0.3, 0.13, 2), Math.PI, [{ t: s0 - 1, pose: 'balance', expr: 'happy', lean: 6 }, { t: tk + 0.05, pose: 'raise', expr: 'laugh', squash: 1 }, { t: tk + 0.8, pose: 'balance' }]).walk({ t0: s0 - 1, t1: tg, from: V(0.3, 0.13, 3.5), to: V(0.3, 0.13, -2.5), mode: 'skate', ease: false }); };
    const kpost = (Tn, t) => { const a = ramp(t, tk, tk + 0.6); const hop = Math.sin(Math.PI * a) * 0.75; Tn.cast.leo.root.position.y = 0.13 + hop; board(Tn, 'leo', { dy: hop * 0.92, rz: a * Math.PI * 2 }); };
    const ktick = (Tn) => { Tn.spark.clear(); Tn.spark.fire(V(0.3, 1.1, 0.6), tk + 0.25, { n: 10, r: 0.7, size: 0.2 }); };
    const grind = (Tn) => { show(Tn.cast.max, V(-3.9, 0.63, -3.6), Math.PI, [{ t: s0 - 1, pose: 'balance', expr: 'focus', lean: 4, tilt: -6 }, { t: te - 0.3, expr: 'laugh' }]).walk({ t0: tg - 0.5, t1: te + 0.2, from: V(-3.9, 0.63, -3.6), to: V(-3.9, 0.63, -8.6), mode: 'skate', ease: false }); };
    const gpost = (Tn) => { board(Tn, 'max', { rx: 0 }); Tn.boards.max.rotation.set(0, Math.PI / 2 + 0.25, 0); Tn.boards.max.position.y = 0.5; };
    const jump = (Tn) => { const t0 = te - 0.3, tj = tm + 0.1, t1 = td + 0.6;
      for (const [k, x, dz] of [['max', 0.35, 0], ['leo', 1.3, -0.4]]) show(Tn.cast[k], V(x, 0.13, -11), Math.PI, [{ t: s0 - 1, pose: 'balance', expr: 'focus', lean: 6 }, { t: tj, pose: 'raise', expr: 'laugh', squash: 1 }, { t: t1 - 0.4, pose: 'balance', expr: 'happy' }]).walk({ t0, t1, from: V(x, 0.13, -11 + dz), to: V(x, 0.13, -27 + dz), mode: 'skate', ease: false }); };
    const jpost = (Tn, t) => { for (const k of ['max', 'leo']) { const c = Tn.cast[k]; const z = c.root.position.z; const onRamp = z < -17 && z > -19.2 ? (-17 - z) / 2.2 : 0; const air = z <= -19.2 && z > -24.2 ? Math.sin(Math.PI * (-19.2 - z) / 5) * 1.3 + 0.9 * (1 - (-19.2 - z) / 5) : 0;
      const y = 0.13 + (onRamp ? onRamp * onRamp * 0.9 : air); c.root.position.y = y; board(Tn, k, { rx: onRamp ? -0.4 * onRamp : air ? -0.15 : 0 }); } };
    const jtick = (Tn) => { Tn.spark.clear(); Tn.spark.fire(V(0.8, 2.6, -21.5), tm + 0.35, { n: 12, r: 1.0, size: 0.22 }); };
    return [
      { at: 0, set: 'town', init: kick, post: kpost, tick: ktick, cam: track((lt, u, t, Tn) => { const r = Tn.cast.leo.root.position; return { p: V(r.x + 2.2, 0.9, r.z - 1.6), l: V(r.x, 0.9, r.z), fov: 44 }; }) },
      { at: at(s0, tg, 0.3), set: 'town', init: grind, post: gpost, cam: track((lt, u, t, Tn) => { const r = Tn.cast.max.root.position; return { p: V(r.x + 2.6, 1.3, r.z - 1.8), l: V(r.x, 1.3, r.z), fov: 42 }; }) },
      { at: at(s0, te, 0.35), set: 'town', init: jump, post: jpost, tick: jtick, cam: move(V(6.0, 1.6, -17.5), V(0.8, 1.6, -19.5), V(5.6, 1.9, -21.5), V(0.8, 1.9, -22.5), 44, 42) },
    ]; };

  // 8. ROAD: Leo skates on the road, smiling; the truck swerves in, headlights flare and fill the frame
  S.road = (s0, d) => { const tl = w('road', 'Leo'), ttr = w('road', 'truck'), ts = w('road', 'swerved.');
    const init = (Tn) => { show(Tn.cast.leo, V(0.6, 0.13, -6), 0, [{ t: s0 - 1, pose: 'balance', expr: 'happy', lean: 6 }, { t: ts - 0.1, expr: 'shock', pose: 'cower', squash: 1, look: V(0.6, 1.2, -30) }]).walk({ t0: s0 - 1, t1: s0 + d + 0.5, from: V(0.6, 0.13, -8), to: V(0.6, 0.13, 0), mode: 'skate', ease: false }); Tn.truck.visible = true; };
    const post = (Tn, t) => { board(Tn, 'leo'); const k = ramp(t, ttr - 0.6, s0 + d); const z = lerp(-60, -6, k); const sw = Math.sin(ramp(t, ts - 0.4, s0 + d) * Math.PI * 1.5) * 2.4; Tn.truck.position.set(-1.2 + sw, 0, z); Tn.truck.rotation.y = Math.cos(ramp(t, ts - 0.4, s0 + d) * Math.PI * 1.5) * 0.35 * ramp(t, ts - 0.4, ts); Tn.truck.userData.flare(ramp(t, ts - 0.3, s0 + d)); };
    return [
      { at: 0, set: 'town', trans: 'zoom', init, post, cam: track((lt, u, t, Tn) => { const r = Tn.cast.leo.root.position; return { p: V(r.x + 1.6, 1.2, r.z + 3.4), l: V(r.x, 1.1, r.z), fov: 42 }; }) },
      { at: at(s0, ttr, 0.35), set: 'town', post, fade: [[s0 + d - 0.35, s0 + d, 0, 0.85, '255,250,235']], cam: track((lt, u, t, Tn) => { const r = Tn.cast.leo.root.position; return { p: V(r.x + 0.9, 0.95, r.z + 2.2), l: V(r.x - 0.4, 1.3, r.z - 8), fov: 46 }; }) },
    ]; };

  // 9. SPRINT: tracking Max sprinting, leaning hard, mouth open in panic
  S.sprint = (s0, d) => {
    const init = (Tn) => { show(Tn.cast.max, V(-2.6, 0, 16), Math.PI, [{ t: s0 - 1, expr: 'panic', mouth: 'O', lean: 12, sweat: true }]).walk({ t0: s0 - 1, t1: s0 + d + 1, from: V(-2.6, 0, 16), to: V(-1.2, 0, 16 - (d + 2) * 6.5), mode: 'run', ease: false }); };
    return [{ at: 0, set: 'town', trans: 'whip', init, cam: track((lt, u, t, Tn) => { const r = Tn.cast.max.root.position; return { p: V(r.x + 2.4, 1.4, r.z - 2.8), l: V(r.x, 1.35, r.z), fov: 44 }; }) }]; };

  // 10. LATE: white flash -> the empty road at dusk, an upturned skateboard
  S.late = (s0, d) => [{ at: 0, set: 'town', trans: 'flash', flashColor: '255,250,240', init: (Tn) => { Tn.setTime('dusk'); Tn.upturned.visible = true; }, cam: move(V(2.2, 1.0, 9.5), V(-0.6, 0.3, 4), V(1.2, 0.7, 7.0), V(-0.6, 0.25, 4), 40, 36) }];

  // 11. SLUMP: bedroom at night, slumped on the edge of his bed
  S.slump = (s0, d) => { const init = (B) => { B.lamp.intensity = 2.5; show(B.cast.max, V(-1.72, 0, 0.6), Math.PI / 2 - 0.2, [{ t: s0 - 1, expr: 'sad', sit: 0.5, lean: 20, eyes: 'half', pose: 'idle', headTilt: 6 }]); };
    return [{ at: 0, set: 'bedroom', trans: 'zoom', init, cam: move(V(1.2, 1.5, 3.2), V(-1.7, 0.9, 0.5), V(0.5, 1.3, 2.4), V(-1.7, 0.95, 0.5), 40, 38) }]; };

  // 12. RESOLVE: rises from the bed and squares up; close-up determined fist with a quiet sparkle
  S.resolve = (s0, d) => { const tm = w('resolve', 'made'), tw = w('resolve', 'wish'), tb = w('resolve', 'back.');
    const init = (B) => { B.lamp.intensity = 5; show(B.cast.max, V(-1.72, 0, 0.6), Math.PI / 2 - 0.2, [{ t: s0 - 1, expr: 'sad', sit: 0.5, lean: 20, eyes: 'half' }, { t: tm - 0.5, sit: 0.5, lean: 20 }, { t: tm, sit: 0, lean: 0, expr: 'focus', squash: 1 }, { t: tw - 0.2, look: 'camera', expr: 'focus', mouth: 'smirk' }, { t: tb - 0.3, pose: 'fist', squash: 1 }]); };
    const tick = (B) => { B.spark.clear(); B.spark.fire(handW(B.cast.max).add(V(0, 0.1, 0)), tb - 0.05, { n: 8, r: 0.35, size: 0.12 }); };
    return [
      { at: 0, set: 'bedroom', init, tick, cam: move(V(0.6, 1.4, 2.6), V(-1.7, 1.2, 0.5), V(0.3, 1.6, 2.4), V(-1.6, 1.4, 0.5), 38, 40) },
      { at: at(s0, tw, 0.3), set: 'bedroom', tick, cam: CU('max', { az: 0.2, frac: 0.3, dy: 1.4, drift: 0.1 }) },
    ]; };

  // 13. SHRUG: close-up: an easy shrug and a little smirk
  S.shrug = (s0, d) => { const ta = w('shrug', 'anyway.'), tp = w('shrug', 'probably');
    const init = (B) => { B.lamp.intensity = 5; show(B.cast.max, V(-1.5, 0, 0.6), Math.PI / 2 - 0.2, [{ t: s0 - 1, expr: 'content', look: 'camera' }, { t: tp - 0.2, pose: 'shrug', expr: 'smug', squash: 1, headTilt: 10 }]).groove(all('shrug'), 0.8); };
    return [{ at: 0, set: 'bedroom', init, cam: CU('max', { az: -0.25, frac: 0.34, dy: 1.0, drift: 0.12 }) }]; };

  // 14. WAIT: the October calendar fills with red X's toward the circled WISH! day
  S.wait = (s0, d) => { const tw = w('wait', 'waited.');
    const post = (B, t) => B.calSet({ x: Math.round(lerp(10, 30, ramp(t, tw, s0 + d - 0.2))) });
    return [{ at: 0, set: 'bedroom', post, init: (B) => { B.lamp.intensity = 7; }, cam: move(V(1.15, 1.85, -1.1), V(1.3, 1.9, -2.97), V(1.25, 1.88, -1.75), V(1.3, 1.9, -2.97), 42, 38) }]; };

  // 15. NIGHT: night street, fireflies; Max walks home, stops and stares as a white dog appears under the streetlight
  S.night = (s0, d) => { const ts = w('night', 'saw');
    const init = (N) => { show(N.cast.max, V(0.6, 0, 9), Math.PI, [{ t: s0 - 1, expr: 'bored' }, { t: ts - 0.1, expr: 'shock', look: V(3.0, 0.6, -2.4), squash: 1 }]).walk({ t0: s0 - 1, t1: ts, from: V(0.6, 0, 9.5), to: V(0.6, 0, 3), mode: 'walk', ease: true });
      showDog(N, V(3.0, 0, -2.4), V(-1, 0, 0.3), [{ t: s0 - 1, mode: 'sit', wag: 0.8 }]); N.dog.root.visible = false; };
    const post = (N, t) => { N.dog.root.visible = t >= ts - 0.25; };
    const tick = (N) => { N.spark.clear(); N.spark.fire(V(3.0, 0.6, -2.4), ts - 0.25, { n: 8, r: 0.55, size: 0.14, color: [1.4, 1.8, 2.2] }); };
    return [
      { at: 0, set: 'night', trans: 'zoom', init, post, tick, cam: track((lt, u, t, N) => { const r = N.cast.max.root.position; return { p: V(r.x - 1.4, 1.5, r.z - 3.2), l: V(r.x + 0.4, 1.2, r.z), fov: 42 }; }) },
      { at: at(s0, ts, 0.3), set: 'night', post, tick, cam: move(V(-0.4, 1.7, 5.6), V(1.8, 0.9, -0.6), V(-0.1, 1.6, 4.9), V(1.9, 0.85, -0.8), 42, 40) },
    ]; };

  // 16. ICEY: close-up Icey wagging; cut to Max wide-eyed and sweating
  const nightBase = (N, s0, extra = {}) => { show(N.cast.max, V(0.6, 0, 3), Math.PI, [{ t: s0 - 1, expr: 'shock', look: V(3.0, 0.6, -2.4), sweat: true }, ...(extra.max || [])]);
    showDog(N, V(3.0, 0, -2.4), V(-1, 0, 0.3), [{ t: s0 - 1, mode: extra.mode || 'stand', wag: 1 }, ...(extra.dog || [])], extra.barks || []); };
  S.icey = (s0, d) => { const th = w('icey', 'He');
    return [
      { at: 0, set: 'night', init: (N) => nightBase(N, s0), cam: dogCU({ a: 0.3, dist: 1.7, h: 0.55, side: 0.1 }) },
      { at: at(s0, th, 0.2), set: 'night', trans: 'cut', cam: CU('max', { az: 0.35, yaw: 0, frac: 0.38, dy: 0.8 }) },
    ]; };

  // 17. EAR: the floppy ear, then the crooked tail wagging
  S.ear = (s0, d) => { const tf = w('ear', 'floppy'), tt = w('ear', 'crooked');
    return [
      { at: 0, set: 'night', init: (N) => nightBase(N, s0, { max: [{ t: s0, expr: 'worried', mouth: 'O' }] }), cam: CU('max', { az: -0.3, yaw: 0, frac: 0.3, dy: 1.2 }) },
      { at: at(s0, tf, 0.3), set: 'night', cam: dogCU({ a: 0.4, dist: 0.95, h: 0.78, side: 0.12, fov: 32 }) },
      { at: at(s0, tt, 0.3), set: 'night', cam: dogCU({ a: 0.5, dist: 1.0, h: 0.5, side: -0.42, fov: 34 }) },
    ]; };

  // 18. BARK: Icey barks on each word (camera shakes); Max covers his ears
  S.bark = (s0, d) => { const bw = ['would', 'not.', 'Stop.', 'Barking.'].map((x) => w('bark', x));
    const init = (N) => nightBase(N, s0, { barks: bw, max: [{ t: bw[0] - 0.15, pose: 'ears', expr: 'panic', eyes: 'closed', squash: 1 }], dog: bw.map((b) => ({ t: b, mode: 'stand' })) });
    return [{ at: 0, set: 'night', init, shakes: bw.map((b) => [b, 1.0]), cam: move(V(-0.4, 1.3, 4.2), V(1.8, 0.9, 0.2), V(0.1, 1.2, 3.4), V(1.8, 0.9, 0.1), 46, 44) }]; };

  // 19. DRAG: Icey runs ahead barking, Max pulled along behind
  S.drag = (s0, d) => { const bs = [0.15, 0.7, 1.25, 1.8].map((x) => s0 + x);
    const init = (N) => { showDog(N, V(1.0, 0, 0), V(0, 0, -1), [{ t: s0 - 1, mode: 'run', wag: 1 }], bs).walk({ t0: s0 - 0.5, t1: s0 + d + 1, from: V(1.0, 0, 1.0), to: V(1.0, 0, 1.0 - (d + 1.5) * 4.2) });
      show(N.cast.max, V(-0.2, 0, 2.6), Math.PI, [{ t: s0 - 1, pose: 'dragged', expr: 'worried', lean: 16, sweat: true }]).walk({ t0: s0 - 0.5, t1: s0 + d + 1, from: V(0.2, 0, 2.8), to: V(0.6, 0, 2.8 - (d + 1.5) * 4.2), mode: 'run', ease: false }); };
    return [{ at: 0, set: 'night', init, shakes: bs.map((b) => [b, 0.4]), cam: track((lt, u, t, N) => { const r = N.cast.max.root.position; return { p: V(r.x + 3.4, 1.4, r.z - 1.8), l: V(r.x + 0.3, 1.0, r.z - 1.2), fov: 44 }; }) }]; };

  // 20. REFUSE: close-up Max, arms folded, refusing
  S.refuse = (s0, d) => { const words = all('refuse');
    const init = (N) => { show(N.cast.max, V(0.6, 0, -8), Math.PI / 2 + 0.3, [{ t: s0 - 1, pose: 'cross', expr: 'angry', look: V(2.4, 0.5, -8.6) }, { t: w('refuse', "He's") - 0.1, expr: 'skeptic', headTilt: -8 }], words);
      showDog(N, V(2.4, 0, -8.6), V(-1, 0, 0), [{ t: s0 - 1, mode: 'stand', wag: 0.6 }]); };
    return [{ at: 0, set: 'night', trans: 'zoom', init, cam: CU('max', { az: 0.45, frac: 0.36, dy: 1.0, drift: 0.1 }) }]; };

  // 21. LOUDER: close-up of Icey, louder barks, slow push-in, harder shake
  S.louder = (s0, d) => { const l1 = w('louder', 'louder.'), l2 = w('louder', 'louder.', 2), tb = w('louder', 'barking');
    const bs = [tb, tb + 0.35, l1, l1 + 0.3, l2, l2 + 0.25, l2 + 0.5];
    return [{ at: 0, set: 'night', init: (N) => { showDog(N, V(2.4, 0, -8.6), V(-1, 0, 0.2), [{ t: s0 - 1, mode: 'stand', wag: 1 }], bs); }, shakes: bs.map((b, i) => [b, 0.6 + i * 0.25]), cam: dogCU({ a: 0.25, dist: 2.0, h: 0.6, side: 0.15, push: 0.45 }) }]; };

  // 22. CEM: night cemetery; Max follows Icey between the gravestones
  S.cem = (s0, d) => {
    const init = (C) => { showDog(C, V(-1.0, 0, 2.6), V(0, 0, -1), [{ t: s0 - 1, mode: 'trot', wag: 0.5 }]).walk({ t0: s0 - 0.6, t1: s0 + d + 0.8, from: V(-1.0, 0, 2.6), to: V(-1.0, 0, -2.6) });
      show(C.cast.max, V(-1.0, 0, 4.4), Math.PI, [{ t: s0 - 1, expr: 'worried', look: V(0.2, 0.8, -4.6) }]).walk({ t0: s0 - 0.6, t1: s0 + d + 1.2, from: V(-1.0, 0, 4.6), to: V(-1.0, 0, -1.0), mode: 'walk', ease: false }); };
    return [{ at: 0, set: 'cem', trans: 'zoom', init, cam: track((lt, u, t, C) => { const r = C.cast.max.root.position; return { p: V(r.x + 2.6, 2.1, r.z + 2.2), l: V(r.x - 0.2, 1.0, r.z - 1.8), fov: 44 }; }) }]; };

  // 23. KNEEL: he sinks to his knees at a tombstone, hands to his face, tears
  const atStone = (C, s0, keys = []) => { show(C.cast.max, V(0.2, 0, -3.45), Math.PI, keys); showDog(C, V(1.2, 0, -3.6), V(-1, 0, 0), [{ t: s0 - 1, mode: 'sit', wag: 0.2 }]); };
  S.kneel = (s0, d) => { const tr = w('kneel', 'reached'), tb = w('kneel', 'broke');
    const init = (C) => { show(C.cast.max, V(-0.6, 0, -2.4), 2.4, [{ t: s0 - 1, expr: 'worried' }, { t: tb - 0.6, ...KNEEL, expr: 'sad', pose: 'face', lean: 22, headTilt: 0 }, { t: tb - 0.1, tears: true, eyes: 'closed', mouth: 'wavy' }]).walk({ t0: s0 - 0.3, t1: tr + 0.6, from: V(-1.0, 0, -1.2), to: V(0.2, 0, -3.45), mode: 'walk', ease: true });
      showDog(C, V(1.2, 0, -3.6), V(-1, 0, 0), [{ t: s0 - 1, mode: 'sit', wag: 0.2 }]); };
    return [{ at: 0, set: 'cem', init, cam: move(V(2.4, 1.5, -1.0), V(0.0, 0.8, -3.6), V(1.6, 1.0, -2.0), V(0.1, 0.7, -3.6), 42, 38) }]; };

  // 24. NAME: he slowly looks up; the engraving fades in; impact + flash on "mine."
  S.name = (s0, d) => { const tl = w('name', 'looked'), tn = w('name', 'name'), tm = w('name', 'mine.');
    const init = (C) => atStone(C, s0, [{ t: s0 - 1, ...KNEEL, pose: 'idle', lean: 26, expr: 'sad', tears: true, pitch: 0.4 }, { t: tl - 0.1, ...KNEEL, pose: 'idle', lean: 26, pitch: 0.4 }, { t: tl + 0.7, ...KNEEL, pose: 'idle', lean: 0, pitch: -0.25, eyes: 'wide', brows: 'raised', mouth: 'o', tears: true }]);
    const post = (C, t) => C.engSet({ a: +ramp(t, tn - 0.2, tm - 0.15).toFixed(2) });
    return [
      { at: 0, set: 'cem', init, post, cam: track((lt, u, t, C) => { const h = C.cast.max.head.getWorldPosition(V(0, 0, 0)); return { p: V(h.x + 0.55, h.y + 0.05, h.z - 1.2), l: V(h.x, h.y - 0.1, h.z), fov: 36 }; }) },
      { at: at(s0, tn, 0.35), set: 'cem', post, cam: move(V(0.3, 0.95, -2.3), V(0.2, 0.75, -4.6), V(0.25, 0.85, -2.8), V(0.2, 0.75, -4.6), 40, 38) },
      { at: at(s0, tm, 0.05), set: 'cem', post, trans: 'flash', flashColor: '255,255,255', cam: move(V(0.22, 0.8, -3.05), V(0.2, 0.72, -4.6), V(0.22, 0.78, -3.25), V(0.2, 0.72, -4.6), 40, 38) },
    ]; };

  // 25. BACK: Max's eyes go wide as flashes pulse
  S.back = (s0, d) => { const tc = w('back', 'came'), tb = w('back', 'back.');
    const init = (C) => atStone(C, s0, [{ t: s0 - 1, ...KNEEL, pose: 'idle', lean: 0, expr: 'shock', tears: true }, { t: tb, eyes: 'goggle', squash: 1 }]);
    return [{ at: 0, set: 'cem', init, fade: [[tc - 0.1, tc + 0.05, 0, 0.55, '255,255,255'], [tc + 0.05, tc + 0.3, 0.55, 0, '255,255,255'], [tb - 0.05, tb + 0.1, 0, 0.7, '255,255,255'], [tb + 0.1, tb + 0.4, 0.7, 0, '255,255,255']], cam: CU('max', { az: -0.3, yaw: Math.PI, frac: 0.4, dy: 0.8, drift: 0.05 }) }]; };

  // 26. FLASH (washed-out replay): Max sprints, shoves Leo flying to the sidewalk, blinding headlights rush at him
  S.flash = (s0, d) => { const tp = w('flash', 'pushed'), tw = w('flash', 'way.'), th = w('flash', 'truck'), tme = w('flash', 'me.');
    const init = (Tn) => { Tn.truck.visible = true;
      show(Tn.cast.leo, V(0.6, 0.13, 0), Math.PI / 2, [{ t: s0 - 1, pose: 'balance', expr: 'happy' }, { t: tp + 0.15, expr: 'shock', pose: 'raise' }]);
      show(Tn.cast.max, V(-2.8, 0, 6), 2.6, [{ t: s0 - 1, expr: 'panic', mouth: 'O', lean: 12 }, { t: tp - 0.05, pose: 'shove', lean: 18, squash: 1, expr: 'focus' }, { t: th - 0.2, pose: 'cower', expr: 'shock', lean: 0, look: V(0.6, 1.2, -10) }]).walk({ t0: s0 - 0.6, t1: tp + 0.05, from: V(-3.2, 0, 7), to: V(0.0, 0, 0.6), mode: 'run', ease: false }); };
    const post = (Tn, t) => { const k = ramp(t, tp + 0.05, tw + 0.2); const L = Tn.cast.leo; L.root.position.set(lerp(0.6, 3.7, k), 0.13 + Math.sin(Math.PI * k) * 0.9 + 0.01 * k, lerp(0, -0.6, k)); L.root.rotation.z = -k * 0.4; board(Tn, 'leo', { dy: -L.root.position.y + 0.13 }); Tn.boards.leo.position.x = 0.6 + 0.6 * k;
      const kt = ramp(t, th - 0.5, tme + 0.25); Tn.truck.position.set(0.2, 0, lerp(-40, -2.2, kt)); Tn.truck.rotation.y = 0; Tn.truck.userData.flare(ramp(t, th - 0.2, tme + 0.2)); };
    return [
      { at: 0, set: 'town', trans: 'flash', flashColor: '255,255,255', init, post, cam: track((lt, u, t, Tn) => { const r = Tn.cast.max.root.position; return { p: V(r.x - 2.6, 1.3, r.z + 2.6), l: V(r.x + 1.0, 1.2, r.z - 1.2), fov: 44 }; }) },
      { at: at(s0, th, 0.3), set: 'town', post, fade: [[tme - 0.05, tme + 0.25, 0, 1, '255,255,255']], cam: track((lt, u, t, Tn) => { const r = Tn.cast.max.root.position; return { p: V(r.x + 0.9, 1.3, r.z + 2.6), l: V(r.x - 0.2, 1.4, r.z - 6), fov: 44 }; }) },
    ]; };

  // 27. REAL: the real world, a warm kitchen; Mum, Dad and Leo grieve under the IN LOVING MEMORY photo
  S.real = (s0, d) => { const tn = w('real', 'never'), tw = w('real', "That's");
    const init = (K) => { show(K.cast.mum, V(-1.25, 0, -2.25), 0.25, [{ t: s0 - 1, expr: 'sad', tears: true, pose: 'face', lean: 10 }]);
      show(K.cast.dad, V(0.5, 0, -2.3), -0.35, [{ t: s0 - 1, expr: 'sad', pose: 'idle', look: V(-1.25, 1.4, -2.25), lean: 6 }]);
      show(K.cast.leo, V(-0.35, 0, -2.05), 0, [{ t: s0 - 1, expr: 'sad', eyes: 'half', tears: true, lean: 8, pose: 'idle' }]); };
    return [{ at: 0, set: 'kitchen', trans: 'flash', flashColor: '255,250,240', init, cam: path([[0, V(1.6, 2.6, 2.6), V(-0.4, 1.9, -3.0), 42], [1, V(0.3, 1.9, 1.2), V(-0.4, 1.7, -2.6), 40]]) }]; };

  // 28. GTOWN: the town turns pale and misty; crane up as ghostly townsfolk drift and Max glows
  const ghosts = (G, s0, d) => { [['g0', V(-3, 0.3, -24), V(1.5, 0.3, -26)], ['g1', V(2.6, 0.35, -21), V(-1.5, 0.35, -23)], ['g2', V(-1.8, 0.3, -30), V(2.2, 0.3, -31)], ['g3', V(3.4, 0.4, -27), V(0.4, 0.4, -33)]].forEach(([k, a, b], i) =>
    show(G.cast[k], a, 0, [{ t: s0 - 1, expr: ['content', 'neutral', 'sad', 'content'][i], eyes: 'half' }]).walk({ t0: s0 - 2, t1: s0 + d + 6, from: a, to: b, mode: 'float', ease: false })); };
  const ghostBob = (G, t) => { ['g0', 'g1', 'g2', 'g3'].forEach((k, i) => { const c = G.cast[k]; if (c.root.visible) c.root.position.y += Math.sin(t * 1.6 + i) * 0.08; }); };
  S.gtown = (s0, d) => { const tf = w('gtown', "It's");
    const init = (G) => { G.setTime('gNoon'); ghosts(G, s0, d); show(G.cast.max, V(0.2, 0, -21), 0, [{ t: s0 - 1, expr: 'worried', look: V(-2, 1.6, -24) }, { t: tf, look: 'camera', expr: 'shock' }]); G.dog.root.visible = false; };
    return [{ at: 0, set: 'ghost', trans: 'flash', flashColor: '230,240,255', init, post: ghostBob, cam: path([[0, V(1.0, 1.7, -17.2), V(0.2, 1.5, -21), 40], [0.35, V(1.2, 2.0, -16.8), V(0.2, 1.5, -21.5), 42], [1, V(2.6, 8.5, -11), V(0, 1.2, -26), 50]]) }]; };

  // 29. GHOST: close-up of Max glowing faintly, spirit specks float past
  S.ghost = (s0, d) => [{ at: 0, set: 'ghost', init: (G) => { G.setTime('gNoon'); ghosts(G, s0, d); show(G.cast.max, V(0.2, 0, -21), 0, [{ t: s0 - 1, expr: 'sad', eyes: 'dot', look: 'camera' }]); }, post: ghostBob, cam: CU('max', { az: 0.3, frac: 0.38, dy: 0.8 }) }];

  // 30. HOPE: Max smiles hopefully, hands clasped, ghost-Icey wagging beside him
  S.hope = (s0, d) => { const ts = w('hope', 'Surely,');
    const init = (G) => { G.setTime('gNoon'); show(G.cast.max, V(-0.4, 0, -27.5), 0.15, [{ t: s0 - 1, expr: 'content' }, { t: w('hope', 'Tomorrow') - 0.2, expr: 'hopeful', pose: 'clasp', squash: 1 }, { t: ts - 0.1, eyes: 'happy', mouth: 'smile', headTilt: 8 }]).groove(all('hope'), 0.7);
      showDog(G, V(0.75, 0, -27.3), V(-1, 0, 0.3), [{ t: s0 - 1, mode: 'sit', wag: 1, eyes: 'happy' }]); };
    return [{ at: 0, set: 'ghost', init, cam: move(V(0.9, 1.4, -23.8), V(0.1, 1.0, -27.4), V(0.6, 1.35, -24.6), V(0.1, 1.0, -27.4), 40, 38) }]; };

  // 31-34. GATE: waiting by the faded gate; morning / noon / midnight; still here; Icey gone
  const bench = (G, s0, slump, wag, dogOn = true) => { show(G.cast.max, V(-2.6, 0.05, -31.0), 0, [{ t: s0 - 1, sit: 0.62, expr: slump > 1 ? 'sad' : slump > 0 ? 'bored' : 'hopeful', lean: slump * 10, pose: slump ? 'idle' : 'clasp', eyes: slump > 1 ? 'half' : 'dot' }]);
    if (dogOn) showDog(G, V(-1.25, 0, -30.7), V(-1, 0, 0.2), [{ t: s0 - 1, mode: 'sit', wag }]); else { G.dog.reset(); } };
  const gateCam = (dz = 0) => move(V(-1.2, 1.6, -24.8 + dz), V(-1.9, 1.5, -31.5), V(-1.3, 1.55, -25.6 + dz), V(-1.9, 1.45, -31.5), 40, 40);
  S.gate = (s0, d) => [{ at: 0, set: 'ghost', init: (G) => { G.setTime('gMorning'); bench(G, s0, 0, 1); }, cam: path([[0, V(1.5, 4.0, -20), V(-1.2, 2.6, -32), 44], [1, V(-1.0, 1.9, -24.6), V(-1.6, 1.8, -31.6), 42]]) }];
  S.mnm = (s0, d) => { const tm = w('mnm', 'Morning.'), tn = w('mnm', 'Noon.'), tmi = w('mnm', 'Midnight.');
    return [
      { at: 0, set: 'ghost', init: (G) => { G.setTime('gMorning'); bench(G, s0, 0, 1); }, cam: gateCam(0) },
      { at: at(s0, tn, 0.15), set: 'ghost', trans: 'cut', init: (G) => { G.setTime('gNoon'); bench(G, s0, 1, 0.45); }, cam: gateCam(0) },
      { at: at(s0, tmi, 0.15), set: 'ghost', trans: 'cut', init: (G) => { G.setTime('gMid'); bench(G, s0, 2, 0.1); }, cam: gateCam(0) },
    ]; };
  S.still = (s0, d) => [{ at: 0, set: 'ghost', init: (G) => { G.setTime('gMid'); bench(G, s0, 2, 0.1, false); }, cam: CU('max', { az: 0.25, yaw: 0, frac: 0.36, dy: 0.9 }) }];
  S.gone = (s0, d) => { const tg = w('gone', 'Icey,');
    const init = (G) => { G.setTime('gMid'); show(G.cast.max, V(-2.6, 0.05, -31.0), 0, [{ t: s0 - 1, sit: 0.62, expr: 'sad', lean: 18, eyes: 'half' }, { t: tg - 0.3, sit: 0.62, lean: 10, look: V(-1.25, 0.5, -30.7), eyes: 'dot', brows: 'worried', mouth: 'frown' }]); G.dog.reset(); };
    return [{ at: 0, set: 'ghost', init, cam: path([[0, V(-2.0, 1.45, -29.0), V(-2.6, 1.3, -31.0), 36], [0.45, V(-2.0, 1.45, -29.0), V(-2.6, 1.3, -31.0), 36], [1, V(-1.3, 1.25, -28.9), V(-1.3, 0.75, -30.9), 38]]) }]; };

  // 35. PICK: close-up, tears; the music cuts out
  S.pick = (s0, d) => [{ at: 0, set: 'ghost', init: (G) => { G.setTime('gMid'); show(G.cast.max, V(-2.6, 0.05, -31.0), 0, [{ t: s0 - 1, sit: 0.62, expr: 'sad', tears: true, lean: 8, look: 'camera' }]); G.dog.reset(); }, cam: CU('max', { az: 0.15, yaw: 0, frac: 0.46, dy: 0.6, drift: 0.04 }) }];

  // 36. DOG: the real world: Mum, Leo and Dad cheering and hugging a bouncing, barking Icey. Hold, then fade.
  S.dog = (s0, d) => { const bs = [0.1, 0.45, 0.85, 1.3, 1.75, 2.3].map((x) => s0 + x);
    const init = (K) => { show(K.cast.mum, V(-1.2, 0, -1.85), 0.5, [{ t: s0 - 1, expr: 'laugh', pose: 'raise', squash: 1, bounce: 0.6 }]);
      show(K.cast.dad, V(0.6, 0, -1.95), -0.5, [{ t: s0 - 1, expr: 'laugh', pose: 'raise', bounce: 0.6 }]);
      show(K.cast.leo, V(-0.3, 0, -1.35), 0, [{ t: s0 - 1, expr: 'laugh', pose: 'give', lean: 14, bounce: 0.5 }]);
      showDog(K, V(-0.15, 0, -0.75), V(-1, 0, 0), [{ t: s0 - 1, mode: 'stand', wag: 1, eyes: 'happy' }], bs); };
    const post = (K, t) => { K.dog.root.position.y = Math.abs(Math.sin(t * 5.2)) * 0.22; };
    const tick = (K) => { K.spark.clear(); bs.forEach((b, i) => K.spark.fire(V(-0.4 + (i % 3) * 0.4, 1.4 + (i % 2) * 0.5, -1.2), b, { n: 8, r: 0.6, size: 0.16 })); };
    return [{ at: 0, set: 'kitchen', trans: 'flash', flashColor: '255,245,225', init, post, tick, fade: [[s0 + d - 1.0, s0 + d - 0.1, 0, 1, '0,0,0']], cam: move(V(0.4, 1.6, 2.0), V(-0.3, 1.1, -1.3), V(0.2, 1.5, 1.4), V(-0.3, 1.1, -1.3), 42, 40) }]; };

  return S;
}

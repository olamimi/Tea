// "The New Boy" — shot list with puppet acting, timed to the narration's word timings.
import * as THREE from 'three';
const V = (x, y, z) => new THREE.Vector3(x, y, z);
const lerp = (a, b, u) => a + (b - a) * u;
export const ease = (u) => 0.5 - 0.5 * Math.cos(Math.PI * Math.min(1, Math.max(0, u)));
const ramp = (t, a, b) => Math.min(1, Math.max(0, (t - a) / (b - a)));
const path = (keys) => (lt, u) => {
  let i = 0; while (i < keys.length - 2 && u > keys[i + 1][0]) i++;
  const [u0, p0, l0, f0] = keys[i], [u1, p1, l1, f1] = keys[Math.min(i + 1, keys.length - 1)];
  const k = ease((u - u0) / Math.max(1e-6, u1 - u0));
  return { p: p0.clone().lerp(p1, k), l: l0.clone().lerp(l1, k), fov: lerp(f0, f1 ?? f0, k) };
};
const move = (p0, l0, p1, l1, f0 = 40, f1 = f0) => path([[0, p0, l0, f0], [1, p1, l1, f1]]);
const yawTo = (from, to) => Math.atan2(to.x - from.x, to.z - from.z);
function show(c, pos, face, keys = [], words = null) {
  c.root.visible = true; c.reset(); c.place(pos, typeof face === 'number' ? face : yawTo(pos, face)); c.act(keys); if (words) c.say(words); return c;
}
const headOf = (c) => c.root.position.clone().add(V(0, c.spec.H * 0.86, 0));
const hand = (c, side = 'R') => c.torso.localToWorld((side === 'R' ? c.handR : c.handL).clone());
const BOARD = Math.PI; // seated students face the board (-z)

// Classroom layout (see sets.js): desks at x in {-3.6, 0, 3.6}, rows z in {-2.2, 0.4, 3.0, 5.6}; bench seats at (x±0.5, z+0.3).
const TOBI_SEAT = V(0.5, 0, 0.7), TOBI_DESK = V(0.3, 0.86, 0.12);

export function buildShots(T) {
  const S = {};
  const w = (shot, word, n = 1) => T.word(shot, word, n);

  // seated class (filled seats) for classroom wides
  const seatClass = (C, t0, extra = {}) => {
    const s = C.seats; const who = [['boyA', s[2]], ['girlB', s[4]], ['boyB', s[12]], ['girlC', s[16]], ['boyC', s[19]], ['ada', s[23]]];
    who.forEach(([n, p], i) => show(C.cast[n], p, BOARD, [{ t: t0 - 1, expr: 'neutral', sit: 0.5, ...(extra[n] || {}) }]));
  };

  // ---------------------------------------------------------------- 1. hook
  S.hook = (s0) => {
    const tw = w('hook', 'week,'), tth = w('hook', 'thief.');
    return [
      { at: 0, set: 'classA', init(C) {
          show(C.cast.tobi, V(0.9, 0, 1.6), V(1.2, 0, 5), [{ t: s0 - 1, expr: 'happy', pose: 'wave', work: 'gesture' }, { t: tw, expr: 'hopeful', pose: 'idle' }]);
          C.bag.visible = true; C.bag.position.set(1.3, 0, 1.75); C.bag.rotation.y = -0.3; },
        cam: move(V(1.15, 1.55, 4.8), V(0.9, 1.45, 1.6), V(1.1, 1.5, 4.2), V(0.9, 1.45, 1.6), 34, 32) },
      { at: tth - s0 - 0.3, set: 'classA', speed: [tth - 0.1, tth + 0.6], init(C) {
          const T0 = C.cast.tobi; show(T0, V(0.9, 0, 1.6), V(0.9, 0, -3), [{ t: s0 - 1, expr: 'panic', pose: 'cower', squash: 1 }]);
          const ring = [['boyA', V(-1.4, 0, 0.2)], ['boyB', V(2.9, 0, 0.6)], ['girlB', V(-0.8, 0, -1.4)], ['girlC', V(2.4, 0, -1.2)], ['boyC', V(-1.9, 0, 2.2)], ['ada', V(3.2, 0, 2.6)]];
          ring.forEach(([n, p], i) => show(C.cast[n], p, V(0.9, 0, 1.6), [{ t: s0 - 1, expr: i % 2 ? 'angry' : 'shock', pose: 'point', look: headOf(T0), lean: 6 }])); },
        cam: move(V(0.9, 1.0, -3.6), V(0.9, 1.35, 1.6), V(0.9, 1.05, -3.0), V(0.9, 1.35, 1.6), 58, 54) },
    ];
  };

  // ---------------------------------------------------------------- 2. the teacher's instruction
  S.notes = (s0) => {
    const tb = w('notes', 'borrow'), ta = w('notes', 'arm,');
    return [
      { at: 0, set: 'classA', init(C) {
          show(C.cast.teacher, V(-1.9, 0, -6.1), V(-0.4, 0, -2), [{ t: s0 - 1, expr: 'neutral', pose: 'point', look: 'camera' }, { t: tb - 0.1, pose: 'present', work: 'gesture', expr: 'smug' }, { t: ta - 0.05, pose: 'point', look: V(6, 1.5, -4.6) }]); },
        cam: move(V(-0.5, 1.75, -2.6), V(-1.8, 1.65, -6.1), V(-0.7, 1.75, -3.2), V(-1.8, 1.7, -6.1), 40, 37) },
      { at: tb - s0 + 0.2, set: 'classA', init(C) {
          seatClass(C, s0, { boyA: { expr: 'bored', headTilt: 14 }, girlB: { expr: 'sad' }, boyC: { expr: 'bored' } });
          show(C.cast.tobi, TOBI_SEAT, BOARD, [{ t: s0 - 1, expr: 'hopeful', sit: 0.5 }]);
          C.bag.visible = true; C.bag.position.copy(TOBI_DESK); }, inherit: true,
        cam: move(V(0.2, 2.6, 7.2), V(-0.6, 1.2, -3), V(0.1, 2.5, 6.6), V(-0.8, 1.2, -3), 52, 50) },
    ];
  };

  // ---------------------------------------------------------------- 3. borrowing Kemi's note (other arm)
  S.borrow = (s0) => {
    const tk = w('borrow', 'Kemi.');
    const kp = V(-3.0, 0, 0.75), tp = V(-1.75, 0, 0.95);
    return [
      { at: 0, set: 'classB', init(C) {
          C.cast.kemi.spec.blush = true;
          show(C.cast.kemi, kp, Math.PI / 2, [{ t: s0 - 1, expr: 'smug', sit: 0.5, pose: 'idle', look: headOf({ root: { position: tp }, spec: { H: 1.9 } }) }, { t: s0 + 0.35, pose: 'hold2' }, { t: tk + 0.15, pose: 'idle', expr: 'happy' }]);
          show(C.cast.tobi, tp, -Math.PI / 2 + 0.2, [{ t: s0 - 1, expr: 'happy', lean: 14, headLean: 10, look: headOf(C.cast.kemi) }, { t: s0 + 0.6, pose: 'hold2', lean: 6 }, { t: tk + 0.2, pose: 'hold2', expr: 'happy', squash: 1 }]);
          show(C.cast.girlB, C.seats[9], BOARD, [{ t: s0 - 1, sit: 0.5, look: headOf(C.cast.tobi) }]);
          show(C.cast.boyB, C.seats[6], BOARD, [{ t: s0 - 1, sit: 0.5, expr: 'bored' }]);
          C.nbook.visible = true; },
        post(C, t) { const k = ease(ramp(t, s0 + 0.45, tk + 0.1)); const a = hand(C.cast.kemi, 'R'), b = hand(C.cast.tobi, 'R'); C.nbook.position.copy(a.lerp(b, k)); C.nbook.rotation.set(-0.3, 0.4, 0.2); },
        cam: move(V(-2.2, 1.6, 4.4), V(-2.35, 1.35, 0.85), V(-2.3, 1.58, 3.8), V(-2.35, 1.35, 0.85), 44, 40) },
    ];
  };

  // ---------------------------------------------------------------- 4. the note is gone
  S.search1 = (s0) => {
    const ts = w('search1', 'searched'), tg = w('search1', 'gone.');
    return [
      { at: 0, set: 'classA', init(C) {
          C.bag.visible = true; C.bag.position.copy(TOBI_DESK); C.bag.rotation.y = 0;
          show(C.cast.kemi, V(0.3, 0, -0.85), V(0.3, 0, 1), [{ t: s0 - 1, expr: 'smug', pose: 'hips' }, { t: ts - 0.1, pose: 'dig', work: 'dig', expr: 'focus', lean: 18 }, { t: tg - 0.1, expr: 'shock', pose: 'raise', work: null, lean: -4, squash: 1 }, { t: tg + 0.45, expr: 'angry', pose: 'hips', look: V(1.6, 1.5, 0.15), tint: 0.3 }]);
          show(C.cast.tobi, V(1.6, 0, 0.15), V(0.3, 0, -0.85), [{ t: s0 - 1, expr: 'hopeful', look: headOf(C.cast.kemi) }, { t: ts, expr: 'worried' }, { t: tg + 0.2, expr: 'shock', pose: 'shrug', squash: 1 }]); },
        tick(C, t) { C.bag.userData.flap.rotation.x = t > ts ? -1.2 : 0; },
        cam: move(V(1.0, 1.75, -3.7), V(0.95, 1.25, -0.3), V(1.0, 1.7, -3.3), V(0.95, 1.25, -0.3), 50, 48) },
      { at: tg - s0 - 0.12, set: 'classA', inherit: true, cam: move(V(1.0, 1.6, -3.2), V(0.35, 1.55, -0.85), V(0.9, 1.6, -2.8), V(0.35, 1.55, -0.85), 36, 34) },
    ];
  };

  // ---------------------------------------------------------------- 5. "You already took it back yesterday!"
  S.mates = (s0) => {
    const ty = w('mates', 'You'), tsaw = w('mates', 'saw');
    return [
      { at: 0, set: 'classA', init(C) {
          C.bag.visible = true; C.bag.position.copy(TOBI_DESK);
          const K = show(C.cast.kemi, V(0.3, 0, -0.85), V(2.4, 0, -1.6), [{ t: s0 - 1, expr: 'angry', pose: 'hips', tint: 0.3 }, { t: ty + 0.3, expr: 'worried', tint: 0, pose: 'shrug' }, { t: tsaw + 0.1, expr: 'sad', sweat: true, headTilt: -8 }]);
          show(C.cast.boyA, V(2.6, 0, -1.7), V(0.3, 0, -0.85), [{ t: s0 - 1, expr: 'laugh', pose: 'point', look: headOf(K) }], T.words('mates', 'You', 'you!'));
          show(C.cast.boyB, V(3.1, 0, -0.3), V(0.3, 0, -0.85), [{ t: s0 - 1, expr: 'laugh', look: headOf(C.cast.boyA) }]);
          show(C.cast.girlB, V(-1.4, 0, -1.6), V(0.3, 0, -0.85), [{ t: s0 + 0.1, expr: 'laugh', pose: 'point', look: headOf(K) }]);
          show(C.cast.tobi, V(1.6, 0, 0.15), V(2.6, 0, -1.7), [{ t: s0 - 1, expr: 'shock', look: headOf(C.cast.boyA) }, { t: tsaw, expr: 'hopeful' }]); },
        cam: move(V(0.6, 2.0, -4.6), V(1.0, 1.2, -0.6), V(0.8, 1.9, -4.2), V(1.0, 1.2, -0.6), 50, 48) },
      { at: ty - s0 - 0.1, set: 'classA', cam: move(V(0.95, 1.7, -2.4), V(2.6, 1.6, -1.6), V(1.1, 1.7, -2.3), V(2.6, 1.6, -1.6), 40, 37) },
      { at: tsaw - s0 + 0.1, set: 'classA', cam: move(V(-0.2, 1.6, -3.3), V(0.3, 1.55, -0.85), V(-0.1, 1.6, -2.9), V(0.3, 1.55, -0.85), 36, 34) },
    ];
  };

  // ---------------------------------------------------------------- 6. Kemi bursts in (red face, steam)
  S.burst = (s0) => {
    const tb = w('burst', 'burst'), tm = w('burst', 'My'), tst = w('burst', 'stole');
    return [
      { at: 0, set: 'classA', speed: [tb - 0.05, tb + 0.5], init(C) {
          seatClass(C, s0, { boyA: { look: V(6, 1.5, -4) }, girlB: { look: V(6, 1.5, -4) }, boyB: { look: V(6, 1.5, -4) } });
          show(C.cast.tobi, TOBI_SEAT, BOARD, [{ t: s0 - 1, sit: 0.5, look: V(6, 1.5, -4) }]);
          show(C.cast.kemi, V(7.6, 0, -4.0), -Math.PI / 2, [
            { t: s0 - 1, expr: 'angry', pose: 'raise', tint: 0 },
            { t: tb + 0.1, tint: 0.9, steam: true, blend: 0.25 },
            { t: tm - 0.05, pose: 'raise', squash: 1, look: 'camera', lean: 8 },
            { t: tst - 0.05, pose: 'point', look: 'camera', headLean: 6 }], T.words('burst', 'My', 'money!', 2))
            .walk({ t0: tb - 0.2, t1: tb + 0.5, from: V(7.6, 0, -4.0), to: V(4.6, 0, -3.6), mode: 'run', ease: false }); },
        tick(C, t) { C.doorPivot.rotation.y = -1.7 * ease(ramp(t, tb - 0.25, tb - 0.05)); },
        cam: move(V(1.2, 1.75, -2.7), V(5.0, 1.55, -3.9), V(1.6, 1.72, -2.9), V(4.7, 1.55, -3.7), 44, 40) },
    ];
  };

  // ---------------------------------------------------------------- 7. she points at the new boy (heads turn in a ripple)
  S.point = (s0) => {
    const tp = w('point', 'pointed'), tb = w('point', 'boy.');
    return [
      { at: 0, set: 'classA', init(C) {
          const Tb = show(C.cast.tobi, TOBI_SEAT, BOARD, [{ t: s0 - 1, sit: 0.5, expr: 'neutral', look: V(4.6, 1.6, -3.6) }, { t: tb - 0.05, expr: 'shock', sweat: true, squash: 1 }]);
          show(C.cast.kemi, V(4.6, 0, -3.6), V(0.5, 0, 0.7), [{ t: s0 - 1, expr: 'angry', tint: 0.9, steam: true, pose: 'raise' }, { t: tp - 0.05, pose: 'point', lean: 10, squash: 1, look: headOf(Tb) }]);
          const s = C.seats; const who = [['boyA', s[2]], ['girlB', s[4]], ['boyB', s[12]], ['girlC', s[16]], ['boyC', s[19]], ['ada', s[23]]];
          who.forEach(([n, p], i) => show(C.cast[n], p, BOARD, [{ t: s0 - 1, sit: 0.5, look: V(4.6, 1.6, -3.6) }, { t: tp + 0.15 + i * 0.07, look: headOf(Tb), expr: i % 2 ? 'shock' : 'skeptic' }])); },
        cam: move(V(3.4, 1.65, -1.2), V(4.6, 1.6, -3.6), V(3.6, 1.65, -1.6), V(4.6, 1.6, -3.6), 40, 36) },
      { at: w('point', 'straight') - s0 - 0.05, set: 'classA', speed: [tb - 0.1, tb + 0.5],
        cam: move(V(0.75, 1.35, -2.6), V(0.5, 1.25, 0.7), V(0.7, 1.32, -1.7), V(0.5, 1.25, 0.7), 46, 38) },
    ];
  };

  // ---------------------------------------------------------------- 8. the bag search: exactly the amount
  S.bag = (s0) => {
    const ts = w('bag', 'searched'), te = w('bag', 'exactly'), tl = w('bag', 'lost.');
    return [
      { at: 0, set: 'classA', init(C) {
          C.bag.visible = true; C.bag.position.copy(TOBI_DESK);
          const Tch = show(C.cast.teacher, V(0.3, 0, -0.9), V(0.3, 0, 1), [{ t: s0 - 1, expr: 'focus', pose: 'dig', work: 'dig', lean: 16 }, { t: te - 0.12, pose: 'raise', work: null, expr: 'shock', lean: -4, squash: 1, look: 'camera' }]);
          show(C.cast.tobi, V(1.6, 0, 0.2), V(0.3, 0, -0.9), [{ t: s0 - 1, expr: 'worried', look: V(0.3, 0.9, 0.1) }, { t: te, expr: 'shock', sweat: true }]);
          show(C.cast.kemi, V(-1.2, 0, -1.2), V(0.3, 0, -0.9), [{ t: s0 - 1, expr: 'angry', tint: 0.5, pose: 'hips' }, { t: te + 0.1, expr: 'smug', tint: 0, look: headOf(C.cast.tobi) }]);
          show(C.cast.boyA, V(2.7, 0, -1.4), V(0.3, 0, -0.9), [{ t: te + 0.15, expr: 'shock' }]);
          show(C.cast.girlB, V(-1.8, 0, 0.4), V(0.3, 0, -0.9), [{ t: te + 0.22, expr: 'shock', pose: 'cower' }]);
          void Tch; },
        tick(C, t) { C.bag.userData.flap.rotation.x = -1.2; C.notesHeld.visible = t > te - 0.12; },
        post(C) { C.notesHeld.position.copy(hand(C.cast.teacher, 'R')).add(V(0, 0.1, 0.05)); C.notesHeld.rotation.set(0, 0.2, 0); },
        cam: move(V(1.5, 0.95, -3.2), V(0.4, 1.5, -0.6), V(1.3, 0.9, -2.8), V(0.4, 1.7, -0.6), 46, 44) },
      { at: tl - s0 - 0.1, set: 'classA', inherit: true, cam: move(V(0.9, 1.95, -3.6), V(0.35, 2.0, -0.9), V(0.8, 1.95, -3.2), V(0.35, 2.0, -0.9), 38, 36) },
    ];
  };

  // ---------------------------------------------------------------- 9. "What notes were they?" / "One thousand naira."
  S.calm = (s0) => {
    const tw = w('calm', 'What'), to = w('calm', 'One');
    return [
      { at: 0, set: 'classA', init(C) {
          show(C.cast.tobi, V(1.6, 0, 0.2), V(-1.2, 0, -1.2), [{ t: s0 - 1, expr: 'neutral', eyes: 'half', pose: 'cross', look: V(-1.2, 1.5, -1.2) }, { t: tw - 0.05, eyes: 'dot', brows: 'raised' }], T.words('calm', 'What', 'they?'));
          show(C.cast.kemi, V(-1.2, 0, -1.2), V(1.6, 0, 0.2), [{ t: s0 - 1, expr: 'smug', pose: 'hips', look: V(1.6, 1.6, 0.2) }, { t: to - 0.05, expr: 'angry', pose: 'point', squash: 1 }], T.words('calm', 'One', 'note.'));
          show(C.cast.teacher, V(2.7, 0, -0.9), V(1.6, 0, 0.2), [{ t: s0 - 1, expr: 'skeptic', pose: 'hold2' }]); },
        post(C) { C.notesHeld.visible = true; C.notesHeld.position.copy(hand(C.cast.teacher, 'R')).add(V(0, 0.08, 0.04)); },
        cam: move(V(-0.5, 1.6, -1.9), V(1.6, 1.5, 0.2), V(-0.3, 1.6, -1.6), V(1.6, 1.5, 0.2), 36, 34) },
      { at: to - s0 - 0.15, set: 'classA', inherit: true, cam: move(V(0.6, 1.5, -3.6), V(-1.2, 1.45, -1.2), V(0.4, 1.5, -3.3), V(-1.2, 1.45, -1.2), 34, 32) },
    ];
  };

  // ---------------------------------------------------------------- 10. two five-hundreds
  S.smile = (s0) => {
    const tp = w('smile', 'pulled'), tf = w('smile', 'five-hundreds.');
    return [
      { at: 0, set: 'classA', init(C) {
          show(C.cast.tobi, V(1.6, 0, 0.2), V(0.6, 0, 2.8), [{ t: s0 - 1, expr: 'happy', pose: 'cross', look: 'camera' }, { t: tp - 0.05, pose: 'hold2', squash: 1 }, { t: tf - 0.1, pose: 'raise', expr: 'happy' }]);
          show(C.cast.kemi, V(-1.2, 0, -1.2), V(1.6, 0, 0.2), [{ t: s0 - 1, expr: 'smug', pose: 'hips' }, { t: tf, expr: 'shock', squash: 1, sweat: true }]);
          show(C.cast.boyA, V(2.8, 0, -1.2), V(1.6, 0, 0.2), [{ t: tf + 0.1, expr: 'happy', pose: 'raise' }]); },
        post(C, t) { C.notesHeld.visible = t > tp; C.notesHeld.position.copy(hand(C.cast.tobi, 'R')).add(V(0, 0.08, 0.05)); C.notesHeld.rotation.set(0, -0.3, 0); },
        cam: move(V(0.5, 1.45, 3.3), V(1.5, 1.45, 0.2), V(0.7, 1.45, 2.8), V(1.5, 1.6, 0.2), 38, 34) },
    ];
  };

  // ---------------------------------------------------------------- 11. "Then you changed it!" (rage)
  S.changed = (s0) => {
    const tc = w('changed', 'changed'), tt = w('changed', 'thief!');
    return [
      { at: 0, set: 'classA', speed: [tt - 0.1, tt + 0.4], init(C) {
          show(C.cast.kemi, V(-1.2, 0, -1.2), V(-0.2, 0, -3.4), [
            { t: s0 - 1, expr: 'angry', pose: 'hips', tint: 0.2 },
            { t: s0 + 0.1, tint: 1.0, steam: true, blend: 0.45, pose: 'point', squash: 1, look: 'camera' },
            { t: tc - 0.05, lean: 14, headLean: 4, blend: 0.3 },
            { t: tt - 0.08, pose: 'flex', squash: 1, lean: 4 }], T.words('changed', 'Then', 'thief!'));
          show(C.cast.tobi, V(1.6, 0, 0.2), V(-1.2, 0, -1.2), [{ t: s0 - 1, expr: 'shock', pose: 'hold2', sweat: true }]); },
        post(C) { C.notesHeld.visible = true; C.notesHeld.position.copy(hand(C.cast.tobi, 'R')).add(V(0, 0.06, 0.05)); },
        cam: move(V(-0.45, 1.5, -3.3), V(-1.2, 1.5, -1.2), V(-0.6, 1.5, -2.6), V(-1.2, 1.5, -1.2), 40, 34) },
    ];
  };

  // ---------------------------------------------------------------- 12. the teachers search his pockets
  S.teachers = (s0) => {
    const tf = w('teachers', 'found'), tw = w('teachers', 'Where'), tst = w('teachers', 'stole');
    return [
      { at: 0, set: 'classA', init(C) {
          const Tb = show(C.cast.tobi, V(1.6, 0, 0.2), V(1.4, 0, -2.8), [{ t: s0 - 1, expr: 'worried', pose: 'raise', sweat: true }, { t: tf, expr: 'shock' }]);
          show(C.cast.teacherM, V(2.55, 0, -0.35), V(1.6, 0, 0.2), [{ t: s0 - 1, expr: 'focus', pose: 'dig', work: 'dig', lean: 14 }, { t: tf - 0.1, pose: 'raise', work: null, expr: 'skeptic', lean: 0, squash: 1 }]);
          show(C.cast.teacher, V(0.4, 0, -1.1), V(1.6, 0, 0.2), [{ t: s0 - 1, expr: 'skeptic', pose: 'hips', look: headOf(Tb) }, { t: tw - 0.05, expr: 'angry', pose: 'point', lean: 8, squash: 1 }, { t: tst - 0.05, pose: 'raise', headLean: -6 }], T.words('teachers', 'Where', 'too!'));
          show(C.cast.kemi, V(-1.3, 0, -1.4), V(1.6, 0, 0.2), [{ t: s0 - 1, expr: 'smug', pose: 'cross', look: headOf(Tb) }]); },
        post(C, t) { C.pocketNote.visible = t > tf - 0.1; C.pocketNote.position.copy(hand(C.cast.teacherM, 'R')).add(V(0, 0.08, 0)); },
        cam: move(V(0.7, 1.75, -2.9), V(2.1, 1.5, -0.1), V(0.85, 1.75, -2.6), V(2.1, 1.5, -0.1), 46, 44) },
      { at: tw - s0 - 0.1, set: 'classA', inherit: true, cam: move(V(1.4, 1.9, -3.8), V(0.4, 1.85, -1.1), V(1.25, 1.9, -3.4), V(0.4, 1.85, -1.1), 38, 36) },
    ];
  };

  // ---------------------------------------------------------------- 13. the school president leans in: "Thief."
  S.pres = (s0) => {
    const tlean = w('pres', 'leaned'), tth = w('pres', 'Thief.');
    const P0 = V(3.6, 0, -3.4), P1 = V(2.5, 0, -0.9);
    return [
      { at: 0, set: 'classA', init(C) {
          show(C.cast.tobi, V(1.6, 0, 0.2), P1, [{ t: s0 - 1, expr: 'worried', sweat: true, pose: 'idle' }, { t: tlean, expr: 'shock', pose: 'cower', lean: -8 }]);
          show(C.cast.president, P0, V(1.6, 0, 0.2), [
            { t: s0 - 1, expr: 'angry', pose: 'hips' },
            { t: tlean - 0.1, lean: 26, headLean: 14, blend: 0.4, look: headOf(C.cast.tobi) },
            { t: tth - 0.08, squash: 1, mouth: 'grit', eyes: 'squint' }], T.words('pres', 'Thief.', 'Thief.'))
            .walk({ t0: s0 + 0.1, t1: tlean - 0.15, from: P0, to: P1, mode: 'walk', ease: false });
          show(C.cast.kemi, V(-1.3, 0, -1.4), V(1.6, 0, 0.2), [{ t: s0 - 1, expr: 'smug', pose: 'cross' }]); },
        cam: move(V(-0.6, 1.7, 2.6), V(2.4, 1.4, -1.4), V(-0.3, 1.7, 2.2), V(2.2, 1.4, -1.0), 50, 48) },
      { at: tlean - s0 - 0.05, set: 'classA', speed: [tth - 0.08, tth + 0.4],
        cam: move(V(1.45, 1.05, 0.9), V(2.4, 1.9, -0.9), V(1.4, 1.0, 1.0), V(2.4, 1.95, -0.9), 66, 62) },
    ];
  };

  // ---------------------------------------------------------------- 14. principal's office: the call
  S.office = (s0) => {
    const tc = w('office', 'called'), ts = w('office', 'Sir,');
    return [
      { at: 0, set: 'office', init(O) {
          show(O.cast.principal, V(0, 0, -2.55), V(0, 0, 2), [{ t: s0 - 1, expr: 'bored', pose: 'idle', look: V(0, 1.5, 0.6) }, { t: tc - 0.1, pose: 'phone', expr: 'neutral' }], T.words('office', 'Sir,', 'today?'));
          show(O.cast.tobi, V(-0.7, 0, 0.4), V(0, 0, -2.5), [{ t: s0 - 1, expr: 'sad', headTilt: -6 }]);
          show(O.cast.teacher, V(-1.3, 0, 1.0), V(0, 0, -2.5), [{ t: s0 - 1, expr: 'skeptic', pose: 'cross' }]);
          show(O.cast.kemi, V(1.9, 0, 0.1), V(0, 0, -2.5), [{ t: s0 - 1, expr: 'smug', pose: 'hips' }]);
          show(O.cast.president, V(2.9, 0, 1.3), V(0, 0, -2.5), [{ t: s0 - 1, expr: 'bored', pose: 'cross' }]); },
        post(O, t) { if (t > tc - 0.05) { O.handset.position.copy(O.phone.worldToLocal(hand(O.cast.principal, 'R'))); O.handset.rotation.set(0, 0, 1.3); } },
        cam: move(V(1.9, 2.2, 4.6), V(-0.1, 1.3, -1.4), V(1.7, 2.15, 4.1), V(-0.1, 1.3, -1.6), 46, 44) },
      { at: ts - s0 - 0.15, set: 'office', inherit: true, cam: move(V(0.5, 1.75, -0.4), V(0, 1.75, -2.55), V(0.45, 1.75, -0.8), V(0, 1.75, -2.55), 36, 34) },
    ];
  };

  // ---------------------------------------------------------------- 15. Dad on the phone at his shop
  S.dad = (s0) => {
    const tt = w('dad', 'Two');
    return [
      { at: 0, set: 'shop', init(P) {
          show(P.cast.dad, V(0, 0, -0.4), V(0, 0, 4), [{ t: s0 - 1, expr: 'happy', pose: 'phone', look: 'camera' }, { t: tt, work: 'count' }], T.words('dad', 'One', 'transport.')); },
        post(P) { P.phone.position.copy(hand(P.cast.dad, 'R')).add(V(0.02, 0.06, 0.02)); P.phone.rotation.set(0, 0, 0.3); },
        cam: move(V(0.3, 1.75, 3.4), V(0, 1.55, -0.4), V(0.2, 1.75, 2.9), V(0, 1.6, -0.4), 36, 33) },
    ];
  };

  // ---------------------------------------------------------------- 16. silence: vindicated
  S.silence = (s0) => {
    const tp = w('silence', 'pocket.'), ts = w('silence', 'silent.');
    return [
      { at: 0, set: 'office', init(O) {
          show(O.cast.principal, V(0, 0, -2.55), V(0, 0, 2), [{ t: s0 - 1, expr: 'shock', pose: 'phone' }, { t: tp, pose: 'idle', expr: 'worried', look: V(1.2, 1.5, 1.0) }]);
          show(O.cast.tobi, V(-0.7, 0, 0.4), V(-0.4, 0, 4), [{ t: s0 - 1, expr: 'happy', look: 'camera', pose: 'cross' }, { t: ts, eyes: 'half', mouth: 'smirk' }]);
          show(O.cast.teacher, V(-1.3, 0, 1.0), V(0, 0, -2.5), [{ t: s0 - 1, expr: 'worried', sweat: true, pose: 'idle', look: headOf(O.cast.tobi) }]);
          show(O.cast.kemi, V(1.9, 0, 0.1), V(0, 0, -2.5), [{ t: s0 - 1, expr: 'shock', sweat: true }, { t: tp, expr: 'sad', headTilt: -10, tint: 0.35, tintColor: '#f0a0a0' }]);
          show(O.cast.president, V(2.9, 0, 1.3), V(0, 0, -2.5), [{ t: s0 - 1, expr: 'worried', pose: 'cower', lean: -6 }]); },
        post(O, t) { if (t < tp) { O.handset.position.copy(O.phone.worldToLocal(hand(O.cast.principal, 'R'))); O.handset.rotation.set(0, 0, 1.3); } },
        cam: move(V(-0.5, 1.5, 3.4), V(-0.7, 1.45, 0.4), V(-0.55, 1.5, 2.7), V(-0.7, 1.45, 0.4), 36, 32) },
      { at: ts - s0 - 0.25, set: 'office', inherit: true, cam: move(V(0.3, 2.6, 5.4), V(0.2, 1.2, 0.2), V(0.3, 2.7, 6.0), V(0.2, 1.2, 0.2), 50, 50) },
    ];
  };

  // ---------------------------------------------------------------- 17. a week later: the twist
  S.twist = (s0, d) => {
    const ta = w('twist', 'Another'), tl = w('twist', 'lesson.');
    const ADA = V(4.1, 0, 5.9);
    return [
      { at: 0, set: 'classA', init(C) {
          seatClass(C, s0);
          show(C.cast.kemi, V(-3.1, 0, -1.9), BOARD, [{ t: s0 - 1, expr: 'sad', sit: 0.5, headTilt: -10 }]);
          show(C.cast.tobi, TOBI_SEAT, BOARD, [{ t: s0 - 1, expr: 'content', sit: 0.5 }]);
          show(C.cast.ada, ADA, BOARD, [{ t: s0 - 1, expr: 'neutral', sit: 0.5 }, { t: ta + 0.2, look: 'camera', expr: 'smug' }, { t: tl - 0.4, expr: 'evil', pose: 'hold2', squash: 1 }]); },
        post(C, t) { C.note1000.visible = t > tl - 0.4; C.note1000.position.copy(hand(C.cast.ada, 'R')).add(V(0, 0.08, 0.04)); C.note1000.rotation.set(0, Math.PI, 0); },
        cam: move(V(-2.6, 1.4, -4.6), V(-3.1, 1.1, -1.6), V(-2.8, 1.5, -4.0), V(-3.1, 1.1, -1.6), 38, 36) },
      { at: ta - s0 - 0.1, set: 'classA', inherit: true, cam: path([[0, V(3.0, 1.9, 3.2), V(4.1, 1.2, 5.9), 44], [1, V(4.0, 1.25, 4.3), V(4.1, 1.15, 5.9), 32]]) },
    ];
  };

  return S;
}

// "The Burger Wager" (In this world...). Camera grammar: one continuous move per scene (segments in the same set
// glide into each other), zoom-throughs between scenes, white flashes for time jumps, a few hard cuts on punchlines.
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
const handW = (c, side = 'R') => { c.root.updateMatrixWorld(true); return c.torso.localToWorld((side === 'R' ? c.handR : c.handL).clone()); };
const track = (f) => { f.track = true; return f; };
const CU = (who, { az = 0.35, el = 0.08, frac = 0.36, fov = 32, drift = 0.1, dy = 0.8, yaw = null, hk = 1 } = {}) => track((lt, u, t, set) => {
  const c = set.cast[who]; c.root.updateMatrixWorld(true); const hw = c.head.getWorldPosition(V(0, 0, 0)); const r = c.root.position; const h = V(r.x * (1 - hk) + hw.x * hk, hw.y, r.z * (1 - hk) + hw.z * hk); const hr = c.hr;
  const d = hr / (frac * Math.tan(fov * Math.PI / 360)); const a = (yaw ?? c.facing) + az + drift * (u - 0.5);
  return { p: V(h.x + Math.sin(a) * Math.cos(el) * d, h.y + Math.sin(el) * d, h.z + Math.cos(a) * Math.cos(el) * d), l: V(h.x, h.y - dy * hr, h.z), fov };
});
const KNEEL = { sit: 0.62, pose: 'pray', lean: 14, headTilt: 0, expr: 'content', eyes: 'closed' };
const TOWN = ['tA', 'tB', 'tC', 'tD'];

export function buildShots(T) {
  const S = {}; const w = (shot, word, n = 1) => T.word(shot, word, n);
  const all = (shot) => T.shotWords(shot);
  const at = (s0, t, lead = 0.12) => t - s0 - lead;
  const crowd = (Tn, s0, keysFor) => { for (let i = 0; i < 10; i++) { const row = Math.floor(i / 5), col = i % 5; const p = V(-2.6 + col * 1.3 + (row % 2) * 0.5, 0, -7 - row * 1.8); show(Tn.cast[`k${i}`], p, 0, [{ t: s0 - 1, ...KNEEL, eyes: i % 3 ? 'closed' : 'half' }, ...(keysFor ? keysFor(i) : [])]); } };

  // 1. HOOK: crane down from the steeple; townsfolk with a book and a phone; one slowly kneels
  S.hook = (s0, d) => { const tg = w('hook', 'God.');
    const init = (Tn) => { Tn.book.visible = true; Tn.phone.visible = true;
      show(Tn.cast.tA, V(-2.4, 0, -4), Math.PI / 2, [{ t: s0 - 1, expr: 'content', pose: 'hold2' }]).walk({ t0: s0 - 1, t1: s0 + d + 1, from: V(-2.4, 0, -4), to: V(1.2, 0, -4), mode: 'walk', ease: false });
      show(Tn.cast.tB, V(2.0, 0, -6), -Math.PI / 2, [{ t: s0 - 1, expr: 'happy', pose: 'phone' }]).walk({ t0: s0 - 1, t1: s0 + d + 1, from: V(2.0, 0, -6), to: V(-1.0, 0, -6), mode: 'walk', ease: false });
      show(Tn.cast.tC, V(0.4, 0, -2.2), 0, [{ t: s0 - 1, expr: 'content', pose: 'idle' }, { t: tg - 0.5, ...KNEEL }]); };
    const post = (Tn) => { Tn.book.position.copy(handW(Tn.cast.tA, 'L')); Tn.phone.position.copy(handW(Tn.cast.tB)).add(V(0, 0.08, 0.05)); Tn.phone.rotation.set(-0.3, Math.PI / 2, 0); };
    return [{ at: 0, set: 'town', init, post, cam: path([[0, V(0, 12.5, -12), V(0, 12.2, -21.8), 40], [0.75, V(0.6, 2.4, 3.5), V(0, 1.6, -4), 44], [1, V(0.8, 1.7, 2.6), V(0.2, 1.2, -2.4), 42]]) }]; };

  // 2. HUSS: dark bedroom, extreme close-up, panting
  S.huss = (s0, d) => { const hw_ = all('huss');
    const init = (B) => { B.lamp.intensity = 1.5; show(B.cast.hero, V(-1.7, 0, 0.9), Math.PI / 2 + 0.4, [{ t: s0 - 1, expr: 'panic', sweat: true, sit: 0.45, pose: 'cower' }, ...hw_.map((x) => ({ t: x.start, squash: 1 }))]); };
    return [{ at: 0, set: 'bedroom', trans: 'cut', init, cam: CU('hero', { az: 0.1, frac: 0.62, dy: 0.2, fov: 30, drift: 0.04 }) }]; };

  // 3. PROOF: the empty evidence case; telescopes, microscopes, one scientist licks a meteorite
  S.proof = (s0, d) => { const tp = w('proof', 'proof.'), tf = w('proof', 'footprint.'), tr = w('proof', 'receipt.'), tt = w('proof', 'Telescopes,'), tm = w('proof', 'microscopes,'), tl = w('proof', 'licked'), tn = w('proof', 'Nothing.');
    const init = (L) => {
      show(L.cast.sci, V(0.1, 0, 1.8), Math.PI, [{ t: s0 - 1, expr: 'focus', pose: 'hold2' }, { t: tp - 0.2, lean: 22, expr: 'skeptic', pose: 'idle' }, { t: tr - 0.1, lean: 22, eyes: 'half', mouth: 'flat' }])
        .walk({ t0: s0 - 0.2, t1: tp - 0.1, from: V(0.1, 0, 1.8), to: V(0, 0, -0.5), mode: 'walk', ease: true });
      show(L.cast.sci2, V(-2.3, 0, -0.25), Math.PI, [{ t: s0 - 1, lean: 18, pose: 'hold2', expr: 'focus', eyes: 'closed' }, { t: tm + 0.1, lean: 0, look: 'camera', expr: 'sad', pose: 'shrug' }]);
      show(L.cast.sci3, V(2.25, 0, -0.45), Math.PI, [{ t: s0 - 1, lean: 16, pose: 'hold2', expr: 'focus' }, { t: tl - 0.6, lean: 0, pose: 'give', expr: 'focus', look: V(2.45, 1.6, -0.4) }, { t: tl, mouth: 'tongue', eyes: 'closed' }, { t: tn - 0.15, look: 'camera', eyes: 'half', mouth: 'flat', pose: 'idle' }, { t: tn + 0.35, eyes: 'closed' }, { t: tn + 0.45, eyes: 'half' }]); };
    const post = (L, t) => { const k = ramp(t, tl - 0.6, tl - 0.15); const m = L.met; if (k > 0 && t < tn - 0.15) { const h = L.cast.sci3.head.getWorldPosition(V(0, 0, 0)); const home = L.table.localToWorld(L.metHome.clone()); m.position.copy(L.table.worldToLocal(home.lerp(h.add(V(0, -0.12, 0.25)), ease(k)))); } else if (t >= tn - 0.15) { const back = ramp(t, tn - 0.15, tn + 0.3); m.position.copy(L.metHome).add(V(0, 0.6 * (1 - back), 0.3 * (1 - back))); } else m.position.copy(L.metHome); };
    return [
      { at: 0, set: 'lab', trans: 'zoom', init, post, cam: move(V(0.6, 2.4, 6.5), V(0, 2.2, -2.5), V(0.4, 1.7, 2.6), V(0, 1.3, -1.4), 44, 40) },
      { at: at(s0, tf, 0.3), set: 'lab', post, cam: (lt, u) => ({ p: V(0.05, 0.75, -0.2 + 0.08 * u), l: V(0, 0.64, -1.09), fov: 34 }) },
      { at: at(s0, tr, 0.25), set: 'lab', post, cam: CU('sci', { az: 0.35, frac: 0.36 }) },
      { at: at(s0, tt, 0.2), set: 'lab', post, cam: CU('sci2', { az: -0.6, frac: 0.3, dy: 1.2 }) },
      { at: at(s0, tl, 0.7), set: 'lab', post, cam: CU('sci3', { az: -0.5, frac: 0.32, dy: 1.0 }) },
    ]; };

  // 4. STALEMATE: two philosophers argue in the agora, then both fold their arms
  S.stalemate = (s0, d) => { const ts = w('stalemate', 'stalemate.');
    const init = (A) => { A.board.visible = false;
      show(A.cast.philo, V(-0.2, 0, -0.6), V(-1.6, 0, -0.2), [{ t: s0 - 1, expr: 'angry', pose: 'point' }, { t: w('stalemate', 'prove') - 0.1, pose: 'gesture', squash: 1 }, { t: w('stalemate', 'either.') - 0.1, pose: 'point', squash: 1 }, { t: ts - 0.15, pose: 'cross', expr: 'skeptic', squash: 1 }]).groove(all('stalemate'), 1);
      show(A.cast.rival, V(-1.6, 0, -0.2), V(-0.2, 0, -0.6), [{ t: s0 - 1, expr: 'skeptic', pose: 'gesture' }, { t: w('stalemate', 'nobody') - 0.1, pose: 'point', squash: 1, expr: 'angry' }, { t: w('stalemate', "didn't") - 0.1, pose: 'shrug', squash: 1 }, { t: ts - 0.1, pose: 'cross', expr: 'skeptic', squash: 1 }]).groove(all('stalemate'), 1); };
    return [{ at: 0, set: 'agora', trans: 'zoom', init, cam: move(V(-0.6, 1.7, 2.6), V(-0.9, 1.5, -0.4), V(-0.4, 2.4, 6.5), V(-0.9, 1.6, -0.4), 40, 42) }]; };

  // 5. WAGER: eureka, the board draws itself cell by cell; perfect - chef's kiss
  S.wager = (s0, d) => { const tb = w('wager', 'breakthrough.'), tw = w('wager', 'Burger'), tL = w('wager', 'nothing.'), tH = w('wager', 'rewards.'), tF = w('wager', 'punishment.'), th = w('wager', 'heaven,'), te = w('wager', 'effort.'), tm = w('wager', 'math'), tp = w('wager', 'perfect.');
    const tGrid = w('wager', 'If') - 0.1;
    const board = (A, t) => A.boardSet({ title: ramp(t, tw - 0.1, tw + 0.2), grid: ramp(t, tGrid, tGrid + 1.0), c: [ramp(t, tL - 0.25, tL + 0.1), ramp(t, tH - 0.35, tH), ramp(t, tF - 0.35, tF), ramp(t, te - 0.3, te)].map((x) => +x.toFixed(2)),
      circle: +ramp(t, th - 0.2, th + 0.3).toFixed(2), check: +ramp(t, tm - 0.1, tm + 0.3).toFixed(2), perfect: +ramp(t, tp - 0.15, tp + 0.1).toFixed(2) });
    const init = (A) => { A.board.visible = true;
      show(A.cast.philo, V(-0.4, 0, -1.0), 0.3, [{ t: s0 - 1, expr: 'focus', pose: 'chin' }, { t: tb - 0.15, pose: 'eureka', expr: 'laugh', squash: 1, look: 'camera' }, { t: tw + 0.4, pose: 'point', expr: 'smug', look: V(1.2, 1.9, -1.6) },
        { t: th - 0.1, pose: 'point', squash: 1 }, { t: tp - 0.15, pose: 'kiss', eyes: 'happy', mouth: 'smile', squash: 1, look: 'camera' }]).groove(all('wager'), 0.9);
      show(A.cast.rival, V(-2.4, 0, 0.6), V(1.2, 0, -1.6), [{ t: s0 - 1, expr: 'skeptic', pose: 'cross' }, { t: tH, expr: 'shock', pose: 'raise', squash: 1 }, { t: tF, expr: 'panic', pose: 'cower', squash: 1 }, { t: tp, expr: 'happy', pose: 'idle' }]); };
    // camera on a point of the board (texture coords u,v in 0..1024), d metres in front of it
    const boardCam = (u, v, dist, fov = 38) => track((lt, uu, t, A) => { A.board.updateMatrixWorld(true); const pl = A.board.children[0]; const p = pl.localToWorld(V((u / 1024 - 0.5) * 2.2, (0.5 - v / 1024) * 2.2, 0)); const n = V(0, 0, 1).applyQuaternion(A.board.quaternion); return { p: p.clone().addScaledVector(n, dist + 0.15 * uu), l: p, fov }; });
    return [
      { at: 0, set: 'agora', init, post: board, cam: CU('philo', { az: 0.3, frac: 0.34, dy: 1.4, drift: 0.15 }) },
      { at: at(s0, tw, 0.35), set: 'agora', post: board, trans: 'flash', flashColor: '255,250,235', cam: boardCam(520, 140, 5.6) },
      { at: at(s0, tGrid + 0.1, 0.05), set: 'agora', post: board, cam: boardCam(600, 560, 4.6, 40) },
      { at: at(s0, tL, 0.5), set: 'agora', post: board, cam: boardCam(802, 600, 2.5) },
      { at: at(s0, tH, 0.6), set: 'agora', post: board, cam: boardCam(428, 600, 2.5) },
      { at: at(s0, tF, 0.7), set: 'agora', post: board, cam: boardCam(428, 840, 2.5) },
      { at: at(s0, te, 0.6), set: 'agora', post: board, cam: boardCam(600, 640, 4.6, 40) },
      { at: at(s0, tp, 0.25), set: 'agora', post: board, cam: CU('philo', { az: 0.15, frac: 0.38, dy: 1.0 }) },
    ]; };

  // 6. WORLD: 99.9% believe - crowd kneeling; prayer apps, church drive-thrus, babies baptized
  S.world = (s0, d) => { const tr = w('world', 'religious.'), ta = w('world', 'apps.'), tdt = w('world', 'Church'), tbb = w('world', 'Babies'), tbp = w('world', 'baptized'), tbl = w('world', 'blink.');
    const town = (Tn) => { crowd(Tn, s0); show(Tn.cast.tA, V(0.2, 0, -4.6), 0, [{ t: s0 - 1, ...KNEEL }, { t: tr - 0.3, pose: 'raise', expr: 'laugh', eyes: 'happy', squash: 1, lean: -8 }]);
      show(Tn.cast.tB, V(-1.6, 0, -3.4), 0.3, [{ t: s0 - 1, pose: 'phone', expr: 'happy', look: V(-1.4, 1.5, -3.0) }]); Tn.phone.visible = true; };
    const townPost = (Tn) => { Tn.phone.position.copy(handW(Tn.cast.tB)).add(V(0, 0.06, 0.04)); Tn.phone.rotation.set(-0.5, 0.3, 0); Tn.phoneSet({ n: 9999 }); };
    const drive = (D) => { show(D.cast.pastor, V(-2.0, 0, -1.2), Math.PI / 2, [{ t: s0 - 1, expr: 'happy', pose: 'wave' }]); show(D.cast.driver, V(-0.15, 0.15, -1.05), -Math.PI / 2, [{ t: s0 - 1, expr: 'happy', sit: 0.6, pose: 'pray' }]); };
    const church = (C) => { show(C.cast.pastor, V(2.7, 0, -4.4), Math.PI, [{ t: s0 - 1, expr: 'happy', pose: 'give' }, { t: tbp - 0.1, lean: 18, squash: 1 }, { t: tbl, lean: 0, expr: 'laugh' }]); C.baby.visible = true; };
    const churchPost = (C, t) => { const p = C.cast.pastor; const hL = handW(p, 'L'), hR = handW(p, 'R'); C.baby.position.copy(hL.add(hR).multiplyScalar(0.5)).add(V(0, 0.32, 0)); const dip = ramp(t, tbp - 0.1, tbp + 0.3) - ramp(t, tbl - 0.2, tbl + 0.1); C.baby.position.y -= 0.25 * dip; C.baby.rotation.set(0, Math.PI, 0); };
    return [
      { at: 0, set: 'town', trans: 'zoom', init: town, post: townPost, cam: path([[0, V(3.0, 6.4, -6.0), V(3.0, 5.1, -10), 40], [0.6, V(1.2, 3.4, -0.5), V(0, 0.8, -7), 44], [1, V(0.9, 1.9, -1.8), V(0.2, 1.5, -4.6), 40]]) },
      { at: at(s0, w('world', 'Prayer'), 0.15), set: 'town', post: townPost, cam: track((lt, u, t, Tn) => { const p = Tn.phone.getWorldPosition(V(0, 0, 0)); return { p: p.clone().add(V(0.12 * Math.sin(0.3), 0.18, 0.42)), l: p, fov: 30 }; }) },
      { at: at(s0, tdt, 0.15), set: 'drive', trans: 'zoom', init: drive, cam: move(V(2.4, 2.0, 3.6), V(-1.3, 1.7, -0.9), V(1.7, 1.9, 2.6), V(-1.5, 1.7, -1.1), 44, 40) },
      { at: at(s0, tbb, 0.15), set: 'church', trans: 'zoom', init: church, post: churchPost, cam: track((lt, u, t, C) => { const b = C.baby.getWorldPosition(V(0, 0, 0)); return { p: V(b.x + 0.7, b.y + 0.45, b.z - 1.5 + 0.2 * u), l: V(b.x, b.y + 0.2, b.z), fov: 38 }; }) },
    ]; };

  // 7. ME: the last non-believer walks into the kneeling crowd and folds his arms; crane up
  S.me = (s0, d) => { const tm = w('me', 'me.'), tl = w('me', 'last');
    const init = (Tn) => { crowd(Tn, s0); show(Tn.cast.hero, V(1.2, 0, 1.5), Math.PI, [{ t: s0 - 1, expr: 'bored', pose: 'idle' }, { t: tm - 0.3, pose: 'cross', look: 'camera', expr: 'skeptic', squash: 1 }])
      .walk({ t0: s0 - 0.6, t1: tm - 0.2, from: V(1.2, 0, 1.5), to: V(-0.3, 0, -7.9), mode: 'walk', ease: true }); };
    return [
      { at: 0, set: 'town', trans: 'zoom', init, cam: track((lt, u, t, Tn) => { const r = Tn.cast.hero.root.position; return { p: V(r.x + 0.6, 1.7, r.z - 3.0), l: V(r.x, 1.35, r.z), fov: 42 }; }) },
      { at: at(s0, tl, 0.3), set: 'town', cam: (lt, u) => ({ p: V(-0.3 + 0.3 * u, lerp(3.0, 12, ease(u)), lerp(-4.6, -6.8, ease(u))), l: V(-0.3, 0.5, -8.0), fov: lerp(46, 52, u) }) },
    ]; };

  // 8. DOUBT: hand on chin at the research wall; flips the belief switch; bets on a losing team
  S.doubt = (s0, d) => { const tf = w('doubt', 'flip'), tz = w('doubt', 'prize.'), tro = w('doubt', 'robot.'), tbet = w('doubt', 'bet'), tlo = w('doubt', 'lose.'), twn = w('doubt', 'win.');
    const flips = [tf, tf + 0.35, tf + 0.7, tf + 1.05, tf + 1.4, tz - 0.3, tz + 0.05];
    const init = (B) => {
      show(B.cast.hero, V(-0.6, 0, -1.6), Math.PI, [{ t: s0 - 1, pose: 'chin', expr: 'skeptic', look: V(-0.9, 1.9, -2.97) }, { t: tf - 0.4, pose: 'point', expr: 'focus', look: V(1.6, 1.35, -2.97) },
        { t: tro - 0.25, look: 'camera', eyes: 'half', mouth: 'flat', pose: 'idle' }, { t: tbet - 0.2, pose: 'hold2', expr: 'hopeful', look: V(2.7, 1.05, -1.4) }, { t: tlo - 0.05, expr: 'sad', squash: 1 }, { t: twn - 0.25, pose: 'shrug', look: 'camera', eyes: 'half', mouth: 'flat', squash: 1 }])
        .walk({ t0: tf - 0.6, t1: tf - 0.05, from: V(-0.6, 0, -1.6), to: V(1.05, 0, -2.35), mode: 'walk', ease: true }); B.slip.visible = false; };
    const post = (B, t) => { let on = 0; flips.forEach((x) => { if (t >= x) on ^= 1; }); B.lever.rotation.x = on ? -0.7 : 0.7;
      B.slip.visible = t > tbet - 0.2; if (B.slip.visible) { B.slip.position.copy(handW(B.cast.hero, 'L')).add(V(0, 0.08, 0.05)); B.slip.rotation.set(-0.3, B.cast.hero.facing, 0); }
      B.tvSet({ a: 0, b: t < tlo ? 7 : 9 }); };
    return [
      { at: 0, set: 'bedroom', trans: 'zoom', init, post, cam: CU('hero', { az: 1.2, frac: 0.3, dy: 0.9 }) },
      { at: at(s0, tf, 0.25), set: 'bedroom', post, cam: (lt, u) => ({ p: V(2.5, 1.6, -0.8), l: V(1.35, 1.4, -2.9), fov: 36 + 4 * u }) },
      { at: at(s0, tro, 0.35), set: 'bedroom', post, cam: CU('hero', { az: 0.2, frac: 0.38 }) },
      { at: at(s0, tbet, 0.25), set: 'bedroom', post, cam: track((lt, u, t, B) => { const h = B.cast.hero.root.position; return { p: V(h.x - 0.6, 1.6, h.z + 2.6), l: V(lerp(h.x, 2.4, 0.45), 1.25, lerp(h.z, -1.5, 0.45)), fov: 46 }; }) },
      { at: at(s0, twn, 0.3), set: 'bedroom', post, cam: CU('hero', { az: -0.2, frac: 0.34, dy: 1.2 }) },
    ]; };

  // 9. FAMILY: outside the church - Mom prays for him, Bro: "they're gonna roast you" (fire flares), he sweats
  S.family = (s0, d) => { const tl = w('family', 'Literally.'), tb = w('family', 'burn');
    const mw = T.speakerWords('mom'), bw = T.speakerWords('bro');
    const init = (Tn) => {
      show(Tn.cast.hero, V(0.6, 0, -15.0), Math.PI, [{ t: s0 - 1, expr: 'neutral', pose: 'idle' }, { t: w('family', 'honestly,') - 0.2, expr: 'worried', sweat: true, look: 'camera', mouth: 'grit' }])
        .walk({ t0: s0 - 0.5, t1: s0 + 1.4, from: V(1.2, 0, -14.4), to: V(1.9, 0, -17.2), mode: 'walk', ease: true });
      show(Tn.cast.mom, V(-0.6, 0, -19.0), 0.25, [{ t: s0 - 1, expr: 'worried', pose: 'pray' }, { t: mw[0].start, expr: 'sad', pose: 'pray', blush: true }], mw);
      show(Tn.cast.bro, V(1.4, 0, -19.1), -0.3, [{ t: s0 - 1, expr: 'worried', pose: 'cross' }, { t: bw[0].start, expr: 'skeptic', pose: 'gesture' }, { t: tl - 0.1, expr: 'shock', pose: 'raise', squash: 1 }], bw);
      show(Tn.cast.pastor, V(0.4, 0, -19.9), 0, [{ t: s0 - 1, expr: 'worried', pose: 'pray' }]); };
    const post = (Tn, t) => { Tn.fireK = ease(ramp(t, tl - 0.1, tl + 0.3)) * (1 - 0.4 * ramp(t, tb + 0.5, tb + 1.2)); Tn.fire.position.copy(Tn.cast.bro.root.position).add(V(-0.4, 0, 0.9)); };
    return [
      { at: 0, set: 'town', trans: 'zoom', init, post, cam: track((lt, u, t, Tn) => { const r = Tn.cast.hero.root.position; return { p: V(r.x + 1.6, 1.8, r.z + 3.6 - 0.8 * u), l: V(0.3, 1.4, -19), fov: 40 }; }) },
      { at: at(s0, mw[0].start, 0.2), set: 'town', post, cam: CU('mom', { az: 0.0, frac: 0.38 }) },
      { at: at(s0, bw[0].start, 0.2), set: 'town', post, cam: CU('bro', { az: -0.3, frac: 0.36, dy: 1.2 }) },
      { at: at(s0, w('family', 'honestly,'), 0.3), set: 'town', post, cam: CU('hero', { az: 0.15, frac: 0.42, dy: 0.6 }) },
    ]; };

  // 10. RESEARCH: the desk at night, the wall of notes; slumps; the wall goes dark: ∞ ALWAYS WINS
  S.research = (s0, d) => { const to = w('research', 'odds.'), ti = w('research', 'Infinity');
    const init = (B) => { show(B.cast.hero, V(-0.9, 0, -1.65), Math.PI, [{ t: s0 - 1, sit: 0.4, pose: 'hold2', expr: 'focus', look: V(-0.9, 0.95, -2.4) }, { t: w('research', 'counterargument.') - 0.2, look: V(-0.4, 1.9, -2.97) }, { t: w('research', 'loophole.') - 0.2, look: V(-1.6, 2.2, -2.97) },
      { t: to - 0.2, lean: 48, pose: 'idle', expr: 'sad', eyes: 'closed', squash: 1, look: null }]); };
    const post = (B, t) => B.wallSet({ dark: +ramp(t, ti - 0.15, ti + 0.4).toFixed(2) });
    return [
      { at: 0, set: 'bedroom', trans: 'zoom', init, post, cam: move(V(-0.2, 1.7, 0.6), V(-0.9, 1.3, -2.4), V(-0.5, 1.8, 0.1), V(-0.9, 1.4, -2.5), 40, 38) },
      { at: at(s0, w('research', 'counterargument.'), 0.3), set: 'bedroom', post, cam: (lt, u) => ({ p: V(lerp(-1.5, -0.3, ease(u)), 1.95, -1.2), l: V(lerp(-1.6, -0.2, ease(u)), 2.0, -2.97), fov: 36 }) },
      { at: at(s0, to, 0.35), set: 'bedroom', post, cam: move(V(0.6, 1.4, -0.4), V(-0.9, 1.2, -2.3), V(0.9, 1.9, 0.6), V(-0.9, 1.6, -2.6), 40, 44) },
    ]; };

  // 11. CONVERT: walks down the aisle, kneels; a smile forms; purpose, happiness, casseroles
  S.convert = (s0, d) => { const tbv = w('convert', 'believed.'), tbad = w('convert', 'bad.'), th = w('convert', 'happy.'), tc = w('convert', 'casseroles.'), tch = w('convert', 'church');
    const init = (C) => {
      show(C.cast.hero, V(0, 0, 3.0), Math.PI, [{ t: s0 - 1, expr: 'neutral', pose: 'idle' }, { t: tbv - 0.25, ...KNEEL, eyes: 'closed' }, { t: w('convert', 'what?') - 0.2, sit: null, lean: 0, pose: 'idle', expr: 'neutral', eyes: 'open', look: 'camera' }, { t: tbad - 0.3, expr: 'content' },
        { t: th - 0.25, pose: 'raise', expr: 'laugh', eyes: 'happy', squash: 1, bounce: 0.4 }, { t: tc - 0.5, pose: 'give', expr: 'happy', bounce: 0, look: V(-0.9, 1.3, -4.2) }]).walk({ t0: s0 - 0.3, t1: tbv - 0.3, from: V(0, 0, 3.0), to: V(0, 0, -5.4), mode: 'walk', ease: true });
      show(C.cast.mom, V(-2.6, 0, -3.6), V(0, 0, -5.4), [{ t: s0 - 1, expr: 'happy', pose: 'give' }]).walk({ t0: tch - 0.6, t1: tc - 0.3, from: V(-2.6, 0, -3.6), to: V(-0.8, 0, -4.6), mode: 'walk', ease: true });
      for (let i = 0; i < 6; i++) { const p = V(i < 3 ? -1.9 + (i - 1) * 0.8 : 1.9 + (i - 4) * 0.8, 0, -0.45 + (i % 2) * 1.25); show(C.cast[`c${i}`], p, Math.PI, [{ t: s0 - 1, expr: 'happy', sit: 0.45, pose: 'pray', eyes: 'closed' }, { t: tc - 0.2 + i * 0.05, sit: null, pose: 'raise', eyes: 'happy', expr: 'laugh', squash: 1 }]); C.cass[i + 1].visible = true; }
      C.cass[0].visible = true; };
    const post = (C, t) => { C.cass[0].position.copy(handW(C.cast.mom)).add(V(0.08, 0.02, 0)); for (let i = 0; i < 6; i++) { C.cass[i + 1].visible = t > tc - 0.3; C.cass[i + 1].position.copy(handW(C.cast[`c${i}`])).add(V(0, 0.08, 0)); } };
    return [
      { at: 0, set: 'church', trans: 'zoom', init, post, cam: track((lt, u, t, C) => { const r = C.cast.hero.root.position; return { p: V(0.5, lerp(2.2, 1.6, u), r.z + 3.4), l: V(0, 1.8, r.z - 3), fov: 44 }; }) },
      { at: at(s0, w('convert', 'what?'), 0.3), set: 'church', post, cam: CU('hero', { az: 0.15, frac: 0.42, dy: 0.5 }) },
      { at: at(s0, w('convert', 'purpose.'), 0.2), set: 'church', post, cam: move(V(1.5, 1.7, -2.0), V(-0.4, 1.35, -5.0), V(1.3, 1.75, -2.5), V(-0.4, 1.4, -5.0), 46, 42) },
    ]; };

  // 12. DEATH: white flash - sixty years later in the same pew; hospital, the monitor flatlines, fade to white
  S.death = (s0, d) => { const ty = w('death', 'passed.'), tth = w('death', 'then,'), td = w('death', 'died.');
    const pew = V(-1.9, 0, -1.7);
    const young = (C) => show(C.cast.hero, pew, Math.PI, [{ t: s0 - 1, sit: 0.45, pose: 'pray', expr: 'content', eyes: 'closed' }]);
    const old = (C) => { C.cast.hero.root.visible = false; show(C.cast.old, pew, Math.PI, [{ t: s0 - 1, sit: 0.45, pose: 'pray', expr: 'content', eyes: 'closed' }]); };
    const hosp = (Hs) => show(Hs.cast.old, V(-0.3, 1.08, 0.05), 0, [{ t: s0 - 1, expr: 'content', eyes: 'half', pose: 'idle' }, { t: td - 0.1, eyes: 'closed', mouth: 'flat' }]);
    const hpost = (Hs, t) => { const o = Hs.cast.old; o.root.rotation.x = -Math.PI / 2; Hs.ecgSet({ ph: +(t * 1.2).toFixed(2), flat: +ramp(t, td - 0.05, td + 0.25).toFixed(2) }); };
    const pewCam = (lt, u) => ({ p: V(-1.45, 1.4, -2.5 + 0.05 * u), l: V(-1.9, 1.15, -1.7), fov: 62 });
    return [
      { at: 0, set: 'church', trans: 'zoom', init: young, cam: pewCam },
      { at: at(s0, ty, 0.1), set: 'church', trans: 'flash', flashColor: '255,255,255', init: old, cam: (lt, u) => pewCam(lt + 1, 1) },
      { at: at(s0, tth, 0.2), set: 'hospital', trans: 'flash', flashColor: '255,255,255', init: hosp, post: hpost, fade: [[td + 0.2, td + 0.75, 0, 1]], cam: move(V(0.7, 1.75, -0.4), V(-0.1, 1.05, -1.5), V(0.55, 1.65, -0.7), V(-0.1, 1.05, -1.55), 42, 38) },
    ]; };

  // 13. WHITE ROOM: eyes open; he's right! Then everyone else falls into the fire - pastor, mom, the philosopher
  S.white = (s0, d) => { const tr = w('white', 'right!'), tth = w('white', 'Then'), tbe = w('white', 'Being'), tpa = w('white', 'pastor.'), tmo = w('white', 'mom.'), tgu = w('white', 'guy');
    const fallers = [['f0', -2.6, -2.6], ['f1', 3.4, -4.0], ['f2', -3.2, -6.2], ['f3', 2.6, -7.4], ['f4', -1.0, -9.0], ['f5', 1.8, -2.4]];
    const init = (Wr) => { Wr.board.visible = false;
      show(Wr.cast.old, V(0, 0, 1.8), Math.PI, [{ t: s0 - 1, eyes: 'closed', expr: 'neutral' }, { t: w('white', 'opened') + 0.1, eyes: 'open', expr: 'shock', look: V(-3, 1.5, 0) }, { t: w('white', 'room.') - 0.1, look: V(3, 1.8, 0) },
        { t: tr - 0.2, expr: 'laugh', eyes: 'happy', pose: 'raise', bounce: 0.9, squash: 1, look: V(0, 7.5, -14) }, { t: tth - 0.1, expr: 'neutral', pose: 'idle', bounce: 0, look: V(0, 0.5, -5) }, { t: tbe - 0.1, expr: 'shock', pose: 'cower', squash: 1 }]);
      fallers.forEach(([n, x, z], i) => show(Wr.cast[n], V(x, 0, z), yawTo(V(x, 0, z), V(0, 0, -5)), [{ t: s0 - 1, expr: 'panic', pose: 'raise', sweat: true }]));
      [['pastor', -1.8, -4.0], ['mom', 1.6, -5.6], ['philo', -0.6, -6.8]].forEach(([n, x, z]) => show(Wr.cast[n], V(x, 0, z), 0, [{ t: s0 - 1, expr: 'shock', pose: 'raise', sweat: true }])); };
    const fall = (c, t0, x0, z0, seed = 0) => { const k = ramp(Tn_t, t0, t0 + 1.4); };
    let Tn_t = 0;
    const post = (Wr, t) => { Tn_t = t;
      fallers.forEach(([n, x, z], i) => { const t0 = tbe - 0.4 + i * 0.18; const k = ramp(t, t0, t0 + 1.6); const c = Wr.cast[n]; const px = lerp(x, x * 0.25, ease(Math.min(1, k * 1.6))), pz = lerp(z, -5 + (z + 5) * 0.25, ease(Math.min(1, k * 1.6))); c.root.position.set(px, -Math.max(0, k - 0.45) * 6, pz); c.root.rotation.x = k * 2.2; c.root.rotation.z = k * (i % 2 ? 1.4 : -1.4); c.root.visible = k < 0.98; });
      [['pastor', -1.8, -4.0, tpa], ['mom', 1.6, -5.6, tmo], ['philo', -0.6, -6.8, tgu]].forEach(([n, x, z, tt], i) => { const k = ramp(t, tt - 0.5, tt + 1.0); const c = Wr.cast[n]; const px = lerp(x, x * 0.3, ease(Math.min(1, k * 2))), pz = lerp(z, -5 + (z + 5) * 0.3, ease(Math.min(1, k * 2))); c.root.position.set(px, -Math.max(0, k - 0.3) * 3.2, pz); c.root.rotation.x = 0.6 * k; c.root.rotation.z = (i % 2 ? 0.5 : -0.5) * k; c.root.visible = k < 0.99; }); };
    const fallCam = (n) => track((lt, u, t, Wr) => { const c = Wr.cast[n]; c.root.updateMatrixWorld(true); const h = c.head.getWorldPosition(V(0, 0, 0)); return { p: V(h.x + 0.4, h.y + 0.9, h.z + 1.9), l: V(h.x, h.y - 0.4, h.z), fov: 36 }; });
    return [
      { at: 0, set: 'white', trans: 'flash', flashColor: '255,255,255', init, post, fade: [[s0, s0 + 0.5, 1, 0]], cam: (lt, u) => { const k = ease(Math.min(1, u * 1.2)); return { p: V(0.3, lerp(2.0, 3.4, k), lerp(3.4, 9.5, k)), l: V(0, lerp(1.6, 1.4, k), 1.4), fov: lerp(30, 44, k) }; } },
      { at: at(s0, tr, 0.3), set: 'white', post, cam: move(V(1.6, 0.6, 4.6), V(0, 3.2, -4), V(1.2, 0.5, 4.0), V(0, 3.6, -6), 46, 50) },
      { at: at(s0, tth, 0.2), set: 'white', post, cam: CU('old', { az: 0.2, frac: 0.38 }) },
      { at: at(s0, tbe, 0.2), set: 'white', post, cam: move(V(5.0, 4.2, 4.0), V(0, 0.2, -5), V(4.2, 5.2, 2.6), V(0, 0, -5), 46, 46) },
      { at: at(s0, tpa, 0.35), set: 'white', post, cam: fallCam('pastor') },
      { at: at(s0, tmo, 0.3), set: 'white', post, cam: fallCam('mom') },
      { at: at(s0, tgu, 0.3), set: 'white', post, cam: fallCam('philo') },
    ]; };

  // 14. GOD: the orb speaks (pulses on each word) to the tiny old man
  S.god = (s0, d) => { const gw = T.speakerWords('god');
    const pulse = (t) => { let p = 0; for (const x of gw) { const k = (t - x.start) / 0.35; if (k > 0 && k < 1) p = Math.max(p, Math.sin(Math.PI * k)); } return p; };
    const init = (Wr) => { Wr.board.visible = false; ['f0', 'f1', 'f2', 'f3', 'f4', 'f5', 'pastor', 'mom', 'philo'].forEach((n) => (Wr.cast[n].root.visible = false));
      show(Wr.cast.old, V(0, 0, -0.4), Math.PI, [{ t: s0 - 1, expr: 'worried', sweat: true, pose: 'cower', look: V(0, 7.5, -14) }, { t: w('god', 'warranted') - 0.1, expr: 'shock', squash: 1 }]); };
    const post = (Wr, t) => { const p = pulse(t); Wr.core.scale.setScalar(1 + 0.12 * p); Wr.glow.scale.setScalar(14 * (1 + 0.25 * p)); Wr.glow.material.opacity = 0.8 + 0.2 * p; };
    return [
      { at: 0, set: 'white', init, post, cam: move(V(0.8, 0.35, 2.6), V(0, 4.0, -8), V(0.6, 0.3, 2.2), V(0, 4.6, -9), 50, 48) },
      { at: at(s0, w('god', 'reward'), 0.4), set: 'white', post, cam: CU('old', { az: -0.3, frac: 0.4, el: 0.3, dy: 0.4 }) },
      { at: at(s0, w('god', 'You'), 0.3), set: 'white', post, cam: (lt, u) => ({ p: V(0.4, 6.8, -5.0 - 1.0 * u), l: V(0, 7.5, -14), fov: 50 - 6 * u }) },
    ]; };

  // 15. INFINITE: the board floats in the white room and fills with infinite gods
  S.infinite = (s0, d) => { const tthere = w('infinite', 'There'), to = w('infinite', 'one.');
    const full = { title: 1, grid: 1, c: [1, 1, 1, 1], circle: 1, check: 1, perfect: 1 };
    const init = (Wr) => { ['f0', 'f1', 'f2', 'f3', 'f4', 'f5', 'pastor', 'mom', 'philo'].forEach((n) => (Wr.cast[n].root.visible = false)); Wr.board.visible = true;
      show(Wr.cast.old, V(0.4, 0, 1.2), V(2.6, 0, -2.2), [{ t: s0 - 1, expr: 'sad', pose: 'idle' }, { t: tthere, expr: 'worried', look: V(2.6, 2.4, -2.2) }, { t: to - 0.2, expr: 'shock', squash: 1, look: 'camera' }])
        .walk({ t0: s0 - 0.2, t1: tthere - 0.2, from: V(0.4, 0, 1.2), to: V(1.7, 0, -0.9), mode: 'walk', ease: true }); };
    const post = (Wr, t) => Wr.boardSet({ ...full, inf: +ramp(t, tthere, to - 0.3).toFixed(2), infLabel: +ramp(t, to - 0.6, to - 0.2).toFixed(2) });
    return [
      { at: 0, set: 'white', trans: 'zoom', init, post, cam: track((lt, u, t, Wr) => { const r = Wr.cast.old.root.position; return { p: V(r.x - 1.6, 1.7, r.z + 3.4), l: V(lerp(r.x, 2.6, 0.5), 1.8, lerp(r.z, -2.2, 0.5)), fov: 44 }; }) },
      { at: at(s0, tthere, 0.3), set: 'white', post, cam: track((lt, u, t, Wr) => { Wr.board.updateMatrixWorld(true); const c = Wr.board.children[0].getWorldPosition(V(0, 0, 0)); const n = V(0, 0, 1).applyQuaternion(Wr.board.quaternion); return { p: c.clone().addScaledVector(n, lerp(1.9, 4.6, ease(u))).add(V(0, 0.1, 0)), l: c, fov: 40 }; }) },
    ]; };

  // 16. BURN: top-down, he falls into the pit with the crowd; impact flash
  S.burn = (s0, d) => { const tb = w('burn', 'burned.');
    const init = (Wr) => { Wr.board.visible = false; ['pastor', 'mom', 'philo'].forEach((n) => (Wr.cast[n].root.visible = false));
      show(Wr.cast.old, V(0, 0, -1.7), Math.PI, [{ t: s0 - 1, expr: 'panic', pose: 'raise', sweat: true }]); ['f0', 'f1', 'f2', 'f3', 'f4', 'f5'].forEach((n, i) => show(Wr.cast[n], V(Math.cos(i) * 2.2, 0, -5 + Math.sin(i) * 2.2), 0, [{ t: s0 - 1, expr: 'panic', pose: 'raise' }])); };
    const post = (Wr, t) => { const k = ramp(t, s0 + 0.1, tb + 0.4); const o = Wr.cast.old; o.root.position.set(0, -k * k * 6, lerp(-1.7, -4.6, Math.min(1, k * 2))); o.root.rotation.x = k * 1.6;
      ['f0', 'f1', 'f2', 'f3', 'f4', 'f5'].forEach((n, i) => { const c = Wr.cast[n]; const kk = ramp(t, s0 + i * 0.08, tb + 0.3); c.root.position.set(Math.cos(i) * 2.2 * (1 - kk * 0.6), -kk * kk * 6, -5 + Math.sin(i) * 2.2 * (1 - kk * 0.6)); c.root.rotation.z = kk * (i % 2 ? 2 : -2); }); };
    return [{ at: 0, set: 'white', init, post, fade: [[tb + 0.15, tb + 0.3, 0, 1, '255,240,220']], cam: (lt, u) => ({ p: V(0.05, lerp(9, 6.5, u), -4.95), l: V(0, -1, -5), fov: 50, roll: u * 0.6 }) }]; };

  // 17. HELL: deadpan, a tiny smirk
  S.hell = (s0, d) => { const tt = w('hell', 'time.');
    const init = (Hl) => { show(Hl.cast.old, V(0, 0, 0), 0, [{ t: s0 - 1, expr: 'bored', eyes: 'half', pose: 'idle', look: 'camera' }, { t: tt - 0.1, eyes: 'half', mouth: 'smirk' }]);
      show(Hl.cast.pastor, V(-2.4, 0, -4.5), 0.4, [{ t: s0 - 1, expr: 'sad', pose: 'cower' }]); show(Hl.cast.mom, V(2.2, 0, -5.2), -0.4, [{ t: s0 - 1, expr: 'sad', pose: 'pray' }]); show(Hl.cast.philo, V(-0.6, 0, -7.5), 0.1, [{ t: s0 - 1, expr: 'shock', pose: 'shrug' }]); };
    return [{ at: 0, set: 'hell', trans: 'cut', init, fade: [[s0, s0 + 0.35, 1, 0, '255,240,220']], cam: (lt, u) => { const p = CU('old', { az: 0.1, frac: 0.3, dy: 1.6 }); return { p: V(0.3, 1.75, lerp(4.8, 3.2, ease(u))), l: V(0, 1.45, 0), fov: 36 }; } }]; };

  return S;
}

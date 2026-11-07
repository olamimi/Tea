"""Synthesize score + SFX, duck under narration, master to -14 LUFS-ish.

Usage: python3 audio.py   (needs build/voice.wav + build/timeline.json)
Output: build/mix.wav (48 kHz stereo)
"""
import json
from pathlib import Path
import numpy as np
import soundfile as sf

ROOT = Path(__file__).parent; B = ROOT / "build"
SR = 48000
tl = json.loads((B / "timeline.json").read_text())
DUR = tl["duration"]
N = int(DUR * SR) + SR
rng = np.random.default_rng(7)


def word(shot, w, nth=1):
    n = 0
    for ln in tl["lines"]:
        if ln["shot"] != shot:
            continue
        for x in ln["words"]:
            if x["w"].lower() == w.lower():
                n += 1
                if n == nth:
                    return x["start"]
    raise KeyError((shot, w))


shot = {s["name"]: s for s in tl["shots"]}
L = np.zeros(N); Rr = np.zeros(N)


def add(sig, t, gain=1.0, pan=0.0):
    i = int(t * SR)
    if i >= N:
        return
    sig = sig[: N - i]
    l = np.cos((pan + 1) * np.pi / 4); r = np.sin((pan + 1) * np.pi / 4)
    L[i:i + len(sig)] += sig * gain * l * 1.414
    Rr[i:i + len(sig)] += sig * gain * r * 1.414


def tt(d):
    return np.arange(int(d * SR)) / SR


def note_hz(n):  # MIDI -> Hz
    return 440.0 * 2 ** ((n - 69) / 12)


try:
    from scipy.signal import lfilter, butter
except ImportError:  # pragma: no cover
    raise SystemExit("pip install scipy")


def bp(x, lo, hi, order=2):
    b, a = butter(order, [lo / (SR / 2), hi / (SR / 2)], btype="band"); return lfilter(b, a, x)


def lp(x, fc, order=2):
    b, a = butter(order, fc / (SR / 2)); return lfilter(b, a, x)


# ---------------- instruments ----------------
def pluck(n, d=0.6, bright=1.0):
    t = tt(d); f = note_hz(n); s = np.zeros_like(t)
    for h in range(1, 7):
        s += np.sin(2 * np.pi * f * h * t) * (0.6 ** (h - 1)) * np.exp(-t * (6 + h * 3 / bright))
    s *= np.minimum(1, t / 0.003)
    return s * 0.3


def pad(notes, d, att=0.6, rel=0.8, bright=4):
    t = tt(d); s = np.zeros_like(t)
    for n in notes:
        for det in (-0.08, 0.08):
            f = note_hz(n + det)
            for h in range(1, bright + 1):
                s += np.sin(2 * np.pi * f * h * t + rng.uniform(0, 6)) / h
    env = np.minimum(1, t / att) * np.minimum(1, (d - t) / rel)
    return s * env * 0.03


def bass(n, d=0.5):
    t = tt(d); f = note_hz(n)
    s = np.sin(2 * np.pi * f * t) + 0.3 * np.sin(4 * np.pi * f * t)
    return s * np.exp(-t * 4) * np.minimum(1, t / 0.005) * 0.35


def tick(d=0.05, hi=True):
    t = tt(d); s = rng.standard_normal(len(t)) * np.exp(-t * 120)
    return bp(s, 3000, 9000) * 0.25 if hi else bp(s, 800, 2500) * 0.4


def timp(n=38, d=1.6):
    t = tt(d); f = note_hz(n) * (1 + 0.15 * np.exp(-t * 20))
    s = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 2.5) + rng.standard_normal(len(t)) * np.exp(-t * 40) * 0.3
    return lp(s, 900) * 0.6


def bell(f0=523.0, d=3.0):
    t = tt(d); s = np.zeros_like(t)
    for ratio, amp, dec in [(0.5, 0.5, 0.9), (1, 1, 1.4), (1.183, 0.6, 2.0), (1.506, 0.5, 2.4), (2.0, 0.45, 2.8), (2.514, 0.3, 3.5), (2.662, 0.25, 4), (3.011, 0.2, 5), (4.166, 0.15, 6)]:
        s += amp * np.sin(2 * np.pi * f0 * ratio * t + rng.uniform(0, 6)) * np.exp(-t * dec)
    hit = rng.standard_normal(len(t)) * np.exp(-t * 90) * 0.4
    return (s * 0.22 + bp(hit, 1500, 8000) * 0.5) * np.minimum(1, t / 0.002)


def whoosh(d=0.45, up=True):
    t = tt(d); x = rng.standard_normal(len(t))
    env = np.sin(np.pi * t / d) ** 2
    out = np.zeros_like(x); seg = len(x) // 8
    for k in range(8):  # stepped sweep
        fc = 400 + (k / 7 if up else 1 - k / 7) * 3500
        out[k * seg:(k + 1) * seg] = bp(x, fc * 0.6, fc * 1.4)[k * seg:(k + 1) * seg]
    return out * env * 0.5


def rumble(d=3.0, fc=180):
    t = tt(d); x = lp(rng.standard_normal(len(t)), fc, 4)
    return x * np.minimum(1, t / 0.08) * np.exp(-t * 1.2) * 3.0


def rush(d=2.5):
    t = tt(d); x = bp(rng.standard_normal(len(t)), 150, 2500)
    return x * np.minimum(1, t / 0.6) * np.minimum(1, (d - t) / 0.8) * 0.5


def clank():
    t = tt(0.8); s = sum(np.sin(2 * np.pi * f * t) * np.exp(-t * k) for f, k in [(220, 6), (587, 9), (1312, 12), (2210, 16)])
    return (s * 0.25 + bp(rng.standard_normal(len(t)), 1000, 6000) * np.exp(-t * 50)) * 0.6


# ---------------- score ----------------
D = 50  # D3 midi
bpm = 112; beat = 60 / bpm
# A: court comedy (0 -> decree start), bouncy pizzicato in D major
A_end = shot["decree"]["start"]
prog = [[D, D + 4, D + 7], [D + 5, D + 9, D + 12], [D + 7, D + 11, D + 14], [D, D + 4, D + 7]]
t = 0.0; bar = 0
while t < A_end:
    ch = prog[bar % 4]
    for k in range(8):
        tk = t + k * beat / 2
        if tk >= A_end:
            break
        n = ch[[0, 1, 2, 1, 0, 2, 1, 2][k]] + 12
        add(pluck(n, 0.5), tk, 0.9, pan=-0.35 if k % 2 else 0.35)
        if k % 2 == 1:
            add(tick(), tk, 0.6, pan=0.2)
    add(bass(ch[0] - 12, beat * 1.8), t, 1.0); add(bass(ch[2] - 12, beat * 1.8), t + 2 * beat, 0.8)
    t += 4 * beat; bar += 1
# comedic stings on the laugh/feast beats
for nm in ("laugh", "feast"):
    s0 = shot[nm]["start"]
    for i, n in enumerate([D + 12, D + 16, D + 19, D + 24]):
        add(pluck(n, 0.4, 1.5), s0 + i * 0.06, 0.9)

# B: exile, D minor, slow and sad (decree -> night)
B0, B_end = A_end, shot["night"]["start"]
progB = [[D, D + 3, D + 7], [D - 2, D + 2, D + 5], [D - 7, D - 3, D], [D - 5, D - 1, D + 2]]
t = B0; i = 0
while t < B_end:
    d = min(1.75, B_end - t)
    add(pad([n + 12 for n in progB[i % 4]], d + 0.4, 0.4, 0.5), t, 1.0)
    for k, off in enumerate([0, 0.44, 0.88, 1.31]):
        if t + off < B_end:
            add(pluck(progB[i % 4][k % 3] + 24, 0.9, 0.7), t + off, 0.6, pan=0.3 * (-1) ** k)
    add(bass(progB[i % 4][0] - 12, 1.6), t, 0.9)
    t += 1.75; i += 1

# C: night / crisis (night -> inside), drone + pulsing ostinato, crescendo
C0, C_end = B_end, shot["inside"]["start"]
add(pad([D - 12, D - 5], C_end - C0 + 0.5, 1.0, 0.6, bright=6), C0, 1.4)
t = C0; k = 0
while t < C_end:
    prog_ = (t - C0) / (C_end - C0)
    n = [D, D, D + 3, D, D + 5, D, D + 3, D + 1][k % 8] + 12
    add(pluck(n, 0.18, 2.0), t, 0.35 + 0.5 * prog_, pan=0.25 * (-1) ** k)
    t += beat / 2 * 0.85; k += 1
for nm in ("night", "gate", "guard"):
    add(timp(D - 12), shot[nm]["start"], 1.0)
add(timp(D - 14, 2.5), shot["flood"]["start"], 1.6)
add(rumble(3.0, 120), shot["flood"]["start"], 0.7)

# D: mechanism (inside), clock ticks + rising arpeggio
D0, D_end = C_end, shot["finale"]["start"]
t = D0; k = 0
while t < D_end:
    add(tick(0.04, hi=(k % 2 == 0)), t, 0.7, pan=-0.2 if k % 2 else 0.2)
    if k % 2 == 0:
        step = int((t - D0) / (D_end - D0) * 7)
        n = [D, D + 2, D + 3, D + 5, D + 7, D + 9, D + 10, D + 12][(k // 2) % 4 + step % 4] + 12
        add(pluck(n, 0.35, 1.2), t, 0.6)
    t += beat / 2; k += 1
add(pad([D, D + 7, D + 12], D_end - D0, 1.5, 0.4), D0, 0.7)

# E: finale swell -> resolve in D major
E0 = D_end
add(pad([D - 12, D, D + 4, D + 7, D + 12], DUR - E0 + 0.3, 2.0, 1.6, bright=5), E0, 1.5)
for i, n in enumerate([D + 12, D + 16, D + 19, D + 24, D + 28]):
    add(pluck(n, 1.4, 0.7), word("finale", "And") + i * 0.32, 0.6)
add(timp(D - 12, 3.0), DUR - 2.2, 1.2)

# ---------------- SFX ----------------
for i, s in enumerate(tl["shots"][1:]):
    add(whoosh(0.42, i % 2 == 0), s["start"] - 0.2, 0.55, pan=0.5 * (-1) ** i)
add(bell(), word("ring1", "rang"), 0.9)
tr = word("night", "rang.")
k = 0; t = tr
while t < shot["gate"]["start"] + 0.6:
    add(bell(523 * (1 + 0.002 * (k % 3))), t, 0.75 * (0.6 if t > shot["night"]["end"] else 1), pan=0.2)
    t += 0.34; k += 1
wy = word("inside", "yanked") + 0.15
t = wy
while t < shot["inside"]["end"]:
    add(bell(523), t, 0.55); t += 0.3
add(bell(523, 4.0), word("finale", "ring"), 0.7)
t = word("finale", "And") + 0.4
while t < DUR - 0.5:
    add(bell(523, 3.0), t, 0.35); t += 1.4
add(clank(), shot["gate"]["lines"][-1]["start"] - 0.1, 0.6)
add(rush(3.5), shot["flood"]["start"] - 0.1, 0.9)
add(rush(3.0), word("inside", "flood"), 0.5)
add(rumble(4.0, 90), shot["finale"]["start"] + 0.4, 0.8)
add(rumble(3.0, 110), shot["finale"]["start"] + 2.6, 0.5)

music = np.stack([L, Rr], 1)
music /= np.max(np.abs(music)) + 1e-9

# ---------------- duck + mix ----------------
voice, vsr = sf.read(B / "voice.wav")
from scipy.signal import resample_poly
voice = resample_poly(voice, SR, vsr)
v = np.zeros(N); v[: len(voice)] = voice[:N]
env = np.sqrt(np.maximum(lp(v ** 2, 8), 0))
env = env / (env.max() + 1e-9)
duck = 1 - 0.55 * np.clip(env * 6, 0, 1)
duck = lp(duck, 3)
mix = music * 0.32 * duck[:, None] + v[:, None] * 0.95
# gentle compression
peak = np.abs(mix).max(); mix = np.tanh(mix / peak * 1.6) / np.tanh(1.6)
mix = mix[: int(DUR * SR)]
fade = int(1.0 * SR); mix[-fade:] *= np.linspace(1, 0, fade)[:, None]
sf.write(B / "mix_raw.wav", mix.astype(np.float32), SR)
print("wrote mix_raw.wav", mix.shape, DUR)

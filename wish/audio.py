"""Mix narration + the user's track (Temporex - Numbers) + SFX for The Wish.

Needs: build/voice.wav, build/timeline.json, build/numbers.wav, build/segs.json
Output: build/mix_raw.wav (48 kHz stereo); master with ffmpeg loudnorm (see README).
"""
import json
from pathlib import Path
import numpy as np
import soundfile as sf
from scipy.signal import butter, lfilter, resample_poly

ROOT = Path(__file__).parent; B = ROOT / "build"
SR = 48000
tl = json.loads((B / "timeline.json").read_text())
DUR = tl["duration"]; N = int(DUR * SR)
shot = {s["name"]: s for s in tl["shots"]}
rng = np.random.default_rng(7)


def load(name):
    x, sr = sf.read(B / name, always_2d=True)
    if sr != SR:
        x = resample_poly(x, SR, sr, axis=0)
    if x.shape[1] == 1:
        x = np.repeat(x, 2, 1)
    out = np.zeros((N, 2)); out[: min(N, len(x))] = x[:N]
    return out


def bp(x, lo, hi):
    b, a = butter(2, [lo / (SR / 2), hi / (SR / 2)], btype="band"); return lfilter(b, a, x)


def lp(x, fc, order=2):
    b, a = butter(order, fc / (SR / 2)); return lfilter(b, a, x)


def tt(d):
    return np.arange(int(d * SR)) / SR


sfx = np.zeros((N, 2))


def add(sig, t, gain=1.0, pan=0.0):
    i = int(t * SR)
    if i >= N or i < 0:
        return
    sig = sig[: N - i]; l = np.cos((pan + 1) * np.pi / 4) * 1.414; r = np.sin((pan + 1) * np.pi / 4) * 1.414
    sfx[i:i + len(sig), 0] += sig * gain * l; sfx[i:i + len(sig), 1] += sig * gain * r


def whoosh(d=0.35):
    t = tt(d); x = lp(rng.standard_normal(len(t)), 2500)
    return bp(x, 300, 3000) * np.sin(np.pi * t / d) ** 3 * 0.35


def rumble(d=3.0, fc=110):
    t = tt(d); return lp(rng.standard_normal(len(t)), fc, 4) * np.minimum(1, t / 0.08) * np.exp(-t * 1.1) * 2.5


def rush(d=3.0):
    t = tt(d); return bp(rng.standard_normal(len(t)), 150, 2200) * np.minimum(1, t / 0.6) * np.minimum(1, (d - t) / 0.9) * 0.4


def clank():
    t = tt(0.9); s = sum(np.sin(2 * np.pi * f * t) * np.exp(-t * k) for f, k in [(196, 5), (523, 8), (1187, 11), (2093, 15)])
    return (s * 0.2 + bp(rng.standard_normal(len(t)), 1000, 6000) * np.exp(-t * 60) * 0.5) * 0.7


def tok(f=900):  # wooden hammer tap
    t = tt(0.25); return (np.sin(2 * np.pi * f * t) * np.exp(-t * 40) + bp(rng.standard_normal(len(t)), 600, 4000) * np.exp(-t * 90) * 0.8) * 0.8


def thud(f=70):  # crate hitting the ground
    t = tt(0.5); return (np.sin(2 * np.pi * f * t * (1 - 0.3 * t)) * np.exp(-t * 14) + lp(rng.standard_normal(len(t)), 900) * np.exp(-t * 30) * 0.9) * 0.9


def roll(d=1.2, rate=9.0, fc=180):  # wooden wheel on stone: low rumble + a click per spoke
    t = tt(d); r = lp(rng.standard_normal(len(t)), fc, 4) * 2.0
    clicks = np.zeros(len(t)); step = int(SR / rate)
    for i in range(0, len(t) - 400, step):
        clicks[i:i + 400] += np.exp(-np.arange(400) / 60) * bp(rng.standard_normal(400), 800, 3000)
    env = np.minimum(1, t / 0.1) * np.minimum(1, (d - t) / 0.2)
    return (r + clicks * 0.5) * env * 0.6


def shatter(d=1.4):  # window glass: a crack, then many tinkles
    t = tt(d); x = bp(rng.standard_normal(len(t)), 2500, 12000) * np.exp(-t * 7) * 1.2
    for _ in range(40):
        i = int(rng.uniform(0.02, d - 0.2) * SR); f = rng.uniform(2500, 7000); k = tt(0.12)
        x[i:i + len(k)] += np.sin(2 * np.pi * f * k) * np.exp(-k * 45) * rng.uniform(0.15, 0.4) * np.exp(-i / SR * 2.5)
    return x


def jingle():  # bag of gold landing
    t = tt(0.5); x = thud(120) * 0.5
    for j in range(8):
        f = rng.uniform(3000, 6500); o = int(rng.uniform(0, 0.12) * SR); k = tt(0.3)
        x[o:o + len(k)] += np.sin(2 * np.pi * f * k) * np.exp(-k * 25) * 0.25
    return x


def tink():  # teacup on saucer
    t = tt(0.6); return sum(np.sin(2 * np.pi * f * t) * np.exp(-t * k) for f, k in [(2637, 9), (4100, 14), (5900, 20)]) * 0.3


def whistle(d=0.7):  # steam from the boss's ears
    t = tt(d); return (bp(rng.standard_normal(len(t)), 2500, 5000) * 0.6 + np.sin(2 * np.pi * (1900 + 400 * t / d) * t) * 0.15) * np.minimum(1, t / 0.05) * np.exp(-t * 2.5)


def crowd(d):  # angry murmur: band noise with a slow, rough amplitude
    t = tt(d); am = 0.6 + 0.4 * lp(rng.standard_normal(len(t)), 6) * 8
    return bp(rng.standard_normal(len(t)), 250, 1400) * np.clip(am, 0.2, 1.4) * np.minimum(1, t / 0.5) * np.minimum(1, (d - t) / 0.3) * 0.5


def boom():  # poster stamp / hook hit
    t = tt(1.2); return np.sin(2 * np.pi * 48 * t) * np.exp(-t * 4) * 1.1 + lp(rng.standard_normal(len(t)), 300) * np.exp(-t * 18) * 0.6


def crackle(d):
    t = tt(d); x = lp(rng.standard_normal(len(t)), 600) * 0.4
    for _ in range(int(d * 40)):
        k = int(rng.uniform(0, d - 0.02) * SR); x[k:k + 300] += bp(rng.standard_normal(300), 1500, 7000) * np.exp(-np.arange(300) / 40) * rng.uniform(0.3, 1.0)
    return x * np.minimum(1, t / 0.15) * np.minimum(1, (d - t) / 0.3) * 0.7


def click():
    t = tt(0.06); return bp(rng.standard_normal(len(t)), 2000, 8000) * np.exp(-t * 120) * 1.2


def scratch(d=0.35):
    t = tt(d); return bp(rng.standard_normal(len(t)), 2500, 7000) * (0.5 + 0.5 * np.sin(2 * np.pi * 14 * t) ** 2) * np.minimum(1, (d - t) / 0.05) * 0.35


def beep(f=1046, d=0.12):
    t = tt(d); return np.sin(2 * np.pi * f * t) * np.minimum(1, (d - t) / 0.02) * 0.35


def splash():
    t = tt(0.6); return bp(rng.standard_normal(len(t)), 400, 5000) * np.exp(-t * 8) * 0.8


def impact():
    t = tt(1.8); return np.sin(2 * np.pi * 38 * t * (1 - 0.15 * t)) * np.exp(-t * 2.2) * 1.4 + lp(rng.standard_normal(len(t)), 250) * np.exp(-t * 10) * 0.8


def bark(f0=620, d=0.17, big=1.0):  # a dog bark: falling voiced burst + breath noise
    t = tt(d); f = f0 * (1.15 - 0.45 * t / d); ph = 2 * np.pi * np.cumsum(f) / SR
    v = sum(np.sin(k * ph) / k for k in range(1, 7)); env = np.minimum(1, t / 0.008) * np.exp(-t * 14 / big)
    return (bp(v, 300, 3500) * 0.9 + bp(rng.standard_normal(len(t)), 800, 4000) * 0.25) * env * big


def skate_roll(d):  # urethane wheels on asphalt: rumble + seam clacks
    t = tt(d); r = bp(rng.standard_normal(len(t)), 80, 900) * 1.4; x = r.copy(); step = int(SR * 0.42)
    for i in range(int(0.2 * SR), len(t) - 900, step): x[i:i + 900] += bp(rng.standard_normal(900), 300, 2500) * np.exp(-np.arange(900) / 150) * 1.5
    return x * np.minimum(1, t / 0.3) * np.minimum(1, (d - t) / 0.4) * 0.5


def grind(d=0.9):
    t = tt(d); return (bp(rng.standard_normal(len(t)), 1500, 6000) * (0.7 + 0.3 * np.sin(2 * np.pi * 23 * t)) + np.sin(2 * np.pi * 2900 * t) * 0.08) * np.minimum(1, t / 0.03) * np.minimum(1, (d - t) / 0.1) * 0.5


def horn(d=0.8):
    t = tt(d); x = np.sign(np.sin(2 * np.pi * 311 * t)) * 0.5 + np.sign(np.sin(2 * np.pi * 392 * t)) * 0.5
    return lp(x, 2500) * np.minimum(1, t / 0.02) * np.minimum(1, (d - t) / 0.05) * 0.45


def screech(d=1.1):
    t = tt(d); return (bp(rng.standard_normal(len(t)), 1200, 4500) * 0.7 + np.sin(2 * np.pi * (2300 + 200 * np.sin(2 * np.pi * 7 * t)) * t) * 0.35) * np.minimum(1, t / 0.05) * np.minimum(1, (d - t) / 0.3) * 0.6


def wind(d):
    t = tt(d); am = 0.6 + 0.4 * np.sin(2 * np.pi * 0.17 * t + 1) * np.sin(2 * np.pi * 0.29 * t)
    return bp(rng.standard_normal(len(t)), 150, 900) * am * np.minimum(1, t / 1.0) * np.minimum(1, (d - t) / 0.6) * 0.8


def crickets(d):
    t = tt(d); x = np.zeros(len(t))
    for c in range(3):
        f = 4300 + c * 450; per = 0.9 + c * 0.23; o = c * 0.31
        g = ((t + o) % per < 0.18) * (np.sin(2 * np.pi * 32 * t) > 0)
        x += np.sin(2 * np.pi * f * t) * g * 0.08
    return lp(x, 7000) * np.minimum(1, t / 0.5) * np.minimum(1, (d - t) / 0.5)


W = {}
for ln in tl["lines"]:
    for x in ln["words"]:
        W.setdefault((ln["shot"], x["w"].lower()), []).append(x["start"])
w = lambda shot, word, n=1: W[(shot, word.lower())][n - 1]
st = lambda name: shot[name]["start"]; en = lambda name: shot[name]["end"]

segs = json.loads((B / "segs.json").read_text())
for i, sg in enumerate(segs[1:]):
    if sg[4] in ("zoom", "whip"): add(whoosh(0.35), sg[2] - 0.17, 0.45, pan=0.5 * (-1) ** i)
    if sg[4] == "flash": add(whoosh(0.5), sg[2] - 0.2, 0.35)
# skating
add(skate_roll(en("road") - st("skate") + 0.2), st("skate"), 0.8, -0.2)
tk = w("tricks", "kickflips."); add(click(), tk, 1.0); add(whoosh(0.3), tk, 0.4); add(click(), tk + 0.6, 0.9)
add(grind(0.9), w("tricks", "grinds.") + 0.05, 0.9, -0.3)
tm = w("tricks", "mum"); add(whoosh(0.6), tm, 0.5); add(thud(160), w("tricks", "doing.") + 0.45, 0.8)
# the truck
ts = w("road", "swerved."); add(horn(0.9), ts - 0.55, 1.0, 0.2); add(screech(1.0), ts - 0.1, 0.9, 0.3); add(rumble(1.6, 90), w("road", "truck") - 0.3, 0.8)
add(impact(), st("late") - 0.03, 1.0)                                                # the crash, under the white flash
# the dog
for x in ["would", "not.", "stop.", "barking."]: add(bark(600, 0.18, 1.0), w("bark", x), 1.0, 0.35)
for x in [0.15, 0.7, 1.25, 1.8]: add(bark(640, 0.15, 0.8), st("drag") + x, 0.8, 0.3)
tb, l1, l2 = w("louder", "barking"), w("louder", "louder."), w("louder", "louder.", 2)
for i, x in enumerate([tb, tb + 0.35, l1, l1 + 0.3, l2, l2 + 0.25, l2 + 0.5]): add(bark(580, 0.2, 1.0 + i * 0.12), x, 0.9 + i * 0.12, 0.2)
for x in [0.1, 0.45, 0.85, 1.3, 1.75, 2.3]: add(bark(700, 0.13, 0.8), st("dog") + x, 0.85, 0.2)     # happy barks
# night ambience, ghost wind, reveal hits
add(crickets(en("louder") - st("night")), st("night"), 0.9); add(crickets(en("back") - st("cem")), st("cem"), 0.9)
add(wind(en("pick") - st("gtown") + 0.5), st("gtown"), 0.9)
add(impact(), w("name", "mine."), 1.1); add(impact(), w("flash", "me."), 1.1); add(horn(0.5), w("flash", "truck") - 0.2, 0.7)
voice = load("voice.wav")
# MUSIC (brief): "Numbers" by Temporex, supplied by the user. Starts right after the "huss", runs under the narration
# ducked, dips at "too late", at the grave reveal and at "A ghost town", cuts out just before "They didn't pick me".
_trk, _sr = sf.read(B / "numbers.wav", always_2d=True)
m0, m1 = st("turn") - 0.05, st("pick") - 0.06
music = np.zeros((N, 2)); i0 = int(m0 * SR); n = min(int((m1 - m0) * SR), len(_trk), N - i0); music[i0:i0 + n] = _trk[:n]
f_in, f_out = int(0.03 * SR), int(0.12 * SR); music[i0:i0 + f_in] *= np.linspace(0, 1, f_in)[:, None]; music[i0 + n - f_out:i0 + n] *= np.linspace(1, 0, f_out)[:, None]
music /= np.abs(music).max() + 1e-9

v = voice.mean(1)
env = np.sqrt(np.maximum(lp(v ** 2, 6), 0)); env /= env.max() + 1e-9
duck = lp(1 - 0.55 * np.clip(env * 5, 0, 1), 2.5)[:, None]
mute = np.ones(N)
def dip(t0, t1, level, fade=0.4):
    i0, i1 = int(t0 * SR), int(t1 * SR); f = int(fade * SR); mute[i0:i1] = np.minimum(mute[i0:i1], level)
    mute[max(0, i0 - f):i0] = np.minimum(mute[max(0, i0 - f):i0], np.linspace(1, level, i0 - max(0, i0 - f))); mute[i1:i1 + f] = np.minimum(mute[i1:i1 + f], np.linspace(level, 1, len(mute[i1:i1 + f])))
dip(st("late"), en("late"), 0.25, 0.2)
dip(w("name", "mine.") - 0.05, en("back"), 0.25, 0.25)
dip(st("ghost"), en("ghost"), 0.35, 0.3)
mute = mute[:, None]
mix = voice * 1.0 + music * 0.55 * duck * mute + sfx * 0.4
mix /= np.abs(mix).max() / 0.89
fade = int(1.0 * SR); mix[-fade:] *= np.linspace(1, 0, fade)[:, None]
sf.write(B / "mix_raw.wav", mix.astype(np.float32), SR)
print("wrote mix_raw.wav", round(DUR, 2), "s")

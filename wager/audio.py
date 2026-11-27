"""Mix narration + orchestral score + bells + SFX.

Needs: build/voice.wav, build/timeline.json, build/music.wav + build/bells.wav (from score.py)
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


W = {}
for ln in tl["lines"]:
    for x in ln["words"]:
        W.setdefault((ln["shot"], x["w"].lower()), []).append(x["start"])
w = lambda shot, word, n=1: W[(shot, word.lower())][n - 1]

segs = json.loads((B / "segs.json").read_text())
for i, sg in enumerate(segs[1:]):
    if sg[4] in ("zoom", "whip"): add(whoosh(0.35), sg[2] - 0.17, 0.45, pan=0.5 * (-1) ** i)
    if sg[4] == "flash": add(whoosh(0.5), sg[2] - 0.2, 0.35)
add(tink(), w("wager", "burger"), 0.8)                                          # chalk ding on the title
for wd_ in ("nothing.", "rewards.", "punishment.", "effort."): add(scratch(), w("wager", wd_) - 0.3, 0.6)
add(scratch(0.6), w("wager", "if") - 0.1, 0.5); add(scratch(0.5), w("wager", "heaven,") - 0.2, 0.5); add(scratch(0.3), w("wager", "math") - 0.1, 0.6)
tf, tz = w("doubt", "flip"), w("doubt", "prize.")
for x in [tf, tf + 0.35, tf + 0.7, tf + 1.05, tf + 1.4, tz - 0.3, tz + 0.05]: add(click(), x, 0.9, 0.3)
add(splash(), w("world", "baptized") + 0.15, 0.6)
add(crackle(2.4), w("family", "literally.") - 0.05, 0.9)                       # "they're gonna roast you"
hs = shot["death"]["start"]; td = w("death", "died.")
th = w("death", "then,") - 0.2; k = th
while k < td - 0.1: add(beep(), k, 0.6, 0.4); k += 1 / 1.2
add(beep(1046, 1.4), td + 0.05, 0.6, 0.4)                                      # flatline
add(crackle(shot["god"]["start"] - w("white", "being") + 0.5), w("white", "being") - 0.2, 0.45)
add(impact(), w("god", "left"), 0.9)
add(impact(), w("burn", "burned."), 1.0); add(crackle(0.8), w("burn", "burned."), 0.8)
add(crackle(shot["hell"]["dur"] + 1), shot["hell"]["start"], 0.55)
voice = load("voice.wav"); music = load("music.wav"); bells = load("bells.wav")
for x in (music, bells):
    x /= np.abs(x).max() + 1e-9

# sidechain duck: music dips ~7 dB while the narrator speaks
v = voice.mean(1)
env = np.sqrt(np.maximum(lp(v ** 2, 6), 0)); env /= env.max() + 1e-9
duck = lp(1 - 0.55 * np.clip(env * 5, 0, 1), 2.5)[:, None]
mute = np.ones(N)
def dip(t0, t1, level, fade=0.4):
    i0, i1 = int(t0 * SR), int(t1 * SR); f = int(fade * SR); mute[i0:i1] = np.minimum(mute[i0:i1], level)
    mute[max(0, i0 - f):i0] = np.minimum(mute[max(0, i0 - f):i0], np.linspace(1, level, i0 - max(0, i0 - f))); mute[i1:i1 + f] = np.minimum(mute[i1:i1 + f], np.linspace(level, 1, len(mute[i1:i1 + f])))
dip(w("death", "died."), shot["white"]["start"] + 0.3, 0.0, 0.25)
dip(shot["god"]["start"], shot["infinite"]["start"], 0.45)
mute = mute[:, None]
mix = voice * 1.0 + music * 0.55 * duck * mute + bells * 0.4 + sfx * 0.4 / 0.35 * 0.35
mix /= np.abs(mix).max() / 0.89
fade = int(1.2 * SR); mix[-fade:] *= np.linspace(1, 0, fade)[:, None]
sf.write(B / "mix_raw.wav", mix.astype(np.float32), SR)
print("wrote mix_raw.wav", round(DUR, 2), "s")

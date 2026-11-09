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


W = {}
for ln in tl["lines"]:
    for x in ln["words"]:
        W.setdefault((ln["shot"], x["w"].lower()), []).append(x["start"])
w = lambda shot, word, n=1: W[(shot, word.lower())][n - 1]

# whoosh only on real camera transitions: zooms between scenes and the two whips (glides are silent)
segs = json.loads((B / "segs.json").read_text())
for i, sg in enumerate(segs[1:]):
    if len(sg) > 4 and sg[4] in ("zoom", "whip"): add(whoosh(0.35 if sg[4] == "zoom" else 0.3), sg[2] - 0.17, 0.55 if sg[4] == "whip" else 0.4, pan=0.5 * (-1) ** i)
    if len(sg) > 4 and sg[4] == "cut": add(boom(), sg[2], 0.35)
add(boom(), 0.0, 0.5)                                                      # hook
for wd in ("groceries.", "sofa.", "piano.", "grandpa."): add(thud(90), w("street", wd), 0.35)   # each carried thing lands on screen
s0 = shot["shed"]["start"]; tt_ = w("shed", "tried")
for n in range(int(s0 * 3.2), int(tt_ * 3.2) + 1):                         # hammer hits: ph=(t*3.2)%1 == 0.2
    th = (n + 0.2) / 3.2
    if s0 <= th < tt_ - 0.3: add(tok(), th, 0.7, 0.2)
add(thud(80), w("shed", "roll.") + 0.05, 0.8)                               # the square tips over flat
add(roll(0.5, 6), w("shed", "hurt.") - 0.55, 0.6); add(thud(110), w("shed", "hurt.") - 0.05, 0.9)   # triangle rolls onto his foot
to = w("shed", "round."); add(roll(1.5, 6), to - 0.2, 0.8)                   # the first wheel rolls at us
c0 = shot["cart"]["start"]; add(roll(shot["cart"]["end"] - c0, 7, 140), c0, 0.35, -0.2)
tbf = w("cart", "breakfast.")
for i in range(5): add(thud(60 + 8 * i), tbf + 0.35 + i * 0.05, 0.75, pan=-0.6 + 0.3 * i)  # crates hit the ground
g0 = shot["guild"]["start"]; add(crowd(shot["chase"]["start"] - g0), g0, 0.45)
for wd in ("Pianos", "Grandpas"): add(crowd(0.8), w("guild", wd) + 0.1, 0.6)   # gasps
add(whistle(1.0), w("guild", "red."), 0.7, 0.1)
add(boom(), w("bounty", "price"), 0.55)
ch0 = shot["chase"]["start"]; tr = w("chase", "rolled.")
add(crowd(tr - ch0 + 0.5), ch0, 0.6)                                         # porters closing in
add(roll(shot["crash"]["start"] - tr, 14, 220), tr, 0.7); add(rush(shot["crash"]["start"] - tr), tr, 0.7)
add(thud(70), w("hill", "dove.") + 0.1, 0.8)
add(whoosh(0.6), w("hill", "sofa.") - 0.2, 0.6); add(thud(55), w("hill", "sofa.") + 0.7, 1.0)   # thrown sofa lands short
tw = w("crash", "window."); add(shatter(), tw, 1.0); add(thud(45), tw, 1.0); add(roll(0.5, 16, 200), tw - 0.25, 0.6)
tg = w("twist", "gold."); add(whoosh(0.4), tg - 0.45, 0.5); add(jingle(), tg - 0.05, 0.8, 0.3)
add(tink(), w("twist", "table."), 0.6)
voice = load("voice.wav"); music = load("music.wav"); bells = load("bells.wav")
for x in (music, bells):
    x /= np.abs(x).max() + 1e-9

# sidechain duck: music dips ~7 dB while the narrator speaks
v = voice.mean(1)
env = np.sqrt(np.maximum(lp(v ** 2, 6), 0)); env /= env.max() + 1e-9
duck = lp(1 - 0.55 * np.clip(env * 5, 0, 1), 2.5)[:, None]
mute = np.ones((N, 1))
mix = voice * 1.0 + music * 0.42 * duck * mute + bells * 0.45 + sfx
mix /= np.abs(mix).max() / 0.89
fade = int(1.2 * SR); mix[-fade:] *= np.linspace(1, 0, fade)[:, None]
sf.write(B / "mix_raw.wav", mix.astype(np.float32), SR)
print("wrote mix_raw.wav", round(DUR, 2), "s")

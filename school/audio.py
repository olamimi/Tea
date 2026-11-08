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


# soft whoosh on cuts between lines (hard cuts, so keep it subtle)
for i, s in enumerate(tl["shots"][1:]):
    add(whoosh(), s["start"] - 0.17, 0.35, pan=0.4 * (-1) ** i)
def cricket(d=2.5):
    t = tt(d); s = np.zeros_like(t)
    for k in range(int(d / 0.42)):
        t0 = k * 0.42; m = (t >= t0) & (t < t0 + 0.12)
        s[m] += np.sin(2 * np.pi * 4300 * t[m]) * (np.sin(2 * np.pi * 55 * t[m]) > 0) * 0.25
    return s
sil = shot["silence"]
add(cricket(min(3.0, sil["end"] - sil["start"])), sil["start"] + 0.6, 0.35, pan=0.3)
voice = load("voice.wav"); music = load("music.wav"); bells = load("bells.wav")
for x in (music, bells):
    x /= np.abs(x).max() + 1e-9

# sidechain duck: music dips ~7 dB while the narrator speaks
v = voice.mean(1)
env = np.sqrt(np.maximum(lp(v ** 2, 6), 0)); env /= env.max() + 1e-9
duck = lp(1 - 0.55 * np.clip(env * 5, 0, 1), 2.5)[:, None]
mute = np.ones((N, 1)); a0, a1 = int(sil['start'] * SR), int(min(sil['end'], DUR) * SR); mute[a0:a1] = 0.08
mute = lp(mute[:, 0], 4)[:, None]
mix = voice * 1.0 + music * 0.42 * duck * mute + bells * 0.45 + sfx
mix /= np.abs(mix).max() / 0.89
fade = int(1.2 * SR); mix[-fade:] *= np.linspace(1, 0, fade)[:, None]
sf.write(B / "mix_raw.wav", mix.astype(np.float32), SR)
print("wrote mix_raw.wav", round(DUR, 2), "s")

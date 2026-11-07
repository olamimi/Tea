"""Generate narration with Kokoro TTS and a timeline (line + word timings).

Usage: python3 tts.py <models_dir>
Outputs: build/voice.wav, build/timeline.json
"""
import json, re, sys
from pathlib import Path
import numpy as np
import soundfile as sf
from kokoro_onnx import Kokoro

ROOT = Path(__file__).parent
BUILD = ROOT / "build"; BUILD.mkdir(exist_ok=True)
models = Path(sys.argv[1])
story = json.loads((ROOT / "story.json").read_text())
k = Kokoro(str(models / "kokoro-v1.0.onnx"), str(models / "voices-v1.0.bin"))

SR = 24000
LEAD_IN = 0.15
GAP = 0.12          # pause between lines (fast, reel-style pacing)
SHOT_GAP = 0.18     # slightly longer pause when the shot changes


def trim(a, thresh=0.01):
    idx = np.where(np.abs(a) > thresh)[0]
    if len(idx) == 0:
        return a
    return a[max(0, idx[0] - 240): idx[-1] + 480]


def syllables(word):
    w = re.sub(r"[^a-z]", "", word.lower())
    if not w:
        return 1
    n = len(re.findall(r"[aeiouy]+", w))
    if w.endswith("e") and n > 1 and not w.endswith("le"):
        n -= 1
    return max(1, n)


chunks = [np.zeros(int(LEAD_IN * SR), dtype=np.float32)]
t = LEAD_IN
lines = []
for i, ln in enumerate(story["lines"]):
    audio, sr = k.create(ln["text"], voice=ln.get("voice", story["voice"]),
                         speed=ln.get("speed", story["speed"]), lang="en-us")
    assert sr == SR
    audio = trim(audio.astype(np.float32))
    dur = len(audio) / SR
    words = ln["text"].split()
    # Distribute word timings by syllable weight, with extra weight on punctuation pauses.
    weights = [syllables(w) + (0.8 if re.search(r"[.,!?:]$", w) else 0) for w in words]
    total = sum(weights)
    wt, acc = [], t
    for w, wgt in zip(words, weights):
        d = dur * wgt / total
        wt.append({"w": w, "start": round(acc, 3), "end": round(acc + d, 3)})
        acc += d
    lines.append({"shot": ln["shot"], "text": ln["text"], "start": round(t, 3),
                  "end": round(t + dur, 3), "words": wt})
    chunks.append(audio)
    t += dur
    nxt = story["lines"][i + 1]["shot"] if i + 1 < len(story["lines"]) else None
    gap = SHOT_GAP if nxt != ln["shot"] else GAP
    chunks.append(np.zeros(int(gap * SR), dtype=np.float32))
    t += gap

tail = 1.2
chunks.append(np.zeros(int(tail * SR), dtype=np.float32))
voice = np.concatenate(chunks)
sf.write(BUILD / "voice.wav", voice, SR)

# Merge consecutive lines into shots.
shots = []
for ln in lines:
    if shots and shots[-1]["name"] == ln["shot"]:
        shots[-1]["lines"].append(ln)
    else:
        shots.append({"name": ln["shot"], "lines": [ln]})
for i, s in enumerate(shots):
    s["start"] = 0.0 if i == 0 else round(s["lines"][0]["start"] - 0.08, 3)
for i, s in enumerate(shots):
    s["end"] = shots[i + 1]["start"] if i + 1 < len(shots) else round(len(voice) / SR, 3)
    s["dur"] = round(s["end"] - s["start"], 3)

json.dump({"duration": round(len(voice) / SR, 3), "shots": shots, "lines": lines},
          open(BUILD / "timeline.json", "w"), indent=1)
for s in shots:
    print(f"{s['name']:8s} {s['start']:6.2f} -> {s['end']:6.2f}  ({s['dur']:.2f}s)")
print("total", round(len(voice) / SR, 2))

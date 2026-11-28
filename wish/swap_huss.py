"""Replace the synthetic "Huss... huss... huss..." with the real trend sound.
Usage: python3 swap_huss.py <trend.mp3>   (the user's upload; kept out of git as refs/huss.mp3)
Cuts the first triple (0.00-0.68 s) of the clip, drops it into the huss slot of build/voice.wav
and moves the three huss word times in build/timeline.json onto the bursts. Run after post.py."""
import json, subprocess, sys
from pathlib import Path
import numpy as np, soundfile as sf

B = Path(__file__).parent / "build"
CLIP0, CLIP1, LEAD, PEAK = 0.00, 0.68, 0.04, 0.6
BURSTS = [(0.04, 0.17), (0.27, 0.37), (0.46, 0.55)]  # burst times inside the clip

src = sys.argv[1] if len(sys.argv) > 1 else str(Path(__file__).parent / "refs/huss.mp3")
v, SR = sf.read(B / "voice.wav", dtype="float32")
raw = subprocess.run(["ffmpeg", "-v", "error", "-i", src, "-ac", "1", "-ar", str(SR), "-f", "f32le", "-"], capture_output=True, check=True).stdout
clip = np.frombuffer(raw, np.float32)[int(CLIP0 * SR):int(CLIP1 * SR)].copy()
fo = int(0.03 * SR); clip[-fo:] *= np.linspace(1, 0, fo)
clip = clip / (np.abs(clip).max() + 1e-9) * PEAK

tl = json.loads((B / "timeline.json").read_text())
ln = next(l for l in tl["lines"] if l["speaker"] == "huss")
s, e = int(ln["start"] * SR), int(ln["end"] * SR)
t0 = ln["start"] + LEAD; i0 = int(t0 * SR)
assert i0 + len(clip) <= e, "clip longer than the huss slot"
v[s:e] = 0; v[i0:i0 + len(clip)] = clip
sf.write(B / "voice.wav", v, SR)

for k, (w, (b0, b1)) in enumerate(zip(ln["words"], BURSTS)):
    w["start"] = round(t0 + b0, 3)
    w["end"] = round(ln["end"] if k == 2 else t0 + BURSTS[k + 1][0], 3)
for sh in tl["shots"]:  # shots carry their own copies of the lines
    sh["lines"] = [ln if l["speaker"] == "huss" else l for l in sh["lines"]]
(B / "timeline.json").write_text(json.dumps(tl, indent=1))
print("huss swapped at", round(t0, 3), [(w["start"], w["end"]) for w in ln["words"]])

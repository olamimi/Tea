"""Re-take one narrator line without moving the rest of the timeline (Chatterbox venv).
Usage: python redo_line.py <line> "<text variant>" ["<variant>" ...] [--seeds N]
Writes takes to build/retake/, applies the narrator FX, and for each take prints the Whisper words and the
silence inside the phrase "drive-through" (smaller = said as one word). Pick one with splice_line.py."""
import json, subprocess, sys
from pathlib import Path
import numpy as np, soundfile as sf
import tts_cb_lib as L

ROOT = Path(__file__).parent; OUT = ROOT / "build" / "retake"; OUT.mkdir(parents=True, exist_ok=True)
FX = "atempo=1.1,rubberband=pitch=1.12246"
args = sys.argv[1:]; seeds = 3
if "--seeds" in args: k = args.index("--seeds"); seeds = int(args[k + 1]); del args[k:k + 2]
i, variants = int(args[0]), args[1:]
ln = json.loads((ROOT / "story.json").read_text())["lines"][i]


def gap_inside(a, sr, t0, t1):
    """longest run below -35 dB (10 ms frames) between t0 and t1"""
    h = int(sr * 0.01); seg = a[int(t0 * sr):int(t1 * sr)]
    db = [20 * np.log10(np.sqrt((seg[j:j + h] ** 2).mean()) + 1e-9) for j in range(0, len(seg) - h, h)]
    best = run = 0
    for d in db: run = run + 1 if d < -35 else 0; best = max(best, run)
    return best * 0.01


for v, text in enumerate(variants):
    for s in range(seeds):
        a = L.generate({**ln, "text": text}, seed=7000 + 100 * v + s)
        raw = OUT / f"{i:02d}_v{v}s{s}_raw.wav"; fx = OUT / f"{i:02d}_v{v}s{s}.wav"
        sf.write(raw, a / (np.abs(a).max() + 1e-9) * 0.85, L.SR)
        subprocess.run(["ffmpeg", "-y", "-v", "error", "-i", str(raw), "-af", FX + f",aresample={L.SR}", "-ac", "1", str(fx)], check=True)
        b, sr = sf.read(fx, dtype="float32"); b = b / (np.abs(b).max() + 1e-9) * 0.8; sf.write(fx, b, sr)
        words = L.transcribe(b); heard = " ".join(w.word.strip() for w in words)
        dw = [w for w in words if "riv" in w.word.lower()]
        tw = [w for w in words if "hr" in w.word.lower() and "church" not in w.word.lower()]
        g = gap_inside(b, sr, dw[0].start + 0.05, (tw[0].end if tw else dw[0].end + 0.4) - 0.05) if dw else -1
        print(f"v{v}s{s} {len(b)/sr:.2f}s match={L.score(ln['text'], words):.2f} drive-through inner silence={g:.2f}s | {heard}", flush=True)

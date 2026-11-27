"""Stage 2 (system python, kokoro_onnx): Mom / Bro / God lines -> build/lines/NN_raw.wav"""
import json, sys
from pathlib import Path
import numpy as np, soundfile as sf
from kokoro_onnx import Kokoro
ROOT = Path(__file__).parent; OUT = ROOT / "build" / "lines"; OUT.mkdir(parents=True, exist_ok=True)
M = Path(sys.argv[1]); k = Kokoro(str(M / "kokoro-v1.0.onnx"), str(M / "voices-v1.0.bin"))
for i, ln in enumerate(json.loads((ROOT / "story.json").read_text())["lines"]):
    if ln["engine"] != "kokoro": continue
    a, sr = k.create(ln["text"], voice=ln["voice"], speed=ln["speed"], lang="en-gb" if ln["voice"].startswith("b") else "en-us")
    sf.write(OUT / f"{i:02d}_raw.wav", a / (np.abs(a).max() + 1e-9) * 0.85, sr); print("kokoro", i, ln["voice"], round(len(a) / sr, 2), "s")

"""Stage 1 (Chatterbox venv): narrator + "huss" lines -> build/lines/NN_raw.wav, best of up to 5 Whisper-checked takes."""
import json
from pathlib import Path
import numpy as np, soundfile as sf
import tts_cb_lib as L
ROOT = Path(__file__).parent; OUT = ROOT / "build" / "lines"; OUT.mkdir(parents=True, exist_ok=True)
story = json.loads((ROOT / "story.json").read_text()); report = {}
for i, ln in enumerate(story["lines"]):
    if ln["engine"] != "cb" or (OUT / f"{i:02d}_raw.wav").exists():
        continue
    if ln["fx"] == "huss":  # the user's real trend clip, used as-is
        import subprocess
        subprocess.run(["ffmpeg", "-y", "-v", "error", "-i", str(ROOT / "refs/huss-huss-huss.mp3"), "-ac", "1", "-ar", str(L.SR), str(OUT / f"{i:02d}_raw.wav")], check=True)
        continue
    best = None
    for take in range(5):
        a = L.generate(ln, seed=1000 * i + take)
        if ln.get("verify", True) is False:
            best = (1.0, a, take); break
        words = L.transcribe(a); sc = L.score(ln.get("say", ln["text"]).replace("Mum", "Mom"), words); cps = len(ln["text"]) / (len(a) / L.SR)
        ok = sc >= 0.92 and 7 <= cps <= 26
        print(f"line {i:2d} take {take}: match={sc:.2f} {len(a)/L.SR:.1f}s {'OK' if ok else 'retry'} | {' '.join(w.word for w in words).strip()[:70]}", flush=True)
        if best is None or sc > best[0]: best = (sc, a, take)
        if ok: break
    sf.write(OUT / f"{i:02d}_raw.wav", best[1] / (np.abs(best[1]).max() + 1e-9) * 0.85, L.SR); report[i] = round(best[0], 3)
print("chatterbox done", report)

"""Drop a re-take (from redo_line.py, already FX'd) into its line's slot in build/voice.wav without moving any
other line, and re-time that line's words in build/timeline.json (Chatterbox venv, for Whisper).
Usage: python splice_line.py <line> <take.wav> [offset_s]   (the take must fit inside the old slot + the pause after it)"""
import json, shutil, sys
from pathlib import Path
import numpy as np, soundfile as sf
import tts_cb_lib as L

ROOT = Path(__file__).parent; B = ROOT / "build"
i, take = int(sys.argv[1]), Path(sys.argv[2]); off = float(sys.argv[3]) if len(sys.argv) > 3 else 0.0
v, SR = sf.read(B / "voice.wav", dtype="float32"); a, sr = sf.read(take, dtype="float32"); assert sr == SR
tl = json.loads((B / "timeline.json").read_text()); ln = tl["lines"][i]
nxt = tl["lines"][i + 1]["start"] if i + 1 < len(tl["lines"]) else tl["duration"]
t0 = ln["start"] + off; t1 = t0 + len(a) / SR
assert t1 <= nxt - 0.12, f"take ends {t1:.2f}s, next line starts {nxt:.2f}s"
v[int(ln["start"] * SR):int(nxt * SR) - int(0.02 * SR)] = 0; v[int(t0 * SR):int(t0 * SR) + len(a)] = a
sf.write(B / "voice.wav", v, SR)

wt = L.word_times(ln["text"], L.transcribe(a), len(a) / SR)
ln.update(start=round(t0, 3), end=round(t1, 3), words=[{"w": w, "start": round(t0 + s, 3), "end": round(t0 + e, 3)} for w, (s, e) in zip(ln["text"].split(), wt)])
for sh in tl["shots"]:
    sh["lines"] = [ln if (l["text"] == ln["text"] and l["shot"] == ln["shot"]) else l for l in sh["lines"]]
(B / "timeline.json").write_text(json.dumps(tl, indent=1))
shutil.copy(take, B / "lines" / f"{i:02d}_take.wav")
print(f"line {i} spliced at {t0:.2f}-{t1:.2f}s (next line {nxt:.2f}s)", [(w["w"], w["start"]) for w in ln["words"]])

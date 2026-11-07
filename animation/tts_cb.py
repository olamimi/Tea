"""Expressive narration with Chatterbox (per-line emotion), verified + timed with Whisper.

Usage: <venv>/bin/python tts_cb.py
Outputs: build/voice.wav, build/timeline.json (same format as tts.py), build/tts_report.json
Each line is generated, transcribed with faster-whisper, and regenerated with a new seed
if the transcript does not match the script (guards against garbled/hallucinated takes).
"""
import json
from pathlib import Path
import numpy as np
import soundfile as sf
import tts_cb_lib as L
from tts_cb_lib import SR, trim, transcribe, score, word_times

ROOT = Path(__file__).parent; BUILD = ROOT / "build"; BUILD.mkdir(exist_ok=True)
story = json.loads((ROOT / "story.json").read_text())
LEAD_IN, GAP, SHOT_GAP, TAIL = 0.15, 0.10, 0.18, 1.2
TAKES = 5

chunks = [np.zeros(int(LEAD_IN * SR), np.float32)]; t = LEAD_IN
lines, report = [], []
for i, ln in enumerate(story["lines"]):
    best = None
    for take in range(TAKES):
        a = L.generate(ln, seed=1000 * i + take)
        words = transcribe(a); sc = score(ln["text"], words)
        dur = len(a) / SR; cps = len(ln["text"]) / dur
        ok = sc >= 0.92 and 8 <= cps <= 22  # matches script and plausible pace
        print(f"line {i:2d} take {take}: match={sc:.2f} {dur:.1f}s {cps:.1f}cps {'OK' if ok else 'retry'} | {' '.join(w.word for w in words).strip()[:70]}", flush=True)
        if best is None or sc > best[0]:
            best = (sc, a, words, take)
        if ok:
            break
    sc, a, words, take = best
    report.append({"line": i, "text": ln["text"], "match": round(sc, 3), "take": take})
    a = a / (np.abs(a).max() + 1e-9) * 0.85
    dur = len(a) / SR
    wt = word_times(ln["text"], words, dur)
    lines.append({"shot": ln["shot"], "text": ln["text"], "start": round(t, 3), "end": round(t + dur, 3),
                  "words": [{"w": w, "start": round(t + s, 3), "end": round(t + e, 3)} for w, (s, e) in zip(ln["text"].split(), wt)]})
    chunks.append(a); t += dur
    nxt = story["lines"][i + 1]["shot"] if i + 1 < len(story["lines"]) else None
    g = SHOT_GAP if nxt != ln["shot"] else GAP
    chunks.append(np.zeros(int(g * SR), np.float32)); t += g

chunks.append(np.zeros(int(TAIL * SR), np.float32))
voice = np.concatenate(chunks)
sf.write(BUILD / "voice.wav", voice, SR)

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
json.dump({"duration": round(len(voice) / SR, 3), "shots": shots, "lines": lines}, open(BUILD / "timeline.json", "w"), indent=1)
json.dump(report, open(BUILD / "tts_report.json", "w"), indent=1)
for s in shots:
    print(f"{s['name']:8s} {s['start']:6.2f} -> {s['end']:6.2f}")
print("total", round(len(voice) / SR, 2), "| worst match", min(r["match"] for r in report))

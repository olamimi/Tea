"""Regenerate one narration line with Chatterbox and splice it into build/voice.wav + timeline.json.

Usage: <venv>/bin/python regen_line.py <line_index> [required_word ...]
A take is accepted only if Whisper hears every required word and the transcript matches >= 0.95.
"""
import json, sys, difflib
from pathlib import Path
import numpy as np
import soundfile as sf
import torch
import os
import tts_cb_lib as L
MIN_DUR = float(os.environ.get("MIN_DUR", 0))

ROOT = Path(__file__).parent; B = ROOT / "build"
idx = int(sys.argv[1]); required = [w.lower() for w in sys.argv[2:]]
story = json.loads((ROOT / "story.json").read_text())
tl = json.loads((B / "timeline.json").read_text())
voice, SR = sf.read(B / "voice.wav")
ln = story["lines"][idx]

# reference voices: narrator = mean of lines spoken without a cloned speaker; guard etc. from their lines
refs = {}
for i, l in enumerate(tl["lines"]):
    spk = story["lines"][i].get("speaker") or "narrator"
    if i == idx or (spk == "narrator" and i >= 12):  # lines after the guard may be contaminated
        continue
    refs.setdefault(spk, []).append(L.speaker_embedding(voice[int(l["start"] * SR): int(l["end"] * SR)], SR))
want = ln.get("speaker") or "narrator"
if want != "narrator":  # compare against the character's reference clip
    ra, rsr = sf.read(str(ROOT / "refs" / f"{want}_ref.wav")); refs[want] = [L.speaker_embedding(ra.astype(np.float32), rsr)]
ref = np.mean(refs[want], 0); ref /= np.linalg.norm(ref)

best = None
if os.environ.get('USE_WAV'):  # splice a prepared take (e.g. time-stretched) instead of generating
    a, asr = sf.read(os.environ['USE_WAV']); a = a.astype(np.float32); best = (a, L.transcribe(a)); print('using', os.environ['USE_WAV'], round(len(a) / asr, 2), 's')
for take in range(0 if best else 12):
    torch.manual_seed(5000 + 97 * take)
    a = L.generate(ln, seed=None)
    words = L.transcribe(a); sc = L.score(ln["text"], words)
    heard = L.norm(" ".join(w.word for w in words))
    sim = float(L.speaker_embedding(a) @ ref)
    ok = sc >= 0.95 and all(r in heard for r in required) and len(a) / L.SR >= MIN_DUR and sim >= float(os.environ.get('VOICE_MIN', 0.9))
    print(f"take {take}: match={sc:.2f} voice={sim:.2f} {len(a)/L.SR:.1f}s {'OK' if ok else 'retry'} | {' '.join(heard)}", flush=True)
    if ok:
        best = (a, words); break
if best is None:
    sys.exit("no acceptable take")
a, words = best
a = a / (np.abs(a).max() + 1e-9) * 0.85

# Slice the existing narration into per-line clips + the gaps between them, swap one clip, re-stitch.
lines = tl["lines"]; lead = lines[0]["start"]
clips = [voice[int(l["start"] * SR): int(l["end"] * SR)] for l in lines]
gaps = [lines[i + 1]["start"] - lines[i]["end"] for i in range(len(lines) - 1)]
tail = tl["duration"] - lines[-1]["end"]
clips[idx] = a
out = [np.zeros(int(lead * SR))]; t = lead; new_lines = []
for i, (l, c) in enumerate(zip(lines, clips)):
    dur = len(c) / SR
    if i == idx:
        wt = L.word_times(ln["text"], words, dur)
        ws = [{"w": w, "start": round(t + s, 3), "end": round(t + e, 3)} for w, (s, e) in zip(ln["text"].split(), wt)]
    else:
        shift = t - l["start"]
        ws = [{**w, "start": round(w["start"] + shift, 3), "end": round(w["end"] + shift, 3)} for w in l["words"]]
    new_lines.append({**l, "start": round(t, 3), "end": round(t + dur, 3), "words": ws})
    out.append(c); t += dur
    if i < len(gaps):
        out.append(np.zeros(int(gaps[i] * SR))); t += gaps[i]
out.append(np.zeros(int(tail * SR)))
voice = np.concatenate(out); sf.write(B / "voice.wav", voice, SR)

shots = []
for l in new_lines:
    if shots and shots[-1]["name"] == l["shot"]:
        shots[-1]["lines"].append(l)
    else:
        shots.append({"name": l["shot"], "lines": [l]})
for i, s in enumerate(shots):
    s["start"] = 0.0 if i == 0 else round(s["lines"][0]["start"] - 0.08, 3)
for i, s in enumerate(shots):
    s["end"] = shots[i + 1]["start"] if i + 1 < len(shots) else round(len(voice) / SR, 3)
    s["dur"] = round(s["end"] - s["start"], 3)
json.dump({"duration": round(len(voice) / SR, 3), "shots": shots, "lines": new_lines}, open(B / "timeline.json", "w"), indent=1)
print("spliced line", idx, "| total", round(len(voice) / SR, 2))

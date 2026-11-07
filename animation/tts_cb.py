"""Expressive narration with Chatterbox (per-line emotion), verified + timed with Whisper.

Usage: <venv>/bin/python tts_cb.py
Outputs: build/voice.wav, build/timeline.json (same format as tts.py), build/tts_report.json
Each line is generated, transcribed with faster-whisper, and regenerated with a new seed
if the transcript does not match the script (guards against garbled/hallucinated takes).
"""
import json, re, difflib
from pathlib import Path
import numpy as np
import soundfile as sf
import torch
from chatterbox.tts import ChatterboxTTS
from faster_whisper import WhisperModel
from scipy.signal import resample_poly

ROOT = Path(__file__).parent; BUILD = ROOT / "build"; BUILD.mkdir(exist_ok=True)
story = json.loads((ROOT / "story.json").read_text())
SPEAKERS = {"guard": str(ROOT / "refs" / "guard_ref.wav")}
LEAD_IN, GAP, SHOT_GAP, TAIL = 0.15, 0.10, 0.18, 1.2
TAKES = 5

torch.set_num_threads(4)
tts = ChatterboxTTS.from_pretrained(device="cpu")
SR = tts.sr
asr = WhisperModel("small.en", device="cpu", compute_type="int8")


def norm(s):
    return [w for w in re.sub(r"[^a-z' ]", " ", s.lower().replace("-", " ")).split() if w]


def trim(a, thresh=0.006):
    idx = np.where(np.abs(a) > thresh)[0]
    if len(idx) == 0:
        return a
    a = a[max(0, idx[0] - int(0.05 * SR)): idx[-1] + int(0.12 * SR)].copy()
    f = int(0.01 * SR); a[:f] *= np.linspace(0, 1, f); a[-f:] *= np.linspace(1, 0, f)
    return a


def transcribe(a):
    a16 = resample_poly(a, 16000, SR).astype(np.float32)
    segs, _ = asr.transcribe(a16, language="en", word_timestamps=True, beam_size=5)
    return [w for s in segs for w in s.words]


def score(text, words):
    return difflib.SequenceMatcher(None, norm(text), norm(" ".join(w.word for w in words))).ratio()


def word_times(text, words, dur):
    """Map script words to Whisper timestamps (interpolating any unmatched words)."""
    script = text.split(); sn = [norm(w) for w in script]
    flat = [(norm(w.word), w.start, w.end) for w in words]
    hyp = [x[0][0] if x[0] else "" for x in flat]
    sm = difflib.SequenceMatcher(None, [s[0] if s else "" for s in sn], hyp)
    times = [None] * len(script)
    for a, b, n in sm.get_matching_blocks():
        for k in range(n):
            times[a + k] = (flat[b + k][1], flat[b + k][2])
    # interpolate gaps
    known = [i for i, t in enumerate(times) if t]
    if not known:
        step = dur / len(script); return [(i * step, (i + 1) * step) for i in range(len(script))]
    for i in range(len(script)):
        if times[i]:
            continue
        prev = max([k for k in known if k < i], default=None); nxt = min([k for k in known if k > i], default=None)
        s = times[prev][1] if prev is not None else 0.0
        e = times[nxt][0] if nxt is not None else dur
        span = [j for j in range(len(script)) if (prev is None or j > prev) and (nxt is None or j < nxt)]
        w = (e - s) / len(span); p = span.index(i)
        times[i] = (s + p * w, s + (p + 1) * w)
    return times


chunks = [np.zeros(int(LEAD_IN * SR), np.float32)]; t = LEAD_IN
lines, report = [], []
for i, ln in enumerate(story["lines"]):
    best = None
    for take in range(TAKES):
        torch.manual_seed(1000 * i + take)
        wav = tts.generate(ln["text"], audio_prompt_path=SPEAKERS.get(ln.get("speaker")),
                           exaggeration=ln.get("exaggeration", 0.5), cfg_weight=ln.get("cfg", 0.5), temperature=0.75)
        a = trim(wav.squeeze(0).numpy().astype(np.float32))
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

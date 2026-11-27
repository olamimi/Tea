"""Stage 3 (Chatterbox venv for Whisper): per-voice FX from the brief, Whisper check + word timings, assemble voice.wav + timeline.json.
narr: 1.1x tempo then +2 semitones | huss: 1.8x | mom/bro: 1.1x tempo | god: pitch 0.8 (formants kept), echo 60/140 ms, +4 dB bass."""
import json, subprocess
from pathlib import Path
import numpy as np, soundfile as sf
from scipy.signal import resample_poly
from faster_whisper import WhisperModel
from tts_cb_lib import norm, score, word_times
ROOT = Path(__file__).parent; B = ROOT / "build"; LD = B / "lines"; SR = 24000
FX = {"narr": "atempo=1.1,rubberband=pitch=1.12246", "huss": "atempo=1.8", "mom": "atempo=1.1", "bro": "atempo=1.1",
      "god": "rubberband=pitch=0.8:formant=preserved,aecho=0.8:0.7:60|140:0.35|0.25,bass=g=4"}
asr = WhisperModel("small.en", device="cpu", compute_type="int8")
story = json.loads((ROOT / "story.json").read_text()); LEAD, GAP, SHOT_GAP, TAIL = 0.15, 0.10, 0.2, 1.8
chunks = [np.zeros(int(LEAD * SR), np.float32)]; t = LEAD; lines = []; report = []
for i, ln in enumerate(story["lines"]):
    raw, fx = LD / f"{i:02d}_raw.wav", LD / f"{i:02d}_fx.wav"
    subprocess.run(["ffmpeg", "-y", "-v", "error", "-i", str(raw), "-af", FX[ln["fx"]] + f",aresample={SR}", "-ac", "1", str(fx)], check=True)
    a, _ = sf.read(fx, dtype="float32"); a = a / (np.abs(a).max() + 1e-9) * (0.8 if ln["fx"] != "huss" else 0.6); dur = len(a) / SR
    segs, _ = asr.transcribe(resample_poly(a, 16000, SR).astype(np.float32), language="en", word_timestamps=True, beam_size=5); words = [w for s in segs for w in s.words]
    sc = score(ln["text"], words) if ln.get("verify", True) else 1.0
    report.append({"line": i, "fx": ln["fx"], "match": round(sc, 3), "heard": " ".join(w.word for w in words).strip()})
    wt = word_times(ln["text"], words, dur)
    lines.append({"shot": ln["shot"], "speaker": ln["fx"], "text": ln["text"], "start": round(t, 3), "end": round(t + dur, 3),
                  "words": [{"w": w, "start": round(t + s, 3), "end": round(t + e, 3)} for w, (s, e) in zip(ln["text"].split(), wt)]})
    chunks.append(a); t += dur
    nxt = story["lines"][i + 1]["shot"] if i + 1 < len(story["lines"]) else None
    g = ln.get("pause", SHOT_GAP if nxt != ln["shot"] else GAP); chunks.append(np.zeros(int(g * SR), np.float32)); t += g
chunks.append(np.zeros(int(TAIL * SR), np.float32)); voice = np.concatenate(chunks); sf.write(B / "voice.wav", voice, SR)
shots = []
for ln in lines:
    if shots and shots[-1]["name"] == ln["shot"]: shots[-1]["lines"].append(ln)
    else: shots.append({"name": ln["shot"], "lines": [ln]})
for i, s in enumerate(shots): s["start"] = 0.0 if i == 0 else round(s["lines"][0]["start"] - 0.08, 3)
for i, s in enumerate(shots): s["end"] = shots[i + 1]["start"] if i + 1 < len(shots) else round(len(voice) / SR, 3); s["dur"] = round(s["end"] - s["start"], 3)
json.dump({"duration": round(len(voice) / SR, 3), "shots": shots, "lines": lines}, open(B / "timeline.json", "w"), indent=1)
json.dump(report, open(B / "tts_report.json", "w"), indent=1)
for r in report:
    if r["match"] < 0.9: print("CHECK", r)
print("total", round(len(voice) / SR, 2), "s | worst", min(r["match"] for r in report))

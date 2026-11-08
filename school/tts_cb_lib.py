"""Shared Chatterbox + Whisper helpers for tts_cb.py and regen_line.py."""
import re, difflib
from pathlib import Path
import numpy as np
import torch
from chatterbox.tts import ChatterboxTTS
from faster_whisper import WhisperModel
from scipy.signal import resample_poly

ROOT = Path(__file__).parent
class _Spk(dict):
    def get(self, k, d=None):
        return str(ROOT / "refs" / f"{k}_ref.wav") if k else d
SPEAKERS = _Spk()  # any speaker name -> refs/<name>_ref.wav
torch.set_num_threads(4)
tts = ChatterboxTTS.from_pretrained(device="cpu")
SR = tts.sr
asr = WhisperModel("small.en", device="cpu", compute_type="int8")


ALIASES = {"toby": "tobi", "kimmy": "kemi", "kemmy": "kemi", "500s": "five hundreds", "20": "twenty", "10": "ten", "30": "thirty", "10s": "tens", "twenties": "twenty"}


def norm(s):
    return [ALIASES.get(w, w) for w in re.sub(r"[^a-z0-9' ]", " ", s.lower().replace("-", " ")).split() if w]


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




import copy
DEFAULT_CONDS = copy.deepcopy(tts.conds)  # the built-in narrator voice


def generate(ln, seed=None):
    if seed is not None:
        torch.manual_seed(seed)
    # Chatterbox keeps the last cloned voice in tts.conds, so restore the narrator before every un-cloned line.
    if not ln.get("speaker"):
        tts.conds = copy.deepcopy(DEFAULT_CONDS)
    wav = tts.generate(ln["text"], audio_prompt_path=SPEAKERS.get(ln.get("speaker")),
                       exaggeration=ln.get("exaggeration", 0.5), cfg_weight=ln.get("cfg", 0.5), temperature=0.75)
    return trim(wav.squeeze(0).numpy().astype(np.float32))


def speaker_embedding(a, sr=None):
    """L2-normalised speaker embedding (Chatterbox voice encoder) for identity checks."""
    a16 = resample_poly(a, 16000, sr or SR).astype(np.float32)
    e = tts.ve.embeds_from_wavs([a16], sample_rate=16000)[0]
    return e / np.linalg.norm(e)

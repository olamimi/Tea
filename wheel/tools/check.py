"""Gate that runs after every render (the reference workflow's 'check script'). Passing it does NOT mean the
video looks right: always look at the frames and run the fresh critic afterwards.
usage: python tools/check.py the-wheel.mp4"""
import json, re, subprocess, sys
from pathlib import Path
import numpy as np
ROOT = Path(__file__).resolve().parent.parent; B = ROOT / "build"; mp4 = ROOT / (sys.argv[1] if len(sys.argv) > 1 else "the-wheel.mp4")
res = []
def check(name, ok, info=""): res.append((ok, name, info))
def probe(*a): return subprocess.run(["ffprobe", "-v", "error", *a, str(mp4)], capture_output=True, text=True).stdout.strip()
tl = json.loads((B / "timeline.json").read_text()); dur = tl["duration"]
check("output exists", mp4.exists())
if mp4.exists():
    wh = probe("-select_streams", "v", "-show_entries", "stream=width,height", "-of", "csv=p=0")
    check("size 1080x1920", wh == "1080,1920", wh)
    fr = probe("-select_streams", "v", "-show_entries", "stream=r_frame_rate", "-of", "csv=p=0"); check("30 fps", fr == "30/1", fr)
    d = float(probe("-show_entries", "format=duration", "-of", "csv=p=0")); check("duration matches the voice", abs(d - dur) < 0.2, f"{d:.2f} vs {dur:.2f}")
    check("has audio", "audio" in probe("-show_entries", "stream=codec_type", "-of", "csv=p=0"))
    ln = subprocess.run(["ffmpeg", "-v", "info", "-i", str(mp4), "-af", "ebur128", "-f", "null", "-"], capture_output=True, text=True).stderr
    I = float(re.findall(r"I:\s+(-?[\d.]+) LUFS", ln)[-1]); check("loudness -14 +/- 1 LUFS", abs(I + 14) <= 1, f"{I}")
    # brightness and saturation on 1 frame per second (ref luma 102-115, ref saturation 44-64 %)
    raw = subprocess.run(["ffmpeg", "-v", "error", "-i", str(mp4), "-vf", "fps=1,scale=270:480,format=rgb24", "-f", "rawvideo", "-"], capture_output=True).stdout
    f = np.frombuffer(raw, np.uint8).reshape(-1, 480, 270, 3).astype(float) / 255
    luma = (0.299 * f[..., 0] + 0.587 * f[..., 1] + 0.114 * f[..., 2]).mean() * 255
    mx, mn = f.max(-1), f.min(-1); sat = np.where(mx > 0, (mx - mn) / np.maximum(mx, 1e-6), 0).mean() * 100
    check("brightness in ref band 95-125", 95 <= luma <= 125, f"{luma:.1f}"); check("saturation in ref band 40-70 %", 40 <= sat <= 70, f"{sat:.1f}")
    dark = [i for i in range(len(f)) if f[i].mean() < 0.08]; check("no black frames", not dark, str(dark))
m = json.loads((B / "measure.json").read_text()); rows = m["rows"]; segs = m["info"]
need = int(np.ceil(32 * dur / 60)); check(f"shots >= {need} (ref pace)", len(segs) >= need, str(len(segs)))
check("longest shot <= 4 s", max(s[3] - s[2] for s in segs) <= 4.0, f"{max(s[3] - s[2] for s in segs):.2f}")
check("locations >= 5", len({r['set'] for r in rows}) >= 5, str(len({r['set'] for r in rows})))
big = np.mean([r["face"] >= 0.30 for r in rows]); check("faces >= 30% of height in >= 30% of frames (ref 70%, ours has prop shots)", big >= 0.30, f"{big * 100:.0f}%")
ass = (B / "captions.ass").read_text().splitlines(); ev = [l for l in ass if l.startswith("Dialogue")]
def ts(x): h, mi, s = x.split(":"); return int(h) * 3600 + int(mi) * 60 + float(s)
cov = sum(ts(e.split(",")[2]) - ts(e.split(",")[1]) for e in ev) / dur; check("captions on >= 85% of the runtime", cov >= 0.85, f"{cov * 100:.0f}%")
src = (ROOT / "audio.py").read_text(); n_sfx = len(re.findall(r"^\s*(?:for .*: )?add\(|; add\(", src, re.M)); check("sound effects layer present", n_sfx >= 10, str(n_sfx))
for ok, name, info in res: print(("PASS " if ok else "FAIL ") + name + (f"  [{info}]" if info else ""))
print(f"{sum(r[0] for r in res)}/{len(res)} checks passed"); sys.exit(0 if all(r[0] for r in res) else 1)

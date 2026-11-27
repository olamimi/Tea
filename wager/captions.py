"""Build word-by-word pop captions (ASS) from build/timeline.json -> build/captions.ass"""
import json
from pathlib import Path

B = Path(__file__).parent / "build"
tl = json.loads((B / "timeline.json").read_text())


def ts(t):
    t = max(0, t); h = int(t // 3600); m = int(t % 3600 // 60); s = t % 60
    return f"{h}:{m:02d}:{s:05.2f}"


# Group words: 1-2 per caption (two only when both are short), never across lines.
events = []
for ln in tl["lines"]:
    ws = ln["words"]; i = 0
    while i < len(ws):
        grp = [ws[i]]
        if i + 1 < len(ws) and len(ws[i]["w"]) + len(ws[i + 1]["w"]) <= 9 and not ws[i]["w"][-1] in ".,!?:":
            grp.append(ws[i + 1])
        i += len(grp)
        events.append({"text": " ".join(w["w"] for w in grp), "start": grp[0]["start"], "end": grp[-1]["end"], "line_end": i >= len(ws)})
for k, e in enumerate(events):
    nxt = events[k + 1]["start"] if k + 1 < len(events) else e["end"] + 0.4
    e["end"] = nxt if not e["line_end"] else min(nxt, e["end"] + 0.25)

hdr = """[Script Info]
ScriptType: v4.00+
PlayResX: 1080
PlayResY: 1920
WrapStyle: 2

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Cap,Inter Display Black,86,&H00FFFFFF,&H00FFFFFF,&H00000000,&H64000000,0,0,0,0,100,100,0,0,1,7,3,5,60,60,0,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
"""
lines = []
for e in events:
    txt = e["text"].replace("{", "").replace("}", "")
    lines.append(f"Dialogue: 0,{ts(e['start'])},{ts(e['end'])},Cap,,0,0,0,,{{\\pos(540,1370)\\fscx78\\fscy78\\t(0,90,\\fscx104\\fscy104)\\t(90,150,\\fscx100\\fscy100)}}{txt}")
(B / "captions.ass").write_text(hdr + "\n".join(lines) + "\n")
print(len(events), "captions")

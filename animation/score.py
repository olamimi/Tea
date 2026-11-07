"""Compose the orchestral score as MIDI (timed to the narration) and render it with FluidSynth.

Outputs: build/music.mid, build/bells.mid -> build/music.wav, build/bells.wav
Needs: mido, fluidsynth + /usr/share/sounds/sf2/FluidR3_GM.sf2
"""
import json, subprocess
from pathlib import Path
import mido

ROOT = Path(__file__).parent; B = ROOT / "build"
SF2 = "/usr/share/sounds/sf2/FluidR3_GM.sf2"
tl = json.loads((B / "timeline.json").read_text())
END = tl["duration"]
shot = {s["name"]: s for s in tl["shots"]}


def word(sh, w, nth=1):
    n = 0
    for ln in tl["lines"]:
        if ln["shot"] == sh:
            for x in ln["words"]:
                if x["w"].lower() == w.lower():
                    n += 1
                    if n == nth:
                        return x["start"]
    raise KeyError((sh, w))


TPS = 960  # ticks per second (480 tpb @ 120 bpm)


class Score:
    def __init__(self):
        self.ev = []  # (tick, order, msg)

    def prog(self, ch, program, t=0.0, vol=100, pan=64, rev=50):
        k = int(t * TPS)
        self.ev += [(k, 0, mido.Message("program_change", channel=ch, program=program)),
                    (k, 0, mido.Message("control_change", channel=ch, control=7, value=vol)),
                    (k, 0, mido.Message("control_change", channel=ch, control=10, value=pan)),
                    (k, 0, mido.Message("control_change", channel=ch, control=91, value=rev))]

    def cc(self, ch, t, ctl, val):
        self.ev.append((int(t * TPS), 1, mido.Message("control_change", channel=ch, control=ctl, value=int(max(0, min(127, val))))))

    def note(self, ch, t, dur, pitch, vel=80):
        if t >= END or pitch is None:
            return
        dur = min(dur, END + 2 - t)
        self.ev.append((int(t * TPS), 2, mido.Message("note_on", channel=ch, note=pitch, velocity=int(max(1, min(127, vel))))))
        self.ev.append((int((t + dur) * TPS), 1, mido.Message("note_off", channel=ch, note=pitch, velocity=0)))

    def swell(self, ch, t0, t1, v0, v1, steps=24):  # expression (CC11) ramp
        for i in range(steps + 1):
            self.cc(ch, t0 + (t1 - t0) * i / steps, 11, v0 + (v1 - v0) * i / steps)

    def save(self, path):
        mid = mido.MidiFile(ticks_per_beat=480); tr = mido.MidiTrack(); mid.tracks.append(tr)
        tr.append(mido.MetaMessage("set_tempo", tempo=500000))
        last = 0
        for k, _, m in sorted(self.ev, key=lambda e: (e[0], e[1])):
            tr.append(m.copy(time=k - last)); last = k
        mid.save(path)


# channels
PIZZ, BSN, CLAR, STR, HARP, OBOE, FLUTE, HORN, TIMP, DRUM, CEL, BASS, TREM, CHOIR, GLOCK = 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14
S = Score()
S.prog(PIZZ, 45, vol=100, pan=50); S.prog(BSN, 70, vol=95, pan=74); S.prog(CLAR, 71, vol=92, pan=58)
S.prog(STR, 48, vol=100, pan=64, rev=70); S.prog(HARP, 46, vol=90, pan=40); S.prog(OBOE, 68, vol=90, pan=70)
S.prog(FLUTE, 73, vol=88, pan=60); S.prog(HORN, 60, vol=96, pan=76, rev=70); S.prog(TIMP, 47, vol=110, pan=64)
S.prog(CEL, 8, vol=85, pan=44); S.prog(BASS, 43, vol=105, pan=64); S.prog(TREM, 44, vol=96, pan=60, rev=70)
S.prog(CHOIR, 52, vol=90, pan=64, rev=90); S.prog(GLOCK, 9, vol=80, pan=80)
S.cc(DRUM, 0, 7, 70)
for ch in range(16):
    S.cc(ch, 0, 11, 110)

# ---------------- A: the court (playful, D major, 112 bpm) ----------------
A_END = word("decree", "threw")
bt = 60 / 112
chords = [(50, [54, 57, 62]), (55, [59, 62, 67]), (57, [61, 64, 67]), (50, [54, 57, 62])]
mel = [  # (beat, dur, pitch) over 4 bars
    (0, .5, 69), (.5, .5, 66), (1, .5, 69), (1.5, .5, 74), (2, 1, 73), (3, 1, 71),
    (4, .5, 71), (4.5, .5, 67), (5, .5, 71), (5.5, .5, 74), (6, 1, 76), (7, 1, 74),
    (8, .5, 73), (8.5, .5, 69), (9, .5, 73), (9.5, .5, 76), (10, .5, 79), (10.5, .5, 76), (11, 1, 73),
    (12, 1, 74), (13, .5, 69), (13.5, .5, 66), (14, 1.5, 62)]
t = 0.0; bar = 0
while t < A_END:
    root, tri = chords[bar % 4]
    for k in range(8):  # pizzicato: bass on the beat, chord tones on the offbeats
        tk = t + k * bt / 2
        if tk >= A_END:
            break
        S.note(PIZZ, tk, bt * 0.45, root - 12 if k % 2 == 0 else tri[(k // 2) % 3], 78 if k % 2 == 0 else 62)
    for b in (0, 2):
        if t + b * bt < A_END:
            S.note(BSN, t + b * bt, bt * 0.35, root - 12, 74)
    for b in (1, 3):
        if t + b * bt < A_END:
            S.note(DRUM, t + b * bt, 0.05, 77, 38)  # low wood block
    if bar % 8 < 4 or bar % 8 >= 4:  # melody: clarinet, then flute an octave up
        inst, off = (CLAR, 0) if (bar // 4) % 2 == 0 else (FLUTE, 12)
        for b, d, p in mel:
            if (bar % 4) * 4 <= b < (bar % 4 + 1) * 4:
                tk = t + (b - (bar % 4) * 4) * bt
                if tk < A_END:
                    S.note(inst, tk, d * bt * 0.9, p + off, 66)
    t += 4 * bt; bar += 1
for nm in ("laugh", "feast"):  # comic stings
    s0 = shot[nm]["start"]
    for i, p in enumerate([74, 78, 81, 86, 90]):
        S.note(GLOCK, s0 + i * 0.05, 0.3, p, 90)
    for i, p in enumerate([57, 56, 55, 54]):
        S.note(BSN, s0 + 0.25 + i * 0.16, 0.14 if i < 3 else 0.45, p - 12, 92)

# ---------------- B: exile (D minor, tender) ----------------
B0, B_END = A_END, shot["night"]["start"]
chB = [(38, [62, 65, 69]), (34, [58, 62, 65]), (41, [60, 65, 69]), (33, [61, 64, 69])]
melB = [(0, 1.0, 74), (1.0, .5, 72), (1.5, .5, 69), (2.0, 1.0, 70), (3.0, .5, 69), (3.5, .5, 65), (4.0, 1.0, 69), (5.0, .5, 67), (5.5, .5, 65), (6.0, 2.0, 64)]
S.swell(STR, B0 - 0.1, B0 + 1.0, 40, 100)
t = B0; i = 0; ub = 0.95
while t < B_END:
    root, tri = chB[i % 4]
    d = min(2 * ub, B_END - t)
    for p in tri:
        S.note(STR, t, d + 0.05, p - 12, 64)
    S.note(BASS, t, d, root, 70)
    for k in range(6):
        if t + k * d / 6 < B_END:
            S.note(HARP, t + k * d / 6, 0.8, tri[k % 3] + (12 if k >= 3 else 0), 58)
    t += 2 * ub; i += 1
for b, d, p in melB:
    S.note(OBOE, B0 + 0.4 + b * ub, d * ub * 0.95, p, 72)
for b, d, p in melB[:6]:
    S.note(OBOE, B0 + 0.4 + (b + 8) * ub, d * ub * 0.95, p, 66)

# ---------------- C: night, crisis (D minor, building) ----------------
C0, RANG, C_END, FLOOD = B_END, word("night", "rang."), shot["inside"]["start"], shot["flood"]["start"]
for k, p in enumerate([86, 81, 77, 86, 89, 81]):  # quiet night twinkle
    S.note(CEL, C0 + 0.2 + k * 0.42, 0.6, p, 50)
S.note(STR, C0, RANG - C0 + 0.3, 62, 45); S.note(STR, C0, RANG - C0 + 0.3, 69, 40)
S.swell(TREM, RANG, FLOOD, 70, 125)
for p in (38, 50, 53, 57):
    S.note(TREM, RANG, FLOOD - RANG, p, 78)
t = RANG; k = 0; pb = 0.25
while t < FLOOD - 0.05:  # driving contrabass pulse
    S.note(BASS, t, pb * 0.8, 38 if k % 8 not in (6, 7) else 39, 70 + 30 * (t - RANG) / (FLOOD - RANG))
    t += pb; k += 1
for nm in ("night", "gate", "guard"):
    S.note(TIMP, shot[nm]["start"] if nm != "night" else RANG, 0.8, 38, 110)
for t0, chord in ((word("gate", "Everyone!"), [62, 65, 69]), (shot["guard"]["start"] + 1.0, [61, 64, 69])):
    for p in chord:
        S.note(HORN, t0, 1.2, p - 12, 92)
# the flood: big hit, then a hush
for i in range(14):
    S.note(TIMP, FLOOD - 0.7 + i * 0.05, 0.1, 38, 60 + i * 4)
for ch, ps, v in ((STR, [38, 50, 53, 57, 62], 118), (HORN, [50, 53, 57], 115), (CHOIR, [50, 57, 62, 65], 100), (BASS, [26, 38], 120)):
    for p in ps:
        S.note(ch, FLOOD, C_END - FLOOD + 0.2, p, v)
S.note(TIMP, FLOOD, 1.5, 38, 127); S.note(DRUM, FLOOD, 2.0, 49, 100)
S.swell(STR, FLOOD + 0.3, C_END, 120, 70); S.swell(HORN, FLOOD + 0.3, C_END, 120, 50)

# ---------------- D: inside the mechanism (ticking, rising) ----------------
D0, WF, WY, D_END = C_END, word("inside", "flood"), word("inside", "yanked"), shot["finale"]["start"]
S.cc(STR, D0, 11, 100); S.cc(HORN, D0, 11, 110)
pat = [62, 65, 69, 72, 69, 65]
t = D0; k = 0; tb = 0.27
while t < D_END:
    lift = 0 if t < WF else (5 if t < WY else 7)
    S.note(CEL, t, 0.25, pat[k % 6] + 12 + lift, 62)
    if k % 2 == 0:
        S.note(PIZZ, t, 0.2, 50 + lift - 12, 70)
    S.note(DRUM, t, 0.03, 76 if k % 2 == 0 else 77, 34)
    t += tb; k += 1
S.swell(STR, WF - 0.2, WY, 50, 120)
for i, p in enumerate(range(50, 63)):  # rising strings as the water climbs
    S.note(STR, WF + i * (WY - WF) / 13, (WY - WF) / 13 + 0.05, p, 90)
S.note(DRUM, WY, 2.0, 49, 110); S.note(TIMP, WY, 1.0, 38, 120)
for p in (62, 66, 69, 74):
    S.note(TREM, WY, D_END - WY, p - 12, 85)
S.note(HORN, WY + 0.3, D_END - WY - 0.3, 57, 85)

# ---------------- E: finale (D major, swelling) ----------------
E0 = D_END
chE = [(38, [62, 66, 69]), (35, [59, 62, 66]), (43, [62, 67, 71]), (45, [61, 64, 69]), (38, [62, 66, 69, 74])]
seg = (END - E0) / 5.3
S.swell(STR, E0, E0 + 2.5, 50, 115); S.swell(CHOIR, E0, END, 60, 110); S.swell(HORN, E0, END, 70, 120)
for i, (root, tri) in enumerate(chE):
    t0 = E0 + i * seg; d = seg if i < 4 else END - t0 + 1
    for p in tri:
        S.note(STR, t0, d, p, 84); S.note(CHOIR, t0, d, p, 70)
    S.note(BASS, t0, d, root, 86); S.note(HORN, t0, d, tri[0] - 12, 80)
for b, d, p in mel[:12]:
    S.note(FLUTE, E0 + 0.3 + b * seg / 4, d * seg / 4 * 0.95, p + 12, 70)
for i in range(24):
    S.note(TIMP, END - 2.6 + i * 0.05, 0.1, 38, 50 + i * 2)
S.note(TIMP, END - 1.4, 1.4, 38, 120)

S.save(B / "music.mid")

# ---------------- bells (separate stem, not ducked) ----------------
Bl = Score(); Bl.prog(0, 14, vol=120, rev=80)
for ch in range(16):
    Bl.cc(ch, 0, 11, 120)
Bl.note(0, word("ring1", "rang"), 3.0, 74, 112)
t = RANG; k = 0
while t < shot["gate"]["start"] + 0.5:
    Bl.note(0, t, 0.6, 74 if k % 2 == 0 else 69, 105 if t < shot["night"]["end"] else 70); t += 0.34; k += 1
t = WY + 0.15
while t < shot["inside"]["end"]:
    Bl.note(0, t, 0.5, 74, 90); t += 0.3
Bl.note(0, word("finale", "ring"), 3.5, 74, 100)
t = word("finale", "And") + 0.4
while t < END - 0.6:
    Bl.note(0, t, 2.5, 74, 70); t += 1.4
Bl.save(B / "bells.mid")

for name in ("music", "bells"):
    subprocess.run(["fluidsynth", "-ni", "-q", "-g", "0.7", "-r", "48000", "-F", str(B / f"{name}.wav"), SF2, str(B / f"{name}.mid")], check=True)
print("rendered music.wav + bells.wav, duration", END)

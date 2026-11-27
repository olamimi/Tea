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
PIZZ, BSN, CLAR, STR, MAR, OBOE, FLUTE, BRASS, TIMP, DRUM, CEL, BASS, TREM, CHOIR, XYL, TUBA = 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15
S = Score()
for ch, prog, vol, pan in [(PIZZ, 45, 100, 50), (BSN, 70, 96, 74), (CLAR, 71, 92, 58), (STR, 48, 96, 64), (MAR, 12, 100, 44), (OBOE, 68, 90, 70), (FLUTE, 73, 88, 60), (BRASS, 61, 108, 64),
                           (TIMP, 47, 112, 64), (CEL, 8, 85, 44), (BASS, 43, 104, 64), (TREM, 44, 96, 60), (CHOIR, 52, 86, 64), (XYL, 13, 92, 80), (TUBA, 58, 102, 64)]:
    S.prog(ch, prog, vol=vol, pan=pan, rev=60)
S.cc(DRUM, 0, 7, 72)
for ch in range(16): S.cc(ch, 0, 11, 110)
sh = lambda n: shot[n]["start"]
bt = 60 / 124
def wd(sh, w, n=1):
    return word(sh, w, n)
BPM = 104; bt = 60 / BPM
key_prog = [(50, [62, 65, 69]), (46, [58, 62, 65]), (48, [60, 64, 67]), (45, [57, 61, 64])]  # Dm Bb C A: curious "math" loop
def groove(A0, A1, lead=True, vel=1.0, drums=True):
    t = A0; bar = 0
    while t < A1 - 0.05:
        root, tri = key_prog[bar % 4]
        for e in range(8):  # eighth-note pluck arpeggio + bass on beats
            te = t + e * bt / 2
            if te >= A1: break
            S.note(PIZZ, te, bt * 0.4, tri[e % 3] + (12 if e in (3, 7) else 0), int(70 * vel))
            if e % 2 == 0: S.note(BASS, te, bt * 0.45, root - 12, int(90 * vel))
            if drums:
                if e % 4 == 0: S.note(DRUM, te, 0.05, 36, int(80 * vel))
                if e % 4 == 2: S.note(DRUM, te, 0.05, 38, int(60 * vel))
                S.note(DRUM, te, 0.03, 42, int(38 * vel))
        if lead:
            for i, (b, d, p) in enumerate([(0, 0.5, 74), (0.5, 0.5, 77), (1, 1, 76), (2.5, 0.5, 72), (3, 1, 74)]):
                tb = t + b * bt
                if tb < A1: S.note(XYL, tb, d * bt * 0.9, p + (0 if bar % 2 == 0 else -2), int(66 * vel))
        t += 4 * bt; bar += 1
sh = lambda n: shot[n]["start"]
# HOOK: holy choir chord + bell
for p in (50, 57, 62, 66): S.note(CHOIR, 0.0, sh("huss") + 0.1, p, 70)
S.note(CEL, 0.15, 1.2, 81, 70); S.note(CEL, 0.6, 1.2, 86, 60)
# (huss: silence)
G0 = sh("proof")
groove(G0, sh("wager"), lead=True)
# WAGER: groove continues; heaven = choir major sting, fire = low brass stab, perfect = bright ding
groove(sh("wager"), sh("world"), lead=False, vel=0.85)
S.note(CEL, wd("wager", "Burger"), 0.6, 88, 100); S.note(CEL, wd("wager", "Burger") + 0.08, 0.6, 93, 90)
for p in (62, 66, 69, 74): S.note(CHOIR, wd("wager", "rewards."), 1.4, p, 90)
for p in (38, 45, 50): S.note(BRASS, wd("wager", "punishment."), 0.8, p, 115)
S.note(TIMP, wd("wager", "punishment."), 0.8, 38, 120)
for i, p in enumerate([74, 78, 81, 86]): S.note(XYL, wd("wager", "perfect.") + i * 0.06, 0.3, p, 105)
# WORLD + ME: full groove with lead; a choir swell on "religious"
groove(sh("world"), sh("doubt"), lead=True)
for p in (62, 66, 69): S.note(CHOIR, wd("world", "religious."), 1.2, p, 80)
# DOUBT + FAMILY + RESEARCH: sparser (no drums), ticking clock
groove(sh("doubt"), sh("convert"), lead=False, vel=0.7, drums=False)
t = sh("doubt")
while t < sh("convert"): S.note(DRUM, t, 0.03, 76, 35); t += bt
for p in (38, 45): S.note(TREM, wd("family", "Literally."), 1.6, p, 90)
for p in (38, 41, 45): S.note(TREM, wd("research", "Infinity"), 2.2, p, 95)
S.note(TIMP, wd("research", "Infinity"), 1.0, 38, 110)
# CONVERT: warm church organ chords + soft groove
O0, O1 = sh("convert"), sh("death")
CH_ORG = TREM
S.prog(CH_ORG, 19, t=O0, vol=92, pan=64, rev=90)
for i, (root, tri) in enumerate([(50, [62, 66, 69]), (55, [62, 67, 71]), (57, [61, 64, 69]), (50, [62, 66, 69])] * 3):
    tt = O0 + i * 4 * bt
    if tt >= O1: break
    for p in tri: S.note(CH_ORG, tt, 4 * bt * 0.95, p, 70)
    S.note(CH_ORG, tt, 4 * bt * 0.95, root - 12, 70)
groove(O0 + 2 * bt, O1, lead=True, vel=0.6, drums=False)
# DEATH: a thin music box line, then silence after "died."
D0, td = sh("death"), wd("death", "died.")
for i, p in enumerate([74, 72, 69, 67, 66]): S.note(CEL, D0 + 0.1 + i * 0.5, 0.45, p, 55)
# WHITE ROOM: ethereal choir + celesta, joyful on "right!", then a low drone from "Then I saw"
W0, tth = sh("white"), wd("white", "Then")
for p in (62, 69, 74, 78): S.note(CHOIR, W0 + 0.3, tth - W0 - 0.3, p, 72)
for i, p in enumerate([86, 90, 93, 98, 93, 90]): S.note(CEL, wd("white", "right!") + i * 0.12, 0.3, p, 90)
for p in (38, 39, 45): S.note(TREM, tth, sh("god") - tth, p, 80)
S.swell(TREM, tth, sh("god"), 60, 115)
# GOD: deep drone + low choir, very quiet under the voice
GD0 = sh("god")
S.prog(STR, 48, t=GD0 - 0.1, vol=96, pan=64, rev=100)
for p in (26, 38, 45): S.note(STR, GD0, sh("infinite") - GD0, p, 70)
for p in (50, 57): S.note(CHOIR, GD0, sh("infinite") - GD0, p, 55)
S.note(TIMP, wd("god", "left"), 1.5, 26, 125)
# INFINITE: the "math" loop returns, building; cut dead before "We all burned."
groove(sh("infinite"), sh("burn") - 0.05, lead=True, vel=0.8)
S.swell(PIZZ, sh("infinite"), sh("burn"), 90, 127)
# BURN: impact; HELL: low rumble + one last plucked figure
tb = wd("burn", "burned.")
S.note(TIMP, tb, 1.6, 26, 127); S.note(DRUM, tb, 1.5, 49, 120)
H0 = sh("hell")
for p in (26, 33): S.note(STR, H0, END - H0 + 1, p, 75)
for i, p in enumerate([62, 65, 69, 74]): S.note(PIZZ, wd("hell", "time.") + 0.2 + i * 0.18, 0.2, p, 85)
S.save(B / "music.mid")
X = Score(); X.prog(0, 14, vol=110); X.prog(1, 47, vol=127)
for ch in range(16): X.cc(ch, 0, 11, 120)
X.note(0, 0.15, 3.0, 74, 80); X.note(0, 0.15, 3.0, 81, 70)  # church bell at the hook
X.save(B / "bells.mid")
for name in ("music", "bells"):
    subprocess.run(["fluidsynth", "-ni", "-q", "-g", "0.7", "-r", "48000", "-F", str(B / f"{name}.wav"), SF2, str(B / f"{name}.mid")], check=True)
print("rendered music.wav + bells.wav, duration", END)

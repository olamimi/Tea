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
S.prog(PIZZ, 45, vol=100, pan=50); S.prog(BSN, 70, vol=96, pan=74); S.prog(CLAR, 71, vol=92, pan=58)
S.prog(STR, 48, vol=96, pan=64, rev=70); S.prog(MAR, 12, vol=100, pan=44); S.prog(OBOE, 68, vol=90, pan=70)
S.prog(FLUTE, 73, vol=88, pan=60); S.prog(BRASS, 61, vol=110, pan=64, rev=60); S.prog(TIMP, 47, vol=112, pan=64)
S.prog(CEL, 8, vol=85, pan=44); S.prog(BASS, 43, vol=104, pan=64); S.prog(TREM, 44, vol=96, pan=60, rev=70)
S.prog(CHOIR, 52, vol=86, pan=64, rev=90); S.prog(XYL, 13, vol=92, pan=80); S.prog(TUBA, 58, vol=100, pan=64)
S.cc(DRUM, 0, 7, 72)
for ch in range(16):
    S.cc(ch, 0, 11, 110)
sh = lambda n: shot[n]["start"]
END_ = END

# A: playful school theme (hook -> search1): marimba melody over pizz/bassoon, woodblock
A0, A1 = 0.0, sh("break")
bt = 60 / 118
chords = [(48, [52, 55, 60]), (53, [57, 60, 65]), (55, [59, 62, 67]), (48, [52, 55, 60])]  # C F G C
mel = [(0, .5, 72), (.5, .5, 74), (1, .5, 76), (1.5, .5, 79), (2, 1, 76), (3, 1, 72), (4, .5, 77), (4.5, .5, 76), (5, .5, 74), (5.5, .5, 72), (6, 1, 74), (7, 1, 67),
       (8, .5, 74), (8.5, .5, 76), (9, .5, 77), (9.5, .5, 79), (10, .5, 81), (10.5, .5, 79), (11, 1, 77), (12, 1, 76), (13, .5, 74), (13.5, .5, 72), (14, 1.5, 72)]
t = A0; bar = 0
while t < A1:
    root, tri = chords[bar % 4]
    for k in range(8):
        tk = t + k * bt / 2
        if tk >= A1: break
        S.note(PIZZ, tk, bt * 0.4, root - 12 if k % 2 == 0 else tri[(k // 2) % 3], 74 if k % 2 == 0 else 58)
        if k % 2 == 1: S.note(DRUM, tk, 0.05, 76, 34)
    for b in (0, 2):
        if t + b * bt < A1: S.note(BSN, t + b * bt, bt * 0.35, root - 12, 70)
    for b, d, p in mel:
        if (bar % 4) * 4 <= b < (bar % 4 + 1) * 4:
            tk = t + (b - (bar % 4) * 4) * bt
            if tk < A1: S.note(MAR, tk, d * bt * 0.9, p, 70)
    t += 4 * bt; bar += 1
# hook sting on "thief."
tth = word("hook", "thief.")
for p in (36, 48): S.note(BRASS, tth, 0.6, p + 12, 115)
S.note(TIMP, tth, 0.8, 36, 120); S.note(DRUM, tth, 1.2, 49, 100)

# B: sneaky search (search1 -> burst): staccato clarinet/bassoon in A minor, celesta twinkles
B0, B1 = sh("break"), sh("burst")
t = B0; k = 0; sn = [57, 60, 64, 63, 62, 60, 59, 60]
while t < B1:
    S.note(PIZZ, t, 0.15, sn[k % 8] - 12, 66)
    if k % 2 == 0: S.note(BSN, t, 0.18, 45 if (k // 8) % 2 == 0 else 43, 72)
    if k % 4 == 3: S.note(CLAR, t, 0.22, sn[(k + 3) % 8] + 12, 60)
    t += 0.27; k += 1
tg = word("check", "gone.")
S.note(XYL, tg, 0.3, 84, 100); S.note(XYL, tg + 0.1, 0.3, 80, 100)
for i, p in enumerate([72, 76, 79, 84]): S.note(XYL, sh("mates") + 0.05 + i * 0.07, 0.25, p, 90)  # comedic laugh sting
for i, p in enumerate([55, 54, 53, 52]): S.note(BSN, sh("mates") + 0.4 + i * 0.15, 0.13 if i < 3 else 0.5, p - 12, 92)

# C: accusation (burst -> smile): tremolo strings + driving bass, rising
C0, C1 = sh("burst"), sh("smile")
tb = word("burst", "burst")
S.note(TIMP, tb, 0.8, 38, 122); S.note(DRUM, tb, 1.0, 49, 110)
for p in (45, 52, 57, 60): S.note(BRASS, tb, 0.5, p, 110)
S.swell(TREM, tb, C1, 70, 120)
for p in (45, 52, 57): S.note(TREM, tb + 0.1, C1 - tb, p, 80)
t = tb + 0.2; k = 0
while t < C1 - 0.05:
    S.note(BASS, t, 0.2, 33 if k % 4 != 3 else 34, 76); t += 0.25; k += 1
te = word("bag", "exactly")
S.note(TIMP, te, 0.6, 33, 120); S.note(CHOIR, te, 1.4, 69, 90); S.note(CHOIR, te, 1.4, 72, 90)
tc = word("calm", "calm.")
S.note(CEL, tc, 0.4, 88, 60)

# D: triumph (smile): bright brass + glock run
D0 = sh("smile")
for i, p in enumerate([72, 76, 79, 84, 88]): S.note(XYL, word("smile", "pulled") + i * 0.06, 0.3, p, 96)
for p in (60, 64, 67): S.note(BRASS, word("smile", "tens.") - 0.05, 0.8, p, 100)

# E: rage + escalation (changed -> office): low brass, timpani, tuba stabs
E0, E1 = sh("changed"), sh("office")
S.note(TIMP, E0, 0.6, 36, 124); S.note(DRUM, E0, 1.0, 49, 110)
for p in (36, 43, 48): S.note(BRASS, E0, 0.7, p, 120)
S.swell(STR, E0, E1, 80, 120)
for p in (48, 51, 55): S.note(STR, E0 + 0.2, E1 - E0, p, 80)
t = E0 + 0.3; k = 0
while t < E1 - 0.1:
    S.note(TUBA, t, 0.22, 36 if k % 2 == 0 else 43, 84); t += 0.5; k += 1
ttf = word("teachers", "found")
S.note(TIMP, ttf, 0.5, 38, 115)
tp = word("pres", "Thief.")
for p in (24, 36, 43): S.note(BRASS, tp, 1.2, p + 12, 127)
S.note(TUBA, tp, 1.2, 24, 127); S.note(TIMP, tp, 1.0, 31, 127); S.note(DRUM, tp, 1.5, 49, 120)

# F: office suspense (office): ticking clock (woodblock) + low pad
F0, F1 = sh("office"), sh("dad")
t = F0 + 0.2; k = 0
while t < F1:
    S.note(DRUM, t, 0.04, 76 if k % 2 == 0 else 77, 56); t += 0.5; k += 1
for p in (45, 52): S.note(STR, F0 + 0.2, F1 - F0, p, 50)

# G: warm resolve (dad)
G0, G1 = sh("dad"), sh("silence")
for i, (root, tri) in enumerate([(48, [64, 67, 72]), (53, [65, 69, 72]), (55, [67, 71, 74]), (48, [64, 67, 72])]):
    t0 = G0 + i * (G1 - G0) / 4; d = (G1 - G0) / 4
    for p in tri: S.note(STR, t0, d, p - 12, 70)
    S.note(BASS, t0, d, root - 12, 72)
    for k in range(4): S.note(MAR, t0 + k * d / 4, 0.3, tri[k % 3] + 12, 60)

# H: silence (music drops out) -> I: twist (sneaky sting)
I0 = sh("twist")
t = I0 + 0.3; k = 0; sn2 = [69, 72, 76, 75, 74, 72, 71, 72]
while t < END_ - 1.0:
    S.note(PIZZ, t, 0.15, sn2[k % 8] - 12, 64); 
    if k % 2 == 0: S.note(BSN, t, 0.2, 45, 70)
    t += 0.3; k += 1
t_less = word("twist", "lesson.")
for i, p in enumerate([84, 83, 82, 81]): S.note(CEL, t_less - 0.3 + i * 0.12, 0.3, p, 80)
S.note(CLAR, t_less + 0.3, 0.9, 69, 90); S.note(BSN, t_less + 0.3, 0.9, 45, 90)
S.save(B / "music.mid")

# ---------------- SFX stem rendered from GM sounds: gasp-stings, phone ring, door slam
X = Score(); X.prog(0, 124, vol=110)  # telephone ring
X.prog(1, 47, vol=120)                 # timpani as door slam
for ch in range(16): X.cc(ch, 0, 11, 120)
for k in range(3): X.note(0, word("office", "called") + 0.1 + k * 0.45, 0.35, 72, 100)
X.note(1, word("burst", "burst") - 0.1, 0.4, 36, 127)
X.save(B / "bells.mid")
for name in ("music", "bells"):
    subprocess.run(["fluidsynth", "-ni", "-q", "-g", "0.7", "-r", "48000", "-F", str(B / f"{name}.wav"), SF2, str(B / f"{name}.mid")], check=True)
print("rendered music.wav + bells.wav, duration", END)

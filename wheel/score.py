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
# whimsical oom-pah march in F: tuba on 1/3, pizz chords on 2/4, xylophone tune; runs hook -> sundial
prog_ = [(41, [57, 60, 65]), (46, [58, 62, 65]), (48, [60, 64, 67]), (41, [57, 60, 65])]
tune = [(0, .5, 77), (.5, .5, 76), (1, .5, 74), (1.5, .5, 72), (2, 1, 69), (3, 1, 72), (4, .5, 74), (4.5, .5, 72), (5, .5, 70), (5.5, .5, 69), (6, 2, 67),
        (8, .5, 72), (8.5, .5, 74), (9, .5, 76), (9.5, .5, 77), (10, 1, 79), (11, 1, 76), (12, .5, 77), (12.5, .5, 76), (13, .5, 74), (13.5, .5, 72), (14, 2, 77)]
A0, A1 = 0.0, sh("twist")
t = A0; bar = 0
while t < A1:
    root, tri = prog_[bar % 4]
    for b in range(4):
        tb = t + b * bt
        if tb >= A1: break
        if b % 2 == 0: S.note(TUBA, tb, bt * 0.6, root - 12, 92)
        else:
            for p in tri: S.note(PIZZ, tb, bt * 0.4, p - 12, 60)
        S.note(DRUM, tb, 0.05, 76 if b % 2 else 77, 30)
    for b, d, p in tune:
        if (bar % 4) * 4 <= b < (bar % 4 + 1) * 4:
            tk = t + (b - (bar % 4) * 4) * bt
            if tk < A1: S.note(XYL if bar % 8 < 4 else FLUTE, tk, d * bt * 0.9, p, 72)
    t += 4 * bt; bar += 1
# stings: flash on the rule, a "boing" stop of the stone, porters' strain, canal glissando, stairs climb
for i, p in enumerate([72, 76, 79, 84]): S.note(XYL, sh("rule") + i * 0.05, 0.25, p, 100)
S.note(TIMP, word("rule", "invented"), 0.5, 41, 120); S.note(BSN, word("rule", "invented") + 0.1, 0.5, 41, 100)
for i in range(6): S.note(BSN, sh("porters") + 0.3 + i * 0.45, 0.4, 41 - (i % 2) * 2, 80)
for i, p in enumerate(range(60, 84, 3)): S.note(FLUTE, sh("canal") + i * 0.06, 0.2, p, 70)
for i in range(10): S.note(PIZZ, sh("stairs") + i * 0.28, 0.2, 48 + i, 70 + i * 3)
# skyline spectacle: brass + choir swell, timpani roll
K0, K1 = sh("skyline"), sh("sundial")
S.swell(CHOIR, K0, K1, 50, 120); S.swell(STR, K0, K1, 60, 120)
for p in (53, 57, 60, 65): S.note(CHOIR, K0, K1 - K0, p, 80); S.note(STR, K0, K1 - K0, p, 78)
for p in (41, 48, 53): S.note(BRASS, K0 + 0.2, K1 - K0 - 0.2, p + 12, 96)
for i in range(30): S.note(TIMP, K0 + i * 0.06, 0.08, 41, 50 + i * 2)
S.note(TIMP, K0 + 1.9, 1.0, 41, 124); S.note(DRUM, K0 + 1.9, 1.4, 49, 110)
# twist: rally chant drums, then the wheel rolls away (descending xylophone) -> comic tuba
T0 = sh("twist"); tout = word("twist", "out.")
t = T0; k = 0
while t < tout:
    S.note(DRUM, t, 0.05, 36, 80 if k % 2 == 0 else 60); S.note(DRUM, t + bt / 2, 0.05, 38, 60); t += bt; k += 1
for i, p in enumerate(range(84, 60, -2)): S.note(XYL, tout + i * 0.09, 0.15, p, 90)
S.note(TUBA, tout + 1.2, 0.3, 36, 110); S.note(TUBA, tout + 1.5, 0.6, 29, 110)
# loop: warm return of the tune, unresolved (ends on the dominant so it flows into the start)
L0 = sh("loop")
for i, (b, d, p) in enumerate(tune[:8]): S.note(FLUTE, L0 + 0.2 + b * bt, d * bt * 0.9, p, 70)
for p in (60, 64, 67): S.note(STR, L0, END - L0, p - 12, 70)
S.note(TUBA, L0, END - L0, 36, 80)
S.save(B / "music.mid")
X = Score(); X.prog(0, 115, vol=100)  # woodblock-ish for the stone stop
for ch in range(16): X.cc(ch, 0, 11, 120)
X.note(0, word("rule", "invented"), 0.2, 60, 120)
X.save(B / "bells.mid")
for name in ("music", "bells"):
    subprocess.run(["fluidsynth", "-ni", "-q", "-g", "0.7", "-r", "48000", "-F", str(B / f"{name}.wav"), SF2, str(B / f"{name}.mid")], check=True)
print("rendered music.wav + bells.wav, duration", END)

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
# HOOK: mysterious low pad + celesta, then the march kicks in at the setup
H0, H1 = sh("hook"), sh("setup")
for p in (41, 48, 53): S.note(STR, H0, H1 - H0 + 0.2, p, 60)
for i, p in enumerate([77, 80, 84, 80, 77]): S.note(CEL, H0 + 0.2 + i * 0.42, 0.4, p, 60)
S.note(TIMP, word("hook", "illegal"), 0.6, 36, 100)
prog_ = [(41, [57, 60, 65]), (46, [58, 62, 65]), (48, [60, 64, 67]), (41, [57, 60, 65])]
tune = [(0, .5, 77), (.5, .5, 76), (1, .5, 74), (1.5, .5, 72), (2, 1, 69), (3, 1, 72), (4, .5, 74), (4.5, .5, 72), (5, .5, 70), (5.5, .5, 69), (6, 2, 67),
        (8, .5, 72), (8.5, .5, 74), (9, .5, 76), (9.5, .5, 77), (10, 1, 79), (11, 1, 76), (12, .5, 77), (12.5, .5, 76), (13, .5, 74), (13.5, .5, 72), (14, 2, 77)]
def march(A0, A1, lead=XYL, vel=72):
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
                if tk < A1: S.note(lead, tk, d * bt * 0.9, p, vel)
        t += 4 * bt; bar += 1
# SETUP: porters' oom-pah march (heavy)
march(sh("setup"), sh("shed"), XYL, 70)
# SHED: hammer taps, then a bright "discovery" chord + rising glissando as the wheel rolls
S0 = sh("shed"); to = word("shed", "one.")
for i in range(int((to - S0) / 0.31)): S.note(DRUM, S0 + i * 0.31, 0.05, 76, 70)
for i, p in enumerate(range(65, 89, 2)): S.note(CEL, to - 0.3 + i * 0.04, 0.3, p, 80)
for p in (53, 57, 60, 65, 69): S.note(CHOIR, to, 1.3, p, 85); S.note(STR, to, 1.3, p, 75)
# CART: same march, light and fast, flute lead (the kid's joy)
march(sh("cart"), sh("guild"), FLUTE, 78)
S.note(BSN, word("cart", "ten"), 0.4, 41, 100); S.note(TUBA, word("cart", "kid."), 0.6, 29, 110)
for i in range(5): S.note(DRUM, word("cart", "kid.") + 0.1 + i * 0.06, 0.05, 38, 90)
# GUILD: angry minor drums + low brass stabs; tension string tremolo; reward sting
G0, G1 = sh("guild"), sh("chase")
t = G0; k = 0
while t < G1:
    S.note(DRUM, t, 0.05, 36, 90 if k % 2 == 0 else 70); S.note(DRUM, t + bt / 2, 0.05, 38, 70); t += bt; k += 1
for p in (41, 44, 48): S.note(TREM, G0, G1 - G0, p, 80)
S.swell(TREM, G0, G1, 70, 120)
for tt in (word("guild", "jobs."), word("guild", "price"), word("guild", "head.")):
    for p in (29, 41, 44): S.note(BRASS, tt, 0.5, p + 12, 115)
    S.note(TIMP, tt, 0.6, 29, 120)
# CHASE + CRASH: galloping 6/8 strings and brass, building, big crash hit on "window."
C0, C1 = sh("chase"), sh("twist")
t = C0; k = 0
while t < C1:
    S.note(STR, t, 0.12, [53, 53, 57, 60, 57, 53][k % 6], 90); S.note(BASS, t, 0.12, 29 if k % 3 == 0 else 36, 85); t += 0.16; k += 1
S.swell(STR, C0, C1, 80, 125)
for p in (65, 69, 72): S.note(BRASS, word("chase", "rolled."), 1.0, p, 115)
tw = word("crash", "window.")
S.note(TIMP, tw, 1.0, 29, 127); S.note(DRUM, tw, 1.6, 49, 127); S.note(DRUM, tw + 0.05, 1.2, 57, 120)
for i, p in enumerate(range(96, 72, -3)): S.note(CEL, tw + i * 0.03, 0.2, p, 100)
# TWIST: comic silence-beat, then a sly smug theme; ends unresolved into the loop
T0 = sh("twist"); tb = word("twist", "bought"); tn = word("twist", "Now")
S.note(BSN, T0 + 0.2, 0.3, 41, 90); S.note(BSN, T0 + 0.6, 0.3, 44, 90)
for i, p in enumerate([72, 76, 79, 84]): S.note(XYL, tb + i * 0.05, 0.25, p, 100)
march(tn, sh("loop"), CLAR, 70)
L0 = sh("loop")
for p in (41, 48, 53): S.note(STR, L0, END - L0 + 0.5, p, 60)
for i, p in enumerate([77, 80, 84]): S.note(CEL, L0 + 0.15 + i * 0.42, 0.4, p, 60)
S.save(B / "music.mid")
X = Score(); X.prog(0, 115, vol=110); X.prog(1, 47, vol=127)
for ch in range(16): X.cc(ch, 0, 11, 120)
X.note(1, word("crash", "window."), 0.4, 36, 127)
X.save(B / "bells.mid")
for name in ("music", "bells"):
    subprocess.run(["fluidsynth", "-ni", "-q", "-g", "0.7", "-r", "48000", "-F", str(B / f"{name}.wav"), SF2, str(B / f"{name}.mid")], check=True)
print("rendered music.wav + bells.wav, duration", END)

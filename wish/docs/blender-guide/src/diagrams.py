"""Generates the two to-scale SVG diagrams for the guide from the real scene numbers (Blender coordinates)."""
from pathlib import Path
D = Path(__file__).parent
# ---------- top-down plan: Blender X right, Y up (towards the stone), 50 px per metre
X0, X1, Y0, Y1, K = -4.5, 4.5, -6.3, 6.0, 50
sx = lambda x: round((x - X0) * K, 1); sy = lambda y: round((Y1 - y) * K, 1)
W, H = sx(X1), sy(Y0)
o = [f'<svg viewBox="0 0 {W} {H}" class="dg plan" role="img" aria-label="Top-down plan of the cemetery set with Max\'s path and the five camera positions">']
o.append(f'<rect x="0" y="0" width="{W}" height="{H}" class="d-ground"/>')
for m in range(-4, 5):  # metre grid
    o.append(f'<line x1="{sx(m)}" y1="0" x2="{sx(m)}" y2="{H}" class="d-grid"/>')
for m in range(-6, 7):
    o.append(f'<line x1="0" y1="{sy(m)}" x2="{W}" y2="{sy(m)}" class="d-grid"/>')
o.append(f'<line x1="{sx(-4.5)}" y1="{sy(-3.2)}" x2="{sx(-1.2)}" y2="{sy(-3.2)}" class="d-fence"/><line x1="{sx(1.2)}" y1="{sy(-3.2)}" x2="{sx(4.5)}" y2="{sy(-3.2)}" class="d-fence"/>')
for x in (-1.3, 1.3): o.append(f'<rect x="{sx(x)-7}" y="{sy(-3.2)-7}" width="14" height="14" class="d-stone"/>')
o.append(f'<text x="{sx(2.9)}" y="{sy(-3.2)+22}" class="d-lab" text-anchor="middle">iron fence, y = −3.2</text>')
for r in range(2):
    for c in range(7):
        x, y = -6 + c * 2.0 + (r % 2) * 0.6, 2 + r * 2.6
        if abs(x - 0.2) < 1 and r == 1: continue
        if X0 < x < X1: o.append(f'<rect x="{sx(x-0.35)}" y="{sy(y)-5}" width="{0.7*K}" height="9" rx="3" class="d-stone"/>')
o.append(f'<rect x="{sx(0.2-0.55)}" y="{sy(4.6)-6}" width="{1.1*K}" height="11" rx="3" class="d-hero"/><text x="{sx(0.2)}" y="{sy(4.6)-14}" class="d-lab b" text-anchor="middle">MAX\'S STONE (0.2, 4.6)</text>')
# paths
o.append(f'<polyline points="{sx(-1)},{sy(-4.6)} {sx(-1)},{sy(1.0)}" class="d-path a"/><polyline points="{sx(-1)},{sy(1.2)} {sx(0.2)},{sy(3.45)}" class="d-path b"/>')
o.append(f'<circle cx="{sx(0.2)}" cy="{sy(3.45)}" r="7" class="d-max"/><text x="{sx(0.2)-12}" y="{sy(3.45)+5}" class="d-lab" text-anchor="end">kneel (0.2, 3.45)</text>')
o.append(f'<circle cx="{sx(-1)}" cy="{sy(-4.6)}" r="5" class="d-max"/><text x="{sx(-1)-10}" y="{sy(-4.6)+4}" class="d-lab" text-anchor="end">Max starts (−1, −4.6)</text>')
o.append(f'<circle cx="{sx(1.2)}" cy="{sy(3.6)}" r="6" class="d-dog"/><text x="{sx(1.2)+10}" y="{sy(3.6)-8}" class="d-lab">Icey sits</text>')
o.append(f'<line x1="{sx(-1)}" y1="{sy(-2.6)}" x2="{sx(-1)}" y2="{sy(2.6)}" class="d-dogpath"/>')
cams = [("A", (1.6, -5.65), (1.6, -3.5), (-1.2, -1.65), "cam-a"), ("B", (3.1, 3.5), (2.6, 3.85), (0.2, 4.0), "cam-b"),
        ("C1", (1.6, 3.9), (1.6, 3.9), (0.2, 3.45), "cam-c"), ("C2", (1.4, 2.7), (1.3, 2.85), (0.2, 4.6), "cam-c"), ("C3", (1.15, 3.15), (1.05, 3.3), (0.2, 4.6), "cam-c")]
for n, p0, p1, l, cl in cams:
    o.append(f'<line x1="{sx(p1[0])}" y1="{sy(p1[1])}" x2="{sx(l[0])}" y2="{sy(l[1])}" class="d-look {cl}"/>')
    if p0 != p1: o.append(f'<line x1="{sx(p0[0])}" y1="{sy(p0[1])}" x2="{sx(p1[0])}" y2="{sy(p1[1])}" class="d-move {cl}" marker-end="url(#arr)"/>')
    o.append(f'<rect x="{sx(p0[0])-9}" y="{sy(p0[1])-7}" width="18" height="14" rx="3" class="d-cam {cl}"/>')
    dx = {"C1": 14, "C2": 14, "C3": 14, "A": 14, "B": 14}[n]; dy = {"C1": -8, "C2": 14, "C3": 4, "A": 4, "B": -8}[n]
    o.append(f'<text x="{sx(p0[0])+dx}" y="{sy(p0[1])+dy}" class="d-lab b">{n}</text>')
o.append(f'<text x="{W-8}" y="{H-10}" class="d-lab" text-anchor="end">grid = 1 m · Blender top view (numpad 7)</text>')
o.insert(1, '<defs><marker id="arr" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0,0 L10,5 L0,10 z" class="d-arrow"/></marker></defs>')
o.append('</svg>'); (D / "plan.svg").write_text("\n".join(o))

# ---------- timeline: frames 1..237 at 3.6 px/frame
F0, F1, P, L = 1, 237, 3.6, 40
fx = lambda f: round(L + (f - F0) * P, 1); TW = fx(F1) + 30
t = [f'<svg viewBox="0 0 {TW} 250" class="dg tl" role="img" aria-label="Frame timeline of the Grave Reveal: shots, words and key animation events">']
shots = [("A · Follow", 1, 38, "cam-a"), ("B · Kneel & cry", 39, 142, "cam-b"), ("C1 · Look up", 143, 165, "cam-c"), ("C2 · Stone", 166, 205, "cam-c"), ("C3 · Mine", 206, 237, "cam-c")]
t.append(f'<text x="0" y="30" class="d-lab b">SHOTS</text>')
for n, a, b, cl in shots:
    t.append(f'<rect x="{fx(a)}" y="14" width="{fx(b+1)-fx(a)-2}" height="26" rx="4" class="d-shot {cl}"/><text x="{fx(a)+6}" y="32" class="d-lab on">{n}</text>')
words = [("So", 7), ("I", 13), ("followed", 16), ("him.", 22), ("We", 41), ("reached", 45), ("the", 52), ("grave,", 58), ("and", 70), ("before", 72), ("I", 78), ("could", 82), ("even", 84), ("read", 88), ("it,", 93), ("I", 103), ("broke", 105), ("down", 112), ("crying.", 121), ("Then", 145), ("I", 149), ("looked", 153), ("up.", 156), ("And", 171), ("the", 173), ("name", 177), ("on", 182), ("the", 188), ("stone,", 191), ("was", 200), ("mine.", 208)]
t.append(f'<text x="0" y="78" class="d-lab b">WORDS</text>')
for i, (w, f) in enumerate(words):
    y = 66 if i % 2 == 0 else 92
    t.append(f'<line x1="{fx(f)}" y1="{y+4}" x2="{fx(f)}" y2="108" class="d-tick"/><text x="{fx(f)+2}" y="{y}" class="d-word">{w}</text>')
ev = [("Max walks to the grave", 29, 63), ("kneels", 80, 87), ("tears on", 102, 108), ("head down, shaking", 108, 150), ("head lifts, eyes wide", 150, 174), ("engraving fades in", 171, 203), ("white flash + impact", 206, 212)]
t.append(f'<text x="0" y="140" class="d-lab b">ACTION</text>')
for i, (n, a, b) in enumerate(ev):
    y = 128 + (i % 3) * 30
    t.append(f'<rect x="{fx(a)}" y="{y}" width="{max(fx(b)-fx(a), 5)}" height="10" rx="5" class="d-ev"/><text x="{fx(a)}" y="{y+24}" class="d-lab">{n} <tspan class="d-dim">{a}–{b}</tspan></text>')
for f in range(10, 240, 10):
    t.append(f'<line x1="{fx(f)}" y1="222" x2="{fx(f)}" y2="{228 if f % 30 else 232}" class="d-tick"/>' + (f'<text x="{fx(f)}" y="246" class="d-dim" text-anchor="middle">{f}</text>' if f % 30 == 0 else ""))
t.append(f'<line x1="{fx(1)}" y1="222" x2="{fx(237)}" y2="222" class="d-tick"/><text x="0" y="246" class="d-dim">frame</text>')
t.append('</svg>'); (D / "timeline.svg").write_text("\n".join(t))
print("ok")

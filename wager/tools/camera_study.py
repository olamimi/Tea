"""Measure camera motion per frame: global zoom %/s, pan px/s (at 720 wide), rotation deg/s, and cuts.
Usage: python3 camera_study.py video.mp4  -> prints a summary + per-second table
Method: ORB features + RANSAC similarity transform between consecutive frames (downscaled to 360x640).
"""
import sys, cv2, numpy as np
cap = cv2.VideoCapture(sys.argv[1]); fps = 30
orb = cv2.ORB_create(1500); prev = None; pk = pd = None; rows = []; cuts = []
i = 0
while True:
    ok, f = cap.read()
    if not ok: break
    g = cv2.cvtColor(cv2.resize(f, (360, 640)), cv2.COLOR_BGR2GRAY)
    k, d = orb.detectAndCompute(g, None)
    z = px = rot = np.nan; cut = False
    if prev is not None:
        hd = np.abs(cv2.calcHist([g], [0], None, [32], [0, 256]) - cv2.calcHist([prev], [0], None, [32], [0, 256])).sum() / g.size
        if pd is not None and d is not None and len(k) > 30 and len(pk) > 30:
            m = cv2.BFMatcher(cv2.NORM_HAMMING, crossCheck=True).match(pd, d)
            if len(m) > 25:
                a = np.float32([pk[x.queryIdx].pt for x in m]); b = np.float32([k[x.trainIdx].pt for x in m])
                M, inl = cv2.estimateAffinePartial2D(a, b, method=cv2.RANSAC, ransacReprojThreshold=2.0)
                if M is not None and inl.sum() > 15:
                    s = np.hypot(M[0, 0], M[1, 0]); z = (s - 1) * 100 * fps; rot = np.degrees(np.arctan2(M[1, 0], M[0, 0])) * fps
                    px = np.hypot(M[0, 2], M[1, 2]) * 2 * fps  # scale 360->720
                elif hd > 0.5: cut = True
            elif hd > 0.5: cut = True
        elif hd > 0.5: cut = True
    if cut: cuts.append(i / fps)
    rows.append((z, px, rot)); prev, pk, pd = g, k, d; i += 1
R = np.array(rows, float)
def stat(col, f=np.nanmedian): v = np.abs(R[:, col]); return f(v)
print(f"frames {i}  duration {i/fps:.1f}s  cuts {len(cuts)} -> one per {i/fps/max(1,len(cuts)):.1f}s")
print(f"|zoom| %/s median {stat(0):.1f}  p90 {np.nanpercentile(np.abs(R[:,0]),90):.1f}  max {np.nanmax(np.abs(R[:,0])):.0f}")
print(f"pan px/s median {stat(1):.0f}  p90 {np.nanpercentile(R[:,1],90):.0f}  max {np.nanmax(R[:,1]):.0f}")
print(f"|rotation| deg/s median {stat(2):.2f}  p90 {np.nanpercentile(np.abs(R[:,2]),90):.2f}")
still = np.nanmean((np.abs(R[:, 0]) < 1.0) & (R[:, 1] < 6))
print(f"near-still frames (zoom<1%/s and pan<6px/s): {still*100:.0f}%")
print("per-second zoom %/s:", [int(np.nanmean(R[s:s+30, 0])) if np.isfinite(np.nanmean(R[s:s+30, 0])) else None for s in range(0, i, 30)])
print("cut times:", [round(c, 1) for c in cuts][:40])

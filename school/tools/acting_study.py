"""Character-animation energy with camera motion removed.
For each frame pair: fit a global similarity transform (camera), warp the previous frame onto the current one,
then measure the residual motion with dense optical flow -> that is the characters (and FX) moving.
Prints: share of frames with real character motion, typical residual speed, burstiness (how often big poses happen),
and a per-second table.  Usage: python3 acting_study.py video.mp4
"""
import sys, cv2, numpy as np
cap = cv2.VideoCapture(sys.argv[1]); orb = cv2.ORB_create(1500); prev = None; pk = pd = None
res, big = [], []
while True:
    ok, f = cap.read()
    if not ok: break
    g = cv2.cvtColor(cv2.resize(f, (270, 480)), cv2.COLOR_BGR2GRAY)
    k, d = orb.detectAndCompute(g, None); r = np.nan
    if prev is not None and pd is not None and d is not None and len(k) > 30:
        m = cv2.BFMatcher(cv2.NORM_HAMMING, crossCheck=True).match(pd, d)
        if len(m) > 25:
            a = np.float32([pk[x.queryIdx].pt for x in m]); b = np.float32([k[x.trainIdx].pt for x in m])
            M, inl = cv2.estimateAffinePartial2D(a, b, method=cv2.RANSAC, ransacReprojThreshold=1.5)
            if M is not None and inl.sum() > 15 and abs(np.hypot(M[0, 0], M[1, 0]) - 1) < 0.08 and np.hypot(M[0, 2], M[1, 2]) < 25:
                w = cv2.warpAffine(prev, M, (270, 480), borderMode=cv2.BORDER_REPLICATE)
                fl = cv2.calcOpticalFlowFarneback(w, g, None, 0.5, 3, 15, 3, 5, 1.2, 0)
                mag = np.hypot(fl[..., 0], fl[..., 1])[8:-8, 8:-8]
                r = float(np.mean(mag > 0.6))          # fraction of the frame moving on its own
                big.append(float(np.percentile(mag, 99.5)))  # strongest local motion (limbs, heads)
    res.append(r); prev, pk, pd = g, k, d
R = np.array(res); B = np.array(big); n = len(R)
v = R[np.isfinite(R)]
print(f"frames {n}  measurable {len(v)}")
print(f"character-motion area: median {np.median(v)*100:.1f}% of frame, p90 {np.percentile(v,90)*100:.1f}%")
print(f"frames with visible acting (>1% of frame moving): {np.mean(v>0.01)*100:.0f}%   (>4%): {np.mean(v>0.04)*100:.0f}%")
print(f"strongest local motion px/frame (at 270 wide): median {np.median(B):.2f}  p90 {np.percentile(B,90):.2f}")
print("per-second acting area %:", [round(float(np.nanmean(R[s:s+30]))*100, 1) if np.isfinite(np.nanmean(R[s:s+30])) else None for s in range(0, n, 30)])

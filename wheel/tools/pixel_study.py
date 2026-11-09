"""Full-resolution, every-frame pixel study of world & lighting in a reference video.
Usage: python3 pixel_study.py video.mp4 out.json
"""
import sys, json, subprocess, numpy as np
src, out = sys.argv[1], sys.argv[2]
W, H = 720, 1280
p = subprocess.Popen(['ffmpeg', '-v', 'error', '-i', src, '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-'], stdout=subprocess.PIPE)
yy, xx = np.mgrid[0:H, 0:W]; rad = np.sqrt(((xx - W / 2) / (W / 2)) ** 2 + ((yy - H / 2) / (H / 2)) ** 2) / np.sqrt(2)
rbin = np.minimum((rad * 20).astype(int), 19)
GX, GY = 6, 10
hue_h = np.zeros(36); luma_h = np.zeros(256); sat_h = np.zeros(20)
rad_sum = np.zeros(20); rad_n = np.bincount(rbin.ravel(), minlength=20)
row_rgb = np.zeros((H // 32, 3)); sharp = np.zeros((GY, GX)); n = 0
per = []; shadow_rgb = np.zeros(3); hi_rgb = np.zeros(3); mid_rgb = np.zeros(3)
grain = []; prev = None; repeats = 0
while True:
    b = p.stdout.read(W * H * 3)
    if len(b) < W * H * 3: break
    f = np.frombuffer(b, np.uint8).reshape(H, W, 3).astype(np.float32)
    r, g, bl = f[..., 0], f[..., 1], f[..., 2]
    mx = f.max(-1); mn = f.min(-1); d = mx - mn
    sat = np.where(mx > 0, d / np.maximum(mx, 1), 0); luma = 0.299 * r + 0.587 * g + 0.114 * bl
    hue = np.zeros_like(mx); m = d > 0
    rc = np.where(m, (mx - r) / np.maximum(d, 1e-6), 0); gc = np.where(m, (mx - g) / np.maximum(d, 1e-6), 0); bc = np.where(m, (mx - bl) / np.maximum(d, 1e-6), 0)
    hue = np.where(mx == r, bc - gc, np.where(mx == g, 2 + rc - bc, 4 + gc - rc)); hue = (hue / 6.0) % 1.0
    col = (sat > 0.15) & (luma > 25)
    hue_h += np.bincount((hue[col] * 36).astype(int) % 36, minlength=36)
    luma_h += np.bincount(np.clip(luma, 0, 255).astype(int).ravel(), minlength=256)
    sat_h += np.bincount(np.minimum((sat * 20).astype(int), 19).ravel(), minlength=20)
    rad_sum += np.bincount(rbin.ravel(), weights=luma.ravel(), minlength=20)
    row_rgb += f.reshape(H // 32, 32, W, 3).mean((1, 2))
    lap = np.abs(4 * luma[1:-1, 1:-1] - luma[:-2, 1:-1] - luma[2:, 1:-1] - luma[1:-1, :-2] - luma[1:-1, 2:])
    lap = np.pad(lap, 1); sharp += lap.reshape(GY, H // GY, GX, W // GX).mean((1, 3))
    q = np.percentile(luma, [15, 50, 90])
    shadow_rgb += f[luma <= q[0]].mean(0); hi_rgb += f[luma >= q[2]].mean(0); mid_rgb += f[(luma > q[0]) & (luma < q[2])].mean(0)
    # grain: high-pass std where the local image is flat
    hp = luma[1:-1, 1:-1] - (luma[:-2, 1:-1] + luma[2:, 1:-1] + luma[1:-1, :-2] + luma[1:-1, 2:]) / 4
    flat = lap[1:-1, 1:-1] < 6
    if flat.sum() > 5000: grain.append(float(hp[flat].std()))
    if prev is not None and np.abs(f - prev).mean() < 0.4: repeats += 1
    prev = f
    per.append({'luma': float(luma.mean()), 'sat': float(sat.mean()), 'rb': float((r - bl).mean()), 'g': float(g.mean() - (r.mean() + bl.mean()) / 2),
                'hi': float((luma > 235).mean()), 'dark': float((luma < 40).mean()), 'contrast': float(q[2] - q[0])})
    n += 1
res = {'frames': n, 'repeats': repeats,
       'hue_hist': (hue_h / hue_h.sum()).round(4).tolist(), 'luma_hist': (luma_h / luma_h.sum()).round(5).tolist(), 'sat_hist': (sat_h / sat_h.sum()).round(4).tolist(),
       'radial_luma': (rad_sum / rad_n / n).round(1).tolist(), 'row_rgb': (row_rgb / n).round(1).tolist(), 'sharp_grid': (sharp / n).round(2).tolist(),
       'shadow_rgb': (shadow_rgb / n).round(1).tolist(), 'mid_rgb': (mid_rgb / n).round(1).tolist(), 'hi_rgb': (hi_rgb / n).round(1).tolist(),
       'grain_std': round(float(np.median(grain)), 2) if grain else None, 'per_frame': per}
json.dump(res, open(out, 'w'))
print(out, n, 'frames')

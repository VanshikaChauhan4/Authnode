#!/usr/bin/env python3
"""
Renders the three seamless-loop background videos used by the landing-page
scroll hero (src/components/ui/scroll-triggered-video-hero.jsx).

  trust-layer.mp4   - light fibres converging into a glowing credential seal
  ledger-chain.mp4  - a 3D chain of linked blocks flying past the camera
  verification.mp4  - a certificate being scanned, hashed and verified

Requires: python3, numpy, opencv-python, ffmpeg on PATH.
Usage:    python scripts/render-hero-videos.py [trust|ledger|verify|all] [--quick]
"""
import math, os, subprocess, sys
import numpy as np
import cv2

W, H, FPS, SECONDS = 1280, 720, 24, 8
N = FPS * SECONDS
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "public", "videos")
TAU = math.tau

yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
_noise = (np.random.default_rng(1).normal(0, 1.0, (H, W, 1)) / 255.0).astype(np.float32)
_vig = (1.0 - 0.55 * np.clip(((xx - W / 2) / (W * 0.75)) ** 2 + ((yy - H / 2) / (H * 0.85)) ** 2, 0, 1))[..., None]

def bgr(r, g, b):
    return np.array([b, g, r], np.float32)

def lerp(a, b, t):
    return a + (b - a) * t

def smooth(a, b, x):
    t = min(1.0, max(0.0, (x - a) / (b - a)))
    return t * t * (3 - 2 * t)

def blur(img, sigma):
    scale = max(1, int(sigma // 5))
    if scale > 1:
        small = cv2.resize(img, (W // scale, H // scale), interpolation=cv2.INTER_AREA)
        small = cv2.GaussianBlur(small, (0, 0), sigma / scale)
        return cv2.resize(small, (W, H), interpolation=cv2.INTER_LINEAR)
    return cv2.GaussianBlur(img, (0, 0), sigma)

def glow(layer_u8, weights=(0.9, 0.9, 0.7), sigmas=(2.0, 8.0, 30.0)):
    f = layer_u8.astype(np.float32) / 255.0
    out = f.copy()
    for w, s in zip(weights, sigmas):
        out += w * blur(f, s)
    return out, f

def radial(cx, cy, r, color, amp):
    g = np.exp(-(((xx - cx) ** 2 + (yy - cy) ** 2) / (r * r))) * amp
    return g[..., None] * (color[None, None, :] / 255.0)

def finish(f):
    f = 1.0 - np.exp(-1.35 * f)          # soft highlight roll-off
    f = f * _vig + _noise
    return (np.clip(f, 0, 1) * 255).astype(np.uint8)

def base_bg(*glows):
    bg = np.zeros((H, W, 3), np.float32) + bgr(3, 6, 16)[None, None, :] / 255.0
    for g in glows:
        bg += radial(*g)
    return bg

# ---------------------------------------------------------------- scene 1 --
def scene_trust():
    rng = np.random.default_rng(7)
    F = (0.80 * W, 0.50 * H)
    bg = base_bg((F[0], F[1], 330, bgr(110, 60, 255), 0.30),
                 (F[0], F[1], 120, bgr(190, 150, 255), 0.30),
                 (0.25 * W, 0.5 * H, 520, bgr(40, 30, 140), 0.10))
    strands = []
    for i in range(330):
        u = float(np.clip(rng.normal(0, 0.55), -1.35, 1.35))
        strands.append(dict(
            outgoing=False,
            x0=-0.15 * W - rng.uniform(0, 0.12) * W,
            y0=F[1] + u * H * 0.62,
            amp=rng.uniform(4, 22) * (0.4 + abs(u)),
            freq=int(rng.integers(1, 4)), ph=rng.uniform(0, TAU),
            base=rng.uniform(0.10, 0.34), th=int(rng.choice([1, 1, 1, 2])),
            pulses=[(rng.uniform(0, 1), int(rng.integers(1, 3)), rng.uniform(0.05, 0.13))
                    for _ in range(int(rng.integers(1, 3)))],
            tint=rng.uniform(0, 1)))
    for i in range(70):
        v = float(np.clip(rng.normal(0, 0.6), -1.4, 1.4))
        strands.append(dict(
            outgoing=True, x1=W + 80, y1=F[1] + v * H * 0.55,
            amp=rng.uniform(2, 10), freq=int(rng.integers(1, 3)), ph=rng.uniform(0, TAU),
            base=rng.uniform(0.08, 0.26), th=1,
            pulses=[(rng.uniform(0, 1), int(rng.integers(1, 3)), rng.uniform(0.05, 0.12))],
            tint=rng.uniform(0, 1)))

    M = 52
    S = np.linspace(0, 1, M + 1)
    deep, lilac, white = bgr(70, 45, 215), bgr(185, 150, 255), bgr(255, 240, 255)
    cyan = bgr(80, 190, 255)

    def render(t):
        layer = np.zeros((H, W, 3), np.uint8)
        for st in strands:
            if not st["outgoing"]:
                x = st["x0"] + (F[0] - st["x0"]) * S
                conv = (1 - S) ** 1.8
                y = F[1] + (st["y0"] - F[1]) * conv + st["amp"] * (1 - S) * np.sin(TAU * (st["freq"] * S + t) + st["ph"])
                gain = 0.55 + 1.0 * S ** 2
            else:
                x = F[0] + (st["x1"] - F[0]) * S
                y = F[1] + (st["y1"] - F[1]) * S ** 1.7 + st["amp"] * S * np.sin(TAU * (st["freq"] * S + t) + st["ph"])
                gain = 1.1 - 0.7 * S
            inten = st["base"] * gain
            for p, k, w in st["pulses"]:
                q = (p + k * t) % 1.0
                d = np.abs(S - q); d = np.minimum(d, 1 - d)
                inten = inten + 1.15 * np.exp(-(d / w) ** 2)
            tint = cyan if st["tint"] > 0.9 else lerp(deep, lilac, st["tint"] * 0.6 + 0.4 * S[:, None])
            tint = np.broadcast_to(tint, (M + 1, 3)) if tint.ndim == 1 else tint
            col = tint * np.clip(inten, 0, 1.6)[:, None] + white * np.clip(inten - 0.9, 0, 1)[:, None]
            col = np.clip(col, 0, 255).astype(np.int32)
            pts = np.stack([x, y], 1).astype(np.int32)
            for j in range(M):
                c = col[j]
                if c.max() < 14:
                    continue
                cv2.line(layer, tuple(pts[j]), tuple(pts[j + 1]), (int(c[0]), int(c[1]), int(c[2])), st["th"], cv2.LINE_AA)
        cx, cy = int(F[0]), int(F[1])
        beat = 0.5 + 0.5 * math.sin(TAU * t)
        # expanding verification pulses (2 per loop)
        for off in (0.0, 0.5):
            ph = (t * 1 + off) % 1.0
            r = int(24 + 260 * ph)
            a = (1 - ph) ** 2
            cv2.circle(layer, (cx, cy), r, tuple(int(v) for v in lilac * a), 1, cv2.LINE_AA)
        for r, speed in ((34, 1), (58, -1)):
            for k in range(12):
                a0 = k * 30 + speed * 30 * t
                cv2.ellipse(layer, (cx, cy), (r, r), 0, a0, a0 + 14, (255, 215, 235), 1, cv2.LINE_AA)
        hexpts = np.array([[cx + 21 * math.cos(math.radians(60 * k + 60 * t + 30)),
                            cy + 21 * math.sin(math.radians(60 * k + 60 * t + 30))] for k in range(6)], np.int32)
        cv2.polylines(layer, [hexpts], True, (255, 235, 250), 1, cv2.LINE_AA)
        cv2.circle(layer, (cx, cy), int(5 + 2 * beat), (255, 250, 255), -1, cv2.LINE_AA)
        out, f = glow(layer)
        # anamorphic lens streak through the seal
        core = np.zeros((H, W, 3), np.float32)
        cv2.circle(core, (cx, cy), 6, (1.0, 0.85, 0.95), -1, cv2.LINE_AA)
        out += (0.5 + 0.25 * beat) * cv2.GaussianBlur(core, (0, 0), sigmaX=110, sigmaY=3)
        out += 0.6 * cv2.GaussianBlur(core, (0, 0), 14)
        return finish(out + bg)
    return render

# ---------------------------------------------------------------- scene 2 --
def scene_ledger():
    P, D, f = 3, 3.2, 880.0
    rng = np.random.default_rng(11)
    bg = base_bg((0.66 * W, 0.45 * H, 420, bgr(90, 50, 230), 0.22),
                 (0.30 * W, 0.80 * H, 400, bgr(30, 80, 170), 0.10))
    hashes = ["0x" + "".join(rng.choice(list("0123456789abcdef"), 8)) for _ in range(P)]
    dust = [(rng.uniform(-9, 11), rng.uniform(-5, 5), rng.uniform(0, P * D), rng.uniform(0.3, 1)) for _ in range(190)]
    violet, lilac, cyan = bgr(150, 95, 255), bgr(215, 190, 255), bgr(90, 205, 255)

    def path(u):
        X = 1.0 + 1.6 * math.sin(0.34 * u + 0.4)
        Y = 0.1 + 0.9 * math.sin(0.27 * u + 1.0)
        return X, Y, 5.0 + D * u

    def proj(p):
        return W / 2 + f * p[0] / p[2], H / 2 - f * p[1] / p[2]

    cube = np.array([[sx, sy, sz] for sx in (-1, 1) for sy in (-1, 1) for sz in (-1, 1)], np.float32)
    edges = [(a, b) for a in range(8) for b in range(a + 1, 8) if np.sum(cube[a] != cube[b]) == 1]
    faces = [(0, 1, 3, 2), (4, 6, 7, 5), (0, 4, 5, 1), (2, 3, 7, 6), (0, 2, 6, 4), (1, 5, 7, 3)]
    light = np.array([0.35, 0.8, -0.5], np.float32); light /= np.linalg.norm(light)

    def rot(th, tilt):
        c, s = math.cos(th), math.sin(th)
        Ry = np.array([[c, 0, s], [0, 1, 0], [-s, 0, c]], np.float32)
        c2, s2 = math.cos(tilt), math.sin(tilt)
        Rx = np.array([[1, 0, 0], [0, c2, -s2], [0, s2, c2]], np.float32)
        return Rx @ Ry

    def render(t):
        layer = np.zeros((H, W, 3), np.uint8)
        shift = P * t
        # floor grid
        gy, G = -3.1, 2.4
        for gx in np.arange(-15, 17, 2.4):
            a, b = proj((gx, gy, 1.6)), proj((gx, gy, 40))
            cv2.line(layer, (int(a[0]), int(a[1])), (int(b[0]), int(b[1])), (60, 20, 34), 1, cv2.LINE_AA)
        for j in range(26):
            z = 1.6 + ((j * G - P * D * t) % 60)
            a, b = proj((-18, gy, z)), proj((20, gy, z))
            k = max(0.0, 1 - z / 48) ** 2.2
            cv2.line(layer, (int(a[0]), int(a[1])), (int(b[0]), int(b[1])), tuple(int(v * k) for v in (100, 34, 60)), 1, cv2.LINE_AA)
        # dust
        for x, y, z0, br in dust:
            for layer_i in range(4):
                z = 1.6 + ((z0 - P * D * t) % (P * D)) + layer_i * P * D
                if z > 40: continue
                sx, sy = proj((x, y, z))
                if 0 <= sx < W and 0 <= sy < H:
                    k = br * max(0.0, 1 - z / 40)
                    cv2.circle(layer, (int(sx), int(sy)), 1, tuple(int(v * k) for v in (235, 190, 255)), -1, cv2.LINE_AA)
        nodes = []
        for k in range(-3, 42):
            u = k - shift
            X, Y, Z = path(u)
            if Z > 4.2: nodes.append((Z, k, u, np.array([X, Y, Z], np.float32)))
        nodes.sort(key=lambda n: -n[0])
        by_k = {n[1]: n for n in nodes}
        for Z, k, u, c in nodes:
            fog = max(0.0, 1 - (Z - 2) / 44) ** 1.4 * smooth(4.2, 10.0, Z)
            nxt = by_k.get(k + 1)
            if nxt is not None:
                a, b = proj(c), proj(nxt[3])
                fk = min(fog, max(0.0, 1 - (nxt[0] - 2) / 44) ** 1.4)
                cv2.line(layer, (int(a[0]), int(a[1])), (int(b[0]), int(b[1])), tuple(int(v * fk) for v in (255, 100, 175)), 2, cv2.LINE_AA)
                fr = (t * P + (k % P) * 0.37) % 1.0
                pz = c + (nxt[3] - c) * fr
                pp = proj(pz)
                cv2.circle(layer, (int(pp[0]), int(pp[1])), max(2, int(150 / pz[2])), tuple(int(v * fk) for v in (255, 245, 255)), -1, cv2.LINE_AA)
            R = rot(0.5 + 0.9 * math.sin(0.4 * u) + (math.pi / 2) * t, -0.38)
            s_out = 0.55
            for scale, rr, col_e, w in ((s_out, R, violet, 2), (0.28, rot(-(math.pi / 2) * t, 0.3), lilac, 1)):
                verts = (cube * scale) @ rr.T + c
                if scale == s_out:
                    for fidx in faces:
                        vs = verts[list(fidx)]
                        n = np.cross(vs[1] - vs[0], vs[2] - vs[0]); n /= np.linalg.norm(n) + 1e-6
                        if np.dot(n, vs.mean(0)) >= 0: continue
                        shade = 0.25 + 0.75 * max(0.0, float(np.dot(-n, light)) * 0.5 + 0.5)
                        poly = np.array([proj(v) for v in vs], np.int32)
                        cv2.fillConvexPoly(layer, poly, tuple(int(v * 0.16 * shade * fog) for v in (255, 90, 170)), cv2.LINE_AA)
                for a, b in edges:
                    pa, pb = proj(verts[a]), proj(verts[b])
                    cv2.line(layer, (int(pa[0]), int(pa[1])), (int(pb[0]), int(pb[1])),
                             tuple(int(v * fog) for v in col_e), w if Z < 22 else 1, cv2.LINE_AA)
            if Z < 26:
                sx, sy = proj(c + np.array([0.85, -0.45, 0], np.float32))
                kk = fog * 0.85
                cv2.putText(layer, hashes[k % P], (int(sx), int(sy)), cv2.FONT_HERSHEY_SIMPLEX,
                            max(0.34, 6.5 / Z), tuple(int(v * kk) for v in (255, 205, 230)), 1, cv2.LINE_AA)
                cv2.putText(layer, "BLOCK", (int(sx), int(sy - 26)), cv2.FONT_HERSHEY_SIMPLEX,
                            max(0.3, 4.0 / Z), tuple(int(v * kk) for v in (200, 105, 130)), 1, cv2.LINE_AA)
        out, _ = glow(layer, (0.8, 0.8, 0.6))
        return finish(out + bg)
    return render

# ---------------------------------------------------------------- scene 3 --
def scene_verify():
    rng = np.random.default_rng(23)
    CX, CY, CW, CH = int(0.70 * W), int(0.50 * H), 480, 340
    bg = base_bg((CX, CY, 360, bgr(100, 55, 240), 0.22),
                 (0.2 * W, 0.2 * H, 420, bgr(35, 30, 130), 0.10))
    cols = 58
    glyphs = np.array(list("0123456789ABCDEF"))
    rain = rng.choice(glyphs, (cols, 40))
    rain_ph = rng.uniform(0, 40, cols); rain_n = rng.integers(1, 3, cols); rain_len = rng.uniform(9, 18, cols)
    qr = rng.random((9, 9)) > 0.5
    violet, lilac = bgr(150, 100, 255), bgr(215, 195, 255)
    emerald = bgr(60, 235, 160)
    card_mask = (1 - 0.88 * np.exp(-(((xx - CX) / (CW * 0.62)) ** 4 + ((yy - CY - 20) / (CH * 0.8)) ** 4)))[..., None].astype(np.float32)
    digest = "9F3A7C21 D84B05E6 C4B71A90 3E5F82DD"

    def render(t):
        layer = np.zeros((H, W, 3), np.uint8)
        # hex rain
        for c in range(cols):
            head = (rain_ph[c] + rain_n[c] * 40 * t) % 40
            px = 12 + c * 22
            wgt = 0.35 + 0.65 * smooth(0.1 * W, 0.7 * W, px)
            for r in range(40):
                d = (head - r) % 40
                if d > rain_len[c]: continue
                a = math.exp(-d / (rain_len[c] / 3.0)) * wgt * 0.8
                if a < 0.06: continue
                colr = (white := (235, 180, 215)) if d < 0.8 else tuple(int(v * a * 0.75) for v in (255, 150, 175))
                cv2.putText(layer, rain[c, r], (px, 18 + r * 18), cv2.FONT_HERSHEY_SIMPLEX, 0.42, colr, 1, cv2.LINE_AA)
        layer = (layer.astype(np.float32) * card_mask).astype(np.uint8)
        fade = smooth(0.88, 1.0, t)
        beam_t = smooth(0.06, 0.52, t)
        top, bot = CY - CH // 2, CY + CH // 2
        beam_y = top - 20 + beam_t * (CH + 40)
        ok = smooth(0.52, 0.60, t) * (1 - fade)
        float_y = int(5 * math.sin(TAU * t))
        cy0 = CY + float_y
        def level(y):
            return 0.30 + 0.70 * smooth(-4, 26, beam_y - (y - float_y)) * (1 - fade) * (1 if t > 0.06 else 0)
        def mix(b, k=1.0):
            e = lerp(violet, emerald, ok)
            return tuple(int(min(255, v * b * k)) for v in e)
        x0, x1, y0, y1 = CX - CW // 2, CX + CW // 2, cy0 - CH // 2, cy0 + CH // 2
        cv2.rectangle(layer, (x0 + 6, y0 + 6), (x1 - 6, y1 - 6), (12, 3, 7), -1)
        # card frame (rounded corners via brackets)
        for (ax, ay, sx, sy) in ((x0, y0, 1, 1), (x1, y0, -1, 1), (x0, y1, 1, -1), (x1, y1, -1, -1)):
            b = level(ay)
            cv2.line(layer, (ax, ay), (ax + 46 * sx, ay), mix(b), 2, cv2.LINE_AA)
            cv2.line(layer, (ax, ay), (ax, ay + 46 * sy), mix(b), 2, cv2.LINE_AA)
        cv2.rectangle(layer, (x0, y0), (x1, y1), mix(0.28 + 0.4 * ok), 1, cv2.LINE_AA)
        # seal
        sx_, sy_ = x0 + 52, y0 + 56
        b = level(sy_)
        cv2.circle(layer, (sx_, sy_), 26, mix(b), 1, cv2.LINE_AA)
        cv2.circle(layer, (sx_, sy_), 18, mix(b), 1, cv2.LINE_AA)
        for k in range(12):
            a = math.radians(k * 30)
            cv2.line(layer, (int(sx_ + 19 * math.cos(a)), int(sy_ + 19 * math.sin(a))), (int(sx_ + 25 * math.cos(a)), int(sy_ + 25 * math.sin(a))), mix(b), 1, cv2.LINE_AA)
        # title + text bars
        for (bx, by, bw, th) in ((x0 + 100, y0 + 42, 190, 6), (x0 + 100, y0 + 62, 120, 3),
                                 (x0 + 36, y0 + 118, 300, 3), (x0 + 36, y0 + 138, 340, 3),
                                 (x0 + 36, y0 + 158, 260, 3), (x0 + 36, y0 + 178, 310, 3)):
            cv2.line(layer, (bx, by), (bx + bw, by), mix(level(by), 0.9), th, cv2.LINE_AA)
        # signature
        pts = np.array([[x0 + 36 + i * 4, y1 - 52 + 12 * math.sin(i * 0.5) * math.exp(-i / 14)] for i in range(34)], np.int32)
        cv2.polylines(layer, [pts], False, mix(level(y1 - 52)), 1, cv2.LINE_AA)
        # QR block
        qx, qy, cs = x1 - 36 - 9 * 9, y1 - 36 - 9 * 9, 9
        for i in range(9):
            for j in range(9):
                inf = (i < 3 and j < 3) or (i < 3 and j > 5) or (i > 5 and j < 3)
                if qr[i, j] and not inf:
                    cx_, cy_ = qx + j * cs, qy + i * cs
                    cv2.rectangle(layer, (cx_, cy_), (cx_ + cs - 2, cy_ + cs - 2), mix(level(cy_), 0.9), -1)
        for (fi, fj) in ((0, 0), (0, 6), (6, 0)):
            fx, fy = qx + fj * cs, qy + fi * cs
            cv2.rectangle(layer, (fx, fy), (fx + 3 * cs - 2, fy + 3 * cs - 2), mix(level(fy), 0.9), 1)
            cv2.rectangle(layer, (fx + cs, fy + cs), (fx + 2 * cs - 2, fy + 2 * cs - 2), mix(level(fy), 0.9), -1)
        # scan beam
        if 0.06 < t < 0.54:
            by_ = int(beam_y)
            for k in range(1, 40):
                a = (1 - k / 40) ** 2 * 0.22
                yy_ = by_ - k
                if y0 <= yy_ <= y1:
                    cv2.line(layer, (x0 - 14, yy_), (x1 + 14, yy_), tuple(int(v * a) for v in (220, 170, 255)), 1)
            if y0 - 12 <= by_ <= y1 + 12:
                cv2.line(layer, (x0 - 30, by_), (x1 + 30, by_), (255, 235, 255), 2, cv2.LINE_AA)
        # digest comparison
        ty = y1 + 52
        rv = smooth(0.34, 0.5, t) * (1 - fade)
        cv2.putText(layer, "ISSUED  " + digest, (x0, ty), cv2.FONT_HERSHEY_SIMPLEX, 0.48, tuple(int(v * (0.3 + 0.7 * rv)) for v in (215, 190, 240)), 1, cv2.LINE_AA)
        cv2.putText(layer, "PRESENT " + digest, (x0, ty + 26), cv2.FONT_HERSHEY_SIMPLEX, 0.48, tuple(int(v * (0.3 + 0.7 * rv)) for v in (215, 190, 240)), 1, cv2.LINE_AA)
        if ok > 0.02:
            cv2.putText(layer, "MATCH", (x1 - 78, ty + 13), cv2.FONT_HERSHEY_SIMPLEX, 0.6, tuple(int(v * ok) for v in emerald * 1.0), 2, cv2.LINE_AA)
        # verified badge + ripples
        bx_, by_ = x1 - 6, y0 + 6
        pop = smooth(0.52, 0.60, t)
        over = 1 + 0.25 * math.sin(math.pi * min(1, max(0, (t - 0.52) / 0.08))) if 0.52 < t < 0.60 else 1.0
        rad = int(40 * pop * over)
        if rad > 2 and fade < 1:
            cv2.circle(layer, (bx_, by_), rad, tuple(int(v * 0.22 * (1 - fade)) for v in emerald), -1, cv2.LINE_AA)
            cv2.circle(layer, (bx_, by_), rad, tuple(int(v * (1 - fade)) for v in emerald), 2, cv2.LINE_AA)
            ck = smooth(0.56, 0.66, t)
            ck_col = tuple(int(255 * (1 - fade)) for _ in range(3))
            p1, p2, p3 = (bx_ - 16, by_ + 1), (bx_ - 5, by_ + 13), (bx_ + 17, by_ - 12)
            if ck > 0:
                m1 = ck * 2
                if m1 <= 1:
                    e = (int(lerp(p1[0], p2[0], m1)), int(lerp(p1[1], p2[1], m1)))
                    cv2.line(layer, p1, e, ck_col, 4, cv2.LINE_AA)
                else:
                    m2 = m1 - 1
                    e = (int(lerp(p2[0], p3[0], m2)), int(lerp(p2[1], p3[1], m2)))
                    cv2.line(layer, p1, p2, ck_col, 4, cv2.LINE_AA)
                    cv2.line(layer, p2, e, ck_col, 4, cv2.LINE_AA)
        for off in (0.0, 0.18, 0.36):
            ph = (t - 0.56 - off * 0.5) / 0.30
            if 0 < ph < 1:
                cv2.circle(layer, (bx_, by_), int(40 + 330 * ph), tuple(int(v * (1 - ph) ** 2 * (1 - fade)) for v in emerald), 1, cv2.LINE_AA)
        out, _ = glow(layer, (0.8, 0.9, 0.7))
        return finish(out + bg)
    return render

# ------------------------------------------------------------------ main ---
def encode(name, render, quick=False):
    os.makedirs(OUT, exist_ok=True)
    path = os.path.join(OUT, name + ".mp4")
    frames = N if not quick else 12
    cmd = ["ffmpeg", "-y", "-loglevel", "error", "-f", "rawvideo", "-pix_fmt", "bgr24", "-s", f"{W}x{H}",
           "-r", str(FPS), "-i", "-", "-an", "-c:v", "libx264", "-preset", "slow", "-crf", "27",
           "-pix_fmt", "yuv420p", "-movflags", "+faststart", "-g", "48", path]
    p = subprocess.Popen(cmd, stdin=subprocess.PIPE)
    poster_at = int(frames * 0.22)
    for i in range(frames):
        fr = render(i / frames)
        if i == poster_at:
            cv2.imwrite(os.path.join(OUT, name + ".jpg"), fr, [cv2.IMWRITE_JPEG_QUALITY, 80])
        p.stdin.write(fr.tobytes())
        if i % 24 == 0: print(f"  {name}: {i}/{frames}", flush=True)
    p.stdin.close(); p.wait()
    print(f"wrote {path} ({os.path.getsize(path)/1e6:.1f} MB)")

if __name__ == "__main__":
    which = [a for a in sys.argv[1:] if not a.startswith("--")] or ["all"]
    quick = "--quick" in sys.argv
    scenes = {"trust": ("trust-layer", scene_trust), "ledger": ("ledger-chain", scene_ledger), "verify": ("verification", scene_verify)}
    for key, (name, fn) in scenes.items():
        if "all" in which or key in which:
            encode(name, fn(), quick)

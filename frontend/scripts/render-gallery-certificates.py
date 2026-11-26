#!/usr/bin/env python3
"""
Renders the eight credential "prints" shown in the landing-page picture rail
(src/components/CredentialWall.jsx) into public/gallery/*.jpg.

Requires: python3, playwright (chromium), qrcode.
Usage:    python scripts/render-gallery-certificates.py
"""
import math, os
from string import Template
import qrcode
from playwright.sync_api import sync_playwright

OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "public", "gallery")
os.makedirs(OUT, exist_ok=True)

SERIF = "'GFS Baskerville','FreeSerif','DejaVu Serif',serif"
SCRIPT = "'FreeSerif','DejaVu Serif',serif"
SANS = "'Carlito','DejaVu Sans',sans-serif"
MONO = "'DejaVu Sans Mono',monospace"

# ------------------------------------------------------------ helpers -----
def qr_svg(data, fg="#111", bg="none"):
    q = qrcode.QRCode(border=0, error_correction=qrcode.constants.ERROR_CORRECT_M)
    q.add_data(data); q.make(fit=True)
    m = q.get_matrix(); n = len(m); d = ""
    for y, row in enumerate(m):
        x = 0
        while x < n:
            if row[x]:
                s = x
                while x < n and row[x]: x += 1
                d += f"M{s} {y}h{x-s}v1h-{x-s}z"
            else: x += 1
    return (f'<svg viewBox="0 0 {n} {n}" shape-rendering="crispEdges" xmlns="http://www.w3.org/2000/svg" '
            f'style="display:block;width:100%;height:100%"><rect width="{n}" height="{n}" fill="{bg}"/><path d="{d}" fill="{fg}"/></svg>')

def guilloche(cx, cy, r, amp, n, layers, color, sw=0.8, op=0.8):
    out = []
    for k in range(layers):
        ph = k * 2 * math.pi / layers
        pts = []
        for i in range(721):
            t = i / 720 * 2 * math.pi
            rr = r + amp * math.sin(n * t + ph)
            pts.append(f"{cx + rr*math.cos(t):.1f},{cy + rr*math.sin(t):.1f}")
        out.append(f'<polyline points="{" ".join(pts)}" fill="none" stroke="{color}" stroke-width="{sw}" opacity="{op}"/>')
    return "".join(out)

def rosette(S, color, amp=0.07, n=14, layers=7, op=0.7, sw=0.9):
    c = S / 2
    return (f'<svg width="{S}" height="{S}" viewBox="0 0 {S} {S}" xmlns="http://www.w3.org/2000/svg" style="position:absolute;inset:0">'
            + guilloche(c, c, S * 0.36, S * amp, n, layers, color, sw, op) + '</svg>')

def seal(S=220, uid="s", c1="#f4d98a", c2="#a37417", ink="#6a4708", text="AUTHNODE VERIFIED · BLOCKCHAIN ANCHORED · "):
    r = S / 2
    pts = []
    for i in range(361):
        t = i / 360 * 2 * math.pi
        rr = r * 0.965 + r * 0.03 * math.sin(40 * t)
        pts.append(f"{r + rr*math.cos(t):.1f},{r + rr*math.sin(t):.1f}")
    tr = r * 0.74
    circ = 2 * math.pi * tr
    return f'''<svg width="{S}" height="{S}" viewBox="0 0 {S} {S}" xmlns="http://www.w3.org/2000/svg" style="display:block;filter:drop-shadow(0 6px 8px rgba(0,0,0,.28))">
<defs><radialGradient id="g{uid}" cx="32%" cy="28%" r="85%"><stop offset="0" stop-color="{c1}"/><stop offset="1" stop-color="{c2}"/></radialGradient>
<path id="p{uid}" d="M {r},{r} m -{tr},0 a {tr},{tr} 0 1,1 {tr*2},0 a {tr},{tr} 0 1,1 -{tr*2},0"/></defs>
<polygon points="{" ".join(pts)}" fill="url(#g{uid})"/>
<circle cx="{r}" cy="{r}" r="{r*0.88}" fill="none" stroke="{ink}" stroke-opacity=".55" stroke-width="{S*0.006}"/>
<circle cx="{r}" cy="{r}" r="{r*0.60}" fill="none" stroke="{ink}" stroke-opacity=".55" stroke-width="{S*0.006}"/>
{guilloche(r, r, r*0.44, r*0.05, 12, 6, ink, S*0.0035, .5)}
<text font-family="{SANS}" font-weight="700" font-size="{S*0.075}" fill="{ink}"><textPath href="#p{uid}" textLength="{circ*0.985:.1f}" lengthAdjust="spacing">{text}</textPath></text>
<circle cx="{r}" cy="{r}" r="{r*0.34}" fill="url(#g{uid})" stroke="{ink}" stroke-opacity=".6" stroke-width="{S*0.008}"/>
<path d="M{r-S*0.12},{r+S*0.005} L{r-S*0.035},{r+S*0.09} L{r+S*0.13},{r-S*0.09}" fill="none" stroke="{ink}" stroke-width="{S*0.042}" stroke-linecap="round" stroke-linejoin="round"/>
</svg>'''

PAPER_NOISE = ("url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Cfilter id='n'%3E"
               "%3CfeTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='2' stitchTiles='stitch'/%3E%3CfeColorMatrix values='0 0 0 0 .35  0 0 0 0 .28  0 0 0 0 .15  0 0 0 .55 0'/%3E%3C/filter%3E"
               "%3Crect width='300' height='300' filter='url(%23n)'/%3E%3C/svg%3E\")")

BASE_CSS = f'''
*{{box-sizing:border-box;margin:0;padding:0}}
body{{background:#000}}
.page{{position:relative;overflow:hidden}}
.paper{{background:radial-gradient(120% 100% at 22% 12%,#fffaf0 0%,#f7efda 45%,#eadfc2 100%)}}
.noise{{position:absolute;inset:0;background-image:{PAPER_NOISE};opacity:.22;mix-blend-mode:multiply;pointer-events:none}}
.abs{{position:absolute}}
.mono{{font-family:{MONO}}}
.cap{{text-transform:uppercase;letter-spacing:.28em}}
'''

def vurl(cid): return f"https://authnode.example/verify/{cid}"

# ------------------------------------------------------------ prints ------
def print_degree():
    W, H = 1414, 1000
    corner = lambda x, y: f'<div class="abs" style="left:{x-58}px;top:{y-58}px;width:116px;height:116px;border-radius:50%;background:#f6eed8;border:2px solid #b4892a">{rosette(116,"#1b2a57",.09,10,6,.75,.9)}</div>'
    return W, H, f'''
<div class="page paper" style="width:{W}px;height:{H}px;color:#1b2a57">
<div class="noise"></div>
<div class="abs" style="inset:36px;border:8px solid #1b2a57"></div>
<div class="abs" style="inset:58px;border:2px solid #b4892a"></div>
<div class="abs" style="inset:68px;border:1px solid #1b2a57;opacity:.45"></div>
{corner(63,63)}{corner(W-63,63)}{corner(63,H-63)}{corner(W-63,H-63)}
<div class="abs" style="left:0;right:0;top:128px;text-align:center;font-family:{SERIF}">
  <div class="cap" style="font-size:22px;font-weight:700;letter-spacing:.34em;color:#8c6a17">Northfield Institute of Technology</div>
  <div style="font-size:84px;margin-top:20px;letter-spacing:.02em">Certificate of Graduation</div>
  <div style="font-size:24px;margin-top:26px;font-style:italic;opacity:.8">This is to certify that</div>
  <div style="font-family:{SCRIPT};font-style:italic;font-size:104px;margin-top:6px;color:#14204a">Aarav Mehta</div>
  <div style="width:560px;height:2px;background:#b4892a;margin:2px auto 0"></div>
  <div style="font-size:24px;margin-top:22px;font-style:italic;opacity:.8">has fulfilled all requirements for the degree of</div>
  <div style="font-size:46px;margin-top:12px;font-weight:700">Bachelor of Technology</div>
  <div style="font-size:30px;margin-top:6px;letter-spacing:.04em">Computer Science &amp; Engineering · First Class Honours</div>
</div>
<div class="abs" style="left:320px;bottom:150px;width:240px;text-align:center;font-family:{SERIF}">
  <div style="font-family:{SCRIPT};font-style:italic;font-size:44px;color:#14204a;margin-bottom:-4px">R. Sharma</div>
  <div style="height:2px;background:#1b2a57"></div><div class="cap" style="font-size:15px;margin-top:8px;letter-spacing:.22em">Registrar</div>
</div>
<div class="abs" style="left:{W/2-110}px;bottom:96px">{seal(220,"a")}</div>
<div class="abs" style="right:320px;bottom:150px;width:240px;text-align:center;font-family:{SERIF}">
  <div style="font-family:{SCRIPT};font-style:italic;font-size:44px;color:#14204a;margin-bottom:-4px">M. Iyer</div>
  <div style="height:2px;background:#1b2a57"></div><div class="cap" style="font-size:15px;margin-top:8px;letter-spacing:.22em">Dean of Engineering</div>
</div>
<div class="abs" style="left:140px;bottom:104px;width:118px;height:118px;padding:7px;background:#fffdf6;border:1.5px solid #1b2a57">{qr_svg(vurl("AN-2024-0381"),"#14204a")}</div>
<div class="abs mono" style="left:0;right:0;bottom:84px;text-align:center;font-size:12px;letter-spacing:.08em;color:#1b2a57;opacity:.8">AN-2024-0381 · SHA-256 9F3A7C21…C4B7 · ANCHORED ON POLYGON PoS · BLOCK #68,492,104</div>
</div>'''

def print_course():
    W, H = 1500, 1000
    return W, H, f'''
<div class="page" style="width:{W}px;height:{H}px;background:radial-gradient(60% 80% at 82% 38%,#3b1f86 0%,#150c36 45%,#070617 100%);color:#fff;font-family:{SANS}">
<svg class="abs" width="{W}" height="{H}" style="inset:0;opacity:.5">{guilloche(1180,380,330,26,16,10,"#8b6cff",.8,.45)}</svg>
<div class="abs" style="inset:0;background-image:linear-gradient(rgba(167,139,250,.07) 1px,transparent 1px),linear-gradient(90deg,rgba(167,139,250,.07) 1px,transparent 1px);background-size:60px 60px;mask-image:linear-gradient(90deg,#000,transparent 85%)"></div>
<div class="abs" style="left:96px;top:90px;display:flex;align-items:center;gap:14px"><div style="width:44px;height:44px;border-radius:12px;border:1.5px solid #a78bfa;display:grid;place-items:center;color:#c4b5fd;font-size:24px">✓</div><div style="font-weight:700;letter-spacing:.2em;font-size:20px">AUTHNODE ACADEMY</div></div>
<div class="abs" style="left:96px;top:250px;width:780px">
  <div class="cap mono" style="font-size:18px;color:#a78bfa">Certificate of completion</div>
  <div style="font-size:96px;font-weight:700;line-height:1.02;letter-spacing:-.03em;margin-top:22px">Blockchain<br><span style="color:#a78bfa">Fundamentals</span></div>
  <div style="font-size:24px;color:rgba(255,255,255,.6);margin-top:34px">Awarded to</div>
  <div style="font-family:{SCRIPT};font-style:italic;font-size:70px;margin-top:2px">Priya Nair</div>
  <div style="display:flex;gap:46px;margin-top:40px;font-size:18px">
    <div><div class="mono" style="color:rgba(255,255,255,.45);font-size:13px;letter-spacing:.2em">DURATION</div><div style="margin-top:6px;font-size:26px;font-weight:600">40 hours</div></div>
    <div><div class="mono" style="color:rgba(255,255,255,.45);font-size:13px;letter-spacing:.2em">SCORE</div><div style="margin-top:6px;font-size:26px;font-weight:600">96%</div></div>
    <div><div class="mono" style="color:rgba(255,255,255,.45);font-size:13px;letter-spacing:.2em">ISSUED</div><div style="margin-top:6px;font-size:26px;font-weight:600">12 Mar 2024</div></div>
  </div>
</div>
<div class="abs" style="right:110px;top:150px;width:360px;height:360px">
  <svg width="360" height="360" viewBox="0 0 360 360"><defs><linearGradient id="hg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#c4b5fd"/><stop offset="1" stop-color="#6d3df0"/></linearGradient></defs>
  <polygon points="180,16 322,98 322,262 180,344 38,262 38,98" fill="rgba(109,61,240,.18)" stroke="url(#hg)" stroke-width="4"/>
  <polygon points="180,60 284,120 284,240 180,300 76,240 76,120" fill="none" stroke="rgba(196,181,253,.5)" stroke-width="1.5"/>
  <path d="M120,182 L166,226 L252,128" fill="none" stroke="url(#hg)" stroke-width="22" stroke-linecap="round" stroke-linejoin="round"/></svg>
</div>
<div class="abs" style="right:110px;bottom:110px;display:flex;align-items:flex-end;gap:22px">
  <div style="text-align:right" class="mono"><div style="font-size:13px;letter-spacing:.2em;color:rgba(255,255,255,.45)">SCAN TO VERIFY</div><div style="font-size:15px;margin-top:8px;color:#c4b5fd">AN-2024-0517</div></div>
  <div style="width:150px;height:150px;padding:10px;background:#fff;border-radius:14px">{qr_svg(vurl("AN-2024-0517"),"#150c36")}</div>
</div>
<div class="abs mono" style="left:96px;bottom:92px;display:flex;align-items:center;gap:16px;font-size:15px;color:rgba(255,255,255,.6)">
  <span style="display:inline-flex;align-items:center;gap:8px;padding:8px 16px;border-radius:99px;border:1px solid rgba(52,211,153,.4);background:rgba(52,211,153,.08);color:#6ee7b7"><i style="width:8px;height:8px;border-radius:50%;background:#34d399;display:inline-block"></i>VERIFIED</span>
  SHA-256 4C91E7B2…A03D · BLOCK #68,501,332
</div>
</div>'''

def print_pro():
    W, H = 900, 1200
    return W, H, f'''
<div class="page paper" style="width:{W}px;height:{H}px;color:#0f3d3a">
<div class="noise"></div>
<div class="abs" style="inset:30px;border:6px solid #0f3d3a"></div>
<div class="abs" style="inset:48px;border:1.5px solid #b4892a"></div>
<div class="abs" style="left:0;right:0;top:112px;text-align:center;font-family:{SERIF}">
  <div class="cap" style="font-size:17px;font-weight:700;color:#8c6a17;letter-spacing:.32em">Cloud Security Council</div>
  <div style="width:96px;height:2px;background:#b4892a;margin:22px auto"></div>
  <div style="font-size:30px;letter-spacing:.14em;text-transform:uppercase">Professional Certification</div>
  <div style="font-size:66px;line-height:1.08;margin-top:34px;font-weight:700;padding:0 80px">Certified Cloud Security Practitioner</div>
  <div style="font-size:21px;font-style:italic;opacity:.75;margin-top:46px">is proudly presented to</div>
  <div style="font-family:{SCRIPT};font-style:italic;font-size:80px;margin-top:8px;color:#082c2a">Rohan Kapoor</div>
  <div style="width:440px;height:2px;background:#b4892a;margin:0 auto"></div>
  <div style="font-size:21px;margin:26px 90px 0;line-height:1.5;opacity:.85">for demonstrating verified expertise in identity, encryption and incident response.</div>
</div>
<div class="abs" style="left:{W/2-95}px;top:826px">{seal(190,"c","#f4d98a","#a37417","#6a4708","CERTIFIED PRACTITIONER · AUTHNODE · ")}</div>
<div class="abs" style="left:96px;bottom:92px;width:112px;height:112px;padding:7px;background:#fffdf6;border:1.5px solid #0f3d3a">{qr_svg(vurl("AN-CCSP-2291"),"#082c2a")}</div>
<div class="abs mono" style="right:96px;bottom:96px;text-align:right;font-size:12px;line-height:1.7;color:#0f3d3a;opacity:.85">CREDENTIAL AN-CCSP-2291<br>VALID UNTIL 2027<br>SHA-256 7B02D9E4…11AF<br>ANCHORED · BLOCK #68,214,880</div>
</div>'''

def print_card():
    W, H = 1000, 1000
    return W, H, f'''
<div class="page" style="width:{W}px;height:{H}px;background:radial-gradient(90% 70% at 20% 0%,#2a1766 0%,#0b0820 55%,#05040f 100%);color:#fff;font-family:{SANS}">
<svg class="abs" width="{W}" height="{H}" style="inset:0;opacity:.45">{guilloche(900,120,300,22,14,9,"#8b6cff",.8,.4)}</svg>
<div class="abs" style="inset:70px;border-radius:44px;border:1.5px solid rgba(196,181,253,.28);background:linear-gradient(160deg,rgba(255,255,255,.07),rgba(255,255,255,.015))"></div>
<div class="abs" style="left:130px;top:130px;display:flex;align-items:center;gap:14px"><div style="width:48px;height:48px;border-radius:13px;border:1.5px solid #a78bfa;display:grid;place-items:center;color:#c4b5fd;font-size:26px">✓</div><div style="font-weight:700;letter-spacing:.22em;font-size:20px">AUTHNODE</div></div>
<div class="abs mono" style="right:130px;top:140px;font-size:15px;letter-spacing:.2em;color:#c4b5fd">DIGITAL CREDENTIAL</div>
<div class="abs" style="left:130px;top:250px;width:150px;height:150px;border-radius:50%;background:linear-gradient(135deg,#c4b5fd,#6d3df0);display:grid;place-items:center;font-size:58px;font-weight:700;color:#0b0820">KS</div>
<div class="abs" style="left:320px;top:262px"><div style="font-size:58px;font-weight:700;letter-spacing:-.02em">Karan Sethi</div><div style="font-size:26px;color:rgba(255,255,255,.65);margin-top:8px">B.Sc. Data Science</div><div style="font-size:22px;color:rgba(255,255,255,.45);margin-top:4px">Meridian University · 2025</div></div>
<div class="abs" style="left:130px;top:480px;display:flex;gap:44px;align-items:flex-end">
  <div style="width:300px;height:300px;padding:18px;background:#fff;border-radius:26px">{qr_svg(vurl("AN-2291-7F3A"),"#0b0820")}</div>
  <div class="mono" style="font-size:16px;line-height:2;color:rgba(255,255,255,.7)"><span style="color:rgba(255,255,255,.4)">CREDENTIAL ID</span><br>AN-2291-7F3A<br><span style="color:rgba(255,255,255,.4)">NETWORK</span><br>POLYGON PoS<br><span style="color:rgba(255,255,255,.4)">BLOCK</span><br>#68,602,019</div>
</div>
<div class="abs" style="left:130px;bottom:130px;display:flex;align-items:center;gap:18px"><span style="display:inline-flex;align-items:center;gap:12px;padding:14px 26px;border-radius:99px;border:1.5px solid rgba(52,211,153,.5);background:rgba(52,211,153,.1);color:#6ee7b7;font-weight:700;letter-spacing:.2em;font-size:20px"><i style="width:12px;height:12px;border-radius:50%;background:#34d399;box-shadow:0 0 14px #34d399;display:inline-block"></i>AUTHENTIC</span><span class="mono" style="font-size:14px;color:rgba(255,255,255,.45)">SHA-256 9F3A…C4B7</span></div>
</div>'''

def print_proof():
    W, H = 1500, 1000
    row = lambda k, v, c="rgba(255,255,255,.85)": f'<div style="display:flex;justify-content:space-between;padding:14px 0;border-bottom:1px solid rgba(255,255,255,.07)"><span style="color:rgba(255,255,255,.4)">{k}</span><span style="color:{c}">{v}</span></div>'
    block = lambda n, h, hot=False: f'<div style="width:250px;padding:20px;border-radius:16px;border:1.5px solid {"#a78bfa" if hot else "rgba(167,139,250,.28)"};background:{"rgba(109,61,240,.2)" if hot else "rgba(255,255,255,.03)"}"><div style="font-size:13px;color:rgba(255,255,255,.4);letter-spacing:.18em">BLOCK</div><div style="font-size:26px;margin:4px 0 10px;color:{"#fff" if hot else "rgba(255,255,255,.8)"}">#{n}</div><div style="font-size:13px;color:#a78bfa">{h}</div></div>'
    link = '<div style="width:46px;height:2px;background:linear-gradient(90deg,#a78bfa,#6d3df0);margin:0 -2px"></div>'
    return W, H, f'''
<div class="page mono" style="width:{W}px;height:{H}px;background:radial-gradient(70% 90% at 80% 10%,#25135e 0%,#0a0720 50%,#04030c 100%);color:#fff">
<div class="abs" style="inset:60px;border-radius:26px;border:1px solid rgba(196,181,253,.22);background:rgba(8,6,26,.7);overflow:hidden">
  <div style="display:flex;align-items:center;gap:10px;padding:22px 30px;border-bottom:1px solid rgba(255,255,255,.08)"><i style="width:14px;height:14px;border-radius:50%;background:#f87171;opacity:.7"></i><i style="width:14px;height:14px;border-radius:50%;background:#facc15;opacity:.7"></i><i style="width:14px;height:14px;border-radius:50%;background:#34d399;opacity:.7"></i><span style="margin-left:auto;font-size:15px;letter-spacing:.24em;color:rgba(255,255,255,.35)">VERIFICATION.NODE</span></div>
  <div style="padding:34px 44px;font-size:22px;line-height:1.9">
    <div><span style="color:#a78bfa">$</span> <span style="color:rgba(255,255,255,.75)">verify certificate --qr 8AF21C</span></div>
    <div style="color:rgba(255,255,255,.4);margin-top:6px"><span style="color:#a78bfa">→</span> Reading certificate…<br><span style="color:#a78bfa">→</span> Generating SHA-256 fingerprint…<br><span style="color:#a78bfa">→</span> Querying blockchain proof…</div>
  </div>
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:40px;padding:0 44px;font-size:20px">
    <div>{row("ISSUED HASH","9F3A7C21…C4B7")}{row("PRESENTED HASH","9F3A7C21…C4B7")}{row("MATCH","TRUE","#6ee7b7")}</div>
    <div>{row("NETWORK","POLYGON PoS")}{row("BLOCK","#68,492,104")}{row("TX","0x7af9d21c…f0a4")}</div>
  </div>
  <div style="margin:34px 44px 0;padding:26px 32px;border-radius:18px;border:1.5px solid rgba(52,211,153,.4);background:rgba(52,211,153,.07);display:flex;align-items:center;gap:22px">
    <div style="width:56px;height:56px;border-radius:50%;background:#34d399;display:grid;place-items:center;color:#04130d;font-size:34px;font-weight:700">✓</div>
    <div><div style="font-size:30px;font-weight:700;color:#6ee7b7;letter-spacing:.06em">AUTHENTIC CREDENTIAL</div><div style="font-size:18px;color:rgba(255,255,255,.5);margin-top:4px">Fingerprint matches the on-chain record issued by the authorised institution.</div></div>
  </div>
  <div style="display:flex;align-items:center;justify-content:center;margin-top:44px">{block("68,492,103","0x3be1…9c20")}{link}{block("68,492,104","0x7af9…f0a4",True)}{link}{block("68,492,105","0xc410…5d7e")}</div>
</div></div>'''

def print_award():
    W, H = 1000, 1250
    return W, H, f'''
<div class="page paper" style="width:{W}px;height:{H}px;color:#4a1420">
<div class="noise"></div>
<div class="abs" style="inset:34px;border:7px double #7a1f33"></div>
<div class="abs" style="inset:62px;border:1.5px solid #b4892a"></div>
<svg class="abs" width="{W}" height="{H}" style="inset:0">{guilloche(500,0,230,18,16,8,"#7a1f33",.8,.28)}{guilloche(500,H,230,18,16,8,"#7a1f33",.8,.28)}</svg>
<div class="abs" style="left:0;right:0;top:150px;text-align:center;font-family:{SERIF}">
  <div class="cap" style="font-size:20px;font-weight:700;color:#8c6a17;letter-spacing:.34em">Meridian University</div>
  <div style="font-size:90px;line-height:1.02;margin-top:30px">Award of<br>Excellence</div>
  <div style="font-size:30px;margin-top:28px;letter-spacing:.1em;text-transform:uppercase;color:#8c6a17">Gold Medal · Academic Merit</div>
  <div style="font-size:23px;font-style:italic;margin-top:46px;opacity:.75">conferred upon</div>
  <div style="font-family:{SCRIPT};font-style:italic;font-size:92px;margin-top:6px;color:#3a0f19">Ishita Rao</div>
  <div style="width:470px;height:2px;background:#b4892a;margin:0 auto"></div>
  <div style="font-size:23px;margin:28px 120px 0;line-height:1.55;opacity:.85">for outstanding scholarship and the highest cumulative result in the graduating class of 2025.</div>
</div>
<svg class="abs" width="200" height="260" style="left:{W/2-100}px;top:850px"><polygon points="40,0 100,0 100,230 70,200 40,230" fill="#7a1f33" transform="translate(-6 0) rotate(8 70 0)"/><polygon points="100,0 160,0 160,230 130,200 100,230" fill="#9a2a42" transform="translate(6 0) rotate(-8 130 0)"/></svg>
<div class="abs" style="left:{W/2-105}px;top:790px">{seal(210,"f","#f4d98a","#a37417","#6a4708","GOLD MEDAL · AUTHNODE VERIFIED · ")}</div>
<div class="abs" style="left:110px;bottom:96px;width:116px;height:116px;padding:7px;background:#fffdf6;border:1.5px solid #7a1f33">{qr_svg(vurl("AN-2025-1180"),"#3a0f19")}</div>
<div class="abs mono" style="right:110px;bottom:100px;text-align:right;font-size:13px;line-height:1.7;opacity:.85">CREDENTIAL AN-2025-1180<br>SHA-256 D21E6A90…7C3B<br>ANCHORED · BLOCK #68,730,447</div>
</div>'''

def print_badge():
    W, H = 1000, 1000
    return W, H, f'''
<div class="page" style="width:{W}px;height:{H}px;background:radial-gradient(70% 70% at 50% 42%,#5b2fd6 0%,#2a1273 50%,#0a0624 100%);color:#fff;font-family:{SANS}">
<svg class="abs" width="{W}" height="{H}" style="inset:0;opacity:.55">{guilloche(500,420,330,20,18,10,"#c4b5fd",.7,.35)}</svg>
<div class="abs" style="left:{W/2-210}px;top:120px;width:420px;height:470px">
  <svg width="420" height="470" viewBox="0 0 420 470"><defs><linearGradient id="bg1" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ede9fe"/><stop offset=".5" stop-color="#a78bfa"/><stop offset="1" stop-color="#5b2fd6"/></linearGradient><linearGradient id="bg2" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1a0d4d"/><stop offset="1" stop-color="#0d0726"/></linearGradient></defs>
  <polygon points="210,10 400,118 400,352 210,460 20,352 20,118" fill="url(#bg1)"/>
  <polygon points="210,36 376,132 376,338 210,434 44,338 44,132" fill="url(#bg2)"/>
  <polygon points="210,62 352,146 352,324 210,408 68,324 68,146" fill="none" stroke="rgba(196,181,253,.45)" stroke-width="2"/>
  <path d="M210,120 L290,152 L290,226 C290,282 254,318 210,336 C166,318 130,282 130,226 L130,152 Z" fill="rgba(167,139,250,.16)" stroke="#c4b5fd" stroke-width="5" stroke-linejoin="round"/>
  <path d="M170,230 L202,262 L256,198" fill="none" stroke="#fff" stroke-width="16" stroke-linecap="round" stroke-linejoin="round"/></svg>
</div>
<div class="abs" style="left:0;right:0;top:640px;text-align:center">
  <div class="cap" style="font-size:18px;color:#c4b5fd;letter-spacing:.34em;font-weight:700">Verified skill · Level 3</div>
  <div style="font-size:78px;font-weight:700;letter-spacing:-.02em;margin-top:14px">Smart Contracts</div>
  <div style="font-size:26px;color:rgba(255,255,255,.65);margin-top:10px">Issued by AuthNode Academy · 2025</div>
  <div style="font-size:34px;letter-spacing:.5em;color:#fde68a;margin-top:26px">★ ★ ★</div>
</div>
<div class="abs" style="left:70px;bottom:62px;width:104px;height:104px;padding:7px;background:#fff;border-radius:12px">{qr_svg(vurl("AN-BDG-4410"),"#1a0d4d")}</div>
<div class="abs mono" style="right:70px;bottom:70px;text-align:right;font-size:14px;line-height:1.75;color:rgba(255,255,255,.65)">AN-BDG-4410<br>SHA-256 55A8F0C3…1E9D<br><span style="color:#6ee7b7">● VERIFIED ON-CHAIN</span></div>
</div>'''

def print_receipt():
    W, H = 900, 1200
    zig = lambda pos: f'<div class="abs" style="left:0;right:0;{pos}:-1px;height:22px;background:linear-gradient(135deg,#1c1c22 25%,transparent 25%) -11px 0,linear-gradient(225deg,#1c1c22 25%,transparent 25%) -11px 0;background-size:22px 22px;{"transform:scaleY(-1)" if pos=="bottom" else ""}"></div>'
    step = lambda t, s, last=False: f'''<div style="display:flex;gap:22px"><div style="display:flex;flex-direction:column;align-items:center"><div style="width:34px;height:34px;border-radius:50%;background:#14b87a;color:#fff;display:grid;place-items:center;font-weight:700;font-size:20px">✓</div>{"" if last else '<div style="width:3px;flex:1;background:#14b87a;opacity:.5;min-height:30px"></div>'}</div><div style="padding-bottom:{0 if last else 18}px"><div style="font-size:26px;font-weight:700">{t}</div><div class="mono" style="font-size:15px;opacity:.6;margin-top:2px">{s}</div></div></div>'''
    row = lambda k, v: f'<div style="display:flex;justify-content:space-between;padding:11px 0;border-bottom:2px dashed rgba(0,0,0,.18);font-size:22px"><span style="opacity:.55">{k}</span><span style="font-weight:700;text-align:right">{v}</span></div>'
    return W, H, f'''
<div class="page" style="width:{W}px;height:{H}px;background:#1c1c22;font-family:{SANS};color:#16161b">
<div class="abs" style="inset:0 0 0 0;background:#f5f2ea"><div class="noise" style="opacity:.14"></div></div>
{zig("top")}{zig("bottom")}
<div class="abs" style="left:80px;right:80px;top:70px">
  <div style="text-align:center"><div style="font-weight:700;font-size:23px;letter-spacing:.3em">AUTHNODE</div><div class="mono" style="font-size:18px;letter-spacing:.2em;margin-top:8px;opacity:.65">VERIFICATION RECEIPT</div></div>
  <div style="margin-top:28px;border-top:2px dashed rgba(0,0,0,.35)"></div>
  <div class="mono" style="margin-top:6px">{row("HOLDER","Neha Verma")}{row("CREDENTIAL","M.Sc. Cyber Security")}{row("ISSUER","Meridian University")}{row("VERIFIED","01 Nov 2026 · 10:42")}{row("RESULT",'<span style="color:#0b8a58">AUTHENTIC</span>')}</div>
  <div style="margin-top:34px">{step("Issued","Institution signed the credential")}{step("Hashed","SHA-256 9F3A7C21…C4B7")}{step("Anchored","Polygon PoS · Block #68,492,104")}{step("Verified","Fingerprint matches on-chain proof", True)}</div>
  <div style="display:flex;justify-content:center;margin-top:36px"><div style="width:190px;height:190px">{qr_svg(vurl("AN-RCP-0091"),"#16161b")}</div></div>
  <div class="mono" style="text-align:center;font-size:15px;letter-spacing:.2em;margin-top:14px;opacity:.6">AN-RCP-0091 · THANK YOU</div>
</div></div>'''

PRINTS = {
    "degree-certificate": print_degree,
    "course-completion": print_course,
    "professional-certification": print_pro,
    "credential-card": print_card,
    "blockchain-proof": print_proof,
    "award-excellence": print_award,
    "skill-badge": print_badge,
    "verification-receipt": print_receipt,
}

def main():
    with sync_playwright() as p:
        browser = p.chromium.launch()
        for name, fn in PRINTS.items():
            W, H, body = fn()
            html = f'<!doctype html><meta charset="utf-8"><style>{BASE_CSS}</style>{body}'
            page = browser.new_page(viewport={"width": W, "height": H}, device_scale_factor=1)
            page.set_content(html)
            page.wait_for_timeout(150)
            path = os.path.join(OUT, name + ".jpg")
            page.screenshot(path=path, type="jpeg", quality=88, clip={"x": 0, "y": 0, "width": W, "height": H})
            page.close()
            print(f"{name}: {W}x{H}  aspect {W/H:.3f}  {os.path.getsize(path)/1024:.0f} KB")
        browser.close()

if __name__ == "__main__":
    main()

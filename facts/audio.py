"""Music bed + SFX stems for «5 невероятных фактов» (writes music.wav, sfx.wav; mix.py sets the levels).
Cues are in frames (30 fps) and match web/story.js."""
import numpy as np, wave

SR = 48000
TOTAL = 2123
DUR = TOTAL / 30
N = int(DUR * SR)
rng = np.random.default_rng(11)
F = lambda f: f / 30

def lp(x, cutoff):
    X = np.fft.rfft(x); fr = np.fft.rfftfreq(len(x), 1 / SR); X *= 1 / (1 + (fr / cutoff) ** 4); return np.fft.irfft(X, len(x)).astype(np.float32)
def hp(x, cutoff):
    X = np.fft.rfft(x); fr = np.fft.rfftfreq(len(x), 1 / SR); X *= 1 - 1 / (1 + (fr / cutoff) ** 4); return np.fft.irfft(X, len(x)).astype(np.float32)
def bp(x, lo, hi): return hp(lp(x, hi), lo)
def place(buf, sig, t0, gain=1.0):
    i = int(t0 * SR); j = min(N, i + len(sig))
    if 0 <= i < N and j > i: buf[i:j] += sig[: j - i] * gain
def tt(d): return np.arange(int(d * SR)) / SR
def noise(d): return rng.standard_normal(int(d * SR)).astype(np.float32)
midi = lambda m: 440 * 2 ** ((m - 69) / 12)

# ---------------- music: plucky "cardboard" march (ukulele-ish pluck, box-tap percussion, glockenspiel) ----------------
def pluck(f, d=0.4, bright=0.55):
    t = tt(d); s = sum((bright ** k) * np.sin(2 * np.pi * f * (k + 1) * t) / (k + 1) for k in range(7))
    return (s * np.minimum(1, t / 0.002) * np.exp(-t / (d * 0.3))).astype(np.float32)
def glock(f, d=0.9):
    t = tt(d); s = np.sin(2 * np.pi * f * t) + 0.35 * np.sin(2 * np.pi * f * 2.76 * t) * np.exp(-t * 6) + 0.2 * np.sin(2 * np.pi * f * 5.4 * t) * np.exp(-t * 12)
    return (s * np.minimum(1, t / 0.002) * np.exp(-t * 3.2)).astype(np.float32)
def boxtap(f0=180, d=0.16):  # knuckle on a cardboard box
    t = tt(d); body = np.sin(2 * np.pi * f0 * t * (1 + 0.4 * np.exp(-t * 60))) * np.exp(-t * 32)
    return (body + bp(noise(d), 400, 2500) * np.exp(-t * 55) * 0.6).astype(np.float32)
def kick(d=0.3):
    t = tt(d); fr = 48 + 80 * np.exp(-t * 32); return (np.sin(2 * np.pi * np.cumsum(fr) / SR) * np.exp(-t * 10)).astype(np.float32)
def shaker(d=0.08):
    t = tt(d); return (hp(noise(d), 5000) * np.exp(-t * 60) * 0.5).astype(np.float32)

music = np.zeros(N, np.float32)
BPM = 116; beat = 60 / BPM
prog = [(48, [60, 64, 67]), (43, [59, 62, 67]), (45, [60, 64, 69]), (41, [60, 65, 69])]  # C G Am F
mel = [76, 74, 72, 74, 76, 76, 76, None, 74, 74, 74, None, 76, 79, 79, None]  # simple tune (8ths per 2 bars)
MUSIC_END = F(2104)
bar, t0 = 0, 0.0
while t0 < MUSIC_END:
    root, ch = prog[bar % 4]
    for b in range(4):
        tb = t0 + b * beat
        if tb >= MUSIC_END: break
        place(music, kick(), tb, 0.55 if b % 2 == 0 else 0.0)
        place(music, boxtap(170 if b % 2 else 120), tb + (beat / 2 if b % 2 == 0 else 0), 0.45)
        place(music, pluck(midi(root), 0.45, 0.35), tb, 0.45)
        for k, m in enumerate(ch): place(music, pluck(midi(m), 0.3, 0.6), tb + beat / 2 + k * 0.012, 0.16)
        for h in range(2): place(music, shaker(), tb + h * beat / 2, 0.25)
    for i in range(8):
        m = mel[(bar % 2) * 8 + i]
        if m is not None and t0 + i * beat / 2 < MUSIC_END: place(music, glock(midi(m)), t0 + i * beat / 2, 0.18)
    bar += 1; t0 += 4 * beat
i0 = int((MUSIC_END - 0.06) * SR); music[i0:] *= np.linspace(1, 0, N - i0) ** 10
for k, m in enumerate([72, 76, 79, 84]): place(music, glock(midi(m), 1.6), F(2068) + k * 0.12, 0.2)
# ---------------- sfx ----------------
sfx = np.zeros(N, np.float32)
def whoosh(d=0.6):
    t = tt(d); return (lp(noise(d), 1500) * np.sin(np.pi * t / d) ** 2 * 0.7).astype(np.float32)
def thunk(f0=95, d=0.3):
    t = tt(d); return (np.sin(2 * np.pi * f0 * t * (1 + 0.6 * np.exp(-t * 40))) * np.exp(-t * 14) + lp(noise(d), 1200) * np.exp(-t * 30) * 0.5).astype(np.float32)
def flick(d=0.12):  # paper / card flick
    t = tt(d); return (bp(noise(d), 1500, 7000) * np.exp(-t * 45) * 1.2).astype(np.float32)
def taperip(d=1.2, rate=55, rise=1.0):  # crackly tape pulled off a roll
    t = tt(d); r = rate * (1 + rise * t / d); ph = np.cumsum(r) / SR
    crackle = (np.mod(ph, 1) < 0.25).astype(np.float32) * (0.5 + rng.random(len(t)).astype(np.float32))
    s = bp(crackle * 0.8 + noise(d) * 0.35, 1200, 7000) * np.minimum(1, t / 0.03) * np.minimum(1, (d - t) / 0.05).clip(0)
    return s.astype(np.float32)
def thwip():
    d = 0.25; t = tt(d); fr = 900 + 2200 * (t / d); return (np.sin(2 * np.pi * np.cumsum(fr) / SR) * np.exp(-t * 14) * 0.5 + flick(d) * 0.8).astype(np.float32)
def wobble(d=1.0):  # spinning-coin rattle that speeds up
    out = np.zeros(int(d * SR), np.float32); t = 0.0; gap = 0.16
    while t < d - 0.05:
        g = boxtap(220 + rng.uniform(-20, 20), 0.08) * 0.7; i = int(t * SR); out[i:i + len(g)] += g[: len(out) - i]; t += gap; gap = max(0.025, gap * 0.82)
    return out
def boing(f0=180, d=0.7):
    t = tt(d); fr = f0 * (1 + 0.45 * np.sin(2 * np.pi * 11 * t) * np.exp(-t * 4)) * (1 + 0.6 * t / d)
    return (np.sin(2 * np.pi * np.cumsum(fr) / SR) * np.exp(-t * 4) * 0.8).astype(np.float32)
def rumble(d):
    t = tt(d); return (lp(noise(d), 160) * 3 * np.minimum(1, t / 0.12) * np.exp(-t / (d * 0.45))).astype(np.float32)
def crash(d=1.0):
    n = int(d * SR); s = np.zeros(n, np.float32)
    for k in range(10):
        i = int(rng.uniform(0, d * 0.5) * SR); g = thunk(rng.uniform(60, 150), 0.35) * rng.uniform(0.3, 0.9); s[i:i + len(g)] += g[: n - i]
    t = tt(d); s += bp(noise(d), 300, 3000) * np.exp(-t * 5) * 0.35
    return s
def creak(d=0.6, f0=140):
    t = tt(d); rate = f0 * (1 + 0.35 * np.sin(2 * np.pi * 1.3 * t / d)); ph = np.cumsum(rate) / SR
    pulses = (np.mod(ph, 1) < 0.08).astype(np.float32) * (0.6 + 0.4 * rng.random(len(t)).astype(np.float32))
    return (hp(lp(pulses, 2200) * np.sin(np.pi * t / d), 200) * 2.2).astype(np.float32)
def splash(d=1.0):
    t = tt(d); return (lp(noise(d), 4000) * np.exp(-t * 4) * np.minimum(1, t / 0.01) + lp(noise(d), 400) * np.exp(-t * 7) * 1.5).astype(np.float32)
def ting(base=2093):
    t = tt(1.4); return (sum(np.sin(2 * np.pi * f * t) * np.exp(-t * k) for f, k in [(base, 3.5), (base * 1.5, 5), (base * 2, 7)]) * 0.3).astype(np.float32)
def shimmer(d=2.0):
    out = np.zeros(int(d * SR), np.float32)
    for k, m in enumerate([84, 88, 91, 96, 91, 88, 84, 91]):
        g = glock(midi(m), 0.8) * 0.5; i = int(k * d / 9 * SR); out[i:i + len(g)] += g[: len(out) - i]
    return out
def slide_down(d=1.6):  # slide whistle, falling
    t = tt(d); fr = 1500 * (300 / 1500) ** (t / d) * (1 + 0.02 * np.sin(2 * np.pi * 6 * t))
    return (np.sin(2 * np.pi * np.cumsum(fr) / SR) * np.minimum(1, t / 0.05) * np.minimum(1, (d - t) / 0.15).clip(0) * 0.6).astype(np.float32)
def rummage(d=0.5):
    t = tt(d); return (bp(noise(d), 300, 3000) * (0.4 + 0.6 * (np.sin(2 * np.pi * 9 * t) > 0)) * np.sin(np.pi * t / d) * 0.7).astype(np.float32)
def sting():
    t = tt(2.2); low = np.sin(2 * np.pi * 41 * t) * np.exp(-t * 1.5) * 1.2; hit = lp(noise(2.2), 900) * np.exp(-t * 6) * 0.8
    return (low + hit).astype(np.float32)
def cricket(d=0.25):
    t = tt(d); return (np.sin(2 * np.pi * 4300 * t) * (np.sin(2 * np.pi * 30 * t) > 0.2) * np.sin(np.pi * t / d) * 0.25).astype(np.float32)

for f0 in [56, 107, 121, 136, 150, 165]: place(sfx, boing(300 + f0, 0.35), F(f0), 0.35)
for f0 in [196, 511, 621, 771, 856, 1103, 1381, 1509, 1667, 1943]: place(sfx, whoosh(0.5), F(f0) - 0.15, 0.6)
for f0 in [200, 515, 860, 1107, 1385, 1671]: place(sfx, boing(150, 0.6), F(f0), 0.5); place(sfx, thunk(90, 0.3), F(f0), 0.4)
place(sfx, whoosh(0.9), F(240), 0.4)
for f0 in [303, 327, 376, 481, 486, 491]: place(sfx, thunk(60, 0.25), F(f0), 0.8); place(sfx, thunk(55, 0.2), F(f0) + 0.18, 0.5)
for k in range(46): place(sfx, boxtap(1400, 0.03), F(622) + k * 0.05, 0.25)
place(sfx, ting(2637), F(668), 0.5); place(sfx, shimmer(1.4), F(724), 0.35)
place(sfx, whoosh(1.2), F(898), 0.7); place(sfx, boing(260, 0.4), F(968), 0.4); place(sfx, boing(120, 0.6), F(1004), 0.5); place(sfx, ting(1760), F(1048), 0.35)
place(sfx, thunk(80, 0.35), F(1234), 0.9); place(sfx, thunk(70, 0.35), F(1287), 0.9); place(sfx, boing(400, 0.3), F(1254), 0.4)
place(sfx, shimmer(1.5), F(1436), 0.35)
for k in range(28): place(sfx, ting(2093 * (1 + (k % 5) * 0.12)), F(1540) + k * 0.13 + (k % 3) * 0.03, 0.12)
place(sfx, flick(), F(1600), 0.8)
for k in range(7): place(sfx, boxtap(500 + k * 60, 0.08), F(1740 + k * 10), 0.6)
place(sfx, ting(2349), F(1867), 0.4); place(sfx, thunk(100, 0.3), F(1900), 0.5)
place(sfx, flick(), F(2028), 0.7); place(sfx, creak(0.7, 120), F(2068), 0.6); place(sfx, shimmer(1.6), F(2075), 0.4)

def wr(name, x):
    with wave.open(name, 'wb') as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR); w.writeframes((np.clip(x / max(1e-9, np.abs(x).max()) * 0.9, -1, 1) * 32767).astype(np.int16).tobytes())
wr('music.wav', music); wr('sfx.wav', sfx)
print('stems ok', DUR)

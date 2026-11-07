"""Music bed + SFX stems for «Город на скотче» (writes music.wav, sfx.wav; mix.py sets the levels).
Cues are in frames (30 fps) and match web/story.js."""
import numpy as np, wave

SR = 48000
TOTAL = 831
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
MUSIC_END = F(756)
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
# arrangement: bed drops to bass-only on «Но однажды скотч закончился», comes back for the chaos
env = np.ones(N, np.float32); ts = np.arange(N) / SR
env *= np.where((ts > F(206)) & (ts < F(290)), 0.45, 1.0)
env = np.convolve(env, np.ones(2400) / 2400, 'same').astype(np.float32)
music *= env
i0 = int((MUSIC_END - 0.06) * SR); music[i0:] *= np.linspace(1, 0, N - i0) ** 10
# after the twist: low drone + a lonely music-box figure
dn = N - int(MUSIC_END * SR); td = np.arange(dn) / SR
drone = (np.sin(2 * np.pi * 55 * td) + 0.5 * np.sin(2 * np.pi * 82.4 * td) + 0.25 * np.sin(2 * np.pi * 110 * td)) * np.minimum(1, td / 1.0)
place(music, lp(drone.astype(np.float32), 500), MUSIC_END, 0.32)
for k, m in enumerate([76, 72, 69, 67, 64]):
    place(music, glock(midi(m), 1.4), MUSIC_END + 0.55 + k * 0.42, 0.12)

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

place(sfx, whoosh(0.9), F(40), 0.6)                 # pull back off the tape
place(sfx, whoosh(0.8), F(95), 0.5)                 # crane down the street
place(sfx, whoosh(0.5) + 0, F(104), 0.45); place(sfx, thunk(70, 0.25), F(107), 0.3)  # «машины»: car passes
place(sfx, whoosh(0.45), F(156), 0.6); place(sfx, flick(), F(172), 0.9); place(sfx, flick(), F(186), 0.7)  # the standee spins
place(sfx, ting(2637), F(190), 0.25)
place(sfx, taperip(1.45, 40, 1.4), F(207), 0.75)    # tape running out
place(sfx, thwip(), F(253), 0.9)                    # «закончился»: the end flicks off
place(sfx, wobble(0.85), F(257), 0.8); place(sfx, thunk(110, 0.3), F(280), 0.8)
place(sfx, taperip(0.45, 70, 0.5), F(326), 0.9)     # «отклеилась»
place(sfx, boing(160), F(347), 0.6); place(sfx, crash(1.1), F(349), 0.7); place(sfx, rumble(1.2), F(347), 0.6)
for k in range(12):                                  # «раскрылись все коробки»: lids pop
    f = 384 + k * 3 + (k % 3); place(sfx, thunk(85 + (k * 23) % 60, 0.25), F(f), 0.55 * (1 - k / 18)); place(sfx, flick(0.1), F(f + 1), 0.35)
place(sfx, creak(0.6, 120), F(446), 0.8); place(sfx, whoosh(0.6), F(452), 0.6); place(sfx, thunk(70, 0.4), F(472), 0.8)
place(sfx, boing(240, 0.6), F(457), 0.6); place(sfx, splash(1.1), F(478), 0.9)
for k in range(4): place(sfx, rummage(0.4), F(515 + k * 13), 0.5)
place(sfx, ting(2349), F(569), 0.45)                # «нашёл»
place(sfx, whoosh(1.2), F(583), 0.45)               # tilt up to the sky
place(sfx, shimmer(2.0), F(624), 0.55)              # «сиял»
place(sfx, slide_down(1.6), F(700), 0.6)            # the sun is lowered
for k in range(9): place(sfx, thunk(90 + (k * 17) % 50, 0.22), F(705 + k * 3.4), 0.45); place(sfx, taperip(0.18, 90, 0.2), F(704 + k * 3.4), 0.3)
place(sfx, sting(), F(756), 0.85)                   # «Но солнца…»
for k in range(10): place(sfx, cricket(), F(770) + k * 0.55 + rng.uniform(0, 0.1), 0.25)
place(sfx, creak(0.7, 110), F(812), 0.7)            # the empty hook swings

def wr(name, x):
    with wave.open(name, 'wb') as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR); w.writeframes((np.clip(x / max(1e-9, np.abs(x).max()) * 0.9, -1, 1) * 32767).astype(np.int16).tobytes())
wr('music.wav', music); wr('sfx.wav', sfx)
print('stems ok', DUR)

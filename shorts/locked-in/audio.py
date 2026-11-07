"""Synthesized music bed + SFX stems for "Locked In" (writes music.wav and sfx.wav only; mix.py sets the levels)."""
import numpy as np, wave, json

SR = 48000
TOTAL_F = 1043
DUR = TOTAL_F / 30
N = int(DUR * SR) + SR // 2
rng = np.random.default_rng(11)
F = lambda f: f / 30

def lp_fast(x, cutoff):
    X = np.fft.rfft(x); f = np.fft.rfftfreq(len(x), 1 / SR)
    X *= 1 / (1 + (f / cutoff) ** 4); return np.fft.irfft(X, len(x)).astype(np.float32)
def hp_fast(x, cutoff):
    X = np.fft.rfft(x); f = np.fft.rfftfreq(len(x), 1 / SR)
    X *= 1 - 1 / (1 + (f / cutoff) ** 4); return np.fft.irfft(X, len(x)).astype(np.float32)
def bp(x, lo, hi): return hp_fast(lp_fast(x, hi), lo)
def place(buf, sig, t0, gain=1.0):
    i = int(t0 * SR); j = min(len(buf), i + len(sig))
    if 0 <= i < len(buf) and j > i: buf[i:j] += sig[: j - i] * gain
def place_local(buf, sig, t0):
    i = int(t0 * SR); j = min(len(buf), i + len(sig))
    if j > i: buf[i:j] += sig[: j - i]
def tt(d): return np.arange(int(d * SR)) / SR
def noise(d): return rng.standard_normal(int(d * SR)).astype(np.float32)
midi = lambda m: 440 * 2 ** ((m - 69) / 12)

# ---------------- instruments ----------------
def marimba(f, d=0.45):
    t = tt(d); s = np.sin(2 * np.pi * f * t) * np.exp(-t * 7) + 0.35 * np.sin(2 * np.pi * f * 4 * t) * np.exp(-t * 22) + 0.15 * np.sin(2 * np.pi * f * 10 * t) * np.exp(-t * 40)
    return (s * np.minimum(1, t / 0.002)).astype(np.float32)
def pluck_bass(f, d=0.4):
    t = tt(d); s = np.sin(2 * np.pi * f * t) + 0.3 * np.sin(4 * np.pi * f * t) + 0.12 * np.sin(6 * np.pi * f * t)
    return (s * np.exp(-t * 5) * np.minimum(1, t / 0.004)).astype(np.float32)
def pad(fs, d, bright=1400):
    t = tt(d); s = np.zeros(len(t))
    for f in fs:
        for det in (-0.12, 0.0, 0.11):
            ph = 2 * np.pi * f * (1 + det / 100) * t
            s += sum(np.sin((h + 1) * ph) / (h + 1) ** 1.6 for h in range(5))
    a = np.minimum(1, t / 0.25) * np.minimum(1, np.maximum(0, d - t) / 0.3)
    return lp_fast((s * a / (3 * len(fs))).astype(np.float32), bright)
def kick():
    t = tt(0.3); f = 48 + 110 * np.exp(-t * 32)
    return (np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 10)).astype(np.float32)
def snare():
    t = tt(0.16); s = rng.standard_normal(len(t)) * np.exp(-t * 30) * 0.6 + np.sin(2 * np.pi * 200 * t) * np.exp(-t * 22) * 0.4
    return hp_fast(s.astype(np.float32), 400)
def hat(d=0.05):
    t = tt(d); return hp_fast((rng.standard_normal(len(t)) * np.exp(-t * 80)).astype(np.float32), 6000)
def bell(f, d=1.2):
    t = tt(d); s = np.sin(2 * np.pi * f * t) * np.exp(-t * 3) + 0.4 * np.sin(2 * np.pi * f * 2.76 * t) * np.exp(-t * 6) + 0.2 * np.sin(2 * np.pi * f * 5.4 * t) * np.exp(-t * 10)
    return (s * np.minimum(1, t / 0.003)).astype(np.float32)

# ---------------- music ----------------
music = np.zeros(N, np.float32)
BPM = 112; beat = 60 / BPM
PROG = [(48, [60, 64, 67]), (45, [57, 60, 64]), (41, [57, 60, 65]), (43, [55, 59, 62])]  # C Am F G
def groove(t0, t1, drums=True, busy=False, bright=1.0, gain=1.0):
    bar = 0; t = t0
    while t < t1 - 0.05:
        root, ch = PROG[bar % 4]
        place(music, pad([midi(m) for m in ch], min(beat * 4, t1 - t) * 0.98, 1200), t, 0.10 * gain)
        for b in range(4):
            tb = t + b * beat
            if tb >= t1 - 0.02: break
            place(music, pluck_bass(midi(root + (7 if b == 3 else 0)), 0.38), tb, 0.42 * gain)
            if drums:
                if b % 2 == 0: place(music, kick(), tb, 0.55 * gain)
                else: place(music, snare(), tb, 0.26 * gain)
                for h in range(4 if busy else 2):
                    th = tb + h * beat / (4 if busy else 2)
                    if th < t1: place(music, hat(), th, (0.10 if h % 2 else 0.14) * gain)
            arp = [ch[0] + 12, ch[1] + 12, ch[2] + 12, ch[1] + 12]
            for e in range(2):
                te = tb + e * beat / 2
                if te < t1 - 0.05: place(music, marimba(midi(arp[(b * 2 + e) % 4] + (12 if busy and e % 2 else 0))), te, 0.16 * gain * bright)
        bar += 1; t += beat * 4

groove(0.0, F(300), drums=True)                    # hook -> janitor: bouncy
groove(F(300), F(446), drums=True, busy=True)      # panic: busier hats, octave up
groove(F(446), F(541), drums=True)                 # Mia chilling
groove(F(541), F(583), drums=False, gain=0.7)      # midnight: drums drop out, cut on "out"
# suspense after the lights go out: low pad + heartbeat
dt = F(739) - F(586); t = tt(dt)
sus = (np.sin(2 * np.pi * 55 * t) + 0.5 * np.sin(2 * np.pi * 58.3 * t) + 0.3 * np.sin(2 * np.pi * 110 * t)) * np.minimum(1, t / 0.6) * np.minimum(1, (dt - t) / 0.3)
place(music, lp_fast(sus.astype(np.float32), 500), F(586), 0.12)
for k in range(9):
    tb = F(600) + k * 0.62
    if tb < F(735): place(music, lp_fast(kick(), 180), tb, 0.45); place(music, lp_fast(kick(), 180), tb + 0.2, 0.3)
groove(F(739), F(936), drums=False, bright=1.2, gain=0.9)   # morning: gentle
# twist: music stops (sting in the sfx), low drone, then a music-box ending
dt = F(988) - F(936); t = tt(dt)
dr = (np.sin(2 * np.pi * 41.2 * t) + 0.4 * np.sin(2 * np.pi * 82.4 * t)) * np.minimum(1, t / 0.4) * np.minimum(1, (dt - t) / 0.4)
place(music, lp_fast(dr.astype(np.float32), 400), F(936), 0.12)
for k, m in enumerate([72, 76, 79, 84, 79, 76, 77, 81, 84, 88]):
    place(music, bell(midi(m), 1.4), F(990) + k * 0.17, 0.12)
place(music, pad([midi(60), midi(64), midi(67), midi(72)], DUR - F(990) + 0.3, 1600), F(990), 0.10)

# ---------------- sfx ----------------
sfx = np.zeros(N, np.float32)
def whoosh(d=0.5, lo=300, hi=2500):
    t = tt(d); return (bp(noise(d), lo, hi) * np.sin(np.pi * t / d) ** 2 * 0.8).astype(np.float32)
def thunk(f0=90, d=0.3):
    t = tt(d); return (np.sin(2 * np.pi * f0 * t * (1 + 0.6 * np.exp(-t * 40))) * np.exp(-t * 14) + lp_fast(noise(d), 1200) * np.exp(-t * 30) * 0.5).astype(np.float32)
def clink(f=2400, d=0.25):
    t = tt(d); return (sum(np.sin(2 * np.pi * f * k * t) * np.exp(-t * (18 + 6 * k)) / k for k in (1, 2.4, 3.9)) * np.minimum(1, t / 0.001)).astype(np.float32)
def jingle(d=0.8, dens=26):
    out = np.zeros(int(d * SR), np.float32)
    for _ in range(int(d * dens)): place_local(out, clink(rng.uniform(2200, 5200), 0.18) * rng.uniform(0.3, 1.0), rng.uniform(0, d - 0.18))
    return out
def chain_rattle(d=0.9):
    out = np.zeros(int(d * SR), np.float32)
    for _ in range(int(d * 30)): place_local(out, clink(rng.uniform(1200, 2600), 0.12) * rng.uniform(0.2, 0.8), rng.uniform(0, d - 0.12))
    return out
def click_lock():
    t = tt(0.25); return (hp_fast(noise(0.25), 1500) * np.exp(-t * 90) * 1.2 + clink(3000, 0.25) * 0.6 + thunk(220, 0.25) * 0.4).astype(np.float32)
def crunch(d=0.22):
    s = np.zeros(int(d * SR), np.float32)
    for _ in range(9): place_local(s, bp(noise(0.05), 1500, 7000) * np.exp(-tt(0.05) * 60) * rng.uniform(0.4, 1), rng.uniform(0, d * 0.7))
    return s
def crinkle(d=0.5):
    t = tt(d); return (bp(noise(d), 2500, 9000) * (np.abs(np.sin(2 * np.pi * 9 * t)) ** 3) * np.sin(np.pi * t / d) * 0.7).astype(np.float32)
def steps(n, gap=0.32, f0=110, soft=1.0):
    out = np.zeros(int((n * gap + 0.3) * SR), np.float32)
    for k in range(n): place_local(out, lp_fast(thunk(f0 + rng.uniform(-10, 10), 0.18), 900) * 0.7 * soft, k * gap)
    return out
def whistle_tune(notes, step=0.22):
    out = np.zeros(int((len(notes) * step + 0.3) * SR), np.float32)
    for k, m in enumerate(notes):
        if m is None: continue
        d = step * 0.95; t = tt(d); f = midi(m) * (1 + 0.012 * np.sin(2 * np.pi * 6 * t))
        s = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.minimum(1, t / 0.03) * np.minimum(1, (d - t) / 0.04) + 0.05 * hp_fast(noise(d), 4000)
        place_local(out, s.astype(np.float32), k * step)
    return out
def slide_down(d=0.6, f0=1400, f1=300):
    t = tt(d); f = f0 * (f1 / f0) ** (t / d); return (np.sin(2 * np.pi * np.cumsum(f) / SR) * np.minimum(1, t / 0.02) * np.minimum(1, (d - t) / 0.08)).astype(np.float32)
def glass_bang():
    t = tt(0.4); return (thunk(75, 0.4) + bp(noise(0.4), 800, 4000) * np.exp(-t * 25) * 0.35 + clink(1800, 0.4) * 0.15).astype(np.float32)
def metal_echo(d=0.9):
    t = tt(d); s = bp(noise(d), 300, 1800) * np.exp(-t * 3) * 0.5; e = np.zeros_like(s)
    for k, dl in enumerate([0.0, 0.09, 0.19, 0.31]): place_local(e, s * (0.7 ** k), dl)
    return e
def window_thud(): return (thunk(140, 0.3) + clink(1400, 0.3) * 0.25).astype(np.float32)
def tick(f=2600):
    t = tt(0.06); return (np.sin(2 * np.pi * f * t) * np.exp(-t * 120) + hp_fast(noise(0.06), 3000) * np.exp(-t * 150) * 0.4).astype(np.float32)
def bong(): return (bell(midi(60), 2.0) * 0.8 + bell(midi(48), 2.0) * 0.6).astype(np.float32)
def clunk():
    t = tt(0.25); return (thunk(60, 0.25) * 0.9 + hp_fast(noise(0.25), 2000) * np.exp(-t * 80) * 0.4).astype(np.float32)
def hit_low():
    t = tt(1.8); return (np.sin(2 * np.pi * 38 * t) * np.exp(-t * 1.6) * 1.2 + lp_fast(noise(1.8), 700) * np.exp(-t * 6) * 0.7).astype(np.float32)
def ting():
    t = tt(1.0); return (sum(np.sin(2 * np.pi * f * t) * np.exp(-t * k) for f, k in [(2093, 4), (3136, 6), (4186, 8)]) * 0.3).astype(np.float32)
def birds(d):
    out = np.zeros(int(d * SR), np.float32)
    for _ in range(int(d * 2.2)):
        t0 = rng.uniform(0, d - 0.5); n = int(rng.integers(2, 5)); f0 = rng.uniform(2800, 4200)
        for j in range(n):
            dd = 0.07; t = tt(dd); f = f0 * (1 + 0.25 * np.sin(np.pi * t / dd)) * (1 + 0.05 * j)
            place_local(out, (np.sin(2 * np.pi * np.cumsum(f) / SR) * np.sin(np.pi * t / dd) * 0.5).astype(np.float32), t0 + j * 0.1)
    return out
def pop():
    t = tt(0.25); f = 300 * (1 + 2.5 * t / 0.25); return (np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 14)).astype(np.float32)
def bus_pass(d):
    t = tt(d); eng = np.sin(2 * np.pi * 42 * t) * 0.5 + lp_fast(noise(d), 400) * 0.6
    return (lp_fast(eng.astype(np.float32), 600) * np.sin(np.pi * t / d) ** 1.5).astype(np.float32)
def honk():
    t = tt(0.35); s = (np.sign(np.sin(2 * np.pi * 330 * t)) + np.sign(np.sin(2 * np.pi * 415 * t))) * 0.5
    return (lp_fast(s.astype(np.float32), 2200) * np.minimum(1, t / 0.01) * np.minimum(1, (0.35 - t) / 0.05) * 0.5).astype(np.float32)
def rattle_door(d=0.7):
    out = np.zeros(int(d * SR), np.float32)
    for k in range(int(d * 9)): place_local(out, thunk(rng.uniform(90, 130), 0.2) * rng.uniform(0.4, 0.9) + clink(rng.uniform(1500, 2500), 0.2) * 0.2, k / 9 + rng.uniform(0, 0.03))
    return out
def trophies_rattle(d=1.0):
    out = np.zeros(int(d * SR), np.float32)
    for _ in range(int(d * 40)): place_local(out, clink(rng.uniform(900, 3200), 0.2) * rng.uniform(0.2, 0.9), rng.uniform(0, d - 0.2))
    return out

C = []
def cue(fr, sig, g, note=''): place(sfx, sig, F(fr), g); C.append((fr, note))
cue(10, whoosh(0.9, 200, 1800), 0.55, 'pull-back whoosh')
cue(30, chain_rattle(0.6), 0.45, 'chain on "locked"')
cue(96, rattle_door(1.0), 0.5, 'Jake rattles the door')
cue(126, crunch(), 0.7, 'chip crunch on "out"')
cue(149, whoosh(0.4, 600, 4000), 0.5, 'flash: time jump')
cue(156, bus_pass(1.6), 0.6, 'bus drives off'); cue(166, honk(), 0.35, 'bus honk')
for k in range(14): cue(199 + k * 2.6, tick(3000), 0.35, 'clock fast-forward' if k == 0 else '')
cue(240, whistle_tune([72, 74, 76, None, 79, 76, 74, 72, None, 74, 76, 72]), 0.22, 'janitor whistles')
cue(240, steps(4, 0.36, 100, 0.8), 0.5, 'janitor steps')
cue(264, chain_rattle(0.6), 0.5, 'chain wrap')
cue(282, click_lock(), 0.85, 'padlock snap on "door"')
cue(290, steps(4, 0.32, 100, 0.7), 0.4, 'janitor leaves'); cue(288, steps(5, 0.18, 150, 0.5), 0.3, 'Jake runs to the door')
cue(304, slide_down(0.55), 0.22, 'panic slide')
for h in [341, 350, 359, 366]: cue(h, glass_bang(), 0.75, 'bang on glass')
cue(372, metal_echo(1.0), 0.45, 'yell echoes in the vent')
for w in [400, 412, 425]: cue(w, window_thud(), 0.6, 'window tug')
cue(448, crinkle(0.5), 0.45, 'chip bag')
for c in [468, 477, 508, 517]: cue(c, crunch(), 0.55, 'crunch')
cue(494, steps(6, 0.15, 160, 0.4), 0.3, 'Jake runs past')
for k in range(4): cue(541 + k * 4, tick(2200), 0.3, 'clock tick' if k == 0 else '')
cue(553, bong(), 0.45, 'midnight bong')
for k in range(4): cue(583 + k * 1.6, clunk(), 0.55, 'lights clunk off' if k == 0 else '')
cue(606, steps(5, 0.42, 90, 0.35), 0.35, 'slow footsteps')
cue(612, jingle(1.1, 22), 0.35, 'keys rattle down the hall'); cue(632, jingle(0.6, 22), 0.3)
cue(660, whoosh(0.35, 800, 5000), 0.5, 'scream whip')
cue(700, trophies_rattle(0.95), 0.6, 'trophies shake'); cue(714, trophies_rattle(0.5), 0.45)
cue(722, whoosh(0.35, 600, 4000), 0.45, 'whip to Mia'); cue(726, jingle(0.4, 30), 0.35, 'her keys')
cue(737, whoosh(0.5, 400, 3500), 0.5, 'morning flash')
cue(742, birds(6.2), 0.25, 'morning birds')
cue(768, steps(2, 0.3, 120, 0.5), 0.35, 'janitor in the doorway')
cue(808, steps(4, 0.34, 110, 0.6), 0.4, 'janitor walks over')
cue(906, jingle(0.7, 26), 0.45, 'keys jingle'); cue(911, ting(), 0.35, 'ting on "keys"')
cue(935, hit_low(), 0.9, 'twist sting: low hit')
cue(957, ting(), 0.3, 'glasses glint')
cue(1025, pop(), 0.5, 'heart pop'); cue(1026, ting(), 0.25, 'sparkle')

def save(name, x):
    x = x[: int(DUR * SR)]
    with wave.open(name, 'wb') as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR)
        pk = np.abs(x).max() or 1; w.writeframes((x / pk * 0.95 * 32767).astype(np.int16).tobytes())
save('music.wav', music); save('sfx.wav', sfx)
json.dump([c for c in C if c[1]], open('work/sfx_cues.json', 'w'), indent=0)
print('stems ok', round(DUR, 2), 's,', len([c for c in C if c[1]]), 'cues')

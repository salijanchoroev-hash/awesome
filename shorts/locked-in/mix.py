#!/usr/bin/env python3
"""Level-locked mix:  python3 mix.py voice.wav music.wav sfx.wav  -> mix_raw.wav (float, 48 kHz mono)
Music = 50 % of the voice's gated RMS (-6.0 dB). SFX = 50 % of the voice's gated RMS, lowered further if needed so
SFX peaks stay at or below 0.7x the voice peak. Voice is untouched. No ducking, no compression."""
import sys, subprocess, numpy as np, wave
SR = 48000
def load(p):
    raw = subprocess.run(["ffmpeg", "-v", "error", "-i", p, "-ac", "1", "-ar", str(SR), "-f", "f32le", "-"], capture_output=True, check=True).stdout
    return np.frombuffer(raw, np.float32).copy()
def gated_rms(x, gate_db=-40.0, win=0.4):
    n = int(win * SR); k = len(x) // n
    if k == 0: return float(np.sqrt(np.mean(x ** 2)))
    blk = np.sqrt(np.mean(x[: k * n].reshape(k, n) ** 2, axis=1)); top = blk.max()
    keep = blk[blk > top * 10 ** (gate_db / 20)]; keep = keep[keep > np.sqrt(np.mean(keep ** 2)) * 10 ** (-20 / 20)]  # absolute + relative gate
    return float(np.sqrt(np.mean(keep ** 2)))
db = lambda r: 20 * np.log10(max(r, 1e-12))
voice, music, sfx = (load(p) for p in sys.argv[1:4])
N = len(voice); music = np.pad(music, (0, max(0, N - len(music))))[:N]; sfx = np.pad(sfx, (0, max(0, N - len(sfx))))[:N]
vr, vp = gated_rms(voice), np.abs(voice).max()
gm = 0.5 * vr / gated_rms(music)
gs = 0.5 * vr / gated_rms(sfx)
gs = min(gs, 0.7 * vp / np.abs(sfx).max())
m, s = music * gm, sfx * gs
print(f"voice  gated RMS {db(vr):6.1f} dBFS  peak {db(vp):5.1f}")
print(f"music  gated RMS {db(gated_rms(m)):6.1f} dBFS  -> {db(gated_rms(m)) - db(vr):+.1f} dB vs voice")
print(f"sfx    gated RMS {db(gated_rms(s)):6.1f} dBFS  -> {db(gated_rms(s)) - db(vr):+.1f} dB vs voice   peak {np.abs(s).max() / vp:.2f}x voice peak")
mix = (voice + m + s).astype(np.float32)
fade = int(0.05 * SR); mix[-fade:] *= np.linspace(1, 0, fade)
with wave.open("mix_raw.wav", "wb") as w:
    w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR)
    pk = np.abs(mix).max(); g = min(1.0, 0.98 / pk)  # headroom only (uniform), real loudness is set in finish.sh
    w.writeframes((mix * g * 32767).astype(np.int16).tobytes())
print(f"mix_raw.wav written ({len(mix) / SR:.2f} s, pre-gain {db(g):+.1f} dB uniform)")

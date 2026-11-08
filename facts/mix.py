"""Level-locked mix: music at 50 % of the voice's gated RMS (-6 dB), SFX at 50 % with peaks capped at 0.7x the voice peak.
No ducking, no compression: voice untouched, one linear gain per stem.  python3 mix.py voice.mp3 music.wav sfx.wav"""
import sys, subprocess, wave, numpy as np
SR = 48000
def load(p):
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', p, '-ac', '1', '-ar', str(SR), '-f', 'f32le', '-'], capture_output=True, check=True).stdout
    return np.frombuffer(raw, np.float32).copy()
def gated_rms(x, gate_db=-40):
    w = int(0.4 * SR); n = len(x) // w
    if n == 0: return float(np.sqrt(np.mean(x ** 2)) + 1e-12)
    blk = np.sqrt(np.mean(x[: n * w].reshape(n, w) ** 2, axis=1) + 1e-12)
    ref = blk.max(); keep = blk[20 * np.log10(blk / ref) > gate_db]
    return float(np.sqrt(np.mean(keep ** 2)))
db = lambda r: 20 * np.log10(max(r, 1e-12))
voice, music, sfx = (load(p) for p in sys.argv[1:4])
N = max(len(voice), len(music), len(sfx))
pad = lambda x: np.pad(x, (0, N - len(x)))
voice, music, sfx = pad(voice), pad(music), pad(sfx)
v = gated_rms(voice); vpk = np.abs(voice).max()
music *= 0.5 * v / gated_rms(music)
sfx *= 0.5 * v / gated_rms(sfx, -30)
if np.abs(sfx).max() > 0.7 * vpk: sfx *= 0.7 * vpk / np.abs(sfx).max()
mix = voice + music + sfx
print(f'voice gated RMS {db(v):6.1f} dBFS  peak {db(vpk):6.1f}')
print(f'music vs voice  {db(gated_rms(music)) - db(v):+5.1f} dB (target -6.0)')
print(f'sfx   vs voice  {db(gated_rms(sfx, -30)) - db(v):+5.1f} dB (target <= -6.0), sfx peak/voice peak {np.abs(sfx).max() / vpk:.2f}')
with wave.open('mix_raw.wav', 'wb') as w:
    w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR)
    peak = np.abs(mix).max(); g = min(1.0, 0.98 / peak)  # headroom only; finish.sh sets loudness
    w.writeframes((mix * g * 32767).astype(np.int16).tobytes())
print('mix_raw.wav', len(mix) / SR, 's')

"""Voiceover with Kokoro (offline). Generates each sentence separately, joins with fixed pauses,
and writes exact phrase timings (work/phrases_tts.json) so the picture can be timed without ASR."""
import json, sys, numpy as np, soundfile as sf
from kokoro_onnx import Kokoro
MODEL = "/root/tts/kokoro-v1.0.onnx"; VOICES = "/root/tts/voices-v1.0.bin"
NARR = sys.argv[1] if len(sys.argv) > 1 else "af_heart"
SPEED = float(sys.argv[2]) if len(sys.argv) > 2 else 1.08
JAN = sys.argv[3] if len(sys.argv) > 3 else "am_onyx"
OUT = sys.argv[4] if len(sys.argv) > 4 else "voice.wav"
# (text, voice, pause after in s)
LINES = [
    ("Two teenagers got locked in their high school overnight.", NARR, 0.30),
    ("Only one of them wanted out.", NARR, 0.55),
    ("One Friday in Ohio, detention ran late, and the janitor locked every door.", NARR, 0.45),
    ("Jake panicked.", NARR, 0.22),
    ("He banged on doors, yelled into vents, and tried every window.", NARR, 0.40),
    ("Mia just sat on a desk, eating vending machine chips.", NARR, 0.50),
    ("At midnight, the lights went out.", NARR, 0.32),
    ("Something rattled down the hall.", NARR, 0.40),
    ("Jake screamed so loud, the trophies shook.", NARR, 0.55),
    ("In the morning, the janitor found them in the library and asked Mia one question:", NARR, 0.30),
    ("Why didn't you just use your keys?", JAN, 0.50),
    ("Her mom was the principal.", NARR, 0.45),
    ("She just wasn't ready to leave him.", NARR, 0.0),
]
k = Kokoro(MODEL, VOICES)
def trim(x, sr, thr=0.012, pad=0.04):
    a = np.abs(x); idx = np.where(a > thr)[0]
    if len(idx) == 0: return x
    i0 = max(0, idx[0] - int(pad * sr)); i1 = min(len(x), idx[-1] + int(pad * 1.5 * sr))
    return x[i0:i1]
parts, timings, t, sr0 = [], [], 0.15, None
for text, voice, pause in LINES:
    spd = SPEED * (0.95 if voice == JAN else 1.0)
    s, sr = k.create(text, voice=voice, speed=spd, lang="en-us"); sr0 = sr
    s = trim(np.asarray(s, np.float32), sr)
    fr = s[: len(s) // 480 * 480].reshape(-1, 480); r = np.sqrt((fr ** 2).mean(1)); g = r[r > r.max() * 0.1]
    s = s * (0.09 / np.sqrt((g ** 2).mean()))
    d = len(s) / sr
    timings.append({"text": text, "voice": voice, "start": round(t, 3), "end": round(t + d, 3)})
    parts.append(s); parts.append(np.zeros(int(pause * sr), np.float32)); t += d + pause
    print(f"{t - pause - d:6.2f}-{t - pause:6.2f}  {voice}  {text}")
lead = np.zeros(int(0.15 * sr0), np.float32); tail = np.zeros(int(0.35 * sr0), np.float32)
y = np.concatenate([lead] + parts + [tail])
sf.write(OUT, y, sr0)
json.dump({"duration": len(y) / sr0, "lines": timings}, open(OUT.rsplit('.', 1)[0] + "_lines.json", "w"), indent=1)
print("total", round(len(y) / sr0, 2), "s")

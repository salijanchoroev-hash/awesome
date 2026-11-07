# Locked In: animated YouTube Short

Finished video: [`out/Locked-In.mp4`](out/Locked-In.mp4). It is 1080×1920 (9:16) at 30 fps and runs 34.8 s, with English narration and burned-in subtitles. Loudness is −14.5 LUFS and the true peak is −1.8 dBFS.
For upload there are also YouTube subtitles in [`work/captions.srt`](work/captions.srt).

## Script (103 words)

> Two teenagers got locked in their high school overnight. Only one of them wanted out.
> One Friday in Ohio, detention ran late, and the janitor locked every door.
> Jake panicked. He banged on doors, yelled into vents, and tried every window.
> Mia just sat on a desk, eating vending machine chips.
> At midnight, the lights went out. Something rattled down the hall.
> Jake screamed so loud, the trophies shook.
> In the morning, the janitor found them in the library and asked Mia one question:
> "Why didn't you just use your keys?"
> Her mom was the principal.
> She just wasn't ready to leave him.

The story and characters are original fiction.

## How it was made

- **Voice**: [`tts/make_voice.py`](tts/make_voice.py) uses the offline Kokoro TTS. The narrator is `af_heart` and the janitor's line is `am_onyx`. Each sentence is generated separately, so the phrase timings are exact.
- **Picture**: three.js runs in headless Chromium, using the cartoon-short kit's engine. It draws flat 2D character cards inside an inked toon 3D school.
  - [`web/teen.js`](web/teen.js) is the cast: Jake, Mia, the janitor and the principal.
  - [`web/school_paint.js`](web/school_paint.js) paints the textures.
  - [`web/main.js`](web/main.js) builds the world: facade, hallway, classroom, library and street.
  - [`web/story.js`](web/story.js) holds 22 shots with cameras, light presets, poses and effects. Each one is timed to the voice.
- **Sound**: [`audio.py`](audio.py) synthesizes a music bed and 48 SFX cues.
  - [`mix.py`](mix.py) sets the levels from gated RMS. Music sits at −6.0 dB against the voice. SFX also sit at −6.0 dB, and their peaks stay at or below 0.7× the voice peak.
  - The mix uses no ducking or compression. [`finish.sh`](finish.sh) applies one linear gain plus a peak limiter.
- **Subtitles**: [`captions.py`](captions.py) shows chunks of 1–3 words and highlights the word being spoken in yellow. The text stays inside the Shorts safe zone.

## Rebuild

```bash
bash <kit>/tools/setup.sh ~/shorts/locked-in    # engine, three.js r160, toon.ts base, playwright link
# copy web/*.js + the scripts in this folder over the project, then:
cat web/toonbase.js web/roman.js web/teen.js > web/toon.js
node render.mjs frames "0-1042"
python3 audio.py && python3 mix.py voice.wav music.wav sfx.wav
python3 captions.py frames frames_cap
FRAMES=frames_cap bash finish.sh "Locked In"
```

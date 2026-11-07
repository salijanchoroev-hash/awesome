#!/usr/bin/env bash
# Encode frames + mix -> mp4, then QA.   FRAMES=frames_cap bash finish.sh "Title Of Short"
# Loudness: ONE linear gain to about -14 LUFS + a -1 dBFS peak limiter (no dynamic loudnorm, so the voice/music/SFX ratios stay locked).
set -e; T="${1:-short}"; F="out/${T// /-}.mp4"; FR="${FRAMES:-frames}"; mkdir -p out
I=$(ffmpeg -nostats -i mix_raw.wav -af ebur128 -f null - 2>&1 | grep -E "^\s+I:" | tail -1 | awk '{print $2}')
G=$(python3 -c "print(round(-14.0 - ($I), 2))"); echo "mix_raw integrated $I LUFS -> linear gain ${G} dB"
ffmpeg -v error -y -i mix_raw.wav -af "volume=${G}dB,alimiter=limit=0.891:attack=2:release=60:level=disabled" -ar 48000 -ac 2 -c:a pcm_s16le mix.wav
ffmpeg -v error -y -framerate 30 -i "$FR/f%04d.jpg" -i mix.wav -map 0:v:0 -map 1:a:0 -c:v libx264 -preset slow -crf 17 -pix_fmt yuv420p -profile:v high -c:a aac -b:a 192k -shortest -movflags +faststart "$F"
ffprobe -v error -show_entries format=duration -show_entries stream=codec_name,width,height,r_frame_rate -of compact "$F"
echo "--- QA (empty = no black/frozen spans)"; ffmpeg -i "$F" -vf "freezedetect=n=0.0005:d=0.4,blackdetect=d=0.05" -an -f null - 2>&1 | grep -E "freeze_start|freeze_duration|black_start" || true
ffmpeg -i "$F" -af ebur128=peak=true -f null - 2>&1 | grep -E "^\s+(I|Peak):" | tail -2
ffmpeg -v error -y -i "$F" -vf "fps=2,scale=180:-1,tile=10x7" -frames:v 1 out/qa_sheet.jpg; echo "$F"

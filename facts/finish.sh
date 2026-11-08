#!/usr/bin/env bash
# Captions + loudness + encode + QA.   bash finish.sh "Title Of Short"
set -e; T="${1:-short}"; F="out/${T// /-}.mp4"; mkdir -p out
python3 captions.py frames frames_cap
# one linear gain to -14 LUFS integrated, then a -1 dBFS peak limiter (no auto-level, no compression)
I=$(ffmpeg -hide_banner -nostats -i mix_raw.wav -af ebur128=framelog=quiet -f null - 2>&1 | grep -E "^\s+I:" | tail -1 | awk '{print $2}')
G=$(python3 -c "print(round(-14 - ($I), 2))"); echo "mix integrated $I LUFS -> gain $G dB"
ffmpeg -v error -y -i mix_raw.wav -af "volume=${G}dB,alimiter=limit=0.891:attack=3:release=60:level=disabled" -ar 48000 -ac 2 mix.wav
ffmpeg -v error -y -framerate 30 -i frames_cap/f%04d.jpg -i mix.wav -map 0:v:0 -map 1:a:0 -c:v libx264 -preset slow -crf 17 -pix_fmt yuv420p \
  -c:a aac -b:a 192k -shortest -movflags +faststart "$F"
ffprobe -v error -show_entries format=duration -show_entries stream=width,height,r_frame_rate,nb_frames -of compact "$F"
echo "--- QA (empty = no black/frozen spans)"; ffmpeg -i "$F" -vf "freezedetect=n=0.0005:d=0.4,blackdetect=d=0.05" -an -f null - 2>&1 | grep -E "freeze_start|freeze_dur|black_start" || true
ffmpeg -hide_banner -nostats -i "$F" -af ebur128=peak=true -f null - 2>&1 | grep -E "^\s+(I|Peak):" | tail -2
ffmpeg -v error -y -i "$F" -vf "fps=2,scale=180:-1,tile=10x6" -frames:v 1 out/qa_sheet.jpg; echo "$F"

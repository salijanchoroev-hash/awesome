#!/usr/bin/env python3
"""Burn Shorts-style captions onto rendered frames.
   python3 captions.py frames frames_cap   (reads work/words.json; writes work/captions.srt too)
Style: 1-3 word chunks in heavy uppercase, white with a thick ink outline, the word being spoken in yellow,
a small pop when a chunk appears. Kept inside the Shorts safe zone (clear of the bottom title area and right buttons)."""
import sys, os, json, re
from PIL import Image, ImageDraw, ImageFont
from concurrent.futures import ProcessPoolExecutor

SRC, DST = sys.argv[1], sys.argv[2]
FPS, W, H = 30, 1080, 1920
CX, CY, MAXW = 505, 1295, 820            # centre a bit left of middle: right edge stays clear of the Shorts buttons
FONT = '/usr/share/fonts/opentype/inter/InterDisplay-Black.otf'
SIZE, STROKE = 88, 10
WHITE, YELLOW, INK = (255, 255, 255), (255, 214, 64), (24, 16, 28)

words = json.load(open('work/words.json'))
# chunking: break after punctuation, max 3 words / 15 chars, keep short function words with the next word
chunks, cur = [], []
for i, w in enumerate(words):
    cur.append(w)
    txt = ' '.join(x['w'] for x in cur)
    nxt = words[i + 1] if i + 1 < len(words) else None
    punct = bool(re.search(r'[.,:?!"]$', w['w']))
    gap = nxt is not None and nxt['s'] - w['e'] > 0.18
    small = re.sub(r'\W', '', w['w']).lower() in {'a', 'the', 'in', 'on', 'of', 'to', 'so', 'and', 'at', 'he', 'his', 'her', 'she', 'just', 'your', 'you'}
    if nxt is None or punct or gap or len(cur) >= 3 or (len(txt) >= 11 and not small):
        chunks.append(cur); cur = []
# merge chunks that would flash by too fast into the previous one
merged = []
for c in chunks:
    if merged and (c[-1]['e'] - c[0]['s']) < 0.36 and len(' '.join(x['w'] for x in merged[-1] + c)) <= 20 and not re.search(r'[.?!:]$', merged[-1][-1]['w']):
        merged[-1] = merged[-1] + c
    else: merged.append(c)
chunks = merged
cap = []
for k, c in enumerate(chunks):
    a = round(c[0]['s'] * FPS) - 1
    nxt_a = round(chunks[k + 1][0]['s'] * FPS) - 1 if k + 1 < len(chunks) else 10 ** 9
    b = min(nxt_a - 1, round(c[-1]['e'] * FPS) + 9)
    if nxt_a - b <= 7: b = nxt_a - 1                       # no flicker gaps between chunks
    cap.append({'a': a, 'b': b, 'words': [(x['w'].upper().replace('"', ''), round(x['s'] * FPS) - 1) for x in c]})
# SRT (for the YouTube upload / accessibility)
def ts(f):
    s = f / FPS; return f"{int(s // 3600):02d}:{int(s % 3600 // 60):02d}:{int(s % 60):02d},{int(s * 1000 % 1000):03d}"
with open('work/captions.srt', 'w') as fh:
    for i, c in enumerate(cap): fh.write(f"{i + 1}\n{ts(c['a'])} --> {ts(c['b'] + 1)}\n{' '.join(w for w, _ in c['words'])}\n\n")
json.dump(cap, open('work/captions.json', 'w'), indent=0)

font = ImageFont.truetype(FONT, SIZE)
def chunk_image(c, f):
    sp = font.getlength(' ')
    ws = [(w, font.getlength(w)) for w, _ in c['words']]
    lines, line, lw = [], [], 0
    for w, l in ws:
        if line and lw + sp + l > MAXW: lines.append(line); line, lw = [], 0
        line.append((w, l)); lw += (sp if len(line) > 1 else 0) + l
    lines.append(line)
    lh = int(SIZE * 1.12); pad = STROKE + 14
    bw = int(max(sum(l for _, l in ln) + sp * (len(ln) - 1) for ln in lines)) + 2 * pad
    bh = lh * len(lines) + 2 * pad
    im = Image.new('RGBA', (bw, bh), (0, 0, 0, 0)); d = ImageDraw.Draw(im)
    spoken = [i for i, (_, s) in enumerate(c['words']) if f >= s]
    cur = spoken[-1] if spoken else -1
    idx = 0
    for li, ln in enumerate(lines):
        x = (bw - (sum(l for _, l in ln) + sp * (len(ln) - 1))) / 2; y = pad + li * lh
        for w, l in ln:
            d.text((x + 3, y + 7), w, font=font, fill=(0, 0, 0, 110), stroke_width=STROKE, stroke_fill=(0, 0, 0, 110))  # soft drop shadow
            d.text((x, y), w, font=font, fill=YELLOW if idx == cur else WHITE, stroke_width=STROKE, stroke_fill=INK)
            x += l + sp; idx += 1
    return im
def back(t, s=1.7): t = min(1, max(0, t)) - 1; return t * t * ((s + 1) * t + s) + 1
def do(f):
    src = os.path.join(SRC, f'f{f:04d}.jpg'); out = os.path.join(DST, f'f{f:04d}.jpg')
    im = Image.open(src).convert('RGB')
    c = next((c for c in cap if c['a'] <= f <= c['b']), None)
    if c:
        ci = chunk_image(c, f)
        k = 0.78 + 0.22 * back((f - c['a']) / 4)
        if k != 1: ci = ci.resize((max(1, int(ci.width * k)), max(1, int(ci.height * k))), Image.LANCZOS)
        im.paste(ci, (int(CX - ci.width / 2), int(CY - ci.height / 2)), ci)
    im.save(out, quality=95)
    return f
if __name__ == '__main__':
    os.makedirs(DST, exist_ok=True)
    n = len([x for x in os.listdir(SRC) if x.endswith('.jpg')])
    with ProcessPoolExecutor(4) as ex: list(ex.map(do, range(n), chunksize=16))
    print(f'{len(cap)} caption chunks on {n} frames -> {DST}; work/captions.srt')
    for c in cap: print(f"{c['a']:5d}-{c['b']:5d}  {' '.join(w for w, _ in c['words'])}")

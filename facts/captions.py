"""Animated word-by-word captions burned onto rendered frames.
python3 captions.py frames frames_cap [frame list]   (word timings from work/words.json)
Style: big Inter Black caps, thick ink outline + drop shadow; each word pops in on its first frame,
the spoken word is yellow and bounces, key words turn orange and wiggle."""
import json, sys, os, math
from PIL import Image, ImageDraw, ImageFont

SRC, DST = sys.argv[1], sys.argv[2]
ONLY = None
if len(sys.argv) > 3:
    ONLY = set()
    for part in sys.argv[3].split(','):
        a, _, b = part.partition('-'); ONLY.update(range(int(a), int(b or a) + 1))
os.makedirs(DST, exist_ok=True)
FONT = '/usr/share/fonts/opentype/inter/Inter-Black.otf'
W, H, CY = 1080, 1920, 1395          # caption centre line (lower third, clear of the shorts UI)
WORDS = json.load(open('work/words.json'))
import re as _re
KEYW = {'пять','три','сердца!','третье','солнца','восемь','минут','двадцать','секунд.','назад!','акулы','раньше,','деревья!','четырёхсот','миллионов','бананы','ягодами!','клубника','нет!','шутить.','нептуне','уране,','алмазные','осадки!','дождь','алмазов?','бонус','жирафа','позвонков,','семь.','двадцати','пяти','сантиметров!','комментариях!','начало…','один!','два!','три!','четыре!','пять!'}
CHUNKS, cur = [], []
for i, w in enumerate(WORDS):
    if w['w'] == '—': continue
    cur.append(i)
    if _re.search(r'[.,!?…]$', w['w']) or len(cur) == 3 or sum(len(WORDS[j]['w']) for j in cur) > 16: CHUNKS.append(cur); cur = []
if cur: CHUNKS.append(cur)
KEY = {i for i, w in enumerate(WORDS) if w['w'].lower() in KEYW}
WHITE, YELLOW, ORANGE, INK = (255, 255, 255), (255, 222, 66), (255, 112, 52), (28, 18, 30)
clean = lambda s: s.strip('.,—!?').upper()

def ease_back(t, s=2.2):
    t = min(1, max(0, t)) - 1; return t * t * ((s + 1) * t + s) + 1

_cache = {}
def word_img(text, size, col):
    k = (text, size, col)
    if k in _cache: return _cache[k]
    f = ImageFont.truetype(FONT, size); sw = max(6, size // 9)
    bb = f.getbbox(text, stroke_width=sw); w, h = bb[2] - bb[0] + 24, bb[3] - bb[1] + 30
    im = Image.new('RGBA', (w, h), (0, 0, 0, 0)); d = ImageDraw.Draw(im)
    # soft drop shadow
    sh = Image.new('RGBA', (w, h), (0, 0, 0, 0)); ds = ImageDraw.Draw(sh)
    ds.text((12 - bb[0], 12 - bb[1] + 9), text, font=f, fill=(0, 0, 0, 150), stroke_width=sw, stroke_fill=(0, 0, 0, 150))
    im.alpha_composite(sh)
    d.text((12 - bb[0], 12 - bb[1]), text, font=f, fill=col + (255,), stroke_width=sw, stroke_fill=INK + (255,))
    _cache[k] = im; return im

def layout(chunk, size):
    f = ImageFont.truetype(FONT, size); gap = size * 0.42
    ws = [(f.getbbox(clean(WORDS[i]['w']))[2] - f.getbbox(clean(WORDS[i]['w']))[0]) * (1.32 if i == CHUNKS[-1][-1] else 1.08) for i in chunk]
    return ws, gap, sum(ws) + gap * (len(ws) - 1)

def frame_caption(fr):
    # which chunk is on screen
    starts = [WORDS[c[0]]['s'] * 30 - 2 for c in CHUNKS]
    ci = None
    for k, c in enumerate(CHUNKS):
        end = starts[k + 1] - 1 if k + 1 < len(CHUNKS) else WORDS[c[-1]]['e'] * 30 + 12
        if starts[k] <= fr <= end: ci = k
    if ci is None: return []
    chunk = CHUNKS[ci]; size = 104
    ws, gap, tot = layout(chunk, size)
    while tot > W - 110: size -= 4; ws, gap, tot = layout(chunk, size)
    big = chunk == CHUNKS[-1]
    out = []; x = (W - tot) / 2; age = fr - starts[ci]
    for j, i in enumerate(chunk):
        s0 = WORDS[i]['s'] * 30 - 1; nxt = WORDS[chunk[j + 1]]['s'] * 30 - 1 if j + 1 < len(chunk) else WORDS[i]['e'] * 30 + 6
        cx = x + ws[j] / 2; x += ws[j] + gap
        if fr < s0: continue                                    # not spoken yet
        k = fr - s0; speaking = fr < nxt
        sc = 0.55 + 0.45 * ease_back(k / 5) if k < 5 else 1.0     # pop in
        if speaking: sc *= 1.0 + 0.08 * math.exp(-k / 6)
        col = (ORANGE if i in KEY else YELLOW) if speaking else (ORANGE if i in KEY else WHITE)
        if big and i == CHUNKS[-1][-1]: sc *= 1.25
        rot = 4 * math.sin(fr * 0.9) * math.exp(-k / 10) if (i in KEY and speaking) else 0
        dy = -18 * math.exp(-age / 3)                            # whole line rises in
        out.append((clean(WORDS[i]['w']), size, col, cx, CY + dy, sc, rot))
    return out

frames = sorted(os.listdir(SRC))
for name in frames:
    fr = int(name[1:5])
    if ONLY is not None and fr not in ONLY: continue
    im = Image.open(os.path.join(SRC, name)).convert('RGBA')
    for text, size, col, cx, cy, sc, rot in frame_caption(fr):
        wi = word_img(text, size, col)
        if sc != 1.0: wi = wi.resize((max(1, int(wi.width * sc)), max(1, int(wi.height * sc))), Image.LANCZOS)
        if rot: wi = wi.rotate(rot, resample=Image.BICUBIC, expand=True)
        im.alpha_composite(wi, (int(cx - wi.width / 2), int(cy - wi.height / 2)))
    im.convert('RGB').save(os.path.join(DST, name), quality=95)
print('captions done', len(frames))

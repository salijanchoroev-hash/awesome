// Cardboard-city painters: kraft liners, flute edges, poster paint, marker drawings, printed pictograms.
// Same flat-with-dark-seams style as paint.js. All deterministic (seeded).
import { rng } from './paint.js';

const cv = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return [c, c.getContext('2d')]; };
const hsl = (h, s, l, a = 1) => `hsla(${h},${s}%,${l}%,${a})`;
const hex = (c) => { const n = parseInt(c.slice(1), 16); return [n >> 16 & 255, n >> 8 & 255, n & 255]; };
export const tint = (c, k, a = 1) => { const [r, g, b] = hex(c); const f = (v) => Math.max(0, Math.min(255, Math.round(k >= 1 ? v + (255 - v) * (k - 1) : v * k))); return `rgba(${f(r)},${f(g)},${f(b)},${a})`; };
export const MARKER = '#2a2028';
export const KRAFT = '#c99a62';

/** draw fn at (x,y) and its wrapped copies so the tile stays seamless */
const wrap = (S, x, y, rad, fn) => { for (const dx of [-S, 0, S]) for (const dy of [-S, 0, S]) { const X = x + dx, Y = y + dy; if (X + rad < 0 || X - rad > S || Y + rad < 0 || Y - rad > S) continue; fn(X, Y); } };

/** hand-drawn marker stroke through points (slight wobble) */
export const marker = (g, pts, w, col = MARKER, r = Math.random, wob = 1.6, close = false) => {
  g.save(); g.strokeStyle = col; g.lineWidth = w; g.lineCap = 'round'; g.lineJoin = 'round'; g.beginPath();
  const P = close ? [...pts, pts[0]] : pts;
  for (let i = 0; i < P.length - 1; i++) {
    const [x0, y0] = P[i], [x1, y1] = P[i + 1], n = Math.max(2, Math.ceil(Math.hypot(x1 - x0, y1 - y0) / 22));
    for (let k = i ? 1 : 0; k <= n; k++) {
      const t = k / n, j = k > 0 && k < n ? 1 : 0;
      const x = x0 + (x1 - x0) * t + j * (r() - 0.5) * wob * 2, y = y0 + (y1 - y0) * t + j * (r() - 0.5) * wob * 2;
      if (i === 0 && k === 0) g.moveTo(x, y); else g.lineTo(x, y);
    }
  }
  g.stroke(); g.restore();
};
const mrect = (g, x, y, w, h, lw, col, r) => marker(g, [[x, y], [x + w, y], [x + w, y + h], [x, y + h]], lw, col, r, 1.6, true);
/** coloured-pencil fill: base wash + diagonal hatching, clipped to a rect */
const pencil = (g, x, y, w, h, col, r, dark = 0.86) => {
  g.save(); g.beginPath(); g.rect(x, y, w, h); g.clip();
  g.fillStyle = tint(col, 1.0, 0.92); g.fillRect(x, y, w, h);
  g.lineWidth = 2.2; for (let i = -h; i < w + h; i += 6) { g.strokeStyle = tint(col, dark - r() * 0.08, 0.55); g.beginPath(); g.moveTo(x + i, y + h); g.lineTo(x + i + h * 0.7, y); g.stroke(); }
  g.restore();
};

/** kraft liner: warm tan, faint flute bands showing through, mottling, fibres, specks */
export function kraft(seed = 1, base = [32, 48, 60], S = 512, flutes = 16, bands = 0.3) {
  const [c, g] = cv(S, S), r = rng(seed);
  g.fillStyle = hsl(base[0], base[1], base[2]); g.fillRect(0, 0, S, S);
  const fw = S / flutes;
  for (let i = 0; i < flutes; i++) {
    const gr = g.createLinearGradient(i * fw, 0, (i + 1) * fw, 0);
    gr.addColorStop(0, hsl(base[0], base[1], base[2] - 4, bands)); gr.addColorStop(0.5, hsl(base[0], base[1], base[2] + 4, bands)); gr.addColorStop(1, hsl(base[0], base[1], base[2] - 4, bands));
    g.fillStyle = gr; g.fillRect(i * fw, 0, fw, S);
  }
  for (let i = 0; i < 70; i++) {
    const x = r() * S, y = r() * S, rx = 20 + r() * 60, ry = 14 + r() * 40, l = base[2] + (r() - 0.5) * 9, a = r() * 3;
    wrap(S, x, y, rx, (X, Y) => { g.fillStyle = hsl(base[0] + (r() - 0.5) * 4, base[1], l, 0.22); g.beginPath(); g.ellipse(X, Y, rx, ry, a, 0, 7); g.fill(); });
  }
  for (let i = 0; i < 900; i++) { const x = r() * S, y = r() * S, a = r() * 6.28, l = 3 + r() * 9; g.strokeStyle = hsl(base[0], base[1] - 10, base[2] + (r() < 0.5 ? -16 : 10), 0.28); g.lineWidth = 1; g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l); g.stroke(); }
  for (let i = 0; i < 140; i++) { g.fillStyle = hsl(base[0] - 6, 40, base[2] - 30 - r() * 10, 0.45); g.beginPath(); g.arc(r() * S, r() * S, 0.8 + r() * 1.6, 0, 7); g.fill(); }
  return c;
}

/** poster paint over kraft: opaque coat with brush streaks and a few dry-brush gaps */
export function painted(seed, col, S = 512, streakDir = 0) {
  const c = kraft(seed, [32, 48, 60], S), g = c.getContext('2d'), r = rng(seed + 50);
  g.globalAlpha = 0.95; g.fillStyle = col; g.fillRect(0, 0, S, S); g.globalAlpha = 1;
  for (let i = 0; i < 70; i++) {
    const x = r() * S, y = r() * S, len = 90 + r() * 260, h = 4 + r() * 12, k = r() < 0.5 ? 1.07 : 0.93;
    wrap(S, x, y, len, (X, Y) => { g.save(); g.translate(X, Y); g.rotate(streakDir); g.fillStyle = tint(col, k, 0.35); g.beginPath(); g.roundRect(-len / 2, -h / 2, len, h, h / 2); g.fill(); g.restore(); });
  }
  for (let i = 0; i < 26; i++) { const x = r() * S, y = r() * S; g.save(); g.translate(x, y); g.rotate(streakDir); g.fillStyle = 'rgba(201,154,98,.55)'; g.beginPath(); g.ellipse(0, 0, 6 + r() * 14, 1.2 + r() * 1.5, 0, 0, 7); g.fill(); g.restore(); }
  return c;
}

/** corrugated edge: liner / fluted medium / liner, 3 flutes per tile (u along the edge, v across the thickness) */
export function flute(dark = '#5b3c20', med = '#c69458', liner = '#d6aa70') {
  const [c, g] = cv(256, 64);
  g.fillStyle = dark; g.fillRect(0, 0, 256, 64);
  // cavity shading
  for (let i = 0; i < 6; i++) { const x = i * 256 / 6 + 256 / 12; const gr = g.createRadialGradient(x, i % 2 ? 22 : 42, 2, x, i % 2 ? 22 : 42, 26); gr.addColorStop(0, 'rgba(20,10,4,.55)'); gr.addColorStop(1, 'rgba(20,10,4,0)'); g.fillStyle = gr; g.fillRect(x - 28, 0, 56, 64); }
  g.strokeStyle = med; g.lineWidth = 7; g.beginPath();
  for (let x = 0; x <= 256; x += 2) { const y = 32 + 19 * Math.sin(x / 256 * Math.PI * 6); x ? g.lineTo(x, y) : g.moveTo(x, y); }
  g.stroke();
  g.fillStyle = liner; g.fillRect(0, 0, 256, 11); g.fillRect(0, 53, 256, 11);
  g.fillStyle = 'rgba(70,40,15,.75)'; g.fillRect(0, 10, 256, 2.5); g.fillRect(0, 51.5, 256, 2.5);
  return c;
}

/** packing tape: translucent tan with lengthwise sheen (u across, v along) */
export function tape() {
  const [c, g] = cv(64, 256), r = rng(5);
  g.fillStyle = '#d9b06c'; g.fillRect(0, 0, 64, 256);
  for (let i = 0; i < 9; i++) { g.fillStyle = `rgba(255,240,205,${0.12 + r() * 0.25})`; g.fillRect(4 + r() * 50, 0, 2 + r() * 5, 256); }
  g.fillStyle = 'rgba(120,80,30,.35)'; g.fillRect(0, 0, 3, 256); g.fillRect(61, 0, 3, 256);
  for (let i = 0; i < 5; i++) { g.strokeStyle = 'rgba(255,248,230,.5)'; g.lineWidth = 1.5; g.beginPath(); const y = r() * 256; g.moveTo(0, y); g.bezierCurveTo(20, y + 10, 40, y - 12, 64, y + 4); g.stroke(); }
  return c;
}

/** one 3 m x 3 m facade bay: painted (or bare kraft) wall with a marker-drawn window. variant: 0 plain,1 shutters,2 flower box,3 curtains+arch */
export function facade(seed, col, variant = 0, accent = '#e0533d') {
  const c = col ? painted(seed, col) : kraft(seed), g = c.getContext('2d'), r = rng(seed + 9);
  const x = 158, y = 118, w = 196, h = 236;
  if (variant === 1) for (const s of [-1, 1]) { const sx = s < 0 ? x - 62 : x + w + 8; pencil(g, sx, y, 54, h, accent, r); for (let k = 1; k < 9; k++) marker(g, [[sx + 6, y + k * h / 9], [sx + 48, y + k * h / 9]], 3, MARKER, r, 1); mrect(g, sx, y, 54, h, 6, MARKER, r); }
  pencil(g, x, y, w, h, '#a9d8f2', r, 0.82);
  // glass glints
  g.save(); g.beginPath(); g.rect(x, y, w, h); g.clip(); g.strokeStyle = 'rgba(255,255,255,.85)'; g.lineCap = 'round';
  g.lineWidth = 12; g.beginPath(); g.moveTo(x + 30, y + 120); g.lineTo(x + 100, y + 40); g.stroke(); g.lineWidth = 6; g.beginPath(); g.moveTo(x + 46, y + 150); g.lineTo(x + 120, y + 66); g.stroke(); g.restore();
  if (variant === 3) { // curtains
    for (const s of [0, 1]) { const cx = s ? x + w : x; g.fillStyle = tint(accent, 1.25, 0.95); g.beginPath(); g.moveTo(cx, y); g.quadraticCurveTo(cx + (s ? -70 : 70), y + 40, cx + (s ? -18 : 18), y + h); g.lineTo(cx, y + h); g.closePath(); g.fill(); marker(g, [[cx + (s ? -2 : 2), y], [cx + (s ? -66 : 66), y + 46], [cx + (s ? -18 : 18), y + h]], 5, MARKER, r); }
  }
  marker(g, [[x + w / 2, y + 4], [x + w / 2, y + h - 4]], 7, MARKER, r);
  marker(g, [[x + 4, y + h * 0.45], [x + w - 4, y + h * 0.45]], 7, MARKER, r);
  mrect(g, x, y, w, h, 10, MARKER, r);
  marker(g, [[x - 22, y + h + 12], [x + w + 22, y + h + 12]], 12, MARKER, r);
  if (variant === 2) { // flower box
    g.fillStyle = '#8a5a34'; g.fillRect(x - 10, y + h + 18, w + 20, 40); mrect(g, x - 10, y + h + 18, w + 20, 40, 6, MARKER, r);
    for (let i = 0; i < 9; i++) { const fx = x + 4 + i * (w - 8) / 8, fy = y + h + 8 - r() * 14; g.fillStyle = '#4f9a3a'; g.beginPath(); g.ellipse(fx, fy + 8, 9, 6, 0, 0, 7); g.fill(); g.fillStyle = i % 2 ? '#f2d14a' : accent; g.beginPath(); g.arc(fx, fy, 9, 0, 7); g.fill(); g.strokeStyle = MARKER; g.lineWidth = 3; g.stroke(); }
  }
  return c;
}

/** ground-floor shop window decal (alpha): marker frame, pencil glass, goods on shelves, striped valance */
export function shopWindow(seed, accent = '#e0533d') {
  const [c, g] = cv(512, 384), r = rng(seed);
  const x = 16, y = 40, w = 480, h = 320;
  pencil(g, x, y, w, h, '#b8def2', r, 0.85);
  const goods = ['#f2b33d', '#e0533d', '#7cc36a', '#c78bd8', '#f4f1e8', '#5aa0e0'];
  for (const sy of [y + 150, y + 290]) {
    marker(g, [[x + 10, sy], [x + w - 10, sy]], 8, MARKER, r);
    for (let i = 0; i < 7; i++) { const gx = x + 40 + i * 64 + r() * 10, kind = (r() * 3) | 0, col = goods[(r() * goods.length) | 0];
      g.fillStyle = col; g.beginPath();
      if (kind === 0) g.ellipse(gx, sy - 26, 24, 26, 0, 0, 7); else if (kind === 1) g.roundRect(gx - 20, sy - 70, 40, 70, 6); else g.roundRect(gx - 26, sy - 38, 52, 38, 4);
      g.fill(); g.strokeStyle = MARKER; g.lineWidth = 4; g.stroke();
    }
  }
  g.save(); g.beginPath(); g.rect(x, y, w, h); g.clip(); g.strokeStyle = 'rgba(255,255,255,.8)'; g.lineWidth = 14; g.beginPath(); g.moveTo(x + 40, y + 200); g.lineTo(x + 170, y + 30); g.stroke(); g.restore();
  mrect(g, x, y, w, h, 11, MARKER, r);
  // valance
  for (let i = 0; i < 8; i++) { g.fillStyle = i % 2 ? '#fbf6ea' : accent; g.beginPath(); g.moveTo(x + i * 60, 6); g.lineTo(x + i * 60 + 60, 6); g.lineTo(x + i * 60 + 60, 36); g.arc(x + i * 60 + 30, 36, 30, 0, Math.PI); g.closePath(); g.fill(); }
  marker(g, [[x, 6], [x + w, 6]], 6, MARKER, r);
  for (let i = 0; i < 8; i++) marker(g, [[x + i * 60 + 60, 36], [x + i * 60 + 60 - 4, 50], [x + i * 60 + 30, 66], [x + i * 60 + 4, 50], [x + i * 60, 36]], 4, MARKER, r);
  return c;
}

/** awning stripes (u across, v down the slope) */
export function stripes(a = '#e0533d', b = '#fbf6ea', n = 8, seed = 3) {
  const [c, g] = cv(512, 256), r = rng(seed);
  for (let i = 0; i < n; i++) { g.fillStyle = i % 2 ? b : a; g.fillRect(i * 512 / n, 0, 512 / n + 1, 256); }
  for (let i = 0; i < 40; i++) { g.fillStyle = 'rgba(255,255,255,.18)'; g.fillRect(r() * 512, r() * 256, 60 + r() * 120, 3 + r() * 5); }
  for (let i = 1; i < n; i++) marker(g, [[i * 512 / n, 0], [i * 512 / n, 256]], 3, 'rgba(42,32,40,.55)', r, 1);
  return c;
}

/** door: painted panel with marker inset panels and a knob (raw 0..1 UVs) */
export function door(seed, col = '#4f7fb8') {
  const c = painted(seed, col, 256), g = c.getContext('2d'), r = rng(seed + 3);
  mrect(g, 36, 30, 184, 86, 6, MARKER, r); mrect(g, 36, 140, 184, 86, 6, MARKER, r);
  g.fillStyle = '#f2c14a'; g.beginPath(); g.arc(200, 128, 12, 0, 7); g.fill(); g.strokeStyle = MARKER; g.lineWidth = 4; g.stroke();
  return c;
}

/** roof: painted card with marker scallop shingles */
export function roof(seed, col = '#d9563f') {
  const c = painted(seed, col), g = c.getContext('2d'), r = rng(seed + 4);
  for (let row = 0; row < 8; row++) for (let i = -1; i < 9; i++) {
    const x = i * 64 + (row % 2) * 32, y = row * 64 + 40;
    marker(g, [[x, y], [x + 8, y + 16], [x + 32, y + 22], [x + 56, y + 16], [x + 64, y]], 3.5, tint(col, 0.55, 0.9), r, 1);
  }
  return c;
}

/** spiral-wound paper tube */
export function tube(seed = 8, base = [30, 30, 52]) {
  const c = kraft(seed, base, 512, 1, 0), g = c.getContext('2d'), r = rng(seed);
  for (let k = -6; k < 6; k++) { const x0 = k * 128; marker(g, [[x0, 512], [x0 + 256, 0]], 3, 'rgba(70,48,30,.65)', r, 0.6); marker(g, [[x0 + 3, 512], [x0 + 259, 0]], 2, 'rgba(255,235,200,.35)', r, 0.6); }
  return c;
}

/** moulded pulp (egg cartons) */
export function pulp(seed = 9) {
  const c = kraft(seed, [38, 10, 70], 512, 1, 0), g = c.getContext('2d'), r = rng(seed);
  for (let i = 0; i < 1600; i++) { g.fillStyle = `rgba(${r() < 0.5 ? '90,84,76' : '250,246,236'},${0.12 + r() * 0.2})`; g.beginPath(); g.ellipse(r() * 512, r() * 512, 1 + r() * 4, 0.6 + r() * 2, r() * 3, 0, 7); g.fill(); }
  return c;
}

/** road: grey poster paint, dashed centre line and edge lines in white marker (u across 0..1, v along: 8 m per tile) */
export function road(seed = 5) {
  const c = painted(seed, '#7c7f88', 512, Math.PI / 2), g = c.getContext('2d'), r = rng(seed + 1);
  for (const y0 of [40, 296]) marker(g, [[256, y0], [256, y0 + 170]], 16, '#f7f3e8', r, 1.2);
  for (const x of [34, 478]) marker(g, [[x, -10], [x, 522]], 9, 'rgba(247,243,232,.9)', r, 0.8);
  return c;
}
/** zebra crossing (u across road, v along the crossing) */
export function zebra(seed = 6) {
  const c = painted(seed, '#7c7f88', 512, Math.PI / 2), g = c.getContext('2d'), r = rng(seed + 2);
  for (let i = 0; i < 7; i++) { const x = 24 + i * 70; g.fillStyle = '#f7f3e8'; g.fillRect(x, 20, 40, 472); mrect(g, x, 20, 40, 472, 3, 'rgba(42,32,40,.5)', r); }
  return c;
}

/** sidewalk: light kraft with marker paving grid (2 m tile, 1 m slabs) */
export function sidewalk(seed = 4) {
  const c = kraft(seed, [36, 40, 70], 512, 1, 0), g = c.getContext('2d'), r = rng(seed);
  for (const x of [0, 256, 512]) marker(g, [[x, -8], [x, 520]], 5, 'rgba(110,80,50,.55)', r, 1.2);
  for (const y of [0, 256, 512]) marker(g, [[-8, y], [520, y]], 5, 'rgba(110,80,50,.55)', r, 1.2);
  return c;
}

/** painted green card with marker grass tufts */
export function lawn(seed = 6) {
  const c = painted(seed, '#7dbb4f'), g = c.getContext('2d'), r = rng(seed + 7);
  for (let i = 0; i < 70; i++) { const x = r() * 512, y = r() * 512; marker(g, [[x - 8, y - 6], [x - 3, y + 6], [x, y - 10], [x + 4, y + 6], [x + 9, y - 6]], 3, 'rgba(46,96,40,.75)', r, 0.5); }
  for (let i = 0; i < 14; i++) { g.fillStyle = ['#f6e05a', '#ffffff', '#f08ab0'][i % 3]; g.beginPath(); g.arc(r() * 512, r() * 512, 5, 0, 7); g.fill(); }
  return c;
}

/** blue painted paper river with white marker wave squiggles */
export function river(seed = 7) {
  const c = painted(seed, '#3f86cf', 512, Math.PI / 2), g = c.getContext('2d'), r = rng(seed + 3);
  for (let i = 0; i < 22; i++) {
    const x = r() * 512, y = r() * 512, n = 2 + (r() * 3 | 0), s = 14 + r() * 8;
    wrap(512, x, y, n * s * 2 + 20, (X, Y) => { const pts = []; for (let k = 0; k <= n * 8; k++) { const t = k / 8; pts.push([X + t * s * 2, Y - Math.abs(Math.sin(t * Math.PI)) * s * 0.7]); } marker(g, pts, 5, 'rgba(240,248,255,.9)', r, 0.4); });
  }
  return c;
}

/** foliage: painted green with marker leaf scribbles */
export function leaves(seed = 11, col = '#5aa646') {
  const c = painted(seed, col), g = c.getContext('2d'), r = rng(seed + 5);
  for (let i = 0; i < 60; i++) { const x = r() * 512, y = r() * 512, a = r() * 6.28; g.save(); g.translate(x, y); g.rotate(a); marker(g, [[-14, 0], [0, -9], [14, 0]], 4, tint(col, 0.55, 0.8), r, 0.5); g.restore(); }
  return c;
}
export function bark(seed = 12, col = '#8a5a34') {
  const c = painted(seed, col, 256), g = c.getContext('2d'), r = rng(seed);
  for (let i = 0; i < 12; i++) { const x = r() * 256; marker(g, [[x, 0], [x + 6, 128], [x - 4, 256]], 3, tint(col, 0.55, 0.8), r, 1); }
  return c;
}

/** clock face for a cylinder cap (UV disc inscribed in the tile) */
export function clock(seed = 13) {
  const [c, g] = cv(512, 512), r = rng(seed);
  g.fillStyle = '#c99a62'; g.fillRect(0, 0, 512, 512);
  g.fillStyle = '#fbf6ea'; g.beginPath(); g.arc(256, 256, 236, 0, 7); g.fill();
  marker(g, Array.from({ length: 40 }, (_, i) => [256 + Math.cos(i / 40 * 6.283) * 222, 256 + Math.sin(i / 40 * 6.283) * 222]), 14, MARKER, r, 1.5, true);
  for (let i = 0; i < 12; i++) { const a = i / 12 * 6.283, l = i % 3 ? 22 : 44; marker(g, [[256 + Math.cos(a) * 196, 256 + Math.sin(a) * 196], [256 + Math.cos(a) * (196 - l), 256 + Math.sin(a) * (196 - l)]], i % 3 ? 8 : 13, MARKER, r, 0.5); }
  marker(g, [[256, 256], [256 - 92, 256 - 70]], 18, MARKER, r, 0.5); // hour hand (~10)
  marker(g, [[256, 256], [256 + 110, 256 - 118]], 11, '#d9563f', r, 0.5); // minute hand (~2)
  g.fillStyle = MARKER; g.beginPath(); g.arc(256, 256, 18, 0, 7); g.fill();
  return c;
}

/** car side: painted body with marker windows (raw UVs) */
export function carSide(seed, col) {
  const [c, g] = cv(512, 256), base = painted(seed, col, 512), r = rng(seed + 2);
  g.drawImage(base, 0, 0, 512, 256);
  marker(g, [[250, 40], [250, 230]], 5, MARKER, r); marker(g, [[268, 120], [300, 120]], 8, MARKER, r);
  g.fillStyle = '#f7f3e8'; g.beginPath(); g.arc(470, 100, 14, 0, 7); g.fill();
  return c;
}
export function carCabin(seed, col) {
  const [c, g] = cv(512, 256), base = painted(seed, col, 512), r = rng(seed + 3);
  g.drawImage(base, 0, 0, 512, 256);
  for (const [x, w] of [[30, 200], [270, 210]]) { pencil(g, x, 34, w, 190, '#a9d8f2', r, 0.82); mrect(g, x, 34, w, 190, 9, MARKER, r); }
  return c;
}
export function carFront(seed, col, rear = false) {
  const [c, g] = cv(256, 128), base = painted(seed, col, 256), r = rng(seed + 4);
  g.drawImage(base, 0, 0, 256, 128);
  for (const x of [44, 212]) { g.fillStyle = rear ? '#e8453c' : '#ffe27a'; g.beginPath(); g.arc(x, 56, 22, 0, 7); g.fill(); g.strokeStyle = MARKER; g.lineWidth = 5; g.stroke(); }
  if (!rear) for (let i = 0; i < 4; i++) marker(g, [[92, 40 + i * 12], [164, 40 + i * 12]], 4, MARKER, r, 0.5);
  return c;
}
export function wheel(seed = 14) {
  const [c, g] = cv(256, 256), r = rng(seed);
  g.fillStyle = '#2b2a30'; g.fillRect(0, 0, 256, 256);
  g.fillStyle = '#c9c4ba'; g.beginPath(); g.arc(128, 128, 56, 0, 7); g.fill();
  marker(g, Array.from({ length: 24 }, (_, i) => [128 + Math.cos(i / 24 * 6.283) * 56, 128 + Math.sin(i / 24 * 6.283) * 56]), 6, '#111', r, 0.6, true);
  for (let i = 0; i < 5; i++) { const a = i / 5 * 6.283; marker(g, [[128, 128], [128 + Math.cos(a) * 46, 128 + Math.sin(a) * 46]], 5, '#555', r, 0.3); }
  return c;
}

/** printed shipping pictograms (alpha decals): kind = 'up' | 'dry' | 'fragile' | 'recycle' */
export function pictogram(kind, ink = '#3a2618', seed = 15) {
  const [c, g] = cv(256, 256), r = rng(seed);
  g.fillStyle = ink; g.strokeStyle = ink; g.lineCap = 'round'; g.lineJoin = 'round';
  if (kind === 'up') {
    for (const x of [80, 176]) { g.fillRect(x - 13, 92, 26, 110); g.beginPath(); g.moveTo(x - 46, 100); g.lineTo(x, 36); g.lineTo(x + 46, 100); g.closePath(); g.fill(); }
    g.fillRect(28, 214, 200, 18);
  } else if (kind === 'dry') {
    g.lineWidth = 14; g.beginPath(); g.arc(128, 120, 92, Math.PI, 0); g.closePath(); g.fill();
    g.beginPath(); g.moveTo(128, 120); g.lineTo(128, 206); g.arc(108, 206, 20, 0, Math.PI); g.stroke();
    for (const [x, y] of [[50, 30], [128, 14], [206, 30]]) { g.beginPath(); g.moveTo(x, y - 18); g.quadraticCurveTo(x + 12, y + 2, x, y + 10); g.quadraticCurveTo(x - 12, y + 2, x, y - 18); g.fill(); }
  } else if (kind === 'fragile') {
    g.lineWidth = 14; g.beginPath(); g.moveTo(66, 30); g.lineTo(190, 30); g.quadraticCurveTo(190, 140, 128, 146); g.quadraticCurveTo(66, 140, 66, 30); g.stroke();
    g.beginPath(); g.moveTo(128, 146); g.lineTo(128, 214); g.moveTo(84, 220); g.lineTo(172, 220); g.stroke();
    g.lineWidth = 8; g.beginPath(); g.moveTo(112, 34); g.lineTo(130, 70); g.lineTo(114, 92); g.lineTo(136, 124); g.stroke();
  } else { // recycle: three chasing arrows on a triangle
    g.lineWidth = 24;
    for (let i = 0; i < 3; i++) {
      const a0 = -Math.PI / 2 + i * 2.094 + 0.28, a1 = a0 + 1.45, R = 84;
      g.beginPath(); g.arc(128, 136, R, a0, a1); g.stroke();
      const hx = 128 + Math.cos(a1) * R, hy = 136 + Math.sin(a1) * R, tx = -Math.sin(a1), ty = Math.cos(a1);
      g.beginPath(); g.moveTo(hx + tx * 30, hy + ty * 30); g.lineTo(hx + Math.cos(a1) * 32 - tx * 4, hy + Math.sin(a1) * 32 - ty * 4); g.lineTo(hx - Math.cos(a1) * 32 - tx * 4, hy - Math.sin(a1) * 32 - ty * 4); g.closePath(); g.fill();
    }
  }
  // printing wear
  g.globalCompositeOperation = 'destination-out';
  for (let i = 0; i < 260; i++) { g.fillStyle = `rgba(0,0,0,${0.3 + r() * 0.6})`; g.beginPath(); g.arc(r() * 256, r() * 256, 1 + r() * 3.5, 0, 7); g.fill(); }
  g.globalCompositeOperation = 'source-over';
  return c;
}

/** cut-out cloud / smoke puff outline points (metres), flat bottom */
export const puffShape = (w, h, seed, n = 4) => {
  const r = rng(seed), bumps = [];
  for (let i = 0; i < n; i++) { const t = (i + 0.5) / n; bumps.push([(t - 0.5) * w * 0.86, h * (0.28 + 0.22 * Math.sin(t * Math.PI) + r() * 0.12), w / n * (0.62 + r() * 0.2)]); }
  const pts = [];
  for (let k = 0; k <= 64; k++) {
    const x = w / 2 - k / 64 * w; let y = 0;
    for (const [cx, cy, rr] of bumps) { const d = rr * rr - (x - cx) ** 2; if (d > 0) y = Math.max(y, cy + Math.sqrt(d) * 0.9); }
    pts.push([x, Math.max(y, h * 0.12)]);
  }
  pts.push([-w / 2, 0], [w / 2, 0]);
  return pts;
};

/** packing tape with lengthwise sheen (u along the strip) */
export function tapeH(base = '#d9b06c') {
  const [c, g] = cv(256, 64), r = rng(6);
  g.fillStyle = base; g.fillRect(0, 0, 256, 64);
  for (let i = 0; i < 8; i++) { g.fillStyle = `rgba(255,244,214,${0.15 + r() * 0.3})`; g.fillRect(0, 4 + r() * 54, 256, 2 + r() * 4); }
  for (let i = 0; i < 6; i++) { g.strokeStyle = 'rgba(255,250,235,.45)'; g.lineWidth = 1.5; g.beginPath(); const x = r() * 256; g.moveTo(x, 0); g.bezierCurveTo(x + 10, 20, x - 12, 40, x + 4, 64); g.stroke(); }
  g.fillStyle = 'rgba(120,80,30,.35)'; g.fillRect(0, 0, 256, 3); g.fillRect(0, 61, 256, 3);
  return c;
}
/** tape-roll face: concentric layers (UV disc centred, radius 0.5) */
export function tapeFace(ri = 0.29, base = '#f2b632', seed = 7) {
  const [c, g] = cv(512, 512), r = rng(seed);
  g.fillStyle = base; g.fillRect(0, 0, 512, 512);
  for (let k = 0; k < 46; k++) { const rr = 256 * (ri + (1 - ri) * k / 46); g.strokeStyle = r() < 0.5 ? 'rgba(255,236,170,.55)' : 'rgba(160,96,20,.45)'; g.lineWidth = 1.5 + r() * 2.5; g.beginPath(); g.arc(256, 256, rr, 0, 7); g.stroke(); }
  const gr = g.createRadialGradient(200, 190, 20, 256, 256, 256); gr.addColorStop(0, 'rgba(255,255,230,.35)'); gr.addColorStop(1, 'rgba(255,255,230,0)'); g.fillStyle = gr; g.fillRect(0, 0, 512, 512);
  g.strokeStyle = MARKER; g.lineWidth = 6; g.beginPath(); g.arc(256, 256, 251, 0, 7); g.stroke();
  return c;
}
/** outer surface of a tape roll: glossy bands around (u around, v across) */
export function tapeSide(base = '#eaa92a') {
  const [c, g] = cv(256, 64), r = rng(9);
  g.fillStyle = base; g.fillRect(0, 0, 256, 64);
  for (let i = 0; i < 7; i++) { g.fillStyle = `rgba(255,240,190,${0.2 + r() * 0.3})`; g.fillRect(0, 6 + r() * 50, 256, 2 + r() * 3); }
  g.fillStyle = 'rgba(150,90,20,.5)'; g.fillRect(0, 0, 256, 4); g.fillRect(0, 60, 256, 4);
  return c;
}

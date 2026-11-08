// 2D cast + effect cards for "5 невероятных фактов" (design canvas 600x1000, soles at y=975).
// Flat fills, plum ink outlines, the same face language as the toon cast.
const INK = '#241726';
const ol = (g, w = 9) => { g.lineWidth = w; g.strokeStyle = INK; g.lineJoin = 'round'; g.lineCap = 'round'; g.stroke(); };
const fillOl = (g, fill, w = 9) => { g.fillStyle = fill; g.fill(); ol(g, w); };
const ell = (g, x, y, rx, ry, fill, w = 9, rot = 0) => { g.beginPath(); g.ellipse(x, y, rx, ry, rot, 0, Math.PI * 2); fill ? fillOl(g, fill, w) : ol(g, w); };
const shade = (g, path, col, dx = 14, dy = 10) => { g.save(); g.clip(path); g.translate(dx, dy); g.fillStyle = col; g.fill(path); g.restore(); };

/** cartoon face: kind = smile|grin|o|laugh|frown|wow; look -1..1; blink 0..1 */
export function face(g, x, y, s = 1, { kind = 'smile', look = 0, blink = 0, glasses = false } = {}) {
  const ex = 26 * s, er = 15 * s, lx = look * 7 * s;
  for (const k of [-1, 1]) {
    if (kind === 'wow' || kind === 'o') { ell(g, x + k * ex, y, er * 1.25, er * 1.45, '#ffffff', 5 * s); ell(g, x + k * ex + lx, y + 2 * s, er * 0.55, er * 0.6, INK, 0); }
    else if (blink > 0.6 || kind === 'laugh') { g.beginPath(); g.moveTo(x + k * ex - er, y + 4 * s); g.quadraticCurveTo(x + k * ex, y - er, x + k * ex + er, y + 4 * s); ol(g, 6 * s); }
    else { ell(g, x + k * ex, y, er, er * 1.15, '#ffffff', 5 * s); ell(g, x + k * ex + lx, y + 2 * s, er * 0.5, er * 0.6, INK, 0); ell(g, x + k * ex + lx - 3 * s, y - 3 * s, er * 0.16, er * 0.16, '#ffffff', 0); }
  }
  if (glasses) { for (const k of [-1, 1]) ell(g, x + k * ex, y, er * 1.7, er * 1.7, null, 6 * s); g.beginPath(); g.moveTo(x - ex + er * 1.7, y - 3 * s); g.quadraticCurveTo(x, y - 12 * s, x + ex - er * 1.7, y - 3 * s); ol(g, 6 * s); }
  const my = y + 40 * s;
  g.beginPath();
  if (kind === 'o' || kind === 'wow') { g.ellipse(x, my + 4 * s, 11 * s, 15 * s, 0, 0, 7); fillOl(g, '#5a1e28', 5 * s); }
  else if (kind === 'laugh' || kind === 'grin') { g.moveTo(x - 30 * s, my - 6 * s); g.quadraticCurveTo(x, my + 34 * s, x + 30 * s, my - 6 * s); g.closePath(); fillOl(g, '#5a1e28', 5 * s); g.beginPath(); g.ellipse(x, my + 12 * s, 12 * s, 6 * s, 0, 0, 7); g.fillStyle = '#e86e78'; g.fill(); }
  else if (kind === 'frown') { g.moveTo(x - 20 * s, my + 10 * s); g.quadraticCurveTo(x, my - 6 * s, x + 20 * s, my + 10 * s); ol(g, 6 * s); }
  else { g.moveTo(x - 22 * s, my - 4 * s); g.quadraticCurveTo(x, my + 16 * s, x + 22 * s, my - 4 * s); ol(g, 6 * s); }
}
const limb = (g, pts, w, col) => { g.beginPath(); g.moveTo(...pts[0]); if (pts.length === 3) g.quadraticCurveTo(...pts[1], ...pts[2]); else pts.slice(1).forEach((p) => g.lineTo(...p)); g.lineWidth = w + 9; g.strokeStyle = INK; g.lineCap = 'round'; g.stroke(); g.lineWidth = w; g.strokeStyle = col; g.stroke(); };
const glove = (g, x, y, r = 16) => ell(g, x, y, r, r, '#ffffff', 6);
const shoe = (g, x, y, dir = 1, col = '#e0533d') => { g.beginPath(); g.ellipse(x + dir * 10, y - 8, 26, 14, 0, 0, 7); fillOl(g, col, 6); };

/** octopus: t = time (s) for tentacle wiggle */
export function octopus(p, { t = 0, kind = 'smile', look = 0, blink = 0 } = {}) {
  const g = p.g, col = '#cf5fb6', dark = '#a5418f';
  for (let i = 0; i < 8; i++) { // tentacles
    const a = (i - 3.5) / 3.5, x0 = 300 + a * 120, pts = [];
    for (let k = 0; k <= 12; k++) { const u = k / 12; pts.push([x0 + a * 150 * u + Math.sin(t * 3 + i * 1.3 + u * 5) * 30 * u, 560 + u * 400 - Math.sin(u * Math.PI) * 30]); }
    for (const [w, c] of [[60, INK], [48, i % 2 ? col : dark]]) { g.beginPath(); pts.forEach((q, k) => (k ? g.lineTo(...q) : g.moveTo(...q))); g.lineWidth = w; g.strokeStyle = c; g.lineCap = 'round'; g.lineJoin = 'round'; g.stroke(); }
    for (let k = 4; k < 12; k += 2) ell(g, pts[k][0] + 8, pts[k][1], 7, 6, '#f6c6e8', 3);
  }
  const head = new Path2D(); head.ellipse(300, 400, 185, 215, 0, 0, Math.PI * 2);
  g.fillStyle = col; g.fill(head); shade(g, head, dark, 26, 20); g.lineWidth = 10; g.strokeStyle = INK; g.stroke(head);
  for (const [x, y, r] of [[220, 280, 22], [370, 250, 16], [400, 330, 12], [250, 210, 10]]) ell(g, x, y, r, r * 0.8, '#e88ad2', 0);
  face(g, 300, 450, 1.5, { kind, look, blink });
}
export function heart(p, { k = 1, col = '#e8394a' } = {}) {
  const g = p.g; g.save(); g.translate(300, 520); g.scale(k, k);
  const h = new Path2D(); h.moveTo(0, 180); h.bezierCurveTo(-260, 10, -200, -230, 0, -110); h.bezierCurveTo(200, -230, 260, 10, 0, 180);
  g.fillStyle = col; g.fill(h); g.save(); g.clip(h); g.fillStyle = 'rgba(120,0,20,.35)'; g.translate(30, 30); g.fill(h); g.restore();
  g.lineWidth = 16; g.strokeStyle = INK; g.stroke(h); ell(g, -90, -80, 34, 22, 'rgba(255,255,255,.8)', 0, -0.6); g.restore();
}
export function qmark(p, { rot = 0, col = '#ffd23f' } = {}) {
  const g = p.g; g.save(); g.translate(300, 560); g.rotate(rot); g.font = '900 720px Inter, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.lineJoin = 'round'; g.lineWidth = 46; g.strokeStyle = INK; g.strokeText('?', 0, 0); g.fillStyle = col; g.fillText('?', 0, 0);
  g.fillStyle = 'rgba(255,255,255,.55)'; g.fillRect(-90, -250, 30, 120); g.restore();
}
/** hanging cardboard sign with marker text (lines) */
export function sign(p, { lines = ['ФАКТ №1'], col = '#d6a96c', ink = '#2a2028', size = 120 } = {}) {
  const g = p.g, w = 560, h = 120 + lines.length * size * 1.05, x = 20, y = 470 - h / 2;
  for (const sx of [x + 90, x + w - 90]) { g.beginPath(); g.moveTo(sx, 0); g.lineTo(sx, y + 20); ol(g, 6); }
  g.beginPath(); g.roundRect(x, y, w, h, 18); g.fillStyle = col; g.fill(); g.save(); g.clip(); for (let i = 0; i < w; i += 22) { g.fillStyle = 'rgba(120,80,40,.10)'; g.fillRect(x + i, y, 10, h); } g.restore(); ol(g, 10);
  g.fillStyle = '#5b3c20'; g.fillRect(x + 8, y + h - 22, w - 16, 10);
  for (const [tx, ty] of [[x + 70, y + 8], [x + w - 70, y + 8]]) { g.save(); g.translate(tx, ty); g.rotate(-0.3); g.fillStyle = 'rgba(230,190,120,.9)'; g.fillRect(-40, -14, 80, 28); g.restore(); }
  g.font = `900 ${size}px Inter, sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = ink;
  lines.forEach((t, i) => { g.save(); g.translate(300, y + 70 + size * 0.5 + i * size * 1.05); g.rotate(-0.03 + i * 0.02); let fs = size; g.font = `900 ${fs}px Inter, sans-serif`; while (g.measureText(t).width > w - 60) { fs -= 6; g.font = `900 ${fs}px Inter, sans-serif`; } g.fillText(t, 0, 0); g.restore(); });
}
/** wide cards: draw in a (600*sx) x 1000 space */
const wide = (g, sx) => { g.scale(1 / sx, 1); };
export function shark(p, { sx = 2.4, t = 0, kind = 'grin', blink = 0 } = {}) {
  const g = p.g; g.save(); wide(g, sx); const W = 600 * sx, tail = Math.sin(t * 6) * 30;
  const body = new Path2D(); body.moveTo(W - 120, 560); body.bezierCurveTo(W - 220, 380, 500, 400, 260, 520); body.lineTo(110, 420 + tail); body.lineTo(150, 560); body.lineTo(110, 700 + tail); body.lineTo(260, 600); body.bezierCurveTo(500, 720, W - 260, 720, W - 120, 560); body.closePath();
  const fin = new Path2D(); fin.moveTo(W * 0.5, 440); fin.lineTo(W * 0.43, 250); fin.quadraticCurveTo(W * 0.52, 300, W * 0.6, 430); fin.closePath();
  g.fillStyle = '#7f9db8'; g.fill(fin); g.lineWidth = 10; g.strokeStyle = INK; g.stroke(fin);
  g.fillStyle = '#7f9db8'; g.fill(body); g.save(); g.clip(body); g.fillStyle = '#eef3f6'; g.beginPath(); g.ellipse(W * 0.62, 690, W * 0.32, 90, 0, 0, 7); g.fill(); g.restore(); g.lineWidth = 10; g.strokeStyle = INK; g.stroke(body);
  const pf = new Path2D(); pf.moveTo(W * 0.6, 640); pf.lineTo(W * 0.5, 790); pf.quadraticCurveTo(W * 0.62, 720, W * 0.68, 650); pf.closePath(); g.fillStyle = '#6a88a3'; g.fill(pf); g.stroke(pf);
  for (let i = 0; i < 4; i++) { g.beginPath(); g.moveTo(W * 0.72 - i * 22, 520); g.quadraticCurveTo(W * 0.7 - i * 22, 570, W * 0.72 - i * 22, 610); ol(g, 6); }
  ell(g, W - 270, 520, 24, 26, '#ffffff', 6); if (blink < 0.6) ell(g, W - 266, 524, 11, 13, INK, 0); else { g.beginPath(); g.moveTo(W - 292, 522); g.lineTo(W - 246, 522); ol(g, 6); }
  g.beginPath(); g.moveTo(W - 330, 610); g.quadraticCurveTo(W - 220, 650, W - 140, 590); ol(g, 7);
  if (kind === 'grin') for (let i = 0; i < 7; i++) { const x = W - 320 + i * 26; g.beginPath(); g.moveTo(x, 612 + i * 2); g.lineTo(x + 12, 636 - i); g.lineTo(x + 24, 614 + i * 2); fillOl(g, '#ffffff', 4); }
  g.restore();
}
export function dino(p, { sx = 1.5, t = 0, kind = 'smile', blink = 0 } = {}) {
  const g = p.g; g.save(); wide(g, sx); const W = 600 * sx, col = '#6fbf5a', dk = '#4f9a40';
  for (const [x, ph] of [[W * 0.35, 0], [W * 0.62, 1]]) { g.beginPath(); g.roundRect(x - 34, 760 + Math.sin(t * 5 + ph) * 6, 68, 210, 30); fillOl(g, dk, 9); }
  const body = new Path2D(); body.ellipse(W * 0.48, 720, W * 0.3, 150, 0, 0, Math.PI * 2);
  const tl = new Path2D(); tl.moveTo(W * 0.22, 700); tl.quadraticCurveTo(40, 760, 20, 640); tl.quadraticCurveTo(90, 720, W * 0.25, 640); tl.closePath();
  g.fillStyle = col; g.fill(tl); g.lineWidth = 9; g.strokeStyle = INK; g.stroke(tl);
  const neck = new Path2D(); neck.moveTo(W * 0.66, 640); neck.quadraticCurveTo(W * 0.8, 380, W * 0.78, 200); neck.lineTo(W * 0.86, 200); neck.quadraticCurveTo(W * 0.9, 420, W * 0.76, 700); neck.closePath();
  g.fillStyle = col; g.fill(neck); g.stroke(neck); g.fillStyle = col; g.fill(body); g.save(); g.clip(body); g.fillStyle = 'rgba(30,90,30,.25)'; g.fillRect(0, 760, W, 200); g.restore(); g.stroke(body);
  for (const [x, ph] of [[W * 0.3, 1], [W * 0.66, 0]]) { g.beginPath(); g.roundRect(x - 36, 780 + Math.sin(t * 5 + ph) * 6, 72, 195, 30); fillOl(g, col, 9); }
  for (let i = 0; i < 5; i++) ell(g, W * 0.38 + i * 50, 640 + (i % 2) * 30, 18, 12, dk, 0);
  ell(g, W * 0.84, 180, 80, 58, col, 9);
  face(g, W * 0.86, 170, 0.75, { kind, blink });
  g.restore();
}
export function banana(p, { kind = 'smile', look = 0, blink = 0, arm = 'hang', t = 0, coat = true } = {}) {
  const g = p.g, Y = '#ffd84a', DY = '#e6b52a';
  // legs + shoes
  limb(g, [[270, 760], [262, 870], [250, 950]], 12, '#ffffff'); limb(g, [[330, 760], [340, 870], [352, 950]], 12, '#ffffff'); shoe(g, 246, 968, -1, '#3f6fb5'); shoe(g, 356, 968, 1, '#3f6fb5');
  const b = new Path2D(); b.moveTo(250, 140); b.quadraticCurveTo(200, 120, 214, 90); b.quadraticCurveTo(250, 80, 262, 130); b.bezierCurveTo(430, 240, 470, 560, 340, 800); b.quadraticCurveTo(300, 860, 240, 820); b.bezierCurveTo(330, 600, 320, 330, 250, 140); b.closePath();
  g.fillStyle = Y; g.fill(b); shade(g, b, DY, 22, 6); g.lineWidth = 11; g.strokeStyle = INK; g.stroke(b);
  g.beginPath(); g.moveTo(272, 160); g.bezierCurveTo(330, 330, 342, 560, 290, 780); g.lineWidth = 4; g.strokeStyle = 'rgba(160,110,20,.6)'; g.stroke();
  ell(g, 230, 810, 18, 14, '#6b4a22', 6);
  if (coat) { const c = new Path2D(); c.moveTo(250, 560); c.lineTo(390, 540); c.lineTo(370, 760); c.quadraticCurveTo(310, 800, 250, 780); c.closePath(); g.fillStyle = '#f7f7f2'; g.fill(c); g.lineWidth = 8; g.strokeStyle = INK; g.stroke(c); g.beginPath(); g.moveTo(320, 550); g.lineTo(312, 770); ol(g, 5); ell(g, 345, 620, 16, 22, '#cfe8ff', 4); }
  const ax = 375, ay = 600, wv = Math.sin(t * 8) * 30;
  limb(g, [[250, 600], [190, 660], [175, 730]], 11, '#ffffff'); glove(g, 175, 735);
  if (arm === 'up') { limb(g, [[ax, ay], [450, 520], [470 + wv * 0.3, 420]], 11, '#ffffff'); glove(g, 470 + wv * 0.3, 415); }
  else if (arm === 'point') { limb(g, [[ax, ay], [450, 580], [510, 560]], 11, '#ffffff'); glove(g, 515, 558); }
  else { limb(g, [[ax, ay], [420, 680], [425, 740]], 11, '#ffffff'); glove(g, 425, 745); }
  face(g, 345, 400, 1.15, { kind, look, blink, glasses: true });
}
export function strawberry(p, { kind = 'smile', look = 0, blink = 0, t = 0 } = {}) {
  const g = p.g, R = '#e8394a';
  limb(g, [[270, 800], [262, 890], [255, 950]], 12, '#ffffff'); limb(g, [[330, 800], [338, 890], [348, 950]], 12, '#ffffff'); shoe(g, 250, 968, -1, '#7cc36a'); shoe(g, 352, 968, 1, '#7cc36a');
  limb(g, [[175, 600], [120, 650], [110, 720]], 11, '#ffffff'); glove(g, 110, 725); limb(g, [[425, 600], [480, 650], [490, 720]], 11, '#ffffff'); glove(g, 490, 725);
  const b = new Path2D(); b.moveTo(300, 860); b.bezierCurveTo(130, 720, 110, 420, 200, 380); b.quadraticCurveTo(300, 340, 400, 380); b.bezierCurveTo(490, 420, 470, 720, 300, 860); b.closePath();
  g.fillStyle = R; g.fill(b); shade(g, b, '#b8222f', 24, 14); g.lineWidth = 11; g.strokeStyle = INK; g.stroke(b);
  for (let i = 0; i < 26; i++) { const x = 190 + (i * 53) % 220, y = 450 + ((i * 97) % 360); if (Math.abs(x - 300) < 80 && y < 640) continue; ell(g, x, y, 6, 9, '#ffe27a', 3); }
  for (let k = 0; k < 5; k++) { const a = -Math.PI / 2 + (k - 2) * 0.55; g.beginPath(); g.moveTo(300, 380); g.quadraticCurveTo(300 + Math.cos(a) * 90 - 20, 380 + Math.sin(a) * 60, 300 + Math.cos(a) * 130, 380 + Math.sin(a) * 70 + 30); g.quadraticCurveTo(300 + Math.cos(a) * 60 + 20, 380 + Math.sin(a) * 30 + 30, 300, 390); fillOl(g, '#4f9a40', 7); }
  g.beginPath(); g.moveTo(300, 330); g.lineTo(310, 260); ol(g, 10);
  face(g, 300, 540, 1.1, { kind, look, blink });
}
export function giraffe(p, { kind = 'smile', blink = 0, t = 0, marks = 0, look = 0 } = {}) {
  const g = p.g, Y = '#f2c45a', S = '#b8722e';
  for (const [x, ph] of [[205, 0], [255, 1], [345, 0.5], [395, 1.5]]) { g.beginPath(); g.roundRect(x - 16, 640, 32, 335, 14); fillOl(g, Y, 8); ell(g, x, 965, 22, 12, '#5a3b2a', 6); }
  const body = new Path2D(); body.ellipse(300, 640, 150, 80, -0.05, 0, Math.PI * 2);
  const neck = new Path2D(); neck.moveTo(355, 600); neck.lineTo(372, 200); neck.lineTo(432, 200); neck.lineTo(420, 620); neck.closePath();
  g.beginPath(); g.moveTo(160, 620); g.quadraticCurveTo(110, 700, 120, 760); ol(g, 6);
  g.fillStyle = Y; g.fill(neck); g.lineWidth = 9; g.strokeStyle = INK; g.stroke(neck); g.fillStyle = Y; g.fill(body); g.stroke(body);
  g.save(); g.clip(body); for (let i = 0; i < 9; i++) ell(g, 180 + (i * 61) % 250, 590 + (i * 37) % 110, 26, 20, S, 0, i); g.restore();
  g.save(); g.clip(neck); for (let i = 0; i < 6; i++) ell(g, 390 + (i % 2) * 18, 260 + i * 60, 18, 14, S, 0, i); g.restore();
  // mane
  for (let i = 0; i < 12; i++) ell(g, 432, 220 + i * 32, 10, 16, '#8a4b22', 4);
  // head
  ell(g, 455, 165, 95, 62, Y, 9, -0.15); for (const k of [-1, 1]) { g.beginPath(); g.moveTo(410 + k * 26, 115); g.lineTo(415 + k * 30, 60); ol(g, 9); ell(g, 415 + k * 30, 55, 12, 12, '#8a4b22', 6); } ell(g, 380, 110, 30, 14, Y, 7, -0.6);
  face(g, 470, 160, 0.8, { kind, blink, look });
  for (let i = 0; i < marks; i++) { // numbered vertebrae down the neck
    const y = 230 + i * 54, x = 402 - i * 2; ell(g, x, y, 22, 20, '#ffffff', 5);
    g.font = '900 30px Inter, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = '#d9463b'; g.fillText(String(i + 1), x, y + 1);
  }
}
/** text card: big words with ink outline (lines) */
export function words(p, { lines = ['7 = 7'], col = '#ffd23f', size = 160, rot = 0, bg = null } = {}) {
  const g = p.g; g.save(); g.translate(300, 520); g.rotate(rot);
  if (bg) { g.beginPath(); g.roundRect(-280, -40 - lines.length * size * 0.55, 560, lines.length * size * 1.1 + 80, 30); fillOl(g, bg, 10); }
  g.textAlign = 'center'; g.textBaseline = 'middle'; g.lineJoin = 'round';
  lines.forEach((t, i) => { let fs = size; g.font = `900 ${fs}px Inter, sans-serif`; while (g.measureText(t).width > 560) { fs -= 8; g.font = `900 ${fs}px Inter, sans-serif`; } const y = (i - (lines.length - 1) / 2) * size * 1.1; g.lineWidth = fs * 0.16; g.strokeStyle = INK; g.strokeText(t, 0, y); g.fillStyle = col; g.fillText(t, 0, y); });
  g.restore();
}
export function stamp(p, { text = 'ЯГОДА!', col = '#d8322f', cross = false, rot = -0.2 } = {}) {
  const g = p.g; g.save(); g.translate(300, 500); g.rotate(rot); g.strokeStyle = col; g.lineWidth = 18;
  g.beginPath(); g.roundRect(-260, -110, 520, 220, 26); g.stroke(); g.lineWidth = 6; g.beginPath(); g.roundRect(-238, -88, 476, 176, 18); g.stroke();
  let fs = 120; g.font = `900 ${fs}px Inter, sans-serif`; while (g.measureText(text).width > 440) { fs -= 6; g.font = `900 ${fs}px Inter, sans-serif`; }
  g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = col; g.fillText(text, 0, 6);
  if (cross) { g.lineWidth = 30; g.beginPath(); g.moveTo(-200, -150); g.lineTo(200, 150); g.moveTo(200, -150); g.lineTo(-200, 150); g.stroke(); }
  g.globalCompositeOperation = 'destination-out'; for (let i = 0; i < 160; i++) { g.fillStyle = `rgba(0,0,0,${0.4 + (i % 5) * 0.1})`; g.beginPath(); g.arc(((i * 131) % 560) - 280, ((i * 71) % 240) - 120, 2 + (i % 4), 0, 7); g.fill(); }
  g.restore();
}
export function stopwatch(p, { sec = 0 } = {}) {
  const g = p.g; ell(g, 300, 420, 230, 230, '#fbf6ea', 16); g.beginPath(); g.roundRect(270, 150, 60, 50, 10); fillOl(g, '#d9463b', 8);
  for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2; g.beginPath(); g.moveTo(300 + Math.sin(a) * 190, 420 - Math.cos(a) * 190); g.lineTo(300 + Math.sin(a) * 210, 420 - Math.cos(a) * 210); ol(g, 8); }
  const a = (sec % 60) / 60 * Math.PI * 2; g.beginPath(); g.moveTo(300, 420); g.lineTo(300 + Math.sin(a) * 170, 420 - Math.cos(a) * 170); g.lineWidth = 10; g.strokeStyle = '#d9463b'; g.stroke(); ell(g, 300, 420, 16, 16, INK, 0);
  const m = Math.floor(sec / 60), s = Math.floor(sec % 60); words(p, { lines: [`${m}:${String(s).padStart(2, '0')}`], size: 170, col: '#ffffff' });
  g.save(); g.translate(0, 300); g.restore();
}
export function tag(p, { text = '8 МИН НАЗАД' } = {}) {
  const g = p.g; g.beginPath(); g.moveTo(300, 0); g.lineTo(300, 330); ol(g, 6);
  g.save(); g.translate(300, 520); g.rotate(0.08); g.beginPath(); g.moveTo(-230, -150); g.lineTo(150, -150); g.lineTo(240, 0); g.lineTo(150, 150); g.lineTo(-230, 150); g.closePath(); fillOl(g, '#fbf6ea', 10);
  ell(g, 165, 0, 18, 18, '#c99a62', 6); g.font = '900 78px Inter, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = '#2a2028';
  const [a, b] = text.split('|'); g.fillText(a, -40, b ? -40 : 0); if (b) g.fillText(b, -40, 50); g.restore();
}
export function umbrella(p, { t = 0 } = {}) {
  const g = p.g; const dome = new Path2D(); dome.moveTo(40, 560); dome.quadraticCurveTo(300, 120, 560, 560);
  for (let i = 5; i >= 0; i--) { const x = 40 + i * 86.7; dome.quadraticCurveTo(x - 43, 520, x - 0, 560); }
  g.fillStyle = '#c99a62'; g.fill(dome); g.save(); g.clip(dome); for (let i = 0; i < 600; i += 24) { g.fillStyle = 'rgba(120,80,40,.15)'; g.fillRect(i, 0, 10, 600); } g.restore(); g.lineWidth = 11; g.strokeStyle = INK; g.stroke(dome);
  for (let i = 1; i < 6; i++) { g.beginPath(); g.moveTo(300, 250); g.lineTo(40 + i * 86.7, 560); ol(g, 5); }
  g.beginPath(); g.moveTo(300, 250); g.lineTo(300, 960); g.quadraticCurveTo(300, 1000, 260, 990); ol(g, 12);
}
export function ruler(p, { text = '25+ СМ' } = {}) {
  const g = p.g; g.save(); g.translate(300, 500); g.rotate(-0.25); g.beginPath(); g.roundRect(-270, -70, 540, 140, 14); fillOl(g, '#f2c14a', 10);
  for (let i = 0; i <= 25; i++) { g.beginPath(); g.moveTo(-250 + i * 20, -70); g.lineTo(-250 + i * 20, -70 + (i % 5 ? 26 : 46)); ol(g, 4); }
  g.font = '900 72px Inter, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = '#2a2028'; g.fillText(text, 0, 30); g.restore();
}
export function bubble(p, { text = '?!' } = {}) {
  const g = p.g; g.beginPath(); g.roundRect(60, 200, 480, 360, 80); g.moveTo(180, 550); g.lineTo(140, 700); g.lineTo(280, 556); fillOl(g, '#ffffff', 12);
  words(p, { lines: [text], size: 200, col: '#4f7fb8' });
}
export function bubbles(p, { t = 0 } = {}) {
  const g = p.g; for (let i = 0; i < 7; i++) { const k = (t * 0.35 + i / 7) % 1, x = 300 + Math.sin(i * 2.3 + k * 6) * 90, y = 900 - k * 800, r = 14 + (i % 3) * 10; g.globalAlpha = Math.min(1, (1 - k) * 3); ell(g, x, y, r, r, 'rgba(220,245,255,.35)', 5); ell(g, x - r * 0.35, y - r * 0.35, r * 0.2, r * 0.2, '#ffffff', 0); } g.globalAlpha = 1;
}
export function sparkle(p, { k = 1, col = '#ffffff' } = {}) {
  const g = p.g; g.save(); g.translate(300, 500); g.scale(k, k); g.beginPath(); for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2, r = i % 2 ? 40 : 200; g.lineTo(Math.cos(a) * r, Math.sin(a) * r); } g.closePath(); fillOl(g, col, 10); g.restore();
}
/** little cut-out tree with a face (arrived late) */
export function tree(p, { kind = 'frown', blink = 0 } = {}) {
  const g = p.g; g.beginPath(); g.roundRect(270, 560, 60, 410, 16); fillOl(g, '#8a5a34', 9);
  const c = new Path2D(); for (let i = 0; i <= 40; i++) { const a = i / 40 * Math.PI * 2, r = 210 * (1 + 0.08 * Math.sin(a * 7)); i ? c.lineTo(300 + Math.cos(a) * r, 400 + Math.sin(a) * r * 0.9) : c.moveTo(300 + r, 400); }
  c.closePath(); g.fillStyle = '#6fbf5a'; g.fill(c); shade(g, c, '#4f9a40', 24, 18); g.lineWidth = 10; g.strokeStyle = INK; g.stroke(c);
  face(g, 300, 400, 1.2, { kind, blink });
}

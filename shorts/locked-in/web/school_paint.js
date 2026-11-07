// Painted textures for the school set (our own), same flat-with-dark-seams style as paint.js.
import { rng } from './paint.js';
const cv = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return [c, c.getContext('2d')]; };
const hsl = (h, s, l, a = 1) => `hsla(${h},${s}%,${l}%,${a})`;
const INK = '#241726';
const txt = (g, s, x, y, size, fill, opts = {}) => {
  g.save(); g.font = `${opts.weight || 900} ${size}px ${opts.font || 'Arial Black, Arial'}`; g.textAlign = opts.align || 'center'; g.textBaseline = 'middle';
  const maxW = opts.maxW || g.canvas.width * 0.9, mw = g.measureText(s).width;
  if (mw > maxW) { size = Math.floor(size * maxW / mw); g.font = `${opts.weight || 900} ${size}px ${opts.font || 'Arial Black, Arial'}`; }
  if (opts.stroke) { g.lineJoin = 'round'; g.lineWidth = opts.stroke; g.strokeStyle = opts.strokeCol || INK; g.strokeText(s, x, y); }
  g.fillStyle = fill; g.fillText(s, x, y); g.restore();
};

export function brick(seed = 21) {
  const [c, g] = cv(512, 512), r = rng(seed), bh = 32, bw = 96;
  g.fillStyle = '#d9c9b0'; g.fillRect(0, 0, 512, 512);
  for (let row = 0; row < 16; row++) for (let col = -1; col < 7; col++) {
    const x = col * bw + (row % 2) * bw / 2 + 5, y = row * bh, L = 44 + r() * 9, H = 8 + r() * 8;
    g.fillStyle = hsl(H, 52, L); g.fillRect(x + 3, y + 3, bw - 6, bh - 6);
    g.fillStyle = hsl(H, 50, L + 7, 0.7); g.fillRect(x + 5, y + 4, bw - 12, 4);
    g.fillStyle = hsl(H, 50, L - 10, 0.55); g.fillRect(x + 4, y + bh - 8, bw - 8, 4);
    for (let k = 0; k < 4; k++) { g.fillStyle = hsl(H, 40, L - 12, 0.5); g.beginPath(); g.ellipse(x + r() * bw, y + 6 + r() * (bh - 12), 2 + r() * 3, 1 + r() * 2, 0, 0, 7); g.fill(); }
  }
  return c;
}
export function floorTiles(seed = 22, a = '#efe6d2', b = '#cdbf9f') {
  const [c, g] = cv(512, 512), r = rng(seed), n = 8, s = 512 / n;
  for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
    g.fillStyle = (i + j) % 2 ? a : b; g.fillRect(i * s, j * s, s, s);
    for (let k = 0; k < 14; k++) { g.fillStyle = `rgba(90,70,40,${0.08 + r() * 0.1})`; g.beginPath(); g.ellipse(i * s + r() * s, j * s + r() * s, 1 + r() * 3, 1 + r() * 2, 0, 0, 7); g.fill(); }
    g.fillStyle = 'rgba(255,255,255,.25)'; g.fillRect(i * s + 4, j * s + 4, s - 8, 3);
  }
  g.strokeStyle = 'rgba(60,45,30,.55)'; g.lineWidth = 2;
  for (let i = 0; i <= n; i++) { g.beginPath(); g.moveTo(i * s, 0); g.lineTo(i * s, 512); g.stroke(); g.beginPath(); g.moveTo(0, i * s); g.lineTo(512, i * s); g.stroke(); }
  return c;
}
/** 4 lockers across, full height */
export function lockers(seed = 23, col = '#3f86ad') {
  const [c, g] = cv(512, 1024), r = rng(seed), w = 128;
  for (let i = 0; i < 4; i++) {
    const x = i * w; g.fillStyle = col; g.fillRect(x, 0, w, 1024);
    g.fillStyle = 'rgba(255,255,255,.18)'; g.fillRect(x + 8, 8, 10, 1000);
    g.fillStyle = 'rgba(0,0,0,.18)'; g.fillRect(x + w - 16, 8, 10, 1000);
    g.fillStyle = INK; g.fillRect(x, 0, 5, 1024); g.fillRect(x + w - 5, 0, 5, 1024);
    for (let k = 0; k < 6; k++) { g.fillStyle = 'rgba(20,30,40,.75)'; g.beginPath(); g.roundRect(x + 30, 60 + k * 22, w - 60, 9, 4); g.fill(); }
    for (let k = 0; k < 6; k++) { g.fillStyle = 'rgba(20,30,40,.75)'; g.beginPath(); g.roundRect(x + 30, 820 + k * 22, w - 60, 9, 4); g.fill(); }
    g.fillStyle = '#c9cfd6'; g.beginPath(); g.roundRect(x + w - 40, 440, 18, 90, 6); g.fill(); g.strokeStyle = INK; g.lineWidth = 4; g.stroke();
    g.fillStyle = '#f2efe6'; g.beginPath(); g.roundRect(x + 34, 230, 60, 30, 4); g.fill(); g.stroke();
    txt(g, String(100 + ((seed * 7 + i * 3) % 90)), x + 64, 246, 20, INK, { font: 'Arial', weight: 700 });
    if (r() < 0.35) { g.fillStyle = ['#ffd23f', '#ff6f86', '#7ed957'][(r() * 3) | 0]; g.save(); g.translate(x + 40 + r() * 40, 600 + r() * 120); g.rotate(r() - 0.5); g.fillRect(-18, -18, 36, 36); g.restore(); }
  }
  return c;
}
export function chalkboard() {
  const [c, g] = cv(1024, 512), r = rng(24);
  g.fillStyle = '#7a5434'; g.fillRect(0, 0, 1024, 512);
  g.fillStyle = '#2f4f3e'; g.fillRect(26, 26, 972, 440);
  for (let i = 0; i < 60; i++) { g.fillStyle = `rgba(255,255,255,${0.03 + r() * 0.05})`; g.beginPath(); g.ellipse(40 + r() * 940, 40 + r() * 410, 30 + r() * 90, 8 + r() * 20, r() * 0.4, 0, 7); g.fill(); }
  txt(g, 'DETENTION', 512, 170, 120, '#f4f1e6', { font: 'Comic Sans MS, Chalkboard, Arial', weight: 700 });
  txt(g, 'Friday  3:30 - 6:00', 512, 290, 54, '#f4f1e6', { font: 'Comic Sans MS, Chalkboard, Arial', weight: 700 });
  txt(g, 'NO PHONES!', 512, 380, 44, '#ffd6e0', { font: 'Comic Sans MS, Chalkboard, Arial', weight: 700 });
  g.strokeStyle = '#f4f1e6'; g.lineWidth = 6; g.beginPath(); g.moveTo(230, 228); g.lineTo(794, 228); g.stroke();
  // little doodle star
  g.beginPath(); for (let i = 0; i < 11; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? 18 : 42; g.lineTo(880 + Math.cos(a) * rr, 380 + Math.sin(a) * rr); } g.stroke();
  g.fillStyle = '#b08a5a'; g.fillRect(26, 466, 972, 20); g.fillStyle = '#f4f1e6'; g.fillRect(200, 456, 40, 10); g.fillRect(700, 458, 24, 8);
  return c;
}
export function vending() {
  const [c, g] = cv(512, 1024), r = rng(25);
  g.fillStyle = '#c3262e'; g.fillRect(0, 0, 512, 1024);
  g.fillStyle = '#9a1c24'; g.fillRect(0, 0, 512, 16); g.fillRect(0, 1008, 512, 16);
  g.fillStyle = '#ffe9a8'; g.beginPath(); g.roundRect(30, 26, 452, 96, 14); g.fill();
  txt(g, 'SNACKS', 256, 76, 74, '#c3262e');
  g.fillStyle = '#1d2a36'; g.beginPath(); g.roundRect(30, 140, 340, 680, 10); g.fill();
  const cols = ['#ffd23f', '#3f86ad', '#7ed957', '#ff8c42', '#e3403a', '#b07ad9', '#f4f1e6'];
  for (let row = 0; row < 6; row++) {
    g.fillStyle = '#5b6b78'; g.fillRect(40, 250 + row * 106, 320, 8);
    for (let k = 0; k < 5; k++) { const x = 52 + k * 62, y = 166 + row * 106, cl = cols[(row * 3 + k * 2) % cols.length]; g.fillStyle = cl; g.beginPath(); g.roundRect(x, y, 48, 80, 6); g.fill(); g.strokeStyle = INK; g.lineWidth = 3; g.stroke(); g.fillStyle = 'rgba(255,255,255,.5)'; g.fillRect(x + 8, y + 10, 8, 56); }
  }
  g.fillStyle = 'rgba(255,255,255,.16)'; g.beginPath(); g.moveTo(60, 140); g.lineTo(150, 140); g.lineTo(60, 400); g.fill();
  g.fillStyle = '#2a2f38'; g.beginPath(); g.roundRect(390, 160, 92, 400, 10); g.fill();
  for (let k = 0; k < 12; k++) { g.fillStyle = '#c9cfd6'; g.beginPath(); g.arc(416 + (k % 3) * 22, 200 + Math.floor(k / 3) * 34, 8, 0, 7); g.fill(); }
  g.fillStyle = '#7ed957'; g.fillRect(404, 360, 64, 26); g.fillStyle = '#c9cfd6'; g.fillRect(426, 420, 20, 54);
  g.fillStyle = '#111'; g.beginPath(); g.roundRect(60, 860, 300, 110, 10); g.fill();
  g.strokeStyle = INK; g.lineWidth = 10; g.strokeRect(5, 5, 502, 1014);
  return c;
}
export function bookshelf(seed = 26) {
  const [c, g] = cv(512, 512), r = rng(seed);
  g.fillStyle = '#8a5a34'; g.fillRect(0, 0, 512, 512);
  for (let s = 0; s < 4; s++) {
    const y0 = 16 + s * 124, y1 = y0 + 104; g.fillStyle = '#4a2f1c'; g.fillRect(14, y0, 484, 104);
    let x = 18;
    while (x < 492) {
      const w = 12 + r() * 22, h = 62 + r() * 38; if (x + w > 494) break;
      const cl = hsl([0, 210, 40, 120, 280, 25, 190][(r() * 7) | 0], 45 + r() * 20, 36 + r() * 20);
      if (r() < 0.08) { g.save(); g.translate(x + w, y1); g.rotate(-0.35); g.fillStyle = cl; g.fillRect(0, -h, w, h); g.restore(); x += w + 14; continue; }
      g.fillStyle = cl; g.fillRect(x, y1 - h, w, h); g.fillStyle = 'rgba(255,255,255,.35)'; g.fillRect(x + 2, y1 - h + 8, w - 4, 4); g.fillRect(x + 2, y1 - 18, w - 4, 3);
      g.strokeStyle = INK; g.lineWidth = 2.5; g.strokeRect(x, y1 - h, w, h); x += w + 1;
    }
    g.fillStyle = '#a06e44'; g.fillRect(8, y1, 496, 14); g.fillStyle = INK; g.fillRect(8, y1 + 12, 496, 3);
  }
  g.strokeStyle = INK; g.lineWidth = 8; g.strokeRect(4, 4, 504, 504);
  return c;
}
export function schoolSign() {
  const [c, g] = cv(1024, 192);
  g.fillStyle = '#1f3566'; g.fillRect(0, 0, 1024, 192); g.strokeStyle = '#e2b84a'; g.lineWidth = 12; g.strokeRect(10, 10, 1004, 172);
  txt(g, 'WESTFIELD HIGH SCHOOL', 512, 100, 84, '#f4f1e6');
  return c;
}
export function marquee() {
  const [c, g] = cv(1024, 512);
  g.fillStyle = '#1f3566'; g.fillRect(0, 0, 1024, 512); g.fillStyle = '#f7f4ea'; g.fillRect(36, 120, 952, 356);
  txt(g, 'WESTFIELD WOLVES', 512, 64, 70, '#e2b84a');
  txt(g, 'HAVE A GREAT', 512, 220, 92, INK, { font: 'Arial', weight: 900 });
  txt(g, 'WEEKEND!', 512, 360, 110, '#c3262e', { font: 'Arial', weight: 900 });
  return c;
}
export function flag() {
  const [c, g] = cv(760, 400);
  for (let i = 0; i < 13; i++) { g.fillStyle = i % 2 ? '#f7f4ea' : '#c3262e'; g.fillRect(0, i * 400 / 13, 760, 400 / 13 + 1); }
  g.fillStyle = '#1f3566'; g.fillRect(0, 0, 304, 215);
  g.fillStyle = '#f7f4ea';
  for (let rI = 0; rI < 9; rI++) for (let k = 0; k < (rI % 2 ? 5 : 6); k++) { const x = 26 + k * 50 + (rI % 2 ? 25 : 0), y = 14 + rI * 23; g.beginPath(); for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? 3.6 : 8.5; g.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); } g.fill(); }
  return c;
}
export function busSide() {
  const [c, g] = cv(1024, 256);
  g.fillStyle = '#f2b51d'; g.fillRect(0, 0, 1024, 256);
  g.fillStyle = INK; g.fillRect(0, 150, 1024, 8); g.fillRect(0, 186, 1024, 8);
  for (let k = 0; k < 8; k++) { g.fillStyle = '#2a3e57'; g.beginPath(); g.roundRect(60 + k * 112, 26, 92, 92, 8); g.fill(); g.fillStyle = 'rgba(255,255,255,.3)'; g.fillRect(70 + k * 112, 34, 14, 76); g.strokeStyle = INK; g.lineWidth = 5; g.strokeRect(60 + k * 112, 26, 92, 92); }
  txt(g, 'SCHOOL BUS', 512, 172, 30, INK, { font: 'Arial', weight: 900 });
  g.strokeStyle = INK; g.lineWidth = 8; g.strokeRect(4, 4, 1016, 248);
  return c;
}
export function clockFace() {
  const [c, g] = cv(512, 512);
  g.fillStyle = '#f7f4ea'; g.beginPath(); g.arc(256, 256, 240, 0, 7); g.fill(); g.lineWidth = 22; g.strokeStyle = INK; g.stroke();
  for (let i = 0; i < 60; i++) { const a = i / 60 * Math.PI * 2, r0 = i % 5 ? 214 : 196; g.lineWidth = i % 5 ? 4 : 10; g.beginPath(); g.moveTo(256 + Math.sin(a) * r0, 256 - Math.cos(a) * r0); g.lineTo(256 + Math.sin(a) * 226, 256 - Math.cos(a) * 226); g.stroke(); }
  for (let i = 1; i <= 12; i++) { const a = i / 12 * Math.PI * 2; txt(g, String(i), 256 + Math.sin(a) * 160, 260 - Math.cos(a) * 160, 50, INK, { font: 'Arial', weight: 800 }); }
  return c;
}
export function exitSign() {
  const [c, g] = cv(256, 128);
  g.fillStyle = '#2a1c1e'; g.fillRect(0, 0, 256, 128); txt(g, 'EXIT', 128, 66, 78, '#ff4a3d'); return c;
}
export function windowDecal(seed = 27) {
  const [c, g] = cv(256, 256), r = rng(seed);
  g.fillStyle = '#f2efe6'; g.fillRect(0, 0, 256, 256);
  const gr = g.createLinearGradient(0, 0, 256, 256); gr.addColorStop(0, '#9cc6e8'); gr.addColorStop(1, '#4f7fa8');
  g.fillStyle = gr; g.fillRect(18, 18, 220, 220);
  g.fillStyle = 'rgba(255,255,255,.35)'; g.beginPath(); g.moveTo(40, 18); g.lineTo(100, 18); g.lineTo(18, 120); g.lineTo(18, 70); g.fill();
  g.fillStyle = '#f2efe6'; g.fillRect(120, 18, 14, 220); g.fillRect(18, 120, 220, 14);
  g.strokeStyle = INK; g.lineWidth = 6; g.strokeRect(3, 3, 250, 250); g.strokeRect(18, 18, 220, 220);
  return c;
}
export function concrete(seed = 28) {
  const [c, g] = cv(512, 512), r = rng(seed);
  g.fillStyle = '#c9c4b8'; g.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 400; i++) { g.fillStyle = `rgba(${r() < 0.5 ? '255,255,255' : '60,55,50'},${0.05 + r() * 0.08})`; g.beginPath(); g.ellipse(r() * 512, r() * 512, 1 + r() * 4, 1 + r() * 3, 0, 0, 7); g.fill(); }
  g.strokeStyle = 'rgba(60,55,50,.6)'; g.lineWidth = 3; for (const x of [0, 256]) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, 512); g.stroke(); g.beginPath(); g.moveTo(0, x); g.lineTo(512, x); g.stroke(); }
  return c;
}
export function asphalt(seed = 29) {
  const [c, g] = cv(512, 512), r = rng(seed);
  g.fillStyle = '#4a4d55'; g.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 900; i++) { g.fillStyle = `rgba(${r() < 0.5 ? '200,200,210' : '20,20,25'},${0.08 + r() * 0.12})`; g.fillRect(r() * 512, r() * 512, 2, 2); }
  g.fillStyle = '#f2c53d'; g.fillRect(0, 244, 200, 10); g.fillRect(0, 260, 200, 10); g.fillRect(256, 244, 200, 10); g.fillRect(256, 260, 200, 10);
  return c;
}
export function carpet(seed = 30) {
  const [c, g] = cv(512, 512), r = rng(seed);
  g.fillStyle = '#5a6fa0'; g.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 8; i++) for (let j = 0; j < 8; j++) { g.fillStyle = (i + j) % 2 ? '#6479ab' : '#53689a'; g.fillRect(i * 64, j * 64, 64, 64); g.fillStyle = '#e2b84a'; g.beginPath(); g.arc(i * 64 + 32, j * 64 + 32, 5, 0, 7); g.fill(); }
  for (let i = 0; i < 800; i++) { g.fillStyle = `rgba(20,20,40,${0.06 + r() * 0.08})`; g.fillRect(r() * 512, r() * 512, 2, 3); }
  return c;
}
export function ceiling() {
  const [c, g] = cv(256, 256);
  g.fillStyle = '#ece8de'; g.fillRect(0, 0, 256, 256); g.strokeStyle = '#b8b2a4'; g.lineWidth = 5;
  for (const x of [0, 128]) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, 256); g.stroke(); g.beginPath(); g.moveTo(0, x); g.lineTo(256, x); g.stroke(); }
  return c;
}
export function corkboard(seed = 31) {
  const [c, g] = cv(512, 256), r = rng(seed);
  g.fillStyle = '#b8865a'; g.fillRect(0, 0, 512, 256);
  for (let i = 0; i < 500; i++) { g.fillStyle = `rgba(80,50,20,${0.15 + r() * 0.2})`; g.fillRect(r() * 512, r() * 256, 2, 2); }
  const cols = ['#f7f4ea', '#ffd23f', '#ff9eb5', '#a8e6ff', '#c3f0a0'];
  for (let i = 0; i < 9; i++) { g.save(); g.translate(40 + (i % 5) * 100 + r() * 20, 50 + Math.floor(i / 5) * 120 + r() * 20); g.rotate((r() - 0.5) * 0.3); g.fillStyle = cols[i % 5]; g.fillRect(-36, -40, 72, 84); g.fillStyle = 'rgba(0,0,0,.35)'; for (let k = 0; k < 4; k++) g.fillRect(-26, -22 + k * 14, 40 + r() * 12, 5); g.fillStyle = '#e3403a'; g.beginPath(); g.arc(0, -34, 6, 0, 7); g.fill(); g.restore(); }
  g.strokeStyle = '#7a5434'; g.lineWidth = 16; g.strokeRect(0, 0, 512, 256);
  return c;
}
export function vent() {
  const [c, g] = cv(256, 128);
  g.fillStyle = '#c9cfd6'; g.fillRect(0, 0, 256, 128);
  for (let k = 0; k < 7; k++) { g.fillStyle = '#2a2f38'; g.fillRect(20, 16 + k * 15, 216, 8); }
  g.strokeStyle = INK; g.lineWidth = 8; g.strokeRect(4, 4, 248, 120); return c;
}
export function pennant() {
  const [c, g] = cv(512, 256);
  g.fillStyle = '#1f3566'; g.beginPath(); g.moveTo(0, 0); g.lineTo(512, 128); g.lineTo(0, 256); g.closePath(); g.fill();
  g.fillStyle = '#e2b84a'; g.fillRect(0, 0, 40, 256);
  txt(g, 'WOLVES', 210, 132, 62, '#f4f1e6');
  return c;
}
export function lightPanel() {
  const [c, g] = cv(128, 256);
  g.fillStyle = '#fffdf3'; g.fillRect(0, 0, 128, 256); g.strokeStyle = '#c9c4b8'; g.lineWidth = 6; g.strokeRect(3, 3, 122, 250);
  g.lineWidth = 2; for (let k = 1; k < 4; k++) { g.beginPath(); g.moveTo(0, k * 64); g.lineTo(128, k * 64); g.stroke(); }
  return c;
}

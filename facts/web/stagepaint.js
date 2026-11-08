// Painters for the fact dioramas (same flat-with-marker style as cardpaint.js)
import { rng } from './paint.js';
import { painted, kraft, marker, tint } from './cardpaint.js';
const cv = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return [c, c.getContext('2d')]; };

export function starfield(seed = 1) {
  const [c, g] = cv(1024, 1024), r = rng(seed);
  g.fillStyle = '#0c1233'; g.fillRect(0, 0, 1024, 1024);
  for (let i = 0; i < 14; i++) { const x = r() * 1024, y = r() * 1024, rr = 120 + r() * 260, gr = g.createRadialGradient(x, y, 0, x, y, rr); const col = ['120,70,190', '40,140,170', '190,80,140'][i % 3]; gr.addColorStop(0, `rgba(${col},.32)`); gr.addColorStop(1, `rgba(${col},0)`); g.fillStyle = gr; g.fillRect(0, 0, 1024, 1024); }
  for (let i = 0; i < 900; i++) { g.fillStyle = `rgba(255,255,255,${0.35 + r() * 0.65})`; g.beginPath(); g.arc(r() * 1024, r() * 1024, 0.6 + r() * 1.8, 0, 7); g.fill(); }
  for (let i = 0; i < 36; i++) { const x = r() * 1024, y = r() * 1024, s = 6 + r() * 12; g.fillStyle = r() < 0.5 ? '#fff6c8' : '#ffffff'; g.beginPath(); for (let k = 0; k < 8; k++) { const a = k / 8 * Math.PI * 2, rr = k % 2 ? s * 0.28 : s; g.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); } g.fill(); }
  return c;
}
export function seaBack(seed = 2) {
  const [c, g] = cv(512, 1024), r = rng(seed);
  const gr = g.createLinearGradient(0, 0, 0, 1024); gr.addColorStop(0, '#7fd3f0'); gr.addColorStop(0.45, '#3a9ad0'); gr.addColorStop(1, '#16508c'); g.fillStyle = gr; g.fillRect(0, 0, 512, 1024);
  for (let i = 0; i < 7; i++) { const x = r() * 512; g.fillStyle = 'rgba(255,255,255,.10)'; g.beginPath(); g.moveTo(x, 0); g.lineTo(x + 40 + r() * 40, 0); g.lineTo(x + 160 + r() * 80, 1024); g.lineTo(x + 90, 1024); g.fill(); }
  for (let i = 0; i < 40; i++) { const x = r() * 512, y = r() * 1024, s = 3 + r() * 9; g.strokeStyle = 'rgba(230,248,255,.5)'; g.lineWidth = 2; g.beginPath(); g.arc(x, y, s, 0, 7); g.stroke(); }
  for (let i = 0; i < 6; i++) { const x = 40 + r() * 430, y = 300 + r() * 600, s = 10 + r() * 10; g.fillStyle = 'rgba(20,70,120,.45)'; g.beginPath(); g.ellipse(x, y, s * 1.6, s * 0.8, 0, 0, 7); g.moveTo(x - s * 1.5, y); g.lineTo(x - s * 2.6, y - s * 0.8); g.lineTo(x - s * 2.6, y + s * 0.8); g.fill(); }
  return c;
}
export function bandPlanet(cols, seed = 3, spots = 0) {
  const [c, g] = cv(512, 256), r = rng(seed);
  for (let y = 0; y < 256; y += 4) { g.fillStyle = cols[Math.floor((Math.sin(y * 0.07 + seed) * 0.5 + 0.5) * cols.length) % cols.length]; g.fillRect(0, y, 512, 4); }
  for (let i = 0; i < 40; i++) { g.strokeStyle = 'rgba(255,255,255,.18)'; g.lineWidth = 2 + r() * 4; const y = r() * 256; g.beginPath(); g.moveTo(0, y); for (let x = 0; x <= 512; x += 32) g.lineTo(x, y + Math.sin(x * 0.03 + i) * 4); g.stroke(); }
  for (let i = 0; i < spots; i++) { g.fillStyle = 'rgba(20,30,90,.55)'; g.beginPath(); g.ellipse(100 + r() * 300, 80 + r() * 100, 30, 14, 0, 0, 7); g.fill(); }
  return c;
}
export function sunTex(seed = 4) {
  const c = painted(seed, '#ffc52e'), g = c.getContext('2d'), r = rng(seed);
  for (let i = 0; i < 40; i++) { g.fillStyle = `rgba(255,${120 + r() * 80 | 0},20,.35)`; g.beginPath(); g.ellipse(r() * 512, r() * 512, 20 + r() * 50, 10 + r() * 30, r() * 3, 0, 7); g.fill(); }
  return c;
}
export function earthTex(seed = 5) {
  const c = painted(seed, '#3f8fdc'), g = c.getContext('2d'), r = rng(seed);
  for (let i = 0; i < 9; i++) { const x = r() * 512, y = 80 + r() * 350; g.fillStyle = i % 3 ? '#5fb14a' : '#c9b25a'; g.beginPath(); for (let k = 0; k < 14; k++) { const a = k / 14 * Math.PI * 2, rr = 30 + r() * 45; g.lineTo(x + Math.cos(a) * rr * 1.4, y + Math.sin(a) * rr); } g.fill(); g.strokeStyle = 'rgba(30,60,30,.6)'; g.lineWidth = 3; g.stroke(); }
  for (let i = 0; i < 16; i++) { g.strokeStyle = 'rgba(255,255,255,.75)'; g.lineWidth = 6 + r() * 6; g.lineCap = 'round'; const x = r() * 512, y = r() * 512; g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + 40, y - 14, x + 90, y + 4); g.stroke(); }
  g.fillStyle = '#f6fbff'; g.fillRect(0, 0, 512, 26); g.fillRect(0, 486, 512, 26);
  return c;
}
export function speckled(seed, col, dot = '#2a2028', n = 160) {
  const c = painted(seed, col), g = c.getContext('2d'), r = rng(seed + 9);
  for (let i = 0; i < n; i++) { g.fillStyle = tint(col, r() < 0.5 ? 0.7 : 1.15, 0.7); g.beginPath(); g.ellipse(r() * 512, r() * 512, 3 + r() * 10, 2 + r() * 6, r() * 3, 0, 7); g.fill(); }
  return c;
}
export function tiles(seed, col, n = 4) {
  const c = painted(seed, col), g = c.getContext('2d'), r = rng(seed);
  for (let i = 0; i <= n; i++) { marker(g, [[i * 512 / n, -6], [i * 512 / n, 518]], 4, 'rgba(42,32,40,.45)', r, 1); marker(g, [[-6, i * 512 / n], [518, i * 512 / n]], 4, 'rgba(42,32,40,.45)', r, 1); }
  return c;
}
export function rug(seed = 7) {
  const [c, g] = cv(512, 512), cols = ['#e0533d', '#f2c14a', '#4f9be0', '#7cc36a', '#e86a8a'];
  for (let i = 0; i < 10; i++) { g.fillStyle = cols[i % cols.length]; g.fillRect(0, i * 51.2, 512, 52); }
  const r = rng(seed); for (let i = 0; i < 10; i++) marker(g, [[0, i * 51.2], [512, i * 51.2]], 3, 'rgba(42,32,40,.4)', r, 1);
  return c;
}
/** framed picture of a question mark for the room wall */
export function picture() {
  const [c, g] = cv(256, 320), r = rng(8);
  g.fillStyle = '#8a5a34'; g.fillRect(0, 0, 256, 320); g.fillStyle = '#fbf6ea'; g.fillRect(22, 22, 212, 276);
  g.font = '900 220px Inter, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.lineWidth = 14; g.strokeStyle = '#2a2028'; g.strokeText('?', 128, 170); g.fillStyle = '#f2b33d'; g.fillText('?', 128, 170);
  marker(g, [[4, 4], [252, 4], [252, 316], [4, 316]], 8, '#2a2028', r, 1, true);
  return c;
}
export const bright = () => { const [c, g] = cv(64, 64); const gr = g.createRadialGradient(32, 40, 4, 32, 32, 46); gr.addColorStop(0, '#fffbe6'); gr.addColorStop(1, '#ffd27a'); g.fillStyle = gr; g.fillRect(0, 0, 64, 64); return c; };

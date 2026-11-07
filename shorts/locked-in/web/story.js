// Shot plan for "Locked In" — timed to voice.wav (34.78 s, 30 fps, 1043 frames).
// Phrases (frames): 5-80 "Two teenagers got locked in their high school overnight." | 92-133 "Only one of them wanted out." |
// 152-188 "One Friday in Ohio," 197-229 "detention ran late," 238-287 "and the janitor locked every door." | 304-325 "Jake panicked." |
// 335-365 "He banged on doors," 371-431 "yelled into vents, and tried every window." | 446-480 "Mia just sat on a desk," 488-528 "eating vending machine chips." |
// 546-589 "At midnight, the lights went out." | 602-643 "Something rattled down the hall." | 658-692 "Jake screamed so loud," 696-720 "the trophies shook." |
// 739-755 "In the morning," 763-858 "the janitor found them in the library and asked Mia one question:" | 870-917 "Why didn't you just use your keys?" |
// 936-971 "Her mom was the principal." | 988-1030 "She just wasn't ready to leave him."
import { M as E, camFromKeys, idle, blinkAt, walk, q, clamp, lerp, ramp } from './motion.js';
export const FPS = 30, TOTAL = 1043, DECK = 0;
export const SHOTS = [
  { id: 'hook', a: 0, b: 89, light: 'night' },
  { id: 'out', a: 90, b: 150, light: 'hallNight' },
  { id: 'friday', a: 151, b: 196, light: 'golden' },
  { id: 'detention', a: 197, b: 236, light: 'classGold' },
  { id: 'lock', a: 237, b: 303, light: 'dusk' },
  { id: 'panic', a: 304, b: 334, light: 'dusk' },
  { id: 'bang', a: 335, b: 370, light: 'dusk' },
  { id: 'vent', a: 371, b: 398, light: 'hallNight' },
  { id: 'windows', a: 399, b: 445, light: 'night' },
  { id: 'chips', a: 446, b: 540, light: 'hallNight' },
  { id: 'clock', a: 541, b: 574, light: 'hallNight' },
  { id: 'lightsout', a: 575, b: 600, light: 'hallNight' },
  { id: 'rattle', a: 601, b: 657, light: 'dark' },
  { id: 'scream', a: 658, b: 699, light: 'dark' },
  { id: 'shook', a: 700, b: 738, light: 'dark' },
  { id: 'morning', a: 739, b: 766, light: 'morning' },
  { id: 'found', a: 767, b: 805, light: 'morning' },
  { id: 'asked', a: 806, b: 869, light: 'morning' },
  { id: 'keysq', a: 870, b: 905, light: 'morning' },
  { id: 'keys', a: 906, b: 935, light: 'morning' },
  { id: 'principal', a: 936, b: 987, light: 'morning' },
  { id: 'him', a: 988, b: 1042, light: 'morning' },
];
export const shotAt = (f) => SHOTS.find((s) => f >= s.a && f <= s.b) || SHOTS[SHOTS.length - 1];
const smooth = E.smooth;

// ---------- lights ----------
const NIGHT_SKY = { skyTop: '#081330', skyHor: '#253a6b', stars: true, clouds: false };
export const LIGHTS = {
  night: { az: 115, el: 36, sky: '#5d74b8', ground: '#1e2438', hemi: 0.9, sun: '#a9bfff', sunI: 1.05, fog: '#1b2a4f', fogNear: 40, fogFar: 420, ...NIGHT_SKY,
    discAz: -96, discEl: 15, sunDisc: '#eef2ff', sunSize: 0.0022, win: '#4d5a80', winLit: '#ffd27a', lampsOn: true, lampHall: 3.2, lampClass: 2.6,
    glass: '#9fb6e0', glassO: 0.14, glassDoorO: 0.12, sat: 1.05, gain: '#e6ecff', vig: 0.3, shadowExt: 14 },
  golden: { az: 35, el: 14, sky: '#a7a8d6', ground: '#6a5040', hemi: 1.0, sun: '#ffbf7a', sunI: 2.6, fog: '#f2c39a', fogNear: 60, fogFar: 700,
    skyTop: '#5f7cc4', skyHor: '#ffcf94', cloud: '#ffe2c8', win: '#ffe9c8', winLit: '#ffe9c8', sat: 1.12, gain: '#fff2e2', vig: 0.22, shadowExt: 30, glassO: 0.2 },
  classGold: { az: 95, el: 24, sky: '#fff0dc', ground: '#9a8a70', hemi: 1.15, sun: '#ffcf8a', sunI: 2.2, fog: '#f2d2b0', fogNear: 30, fogFar: 400,
    skyTop: '#5f7cc4', skyHor: '#ffcf94', cloud: '#ffe2c8', sat: 1.1, gain: '#fff2e2', vig: 0.22, shadowExt: 14, glassO: 0.15 },
  dusk: { az: 25, el: 7, sky: '#8b7fc0', ground: '#4a3a48', hemi: 0.95, sun: '#ff9a6a', sunI: 1.8, fog: '#c78aa0', fogNear: 50, fogFar: 520,
    skyTop: '#3c3f86', skyHor: '#ff9e7a', cloud: '#ffb3a8', win: '#d9c9e0', winLit: '#ffd27a', lampsOn: true, lampHall: 2.6, lampClass: 1.6,
    glass: '#c8c8f0', glassO: 0.12, glassDoorO: 0.1, sat: 1.1, gain: '#fff0ea', vig: 0.26, shadowExt: 12 },
  hallNight: { az: 120, el: 72, sky: '#f2f5ff', ground: '#a0957c', hemi: 1.15, sun: '#fffaf0', sunI: 1.5, fog: '#d8dce8', fogNear: 40, fogFar: 300, ...NIGHT_SKY,
    glass: '#2b3b66', glassO: 0.55, glassDoorO: 0.5, sat: 1.08, vig: 0.24, shadowExt: 12, win: '#4d5a80' },
  dark: { az: 120, el: 70, sky: '#33437a', ground: '#151826', hemi: 0.5, sun: '#5a6fb0', sunI: 0.3, fog: '#0d1226', fogNear: 18, fogFar: 140, ...NIGHT_SKY,
    glass: '#1a2442', glassO: 0.6, glassDoorO: 0.6, sat: 0.95, gain: '#c8d4ff', vig: 0.42, shadowExt: 12 },
  morning: { az: 70, el: 9, sky: '#fff4e0', ground: '#a08f70', hemi: 1.05, sun: '#ffd59a', sunI: 2.8, fog: '#fde9cc', fogNear: 40, fogFar: 400,
    skyTop: '#7fb2e6', skyHor: '#ffe2b8', cloud: '#fff4e6', glassO: 0.1, sat: 1.12, gain: '#fff4e6', vig: 0.2, shadowExt: 12 },
};
export const lightFor = (S, f) => {
  const L = { ...LIGHTS[S.light] };
  if (S.id === 'lightsout' && f >= 586) Object.assign(L, LIGHTS.dark);
  if (S.id === 'detention') { const k = ramp(f, 200, 236); L.sunI = lerp(2.2, 1.2, k); L.sun = k > 0.5 ? '#ff9a6a' : '#ffcf8a'; L.el = lerp(24, 10, k); }
  if (S.id === 'friday') L.shadowExt = 40;
  return L;
};
const TINT = { night: '#c4cdee', golden: '#ffe6cc', classGold: '#fff0dc', dusk: '#ffd8cc', hallNight: '#ffffff', dark: '#8695c8', morning: '#fff2de' };

// ---------- cameras ----------
const KICKS = [{ f: 283, a: 0.035 }, { f: 341, a: 0.03 }, { f: 350, a: 0.035 }, { f: 359, a: 0.04 }, { f: 666, a: 0.05 }, { f: 676, a: 0.05 }, { f: 686, a: 0.04 }, { f: 702, a: 0.03 }, { f: 712, a: 0.035 }];
const CAMS = {
  hook: [
    { f: 0, pos: [-0.62, 1.47, 0.92], look: [-0.45, 1.38, -0.9], fov: 40 },
    { f: 12, pos: [-0.6, 1.47, 1.02], look: [-0.45, 1.38, -0.9], fov: 40 },
    { f: 80, pos: [0.6, 3.0, 17.5], look: [0.1, 3.7, -2], fov: 44, ease: 'easeOut', path: [[0.2, 1.7, 4.5]] },
    { f: 89, pos: [0.62, 3.02, 17.8], look: [0.1, 3.7, -2], fov: 44 },
  ],
  out: [
    { f: 90, pos: [0.05, 1.35, -4.75], look: [0.05, 1.2, -0.9], fov: 44 },
    { f: 116, pos: [0.08, 1.35, -4.55], look: [0.08, 1.2, -0.9], fov: 43 },
    { f: 136, pos: [0.42, 1.32, -3.35], look: [0.5, 1.3, -1.2], fov: 38 },
    { f: 150, pos: [0.44, 1.32, -3.25], look: [0.5, 1.3, -1.2], fov: 37, roll: 2 },
  ],
  friday: [
    { f: 151, pos: [5.0, 8.7, 10.6], look: [6.9, 8.25, 7.5], fov: 34 },
    { f: 196, pos: [2.6, 2.6, 26], look: [0.2, 3.1, 0], fov: 40, path: [[4.6, 6.4, 17.5]] },
  ],
  detention: [
    { f: 197, pos: [7.4, 1.7, -3.2], look: [7.4, 2.35, -9.3], fov: 50 },
    { f: 236, pos: [7.5, 1.55, -3.0], look: [7.3, 1.45, -7.4], fov: 47 },
  ],
  lock: [
    { f: 237, pos: [0.85, 1.35, 3.1], look: [0.75, 1.15, 0.2], fov: 44 },
    { f: 262, pos: [0.7, 1.33, 2.85], look: [0.55, 1.12, 0.2], fov: 43 },
    { f: 280, pos: [0.36, 1.0, 0.75], look: [0.02, 0.92, 0], fov: 36, ease: 'easeOut' },
    { f: 290, pos: [0.33, 1.02, 0.72], look: [0.0, 0.96, -0.05], fov: 35 },
    { f: 303, pos: [0.05, 1.25, 0.95], look: [-0.5, 1.3, -0.5], fov: 36 },
  ],
  panic: [
    { f: 304, pos: [-0.3, 1.3, 1.25], look: [-0.62, 1.42, -0.5], fov: 38 },
    { f: 316, pos: [-0.56, 1.46, 0.72], look: [-0.63, 1.46, -0.5], fov: 36, ease: 'easeOut' },
    { f: 334, pos: [-0.57, 1.47, 0.66], look: [-0.63, 1.46, -0.5], fov: 35, roll: -3 },
  ],
  bang: [
    { f: 335, pos: [0.2, 0.95, 2.3], look: [-0.58, 1.42, -0.5], fov: 42 },
    { f: 370, pos: [0.12, 0.98, 2.05], look: [-0.58, 1.42, -0.5], fov: 41 },
  ],
  vent: [
    { f: 371, pos: [0.15, 0.85, -5.3], look: [1.75, 0.62, -2.5], fov: 42 },
    { f: 398, pos: [0.35, 0.8, -4.9], look: [1.8, 0.6, -2.5], fov: 40 },
  ],
  windows: [
    { f: 399, pos: [3.2, 1.55, 3.9], look: [4.4, 1.62, -0.6], fov: 38 },
    { f: 445, pos: [9.9, 1.55, 3.9], look: [10.8, 1.62, -0.6], fov: 38, ease: 'smooth' },
  ],
  chips: [
    { f: 446, pos: [11.4, 1.45, -6.0], look: [-1.3, 1.0, -7.55], fov: 38 },
    { f: 540, pos: [10.5, 1.32, -6.45], look: [-1.3, 1.0, -7.6], fov: 36 },
  ],
  clock: [
    { f: 541, pos: [0.3, 2.3, -23.6], look: [0, 2.45, -25.93], fov: 46 },
    { f: 574, pos: [0.12, 2.38, -24.3], look: [0, 2.45, -25.93], fov: 44, roll: -2 },
  ],
  lightsout: [
    { f: 575, pos: [0.45, 1.65, -2.9], look: [0.1, 1.3, -20], fov: 42 },
    { f: 600, pos: [0.4, 1.6, -3.6], look: [0.1, 1.25, -20], fov: 40 },
  ],
  rattle: [
    { f: 601, pos: [0.4, 1.42, -3.3], look: [0.1, 1.36, -7.5], fov: 41 },
    { f: 657, pos: [0.3, 1.4, -4.0], look: [0.12, 1.38, -7.5], fov: 37, roll: 2 },
  ],
  scream: [
    { f: 658, pos: [0.3, 1.45, -4.3], look: [0.15, 1.42, -6.3], fov: 40 },
    { f: 699, pos: [0.25, 1.45, -4.5], look: [0.15, 1.42, -6.3], fov: 37 },
  ],
  shook: [
    { f: 700, pos: [-0.3, 1.62, -10.9], look: [-1.9, 1.45, -12.3], fov: 46 },
    { f: 720, pos: [-0.35, 1.6, -10.8], look: [-1.9, 1.45, -12.3], fov: 45 },
    { f: 730, pos: [-0.2, 1.45, -10.6], look: [0.35, 1.35, -14.0], fov: 42, ease: 'easeOut' },
    { f: 738, pos: [-0.2, 1.45, -10.7], look: [0.35, 1.35, -14.0], fov: 41 },
  ],
  morning: [
    { f: 739, pos: [-7.18, 1.1, -5.75], look: [-7.18, 0.72, -8.6], fov: 43 },
    { f: 766, pos: [-7.18, 1.2, -5.4], look: [-7.18, 0.75, -8.6], fov: 44 },
  ],
  found: [
    { f: 767, pos: [-6.6, 0.95, -7.5], look: [-2.75, 1.35, -4.8], fov: 36 },
    { f: 805, pos: [-6.4, 0.95, -7.3], look: [-2.8, 1.35, -4.8], fov: 34 },
  ],
  asked: [
    { f: 806, pos: [-4.5, 1.15, -5.3], look: [-6.7, 0.95, -8.0], fov: 44 },
    { f: 869, pos: [-4.9, 1.05, -5.8], look: [-6.7, 0.95, -8.1], fov: 42 },
  ],
  keysq: [
    { f: 870, pos: [-6.95, 0.5, -8.75], look: [-6.0, 1.5, -7.25], fov: 46 },
    { f: 905, pos: [-6.9, 0.52, -8.65], look: [-6.0, 1.52, -7.25], fov: 43, roll: -2 },
  ],
  keys: [
    { f: 906, pos: [-6.58, 0.58, -7.15], look: [-6.66, 0.48, -8.25], fov: 40 },
    { f: 935, pos: [-6.6, 0.57, -7.32], look: [-6.66, 0.48, -8.25], fov: 37 },
  ],
  principal: [
    { f: 936, pos: [-5.7, 1.0, -6.9], look: [-2.75, 1.5, -4.8], fov: 34 },
    { f: 987, pos: [-5.0, 1.15, -6.4], look: [-2.75, 1.55, -4.8], fov: 30, roll: 3.5 },
  ],
  him: [
    { f: 988, pos: [-7.18, 1.02, -5.6], look: [-7.18, 0.76, -8.5], fov: 44 },
    { f: 1042, pos: [-7.18, 0.98, -6.15], look: [-7.18, 0.78, -8.5], fov: 40 },
  ],
};
export const camAt = (f) => {
  const S = shotAt(f), c = camFromKeys(CAMS[S.id], f, { kicks: KICKS });
  c.flash = (f >= 151 && f < 157) ? 0.7 * (1 - (f - 151) / 6) : (f >= 739 && f < 746) ? 0.9 * (1 - (f - 739) / 7) : 0;
  if (S.id === 'friday') c.shadowAt = [0, 2, 4];
  if (S.id === 'windows') c.shadowAt = [7.6, 1, 0];
  return c;
};

// ---------- lens ----------
const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
export const dofAt = (f) => {
  const S = shotAt(f), C = camAt(f);
  switch (S.id) {
    case 'hook': return { focus: dist(C.pos, [-0.64, 1.45, -0.5]), cinf: lerp(12, 0, smooth(ramp(f, 14, 50))) };
    case 'out': return { focus: dist(C.pos, f < 125 ? [-0.3, 1.4, -1.0] : [0.55, 1.35, -1.5]), cinf: 9 };
    case 'detention': return { focus: dist(C.pos, [7.4, 1.4, -6.2]), cinf: lerp(0, 7, smooth(ramp(f, 205, 230))) };
    case 'lock': { const t = smooth(ramp(f, 290, 302)); return { focus: lerp(dist(C.pos, f < 266 ? [0.8, 1.4, 0.42] : [0.02, 0.9, 0]), dist(C.pos, [-0.64, 1.4, -0.5]), t), cinf: f < 266 ? 5 : 12 }; }
    case 'panic': return { focus: dist(C.pos, [-0.64, 1.45, -0.5]), cinf: 11 };
    case 'bang': return { focus: dist(C.pos, [-0.64, 1.4, -0.5]), cinf: 7 };
    case 'vent': return { focus: dist(C.pos, [1.6, 0.8, -2.8]), cinf: 8 };
    case 'windows': return { focus: dist(C.pos, [lerp(4.4, 10.8, ramp(f, 399, 445)), 1.6, -0.6]), cinf: 5 };
    case 'chips': return { focus: dist(C.pos, [7.95, 1.2, -6.65]), cinf: 9 };
    case 'clock': return { focus: dist(C.pos, [0, 2.45, -25.93]), cinf: 8 };
    case 'lightsout': return { focus: 7, cinf: 0 };
    case 'rattle': return { focus: dist(C.pos, [0.15, 1.35, -6.0]), cinf: 12 };
    case 'scream': return { focus: dist(C.pos, [0.15, 1.42, -6.2]), cinf: 10 };
    case 'shook': return { focus: dist(C.pos, f < 724 ? [-1.9, 1.45, -12.3] : [0.35, 1.35, -14.0]), cinf: 8 };
    case 'morning': return { focus: dist(C.pos, [-7.15, 0.85, -8.45]), cinf: 10 };
    case 'found': return { focus: dist(C.pos, [-2.8, 1.5, -4.8]), cinf: 9 };
    case 'asked': return { focus: dist(C.pos, [-6.6, 1.0, -7.9]), cinf: 7 };
    case 'keysq': return { focus: dist(C.pos, [-6.0, 1.6, -7.25]), cinf: 10 };
    case 'keys': return { focus: dist(C.pos, [-6.66, 0.5, -8.22]), cinf: 14 };
    case 'principal': return { focus: dist(C.pos, [-2.75, 1.55, -4.8]), cinf: 10 };
    case 'him': return { focus: dist(C.pos, [-7.15, 0.85, -8.45]), cinf: 11 };
  }
  return { focus: 10, cinf: 0 };
};

// ---------- world state ----------
export const worldAt = (f) => {
  const S = shotAt(f);
  const W = { busX: -6, bus: true, locked: f >= 283 || f < 151, chain: f >= 237 || f < 151, lights: true, shake: 0, flash: null };
  if (f < 151) W.bus = false;
  if (S.id === 'friday') W.busX = -4 + Math.max(0, f - 158) * 0.42;
  if (f > 196) W.bus = false;
  if (S.id === 'detention') { const k = smooth(ramp(f, 199, 234)); W.classClock = [3, 30 + k * 150]; }
  if (S.id === 'clock') { const m = f < 553 ? 59 + (f - 541) / 12 * 0.6 : 60 + 0.4 * Math.exp(-(f - 553) * 0.5) * Math.cos((f - 553) * 1.4); W.hallClock = [11, m]; }
  else W.hallClock = [0, 1];
  if (S.id === 'lightsout') W.lights = f < 583 ? true : Math.min(1, (f - 583) / 6);
  if (f >= 601 && f < 739) W.lights = false;
  if (S.id === 'rattle') { const k = ramp(f, 601, 657); W.flash = { I: lerp(6, 14, k), pos: [0.5, 1.2, lerp(-24.5, -17, k)], at: [0.2, 0.6, -6] }; }
  if (S.id === 'scream') W.flash = { I: 16, pos: [0.4, 1.3, -11.5], at: [0.15, 1.3, -6.0] };
  if (S.id === 'shook') { W.shake = f < 728 ? clamp(1 - (f - 700) / 34) : 0; W.flash = f < 724 ? { I: 18, pos: [0.4, 1.3, -14.6], at: [-1.9, 1.5, -12.2] } : { I: 12, pos: [0.25, 1.15, -13.7], at: [-0.9, 1.4, -9.6] }; }
  return W;
};

// ---------- actors (2D cards) ----------
let T_ = null;
const CARD = (who, o, pos, extra = {}) => ({ key: who + JSON.stringify(o), draw: (p) => T_.teenFront(p, who, o), x: pos[0], y: pos[1], z: pos[2], ...extra });
const life = (f, seed, k = 1) => { const i = idle(f, seed); return { bob: q(i.bob * k, 3), tilt: q(i.tilt * k, 1), headTilt: q(i.headTilt * k, 1) }; };
const SEED = { jake: 5, mia: 8, gus: 21, mom: 13 };
const SCALE = { jake: 0.93, mia: 0.9, gus: 1.0, mom: 0.98 };
const toward = (pos, cam, d) => { const dx = cam[0] - pos[0], dz = cam[2] - pos[2], l = Math.hypot(dx, dz) || 1; return [pos[0] + dx / l * d, pos[1], pos[2] + dz / l * d]; };

export const actorsAt = (f, T) => {
  T_ = T; const S = shotAt(f), out = [], tint = TINT[S.light] || '#ffffff', cam = camAt(f).pos;
  const put = (who, o, pos, extra = {}) => out.push(CARD(who, { seed: SEED[who], blink: blinkAt(f, SEED[who]), ...life(f, SEED[who]), ...o }, pos, { s: SCALE[who], tint, ...extra }));
  const chew = (ph) => (Math.floor((f + ph) / 7) % 2 ? 'chew' : 'smug');
  const eat = (ph) => (Math.floor((f + ph) / 16) % 3 === 0);
  switch (S.id) {
    case 'hook': {
      const w = q(Math.sin(f * 0.35), 1);
      put('jake', { expr: 'panic', L: 'glass', R: 'glass', sweat: f % 40 < 30, look: 0.2 }, [-0.64, 0, -0.5], { tint: '#ffe9cc' });
      put('mia', { expr: chew(0), L: 'hold', R: eat(4) ? 'eat' : 'wave', propL: 'chips', propR: eat(4) ? 'chip' : null, wv: w, look: -0.3 }, [-0.08, 0, -1.9], { tint: '#ffe9cc' });
      break;
    }
    case 'out': {
      const shake = q(Math.sin(f * 0.9) * 6, 1);
      put('jake', { expr: 'yell', L: 'pull', R: 'pull', bang: q(Math.abs(Math.sin(f * 0.45)), 1), headTilt: shake, look: 0 }, [-0.38, 0, -1.0]);
      put('mia', { expr: f > 126 ? 'smug' : chew(3), L: 'hold', R: eat(9) && f < 120 ? 'eat' : 'hang', propL: 'chips', propR: eat(9) && f < 120 ? 'chip' : null, look: f > 124 ? 0 : -0.5, headTilt: f > 126 ? 6 : 0 }, [0.55, 0, -1.5]);
      break;
    }
    case 'friday': break;
    case 'detention': {
      put('jake', { expr: 'bored', sit: 'chair', L: 'chin', blink: f > 222 ? 0.5 : blinkAt(f, 5), look: 0.3 }, [7.95, 0, -6.15]);
      put('mia', { expr: 'smile', sit: 'chair', L: 'hold', R: 'hang', look: -0.4 }, [6.7, 0, -6.45]);
      break;
    }
    case 'lock': {
      const wk = walk(f, 237, 0.75), back = walk(f, 289, 1.0);
      let x = Math.max(0.78, 1.02 - wk.dist); if (f >= 289) x = 0.78 + back.dist;
      const at = f >= 262 && f < 289;
      put('gus', { expr: f >= 283 && f < 289 ? 'smug' : 'whistle', phones: true, step: at ? 0 : q((f >= 289 ? back : wk).phase, 2), L: at ? 'lock' : 'hang', R: 'hold', propR: 'bigkeys', jingle: q(Math.sin(f * 0.6) * 0.3, 1), facing: f >= 289 ? 1 : -1, look: -0.3 }, [x, 0, 0.42]);
      if (f >= 286) { const k = smooth(ramp(f, 286, 300)); put('jake', { expr: 'panic', L: 'glass', R: 'glass', step: k < 1 ? q((f * 0.08) % 1, 2) : 0 }, [-0.64, 0, lerp(-4.5, -0.5, k)], { tint: '#ffe9cc' }); }
      break;
    }
    case 'panic': {
      put('jake', { expr: 'panic', L: 'glass', R: 'glass', sweat: true, headTilt: q(Math.sin(f * 1.3) * 3, 1) }, [-0.64, 0, -0.5], { tint: '#ffe9cc' });
      break;
    }
    case 'bang': {
      const hits = [341, 350, 359, 366], last = hits.filter((h) => f >= h - 3).pop() || 335, ph = q(clamp(1 - Math.abs(f - last) / 4), 1);
      put('jake', { expr: 'yell', L: 'bang', R: 'bang', bang: ph, headTilt: q(Math.sin(f * 0.7) * 4, 1) }, [-0.64, 0, -0.5], { tint: '#ffe9cc' });
      break;
    }
    case 'vent': put('jake', { expr: 'yell', sit: 'floor', L: 'hang', R: 'cup', facing: 1, look: 0.8 }, [1.55, 0, -2.85]); break;
    case 'windows': {
      const wi = f < 411 ? 0 : f < 424 ? 1 : 2, wx = [4.4, 7.6, 10.8][wi], k = f - [399, 411, 424][wi];
      const pop = E.back(ramp(k, 0, 5));
      put('jake', { expr: 'yell', L: 'pull', R: 'pull', bang: q(Math.abs(Math.sin(f * 0.8)), 1) }, [wx, -0.55 * (1 - pop), -0.7], { tint: '#ffe2c0', blob: false });
      put('mia', { expr: chew(2), sit: 'desk', L: 'hold', R: eat(5) ? 'eat' : 'hang', propL: 'chips', propR: eat(5) ? 'chip' : null, swing: q(Math.sin(f * 0.15), 1) }, [7.6, 0, -2.4], { tint: '#ffe2c0' });
      break;
    }
    case 'chips': {
      const pos = toward([7.6, 0, -6.7], cam, 0.36);
      const e = Math.floor((f - 446) / 20) % 2 === 1, sw = q(Math.sin(f * 0.12), 1);
      put('mia', { expr: e ? 'chew' : (f > 500 ? 'smug' : 'happy'), sit: 'desk', L: 'hold', R: e ? 'eat' : 'hang', propL: 'chips', propR: e ? 'chip' : null, swing: sw, look: f > 505 && f < 520 ? -0.7 : 0.1 }, pos);
      if (f >= 492 && f <= 522) { const k = ramp(f, 492, 522); put('jake', { expr: 'panic', step: q((f * 0.12) % 1, 2), L: 'up', R: 'up', facing: 1 }, [0.0, 0, lerp(-5.6, -9.8, k)]); }
      break;
    }
    case 'clock': break;
    case 'lightsout': put('jake', { expr: f < 586 ? 'neutral' : 'panic', L: 'hang', R: 'hang', look: q(Math.sin(f * 0.2) * 0.6, 1) }, [0.35, 0, -7.6], { tint: f < 586 ? '#ffffff' : TINT.dark }); break;
    case 'rattle': {
      const jit = q(Math.sin(f * 2.3) * 0.006, 3);
      put('jake', { expr: 'panic', sweat: true, L: 'belly', R: 'belly', look: f > 618 ? -0.8 : 0.4, headTilt: q(Math.sin(f * 1.7) * 2, 1) }, [0.15 + jit, 0, -6.0], { tint: '#9aa8d8' });
      break;
    }
    case 'scream': put('jake', { expr: 'scream', spiky: 1, sweat: true, L: 'up', R: 'up', headTilt: q(Math.sin(f * 1.9) * 3, 1) }, [0.15, 0, -6.2], { tint: '#fff2d6' }); break;
    case 'shook': {
      put('jake', { expr: 'scream', spiky: 1, L: 'up', R: 'up' }, [-0.9, 0, -9.6], { tint: '#c7cff0' });
      put('mia', { expr: f > 726 ? 'grin' : 'smile', L: 'flash', R: 'keysup', propL: 'flash', propR: 'keys', nokeys: true, jingle: q(Math.sin(f * 0.9) * 0.5, 1), look: -0.5 }, [0.35, 0, -14.0], { tint: '#ffe9c4' });
      break;
    }
    case 'morning': case 'him': {
      const him = S.id === 'him', lean = him ? smooth(ramp(f, 1004, 1022)) : 0.2;
      const jakeE = !him ? 'sleep' : f < 1000 ? 'shock' : f < 1030 ? 'wake' : 'shy';
      put('jake', { expr: jakeE, sit: 'floor', L: 'hang', R: 'hang', tilt: him ? q(-3 + lean * 2, 1) : 6, headTilt: him ? 0 : 10, look: him ? 0.6 : 0, blush: him && f > 1030 ? q(ramp(f, 1030, 1040), 1) : 0, blink: him ? blinkAt(f, 5) : 0 }, [-7.55, 0, -8.5]);
      put('mia', { expr: him ? (f < 1004 ? 'smile' : 'shy') : 'sleep', sit: 'floor', L: 'hang', R: 'hang', tilt: q(-6 - lean * 12, 1), headTilt: q(-4 - lean * 8, 1), blush: him ? q(ramp(f, 990, 1005), 1) : 0, look: him ? -0.6 : 0, blink: him ? blinkAt(f, 8) : 0 }, [-6.82, 0, -8.42]);
      break;
    }
    case 'found': put('gus', { expr: f < 784 ? 'neutral' : 'sus', R: 'mop', propR: 'mop', L: 'hang', look: -0.4 }, [-2.85, 0, -4.8]); break;
    case 'asked': {
      const wk = walk(f, 806, 0.9), k = smooth(ramp(f, 806, 834)), lean = smooth(ramp(f, 828, 848));
      put('gus', { expr: f < 830 ? 'sus' : 'neutral', R: 'mop', propR: 'mop', L: f > 846 ? 'point' : 'hang', step: k < 1 ? q(wk.phase, 2) : 0, tilt: q(-lean * 6, 1), facing: -1, look: -0.5 }, [lerp(-4.4, -5.75, k), 0, lerp(-6.2, -7.6, k)]);
      put('jake', { expr: 'sleep', sit: 'floor', tilt: 6, headTilt: 10 }, [-7.55, 0, -8.5]);
      put('mia', { expr: f < 837 ? 'sleep' : 'wake', sit: 'floor', tilt: -6, headTilt: f < 837 ? -6 : 2, look: f >= 837 ? 0.7 : 0, blink: f < 837 ? 0 : blinkAt(f, 8) }, [-6.82, 0, -8.42]);
      break;
    }
    case 'keysq': put('gus', { expr: 'sus', R: 'mop', propR: 'mop', L: 'point', facing: -1, look: -0.6, tilt: -5 }, [-6.0, 0, -7.25]); break;
    case 'keys': put('mia', { expr: 'wake', sit: 'floor', look: 0.6 }, [-6.82, 0, -8.42]); break;
    case 'principal': {
      const g = f >= 955 && f < 963 ? q(1 - Math.abs(f - 958) / 5, 1) : 0;
      put('mom', { expr: f < 960 ? 'stern' : 'smile', L: 'cross', R: 'cross', glint: g, look: -0.4 }, [-2.85, 0, -4.8]);
      break;
    }
  }
  return out;
};

// ---------- 2D effects ----------
const FX = (key, draw, pos, s, extra = {}) => ({ key, draw, x: pos[0], y: pos[1], z: pos[2], s, blob: false, shadow: false, order: 5, ...extra });
export const fxAt = (f, T) => {
  const S = shotAt(f), out = [];
  if (S.id === 'hook' || (S.id === 'out' && f < 128) || S.id === 'chips') { // crumbs from Mia's bag
    const pos = S.id === 'hook' ? [-0.12, 0.95, -1.85] : S.id === 'out' ? [0.5, 0.95, -1.45] : toward([7.6, 1.55, -6.7], camAt(f).pos, 0.4);
    const t = q(((f * 0.05) % 1), 2); out.push(FX('crumbs' + t, (p) => T.fxCrumbs(p, t), pos, 0.3, { tint: TINT[S.light] }));
  }
  if (S.id === 'bang') for (const h of [341, 350, 359, 366]) if (f >= h && f < h + 6) { const t = q((f - h) / 6, 2); out.push(FX('bang' + t, (p) => T.fxBang(p, t), [-0.64 + (h % 2 ? 0.22 : -0.22), 1.02, -0.17], 0.32)); }
  if (S.id === 'vent') { const t = q(((f - 371) / 14) % 1, 2); out.push(FX('shout' + t, (p) => { p.g.translate(300, 500); p.g.rotate(Math.PI / 2); p.g.translate(-300, -500); T.fxShout(p, t); }, [1.95, 0.25, -2.55], 0.45)); }
  if (S.id === 'windows') { const t = q(((f - 399) / 12) % 1, 2); out.push(FX('shoutW' + t, (p) => T.fxShout(p, t), [[4.4, 7.6, 10.8][f < 411 ? 0 : f < 424 ? 1 : 2], 0.95, -0.5], 0.55, { tint: '#ffe2c0' })); }
  if (S.id === 'rattle') { // keys glinting far down the dark hall + the beam
    const k = ramp(f, 601, 657), z = lerp(-24.2, -16.8, k);
    out.push(FX('beam', (p) => T.fxBeam(p, 0.55), [0.5, 0.0, z + 0.2], 1.6, { order: 7, alpha: 0.8 }));
    if (f >= 612) { const t = q(Math.sin(f * 0.9) * 0.6, 1); out.push(FX('jkeys' + t, (p) => T.keysCard(p, t, ''), [0.75, 0.75, z + 0.4], 0.45, { tint: '#fff3c8' })); }
  }
  if (S.id === 'scream') { const t = q(((f - 658) / 10) % 1, 2); out.push(FX('shoutS' + t, (p) => T.fxShout(p, t), [0.15, 0.95, -6.15], 0.85, { tint: '#ffffff' })); }
  if (S.id === 'shook' && f >= 724) out.push(FX('beamM', (p) => T.fxBeam(p, 0.4), [0.33, 1.05, -13.95], 0.32, { order: 7, alpha: 0.7 }));
  if (S.id === 'morning' || (S.id === 'asked' && f < 837)) { const t = q(((f - 739) / 50) % 1, 2); out.push(FX('z' + t, (p) => T.fxZ(p, t), [-7.6, 0.75, -8.4], 0.5, { tint: '#ffffff' })); }
  if (S.id === 'keys') { const d = f - 909, a = d < 0 ? 0 : 0.6 * Math.exp(-d * 0.09) * Math.sin(d * 0.55); const t = q(a, 2); out.push(FX('keyscu' + t, (p) => T.keysCard(p, t, ''), [-6.66, -0.08, -8.22], 0.42, { tint: TINT.morning, order: 6 })); }
  if (S.id === 'him' && f >= 1024) { const k = q(ramp(f, 1024, 1036), 2); out.push(FX('heart' + k, (p) => T.fxHeart(p, k), [-7.18, 0.98 + (f - 1024) * 0.003, -8.36], 0.3, { order: 6 })); }
  return out;
};

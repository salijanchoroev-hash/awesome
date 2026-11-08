// «Город на скотче» — timed to voice.mp3 (27.72 s, 831 frames @30). Word frames from work/words.json.
// 0 Этот город держится только на скотче | 86 Дома 107 машины 139 жители 175 картона | 206 Но однажды 238 скотч 254 закончился |
// 290 Сначала 313 ратуши 326 отклеилась 347 крыша | 367 Потом 384 раскрылись 408 коробки | 434 А 439 мост 456 сложился 480 открытка |
// 511 Мэр 521 обыскал 569 нашёл 581 последний 600 рулон | 622 Он 626 сиял 662 крышами | 691 Город 703 склеили 730 вечер |
// 756 Но 763 солнца 806 больше 818 нет (ends 830)
import { M, camFromKeys, idle, blinkAt, walk, q, clamp, lerp, ramp } from './motion.js';

export const FPS = 30, TOTAL = 831;
export const SHOTS = [
  { id: 'hook', a: 0, b: 85, light: 'day' },
  { id: 'citizens', a: 86, b: 205, light: 'day' },
  { id: 'empty', a: 206, b: 289, light: 'golden' },
  { id: 'roof', a: 290, b: 366, light: 'golden' },
  { id: 'boxes', a: 367, b: 433, light: 'golden' },
  { id: 'bridge', a: 434, b: 510, light: 'golden' },
  { id: 'mayor', a: 511, b: 621, light: 'late' },
  { id: 'sun', a: 622, b: 690, light: 'late' },
  { id: 'glue', a: 691, b: 755, light: 'dusk' },
  { id: 'night', a: 756, b: 830, light: 'night' },
];
export const shotAt = (f) => SHOTS.find((s) => f >= s.a && f <= s.b) || SHOTS[SHOTS.length - 1];

// ---------- lights ----------
export const LIGHTS = {
  day: { az: 150, el: 42, sky: '#d2e3f6', ground: '#a8895f', hemi: 1.25, sun: '#fff0d6', sunI: 2.35, fog: '#cfe3f3', fogNear: 120, fogFar: 1000,
    skyTop: '#4b8edb', skyHor: '#d3e6f5', sat: 1.08, vig: 0.2, shadowExt: 24, lamp: 0 },
  golden: { az: 180, el: 14, sky: '#b7a6d6', ground: '#8a6448', hemi: 1.1, sun: '#ffbe78', sunI: 2.7, fog: '#f4caa0', fogNear: 120, fogFar: 950,
    skyTop: '#6f86c8', skyHor: '#ffd29a', sat: 1.12, gain: '#fff3e2', vig: 0.24, shadowExt: 30, lamp: 0 },
  late: { az: 180, el: 9, sky: '#a58fc8', ground: '#7a5442', hemi: 1.0, sun: '#ffa860', sunI: 2.8, fog: '#f2b48a', fogNear: 120, fogFar: 900,
    skyTop: '#5f6cb4', skyHor: '#ffbe80', sat: 1.14, gain: '#fff0dc', vig: 0.26, shadowExt: 30, lamp: 0.1 },
  night: { az: 210, el: 38, sky: '#5868a8', ground: '#2a2a3c', hemi: 0.95, sun: '#aebfff', sunI: 0.9, fog: '#26315c', fogNear: 90, fogFar: 760,
    skyTop: '#0e1438', skyHor: '#32427c', sat: 1.0, gain: '#d4dcff', vig: 0.34, shadowExt: 26, lamp: 1.4 },
};
const hx = (c) => parseInt(c.slice(1), 16);
const mixHex = (a, b, t) => { const A = hx(a), B = hx(b); const ch = (s) => Math.round((A >> s & 255) * (1 - t) + (B >> s & 255) * t).toString(16).padStart(2, '0'); return `#${ch(16)}${ch(8)}${ch(0)}`; };
const mixLight = (A, B, t) => { const o = {}; for (const k of new Set([...Object.keys(A), ...Object.keys(B)])) { const a = A[k] ?? B[k], b = B[k] ?? A[k]; o[k] = typeof a === 'string' && a[0] === '#' ? mixHex(a, b, t) : typeof a === 'number' ? lerp(a, b, t) : (t < 0.5 ? a : b); } return o; };
export const lightFor = (S, f) => {
  if (S.light === 'dusk') return mixLight(LIGHTS.late, LIGHTS.night, M.smooth(ramp(f, 700, 752)));
  const L = { ...LIGHTS[S.light] };
  if (S.id === 'roof' || S.id === 'boxes') L.shadowExt = 60;
  return L;
};

// ---------- layout (main.js publishes window.CITY) ----------
const city = () => globalThis.CITY || { blds: [], HALL: [71.5, 0], RIVER: [-80, -64] };
const insertBox = () => city().blds.filter((b) => b.rot === 0 && b.x > 8 && b.z < 0 && b.top === 'closed').sort((a, b) => a.x - b.x)[0] || { x: 13, z: -13, w: 9, d: 10, h: 9.6 };
const HERO = [-10.5, 0.15, -6.3], ROLL = [-13.2, 0.15, -6.5], MAYOR = [-1.6, 0.012, 0.35], SUN = [-300, 62, 0];
const F = { pop: 382, glue: 703 };

// ---------- cameras ----------
const CAMS = {
  hook: () => { const b = insertBox(), cx = b.x - b.w / 2, top = b.h + 0.11; return [
    { f: 0, pos: [cx - 2.9, top + 1.45, b.z + 3.1], look: [cx + 0.5, top - 0.75, b.z - 0.2], fov: 38 },
    { f: 40, pos: [cx - 2.65, top + 1.35, b.z + 2.85], look: [cx + 0.5, top - 0.75, b.z - 0.2], fov: 37 },
    { f: 85, pos: [14, 14, 6], look: [-20, 2, -2], fov: 42, path: [[cx - 4.5, top + 3.5, b.z + 5.5]] },
  ]; },
  citizens: () => [
    { f: 86, pos: [14, 14, 6], look: [-20, 2, -2], fov: 42 },
    { f: 124, pos: [0.5, 3.6, -4.6], look: [-10.5, 1.5, -6.0], fov: 38, path: [[6, 7.5, -1.5]] },
    { f: 139, pos: [-8.05, 1.5, -3.55], look: [-10.5, 1.45, -6.3], fov: 34, ease: 'easeOut' },
    { f: 205, pos: [-8.35, 1.48, -3.65], look: [-10.5, 1.45, -6.3], fov: 33 },
  ],
  empty: () => [
    { f: 206, pos: [-10.3, 1.3, -2.8], look: [-12.6, 1.0, -6.4], fov: 40 },
    { f: 289, pos: [-10.55, 1.25, -3.25], look: [-12.7, 0.95, -6.4], fov: 38 },
  ],
  roof: () => [
    { f: 290, pos: [40, 26, -30], look: [70, 10.5, 0], fov: 40 },
    { f: 366, pos: [44, 24.5, -26.5], look: [70, 10.5, 0], fov: 38 },
  ],
  boxes: () => [
    { f: 367, pos: [-36, 30, -44], look: [8, 0, 6], fov: 46 },
    { f: 433, pos: [-30, 33, -40], look: [12, 0, 8], fov: 45 },
  ],
  bridge: () => [
    { f: 434, pos: [-73.5, 5.2, -32], look: [-72, 2.2, 0], fov: 46 },
    { f: 510, pos: [-73.2, 5.0, -29.5], look: [-72, 2.6, 0], fov: 45 },
  ],
  mayor: () => [
    { f: 511, pos: [3.6, 1.55, 1.25], look: [-1.6, 1.45, 0.35], fov: 36 },
    { f: 578, pos: [3.3, 1.55, 1.1], look: [-1.6, 1.5, 0.35], fov: 35 },
    { f: 621, pos: [3.6, 6.2, 0.8], look: [SUN[0], SUN[1], SUN[2]], fov: 30 },
  ],
  sun: () => [
    { f: 622, pos: [3.6, 6.2, 0.8], look: [SUN[0], SUN[1], SUN[2]], fov: 30 },
    { f: 646, pos: [3.6, 6.2, 0.8], look: [SUN[0], SUN[1] - 1, SUN[2]], fov: 14.5, ease: 'easeOut' },
    { f: 690, pos: [3.4, 6.3, 0.6], look: [SUN[0], SUN[1] - 2, SUN[2] + 1], fov: 13.5 },
  ],
  glue: () => [
    { f: 691, pos: [36, 24, -16], look: [-80, 6, 2], fov: 46 },
    { f: 755, pos: [31, 22.5, -13.5], look: [-80, 4, 2], fov: 44 },
  ],
  night: () => [
    { f: 756, pos: [2.6, 1.5, 0.15], look: [-3.4, 1.35, 0], fov: 38 },
    { f: 788, pos: [2.3, 1.5, 0.15], look: [-3.4, 1.4, 0], fov: 37 },
    { f: 818, pos: [2.4, 6.4, 0.15], look: [SUN[0], SUN[1] + 13, SUN[2]], fov: 17, roll: -4, ease: 'smooth' },
    { f: 830, pos: [2.4, 6.45, 0.15], look: [SUN[0], SUN[1] + 13.5, SUN[2]], fov: 16, roll: -4.5 },
  ],
};
const KICKS = [{ f: 254, a: 0.02 }, { f: 284, a: 0.025 }, { f: 347, a: 0.05 }, { f: 386, a: 0.03 }, { f: 456, a: 0.04 }, { f: 479, a: 0.03 }, { f: 569, a: 0.025 }, { f: 756, a: 0.03 }];
export const camAt = (f) => {
  const S = shotAt(f), c = camFromKeys(CAMS[S.id](), f, { kicks: KICKS.filter((k) => k.f >= S.a && k.f <= S.b) });
  c.shadowAt = { hook: f < 50 ? null : [0, 0, -4], citizens: f < 125 ? [-2, 0, -2] : HERO, empty: ROLL, roof: [68, 6, 0], boxes: [0, 0, 4], bridge: [-72, 0, 0], mayor: f < 590 ? MAYOR : [-20, 0, 0], sun: [-20, 0, 0], glue: [-10, 0, 0], night: [-3, 0, 0] }[S.id] || null;
  if (!c.shadowAt) delete c.shadowAt;
  // sting flash on the twist line
  c.flash = f >= 756 && f < 760 ? 0.3 * (1 - (f - 756) / 4) : f >= 626 && f < 632 ? 0.18 * (1 - (f - 626) / 6) : 0;
  return c;
};

// ---------- lens ----------
const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
export const dofAt = (f) => {
  const S = shotAt(f), C = camAt(f);
  switch (S.id) {
    case 'hook': { const b = insertBox(); return { focus: dist(C.pos, [b.x - b.w / 2 + 0.3, b.h, b.z]), cinf: lerp(12, 0, M.smooth(ramp(f, 40, 62))) }; }
    case 'citizens': return { focus: dist(C.pos, [HERO[0], 1.6, HERO[2]]), cinf: lerp(0, 10, M.smooth(ramp(f, 122, 140))) };
    case 'empty': return { focus: dist(C.pos, [ROLL[0], 0.9, ROLL[2]]), cinf: 10 };
    case 'mayor': return { focus: dist(C.pos, [MAYOR[0], 1.5, MAYOR[2]]), cinf: lerp(8, 0, M.smooth(ramp(f, 580, 600))) };
    case 'night': return { focus: dist(C.pos, [-3.4, 1.4, 0]), cinf: lerp(7, 0, M.smooth(ramp(f, 788, 800))) };
  }
  return { focus: 10, cinf: 0 };
};

// ---------- world state ----------
export const worldAt = (f) => {
  const S = shotAt(f), W = {};
  // wave of popping lids and the glue wave that closes them again
  W.pop = { f0: F.pop, o: [0, 0], perM: 0.55, dur: 9 };
  if (f >= 691) W.glue = { f0: F.glue, o: [-75, 0], perM: 0.24, dur: 10 };
  if (f < 367) W.pop = null;
  // town hall: tape peels (326), lid springs (347), closes again in the glue shot
  W.hall = { peel: f < 326 ? 0 : (f - 326) / 10, lid: f < 347 ? 0 : clamp((f - 347) / 14), close: f < 728 ? 0 : clamp((f - 728) / 12) };
  // bridge folds like a card (456) and unfolds while the city is glued
  W.bridgeFold = f < 454 ? 0 : f < 700 ? Math.min(1.04, M.back(ramp(f, 454, 472), 1.4)) : 1 - M.smooth(ramp(f, 702, 724));
  // traffic: a car slides past during the crane down; streets empty once things fall apart
  if (f >= 206) W.carsAway = true;
  // giant tape roll (shot 3)
  if (S.id === 'empty') {
    const k = ramp(f, 206, 250), R = f < 250 ? lerp(0.98, 0.66, M.smooth(k)) : 0.64;
    const spin = -(f - 206) * (f < 250 ? 0.42 : 0.42 * Math.exp(-(f - 250) / 6));
    const fall = ramp(f, 266, 280), wob = f >= 256 && f < 280 ? 0.12 * Math.sin((f - 256) * 0.9) * (1 - fall) : 0;
    const settle = f >= 280 ? 0.06 * Math.exp(-(f - 280) / 3) * Math.sin((f - 280) * 1.6) : 0;
    W.roll = { pos: ROLL, R, spin, tiltX: -(Math.PI / 2) * M.easeIn(fall) + wob + settle, tiltY: f >= 256 ? 0.3 * Math.sin((f - 256) * 0.35) * (1 - fall) : 0,
      endLift: f >= 252 ? 0.45 * Math.exp(-(f - 252) / 7) * Math.abs(Math.cos((f - 252) * 0.5)) : 0 };
  }
  // the sun: tape roll on a string; lowered while the city is glued; gone at night
  const drop = f < 698 ? 0 : 118 * M.smooth(ramp(f, 698, 746));
  const swing = f >= 756 ? 9 * Math.cos((f - 756) * 0.11) * Math.exp(-(f - 756) / 30) : 0;
  W.sun = { pos: SUN, drop: f >= 756 ? 0 : drop, visible: f < 750, swing: 0, swingZ: swing, tilt: 0 };
  return W;
};

// ---------- actors (die-cut standees) ----------
const SK = ['#ffe2c2', '#f5c9a0', '#ecd0b6', '#c99067'];
const PEOPLE = {
  hero: { jacket: '#3f6fb5', pants: '#3b3f52', boots: '#4a3426', skin: SK[0], hat: 'hair', hair: '#5a3b2a' },
  mayor: { jacket: '#2e3a5c', pants: '#2b2f44', boots: '#241726', skin: SK[1], hat: 'tophat', moustache: '#4a3020', build: 'stout', sash: '#d9463b', buttons: '#e8c45a' },
  a: { jacket: '#d9563f', pants: '#3b3f52', boots: '#3a2a20', skin: SK[1], hat: 'cap', cap: '#f2b33d' },
  b: { jacket: '#7cc36a', pants: '#4a4f66', boots: '#5a3b2a', skin: SK[3], hat: 'hair', hair: '#1e1714' },
  c: { jacket: '#c9aceb', pants: '#3b3f52', boots: '#4a3426', skin: SK[2], hat: 'bonnet', dress: '#e86a8a' },
  kid: { jacket: '#f08a2c', pants: '#3b5b9a', boots: '#f4f1ea', hat: 'cap', cap: '#e2453c', build: 'kid', skin: SK[1] },
  d: { jacket: '#2f5f6a', pants: '#3d4440', boots: '#2a201a', skin: SK[0], hat: 'tophat', moustache: '#4a3020' },
};
const B = (T, who, opts, pos, extra = {}) => ({ key: who + JSON.stringify(opts), draw: (p) => T.bodyFront(p, PEOPLE[who], opts), x: pos[0], y: pos[1], z: pos[2], ...extra });
const WALKERS = [
  { who: 'a', z: 6.6, x0: -40, v: 1.1, seed: 11 }, { who: 'c', z: 6.2, x0: -6, v: -0.9, seed: 12 }, { who: 'b', z: -6.4, x0: -30, v: 1.0, seed: 13 },
  { who: 'd', z: -6.0, x0: 20, v: -0.8, seed: 14 }, { who: 'kid', z: -6.6, x0: 28, v: 1.3, seed: 15 }, { who: 'a', z: 6.4, x0: 24, v: -1.0, seed: 16 },
  { who: 'b', z: -5.8, x0: 34, v: 0.9, seed: 17 },
];
const tintOf = (S, f) => S.light === 'night' ? '#a9b8ee' : S.light === 'dusk' ? mixHex('#ffd9b8', '#a9b8ee', M.smooth(ramp(f, 700, 752))) : S.light === 'day' ? '#ffffff' : S.light === 'late' ? '#ffd6b4' : '#ffe2c6';
export const actorsAt = (f, T) => {
  const S = shotAt(f), out = [], tint = tintOf(S, f), id = (s) => idle(f, s);
  const hero = (o, pos = HERO, extra = {}) => { const i = id(3); out.push(B(T, 'hero', { mode: 'stand', blink: blinkAt(f, 3), seed: 3, headTilt: q(i.headTilt, 1), tilt: q(i.tilt, 1), ...o }, [pos[0], pos[1] + i.bob, pos[2]], { tint, ...extra })); };
  if (S.id === 'citizens' || S.id === 'hook') {
    for (const wk of WALKERS) {
      const d = walk(f, 0, Math.abs(wk.v), 0.75), span = 104;
      let x = wk.x0 + Math.sign(wk.v) * d.dist; x = ((x + 60) % span + span) % span - 60;
      if (Math.abs(x) < 9 || (Math.abs(x - HERO[0]) < 2.2 && wk.z < 0)) continue;
      out.push(B(T, wk.who, { mode: 'stroll', phase: q(d.phase, 2), facing: wk.v > 0 ? 1 : -1, expr: 'smile', blink: blinkAt(f, wk.seed), seed: wk.seed, look: wk.v > 0 ? 0.3 : -0.3 }, [x, 0.15, wk.z], { tint }));
    }
  }
  switch (S.id) {
    case 'citizens': {
      // «даже жители — всё из картона»: the hero spins round and shows the bare card back
      const sp = M.smooth(ramp(f, 158, 186)) * Math.PI * 2, back = Math.cos(sp) < 0;
      const ex = f < 139 ? 'smile' : f < 158 ? 'grin' : f < 190 ? 'whistle' : 'grin';
      hero({ expr: ex, look: f > 139 && f < 158 ? 0.2 : 0 }, HERO, { yaw: sp, cut: back ? 'back' : true });
      break;
    }
    case 'empty': {
      const ex = f < 238 ? 'smile' : f < 254 ? 'nervous' : 'shock';
      hero({ expr: ex, look: f < 254 ? -0.5 : -0.2, headTilt: f >= 254 && f < 262 ? q(4 * Math.sin((f - 254) * 1.4), 1) : 0 }, [-11.9, 0.15, -6.0]);
      break;
    }
    case 'roof': {
      const sh = f >= 349;
      out.push(B(T, 'mayor', { mode: 'stand', expr: sh ? 'shock' : 'smile', blink: sh ? 0 : blinkAt(f, 41), seed: 41, look: 0.3, headTilt: sh ? q(3 * Math.sin(f * 0.9), 1) : 0, wave: sh ? undefined : q(Math.sin(f * 0.4), 1) }, [57.5, 0.15, -4.2], { tint, s: 1.08 }));
      out.push(B(T, 'kid', { mode: 'stand', expr: sh ? 'shock' : 'grin', prop: 'icecream', blink: sh ? 0 : blinkAt(f, 42), seed: 42, look: 0.4 }, [56.2, 0.15, -2.6], { tint }));
      out.push(B(T, 'c', { mode: 'stand', expr: sh ? 'shock' : 'smile', blink: sh ? 0 : blinkAt(f, 43), seed: 43, look: 0.2 }, [55.5, 0.15, -6.0], { tint }));
      break;
    }
    case 'bridge': {
      // a pedestrian on the bridge is catapulted into the river when it folds
      const k = ramp(f, 457, 478);
      let p = [-75.2 + (f - 434) * 0.02, 0.2, -1.6], roll = 0, ex = 'whistle';
      if (f >= 457) { p = [lerp(-74.7, -71.2, k), 0.4 + 18 * k * (1 - k) - 2.6 * k * k, lerp(-1.6, -9.5, k)]; roll = -k * 9; ex = 'shock'; }
      if (f < 480) out.push(B(T, 'a', { mode: f < 457 ? 'stroll' : 'stand', phase: q(((f - 434) / 18) % 1, 2), facing: 1, expr: ex, blink: f >= 457 ? 0 : blinkAt(f, 51), seed: 51 }, p, { tint, roll, blob: f < 457 }));
      break;
    }
    case 'mayor': {
      const found = f >= 569, look = found ? 0 : q(0.7 * Math.sin((f - 511) * 0.16), 2);
      const hop = !found && (f - 511) % 22 < 6 ? 0.08 * Math.sin(((f - 511) % 22) / 6 * Math.PI) : 0;
      out.push(B(T, 'mayor', { mode: 'stand', expr: found ? (f < 580 ? 'shock' : 'grin') : 'nervous', look, blink: found ? 0 : blinkAt(f, 41), seed: 41,
        headTilt: found ? 0 : q(5 * Math.sin((f - 511) * 0.32), 1), wave: f >= 572 ? q(0.15 * Math.sin(f * 0.6), 2) : undefined }, [MAYOR[0], MAYOR[1] + hop, MAYOR[2]], { tint, s: 1.05, ground: MAYOR[1] }));
      break;
    }
    case 'night': {
      const sway = (s) => q(id(s).headTilt, 1);
      hero({ expr: f < 806 ? 'nervous' : 'pained', look: q(0.5 * Math.sin(f * 0.07 + 1), 2), headTilt: sway(3) }, [-3.5, 0.012, -0.95]);
      out.push(B(T, 'mayor', { mode: 'stand', expr: 'nervous', look: q(0.5 * Math.sin(f * 0.06), 2), blink: blinkAt(f, 41), seed: 41, headTilt: sway(41) }, [-3.2, 0.012, 0.95], { tint, s: 1.05 }));
      out.push(B(T, 'kid', { mode: 'stand', expr: f < 790 ? 'dazed' : 'pained', look: q(0.4 * Math.sin(f * 0.09 + 2), 2), blink: blinkAt(f, 42), seed: 42 }, [-4.0, 0.012, 0.05], { tint }));
      break;
    }
  }
  return out;
};

// ---------- 2D effects ----------
const FX = (key, draw, pos, s, extra = {}) => ({ key, draw, x: pos[0], y: pos[1], z: pos[2], s, blob: false, shadow: false, order: 5, cut: false, ...extra });
export const fxAt = (f, T) => {
  const S = shotAt(f), out = [];
  if (S.id === 'empty' && f >= 252 && f < 268) { const t = q((f - 252) / 16); out.push(FX('puffA' + t, (p) => { p.g.translate(150, 700); T.fxPuff(p, t); }, [ROLL[0] + 0.2, ROLL[1], ROLL[2] + 0.4], 0.45)); }
  if (S.id === 'empty' && f >= 280) { const t = q((f - 280) / 10); if (t <= 1) out.push(FX('dustR' + t, (p) => T.fxDust(p, t), [ROLL[0], ROLL[1], ROLL[2] + 0.3], 0.5)); }
  if (S.id === 'roof' && f >= 349) {
    const k = q(ramp(f, 349, 366), 2);
    [[0, 6], [0, -6], [3, 0]].forEach(([dx, dz], i) => { const kk = q(clamp(k * 1.3 - i * 0.15), 2); if (kk > 0) out.push(FX('dustH' + i + kk, (p) => T.fxDust(p, kk, '#f6dcbc'), [71.5 + dx, 10.2, dz], 4.5, { tint: '#ffe3c4' })); });
  }
  if (S.id === 'bridge' && f >= 478) { const t = q(ramp(f, 478, 500), 2); out.push(FX('splash' + t, (p) => { p.g.translate(0, 130); p.g.scale(0.75, 0.75); T.fxSplash(p, t); }, [-71.2, -2.05, -9.5], 2.4)); }
  if (S.id === 'sun' && f < 646) { const t = q(ramp(f, 622, 646), 2); out.push(FX('burst' + t, (p) => T.fxBurst(p, t, '#fff1a8', 14, 60, 290), [SUN[0] + 8, SUN[1], SUN[2]], 32, { order: 6 })); }
  return out;
};

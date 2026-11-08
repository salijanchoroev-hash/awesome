// «5 невероятных фактов» — timed to voice.mp3 (70.77 s, 2123 frames @30). Word frames from work/words.json.
import { M, camFromKeys, idle, blinkAt, walk, q, clamp, lerp, ramp } from './motion.js';

export const FPS = 30, TOTAL = 2123;
export const SHOTS = [
  { id: 'intro', a: 0, b: 195, light: 'room' },
  { id: 'octo', a: 196, b: 424, light: 'sea' },
  { id: 'octoHero', a: 425, b: 510, light: 'sea' },
  { id: 'hill', a: 511, b: 620, light: 'golden' },
  { id: 'space', a: 621, b: 770, light: 'space' },
  { id: 'hill2', a: 771, b: 855, light: 'golden' },
  { id: 'shark', a: 856, b: 1102, light: 'sea' },
  { id: 'lab', a: 1103, b: 1380, light: 'lab' },
  { id: 'planets', a: 1381, b: 1508, light: 'space' },
  { id: 'rain', a: 1509, b: 1666, light: 'neptune' },
  { id: 'giraffe', a: 1667, b: 1942, light: 'savanna' },
  { id: 'finale', a: 1943, b: 2122, light: 'room' },
];
export const shotAt = (f) => SHOTS.find((s) => f >= s.a && f <= s.b) || SHOTS[SHOTS.length - 1];
const X = { room: 0, ocean: 300, hill: 600, space: 900, lab: 1200, planet: 1500, savanna: 1800 };

// ---------- lights ----------
export const LIGHTS = {
  room: { az: 60, el: 35, sky: '#fff1e0', ground: '#a07a5a', hemi: 1.35, sun: '#fff0d0', sunI: 1.6, fog: '#e8dcf0', fogNear: 60, fogFar: 300, skyTop: '#8fb8e8', skyHor: '#e8dcf0', sat: 1.08, vig: 0.22, shadowExt: 10, lamp: 0.5 },
  sea: { az: 100, el: 70, sky: '#a8e4ff', ground: '#c8b07a', hemi: 1.3, sun: '#d8f4ff', sunI: 1.6, fog: '#3a8fc8', fogNear: 10, fogFar: 70, skyTop: '#2f78b8', skyHor: '#5fb0e0', sat: 1.1, gain: '#eef8ff', vig: 0.26, shadowExt: 16, lamp: 0 },
  golden: { az: 257, el: 22, sky: '#b7a6d6', ground: '#8a6448', hemi: 1.15, sun: '#ffbe78', sunI: 2.6, fog: '#f4caa0', fogNear: 60, fogFar: 400, skyTop: '#6f86c8', skyHor: '#ffd29a', sat: 1.12, gain: '#fff3e2', vig: 0.24, shadowExt: 14, lamp: 0 },
  space: { az: 261, el: 37, sky: '#8090d0', ground: '#202040', hemi: 0.7, sun: '#fff0c0', sunI: 2.3, fog: '#05081a', fogNear: 300, fogFar: 1200, skyTop: '#03061a', skyHor: '#0a1030', sat: 1.12, vig: 0.3, shadowExt: 30, lamp: 0 },
  lab: { az: 60, el: 50, sky: '#ffffff', ground: '#b0b8c0', hemi: 1.35, sun: '#ffffff', sunI: 1.5, fog: '#e8f4f0', fogNear: 60, fogFar: 300, skyTop: '#8fb8e8', skyHor: '#e8f4f0', sat: 1.08, vig: 0.2, shadowExt: 10, lamp: 0 },
  neptune: { az: 120, el: 35, sky: '#9ec0ff', ground: '#3a3f80', hemi: 1.15, sun: '#e0ecff', sunI: 1.8, fog: '#4a7ad0', fogNear: 60, fogFar: 300, skyTop: '#13286e', skyHor: '#5f9de0', sat: 1.12, vig: 0.26, shadowExt: 14, lamp: 0 },
  savanna: { az: 286, el: 25, sky: '#ffe8c8', ground: '#a08a50', hemi: 1.25, sun: '#ffe2b0', sunI: 2.5, fog: '#f2dcb0', fogNear: 80, fogFar: 400, skyTop: '#5fa0e0', skyHor: '#f6e2b8', sat: 1.1, vig: 0.22, shadowExt: 14, lamp: 0 },
};
export const lightFor = (S, f) => ({ ...LIGHTS[S.light] });

// ---------- cameras ----------
const R = X.room, O = X.ocean, H = X.hill, S_ = X.space, L = X.lab, P = X.planet, G = X.savanna;
const CAMS = {
  intro: [
    { f: 0, pos: [R + 0.2, 1.85, 2.0], look: [R + 0.2, 1.8, -1.0], fov: 34 },
    { f: 70, pos: [R + 0.25, 1.9, 2.4], look: [R + 0.2, 1.95, -1.0], fov: 35 },
    { f: 160, pos: [R + 0.3, 2.3, 5.6], look: [R + 0.2, 2.4, -1.0], fov: 42 },
    { f: 195, pos: [R + 0.3, 2.35, 5.9], look: [R + 0.2, 2.45, -1.0], fov: 42 },
  ],
  octo: [
    { f: 196, pos: [O, 4.2, 15], look: [O, 4.0, -2], fov: 44 },
    { f: 238, pos: [O, 3.6, 12], look: [O, 3.2, -2], fov: 42 },
    { f: 300, pos: [O, 2.5, 7.0], look: [O, 2.3, -3], fov: 40 },
    { f: 424, pos: [O, 2.5, 5.2], look: [O, 2.3, -3], fov: 38 },
  ],
  octoHero: [
    { f: 425, pos: [O + 0.2, 1.9, 6.4], look: [O + 0.2, 1.7, -2.8], fov: 40 },
    { f: 510, pos: [O + 0.2, 1.85, 5.6], look: [O + 0.2, 1.7, -2.8], fov: 39 },
  ],
  hill: [
    { f: 511, pos: [H + 1.5, 3.0, 9], look: [H - 1.5, 5.0, -10], fov: 44 },
    { f: 554, pos: [H + 1.5, 2.6, 7], look: [H - 1.0, 3.8, -10], fov: 42 },
    { f: 620, pos: [H + 1.2, 2.3, 4.6], look: [H - 0.4, 2.4, -2], fov: 38 },
  ],
  space: [
    { f: 621, pos: [S_ + 1, 8, 30], look: [S_, 8, -22], fov: 48 },
    { f: 690, pos: [S_ + 1, 7, 26], look: [S_, 7, -22], fov: 46 },
    { f: 700, pos: [S_ + 6, -2, -6], look: [S_ - 4, 18, -26], fov: 44, ease: 'smooth' },
    { f: 770, pos: [S_ + 5.5, -2.5, -7.5], look: [S_ - 4, 19, -26], fov: 40 },
  ],
  hill2: [
    { f: 771, pos: [H + 1.0, 2.1, 4.2], look: [H - 0.5, 2.2, -2], fov: 38 },
    { f: 815, pos: [H + 1.2, 2.4, 6.5], look: [H - 3.0, 7.0, -14], fov: 40, ease: 'smooth' },
    { f: 855, pos: [H + 1.0, 2.5, 6.0], look: [H - 4.0, 9.0, -20], fov: 34 },
  ],
  shark: [
    { f: 856, pos: [O + 2, 4.0, 14], look: [O + 1, 3.8, -2], fov: 44 },
    { f: 897, pos: [O + 3, 2.6, 9.5], look: [O + 1, 2.6, -3], fov: 44 },
    { f: 985, pos: [O + 3.5, 2.4, 9.0], look: [O + 1, 3.0, -3], fov: 44 },
    { f: 1102, pos: [O + 2.5, 3.0, 10.5], look: [O + 0.5, 4.0, -3], fov: 46 },
  ],
  lab: [
    { f: 1103, pos: [L + 0.3, 2.6, 9], look: [L, 2.6, -2], fov: 44 },
    { f: 1148, pos: [L + 0.3, 1.8, 7.0], look: [L + 0.3, 1.6, -1], fov: 40 },
    { f: 1300, pos: [L + 0.3, 1.6, 5.8], look: [L + 0.2, 1.5, -1], fov: 38 },
    { f: 1380, pos: [L + 0.2, 1.6, 5.4], look: [L + 0.2, 1.5, -1], fov: 37 },
  ],
  planets: [
    { f: 1381, pos: [S_ + 80, 6, 30], look: [S_ + 79, 6, -26], fov: 48 },
    { f: 1424, pos: [S_ + 80, 6, 26], look: [S_ + 79, 6, -26], fov: 46 },
    { f: 1508, pos: [S_ + 77, 13, -9], look: [S_ + 76, 15, -30], fov: 44, ease: 'easeIn' },
  ],
  rain: [
    { f: 1509, pos: [P + 0.5, 6, 12], look: [P, 3, -4], fov: 44 },
    { f: 1560, pos: [P + 0.5, 2.0, 7.0], look: [P, 2.8, -4], fov: 44, ease: 'smooth' },
    { f: 1666, pos: [P + 0.4, 1.8, 6.0], look: [P, 2.6, -4], fov: 42 },
  ],
  giraffe: [
    { f: 1667, pos: [G + 0.2, 3.2, 12], look: [G + 0.2, 3.4, -2.5], fov: 44 },
    { f: 1705, pos: [G + 0.2, 2.8, 9.0], look: [G + 0.2, 3.2, -2.5], fov: 44 },
    { f: 1942, pos: [G + 0.2, 2.7, 8.2], look: [G + 0.2, 3.1, -2.5], fov: 43 },
  ],
  finale: [
    { f: 1943, pos: [R + 0.2, 1.75, 2.1], look: [R + 0.2, 1.72, -0.6], fov: 32 },
    { f: 2062, pos: [R + 0.2, 1.75, 1.8], look: [R + 0.2, 1.72, -0.6], fov: 31 },
    { f: 2122, pos: [R - 1.3, 1.7, 0.4], look: [R - 3.0, 1.5, -4.5], fov: 46, path: [[R - 0.6, 1.75, 1.2]] },
  ],
};
const KICKS = [{ f: 230, a: 0.02 }, { f: 545, a: 0.02 }, { f: 890, a: 0.02 }, { f: 1137, a: 0.02 }, { f: 1236, a: 0.04 }, { f: 1289, a: 0.04 }, { f: 1416, a: 0.02 }, { f: 1699, a: 0.02 }, { f: 1868, a: 0.03 }];
export const camAt = (f) => {
  const S = shotAt(f), c = camFromKeys(CAMS[S.id], f, { kicks: KICKS.filter((k) => k.f >= S.a && k.f <= S.b) });
  c.shadowAt = { intro: [R, 1, -1], octo: [O, 0, -3], octoHero: [O, 0, -3], hill: [H, 1, -1], space: [S_, 5, -20], hill2: [H, 1, -1], shark: [O, 0, -3], lab: [L, 0, -1], planets: [S_ + 80, 5, -25], rain: [P, 0, -3], giraffe: [G, 0, -2], finale: [R - 1, 1, -2] }[S.id];
  c.flash = 0; for (const s of SHOTS) if (f >= s.a && f < s.a + 4 && s.a > 0) c.flash = 0.35 * (1 - (f - s.a) / 4);
  return c;
};
const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
export const dofAt = (f) => {
  const S = shotAt(f), C = camAt(f), at = (p, c) => ({ focus: dist(C.pos, p), cinf: c });
  switch (S.id) {
    case 'intro': return at([R + 0.2, 1.9, -1.0], lerp(10, 4, M.smooth(ramp(f, 80, 160))));
    case 'octoHero': return at([O + 0.2, 1.7, -2.6], 6);
    case 'hill': case 'hill2': return at([H - 0.4, 2.0, -0.3], 6);
    case 'lab': return at([L + 0.2, 1.5, -0.6], 6);
    case 'finale': return at([R + 0.2, 1.7, -0.6], f < 2066 ? 10 : lerp(10, 0, ramp(f, 2066, 2100)));
  }
  return { focus: 10, cinf: 0 };
};

// ---------- world ----------
export const worldAt = (f) => {
  const W = {};
  W.door = f < 2068 ? 0 : M.back(ramp(f, 2068, 2090), 1.4);
  W.beam = f < 625 ? 0 : clamp(M.smooth(ramp(f, 625, 676)));
  if (f >= 1530 && f < 1700) W.diamonds = { f0: 1535, spread: 120 };
  return W;
};

// ---------- actors ----------
const SK = ['#ffe2c2', '#f5c9a0'];
const HERO = { jacket: '#3f6fb5', pants: '#3b3f52', boots: '#4a3426', skin: SK[0], hat: 'hair', hair: '#5a3b2a' };
const hero = (T, f, o, pos, extra = {}) => { const i = idle(f, 3); const opts = { mode: 'stand', blink: blinkAt(f, 3), seed: 3, headTilt: q(i.headTilt, 1), tilt: q(i.tilt, 1), ...o };
  return { key: 'hero' + JSON.stringify(opts), draw: (p) => T.bodyFront(p, HERO, opts), x: pos[0], y: pos[1] + (opts.mode === 'sit' ? 0 : i.bob), z: pos[2], ground: pos[1], ...extra }; };
const C_ = (key, draw, pos, s = 1, extra = {}) => ({ key, draw, x: pos[0], y: pos[1], z: pos[2], s, ...extra });
const FX = (key, draw, pos, s, extra = {}) => ({ key, draw, x: pos[0], y: pos[1], z: pos[2], s, blob: false, shadow: false, order: 5, cut: false, ...extra });
const pop = (f, f0, d = 8) => f < f0 ? 0 : M.back(ramp(f, f0, f0 + d), 2.0);
/** hanging fact sign that drops in on a spring */
const signAt = (T, f, f0, f1, lines, pos, s = 1.5, col) => {
  if (f < f0 || f > f1) return null; const k = (f - f0) / 30, y = pos[1] + 6 * Math.exp(-k * 5) * Math.cos(k * 14) * (k < 0.08 ? 1 : 1);
  const drop = f < f0 + 4 ? 8 * (1 - (f - f0) / 4) : 0, out = f > f1 - 8 ? (f - (f1 - 8)) * 1.4 : 0;
  return FX('sign' + lines.join() + (col || ''), (p) => T.sign(p, { lines, ...(col ? { col } : {}) }), [pos[0], y + drop + out, pos[2]], s, { roll: q(0.08 * Math.sin(k * 6) * Math.exp(-k), 3), order: 6, cut: true, shadow: true });
};
export const actorsAt = (f, T) => {
  const S = shotAt(f), out = [], t = f / 30, push = (a) => a && out.push(a);
  switch (S.id) {
    case 'intro': {
      const ex = f < 136 ? 'grin' : f < 150 ? 'nervous' : 'shock';
      push(hero(T, f, { mode: 'sit', expr: ex, look: f > 100 ? q(0.4 * Math.sin(f * 0.12), 2) : 0, blink: f > 136 ? 0 : blinkAt(f, 3) }, [R + 0.2, 0.92, -1.05], { blob: false }));
      break;
    }
    case 'octo': case 'octoHero': case 'shark': {
      const octoOn = S.id !== 'shark';
      if (octoOn) {
        const x = f < 240 ? O + 14 : lerp(O + 14, S.id === 'octoHero' ? O - 1.0 : O, M.smooth(ramp(f, 240, 275)));
        const kind = f < 303 ? 'smile' : f < 425 ? 'grin' : 'laugh';
        push(C_('octo' + q(t * 2, 0) + kind + blinkAt(f, 7), (p) => T.octopus(p, { t: q(t * 2, 0) / 2, kind, blink: blinkAt(f, 7), look: S.id === 'octoHero' ? 0.4 : 0 }), [x, 0.5 + 0.25 * Math.sin(t * 2), -3], 1.5, { blob: false, ground: 0 }));
      }
      if (S.id === 'octoHero') push(hero(T, f, { expr: f < 470 ? 'grin' : 'laugh', look: -0.4 }, [O + 1.0, 0, -2.6]));
      if (S.id === 'shark') {
        const ex = f < 905 ? 'smile' : f < 1040 ? 'shock' : 'grin';
        push(hero(T, f, { expr: ex, look: f < 985 ? q(clamp((f - 900) / 50) * 1.2 - 0.6, 1) : -0.3, blink: f > 905 && f < 1040 ? 0 : blinkAt(f, 3) }, [O + 3.0, 0, -1.2]));
        const sx = f < 898 ? O - 20 : f < 985 ? lerp(O - 12, O + 14, ramp(f, 898, 975)) : lerp(O + 14, O + 0.5, M.smooth(ramp(f, 985, 1015)));
        const flip = f >= 985;
        push(C_('shark' + q(t * 3, 0) + blinkAt(f, 9), (p) => T.shark(p, { t: q(t * 3, 0) / 3, blink: blinkAt(f, 9) }), [sx, 2.6 + 0.2 * Math.sin(t * 2), -4.2], 1.5, { sx: 2.4, flip, blob: false, ground: 0 }));
      }
      break;
    }
    case 'hill': case 'hill2': {
      const ex = S.id === 'hill' ? 'smile' : f < 790 ? 'shock' : 'nervous';
      push(hero(T, f, { expr: ex, look: S.id === 'hill' ? 0.6 : -0.3, blink: S.id === 'hill2' && f < 790 ? 0 : blinkAt(f, 3) }, [H - 0.45, 1.02, -0.2]));
      break;
    }
    case 'lab': {
      const bx = f < 1150 ? L + 5 : lerp(L + 5, L + 0.7, M.smooth(ramp(f, 1150, 1175))), wk = f < 1178 ? Math.abs(Math.sin(t * 9)) * 0.08 : 0;
      const bk = f < 1234 ? 'smile' : f < 1305 ? 'grin' : 'laugh', arm = f >= 1178 && f < 1234 ? 'up' : f >= 1262 && f < 1300 ? 'point' : 'hang';
      const lb = f >= 1305 ? Math.abs(Math.sin(t * 10)) * 0.05 : 0;
      push(C_('banana' + bk + arm + blinkAt(f, 11) + q(t, 1), (p) => T.banana(p, { kind: bk, arm, blink: blinkAt(f, 11), t: q(t, 1), look: f > 1262 ? -0.6 : 0 }), [bx, wk + lb, -0.8], 1.0, { roll: f >= 1305 ? q(0.05 * Math.sin(t * 10), 2) : 0, ground: 0 }));
      if (f >= 1254) { const k = pop(f, 1254, 10), sk = f < 1287 ? 'smile' : f < 1300 ? 'wow' : 'frown';
        push(C_('straw' + sk + blinkAt(f, 12), (p) => T.strawberry(p, { kind: sk, blink: blinkAt(f, 12), look: 0.6 }), [L - 0.55, 0, -0.5], 0.85 * Math.max(0.01, k), { ground: 0 })); }
      break;
    }
    case 'rain': {
      const ex = f < 1548 ? 'smile' : f < 1600 ? 'shock' : 'grin';
      push(hero(T, f, { expr: ex, look: q(0.3 * Math.sin(f * 0.08), 2), blink: f > 1548 && f < 1600 ? 0 : blinkAt(f, 3) }, [P, 0, -2]));
      break;
    }
    case 'giraffe': {
      const marks = f < 1740 ? 0 : Math.min(7, 1 + Math.floor((f - 1740) / 10));
      push(C_('giraffe' + marks + blinkAt(f, 13), (p) => T.giraffe(p, { marks, blink: blinkAt(f, 13), kind: f > 1867 ? 'grin' : 'smile' }), [G + 1.1, 0, -3], 2.6, { ground: 0 }));
      push(hero(T, f, { expr: f < 1859 ? 'shock' : 'grin', look: 0.6 }, [G - 1.0, 0, -1.6]));
      break;
    }
    case 'finale': {
      const ex = f < 2028 ? 'shock' : f < 2068 ? 'grin' : 'whistle';
      push(hero(T, f, { expr: ex, look: f >= 2068 ? -0.7 : 0, blink: f < 2028 ? 0 : blinkAt(f, 3), wave: f >= 2028 && f < 2062 ? q(Math.sin(f * 0.5), 1) : undefined }, [R + 0.2, 0.02, -0.6]));
      break;
    }
  }
  return out;
};

// ---------- 2D effects ----------
export const fxAt = (f, T) => {
  const S = shotAt(f), out = [], t = f / 30, push = (a) => a && out.push(a);
  if (S.id === 'intro') {
    const qs = [[56, 0.2, 3.0, 0.38], [107, -1.0, 3.2, 0.5], [121, 1.3, 3.6, 0.55], [136, -0.4, 4.1, 0.7], [150, 0.9, 4.6, 0.6], [165, -1.5, 4.4, 0.5]];
    qs.forEach(([f0, dx, y, s], i) => { const k = pop(f, f0, 7); if (k > 0) push(FX('q' + i, (p) => T.qmark(p, { rot: 0 }), [R + 0.2 + dx, y + 0.08 * Math.sin(t * 3 + i), -1.0 + i * 0.05], s * k, { roll: q(0.15 * Math.sin(t * 2 + i), 2) })); });
  }
  if (S.id === 'octo') {
    push(signAt(T, f, 196, 238, ['ФАКТ №1'], [O, 3.4, 4], 1.6));
    const ox = O, head = [ox, 0.5 + 0.25 * Math.sin(t * 2) + 1.94, -2.7];
    [[303, -1.0, 0.25], [327, 1.0, 0.25], [376, 0, 0.36]].forEach(([f0, dx, s], i) => { const k = pop(f, f0, 8); if (k > 0) { const beat = 1 + 0.12 * Math.max(0, Math.sin(t * 9 + i)); push(FX('heart', (p) => T.heart(p, {}), [head[0] + dx, head[1] - (i === 2 ? 1.0 : 0.3), head[2] + 0.4], s * k * beat, { order: 7 })); } });
    if (f >= 267 && f < 300) { const k = pop(f, 267, 6); push(FX('three', (p) => T.words(p, { lines: ['3 СЕРДЦА'], col: '#ff6a5a' }), [O, 5.2, -2], 1.2 * k)); }
  }
  if (S.id === 'octoHero') {
    [[481, -0.22], [486, 0], [491, 0.22]].forEach(([f0, dx], i) => { const k = pop(f, f0, 6); if (k > 0) push(FX('heart', (p) => T.heart(p, {}), [O + 1.0 + dx, 1.25 + (i % 2) * 0.1, -2.3], 0.12 * k * (1 + 0.15 * Math.max(0, Math.sin(t * 10 + i))), { order: 7 })); });
    push(FX('bub' + q(t, 1), (p) => T.bubbles(p, { t: q(t, 1) }), [O + 1.6, 1.8, -2.4], 1.0));
  }
  if (S.id === 'octo' || S.id === 'shark') push(FX('bub' + q(t, 1), (p) => T.bubbles(p, { t: q(t, 1) }), [O - 2.5, 1.0, -3.5], 1.5));
  if (S.id === 'hill') push(signAt(T, f, 511, 554, ['ФАКТ №2'], [H + 0.5, 1.9, 3.0], 1.4));
  if (S.id === 'space') {
    const k = pop(f, 622, 8); if (f < 700) { const sec = clamp((f - 622) / (668 - 622)) * 500; push(FX('watch' + Math.floor(sec), (p) => T.stopwatch(p, { sec }), [S_ + 3.0, 3.6, 10], 2.6 * k, { order: 7 })); }
    if (f >= 724) { const kk = pop(f, 724, 10); push(FX('tagS', (p) => T.tag(p, { text: '8 МИН|НАЗАД' }), [S_ + 2.2, 3.5 + 0.2 * Math.sin(t * 2), -13], 2.6 * kk, { roll: q(0.1 * Math.sin(t * 2.2), 2) })); }
  }
  if (S.id === 'hill2') push(FX('tagH', (p) => T.tag(p, { text: '8 МИН|НАЗАД' }), [H - 9, 12.5 + 0.2 * Math.sin(t * 2), -37], 3.5, { roll: q(0.1 * Math.sin(t * 2.2), 2) }));
  if (S.id === 'shark') {
    push(signAt(T, f, 856, 896, ['ФАКТ №3'], [O + 1.5, 3.4, 4], 1.6));
    if (f >= 968) { const k = pop(f, 968, 8); push(C_('tree', (p) => T.tree(p, { kind: 'frown', blink: blinkAt(f, 21) }), [O + 4.6, 0, -4.5], 1.1 * k, { ground: 0 })); }
    if (f >= 1004) { const k = pop(f, 1004, 10); push(C_('dino' + blinkAt(f, 22) + q(t * 2, 0), (p) => T.dino(p, { t: q(t * 2, 0) / 2, blink: blinkAt(f, 22) }), [O - 0.2, 5.0 + 0.2 * Math.sin(t * 1.5), -5.2], 1.2 * k, { sx: 1.5, blob: false })); }
    if (f >= 1048) { const k = pop(f, 1048, 8); push(FX('400', (p) => T.words(p, { lines: ['400 000 000', 'ЛЕТ'], col: '#ffd23f', size: 110 }), [O + 1.5, 4.6, 0], 1.6 * k)); }
  }
  if (S.id === 'lab') {
    push(signAt(T, f, 1103, 1147, ['ФАКТ №4'], [L + 0.3, 2.4, 3.5], 1.5));
    if (f >= 1234) { const k = pop(f, 1234, 5); push(FX('stampY', (p) => T.stamp(p, { text: 'ЯГОДА!', col: '#2f9a4a' }), [L + 0.5, 0.9, 1.2], 0.75 * (k > 0 ? 1 + 1.5 * (1 - k) : 0), { order: 8 })); }
    if (f >= 1287) { const k = pop(f, 1287, 5); push(FX('stampN', (p) => T.stamp(p, { text: 'НЕ ЯГОДА', cross: true, rot: 0.15 }), [L - 0.3, 0.7, 1.5], 0.65 * (k > 0 ? 1 + 1.5 * (1 - k) : 0), { order: 8 })); }
    if (f >= 1150) push(FX('bubL' + q(t, 1), (p) => T.bubbles(p, { t: q(t, 1) }), [L - 2.2, 2.0, -2.2], 0.5));
  }
  if (S.id === 'planets') push(signAt(T, f, 1381, 1423, ['ФАКТ №5'], [S_ + 80, 5.5, 14], 2.4));
  if (S.id === 'rain' && f >= 1600) { const k = pop(f, 1600, 8); push(FX('umb', (p) => T.umbrella(p, {}), [P + 0.1, 1.45, -1.9], 1.0 * k, { order: 4, cut: true, roll: q(0.06 * Math.sin(t * 3), 2) })); }
  if (S.id === 'rain' && f >= 1548) for (let i = 0; i < 4; i++) { const k = ((t * 1.3 + i * 0.27) % 1); push(FX('spk' + q(k, 1), (p) => T.sparkle(p, { k: Math.sin(k * Math.PI) }), [P - 3 + i * 2, 0.3 + (i % 2) * 0.5, -3 + i * 0.6], 0.25)); }
  if (S.id === 'giraffe') {
    push(signAt(T, f, 1667, 1704, ['БОНУС!'], [G + 0.2, 3.3, 4], 1.6, '#f2c14a'));
    if (f >= 1867) { const k = pop(f, 1867, 7); push(FX('77', (p) => T.words(p, { lines: ['7 = 7'], col: '#ffd23f', size: 170 }), [G - 0.4, 3.9, 0], 1.3 * k)); }
    if (f >= 1900) { const k = pop(f, 1900, 7); push(FX('ruler', (p) => T.ruler(p, { text: '25+ СМ' }), [G + 0.5, 1.0, 0.5], 1.3 * k, { order: 7 })); }
  }
  if (S.id === 'finale') {
    const icons = [['heart', (p) => T.heart(p, {})], ['q', (p) => T.qmark(p, {})], ['spk', (p) => T.sparkle(p, { col: '#bfefff' })], ['q2', (p) => T.qmark(p, { col: '#7cc36a' })]];
    if (f < 2068) icons.forEach(([k, d], i) => { const a = t * 1.6 + i * Math.PI / 2, kk = pop(f, 1950 + i * 6, 8); if (kk > 0) push(FX('ic' + k, d, [R + 0.2 + Math.cos(a) * 0.9, 1.75 + Math.sin(a) * 0.55, -0.6 + Math.sin(a) * 0.3], 0.18 * kk)); });
    if (f >= 2028 && f < 2075) { const k = pop(f, 2028, 8); push(FX('bubble', (p) => T.bubble(p, { text: '?!' }), [R + 0.75, 2.05, -0.3], 0.45 * k, { order: 7 })); }
  }
  return out;
};

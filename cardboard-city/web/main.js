import * as THREE from './lib/three.module.js';
import * as T from './toon.js';
import * as P from './paint.js';
import * as C from './cardpaint.js';
import { M as EZ } from './motion.js';
import { SHOTS, TOTAL, shotAt, camAt, dofAt, LIGHTS, lightFor, actorsAt, worldAt, fxAt } from './story.js';

const W = 1080, H = 1920;
const canvas = document.getElementById('c');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, preserveDrawingBuffer: true });
renderer.setPixelRatio(1); renderer.setSize(W, H, false);
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.NoToneMapping;

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(40, W / H, 0.08, 1500);
const rx = (a) => a * Math.PI / 180;

// ---------- materials ----------
const grad = (() => { const d = new Uint8Array([90, 90, 90, 255, 255, 255, 255, 255]); const t = new THREE.DataTexture(d, 2, 1); t.minFilter = t.magFilter = THREE.NearestFilter; t.needsUpdate = true; return t; })();
const toon = (opts) => new THREE.MeshToonMaterial({ gradientMap: grad, ...opts });
const cm = (c, rx_ = 1, ry_ = 1, opts = {}) => toon({ map: P.tex(c, rx_, ry_), ...opts });

// ---------- ink / normal-depth contract ----------
const ndMat = new THREE.ShaderMaterial({
  vertexShader: `varying vec3 vN; varying float vD; void main(){ vN = normalize(normalMatrix*normal); vec4 mv = modelViewMatrix*vec4(position,1.); vD = -mv.z; gl_Position = projectionMatrix*mv; }`,
  fragmentShader: `varying vec3 vN; varying float vD; void main(){ vec3 n = normalize(vN); if(!gl_FrontFacing) n = -n; gl_FragColor = vec4(n*.5+.5, vD); }`,
  side: THREE.DoubleSide,
});
const cardNd = (map) => new THREE.ShaderMaterial({
  uniforms: { map: { value: map } },
  vertexShader: `varying vec2 vUv; varying float vD; void main(){ vUv=uv; vec4 mv = modelViewMatrix*vec4(position,1.); vD=-mv.z; gl_Position=projectionMatrix*mv; }`,
  fragmentShader: `uniform sampler2D map; varying vec2 vUv; varying float vD; void main(){ if(texture2D(map,vUv).a<.5) discard; gl_FragColor=vec4(0.,0.,0.,vD); }`,
  side: THREE.DoubleSide,
});

// ---------- helpers ----------
const add = (geo, mat, x = 0, y = 0, z = 0, parent = scene, opts = {}) => {
  const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.castShadow = opts.cast ?? true; m.receiveShadow = true; parent.add(m); return m;
};
const box = (w, h, d) => new THREE.BoxGeometry(w, h, d);
const uvScale = (geo, su, sv) => { const uv = geo.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * su, uv.getY(i) * sv); return geo; };
const grp = (parent, x = 0, y = 0, z = 0, ry = 0) => { const g = new THREE.Group(); g.position.set(x, y, z); g.rotation.y = ry; parent.add(g); return g; };

// ---------- sky ----------
const skyU = { top: { value: new THREE.Color() }, hor: { value: new THREE.Color() }, sunDir: { value: new THREE.Vector3() }, sunCol: { value: new THREE.Color() }, sunSize: { value: 0 } };
const sky = new THREE.Mesh(new THREE.SphereGeometry(1200, 32, 16), new THREE.ShaderMaterial({
  uniforms: skyU, side: THREE.BackSide, depthWrite: false, fog: false,
  vertexShader: `varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.); }`,
  fragmentShader: `uniform vec3 top, hor, sunDir, sunCol; uniform float sunSize; varying vec3 vP;
    void main(){ float h = clamp(vP.y,0.,1.); vec3 c = mix(hor, top, pow(h, .55)); if(vP.y<0.) c = hor;
      float s = dot(normalize(vP), normalize(sunDir)); c += sunCol * (smoothstep(1.-sunSize, 1.-sunSize*.6, s) + .35*pow(max(s,0.), 24.)*step(.001,sunSize));
      gl_FragColor = vec4(c,1.); }`,
}));
sky.userData.sky = true; scene.add(sky);

// ---------- lights ----------
const hemi = new THREE.HemisphereLight('#ffffff', '#ffffff', 1); scene.add(hemi);
const sun = new THREE.DirectionalLight('#ffffff', 2); sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048); sun.shadow.bias = -0.0006; sun.shadow.normalBias = 0.03; sun.shadow.radius = 2;
scene.add(sun); scene.add(sun.target);
scene.fog = new THREE.Fog('#ffffff', 40, 600);

// ---------- world: CARDBOARD CITY ----------
// Everything is cut, folded and taped card: kraft liners, corrugated (fluted) edges, poster paint, marker drawings.
const GROUND = 0, FL = 0.45, T_ = 0.22, GF = 3.6; // ground level, metres per flute tile, wall thickness, ground storey
const world = new THREE.Group(); scene.add(world);
const K = {
  edge: cm(C.flute()), kraft: cm(C.kraft(1)), inside: cm(C.kraft(2, [28, 40, 42])),
  ground: cm(C.kraft(3, [33, 46, 64])), walk: cm(C.sidewalk(4)), road: cm(C.road(5)), zebra: cm(C.zebra(6)), lawn: cm(C.lawn(6)),
  river: cm(C.river(7)), tube: cm(C.tube(8)), tubeCream: cm(C.tube(19, [38, 40, 84])), pulp: cm(C.pulp(9)),
  tape: cm(C.tapeH()), dark: toon({ color: '#2a1d16' }), clock: cm(C.clock()), wheel: cm(C.wheel()),
  leaves: [cm(C.leaves(11)), cm(C.leaves(21, '#3f8a45')), cm(C.leaves(31, '#8cc04a'))], bark: cm(C.bark()),
  cloud: cm(C.painted(40, '#f7f8fc')), smoke: cm(C.painted(41, '#dedad5')), sun: cm(C.painted(42, '#ffc93a')),
  hill: [cm(C.painted(43, '#7cb855')), cm(C.painted(44, '#5f9e4a')), cm(C.painted(45, '#98c76c')), cm(C.painted(46, '#8fb5c9'))],
  stick: toon({ color: '#dcc092' }), lampHead: cm(C.painted(47, '#f6d45a')), redFlag: cm(C.painted(48, '#d9463b')),
};
K.sun.fog = false;
const PAL = {
  kraft: { col: null, accent: '#d9563f', roof: '#d9563f', door: '#4f7fb8' },
  sky: { col: '#8cc2ea', accent: '#f2b33d', roof: '#3f6fb5', door: '#f2b33d' },
  mint: { col: '#a2dcbc', accent: '#e86a8a', roof: '#3f8a6a', door: '#e86a8a' },
  mustard: { col: '#f4ca52', accent: '#4f7fb8', roof: '#c4452c', door: '#4f7fb8' },
  coral: { col: '#f2906f', accent: '#3f6fb5', roof: '#7a3b6a', door: '#3f6fb5' },
  lilac: { col: '#c9aceb', accent: '#f2b33d', roof: '#5a4a9a', door: '#5a4a9a' },
  cream: { col: '#f4e8cf', accent: '#d9563f', roof: '#d9563f', door: '#8a4b2c' },
};
const PALKEYS = Object.keys(PAL);
const pm = {}; let pmSeed = 100;
const PM = (key, v = 0) => {
  const id = key + v; if (pm[id]) return pm[id]; const p = PAL[key], s = (pmSeed += 10);
  return (pm[id] = {
    facade: cm(C.facade(s, p.col, v, p.accent)), plain: p.col ? cm(C.painted(s + 1, p.col)) : K.kraft, roof: cm(C.roof(s + 2, p.roof)),
    door: cm(C.door(s + 3, p.door)), awning: cm(C.stripes(p.accent === '#fbf6ea' ? '#3f6fb5' : p.accent, '#fbf6ea', 8, s + 4)),
    shop: decalMat(C.shopWindow(s + 5, p.accent)),
  });
};
const decalCache = {};
function decalMat(c) { return toon({ map: P.tex(c), alphaTest: 0.5, side: THREE.FrontSide }); }
const pictMat = (k) => decalCache[k] || (decalCache[k] = decalMat(C.pictogram(k)));
const decal = (mat, w, h, x, y, z, parent) => { const m = add(new THREE.PlaneGeometry(w, h), mat, x, y, z, parent, { cast: false }); m.userData.decal = true; return m; };

// geometry with corrugated edges ------------------------------------------------
const setUV = (g, fn) => { const uv = g.attributes.uv; for (let f = 0; f < 6; f++) for (let k = 0; k < 4; k++) { const i = f * 4 + k, r = fn(f, uv.getX(i), uv.getY(i)); uv.setXY(i, r[0], r[1]); } return g; };
/** vertical sheet in XY, thickness along z. groups: 0/1 = ±x edges, 2/3 = ±y edges, 4 = +z outer face, 5 = -z inner face */
const sheetGeo = (w, h, th, tu = 3, tv = tu, fl = FL) => setUV(box(w, h, th), (f, u, v) => f >= 4 ? [u * w / tu, v * h / tv] : f >= 2 ? [u * w / fl, v] : [v * h / fl, u]);
/** horizontal slab in XZ, thickness along y. groups: 0/1 = ±x edges, 2 top, 3 bottom, 4/5 = ±z edges */
const slabGeo = (w, th, d, tile = 3, fl = FL) => setUV(box(w, th, d), (f, u, v) => f === 2 || f === 3 ? [u * w / tile, v * d / tile] : f <= 1 ? [u * d / fl, v] : [u * w / fl, v]);
const sheet = (w, h, th, outer, inner, parent, x, y, z, o = {}) => add(sheetGeo(w, h, th, o.tu ?? 3, o.tv ?? o.tu ?? 3, o.fl ?? FL), [o.side ?? K.edge, o.side ?? K.edge, K.edge, K.edge, outer, inner], x, y, z, parent, o);
const slab = (w, th, d, top, parent, x, y, z, o = {}) => add(slabGeo(w, th, d, o.tile ?? 3, o.fl ?? FL), [K.edge, K.edge, top, o.bottom ?? K.inside, K.edge, K.edge], x, y, z, parent, o);
/** extruded cut-out (shape in XY metres, centred on z). groups: 0 = faces (tile-scaled UV), 1 = cut edges (flutes) */
const extrudeGeo = (pts, depth, tile = 3, fl = FL) => {
  const shape = new THREE.Shape(pts.map(([x, y]) => new THREE.Vector2(x, y)));
  const V = (x, y) => new THREE.Vector2(x, y);
  const g = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: false, curveSegments: 6, UVGenerator: {
    generateTopUV: (geo, v, a, b, c) => [a, b, c].map((i) => V(v[i * 3] / tile, v[i * 3 + 1] / tile)),
    generateSideWallUV: (geo, v, a, b, c, d) => {
      const dx = Math.abs(v[b * 3] - v[a * 3]), dy = Math.abs(v[b * 3 + 1] - v[a * 3 + 1]), k = dx >= dy ? 0 : 1;
      return [a, b, c, d].map((i) => V(v[i * 3 + k] / fl, v[i * 3 + 2] / depth));
    } } });
  g.translate(0, 0, -depth / 2); return g;
};
const cutout = (pts, depth, face, parent, x, y, z, o = {}) => add(extrudeGeo(pts, depth, o.tile ?? 3, o.fl ?? FL), [face, o.edge ?? K.edge], x, y, z, parent, o);

// ground: triple-wall board, river cut through it -------------------------------
const RIVER = [-80, -64], LAYER = 0.8;
for (let i = 0; i < 3; i++) {
  const y = -LAYER / 2 - i * LAYER, top = i === 0 ? K.ground : K.inside;
  slab(RIVER[0] + 460, LAYER, 920, top, world, (RIVER[0] - 460) / 2, y, 0, { tile: 6, fl: 2.4, cast: false });
  slab(460 - RIVER[1], LAYER, 920, top, world, (RIVER[1] + 460) / 2, y, 0, { tile: 6, fl: 2.4, cast: false });
}
const river = add(uvScale(new THREE.PlaneGeometry(RIVER[1] - RIVER[0], 920), 16 / 8, 920 / 8), K.river, (RIVER[0] + RIVER[1]) / 2, -2.0, 0, world, { cast: false });
river.rotation.x = -Math.PI / 2;

// roads + sidewalks ------------------------------------------------------------------
const roadStrip = (x0, x1, z, along = 'x', mat = K.road, y = 0.012) => {
  const len = x1 - x0, g = new THREE.PlaneGeometry(8, len); uvScale(g, 1, len / 8);
  const m = add(g, mat, along === 'x' ? (x0 + x1) / 2 : z, y, along === 'x' ? z : (x0 + x1) / 2, world, { cast: false });
  m.rotation.x = -Math.PI / 2; if (along === 'x') m.rotation.z = Math.PI / 2; return m;
};
const MAINX = [RIVER[1], 47];
roadStrip(MAINX[0], MAINX[1], 0, 'x');
roadStrip(-220, 220, 0, 'z', K.road, 0.011);
for (const x of [-6, 6]) { const zb = add(new THREE.PlaneGeometry(8, 3.2), K.zebra, x, 0.014, 0, world, { cast: false }); zb.rotation.x = -Math.PI / 2; zb.rotation.z = Math.PI / 2; }
roadStrip(-170, RIVER[0] - 2, 0, 'x');
const walk = (x0, x1, z0, z1) => slab(x1 - x0, 0.15, z1 - z0, K.walk, world, (x0 + x1) / 2, 0.075, (z0 + z1) / 2, { tile: 2, cast: false });
for (const s of [-1, 1]) { walk(MAINX[0], -4, s > 0 ? 4 : -8, s > 0 ? 8 : -4); walk(4, MAINX[1], s > 0 ? 4 : -8, s > 0 ? 8 : -4); walk(s > 0 ? 4 : -8, s > 0 ? 8 : -4, 8, 220); walk(s > 0 ? 4 : -8, s > 0 ? 8 : -4, -220, -8); }
walk(47, 64, -16, 16); // town-hall plaza

// buildings --------------------------------------------------------------------------
const blds = [];
/** a cardboard box building. front faces local +z. top: 'closed' (taped lid) | 'open' (flaps) | 'roof' (folded peaked roof) */
function building(o) {
  const { x, z, w, d, h, rot = 0, pal = 'kraft', v = 0, top = 'closed', flaps = [0.5, 0.25, 0.8, 0.35], door = true, shop = true, awning = false, pict = null } = o;
  const M_ = PM(pal, v), g = grp(world, x, 0, z, rot); g.userData.o = o; g.userData.lids = []; g.userData.flaps = [];
  const walls = [
    { W: w, p: [0, d / 2 - T_ / 2], r: 0, face: 'front' }, { W: w, p: [0, -d / 2 + T_ / 2], r: Math.PI, face: 'back' },
    { W: d - 2 * T_, p: [w / 2 - T_ / 2, 0], r: Math.PI / 2, face: 'right' }, { W: d - 2 * T_, p: [-w / 2 + T_ / 2, 0], r: -Math.PI / 2, face: 'left' },
  ];
  walls.forEach((wl, wi) => {
    const wg = grp(g, wl.p[0], 0, wl.p[1], wl.r), side = wl.face === 'left' || wl.face === 'right';
    const corner = side ? K.edge : M_.plain;
    sheet(wl.W, GF, T_, M_.plain, K.inside, wg, 0, GF / 2, 0, { side: corner });
    sheet(wl.W, h - GF, T_, side ? M_.plain : M_.facade, K.inside, wg, 0, GF + (h - GF) / 2, 0, { side: corner });
    if (wl.face === 'front') { // shop windows, door, awning on the ground storey
      const n = Math.round(w / 3), db = Math.floor(n / 2);
      for (let b = 0; b < n; b++) {
        const bx = -w / 2 + 1.5 + b * 3;
        if (door && b === db) {
          decal(K.dark, 1.5, 2.5, bx, 1.25, T_ / 2 + 0.006, wg);
          const hg = grp(wg, bx - 0.75, 0, T_ / 2 + 0.04, -0.55 - 0.3 * ((x * 7 + z) % 1 + 1) / 2);
          sheet(1.5, 2.5, 0.08, M_.door, K.inside, hg, 0.75, 1.25, 0, { tu: 1.5, tv: 2.5 });
        } else if (shop) decal(M_.shop, 2.6, 1.95, bx, 1.75, T_ / 2 + 0.006, wg);
      }
      if (awning && shop) { const ag = grp(wg, 0, 3.2, T_ / 2); ag.rotation.x = -1.05; sheet(w - 0.6, 1.6, 0.06, M_.awning, M_.awning, ag, 0, -0.8, 0, { tu: 3, tv: 1.6 }); }
    }
    if (pict && wl.face === pict.face) decal(pictMat(pict.kind), pict.s || 1.8, pict.s || 1.8, pict.x || 0, pict.y ?? h - 1.8, T_ / 2 + 0.006, wg);
    // top of the wall
    if (top === 'open') {
      const L = Math.min(w, d) / 2 * 0.92, hg = grp(wg, 0, h, 0); hg.rotation.x = flaps[wi];
      sheet(side ? wl.W - 0.1 : wl.W, L, T_ * 0.8, M_.plain, K.inside, hg, 0, L / 2, 0, { tu: 3 });
      g.userData.flaps.push({ hg, a0: flaps[wi], ph: wi * 1.7 + x * 0.13 });
    } else if (top === 'closed' && !side) {
      const L = d / 2 - T_ / 2, hg = grp(wg, 0, h, 0); hg.rotation.x = -Math.PI / 2;
      sheet(wl.W, L, T_, M_.plain, K.inside, hg, 0, L / 2, 0, { tu: 3, side: K.edge });
      g.userData.lids.push({ hg, face: wl.face, open: 0.35 + flaps[wi] * 0.8 });
    }
  });
  if (top === 'open') slab(w - 2 * T_, 0.1, d - 2 * T_, K.inside, g, 0, h - 1.9, 0, { cast: false });
  if (top === 'closed') { // packing tape over the seam (pivoted at the -x end so it can peel), wrapping down the side walls
    const piv = grp(g, -(w + 0.05) / 2, h + T_ / 2 + 0.015, 0);
    add(box(w + 0.05, 0.03, 0.62), K.tape, (w + 0.05) / 2, 0, 0, piv, { cast: false });
    const sides = [-1, 1].map((s) => add(box(0.03, 1.0, 0.62), K.tape, s * (w / 2 + 0.015), h + T_ / 2 - 0.5, 0, g, { cast: false }));
    g.userData.tape = { piv, sides };
  }
  if (top === 'closed' || top === 'open') { // X of fresh tape, shown when the city is glued back together
    const xg = grp(g, 0, h + (top === 'closed' ? T_ / 2 + 0.05 : T_ * 0.6), 0), L = Math.hypot(w, d) - 0.4, a = Math.atan2(d, w);
    for (const s of [-1, 1]) add(box(L, 0.04, 0.7), K.tape, 0, s * 0.005, 0, xg, { cast: false }).rotation.y = s * a;
    for (const s of [-1, 1]) add(box(0.7, 1.3, 0.04), K.tape, 0, -0.65, s * (d / 2 + 0.025), xg, { cast: false });
    xg.visible = false; g.userData.xtape = xg;
  }
  if (top === 'roof') {
    const rh = Math.min(3.2, d * 0.32), a = Math.atan2(rh, d / 2), Ls = Math.hypot(rh, d / 2) + 0.7;
    for (const s of [1, -1]) {
      const sg = grp(g, 0, 0, 0, s > 0 ? 0 : Math.PI), dir = [0, -Math.sin(a), Math.cos(a)], nrm = [0, Math.cos(a), Math.sin(a)];
      const c = [0, h + rh + dir[1] * (Ls / 2 - 0.05) + nrm[1] * T_ / 2, dir[2] * (Ls / 2 - 0.05) + nrm[2] * T_ / 2];
      const rs = slab(w + 1.0, T_, Ls, M_.roof, sg, ...c); rs.rotation.x = a;
    }
    for (const s of [-1, 1]) { // gable triangles on the side walls
      const gg = grp(g, s * (w / 2 - T_ / 2), h, 0, s * Math.PI / 2);
      cutout([[-d / 2, 0], [d / 2, 0], [0, rh]], T_, M_.plain, gg, 0, 0, 0);
    }
  }
  blds.push(g); return g;
}

// main street rows (deterministic lots)
const rl = P.rng(2024);
const pick = (arr) => arr[(rl() * arr.length) | 0];
const tops = ['closed', 'closed', 'open', 'roof', 'open', 'closed', 'roof'];
let palI = 0;
const row = (x0, x1, zFront, side, depthR, floorsR, opts = {}) => {
  let x = x0 + 0.6;
  while (true) {
    const w = pick(opts.widths || [6, 9, 9, 12]); if (x + w > x1) break;
    const d = depthR[0] + ((rl() * (depthR[1] - depthR[0] + 1)) | 0), fl = floorsR[0] + ((rl() * (floorsR[1] - floorsR[0] + 1)) | 0);
    const pal = PALKEYS[(palI++ * 5 + 3) % PALKEYS.length], top = (x === x0 + 0.6 && opts.firstTop) || opts.top || pick(tops);
    const fl_ = [0.25 + rl() * 1.2, 0.2 + rl() * 1.0, 0.3 + rl() * 1.1, 0.2 + rl() * 1.0];
    const zc = zFront + side * d / 2;
    const pict = rl() < 0.35 ? { face: rl() < 0.5 ? 'left' : 'right', kind: pick(['up', 'dry', 'fragile', 'recycle']), s: 1.6 + rl() * 0.8, y: GF + 1.2 + rl() * (fl * 3 - 1.5) } : null;
    building({ x: x + w / 2, z: zc, w, d, h: GF + 3 * fl, rot: side > 0 ? Math.PI : 0, pal: pal === 'cream' && opts.noCream ? 'kraft' : pal, v: (palI * 7) % 4, top, flaps: fl_, awning: opts.front && rl() < 0.6, shop: !!opts.front, door: opts.front !== false, pict });
    x += w + 0.7 + rl() * 0.9;
  }
};
// first rows on the main street (fronts at |z| = 8.2)
row(-61, -8.4, 8.2, 1, [9, 12], [1, 2], { front: true });
row(8.4, 46, 8.2, 1, [9, 12], [1, 3], { front: true });
row(-45, -8.4, -8.2, -1, [9, 12], [1, 2], { front: true });
row(8.4, 46, -8.2, -1, [9, 12], [1, 3], { front: true, firstTop: 'closed' });
// second and third rows (taller skyline)
row(-60, -9, 24, 1, [10, 14], [2, 4], { front: false, widths: [9, 12, 12] });
row(9, 60, 24, 1, [10, 14], [3, 5], { front: false, widths: [9, 12, 12] });
row(-60, -9, -24, -1, [10, 14], [2, 4], { front: false, widths: [9, 12, 12] });
row(9, 60, -24, -1, [10, 14], [3, 5], { front: false, widths: [9, 12, 12] });
row(-50, -9, 44, 1, [12, 15], [4, 7], { front: false, widths: [12, 15], top: 'closed' });
row(9, 70, 44, 1, [12, 15], [5, 8], { front: false, widths: [12, 15], top: 'closed' });
row(-50, -9, -44, -1, [12, 15], [4, 7], { front: false, widths: [12, 15], top: 'closed' });
row(9, 70, -44, -1, [12, 15], [5, 8], { front: false, widths: [12, 15], top: 'closed' });
// west bank cottages
[[-100, 14], [-112, -12], [-126, 18], [-104, -30], [-140, -4], [-120, 40]].forEach(([x, z], i) =>
  building({ x, z, w: 6 + (i % 2) * 3, d: 7, h: GF + 3, rot: Math.PI / 2 + (i % 3 - 1) * 0.3, pal: PALKEYS[(i * 3 + 1) % 7], v: i % 4, top: 'roof', shop: false, door: true }));

// paper-tube towers (spiral-wound), cone caps
const towers = [];
const tower = (x, z, r, h, cap = '#d9563f', mat = K.tube) => {
  const g = grp(world, x, 0, z);
  add(uvScale(new THREE.CylinderGeometry(r, r, h, 28, 1, true), 2 * Math.PI * r / 4, h / 4), mat, 0, h / 2, 0, g);
  add(new THREE.CylinderGeometry(r, r, 0.12, 28), K.inside, 0, h - 0.06, 0, g);
  const capM = cm(C.roof(towers.length + 300, cap)); const cn = add(uvScale(new THREE.ConeGeometry(r * 1.18, r * 1.6, 28), 3, 1), capM, 0, h + r * 0.8, 0, g);
  towers.push(g); return g;
};
tower(-52, 68, 3.2, 34, '#3f6fb5'); tower(26, 68, 2.8, 40, '#c4452c'); tower(-14, -68, 3.0, 31, '#5a4a9a'); tower(40, -68, 3.6, 37, '#3f8a6a'); tower(-48, -66, 2.4, 28, '#f2b33d'); tower(62, 66, 2.6, 30, '#e86a8a');

// factory with smokestacks + cut-out smoke on skewers
const factory = building({ x: -26, z: 66, w: 18, d: 14, h: GF + 6, pal: 'kraft', top: 'closed', shop: false, door: false, rot: Math.PI });
const puffs = [];
[-6, 0, 6].forEach((sx, i) => {
  const sh = 15 + i * 2.5, g = grp(world, -26 + sx, 0, 72);
  add(uvScale(new THREE.CylinderGeometry(0.95, 1.15, sh, 20, 1, true), 1.6, sh / 4), K.tube, 0, sh / 2, 0, g);
  add(new THREE.CylinderGeometry(0.95, 0.95, 0.1, 20), K.dark, 0, sh - 0.05, 0, g, { cast: false });
  for (let k = 0; k < 3; k++) {
    const pg = grp(g, 0, sh + 2.2 + k * 2.6, 0);
    add(new THREE.CylinderGeometry(0.05, 0.05, 2.6, 6), K.stick, 0, -1.3, 0, pg);
    const pf = cutout(C.puffShape(3.6 - k * 0.5 + 1.2, 2.4, 70 + i * 3 + k), 0.18, K.smoke, pg, 0, -0.3, 0, { tile: 4 });
    pg.userData.k = k; pg.userData.i = i; pg.userData.y0 = pg.position.y; puffs.push(pg);
  }
});

// town hall: cream box, tube colonnade, pediment, clock tower
const HALL = [71.5, 0];
const hall = building({ x: HALL[0], z: HALL[1], w: 21, d: 15, h: GF + 6, rot: -Math.PI / 2, pal: 'cream', v: 3, top: 'closed', shop: false, door: false, hall: true });
{
  const HM = PM('cream', 3), zf = 15 / 2;
  for (let i = 0; i < 6; i++) add(uvScale(new THREE.CylinderGeometry(0.55, 0.6, 7.05, 22), 1.4, 2), K.tubeCream, -8.5 + i * 3.4, 0.75 + 3.525, zf + 2.8, hall);
  slab(20, 0.9, 5.6, HM.plain, hall, 0, 8.25, zf + 2.4);
  cutout([[-10.2, 0], [10.2, 0], [0, 3.2]], 0.5, HM.plain, hall, 0, 8.7, zf + 4.9);
  decal(K.dark, 2.4, 3.6, 0, 0.75 + 1.8, zf + 0.006, hall);
  const dg = grp(hall, -1.2, 0.75, zf + 0.05, -0.7); sheet(1.2, 3.6, 0.08, HM.door, K.inside, dg, 0.6, 1.8, 0, { tu: 1.2, tv: 3.6 });
  const dg2 = grp(hall, 1.2, 0.75, zf + 0.05, Math.PI + 0.7); sheet(1.2, 3.6, 0.08, HM.door, K.inside, dg2, 0.6, 1.8, 0, { tu: 1.2, tv: 3.6 });
  slab(21, 0.6, 5.0, K.walk, hall, 0, 0.45, zf + 2.5, { tile: 2 });
  slab(21, 0.4, 0.8, K.walk, hall, 0, 0.35, zf + 5.4, { tile: 2 }); slab(21, 0.2, 0.8, K.walk, hall, 0, 0.25, zf + 6.2, { tile: 2 });
  const tpiv = grp(hall, 0, GF + 6, -7.5 + T_ / 2); hall.userData.tpiv = tpiv;
  const tg = grp(tpiv, 0, T_, -4.0 - (-7.5 + T_ / 2));
  add(setUV(box(6, 7, 6), (f, u, v) => [u * 2, v * 7 / 3]), [HM.plain, HM.plain, K.kraft, K.kraft, HM.plain, HM.plain], 0, 3.5, 0, tg);
  const clk = add(new THREE.CylinderGeometry(2.1, 2.1, 0.25, 48), [K.edge, K.clock, K.clock], 0, 4.1, 3.1, tg); clk.rotation.x = Math.PI / 2;
  const cr = add(uvScale(new THREE.ConeGeometry(5.0, 4.6, 4), 3, 1.5), HM.roof, 0, 7 + 2.3, 0, tg); cr.rotation.y = Math.PI / 4;
  add(new THREE.CylinderGeometry(0.07, 0.07, 4, 8), K.stick, 0, 11.6 + 2, 0, tg);
  const flag = sheet(2.2, 1.3, 0.05, K.redFlag, K.redFlag, tg, 1.15, 14.8, 0, { tu: 2.2, tv: 1.3 }); flag.userData.flag = true; hall.userData.flag = flag;
}

// park by the river: lawn card, cut-out trees, bench
slab(15, 0.2, 15, K.lawn, world, -54.5, 0.1, -16.5, { tile: 4, cast: false });

// cut-out trees: two slotted silhouettes
const trees = [];
const treeShapes = {
  round: (h) => { const rc = h * 0.3, cy = h * 0.66, pts = []; for (let i = 0; i < 48; i++) { const t = i / 48 * Math.PI * 2, rr = rc * (1 + 0.09 * Math.sin(t * 7)); pts.push([Math.cos(t) * rr, cy + Math.sin(t) * rr * 0.95]); } return pts; },
  pine: (h) => { const pts = [], lv = 3; for (let i = 0; i < lv; i++) { const y0 = h * (0.28 + i * 0.2), wd = h * (0.32 - i * 0.07); pts.push([wd, y0]); pts.push([wd * 0.45, y0 + h * 0.06]); } pts.push([0, h]); for (let i = lv - 1; i >= 0; i--) { const y0 = h * (0.28 + i * 0.2), wd = h * (0.32 - i * 0.07); pts.push([-wd * 0.45, y0 + h * 0.06]); pts.push([-wd, y0]); } return pts; },
};
const tree = (x, z, h = 5.5, kind = 'round', ry = 0, li = 0) => {
  const g = grp(world, x, 0, z, ry);
  for (const r of [0, Math.PI / 2]) {
    const sg = grp(g, 0, 0, 0, r);
    cutout([[-0.22, 0], [0.22, 0], [0.22, h * 0.5], [-0.22, h * 0.5]], 0.14, K.bark, sg, 0, 0, 0, { tile: 1 });
    cutout(treeShapes[kind](h), 0.14, K.leaves[li % 3], sg, 0, 0, 0, { tile: 2.5 });
  }
  trees.push(g); return g;
};
const rt = P.rng(77);
for (let x = -58; x < 44; x += 11) for (const s of [-1, 1]) { if (Math.abs(x + 2) < 7) continue; tree(x + rt() * 2, s * 5.1, 4.6 + rt() * 1.2, rt() < 0.7 ? 'round' : 'pine', rt() * 0.6, (x / 11 | 0) + (s > 0 ? 1 : 0)); }
for (let i = 0; i < 9; i++) tree(-60 + rt() * 11, -11 - rt() * 11, 4 + rt() * 2.5, i % 3 ? 'round' : 'pine', rt() * 1.5, i);
for (let i = 0; i < 26; i++) { const x = -90 - rt() * 70, z = (rt() - 0.5) * 120; tree(x, z, 5 + rt() * 3, i % 3 ? 'round' : 'pine', rt() * 2, i); }
for (let i = 0; i < 18; i++) { const a = rt() * Math.PI * 2, d = 85 + rt() * 40; if (Math.cos(a) * d + 10 > -86 && Math.cos(a) * d + 10 < -58) continue; tree(Math.cos(a) * d + 10, Math.sin(a) * d, 6 + rt() * 4, i % 2 ? 'pine' : 'round', rt() * 2, i); }
// bench in the park
{ const bg = grp(world, -53, 0.2, -10.5, 0); slab(2.6, 0.12, 0.7, PM('mustard', 0).plain, bg, 0, 0.55, 0); for (const s of [-1, 1]) sheet(0.12, 0.55, 0.7, K.kraft, K.kraft, bg, s * 1.1, 0.275, 0, { side: K.edge }); sheet(2.6, 0.6, 0.1, PM('mustard', 0).plain, K.kraft, bg, 0, 0.95, -0.32); }

// street lamps (tube poles) + paper bunting across the street
const lamps = [], bunting = [];
for (let x = -52; x <= 42; x += 22) for (const s of [-1, 1]) {
  if (Math.abs(x) < 6) continue;
  const g = grp(world, x, 0.15, s * 4.6);
  add(uvScale(new THREE.CylinderGeometry(0.1, 0.13, 4.8, 10), 0.6, 1.2), K.tube, 0, 2.4, 0, g);
  const arm = slab(0.16, 0.12, 1.1, K.kraft, g, 0, 4.75, -s * 0.5);
  add(box(0.55, 0.38, 0.55), K.lampHead, 0, 4.55, -s * 1.0, g);
  lamps.push(g);
}
const flagCols = ['#e0533d', '#f2c14a', '#4f9be0', '#7cc36a', '#e86a8a', '#c9aceb'].map((c, i) => cm(C.painted(60 + i, c), 1, 1, { side: THREE.DoubleSide }));
for (let x = -52; x <= 42; x += 22) {
  if (Math.abs(x) < 6) continue;
  const N = 13, line = [];
  for (let i = 0; i <= N; i++) { const t = i / N, z = -4.6 + t * 9.2, y = 0.15 + 4.5 - Math.sin(t * Math.PI) * 0.7; line.push([x, y, z]); }
  for (let i = 0; i < N; i++) {
    const [ax, ay, az] = line[i], [bx, by, bz] = line[i + 1];
    const seg = add(new THREE.CylinderGeometry(0.015, 0.015, Math.hypot(by - ay, bz - az), 4), K.dark, x, (ay + by) / 2, (az + bz) / 2, world, { cast: false }); seg.rotation.x = Math.PI / 2 - Math.atan2(by - ay, bz - az);
    const fg = grp(world, x, (ay + by) / 2, (az + bz) / 2);
    const tg = uvScale(new THREE.ShapeGeometry(new THREE.Shape([new THREE.Vector2(-0.3, 0), new THREE.Vector2(0.3, 0), new THREE.Vector2(0, -0.62)])), 0.5, 0.5); tg.rotateY(Math.PI / 2);
    add(tg, flagCols[i % flagCols.length], 0, 0, 0, fg, { cast: false });
    fg.userData.ph = i * 0.7 + x * 0.1; bunting.push(fg);
  }
}

// bridge over the paper river: two halves pivoted at the centre so it can fold like a card
const bridgeHalves = [];
{
  const cx = (RIVER[0] + RIVER[1]) / 2, span = RIVER[1] - RIVER[0] + 4, hs = span / 2, coral = PM('coral', 0).plain;
  for (const s of [-1, 1]) {
    const hg = grp(world, cx, 0, 0), c = s * hs / 2; bridgeHalves.push({ hg, s });
    slab(hs, 0.4, 10, K.walk, hg, c, -0.19, 0, { tile: 2 });
    const rs = add(uvScale(new THREE.PlaneGeometry(8, hs), 1, hs / 8), K.road, c, 0.022, 0, hg, { cast: false }); rs.rotation.x = -Math.PI / 2; rs.rotation.z = Math.PI / 2;
    for (const z of [-4.75, 4.75]) {
      const N = 14, R = 9.2, cy = -9.2;
      for (let i = 0; i < N; i++) {
        if ((i < N / 2 ? 1 : -1) !== s) continue;
        const a0 = Math.PI * (0.24 + 0.52 * i / N), a1 = Math.PI * (0.24 + 0.52 * (i + 1) / N);
        const p0 = [Math.cos(a0) * R, cy + Math.sin(a0) * R], p1 = [Math.cos(a1) * R, cy + Math.sin(a1) * R];
        const L = Math.hypot(p1[0] - p0[0], p1[1] - p0[1]) + 0.05, sl = slab(L, 0.5, 0.35, coral, hg, (p0[0] + p1[0]) / 2, (p0[1] + p1[1]) / 2 - 0.3, z, { tile: 1 });
        sl.rotation.z = Math.atan2(p1[1] - p0[1], p1[0] - p0[0]);
      }
      for (let x = 0.6; x <= hs - 0.4; x += 2) add(uvScale(new THREE.CylinderGeometry(0.09, 0.09, 1.1, 8), 0.3, 0.3), K.tube, s * x, 0.55, z, hg);
      sheet(hs - 0.3, 0.22, 0.1, coral, coral, hg, s * (hs / 2 + 0.05), 1.15, z, { tu: 3 });
    }
  }
}
// cars: boxes with drawn windows and card wheels
const cars = [];
const carCols = ['#e0533d', '#4f9be0', '#f2c14a', '#7cc36a', '#c9aceb', '#f2906f'];
const car = (i, lane, x0, speed) => {
  const col = carCols[i % carCols.length], s = 500 + i * 10;
  const side = cm(C.carSide(s, col)), cab = cm(C.carCabin(s + 1, col)), front = cm(C.carFront(s + 2, col)), rear = cm(C.carFront(s + 3, col, true)), plain = cm(C.painted(s + 4, col));
  const g = grp(world, x0, 0, lane), b = grp(g, 0, 0, 0, speed > 0 ? 0 : Math.PI);
  add(box(4.2, 1.0, 1.9), [front, rear, plain, K.dark, side, side], 0, 0.95, 0, b);
  add(box(2.3, 0.85, 1.7), [cab, cab, plain, K.dark, cab, cab], -0.25, 1.88, 0, b);
  for (const wx of [-1.35, 1.35]) for (const wz of [-0.98, 0.98]) { const wh = add(new THREE.CylinderGeometry(0.46, 0.46, 0.28, 24), [K.edge, K.wheel, K.wheel], wx, 0.46, wz, b); wh.rotation.x = Math.PI / 2; }
  g.userData = { x0, speed, lane }; cars.push(g); return g;
};
car(0, -2, -20, 5.5); car(1, 2, 18, -6); car(2, -2, 22, 5); car(3, 2, -24, -5.2); car(4, -2, 0, 4.6);
{ const cz = car(5, 0, 0, 1); cz.rotation.y = -Math.PI / 2; cz.position.set(-2, 0, -40); cz.userData.cross = true; }

// distance: egg-carton ranges, layered cut-out hills, cut-out clouds on dowels, cut-out sun
const carton = (x, z, ry, cups = 6, R = 6) => {
  const g = grp(world, x, -1, z, ry);
  for (let i = 0; i < cups; i++) for (let j = 0; j < 2; j++) {
    const cx = (i - (cups - 1) / 2) * R * 2, cz = (j - 0.5) * R * 2;
    const dm = add(uvScale(new THREE.SphereGeometry(R, 20, 10, 0, Math.PI * 2, 0, Math.PI / 2), 3, 1.5), K.pulp, cx, 0, cz, g, { cast: false }); dm.scale.set(1, 1.25, 1);
    if (i < cups - 1) add(new THREE.ConeGeometry(R * 0.45, R * 1.9, 4), K.pulp, cx + R, R * 0.95, cz, g, { cast: false }).rotation.y = Math.PI / 4;
  }
  add(slabGeo(cups * R * 2 + 2, 1, R * 4 + 2, 6, 3), [K.edge, K.edge, K.pulp, K.pulp, K.edge, K.edge], 0, 0, 0, g, { cast: false });
};
carton(-210, 90, 0.9); carton(-190, -120, -0.7); carton(160, -190, 0.4); carton(230, 120, -0.9); carton(20, 230, 0.05); carton(-40, -235, 0.1);
const hillPts = (wd, ht, seed) => { const r = P.rng(seed), pts = [[wd / 2, -4]], n = 40; const k1 = 1 + r() * 2, k2 = 2 + r() * 3, p1 = r() * 6, p2 = r() * 6;
  for (let i = 0; i <= n; i++) { const t = i / n, x = wd / 2 - t * wd; pts.push([x, ht * (0.55 + 0.3 * Math.sin(t * Math.PI * k1 + p1) + 0.15 * Math.sin(t * Math.PI * 2 * k2 + p2)) * Math.min(1, Math.sin(t * Math.PI) * 2.5)]); }
  pts.push([-wd / 2, -4]); return pts; };
[[270, 0, 16, 40], [330, 1, 13, 55], [400, 3, 11, 75]].forEach(([R, mi, n, ht], ring) => {
  for (let i = 0; i < n; i++) {
    const a = (i + ring * 0.37) / n * Math.PI * 2, x = Math.cos(a) * R, z = Math.sin(a) * R, wd = 2 * Math.PI * R / n * 1.45;
    cutout(hillPts(wd, ht * (0.8 + ((i * 7) % 5) * 0.08), 900 + ring * 50 + i), 2.5, K.hill[(mi + i) % 2 ? mi : (mi + 2) % 4], world, x, -1, z, { tile: 12, fl: 6, cast: false }).rotation.y = Math.atan2(-x, -z);
  }
});
const clouds = [];
{ const r = P.rng(90);
  for (let i = 0; i < 12; i++) {
    const a = r() * Math.PI * 2, d = 230 + r() * 160, y = 70 + r() * 70, w = 45 + r() * 45, x = Math.cos(a) * d, z = Math.sin(a) * d;
    const g = grp(world, x, y, z, Math.atan2(-x, -z));
    cutout(C.puffShape(w, w * 0.42, 300 + i, 4 + (i % 3)), 2.4, K.cloud, g, 0, 0, 0, { tile: 18, fl: 6, cast: false });
    add(new THREE.CylinderGeometry(0.7, 0.7, y + 2, 6), K.stick, 0, -(y + 2) / 2, 0, g, { cast: false });
    clouds.push(g);
  } }
// the sun: a giant roll of yellow tape with card rays, hung on a string (the twist)
const ringGeo = (ro, ri, depth, n = 64, fl = FL) => {
  const sh = new THREE.Shape(), hole = new THREE.Path();
  for (let i = 0; i <= n; i++) { const a = i / n * Math.PI * 2; i ? sh.lineTo(Math.cos(a) * ro, Math.sin(a) * ro) : sh.moveTo(ro, 0); }
  for (let i = 0; i <= n; i++) { const a = -i / n * Math.PI * 2; i ? hole.lineTo(Math.cos(a) * ri, Math.sin(a) * ri) : hole.moveTo(ri, 0); }
  sh.holes.push(hole);
  const V = (x, y) => new THREE.Vector2(x, y);
  const g = new THREE.ExtrudeGeometry(sh, { depth, bevelEnabled: false, curveSegments: 1, UVGenerator: {
    generateTopUV: (geo, v, a, b, c) => [a, b, c].map((i) => V(v[i * 3] / (2 * ro) + 0.5, v[i * 3 + 1] / (2 * ro) + 0.5)),
    generateSideWallUV: (geo, v, a, b, c, d) => [a, b, c, d].map((i) => V((Math.atan2(v[i * 3 + 1], v[i * 3]) / (2 * Math.PI) + 0.5) * Math.round(2 * Math.PI * ro / (fl * 4)), v[i * 3 + 2] / depth)),
  } });
  g.translate(0, 0, -depth / 2); return g;
};
K.sunFace = cm(C.tapeFace(12 / 21), 1, 1, { emissive: new THREE.Color('#ff9d1a'), emissiveIntensity: 0.45 });
K.sunSide = cm(C.tapeSide(), 1, 1, { emissive: new THREE.Color('#ff9d1a'), emissiveIntensity: 0.35 });
K.sunRays = cm(C.painted(42, '#ffd23a'), 1, 1, { emissive: new THREE.Color('#ffb21a'), emissiveIntensity: 0.4 });
K.rollFace = cm(C.tapeFace(0.64 / 1.0, '#e4b25c', 8)); K.rollSide = cm(C.tapeSide('#dba552'));
for (const m of [K.sunFace, K.sunSide, K.sunRays]) m.fog = false;
const sunG = new THREE.Group(); scene.add(sunG);
{
  const pts = []; for (let i = 0; i < 36; i++) { const a = i / 36 * Math.PI * 2, rr = i % 2 ? 24 : 31; pts.push([Math.cos(a) * rr, Math.sin(a) * rr]); }
  const rays = new THREE.Shape(pts.map(([x, y]) => new THREE.Vector2(x, y))), hole = new THREE.Path(); hole.absarc(0, 0, 20, 0, Math.PI * 2, true); rays.holes.push(hole);
  const rg = new THREE.ExtrudeGeometry(rays, { depth: 1.6, bevelEnabled: false, curveSegments: 24 }); rg.translate(0, 0, -3.6); uvScale(rg, 1 / 16, 1 / 16);
  add(rg, [K.sunRays, K.edge], 0, 0, 0, sunG, { cast: false });
  add(ringGeo(21, 12, 8), [K.sunFace, K.sunSide], 0, 0, 0, sunG, { cast: false });
  add(ringGeo(12, 10.6, 8.6, 48, 4), [K.kraft, K.tube], 0, 0, 0, sunG, { cast: false });
  // loose tape end hanging off the roll
  const te = grp(sunG, 15.5, -14.5, 0);
  add(box(1.2, 16, 7.6), [K.sunSide, K.sunSide, K.sunSide, K.sunSide, K.sunFace, K.sunFace], 0.6, -8, 0, te, { cast: false }).rotation.z = 0.12;
  sunG.userData.te = te;
}
// the string the sun hangs on (+ the hook that is left when it is gone)
const strG = new THREE.Group(); scene.add(strG);
K.string = toon({ color: '#e8d2a8', emissive: new THREE.Color('#6a5a44') }); K.hook = toon({ color: '#d8d2c8', emissive: new THREE.Color('#7a7a92') });
add(new THREE.CylinderGeometry(0.35, 0.35, 900, 6), K.string, 0, 450 + 12, 0, strG, { cast: false });
{ const hk = add(new THREE.TorusGeometry(3.6, 0.8, 8, 20, Math.PI * 1.3), K.hook, 0, 12.0, 0, strG, { cast: false }); hk.rotation.z = Math.PI * 1.1; }
// giant tape roll prop (shot 3): core + tape body on a spinning group, tilt pivot at the contact point
const roll = grp(world, 0, 0, 0); roll.visible = false;
const rollTilt = grp(roll, 0, 0, 0), rollSpin = grp(rollTilt, 0, 0.64, 0);
add(ringGeo(0.64, 0.55, 0.62, 48, 0.6), [K.kraft, K.tube], 0, 0, 0, rollSpin);
let rollBody = null, rollR = -1;
const setRollR = (R) => { if (Math.abs(R - rollR) < 0.004) return; rollR = R; if (rollBody) { rollSpin.remove(rollBody); rollBody.geometry.dispose(); } if (R > 0.65) rollBody = add(ringGeo(R, 0.64, 0.6, 64, 0.6), [K.rollFace, K.rollSide], 0, 0, 0, rollSpin); else rollBody = null; };
const rollStripPiv = grp(roll, -4.2, 0.012, 0);
add(box(4.2, 0.02, 0.58), K.tape, 2.1, 0, 0, rollStripPiv, { cast: false });

window.CITY = { blds: blds.map((g) => ({ ...g.userData.o })), HALL, RIVER };

// ---------- cards ----------
const CW = 1200, CH = 2000, CM = 2.25; // canvas px, card height in metres (design 600x1000 -> 2.25 m)
const cardGeo = new THREE.PlaneGeometry(CM * 0.6, CM); cardGeo.translate(0, CM / 2 - CM * 0.025, 0);
const blobTex = P.tex(P.radial('20,14,30', 0.6));
const mkc = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return [c, c.getContext('2d')]; };
const SCR = mkc(CW, CH), HALFC = mkc(CW / 2, CH / 2), DIL = mkc(CW / 2, CH / 2);
const OFFS = []; for (const [R, n] of [[3, 8], [6, 12], [9, 16], [12, 20]]) for (let i = 0; i < n; i++) OFFS.push([Math.cos(i / n * 6.2832) * R, Math.sin(i / n * 6.2832) * R, R]);
const dilate = (src, R, col) => {
  const [dc, dg] = DIL; dg.globalCompositeOperation = 'source-over'; dg.clearRect(0, 0, CW / 2, CH / 2);
  dg.drawImage(src, 0, 0); for (const [ox, oy, rr] of OFFS) if (rr <= R) dg.drawImage(src, ox, oy);
  dg.globalCompositeOperation = 'source-in'; dg.fillStyle = col; dg.fillRect(0, 0, CW / 2, CH / 2); dg.globalCompositeOperation = 'source-over';
  return dc;
};
const BACKPICT = C.pictogram('up');
class Card {
  constructor(scale = 1) {
    [this.c, this.g] = mkc(CW, CH);
    this.t = new THREE.CanvasTexture(this.c); this.t.colorSpace = THREE.SRGBColorSpace; this.t.anisotropy = 4;
    this.mat = new THREE.MeshBasicMaterial({ map: this.t, transparent: true, alphaTest: 0.02, side: THREE.DoubleSide, fog: true });
    this.mesh = new THREE.Mesh(cardGeo, this.mat); this.mesh.userData.nd = cardNd(this.t); this.mesh.castShadow = true;
    this.mesh.customDepthMaterial = new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking, map: this.t, alphaTest: 0.5 });
    this.blob = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: blobTex, transparent: true, depthWrite: false, fog: true }));
    this.blob.rotation.x = -Math.PI / 2; this.blob.userData.ndSkip = true; this.blob.renderOrder = 1;
    scene.add(this.mesh); scene.add(this.blob); this.key = ''; this.mesh.visible = this.blob.visible = false;
  }
  /** cut = true: the figure becomes a die-cut cardboard standee (kraft border + dark cut edge) */
  draw(key, fn, cut) {
    key = key + '|' + cut; if (key === this.key) return; this.key = key;
    const g = this.g; g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, CW, CH);
    if (!cut) { g.setTransform(CW / 600, 0, 0, CH / 1000, 0, 0); fn(new T.Pen(g)); this.t.needsUpdate = true; return; }
    const [sc, sg] = SCR; sg.setTransform(1, 0, 0, 1, 0, 0); sg.clearRect(0, 0, CW, CH); sg.setTransform(CW / 600, 0, 0, CH / 1000, 0, 0);
    fn(new T.Pen(sg)); sg.setTransform(1, 0, 0, 1, 0, 0);
    const [hc, hg] = HALFC; hg.clearRect(0, 0, CW / 2, CH / 2); hg.drawImage(sc, 0, 0, CW / 2, CH / 2);
    g.drawImage(dilate(hc, 12, '#5e3c20'), 0, 0, CW, CH);
    g.drawImage(dilate(hc, 9, cut === 'back' ? '#c99a62' : '#d8b07a'), 0, 0, CW, CH);
    if (cut === 'back') { // the back of a standee: bare corrugated card with printed arrows
      g.save(); g.globalCompositeOperation = 'source-atop';
      for (let x = 0; x < CW; x += 26) { g.fillStyle = 'rgba(120,80,40,.12)'; g.fillRect(x, 0, 12, CH); }
      g.globalAlpha = 0.85; g.drawImage(BACKPICT, CW / 2 - 130, CH * 0.5, 260, 260); g.restore();
    } else g.drawImage(sc, 0, 0);
    this.t.needsUpdate = true;
  }
}
const cards = []; const getCard = (i) => cards[i] || (cards[i] = new Card());

// ---------- render targets & post ----------
const rtColor = new THREE.WebGLRenderTarget(W, H, { samples: 4, type: THREE.HalfFloatType });
const rtNd = new THREE.WebGLRenderTarget(W, H, { type: THREE.HalfFloatType, minFilter: THREE.NearestFilter, magFilter: THREE.NearestFilter });
const rtInk = new THREE.WebGLRenderTarget(W, H, { type: THREE.HalfFloatType });
const fsCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1), fsGeo = new THREE.PlaneGeometry(2, 2);
const fs = (mat) => { const s = new THREE.Scene(); s.add(new THREE.Mesh(fsGeo, mat)); return s; };
const inkU = { col: { value: rtColor.texture }, nd: { value: rtNd.texture }, res: { value: new THREE.Vector2(W, H) }, px: { value: 1.6 }, fogCol: { value: new THREE.Color() },
  sat: { value: 1.08 }, lift: { value: new THREE.Color(0, 0, 0) }, gain: { value: new THREE.Color(1, 1, 1) }, vig: { value: 0.22 }, flash: { value: 0 } };
const inkScene = fs(new THREE.ShaderMaterial({ uniforms: inkU, vertexShader: `varying vec2 vUv; void main(){ vUv=uv; gl_Position=vec4(position.xy,0.,1.); }`,
  fragmentShader: `uniform sampler2D col, nd; uniform vec2 res; uniform float px, sat, vig, flash; uniform vec3 fogCol, lift, gain; varying vec2 vUv;
  float edgeAt(vec2 uv, float r){
    vec4 c = texture2D(nd, uv); if (dot(c.rgb,c.rgb) < .01) return 0.; float d = c.a; vec3 n = c.rgb*2.-1.;
    float e = 0.; float rr = r * clamp(7./d, .62, 1.25);
    for (int i=0;i<16;i++){ float a = float(i)*.785398 + (i>7 ? .39 : 0.); float k = i>7 ? .5 : 1.;
      vec2 o = vec2(cos(a), sin(a))*rr*k/res; vec4 s = texture2D(nd, uv+o);
      float ds = s.a; bool card = dot(s.rgb,s.rgb) < .01;
      if (card && ds > 0.) continue;            // character cards: never outlined by the world ink
      if (card) ds = 1e4;                        // sky
      vec3 ns = s.rgb*2.-1.;
      e = max(e, smoothstep(.006, .02, (ds - d)/d));                           // depth jump, near side only
      if (!card && abs(ds-d)/d < .06) e = max(e, smoothstep(.88, .72, dot(n, ns)) * .9); // crease
    }
    return e * (1. - smoothstep(140., 520., d)*.8);
  }
  void main(){
    vec3 c = texture2D(col, vUv).rgb;
    float e = edgeAt(vUv, px);
    c = mix(c, vec3(.012,.01,.014), e);
    if (flash < -0.5) c = vec3(e);
    float l = dot(c, vec3(.299,.587,.114)); c = mix(vec3(l), c, sat);
    c = c*gain + lift;
    vec2 q = vUv-.5; c *= 1. - vig*dot(q*vec2(1.,.75), q*vec2(1.,.75))*2.2;
    c = mix(c, vec3(1.), flash);
    gl_FragColor = vec4(c,1.); }` }));
const dofU = { src: { value: rtInk.texture }, nd: { value: rtNd.texture }, res: { value: new THREE.Vector2(W, H) }, focus: { value: 5 }, cinf: { value: 0 }, near: { value: 1 } };
const dofScene = fs(new THREE.ShaderMaterial({ uniforms: dofU, vertexShader: `varying vec2 vUv; void main(){ vUv=uv; gl_Position=vec4(position.xy,0.,1.); }`,
  fragmentShader: `uniform sampler2D src, nd; uniform vec2 res; uniform float focus, cinf, near; varying vec2 vUv;
  float coc(vec2 uv){ float d = texture2D(nd, uv).a; if (d <= 0.) d = 2000.; float k = 1. - focus/d; return k > 0. ? cinf*k : min(-k*cinf*near, cinf*1.4); }
  void main(){
    float c0 = coc(vUv);
    if (cinf < .5 || c0 < .6) { gl_FragColor = linearToOutputTexel(vec4(texture2D(src, vUv).rgb, 1.)); return; }
    vec3 acc = vec3(0.); float wsum = 0.;
    for (int i=0;i<48;i++){ float fi = float(i); float r = sqrt((fi+.5)/48.); float a = fi*2.39996;
      vec2 o = vec2(cos(a), sin(a))*r*c0/res; float cs = coc(vUv+o);
      float w = smoothstep(r*c0-1.5, r*c0+.5, cs + .5);
      acc += texture2D(src, vUv+o).rgb*w; wsum += w; }
    gl_FragColor = linearToOutputTexel(vec4(acc/max(wsum,1e-3), 1.)); }` }));
dofScene.children[0].material.toneMapped = false;

// ---------- per-frame state ----------
const tmpV = new THREE.Vector3();
function applyLight(L, f) {
  hemi.color.set(L.sky); hemi.groundColor.set(L.ground); hemi.intensity = L.hemi;
  sun.color.set(L.sun); sun.intensity = L.sunI;
  scene.fog.color.set(L.fog); scene.fog.near = L.fogNear; scene.fog.far = L.fogFar;
  skyU.top.value.set(L.skyTop); skyU.hor.value.set(L.skyHor); skyU.sunCol.value.set(L.sunDisc || '#000'); skyU.sunSize.value = L.sunSize || 0;
  inkU.sat.value = L.sat; inkU.gain.value.set(L.gain || '#ffffff'); inkU.lift.value.set(L.lift || '#000000');
  K.lampHead.emissive.set('#ffc640').multiplyScalar(L.lamp || 0);
}
function placeSun(L, focus) {
  const az = rx(L.az), el = rx(L.el); tmpV.set(Math.cos(el) * Math.cos(az), Math.sin(el), Math.cos(el) * Math.sin(az));
  skyU.sunDir.value.copy(tmpV);
  sun.position.copy(focus).addScaledVector(tmpV, 80); sun.target.position.copy(focus);
  const ext = L.shadowExt || 30, sc = sun.shadow.camera; sc.left = -ext; sc.right = ext; sc.top = ext; sc.bottom = -ext; sc.near = 1; sc.far = 220; sc.updateProjectionMatrix();
}

const cl01 = (x) => Math.max(0, Math.min(1, x));
const HALF_PI = Math.PI / 2;
/** per-building progress of a wave that spreads from origin o at perM frames per metre */
const waveK = (Wv, g, f) => { if (!Wv) return 0; const d = Math.hypot(g.position.x - Wv.o[0], g.position.z - Wv.o[1]); return cl01((f - Wv.f0 - d * Wv.perM) / Wv.dur); };
function worldState(W_, f) {
  const t = f / 30;
  // cars drive along the main street and loop (or stand still once the city falls apart)
  for (const [ci, c] of cars.entries()) {
    const u = c.userData;
    if (W_.carsAway) { c.visible = false; continue; } c.visible = true;
    if (u.cross) { c.position.z = -40 + ((t * 5) % 80); continue; }
    let x = u.x0 + u.speed * t; const span = 100; x = ((x + 55) % span + span) % span - 55;
    if (W_.carX && W_.carX[ci] !== undefined) x = W_.carX[ci];
    c.position.x = x; c.position.y = Math.abs(Math.sin(t * 9 + u.x0)) * 0.03; // bumpy card wheels
  }
  for (const b of bunting) b.rotation.z = 0.22 * Math.sin(t * 2.6 + b.userData.ph);
  for (const p of puffs) { const k = p.userData.k, i = p.userData.i; p.position.y = p.userData.y0 + 0.25 * Math.sin(t * 1.8 + k * 1.3 + i); p.rotation.y = 0.25 * Math.sin(t * 0.9 + k + i * 2); p.rotation.z = 0.06 * Math.sin(t * 1.4 + k * 2 + i); }
  for (const tr of trees) tr.rotation.z = 0.012 * Math.sin(t * 1.3 + tr.position.x * 0.3);
  const fl = hall.userData.flag; fl.rotation.y = 0.25 * Math.sin(t * 2.2); fl.rotation.z = 0.05 * Math.sin(t * 3.1);
  K.river.map.offset.y = -t * 0.06;
  for (const c of clouds) c.rotation.z = 0.02 * Math.sin(t * 0.5 + c.position.x);
  // boxes: lids pop open (wave), then close again with an X of fresh tape (glue wave)
  for (const g of blds) {
    const o = g.userData.o; if (o.top === 'roof') continue;
    const isHall = !!o.hall, H = W_.hall || {};
    const pk = isHall ? (H.lid ?? 0) : waveK(W_.pop, g, f), ck = isHall ? (H.close ?? 0) : waveK(W_.glue, g, f);
    const openE = (pk > 0 ? EZ.back(pk, 2.2) : 0) * (1 - EZ.smooth(ck));
    for (const L of g.userData.lids) L.hg.rotation.x = -HALF_PI + (HALF_PI + L.open) * openE + (pk > 0 && pk < 1 ? 0 : 0);
    for (const F of g.userData.flaps) { const wob = pk > 0 ? 0.35 * Math.sin(t * 9 + F.ph) * Math.exp(-(f - (W_.pop ? W_.pop.f0 : 0)) / 40) * (1 - ck) : 0; F.hg.rotation.x = (F.a0 + wob) * (1 - EZ.smooth(ck)) + (-HALF_PI + 0.04) * EZ.smooth(ck); }
    const tp = g.userData.tape;
    if (tp) {
      const peel = isHall ? (H.peel ?? 0) : (pk > 0 ? 1.5 : 0);
      tp.piv.rotation.set(0, 0, 0); tp.piv.position.y = o.h + T_ / 2 + 0.015; tp.piv.visible = peel < 1.45;
      if (peel > 0) { const e = EZ.easeOut(Math.min(1, peel)); tp.piv.rotation.z = 1.25 * e; if (peel > 1) { const k = peel - 1; tp.piv.position.y += k * 14; tp.piv.rotation.z += k * 4; tp.piv.rotation.x = k * 2.5; } }
      for (const m of tp.sides) m.visible = peel <= 0;
    }
    if (g.userData.xtape) { const xk = cl01((ck - 0.55) / 0.3); g.userData.xtape.visible = xk > 0; const sc = 0.2 + 0.8 * EZ.back(xk, 2.5); g.userData.xtape.scale.set(sc, 1, sc); }
  }
  // the clock tower rides the back lid flap of the town hall
  { const H = W_.hall || {}, pk = H.lid ?? 0, ck = H.close ?? 0; const openE = (pk > 0 ? EZ.back(pk, 2.2) : 0) * (1 - EZ.smooth(ck)); hall.userData.tpiv.rotation.x = -(HALF_PI + 0.55) * openE; }
  // bridge folds like a card
  for (const h of bridgeHalves) h.hg.rotation.z = h.s * (W_.bridgeFold || 0) * 1.22;
  // giant tape roll prop
  const R = W_.roll; roll.visible = !!R;
  if (R) {
    roll.position.set(...R.pos); setRollR(R.R); rollSpin.rotation.z = R.spin; rollSpin.position.y = Math.max(R.R, 0.64);
    rollTilt.rotation.set(R.tiltX || 0, R.tiltY || 0, 0); rollStripPiv.rotation.z = -(R.endLift || 0);
    rollStripPiv.visible = R.strip !== false;
  }
  // sun (tape roll on a string) + the string
  const SN = W_.sun || { pos: [-300, 62, 0] };
  sunG.visible = SN.visible !== false; sunG.position.set(SN.pos[0], SN.pos[1] - (SN.drop || 0), SN.pos[2]); sunG.lookAt(0, SN.pos[1] * 0.4, 0);
  sunG.rotation.z += 0.03 * Math.sin(t * 0.7); sunG.userData.te.rotation.z = 0.08 * Math.sin(t * 1.3);
  strG.position.set(SN.pos[0] + (SN.swing || 0), SN.pos[1] - (SN.drop || 0), SN.pos[2] + (SN.swingZ || 0)); strG.rotation.z = (SN.tilt || 0);
}

function drawActors(list, cam) {
  cards.forEach((c) => { c.mesh.visible = c.blob.visible = false; });
  list.forEach((a, i) => {
    const c = getCard(i);
    c.draw(a.key, a.draw, a.cut === undefined ? true : a.cut);
    c.mesh.visible = true; c.mesh.position.set(a.x, a.y, a.z);
    const s = a.s || 1; c.mesh.scale.set(s * (a.flip ? -1 : 1), s, s);
    c.mesh.rotation.set(0, Math.atan2(cam.position.x - a.x, cam.position.z - a.z) + (a.yaw || 0), a.roll || 0);
    c.mat.color.set(a.tint || '#ffffff'); c.mat.opacity = a.alpha ?? 1;
    c.mesh.castShadow = a.shadow !== false;
    c.mesh.renderOrder = a.order || 2;
    const gy = a.ground ?? a.y;
    if (a.blob !== false && a.y < gy + 0.5) { c.blob.visible = true; c.blob.position.set(a.x, gy + 0.02, a.z); c.blob.scale.set(0.95 * s, 0.6 * s, 1); }
  });
}

const swapForNd = (on) => {
  scene.traverse((o) => {
    if (!o.isMesh) return;
    if (on) {
      o.userData.mat0 = o.material;
      if (o.userData.ndSkip) { o.userData.vis0 = o.visible; o.visible = false; return; }
      if (o === sky || o.userData.sky) { o.userData.vis0 = o.visible; o.visible = false; return; }
      o.material = o.userData.nd || ndMat;
    } else {
      o.material = o.userData.mat0; if (o.userData.vis0 !== undefined) { o.visible = o.userData.vis0; delete o.userData.vis0; }
    }
  });
};

window.renderFrame = (f) => {
  const S = shotAt(f), L = lightFor(S, f), Cm = camAt(f);
  applyLight(L, f);
  camera.position.set(...Cm.pos); camera.up.set(0, 1, 0); camera.lookAt(...Cm.look); camera.rotateZ(rx(Cm.roll || 0));
  camera.fov = Cm.fov; camera.updateProjectionMatrix(); camera.updateMatrixWorld();
  const W_ = worldAt(f); worldState(W_, f);
  placeSun(L, new THREE.Vector3(...(Cm.shadowAt || Cm.look)));
  drawActors([...actorsAt(f, T), ...fxAt(f, T)], camera);
  sky.position.copy(camera.position);
  // pass A: colour
  renderer.setRenderTarget(rtColor); renderer.setClearColor(0x000000, 1); renderer.clear(); renderer.render(scene, camera);
  // pass B: normal + depth
  const fog = scene.fog; scene.fog = null; const sm = renderer.shadowMap.enabled; renderer.shadowMap.enabled = false; renderer.shadowMap.autoUpdate = false;
  swapForNd(true); renderer.setRenderTarget(rtNd); renderer.setClearColor(0x000000, 0); renderer.clear(); renderer.render(scene, camera); swapForNd(false);
  scene.fog = fog; renderer.shadowMap.enabled = sm; renderer.shadowMap.autoUpdate = true;
  if (window.DEBUG_ND) { const dm = new THREE.MeshBasicMaterial({ map: rtNd.texture }); const ds = fs(dm); renderer.setRenderTarget(null); renderer.render(ds, fsCam); return true; }
  // ink + grade
  const D = dofAt(f);
  inkU.px.value = 2.5; inkU.flash.value = window.DEBUG_E ? -1 : (Cm.flash || 0); inkU.vig.value = L.vig ?? 0.22;
  renderer.setRenderTarget(rtInk); renderer.render(inkScene, fsCam);
  // lens
  dofU.focus.value = D.focus; dofU.cinf.value = D.cinf; dofU.near.value = D.near ?? 1;
  renderer.setRenderTarget(null); renderer.render(dofScene, fsCam);
  return true;
};
window.TOTAL = TOTAL;
window.ready = true;

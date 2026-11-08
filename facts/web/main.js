import * as THREE from './lib/three.module.js';
import * as T from './toon.js';
import * as P from './paint.js';
import * as C from './cardpaint.js';
import * as SP from './stagepaint.js';
import * as PR from './props.js';
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


// ---------- stages: one cardboard diorama per fact, spread along x ----------
const V3 = (x, y, z) => new THREE.Vector3(x, y, z);
const ST = { room: 0, ocean: 300, hill: 600, space: 900, lab: 1200, planet: 1500, savanna: 1800 };
const pt = (seed, col) => cm(C.painted(seed, col));
const SM = {
  floor: cm(SP.tiles(201, '#c98b55', 4)), wall: pt(202, '#b9a3e3'), wallMint: pt(203, '#a8dcc2'), sand: cm(SP.speckled(204, '#e6cc8a')),
  seaBack: toon({ map: P.tex(SP.seaBack()), emissive: new THREE.Color('#2a6fa8'), emissiveIntensity: 0.25 }),
  stars: new THREE.MeshBasicMaterial({ map: P.tex(SP.starfield(), 3, 2), fog: false }),
  sunBall: toon({ map: P.tex(SP.sunTex()), emissive: new THREE.Color('#ffb020'), emissiveIntensity: 0.9 }),
  earth: toon({ map: P.tex(SP.earthTex()), emissive: new THREE.Color('#123a6a'), emissiveIntensity: 0.35 }),
  neptune: toon({ map: P.tex(SP.bandPlanet(['#2f4fc0', '#3a62d6', '#2440a8', '#4a74e0'], 3, 2)), emissive: new THREE.Color('#0c1c60'), emissiveIntensity: 0.4 }),
  uranus: toon({ map: P.tex(SP.bandPlanet(['#7fd9e0', '#94e3e6', '#6ccbd6'], 6)), emissive: new THREE.Color('#1c5a66'), emissiveIntensity: 0.4 }),
  beam: toon({ color: '#fff3a0', emissive: new THREE.Color('#ffd24a'), emissiveIntensity: 1.0 }),
  ringU: toon({ color: '#c9f0f2', emissive: new THREE.Color('#3a7a80'), emissiveIntensity: 0.3, side: THREE.DoubleSide }),
  purple: cm(SP.speckled(205, '#5d6fd8')), crater: pt(206, '#4a5cc0'), savanna: cm(SP.speckled(207, '#d9c27a')), lab: cm(SP.tiles(208, '#9fb4c8', 4)),
  mustard: pt(209, '#f2c14a'), navy: pt(210, '#2e3a5c'), brass: toon({ color: '#d9a845' }), rug: cm(SP.rug()), coral: pt(211, '#f08a6c'), pink: pt(212, '#f2a0c8'),
  seaweed: pt(213, '#3f9a55'), glass: toon({ color: '#d6f2ff' }), liqA: toon({ color: '#7cc36a', emissive: new THREE.Color('#2a6a20'), emissiveIntensity: 0.4 }),
  liqB: toon({ color: '#e86a8a', emissive: new THREE.Color('#6a1a30'), emissiveIntensity: 0.4 }), liqC: toon({ color: '#4f9be0', emissive: new THREE.Color('#123a6a'), emissiveIntensity: 0.4 }),
  picture: decalMat(SP.picture()), bright: new THREE.MeshBasicMaterial({ map: P.tex(SP.bright()) }),
  diamond: [toon({ color: '#e8fbff', emissive: new THREE.Color('#5fb8d8'), emissiveIntensity: 0.35 }), toon({ color: '#ffd6f0', emissive: new THREE.Color('#c05a9a'), emissiveIntensity: 0.3 }), toon({ color: '#fff4c2', emissive: new THREE.Color('#c0a040'), emissiveIntensity: 0.3 })],
};
const stageBase = (x, w, d, top, tile = 3) => slab(w, 1.2, d, top, world, x, -0.6, 0, { tile, fl: 1.8, cast: false });
const hillRing = (cx, cz, R, n, ht, mats, seed) => { for (let i = 0; i < n; i++) { const a = i / n * Math.PI * 2, x = cx + Math.cos(a) * R, z = cz + Math.sin(a) * R, wd = 2 * Math.PI * R / n * 1.5; const r = P.rng(seed + i);
  const pts = [[wd / 2, -2]]; for (let k = 0; k <= 30; k++) { const t = k / 30; pts.push([wd / 2 - t * wd, ht * (0.55 + 0.3 * Math.sin(t * 6 + seed + i) + 0.15 * Math.sin(t * 17 + i)) * Math.min(1, Math.sin(t * Math.PI) * 2.5)]); } pts.push([-wd / 2, -2]);
  cutout(pts, 1.5, mats[i % mats.length], world, x, -1, z, { tile: 8, fl: 3, cast: false }).rotation.y = Math.atan2(cx - x, cz - z); } };
const cloudCut = (x, y, z, w, seed) => { const g = grp(world, x, y, z); cutout(C.puffShape(w, w * 0.42, seed, 4), 0.8, K.cloud, g, 0, 0, 0, { tile: 8, fl: 3, cast: false }); add(new THREE.CylinderGeometry(0.15, 0.15, y + 1, 6), K.stick, 0, -(y + 1) / 2, 0, g, { cast: false }); return g; };
const sunburst = (parent, x, y, z, R = 6) => { const g = grp(parent, x, y, z); const pts = []; for (let i = 0; i < 32; i++) { const a = i / 32 * Math.PI * 2, rr = i % 2 ? R * 0.8 : R * 1.05; pts.push([Math.cos(a) * rr, Math.sin(a) * rr]); }
  cutout(pts, 0.5, K.sun, g, 0, 0, 0, { tile: 6, cast: false }); const d = []; for (let i = 0; i < 40; i++) { const a = i / 40 * Math.PI * 2; d.push([Math.cos(a) * R * 0.66, Math.sin(a) * R * 0.66]); } cutout(d, 0.8, K.sun, g, 0, 0, 0.2, { tile: 6, cast: false }); return g; };
const STAGE = {};

// ROOM: floor, lilac walls, window, picture, door (opens in the finale), chair, lamp, rug
{
  const X = ST.room, g = grp(world, X, 0, 0);
  stageBase(X, 16, 14, SM.floor, 2);
  sheet(16, 7.5, 0.22, SM.wall, K.inside, g, 0, 3.75, -4.5, { tu: 3 });
  const lw = grp(g, -6.5, 0, 0, Math.PI / 2); sheet(10, 7.5, 0.22, SM.wall, K.inside, lw, 0, 3.75, 0, { tu: 3 });
  decal(PM('lilac', 3).facade, 3, 3, 3.2, 3.6, -4.38, g);
  decal(SM.picture, 1.3, 1.6, 0.4, 3.9, -4.38, g);
  decal(SM.bright, 1.6, 2.8, -3.2, 1.4, -4.385, g); const hole = decal(K.dark, 1.6, 2.8, -3.2, 1.4, -4.38, g);
  const dh = grp(g, -4.0, 0, -4.33); sheet(1.6, 2.8, 0.08, PM('lilac', 0).door, K.inside, dh, 0.8, 1.4, 0, { tu: 1.6, tv: 2.8 });
  const doorLight = new THREE.PointLight('#ffd890', 0, 18); doorLight.position.set(X - 3.2, 1.6, -3.4); scene.add(doorLight);
  STAGE.room = { door: dh, hole, doorLight };
  slab(5, 0.04, 3.4, SM.rug, g, 0.2, 0.02, -0.6, { tile: 5, cast: false });
  const ch = grp(g, 0.2, 0, -1.6); slab(1.5, 0.14, 1.3, SM.mustard, ch, 0, 0.95, 0);
  for (const sx of [-0.62, 0.62]) for (const sz of [-0.5, 0.5]) sheet(0.12, 0.9, 0.12, SM.mustard, SM.mustard, ch, sx, 0.45, sz, { side: K.edge });
  sheet(1.5, 1.4, 0.12, SM.mustard, SM.mustard, ch, 0, 1.7, -0.6);
  const lp = grp(g, 3.6, 0, -3.2); add(uvScale(new THREE.CylinderGeometry(0.06, 0.08, 3.2, 8), 0.3, 1), K.tube, 0, 1.6, 0, lp); add(new THREE.CylinderGeometry(0.35, 0.6, 0.6, 16, 1, true), K.lampHead, 0, 3.3, 0, lp);
}
// OCEAN: sand bed, painted water backdrop, seaweed + coral cut-outs, rocks, wave layers overhead
{
  const X = ST.ocean, g = grp(world, X, 0, 0); STAGE.weeds = [];
  stageBase(X, 70, 50, SM.sand, 4);
  const bk = add(new THREE.PlaneGeometry(90, 50), SM.seaBack, X, 18, -22, world, { cast: false }); bk.receiveShadow = false;
  const r = P.rng(31);
  for (let i = 0; i < 22; i++) { let x = (r() - 0.5) * 40; if (Math.abs(x) < 4) x += Math.sign(x || 1) * 5; const z = -18 + r() * 11, h = 2 + r() * 4.5, pts = [];
    for (let k = 0; k <= 10; k++) pts.push([0.35 * Math.sin(k * 1.1) + 0.22, k / 10 * h]); for (let k = 10; k >= 0; k--) pts.push([0.35 * Math.sin(k * 1.1) - 0.22, k / 10 * h]);
    const w = grp(g, x, 0, z, r() * 0.8 - 0.4); cutout(pts, 0.1, SM.seaweed, w, 0, 0, 0, { tile: 2 }); w.userData.ph = r() * 6; STAGE.weeds.push(w); }
  for (let i = 0; i < 9; i++) { const x = (r() - 0.5) * 34, z = -14 + r() * 14; add(new THREE.SphereGeometry(0.6 + r() * 1.1, 10, 8), K.pulp, x, 0, z, g).scale.y = 0.6; }
  for (let i = 0; i < 8; i++) { const x = (r() - 0.5) * 30, z = -16 + r() * 8, h = 1.2 + r() * 1.5, pts = []; for (let k = 0; k < 9; k++) { const a = k / 8 * Math.PI, rr = k % 2 ? h * 0.45 : h; pts.push([Math.cos(a) * rr * 0.8, Math.sin(a) * rr]); } cutout(pts, 0.12, i % 2 ? SM.coral : SM.pink, g, x, 0, z, { tile: 2 }); }
  for (const [y, z, c] of [[13, -6, '#5fb8e8'], [14, -2, '#8fd3f2']]) { const pts = [[-50, 0]]; for (let k = 0; k <= 40; k++) pts.push([-50 + k * 2.5, 0.6 * Math.sin(k * 1.2)]); pts.push([50, 3], [-50, 3]); cutout(pts, 0.3, pt(220 + y, c), g, 0, y, z, { tile: 4, cast: false }); }
}
// HILL: grassy hill, telescope on a tripod, cut-out sun on a stick, cut-out hills + clouds
{
  const X = ST.hill, g = grp(world, X, 0, 0);
  stageBase(X, 70, 60, K.lawn, 4);
  add(new THREE.SphereGeometry(14, 32, 12, 0, Math.PI * 2, 0, Math.PI / 2), K.lawn, X, -11.5, -2, world, { cast: false }).scale.y = 0.9;
  hillRing(X, 0, 55, 10, 18, K.hill, 600); hillRing(X, 0, 75, 10, 28, [K.hill[3], K.hill[1]], 640);
  for (const [x, y, z, w, s] of [[-18, 22, -40, 16, 1], [12, 26, -46, 20, 2], [28, 18, -30, 12, 3]]) cloudCut(X + x, y, z, w, s);
  const sg = sunburst(world, X - 9, 20, -38, 6); add(new THREE.CylinderGeometry(0.15, 0.15, 21, 6), K.stick, 0, -10.5, -0.5, sg); STAGE.hillSun = sg;
  const tg = grp(world, X + 0.4, 1.0, 0.2); for (let k = 0; k < 3; k++) { const a = k / 3 * Math.PI * 2, l = add(new THREE.CylinderGeometry(0.05, 0.05, 1.8, 6), K.tube, Math.cos(a) * 0.35, 0.75, Math.sin(a) * 0.35, tg); l.rotation.z = -Math.cos(a) * 0.25; l.rotation.x = Math.sin(a) * 0.25; }
  const tube = grp(tg, 0, 1.65, 0); tube.lookAt(V3(X - 9, 20, -38)); const tb = add(new THREE.CylinderGeometry(0.16, 0.24, 1.9, 16), SM.navy, 0, 0, 0, tube); tb.rotation.x = Math.PI / 2;
  for (const z of [-0.8, 0.8]) { const rg = add(new THREE.TorusGeometry(0.2 + (z > 0 ? 0.04 : 0), 0.04, 6, 16), SM.brass, 0, 0, z * 0.9, tube); }
  STAGE.telescope = tg;
}
// SPACE: starfield backdrop, Sun + Earth on sticks (light beam between), Neptune + Uranus further along
{
  const X = ST.space;
  const bk = add(new THREE.PlaneGeometry(600, 360), SM.stars, X, 40, -140, world, { cast: false }); bk.userData.ndSkip = true;
  const sun = add(new THREE.SphereGeometry(8, 40, 24), SM.sunBall, X - 4, 20, -26, world, { cast: false });
  sunburst(world, X - 4, 20, -26.6, 11);
  const earth = add(new THREE.SphereGeometry(2.2, 32, 20), SM.earth, X + 4, -4, -18, world, { cast: false });
  for (const [x, y, z] of [[X - 4, 20 - 8, -26.8], [X + 4, -4 - 2.2, -18]]) add(new THREE.CylinderGeometry(0.2, 0.2, 40, 6), K.stick, x, y - 20, z, world, { cast: false });
  const bp = grp(world, X - 4, 20, -26); bp.lookAt(V3(X + 4, -4, -18)); const beam = add(new THREE.CylinderGeometry(0.45, 0.45, 1, 10), SM.beam, 0, 0, 0.5, bp, { cast: false }); beam.rotation.x = Math.PI / 2; bp.userData.len = V3(X - 4, 20, -26).distanceTo(V3(X + 4, -4, -18)) - 2.2;
  STAGE.beam = bp; STAGE.earth = earth;
  const nep = add(new THREE.SphereGeometry(7, 40, 24), SM.neptune, X + 76, 15, -30, world, { cast: false });
  const ura = add(new THREE.SphereGeometry(5.5, 40, 24), SM.uranus, X + 83, -2, -22, world, { cast: false });
  const ring = add(new THREE.RingGeometry(7, 9.5, 48), SM.ringU, X + 83, -2, -22, world, { cast: false }); ring.rotation.set(1.2, 0.3, 0.2);
  for (const [x, y, z, r_] of [[X + 76, 15, -30.5, 7], [X + 83, -2, -22.6, 5.5]]) add(new THREE.CylinderGeometry(0.2, 0.2, 40, 6), K.stick, x, y - r_ - 20, z, world, { cast: false });
  STAGE.planets = [nep, ura];
  slab(220, 1, 120, K.inside, world, X + 40, -18, -20, { tile: 8, cast: false });
}
// LAB: tiled floor, mint wall, shelves with flasks, a big table
{
  const X = ST.lab, g = grp(world, X, 0, 0); STAGE.flasks = [];
  stageBase(X, 18, 14, SM.lab, 2);
  sheet(18, 8, 0.22, SM.wallMint, K.inside, g, 0, 4, -4.5, { tu: 3 });
  const lw = grp(g, -7, 0, 0, Math.PI / 2); sheet(10, 8, 0.22, SM.wallMint, K.inside, lw, 0, 4, 0, { tu: 3 });
  for (const y of [3.2, 4.8]) slab(9, 0.14, 0.9, K.kraft, g, 1.5, y, -3.9);
  const r = P.rng(41);
  for (let i = 0; i < 12; i++) { const y = i < 6 ? 3.27 : 4.87, x = -2.4 + (i % 6) * 1.5 + r() * 0.3, h = 0.5 + r() * 0.5, rad = 0.16 + r() * 0.14;
    const fg = grp(g, x, y, -3.9); add(new THREE.CylinderGeometry(rad, rad * (i % 3 ? 1 : 1.8), h, 14), SM.glass, 0, h / 2, 0, fg); add(new THREE.CylinderGeometry(rad * 0.92, rad * (i % 3 ? 0.92 : 1.7), h * 0.55, 14), [SM.liqA, SM.liqB, SM.liqC][i % 3], 0, h * 0.28, 0, fg); STAGE.flasks.push(fg); }
  const tg = grp(g, -2.5, 0, -2.2); slab(4.5, 0.16, 1.6, K.kraft, tg, 0, 1.25, 0); for (const sx of [-2, 2]) for (const sz of [-0.65, 0.65]) sheet(0.14, 1.2, 0.14, K.kraft, K.kraft, tg, sx, 0.6, sz, { side: K.edge });
  for (let i = 0; i < 3; i++) { const fg = grp(tg, -1.4 + i * 1.3, 1.33, 0); add(new THREE.SphereGeometry(0.3, 16, 12), SM.glass, 0, 0.3, 0, fg); add(new THREE.CylinderGeometry(0.08, 0.08, 0.5, 8), SM.glass, 0, 0.75, 0, fg); add(new THREE.SphereGeometry(0.26, 16, 12, 0, 6.3, 1.4, 1.7), [SM.liqB, SM.liqC, SM.liqA][i], 0, 0.3, 0, fg); }
}
// PLANET (Neptune): blue ground with craters, Uranus in the sky, diamonds that fall
{
  const X = ST.planet;
  stageBase(X, 90, 70, SM.purple, 4);
  const r = P.rng(51);
  for (let i = 0; i < 14; i++) { const x = X + (r() - 0.5) * 60, z = -6 - r() * 30, rr = 1.5 + r() * 4; add(new THREE.SphereGeometry(rr, 20, 8, 0, Math.PI * 2, 0, Math.PI / 2), SM.crater, x, -0.2, z, world, { cast: false }).scale.y = 0.35; }
  hillRing(X, 0, 60, 10, 16, [pt(230, '#3f4fb0'), pt(231, '#4a62c8')], 700);
  const ura = add(new THREE.SphereGeometry(12, 40, 24), SM.uranus, X + 22, 42, -110, world, { cast: false }); const ring = add(new THREE.RingGeometry(15, 20, 48), SM.ringU, X + 22, 42, -110, world, { cast: false }); ring.rotation.set(1.2, 0.3, 0.3);
  STAGE.diamonds = []; const geo = new THREE.OctahedronGeometry(1, 0);
  for (let i = 0; i < 90; i++) { const m = add(geo, SM.diamond[i % 3], 0, -50, 0, world); m.scale.set(1, 1.35, 1); m.userData = { x: X + (r() - 0.5) * 16, z: -7 + r() * 9, s: 0.18 + r() * 0.32, t0: r(), spin: r() * 6, y0: 18 + r() * 10 }; STAGE.diamonds.push(m); }
}
// SAVANNA: warm ground, acacia cut-outs, hills, sun
{
  const X = ST.savanna;
  stageBase(X, 90, 70, SM.savanna, 4);
  hillRing(X, 0, 60, 10, 14, [pt(240, '#c9a85a'), pt(241, '#b5944a')], 800);
  const r = P.rng(61);
  for (let i = 0; i < 6; i++) { const x = X + (i % 2 ? 1 : -1) * (8 + r() * 14), z = -10 - r() * 20, h = 4 + r() * 2; const g = grp(world, x, 0, z, r() * 0.6 - 0.3);
    cutout([[-0.2, 0], [0.2, 0], [0.25, h], [-0.25, h]], 0.14, K.bark, g, 0, 0, 0, { tile: 1 }); const pts = []; for (let k = 0; k < 30; k++) { const a = k / 30 * Math.PI * 2; pts.push([Math.cos(a) * h * 0.7 * (1 + 0.08 * Math.sin(a * 6)), h + Math.sin(a) * h * 0.18]); } cutout(pts, 0.14, K.leaves[1], g, 0, 0, 0, { tile: 2 }); }
  sunburst(world, X + 14, 24, -50, 5.5);
}

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
  for (const w of STAGE.weeds) w.rotation.z = 0.12 * Math.sin(t * 1.6 + w.userData.ph);
  STAGE.room.door.rotation.y = -(W_.door || 0) * 1.6; STAGE.room.hole.visible = (W_.door || 0) < 0.02; STAGE.room.doorLight.intensity = (W_.door || 0) * 10;
  const bl = W_.beam ?? 0; STAGE.beam.visible = bl > 0.001; STAGE.beam.scale.set(1, 1, Math.max(0.001, bl * STAGE.beam.userData.len)); STAGE.beam.children[0].position.z = 0.5 + 10.5 / Math.max(0.001, bl * STAGE.beam.userData.len) * 0;
  STAGE.earth.rotation.y = t * 0.4; for (const p of STAGE.planets) p.rotation.y = t * 0.3;
  for (const fl of STAGE.flasks) fl.rotation.z = 0.02 * Math.sin(t * 3 + fl.position.x);
  STAGE.hillSun.rotation.z = t * 0.2;
  const d0 = W_.diamonds; // frame when the rain starts, rate
  for (const m of STAGE.diamonds) {
    const u = m.userData; if (d0 === undefined) { m.visible = false; continue; }
    const start = d0.f0 + u.t0 * d0.spread, tt = (f - start) / 30; if (tt < 0) { m.visible = false; continue; }
    m.visible = true; const y = u.y0 - 0.5 * 22 * tt * tt, ground = u.s * 0.9;
    if (y > ground) { m.position.set(u.x, y, u.z); m.rotation.set(tt * 3 + u.spin, tt * 4, u.spin); }
    else { const tl = tt - Math.sqrt(2 * (u.y0 - ground) / 22), b = Math.abs(Math.sin(tl * 9)) * Math.exp(-tl * 5) * 0.6; m.position.set(u.x, ground + b, u.z); m.rotation.set(u.spin * 0.3 + 0.4, u.spin, 0.5); }
    m.scale.set(u.s, u.s * 1.35, u.s);
  }
}

function drawActors(list, cam) {
  cards.forEach((c) => { c.mesh.visible = c.blob.visible = false; });
  list.forEach((a, i) => {
    const c = getCard(i);
    c.draw(a.key, a.draw, a.cut === undefined ? true : a.cut);
    c.mesh.visible = true; c.mesh.position.set(a.x, a.y, a.z);
    const s = a.s || 1; c.mesh.scale.set(s * (a.sx || 1) * (a.flip ? -1 : 1), s, s);
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
  const TT = { ...T, ...PR }; drawActors([...actorsAt(f, TT), ...fxAt(f, TT)], camera);
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

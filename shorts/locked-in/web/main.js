import * as THREE from './lib/three.module.js';
import * as T from './toon.js';
import * as P from './paint.js';
import * as SP from './school_paint.js';
import { SHOTS, TOTAL, shotAt, camAt, dofAt, LIGHTS, lightFor, actorsAt, worldAt, fxAt } from './story.js';

const W = 1080, H = 1920;
const canvas = document.getElementById('c');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, preserveDrawingBuffer: true });
renderer.setPixelRatio(1); renderer.setSize(W, H, false);
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.NoToneMapping;

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(40, W / H, 0.05, 1500);
const rx = (a) => a * Math.PI / 180;

// ---------- materials ----------
const grad = (() => { const d = new Uint8Array([90, 90, 90, 255, 255, 255, 255, 255]); const t = new THREE.DataTexture(d, 2, 1); t.minFilter = t.magFilter = THREE.NearestFilter; t.needsUpdate = true; return t; })();
const toon = (opts) => new THREE.MeshToonMaterial({ gradientMap: grad, ...opts });
const texM = (c, rx_ = 1, ry_ = 1, color = '#ffffff') => toon({ map: P.tex(c, rx_, ry_), color });
const M = {
  brick: texM(SP.brick(21)), floor: texM(SP.floorTiles(22)), floorC: texM(SP.floorTiles(32, '#e7eef0', '#9fb9c4')),
  lockA: texM(SP.lockers(23, '#3f86ad')), lockB: texM(SP.lockers(43, '#d98a2b')),
  concrete: texM(SP.concrete()), asphalt: texM(SP.asphalt()), carpet: texM(SP.carpet()), ceil: texM(SP.ceiling()),
  grass: texM(P.grass(6)), shelf: texM(SP.bookshelf(26)), cork: texM(SP.corkboard()), ventT: texM(SP.vent()),
  wall: toon({ color: '#ece3cf' }), wallHall: toon({ color: '#d7e3d6' }), trim: toon({ color: '#f2efe6' }), stoneBand: toon({ color: '#e6dccb' }),
  alu: toon({ color: '#a2abb5' }), wood: toon({ color: '#c99a62' }), woodDark: toon({ color: '#7a5434' }), desk: toon({ color: '#dcbc88' }),
  steel: toon({ color: '#7d8794' }), chair: toon({ color: '#3f86ad' }), gold: toon({ color: '#e8bb45' }), silver: toon({ color: '#cfd6de' }),
  trunk: toon({ color: '#6a4a32' }), leaf: toon({ color: '#5e9a3e' }), leaf2: toon({ color: '#76ae48' }), bush: toon({ color: '#5b8f3a' }),
  hill: toon({ color: '#7aa64c' }), hillFar: toon({ color: '#86ad60' }), roofTop: toon({ color: '#6b6f78' }), navy: toon({ color: '#1f3566' }),
  red: toon({ color: '#c3262e' }), yellow: toon({ color: '#f2b51d' }), tire: toon({ color: '#26262c' }), dark: toon({ color: '#2a2f38' }),
  beanR: toon({ color: '#e0565b' }), beanY: toon({ color: '#f0b43c' }), pot: toon({ color: '#b8643a' }), plant: toon({ color: '#4f8f3a' }),
  houseA: toon({ color: '#e9d7b4' }), houseB: toon({ color: '#b9d1e0' }), houseC: toon({ color: '#e8c1b8' }), roofH: toon({ color: '#7b5a4a' }), roofH2: toon({ color: '#5a6575' }),
};
const basic = (c, opts = {}) => new THREE.MeshBasicMaterial({ map: P.tex(c), ...opts });
const signM = toon({ map: P.tex(SP.schoolSign()) });
const marqueeM = toon({ map: P.tex(SP.marquee()) });
const boardM = toon({ map: P.tex(SP.chalkboard()) });
const vendM = toon({ map: P.tex(SP.vending()) });
const busM = toon({ map: P.tex(SP.busSide()) });
const clockM = toon({ map: P.tex(SP.clockFace()) });
const exitM = basic(SP.exitSign());
const pennM = toon({ map: P.tex(SP.pennant()), alphaTest: 0.5, side: THREE.DoubleSide });
const flagM = toon({ map: P.tex(SP.flag()), side: THREE.DoubleSide });
const winM = toon({ map: P.tex(SP.windowDecal()) });
const winLitM = basic(SP.windowDecal(28), { color: '#ffd98a' });
const panelM = basic(SP.lightPanel());
const lampHeadM = new THREE.MeshBasicMaterial({ color: '#fff1c4' });
const glassM = (c, o) => new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: o, depthWrite: false, side: THREE.DoubleSide });
const glassDoor = glassM('#bfe3ff', 0.16), glassWin = glassM('#bfe3ff', 0.18), glassCase = glassM('#d8f0ff', 0.12);

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
/** box with world-scaled UVs per face (texel density 1 tile per `t` metres) */
const tbox = (w, h, d, t = 2) => {
  const g = box(w, h, d), uv = g.attributes.uv;
  const dims = [[d, h], [d, h], [w, d], [w, d], [w, h], [w, h]];
  for (let f = 0; f < 6; f++) for (let k = 0; k < 4; k++) { const i = f * 4 + k; uv.setXY(i, uv.getX(i) * dims[f][0] / t, uv.getY(i) * dims[f][1] / t); }
  return g;
};
/** axis-aligned box from min/max corners */
const bx = (x0, x1, y0, y1, z0, z1, mat, parent, opts = {}) => add(tbox(x1 - x0, y1 - y0, z1 - z0, opts.t || 2.4), mat, (x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2, parent, opts);
/** textured plane facing direction ry (0 = +z, PI/2 = +x, -PI/2 = -x, PI = -z) */
const pl = (w, h, mat, x, y, z, ry = 0, parent = world, su = 1, sv = 1, opts = {}) => { const m = add(uvScale(new THREE.PlaneGeometry(w, h), su, sv), mat, x, y, z, parent, { cast: false, ...opts }); m.rotation.y = ry; return m; };

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
// stars (night only)
const stars = (() => {
  const r = P.rng(77), pos = [];
  for (let i = 0; i < 700; i++) { const a = r() * Math.PI * 2, e = Math.asin(0.08 + 0.92 * r()); pos.push(Math.cos(e) * Math.cos(a) * 1000, Math.sin(e) * 1000, Math.cos(e) * Math.sin(a) * 1000); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  const m = new THREE.Points(g, new THREE.PointsMaterial({ color: '#fff8e6', size: 2.2, sizeAttenuation: false, fog: false, depthWrite: false }));
  m.userData.ndSkip = true; scene.add(m); return m;
})();

// ---------- lights ----------
const hemi = new THREE.HemisphereLight('#ffffff', '#ffffff', 1); scene.add(hemi);
const sun = new THREE.DirectionalLight('#ffffff', 2); sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048); sun.shadow.bias = -0.0006; sun.shadow.normalBias = 0.03; sun.shadow.radius = 2;
scene.add(sun); scene.add(sun.target);
const lampHall = new THREE.PointLight('#ffd9a0', 0, 16, 1.2); lampHall.position.set(0, 2.8, -1.6); scene.add(lampHall);
const lampClass = new THREE.PointLight('#ffe2b0', 0, 16, 1.2); lampClass.position.set(7.6, 2.9, -3.0); scene.add(lampClass);
const flash = new THREE.SpotLight('#fff3c8', 0, 22, 0.42, 0.55, 1.0); scene.add(flash); scene.add(flash.target);
scene.fog = new THREE.Fog('#ffffff', 40, 600);

// ---------- world ----------
const DECK = 0;
const world = new THREE.Group(); scene.add(world);
// ground, paths, road
{ const g = add(uvScale(new THREE.PlaneGeometry(900, 900), 180, 180), M.grass, 0, -0.01, 0, world, { cast: false }); g.rotation.x = -Math.PI / 2; }
{ const s = add(uvScale(new THREE.PlaneGeometry(5, 17), 2.5, 8.5), M.concrete, 0, 0.005, 8.5, world, { cast: false }); s.rotation.x = -Math.PI / 2; }
{ const s = add(uvScale(new THREE.PlaneGeometry(46, 2.6), 23, 1.3), M.concrete, 0, 0.006, 1.3, world, { cast: false }); s.rotation.x = -Math.PI / 2; }
{ const s = add(uvScale(new THREE.PlaneGeometry(900, 3), 450, 1.5), M.concrete, 0, 0.004, 15.5, world, { cast: false }); s.rotation.x = -Math.PI / 2; }
{ const s = add(uvScale(new THREE.PlaneGeometry(900, 9), 150, 1), M.asphalt, 0, 0.003, 21.5, world, { cast: false }); s.rotation.x = -Math.PI / 2; }
bx(-450, 450, 0, 0.12, 16.9, 17.1, M.concrete, world, { cast: false });

// ---------- school building ----------
const B = new THREE.Group(); world.add(B);
const facadeMats = [M.brick, M.brick, M.brick, M.brick, M.brick, M.wall]; // px nx py ny pz(front) nz(inside)
const fbox = (x0, x1, y0, y1) => add(tbox(x1 - x0, y1 - y0, 0.4, 2.4), facadeMats, (x0 + x1) / 2, (y0 + y1) / 2, -0.2, B);
const WIN = [3.4, 6.6, 9.8]; // window left edges (right block); mirrored for the library
for (const s of [-1, 1]) {
  const X = (a) => s * a, lo = (a, b) => [Math.min(X(a), X(b)), Math.max(X(a), X(b))];
  fbox(...lo(13, 22), 0, 3.2);
  fbox(...lo(1.3, 2.2), 0, 3.2);
  fbox(...lo(2.2, 13), 0, 0.9); fbox(...lo(2.2, 13), 2.5, 3.2);
  for (const [a, b] of [[2.2, 3.4], [5.4, 6.6], [8.6, 9.8], [11.8, 13]]) fbox(...lo(a, b), 0.9, 2.5);
  for (const w of WIN) { // frames + mullions + glass
    const [a, b] = lo(w, w + 2);
    bx(a, b, 0.86, 0.94, -0.46, 0.08, M.trim, B); bx(a, b, 2.46, 2.54, -0.42, 0.04, M.trim, B);
    bx(a - 0.04, a + 0.06, 0.9, 2.5, -0.42, 0.04, M.trim, B); bx(b - 0.06, b + 0.04, 0.9, 2.5, -0.42, 0.04, M.trim, B);
    bx((a + b) / 2 - 0.04, (a + b) / 2 + 0.04, 0.9, 2.5, -0.3, -0.18, M.trim, B); bx(a, b, 1.66, 1.74, -0.3, -0.18, M.trim, B);
    const gl = add(new THREE.PlaneGeometry(2, 1.6), glassWin, (a + b) / 2, 1.7, -0.24, B, { cast: false }); gl.userData.ndSkip = true; gl.renderOrder = 6;
  }
  // window decals, upper floor + outer wings
  for (const x of [0, 4.4, 7.6, 10.8, 15, 19]) { if (s < 0 && x === 0) continue; const d = pl(1.8, 1.8, (x * 7 + s * 3) % 5 < 1.5 ? winLitM : winM, s * x, 5.3, 0.012, 0, B); d.userData.win = true; }
  for (const x of [15, 19]) pl(1.8, 1.6, winM, s * x, 1.7, 0.012, 0, B).userData.win = true;
}
fbox(-1.3, 1.3, 2.4, 3.2);
// upper floor (does not cast so the sun can play the ceiling lights inside)
add(tbox(44, 4.2, 26, 2.4), [M.brick, M.brick, M.roofTop, M.ceil, M.brick, M.brick], 0, 5.3, -13, B, { cast: false });
bx(-22.2, 22.2, 7.4, 7.75, -26.2, 0.2, M.trim, B, { cast: false });
bx(-22.1, 22.1, 3.2, 3.42, -0.05, 0.1, M.stoneBand, B, { cast: false });
// sign + canopy + columns
pl(4.6, 0.86, signM, 0, 3.92, 0.02, 0, B);
bx(-2.9, 2.9, 2.9, 3.12, -0.1, 1.9, M.trim, B, { cast: false });
for (const x of [-2.55, 2.55]) add(new THREE.CylinderGeometry(0.13, 0.15, 2.9, 14), M.trim, x, 1.45, 1.6, B);
bx(-3.2, 3.2, 0, 0.06, 0, 2.3, M.concrete, B, { cast: false });
// entrance doors
const doors = new THREE.Group(); B.add(doors);
for (const x of [-1.3, 0, 1.3]) bx(x - 0.05, x + 0.05, 0, 2.4, -0.26, -0.14, M.alu, doors);
bx(-1.3, 1.3, 2.32, 2.4, -0.26, -0.14, M.alu, doors); bx(-1.3, 1.3, 0, 0.14, -0.26, -0.14, M.alu, doors);
for (const x of [-0.65, 0.65]) { const g = add(new THREE.PlaneGeometry(1.2, 2.18), glassDoor, x, 1.23, -0.2, doors, { cast: false }); g.userData.ndSkip = true; g.renderOrder = 6; }
for (const s of [-1, 1]) { bx(s * 0.2 - 0.03, s * 0.2 + 0.03, 0.78, 1.52, -0.08, -0.04, M.alu, doors); bx(s * 0.2 - 0.03, s * 0.2 + 0.03, 0.78, 0.82, -0.14, -0.04, M.alu, doors); bx(s * 0.2 - 0.03, s * 0.2 + 0.03, 1.48, 1.52, -0.14, -0.04, M.alu, doors); }
for (const s of [-1, 1]) bx(s * 0.65 - 0.5, s * 0.65 + 0.5, 0.98, 1.06, -0.4, -0.34, M.alu, doors); // push bars inside
// chain around the handles + padlock
const chain = new THREE.Group(); doors.add(chain);
{ const link = new THREE.TorusGeometry(0.026, 0.008, 6, 12);
  for (let i = 0; i < 26; i++) { const a = i / 26 * Math.PI * 2, l = add(link, M.silver, Math.cos(a) * 0.27, 1.16 + Math.sin(a * 2) * 0.01, -0.06 + Math.sin(a) * 0.05, chain, { cast: false }); l.rotation.set(i % 2 ? Math.PI / 2 : 0, -a, 0); }
  for (let i = 0; i < 4; i++) { const l = add(link, M.silver, 0.02, 1.1 - i * 0.04, -0.01, chain, { cast: false }); l.rotation.y = i % 2 ? Math.PI / 2 : 0; } }
const padlock = new THREE.Group(); padlock.position.set(0.02, 0.88, 0.0); doors.add(padlock);
add(tbox(0.1, 0.11, 0.045, 1), M.gold, 0, 0, 0, padlock, { cast: false });
const shackle = add(new THREE.TorusGeometry(0.032, 0.009, 8, 16, Math.PI), M.silver, 0, 0.055, 0, padlock, { cast: false });
// exit sign inside
{ const e = pl(0.6, 0.3, exitM, 0, 2.78, -0.43, Math.PI, B); e.material.fog = false; }

// ---------- interior ----------
const IN = new THREE.Group(); world.add(IN);
// floors
{ const f = add(uvScale(new THREE.PlaneGeometry(26, 26), 26 / 2.4, 26 / 2.4), M.floor, 0, 0.002, -13.2, IN, { cast: false }); f.rotation.x = -Math.PI / 2; }
{ const f = add(uvScale(new THREE.PlaneGeometry(10, 9), 10 / 2.4, 9 / 2.4), M.floorC, 7.6, 0.004, -4.9, IN, { cast: false }); f.rotation.x = -Math.PI / 2; }
{ const f = add(uvScale(new THREE.PlaneGeometry(10, 9), 10 / 3, 9 / 3), M.carpet, -7.6, 0.004, -4.9, IN, { cast: false }); f.rotation.x = -Math.PI / 2; }
// solid blocks behind the rooms, outer wings, back wall
for (const s of [-1, 1]) {
  const lo = (a, b) => [Math.min(s * a, s * b), Math.max(s * a, s * b)];
  bx(...lo(2.2, 22), 0, 3.2, -26, -9.4, M.wallHall, IN);
  bx(...lo(12.6, 22), 0, 3.2, -9.4, -0.4, M.wall, IN);
  // partition hallway | room with doorway
  const dz = s > 0 ? [-7.0, -8.2] : [-4.2, -5.4];
  bx(...lo(2.2, 2.6), 0, 3.2, dz[0], -0.4, M.wall, IN); bx(...lo(2.2, 2.6), 0, 3.2, -9.4, dz[1], M.wall, IN);
  bx(...lo(2.2, 2.6), 2.3, 3.2, dz[1], dz[0], M.wall, IN);
  // door frame trims
  for (const z of dz) bx(...lo(2.14, 2.66), 0, 2.36, z - 0.05, z + 0.05, M.woodDark, IN);
  bx(...lo(2.14, 2.66), 2.28, 2.38, dz[1] - 0.05, dz[0] + 0.05, M.woodDark, IN);
}
bx(-2.2, 2.2, 0, 3.2, -26.4, -26, M.wallHall, IN);
for (const s of [-1, 1]) bx(s * 2.2 - (s > 0 ? 0.02 : 0), s * 2.2 + (s > 0 ? 0 : 0.02), 0, 0.12, -26, -0.4, M.woodDark, IN, { cast: false });
// ceiling panels
const panels = [];
const panel = (x, z) => { const p_ = add(new THREE.PlaneGeometry(0.6, 1.2), panelM.clone(), x, 3.185, z, IN, { cast: false }); p_.rotation.x = Math.PI / 2; panels.push(p_); return p_; };
for (let z = -2; z > -26; z -= 3) panel(0, z);
for (const x of [5, 10.2]) for (const z of [-2.6, -6.2]) panel(x, z);
for (const x of [-5, -10.2]) for (const z of [-2.6, -6.2]) panel(x, z);
// lockers: bulk box + textured front plane
const lockerRun = (side, z0, z1, mat = M.lockA) => {
  const L = Math.abs(z1 - z0), zc = (z0 + z1) / 2, x = side * (2.2 - 0.22);
  bx(x - 0.22, x + 0.22, 0.12, 2.0, zc - L / 2, zc + L / 2, M.steel, IN, { cast: true });
  pl(L, 1.88, mat, side * (2.2 - 0.445), 1.06, zc, side > 0 ? -Math.PI / 2 : Math.PI / 2, IN, L / 1.6, 1);
};
lockerRun(-1, -0.6, -3.9); lockerRun(-1, -8.4, -10.6); lockerRun(-1, -14, -25.6);
lockerRun(1, -3.4, -6.8, M.lockB); lockerRun(1, -8.6, -25.6, M.lockB);
// corkboard + vent on the right wall near the doors
pl(2.4, 1.1, M.cork, 2.19, 1.85, -1.9, -Math.PI / 2, IN);
const ventP = pl(0.7, 0.36, M.ventT, 2.19, 0.38, -2.4, -Math.PI / 2, IN);
// vending machine
bx(-2.2, -1.35, 0, 1.92, -8.05, -7.05, M.red, IN);
pl(1.0, 1.9, vendM, -1.345, 0.96, -7.55, Math.PI / 2, IN);
// trophy case
const trophies = [];
{
  bx(-2.2, -1.7, 0, 0.82, -13.7, -10.9, M.woodDark, IN);
  bx(-2.2, -2.12, 0.82, 2.45, -13.7, -10.9, M.navy, IN, { cast: false });
  bx(-2.2, -1.7, 2.42, 2.52, -13.7, -10.9, M.woodDark, IN);
  for (const z of [-13.7, -10.9]) bx(-2.2, -1.7, 0.82, 2.45, z - 0.04, z + 0.04, M.woodDark, IN);
  for (const y of [1.36, 1.9]) bx(-2.12, -1.72, y - 0.015, y + 0.015, -13.66, -10.94, M.wood, IN, { cast: false });
  const g = add(new THREE.PlaneGeometry(2.8, 1.6), glassCase, -1.69, 1.63, -12.3, IN, { cast: false }); g.rotation.y = Math.PI / 2; g.userData.ndSkip = true; g.renderOrder = 6;
  const cupPts = [[0, 0], [0.09, 0], [0.09, 0.03], [0.03, 0.05], [0.025, 0.14], [0.08, 0.18], [0.11, 0.32], [0.1, 0.33]].map(([a, b]) => new THREE.Vector2(a, b));
  const cupGeo = new THREE.LatheGeometry(cupPts, 16);
  const r = P.rng(5);
  [[0.84, -11.3], [0.84, -12.0], [0.84, -12.7], [0.84, -13.3], [1.38, -11.25], [1.38, -11.9], [1.38, -12.6], [1.38, -13.25], [1.92, -11.5], [1.92, -12.3], [1.92, -13.1]].forEach(([y, z], i) => {
    const t = new THREE.Group(); t.position.set(-1.92, y, z); IN.add(t);
    const s = 0.8 + r() * 0.7;
    if (i % 4 === 3) { add(tbox(0.04, 0.28, 0.22, 1), M.woodDark, 0, 0.14, 0, t); add(tbox(0.045, 0.16, 0.14, 1), M.gold, 0.005, 0.15, 0, t); }
    else { add(tbox(0.16, 0.08, 0.16, 1), M.woodDark, 0, 0.04, 0, t); const c = add(cupGeo, i % 3 ? M.gold : M.silver, 0, 0.08, 0, t); c.scale.setScalar(s); for (const sd of [-1, 1]) { const h = add(new THREE.TorusGeometry(0.04 * s, 0.008, 6, 10, Math.PI), i % 3 ? M.gold : M.silver, 0, 0.08 + 0.26 * s, sd * 0.1 * s, t, { cast: false }); h.rotation.y = Math.PI / 2; h.rotation.z = sd > 0 ? -Math.PI / 2 : Math.PI / 2; } }
    t.userData.base = t.position.clone(); trophies.push(t);
  });
}
// hallway end wall: clock + pennant
const hallClock = new THREE.Group(); hallClock.position.set(0, 2.45, -25.93); IN.add(hallClock);
const clockHands = (grp, R) => {
  const face = add(new THREE.CylinderGeometry(R, R, 0.06, 40), clockM, 0, 0, 0, grp, { cast: false }); face.rotation.x = Math.PI / 2;
  { const uv = face.geometry.attributes.uv, pos = face.geometry.attributes.position; for (let i = 0; i < uv.count; i++) uv.setXY(i, 0.5 + pos.getX(i) / (2 * R), 0.5 - pos.getZ(i) / (2 * R)); }
  const hr = new THREE.Group(), mn = new THREE.Group(); hr.position.z = mn.position.z = 0.04; grp.add(hr); grp.add(mn);
  add(tbox(0.05 * R / 0.45, 0.24 * R / 0.45, 0.02, 1), M.dark, 0, 0.1 * R / 0.45, 0, hr, { cast: false });
  add(tbox(0.035 * R / 0.45, 0.36 * R / 0.45, 0.02, 1), M.dark, 0, 0.16 * R / 0.45, 0.012, mn, { cast: false });
  add(new THREE.CylinderGeometry(0.03, 0.03, 0.03, 10), M.red, 0, 0, 0.03, grp, { cast: false }).rotation.x = Math.PI / 2;
  return { hr, mn };
};
const HC = clockHands(hallClock, 0.45);
pl(1.5, 0.75, pennM, 1.15, 1.4, -25.95, 0, IN);
// classroom
const classClock = new THREE.Group(); classClock.position.set(7.4, 2.93, -9.37); IN.add(classClock);
const CC = clockHands(classClock, 0.24);
pl(3.6, 1.8, boardM, 7.4, 1.75, -9.385, 0, IN);
bx(3.6, 5.2, 0, 0.78, -8.6, -7.8, M.woodDark, IN); bx(3.55, 5.25, 0.78, 0.84, -8.65, -7.75, M.desk, IN);
const desks = [];
const desk = (x, z, parent = IN) => {
  const g = new THREE.Group(); g.position.set(x, 0, z); parent.add(g);
  add(tbox(0.78, 0.05, 0.56, 1), M.desk, 0, 0.75, 0, g);
  for (const [a, b] of [[-0.34, -0.22], [0.34, -0.22], [-0.34, 0.22], [0.34, 0.22]]) add(new THREE.CylinderGeometry(0.02, 0.02, 0.75, 6), M.steel, a, 0.375, b, g);
  add(tbox(0.44, 0.04, 0.4, 1), M.chair, 0, 0.45, 0.62, g); add(tbox(0.44, 0.32, 0.04, 1), M.chair, 0, 0.72, 0.84, g);
  for (const [a, b] of [[-0.18, 0.46], [0.18, 0.46], [-0.18, 0.8], [0.18, 0.8]]) add(new THREE.CylinderGeometry(0.016, 0.016, 0.45, 6), M.steel, a, 0.225, b, g);
  desks.push(g); return g;
};
for (const x of [5.0, 7.6, 10.2]) for (const z of [-2.7, -4.7, -6.7]) desk(x, z);
pl(2.0, 1.0, M.cork, 12.59, 1.8, -5.0, -Math.PI / 2, IN);
// library
const shelfRun = (x0, x1, z, ry) => { const L = Math.abs(x1 - x0);
  if (ry === 0) { bx(x0, x1, 0, 2.3, z - 0.42, z, M.woodDark, IN); pl(L, 2.3, M.shelf, (x0 + x1) / 2, 1.15, z + 0.005, 0, IN, L / 2.3, 1); }
  else { bx(z, z + 0.42, 0, 2.3, Math.min(x0, x1), Math.max(x0, x1), M.woodDark, IN); pl(L, 2.3, M.shelf, z + 0.425, 1.15, (x0 + x1) / 2, Math.PI / 2, IN, L / 2.3, 1); } };
shelfRun(-12.5, -2.7, -9.0, 0);
shelfRun(-8.8, -1.0, -12.6, 1);
{ add(new THREE.CylinderGeometry(0.8, 0.8, 0.06, 28), M.desk, -5.6, 0.74, -3.2, IN); add(new THREE.CylinderGeometry(0.08, 0.12, 0.72, 10), M.woodDark, -5.6, 0.36, -3.2, IN);
  add(new THREE.SphereGeometry(0.16, 16, 12), M.houseB, -5.4, 0.98, -3.0, IN); add(new THREE.CylinderGeometry(0.02, 0.06, 0.08, 8), M.gold, -5.4, 0.81, -3.0, IN);
  for (let i = 0; i < 4; i++) { const a = i / 4 * Math.PI * 2 + 0.4; add(tbox(0.42, 0.04, 0.42, 1), M.chair, -5.6 + Math.cos(a) * 1.15, 0.45, -3.2 + Math.sin(a) * 1.15, IN); }
  const bb = add(new THREE.SphereGeometry(0.55, 16, 12), M.beanR, -10.6, 0.32, -6.6, IN); bb.scale.set(1, 0.6, 1);
  const by = add(new THREE.SphereGeometry(0.5, 16, 12), M.beanY, -9.3, 0.3, -7.4, IN); by.scale.set(1, 0.6, 1);
  add(new THREE.CylinderGeometry(0.22, 0.16, 0.42, 12), M.pot, -3.2, 0.21, -8.5, IN); const pp = add(new THREE.SphereGeometry(0.45, 12, 10), M.plant, -3.2, 0.82, -8.5, IN); pp.scale.y = 1.3;
  const r = P.rng(9); for (let i = 0; i < 6; i++) { const b_ = add(tbox(0.22, 0.04, 0.3, 1), [M.red, M.navy, M.beanY, M.leaf][i % 4], -8.4 + r() * 2.6, 0.03 + (i % 2) * 0.04, -7.4 + r() * 1.2, IN); b_.rotation.y = r() * 3; }
}

// ---------- outside dressing ----------
const FLAG = new THREE.Vector3(6.2, 0, 7.5);
add(new THREE.CylinderGeometry(0.06, 0.08, 9, 10), M.silver, FLAG.x, 4.5, FLAG.z, world);
add(new THREE.SphereGeometry(0.12, 10, 8), M.gold, FLAG.x, 9.05, FLAG.z, world);
const flagCloth = add(new THREE.PlaneGeometry(1.9, 1.0, 12, 6), flagM, FLAG.x + 0.95, 8.3, FLAG.z, world, { cast: true });
flagCloth.userData.cloth = flagCloth.geometry.attributes.position.array.slice();
bx(FLAG.x - 0.6, FLAG.x + 0.6, 0, 0.25, FLAG.z - 0.6, FLAG.z + 0.6, M.concrete, world);
{ const g = new THREE.Group(); g.position.set(-6.8, 0, 9.5); g.rotation.y = 0.12; world.add(g);
  bx(-1.9, 1.9, 0, 0.7, -0.3, 0.3, M.brick, g); for (const x of [-1.75, 1.75]) bx(x - 0.1, x + 0.1, 0.7, 2.9, -0.1, 0.1, M.navy, g);
  bx(-1.7, 1.7, 0.85, 2.75, -0.08, 0.08, M.navy, g); pl(3.3, 1.65, marqueeM, 0, 1.8, 0.085, 0, g); }
const tree = (x, z, s = 1) => { const g = new THREE.Group(); g.position.set(x, 0, z); g.scale.setScalar(s); world.add(g);
  add(new THREE.CylinderGeometry(0.18, 0.26, 3, 8), M.trunk, 0, 1.5, 0, g);
  const r = P.rng(Math.abs(x * 13 + z * 7) | 0 || 3);
  for (let i = 0; i < 4; i++) add(new THREE.SphereGeometry(1.2 + r() * 0.6, 12, 10), i % 2 ? M.leaf : M.leaf2, (r() - 0.5) * 1.6, 3.4 + r() * 1.4, (r() - 0.5) * 1.6, g);
  return g; };
{ const r = P.rng(44);
  for (const [x, z] of [[-14, 6], [14.5, 5], [-24, 3], [25, 4], [-30, 10], [31, 12], [-18, 13], [19, 12.5], [-40, 2], [40, 0]]) tree(x, z, 0.9 + r() * 0.4);
  for (let i = 0; i < 40; i++) { const x = (r() - 0.5) * 300, z = 32 + r() * 120; tree(x, z, 1 + r() * 0.6); }
  for (let x = -21; x <= 21; x += 1.6) { if (Math.abs(x) < 3.4) continue; const b_ = add(new THREE.SphereGeometry(0.55 + r() * 0.25, 10, 8), M.bush, x, 0.35, 0.75 + r() * 0.2, world); b_.scale.y = 0.75; }
}
const lampHeads = [];
for (const x of [-3.6, 3.6]) { add(new THREE.CylinderGeometry(0.05, 0.07, 3.4, 8), M.dark, x, 1.7, 12.5, world); lampHeads.push(add(new THREE.SphereGeometry(0.22, 12, 10), lampHeadM, x, 3.5, 12.5, world, { cast: false })); }
// school bus
const bus = new THREE.Group(); world.add(bus);
{ bx(-4.6, 4.6, 0.55, 3.0, -1.25, 1.25, M.yellow, bus); bx(4.6, 5.9, 0.55, 1.9, -1.2, 1.2, M.yellow, bus); bx(4.55, 4.62, 1.9, 2.8, -1.1, 1.1, M.dark, bus, { cast: false });
  pl(9.2, 2.3, busM, 0, 1.75, 1.255, 0, bus); pl(9.2, 2.3, busM, 0, 1.75, -1.255, Math.PI, bus);
  bx(-4.62, 4.62, 2.98, 3.08, -1.2, 1.2, M.trim, bus, { cast: false }); bx(5.9, 6.0, 0.6, 1.0, -1.2, 1.2, M.dark, bus);
  for (const x of [-3.0, 3.6]) for (const z of [-1.2, 1.2]) { const w = add(new THREE.CylinderGeometry(0.5, 0.5, 0.3, 16), M.tire, x, 0.5, z, bus); w.rotation.x = Math.PI / 2; }
  for (const z of [-0.8, 0.8]) add(new THREE.SphereGeometry(0.12, 8, 6), lampHeadM, 6.0, 1.3, z, bus, { cast: false }); }
bus.position.set(-6, 0, 19.6);
const house = (x, z, w, d, h, rot, mat, roof) => {
  const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = rot; world.add(g);
  add(tbox(w, h, d, 2), mat, 0, h / 2, 0, g);
  const sh = new THREE.Shape(); sh.moveTo(-w / 2 - 0.4, 0); sh.lineTo(w / 2 + 0.4, 0); sh.lineTo(0, h * 0.55); sh.closePath();
  add(new THREE.ExtrudeGeometry(sh, { depth: d + 0.6, bevelEnabled: false }), roof, 0, h, -d / 2 - 0.3, g);
  add(box(0.9, 1.9, 0.1), M.woodDark, 0, 0.95, d / 2 + 0.03, g, { cast: false });
  for (const s of [-1, 1]) add(box(0.9, 0.9, 0.1), M.navy, s * w * 0.28, h * 0.58, d / 2 + 0.03, g, { cast: false });
  return g;
};
{ const r = P.rng(12), mats = [M.houseA, M.houseB, M.houseC];
  for (let i = 0; i < 14; i++) house(-70 + i * 11 + r() * 3, 34 + r() * 4, 6 + r() * 2, 6, 3.4 + r(), Math.PI + (r() - 0.5) * 0.2, mats[i % 3], i % 2 ? M.roofH : M.roofH2);
  for (let i = 0; i < 16; i++) house(-90 + i * 12 + r() * 4, 60 + r() * 20, 6 + r() * 2, 6, 3.4 + r(), Math.PI + (r() - 0.5) * 0.6, mats[(i + 1) % 3], i % 2 ? M.roofH2 : M.roofH); }
{ const r = P.rng(46); for (let i = 0; i < 16; i++) { const a = r() * Math.PI * 2, d = 200 + r() * 160; const h = add(new THREE.SphereGeometry(50 + r() * 40, 20, 10), i % 2 ? M.hill : M.hillFar, Math.cos(a) * d, -14, Math.sin(a) * d, world, { cast: false }); h.scale.y = 0.45 + r() * 0.25; } }

// clouds: painted billboards far away (no fog, no ink)
const clouds = [];
{ const r = P.rng(90);
  for (let i = 0; i < 14; i++) {
    const c = document.createElement('canvas'); c.width = 600; c.height = 400; const pen = new T.Pen(c.getContext('2d')); pen.ol = 0;
    pen.g.translate(300, 200); pen.g.scale(1.4, 1.2); pen.g.translate(-300, -200); T.fxCloud(pen, i + 1);
    const m = new THREE.Mesh(new THREE.PlaneGeometry(1, 0.667), new THREE.MeshBasicMaterial({ map: P.tex(c), transparent: true, fog: false, depthWrite: false }));
    const a = r() * Math.PI * 2, d = 650 + r() * 250; m.position.set(Math.cos(a) * d, 120 + r() * 160, Math.sin(a) * d); m.scale.setScalar(160 + r() * 140);
    m.userData.ndSkip = true; m.renderOrder = -1; scene.add(m); clouds.push(m);
  } }

// ---------- cards ----------
const CW = 1200, CH = 2000, CM = 2.25; // canvas px, card height in metres (design 600x1000 -> 2.25 m)
const cardGeo = new THREE.PlaneGeometry(CM * 0.6, CM); cardGeo.translate(0, CM / 2 - CM * 0.025, 0);
const blobTex = P.tex(P.radial('20,14,30', 0.6));
class Card {
  constructor(scale = 1) {
    [this.c, this.g] = (() => { const c = document.createElement('canvas'); c.width = CW; c.height = CH; return [c, c.getContext('2d')]; })();
    this.t = new THREE.CanvasTexture(this.c); this.t.colorSpace = THREE.SRGBColorSpace; this.t.anisotropy = 4;
    this.mat = new THREE.MeshBasicMaterial({ map: this.t, transparent: true, alphaTest: 0.02, side: THREE.DoubleSide, fog: true });
    this.mesh = new THREE.Mesh(cardGeo, this.mat); this.mesh.userData.nd = cardNd(this.t); this.mesh.castShadow = true;
    this.mesh.customDepthMaterial = new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking, map: this.t, alphaTest: 0.5 });
    this.blob = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: blobTex, transparent: true, depthWrite: false, fog: true }));
    this.blob.rotation.x = -Math.PI / 2; this.blob.userData.ndSkip = true; this.blob.renderOrder = 1;
    scene.add(this.mesh); scene.add(this.blob); this.key = ''; this.mesh.visible = this.blob.visible = false;
  }
  draw(key, fn) {
    if (key === this.key) return; this.key = key;
    const g = this.g; g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, CW, CH); g.setTransform(CW / 600, 0, 0, CH / 1000, 0, 0);
    const p = new T.Pen(g); fn(p); this.t.needsUpdate = true;
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
    c = mix(c, vec3(1.), max(flash, 0.));
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
  lampHall.intensity = L.lampHall || 0; lampClass.intensity = L.lampClass || 0;
  stars.visible = !!L.stars; for (const c of clouds) { c.visible = L.clouds !== false; c.material.color.set(L.cloud || '#ffffff'); }
  winM.color.set(L.win || '#ffffff'); winLitM.color.set(L.winLit || '#ffd98a');
  lampHeadM.color.set(L.lampsOn ? '#ffe6a0' : '#d9d4c6');
  glassWin.color.set(L.glass || '#bfe3ff'); glassWin.opacity = L.glassO ?? 0.18;
  glassDoor.color.set(L.glass || '#bfe3ff'); glassDoor.opacity = L.glassDoorO ?? 0.16;
}
function placeSun(L, focus) {
  const az = rx(L.az), el = rx(L.el); tmpV.set(Math.cos(el) * Math.cos(az), Math.sin(el), Math.cos(el) * Math.sin(az));
  sun.position.copy(focus).addScaledVector(tmpV, 80); sun.target.position.copy(focus);
  const daz = rx(L.discAz ?? L.az), del = rx(L.discEl ?? L.el);
  skyU.sunDir.value.set(Math.cos(del) * Math.cos(daz), Math.sin(del), Math.cos(del) * Math.sin(daz));
  const ext = L.shadowExt || 30, sc = sun.shadow.camera; sc.left = -ext; sc.right = ext; sc.top = ext; sc.bottom = -ext; sc.near = 1; sc.far = 200; sc.updateProjectionMatrix();
}

function worldState(S, f) {
  const pa = flagCloth.geometry.attributes.position, base = flagCloth.userData.cloth;
  for (let i = 0; i < pa.count; i++) { const x = base[i * 3], y = base[i * 3 + 1]; pa.setZ(i, Math.sin(f * 0.2 - x * 3.0 + y * 0.8) * 0.12 * (x + 0.95)); }
  pa.needsUpdate = true; flagCloth.geometry.computeVertexNormals();
  bus.position.x = S.busX ?? -6; bus.visible = S.bus !== false;
  shackle.position.y = 0.055 + (S.locked ? 0 : 0.035); shackle.rotation.y = S.locked ? 0 : 0.5;
  chain.visible = padlock.visible = S.chain !== false;
  panels.forEach((p_, i) => { let on = S.lights !== false; if (typeof S.lights === 'number') on = i < 8 ? !(S.lights > (7 - i) / 8) : S.lights < 0.5; p_.material.color.set(on ? '#ffffff' : '#3d4357'); });
  const setClock = (C, h, m) => { C.hr.rotation.z = -(h % 12 + m / 60) / 12 * Math.PI * 2; C.mn.rotation.z = -m / 60 * Math.PI * 2; };
  setClock(HC, S.hallClock?.[0] ?? 11, S.hallClock?.[1] ?? 58); setClock(CC, S.classClock?.[0] ?? 5, S.classClock?.[1] ?? 40);
  trophies.forEach((t, i) => { t.position.copy(t.userData.base); t.rotation.set(0, 0, 0);
    if (S.shake > 0) { const k = S.shake, ph = f * 2.1 + i * 1.7; t.position.y += Math.abs(Math.sin(ph)) * 0.05 * k; t.position.z += Math.sin(ph * 1.3) * 0.02 * k; t.rotation.x = Math.sin(ph * 0.9) * 0.18 * k; } });
  if (S.flash) { flash.intensity = S.flash.I; flash.position.set(...S.flash.pos); flash.target.position.set(...S.flash.at); }
  else flash.intensity = 0;
}

function drawActors(list, cam) {
  cards.forEach((c) => { c.mesh.visible = c.blob.visible = false; });
  list.forEach((a, i) => {
    const c = getCard(i);
    c.draw(a.key, a.draw);
    c.mesh.visible = true; c.mesh.position.set(a.x, a.y, a.z);
    const s = a.s || 1; c.mesh.scale.set(s * (a.flip ? -1 : 1), s, s);
    c.mesh.rotation.set(0, (a.faceYaw ?? Math.atan2(cam.position.x - a.x, cam.position.z - a.z)) + (a.yaw || 0), a.roll || 0);
    c.mat.color.set(a.tint || '#ffffff'); c.mat.opacity = a.alpha ?? 1;
    c.mesh.castShadow = a.shadow !== false;
    c.mesh.renderOrder = a.order || 2;
    if (a.blob !== false && a.y < DECK + 0.5) { c.blob.visible = true; c.blob.position.set(a.x, (a.ground ?? DECK) + 0.012, a.z); c.blob.scale.set(0.95 * s * (a.blobW || 1), 0.6 * s, 1); }
  });
}

const swapForNd = (on) => {
  scene.traverse((o) => {
    if (!o.isMesh && !o.isPoints) return;
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
  const S = shotAt(f), L = lightFor(S, f), C = camAt(f);
  applyLight(L, f);
  camera.position.set(...C.pos); camera.up.set(0, 1, 0); camera.lookAt(...C.look); camera.rotateZ(rx(C.roll || 0));
  camera.fov = C.fov; camera.updateProjectionMatrix(); camera.updateMatrixWorld();
  const W_ = worldAt(f); worldState(W_, f);
  placeSun(L, new THREE.Vector3(...(C.shadowAt || C.look)));
  drawActors([...actorsAt(f, T), ...fxAt(f, T)], camera);
  sky.position.copy(camera.position); stars.position.copy(camera.position);
  for (const c of clouds) c.quaternion.copy(camera.quaternion);
  renderer.setRenderTarget(rtColor); renderer.setClearColor(0x000000, 1); renderer.clear(); renderer.render(scene, camera);
  const fog = scene.fog; scene.fog = null; const sm = renderer.shadowMap.enabled; renderer.shadowMap.enabled = false; renderer.shadowMap.autoUpdate = false;
  swapForNd(true); renderer.setRenderTarget(rtNd); renderer.setClearColor(0x000000, 0); renderer.clear(); renderer.render(scene, camera); swapForNd(false);
  scene.fog = fog; renderer.shadowMap.enabled = sm; renderer.shadowMap.autoUpdate = true;
  if (window.DEBUG_ND) { const dm = new THREE.MeshBasicMaterial({ map: rtNd.texture }); const ds = fs(dm); renderer.setRenderTarget(null); renderer.render(ds, fsCam); return true; }
  const D = dofAt(f);
  inkU.px.value = 2.5; inkU.flash.value = window.DEBUG_E ? -1 : (C.flash || 0); inkU.vig.value = L.vig ?? 0.22;
  renderer.setRenderTarget(rtInk); renderer.render(inkScene, fsCam);
  dofU.focus.value = D.focus; dofU.cinf.value = D.cinf; dofU.near.value = D.near ?? 1;
  renderer.setRenderTarget(null); renderer.render(dofScene, fsCam);
  return true;
};
window.TOTAL = TOTAL;
window.ready = true;

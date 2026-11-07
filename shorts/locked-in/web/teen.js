
// ---------------- Modern US high-school cast (our own designs), built on the Pen / blob / face helpers ----------------
FACE.scream = { eye: ["shock", "shock"], brow: [-7, -6], mouth: "O" };
FACE.yell = { eye: ["squeeze", "squeeze"], brow: [5, -3], mouth: "O" };
FACE.sleep = { eye: ["dash", "dash"], brow: [0, -1], mouth: "o" };
FACE.smug = { eye: ["lid", "lid"], brow: [-1, -4], mouth: "smirk" };
FACE.chew = { eye: ["happy", "happy"], brow: [-1, -2], mouth: "o" };
FACE.panic = { eye: ["shock", "shock"], brow: [-4, 3], mouth: "wave" };
FACE.shy = { eye: ["happy", "happy"], brow: [-2, 1], mouth: "smile" };
FACE.bored = { eye: ["lid", "lid"], brow: [0, 0], mouth: "dash" };
FACE.sus = { eye: ["slit", "slit"], brow: [4, -3], mouth: "frown" };
FACE.wake = { eye: ["small", "small"], brow: [-2, -1], mouth: "o" };
FACE.happy = { eye: ["dot", "dot"], brow: [-1, -2], mouth: "smileWide" };

export const TEENS = {
  jake: { top: "#d9472f", hood: true, pants: "#3f5f92", shoe: "#f4f4f2", trim: "#d9472f", skin: "#f5c9a0", hair: "#6b4226", style: "messy" },
  mia: { top: "#f0b43c", tee: "#fbf7ee", cardigan: true, pants: "#2e3a63", shoe: "#ea5a6c", trim: "#ffffff", skin: "#e9b88f", hair: "#2a1a15", style: "long", clip: "#ea5a6c", keys: true },
  gus: { top: "#58788c", coverall: true, pants: "#58788c", shoe: "#3b2a1e", trim: "#2a1d16", skin: "#efc39c", cap: "#2f4656", moustache: "#5a3a26", stout: true, keys: "big" },
  mom: { top: "#5c3b7c", blazer: true, tee: "#f6f1e7", skirt: "#3e2b55", pants: "#3e2b55", shoe: "#2a1d2e", trim: "#2a1d2e", skin: "#e9b88f", hair: "#2a1a15", style: "bun", glasses: true, badge: true },
};

/** keyring: ring + 4 keys + red tag, swinging by `ang` (rad) */
const keyring = (p, x, y, s, ang = 0, big = false) => {
  const r = 7 * s, cols = ["#e2b84a", "#c9cfd6", "#e2b84a", "#aeb6bf"];
  p.ell(x, y, r, r, null, 2.6 * s);
  const n = big ? 6 : 4;
  for (let i = 0; i < n; i++) {
    const a = ang + (i - (n - 1) / 2) * 0.42, L = (big ? 26 : 22) * s, dx = Math.sin(a), dy = Math.cos(a);
    const bx = x + dx * (r + 5 * s), by = y + dy * (r + 5 * s), tx = x + dx * (r + L), ty = y + dy * (r + L), nx = dy, ny = -dx;
    p.poly([[bx + nx * 2.4 * s, by + ny * 2.4 * s], [tx + nx * 2.2 * s, ty + ny * 2.2 * s], [tx - nx * 1.2 * s, ty - ny * 1.2 * s], [tx - nx * 2.4 * s + dx * -4 * s, ty - ny * 2.4 * s - dy * 4 * s], [bx - nx * 2.4 * s, by - ny * 2.4 * s]], cols[i % 4], 1.6 * s);
    p.ell(bx, by, 5 * s, 5 * s, cols[i % 4], 1.8 * s);
  }
  if (!big) { const a = ang + 1.1, tx = x + Math.sin(a) * (r + 12 * s), ty = y + Math.cos(a) * (r + 12 * s); p.poly([[tx - 6 * s, ty - 4 * s], [tx + 6 * s, ty - 4 * s], [tx + 6 * s, ty + 10 * s], [tx - 6 * s, ty + 10 * s]], "#d8333b", 1.6 * s); }
};
const chipsBag = (p, x, y, u, rot = 0) => {
  const w = 15 * u, h = 20 * u, c = Math.cos(rot), s = Math.sin(rot), R = (a, b) => [x + a * c - b * s, y + a * s + b * c];
  const pts = [R(-w, -h), R(-w * 0.5, -h - 3 * u), R(0, -h), R(w * 0.5, -h - 3 * u), R(w, -h), R(w * 1.08, 0), R(w, h), R(-w, h), R(-w * 1.08, 0)];
  p.poly(pts, "#e3403a", 2.4 * u);
  const st = []; for (let i = 0; i < 16; i++) { const a = i / 16 * Math.PI * 2, rr = i % 2 ? 6 * u : 10 * u; st.push(R(Math.cos(a) * rr, Math.sin(a) * rr + 2 * u)); }
  p.poly(st, "#ffd23f", 1.4 * u);
  p.poly([R(-w, -h + 4 * u), R(w, -h + 4 * u), R(w, -h + 6 * u), R(-w, -h + 6 * u)], "#b72c2a", 0);
};
const flashlight = (p, x, y, u, up = true) => {
  const d = up ? -1 : 1;
  p.poly([[x - 4 * u, y + 14 * u * -d], [x + 4 * u, y + 14 * u * -d], [x + 4 * u, y + 6 * u * d], [x + 7 * u, y + 14 * u * d], [x - 7 * u, y + 14 * u * d], [x - 4 * u, y + 6 * u * d]], "#3b3f4a", 2 * u);
  p.ell(x, y + 14 * u * d, 7 * u, 2.6 * u, "#fff4b8", 1.6 * u);
};
const mop = (p, x, y, u, sole) => {
  p.band([[x, y - 120 * u], [x + 4 * u, sole - 30 * u]], "#b0784a", 3.4 * u, 1.3 * u, "round");
  const pts = []; for (let i = 0; i <= 10; i++) pts.push([x + 4 * u + (i - 5) * 4.2 * u, sole - 4 * u + (i % 2) * 3 * u]);
  p.poly([[x - 12 * u, sole - 30 * u], [x + 20 * u, sole - 30 * u], ...pts.reverse()], "#d9d4c6", 2 * u);
  for (let i = -3; i <= 3; i++) p.stroke([[x + 4 * u + i * 4 * u, sole - 26 * u], [x + 4 * u + i * 4.6 * u, sole - 8 * u]], 1.2 * u, "#a39d8c");
  p.band([[x - 13 * u, sole - 30 * u], [x + 21 * u, sole - 30 * u]], "#3f6a8a", 5 * u, 1.3 * u);
};

/** front-facing modern character. opts: expr, blink, look, facing, seed, L/R arm poses, tilt, headTilt, bob, step, sit ('desk'|'floor'),
 *  propL/propR ('chips','chip','flash','keys','mop'), jingle, blush, spiky, sweat, phones, glint, bang (0..1), swing */
export const teenFront = (p, key, opts = {}) => {
  const O = typeof key === "string" ? TEENS[key] : key;
  const { expr = "neutral", blink = 0, look = 0, facing = 0, seed = 5, L = "hang", R = "hang", tilt = 0, headTilt = 0,
    bob = 0, light = rad(-120), step = 0, sit = null, propL = null, propR = null, jingle = 0, blush = 0, spiky = 0, sweat = false,
    phones = false, glint = 0, swing = 0 } = opts;
  const lid = lidOf(blink), skin = O.skin;
  const H = headBlob(seed, 118, facing), W = 2 * H.a, HH = 2 * H.b, u = W / 100;
  const torsoL = O.stout ? 1.12 : 1.06, legsL = 1.36, sole = 975;
  const seat = sit === "desk" ? 338 : sit === "chair" ? 200 : sit === "floor" ? 0.62 * HH : legsL * HH;
  const torsoBot = sole - seat - bob * HH, chin = torsoBot - torsoL * HH, hc = chin - H.b, hipY = torsoBot - 0.12 * HH;
  const thick = thickAngle(light), ow = 5 * u, cx = 300;
  const armCol = mix(O.top, INK, 0.35);
  p.rot = null;
  // head transform (used for hair behind the body too)
  const [cpx, cpy] = rotAbout([cx, chin], rad(tilt), [cx, hipY]);
  const Ah = tilt + headTilt, headRot = Ah ? [rad(Ah), cx, chin, cpx - cx, cpy - chin] : null;
  // ---- long hair behind everything ----
  if (O.style === "long") {
    p.rot = headRot;
    const hb = blobPts(cx, hc + 0.5 * H.b, { a: H.a * 1.13, b: H.b * 1.62, nTop: 2.0, nBot: 2.8, egg: 0.16, asym: 0, rot: 0, noise: 0.012, seed: seed + 11 });
    p.shadedFill(hb, O.hair, mul(O.hair, SH_FELT), light, H.a * 1.1, 0.3);
    p.clip(hb, () => { for (let i = -4; i <= 4; i++) p.stroke([[cx + i * 18 * u, hc + 0.3 * H.b], [cx + i * 20 * u, hc + 2.0 * H.b]], 1.6 * u, mul(O.hair, [1.5, 1.5, 1.5])); });
    p.inkRing(hb, ow * 0.85, thick);
    p.rot = null;
  }
  if (O.style === "bun") {
    p.rot = headRot;
    p.ell(cx + 4 * u, hc - 1.02 * H.b, 0.42 * H.a, 0.36 * H.a, O.hair, ow * 0.85);
    p.rot = null;
  }
  // ---- legs ----
  const ol0 = p.ol; p.ol = 2.2 * u;
  const shoe = (fx, fy, side, front) => {
    if (front) { p.ell(fx, fy - 6 * u, 9 * u, 7.5 * u, O.shoe, 2.2 * u); p.stroke([[fx - 8 * u, fy - 3 * u], [fx + 8 * u, fy - 3 * u]], 2 * u, O.trim); return; }
    const pts = [[fx - side * 5 * u, fy - 9 * u], [fx + side * 9 * u, fy - 8 * u], [fx + side * 15 * u, fy - 2 * u], [fx + side * 14 * u, fy + 2 * u], [fx - side * 6 * u, fy + 2 * u]];
    p.poly(pts, O.shoe, 2.2 * u);
    p.stroke([[fx - side * 5 * u, fy - 1 * u], [fx + side * 14 * u, fy - 1 * u]], 2.2 * u, O.trim);
  };
  if (sit === "desk" || sit === "chair") {
    for (const side of [-1, 1]) {
      const hx = cx + side * 15 * u, kx = cx + side * 21 * u, ky = torsoBot + 0.06 * HH, sw = swing * Math.sin(side * 1.3 + 0.4) * 10 * u;
      p.line([[hx, torsoBot - 0.04 * HH], [kx, ky]], O.pants, 10 * u);
      const fy = sit === "chair" ? sole - 10 * u : ky + 0.62 * HH;
      p.line([[kx, ky], [kx + sw * 0.5, (ky + fy) / 2], [kx + sw, fy]], O.pants, 7 * u);
      shoe(kx + sw, fy + 8 * u, side, true);
    }
  } else if (sit === "floor") {
    for (const side of [-1, 1]) {
      const hx = cx + side * 16 * u, fx = cx + side * 34 * u, fy = sole - 16 * u;
      p.line([[hx, torsoBot - 0.05 * HH], [hx + side * 6 * u, (torsoBot + fy) / 2], [fx, fy - 8 * u]], O.pants, 12 * u);
      p.ell(fx, fy - 2 * u, 10 * u, 14 * u, O.shoe, 2.4 * u);
      p.ell(fx, fy - 2 * u, 6 * u, 10 * u, mul(O.shoe, [0.85, 0.85, 0.88]), 0);
      for (let k = -1; k <= 1; k++) p.stroke([[fx - 5 * u, fy - 2 * u + k * 5 * u], [fx + 5 * u, fy - 2 * u + k * 5 * u]], 1.2 * u, O.trim);
    }
  } else {
    for (const side of [-1, 1]) {
      const up = Math.max(0, Math.sin(Math.PI * 2 * (step + (side > 0 ? 0.5 : 0)))) * 30 * (step ? 1 : 0);
      const hx = cx + side * 15 * u, fx = cx + side * 20 * u, fy = sole - 4 * u - up;
      if (O.skirt) p.stroke(curve([hx, hipY], [(hx + fx) / 2, (hipY + fy) / 2], [fx, fy]), 4.6 * u, mix(O.skin, INK, 0.25));
      else p.line(curve([hx, hipY], [(hx + fx) / 2 + side * 2 * u, (hipY + fy) / 2], [fx, fy]), O.pants, 7.5 * u);
      shoe(fx, fy + 2 * u, side, false);
    }
  }
  p.ol = ol0;
  // ---- upper body ----
  p.rot = tilt ? [rad(tilt), cx, hipY] : null;
  const T = { a: (0.4 * W) / 1.06 * (O.stout ? 1.14 : 1), b: 0.5 * (torsoBot - (chin - 0.25 * HH)), nTop: 2.2, nBot: 2.6, egg: O.stout ? 0.17 : 0.1, asym: 0.04 * facing, rot: 0, noise: 0.006, seed: seed + 7 };
  const tcx = cx + 3 * u * facing, tcy = torsoBot - T.b, tp = blobPts(tcx, tcy, T);
  const S = (side) => [tcx + side * 0.85 * T.a, chin + 0.12 * HH];
  const ph = opts.bang || 0;
  const arm = (side, pose) => {
    const s = S(side), X = (k) => tcx + side * (T.a * 1.1 + k * u);
    switch (pose) {
      case "point": return { pts: [s, [X(28), s[1] - 0.02 * HH], [X(62), s[1] - 0.1 * HH]], front: false, finger: true };
      case "up": return { pts: [s, [X(14), s[1] - 0.3 * HH], [X(22), s[1] - 0.75 * HH]], front: false };
      case "wave": return { pts: [s, [X(16), s[1] - 0.2 * HH], [X(30 + 10 * Math.sin(opts.wv || 0)), s[1] - 0.62 * HH]], front: false };
      case "hip": return { pts: [s, [X(22), s[1] + 0.3 * HH], [tcx + side * T.a * 0.95, torsoBot - 0.3 * HH]], front: false };
      case "belly": return { pts: [s, [X(8), s[1] + 0.45 * HH], [tcx + side * 0.25 * T.a, torsoBot - 0.35 * HH]], front: true };
      case "cross": return { pts: [s, [X(2), s[1] + 0.38 * HH], [tcx - side * 0.45 * T.a, s[1] + 0.32 * HH]], front: true };
      case "cheek": return { pts: [s, [X(16), s[1] + 0.05 * HH], [cx + side * (H.a - 4 * u), hc + 0.3 * H.b]], front: true, over: true };
      case "eat": return { pts: [s, [X(16), s[1] + 0.3 * HH], [cx + side * 12 * u, hc + 0.62 * H.b]], front: true, over: true };
      case "hold": return { pts: [s, [X(10), s[1] + 0.36 * HH], [tcx + side * 0.42 * T.a, torsoBot - 0.32 * HH]], front: true };
      case "glass": return { pts: [s, [X(22), s[1] + 0.02 * HH], [X(16), s[1] - 0.34 * HH]], front: true };
      case "bang": return { pts: [s, [X(20), s[1] - 0.06 * HH], [X(6 + 6 * ph), s[1] - (0.3 + 0.2 * ph) * HH]], front: true, fist: true };
      case "cup": return { pts: [s, [X(14), s[1] + 0.16 * HH], [cx + side * 0.36 * H.a, hc + 0.66 * H.b]], front: true, over: true };
      case "pull": return { pts: [s, [X(16), s[1] - 0.32 * HH], [cx + side * 0.42 * H.a, hc - 1.3 * H.b + ph * 10 * u]], front: false, fist: true };
      case "flash": return { pts: [s, [X(4), s[1] + 0.36 * HH], [cx + side * 0.1 * H.a, chin + 0.16 * HH]], front: true };
      case "keysup": return { pts: [s, [X(22), s[1] - 0.08 * HH], [X(18), s[1] - 0.5 * HH]], front: false };
      case "shrug": return { pts: [s, [X(22), s[1] + 0.26 * HH], [X(36), s[1] + 0.06 * HH]], front: false };
      case "mop": return { pts: [s, [X(10), s[1] + 0.3 * HH], [X(12), s[1] + 0.42 * HH]], front: false };
      case "lock": return { pts: [s, [X(16), s[1] + 0.22 * HH], [X(34), s[1] + 0.48 * HH]], front: false };
      case "chin": return { pts: [s, [X(12), s[1] + 0.3 * HH], [cx + side * 0.2 * H.a, chin - 0.02 * HH]], front: true, over: true };
      case "lean": return { pts: [s, [X(6), s[1] + 0.3 * HH], [X(-2), torsoBot - 0.05 * HH]], front: false };
      default: return { pts: [s, [X(4), s[1] + 0.48 * HH], [X(3), chin + 1.0 * HH]], front: false };
    }
  };
  const arms = [arm(-1, L), arm(1, R)], props = [propL, propR];
  const drawArm = (a, i) => {
    p.ol = 1.8 * u; p.line(curve(a.pts[0], a.pts[1], a.pts[2]), O.blazer || O.coverall || O.hood || O.cardigan ? O.top : armCol, 5.4 * u); p.ol = ol0;
    const [hx, hy] = a.pts[2], pr = props[i];
    if (pr === "mop") mop(p, hx, hy, u, sole);
    if (pr === "chips") chipsBag(p, hx, hy + 14 * u, u, i ? 0.15 : -0.15);
    if (pr === "flash") flashlight(p, hx, hy - 4 * u, u, true);
    if (pr === "keys") keyring(p, hx, hy + 6 * u, u * 1.2, jingle, false);
    if (pr === "bigkeys") keyring(p, hx, hy + 6 * u, u * 1.3, jingle, true);
    p.ell(hx, hy, (a.fist ? 7 : 6) * u, (a.fist ? 6.5 : 6) * u, skin, 2.2 * u);
    if (pr === "chip") p.ell(hx + 2 * u, hy - 6 * u, 7 * u, 5 * u, "#f5c542", 1.6 * u, 0, 360, 20);
    if (a.finger) { const dx = a.pts[2][0] - a.pts[1][0], dy = a.pts[2][1] - a.pts[1][1], l = Math.hypot(dx, dy); p.stroke([[hx, hy], [hx + dx / l * 14 * u, hy + dy / l * 14 * u]], 4.6 * u); p.stroke([[hx, hy], [hx + dx / l * 13 * u, hy + dy / l * 13 * u]], 2.2 * u, skin); }
  };
  // hood behind the neck
  if (O.hood) { const hd = ellPts(tcx, chin + 0.04 * HH, 0.6 * W * 0.5 * 1.25, 0.15 * HH, 0, 360, 0, 32); p.gradFill(hd, mul(O.top, [0.86, 0.86, 0.9]), mul(O.top, SH_CLOTH), light); p.inkRing(hd, ow * 0.8, thick); }
  arms.forEach((a, i) => { if (!a.front) drawArm(a, i); });
  // hips (pants top / skirt)
  if (sit !== "floor") {
    const lowY = O.skirt ? torsoBot + 0.42 * HH : torsoBot + 0.1 * HH;
    const hp_ = [[tcx - 0.92 * T.a, torsoBot - 0.22 * HH], [tcx + 0.92 * T.a, torsoBot - 0.22 * HH], [tcx + (O.skirt ? 0.95 : 0.98) * T.a, lowY], [tcx - (O.skirt ? 0.95 : 0.98) * T.a, lowY]];
    p.gradFill(hp_, O.skirt || O.pants, mul(O.skirt || O.pants, SH_CLOTH), light); p.poly(hp_, null, ow * 0.8);
    if (!O.skirt && sit !== "desk" && sit !== "chair") p.stroke([[tcx, torsoBot - 0.1 * HH], [tcx, lowY - 2 * u]], 1.4 * u);
  }
  p.gradFill(tp, O.top, mul(O.top, SH_CLOTH), light);
  p.clip(tp, () => {
    if (O.hood) {
      for (const s of [-1, 1]) { p.stroke([[tcx + s * 9 * u, chin + 0.07 * HH], [tcx + s * 11 * u, chin + 0.42 * HH]], 2 * u, "#f2efe8"); p.dot(tcx + s * 11 * u, chin + 0.44 * HH, 2.6 * u, "#f2efe8"); }
      const pk = [[tcx - 0.5 * T.a, torsoBot - 0.5 * HH], [tcx + 0.5 * T.a, torsoBot - 0.5 * HH], [tcx + 0.72 * T.a, torsoBot - 0.16 * HH], [tcx - 0.72 * T.a, torsoBot - 0.16 * HH]];
      p.poly(pk, mul(O.top, [0.9, 0.9, 0.92]), 1.8 * u);
      p.band([[tcx - 1.4 * T.a, torsoBot - 0.08 * HH], [tcx + 1.4 * T.a, torsoBot - 0.08 * HH]], mul(O.top, [0.8, 0.8, 0.85]), 0.07 * HH, 1.2 * u);
    }
    if (O.cardigan) {
      p.poly([[tcx - 0.3 * T.a, chin - 0.2 * HH], [tcx + 0.3 * T.a, chin - 0.2 * HH], [tcx + 0.22 * T.a, torsoBot + 0.1 * HH], [tcx - 0.22 * T.a, torsoBot + 0.1 * HH]], O.tee, 1.8 * u);
      for (let k = 0; k < 4; k++) p.dot(tcx - 0.36 * T.a, chin + (0.12 + k * 0.22) * HH, 2.4 * u, "#8a5a1e");
      p.stroke([[tcx - 0.3 * T.a, chin + 0.02 * HH], [tcx, chin + 0.1 * HH], [tcx + 0.3 * T.a, chin + 0.02 * HH]], 1.8 * u);
      p.band([[tcx - 1.4 * T.a, torsoBot - 0.06 * HH], [tcx + 1.4 * T.a, torsoBot - 0.06 * HH]], mul(O.top, [0.85, 0.82, 0.8]), 0.06 * HH, 1.2 * u);
    }
    if (O.coverall) {
      p.stroke([[tcx, chin], [tcx, torsoBot]], 1.6 * u);
      p.poly(rrect(tcx + 0.15 * T.a, chin + 0.16 * HH, tcx + 0.62 * T.a, chin + 0.4 * HH, 3 * u), mul(O.top, [0.9, 0.92, 0.95]), 1.6 * u);
      p.ell(tcx - 0.42 * T.a, chin + 0.26 * HH, 0.22 * T.a, 0.07 * HH, "#f4f0e6", 1.6 * u);
      p.band([[tcx - 1.4 * T.a, torsoBot - 0.2 * HH], [tcx + 1.4 * T.a, torsoBot - 0.2 * HH]], "#3a2a20", 0.05 * HH, 1.2 * u);
      p.poly(rrect(tcx - 6 * u, torsoBot - 0.23 * HH, tcx + 6 * u, torsoBot - 0.17 * HH, 1.5 * u), "#c9b46a", 1.2 * u);
    }
    if (O.blazer) {
      p.poly([[tcx - 0.36 * T.a, chin - 0.2 * HH], [tcx + 0.36 * T.a, chin - 0.2 * HH], [tcx, chin + 0.5 * HH]], O.tee, 1.6 * u);
      for (const s of [-1, 1]) p.poly([[tcx + s * 0.36 * T.a, chin - 0.1 * HH], [tcx + s * 0.6 * T.a, chin + 0.02 * HH], [tcx + s * 0.1 * T.a, chin + 0.46 * HH], [tcx + s * 0.04 * T.a, chin + 0.38 * HH]], mul(O.top, [0.78, 0.76, 0.84]), 1.6 * u);
      for (let k = 0; k < 2; k++) p.dot(tcx, chin + (0.58 + k * 0.18) * HH, 2.6 * u, "#e8c45a");
      if (O.badge) { p.poly(rrect(tcx + 0.42 * T.a, chin + 0.22 * HH, tcx + 0.78 * T.a, chin + 0.38 * HH, 1.5 * u), "#ffffff", 1.4 * u); p.band([[tcx + 0.46 * T.a, chin + 0.26 * HH], [tcx + 0.74 * T.a, chin + 0.26 * HH]], "#2f5fb0", 2 * u, 0); }
    }
  });
  p.inkRing(tp, ow, thick);
  // keys on the belt loop
  if (O.keys && !opts.nokeys) {
    const kx = tcx + 0.62 * T.a, ky = torsoBot - 0.08 * HH;
    if (O.keys === "big") keyring(p, kx, ky + 8 * u, u * 1.05, jingle, true);
    else { p.band([[kx, ky - 6 * u], [kx + 2 * u, ky + 14 * u]], "#d8333b", 3.2 * u, 1 * u); keyring(p, kx + 2 * u, ky + 20 * u, u * 0.95, jingle, false); }
  }
  arms.forEach((a, i) => { if (a.front && !a.over) drawArm(a, i); });
  // ---- head ----
  p.rot = headRot;
  const hp = blobPts(cx, hc, H);
  p.shadedFill(hp, skin, mul(skin, SH_SKIN), light, H.a);
  p.inkRing(hp, ow, thick);
  if (O.cap) hatOn(p, { hat: "cap", cap: O.cap, jacket: O.top }, hp, H, cx, hc, light, seed, facing, false);
  else if (O.hair) {
    hatOn(p, { hat: "hair", hair: O.hair, jacket: O.top }, hp, H, cx, hc, light, seed, facing, false);
    if (O.style === "messy") {
      const TU = [[-30, 0.86, 13, -14], [-12, 0.97, 18, -10], [6, 1.0, 22, 6], [24, 0.93, 16, 14], [38, 0.78, 10, 16]];
      for (const [dx, yk, hh, ln] of TU) {
        const bx = cx + dx * u, by = hc - H.b * yk + 8 * u, hgt = (spiky ? 44 + hh * 0.5 : hh) * u, lean = (spiky ? dx * 0.15 : ln) * u;
        p.poly([[bx - 11 * u, by + 4 * u], [bx - 4 * u + lean * 0.5, by - hgt * 0.6], [bx + lean, by - hgt], [bx + 2 * u + lean * 0.3, by - hgt * 0.45], [bx + 11 * u, by + 4 * u]], O.hair, 2.4 * u);
      }
    }
    if (O.style === "long") {
      for (const s of [-1, 1]) {
        const x0 = cx + s * 0.86 * H.a, y0 = hc - 0.55 * H.b;
        const lock = [[x0, y0], [x0 + s * 0.26 * H.a, y0 + 0.2 * H.b], [cx + s * 1.12 * H.a, hc + 1.15 * H.b], [cx + s * 0.92 * H.a, hc + 1.35 * H.b], [cx + s * 0.8 * H.a, hc + 0.5 * H.b]];
        p.poly(lock, O.hair, ow * 0.7);
      }
      p.poly(rrect(cx + 26 * u, hc - 0.78 * H.b, cx + 46 * u, hc - 0.66 * H.b, 2 * u), O.clip, 1.6 * u);
    }
  }
  faceFront(p, cx, hc, W, expr, facing, look, lid, !!O.cap, skin, O.moustache, !!O.stout);
  const fx = cx + 7 * u * facing;
  if (blush > 0) { const g = p.g; g.save(); g.globalAlpha = Math.min(1, blush) * 0.75; for (const s of [-1, 1]) p.ell(fx + s * 25 * u, hc + 11 * u, 9 * u, 5 * u, "#ff6f86", 0); g.restore(); }
  if (O.glasses) {
    for (const s of [-1, 1]) p.ell(fx + s * 13 * u, hc, 11 * u, 9.5 * u, null, 2.6 * u);
    p.stroke([[fx - 2.5 * u, hc - 1 * u], [fx + 2.5 * u, hc - 1 * u]], 2.4 * u);
    if (glint > 0) { const g = p.g; g.save(); g.globalAlpha = glint; for (const s of [-1, 1]) p.ell(fx + s * 13 * u, hc, 10 * u, 8.5 * u, "#ffffff", 0); g.restore(); }
  }
  if (sweat) p.ell(cx - 40 * u * (facing || 1), hc - 20 * u, 3.5 * u, 6 * u, "#9fd4ff", 2 * u);
  if (phones) {
    p.band(ellPts(cx, hc - 0.1 * H.b, H.a * 1.06, H.b * 1.02, 195, 345, 0, 24), "#2d2f38", 4.5 * u, 1.4 * u, "round");
    for (const s of [-1, 1]) p.ell(cx + s * 1.02 * H.a, hc + 0.05 * H.b, 9 * u, 15 * u, "#e2433a", 2.2 * u);
  }
  p.rot = tilt ? [rad(tilt), cx, hipY] : null;
  arms.forEach((a, i) => { if (a.over) drawArm(a, i); });
  p.rot = null;
};

/** close-up insert of a keyring with a readable tag (text drawn upright) */
export const keysCard = (p, ang = 0, label = "") => {
  const u = 3.2;
  p.band([[300, 120], [300, 330]], "#d8333b", 34, 6);
  keyring(p, 300, 380, u * 2.2, ang, false);
  if (label) {
    const g = p.g; g.save(); g.translate(300, 640); g.font = "900 34px Arial Black, Arial"; g.textAlign = "center";
    p.poly(rrect(-120, -36, 120, 20, 10), "#fbf7ee", 6); g.fillStyle = INK; g.fillText(label, 0, 0); g.restore();
  }
};
/** flashlight beam fan (screen-space card) */
export const fxBeam = (p, a = 1) => {
  const g = p.g, gr = g.createLinearGradient(300, 980, 300, 80); gr.addColorStop(0, `rgba(255,246,200,${0.75 * a})`); gr.addColorStop(1, "rgba(255,246,200,0)");
  g.save(); g.fillStyle = gr; g.beginPath(); g.moveTo(285, 980); g.lineTo(60, 80); g.lineTo(540, 80); g.lineTo(315, 980); g.closePath(); g.fill(); g.restore();
};
/** heart pop (k 0..1) */
export const fxHeart = (p, k = 1, col = "#ff4d6d") => {
  const s = 0.4 + 0.6 * Math.min(1, k * 1.6) + 0.08 * Math.sin(k * 18) * (1 - k), pts = [];
  for (let i = 0; i <= 60; i++) { const t = i / 60 * Math.PI * 2, x = 16 * Math.pow(Math.sin(t), 3), y = -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t)); pts.push([300 + x * 12 * s, 500 + y * 12 * s]); }
  p.poly(pts, col, 16);
  p.stroke(ellPts(300 - 90 * s, 420 * 1 + (1 - s) * 80, 40 * s, 26 * s, 200, 290, 0, 10), 14, "#ffffffaa");
};
/** shout lines (k 0..1) */
export const fxShout = (p, k = 0) => {
  for (let i = 0; i < 7; i++) {
    const a = -Math.PI / 2 + (i - 3) * 0.32, r0 = 140 + 60 * k, r1 = r0 + 110 + 30 * Math.sin(i * 2 + k * 9);
    p.line([[300 + Math.cos(a) * r0, 560 + Math.sin(a) * r0], [300 + Math.cos(a) * r1, 560 + Math.sin(a) * r1]], "#ffffff", 16);
  }
};
/** crumbs (k 0..1) */
export const fxCrumbs = (p, k = 0) => {
  for (let i = 0; i < 6; i++) { const x = 260 + i * 18 + Math.sin(i * 7) * 20, y = 420 + k * (300 + i * 30) + i * 10; p.ell(x, y, 10, 7, "#f5c542", 6, 0, 360, i * 40); }
};
/** bang impact star */
export const fxBang = (p, k = 0) => {
  const pts = []; for (let i = 0; i < 20; i++) { const a = i / 20 * Math.PI * 2, r = (i % 2 ? 90 : 200) * (0.6 + 0.4 * (1 - k)); pts.push([300 + Math.cos(a) * r, 500 + Math.sin(a) * r]); }
  const g = p.g; g.save(); g.globalAlpha = 1 - k * 0.8; p.poly(pts, "#fff3b0", 14); g.restore();
};

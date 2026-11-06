'use strict';
// Mascot art: outlined, part-based drawings with arms, legs and poses. Two body plans:
//   suit:  a costumed mascot on two legs in a jersey (most schools)
//   beast: a live animal on four legs wearing a team blanket (Bevo, Ralphie, Reveille, the Schooner ponies)
// Each kind in ART names its body plan and its head (and tail, collar...). Drawings face right with the feet
// at (0, 0). drawMascot in mascots.js sends any kind listed here to drawArt; other kinds use the old drawing.
// Poses: idle, run, air, attack, special, hurt, still.

const OUTLINE = '#15171d';

// lighten (k > 0) or darken (k < 0) a #rrggbb colour
function shade(hex, k) {
  const n = parseInt(hex.slice(1), 16), to = k < 0 ? 0 : 255, a = Math.abs(k);
  const c = [n >> 16, (n >> 8) & 255, n & 255].map(v => Math.round(v + (to - v) * a));
  return `rgb(${c[0]},${c[1]},${c[2]})`;
}
// the jersey number colour: the trim if it stands out, else white or near black
function numberColor(jersey, trim) {
  if (Math.abs(lum(trim) - lum(jersey)) > 0.3) return trim;
  return lum(jersey) > 0.5 ? '#1a1a1a' : '#f4f4f4';
}
function lum(hex) {
  const n = parseInt(hex.slice(1), 16);
  return (0.3 * (n >> 16) + 0.59 * ((n >> 8) & 255) + 0.11 * (n & 255)) / 255;
}

// fill a path and give it the outline
function blob(ctx, fill, path, lw = 2.5) {
  ctx.beginPath();
  path();
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.lineWidth = lw;
  ctx.strokeStyle = OUTLINE;
  ctx.lineJoin = 'round';
  ctx.stroke();
}
function oval(ctx, x, y, rx, ry, rot = 0) {
  ctx.moveTo(x + rx * Math.cos(rot), y + rx * Math.sin(rot));
  ctx.ellipse(x, y, rx, ry, rot, 0, Math.PI * 2);
}

// a thick outlined line through pts, tapering from width w0 to w1 (arms, legs, tails, trunks, horns)
function limb(ctx, pts, w0, color, w1 = w0) {
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  const n = pts.length - 1;
  for (const pass of [0, 1]) {
    for (let i = 0; i < n; i++) {
      const wd = w0 + (w1 - w0) * (i / Math.max(1, n - 1));
      ctx.beginPath();
      ctx.moveTo(pts[i][0], pts[i][1]);
      ctx.lineTo(pts[i + 1][0], pts[i + 1][1]);
      ctx.lineWidth = pass ? wd : wd + 5;
      ctx.strokeStyle = pass ? color : OUTLINE;
      ctx.stroke();
    }
  }
}
// points along a quadratic curve, for limb()
function curve(x0, y0, cx, cy, x1, y1, n = 6) {
  const pts = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n, u = 1 - t;
    pts.push([u * u * x0 + 2 * u * t * cx + t * t * x1, u * u * y0 + 2 * u * t * cy + t * t * y1]);
  }
  return pts;
}

// an eye with an angry brow (brow > 0 tilts it down toward the front)
function eye(ctx, x, y, s, brow = 0.35) {
  blob(ctx, '#ffffff', () => oval(ctx, x, y, s, s * 1.15), 2);
  ctx.fillStyle = '#111111';
  ctx.beginPath(); oval(ctx, x + s * 0.3, y + s * 0.1, s * 0.5, s * 0.62); ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.beginPath(); oval(ctx, x + s * 0.45, y - s * 0.15, s * 0.16, s * 0.16); ctx.fill();
  if (brow) {
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = s * 0.5;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(x - s * 1.0, y - s * 1.35 - brow * s);
    ctx.lineTo(x + s * 1.1, y - s * 1.35 + brow * s);
    ctx.stroke();
  }
}

function artPose(pose, t) {
  const p = { bob: 0, legF: 0, legB: 0, kneeF: 0, kneeB: 0, armF: 0.25, armB: -0.2, lean: 0, swing: 0 };
  if (pose === 'idle') {
    const s = Math.sin(t / 10);
    p.bob = s * 1.5; p.armF += s * 0.08; p.armB -= s * 0.08;
  } else if (pose === 'run') {
    const s = Math.sin(t / 3);
    p.legF = s * 0.7; p.legB = -s * 0.7; p.kneeF = -Math.max(0, -s) * 0.9; p.kneeB = -Math.max(0, s) * 0.9;
    p.armF = -s * 0.8 + 0.15; p.armB = s * 0.8 + 0.15; p.lean = 0.1; p.bob = -Math.abs(Math.cos(t / 3)) * 2.5; p.swing = s;
  } else if (pose === 'air') {
    p.legF = 0.8; p.legB = -0.2; p.kneeF = -1.4; p.kneeB = -1.0; p.armF = 2.4; p.armB = 2.0;
  } else if (pose === 'attack') {
    p.armF = 1.65; p.armB = -0.6; p.lean = 0.14; p.legF = 0.4; p.legB = -0.4;
  } else if (pose === 'special') {
    p.armF = 2.0; p.armB = 1.4; p.lean = 0.06; p.legF = 0.3; p.legB = -0.3;
  } else if (pose === 'hurt') {
    const s = Math.sin(t * 0.8);
    p.armF = 2.6 + s * 0.4; p.armB = 2.2 - s * 0.4; p.legF = 0.5; p.legB = -0.5; p.kneeB = -0.6; p.lean = -0.18;
  } else if (pose === 'kick') {
    p.legF = 1.45; p.legB = -0.25; p.armF = 0.9; p.armB = -0.9; p.lean = -0.12;
  } else if (pose === 'sweep') {
    p.legF = 1.35; p.kneeF = -0.1; p.legB = -0.9; p.kneeB = -1.6; p.armF = 0.7; p.armB = -0.3; p.lean = 0.25; p.bob = 5;
  } else if (pose === 'uppercut') {
    p.armF = 2.9; p.armB = -0.4; p.legF = 0.3; p.legB = -0.4; p.kneeB = -0.5; p.lean = -0.08; p.bob = -3;
  } else if (pose === 'stomp') {
    p.legF = 0.15; p.legB = -0.15; p.armF = 2.6; p.armB = 2.4;
  } else if (pose === 'charge') {
    const s = Math.sin(t / 2);
    p.legF = s * 0.8; p.legB = -s * 0.8; p.kneeF = -Math.max(0, -s); p.kneeB = -Math.max(0, s);
    p.armF = -0.5; p.armB = -0.9; p.lean = 0.38; p.swing = s;
  } else if (pose === 'rise') {
    p.armF = 2.9; p.armB = 2.7; p.legF = 0.2; p.kneeF = -0.9; p.legB = -0.3; p.kneeB = -1.1;
  } else if (pose === 'guard') {
    p.armF = 1.3; p.armB = 1.6; p.legF = 0.35; p.legB = -0.35; p.lean = -0.05;
  } else if (pose === 'throw') {
    p.armF = 2.2; p.armB = -0.7; p.legF = 0.45; p.legB = -0.4; p.lean = 0.1;
  } else if (pose === 'brace') {
    p.legF = 0.5; p.legB = -0.5; p.armF = 0.7; p.armB = 0.6; p.bob = 3; p.lean = 0.04;
  }
  return p;
}

// which pose a move shows: the normals each have their own, specials go by what the move does
const NORMAL_POSES = { jab: 'attack', side: 'kick', up: 'uppercut', down: 'sweep', dair: 'stomp' };
function movePose(mv) {
  if (NORMAL_POSES[mv.name]) return NORMAL_POSES[mv.name];
  const d = mv.def;
  if (d.counter) return 'guard';
  if (mv.name === 'upB') return 'rise';
  if (d.keepMomentum) return 'charge';
  if (d.projectile || mv.name === 'reload') return 'throw';
  if (d.armor) return 'brace';
  return 'special';
}
// poses where the arm punches straight out, and where a held weapon points along the arm
const STRAIGHT_ARM = new Set(['attack', 'throw', 'uppercut']);
const WEAPON_OUT = new Set(['attack', 'special', 'throw', 'uppercut', 'rise']);
// four-legged fighters have fewer poses; the rest map onto these
const BEAST_POSE = { kick: 'attack', sweep: 'attack', uppercut: 'attack', stomp: 'air', charge: 'run', throw: 'attack',
  rise: 'air', guard: 'idle', brace: 'idle', special: 'attack' };

// a jersey number per school, so it never changes between matches
function jerseyNumber(m) {
  let n = 7;
  for (const ch of m.school || m.name) n = (n * 31 + ch.charCodeAt(0)) % 97;
  return String(n + 1);
}

// ---- body plans ----

// the torso outline every suit shares: shoulder pads at the top, narrower at the waist
const TORSO = { top: -0.67, waist: -0.35, sw: 0.4, ww: 0.32 };
function torsoPath(ctx, w, h) {
  const top = TORSO.top * h, waist = TORSO.waist * h, sw = TORSO.sw * w, ww = TORSO.ww * w;
  ctx.moveTo(-sw, top + 7);
  ctx.quadraticCurveTo(-sw, top, -sw + 9, top);
  ctx.lineTo(sw - 9, top);
  ctx.quadraticCurveTo(sw, top, sw, top + 7);
  ctx.lineTo(ww, waist);
  ctx.lineTo(-ww, waist);
  ctx.closePath();
}
// fills a torso-shaped outfit: draw(ctx) paints inside the torso, then the outline goes on top
function outfit(ctx, w, h, base, draw) {
  ctx.beginPath(); torsoPath(ctx, w, h); ctx.fillStyle = base; ctx.fill();
  ctx.save(); ctx.beginPath(); torsoPath(ctx, w, h); ctx.clip(); draw(); ctx.restore();
  ctx.beginPath(); torsoPath(ctx, w, h); ctx.lineWidth = 2.5; ctx.strokeStyle = OUTLINE; ctx.stroke();
}

// Options a suit can set in ART: head, tail, neck, prop (held in the front hand), outfit (instead of the
// jersey), legs, arms (forearm colour), sleeve, pants, hands ('skin' for bare hands), glove, shoe, bigShoes.
// A beast can set head, tail, hump, neckUp and headLow.
function drawSuit(ctx, m, t, pose, A) {
  const w = m.w, h = m.h, p = artPose(pose, t);
  const fur = m.skin, jersey = m.color, trim = m.trim;
  const glove = A.hands === 'skin' ? fur : A.glove || '#f4f4f4';
  const legCol = A.legs || fur, armCol = A.arms || fur, shoe = A.shoe || '#f4f4f4', shoeS = A.bigShoes ? 1.6 : 1;
  const sleeve = A.sleeve || jersey;
  ctx.rotate(p.lean);
  ctx.translate(0, p.bob);

  const hipY = -0.33 * h, L = 0.14 * h, legW = 0.11 * h;
  const shY = -0.61 * h, upper = 0.15 * h, fore = 0.13 * h, armW = 0.1 * h;
  const leg = (x, a, k, col, sh) => {
    const kx = x + Math.sin(a) * L, ky = hipY + Math.cos(a) * L;
    const fx = kx + Math.sin(a + k) * L, fy = ky + Math.cos(a + k) * L;
    limb(ctx, [[x, hipY], [kx, ky], [fx, fy]], legW, col);
    blob(ctx, sh, () => { oval(ctx, fx + 0.04 * h * shoeS, fy - 0.01 * h * (shoeS - 1), 0.085 * h * shoeS, 0.05 * h * shoeS, a + k); });
    if (!A.shoe) { ctx.fillStyle = jersey; ctx.fillRect(fx, fy - 0.012 * h, 0.07 * h * shoeS, 0.022 * h); }
  };
  const arm = (x, a, col, slv, gl, front) => {
    const bend = STRAIGHT_ARM.has(pose) ? 0.05 : 0.45;
    const ex = x + Math.sin(a) * upper, ey = shY + Math.cos(a) * upper;
    const hx = ex + Math.sin(a + bend) * fore, hy = ey + Math.cos(a + bend) * fore;
    limb(ctx, [[x, shY], [ex, ey]], armW * 1.15, slv);
    limb(ctx, [[ex, ey], [hx, hy]], armW, col);
    if (front && A.prop) A.prop(ctx, hx, hy, a + bend, h, m, pose);
    blob(ctx, gl, () => oval(ctx, hx, hy, 0.065 * h, 0.065 * h));
  };

  if (A.tail) A.tail(ctx, m, t, p);
  arm(-0.15 * w, p.armB, shade(armCol, -0.2), shade(sleeve, -0.25), shade(glove, -0.15), false);
  leg(-0.1 * w, p.legB, p.kneeB, shade(legCol, -0.2), shade(shoe, -0.15));
  leg(0.1 * w, p.legF, p.kneeF, legCol, shoe);

  blob(ctx, A.pants || trim, () => roundRect(ctx, -0.34 * w, -0.4 * h, 0.68 * w, 0.12 * h, 5));
  if (A.outfit) A.outfit(ctx, m, w, h);
  else drawJersey(ctx, m, w, h);
  if (A.neck) A.neck(ctx, m, w, h);

  ctx.save();
  ctx.translate(0.08 * w, -0.86 * h);
  A.head(ctx, m, 0.23 * h, t, pose);
  ctx.restore();
  arm(0.19 * w, p.armF, armCol, sleeve, glove, true);
}

// the default top: a jersey with a hem stripe, collar and the school's number
function drawJersey(ctx, m, w, h) {
  const jersey = m.color, trim = m.trim;
  const top = TORSO.top * h, waist = TORSO.waist * h, ww = TORSO.ww * w;
  blob(ctx, jersey, () => torsoPath(ctx, w, h));
  ctx.fillStyle = trim;
  ctx.fillRect(-ww + 1, waist - 0.05 * h, 2 * ww - 2, 0.025 * h);
  ctx.beginPath();
  ctx.moveTo(0.0 * w, top + 1); ctx.lineTo(0.12 * w, top + 0.07 * h); ctx.lineTo(0.24 * w, top + 1);
  ctx.fill();
  const flip = ctx.getTransform().a < 0;
  ctx.save();
  ctx.translate(0.02 * w, -0.48 * h);
  if (flip) ctx.scale(-1, 1);
  ctx.font = `900 ${Math.round(0.19 * h)}px system-ui, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.lineWidth = 3;
  ctx.strokeStyle = OUTLINE;
  ctx.lineJoin = 'round';
  ctx.strokeText(jerseyNumber(m), 0, 1);
  ctx.fillStyle = numberColor(jersey, trim);
  ctx.fillText(jerseyNumber(m), 0, 1);
  ctx.restore();
}

function drawBeast(ctx, m, t, pose, A) {
  const charging = pose === 'charge';
  pose = BEAST_POSE[pose] || pose;
  if (charging) t *= 1.5;
  const h = m.h, W = m.w * 1.25, p = artPose(pose, t);
  const fur = m.skin, dark = shade(fur, -0.25);
  // the blanket is the team colour unless that is too close to the fur, then the trim colour
  const cloth = Math.abs(lum(m.color) - lum(fur)) < 0.2 || m.color === fur ? m.trim : m.color;
  const stripe = cloth === m.trim ? m.color : m.trim;
  const tilt = pose === 'attack' ? 0.08 : pose === 'hurt' ? -0.12 : 0;
  ctx.rotate(tilt);
  ctx.translate(0, p.bob);

  const bx = -0.04 * W, by = -0.5 * h, rx = 0.46 * W, ry = 0.2 * h;
  const legLen = 0.42 * h, legW = 0.1 * h;
  let gF = 0, gB = 0;
  if (pose === 'run') { gF = p.swing * 0.55; gB = -p.swing * 0.55; }
  else if (pose === 'air') { gF = 0.9; gB = -0.9; }
  else if (pose === 'hurt') { gF = 0.6 * Math.sin(t * 0.8); gB = -gF; }
  else if (pose === 'attack') { gF = 0.35; gB = -0.35; }
  const leg = (x, a, col) => {
    const top = by + ry * 0.35;
    const fx = x + Math.sin(a) * legLen, fy = top + Math.cos(a) * legLen;
    limb(ctx, [[x, top], [x + Math.sin(a) * legLen * 0.5, top + Math.cos(a) * legLen * 0.5], [fx, fy]], legW, col, legW * 0.75);
    blob(ctx, '#2a2420', () => roundRect(ctx, fx - legW * 0.55, fy - 3, legW * 1.1, 6, 2), 2);
  };

  // far legs, tail, body, hump, blanket, near legs, neck, head
  leg(bx + rx * 0.62 - 6, -gF, dark);
  leg(bx - rx * 0.6 - 6, -gB, dark);
  if (A.tail) A.tail(ctx, m, t, p, bx - rx, by - ry * 0.4);
  blob(ctx, fur, () => oval(ctx, bx, by, rx, ry));
  if (A.hump) blob(ctx, shade(fur, -0.2), () => oval(ctx, bx + rx * 0.4, by - ry * 0.45, rx * 0.55, ry * 1.05));
  blob(ctx, cloth, () => {
    ctx.moveTo(bx - rx * 0.55, by - ry * 0.85);
    ctx.quadraticCurveTo(bx, by - ry * 1.25, bx + rx * 0.5, by - ry * 0.85);
    ctx.lineTo(bx + rx * 0.45, by + ry * 0.45);
    ctx.lineTo(bx - rx * 0.5, by + ry * 0.45);
    ctx.closePath();
  });
  ctx.fillStyle = stripe;
  ctx.fillRect(bx - rx * 0.5, by + ry * 0.2, rx * 0.95, ry * 0.18);
  leg(bx + rx * 0.62, gF, fur);
  leg(bx - rx * 0.6, gB, fur);

  ctx.save();
  const headDrop = (pose === 'attack' ? 0.08 * h : 0) + (A.headLow || 0) * h, up = (A.neckUp || 0) * h;
  const hx = bx + rx * (up ? 1.02 : 0.98), hy = by - ry * 0.55 + headDrop - up;
  if (up) limb(ctx, [[bx + rx * 0.7, by - ry * 0.1], [hx - 0.04 * h, hy + 0.06 * h]], 0.16 * h, fur);
  ctx.translate(hx, hy);
  A.head(ctx, m, 0.19 * h, t, pose);
  ctx.restore();
}

// ---- heads, tails and extras by kind ----

function headBulldog(ctx, m, r) {
  const fur = m.skin, dark = shade(fur, -0.32), light = shade(fur, 0.4);
  blob(ctx, fur, () => oval(ctx, 0, 0, r * 1.1, r * 0.95));
  for (const [x, y, a] of [[-0.6, -0.75, -0.5], [0.15, -0.95, 0.3]]) blob(ctx, dark, () => oval(ctx, r * x, r * y, r * 0.3, r * 0.18, a), 2);
  ctx.strokeStyle = dark;
  ctx.lineWidth = 2;
  for (const k of [0, 1]) { ctx.beginPath(); ctx.arc(r * 0.05, -r * 0.2 - k * r * 0.22, r * 0.45, -2.3, -0.9); ctx.stroke(); }
  blob(ctx, shade(fur, -0.12), () => oval(ctx, r * 0.6, r * 0.78, r * 0.55, r * 0.26));
  blob(ctx, light, () => oval(ctx, r * 0.55, r * 0.35, r * 0.62, r * 0.46));
  for (const x of [0.25, 0.85]) blob(ctx, '#ffffff', () => { ctx.moveTo(r * x - r * 0.1, r * 0.72); ctx.lineTo(r * x, r * 0.5); ctx.lineTo(r * x + r * 0.1, r * 0.72); ctx.closePath(); }, 1.5);
  blob(ctx, '#1a1a1a', () => oval(ctx, r * 1.05, r * 0.12, r * 0.22, r * 0.16), 1.5);
  eye(ctx, r * 0.3, -r * 0.22, r * 0.21, 0.45);
}
function collarSpiked(ctx, m, w, h) {
  blob(ctx, '#1a1a1a', () => roundRect(ctx, -0.05 * w, -0.7 * h, 0.4 * w, 0.06 * h, 3), 2);
  ctx.fillStyle = '#c9ced6';
  for (let k = 0; k < 3; k++) {
    const x = 0.0 * w + k * 0.13 * w;
    ctx.beginPath(); ctx.moveTo(x, -0.64 * h); ctx.lineTo(x + 0.04 * w, -0.6 * h); ctx.lineTo(x + 0.08 * w, -0.64 * h); ctx.fill();
  }
}

function headElephant(ctx, m, r, t) {
  const g = m.skin, dark = shade(g, -0.22);
  blob(ctx, dark, () => oval(ctx, -r * 0.6, r * 0.15, r * 0.78, r * 1.0, -0.2));
  ctx.fillStyle = '#e8a6ac';
  ctx.beginPath(); oval(ctx, -r * 0.6, r * 0.2, r * 0.5, r * 0.72, -0.2); ctx.fill();
  blob(ctx, g, () => oval(ctx, 0, -r * 0.05, r, r * 0.92));
  const sway = Math.sin(t / 12) * 0.15 * r;
  limb(ctx, curve(r * 0.7, r * 0.25, r * 1.35, r * 0.8, r * 1.05 + sway, r * 1.45), r * 0.42, g, r * 0.26);
  ctx.fillStyle = g;
  ctx.beginPath(); oval(ctx, r * 0.66, r * 0.28, r * 0.24, r * 0.24); ctx.fill();
  blob(ctx, '#f6f1e2', () => { ctx.moveTo(r * 0.45, r * 0.55); ctx.quadraticCurveTo(r * 0.6, r * 1.05, r * 1.0, r * 1.05); ctx.lineTo(r * 0.75, r * 0.6); ctx.closePath(); }, 2);
  eye(ctx, r * 0.3, -r * 0.28, r * 0.2, 0.3);
}

function headGator(ctx, m, r) {
  const g = m.skin, belly = '#e8d58a', dark = shade(g, -0.3);
  blob(ctx, belly, () => roundRect(ctx, -r * 0.4, r * 0.15, r * 2.25, r * 0.5, r * 0.22));
  ctx.fillStyle = '#ffffff';
  for (let k = 0; k < 5; k++) {
    const x = r * (0.45 + k * 0.3);
    ctx.beginPath(); ctx.moveTo(x, r * 0.2); ctx.lineTo(x + r * 0.1, r * 0.02); ctx.lineTo(x + r * 0.2, r * 0.2); ctx.fill();
  }
  blob(ctx, g, () => {
    ctx.moveTo(-r * 0.9, r * 0.2);
    ctx.quadraticCurveTo(-r * 0.95, -r * 0.95, r * 0.05, -r * 0.85);
    ctx.quadraticCurveTo(r * 0.65, -r * 0.8, r * 0.85, -r * 0.3);
    ctx.lineTo(r * 1.85, -r * 0.12);
    ctx.quadraticCurveTo(r * 2.15, r * 0.02, r * 1.85, r * 0.15);
    ctx.lineTo(-r * 0.9, r * 0.2);
    ctx.closePath();
  });
  ctx.fillStyle = '#ffffff';
  for (let k = 0; k < 4; k++) {
    const x = r * (0.6 + k * 0.3);
    ctx.beginPath(); ctx.moveTo(x, r * 0.13); ctx.lineTo(x + r * 0.1, r * 0.32); ctx.lineTo(x + r * 0.2, r * 0.13); ctx.fill();
  }
  ctx.fillStyle = dark;
  for (const [x, y] of [[1.2, -0.05], [1.5, -0.02], [0.95, -0.12]]) { ctx.beginPath(); oval(ctx, r * x, r * y, r * 0.08, r * 0.05); ctx.fill(); }
  ctx.beginPath(); oval(ctx, r * 1.85, -r * 0.02, r * 0.07, r * 0.05); ctx.fill();
  blob(ctx, g, () => oval(ctx, r * 0.2, -r * 0.75, r * 0.4, r * 0.34));
  eye(ctx, r * 0.25, -r * 0.78, r * 0.21, 0.35);
}
function tailGator(ctx, m, t, p) {
  const h = m.h, w = m.w, sway = (p.swing || 0) * 0.05 * h;
  const pts = curve(-0.22 * w, -0.36 * h, -0.62 * w, -0.3 * h + sway, -0.8 * w, -0.06 * h, 4);
  limb(ctx, pts, 0.15 * h, shade(m.skin, -0.1), 0.05 * h);
  ctx.fillStyle = shade(m.skin, -0.35);
  for (let i = 1; i < pts.length - 1; i++) {
    const [x, y] = pts[i];
    ctx.beginPath(); ctx.moveTo(x - 4, y - 0.05 * h); ctx.lineTo(x, y - 0.1 * h); ctx.lineTo(x + 4, y - 0.05 * h); ctx.fill();
  }
}

function headLonghorn(ctx, m, r) {
  const fur = m.skin, light = shade(fur, 0.55), horn = '#f2ead8';
  // the far horn sweeps back, the near one forward; both very long
  limb(ctx, curve(-r * 0.1, -r * 0.6, -r * 1.3, -r * 0.7, -r * 2.3, -r * 1.5, 6), r * 0.32, shade(horn, -0.12), r * 0.12);
  blob(ctx, shade(fur, -0.25), () => oval(ctx, -r * 0.75, -r * 0.2, r * 0.4, r * 0.18, -0.4));
  blob(ctx, fur, () => oval(ctx, 0, 0, r * 0.85, r * 0.8));
  blob(ctx, light, () => oval(ctx, r * 0.65, r * 0.55, r * 0.58, r * 0.44, 0.2));
  ctx.fillStyle = light;
  ctx.beginPath(); ctx.moveTo(-r * 0.05, -r * 0.75); ctx.lineTo(r * 0.3, -r * 0.75); ctx.lineTo(r * 0.55, r * 0.3); ctx.lineTo(r * 0.2, r * 0.35); ctx.fill();
  ctx.fillStyle = '#3a2a1a';
  ctx.beginPath(); oval(ctx, r * 1.0, r * 0.5, r * 0.09, r * 0.07); ctx.fill();
  limb(ctx, curve(r * 0.1, -r * 0.62, r * 1.3, -r * 0.75, r * 2.3, -r * 1.6, 6), r * 0.32, horn, r * 0.12);
  eye(ctx, r * 0.2, -r * 0.18, r * 0.2, 0.3);
}
function tailTuft(ctx, m, t, p, x, y) {
  const s = Math.sin(t / 7) * 0.15 * m.h;
  limb(ctx, curve(x + 4, y, x - 0.12 * m.h, y + 0.1 * m.h, x - 0.08 * m.h + s, y + 0.3 * m.h, 4), 4, m.skin);
  blob(ctx, shade(m.skin, -0.35), () => oval(ctx, x - 0.08 * m.h + s, y + 0.33 * m.h, 5, 8));
}

// ---- shared face parts ----

function earsPointed(ctx, r, col, inner, tufts) {
  for (const [x, s] of [[-0.55, 0.85], [0.2, 1]]) {
    blob(ctx, col, () => { ctx.moveTo(r * (x - 0.25), -r * 0.6); ctx.lineTo(r * (x + 0.03), -r * 1.3 * s); ctx.lineTo(r * (x + 0.35), -r * 0.62); ctx.closePath(); }, 2);
    ctx.fillStyle = inner;
    ctx.beginPath(); ctx.moveTo(r * (x - 0.1), -r * 0.68); ctx.lineTo(r * (x + 0.04), -r * 1.08 * s); ctx.lineTo(r * (x + 0.2), -r * 0.68); ctx.fill();
    if (tufts) { ctx.strokeStyle = OUTLINE; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(r * (x + 0.03), -r * 1.3 * s); ctx.lineTo(r * (x + 0.03), -r * 1.55 * s); ctx.stroke(); }
  }
}
function earsRound(ctx, r, col, inner) {
  for (const x of [-0.6, 0.15]) {
    blob(ctx, col, () => oval(ctx, r * x, -r * 0.82, r * 0.32, r * 0.3), 2);
    ctx.fillStyle = inner; ctx.beginPath(); oval(ctx, r * x, -r * 0.8, r * 0.17, r * 0.16); ctx.fill();
  }
}
function whiskers(ctx, r, x = 0.75, y = 0.4) {
  ctx.strokeStyle = 'rgba(255,255,255,0.85)'; ctx.lineWidth = 1.2;
  for (const d of [-0.12, 0.08]) { ctx.beginPath(); ctx.moveTo(r * x, r * y); ctx.lineTo(r * (x + 0.75), r * (y + d)); ctx.stroke(); }
}
function noseTri(ctx, r, x, y, col = '#e8798a') {
  blob(ctx, col, () => { ctx.moveTo(r * (x - 0.15), r * y); ctx.lineTo(r * (x + 0.15), r * y); ctx.lineTo(r * x, r * (y + 0.18)); ctx.closePath(); }, 1.5);
}
function beak(ctx, r, len, col = '#f0b81c', hook = 0) {
  blob(ctx, col, () => {
    ctx.moveTo(r * 0.7, -r * 0.25);
    ctx.quadraticCurveTo(r * (0.9 + len), -r * 0.2, r * (0.95 + len), r * (0.1 + hook));
    ctx.lineTo(r * 0.7, r * 0.3);
    ctx.closePath();
  }, 2);
  ctx.strokeStyle = OUTLINE; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(r * 0.75, r * 0.05); ctx.lineTo(r * (0.75 + len * 0.8), r * 0.06); ctx.stroke();
}
// a human face: skin, nose, eye, mouth, optional moustache, beard or sideburns
function humanFace(ctx, m, r, o = {}) {
  blob(ctx, m.skin, () => oval(ctx, 0, 0, r * 0.95, r));
  if (o.beard) blob(ctx, o.beard, () => { ctx.moveTo(-r * 0.5, r * 0.1); ctx.quadraticCurveTo(-r * 0.3, r * 1.25, r * 0.6, r * 1.05); ctx.quadraticCurveTo(r * 1.05, r * 0.7, r * 0.9, r * 0.3); ctx.quadraticCurveTo(r * 0.4, r * 0.5, -r * 0.5, r * 0.1); ctx.closePath(); }, 2);
  if (o.chops) blob(ctx, o.chops, () => { ctx.moveTo(-r * 0.2, -r * 0.2); ctx.lineTo(r * 0.15, r * 0.75); ctx.lineTo(-r * 0.35, r * 0.6); ctx.closePath(); }, 2);
  eye(ctx, r * 0.4, -r * 0.15, r * 0.19, o.brow ?? 0.25);
  if (!o.beard) { ctx.strokeStyle = OUTLINE; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(r * 0.6, r * 0.45, r * 0.25, 0.2, 1.4); ctx.stroke(); }
  blob(ctx, m.skin, () => oval(ctx, r * 0.95, r * 0.15, r * 0.24, r * 0.2), 2);
  if (o.stache) blob(ctx, o.stache, () => { ctx.moveTo(r * 0.25, r * 0.45); ctx.quadraticCurveTo(r * 0.8, r * 0.2, r * 1.25, r * 0.55); ctx.quadraticCurveTo(r * 0.8, r * 0.5, r * 0.25, r * 0.6); ctx.closePath(); }, 2);
}

// ---- suit heads ----

function headTiger(ctx, m, r) {
  earsPointed(ctx, r, m.skin, '#f6f1e2');
  blob(ctx, m.skin, () => oval(ctx, 0, 0, r * 1.05, r * 0.95));
  ctx.fillStyle = '#1a1a1a';
  for (const [x, y, a] of [[-0.15, -0.72, 0.15], [0.15, -0.78, -0.15], [-0.62, -0.38, 0.7], [-0.78, 0.12, 1.2]]) { ctx.beginPath(); oval(ctx, r * x, r * y, r * 0.07, r * 0.24, a); ctx.fill(); }
  blob(ctx, '#f6f1e2', () => oval(ctx, r * 0.6, r * 0.4, r * 0.55, r * 0.4));
  noseTri(ctx, r, 1.0, 0.1);
  whiskers(ctx, r);
  eye(ctx, r * 0.3, -r * 0.2, r * 0.2, 0.4);
}
function headWildcat(ctx, m, r) {
  earsPointed(ctx, r, m.skin, shade(m.skin, 0.5), true);
  blob(ctx, m.skin, () => oval(ctx, 0, 0, r * 1.02, r * 0.92));
  ctx.strokeStyle = shade(m.skin, -0.4); ctx.lineWidth = 2.5;
  for (const y of [-0.05, 0.2]) { ctx.beginPath(); ctx.moveTo(-r * 0.85, r * y); ctx.lineTo(-r * 0.45, r * (y + 0.05)); ctx.stroke(); }
  blob(ctx, '#ffffff', () => oval(ctx, r * 0.6, r * 0.42, r * 0.5, r * 0.36));
  noseTri(ctx, r, 0.95, 0.15);
  whiskers(ctx, r);
  eye(ctx, r * 0.3, -r * 0.18, r * 0.21, 0.45);
}
function headCougar(ctx, m, r) {
  earsRound(ctx, r, m.skin, shade(m.skin, -0.35));
  blob(ctx, m.skin, () => oval(ctx, 0, 0, r * 1.0, r * 0.95));
  blob(ctx, '#f6f1e2', () => oval(ctx, r * 0.62, r * 0.42, r * 0.52, r * 0.38));
  ctx.fillStyle = '#3a2a1a';
  ctx.beginPath(); oval(ctx, r * 0.45, r * 0.38, r * 0.1, r * 0.14); ctx.fill();
  noseTri(ctx, r, 1.0, 0.12, '#b0505a');
  eye(ctx, r * 0.28, -r * 0.2, r * 0.2, 0.35);
}
function headBearcat(ctx, m, r) {
  earsRound(ctx, r, m.skin, '#c9c3bb');
  blob(ctx, m.skin, () => oval(ctx, 0, 0, r * 1.02, r * 0.95));
  blob(ctx, '#bdb6ad', () => oval(ctx, r * 0.6, r * 0.38, r * 0.55, r * 0.4));
  blob(ctx, '#111111', () => oval(ctx, r * 1.05, r * 0.2, r * 0.18, r * 0.14), 1.5);
  whiskers(ctx, r, 0.8, 0.45);
  eye(ctx, r * 0.3, -r * 0.22, r * 0.21, 0.4);
}
function headBear(ctx, m, r) {
  earsRound(ctx, r, m.skin, shade(m.skin, 0.3));
  blob(ctx, m.skin, () => oval(ctx, 0, 0, r * 1.05, r * 0.98));
  blob(ctx, '#d9b98f', () => oval(ctx, r * 0.6, r * 0.38, r * 0.58, r * 0.42));
  blob(ctx, '#111111', () => oval(ctx, r * 1.02, r * 0.15, r * 0.2, r * 0.15), 1.5);
  ctx.strokeStyle = OUTLINE; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(r * 1.0, r * 0.3); ctx.lineTo(r * 0.85, r * 0.6); ctx.stroke();
  eye(ctx, r * 0.3, -r * 0.22, r * 0.2, 0.5);
}
function headHog(ctx, m, r) {
  const dark = shade(m.skin, -0.35);
  for (const x of [-0.6, 0.0]) blob(ctx, dark, () => { ctx.moveTo(r * (x - 0.2), -r * 0.6); ctx.lineTo(r * (x - 0.3), -r * 1.25); ctx.lineTo(r * (x + 0.25), -r * 0.7); ctx.closePath(); }, 2);
  ctx.fillStyle = OUTLINE;
  for (let k = 0; k < 5; k++) { const x = -r * 0.9 + k * r * 0.28; ctx.beginPath(); ctx.moveTo(x, -r * 0.8); ctx.lineTo(x + r * 0.08, -r * 1.15); ctx.lineTo(x + r * 0.2, -r * 0.82); ctx.fill(); }
  blob(ctx, m.skin, () => oval(ctx, 0, 0, r * 1.05, r * 0.92));
  blob(ctx, '#d98a8a', () => oval(ctx, r * 1.05, r * 0.25, r * 0.3, r * 0.36));
  ctx.fillStyle = '#5a2a2a';
  for (const y of [0.12, 0.38]) { ctx.beginPath(); oval(ctx, r * 1.12, r * y, r * 0.06, r * 0.08); ctx.fill(); }
  blob(ctx, '#f6f1e2', () => { ctx.moveTo(r * 0.55, r * 0.6); ctx.quadraticCurveTo(r * 0.7, r * 0.2, r * 0.95, r * 0.0); ctx.lineTo(r * 0.75, r * 0.6); ctx.closePath(); }, 1.5);
  eye(ctx, r * 0.35, -r * 0.25, r * 0.19, 0.55);
}
function headShark(ctx, m, r) {
  const g = m.skin;
  blob(ctx, shade(g, -0.15), () => { ctx.moveTo(-r * 0.6, -r * 0.7); ctx.lineTo(-r * 0.75, -r * 1.65); ctx.lineTo(r * 0.25, -r * 0.8); ctx.closePath(); });
  blob(ctx, g, () => { ctx.moveTo(-r * 0.95, r * 0.4); ctx.quadraticCurveTo(-r * 1.0, -r * 0.95, r * 0.4, -r * 0.85); ctx.quadraticCurveTo(r * 1.5, -r * 0.6, r * 1.4, r * 0.25); ctx.quadraticCurveTo(r * 0.4, r * 1.1, -r * 0.95, r * 0.4); ctx.closePath(); });
  blob(ctx, '#e8eef5', () => { ctx.moveTo(-r * 0.3, r * 0.55); ctx.quadraticCurveTo(r * 0.6, r * 0.95, r * 1.35, r * 0.28); ctx.quadraticCurveTo(r * 0.6, r * 0.45, -r * 0.3, r * 0.55); ctx.closePath(); }, 2);
  ctx.fillStyle = '#ffffff';
  for (let k = 0; k < 5; k++) { const x = r * (0.1 + k * 0.24); ctx.beginPath(); ctx.moveTo(x, r * 0.45); ctx.lineTo(x + r * 0.1, r * 0.66); ctx.lineTo(x + r * 0.2, r * 0.44); ctx.fill(); }
  ctx.strokeStyle = shade(g, -0.4); ctx.lineWidth = 1.5;
  for (const x of [-0.55, -0.4, -0.25]) { ctx.beginPath(); ctx.moveTo(r * x, r * 0.05); ctx.lineTo(r * (x + 0.05), r * 0.35); ctx.stroke(); }
  eye(ctx, r * 0.5, -r * 0.3, r * 0.19, 0.5);
}
function headHound(ctx, m, r) {
  const ear = shade(m.skin, -0.45);
  blob(ctx, ear, () => oval(ctx, -r * 0.55, r * 0.15, r * 0.3, r * 0.75, 0.2));
  blob(ctx, m.skin, () => oval(ctx, 0, 0, r * 0.95, r * 0.9));
  ctx.fillStyle = shade(m.skin, -0.35);
  for (const [x, y] of [[-0.3, -0.5], [0.1, -0.65], [-0.1, -0.25], [-0.55, -0.2]]) { ctx.beginPath(); oval(ctx, r * x, r * y, r * 0.09, r * 0.08); ctx.fill(); }
  blob(ctx, '#ece3d3', () => oval(ctx, r * 0.7, r * 0.35, r * 0.6, r * 0.38));
  blob(ctx, '#111111', () => oval(ctx, r * 1.22, r * 0.15, r * 0.17, r * 0.14), 1.5);
  eye(ctx, r * 0.3, -r * 0.15, r * 0.19, 0.1);
  blob(ctx, ear, () => oval(ctx, r * 0.05, r * 0.25, r * 0.26, r * 0.7, -0.15));
}
function headRooster(ctx, m, r) {
  for (let k = 0; k < 3; k++) blob(ctx, '#e02a2a', () => oval(ctx, r * (-0.35 + k * 0.35), -r * (0.95 + (k === 1 ? 0.15 : 0)), r * 0.3, r * 0.32), 2);
  blob(ctx, m.skin, () => oval(ctx, 0, 0, r * 0.95, r * 0.95));
  beak(ctx, r, 0.7);
  blob(ctx, '#e02a2a', () => oval(ctx, r * 0.75, r * 0.6, r * 0.18, r * 0.3), 2);
  eye(ctx, r * 0.3, -r * 0.2, r * 0.2, 0.45);
}
function headHawk(ctx, m, r) {
  blob(ctx, shade(m.skin, -0.25), () => { ctx.moveTo(-r * 0.5, -r * 0.6); ctx.lineTo(-r * 1.35, -r * 0.9); ctx.lineTo(-r * 1.1, -r * 0.55); ctx.lineTo(-r * 1.45, -r * 0.4); ctx.lineTo(-r * 0.7, -r * 0.1); ctx.closePath(); });
  blob(ctx, m.skin, () => oval(ctx, 0, 0, r * 0.98, r * 0.95));
  ctx.fillStyle = '#ffffff';
  ctx.beginPath(); ctx.moveTo(-r * 0.6, r * 0.05); ctx.lineTo(r * 0.6, -r * 0.05); ctx.lineTo(r * 0.6, r * 0.15); ctx.lineTo(-r * 0.6, r * 0.25); ctx.fill();
  beak(ctx, r, 0.55, '#f0b81c', 0.35);
  eye(ctx, r * 0.32, -r * 0.3, r * 0.2, 0.55);
}
function headCardinal(ctx, m, r) {
  blob(ctx, m.skin, () => { ctx.moveTo(-r * 0.6, -r * 0.5); ctx.lineTo(-r * 0.95, -r * 1.8); ctx.lineTo(r * 0.35, -r * 0.75); ctx.closePath(); });
  blob(ctx, m.skin, () => oval(ctx, 0, 0, r * 0.98, r * 0.95));
  ctx.fillStyle = '#1a1a1a';
  ctx.beginPath(); ctx.moveTo(r * 0.05, -r * 0.35); ctx.lineTo(r * 0.95, -r * 0.35); ctx.lineTo(r * 0.95, r * 0.5); ctx.lineTo(r * 0.35, r * 0.75); ctx.closePath(); ctx.fill();
  beak(ctx, r, 0.5, '#f08a1c');
  eye(ctx, r * 0.42, -r * 0.18, r * 0.17, 0.3);
}
function headJayhawk(ctx, m, r) {
  blob(ctx, '#e8000d', () => { ctx.moveTo(-r * 0.6, -r * 0.6); ctx.quadraticCurveTo(-r * 0.6, -r * 1.7, r * 0.3, -r * 1.45); ctx.lineTo(r * 0.2, -r * 0.7); ctx.closePath(); });
  blob(ctx, m.skin, () => oval(ctx, 0, 0, r * 0.98, r * 0.95));
  blob(ctx, '#f5d040', () => { ctx.moveTo(r * 0.6, -r * 0.35); ctx.quadraticCurveTo(r * 2.0, -r * 0.3, r * 2.1, r * 0.25); ctx.quadraticCurveTo(r * 1.5, r * 0.55, r * 0.6, r * 0.45); ctx.closePath(); });
  ctx.strokeStyle = OUTLINE; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(r * 0.7, r * 0.1); ctx.lineTo(r * 1.9, r * 0.18); ctx.stroke();
  blob(ctx, '#ffffff', () => oval(ctx, r * 0.25, -r * 0.2, r * 0.32, r * 0.34), 2);
  eye(ctx, r * 0.28, -r * 0.2, r * 0.2, 0.35);
}
function headFrog(ctx, m, r) {
  const g = m.skin;
  for (const x of [-0.7, -0.35]) blob(ctx, '#d8c890', () => { ctx.moveTo(r * (x - 0.1), -r * 0.6); ctx.lineTo(r * (x - 0.25), -r * 1.15); ctx.lineTo(r * (x + 0.15), -r * 0.7); ctx.closePath(); }, 2);
  blob(ctx, g, () => oval(ctx, r * 0.1, r * 0.05, r * 1.1, r * 0.85));
  for (const x of [-0.15, 0.6]) {
    blob(ctx, g, () => oval(ctx, r * x, -r * 0.75, r * 0.38, r * 0.36));
    eye(ctx, r * x, -r * 0.78, r * 0.22, 0);
  }
  ctx.strokeStyle = OUTLINE; ctx.lineWidth = 2.5;
  ctx.beginPath(); ctx.moveTo(-r * 0.3, r * 0.3); ctx.quadraticCurveTo(r * 0.6, r * 0.75, r * 1.15, r * 0.15); ctx.stroke();
  ctx.fillStyle = shade(g, -0.35);
  for (const [x, y] of [[-0.6, 0.0], [-0.3, 0.55], [0.9, -0.2]]) { ctx.beginPath(); oval(ctx, r * x, r * y, r * 0.09, r * 0.07); ctx.fill(); }
}
function headDevil(ctx, m, r) {
  for (const x of [-0.45, 0.35]) blob(ctx, '#f0e0c0', () => { ctx.moveTo(r * (x - 0.2), -r * 0.7); ctx.quadraticCurveTo(r * (x - 0.1), -r * 1.4, r * (x + 0.35), -r * 1.6); ctx.quadraticCurveTo(r * (x + 0.1), -r * 1.15, r * (x + 0.2), -r * 0.75); ctx.closePath(); }, 2);
  blob(ctx, m.skin, () => oval(ctx, 0, 0, r * 0.95, r));
  blob(ctx, '#3a1010', () => { ctx.moveTo(r * 0.35, r * 0.7); ctx.lineTo(r * 0.7, r * 1.45); ctx.lineTo(r * 0.95, r * 0.6); ctx.closePath(); }, 2);
  ctx.strokeStyle = OUTLINE; ctx.lineWidth = 2.5;
  ctx.beginPath(); ctx.moveTo(r * 0.3, r * 0.45); ctx.quadraticCurveTo(r * 0.7, r * 0.65, r * 1.0, r * 0.3); ctx.stroke();
  blob(ctx, m.skin, () => oval(ctx, r * 0.95, r * 0.05, r * 0.2, r * 0.18), 2);
  eye(ctx, r * 0.38, -r * 0.2, r * 0.2, 0.6);
}
function headCowboy(ctx, m, r) {
  humanFace(ctx, m, r, { stache: '#3a2a1a', brow: 0.3 });
  blob(ctx, '#1a1a1a', () => oval(ctx, r * 0.05, -r * 0.7, r * 1.75, r * 0.26));
  blob(ctx, '#1a1a1a', () => { ctx.moveTo(-r * 0.75, -r * 0.75); ctx.quadraticCurveTo(-r * 0.8, -r * 1.75, r * 0.05, -r * 1.55); ctx.quadraticCurveTo(r * 0.85, -r * 1.75, r * 0.8, -r * 0.75); ctx.closePath(); });
  ctx.fillStyle = m.color; ctx.fillRect(-r * 0.74, -r * 0.98, r * 1.52, r * 0.16);
}
function headCaptain(ctx, m, r) {
  humanFace(ctx, m, r, { stache: '#d9d4cc', chops: '#d9d4cc', brow: 0.15 });
  blob(ctx, '#1a1a1a', () => { ctx.moveTo(-r * 1.5, -r * 0.45); ctx.quadraticCurveTo(-r * 0.2, -r * 2.0, r * 1.5, -r * 0.45); ctx.quadraticCurveTo(0, -r * 0.95, -r * 1.5, -r * 0.45); ctx.closePath(); });
  ctx.strokeStyle = m.trim; ctx.lineWidth = 2.5;
  ctx.beginPath(); ctx.moveTo(-r * 1.3, -r * 0.55); ctx.quadraticCurveTo(0, -r * 1.05, r * 1.3, -r * 0.55); ctx.stroke();
  blob(ctx, m.trim, () => oval(ctx, 0, -r * 1.05, r * 0.16, r * 0.16), 1.5);
}
function headFrontier(ctx, m, r) {
  humanFace(ctx, m, r, { beard: '#5a3a1e', brow: 0.2 });
  limb(ctx, curve(-r * 0.7, -r * 0.7, -r * 1.3, -r * 0.4, -r * 1.25, r * 0.5, 4), r * 0.32, '#7a5530', r * 0.26);
  ctx.fillStyle = '#3a2a1a';
  for (const y of [-0.3, 0.05, 0.35]) { ctx.beginPath(); oval(ctx, -r * 1.27, r * y, r * 0.16, r * 0.06); ctx.fill(); }
  blob(ctx, '#7a5530', () => { ctx.moveTo(-r * 0.95, -r * 0.35); ctx.quadraticCurveTo(-r * 0.95, -r * 1.35, r * 0.05, -r * 1.3); ctx.quadraticCurveTo(r * 1.0, -r * 1.3, r * 0.95, -r * 0.4); ctx.closePath(); });
}
function headKnight(ctx, m, r) {
  limb(ctx, curve(r * 0.0, -r * 1.0, -r * 0.8, -r * 1.6, -r * 1.5, -r * 0.9, 5), r * 0.35, m.trim, r * 0.15);
  blob(ctx, '#aeb6c0', () => { ctx.moveTo(-r * 0.95, r * 0.7); ctx.quadraticCurveTo(-r * 1.1, -r * 1.15, r * 0.1, -r * 1.05); ctx.quadraticCurveTo(r * 1.15, -r * 0.95, r * 1.05, r * 0.7); ctx.closePath(); });
  blob(ctx, '#2a2f36', () => roundRect(ctx, r * 0.05, -r * 0.4, r * 1.0, r * 0.32, 4), 2);
  ctx.fillStyle = '#ffffff';
  ctx.beginPath(); oval(ctx, r * 0.55, -r * 0.24, r * 0.12, r * 0.08); ctx.fill();
  ctx.strokeStyle = '#6a737e'; ctx.lineWidth = 2;
  for (let k = 0; k < 3; k++) { ctx.beginPath(); ctx.moveTo(r * (0.45 + k * 0.2), r * 0.1); ctx.lineTo(r * (0.45 + k * 0.2), r * 0.5); ctx.stroke(); }
}

// ---- outfits, extras, tails, props ----

function outfitCowboy(ctx, m, w, h) {
  outfit(ctx, w, h, m.color, () => {
    ctx.fillStyle = m.trim;
    ctx.fillRect(-0.45 * w, -0.7 * h, 0.35 * w, 0.4 * h);
    ctx.fillRect(0.22 * w, -0.7 * h, 0.25 * w, 0.4 * h);
    ctx.fillStyle = '#5a3a1e'; ctx.fillRect(-0.4 * w, -0.4 * h, 0.8 * w, 0.06 * h);
    ctx.fillStyle = '#e0c060'; ctx.fillRect(0.05 * w, -0.4 * h, 0.1 * w, 0.06 * h);
  });
  blob(ctx, '#c8102e', () => { ctx.moveTo(-0.15 * w, -0.68 * h); ctx.lineTo(0.32 * w, -0.68 * h); ctx.lineTo(0.12 * w, -0.55 * h); ctx.closePath(); }, 2);
  blob(ctx, '#3a2a1a', () => roundRect(ctx, -0.32 * w, -0.38 * h, 0.14 * w, 0.14 * h, 3), 2);
}
function outfitCoat(ctx, m, w, h) {
  outfit(ctx, w, h, m.color, () => {
    ctx.fillStyle = '#f4f4f4';
    ctx.beginPath(); ctx.moveTo(0.0 * w, -0.68 * h); ctx.lineTo(0.3 * w, -0.68 * h); ctx.lineTo(0.15 * w, -0.45 * h); ctx.fill();
    ctx.fillStyle = m.trim;
    for (let k = 0; k < 3; k++) { ctx.beginPath(); oval(ctx, 0.18 * w, -0.52 * h + k * 0.06 * h, 2.2, 2.2); ctx.fill(); }
    ctx.fillRect(-0.4 * w, -0.4 * h, 0.8 * w, 0.03 * h);
  });
  blob(ctx, m.trim, () => roundRect(ctx, 0.05 * w, -0.71 * h, 0.35 * w, 0.06 * h, 3), 2);
}
function outfitBuckskin(ctx, m, w, h) {
  outfit(ctx, w, h, '#9a6b3e', () => {
    ctx.fillStyle = m.color; ctx.fillRect(-0.45 * w, -0.47 * h, 0.9 * w, 0.06 * h);
    ctx.strokeStyle = '#6a4522'; ctx.lineWidth = 1.5;
    for (let k = 0; k < 7; k++) { const x = -0.38 * w + k * 0.12 * w; ctx.beginPath(); ctx.moveTo(x, -0.6 * h); ctx.lineTo(x, -0.53 * h); ctx.stroke(); }
    ctx.fillStyle = m.trim; ctx.fillRect(-0.4 * w, -0.4 * h, 0.8 * w, 0.05 * h);
  });
}
function outfitArmor(ctx, m, w, h) {
  outfit(ctx, w, h, '#aeb6c0', () => {
    ctx.fillStyle = m.color; ctx.fillRect(-0.45 * w, -0.66 * h, 0.9 * w, 0.06 * h);
    ctx.fillStyle = m.trim; ctx.fillRect(0.06 * w, -0.6 * h, 0.1 * w, 0.22 * h); ctx.fillRect(-0.04 * w, -0.53 * h, 0.3 * w, 0.06 * h);
    ctx.strokeStyle = '#6a737e'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(-0.32 * w, -0.43 * h); ctx.lineTo(0.32 * w, -0.43 * h); ctx.stroke();
  });
}
function tailCurl(stripes, tip) {
  return (ctx, m, t, p) => {
    const h = m.h, w = m.w, s = Math.sin(t / 9) * 0.04 * h + (p.swing || 0) * 0.03 * h;
    const pts = curve(-0.22 * w, -0.4 * h, -0.75 * w, -0.45 * h + s, -0.62 * w, -0.85 * h + s, 5);
    limb(ctx, pts, 0.075 * h, shade(m.skin, -0.08), 0.06 * h);
    if (stripes) { ctx.fillStyle = '#1a1a1a'; for (const i of [1, 2, 3, 4]) { ctx.beginPath(); oval(ctx, pts[i][0], pts[i][1], 0.02 * h, 0.04 * h, 0.6); ctx.fill(); } }
    if (tip) blob(ctx, tip, () => oval(ctx, pts[5][0], pts[5][1], 0.05 * h, 0.05 * h), 2);
  };
}
function tailFeathers(ctx, m, t, p) {
  const h = m.h, w = m.w, s = (p.swing || 0) * 0.02 * h;
  [shade(m.skin, -0.3), m.trim, m.skin].forEach((c, i) =>
    limb(ctx, curve(-0.2 * w, -0.45 * h, -0.55 * w, -0.55 * h - i * 0.06 * h, -0.65 * w - i * 2, -0.8 * h + i * 0.13 * h + s, 4), 0.08 * h, c, 0.04 * h));
}
function tailDevil(ctx, m, t, p) {
  const h = m.h, w = m.w, s = Math.sin(t / 8) * 0.05 * h;
  const pts = curve(-0.22 * w, -0.38 * h, -0.8 * w, -0.2 * h, -0.75 * w, -0.65 * h + s, 6);
  limb(ctx, pts, 3, m.skin);
  const [x, y] = pts[6];
  blob(ctx, m.skin, () => { ctx.moveTo(x - 6, y + 2); ctx.lineTo(x, y - 9); ctx.lineTo(x + 6, y + 2); ctx.closePath(); }, 2);
}
function tailHog(ctx, m, t) {
  const h = m.h, w = m.w, x = -0.33 * w, y = -0.42 * h, r = 0.04 * h;
  const pts = [];
  for (let k = 0; k <= 10; k++) { const a = k / 10 * Math.PI * 2.2 + t / 20; pts.push([x - r * 1.4 + Math.cos(a) * r * (1 - k / 20), y + Math.sin(a) * r]); }
  limb(ctx, [[x, y]].concat(pts), 2.5, m.skin);
}
function tailShark(ctx, m, t, p) {
  const h = m.h, w = m.w, s = (p.swing || 0) * 0.04 * h;
  limb(ctx, curve(-0.22 * w, -0.4 * h, -0.5 * w, -0.35 * h, -0.62 * w, -0.32 * h + s, 3), 0.1 * h, m.skin, 0.06 * h);
  blob(ctx, shade(m.skin, -0.15), () => { const x = -0.62 * w, y = -0.32 * h + s; ctx.moveTo(x, y); ctx.lineTo(x - 0.18 * w, y - 0.18 * h); ctx.lineTo(x - 0.1 * w, y); ctx.lineTo(x - 0.16 * w, y + 0.14 * h); ctx.closePath(); });
}
function capeBack(ctx, m, t, p) {
  const h = m.h, w = m.w, flow = 0.05 * h + (p.swing ? Math.abs(p.swing) * 0.08 * h : Math.sin(t / 10) * 0.02 * h);
  blob(ctx, shade(m.color, -0.15), () => {
    ctx.moveTo(-0.3 * w, -0.66 * h);
    ctx.quadraticCurveTo(-0.6 * w - flow, -0.4 * h, -0.55 * w - flow, -0.12 * h);
    ctx.lineTo(-0.15 * w, -0.18 * h);
    ctx.lineTo(0.05 * w, -0.66 * h);
    ctx.closePath();
  });
}
// long weapons stand upright in the hand, and point along the arm when swinging
function weaponAngle(a, pose) { return WEAPON_OUT.has(pose) ? a : a + 2.4; }
function propPitchfork(ctx, x, y, a, h, m, pose) {
  const d = weaponAngle(a, pose), dx = Math.sin(d), dy = Math.cos(d), L = 0.62 * h, px = -dy, py = dx;
  limb(ctx, [[x - dx * 0.15 * h, y - dy * 0.15 * h], [x + dx * L, y + dy * L]], 2.5, '#9aa3ad');
  const tx = x + dx * L, ty = y + dy * L;
  limb(ctx, [[tx - px * 0.08 * h, ty - py * 0.08 * h], [tx + px * 0.08 * h, ty + py * 0.08 * h]], 2.5, '#9aa3ad');
  for (const k of [-1, 0, 1]) limb(ctx, [[tx + px * k * 0.08 * h, ty + py * k * 0.08 * h], [tx + px * k * 0.08 * h + dx * 0.11 * h, ty + py * k * 0.08 * h + dy * 0.11 * h]], 2, '#9aa3ad');
}
function propSword(guard) {
  return (ctx, x, y, a, h, m, pose) => {
    const d = weaponAngle(a, pose), dx = Math.sin(d), dy = Math.cos(d), px = -dy, py = dx;
    limb(ctx, [[x, y], [x + dx * 0.5 * h, y + dy * 0.5 * h]], 4, '#dfe5ec', 2);
    limb(ctx, [[x + dx * 0.05 * h - px * 0.07 * h, y + dy * 0.05 * h - py * 0.07 * h], [x + dx * 0.05 * h + px * 0.07 * h, y + dy * 0.05 * h + py * 0.07 * h]], 3, guard || m.trim);
  };
}
function propMusket(ctx, x, y, a, h, m, pose) {
  const d = weaponAngle(a, pose), dx = Math.sin(d), dy = Math.cos(d);
  limb(ctx, [[x - dx * 0.2 * h, y - dy * 0.2 * h], [x + dx * 0.12 * h, y + dy * 0.12 * h]], 5, '#7a4a22');
  limb(ctx, [[x + dx * 0.1 * h, y + dy * 0.1 * h], [x + dx * 0.58 * h, y + dy * 0.58 * h]], 2.5, '#3a3a40');
}
function propPistol(ctx, x, y, a, h) {
  const dx = Math.sin(a), dy = Math.cos(a);
  limb(ctx, [[x, y], [x + dx * 0.15 * h, y + dy * 0.15 * h]], 3.5, '#5a6068');
}

// ---- beast heads ----

function headHorse(ctx, m, r) {
  const mane = '#4a3322';
  limb(ctx, curve(-r * 0.3, -r * 0.8, -r * 1.0, -r * 0.2, -r * 1.2, r * 1.0, 4), r * 0.4, mane, r * 0.3);
  for (const x of [-0.25, 0.1]) blob(ctx, m.skin, () => { ctx.moveTo(r * (x - 0.15), -r * 0.6); ctx.lineTo(r * x, -r * 1.25); ctx.lineTo(r * (x + 0.2), -r * 0.6); ctx.closePath(); }, 2);
  blob(ctx, m.skin, () => { ctx.moveTo(-r * 0.6, -r * 0.3); ctx.quadraticCurveTo(-r * 0.3, -r * 0.95, r * 0.4, -r * 0.6); ctx.quadraticCurveTo(r * 1.5, r * 0.2, r * 1.5, r * 0.75); ctx.quadraticCurveTo(r * 1.1, r * 1.15, r * 0.6, r * 0.8); ctx.quadraticCurveTo(-r * 0.4, r * 0.6, -r * 0.6, -r * 0.3); ctx.closePath(); });
  ctx.fillStyle = '#ffffff';
  ctx.beginPath(); ctx.moveTo(r * 0.1, -r * 0.6); ctx.lineTo(r * 0.35, -r * 0.6); ctx.lineTo(r * 1.25, r * 0.55); ctx.lineTo(r * 1.0, r * 0.6); ctx.fill();
  ctx.fillStyle = '#3a2a1a'; ctx.beginPath(); oval(ctx, r * 1.3, r * 0.65, r * 0.08, r * 0.06); ctx.fill();
  eye(ctx, r * 0.15, -r * 0.2, r * 0.18, 0.2);
}
function headCollie(ctx, m, r) {
  blob(ctx, '#f4efe6', () => oval(ctx, -r * 0.2, r * 0.85, r * 0.75, r * 0.6));
  for (const x of [-0.45, -0.05]) blob(ctx, m.skin, () => { ctx.moveTo(r * (x - 0.2), -r * 0.6); ctx.lineTo(r * (x + 0.05), -r * 1.3); ctx.lineTo(r * (x + 0.3), -r * 0.65); ctx.closePath(); }, 2);
  blob(ctx, m.skin, () => { ctx.moveTo(-r * 0.8, r * 0.2); ctx.quadraticCurveTo(-r * 0.8, -r * 0.85, r * 0.1, -r * 0.75); ctx.quadraticCurveTo(r * 0.6, -r * 0.6, r * 1.6, r * 0.2); ctx.quadraticCurveTo(r * 1.5, r * 0.55, r * 0.5, r * 0.6); ctx.quadraticCurveTo(-r * 0.6, r * 0.7, -r * 0.8, r * 0.2); ctx.closePath(); });
  ctx.fillStyle = '#f4efe6';
  ctx.beginPath(); ctx.moveTo(r * 0.1, -r * 0.75); ctx.lineTo(r * 0.3, -r * 0.7); ctx.lineTo(r * 1.4, r * 0.35); ctx.lineTo(r * 0.6, r * 0.5); ctx.fill();
  blob(ctx, '#111111', () => oval(ctx, r * 1.55, r * 0.2, r * 0.13, r * 0.1), 1.5);
  eye(ctx, r * 0.25, -r * 0.25, r * 0.18, 0.1);
}
function headBison(ctx, m, r) {
  const shag = shade(m.skin, -0.3);
  blob(ctx, shag, () => oval(ctx, -r * 0.1, -r * 0.1, r * 1.15, r * 1.05));
  blob(ctx, shag, () => { ctx.moveTo(r * 0.0, r * 0.6); ctx.lineTo(r * 0.3, r * 1.5); ctx.lineTo(r * 0.7, r * 0.6); ctx.closePath(); }, 2);
  blob(ctx, m.skin, () => oval(ctx, r * 0.5, r * 0.25, r * 0.7, r * 0.6));
  blob(ctx, '#2a1e16', () => oval(ctx, r * 1.0, r * 0.4, r * 0.3, r * 0.24), 2);
  limb(ctx, curve(r * 0.0, -r * 0.7, r * 0.5, -r * 1.0, r * 0.65, -r * 1.45, 3), r * 0.22, '#f2ead8', r * 0.1);
  eye(ctx, r * 0.45, -r * 0.1, r * 0.17, 0.4);
}

const ART = {
  bulldog: { body: 'suit', head: headBulldog, neck: collarSpiked },
  elephant: { body: 'suit', head: headElephant },
  gator: { body: 'suit', head: headGator, tail: tailGator },
  tiger: { body: 'suit', head: headTiger, tail: tailCurl(true) },
  cat: { body: 'suit', head: headWildcat, tail: tailCurl(false) },
  cougar: { body: 'suit', head: headCougar, tail: tailCurl(false, '#3a2a1a') },
  bearcat: { body: 'suit', head: headBearcat, tail: tailCurl(false) },
  bear: { body: 'suit', head: headBear },
  hog: { body: 'suit', head: headHog, tail: tailHog },
  shark: { body: 'suit', head: headShark, tail: tailShark },
  hound: { body: 'suit', head: headHound, tail: tailCurl(false, '#f4efe6') },
  rooster: { body: 'suit', head: headRooster, tail: tailFeathers, shoe: '#f0b81c' },
  hawk: { body: 'suit', head: headHawk, tail: tailFeathers, shoe: '#f0b81c' },
  cardinal: { body: 'suit', head: headCardinal, tail: tailFeathers, shoe: '#f08a1c' },
  jayhawk: { body: 'suit', head: headJayhawk, tail: tailFeathers, shoe: '#f5d040', bigShoes: true },
  frog: { body: 'suit', head: headFrog, tail: capeBack },
  devil: { body: 'suit', head: headDevil, tail: tailDevil, prop: propPitchfork },
  // people: outfits instead of jerseys; arms and sleeve set the forearm and upper arm colours
  cowboy: { body: 'suit', head: headCowboy, outfit: outfitCowboy, hands: 'skin', legs: '#2b3f66', pants: '#2b3f66', shoe: '#5a3a1e', prop: propPistol },
  captain: { body: 'suit', head: headCaptain, outfit: outfitCoat, arms: '#1a1a1a', legs: '#f4f4f4', pants: '#f4f4f4', shoe: '#1a1a1a', prop: propSword('#cfae70') },
  frontier: { body: 'suit', head: headFrontier, outfit: outfitBuckskin, hands: 'skin', sleeve: '#9a6b3e', arms: '#9a6b3e', legs: '#7a5530', pants: '#7a5530', shoe: '#3a2a1a', prop: propMusket },
  knight: { body: 'suit', head: headKnight, outfit: outfitArmor, sleeve: '#aeb6c0', arms: '#aeb6c0', glove: '#8a929c', legs: '#8a929c', pants: '#2a2f36', shoe: '#6a737e', prop: propSword() },
  longhorn: { body: 'beast', head: headLonghorn, tail: tailTuft },
  horse: { body: 'beast', head: headHorse, tail: tailTuft, neckUp: 0.12 },
  collie: { body: 'beast', head: headCollie, tail: tailTuft, neckUp: 0.06 },
  bison: { body: 'beast', head: headBison, tail: tailTuft, hump: true, headLow: 0.05 },
};

function drawArt(ctx, m, t, pose) {
  const A = ART[m.id];
  ctx.save();
  if (A.body === 'beast') drawBeast(ctx, m, t, pose, A);
  else drawSuit(ctx, m, t, pose, A);
  ctx.restore();
}

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
  }
  return p;
}

// a jersey number per school, so it never changes between matches
function jerseyNumber(m) {
  let n = 7;
  for (const ch of m.school || m.name) n = (n * 31 + ch.charCodeAt(0)) % 97;
  return String(n + 1);
}

// ---- body plans ----

function drawSuit(ctx, m, t, pose, A) {
  const w = m.w, h = m.h, p = artPose(pose, t);
  const fur = m.skin, jersey = m.color, trim = m.trim, glove = A.glove || '#f4f4f4';
  ctx.rotate(p.lean);
  ctx.translate(0, p.bob);

  const hipY = -0.33 * h, L = 0.14 * h, legW = 0.11 * h;
  const shY = -0.61 * h, upper = 0.15 * h, fore = 0.13 * h, armW = 0.1 * h;
  const leg = (x, a, k, col, shoe) => {
    const kx = x + Math.sin(a) * L, ky = hipY + Math.cos(a) * L;
    const fx = kx + Math.sin(a + k) * L, fy = ky + Math.cos(a + k) * L;
    limb(ctx, [[x, hipY], [kx, ky], [fx, fy]], legW, col);
    blob(ctx, shoe, () => { oval(ctx, fx + 0.04 * h, fy, 0.085 * h, 0.05 * h, a + k); });
    ctx.fillStyle = jersey;
    ctx.fillRect(fx + 0.0 * h, fy - 0.012 * h, 0.07 * h, 0.022 * h);
  };
  const arm = (x, a, col, sleeve, gl) => {
    const bend = pose === 'attack' ? 0.05 : 0.45;
    const ex = x + Math.sin(a) * upper, ey = shY + Math.cos(a) * upper;
    const hx = ex + Math.sin(a + bend) * fore, hy = ey + Math.cos(a + bend) * fore;
    limb(ctx, [[x, shY], [ex, ey]], armW * 1.15, sleeve);
    limb(ctx, [[ex, ey], [hx, hy]], armW, col);
    blob(ctx, gl, () => oval(ctx, hx, hy, 0.065 * h, 0.065 * h));
  };

  if (A.tail) A.tail(ctx, m, t, p);
  arm(-0.15 * w, p.armB, shade(fur, -0.2), shade(jersey, -0.25), shade(glove, -0.15));
  leg(-0.1 * w, p.legB, p.kneeB, shade(fur, -0.2), shade('#f4f4f4', -0.15));
  leg(0.1 * w, p.legF, p.kneeF, fur, '#f4f4f4');

  // shorts, then the jersey with shoulder pads, collar and number
  blob(ctx, trim, () => roundRect(ctx, -0.34 * w, -0.4 * h, 0.68 * w, 0.12 * h, 5));
  const top = -0.67 * h, waist = -0.35 * h, sw = 0.4 * w, ww = 0.32 * w;
  blob(ctx, jersey, () => {
    ctx.moveTo(-sw, top + 7);
    ctx.quadraticCurveTo(-sw, top, -sw + 9, top);
    ctx.lineTo(sw - 9, top);
    ctx.quadraticCurveTo(sw, top, sw, top + 7);
    ctx.lineTo(ww, waist);
    ctx.lineTo(-ww, waist);
    ctx.closePath();
  });
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
  if (A.neck) A.neck(ctx, m, w, h);

  ctx.save();
  ctx.translate(0.08 * w, -0.86 * h);
  A.head(ctx, m, 0.23 * h, t, pose);
  ctx.restore();
  arm(0.19 * w, p.armF, fur, jersey, glove);
}

function drawBeast(ctx, m, t, pose, A) {
  const h = m.h, W = m.w * 1.25, p = artPose(pose, t);
  const fur = m.skin, dark = shade(fur, -0.25);
  // the blanket is the team colour unless that is too close to the fur, then the trim colour
  const cloth = Math.abs(lum(m.color) - lum(fur)) < 0.12 || m.color === fur ? m.trim : m.color;
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

  // far legs, tail, body, blanket, near legs, head
  leg(bx + rx * 0.62 - 6, -gF, dark);
  leg(bx - rx * 0.6 - 6, -gB, dark);
  if (A.tail) A.tail(ctx, m, t, p, bx - rx, by - ry * 0.4);
  blob(ctx, fur, () => oval(ctx, bx, by, rx, ry));
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
  const headDrop = pose === 'attack' ? 0.08 * h : 0;
  ctx.translate(bx + rx * 0.98, by - ry * 0.55 + headDrop);
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

const ART = {
  bulldog: { body: 'suit', head: headBulldog, neck: collarSpiked },
  elephant: { body: 'suit', head: headElephant },
  gator: { body: 'suit', head: headGator, tail: tailGator },
  longhorn: { body: 'beast', head: headLonghorn, tail: tailTuft },
};

function drawArt(ctx, m, t, pose) {
  const A = ART[m.id];
  ctx.save();
  if (A.body === 'beast') drawBeast(ctx, m, t, pose, A);
  else drawSuit(ctx, m, t, pose, A);
  ctx.restore();
}

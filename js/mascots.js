'use strict';
// Builds a fighter's stats and moves from its roster entry, and draws mascots.
// Move boxes: dx is the centre offset forward of the feet, dy the centre offset from the feet (negative is up).
// angle is the launch angle in degrees (0 forward, 90 straight up, negative is down).

const WEIGHTS = {
  Light:  { walk: 4.5, air: 4.1, gravity: 0.44, fallSpeed: 8.5, jump: 11.2, airJumps: 2, weight: 0.85, power: 0.85, speed: 0.85 },
  Medium: { walk: 4.0, air: 3.6, gravity: 0.52, fallSpeed: 10, jump: 12, airJumps: 1, weight: 1.0, power: 1.0, speed: 1.0 },
  Heavy:  { walk: 3.4, air: 3.1, gravity: 0.58, fallSpeed: 11.5, jump: 12.2, airJumps: 1, weight: 1.22, power: 1.15, speed: 1.12 },
};

const SHAPES = {
  bulldog: { w: 56, h: 62 },
  tiger: { w: 54, h: 64 },
  longhorn: { w: 60, h: 68 },
  duck: { w: 44, h: 56 },
};

function baseMoves(h, power, speed) {
  const f = n => Math.max(1, Math.round(n * speed));
  const mv = (s, a, r, box, dmg, base, scale, angle) =>
    ({ startup: f(s), active: a, recovery: f(r), box, dmg: dmg * power, base, scale, angle });
  return {
    jab:  mv(3, 3, 9,  { dx: 30, dy: -h * 0.55, w: 36, h: 26 }, 3, 3, 0.04, 30),
    side: mv(8, 4, 18, { dx: 42, dy: -h * 0.55, w: 48, h: 30 }, 9, 6, 0.11, 38),
    up:   mv(6, 5, 14, { dx: 6, dy: -h - 12, w: 56, h: 34 }, 7, 6, 0.095, 85),
    down: mv(7, 4, 16, { dx: 28, dy: -10, w: 70, h: 20 }, 8, 7, 0.07, 25),
    dair: mv(9, 6, 14, { dx: 0, dy: 10, w: 42, h: 32 }, 9, 4, 0.08, -75),
  };
}

const playable = entry => !!KITS[entry.id];

const fighterCache = {};
function fighterData(entry) {
  if (fighterCache[entry.id]) return fighterCache[entry.id];
  const W = WEIGHTS[entry.weight], S = SHAPES[entry.kind];
  const d = Object.assign({}, W, S, { id: entry.kind, name: entry.mascot, school: entry.school,
    color: entry.color, trim: entry.trim, skin: entry.skin });
  d.moves = Object.assign(baseMoves(d.h, W.power, W.speed), KITS[entry.id]);
  return (fighterCache[entry.id] = d);
}

// Draws a mascot standing at (0, 0) feet, facing right. Caller handles position and flip.
function drawMascot(ctx, m, t, pose) {
  const w = m.w, h = m.h;
  const bob = pose === 'idle' ? Math.sin(t / 10) * 1.5 : 0;
  // legs
  ctx.fillStyle = m.trim;
  const step = pose === 'run' ? Math.sin(t / 3) * 6 : 0;
  ctx.fillRect(-w * 0.3 + step, -h * 0.28, w * 0.2, h * 0.28);
  ctx.fillRect(w * 0.1 - step, -h * 0.28, w * 0.2, h * 0.28);
  // body (jersey)
  ctx.save();
  ctx.translate(0, bob);
  ctx.fillStyle = m.color;
  roundRect(ctx, -w / 2, -h * 0.72, w, h * 0.48, 10);
  ctx.fill();
  ctx.fillStyle = m.trim;
  ctx.fillRect(-w / 2, -h * 0.5, w, 4);
  // head
  const hx = w * 0.12, hy = -h * 0.8, hr = h * 0.2;
  ctx.fillStyle = m.skin;
  if (m.id === 'tiger') drawEars(ctx, hx, hy, hr, m.skin);
  if (m.id === 'bulldog') {
    ctx.fillStyle = '#8f7a5e';
    for (const s of [-1, 1]) { ctx.beginPath(); ctx.ellipse(hx + s * hr * 0.85, hy - hr * 0.55, hr * 0.38, hr * 0.24, s * 0.7, 0, Math.PI * 2); ctx.fill(); }
    ctx.fillStyle = m.skin;
  }
  ctx.beginPath(); ctx.arc(hx, hy, hr, 0, Math.PI * 2); ctx.fill();
  if (m.id === 'tiger') {
    ctx.strokeStyle = '#1a1a1a'; ctx.lineWidth = 2;
    for (const a of [-0.6, 0, 0.6]) { ctx.beginPath(); ctx.moveTo(hx + a * hr, hy - hr); ctx.lineTo(hx + a * hr * 0.8, hy - hr * 0.55); ctx.stroke(); }
  }
  if (m.id === 'bulldog') {
    ctx.fillStyle = '#b39d80';
    ctx.beginPath(); ctx.ellipse(hx + hr * 0.5, hy + hr * 0.35, hr * 0.6, hr * 0.42, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(-w * 0.3, -h * 0.66, w * 0.6, 4);
  }
  if (m.id === 'duck') {
    ctx.fillStyle = '#f08a1c';
    ctx.beginPath(); ctx.moveTo(hx + hr * 0.7, hy - 2); ctx.lineTo(hx + hr * 1.7, hy + 3); ctx.lineTo(hx + hr * 0.7, hy + 8); ctx.fill();
  }
  if (m.id === 'longhorn') {
    ctx.strokeStyle = '#f2ead8'; ctx.lineWidth = 5; ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(hx, hy - hr * 0.6);
    ctx.quadraticCurveTo(hx - hr * 2.4, hy - hr * 0.9, hx - hr * 2.6, hy - hr * 1.8);
    ctx.moveTo(hx, hy - hr * 0.6);
    ctx.quadraticCurveTo(hx + hr * 2.4, hy - hr * 0.9, hx + hr * 2.6, hy - hr * 1.8);
    ctx.stroke();
    ctx.fillStyle = '#e8d2b0';
    ctx.beginPath(); ctx.ellipse(hx + hr * 0.6, hy + hr * 0.3, hr * 0.5, hr * 0.38, 0, 0, Math.PI * 2); ctx.fill();
  }
  // eye
  ctx.fillStyle = '#ffffff';
  ctx.beginPath(); ctx.arc(hx + hr * 0.35, hy - hr * 0.2, hr * 0.24, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#111111';
  ctx.beginPath(); ctx.arc(hx + hr * 0.42, hy - hr * 0.2, hr * 0.12, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}

function drawEars(ctx, hx, hy, hr, color) {
  ctx.fillStyle = color;
  for (const s of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(hx + s * hr * 0.3, hy - hr * 0.7);
    ctx.lineTo(hx + s * hr * 0.9, hy - hr * 1.35);
    ctx.lineTo(hx + s * hr * 1.0, hy - hr * 0.4);
    ctx.fill();
  }
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

'use strict';
// Builds a fighter's stats and moves from its roster entry, and draws mascots.
// Move boxes: dx is the centre offset forward of the feet, dy the centre offset from the feet (negative is up).
// angle is the launch angle in degrees (0 forward, 90 straight up, negative is down).

const WEIGHTS = {
  Light:  { walk: 4.5, air: 4.1, gravity: 0.44, fallSpeed: 8.5, jump: 11.2, airJumps: 2, weight: 0.85, power: 0.85, speed: 0.85 },
  Medium: { walk: 4.0, air: 3.6, gravity: 0.52, fallSpeed: 10, jump: 12, airJumps: 1, weight: 1.0, power: 1.0, speed: 1.0 },
  Heavy:  { walk: 3.4, air: 3.1, gravity: 0.58, fallSpeed: 11.5, jump: 12.2, airJumps: 1, weight: 1.12, power: 1.07, speed: 1.12 },
};

const SHAPES = {
  bulldog: { w: 56, h: 62 },
  tiger: { w: 54, h: 64 },
  longhorn: { w: 60, h: 68 },
  duck: { w: 44, h: 56 },
  cowboy: { w: 48, h: 72 },
  elephant: { w: 64, h: 70 },
  hog: { w: 62, h: 60 },
  gator: { w: 62, h: 62 },
  cat: { w: 46, h: 58 },
  rooster: { w: 44, h: 60 },
  shark: { w: 56, h: 62 },
  horse: { w: 62, h: 70 },
  hound: { w: 54, h: 56 },
  captain: { w: 50, h: 68 },
  devil: { w: 48, h: 66 },
  bear: { w: 60, h: 66 },
  bison: { w: 68, h: 68 },
  cougar: { w: 46, h: 58 },
  bearcat: { w: 48, h: 58 },
  collie: { w: 54, h: 56 },
  frontier: { w: 52, h: 68 },
  knight: { w: 50, h: 68 },
  frog: { w: 50, h: 56 },
  hawk: { w: 46, h: 62 },
  cardinal: { w: 44, h: 58 },
  jayhawk: { w: 46, h: 60 },
};

function baseMoves(h, power, speed) {
  const f = n => Math.max(1, Math.round(n * speed));
  const mv = (s, a, r, box, dmg, base, scale, angle) =>
    ({ startup: f(s), active: a, recovery: f(r), box, dmg: dmg * power, base, scale, angle });
  return {
    jab:  mv(3, 3, 9,  { dx: 30, dy: -h * 0.55, w: 36, h: 26 }, 3, 3, 0.04, 30),
    side: mv(8, 4, 18, { dx: 42, dy: -h * 0.55, w: 48, h: 30 }, 9, 6, 0.11, 38),
    up:   mv(6, 5, 14, { dx: 6, dy: -h * 0.85, w: 56, h: 44 }, 7, 6, 0.095, 85),
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
    color: entry.color, trim: entry.trim, skin: entry.skin, ammo: entry.ammo });
  d.moves = Object.assign(baseMoves(d.h, W.power, W.speed), KITS[entry.id]);
  return (fighterCache[entry.id] = d);
}

// Draws a mascot standing at (0, 0) feet, facing right. Caller handles position and flip. The art is in art.js.
function drawMascot(ctx, m, t, pose) {
  drawArt(ctx, m, t, pose);
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

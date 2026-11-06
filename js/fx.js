'use strict';
// Looks only, nothing here changes gameplay: the camera, dust and smoke, hit sparks, KO blasts, shadows,
// off-screen markers, the crowd's cheer, projectile drawings and the winner screen.

const clampN = (v, a, b) => Math.max(a, Math.min(b, v));
function hexA(hex, a) {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${a})`;
}

// ---- camera: frames both fighters and zooms in when they are close ----
// The view never leaves the 1280 x 720 world. Background layers can use less of the zoom (depth < 1),
// which gives the stands a bit of parallax.

const CAM = { x: 640, y: 360, z: 1 };
const CAM_MAX = 1.55;

function camReset() { CAM.x = 640; CAM.y = 360; CAM.z = 1; }

function camTarget() {
  const fs = game.fighters.filter(f => !f.dead && f.x > -60 && f.x < 1340 && f.y > -100 && f.y < 800);
  if (!fs.length) return { x: 640, y: 360, z: 1 };
  let x1 = Infinity, x2 = -Infinity, y1 = Infinity, y2 = -Infinity;
  for (const f of fs) { x1 = Math.min(x1, f.x); x2 = Math.max(x2, f.x); y1 = Math.min(y1, f.y - f.h); y2 = Math.max(y2, f.y); }
  y2 = Math.max(y2, STAGE.main.y + 30);  // keep the field in view under the fighters
  const z = clampN(Math.min(1280 / (x2 - x1 + 560), 720 / (y2 - y1 + 300)), 1, CAM_MAX);
  return { z, x: clampN((x1 + x2) / 2, 640 / z, 1280 - 640 / z), y: clampN((y1 + y2) / 2 - 10, 360 / z, 720 - 360 / z) };
}

function camUpdate() {
  const t = camTarget(), k = 0.07;
  CAM.z += (t.z - CAM.z) * k;
  CAM.x = clampN(CAM.x + (t.x - CAM.x) * k, 640 / CAM.z, 1280 - 640 / CAM.z);
  CAM.y = clampN(CAM.y + (t.y - CAM.y) * k, 360 / CAM.z, 720 - 360 / CAM.z);
}

function camApply(c, depth = 1, sx = 0, sy = 0) {
  const z = 1 + (CAM.z - 1) * depth;
  const x = clampN(640 + (CAM.x - 640) * depth, 640 / z, 1280 - 640 / z);
  const y = clampN(360 + (CAM.y - 360) * depth, 360 / z, 720 - 360 / z);
  c.setTransform(viewScale * z, 0, 0, viewScale * z, viewScale * (640 - x * z + sx), viewScale * (360 - y * z + sy));
}

function toScreen(x, y) { return [(x - CAM.x) * CAM.z + 640, (y - CAM.y) * CAM.z + 360]; }

// ---- particles ----

function fxDust(x, y, n, dir = 0, power = 1) {
  for (let i = 0; i < n; i++) {
    const a = dir ? (dir > 0 ? 0 : Math.PI) + (Math.random() - 0.5) * 0.8 : Math.PI + Math.random() * Math.PI;
    const s = (0.6 + Math.random()) * 1.7 * power;
    game.fx.push({ kind: 'dust', x: x + (Math.random() - 0.5) * 12, y: y - 2, vx: Math.cos(a) * s, vy: Math.sin(a) * s * 0.5 - 0.2,
      r: 3 + Math.random() * 4, life: 26, max: 26 });
  }
}
function fxSmoke(x, y, big) {
  game.fx.push({ kind: 'smoke', x: x + (Math.random() - 0.5) * 8, y: y + (Math.random() - 0.5) * 8, vx: 0, vy: -0.3,
    r: big ? 9 : 6, life: 30, max: 30 });
}
function fxRing(x, y, color, r = 6, grow = 2.2, life = 16) { game.fx.push({ kind: 'ring', x, y, r, grow, color, life, max: life }); }
function fxHit(x, y, dmg, kb) {
  game.fx.push({ kind: 'hit', x, y, size: 16 + dmg * 1.7, angle: Math.random() * Math.PI, life: 11, max: 11 });
  if (kb > 10) fxRing(x, y, 'rgba(255,240,190,0.9)', 10, 4, 14);
}
// a KO: a beam of the player's colour shoots in from the edge of the screen where they flew out
function fxKO(f) {
  const [sx, sy] = toScreen(f.x, f.y - f.h / 2);
  const x = clampN(sx, 0, 1280), y = clampN(sy, 0, 720);
  game.fx.push({ kind: 'ko', screen: true, x, y, angle: Math.atan2(400 - y, 640 - x), color: P_COLORS[f.idx], life: 50, max: 50 });
  game.flash = 10;
  game.cheer = 1;
}
function fxConfetti(colors) {
  for (let i = 0; i < 3; i++) {
    game.fx.push({ kind: 'confetti', screen: true, x: Math.random() * 1280, y: -10, vx: (Math.random() - 0.5) * 2, vy: 1 + Math.random() * 2,
      rot: Math.random() * 6, vr: (Math.random() - 0.5) * 0.3, color: colors[Math.floor(Math.random() * colors.length)], life: 400, max: 400 });
  }
}

function updateFx() {
  for (const p of game.fx) {
    p.x += p.vx || 0;
    p.y += p.vy || 0;
    if (p.kind === 'dust' || p.kind === 'smoke') { p.vx *= 0.9; p.vy *= 0.92; p.r += 0.22; }
    else if (p.kind === 'confetti') { p.vy = Math.min(p.vy + 0.05, 3); p.vx *= 0.99; p.rot += p.vr; if (p.y > 740) p.life = 0; }
    else if (p.kind === 'ring') p.r += p.grow;
    p.life--;
  }
  game.fx = game.fx.filter(p => p.life > 0);
  if (game.cheer > 0) game.cheer *= 0.985;
  if (game.flash > 0) game.flash--;
}

// layer: 'back' (dust, smoke: behind fighters), 'front' (sparks, rings), 'screen' (KO beams, confetti)
function drawFx(c, layer) {
  for (const p of game.fx) {
    const k = 1 - p.life / p.max;
    if (layer === 'back' && (p.kind === 'dust' || p.kind === 'smoke')) {
      c.fillStyle = p.kind === 'dust' ? `rgba(226,214,190,${0.55 * (1 - k)})` : `rgba(205,208,218,${0.5 * (1 - k)})`;
      c.beginPath(); c.arc(p.x, p.y, p.r, 0, Math.PI * 2); c.fill();
    } else if (layer === 'front' && p.kind === 'hit') {
      c.save();
      c.translate(p.x, p.y);
      c.strokeStyle = `rgba(255,255,255,${1 - k})`;
      c.lineCap = 'round';
      for (let i = 0; i < 8; i++) {
        const a = p.angle + i * Math.PI / 4, long = i % 2 ? 0.55 : 1, len = p.size * long * (0.6 + k * 0.7), inner = p.size * 0.25 * (0.3 + k);
        c.lineWidth = (i % 2 ? 2.5 : 4) * (1 - k * 0.6);
        c.beginPath(); c.moveTo(Math.cos(a) * inner, Math.sin(a) * inner); c.lineTo(Math.cos(a) * len, Math.sin(a) * len); c.stroke();
      }
      c.fillStyle = `rgba(255,236,150,${1 - k})`;
      c.beginPath(); c.arc(0, 0, p.size * 0.4 * (1 - k), 0, Math.PI * 2); c.fill();
      c.restore();
    } else if (layer === 'front' && p.kind === 'ring') {
      c.strokeStyle = p.color; c.globalAlpha = 1 - k; c.lineWidth = 3;
      c.beginPath(); c.arc(p.x, p.y, p.r, 0, Math.PI * 2); c.stroke(); c.globalAlpha = 1;
    } else if (layer === 'screen' && p.kind === 'ko') {
      const len = 1100 * Math.min(1, k * 5), wd = 110 * (1 - k);
      c.save();
      c.translate(p.x, p.y);
      c.rotate(p.angle);
      const g = c.createLinearGradient(0, 0, len, 0);
      g.addColorStop(0, hexA(p.color, 0.95 * (1 - k)));
      g.addColorStop(1, hexA(p.color, 0));
      c.fillStyle = g;
      c.beginPath(); c.moveTo(0, -wd * 0.25); c.lineTo(len, -wd); c.lineTo(len, wd); c.lineTo(0, wd * 0.25); c.fill();
      c.fillStyle = `rgba(255,255,255,${0.9 * (1 - k)})`;
      c.beginPath(); c.moveTo(0, -wd * 0.08); c.lineTo(len * 0.7, -wd * 0.25); c.lineTo(len * 0.7, wd * 0.25); c.lineTo(0, wd * 0.08); c.fill();
      c.restore();
    } else if (layer === 'screen' && p.kind === 'confetti') {
      c.save(); c.translate(p.x, p.y); c.rotate(p.rot); c.scale(1, Math.cos(p.rot * 2));
      c.fillStyle = p.color; c.fillRect(-5, -3, 10, 6); c.restore();
    }
  }
}

// ---- shadows and off-screen markers ----

function groundBelow(f) {
  const S = STAGE.main;
  let best = null;
  if (f.x > S.x1 - 10 && f.x < S.x2 + 10 && f.y <= S.y + 1) best = S.y;
  for (const p of STAGE.plats) if (f.x > p.x1 && f.x < p.x2 && f.y <= p.y + 1 && (best === null || p.y < best)) best = p.y;
  return best;
}
function drawShadows(c) {
  for (const f of game.fighters) {
    if (f.dead) continue;
    const g = groundBelow(f);
    if (g === null) continue;
    const s = clampN(1 - (g - f.y) / 380, 0.3, 1);
    c.fillStyle = `rgba(0,0,0,${0.35 * s})`;
    c.beginPath(); c.ellipse(f.x, g + 1, f.w * 0.6 * s, 6 * s, 0, 0, Math.PI * 2); c.fill();
  }
}
// a bubble at the screen edge for a fighter out of view, with a small portrait and an arrow toward them
function drawOffscreen(c) {
  for (const f of game.fighters) {
    if (f.dead) continue;
    const [sx, sy] = toScreen(f.x, f.y - f.h / 2);
    if (sx > 0 && sx < 1280 && sy > 0 && sy < 720) continue;
    const bx = clampN(sx, 46, 1234), by = clampN(sy, 46, 580), a = Math.atan2(sy - by, sx - bx);
    c.save();
    c.translate(bx, by);
    c.fillStyle = P_COLORS[f.idx];
    c.beginPath(); c.moveTo(Math.cos(a) * 46, Math.sin(a) * 46); c.lineTo(Math.cos(a + 0.5) * 30, Math.sin(a + 0.5) * 30); c.lineTo(Math.cos(a - 0.5) * 30, Math.sin(a - 0.5) * 30); c.fill();
    c.fillStyle = 'rgba(10,16,28,0.85)';
    c.beginPath(); c.arc(0, 0, 32, 0, Math.PI * 2); c.fill();
    c.lineWidth = 3; c.strokeStyle = P_COLORS[f.idx]; c.stroke();
    c.beginPath(); c.arc(0, 0, 30, 0, Math.PI * 2); c.clip();
    c.translate(0, 26); c.scale(0.55, 0.55);
    drawMascot(c, f.m, f.t, 'hurt');
    c.restore();
  }
}

// ---- projectiles ----

function drawProjectile(p) {
  const c = ctx, f = p.facing, t = game.t;
  c.globalAlpha = Math.min(1, p.life / 8);
  c.save();
  c.translate(p.x, p.y);
  const L = p.look;
  if (L === 'wave') {
    c.strokeStyle = 'rgba(255,255,255,0.85)';
    c.lineWidth = 4;
    const s = Math.max(1, p.h / 46);
    for (let k = 0; k < 3; k++) {
      c.beginPath();
      if (f > 0) c.arc(-18 * s, 0, (10 + k * 9) * s, -0.9, 0.9);
      else c.arc(18 * s, 0, (10 + k * 9) * s, Math.PI - 0.9, Math.PI + 0.9);
      c.stroke();
    }
  } else if (L === 'hedge') {
    const grow = Math.min(1, (p.life > 18 ? 24 - p.life : 6) / 6);
    blob(c, '#2f6b2a', () => roundRect(c, -p.w / 2, p.h / 2 - p.h * grow, p.w, p.h * grow, 12));
    c.fillStyle = '#3f8a37';
    for (let k = 0; k < 4; k++) { c.beginPath(); c.arc(-p.w / 2 + 8 + k * 11, p.h / 2 - p.h * grow + 8, 9, 0, Math.PI * 2); c.fill(); }
  } else if (L === 'herd') {
    for (let k = 0; k < 3; k++) {
      c.save();
      c.translate((k - 1) * 46, p.h / 2 + (k % 2) * 4);
      c.scale(f * 0.8, 0.8);
      drawMascot(c, p.owner.m, t + k * 7, 'charge');
      c.restore();
    }
  } else if (L === 'bird') {
    c.scale(f, 1);
    const flap = Math.sin(t / 2) * p.h * 0.35, col = p.color || '#ffe28a';
    blob(c, shade(col, -0.2), () => { c.moveTo(-p.w * 0.1, 0); c.lineTo(-p.w * 0.35, -p.h * 0.55 - flap); c.lineTo(p.w * 0.1, -p.h * 0.05); c.closePath(); }, 2);
    blob(c, col, () => oval(c, 0, 0, p.w * 0.38, p.h * 0.22), 2);
    blob(c, col, () => oval(c, p.w * 0.33, -p.h * 0.12, p.h * 0.2, p.h * 0.18), 2);
    blob(c, '#f0b81c', () => { c.moveTo(p.w * 0.45, -p.h * 0.18); c.lineTo(p.w * 0.6, -p.h * 0.08); c.lineTo(p.w * 0.45, -p.h * 0.02); c.closePath(); }, 1.5);
    blob(c, col, () => { c.moveTo(-p.w * 0.1, 0); c.lineTo(-p.w * 0.3, p.h * 0.5 + flap); c.lineTo(p.w * 0.1, p.h * 0.05); c.closePath(); }, 2);
  } else if (L === 'bullet' || L === 'musketball') {
    c.scale(f, 1);
    c.strokeStyle = 'rgba(255,240,200,0.5)'; c.lineWidth = 3;
    c.beginPath(); c.moveTo(-p.w * 2.2, 0); c.lineTo(-p.w * 0.3, 0); c.stroke();
    if (L === 'bullet') blob(c, '#d8a944', () => { c.moveTo(-p.w / 2, -p.h / 2); c.lineTo(p.w * 0.2, -p.h / 2); c.quadraticCurveTo(p.w * 0.6, 0, p.w * 0.2, p.h / 2); c.lineTo(-p.w / 2, p.h / 2); c.closePath(); }, 1.5);
    else blob(c, '#3a3a40', () => oval(c, 0, 0, p.h / 2, p.h / 2), 1.5);
  } else if (L === 'cannonball') {
    c.fillStyle = 'rgba(200,200,210,0.35)';
    for (let k = 1; k < 4; k++) { c.beginPath(); c.arc(-f * k * 14, Math.sin(t / 3 + k) * 3, 6 + k * 2, 0, Math.PI * 2); c.fill(); }
    blob(c, '#2a2a30', () => oval(c, 0, 0, p.w / 2, p.h / 2));
    c.fillStyle = 'rgba(255,255,255,0.35)'; c.beginPath(); c.arc(-p.w * 0.15, -p.h * 0.15, p.w * 0.14, 0, Math.PI * 2); c.fill();
  } else if (L === 'water') {
    c.scale(f, 1);
    for (let k = 0; k < 4; k++) {
      const x = -k * p.w * 0.3, s = 1 - k * 0.2, y = Math.sin(t / 2 + k) * 2;
      blob(c, '#7fc4ff', () => oval(c, x, y, p.w * 0.3 * s, p.h * 0.32 * s), 1.5);
      c.fillStyle = 'rgba(255,255,255,0.7)'; c.beginPath(); c.arc(x + p.w * 0.08 * s, y - p.h * 0.1 * s, 2.5 * s, 0, Math.PI * 2); c.fill();
    }
  } else if (L === 'tp') {
    c.rotate(t / 4 * f);
    blob(c, '#f8f8f4', () => oval(c, 0, 0, 13, 13));
    blob(c, '#c9b48a', () => oval(c, 0, 0, 5, 5), 1.5);
    c.rotate(-t / 4 * f);
    c.strokeStyle = '#f8f8f4'; c.lineWidth = 6; c.lineCap = 'round';
    c.beginPath(); c.moveTo(0, 10);
    for (let k = 1; k < 6; k++) c.lineTo(-f * k * 9, 10 + Math.sin(t / 3 + k) * 6 + k * 2);
    c.stroke();
  } else if (L === 'tent') {
    const w = p.w, h = p.h, rise = Math.min(1, (90 - p.life) / 8);
    c.scale(1, rise); c.translate(0, h / 2 * (1 - rise) / Math.max(0.01, rise));
    blob(c, '#f4f4f4', () => { c.moveTo(-w / 2, h / 2); c.lineTo(0, -h / 2); c.lineTo(w / 2, h / 2); c.closePath(); });
    c.save(); c.beginPath(); c.moveTo(-w / 2, h / 2); c.lineTo(0, -h / 2); c.lineTo(w / 2, h / 2); c.closePath(); c.clip();
    for (let k = -3; k <= 3; k++) { c.fillStyle = k % 2 ? '#ce1126' : '#14213d'; if (k % 2 === 0) continue; c.fillRect(k * w / 7 - w / 14, -h / 2, w / 7, h); }
    c.restore();
    blob(c, '#3a2a1a', () => { c.moveTo(-8, h / 2); c.lineTo(0, h / 2 - 22); c.lineTo(8, h / 2); c.closePath(); }, 2);
  } else if (L === 'cowbell') {
    c.strokeStyle = 'rgba(255,255,255,0.5)'; c.lineWidth = 2;
    for (const x of [-12, 0, 12]) { c.beginPath(); c.moveTo(x, -p.h / 2 - 8); c.lineTo(x, -p.h / 2 - 22); c.stroke(); }
    blob(c, '#c9b05a', () => { c.moveTo(-p.w * 0.3, -p.h / 2); c.lineTo(p.w * 0.3, -p.h / 2); c.lineTo(p.w / 2, p.h / 2); c.lineTo(-p.w / 2, p.h / 2); c.closePath(); });
    c.fillStyle = '#5d1725'; c.fillRect(-p.w * 0.42, p.h * 0.1, p.w * 0.84, 6);
    blob(c, '#3a3a3a', () => oval(c, 0, p.h / 2 + 3, 5, 5), 1.5);
  } else if (L === 'float') {
    const m = p.owner.m, w = p.w, h = p.h;
    blob(c, m.color, () => roundRect(c, -w / 2, -h / 2 + 10, w, h - 22, 8));
    c.fillStyle = m.trim;
    for (let k = 0; k < 10; k++) c.fillRect(-w / 2 + 4 + k * (w - 8) / 10, h / 2 - 16, 4, 6);
    c.save(); c.translate(0, -h / 2 + 12); c.scale(f * 0.7, 0.7); drawMascot(c, m, t, 'special'); c.restore();
    for (const x of [-w * 0.32, w * 0.32]) {
      c.save(); c.translate(x, h / 2 - 8); c.rotate(t / 5 * f);
      blob(c, '#2a2a2a', () => oval(c, 0, 0, 9, 9)); c.fillStyle = '#9aa3ad'; c.fillRect(-1.5, -8, 3, 16); c.restore();
    }
  } else if (L === 'ball') {
    c.rotate(t / 3 * f);
    blob(c, '#8a4a22', () => oval(c, 0, 0, p.w * 0.65, p.h * 0.42));
    c.strokeStyle = '#ffffff'; c.lineWidth = 1.5;
    c.beginPath(); c.moveTo(-5, 0); c.lineTo(5, 0); for (const x of [-3, 0, 3]) { c.moveTo(x, -2); c.lineTo(x, 2); } c.stroke();
  } else if (L === 'fire' || L === 'inferno') {
    const n = L === 'fire' ? 1 : 7;
    for (let k = 0; k < n; k++) {
      const x = n === 1 ? 0 : (k / (n - 1) - 0.5) * p.w * 0.85, s = n === 1 ? p.h / 24 : p.h / 60 * (0.8 + 0.3 * Math.sin(k * 2.1));
      const fl = Math.sin(t / 2 + k * 1.7) * 2;
      c.save(); c.translate(x, p.h / 2 * (n === 1 ? 0.6 : 0.9)); c.scale(s, s);
      blob(c, '#ff6a1a', () => { c.moveTo(-10, 0); c.quadraticCurveTo(-12, -16, fl, -34); c.quadraticCurveTo(12, -16, 10, 0); c.closePath(); }, 2);
      c.fillStyle = '#ffd34a';
      c.beginPath(); c.moveTo(-5, 0); c.quadraticCurveTo(-6, -9, fl * 0.5, -18); c.quadraticCurveTo(6, -9, 5, 0); c.closePath(); c.fill();
      c.restore();
    }
  } else if (L === 'tortilla') {
    c.scale(Math.cos(t / 4) * 0.8 + 0.2, 1);
    blob(c, '#e8d29a', () => oval(c, 0, 0, p.w / 2, p.w / 2 * 0.95), 2);
    c.fillStyle = '#b8894a';
    for (const [x, y] of [[-6, -4], [5, 3], [2, -8], [-3, 7], [8, -2]]) { c.beginPath(); c.arc(x * p.w / 38, y * p.w / 38, 2, 0, Math.PI * 2); c.fill(); }
  } else if (L === 'tornado') {
    const h = p.h, w = p.w;
    for (let k = 0; k < 6; k++) {
      const y = h / 2 - k * h / 6, rw = w * (0.18 + k * 0.08), sway = Math.sin(t / 4 + k * 0.7) * 5;
      c.strokeStyle = `rgba(220,228,238,${0.85 - k * 0.05})`; c.lineWidth = 4;
      c.beginPath(); c.ellipse(sway, y, rw, h / 18, 0, Math.PI * (t % 20 < 10 ? 0 : 0.1), Math.PI * 1.9); c.stroke();
    }
    c.strokeStyle = 'rgba(160,170,185,0.8)'; c.lineWidth = 2;
    c.beginPath(); c.moveTo(-w * 0.15, h / 2); c.quadraticCurveTo(w * 0.1, 0, -w * 0.3, -h / 2); c.stroke();
  } else if (L === 'wheat') {
    for (let k = 0; k < 6; k++) {
      const x = (k / 5 - 0.5) * p.w * 0.9, sway = Math.sin(t / 3 + k) * 5;
      c.strokeStyle = '#a8862a'; c.lineWidth = 2.5;
      c.beginPath(); c.moveTo(x, p.h / 2); c.quadraticCurveTo(x, 0, x + sway, -p.h / 2 + 8); c.stroke();
      blob(c, '#e8c860', () => oval(c, x + sway, -p.h / 2 + 4, 4, 9), 1.5);
    }
  } else if (L !== 'none') {
    blob(c, p.color || '#ffe28a', () => oval(c, 0, 0, p.w / 2, p.h / 2));
  }
  c.restore();
  c.globalAlpha = 1;
}

// ---- winner screen ----

function drawResult(c) {
  c.fillStyle = 'rgba(5,10,20,0.72)';
  c.fillRect(0, 0, 1280, 720);
  const w = game.winner;
  if (!w) { bigText('Draw', 330, 'F or K to play again'); drawFx(c, 'screen'); return; }
  const g = c.createRadialGradient(640, 470, 20, 640, 470, 330);
  g.addColorStop(0, hexA(lum(w.m.color) < 0.15 ? w.m.trim : w.m.color, 0.55));
  g.addColorStop(1, 'rgba(0,0,0,0)');
  c.fillStyle = g;
  c.fillRect(0, 0, 1280, 720);
  c.fillStyle = 'rgba(0,0,0,0.35)';
  c.beginPath(); c.ellipse(640, 560, 120, 16, 0, 0, Math.PI * 2); c.fill();
  const r = game.resultT || 0, pop = Math.min(1, r / 20), s = 3.6 * (0.6 + 0.4 * pop) * (1 + 0.03 * Math.sin(r / 8));
  c.save();
  c.translate(640, 560);
  c.scale(s, s);
  drawMascot(c, w.m, r, Math.floor(r / 40) % 2 ? 'special' : 'uppercut');
  c.restore();
  drawFx(c, 'screen');
  c.textAlign = 'center';
  c.font = '900 72px system-ui, sans-serif';
  c.lineWidth = 10; c.strokeStyle = '#0b1220';
  const title = `${w.isCpu ? 'CPU' : 'P' + (w.idx + 1)} WINS!`;
  c.strokeText(title, 640, 130); c.fillStyle = P_COLORS[w.idx]; c.fillText(title, 640, 130);
  c.font = 'bold 26px system-ui, sans-serif'; c.fillStyle = '#ffffff';
  c.fillText(`${w.m.name}, ${w.m.school}`, 640, 172);
  for (let k = 0; k < STOCKS; k++) {
    c.fillStyle = k < w.stocks ? '#ffe28a' : 'rgba(255,255,255,0.18)';
    c.beginPath(); c.arc(640 + (k - 1) * 30, 205, 9, 0, Math.PI * 2); c.fill();
  }
  c.font = '18px system-ui, sans-serif'; c.fillStyle = '#c8d3e6';
  c.fillText('F or K to play again', 640, 680);
}

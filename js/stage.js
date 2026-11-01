'use strict';
// One stage: a football field as the main block, three pass-through platforms, blast zones.

const STAGE = {
  w: 1280, h: 720,
  main: { x1: 240, x2: 1040, y: 520, bottom: 590 },
  plats: [
    { x1: 330, x2: 530, y: 400 },
    { x1: 750, x2: 950, y: 400 },
    { x1: 540, x2: 740, y: 285 },
  ],
  blast: { left: -140, right: 1420, top: -300, bottom: 900 },
  spawns: [{ x: 440, y: 520 }, { x: 840, y: 520 }],
  respawn: { x: 640, y: 120 },
};

function drawStage(ctx) {
  const S = STAGE, m = S.main;
  const sky = ctx.createLinearGradient(0, 0, 0, S.h);
  sky.addColorStop(0, '#0b1530');
  sky.addColorStop(1, '#22365c');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, S.w, S.h);

  // stands and lights
  ctx.fillStyle = '#16233d';
  ctx.beginPath();
  ctx.moveTo(0, 470); ctx.lineTo(160, 300); ctx.lineTo(1120, 300); ctx.lineTo(1280, 470); ctx.lineTo(1280, 720); ctx.lineTo(0, 720);
  ctx.fill();
  ctx.fillStyle = '#1d2d4c';
  for (let r = 0; r < 5; r++) ctx.fillRect(0, 320 + r * 30, S.w, 3);
  for (const lx of [110, 1170]) {
    ctx.fillStyle = '#2a3a58';
    ctx.fillRect(lx - 4, 90, 8, 220);
    ctx.fillStyle = '#fff6d8';
    ctx.fillRect(lx - 34, 70, 68, 24);
    const glow = ctx.createRadialGradient(lx, 82, 4, lx, 82, 120);
    glow.addColorStop(0, 'rgba(255,246,216,0.35)');
    glow.addColorStop(1, 'rgba(255,246,216,0)');
    ctx.fillStyle = glow;
    ctx.fillRect(lx - 120, -40, 240, 240);
  }

  // field
  ctx.fillStyle = '#3d2a1a';
  ctx.fillRect(m.x1, m.y + 14, m.x2 - m.x1, m.bottom - m.y - 14);
  ctx.fillStyle = '#2f8a3e';
  ctx.fillRect(m.x1, m.y, m.x2 - m.x1, 16);
  const ez = 70;
  ctx.fillStyle = '#7a1f2b';
  ctx.fillRect(m.x1, m.y, ez, 16);
  ctx.fillStyle = '#1f3f7a';
  ctx.fillRect(m.x2 - ez, m.y, ez, 16);
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  for (let x = m.x1 + ez; x <= m.x2 - ez + 1; x += (m.x2 - m.x1 - 2 * ez) / 10) ctx.fillRect(x - 1, m.y, 2, 16);

  // platforms
  for (const p of S.plats) {
    ctx.fillStyle = '#c9d2e3';
    ctx.fillRect(p.x1, p.y, p.x2 - p.x1, 8);
    ctx.fillStyle = '#7d889e';
    ctx.fillRect(p.x1, p.y + 8, p.x2 - p.x1, 4);
  }
}

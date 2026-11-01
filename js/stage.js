'use strict';
// Stage layout (the same on every stage, so fights stay fair) and the stage themes with their hazards.
// A theme: name, draw(ctx, hz) for the background and platforms, and optionally home (a roster id),
// init() returning hazard state, update(hz, fighters, hit) each tick, onKO(hz), drawFront(ctx, hz).

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

function drawLights(ctx, color) {
  for (const lx of [110, 1170]) {
    ctx.fillStyle = '#2a3a58';
    ctx.fillRect(lx - 4, 90, 8, 220);
    ctx.fillStyle = color;
    ctx.fillRect(lx - 34, 70, 68, 24);
    const glow = ctx.createRadialGradient(lx, 82, 4, lx, 82, 120);
    glow.addColorStop(0, 'rgba(255,246,216,0.35)');
    glow.addColorStop(1, 'rgba(255,246,216,0)');
    ctx.fillStyle = glow;
    ctx.fillRect(lx - 120, -40, 240, 240);
  }
}

// The field block: dirt, turf, end zones in two colours, yard lines.
function drawField(ctx, left, right, label) {
  const m = STAGE.main, ez = 70;
  ctx.fillStyle = '#3d2a1a';
  ctx.fillRect(m.x1, m.y + 14, m.x2 - m.x1, m.bottom - m.y - 14);
  ctx.fillStyle = '#2f8a3e';
  ctx.fillRect(m.x1, m.y, m.x2 - m.x1, 16);
  ctx.fillStyle = left;
  ctx.fillRect(m.x1, m.y, ez, 16);
  ctx.fillStyle = right;
  ctx.fillRect(m.x2 - ez, m.y, ez, 16);
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  for (let x = m.x1 + ez; x <= m.x2 - ez + 1; x += (m.x2 - m.x1 - 2 * ez) / 10) ctx.fillRect(x - 1, m.y, 2, 16);
  if (label) {
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    ctx.font = 'bold 11px system-ui, sans-serif';
    ctx.textAlign = 'center';
    for (const x of [m.x1 + ez / 2, m.x2 - ez / 2]) ctx.fillText(label, x, m.y + 12);
  }
}

function drawPlatforms(ctx, top, side, shake) {
  STAGE.plats.forEach((p, i) => {
    const dy = shake ? Math.sin(shake * 1.7 + i) * shake * 0.4 : 0;
    ctx.fillStyle = top;
    ctx.fillRect(p.x1, p.y + dy, p.x2 - p.x1, 8);
    ctx.fillStyle = side;
    ctx.fillRect(p.x1, p.y + 8 + dy, p.x2 - p.x1, 4);
  });
}

function drawPracticeField(ctx) {
  const sky = ctx.createLinearGradient(0, 0, 0, STAGE.h);
  sky.addColorStop(0, '#0b1530');
  sky.addColorStop(1, '#22365c');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, STAGE.w, STAGE.h);
  ctx.fillStyle = '#16233d';
  ctx.beginPath();
  ctx.moveTo(0, 470); ctx.lineTo(160, 300); ctx.lineTo(1120, 300); ctx.lineTo(1280, 470); ctx.lineTo(1280, 720); ctx.lineTo(0, 720);
  ctx.fill();
  ctx.fillStyle = '#1d2d4c';
  for (let r = 0; r < 5; r++) ctx.fillRect(0, 320 + r * 30, STAGE.w, 3);
  drawLights(ctx, '#fff6d8');
  drawField(ctx, '#7a1f2b', '#1f3f7a');
  drawPlatforms(ctx, '#c9d2e3', '#7d889e');
}

// ---- Boone Pickens Stadium (Oklahoma State) ----
// Hazards: the Spirit Rider gallops across the field after a KO; the O-S-U chant bumps anyone on the
// floating platforms on each letter; now and then a prairie wind pushes everyone sideways.

const BOONE_ORANGE = '#ff7300';

function drawBoone(ctx, hz) {
  const sky = ctx.createLinearGradient(0, 0, 0, STAGE.h);
  sky.addColorStop(0, '#1b2140');
  sky.addColorStop(0.45, '#8a3d2c');
  sky.addColorStop(0.75, '#f08a3c');
  sky.addColorStop(1, '#2a1a10');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, STAGE.w, STAGE.h);
  // prairie on the horizon
  ctx.fillStyle = '#3a2a1a';
  ctx.fillRect(0, 300, STAGE.w, 20);
  // stands: orange and black rows
  ctx.fillStyle = '#1a1a1a';
  ctx.beginPath();
  ctx.moveTo(0, 480); ctx.lineTo(150, 310); ctx.lineTo(1130, 310); ctx.lineTo(1280, 480); ctx.lineTo(1280, 720); ctx.lineTo(0, 720);
  ctx.fill();
  for (let r = 0; r < 6; r++) {
    ctx.fillStyle = r % 2 ? '#2a2a2a' : '#c85a00';
    ctx.fillRect(0, 322 + r * 26, STAGE.w, 4);
  }
  // crowd dots in the stands, some waving
  const t = hz ? hz.t : 0;
  for (let k = 0; k < 120; k++) {
    const x = (k * 97) % 1280, y = 330 + ((k * 53) % 130);
    const jump = hz && hz.chantBeat > 0 ? Math.abs(Math.sin((t + k) / 3)) * 4 : 0;
    ctx.fillStyle = k % 3 ? BOONE_ORANGE : '#f2f2f2';
    ctx.fillRect(x, y - jump, 4, 5);
  }
  // scoreboard
  ctx.fillStyle = '#111';
  ctx.fillRect(540, 150, 200, 90);
  ctx.strokeStyle = BOONE_ORANGE;
  ctx.lineWidth = 4;
  ctx.strokeRect(540, 150, 200, 90);
  ctx.fillStyle = BOONE_ORANGE;
  ctx.font = 'bold 22px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('COWBOYS', 640, 182);
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 15px system-ui, sans-serif';
  ctx.fillText('BOONE PICKENS STADIUM', 640, 212);
  ctx.font = '12px system-ui, sans-serif';
  ctx.fillText('STILLWATER, OK', 640, 230);
  drawLights(ctx, '#fff1d0');
  drawField(ctx, BOONE_ORANGE, BOONE_ORANGE, 'OSU');
  drawPlatforms(ctx, '#f2f2f2', BOONE_ORANGE, hz ? hz.platShake : 0);
}

function booneInit() {
  return { t: 0, horse: null, chant: 0, chantBeat: 0, letter: '', platShake: 0, wind: 0, windDir: 1 };
}

function booneUpdate(hz, fighters, hit) {
  hz.t++;
  if (hz.platShake > 0) hz.platShake--;
  if (hz.chantBeat > 0) hz.chantBeat--;
  // O-S-U chant: three beats 45 ticks apart, every 25 s
  if (hz.t % 1500 === 600) hz.chant = 135;
  if (hz.chant > 0) {
    if (hz.chant % 45 === 0) {
      hz.letter = 'OSU'[3 - hz.chant / 45];
      hz.chantBeat = 30;
      hz.platShake = 12;
      for (const f of fighters) if (f.dead === 0 && f.onPlat && f.onGround) { f.vy = -7; f.onGround = false; }
    }
    hz.chant--;
  }
  // prairie wind: 4 s gusts every 30 s
  if (hz.t % 1800 === 1200) { hz.wind = 240; hz.windDir = Math.random() < 0.5 ? -1 : 1; }
  if (hz.wind > 0) {
    hz.wind--;
    // a direct shove each tick: velocity alone would be undone by walking control
    for (const f of fighters) if (f.dead === 0) f.x += hz.windDir * (f.onGround ? 1.1 : 1.8);
  }
  // Spirit Rider
  const h = hz.horse;
  if (h) {
    h.x += h.dir * 10;
    const box = { x: h.x - 50, y: STAGE.main.y - 80, w: 100, h: 80 };
    for (const f of fighters) {
      if (h.hitIds.has(f) || f.dead || f.invuln || !overlap(box, f.box())) continue;
      h.hitIds.add(f);
      hit({ x: h.x, facing: h.dir }, f, { dmg: 6, base: 9, scale: 0.05, angle: 65 });
    }
    if (h.x < -200 || h.x > STAGE.w + 200) hz.horse = null;
  }
}

function booneOnKO(hz) {
  if (hz.horse) return;
  const dir = Math.random() < 0.5 ? 1 : -1;
  hz.horse = { dir, x: dir > 0 ? -150 : STAGE.w + 150, hitIds: new Set() };
}

function drawBooneFront(ctx, hz) {
  if (hz.wind > 0) {
    ctx.strokeStyle = 'rgba(255, 240, 210, 0.35)';
    ctx.lineWidth = 2;
    for (let k = 0; k < 18; k++) {
      const y = 60 + ((k * 137) % 560);
      const x = ((hz.t * 14 * hz.windDir + k * 211) % 1400 + 1400) % 1400 - 60;
      ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - hz.windDir * 50, y); ctx.stroke();
    }
    ctx.fillStyle = 'rgba(255, 240, 210, 0.9)';
    ctx.font = 'bold 16px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(hz.windDir > 0 ? 'PRAIRIE WIND  >>>' : '<<<  PRAIRIE WIND', 640, 70);
  }
  if (hz.chantBeat > 0) {
    ctx.globalAlpha = hz.chantBeat / 30;
    ctx.fillStyle = BOONE_ORANGE;
    ctx.strokeStyle = '#111';
    ctx.lineWidth = 6;
    ctx.font = 'bold 90px system-ui, sans-serif';
    ctx.textAlign = 'center';
    const x = 440 + 'OSU'.indexOf(hz.letter) * 200;
    ctx.strokeText(hz.letter, x, 130);
    ctx.fillText(hz.letter, x, 130);
    ctx.globalAlpha = 1;
  }
  if (hz.horse) drawSpiritRider(ctx, hz.horse.x, STAGE.main.y, hz.horse.dir, hz.t);
}

function drawSpiritRider(ctx, x, y, dir, t) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(dir, 1);
  const gait = Math.sin(t / 2.5) * 8;
  // horse
  ctx.fillStyle = '#1a1a1a';
  ctx.fillRect(-40 + gait, -24, 8, 24);
  ctx.fillRect(-26 - gait, -24, 8, 24);
  ctx.fillRect(18 + gait, -24, 8, 24);
  ctx.fillRect(30 - gait, -24, 8, 24);
  ctx.strokeStyle = 'rgba(255, 236, 214, 0.75)';
  ctx.lineWidth = 2;
  roundRect(ctx, -46, -54, 92, 34, 14);
  ctx.fill();
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(34, -50); ctx.lineTo(58, -78); ctx.lineTo(70, -70); ctx.lineTo(50, -42);
  ctx.fill();
  ctx.stroke();
  ctx.fillRect(-56, -50, 14, 6);
  ctx.fillStyle = BOONE_ORANGE;
  ctx.fillRect(-20, -58, 34, 8);
  ctx.fillStyle = '#1a1a1a';
  // rider
  ctx.fillStyle = BOONE_ORANGE;
  ctx.fillRect(-8, -84, 18, 32);
  ctx.fillStyle = '#e0b48a';
  ctx.beginPath(); ctx.arc(2, -92, 8, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#1a1a1a';
  ctx.fillRect(-10, -102, 24, 4);
  ctx.fillRect(-4, -110, 12, 9);
  // flag
  ctx.strokeStyle = '#d9d9d9';
  ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(-6, -80); ctx.lineTo(-24, -140); ctx.stroke();
  ctx.fillStyle = BOONE_ORANGE;
  ctx.beginPath(); ctx.moveTo(-24, -140); ctx.lineTo(-74, -132 + Math.sin(t / 3) * 4); ctx.lineTo(-22, -116); ctx.fill();
  ctx.fillStyle = '#1a1a1a';
  ctx.font = 'bold 12px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.save(); ctx.scale(dir, 1); ctx.fillText('OSU', dir * -42, -128); ctx.restore();
  ctx.restore();
}

const STAGES = [
  { id: 'practice', name: 'Practice Field', draw: drawPracticeField },
  { id: 'boone', name: 'Boone Pickens Stadium', school: 'Oklahoma State', home: 'okstate', draw: drawBoone,
    init: booneInit, update: booneUpdate, onKO: booneOnKO, drawFront: drawBooneFront },
];

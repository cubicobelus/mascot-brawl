'use strict';
// Stage layout (the same on every stage, so fights stay fair) and the stage themes with their hazards.
// A theme: name, back(ctx, hz) for the sky and stands, ground(ctx, hz) for the field and platforms, and optionally
// home (a roster id), init() returning hazard state, update(hz, fighters, hit) each tick, onKO(hz),
// drawFront(ctx, hz) in the world and drawOverlay(ctx, hz) on the screen.

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

// A crowd in the stands: rows of fans (body and head) in the given colours. They sway a little and jump
// when game.cheer is up (big hits, KOs).
function drawCrowd(ctx, y0, rows, colors, perRow = 64) {
  const t = game.t, cheer = game.cheer || 0, skins = ['#e0b48a', '#c68c5a', '#8a5a3a', '#f0c8a0', '#5a3a24'];
  // dimmed so the fans stay in the background and never compete with the fighters
  ctx.globalAlpha = 0.5;
  for (let r = 0; r < rows; r++) {
    const y = y0 + r * 24, spacing = 1400 / perRow;
    for (let k = 0; k < perRow; k++) {
      const h = (k * 73 + r * 131) % 97;
      if (h < 9) continue;  // a few empty seats
      const x = -60 + k * spacing + (r % 2) * spacing / 2 + (h % 5);
      const jump = cheer * Math.abs(Math.sin((t + h * 3) / 4)) * 7 + Math.sin((t + h * 5) / 30) * 0.8;
      const col = colors[h % colors.length];
      ctx.fillStyle = col;
      ctx.fillRect(x - 5, y - jump - 9, 10, 12);
      ctx.fillStyle = skins[h % skins.length];
      ctx.beginPath(); ctx.arc(x, y - jump - 13, 4, 0, Math.PI * 2); ctx.fill();
      if (cheer > 0.3 && h % 3 === 0) {
        ctx.strokeStyle = col;
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(x - 4, y - jump - 8); ctx.lineTo(x - 7, y - jump - 20);
        ctx.moveTo(x + 4, y - jump - 8); ctx.lineTo(x + 7, y - jump - 20);
        ctx.stroke();
      }
    }
  }
  ctx.globalAlpha = 1;
}

// goalposts at the back of each end zone, drawn faintly so they never read as platforms
function drawGoalposts(ctx) {
  const m = STAGE.main;
  ctx.globalAlpha = 0.6;
  ctx.strokeStyle = '#f2c21b';
  ctx.lineCap = 'round';
  for (const x of [m.x1 + 20, m.x2 - 20]) {
    ctx.lineWidth = 4;
    ctx.beginPath(); ctx.moveTo(x, m.y); ctx.lineTo(x, m.y - 70); ctx.stroke();
    ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(x - 34, m.y - 190); ctx.lineTo(x - 34, m.y - 70); ctx.lineTo(x + 34, m.y - 70); ctx.lineTo(x + 34, m.y - 190); ctx.stroke();
  }
  ctx.globalAlpha = 1;
  ctx.lineCap = 'butt';
}

// The field block: dirt, striped turf, end zones in two colours with labels, yard lines.
function drawField(ctx, left, right, labels) {
  const m = STAGE.main, ez = 70, inner = (m.x2 - m.x1 - 2 * ez) / 10;
  const dirt = ctx.createLinearGradient(0, m.y, 0, m.bottom);
  dirt.addColorStop(0, '#4a3220');
  dirt.addColorStop(1, '#2a1c10');
  ctx.fillStyle = dirt;
  ctx.fillRect(m.x1, m.y + 14, m.x2 - m.x1, m.bottom - m.y - 14);
  for (let k = 0; k < 10; k++) {
    ctx.fillStyle = k % 2 ? '#2f8a3e' : '#38994a';
    ctx.fillRect(m.x1 + ez + k * inner, m.y, inner + 1, 16);
  }
  ctx.fillStyle = left;
  ctx.fillRect(m.x1, m.y, ez, 16);
  ctx.fillStyle = right;
  ctx.fillRect(m.x2 - ez, m.y, ez, 16);
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  for (let x = m.x1 + ez; x <= m.x2 - ez + 1; x += inner) ctx.fillRect(x - 1, m.y, 2, 16);
  ctx.fillStyle = 'rgba(255,255,255,0.25)';
  ctx.fillRect(m.x1, m.y, m.x2 - m.x1, 2);
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  ctx.fillRect(m.x1, m.y + 14, m.x2 - m.x1, 3);
  if (labels) {
    ctx.fillStyle = 'rgba(255,255,255,0.92)';
    ctx.font = 'bold 11px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(labels[0], m.x1 + ez / 2, m.y + 12);
    ctx.fillText(labels[1], m.x2 - ez / 2, m.y + 12);
  }
}

function drawPlatforms(ctx, top, side, shake) {
  STAGE.plats.forEach((p, i) => {
    const dy = shake ? Math.sin(shake * 1.7 + i) * shake * 0.4 : 0;
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    ctx.fillRect(p.x1 + 6, p.y + 14 + dy, p.x2 - p.x1 - 12, 5);
    ctx.fillStyle = top;
    ctx.fillRect(p.x1, p.y + dy, p.x2 - p.x1, 8);
    ctx.fillStyle = side;
    ctx.fillRect(p.x1, p.y + 8 + dy, p.x2 - p.x1, 5);
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    ctx.fillRect(p.x1, p.y + dy, p.x2 - p.x1, 2);
  });
}

// the two picked schools, for the Practice Field's end zones and crowd
function pickedTeams() {
  return game.sel.map(s => ROSTER[s.i]);
}

// ---- Practice Field ----

function practiceBack(ctx) {
  const sky = ctx.createLinearGradient(0, 0, 0, STAGE.h);
  sky.addColorStop(0, '#0b1530');
  sky.addColorStop(1, '#22365c');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, STAGE.w, STAGE.h);
  ctx.fillStyle = 'rgba(255,255,255,0.6)';
  for (let k = 0; k < 40; k++) ctx.fillRect((k * 211) % 1280, (k * 97) % 260, 2, 2);
  ctx.fillStyle = '#16233d';
  ctx.beginPath();
  ctx.moveTo(0, 470); ctx.lineTo(160, 300); ctx.lineTo(1120, 300); ctx.lineTo(1280, 470); ctx.lineTo(1280, 720); ctx.lineTo(0, 720);
  ctx.fill();
  ctx.fillStyle = '#1d2d4c';
  for (let r = 0; r < 6; r++) ctx.fillRect(0, 318 + r * 24, STAGE.w, 3);
  const [a, b] = pickedTeams();
  drawCrowd(ctx, 330, 6, [a.color, b.color, '#d9dee8', a.trim, b.trim], 52);
  drawLights(ctx, '#fff6d8');
}

function practiceGround(ctx) {
  const [a, b] = pickedTeams();
  drawGoalposts(ctx);
  drawField(ctx, a.color, b.color, [a.school.slice(0, 4).toUpperCase(), b.school.slice(0, 4).toUpperCase()]);
  drawPlatforms(ctx, '#c9d2e3', '#7d889e');
}

// ---- Boone Pickens Stadium (Oklahoma State) ----
// Hazards: the Spirit Rider gallops across the field after a KO; the O-S-U chant bumps anyone on the
// floating platforms on each letter; now and then a prairie wind pushes everyone sideways.

const BOONE_ORANGE = '#ff7300';

function booneBack(ctx, hz) {
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
  // stands: orange and black rows, packed with fans who jump on each letter of the chant
  ctx.fillStyle = '#1a1a1a';
  ctx.beginPath();
  ctx.moveTo(0, 480); ctx.lineTo(150, 310); ctx.lineTo(1130, 310); ctx.lineTo(1280, 480); ctx.lineTo(1280, 720); ctx.lineTo(0, 720);
  ctx.fill();
  for (let r = 0; r < 7; r++) {
    ctx.fillStyle = r % 2 ? '#2a2a2a' : '#c85a00';
    ctx.fillRect(0, 316 + r * 24, STAGE.w, 3);
  }
  const saved = game.cheer;
  if (hz && hz.chantBeat > 0) game.cheer = Math.max(game.cheer || 0, 1);
  drawCrowd(ctx, 334, 6, [BOONE_ORANGE, BOONE_ORANGE, '#f2f2f2', '#1a1a1a'], 60);
  game.cheer = saved;
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
}

function booneGround(ctx, hz) {
  drawGoalposts(ctx);
  drawField(ctx, BOONE_ORANGE, BOONE_ORANGE, ['OSU', 'OSU']);
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

// wind streaks and the Spirit Rider, in the world
function drawBooneFront(ctx, hz) {
  if (hz.wind > 0) {
    ctx.strokeStyle = 'rgba(255, 240, 210, 0.35)';
    ctx.lineWidth = 2;
    for (let k = 0; k < 18; k++) {
      const y = 60 + ((k * 137) % 560);
      const x = ((hz.t * 14 * hz.windDir + k * 211) % 1400 + 1400) % 1400 - 60;
      ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - hz.windDir * 50, y); ctx.stroke();
    }
  }
  if (hz.horse) drawSpiritRider(ctx, hz.horse.x, STAGE.main.y, hz.horse.dir, hz.t);
}

// on-screen text for the hazards, drawn without the camera so it stays readable when zoomed in
function drawBooneOverlay(ctx, hz) {
  if (hz.wind > 0) {
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

// back: the sky and stands (drawn with some parallax); ground: the field and platforms; draw: both, for previews
const STAGES = [
  { id: 'practice', name: 'Practice Field', back: practiceBack, ground: practiceGround },
  { id: 'boone', name: 'Boone Pickens Stadium', school: 'Oklahoma State', home: 'okstate', back: booneBack, ground: booneGround,
    hazard: 'Spirit Rider after a KO, the O-S-U chant bumps the platforms, prairie wind',
    init: booneInit, update: booneUpdate, onKO: booneOnKO, drawFront: drawBooneFront, drawOverlay: drawBooneOverlay },
];
for (const st of STAGES) st.draw = (c, hz) => { st.back(c, hz); st.ground(c, hz); };

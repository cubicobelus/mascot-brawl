'use strict';
// Screens (select, stage, fight, result), the fixed-step loop, hits, projectiles, effects and the HUD.

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

// The game is drawn in 1280 x 720 units. The canvas itself is sized to the pixels it takes on screen, so it
// stays sharp on big and high-density screens instead of being a small picture stretched up.
let viewScale = 1;
function fitCanvas() {
  const r = canvas.getBoundingClientRect(), dpr = window.devicePixelRatio || 1;
  const w = Math.max(320, Math.round(r.width * dpr));
  if (canvas.width !== w) { canvas.width = w; canvas.height = Math.round(w * 9 / 16); }
  viewScale = canvas.width / 1280;
}
addEventListener('resize', fitCanvas);
fitCanvas();
const STOCKS = 3;
const P_COLORS = ['#ff5a5a', '#5aa8ff'];
const COLS = 8;

const game = {
  screen: 'select',
  sel: [{ i: ROSTER.findIndex(e => e.id === 'georgia'), ready: false }, { i: ROSTER.findIndex(e => e.id === 'texas'), ready: false }],
  p2cpu: true,
  note: { text: '', t: 0 },
  fighters: [],
  projectiles: [],
  countdown: 0,
  freeze: 0,
  shake: 0,
  dark: 0,
  sepia: 0,
  banner: null,
  stageIdx: 0,
  stage: STAGES[0],
  hz: null,
  sparks: [],
  paused: false,
  winner: null,
  t: 0,
};

function startFight() {
  game.fighters = [0, 1].map(i => new Fighter(i, fighterData(ROSTER[game.sel[i].i]), i === 1 && game.p2cpu, STOCKS));
  const stage = STAGES[game.stageIdx];
  Object.assign(game, { screen: 'fight', countdown: 150, sparks: [], projectiles: [], paused: false, winner: null,
    dark: 0, sepia: 0, banner: null, freeze: 0, shake: 0, stage, hz: stage.init ? stage.init() : null });
  Input.clear();
}

function toSelect() {
  game.screen = 'select';
  game.sel.forEach(s => { s.ready = false; });
}

// ---- update ----

function tick() {
  game.t++;
  if (game.note.t > 0) game.note.t--;
  if (game.screen === 'select') tickSelect();
  else if (game.screen === 'stage') tickStage();
  else if (game.screen === 'fight') tickFight();
  else if (game.screen === 'result' && (Input.hit('KeyF') || Input.hit('KeyK') || Input.hit('Enter'))) toSelect();
  Input.endTick();
}

function moveCursor(s, c) {
  const n = ROSTER.length;
  if (c.leftP) s.i = (s.i + n - 1) % n;
  if (c.rightP) s.i = (s.i + 1) % n;
  if (c.upP) s.i = (s.i + n - COLS) % n;
  if (c.downP) s.i = (s.i + COLS) % n;
}

function tryReady(s) {
  if (playable(ROSTER[s.i])) s.ready = true;
  else game.note = { text: `${ROSTER[s.i].mascot} is coming soon`, t: 90 };
}

function tickSelect() {
  const s1 = game.sel[0], s2 = game.sel[1];
  const c1 = Input.read(0), c2 = Input.read(1);
  if (Input.hit('KeyC')) { game.p2cpu = !game.p2cpu; s2.ready = false; }
  // P1 picks for the CPU once P1 is ready
  if (!s1.ready) {
    moveCursor(s1, c1);
    if (c1.attackP) tryReady(s1);
  } else if (game.p2cpu && !s2.ready) {
    moveCursor(s2, c1);
    if (c1.attackP) tryReady(s2);
    if (c1.specialP) s1.ready = false;
  } else if (c1.specialP) s1.ready = false;
  if (!game.p2cpu) {
    if (!s2.ready) {
      moveCursor(s2, c2);
      if (c2.attackP) tryReady(s2);
    } else if (c2.specialP) s2.ready = false;
  }
  if (s1.ready && s2.ready) toStageSelect();
}

// Stage pick: starts on a picked mascot's home stadium if there is one.
function toStageSelect() {
  game.screen = 'stage';
  const ids = game.sel.map(s => ROSTER[s.i].id);
  const home = STAGES.findIndex(st => st.home && ids.includes(st.home));
  if (home >= 0) game.stageIdx = home;
}

function tickStage() {
  const c = Input.read(0), n = STAGES.length;
  if (c.leftP || c.upP) game.stageIdx = (game.stageIdx + n - 1) % n;
  if (c.rightP || c.downP) game.stageIdx = (game.stageIdx + 1) % n;
  if (c.attackP || Input.hit('Enter')) startFight();
  else if (c.specialP || Input.hit('Escape')) toSelect();
}

function tickFight() {
  if (Input.hit('Escape')) { toSelect(); return; }
  if (Input.hit('KeyP')) game.paused = !game.paused;
  if (game.paused) return;
  updateSparks();
  if (game.shake > 0) game.shake *= 0.85;
  if (game.banner && --game.banner.t <= 0) game.banner = null;
  if (game.freeze > 0) { game.freeze--; return; }
  if (game.countdown > 0) { game.countdown--; return; }
  if (game.dark > 0) game.dark--;
  if (game.sepia > 0) game.sepia--;

  const [a, b] = game.fighters;
  const ca = a.isCpu ? cpuControls(a, b) : Input.read(0);
  const cb = b.isCpu ? cpuControls(b, a) : Input.read(1);
  a.update(ca);
  b.update(cb);
  for (const f of game.fighters) handleEvents(f);

  // both hits are checked before either is applied, so trades work
  const aHit = landed(a, b), bHit = landed(b, a);
  if (aHit) applyHit(a, b, aHit);
  if (bHit) applyHit(b, a, bHit);
  updateProjectiles();
  if (game.stage.update) game.stage.update(game.hz, game.fighters, applyHit);

  for (const f of game.fighters) {
    if (f.outOfBounds()) {
      burst(Math.max(20, Math.min(STAGE.w - 20, f.x)), Math.max(20, Math.min(STAGE.h - 20, f.y - f.h / 2)), P_COLORS[f.idx], 40, 9);
      game.shake = 14;
      f.ko();
      if (game.stage.onKO) game.stage.onKO(game.hz);
    }
  }
  const alive = game.fighters.filter(f => !f.out);
  if (alive.length < 2) {
    game.winner = alive[0] || null;
    game.screen = 'result';
  }
}

function handleEvents(f) {
  for (const e of f.events) {
    if (e.type === 'projectile') spawnProjectile(f, e.p);
    else if (e.type === 'super') {
      game.banner = { text: f.move.def.banner, sub: `${f.m.name}, ${f.m.school}`, color: f.m.color, t: 75 };
      game.freeze = 35;
    } else if (e.type === 'dark') game.dark = e.t;
    else if (e.type === 'sepia') game.sepia = game.sepiaMax = e.t;
    else if (e.type === 'shake') game.shake = Math.max(game.shake, e.amount);
  }
  f.events.length = 0;
}

// Returns the move that connects, or null.
function landed(att, def) {
  const ok = att.hitActive && att.move && !att.move.hit && def.dead === 0 && def.invuln === 0 && overlap(att.hitbox(), def.box());
  return ok ? att.move.def : null;
}

// src is the fighter or projectile that hit; move holds the hit fields.
function applyHit(src, def, move) {
  if (src instanceof Fighter && src.move) src.move.hit = true;
  if (def.windowOn('counter')) {
    // a counter blocks the hit; a fighter in reach gets struck back, a projectile just fizzles
    const ch = def.move.def.counterHit;
    def.move = null;
    if (src instanceof Fighter) {
      def.facing = Math.sign(src.x - def.x) || def.facing;
      const kb = src.takeHit(def, ch, false);
      gainMeter(def, src, ch.dmg);
      hitEffects(src, ch.dmg, kb);
    }
    return;
  }
  const kb = def.takeHit(src, move, def.windowOn('armor'));
  gainMeter(src.owner || src, def, move.dmg);
  hitEffects(def, move.dmg, kb);
}

function gainMeter(attacker, victim, dmg) {
  // stage hazards hit too, but only fighters fill a meter by hitting
  if (attacker instanceof Fighter) attacker.meter = Math.min(METER_MAX, attacker.meter + dmg * 1.2);
  victim.meter = Math.min(METER_MAX, victim.meter + dmg * 0.7);
}

function hitEffects(victim, dmg, kb) {
  game.freeze = Math.min(12, Math.round(3 + dmg / 2));
  game.shake = Math.max(game.shake, Math.min(12, kb * 0.5));
  burst(victim.x, victim.y - victim.h / 2, '#fff3b0', 6 + Math.round(dmg), 4 + kb * 0.2);
}

function spawnProjectile(owner, p) {
  game.projectiles.push(Object.assign({}, p, {
    owner, facing: owner.facing, x: owner.x + p.dx * owner.facing, y: owner.y + p.dy,
    vx: p.vx * owner.facing, vy: p.vy, life: p.life, hitIds: new Set(),
  }));
}

function projBox(p) { return { x: p.x - p.w / 2, y: p.y - p.h / 2, w: p.w, h: p.h }; }

function updateProjectiles() {
  const B = STAGE.blast;
  for (const p of game.projectiles) {
    p.x += p.vx;
    p.y += p.vy;
    p.vy += p.gravity || 0;
    p.life--;
    for (const f of game.fighters) {
      if (f === p.owner || p.hitIds.has(f) || f.dead || f.invuln || p.life <= 0) continue;
      if (!overlap(projBox(p), f.box())) continue;
      p.hitIds.add(f);
      applyHit(p, f, p);
      if (!p.pierce) p.life = 0;
    }
  }
  game.projectiles = game.projectiles.filter(p => p.life > 0 && p.x > B.left && p.x < B.right && p.y > B.top && p.y < B.bottom);
}

function burst(x, y, color, n, speed) {
  for (let i = 0; i < n; i++) {
    const a = Math.random() * Math.PI * 2, s = speed * (0.4 + Math.random() * 0.8);
    game.sparks.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: 20 + Math.random() * 20, color });
  }
}

function updateSparks() {
  for (const p of game.sparks) { p.x += p.vx; p.y += p.vy; p.vx *= 0.92; p.vy *= 0.92; p.life--; }
  game.sparks = game.sparks.filter(p => p.life > 0);
}

// ---- draw ----

function draw() {
  ctx.setTransform(viewScale, 0, 0, viewScale, 0, 0);
  if (game.screen === 'select') { drawSelect(); return; }
  if (game.screen === 'stage') { drawStageSelect(); return; }
  const s = game.shake;
  ctx.setTransform(viewScale, 0, 0, viewScale, (Math.random() - 0.5) * s * viewScale, (Math.random() - 0.5) * s * viewScale);
  game.stage.draw(ctx, game.hz);
  for (const p of game.projectiles) drawProjectile(p);
  for (const f of game.fighters) f.draw(ctx);
  for (const p of game.sparks) {
    ctx.globalAlpha = Math.min(1, p.life / 20);
    ctx.fillStyle = p.color;
    ctx.fillRect(p.x - 3, p.y - 3, 6, 6);
  }
  ctx.globalAlpha = 1;
  if (game.stage.drawFront) game.stage.drawFront(ctx, game.hz);
  ctx.setTransform(viewScale, 0, 0, viewScale, 0, 0);
  if (game.dark > 0) drawDark();
  if (game.sepia > 0) drawSepia();
  drawHud();
  if (game.banner) drawBanner(game.banner);
  if (game.countdown > 0) bigText(game.countdown > 30 ? String(Math.ceil((game.countdown - 30) / 40)) : 'GO!', 360);
  if (game.paused) bigText('Paused', 330, 'P to resume, Esc to quit');
  if (game.screen === 'result') {
    ctx.fillStyle = 'rgba(5,10,20,0.6)';
    ctx.fillRect(0, 0, STAGE.w, STAGE.h);
    const w = game.winner;
    bigText(w ? `${w.isCpu ? 'CPU' : 'P' + (w.idx + 1)} wins! (${w.m.name})` : 'Draw', 330, 'F or K to play again');
  }
}

function drawProjectile(p) {
  const fade = Math.min(1, p.life / 8);
  ctx.globalAlpha = fade;
  if (p.look === 'wave') {
    ctx.strokeStyle = 'rgba(255,255,255,0.85)';
    ctx.lineWidth = 4;
    for (let k = 0; k < 3; k++) {
      ctx.beginPath();
      ctx.arc(p.x - p.facing * 18, p.y, 10 + k * 9, -0.9, 0.9);
      if (p.facing < 0) { ctx.beginPath(); ctx.arc(p.x - p.facing * 18, p.y, 10 + k * 9, Math.PI - 0.9, Math.PI + 0.9); }
      ctx.stroke();
    }
  } else if (p.look === 'hedge') {
    const grow = Math.min(1, (p.life > 18 ? 24 - p.life : 6) / 6);
    ctx.fillStyle = '#2f6b2a';
    roundRect(ctx, p.x - p.w / 2, p.y + p.h / 2 - p.h * grow, p.w, p.h * grow, 12);
    ctx.fill();
    ctx.fillStyle = '#3f8a37';
    for (let k = 0; k < 4; k++) { ctx.beginPath(); ctx.arc(p.x - p.w / 2 + 8 + k * 11, p.y + p.h / 2 - p.h * grow + 8, 9, 0, Math.PI * 2); ctx.fill(); }
  } else if (p.look === 'herd') {
    for (let k = 0; k < 3; k++) {
      ctx.save();
      ctx.translate(p.x + (k - 1) * 46, p.y + p.h / 2 + (k % 2) * 4);
      ctx.scale(p.facing * 0.8, 0.8);
      drawMascot(ctx, p.owner.m, game.t + k * 7, 'run');
      ctx.restore();
    }
  } else if (p.look === 'bird') {
    ctx.fillStyle = p.color || '#ffe28a';
    const flap = Math.sin(game.t / 2) * p.h * 0.3;
    ctx.beginPath(); ctx.moveTo(p.x + p.facing * p.w * 0.5, p.y); ctx.lineTo(p.x - p.facing * p.w * 0.4, p.y - p.h * 0.5 - flap);
    ctx.lineTo(p.x - p.facing * p.w * 0.2, p.y); ctx.lineTo(p.x - p.facing * p.w * 0.4, p.y + p.h * 0.5 + flap); ctx.fill();
  } else if (p.look === 'none') {
    // invisible burst
  } else {
    ctx.fillStyle = p.color || '#ffe28a';
    ctx.beginPath(); ctx.ellipse(p.x, p.y, p.w / 2, p.h / 2, 0, 0, Math.PI * 2); ctx.fill();
  }
  ctx.globalAlpha = 1;
}

function drawDark() {
  // night falls: everything dark except a spotlight on each fighter
  const l = darkLayer.getContext('2d');
  l.globalCompositeOperation = 'source-over';
  l.clearRect(0, 0, STAGE.w, STAGE.h);
  l.fillStyle = `rgba(2, 4, 12, ${Math.min(1, game.dark / 20) * 0.7})`;
  l.fillRect(0, 0, STAGE.w, STAGE.h);
  l.globalCompositeOperation = 'destination-out';
  for (const f of game.fighters) {
    if (f.dead) continue;
    const g = l.createRadialGradient(f.x, f.y - f.h / 2, 50, f.x, f.y - f.h / 2, 100);
    g.addColorStop(0, 'rgba(0,0,0,1)');
    g.addColorStop(1, 'rgba(0,0,0,0)');
    l.fillStyle = g;
    l.fillRect(f.x - 100, f.y - f.h / 2 - 100, 200, 200);
  }
  ctx.drawImage(darkLayer, 0, 0);
}
const darkLayer = Object.assign(document.createElement('canvas'), { width: 1280, height: 720 });

// High Noon: the scene turns sepia and a clock ticks to twelve before the shot.
function drawSepia() {
  const a = Math.min(1, game.sepia / 15, (game.sepiaMax - game.sepia) / 8);
  ctx.save();
  ctx.globalAlpha = a;
  ctx.globalCompositeOperation = 'saturation';
  ctx.fillStyle = '#808080';
  ctx.fillRect(0, 0, STAGE.w, STAGE.h);
  ctx.globalCompositeOperation = 'multiply';
  ctx.fillStyle = '#e8c08a';
  ctx.fillRect(0, 0, STAGE.w, STAGE.h);
  ctx.restore();
  const left = Math.max(0, game.sepia - (game.sepiaMax - 95));
  const x = 640, y = 110, r = 46;
  ctx.globalAlpha = a;
  ctx.fillStyle = '#f4e6c8';
  ctx.strokeStyle = '#3a2a1a';
  ctx.lineWidth = 5;
  ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#3a2a1a';
  for (let k = 0; k < 12; k++) {
    const t = k / 12 * Math.PI * 2;
    ctx.fillRect(x + Math.sin(t) * (r - 9) - 2, y - Math.cos(t) * (r - 9) - 2, 4, 4);
  }
  const minute = -left / 95 * Math.PI * 1.2;
  ctx.lineCap = 'round';
  ctx.lineWidth = 4;
  ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + Math.sin(minute) * (r - 12), y - Math.cos(minute) * (r - 12)); ctx.stroke();
  ctx.lineWidth = 6;
  ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + Math.sin(minute / 12) * (r - 22), y - Math.cos(minute / 12) * (r - 22)); ctx.stroke();
  ctx.lineCap = 'butt';
  ctx.globalAlpha = 1;
}

function drawBanner(b) {
  const a = Math.min(1, b.t / 10);
  ctx.globalAlpha = a;
  ctx.fillStyle = b.color;
  ctx.fillRect(0, 250, STAGE.w, 110);
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  ctx.fillRect(0, 250, STAGE.w, 110);
  ctx.globalAlpha = 1;
  ctx.globalAlpha = a;
  bigText(b.text, 315, b.sub);
  ctx.globalAlpha = 1;
}

function drawHud() {
  drawControlsBox();
  game.fighters.forEach((f, i) => {
    const x = 420 + i * 440, y = 620;
    ctx.fillStyle = 'rgba(10,16,28,0.8)';
    roundRect(ctx, x - 150, y, 300, 86, 12);
    ctx.fill();
    ctx.fillStyle = P_COLORS[i];
    ctx.fillRect(x - 150, y + 10, 6, 66);
    ctx.save();
    ctx.beginPath();
    ctx.rect(x - 144, y, 90, 86);
    ctx.clip();
    ctx.translate(x - 105, y + 78);
    ctx.scale(0.9, 0.9);
    drawMascot(ctx, f.m, 0, 'still');
    ctx.restore();
    ctx.textAlign = 'left';
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 15px system-ui, sans-serif';
    ctx.fillText(`${f.isCpu ? 'CPU' : 'P' + (i + 1)}  ${f.m.name}`, x - 55, y + 22);
    const heat = Math.min(1, f.damage / 150);
    ctx.fillStyle = `rgb(255, ${Math.round(255 - heat * 190)}, ${Math.round(255 - heat * 215)})`;
    ctx.font = 'bold 34px system-ui, sans-serif';
    ctx.fillText(`${Math.floor(f.damage)}%`, x - 55, y + 58);
    for (let k = 0; k < STOCKS; k++) {
      ctx.fillStyle = k < f.stocks ? (lum(f.m.color) < 0.15 ? f.m.trim : f.m.color) : 'rgba(255,255,255,0.15)';
      ctx.beginPath(); ctx.arc(x + 70 + k * 22, y + 44, 8, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.5)'; ctx.lineWidth = 1.5; ctx.stroke();
    }
    // Heisman meter
    const full = f.meter >= METER_MAX;
    ctx.fillStyle = 'rgba(255,255,255,0.12)';
    ctx.fillRect(x - 55, y + 68, 190, 8);
    ctx.fillStyle = full ? `hsl(45, 100%, ${60 + 15 * Math.sin(game.t / 5)}%)` : '#c9a640';
    ctx.fillRect(x - 55, y + 68, 190 * f.meter / METER_MAX, 8);
    if (full) {
      ctx.font = 'bold 11px system-ui, sans-serif';
      ctx.fillStyle = '#ffe28a';
      ctx.fillText('HEISMAN READY', x + 40, y + 63);
    }
  });
}

// Small controls reminder in the top left corner. The second player's line is left out against the CPU.
function drawControlsBox() {
  const rows = [['P1', 'WASD move/jump, F attack, G special']];
  if (!game.fighters[1].isCpu) rows.push(['P2', 'Arrows, K attack, L special']);
  rows.push(['', 'Attack + special = Heisman. P pause']);
  ctx.font = '12px system-ui, sans-serif';
  const w = Math.max(...rows.map(r => ctx.measureText(r[0] + '  ' + r[1]).width)) + 20, h = rows.length * 17 + 12;
  ctx.fillStyle = 'rgba(10,16,28,0.7)';
  roundRect(ctx, 12, 12, w, h, 8);
  ctx.fill();
  ctx.textAlign = 'left';
  rows.forEach((r, i) => {
    ctx.fillStyle = r[0] === 'P1' ? '#ff8a8a' : r[0] === 'P2' ? '#8ac0ff' : 'rgba(255,255,255,0.55)';
    ctx.fillText(r[0], 22, 31 + i * 17);
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ctx.fillText(r[1], 22 + (r[0] ? 26 : 0), 31 + i * 17);
  });
}

function bigText(text, y, sub) {
  ctx.textAlign = 'center';
  ctx.font = 'bold 64px system-ui, sans-serif';
  ctx.lineWidth = 8;
  ctx.strokeStyle = '#0b1220';
  ctx.strokeText(text, STAGE.w / 2, y);
  ctx.fillStyle = '#ffffff';
  ctx.fillText(text, STAGE.w / 2, y);
  if (sub) {
    ctx.font = '20px system-ui, sans-serif';
    ctx.fillStyle = '#e3e9f3';
    ctx.fillText(sub, STAGE.w / 2, y + 40);
  }
}

// ---- select screen: an 8 x 4 grid, SEC on top, Big 12 below ----

const CARD = { w: 140, h: 86, gap: 8, x0: 52 };
function cardPos(k) {
  const row = Math.floor(k / COLS), col = k % COLS;
  return { x: CARD.x0 + col * (CARD.w + CARD.gap), y: (row < 2 ? 92 : 302) + (row % 2) * (CARD.h + CARD.gap) };
}

function drawSelect() {
  const g = ctx.createLinearGradient(0, 0, 0, STAGE.h);
  g.addColorStop(0, '#0b1530');
  g.addColorStop(1, '#22365c');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, STAGE.w, STAGE.h);
  ctx.textAlign = 'center';
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 40px system-ui, sans-serif';
  ctx.fillText('MASCOT BRAWL', STAGE.w / 2, 48);
  ctx.textAlign = 'left';
  ctx.font = 'bold 15px system-ui, sans-serif';
  ctx.fillStyle = '#9fb0c8';
  ctx.fillText('SEC', CARD.x0, 84);
  ctx.fillText('BIG 12', CARD.x0, 294);

  ROSTER.forEach((e, k) => {
    const { x, y } = cardPos(k), ok = playable(e);
    ctx.fillStyle = ok ? 'rgba(10,16,28,0.85)' : 'rgba(10,16,28,0.5)';
    roundRect(ctx, x, y, CARD.w, CARD.h, 10);
    ctx.fill();
    ctx.fillStyle = e.color;
    ctx.fillRect(x, y + CARD.h - 6, CARD.w, 6);
    ctx.fillStyle = e.trim;
    ctx.fillRect(x, y + CARD.h - 8, CARD.w, 2);
    if (ok) {
      ctx.save();
      ctx.beginPath(); ctx.rect(x, y, CARD.w, CARD.h - 8); ctx.clip();
      ctx.translate(x + 34, y + CARD.h - 10);
      ctx.scale(0.8, 0.8);
      drawMascot(ctx, fighterData(e), game.t, 'idle');
      ctx.restore();
    } else {
      ctx.fillStyle = 'rgba(255,255,255,0.12)';
      ctx.font = 'bold 30px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('?', x + 30, y + 54);
    }
    ctx.textAlign = 'left';
    ctx.fillStyle = ok ? '#ffffff' : '#7d8aa0';
    ctx.font = 'bold 13px system-ui, sans-serif';
    ctx.fillText(e.school, x + 64, y + 30, CARD.w - 68);
    ctx.font = '12px system-ui, sans-serif';
    ctx.fillStyle = ok ? '#c8d3e6' : '#66738a';
    ctx.fillText(e.mascot, x + 64, y + 48, CARD.w - 68);
    if (!ok) ctx.fillText('soon', x + 64, y + 66);
  });

  game.sel.forEach((s, i) => {
    const { x, y } = cardPos(s.i), pad = 3 + i * 5;
    ctx.strokeStyle = P_COLORS[i];
    ctx.lineWidth = s.ready ? 5 : 3;
    roundRect(ctx, x - pad, y - pad, CARD.w + pad * 2, CARD.h + pad * 2, 12);
    ctx.stroke();
    ctx.fillStyle = P_COLORS[i];
    ctx.font = 'bold 12px system-ui, sans-serif';
    ctx.textAlign = i === 0 ? 'left' : 'right';
    ctx.fillText((i === 1 && game.p2cpu ? 'CPU' : 'P' + (i + 1)) + (s.ready ? ' ready' : ''), i === 0 ? x + 4 : x + CARD.w - 4, y - pad - 4);
  });

  game.sel.forEach((s, i) => drawPreview(ROSTER[s.i], i));

  ctx.textAlign = 'center';
  ctx.font = '14px system-ui, sans-serif';
  ctx.fillStyle = game.note.t > 0 ? '#ffd27a' : '#c8d3e6';
  const s1 = game.sel[0];
  const step = game.note.t > 0 ? game.note.text
    : !s1.ready ? 'P1: pick with W A S D, F to confirm'
    : game.p2cpu ? 'Now pick the CPU with W A S D, F to confirm (G to go back)'
    : 'Waiting for P2: arrows to pick, K to confirm';
  ctx.fillText(step, STAGE.w / 2, 690);
  ctx.fillStyle = '#9fb0c8';
  ctx.font = '12px system-ui, sans-serif';
  ctx.fillText(`Player 2: ${game.p2cpu ? 'CPU' : 'human'} (C to switch).  Fight: move, jump, F/K attack, G/L special, attack + special with a full meter for the Heisman.`, STAGE.w / 2, 710);
}

function drawStageSelect() {
  ctx.fillStyle = '#0b1530';
  ctx.fillRect(0, 0, STAGE.w, STAGE.h);
  ctx.textAlign = 'center';
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 40px system-ui, sans-serif';
  ctx.fillText('CHOOSE A STAGE', STAGE.w / 2, 80);
  const sc = 0.4, cw = STAGE.w * sc, ch = STAGE.h * sc, gap = 60, x0 = (STAGE.w - STAGES.length * cw - (STAGES.length - 1) * gap) / 2;
  STAGES.forEach((st, k) => {
    const x = x0 + k * (cw + gap), y = 170;
    ctx.save();
    ctx.beginPath(); ctx.rect(x, y, cw, ch); ctx.clip();
    ctx.translate(x, y);
    ctx.scale(sc, sc);
    st.draw(ctx, null);
    ctx.restore();
    const on = k === game.stageIdx;
    ctx.strokeStyle = on ? P_COLORS[0] : 'rgba(255,255,255,0.15)';
    ctx.lineWidth = on ? 5 : 2;
    ctx.strokeRect(x - 3, y - 3, cw + 6, ch + 6);
    ctx.textAlign = 'center';
    ctx.fillStyle = on ? '#ffffff' : '#9fb0c8';
    ctx.font = 'bold 22px system-ui, sans-serif';
    ctx.fillText(st.name, x + cw / 2, y + ch + 40);
    ctx.font = '14px system-ui, sans-serif';
    ctx.fillText(st.school ? `Home of ${st.school}` : 'No hazards', x + cw / 2, y + ch + 64);
  });
  ctx.fillStyle = '#c8d3e6';
  ctx.font = '15px system-ui, sans-serif';
  ctx.fillText('P1: A / D to pick, F to fight, G to go back', STAGE.w / 2, 650);
}

function drawPreview(e, i) {
  const x = i === 0 ? 52 : 668, y = 498, w = 560;
  ctx.fillStyle = 'rgba(10,16,28,0.85)';
  roundRect(ctx, x, y, w, 168, 12);
  ctx.fill();
  ctx.fillStyle = P_COLORS[i];
  ctx.fillRect(x, y + 12, 5, 144);
  ctx.textAlign = 'left';
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 20px system-ui, sans-serif';
  ctx.fillText(e.mascot, x + 130, y + 32);
  ctx.fillStyle = '#9fb0c8';
  ctx.font = '13px system-ui, sans-serif';
  ctx.fillText(`${e.school} ${e.team}, ${e.weight}`, x + 130, y + 52);
  if (!playable(e)) {
    ctx.fillText('Coming soon', x + 130, y + 84);
    return;
  }
  const d = fighterData(e);
  ctx.save();
  // four-legged fighters are wide, so they get a smaller preview to stay clear of the move list
  const ps = ART[d.id].body === 'beast' ? 1.1 : 1.4;
  ctx.translate(x + 64, y + 150);
  ctx.scale(ps, ps);
  drawMascot(ctx, d, game.t, 'idle');
  ctx.restore();
  const rows = [['Neutral', 'neutralB'], ['Side', 'sideB'], ['Up', 'upB'], ['Down', 'downB'], ['Heisman', 'super']];
  rows.forEach(([label, key], r) => {
    ctx.fillStyle = key === 'super' ? '#ffe28a' : '#c8d3e6';
    ctx.font = 'bold 13px system-ui, sans-serif';
    ctx.fillText(label, x + 130, y + 76 + r * 19);
    ctx.font = '13px system-ui, sans-serif';
    ctx.fillText(d.moves[key].name, x + 200, y + 76 + r * 19);
  });
}

// ---- loop: fixed 60 ticks per second ----

let last = performance.now(), acc = 0;
function frame(now) {
  acc = Math.min(acc + (now - last), 250);
  last = now;
  while (acc >= 1000 / 60) { tick(); acc -= 1000 / 60; }
  draw();
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

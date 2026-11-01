'use strict';
// Screens (select, fight, result), the fixed-step loop, hits, effects and the HUD.

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const STOCKS = 3;
const P_COLORS = ['#ff5a5a', '#5aa8ff'];

const game = {
  screen: 'select',
  sel: [{ i: 0, ready: false }, { i: 1, ready: false }],
  p2cpu: true,
  fighters: [],
  countdown: 0,
  freeze: 0,
  shake: 0,
  sparks: [],
  paused: false,
  winner: null,
  t: 0,
};

function startFight() {
  game.fighters = [0, 1].map(i => new Fighter(i, MASCOTS[game.sel[i].i], i === 1 && game.p2cpu, STOCKS));
  game.screen = 'fight';
  game.countdown = 150;
  game.sparks = [];
  game.paused = false;
  game.winner = null;
}

function toSelect() {
  game.screen = 'select';
  game.sel.forEach(s => { s.ready = false; });
}

// ---- update ----

function tick() {
  game.t++;
  if (game.screen === 'select') tickSelect();
  else if (game.screen === 'fight') tickFight();
  else if (game.screen === 'result' && (Input.hit('KeyF') || Input.hit('KeyK') || Input.hit('Enter'))) toSelect();
  Input.endTick();
}

function tickSelect() {
  const s1 = game.sel[0], s2 = game.sel[1], n = MASCOTS.length;
  const c1 = Input.read(0), c2 = Input.read(1);
  if (Input.hit('KeyC')) { game.p2cpu = !game.p2cpu; s2.ready = false; }
  // P1 picks for the CPU once P1 is ready
  const cpuTurn = game.p2cpu && s1.ready;
  if (!s1.ready) {
    if (c1.leftP) s1.i = (s1.i + n - 1) % n;
    if (c1.rightP) s1.i = (s1.i + 1) % n;
    if (c1.attackP) s1.ready = true;
  } else if (cpuTurn) {
    if (c1.leftP) s2.i = (s2.i + n - 1) % n;
    if (c1.rightP) s2.i = (s2.i + 1) % n;
    if (c1.attackP) s2.ready = true;
    if (c1.specialP) s1.ready = false;
  } else if (c1.specialP) s1.ready = false;
  if (!game.p2cpu) {
    if (!s2.ready) {
      if (c2.leftP) s2.i = (s2.i + n - 1) % n;
      if (c2.rightP) s2.i = (s2.i + 1) % n;
      if (c2.attackP) s2.ready = true;
    } else if (c2.specialP) s2.ready = false;
  }
  if (s1.ready && s2.ready) startFight();
}

function tickFight() {
  if (Input.hit('Escape')) { toSelect(); return; }
  if (Input.hit('KeyP')) game.paused = !game.paused;
  if (game.paused) return;
  updateSparks();
  if (game.shake > 0) game.shake *= 0.85;
  if (game.freeze > 0) { game.freeze--; return; }
  if (game.countdown > 0) { game.countdown--; return; }

  const [a, b] = game.fighters;
  const ca = a.isCpu ? cpuControls(a, b) : Input.read(0);
  const cb = b.isCpu ? cpuControls(b, a) : Input.read(1);
  a.update(ca);
  b.update(cb);

  // both hits are checked before either is applied, so trades work
  const aHit = landed(a, b), bHit = landed(b, a);
  if (aHit) applyHit(a, b, aHit);
  if (bHit) applyHit(b, a, bHit);

  for (const f of game.fighters) {
    if (f.outOfBounds()) {
      burst(Math.max(20, Math.min(STAGE.w - 20, f.x)), Math.max(20, Math.min(STAGE.h - 20, f.y - f.h / 2)), P_COLORS[f.idx], 40, 9);
      game.shake = 14;
      f.ko();
    }
  }
  const alive = game.fighters.filter(f => !f.out);
  if (alive.length < 2) {
    game.winner = alive[0] || null;
    game.screen = 'result';
  }
}

// Returns the move that connects, or null.
function landed(att, def) {
  const ok = att.hitActive && att.move && !att.move.hit && def.dead === 0 && def.invuln === 0 && overlap(att.hitbox(), def.box());
  return ok ? att.move.def : null;
}

function applyHit(att, def, move) {
  const dmg = move.dmg;
  if (att.move) att.move.hit = true;
  const kb = def.takeHit(att, move);
  game.freeze = Math.min(12, Math.round(3 + dmg / 2));
  game.shake = Math.min(12, kb * 0.5);
  burst(def.x, def.y - def.h / 2, '#fff3b0', 6 + Math.round(dmg), 4 + kb * 0.2);
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
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  if (game.screen === 'select') { drawSelect(); return; }
  const s = game.shake;
  ctx.setTransform(1, 0, 0, 1, (Math.random() - 0.5) * s, (Math.random() - 0.5) * s);
  drawStage(ctx);
  for (const f of game.fighters) f.draw(ctx);
  for (const p of game.sparks) {
    ctx.globalAlpha = Math.min(1, p.life / 20);
    ctx.fillStyle = p.color;
    ctx.fillRect(p.x - 3, p.y - 3, 6, 6);
  }
  ctx.globalAlpha = 1;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  drawHud();
  if (game.countdown > 0) bigText(game.countdown > 30 ? String(Math.ceil((game.countdown - 30) / 40)) : 'GO!', 360);
  if (game.paused) bigText('Paused', 330, 'P to resume, Esc to quit');
  if (game.screen === 'result') {
    ctx.fillStyle = 'rgba(5,10,20,0.6)';
    ctx.fillRect(0, 0, STAGE.w, STAGE.h);
    const w = game.winner;
    bigText(w ? `${w.isCpu ? 'CPU' : 'P' + (w.idx + 1)} wins! (${w.m.name})` : 'Draw', 330, 'F or K to play again');
  }
}

function drawHud() {
  game.fighters.forEach((f, i) => {
    const x = 420 + i * 440, y = 620;
    ctx.fillStyle = 'rgba(10,16,28,0.8)';
    roundRect(ctx, x - 150, y, 300, 82, 12);
    ctx.fill();
    ctx.fillStyle = P_COLORS[i];
    ctx.fillRect(x - 150, y + 10, 6, 62);
    ctx.save();
    ctx.beginPath();
    ctx.rect(x - 144, y, 90, 82);
    ctx.clip();
    ctx.translate(x - 105, y + 74);
    ctx.scale(0.9, 0.9);
    drawMascot(ctx, f.m, 0, 'still');
    ctx.restore();
    ctx.textAlign = 'left';
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 16px system-ui, sans-serif';
    ctx.fillText(`${f.isCpu ? 'CPU' : 'P' + (i + 1)}  ${f.m.name}`, x - 55, y + 24);
    const heat = Math.min(1, f.damage / 150);
    ctx.fillStyle = `rgb(255, ${Math.round(255 - heat * 190)}, ${Math.round(255 - heat * 215)})`;
    ctx.font = 'bold 38px system-ui, sans-serif';
    ctx.fillText(`${Math.floor(f.damage)}%`, x - 55, y + 66);
    for (let k = 0; k < STOCKS; k++) {
      ctx.fillStyle = k < f.stocks ? f.m.color : 'rgba(255,255,255,0.15)';
      ctx.beginPath(); ctx.arc(x + 70 + k * 22, y + 52, 8, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.5)'; ctx.lineWidth = 1.5; ctx.stroke();
    }
  });
}

function bigText(text, y, sub) {
  ctx.textAlign = 'center';
  ctx.font = 'bold 72px system-ui, sans-serif';
  ctx.lineWidth = 8;
  ctx.strokeStyle = '#0b1220';
  ctx.strokeText(text, STAGE.w / 2, y);
  ctx.fillStyle = '#ffffff';
  ctx.fillText(text, STAGE.w / 2, y);
  if (sub) {
    ctx.font = '20px system-ui, sans-serif';
    ctx.fillStyle = '#c8d3e6';
    ctx.fillText(sub, STAGE.w / 2, y + 44);
  }
}

function drawSelect() {
  const g = ctx.createLinearGradient(0, 0, 0, STAGE.h);
  g.addColorStop(0, '#0b1530');
  g.addColorStop(1, '#22365c');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, STAGE.w, STAGE.h);
  ctx.textAlign = 'center';
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 60px system-ui, sans-serif';
  ctx.fillText('MASCOT BRAWL', STAGE.w / 2, 90);
  ctx.font = '18px system-ui, sans-serif';
  ctx.fillStyle = '#c8d3e6';
  ctx.fillText('Choose your mascot', STAGE.w / 2, 124);

  const cw = 230, gap = 30, x0 = (STAGE.w - (MASCOTS.length * cw + (MASCOTS.length - 1) * gap)) / 2;
  MASCOTS.forEach((m, k) => {
    const x = x0 + k * (cw + gap), y = 160;
    ctx.fillStyle = 'rgba(10,16,28,0.8)';
    roundRect(ctx, x, y, cw, 320, 14);
    ctx.fill();
    ctx.fillStyle = m.color;
    ctx.fillRect(x, y + 250, cw, 6);
    ctx.save();
    ctx.translate(x + cw / 2, y + 230);
    ctx.scale(2, 2);
    drawMascot(ctx, m, game.t, 'idle');
    ctx.restore();
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 22px system-ui, sans-serif';
    ctx.fillText(m.name, x + cw / 2, y + 284);
    ctx.fillStyle = '#9fb0c8';
    ctx.font = '13px system-ui, sans-serif';
    ctx.fillText(m.blurb, x + cw / 2, y + 306);
    game.sel.forEach((s, i) => {
      if (s.i !== k) return;
      ctx.strokeStyle = P_COLORS[i];
      ctx.lineWidth = s.ready ? 6 : 3;
      roundRect(ctx, x - 4 - i * 6, y - 4 - i * 6, cw + 8 + i * 12, 328 + i * 12, 16);
      ctx.stroke();
      ctx.fillStyle = P_COLORS[i];
      ctx.font = 'bold 16px system-ui, sans-serif';
      const label = (i === 1 && game.p2cpu ? 'CPU' : 'P' + (i + 1)) + (s.ready ? ' ready' : '');
      ctx.fillText(label, x + cw / 2, y - 14 - i * 6);
    });
  });

  ctx.font = '16px system-ui, sans-serif';
  ctx.fillStyle = '#c8d3e6';
  const s1 = game.sel[0];
  const step = !s1.ready ? 'P1: pick with A / D, F to confirm'
    : game.p2cpu ? 'Now pick the CPU with A / D, F to confirm (G to go back)'
    : 'Waiting for P2: arrows to pick, K to confirm';
  ctx.fillText(step, STAGE.w / 2, 540);
  ctx.fillStyle = '#9fb0c8';
  ctx.fillText(`Player 2: ${game.p2cpu ? 'CPU' : 'human'} (C to switch)`, STAGE.w / 2, 568);
  ctx.font = '14px system-ui, sans-serif';
  ctx.fillText('P1: A D move, W jump, S down, F attack, G special      P2: arrows move, Up jump, K attack, L special', STAGE.w / 2, 640);
  ctx.fillText('Attack + direction changes the move. Knock the other mascot past the edge of the screen. 3 lives each.', STAGE.w / 2, 664);
  ctx.fillText('P pause, Esc back to this screen', STAGE.w / 2, 688);
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

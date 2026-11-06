'use strict';
// Home stadiums for the first wave. Same layout as every stage (fair fights), each with its own look and one
// hazard from a real tradition. Hazards only run when game.hazards is on (H on the stage select).
//   Tiger Stadium (LSU): night game, the lights go out now and then
//   The Swamp (Florida): gators in the water off both edges snap at anyone recovering low
//   Sanford Stadium (Georgia): hedges at both sides stop fighters launched sideways below their top
//   Darrell K Royal (Texas): Bevo gets loose and charges across the field
//   Kyle Field (Texas A&M): the 12th Man sways and the floor rocks fighters side to side
//   Bryant-Denny (Alabama): the Rammer Jammer chant stuns anyone standing on the field (platforms are safe)

// ---- shared drawing ----

// o: sky (colour stops), stands, rows (stripe colours), crowd (fan colours), board { title, name, city, color },
// lights, extra (drawn after the sky, before the stands), sway (sideways shift of the crowd)
function stadiumBack(ctx, o, hz) {
  const sky = ctx.createLinearGradient(0, 0, 0, STAGE.h);
  o.sky.forEach((c, i) => sky.addColorStop(i / (o.sky.length - 1), c));
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, STAGE.w, STAGE.h);
  if (o.extra) o.extra(ctx, hz);
  ctx.fillStyle = o.stands;
  ctx.beginPath();
  ctx.moveTo(0, 480); ctx.lineTo(150, 300); ctx.lineTo(1130, 300); ctx.lineTo(1280, 480); ctx.lineTo(1280, 720); ctx.lineTo(0, 720);
  ctx.fill();
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  ctx.fillRect(150, 292, 980, 10);
  for (let r = 0; r < 7; r++) {
    ctx.fillStyle = o.rows[r % o.rows.length];
    ctx.fillRect(0, 316 + r * 24, STAGE.w, 3);
  }
  ctx.save();
  if (o.sway) ctx.translate(o.sway, 0);
  drawCrowd(ctx, 334, 6, o.crowd, 60);
  ctx.restore();
  const b = o.board;
  ctx.fillStyle = '#111';
  ctx.fillRect(520, 40, 240, 100);
  ctx.strokeStyle = b.color;
  ctx.lineWidth = 4;
  ctx.strokeRect(520, 40, 240, 100);
  ctx.textAlign = 'center';
  ctx.fillStyle = b.color;
  ctx.font = 'bold 22px system-ui, sans-serif';
  ctx.fillText(b.title, 640, 74, 220);
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 14px system-ui, sans-serif';
  ctx.fillText(b.name, 640, 104, 224);
  ctx.font = '12px system-ui, sans-serif';
  ctx.fillText(b.city, 640, 124, 220);
  drawLights(ctx, o.lights || '#fff6d8');
}

function stadiumGround(ctx, o) {
  drawGoalposts(ctx);
  drawField(ctx, o.ez, o.ez2 || o.ez, [o.label, o.label]);
  drawPlatforms(ctx, o.platTop, o.platSide, 0);
}

// big text in the middle of the screen for a hazard warning, fading with t / max
function hazardText(ctx, text, color, t, max, y = 120, size = 54) {
  ctx.globalAlpha = Math.min(1, t / 12, (max - t + 1) / 8);
  ctx.textAlign = 'center';
  ctx.font = `900 ${size}px system-ui, sans-serif`;
  ctx.lineWidth = 7;
  ctx.strokeStyle = '#0b1220';
  ctx.strokeText(text, 640, y);
  ctx.fillStyle = color;
  ctx.fillText(text, 640, y);
  ctx.globalAlpha = 1;
}

const rosterArt = id => fighterData(ROSTER.find(e => e.id === id));

// ---- Tiger Stadium (LSU) ----

const LSU = { purple: '#461d7c', gold: '#fdd023' };
const lsuLook = {
  sky: ['#08051a', '#1c0f38', '#2e1c4a', '#120a1e'], stands: '#140c24', rows: [LSU.purple, LSU.gold],
  crowd: [LSU.purple, LSU.gold, LSU.gold, '#f2f2f2'], board: { title: 'TIGERS', name: 'TIGER STADIUM', city: 'BATON ROUGE, LA', color: LSU.gold },
  lights: '#fff1c0', ez: LSU.purple, label: 'LSU', platTop: LSU.gold, platSide: LSU.purple,
  extra(ctx) {
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    for (let k = 0; k < 60; k++) ctx.fillRect((k * 173) % 1280, (k * 61) % 280, 2, 2);
    ctx.fillStyle = '#f4ecd0';
    ctx.beginPath(); ctx.arc(980, 90, 26, 0, Math.PI * 2); ctx.fill();
  },
};
function lsuBack(ctx, hz) {
  stadiumBack(ctx, lsuLook, hz);
  // Mike's habitat in the corner
  ctx.fillStyle = '#6a6458';
  ctx.fillRect(30, 500, 170, 24);
  ctx.save(); ctx.translate(115, 500); ctx.scale(0.7, 0.7);
  drawMascot(ctx, rosterArt('lsu'), game.t, 'idle');
  ctx.restore();
  ctx.fillStyle = '#2a2a2a';
  for (let x = 34; x < 200; x += 12) ctx.fillRect(x, 420, 3, 80);
  ctx.fillRect(30, 416, 170, 6);
  ctx.fillStyle = LSU.gold;
  ctx.font = 'bold 10px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText("MIKE'S HABITAT", 115, 412);
}
function lsuUpdate(hz) {
  hz.t++;
  if (hz.banner > 0) hz.banner--;
  // lights out for 4 s every 20 s
  if (hz.t % 1200 === 700) { game.dark = Math.max(game.dark, 240); hz.banner = 90; }
}
function lsuOverlay(ctx, hz) {
  if (hz.banner > 0) hazardText(ctx, 'NIGHT GAME', LSU.gold, hz.banner, 90);
}

// ---- Ben Hill Griffin Stadium, The Swamp (Florida) ----

const UF = { blue: '#0021a5', orange: '#fa4616' };
const WATER_Y = 600;
const swampLook = {
  sky: ['#2a6fc9', '#7fb8e6', '#d8e8c8', '#40603a'], stands: '#13213a', rows: [UF.orange, UF.blue],
  crowd: [UF.orange, UF.blue, UF.orange, '#f2f2f2'], board: { title: 'THE SWAMP', name: 'BEN HILL GRIFFIN STADIUM', city: 'GAINESVILLE, FL', color: UF.orange },
  lights: '#fffbe8', ez: UF.blue, ez2: UF.orange, label: 'GATORS', platTop: '#f2f2f2', platSide: UF.orange,
  extra(ctx) {
    // palms and hanging moss on both sides
    for (const x of [70, 1210]) {
      ctx.strokeStyle = '#3a2a1a'; ctx.lineWidth = 8; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(x, 330); ctx.quadraticCurveTo(x + 10, 230, x - 5, 160); ctx.stroke();
      ctx.strokeStyle = '#2f6b2a'; ctx.lineWidth = 6;
      for (let k = 0; k < 6; k++) {
        const a = k / 6 * Math.PI * 2;
        ctx.beginPath(); ctx.moveTo(x - 5, 160); ctx.quadraticCurveTo(x - 5 + Math.cos(a) * 40, 150 + Math.sin(a) * 10 - 20, x - 5 + Math.cos(a) * 70, 175 + Math.abs(Math.sin(a)) * 20); ctx.stroke();
      }
    }
    ctx.lineCap = 'butt';
  },
};
function swampBack(ctx, hz) { stadiumBack(ctx, swampLook, hz); }
function swampGround(ctx, hz) {
  // murky water off both edges, under the field level
  const S = STAGE.main;
  for (const [x1, x2] of [[0, S.x1], [S.x2, STAGE.w]]) {
    const g = ctx.createLinearGradient(0, WATER_Y, 0, 720);
    g.addColorStop(0, '#3d6b4a'); g.addColorStop(1, '#1a2f22');
    ctx.fillStyle = g;
    ctx.fillRect(x1, WATER_Y, x2 - x1, 720 - WATER_Y);
    ctx.strokeStyle = 'rgba(200,230,200,0.35)'; ctx.lineWidth = 2;
    for (let x = x1 + 10; x < x2 - 10; x += 40) {
      const y = WATER_Y + 6 + Math.sin((game.t + x) / 14) * 2;
      ctx.beginPath(); ctx.moveTo(x, y); ctx.quadraticCurveTo(x + 10, y - 3, x + 20, y); ctx.stroke();
    }
    ctx.strokeStyle = '#4f7a3a'; ctx.lineWidth = 2;
    for (let x = x1 + 18; x < x2; x += 55) { ctx.beginPath(); ctx.moveTo(x, WATER_Y + 4); ctx.lineTo(x - 3, WATER_Y - 22); ctx.stroke(); }
  }
  stadiumGround(ctx, swampLook);
}
function swampInit() { return { t: 0, gators: { '-1': { state: 'idle', t: 0, cool: 120, x: 0 }, '1': { state: 'idle', t: 0, cool: 120, x: 0 } } }; }
function swampUpdate(hz, fighters, hit) {
  hz.t++;
  const S = STAGE.main;
  for (const side of [-1, 1]) {
    const g = hz.gators[side];
    if (g.cool > 0) g.cool--;
    if (g.state === 'idle') {
      if (g.cool > 0) continue;
      // someone low off this edge: a gator starts to surface under them
      const f = fighters.find(f => !f.dead && f.y > S.y + 10 && (side < 0 ? f.x < S.x1 - 5 && f.x > S.x1 - 260 : f.x > S.x2 + 5 && f.x < S.x2 + 260));
      if (f) { g.state = 'warn'; g.t = 36; g.x = side < 0 ? clampN(f.x, 40, S.x1 - 30) : clampN(f.x, S.x2 + 30, STAGE.w - 40); }
    } else if (g.state === 'warn') {
      if (--g.t <= 0) { g.state = 'snap'; g.t = 22; g.hit = new Set(); }
    } else if (g.state === 'snap') {
      const box = { x: g.x - 55, y: WATER_Y - 90, w: 110, h: 140 };
      for (const f of fighters) {
        if (g.hit.has(f) || f.dead || f.invuln || !overlap(box, f.box())) continue;
        g.hit.add(f);
        hit({ x: g.x, facing: side }, f, { dmg: 9, base: 9, scale: 0.05, angle: 78 });
      }
      if (--g.t <= 0) { g.state = 'idle'; g.cool = 240; }
    }
  }
}
function swampFront(ctx, hz) {
  for (const side of [-1, 1]) {
    const g = hz.gators[side];
    if (g.state === 'warn') {
      ctx.fillStyle = 'rgba(220,240,220,0.7)';
      for (let k = 0; k < 4; k++) { ctx.beginPath(); ctx.arc(g.x + (k - 1.5) * 14, WATER_Y + 4 - ((game.t * 2 + k * 9) % 18), 3, 0, Math.PI * 2); ctx.fill(); }
      blob(ctx, '#4a9a3a', () => oval(ctx, g.x, WATER_Y + 2, 30, 8), 2);
      eye(ctx, g.x - 12, WATER_Y - 4, 5, 0.4); eye(ctx, g.x + 8, WATER_Y - 4, 5, 0.4);
    } else if (g.state === 'snap') {
      const k = 1 - g.t / 22, rise = Math.sin(Math.min(1, k * 1.6) * Math.PI) * 90, open = Math.max(0, Math.sin(k * Math.PI * 1.5)) * 0.7;
      ctx.save();
      ctx.translate(g.x, WATER_Y - rise + 30);
      ctx.rotate(-Math.PI / 2);
      ctx.save(); ctx.rotate(open); headGatorJaw(ctx, 26, false); ctx.restore();
      ctx.save(); ctx.rotate(-open); headGatorJaw(ctx, 26, true); ctx.restore();
      ctx.restore();
      ctx.fillStyle = 'rgba(220,240,220,0.6)';
      for (let k2 = 0; k2 < 6; k2++) { ctx.beginPath(); ctx.arc(g.x + (k2 - 2.5) * 16, WATER_Y - 4 - Math.abs(Math.sin(k2 + game.t / 3)) * 10, 4, 0, Math.PI * 2); ctx.fill(); }
    }
  }
}
// one half of a gator's jaw pointing along +x, for the snap
function headGatorJaw(ctx, r, top) {
  const s = top ? -1 : 1;
  blob(ctx, top ? '#4a9a3a' : '#e8d58a', () => { ctx.moveTo(0, 0); ctx.lineTo(r * 3, s * r * 0.15); ctx.quadraticCurveTo(r * 3.3, s * r * 0.5, r * 2.8, s * r * 0.7); ctx.lineTo(0, s * r * 0.9); ctx.closePath(); });
  ctx.fillStyle = '#ffffff';
  for (let k = 0; k < 5; k++) { const x = r * (0.5 + k * 0.5); ctx.beginPath(); ctx.moveTo(x, s * r * 0.12); ctx.lineTo(x + r * 0.12, -s * r * 0.15); ctx.lineTo(x + r * 0.24, s * r * 0.14); ctx.fill(); }
  if (top) eye(ctx, r * 0.6, -r * 0.6, r * 0.2, 0.4);
}

// ---- Sanford Stadium (Georgia) ----

const UGA = { red: '#ba0c2f', black: '#1a1a1a' };
const HEDGE = { x1: 40, x2: STAGE.w - 40, top: 360 };
const sanfordLook = {
  sky: ['#1d2a4a', '#5a4a6a', '#e09a6a', '#3a2418'], stands: '#1a1414', rows: [UGA.red, UGA.black],
  crowd: [UGA.red, UGA.red, UGA.black, '#f2f2f2'], board: { title: 'DAWGS', name: 'SANFORD STADIUM', city: 'ATHENS, GA', color: UGA.red },
  lights: '#fff1d8', ez: UGA.red, label: 'UGA', platTop: '#f2f2f2', platSide: UGA.red,
};
function sanfordBack(ctx, hz) { stadiumBack(ctx, sanfordLook, hz); }
function sanfordGround(ctx, hz) {
  stadiumGround(ctx, sanfordLook);
  if (!game.hazards) return;
  // the hedges: tall privet walls at both sides of the world
  for (const [x1, x2] of [[0, HEDGE.x1], [HEDGE.x2, STAGE.w]]) {
    blob(ctx, '#2f6b2a', () => roundRect(ctx, x1 - 10, HEDGE.top, x2 - x1 + 20, 720 - HEDGE.top + 20, 14), 3);
    ctx.fillStyle = '#3f8a37';
    for (let y = HEDGE.top + 10; y < 720; y += 22) for (let x = x1 + 4; x < x2; x += 16) { ctx.beginPath(); ctx.arc(x + ((y / 22) % 2) * 8, y, 7, 0, Math.PI * 2); ctx.fill(); }
  }
}
function sanfordUpdate(hz, fighters) {
  hz.t++;
  for (const f of fighters) {
    if (f.dead || f.y < HEDGE.top) continue;
    const hw = f.w / 2;
    for (const [side, wall] of [[-1, HEDGE.x1 + hw], [1, HEDGE.x2 - hw]]) {
      if (side < 0 ? f.x >= wall : f.x <= wall) continue;
      f.x = wall;
      if (f.vx * side > 4) {
        // bounced off the hedge: leaves fly
        f.vx = -f.vx * 0.45;
        burst(f.x + side * hw, f.y - f.h / 2, '#3f8a37', 14, 5);
        game.shake = Math.max(game.shake, 6);
      } else if (f.vx * side > 0) f.vx = 0;
    }
  }
}

// ---- Darrell K Royal Stadium (Texas) ----

const UT = { orange: '#bf5700' };
const dkrLook = {
  sky: ['#20223a', '#7a3a2a', '#e8803a', '#3a2010'], stands: '#1e1612', rows: [UT.orange, '#f2f2f2'],
  crowd: [UT.orange, UT.orange, '#f2f2f2', UT.orange], board: { title: 'LONGHORNS', name: 'DARRELL K ROYAL STADIUM', city: 'AUSTIN, TX', color: UT.orange },
  lights: '#fff1d0', ez: UT.orange, label: 'TEXAS', platTop: '#f2f2f2', platSide: UT.orange,
  extra(ctx) {
    // the UT Tower, lit orange
    ctx.fillStyle = '#2a2018';
    ctx.fillRect(1040, 150, 56, 160); ctx.fillRect(1030, 300, 76, 10);
    ctx.fillStyle = UT.orange;
    ctx.fillRect(1046, 120, 44, 40);
    ctx.beginPath(); ctx.moveTo(1046, 120); ctx.lineTo(1068, 96); ctx.lineTo(1090, 120); ctx.fill();
    ctx.fillStyle = '#ffd9a0';
    for (let y = 175; y < 290; y += 20) ctx.fillRect(1062, y, 12, 8);
  },
};
function dkrBack(ctx, hz) { stadiumBack(ctx, dkrLook, hz); }
function dkrUpdate(hz, fighters, hit) {
  hz.t++;
  // Bevo gets loose every 20 s: 70 ticks of warning, then a charge across the field
  if (hz.t % 1200 === 500 && !hz.bevo) {
    const dir = Math.random() < 0.5 ? 1 : -1;
    hz.bevo = { dir, x: dir > 0 ? -140 : STAGE.w + 140, warn: 70, hit: new Set() };
  }
  const b = hz.bevo;
  if (!b) return;
  if (b.warn > 0) { b.warn--; return; }
  b.x += b.dir * 12;
  const box = { x: b.x - 60, y: STAGE.main.y - 75, w: 120, h: 75 };
  for (const f of fighters) {
    if (b.hit.has(f) || f.dead || f.invuln || !overlap(box, f.box())) continue;
    b.hit.add(f);
    hit({ x: b.x, facing: b.dir }, f, { dmg: 11, base: 10, scale: 0.07, angle: 42 });
  }
  if (b.x < -220 || b.x > STAGE.w + 220) hz.bevo = null;
  else if (hz.t % 3 === 0 && b.x > STAGE.main.x1 && b.x < STAGE.main.x2) fxDust(b.x - b.dir * 30, STAGE.main.y, 3, -b.dir, 1.6);
}
function dkrFront(ctx, hz) {
  const b = hz.bevo;
  if (!b || b.warn > 0) return;
  ctx.save();
  ctx.translate(b.x, STAGE.main.y);
  ctx.scale(b.dir * 1.3, 1.3);
  drawMascot(ctx, rosterArt('texas'), game.t, 'charge');
  ctx.restore();
}
function dkrOverlay(ctx, hz) {
  const b = hz.bevo;
  if (b && b.warn > 0) {
    hazardText(ctx, 'BEVO IS LOOSE!', '#ffd9a0', b.warn, 70);
    const x = b.dir > 0 ? 60 : 1220;
    ctx.globalAlpha = (game.t % 10 < 5) ? 1 : 0.4;
    ctx.fillStyle = UT.orange; ctx.font = '900 64px system-ui, sans-serif'; ctx.textAlign = 'center';
    ctx.fillText(b.dir > 0 ? '!>' : '<!', x, 470);
    ctx.globalAlpha = 1;
  }
}

// ---- Kyle Field (Texas A&M) ----

const TAMU = { maroon: '#500000' };
const kyleLook = {
  sky: ['#14203a', '#2c4a7a', '#7a9ac8', '#1e1a18'], stands: '#1a1010', rows: [TAMU.maroon, '#f2f2f2'],
  crowd: [TAMU.maroon, TAMU.maroon, '#f2f2f2', '#d8c8b8'], board: { title: 'AGGIES', name: 'KYLE FIELD', city: 'COLLEGE STATION, TX', color: '#f2f2f2' },
  lights: '#fff6d8', ez: TAMU.maroon, label: 'A&M', platTop: '#f2f2f2', platSide: TAMU.maroon,
};
function kyleSway(hz) { return hz && hz.sway > 0 ? Math.sin((300 - hz.sway) / 18) : 0; }
function kyleBack(ctx, hz) { stadiumBack(ctx, Object.assign({}, kyleLook, { sway: kyleSway(hz) * 14 }), hz); }
function kyleUpdate(hz, fighters) {
  hz.t++;
  if (hz.t % 1500 === 600) hz.sway = 300;
  if (hz.sway > 0) {
    hz.sway--;
    // the whole field rocks with the crowd, carrying anyone standing on it
    const push = kyleSway(hz) * 1.5;
    for (const f of fighters) if (!f.dead && f.onGround) f.x += push;
  }
}
function kyleOverlay(ctx, hz) {
  if (hz.sway > 0) hazardText(ctx, '12TH MAN SWAY', '#f2f2f2', hz.sway, 300, 110, 46);
}

// ---- Bryant-Denny Stadium (Alabama) ----

const BAMA = { crimson: '#9e1b32' };
const bdLook = {
  sky: ['#101a30', '#3a2a40', '#a05a4a', '#22140e'], stands: '#1a1012', rows: [BAMA.crimson, '#f2f2f2'],
  crowd: [BAMA.crimson, BAMA.crimson, '#f2f2f2', '#c9c9c9'], board: { title: 'CRIMSON TIDE', name: 'BRYANT-DENNY STADIUM', city: 'TUSCALOOSA, AL', color: '#f2f2f2' },
  lights: '#fff6e0', ez: BAMA.crimson, label: 'BAMA', platTop: '#f2f2f2', platSide: BAMA.crimson,
};
function bdBack(ctx, hz) { stadiumBack(ctx, bdLook, hz); }
function bdGround(ctx) {
  stadiumGround(ctx, bdLook);
  // houndstooth on the platforms, after Coach Bryant's hat
  ctx.fillStyle = '#1a1a1a';
  for (const p of STAGE.plats) {
    for (let x = p.x1 + 2; x < p.x2 - 4; x += 8) {
      ctx.fillRect(x, p.y + 1, 4, 3);
      ctx.fillRect(x + 4, p.y + 4, 4, 3);
      ctx.beginPath(); ctx.moveTo(x + 4, p.y + 4); ctx.lineTo(x + 6, p.y + 1); ctx.lineTo(x + 8, p.y + 4); ctx.fill();
    }
  }
}
function bdUpdate(hz, fighters, hit) {
  hz.t++;
  if (hz.yell > 0) hz.yell--;
  // every 25 s: 2 s of "Rammer Jammer...", then "Yellowhammer!" stuns everyone standing on the field
  if (hz.t % 1500 === 800) hz.chant = 120;
  if (hz.chant > 0 && --hz.chant === 0) {
    hz.yell = 60;
    game.shake = Math.max(game.shake, 10);
    game.cheer = 1;
    for (const f of fighters) {
      if (f.dead || f.invuln || !f.onGround || f.onPlat) continue;
      hit({ x: f.x - f.facing, facing: f.facing }, f, { dmg: 3, stun: 50 });
    }
  }
}
function bdOverlay(ctx, hz) {
  if (hz.chant > 0) {
    hazardText(ctx, 'RAMMER JAMMER...', '#f2f2f2', hz.chant, 120, 110, 40);
    ctx.font = 'bold 16px system-ui, sans-serif'; ctx.fillStyle = '#ffd9d9'; ctx.textAlign = 'center';
    ctx.fillText('get off the field!', 640, 140);
  }
  if (hz.yell > 0) hazardText(ctx, 'YELLOWHAMMER!', BAMA.crimson, hz.yell, 60, 120, 60);
}

// ---- register ----

STAGES.push(
  { id: 'lsu', name: 'Tiger Stadium', school: 'LSU', home: 'lsu', hazard: 'Night game: the lights go out now and then',
    back: lsuBack, ground: ctx => stadiumGround(ctx, lsuLook), init: () => ({ t: 0, banner: 0 }), update: lsuUpdate, drawOverlay: lsuOverlay },
  { id: 'swamp', name: 'The Swamp', school: 'Florida', home: 'florida', hazard: 'Gators in the water snap at anyone recovering low',
    back: swampBack, ground: swampGround, init: swampInit, update: swampUpdate, drawFront: swampFront },
  { id: 'sanford', name: 'Sanford Stadium', school: 'Georgia', home: 'georgia', hazard: 'The hedges stop anyone launched sideways below them',
    back: sanfordBack, ground: sanfordGround, init: () => ({ t: 0 }), update: sanfordUpdate },
  { id: 'dkr', name: 'Darrell K Royal Stadium', school: 'Texas', home: 'texas', hazard: 'Bevo gets loose and charges across the field',
    back: dkrBack, ground: ctx => stadiumGround(ctx, dkrLook), init: () => ({ t: 0, bevo: null }), update: dkrUpdate, drawFront: dkrFront, drawOverlay: dkrOverlay },
  { id: 'kyle', name: 'Kyle Field', school: 'Texas A&M', home: 'texasam', hazard: 'The 12th Man sways and the field rocks side to side',
    back: kyleBack, ground: ctx => stadiumGround(ctx, kyleLook), init: () => ({ t: 0, sway: 0 }), update: kyleUpdate, drawOverlay: kyleOverlay },
  { id: 'bryantdenny', name: 'Bryant-Denny Stadium', school: 'Alabama', home: 'alabama', hazard: 'Rammer Jammer: everyone on the field is stunned',
    back: bdBack, ground: bdGround, init: () => ({ t: 0, chant: 0, yell: 0 }), update: bdUpdate, drawOverlay: bdOverlay },
);
for (const st of STAGES) if (!st.draw) st.draw = (c, hz) => { st.back(c, hz); st.ground(c, hz); };

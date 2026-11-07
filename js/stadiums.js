'use strict';
// Home stadiums for the first wave. Same layout as every stage (fair fights), each with its own look and one
// hazard from a real tradition. Hazards only run when game.hazards is on (H on the stage select).
//   Tiger Stadium (LSU): night game, the lights go out now and then
//   The Swamp (Florida): gators in the water off both edges snap at anyone recovering low
//   Sanford Stadium (Georgia): hedges at both sides stop fighters launched sideways below their top
//   Darrell K Royal (Texas): Bevo gets loose and charges across the field
//   Kyle Field (Texas A&M): the 12th Man sways and the floor rocks fighters side to side
//   Bryant-Denny (Alabama): the Rammer Jammer chant stuns anyone standing on the field (platforms are safe)
//   Jones AT&T (Texas Tech): a volley of tortillas rains down from the stands
//   Folsom Field (Colorado): Ralphie runs the field edge to edge at the start and after each KO (jump it)
//   Milan Puskar (West Virginia): Country Roads plays and the floating platforms drift side to side
//   Neyland (Tennessee): the Vol Navy, two boats off the edges that a falling fighter can land on

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

// ---- Jones AT&T Stadium (Texas Tech) ----

const TTU = { red: '#cc0000', black: '#1a1a1a' };
const jonesLook = {
  sky: ['#1a1830', '#6a2a3a', '#e8803a', '#2a1810'], stands: '#1a0c0c', rows: [TTU.red, TTU.black],
  crowd: [TTU.red, TTU.black, TTU.red, '#f2f2f2'], board: { title: 'RED RAIDERS', name: 'JONES AT&T STADIUM', city: 'LUBBOCK, TX', color: TTU.red },
  lights: '#fff1d0', ez: TTU.red, ez2: TTU.black, label: 'TECH', platTop: '#f2f2f2', platSide: TTU.red,
  extra(ctx) {
    // flat West Texas horizon, a water tower and a few stars
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    for (let k = 0; k < 30; k++) ctx.fillRect((k * 211) % 1280, (k * 47) % 140, 2, 2);
    ctx.fillStyle = '#2a1a14';
    ctx.fillRect(0, 285, STAGE.w, 30);
    ctx.fillRect(1120, 215, 6, 70); ctx.fillRect(1160, 215, 6, 70);
    roundRect(ctx, 1108, 180, 70, 40, 10); ctx.fill();
  },
};
function jonesBack(ctx, hz) { stadiumBack(ctx, jonesLook, hz); }
function jonesInit() { return { t: 0, warn: 0, volley: 0, tort: [] }; }
function jonesUpdate(hz, fighters, hit) {
  hz.t++;
  // every 22 s: 1 s of warning, then 2.5 s of tortillas thrown from the stands
  if (hz.t % 1320 === 600) hz.warn = 60;
  if (hz.warn > 0 && --hz.warn === 0) hz.volley = 150;
  if (hz.volley > 0) {
    hz.volley--;
    if (hz.volley % 4 === 0) hz.tort.push({ x: 160 + Math.random() * 960, y: 305, vx: (Math.random() - 0.5) * 2, vy: 2 + Math.random() * 1.5, rot: Math.random() * 6, spin: (Math.random() < 0.5 ? -1 : 1) * (0.2 + Math.random() * 0.2), hit: false });
  }
  const S = STAGE.main;
  for (const q of hz.tort) {
    q.x += q.vx; q.y += q.vy; q.vy += 0.04; q.rot += q.spin;
    if (q.hit) continue;
    const box = { x: q.x - 15, y: q.y - 15, w: 30, h: 30 };
    for (const f of fighters) {
      if (f.dead || f.invuln || !overlap(box, f.box())) continue;
      q.hit = true;
      hit({ x: q.x, facing: q.vx < 0 ? -1 : 1 }, f, { dmg: 2 + (Math.random() < 0.5 ? 1 : 0), base: 3, scale: 0.01, angle: 60 });
      burst(q.x, q.y, '#e8d4a0', 6, 3);
      break;
    }
  }
  hz.tort = hz.tort.filter(q => !q.hit && q.y < (q.x > S.x1 && q.x < S.x2 ? S.y + 4 : 720));
}
function jonesFront(ctx, hz) {
  for (const q of hz.tort) {
    ctx.save();
    ctx.translate(q.x, q.y);
    ctx.rotate(q.rot);
    ctx.scale(1, 0.35 + Math.abs(Math.cos(q.rot * 0.7)) * 0.65);
    ctx.fillStyle = '#d9bd86'; ctx.strokeStyle = '#a8864a'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(0, 0, 14, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#b88f52';
    ctx.beginPath(); ctx.arc(-4, -3, 2, 0, Math.PI * 2); ctx.arc(5, 4, 2, 0, Math.PI * 2); ctx.arc(3, -6, 1.5, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }
}
function jonesOverlay(ctx, hz) {
  if (hz.warn > 0) hazardText(ctx, 'TORTILLA TOSS!', '#f2f2f2', hz.warn, 60);
}

// ---- Folsom Field (Colorado) ----

const CU = { black: '#1a1a1a', gold: '#cfb87c' };
const folsomLook = {
  sky: ['#2f6fc0', '#7fb2e6', '#d6e4f2', '#2a3a2a'], stands: '#16140e', rows: [CU.gold, CU.black],
  crowd: [CU.gold, CU.black, CU.gold, '#f2f2f2'], board: { title: 'BUFFALOES', name: 'FOLSOM FIELD', city: 'BOULDER, CO', color: CU.gold },
  lights: '#fffbe8', ez: CU.black, ez2: CU.gold, label: 'CU', platTop: CU.gold, platSide: CU.black,
  extra(ctx) {
    // the Flatirons: tilted slabs of rock over the pines
    const slab = (x, w, h, lean, c) => {
      ctx.fillStyle = c;
      ctx.beginPath(); ctx.moveTo(x, 310); ctx.lineTo(x + lean, 310 - h); ctx.lineTo(x + lean + w * 0.35, 310 - h - 8); ctx.lineTo(x + w, 310); ctx.fill();
    };
    ctx.fillStyle = '#4a6a8a';
    ctx.beginPath(); ctx.moveTo(0, 310); ctx.lineTo(180, 190); ctx.lineTo(400, 260); ctx.lineTo(640, 170); ctx.lineTo(900, 250); ctx.lineTo(1100, 180); ctx.lineTo(1280, 280); ctx.lineTo(1280, 310); ctx.fill();
    slab(150, 120, 110, 40, '#b0825a'); slab(260, 130, 150, 55, '#c0946a'); slab(390, 110, 100, 35, '#a8764e');
    slab(840, 110, 90, 30, '#a8764e'); slab(940, 140, 130, 48, '#c0946a');
    ctx.fillStyle = '#243a28';
    for (let x = 0; x < STAGE.w; x += 22) { const h = 20 + (x * 7 % 17); ctx.beginPath(); ctx.moveTo(x, 312); ctx.lineTo(x + 11, 312 - h); ctx.lineTo(x + 22, 312); ctx.fill(); }
  },
};
function folsomBack(ctx, hz) { stadiumBack(ctx, folsomLook, hz); }
function folsomInit() { return { t: 0, wait: 30, warn: 0, dir: -1, run: null }; }
function folsomUpdate(hz, fighters, hit) {
  hz.t++;
  // a run at the start of the match and after each KO: a warning, then Ralphie crosses the main field once
  if (hz.wait > 0 && --hz.wait === 0) { hz.warn = 100; hz.dir = -hz.dir; }
  if (hz.warn > 0 && --hz.warn === 0) hz.run = { x: hz.dir > 0 ? -200 : STAGE.w + 200, hit: new Set() };
  const r = hz.run;
  if (!r) return;
  const S = STAGE.main;
  r.x += hz.dir * 8;
  // only the ground: anyone more than about 60 px up (jumping, or on a platform) is clear
  const box = { x: r.x - 70, y: S.y - 60, w: 140, h: 60 };
  for (const f of fighters) {
    if (r.hit.has(f) || f.dead || f.invuln || f.x < S.x1 - 20 || f.x > S.x2 + 20 || !overlap(box, f.box())) continue;
    r.hit.add(f);
    hit({ x: r.x, facing: hz.dir }, f, { dmg: 7, base: 11, scale: 0.06, angle: 50 });
  }
  if (r.x < -240 || r.x > STAGE.w + 240) hz.run = null;
  else if (hz.t % 4 === 0 && r.x > S.x1 && r.x < S.x2) fxDust(r.x - hz.dir * 40, S.y, 2, -hz.dir, 1.2);
}
function folsomOnKO(hz) {
  if (!hz.run && hz.warn === 0 && hz.wait === 0) hz.wait = 110;
}
function folsomFront(ctx, hz) {
  const r = hz.run;
  if (!r) return;
  const d = hz.dir, y = STAGE.main.y;
  ctx.save();
  ctx.translate(r.x, y);
  ctx.scale(d * 1.25, 1.25);
  drawMascot(ctx, rosterArt('colorado'), game.t, 'charge');
  ctx.restore();
  // two handlers running behind on a lead each
  for (const [k, c] of [[110, CU.gold], [170, '#f2f2f2']]) {
    const x = r.x - d * k, st = Math.sin(game.t * 0.8 + k) * 8;
    ctx.strokeStyle = '#2a2a2a'; ctx.lineWidth = 4; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(x, y - 24); ctx.lineTo(x + st, y); ctx.moveTo(x, y - 24); ctx.lineTo(x - st, y); ctx.stroke();
    ctx.fillStyle = c; roundRect(ctx, x - 7, y - 52, 14, 30, 5); ctx.fill();
    ctx.fillStyle = '#e0b48a'; ctx.beginPath(); ctx.arc(x, y - 60, 7, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = CU.gold; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(x + d * 6, y - 40); ctx.lineTo(x + d * 54, y - 36); ctx.stroke();
    ctx.lineCap = 'butt';
  }
}
function folsomOverlay(ctx, hz) {
  if (hz.warn > 0) {
    hazardText(ctx, 'RALPHIE RUN!', CU.gold, hz.warn, 100);
    ctx.font = 'bold 16px system-ui, sans-serif'; ctx.fillStyle = '#f2f2f2'; ctx.textAlign = 'center';
    ctx.fillText('jump it or get on a platform', 640, 146);
    ctx.globalAlpha = (game.t % 10 < 5) ? 1 : 0.4;
    ctx.fillStyle = CU.gold; ctx.font = '900 64px system-ui, sans-serif';
    ctx.fillText(hz.dir > 0 ? '!>' : '<!', hz.dir > 0 ? 60 : 1220, 470);
    ctx.globalAlpha = 1;
  }
}

// ---- Milan Puskar Stadium (West Virginia) ----

const WVU = { navy: '#002855', gold: '#eaaa00' };
const WV_SONG = 480;
// how far platform i is shifted at this point of the song: eased in and out, so they start and end at home
function wvDrift(hz, i) {
  if (!hz || hz.song <= 0) return 0;
  const p = WV_SONG - hz.song, env = Math.min(1, p / 60, hz.song / 60);
  return 60 * env * Math.sin(p / 50 + i * 2.1);
}
const wvLook = {
  sky: ['#1a3a6a', '#4a7ab0', '#c8d8c0', '#1e2e1e'], stands: '#0a1630', rows: [WVU.gold, WVU.navy],
  crowd: [WVU.navy, WVU.gold, WVU.navy, '#f2f2f2'], board: { title: 'MOUNTAINEERS', name: 'MILAN PUSKAR STADIUM', city: 'MORGANTOWN, WV', color: WVU.gold },
  lights: '#fffbe8', ez: WVU.navy, ez2: WVU.gold, label: 'WVU', platTop: WVU.gold, platSide: WVU.navy,
  extra(ctx) {
    // wooded hills in two layers
    for (const [base, amp, col, tree] of [[250, 60, '#2e4a3a', '#1e3a2a'], [300, 40, '#1e3a28', '#142a1c']]) {
      const hill = x => base - Math.sin(x / 170 + base) * amp * 0.6 - Math.sin(x / 61) * amp * 0.2;
      ctx.fillStyle = col;
      ctx.beginPath(); ctx.moveTo(0, 320);
      for (let x = 0; x <= STAGE.w; x += 20) ctx.lineTo(x, hill(x));
      ctx.lineTo(STAGE.w, 320); ctx.fill();
      ctx.fillStyle = tree;
      for (let x = 10; x < STAGE.w; x += 26) {
        const y = hill(x);
        ctx.beginPath(); ctx.moveTo(x - 9, y + 12); ctx.lineTo(x, y - 14); ctx.lineTo(x + 9, y + 12); ctx.fill();
      }
    }
  },
};
function wvBack(ctx, hz) { stadiumBack(ctx, Object.assign({}, wvLook, { sway: hz && hz.song > 0 ? Math.sin(game.t / 14) * 12 : 0 }), hz); }
function wvInit() { return { t: 0, song: 0 }; }
function wvUpdate(hz, fighters) {
  hz.t++;
  if (hz.t % 1800 === 900) hz.song = WV_SONG;
  if (hz.song <= 0) return;
  hz.song--;
  STAGE.plats.forEach((p, i) => {
    const w = p.x2 - p.x1, nx1 = PLATS_BASE[i].x1 + wvDrift(hz, i), dx = nx1 - p.x1;
    // fighters standing on this platform ride along with it
    for (const f of fighters) if (!f.dead && f.onGround && f.onPlat && Math.abs(f.y - p.y) < 1.5 && f.x > p.x1 && f.x < p.x2) f.x += dx;
    p.x1 = nx1; p.x2 = nx1 + w;
  });
}
function wvOverlay(ctx, hz) {
  if (hz.song > 0) {
    hazardText(ctx, 'COUNTRY ROADS', WVU.gold, hz.song, WV_SONG, 110, 46);
    ctx.font = 'bold 16px system-ui, sans-serif'; ctx.fillStyle = '#f2f2f2'; ctx.textAlign = 'center';
    ctx.fillText('take me home... the platforms are on the move', 640, 140);
  }
}

// ---- Neyland Stadium (Tennessee) ----

const UTK = { orange: '#ff8200', white: '#ffffff' };
const NAVY_Y = 640, NAVY_W = 55;
const neylandLook = {
  sky: ['#3a7ac8', '#9ac8f0', '#f0e8d8', '#1a3a5a'], stands: '#1c1410', rows: [UTK.orange, UTK.white],
  crowd: [UTK.orange, UTK.white, UTK.orange, UTK.orange], board: { title: 'VOLUNTEERS', name: 'NEYLAND STADIUM', city: 'KNOXVILLE, TN', color: UTK.orange },
  lights: '#fffbe8', ez: UTK.orange, ez2: UTK.white, label: 'VOLS', platTop: UTK.white, platSide: UTK.orange,
};
function neylandInit() {
  return { t: 0, banner: 90, boats: [-1, 1].map(side => ({ side, base: side < 0 ? 120 : 1160, x: side < 0 ? 120 : 1160, y: NAVY_Y, d: 0, state: 'up', st: 0, stand: 0, ph: side * 1.3 })) };
}
function boatOn(b, f) { return !f.dead && f.onGround && f.onPlat && Math.abs(f.y - b.y) < 1.5 && f.x > b.x - NAVY_W && f.x < b.x + NAVY_W; }
function neylandUpdate(hz, fighters) {
  hz.t++;
  if (hz.banner > 0) hz.banner--;
  STAGE.extra.length = 0;
  for (const b of hz.boats) {
    const riders = fighters.filter(f => boatOn(b, f));
    // a boat that carries someone for 2 s sinks, stays under for 4 s, then bobs back up
    if (b.state === 'up') { b.stand = riders.length ? b.stand + 1 : Math.max(0, b.stand - 2); if (b.stand >= 120) { b.state = 'sink'; b.st = 30; } }
    else if (b.state === 'sink') { b.d += 2; if (--b.st <= 0) { b.state = 'gone'; b.st = 240; b.stand = 0; } }
    else if (b.state === 'gone') { b.d = Math.min(100, b.d + 2); if (--b.st <= 0) b.state = 'rise'; }
    else if (b.state === 'rise') { b.d -= 2; if (b.d <= 0) { b.d = 0; b.state = 'up'; } }
    const nx = b.base + 40 * Math.sin(hz.t / 90 + b.ph), ny = NAVY_Y + b.d + 7 * Math.sin(hz.t / 38 + b.ph);
    for (const f of riders) { f.x += nx - b.x; f.y += ny - b.y; }
    b.x = nx; b.y = ny;
    if (b.state === 'up' || b.state === 'sink') STAGE.extra.push({ x1: b.x - NAVY_W, x2: b.x + NAVY_W, y: b.y, boat: true });
  }
}
function drawBoat(ctx, b, hot) {
  const x = b.x, y = b.y;
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(Math.sin(game.t / 38 + b.ph) * 0.03);
  ctx.translate(-x, -y);
  blob(ctx, hot ? '#ff4a1a' : UTK.orange, () => { ctx.moveTo(x - 62, y - 4); ctx.lineTo(x + 62, y - 4); ctx.lineTo(x + 46, y + 24); ctx.lineTo(x - 46, y + 24); ctx.closePath(); }, 2);
  ctx.fillStyle = UTK.white; ctx.fillRect(x - 54, y + 4, 108, 5);
  ctx.fillStyle = '#e8e8e8'; roundRect(ctx, x - 14, y - 24, 30, 20, 3); ctx.fill();
  ctx.fillStyle = '#5a7a9a'; ctx.fillRect(x - 9, y - 20, 8, 8); ctx.fillRect(x + 3, y - 20, 8, 8);
  ctx.strokeStyle = '#333'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(x + 40, y - 4); ctx.lineTo(x + 40, y - 34); ctx.stroke();
  ctx.fillStyle = UTK.orange; ctx.fillRect(x + 40, y - 34, 18, 11);
  ctx.restore();
}
function neylandGround(ctx, hz) {
  const S = STAGE.main, g = ctx.createLinearGradient(0, 600, 0, 720);
  // the Tennessee River under the whole stadium
  g.addColorStop(0, '#3a7ab0'); g.addColorStop(1, '#14304a');
  ctx.fillStyle = g;
  ctx.fillRect(0, 600, STAGE.w, 120);
  ctx.strokeStyle = 'rgba(220,240,255,0.4)'; ctx.lineWidth = 2;
  for (let x = 10; x < STAGE.w; x += 44) {
    const y = 614 + Math.sin((game.t + x) / 16) * 2;
    ctx.beginPath(); ctx.moveTo(x, y); ctx.quadraticCurveTo(x + 11, y - 3, x + 22, y); ctx.stroke();
  }
  stadiumGround(ctx, neylandLook);
  // checkerboard end zones
  for (const x0 of [S.x1, S.x2 - 70]) for (let k = 0; k < 9; k++) for (let j = 0; j < 2; j++) {
    ctx.fillStyle = (k + j) % 2 ? UTK.white : UTK.orange;
    ctx.fillRect(x0 + k * 70 / 9, S.y + j * 8, 70 / 9 + 0.5, 8);
  }
  // the Vol Navy
  const live = hz && game.hazards;
  const boats = live ? hz.boats : (hz ? [] : [{ x: 120, y: NAVY_Y, ph: -1.3, d: 0 }, { x: 1160, y: NAVY_Y, ph: 1.3, d: 0 }]);
  for (const b of boats) {
    if (live && b.d > 70) continue;
    drawBoat(ctx, b, live && b.state === 'up' && b.stand > 70 && game.t % 8 < 4);
  }
  // water lapping in front of the hulls
  ctx.fillStyle = 'rgba(58,122,176,0.55)';
  for (const side of [0, 1]) ctx.fillRect(side ? S.x2 : 0, 664, side ? STAGE.w - S.x2 : S.x1, 6);
}
function neylandOverlay(ctx, hz) {
  if (hz.banner > 0) {
    hazardText(ctx, 'THE VOL NAVY', UTK.orange, hz.banner, 90, 200, 46);
    ctx.font = 'bold 16px system-ui, sans-serif'; ctx.fillStyle = '#f2f2f2'; ctx.textAlign = 'center';
    ctx.fillText('boats off both edges: land on one to get back (they sink if you stay)', 640, 230);
  }
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
  { id: 'jones', name: 'Jones AT&T Stadium', school: 'Texas Tech', home: 'texastech', hazard: 'Tortillas rain down from the stands',
    back: jonesBack, ground: ctx => stadiumGround(ctx, jonesLook), init: jonesInit, update: jonesUpdate, drawFront: jonesFront, drawOverlay: jonesOverlay },
  { id: 'folsom', name: 'Folsom Field', school: 'Colorado', home: 'colorado', hazard: 'Ralphie runs the field at the start and after each KO (jump it)',
    back: folsomBack, ground: ctx => stadiumGround(ctx, folsomLook), init: folsomInit, update: folsomUpdate, onKO: folsomOnKO, drawFront: folsomFront, drawOverlay: folsomOverlay },
  { id: 'puskar', name: 'Milan Puskar Stadium', school: 'West Virginia', home: 'westvirginia', hazard: 'Country Roads: the floating platforms drift side to side',
    back: wvBack, ground: ctx => stadiumGround(ctx, wvLook), init: wvInit, update: wvUpdate, drawOverlay: wvOverlay },
  { id: 'neyland', name: 'Neyland Stadium', school: 'Tennessee', home: 'tennessee', hazard: 'The Vol Navy: boats off the edges to land on (they sink)',
    back: ctx => stadiumBack(ctx, neylandLook), ground: neylandGround, init: neylandInit, update: neylandUpdate, drawOverlay: neylandOverlay },
);
for (const st of STAGES) if (!st.draw) st.draw = (c, hz) => { st.back(c, hz); st.ground(c, hz); };

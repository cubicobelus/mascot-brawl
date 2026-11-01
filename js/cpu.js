'use strict';
// Simple computer opponent: gets back to the stage, walks in, attacks when close.

function cpuControls(me, foe) {
  const c = noControls(), mem = me.cpu, S = STAGE.main;
  if (me.dead || me.hitstun > 0 || me.move) return c;
  mem.cool = Math.max(0, (mem.cool || 0) - 1);
  const press = dir => { if (dir > 0) c.right = true; else if (dir < 0) c.left = true; };

  // recover
  if (me.x < S.x1 - 5 || me.x > S.x2 + 5 || me.y > S.y + 5) {
    const toward = me.x < (S.x1 + S.x2) / 2 ? 1 : -1;
    press(toward);
    if (me.vy > 0 && me.jumps > 0 && me.y > S.y - 80) c.upP = true;
    else if (me.vy > 2 && me.jumps === 0 && !me.specialUsed && me.y > S.y - 40) c.specialP = true;
    return c;
  }

  // chase, but never walk off after a foe that is off the stage
  const tx = foe.dead ? (S.x1 + S.x2) / 2 : Math.max(S.x1 + 40, Math.min(S.x2 - 40, foe.x));
  const dx = foe.x - me.x, dy = foe.y - me.y, adx = Math.abs(dx);
  if (foe.dead || adx > 64) {
    if (Math.abs(tx - me.x) > 8) press(Math.sign(tx - me.x));
  } else if (mem.cool === 0 && Math.random() < 0.2) {
    if (Math.sign(dx) !== me.facing) press(Math.sign(dx));
    if (dy < -50) c.up = true;
    else if (dy > 40 && !me.onGround) c.down = true;
    c.attackP = true;
    mem.cool = 18 + Math.floor(Math.random() * 22);
  }
  if (!foe.dead && dy < -80 && adx < 160 && me.onGround && Math.random() < 0.06) c.upP = true;
  if (!foe.dead && dy > 60 && me.onPlat && adx < 200 && Math.random() < 0.05) c.downP = true;
  return c;
}

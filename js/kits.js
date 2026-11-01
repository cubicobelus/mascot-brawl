'use strict';
// Special moves. Each kit has four specials (neutralB, sideB, upB, downB) and a super (the Heisman move).
// Move fields: startup, active, recovery (frames); box { dx, dy, w, h } hits during the active frames
// (dx forward of the feet, dy from the feet, negative is up); dmg, base, scale, angle set the launch.
// Optional:
//   away: launch away from the user (hits both sides)   back: launch backward
//   stun: fixed hitstun with almost no knockback         pull: drag the foe toward the user at this speed
//   projectile: { at, dx, dy, vx, vy, w, h, life, look, pierce, gravity, ...hit fields } spawned on frame "at"
//   armor: [from, to] frames where hits do damage but no knockback
//   counter: [from, to] frames where a hit is answered with counterHit (hit fields)
//   gravity (multiplier), noDrift, keepMomentum, endOnLand, onFrame(f, me), banner (super name), rope (draw as a rope)
// onFrame can also push its own projectile events or start another move (Pete's reload).

const KITS = {
  georgia: {
    neutralB: { name: 'Bark', startup: 8, active: 1, recovery: 16,
      projectile: { at: 8, dx: 34, dy: -40, vx: 7, vy: 0, w: 40, h: 46, life: 18, look: 'wave', dmg: 3, stun: 26 } },
    sideB: { name: 'Between the Hedges', startup: 12, active: 1, recovery: 18,
      projectile: { at: 12, dx: 70, dy: -32, vx: 0, vy: 0, w: 50, h: 64, life: 24, look: 'hedge', dmg: 8, base: 7, scale: 0.09, angle: 80 } },
    upB: { name: 'Dawg Pile', startup: 6, active: 14, recovery: 14, noDrift: true,
      box: { dx: 6, dy: -72, w: 60, h: 40 }, dmg: 8, base: 6, scale: 0.08, angle: 80,
      onFrame(f, me) { if (f === 6) { me.vx = 3 * me.facing; me.vy = -14; } } },
    downB: { name: 'Uga Sit', startup: 36, active: 5, recovery: 12, noDrift: true, armor: [3, 40],
      box: { dx: 0, dy: -14, w: 80, h: 30 }, dmg: 6, base: 6, scale: 0.06, angle: 60, away: true,
      onFrame(f, me) { me.vx *= 0.6; if (!me.onGround && me.vy < 12) me.vy = 12; } },
    super: { name: 'Dawg Pound', banner: 'Dawg Pound', startup: 10, active: 1, recovery: 20,
      projectile: { at: 10, dx: -60, dy: -34, vx: 13, vy: 0, w: 150, h: 64, life: 120, look: 'herd', pierce: true,
        dmg: 22, base: 10, scale: 0.16, angle: 45 } },
  },
  lsu: {
    neutralB: { name: 'Death Valley Roar', startup: 14, active: 6, recovery: 18,
      box: { dx: 0, dy: -40, w: 170, h: 80 }, dmg: 4, base: 9, scale: 0.03, angle: 25, away: true },
    sideB: { name: 'Bayou Charge', startup: 10, active: 18, recovery: 16, noDrift: true, keepMomentum: true, gravity: 0.3,
      box: { dx: 32, dy: -40, w: 46, h: 46 }, dmg: 11, base: 7, scale: 0.11, angle: 38,
      onFrame(f, me) { if (f < 10) me.vx *= 0.8; else if (f < 28) { me.vx = 11 * me.facing; if (f === 10) me.vy = Math.min(me.vy, -2); } } },
    upB: { name: 'Night Game Leap', startup: 6, active: 16, recovery: 16, noDrift: true,
      box: { dx: 20, dy: -50, w: 50, h: 50 }, dmg: 10, base: 7, scale: 0.1, angle: 70,
      onFrame(f, me) { if (f === 6) { me.vx = 5 * me.facing; me.vy = -15; } } },
    downB: { name: 'Saturday Night Earthquake', startup: 16, active: 6, recovery: 20,
      box: { dx: 0, dy: -8, w: 230, h: 28 }, dmg: 9, base: 8, scale: 0.08, angle: 75, away: true,
      onFrame(f, me) { if (f === 16) me.events.push({ type: 'shake', amount: 10 }); } },
    super: { name: 'Death Valley at Night', banner: 'Death Valley at Night', startup: 24, active: 30, recovery: 18,
      noDrift: true, gravity: 0.3, box: { dx: 30, dy: -40, w: 70, h: 60 }, dmg: 25, base: 12, scale: 0.17, angle: 40,
      onFrame(f, me) {
        if (f === 0) me.events.push({ type: 'dark', t: 200 });
        if (f < 24) me.vx *= 0.8;
        if (f === 24) { me.vx = 16 * me.facing; me.vy = -4; }
      } },
  },
  texas: {
    neutralB: { name: "Hook 'Em Horns", startup: 10, active: 5, recovery: 18,
      box: { dx: 28, dy: -60, w: 54, h: 50 }, dmg: 12, base: 7, scale: 0.12, angle: 82 },
    sideB: { name: 'Longhorn Stampede', startup: 10, active: 24, recovery: 14, noDrift: true, keepMomentum: true, gravity: 0.2,
      box: { dx: 36, dy: -40, w: 46, h: 46 }, dmg: 12, base: 8, scale: 0.12, angle: 40,
      onFrame(f, me) { if (f < 10) me.vx *= 0.8; else if (f < 34) { me.vx = 12 * me.facing; if (f === 10) me.vy = Math.min(me.vy, -3); } } },
    upB: { name: 'Big Leap', startup: 8, active: 14, recovery: 16, noDrift: true,
      box: { dx: 8, dy: -84, w: 70, h: 36 }, dmg: 9, base: 7, scale: 0.09, angle: 85,
      onFrame(f, me) { if (f === 8) { me.vx = 4 * me.facing; me.vy = -15; } } },
    downB: { name: 'Bevo Buck', startup: 12, active: 4, recovery: 20, back: true,
      box: { dx: -38, dy: -26, w: 50, h: 34 }, dmg: 13, base: 8, scale: 0.13, angle: 35 },
    super: { name: 'Bevo Rampage', banner: 'Bevo Rampage', startup: 16, active: 50, recovery: 16, noDrift: true, keepMomentum: true,
      gravity: 0.2, armor: [0, 66], box: { dx: 36, dy: -40, w: 70, h: 64 }, dmg: 24, base: 11, scale: 0.16, angle: 42,
      onFrame(f, me) { if (f < 16) me.vx *= 0.7; else if (f < 66) { me.vx = 15 * me.facing; if (f === 16) me.vy = Math.min(me.vy, -2); } } },
  },
  okstate: {
    neutralB: { name: 'Six Shooter', startup: 5, active: 1, recovery: 8,
      onFrame(f, me) {
        if (f === 0 && me.ammo === 0) me.startMove('reload');
        else if (f === 5) me.ammo--;
      },
      projectile: { at: 5, dx: 30, dy: -38, vx: 17, vy: 0, w: 14, h: 8, life: 45, look: 'bullet', dmg: 3, base: 3, scale: 0.035, angle: 12 } },
    reload: { name: 'Reload', startup: 40, active: 0, recovery: 0,
      onFrame(f, me) { if (f === 39) me.ammo = me.m.ammo; } },
    sideB: { name: 'Lasso', startup: 10, active: 8, recovery: 20, rope: true, noDrift: true,
      box: { dx: 95, dy: -40, w: 140, h: 22 }, dmg: 4, pull: 10,
      onFrame(f, me) {
        if (f < 10) { me.vx *= 0.85; if (me.vy > 2) me.vy = 2; }
        // off the stage, the rope catches the field's edge and reels Pete in
        const S = STAGE.main, off = me.x < S.x1 || me.x > S.x2;
        if (f >= 10 && f < 18 && off && !me.onGround && !me.move.reeled) {
          const tip = me.x + me.facing * 165;
          for (const lx of [S.x1, S.x2]) {
            const caught = me.facing > 0 ? lx > me.x && lx < tip : lx < me.x && lx > tip;
            if (caught && Math.abs(S.y - (me.y - 40)) < 70) { me.vx = me.facing * 11; me.vy = -9; me.move.reeled = true; }
          }
        }
      } },
    upB: { name: 'Pistol Recoil', startup: 6, active: 1, recovery: 22,
      onFrame(f, me) {
        if (f !== 6) return;
        me.vy = -15.5;
        me.vx = 2 * me.facing;
        for (const s of [-1, 1]) me.events.push({ type: 'projectile', p: { dx: s * 10, dy: 0, vx: s * 1.5, vy: 13, w: 10, h: 14,
          life: 30, look: 'bullet', dmg: 5, base: 6, scale: 0.06, angle: -60 } });
      } },
    downB: { name: 'Quick Draw', startup: 30, active: 1, recovery: 14, counter: [2, 26],
      counterHit: { dmg: 12, base: 9, scale: 0.13, angle: 30 } },
    super: { name: 'High Noon', banner: 'High Noon', startup: 60, active: 1, recovery: 20, noDrift: true, gravity: 0.2,
      onFrame(f, me) { if (f === 0) me.events.push({ type: 'sepia', t: 110 }); me.vx *= 0.8; if (me.vy > 1) me.vy = 1; },
      projectile: { at: 60, dx: 34, dy: -38, vx: 28, vy: 0, w: 26, h: 16, life: 60, look: 'bullet', dmg: 30, base: 14, scale: 0.18, angle: 28 } },
  },
};

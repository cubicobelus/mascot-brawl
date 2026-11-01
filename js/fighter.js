'use strict';
// A fighter: movement, moves, collision with the stage, getting launched. x, y are the feet.

class Fighter {
  constructor(idx, mascot, isCpu, stocks) {
    this.idx = idx;
    this.m = mascot;
    this.isCpu = isCpu;
    this.w = mascot.w;
    this.h = mascot.h;
    this.stocks = stocks;
    this.cpu = {};
    this.t = 0;
    this.spawn(STAGE.spawns[idx].x, STAGE.spawns[idx].y);
    this.facing = idx === 0 ? 1 : -1;
    this.invuln = 0;
  }

  spawn(x, y) {
    Object.assign(this, { x, y, vx: 0, vy: 0, damage: 0, onGround: false, onPlat: false, jumps: this.m.airJumps,
      move: null, hitstun: 0, drop: 0, fastFall: false, specialUsed: false, dead: 0, invuln: 120, hitActive: false });
  }

  get out() { return this.stocks <= 0 && this.dead > 0; }

  box() { return { x: this.x - this.w / 2, y: this.y - this.h, w: this.w, h: this.h }; }

  hitbox() {
    const b = this.move.def.box;
    return { x: this.x + b.dx * this.facing - b.w / 2, y: this.y + b.dy - b.h / 2, w: b.w, h: b.h };
  }

  startMove(name) { this.move = { name, def: this.m.moves[name], f: 0, hit: false }; }

  update(c) {
    this.t++;
    this.hitActive = false;
    if (this.dead > 0) {
      if (this.stocks <= 0) return;
      if (--this.dead === 0) this.spawn(STAGE.respawn.x, STAGE.respawn.y);
      return;
    }
    if (this.invuln > 0) this.invuln--;

    if (this.hitstun > 0) {
      this.hitstun--;
      this.vx *= this.onGround ? 0.85 : 0.985;
    } else if (this.move) this.runMove(c);
    else this.control(c);

    const m = this.m, d = this.move && this.move.def;
    const g = d && d.gravity != null ? d.gravity * m.gravity : m.gravity;
    const cap = this.fastFall ? m.fallSpeed * 1.5 : m.fallSpeed;
    if (this.vy < cap) this.vy = Math.min(this.vy + g, cap);
    else this.vy = Math.max(cap, this.vy * 0.97);

    this.physics();
    if (this.onGround && !this.move) this.specialUsed = false;
  }

  control(c) {
    const m = this.m;
    const dir = (c.right ? 1 : 0) - (c.left ? 1 : 0);
    if (dir) this.facing = dir;
    const target = dir * (this.onGround ? m.walk : m.air);
    const accel = this.onGround ? 0.9 : 0.45;
    this.vx += Math.max(-accel, Math.min(accel, target - this.vx));

    if (c.upP) {
      if (this.onGround) { this.vy = -m.jump; this.onGround = false; }
      else if (this.jumps > 0) { this.jumps--; this.vy = -m.jump * 0.9; this.fastFall = false; }
    }
    if (c.attackP) {
      let name = 'jab';
      if (c.up) name = 'up';
      else if (c.down) name = this.onGround ? 'down' : 'dair';
      else if (dir) name = 'side';
      this.startMove(name);
    } else if (c.specialP && !this.specialUsed) {
      this.specialUsed = true;
      this.startMove('special');
    } else if (c.downP) {
      if (this.onGround && this.onPlat) { this.drop = 12; this.onGround = false; }
      else if (!this.onGround && this.vy > -2) this.fastFall = true;
    }
  }

  runMove(c) {
    const mv = this.move, d = mv.def, f = mv.f++;
    if (d.onFrame) d.onFrame(f, this);
    this.hitActive = f >= d.startup && f < d.startup + d.active && !mv.hit;
    if (!this.onGround) {
      if (!d.noDrift) {
        const dir = (c.right ? 1 : 0) - (c.left ? 1 : 0);
        this.vx += Math.max(-0.25, Math.min(0.25, dir * this.m.air - this.vx));
      }
    } else if (!d.keepMomentum) this.vx *= 0.8;
    if (mv.f >= d.startup + d.active + d.recovery || (d.endOnLand && this.onGround && f > d.startup)) this.move = null;
  }

  physics() {
    const S = STAGE.main, hw = this.w / 2, prevX = this.x, prevY = this.y;
    this.x += this.vx;
    this.y += this.vy;
    if (this.drop > 0) this.drop--;
    this.onGround = false;
    this.onPlat = false;

    if (this.vy >= 0 && prevY <= S.y && this.y >= S.y && this.x + hw > S.x1 && this.x - hw < S.x2) this.land(S.y, false);
    else if (this.y > S.y && this.y - this.h < S.bottom && this.x + hw > S.x1 && this.x - hw < S.x2) {
      if (prevY - this.h >= S.bottom) { this.y = S.bottom + this.h; this.vy = Math.max(0, this.vy); }
      else if (prevX < (S.x1 + S.x2) / 2) { this.x = S.x1 - hw; this.vx = Math.min(0, this.vx); }
      else { this.x = S.x2 + hw; this.vx = Math.max(0, this.vx); }
    }
    if (!this.onGround && this.vy >= 0 && this.drop === 0) {
      for (const p of STAGE.plats) {
        if (prevY <= p.y && this.y >= p.y && this.x > p.x1 && this.x < p.x2) { this.land(p.y, true); break; }
      }
    }
  }

  land(y, plat) {
    this.y = y;
    this.vy = 0;
    this.onGround = true;
    this.onPlat = plat;
    this.jumps = this.m.airJumps;
    this.fastFall = false;
  }

  outOfBounds() {
    const B = STAGE.blast;
    return this.dead === 0 && (this.x < B.left || this.x > B.right || this.y < B.top || this.y > B.bottom);
  }

  ko() {
    this.stocks--;
    this.dead = 70;
    this.move = null;
    this.hitstun = 0;
  }

  takeHit(attacker, d) {
    this.damage += d.dmg;
    const kb = (d.base + this.damage * d.scale) / this.m.weight;
    const a = d.angle * Math.PI / 180;
    this.vx = Math.cos(a) * kb * attacker.facing;
    this.vy = -Math.sin(a) * kb;
    this.hitstun = Math.floor(kb * 2.4);
    this.move = null;
    this.onGround = false;
    this.fastFall = false;
    this.specialUsed = false;
    this.facing = -attacker.facing;
    return kb;
  }

  draw(ctx) {
    if (this.dead > 0) return;
    if (this.invuln > 0 && Math.floor(this.invuln / 4) % 2 === 0) ctx.globalAlpha = 0.45;
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.scale(this.facing, 1);
    if (this.hitstun > 0) ctx.rotate(Math.sin(this.t * 0.8) * 0.15);
    const pose = this.onGround && Math.abs(this.vx) > 1 && !this.move ? 'run' : 'idle';
    drawMascot(ctx, this.m, this.t, pose);
    ctx.restore();
    ctx.globalAlpha = 1;
    if (this.hitActive) {
      const b = this.hitbox();
      ctx.fillStyle = 'rgba(255,255,255,0.35)';
      roundRect(ctx, b.x, b.y, b.w, b.h, Math.min(b.w, b.h) / 2);
      ctx.fill();
    }
    // name tag
    ctx.fillStyle = this.idx === 0 ? '#ff5a5a' : '#5aa8ff';
    ctx.font = 'bold 14px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(this.isCpu ? 'CPU' : 'P' + (this.idx + 1), this.x, this.y - this.h - 22);
  }
}

function overlap(a, b) { return a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h; }

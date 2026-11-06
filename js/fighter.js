'use strict';
// A fighter: movement, moves, collision with the stage, getting launched. x, y are the feet.
// Things the game loop must handle (projectiles, screen effects) go out through this.events.

const METER_MAX = 100;

class Fighter {
  constructor(idx, data, isCpu, stocks) {
    this.idx = idx;
    this.m = data;
    this.isCpu = isCpu;
    this.w = data.w;
    this.h = data.h;
    this.stocks = stocks;
    this.cpu = {};
    this.t = 0;
    this.meter = 0;
    this.events = [];
    this.spawn(STAGE.spawns[idx].x, STAGE.spawns[idx].y);
    this.facing = idx === 0 ? 1 : -1;
    this.invuln = 0;
  }

  spawn(x, y) {
    Object.assign(this, { x, y, vx: 0, vy: 0, damage: 0, onGround: false, onPlat: false, jumps: this.m.airJumps,
      move: null, hitstun: 0, drop: 0, fastFall: false, upUsed: false, sideUsed: false, dead: 0, invuln: 120,
      hitActive: false, ammo: this.m.ammo, squash: 0 });
  }

  get out() { return this.stocks <= 0 && this.dead > 0; }

  box() { return { x: this.x - this.w / 2, y: this.y - this.h, w: this.w, h: this.h }; }

  hitbox() {
    const b = this.move.def.box;
    return { x: this.x + b.dx * this.facing - b.w / 2, y: this.y + b.dy - b.h / 2, w: b.w, h: b.h };
  }

  startMove(name) { this.move = { name, def: this.m.moves[name], f: 0, cur: 0, hit: false }; }

  // true while the current move's armor or counter window ([from, to] frames) is open
  windowOn(key) {
    const w = this.move && this.move.def[key];
    return !!w && this.move.cur >= w[0] && this.move.cur <= w[1];
  }

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
    if (this.onGround && !this.move) this.upUsed = this.sideUsed = false;
    // dust kicked up when running or dashing along the ground
    const sp = Math.abs(this.vx);
    if (this.onGround && ((sp > 3 && !this.move && this.t % 9 === 0) || (sp > 8 && this.t % 3 === 0)))
      this.events.push({ type: 'dust', x: this.x - this.facing * 10, y: this.y, n: sp > 8 ? 3 : 2, dir: -this.facing, power: sp > 8 ? 1.4 : 0.8 });
    this.squash *= 0.8;
  }

  control(c) {
    const m = this.m;
    const dir = (c.right ? 1 : 0) - (c.left ? 1 : 0);
    if (dir) this.facing = dir;
    const target = dir * (this.onGround ? m.walk : m.air);
    const accel = this.onGround ? 0.9 : 0.45;
    this.vx += Math.max(-accel, Math.min(accel, target - this.vx));

    if (c.upP) {
      if (this.onGround) { this.vy = -m.jump; this.onGround = false; this.events.push({ type: 'dust', x: this.x, y: this.y, n: 6 }); }
      else if (this.jumps > 0) { this.jumps--; this.vy = -m.jump * 0.9; this.fastFall = false; this.events.push({ type: 'ring', x: this.x, y: this.y }); }
    }
    if (this.trySuper(c)) return;
    if (c.attackP) {
      let name = 'jab';
      if (c.up) name = 'up';
      else if (c.down) name = this.onGround ? 'down' : 'dair';
      else if (dir) name = 'side';
      this.startMove(name);
    } else if (c.specialP) {
      const name = c.up ? 'upB' : c.down ? 'downB' : dir ? 'sideB' : 'neutralB';
      // up and side specials work once per trip through the air
      if (name === 'upB' && this.upUsed) return;
      if (name === 'sideB' && this.sideUsed) return;
      if (name === 'upB') this.upUsed = true;
      if (name === 'sideB') this.sideUsed = true;
      this.startMove(name);
    } else if (c.downP) {
      if (this.onGround && this.onPlat) { this.drop = 12; this.onGround = false; }
      else if (!this.onGround && this.vy > -2) this.fastFall = true;
    }
  }

  // Heisman: attack and special together with a full meter. The two presses rarely land on the same tick,
  // so it can also take over the first few frames of the move the first press started.
  trySuper(c) {
    if (this.meter < METER_MAX || !((c.attackP && c.special) || (c.specialP && c.attack))) return false;
    if (this.move && (this.move.name === 'super' || this.move.f > 4)) return false;
    this.meter = 0;
    this.startMove('super');
    this.events.push({ type: 'super' });
    return true;
  }

  runMove(c) {
    this.trySuper(c);
    const mv = this.move, d = mv.def, f = mv.f++;
    mv.cur = f;
    if (d.onFrame) d.onFrame(f, this);
    if (d.projectile && f === d.projectile.at) this.events.push({ type: 'projectile', p: d.projectile });
    this.hitActive = !!d.box && f >= d.startup && f < d.startup + d.active && !mv.hit;
    if (!this.onGround) {
      if (!d.noDrift) {
        const dir = (c.right ? 1 : 0) - (c.left ? 1 : 0);
        this.vx += Math.max(-0.25, Math.min(0.25, dir * this.m.air - this.vx));
      }
    } else if (!d.keepMomentum) this.vx *= 0.8;
    if (mv.f >= d.startup + d.active + d.recovery || (d.endOnLand && this.onGround && f > d.startup)) {
      this.move = null;
      this.hitActive = false;
    }
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
    if (this.vy > 4) {
      this.events.push({ type: 'dust', x: this.x, y, n: Math.min(12, Math.round(this.vy)), power: 1.2 });
      this.squash = Math.min(1, this.vy / 14);
    }
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
    this.hitActive = false;
    this.hitstun = 0;
  }

  // src is the fighter or projectile that hit; d holds the hit fields. Returns the knockback.
  takeHit(src, d, armored) {
    this.damage += d.dmg;
    if (armored) return 0;
    const dir = d.away ? (Math.sign(this.x - src.x) || src.facing) : src.facing * (d.back ? -1 : 1);
    let kb;
    if (d.pull) {
      // drag toward the user, slower when already close, so the foe stops near them
      const dx = src.x - this.x;
      kb = d.pull;
      this.vx = (Math.sign(dx) || -dir) * Math.min(d.pull, Math.abs(dx) / 14);
      this.vy = -3;
      this.hitstun = 22;
    } else if (d.stun) {
      kb = 2;
      this.vx = dir * 2;
      this.vy = -2;
      this.hitstun = d.stun;
    } else {
      kb = (d.base + this.damage * d.scale) / this.m.weight;
      const a = d.angle * Math.PI / 180;
      this.vx = Math.cos(a) * kb * dir;
      this.vy = -Math.sin(a) * kb;
      this.hitstun = Math.floor(kb * 2.4);
    }
    this.move = null;
    this.hitActive = false;
    this.onGround = false;
    this.fastFall = false;
    this.upUsed = this.sideUsed = false;
    this.facing = -dir;
    return kb;
  }

  draw(ctx) {
    if (this.dead > 0) return;
    if (this.meter >= METER_MAX) {
      ctx.fillStyle = `rgba(255, 215, 90, ${0.35 + 0.2 * Math.sin(this.t / 5)})`;
      ctx.beginPath(); ctx.ellipse(this.x, this.y, this.w * 0.8, 9, 0, 0, Math.PI * 2); ctx.fill();
    }
    if (this.invuln > 0 && Math.floor(this.invuln / 4) % 2 === 0) ctx.globalAlpha = 0.45;
    ctx.save();
    ctx.translate(this.x, this.y);
    // a landing squashes the fighter a little, then it springs back
    ctx.scale(this.facing * (1 + this.squash * 0.25), 1 - this.squash * 0.22);
    if (this.hitstun > 0) ctx.rotate(Math.sin(this.t * 0.8) * 0.15);
    let pose = 'idle';
    if (this.hitstun > 0) pose = 'hurt';
    else if (this.move) pose = movePose(this.move);
    else if (!this.onGround) pose = 'air';
    else if (Math.abs(this.vx) > 1) pose = 'run';
    drawMascot(ctx, this.m, this.t, pose);
    ctx.restore();
    ctx.globalAlpha = 1;
    if (this.windowOn('armor') || this.windowOn('counter')) {
      ctx.strokeStyle = this.windowOn('counter') ? 'rgba(120, 220, 255, 0.8)' : 'rgba(255, 255, 255, 0.6)';
      ctx.lineWidth = 3;
      const b = this.box();
      roundRect(ctx, b.x - 6, b.y - 6, b.w + 12, b.h + 12, 12);
      ctx.stroke();
    }
    if (this.hitActive && this.move.def.rope) {
      const b = this.hitbox(), hand = this.x + this.facing * 16, tipX = this.facing > 0 ? b.x + b.w : b.x;
      ctx.strokeStyle = '#d8b67a';
      ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(hand, this.y - 40); ctx.lineTo(tipX - this.facing * 10, b.y + b.h / 2); ctx.stroke();
      ctx.beginPath(); ctx.ellipse(tipX - this.facing * 2, b.y + b.h / 2, 12, 9, 0, 0, Math.PI * 2); ctx.stroke();
    } else if (this.hitActive) {
      const b = this.hitbox();
      ctx.fillStyle = 'rgba(255,255,255,0.35)';
      roundRect(ctx, b.x, b.y, b.w, b.h, Math.min(b.w, b.h) / 2);
      ctx.fill();
    }
    if (this.ammo !== undefined) {
      for (let k = 0; k < this.m.ammo; k++) {
        ctx.fillStyle = k < this.ammo ? '#ffd27a' : 'rgba(255,255,255,0.2)';
        ctx.fillRect(this.x - 17 + k * 6, this.y - this.h - 16, 4, 7);
      }
    }
    // name tag
    ctx.fillStyle = this.idx === 0 ? '#ff5a5a' : '#5aa8ff';
    ctx.font = 'bold 14px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(this.isCpu ? 'CPU' : 'P' + (this.idx + 1), this.x, this.y - this.h - 22);
  }
}

function overlap(a, b) { return a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h; }

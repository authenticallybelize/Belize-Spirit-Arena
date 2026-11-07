/* Copyright (c) 2026 Authentically Belize Movement. See LICENSE. */
(function (root) {
  'use strict';
  const W = 1200, H = 800;
  const AIM_HEIGHT = 54;
  function aimAt(player, input = {}) {
    const origin = { x: player.x, y: player.y - AIM_HEIGHT };
    const dx = input.relativeAim ? input.aimDX : input.aimX - origin.x;
    const dy = input.relativeAim ? input.aimDY : input.aimY - origin.y;
    if (Number.isFinite(dx) && Number.isFinite(dy) && Math.hypot(dx, dy) > .0001) player.angle = Math.atan2(dy, dx);
    return origin;
  }
  const BOUNDS = { x: 135, y: 155, w: 930, h: 485 };
  const OBSTACLES = [
    { x: 270, y: 250, w: 160, h: 88 }, { x: 770, y: 250, w: 160, h: 88 },
    { x: 270, y: 495, w: 160, h: 88 }, { x: 770, y: 495, w: 160, h: 88 }
  ];
  const TYPES = {
    crab: { name: 'Cave Crab', hp: 42, speed: 65, r: 18, damage: 12, xp: 5 },
    jaguar: { name: 'Mini Jaguar', hp: 25, speed: 145, r: 15, damage: 9, xp: 7 },
    shadow: { name: 'Cave Shadow', hp: 48, speed: 79, r: 15, damage: 11, xp: 10 },
    duende: { name: 'Tata Duende', hp: 1050, speed: 55, r: 27, damage: 20, xp: 50, boss: true },
    jaguarBoss: { name: 'Corrupted Jaguar Spirit', hp: 2400, speed: 118, r: 31, damage: 24, xp: 75, boss: true }
  };
  const repeat = (type, count) => Array(count).fill(type);
  const WAVES = [
    [...repeat('crab', 6)],
    [...repeat('crab', 5), ...repeat('jaguar', 4)],
    [...repeat('crab', 5), ...repeat('jaguar', 5), ...repeat('shadow', 3)],
    [...repeat('crab', 6), ...repeat('jaguar', 7), ...repeat('shadow', 5)],
    ['duende', ...repeat('jaguar', 8), ...repeat('shadow', 6)],
    [...repeat('crab', 7), ...repeat('jaguar', 8), ...repeat('shadow', 5)],
    [...repeat('crab', 8), ...repeat('jaguar', 9), ...repeat('shadow', 6)],
    [...repeat('crab', 9), ...repeat('jaguar', 10), ...repeat('shadow', 7)],
    [...repeat('crab', 10), ...repeat('jaguar', 11), ...repeat('shadow', 8)],
    ['jaguarBoss', ...repeat('crab', 8), ...repeat('jaguar', 12), ...repeat('shadow', 10)]
  ];
  const WAVE_NAMES = ['First whispers', 'Into the undergrowth', 'Restless spirits', 'The jungle awakens', 'Tata Duende has arrived', 'The staff awakens', 'Wild echoes', 'Jaguar territory', 'The final hunt', 'The Jaguar Spirit has arrived'];
  const UPGRADES = [
    { id: 'damage', name: 'Heart of the jungle', detail: '+25% shot damage', icon: '✦' },
    { id: 'rate', name: 'Quick hands', detail: '18% faster firing', icon: '»' },
    { id: 'speed', name: 'Trail runner', detail: '+24 movement speed', icon: '↗' },
    { id: 'health', name: 'Cohune heart', detail: '+25 max health · heal 25', icon: '♡' }
  ];
  const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n));
  const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
  function circleRect(x, y, r, box) {
    const dx = x - clamp(x, box.x, box.x + box.w), dy = y - clamp(y, box.y, box.y + box.h);
    return dx * dx + dy * dy < r * r;
  }
  function segmentRect(a, b, rect, padding = 0) {
    let lo = 0, hi = 1;
    for (const [key, length] of [['x', 'w'], ['y', 'h']]) {
      const delta = b[key] - a[key], min = rect[key] - padding, max = rect[key] + rect[length] + padding;
      if (Math.abs(delta) < 1e-9) { if (a[key] < min || a[key] > max) return null; }
      else {
        let t1 = (min - a[key]) / delta, t2 = (max - a[key]) / delta;
        if (t1 > t2) [t1, t2] = [t2, t1];
        lo = Math.max(lo, t1); hi = Math.min(hi, t2);
        if (lo > hi) return null;
      }
    }
    return lo;
  }
  function segmentCircle(a, b, circle) {
    const dx = b.x - a.x, dy = b.y - a.y, fx = a.x - circle.x, fy = a.y - circle.y;
    const c = fx * fx + fy * fy - circle.r * circle.r;
    if (c <= 0) return 0;
    const qa = dx * dx + dy * dy;
    if (!qa) return null;
    const qb = 2 * (fx * dx + fy * dy), disc = qb * qb - 4 * qa * c;
    if (disc < 0) return null;
    const t = (-qb - Math.sqrt(disc)) / (2 * qa);
    return t >= 0 && t <= 1 ? t : null;
  }
  function move(entity, dx, dy, topClearance = 0) {
    const n = Math.max(1, Math.ceil(Math.max(Math.abs(dx), Math.abs(dy)) / 6));
    for (let i = 0; i < n; i++) {
      let x = clamp(entity.x + dx / n, BOUNDS.x + entity.r, BOUNDS.x + BOUNDS.w - entity.r);
      if (!OBSTACLES.some(o => circleRect(x, entity.y, entity.r, o))) entity.x = x;
      let y = clamp(entity.y + dy / n, BOUNDS.y + entity.r + topClearance, BOUNDS.y + BOUNDS.h - entity.r);
      if (!OBSTACLES.some(o => circleRect(entity.x, y, entity.r, o))) entity.y = y;
    }
  }
  const visible = (a, b, r) => !OBSTACLES.some(o => segmentRect(a, b, o, r) !== null);
  function waypoint(enemy, player) {
    if (visible(enemy, player, enemy.r + 1)) return player;
    let best = null, bestScore = Infinity;
    for (const o of OBSTACLES) {
      const pad = enemy.r + 8;
      for (const x of [o.x - pad, o.x + o.w + pad]) for (const y of [o.y - pad, o.y + o.h + pad]) {
        const p = { x, y };
        if (!visible(enemy, p, enemy.r + 1)) continue;
        const score = distance(enemy, p) + distance(p, player) + (visible(p, player, enemy.r + 1) ? 0 : 450);
        if (score < bestScore) { best = p; bestScore = score; }
      }
    }
    return best || player;
  }
  class Game {
    constructor(random = Math.random) { this.random = random; this.reset(); }
    reset() {
      this.mode = 'menu'; this.time = 0; this.wave = 0; this.kills = 0; this.level = 1; this.xp = 0; this.xpNeeded = 25;
      this.player = { x: 600, y: 430, r: 13, hp: 100, maxHp: 100, speed: 218, damage: 19, interval: .24, weapon: 'slingshot',
        angle: -.45, invincible: 0, fireCooldown: 0, dashCooldown: 0, dashTime: 0, dashX: 0, dashY: 0, walking: false };
      this.enemies = []; this.bullets = []; this.gems = []; this.effects = []; this.events = [];
      this.queue = []; this.choices = []; this.upgrades = []; this.spawnTimer = 0; this.breakTime = 0;
      this.banner = ''; this.bannerTime = 0; this.finishedWave = false; this.nextId = 1; this.staffPickup = null;
    }
    start() { this.reset(); this.mode = 'playing'; this.beginWave(); }
    beginWave() {
      this.wave++; this.queue = [...WAVES[this.wave - 1]];
      // Shuffle ordinary waves, keeping the boss's arrival unmistakable.
      if (!this.queue.some(type => TYPES[type].boss)) for (let i = this.queue.length - 1; i > 0; i--) {
        const j = Math.floor(this.random() * (i + 1)); [this.queue[i], this.queue[j]] = [this.queue[j], this.queue[i]];
      }
      this.spawnTimer = 1.3; this.finishedWave = false;
      this.banner = `Wave ${this.wave} · ${WAVE_NAMES[this.wave - 1]}`;
      this.bannerTime = 2.7; this.events.push({ type: 'wave' });
    }
    pause() { if (this.mode === 'playing') { this.mode = 'paused'; return true; } return false; }
    resume() { if (this.mode === 'paused') this.mode = 'playing'; }
    spawn(type) {
      const spec = TYPES[type]; let p = null;
      for (let attempt = 0; attempt < 40; attempt++) {
        const side = Math.floor(this.random() * 4), t = .08 + this.random() * .84;
        const x = side < 2 ? BOUNDS.x + BOUNDS.w * t : BOUNDS.x + (side === 2 ? spec.r + 8 : BOUNDS.w - spec.r - 8);
        const y = side >= 2 ? BOUNDS.y + BOUNDS.h * t : BOUNDS.y + (side === 0 ? spec.r + 8 : BOUNDS.h - spec.r - 8);
        const candidate = { x, y };
        if (distance(candidate, this.player) > 230 && !this.enemies.some(e => distance(e, candidate) < e.r + spec.r + 10)) { p = candidate; break; }
      }
      if (!p) return false;
      const scale = spec.boss ? 1 : 1 + (this.wave - 1) * .13;
      this.enemies.push({ ...spec, ...p, hp: spec.hp * scale, maxHp: spec.hp * scale, speed: spec.speed * (spec.boss ? 1 : 1 + (this.wave - 1) * .035),
        type, id: this.nextId++, warmup: spec.boss ? 1.7 : .85, shotTimer: 1.3 + this.random(), hit: 0, routeTimer: 0, rushTimer: 3.2, rushWindup: 0, rushTime: 0 });
      return true;
    }
    dash(input) {
      const p = this.player;
      if (this.mode !== 'playing' || p.dashCooldown > 0) return false;
      const len = Math.hypot(input.dx || 0, input.dy || 0);
      p.dashX = len ? (input.dx || 0) / len : Math.cos(p.angle); p.dashY = len ? (input.dy || 0) / len : Math.sin(p.angle);
      p.dashTime = .17; p.dashCooldown = 1.65; p.invincible = Math.max(p.invincible, .23);
      this.events.push({ type: 'dash' }); return true;
    }
    shot(x, y, angle, hostile, damage, speed = 735) {
      if (this.bullets.length >= 300) return;
      const kind = hostile ? 'spirit' : this.player.weapon === 'staff' ? 'magic' : 'stone';
      this.bullets.push({ x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, hostile, damage, kind, life: hostile ? 5 : 1.7, r: hostile || kind === 'magic' ? 6 : 4 });
    }
    hurt(damage) {
      const p = this.player;
      if (p.invincible > 0 || this.mode !== 'playing') return;
      p.hp = Math.max(0, p.hp - damage); p.invincible = .72;
      this.effects.push({ x: p.x, y: p.y - 42, text: `−${damage}`, color: '#ff8e89', life: .7 }); this.events.push({ type: 'hurt' });
      if (p.hp <= 0) { this.mode = 'gameover'; this.events.push({ type: 'end' }); }
    }
    defeat(enemy) {
      if (enemy.dead) return;
      enemy.dead = true; this.kills++;
      this.gems.push({ x: enemy.x, y: enemy.y, value: enemy.xp, age: 0 });
      this.events.push({ type: 'defeat', x: enemy.x, y: enemy.y, boss: enemy.boss });
      if (enemy.type === 'duende' && this.player.weapon === 'slingshot' && !this.staffPickup) {
        this.staffPickup = { x: enemy.x, y: enemy.y };
        this.banner = 'Tata Duende defeated · Collect his staff'; this.bannerTime = 5;
      }
    }
    collectStaff() {
      if (this.mode !== 'playing' || !this.staffPickup || distance(this.player, this.staffPickup) > 36) return false;
      const p = this.player;
      this.staffPickup = null; p.weapon = 'staff'; p.damage *= 1.6; p.interval = Math.max(.065, p.interval / 1.15); p.fireCooldown = 0;
      this.banner = 'Duende Staff claimed · +60% damage'; this.bannerTime = 3.5;
      this.events.push({ type: 'weapon' });
      if (this.wave === 5 && this.finishedWave) this.breakTime = 3.5;
      return true;
    }
    levelUp() {
      if (this.xp < this.xpNeeded) return false;
      this.xp -= this.xpNeeded; this.level++; this.xpNeeded = 25 + (this.level - 1) * 13;
      const pool = [...UPGRADES]; this.choices = [];
      while (this.choices.length < 3) this.choices.push(pool.splice(Math.floor(this.random() * pool.length), 1)[0]);
      this.mode = 'upgrade'; this.events.push({ type: 'level' }); return true;
    }
    choose(index) {
      if (this.mode !== 'upgrade' || !this.choices[index]) return false;
      const id = this.choices[index].id, p = this.player;
      if (id === 'damage') p.damage *= 1.25;
      if (id === 'rate') p.interval = Math.max(.065, p.interval / 1.18);
      if (id === 'speed') p.speed += 24;
      if (id === 'health') { p.maxHp += 25; p.hp = Math.min(p.maxHp, p.hp + 25); }
      this.upgrades.push(id); this.choices = []; this.mode = 'playing'; this.levelUp(); return true;
    }
    update(dt, input = {}) {
      if (!Number.isFinite(dt) || dt <= 0 || this.mode !== 'playing') return;
      // A small physics step also prevents tunneling during a dash or a slow frame.
      let remaining = Math.min(dt, .25);
      while (remaining > 1e-8 && this.mode === 'playing') { const step = Math.min(remaining, 1 / 120); this.tick(step, input); remaining -= step; }
    }
    tick(dt, input) {
      this.time += dt; this.bannerTime = Math.max(0, this.bannerTime - dt);
      const p = this.player;
      p.invincible = Math.max(0, p.invincible - dt); p.fireCooldown -= dt; p.dashCooldown = Math.max(0, p.dashCooldown - dt);
      const len = Math.hypot(input.dx || 0, input.dy || 0); p.walking = len > 0;
      // Keep Joe's raised muzzle inside the north wall, including during a dash.
      if (p.dashTime > 0) { move(p, p.dashX * 940 * dt, p.dashY * 940 * dt, AIM_HEIGHT); p.dashTime -= dt; }
      else move(p, len ? (input.dx || 0) / len * p.speed * dt : 0, len ? (input.dy || 0) / len * p.speed * dt : 0, AIM_HEIGHT);
      this.collectStaff();
      const muzzle = aimAt(p, input);
      if (input.shooting && p.fireCooldown <= 0) {
        this.shot(muzzle.x + Math.cos(p.angle) * 24, muzzle.y + Math.sin(p.angle) * 24, p.angle, false, p.damage, p.weapon === 'staff' ? 800 : 735);
        p.fireCooldown = p.interval; this.events.push({ type: 'shot' });
      }
      if (this.breakTime > 0) { this.breakTime -= dt; if (this.breakTime <= 0) this.beginWave(); }
      else if (this.queue.length && this.enemies.length < 22) {
        this.spawnTimer -= dt;
        if (this.spawnTimer <= 0) {
          if (this.spawn(this.queue[0])) { this.queue.shift(); this.spawnTimer = Math.max(.48, .95 - this.wave * .07); }
          else this.spawnTimer = .2;
        }
      }
      for (const e of this.enemies) {
        e.hit = Math.max(0, e.hit - dt);
        if (e.warmup > 0) { e.warmup -= dt; continue; }
        e.routeTimer -= dt;
        if (e.routeTimer <= 0) { e.waypoint = waypoint(e, p); e.routeTimer = .2; }
        const target = e.waypoint || p, dist = distance(e, p), dx = target.x - e.x, dy = target.y - e.y, length = Math.hypot(dx, dy) || 1;
        let speed = e.speed;
        if (e.type === 'shadow' && visible(e, p, e.r)) speed *= dist < 190 ? -.55 : dist < 285 ? 0 : 1;
        if (e.type === 'jaguarBoss') {
          e.rushTimer -= dt;
          if (e.rushTime > 0) { move(e, e.rushX * 420 * dt, e.rushY * 420 * dt); e.rushTime -= dt; }
          else if (e.rushWindup > 0) { e.rushWindup -= dt; if (e.rushWindup <= 0) e.rushTime = .48; }
          else if (e.rushTimer <= 0) {
            const aim = Math.atan2(p.y - e.y, p.x - e.x); e.rushX = Math.cos(aim); e.rushY = Math.sin(aim);
            e.rushWindup = .65; e.rushTimer = e.hp < e.maxHp * .5 ? 2.5 : 3.6;
          } else move(e, dx / length * speed * dt, dy / length * speed * dt);
        } else move(e, dx / length * speed * dt, dy / length * speed * dt);
        if (distance(e, p) < e.r + p.r) this.hurt(e.damage);
        if (this.mode !== 'playing') return;
        e.shotTimer -= dt;
        e.casting = e.rushWindup > 0 || e.shotTimer < .45 && (e.type === 'shadow' || e.boss);
        if (e.shotTimer <= 0 && e.type === 'shadow') {
          if (visible(e, p, 3)) { this.shot(e.x, e.y - 12, Math.atan2(p.y - e.y, p.x - e.x), true, e.damage, 205); e.shotTimer = 2.35; e.casting = false; }
        }
        if (e.shotTimer <= 0 && e.type === 'duende') {
          const count = e.hp < e.maxHp * .5 ? 12 : 9, phase = this.time * .23;
          for (let i = 0; i < count; i++) this.shot(e.x, e.y, phase + i * Math.PI * 2 / count, true, 13, 170);
          const angle = Math.atan2(p.y - e.y, p.x - e.x);
          for (const offset of [-.14, 0, .14]) this.shot(e.x, e.y, angle + offset, true, 13, 225);
          e.shotTimer = e.hp < e.maxHp * .5 ? 1.8 : 2.55; e.casting = false; this.events.push({ type: 'boss' });
        }
        if (e.shotTimer <= 0 && e.type === 'jaguarBoss') {
          const angle = Math.atan2(p.y - e.y, p.x - e.x), offsets = e.hp < e.maxHp * .5 ? [-.3, -.15, 0, .15, .3] : [-.2, 0, .2];
          for (const offset of offsets) this.shot(e.x, e.y, angle + offset, true, 14, 245);
          e.shotTimer = e.hp < e.maxHp * .5 ? 1.8 : 2.8; e.casting = false; this.events.push({ type: 'boss' });
        }
      }
      // Separate crowds without teleporting any enemy through the cover.
      for (let i = 0; i < this.enemies.length; i++) for (let j = i + 1; j < this.enemies.length; j++) {
        const a = this.enemies[i], b = this.enemies[j]; if (a.warmup > 0 || b.warmup > 0) continue;
        let dx = b.x - a.x, dy = b.y - a.y, len = Math.hypot(dx, dy), min = a.r + b.r;
        if (len < min) { if (len < .01) { dx = 1; dy = 0; len = 1; } const push = Math.min((min - len) / 2, 70 * dt); move(a, -dx / len * push, -dy / len * push); move(b, dx / len * push, dy / len * push); }
      }
      for (const b of this.bullets) {
        const start = { x: b.x, y: b.y }, end = { x: b.x + b.vx * dt, y: b.y + b.vy * dt };
        let first = Infinity, hit = null;
        for (const o of OBSTACLES) { const t = segmentRect(start, end, o, b.r); if (t !== null && t < first) { first = t; hit = 'wall'; } }
        const targets = b.hostile ? [p] : this.enemies;
        for (const target of targets) {
          if (target.dead || target.warmup > 0) continue;
          const t = segmentCircle(start, end, { ...target, r: target.r + b.r });
          if (t !== null && t < first) { first = t; hit = target; }
        }
        b.x = end.x; b.y = end.y; b.life -= dt;
        if (hit) {
          b.life = 0;
          if (hit !== 'wall') {
            if (b.hostile) this.hurt(b.damage);
            else {
              hit.hp -= b.damage; hit.hit = .12;
              const floating = this.effects.find(e => e.enemyId === hit.id && e.life > .35 && e.color === '#fff2cb');
              if (floating) { floating.text += Math.round(b.damage); floating.life = .6; floating.x = hit.x; floating.y = hit.y - 35; }
              else this.effects.push({ x: hit.x, y: hit.y - 35, text: Math.round(b.damage), color: '#fff2cb', life: .6, enemyId: hit.id });
              if (hit.hp <= 0) this.defeat(hit);
            }
          }
          this.events.push({ type: 'impact', x: start.x + (end.x - start.x) * first, y: start.y + (end.y - start.y) * first, hostile: b.hostile });
        }
        if (this.mode !== 'playing') return;
      }
      this.bullets = this.bullets.filter(b => b.life > 0 && b.x > BOUNDS.x && b.x < BOUNDS.x + BOUNDS.w && b.y > BOUNDS.y && b.y < BOUNDS.y + BOUNDS.h);
      this.enemies = this.enemies.filter(e => !e.dead);
      for (const gem of this.gems) {
        gem.age += dt; const dist = distance(gem, p);
        if (dist < 115 || this.finishedWave) {
          const pull = Math.min(dist, (this.finishedWave ? 600 : 330) * dt);
          if (dist > .01) { gem.x += (p.x - gem.x) / dist * pull; gem.y += (p.y - gem.y) / dist * pull; }
        }
        if (distance(gem, p) < 22) { this.xp += gem.value; gem.collected = true; this.events.push({ type: 'gem' }); }
      }
      this.gems = this.gems.filter(g => !g.collected);
      this.effects = this.effects.filter(e => { e.life -= dt; e.y -= dt * 22; return e.life > 0; }).slice(-45);
      if (this.levelUp()) return;
      if (!this.queue.length && !this.enemies.length && !this.finishedWave && this.breakTime <= 0) {
        this.finishedWave = true; this.bullets = [];
        if (this.wave === WAVES.length) { this.mode = 'victory'; this.events.push({ type: 'end' }); return; }
        p.hp = Math.min(p.maxHp, p.hp + 15);
        if (this.wave === 5 && p.weapon !== 'staff') {
          this.breakTime = 0; this.banner = 'Wave 5 cleared · Collect Duende’s staff'; this.bannerTime = 999;
        } else { this.breakTime = 3.5; this.banner = `Wave ${this.wave} cleared · +15 health`; this.bannerTime = 3; }
      }
    }
  }
  const api = { Game, W, H, BOUNDS, OBSTACLES, TYPES, WAVES, UPGRADES, AIM_HEIGHT, aimAt, circleRect, segmentRect, segmentCircle, move, waypoint };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.ArenaCore = api;
})(typeof window !== 'undefined' ? window : globalThis);

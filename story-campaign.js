/* Copyright (c) 2026 Authentically Belize Movement. See LICENSE. */
(function (root) {
  'use strict';
  const node = typeof module !== 'undefined' && module.exports;
  const Base = node ? require('./core.js') : root.ArenaCore;
  const Run = node ? require('./survival.js') : root.SurvivalCore;
  const KEY = 'belize-spirit-arena.story', VERSION = 2;
  // Testing stays open; set false for the full release's earned Survival gate.
  const SURVIVAL_TEST_OPEN = true;
  const TRIALS = [
    { id: 'jungle', name: 'The Jungle Remembers', boss: 'duende', reward: 'staff' },
    { id: 'underworld', name: 'The Corrupted Underworld', boss: 'hollowKeeper', reward: 'obsidian' },
    { id: 'pine-ridge', name: 'Pine Ridge · The Jaguar’s Memory', boss: 'jaguarBoss', reward: 'claw' },
    { id: 'coast', name: 'The Spirit Coast · The Last Tide', boss: 'tideWarden', reward: null }
  ];
  const PINE = { name: TRIALS[2].name, image: 'story/pine-ridge.png', width: 1200, height: 1200,
    bounds: { x: 200, y: 240, w: 800, h: 660 }, obstacles: [], spawn: { x: 600, y: 620 } };
  const arenaFor = id => id === 'pine-ridge' ? PINE : Run.ARENAS[id];
  const fresh = () => ({ version: VERSION, prologueWatched: false, prologueSkipped: false, storyStarted: false,
    currentArena: 'jungle', currentWave: 1, completedArenas: [], unlockedWeapons: ['slingshot'],
    storyComplete: false, survivalUnlocked: false, checkpoint: null });
  const flags = ['prologueWatched', 'prologueSkipped', 'storyStarted', 'storyComplete', 'survivalUnlocked'];
  const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
  const weaponIDs = ['slingshot', 'staff', 'obsidian', 'claw'];
  function validCheckpoint(c) {
    if (c === null) return true;
    if (!c || !Number.isInteger(c.wave) || c.wave < 1 || c.wave > 20 || !Number.isInteger(c.level) || c.level < 1 || c.level > 10000 ||
        !Number.isFinite(c.xp) || c.xp < 0 || !TRIALS.some(t => t.id === c.arena) ||
        TRIALS[Math.floor((c.wave - 1) / 5)].id !== c.arena || !['wave', 'guardian', 'door'].includes(c.stage) ||
        (c.stage !== 'wave' && c.wave % 5 !== 0) || !Array.isArray(c.upgrades) ||
        c.upgrades.some(id => !Run.PERKS.some(p => p.id === id)) || !c.ranks || !c.weaponLevels) return false;
    for (const [id, rank] of Object.entries(c.ranks)) {
      const perk = Run.PERKS.find(p => p.id === id);
      if (!perk || !Number.isInteger(rank) || rank < 0 || rank > perk.max) return false;
    }
    if (Run.WEAPONS.some(w => !Number.isInteger(c.weaponLevels[w.id]) || c.weaponLevels[w.id] < 1 || c.weaponLevels[w.id] > 4)) return false;
    const p = c.player, a = arenaFor(c.arena), b = a.bounds;
    return p && weaponIDs.includes(p.weapon) && ['hp', 'maxHp', 'speed', 'damage', 'interval', 'x', 'y', 'r'].every(k => Number.isFinite(p[k]) && p[k] > 0) &&
      p.hp <= p.maxHp && p.interval >= .03 && p.r === 13 && p.x >= b.x + p.r && p.x <= b.x + b.w - p.r &&
      p.y >= b.y + p.r && p.y <= b.y + b.h - p.r && !a.obstacles.some(o => Base.circleRect(p.x, p.y, p.r, o)) &&
      Number.isInteger(c.kills) && c.kills >= 0 && Number.isFinite(c.time) && c.time >= 0 && Number.isInteger(c.trophyBosses) && c.trophyBosses >= 0;
  }
  function valid(data) {
    return data && data.version === VERSION && flags.every(k => typeof data[k] === 'boolean') &&
      TRIALS.some(t => t.id === data.currentArena) && Number.isInteger(data.currentWave) && data.currentWave >= 1 && data.currentWave <= 20 &&
      Array.isArray(data.completedArenas) && new Set(data.completedArenas).size === data.completedArenas.length &&
      data.completedArenas.every((a, i) => a === TRIALS[i]?.id) && Array.isArray(data.unlockedWeapons) &&
      data.unlockedWeapons.includes('slingshot') && data.unlockedWeapons.every(w => weaponIDs.includes(w)) &&
      (!data.storyComplete || TRIALS.every(t => data.completedArenas.includes(t.id)) && data.survivalUnlocked) && validCheckpoint(data.checkpoint) &&
      (!data.checkpoint || data.currentArena === data.checkpoint.arena && data.currentWave === data.checkpoint.wave);
  }
  function migrate(old) {
    if (!old || old.version !== 1 || !flags.every(k => typeof old[k] === 'boolean') || old.currentArena !== 'jungle' ||
        !Number.isInteger(old.currentWave) || old.currentWave < 1 || old.currentWave > 5 || !Array.isArray(old.completedArenas) ||
        old.completedArenas.some(a => a !== 'jungle') || !Array.isArray(old.unlockedWeapons) || old.unlockedWeapons.some(w => !['slingshot', 'staff'].includes(w))) return null;
    const data = { ...fresh(), ...old, version: VERSION, storyComplete: false };
    if (old.checkpoint) {
      const c = old.checkpoint, p = c.player;
      if (!p || !Number.isInteger(c.wave) || c.wave < 1 || c.wave > 5 || !Number.isInteger(c.level) || c.level < 1 || !Number.isFinite(c.xp) || c.xp < 0 ||
          !Array.isArray(c.upgrades) || c.upgrades.some(id => !Base.UPGRADES.some(u => u.id === id)) ||
          !['slingshot', 'staff'].includes(p.weapon) || ['hp', 'maxHp', 'speed', 'damage', 'interval', 'x', 'y', 'r'].some(k => !Number.isFinite(p[k]) || p[k] <= 0) ||
          p.hp > p.maxHp || p.r !== 13 || p.interval < .065 || p.x < Base.BOUNDS.x + 13 || p.x > Base.BOUNDS.x + Base.BOUNDS.w - 13 ||
          p.y < Base.BOUNDS.y + 13 || p.y > Base.BOUNDS.y + Base.BOUNDS.h - 13 || Base.OBSTACLES.some(o => Base.circleRect(p.x, p.y, 13, o))) return null;
      data.checkpoint = { ...c, arena: 'jungle', stage: 'wave', player: { ...p, ...arenaFor('jungle').spawn },
        ranks: Object.fromEntries([...new Set(c.upgrades)].map(id => [id, c.upgrades.filter(x => x === id).length])),
        weaponLevels: Object.fromEntries(Run.WEAPONS.map(w => [w.id, 1])), kills: 0, time: 0, trophyBosses: 0 };
    } else if (old.completedArenas.includes('jungle')) {
      const game = new Game(() => .5); game.startStory(null); game.wave = 5; game.player.weapon = 'staff';
      data.checkpoint = snapshot(game, 'guardian'); data.currentWave = 5;
    }
    return valid(data) ? data : null;
  }
  function snapshot(game, stage) {
    return { arena: game.arenaId, stage, wave: game.wave, level: game.level, xp: game.xp, upgrades: [...game.upgrades],
      ranks: { ...game.ranks }, weaponLevels: { ...game.weaponLevels }, kills: game.kills, time: game.time, trophyBosses: game.trophyBosses,
      player: { ...game.player, hp: Math.max(1, game.player.hp), invincible: 0, fireCooldown: 0, dashCooldown: 0, dashTime: 0, walking: false } };
  }
  class Store {
    constructor(storage) {
      this.storage = storage; this.data = fresh(); this.warning = ''; this.readOnly = false;
      try {
        const raw = storage.getItem(KEY); if (!raw) return;
        const parsed = JSON.parse(raw), data = parsed.version === 1 ? migrate(parsed) : parsed;
        if (!valid(data)) { this.readOnly = true; this.warning = 'Saved Story data is unsupported or damaged. It was preserved; this session cannot overwrite it.'; return; }
        this.data = data; this.lastWritten = raw;
        if (parsed.version === 1) this.warning = 'Your earlier Jungle progress was carried into the four-trial chapter.';
      } catch { this.readOnly = true; this.warning = 'Story storage is unavailable or unreadable. Play is available, but progress cannot be saved.'; }
    }
    save() {
      if (this.readOnly || !valid(this.data)) return false;
      try {
        const raw = this.storage.getItem(KEY);
        if (raw !== (this.lastWritten || null)) { this.readOnly = true; this.warning = 'Story progress changed in another tab. Reload to continue saving.'; return false; }
        const encoded = JSON.stringify(this.data); this.storage.setItem(KEY, encoded); this.lastWritten = encoded; return true;
      } catch { this.warning = 'Progress could not be saved. Keep this tab open to continue this session.'; return false; }
    }
    recordPrologue(skipped) { this.data[skipped ? 'prologueSkipped' : 'prologueWatched'] = true; return this.save(); }
    checkpoint(game, stage = 'wave') {
      this.data.storyStarted = true; this.data.currentArena = game.arenaId; this.data.currentWave = game.wave;
      this.data.checkpoint = snapshot(game, stage); return this.save();
    }
    completeTrial(game) {
      const index = Math.floor((game.wave - 1) / 5), trial = TRIALS[index];
      this.data.completedArenas = TRIALS.slice(0, index + 1).map(t => t.id);
      if (trial.reward && !this.data.unlockedWeapons.includes(trial.reward)) this.data.unlockedWeapons.push(trial.reward);
      this.checkpoint(game, 'guardian');
    }
    completeChapter() {
      if (this.data.completedArenas.length !== 4) return false;
      this.data.storyComplete = true; this.data.survivalUnlocked = true; this.data.checkpoint = null; return this.save();
    }
  }
  class Game extends Run.Game {
    constructor(random) { super(random); this.totalWaves = 20; this.selectArena('jungle'); }
    selectArena(id) {
      this.arenaId = id; const a = arenaFor(id); this.arena = { ...a, bounds: { ...a.bounds } }; this.navigation = {};
      Object.assign(this.player, a.spawn);
      this.drums = id === 'coast' ? [{ x: 450, y: 400 }, { x: 735, y: 540 }, { x: 500, y: 700 }].map(d => ({ ...d, active: false, charge: 0, cooldown: 0 })) : [];
      this.restoredGround = []; this.tide = 0; this.arenaClock = 0; this.portal = null;
    }
    startStory(store, resume = false) {
      this.store = store; this.arenaId = 'jungle'; this.totalWaves = 20; this.reset(); this.totalWaves = 20;
      this.selectArena('jungle'); this.guardianReleased = false; this.pendingBeat = null;
      const c = resume && store?.data.checkpoint;
      if (c && validCheckpoint(c)) {
        this.selectArena(c.arena); Object.assign(this.player, c.player); this.wave = c.wave - 1; this.level = c.level; this.xp = c.xp;
        this.upgrades = [...c.upgrades]; this.ranks = { ...c.ranks }; this.weaponLevels = { ...c.weaponLevels }; this.kills = c.kills; this.time = c.time; this.trophyBosses = c.trophyBosses;
        this.xpNeeded = Run.xpForLevel(this.level);
      } else if (store) { store.data.completedArenas = []; store.data.storyComplete = false; }
      this.mode = 'playing'; this.beginWave();
      if (c && c.stage !== 'wave') {
        this.queue = []; this.enemies = []; this.finishedWave = true; this.guardianReleased = true; this.breakTime = 0;
        this.mode = 'storyGuardian'; this.store?.checkpoint(this, c.stage); if (c.stage === 'door') this.openDoor();
      }
    }
    beginWave() {
      this.wave++; this.finishedWave = false; this.breakTime = 0; this.guardianReleased = false;
      const index = Math.floor((this.wave - 1) / 5), local = (this.wave - 1) % 5, trial = TRIALS[index];
      const packs = [ ['spiderling', 'crab', 'worker', 'jaguar'], ['rootling', 'shadow', 'spiderling', 'tommy'],
        ['jaguar', 'owlShade', 'bees', 'tommy'], ['crab', 'miniLlorona', 'owlShade', 'rootling'] ];
      const count = local === 4 ? 3 + index : 6 + local * 3 + index * 2;
      this.queue = Array.from({ length: count }, (_, i) => packs[index][(i + this.wave) % 4]);
      if (local === 4) this.queue.unshift(trial.boss);
      this.spawnInterval = Math.max(.4, .85 - .018 * this.wave); this.enemyLimit = 18; this.spawnTimer = 1.3;
      this.banner = trial.name + ' · Wave ' + this.wave + ' / 20'; this.bannerTime = 3;
      this.refreshStats(); this.store?.checkpoint(this); this.events.push({ type: 'wave' });
      if ([6, 9, 11, 14, 16, 19].includes(this.wave)) { this.pendingBeat = this.wave; this.mode = 'storyBeat'; }
      if (index === 1 && local < 4) this.createCrystals(2);
    }
    startNextTrial() {
      if (!this.portal || this.wave >= 20) return false;
      this.selectArena(TRIALS[this.wave / 5].id); this.mode = 'playing'; this.player.hp = this.player.maxHp;
      this.gems = []; this.bullets = []; this.drops = []; this.hazards = []; this.corpses = []; this.powers = {};
      this.beginWave(); return true;
    }
    openDoor() {
      const reward = TRIALS[Math.floor((this.wave - 1) / 5)].reward;
      if (reward) { this.player.weapon = reward; this.refreshStats(); }
      this.finishedWave = true; this.breakTime = 0; this.hazards = []; this.bullets = []; this.drops = []; this.corpses = [];
      this.portal = this.clearPoint({ x: 600, y: this.arena.bounds.y + 90 }, 32); this.mode = 'playing';
      this.banner = 'Guardian restored · ' + (reward ? Run.weapon(reward).name + ' unlocked · ' : '') + 'Enter the purple doorway'; this.bannerTime = 30;
      this.store?.checkpoint(this, 'door');
    }
    clearPoint(point, r = 22) {
      const b = this.arena.bounds;
      for (const offset of [0, 50, -50, 100, -100, 150, -150, 220, -220]) for (const dy of [0, 60, -60, 130, -130]) {
        const p = { x: Math.max(b.x + r + 8, Math.min(b.x + b.w - r - 8, point.x + offset)), y: Math.max(b.y + r + Base.AIM_HEIGHT + 8, Math.min(b.y + b.h - r - 8, point.y + dy)) };
        if (!this.arena.obstacles.some(o => Base.circleRect(p.x, p.y, r + 6, o))) return p;
      }
      return { ...this.arena.spawn };
    }
    createCrystals(count, owner = null) {
      const points = [{ x: 370, y: 470 }, { x: 755, y: 300 }, { x: 815, y: 720 }];
      for (let i = 0; i < count; i++) this.enemies.push({ ...this.clearPoint(points[i]), type: 'spiritCrystal', name: 'Corruption Crystal', objective: true,
        id: this.nextId++, owner, hp: owner ? 115 : 65, maxHp: owner ? 115 : 65, r: 20, speed: 0, damage: 0, xp: 0, warmup: .85, hit: 0, statuses: {} });
    }
    spawn(type) {
      if (!['hollowKeeper', 'tideWarden'].includes(type)) {
        const ok = super.spawn(type); if (!ok) return false;
        const e = this.enemies.at(-1);
        if (type === 'duende') { e.hp = e.maxHp = 1050; e.damage = 20; e.shotScale = .2; }
        if (type === 'jaguarBoss') { e.hp = e.maxHp = 2400; e.damage = 22; e.shotScale = 1; e.caveTimer = 6; }
        return true;
      }
      const e = { ...this.clearPoint({ x: 850, y: 575 }, 36), type, name: type === 'hollowKeeper' ? 'The Hollow Keeper' : 'The Tide Warden',
        boss: true, bossAI: true, height: 140, r: 35, hp: type === 'hollowKeeper' ? 2100 : 3200, xp: type === 'hollowKeeper' ? 80 : 100, speed: 0, damage: 19,
        id: this.nextId++, warmup: 1.7, hit: 0, statuses: {}, action: 'move', actionTime: 0, attackTimer: 2, phase: 1, skillIndex: 0 };
      e.maxHp = e.hp; this.enemies.push(e);
      if (type === 'hollowKeeper') this.createCrystals(3, e.id);
      return true;
    }
    powerPool() { return super.powerPool().filter(id => id !== 'nuke'); }
    eligible(perk) { return perk.id !== 'commit' && super.eligible(perk); }
    addDrop(id, x, y, kind = 'weapon', boss = false) {
      if (kind === 'weapon' && (this.releasingGuardian || !weaponIDs.includes(id) || !this.store?.data.unlockedWeapons.includes(id))) return;
      return super.addDrop(id, x, y, kind, boss);
    }
    cycleWeapon() {
      if (this.mode !== 'playing' || this.portal) return false;
      const owned = this.store?.data.unlockedWeapons || ['slingshot'];
      this.player.weapon = owned[(owned.indexOf(this.player.weapon) + 1) % owned.length]; this.player.fireCooldown = 0; this.refreshStats(); return true;
    }
    pickup() { return super.pickup() || this.cycleWeapon(); }
    collectPower(id) { if (id === 'nuke') return; super.collectPower(id); }
    damageEnemy(e, amount, statuses = null, reducedXP = false) {
      if (e.boss && e.type === 'hollowKeeper' && this.enemies.some(c => c.objective && c.owner === e.id && !c.dead)) return;
      if (e.type === 'tideWarden' && !e.dead) {
        if (e.phase === 3 && this.drums.some(d => !d.active)) return;
        const floor = e.phase === 1 ? .65 : e.phase === 2 ? .3 : 0;
        const actual = amount * (1 + .2 * this.rank('bossDamage'));
        if (e.hp - actual <= e.maxHp * floor && floor) {
          amount = Math.max(0, e.hp - e.maxHp * floor) / (1 + .2 * this.rank('bossDamage')); e.phase++;
          if (e.phase === 3) this.drums.forEach(d => { d.active = false; d.charge = 0; });
        }
      }
      if (!e.boss && !e.objective && this.enemies.some(c => c.objective && !c.dead && distance(c, e) < 210)) amount *= .65;
      super.damageEnemy(e, amount, statuses, reducedXP);
    }
    defeat(e, reducedXP = false) {
      if (e.dead) return;
      if (e.objective) {
        e.dead = true; this.restoredGround.push({ x: e.x, y: e.y, life: 8 }); this.flashes.push({ x: e.x, y: e.y, r: 110, color: '#83f3b5', life: .6 }); return;
      }
      this.releasingGuardian = !!e.boss; super.defeat(e, reducedXP); this.releasingGuardian = false;
      if (e.boss) { this.guardianReleased = true; this.purified = { ...e }; this.corpses = this.corpses.filter(c => c.type !== e.type); }
    }
    enemyTick(e, dt) {
      if (e.objective) { e.warmup = Math.max(0, e.warmup - dt); e.hit = Math.max(0, e.hit - dt); return; }
      if (['hollowKeeper', 'tideWarden'].includes(e.type)) {
        e.hit = Math.max(0, e.hit - dt); if (e.warmup > 0) { e.warmup -= dt; return; }
        for (const [id, s] of Object.entries(e.statuses)) { const step = Math.min(dt, s.remaining); s.remaining -= dt; this.damageEnemy(e, s.dps * step); if (s.remaining <= 0) delete e.statuses[id]; }
        if (e.dead) return;
        const step = this.active('freeze') ? dt * .5 : dt; e.attackTimer -= step; e.actionTime += step;
        if (e.action === 'windup' && e.actionTime >= 1) {
          for (let i = -2; i <= 2; i++) this.shot(e.x, e.y, e.attackAngle + i * .17, true, 14, e.type === 'hollowKeeper' ? 210 : 175, { color: e.type === 'hollowKeeper' ? '#d0a4ff' : '#99edff', r: e.type === 'hollowKeeper' ? 6 : 12 });
          e.action = 'recover'; e.actionTime = 0;
        } else if (e.action === 'recover' && e.actionTime > 1.6) { e.action = 'move'; e.actionTime = 0; }
        else if (e.action === 'move' && e.attackTimer <= 0) {
          e.action = 'windup'; e.actionTime = 0; e.attackTimer = e.phase > 1 ? 3.8 : 4.5; e.attackAngle = Math.atan2(this.player.y - e.y, this.player.x - e.x);
          e.skill = { kind: 'fan', count: 5, spread: .17, warning: 1 };
          if (e.type === 'hollowKeeper') {
            this.addArea(e, this.player.x, this.player.y, 72, 1.3, .4, '#c194fa');
          } else {
            const b = this.arena.bounds;
            for (let i = 0; i < 3; i++) this.addArea(e, b.x + 150 + i * 240, this.player.y, 90, 1.4 + i * .25, .3, '#8bdeed');
          }
        }
        if (distance(e, this.player) < e.r + this.player.r) this.hurt(e.damage);
        return;
      }
      const powered = this.enemies.some(c => c.objective && !c.dead && distance(c, e) < 210), original = e.damage;
      const speed = e.speed;
      e.remembering = e.type === 'jaguarBoss' && e.warmup <= 0 && e.rushTime <= 0 && e.rushWindup <= 0 && e.rushTimer > .5 && this.time % 7 < .35;
      if (e.remembering) { e.speed = 0; e.shotTimer = Math.max(e.shotTimer, .5); }
      e.damage = original * (powered ? 1.25 : 1); e.empowered = powered; super.enemyTick(e, dt); e.damage = original; e.speed = speed;
      if (e.type === 'jaguarBoss' && e.warmup <= 0 && !e.dead) {
        e.caveTimer -= dt;
        if (e.caveTimer <= 0) { e.caveTimer = 8; for (let i = 0; i < 2 && this.enemies.filter(a => a.summoned && !a.dead).length < 6 && this.enemies.length < this.enemyLimit; i++) {
          if (this.spawn('owlShade')) { const child = this.enemies.at(-1); child.summoned = true; Object.assign(child, this.clearPoint(i ? { x: 920, y: 310 } : { x: 260, y: 310 })); }
        } }
      }
    }
    tick(dt, input) {
      if (this.portal) {
        this.time += dt; this.player.dashCooldown = Math.max(0, this.player.dashCooldown - dt);
        const length = Math.hypot(input.dx || 0, input.dy || 0); this.player.walking = length > 0;
        if (length) Run.move(this, this.player, input.dx / length * this.player.speed * dt, input.dy / length * this.player.speed * dt);
        Base.aimAt(this.player, input); if (distance(this.player, this.portal) < 45) this.mode = 'storyDoor'; return;
      }
      super.tick(dt, input);
      if (!['playing', 'victory'].includes(this.mode)) return;
      this.arenaClock += dt;
      if (this.arenaId === 'pine-ridge' && this.arenaClock >= 5) {
        this.arenaClock = 0; const owner = this.enemies.find(e => !e.dead && !e.objective);
        if (owner) this.addArea(owner, this.player.x, this.player.y, 78, 1.5, .3, '#e6c99a');
      }
      for (const ground of this.restoredGround) { ground.life -= dt; if (distance(ground, this.player) < 95) this.player.hp = Math.min(this.player.maxHp, this.player.hp + 2 * dt); }
      this.restoredGround = this.restoredGround.filter(g => g.life > 0);
      if (this.arenaId === 'coast') this.tickCoast(dt);
      if (this.finishedWave && this.wave % 5 === 0 && this.guardianReleased) {
        this.mode = 'storyGuardian'; this.breakTime = 0; this.bullets = []; this.hazards = [];
        this.store?.completeTrial(this);
      }
    }
    tickCoast(dt) {
      const boss = this.enemies.find(e => e.type === 'tideWarden' && !e.dead);
      const target = boss?.phase >= 2 ? 100 : 12 + (this.wave - 16) * 12;
      this.tide += (target - this.tide) * Math.min(1, dt * .5);
      const p = this.player, b = this.arena.bounds;
      if (p.x < b.x + this.tide || p.x > b.x + b.w - this.tide || p.y > b.y + b.h - this.tide) this.hurt(10);
      for (const d of this.drums) {
        d.cooldown = Math.max(0, d.cooldown - dt); const near = distance(p, d) < 38;
        if (near && d.cooldown <= 0) { p.hp = Math.min(p.maxHp, p.hp + 8); p.invincible = Math.max(p.invincible, 1.5); d.cooldown = 12; }
        if (boss?.phase === 3 && !d.active) {
          if (near && boss.action !== 'windup') d.charge += dt; else d.charge = Math.max(0, d.charge - dt * .5);
          if (d.charge >= 1.2) { d.active = true; this.flashes.push({ x: d.x, y: d.y, r: 130, color: '#b9ffe2', life: .6 }); }
        }
      }
    }
  }
  const api = { Game, Store, KEY, VERSION, fresh, valid, validCheckpoint, TRIALS, PINE, arenaFor, SURVIVAL_TEST_OPEN };
  if (node) module.exports = api; else root.StoryCampaign = api;
})(typeof window !== 'undefined' ? window : globalThis);

/* Copyright (c) 2026 Authentically Belize Movement. See LICENSE. */
(function (root) {
  'use strict';
  const Base = typeof module !== 'undefined' && module.exports ? require('./core.js') : root.ArenaCore;
  const { circleRect, segmentRect, segmentCircle } = Base;
  const TYPES = { ...Base.TYPES,
    tommy: { name: 'Tommy Goff', hp: 52, speed: 90, r: 16, damage: 13, xp: 9 },
    miniLlorona: { name: 'Mini Llorona', hp: 58, speed: 68, r: 16, damage: 10, xp: 12 },
    spiderling: { name: 'Spiderling', hp: 24, speed: 125, r: 11, damage: 7, xp: 5, height: 33, attack: 'bite', reach: 27, windup: .25, cooldown: 1.2 },
    worker: { name: 'Sompopo Worker', hp: 36, speed: 90, r: 13, damage: 8, xp: 6, height: 40, attack: 'bite', reach: 30, windup: .35, cooldown: 1.4 },
    bees: { name: 'Africanized Bee Swarm', hp: 28, speed: 135, r: 16, damage: 8, xp: 7, height: 44, flying: true, attack: 'bite', reach: 30, windup: .3, cooldown: 1.5 },
    rootling: { name: 'Corrupted Rootling', hp: 42, speed: 58, r: 14, damage: 10, xp: 7, height: 39, attack: 'shot', reach: 280, windup: .6, cooldown: 3 },
    owlShade: { name: 'Owl Shade', hp: 30, speed: 110, r: 13, damage: 9, xp: 7, height: 41, flying: true, attack: 'pounce', reach: 150, windup: .55, cooldown: 3.2, rushSpeed: 280, rushDuration: .35 },
    alphaCrab: { name: 'Armored Mangrove Crab', hp: Base.TYPES.crab.hp * 4, speed: 48, r: 29, damage: Base.TYPES.crab.damage * 1.5, xp: 20, height: 75, alpha: true, attack: 'slam', reach: 85, windup: 1, cooldown: 3 },
    alphaJaguar: { name: 'Jaguar Sentinel', hp: Base.TYPES.jaguar.hp * 4, speed: 110, r: 25, damage: Base.TYPES.jaguar.damage * 1.5, xp: 28, height: 81, alpha: true, attack: 'pounce', reach: 230, windup: .85, cooldown: 3.5, rushSpeed: 350, rushDuration: .5 },
    shadowBrute: { name: 'Shadow Brute', hp: Base.TYPES.shadow.hp * 4, speed: 45, r: 30, damage: Base.TYPES.shadow.damage * 1.5, xp: 40, height: 88, alpha: true, attack: 'slam', reach: 105, windup: 1.15, cooldown: 3.6 },
    lloronaBoss: { name: 'La Llorona', hp: 1200, speed: 62, r: 29, damage: 18, xp: 60, height: 108, boss: true, bossAI: true },
    cadejoBoss: { name: 'El Cadejo', hp: 1800, speed: 115, r: 30, damage: 24, xp: 70, height: 110, boss: true, bossAI: true },
    maleSisimite: { name: 'Male Sisimite', hp: 2800, speed: 62, r: 34, damage: 30, xp: 85, height: 128, boss: true, bossAI: true },
    femaleSisimite: { name: 'Female Sisimite', hp: 2500, speed: 92, r: 31, damage: 24, xp: 85, height: 122, boss: true, bossAI: true },
    anansiBoss: { name: 'Anansi', hp: 2600, speed: 84, r: 32, damage: 23, xp: 90, height: 116, boss: true, bossAI: true },
    sochBoss: { name: 'The Soch / La Lechuza', hp: 2900, speed: 98, r: 30, damage: 26, xp: 95, height: 116, flying: true, boss: true, bossAI: true },
    xtabaiBoss: { name: 'La Xtabai', hp: 3100, speed: 70, r: 29, damage: 25, xp: 100, height: 116, boss: true, bossAI: true }
  };
  const COMMONS = ['spiderling', 'worker', 'bees', 'rootling', 'owlShade'];
  const ALPHAS = ['alphaCrab', 'alphaJaguar', 'shadowBrute'];
  for (const [id, spec] of Object.entries(TYPES)) TYPES[id] = { ...spec, hp: spec.hp * 1.15 * (spec.alpha ? 1.5 : 1) };
  TYPES.duende.hp *= 5; TYPES.duende.damage *= 5;
  const BOSSES = ['lloronaBoss', 'jaguarBoss', 'cadejoBoss', 'duende', 'maleSisimite', 'femaleSisimite', 'anansiBoss', 'sochBoss', 'xtabaiBoss'];
  const BOSS_SKILLS = {
    lloronaBoss: [{ kind: 'fan', count: 5, spread: .18, speed: 180, warning: .8, color: '#9cdeec' }, { kind: 'area', count: 2, radius: 85, warning: 1.1, life: .4, color: '#73cde0' }],
    cadejoBoss: [{ kind: 'rush', speed: 380, duration: .55, warning: .8 }, { kind: 'area', count: 1, self: true, radius: 135, warning: 1, life: .3, color: '#ba86ec' }],
    maleSisimite: [{ kind: 'area', count: 1, self: true, radius: 150, warning: 1.2, life: .5, color: '#d3a178' }, { kind: 'fan', count: 3, spread: .13, speed: 255, warning: .9, color: '#bd9a7a' }],
    femaleSisimite: [{ kind: 'area', count: 3, radius: 72, warning: 1.15, life: 1.8, color: '#8fc79e' }, { kind: 'fan', count: 3, spread: .25, speed: 215, warning: .75, color: '#97cfa2' }],
    anansiBoss: [{ kind: 'fan', count: 7, spread: .15, speed: 175, warning: .9, color: '#dbb2ff' }, { kind: 'area', count: 3, radius: 80, warning: 1.2, life: 2, color: '#c79aef' }],
    sochBoss: [{ kind: 'rush', speed: 440, duration: .5, warning: .85 }, { kind: 'fan', count: 5, spread: .16, speed: 265, warning: .75, color: '#e5d5f3' }],
    xtabaiBoss: [{ kind: 'area', count: 3, radius: 92, warning: 1.25, life: 2, color: '#80d5b0' }, { kind: 'fan', count: 7, spread: .22, speed: 190, warning: .9, color: '#9fddb3' }]
  };
  const MOB_WEAPON_CHANCE = .06;
  const xpForLevel = level => Math.ceil(25 + 13 * (level - 1) + .5 * (level - 1) ** 2);
  const W = 2400, H = 2400, SURVIVAL_WAVES = 140, clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
  const ARENAS = {
    open: { name: 'Open Jungle Clearing', image: 'open-survival-arena.png', width: W, height: H, bounds: { x: 88, y: 88, w: 2224, h: 2224 }, obstacles: [], spawn: { x: 1200, y: 1200 } },
    underworld: { name: 'The Corrupted Underworld', image: 'underworld-arena.png', width: 1200, height: 1200, bounds: { x: 180, y: 145, w: 835, h: 685 },
      obstacles: [{ x: 518, y: 252, w: 85, h: 48 }, { x: 333, y: 345, w: 75, h: 70 }, { x: 808, y: 337, w: 95, h: 65 }, { x: 480, y: 521, w: 93, h: 65 }, { x: 713, y: 648, w: 87, h: 65 }, { x: 210, y: 677, w: 77, h: 56 }],
      spawn: { x: 610, y: 575 } },
    coast: { name: 'Spirit Coast · Hopkins', image: 'coast-arena.png', width: 1200, height: 1200, bounds: { x: 180, y: 145, w: 835, h: 685 },
      obstacles: [{ x: 540, y: 268, w: 100, h: 60 }, { x: 772, y: 392, w: 106, h: 57 }, { x: 623, y: 645, w: 96, h: 65 }, { x: 337, y: 580, w: 69, h: 61 }],
      spawn: { x: 610, y: 575 } },
    canyon: { name: 'Ancient Forest Canyon', image: 'canyon-arena.png', width: 1200, height: 1200, bounds: { x: 180, y: 145, w: 835, h: 685 },
      obstacles: [{ x: 524, y: 237, w: 78, h: 49 }, { x: 358, y: 311, w: 81, h: 82 }, { x: 451, y: 461, w: 122, h: 75 }, { x: 695, y: 611, w: 111, h: 73 }, { x: 854, y: 459, w: 101, h: 73 }],
      spawn: { x: 610, y: 575 } },
    jungle: { name: 'Jungle Ruins', image: 'jungle-arena.png', width: 1200, height: 1200, bounds: { x: 135, y: 232, w: 930, h: 728 },
      obstacles: Base.OBSTACLES.map(o => ({ ...o, y: o.y * 1.5, h: o.h * 1.5 })), spawn: { x: 600, y: 645 } }
  };
  const WEAPONS = [
    { id: 'slingshot', name: "Joe’s Sling", damage: 19, rate: 3.5, speed: 735, range: 1050, r: 4, tags: ['projectile', 'physical'], color: '#d9c9a9', art: [12, 112, 90, 111] },
    { id: 'bow', name: 'Belize Hardwood Bow', damage: 55, rate: 1.8, speed: 1000, range: 1150, r: 4, tags: ['projectile', 'physical'], color: '#efd093', art: [571, 113, 94, 110] },
    { id: 'dart', name: 'Maya Dart Launcher', damage: 14, rate: 4, speed: 850, range: 850, r: 4, poison: 6, tags: ['projectile', 'poison'], color: '#adf579', art: [1127, 112, 94, 111] },
    { id: 'spear', name: 'Fishing Spear Thrower', damage: 100, rate: 1, speed: 740, range: 1050, r: 7, pierce: 2, tags: ['projectile', 'physical'], color: '#b0eaff', art: [11, 344, 96, 123] },
    { id: 'crystal', name: 'Crystal Staff', damage: 48, rate: 2.5, speed: 800, range: 1000, r: 6, tags: ['projectile', 'spirit'], color: '#82ddff', art: [574, 345, 90, 124] },
    { id: 'cacao', name: 'Staff of Cacao Smoke', damage: 12, rate: 3, speed: 460, range: 420, r: 9, cloud: true, tags: ['projectile', 'cloud', 'spirit'], color: '#bf9a76', art: [1137, 347, 83, 121] },
    { id: 'drum', name: 'Drum of Calling', damage: 65, rate: 1.2, range: 140, pulse: true, tags: ['area', 'spirit'], color: '#ffd57c', art: [13, 587, 94, 108] },
    { id: 'claw', name: 'Jaguar Spirit Claw', damage: 24, rate: 5, range: 90, melee: true, tags: ['melee', 'spirit'], color: '#8df38b', art: [576, 584, 89, 115] },
    { id: 'feather', name: 'Kukulkan Feather Cast', damage: 28, rate: 4.5, speed: 620, range: 950, r: 5, homing: true, tags: ['projectile', 'spirit'], color: '#ffc765', art: [1126, 586, 93, 112] },
    { id: 'obsidian', name: 'Obsidian Spirit Shard', damage: 110, rate: 2, speed: 650, range: 1000, r: 8, pierce: 2, tags: ['projectile', 'spirit'], color: '#c996ff', art: [12, 820, 75, 103] },
    { id: 'cohune', name: 'Cohune Bomb Launcher', damage: 400, rate: .125, speed: 450, range: 530, r: 9, explosive: true, tags: ['projectile', 'explosive', 'area'], color: '#ffbc5c', art: [635, 816, 85, 108] },
    { id: 'staff', name: 'Duende Staff', damage: 30.4, rate: 4.7916667, speed: 800, range: 1000, r: 6, tags: ['projectile', 'spirit'], color: '#9fffd0', art: null }
  ];
  const FEATHER_HOMING = [1.1, 1.75, 2.45, Math.PI];
  const weapon = id => WEAPONS.find(w => w.id === id) || WEAPONS[0];
  const PERKS = [
    ['damage', 'Heart of the Jungle', '+25% compounded damage', 5, 'Common'],
    ['rate', 'Quick Hands', '+18% firing speed; capped ranks add +5% direct damage', 5, 'Common'],
    ['speed', 'Trail Runner', '+24 movement speed', 5, 'Common'],
    ['health', 'Cohune Heart', '+25 max HP · heal 25', 5, 'Common'],
    ['harpy', 'Harpy Eye', '+20% shot speed · +10% range', 4, 'Common', 'projectile'],
    ['magnet', 'Spirit Magnet', '+45 gem attraction radius', 4, 'Common'],
    ['xp', 'Memory Seeker', '+20% gem XP', 5, 'Common'],
    ['armor', 'Mahogany Skin', '-8% incoming damage', 4, 'Common'],
    ['dodge', 'Jaguar Reflex', '+6% chance to avoid damage', 4, 'Common'],
    ['crit', 'Jaguar Fang', '+8% critical chance · 2× damage', 4, 'Uncommon'],
    ['regen', 'Bush Medicine', 'Heal 1 HP / 4 seconds per rank', 4, 'Uncommon'],
    ['recovery', 'River Recovery', '+10 wave-clear healing', 3, 'Uncommon'],
    ['second', 'Second Wind', 'Below 35% HP: speed, fire and damage', 1, 'Uncommon'],
    ['duplicate', 'Duende Trick', '+8% phantom-shot chance · 60% damage', 3, 'Uncommon', 'projectile'],
    ['resonance', 'Guardian Resonance', '+20% temporary power duration', 3, 'Uncommon'],
    ['rhythm', 'Belizean Rhythm', 'Kill-triggered spirit pulse: 25 → 20 → 15 → 10', 3, 'Uncommon'],
    ['breathing', 'Breathing Room', 'Knock back foes · 1.5s protection on resume', 1, 'Uncommon'],
    ['pierce', 'Obsidian Edge', 'Pierce one more target · 15% falloff', 3, 'Rare', 'projectile'],
    ['ricochet', 'Macal Ricochet', 'Two bounces maximum; rank III adds +15% bounced damage', 2, 'Rare', 'projectile'],
    ['overflow', 'Spirit Overflow', 'Bonus shot every 6 → 5 → 4 → 3 attacks', 3, 'Rare', 'projectile'],
    ['blast', 'Cohune Blast', '+25% radius (160 cap) · +15% bomb damage', 4, 'Rare', 'explosive'],
    ['poison', 'Fer-de-Lance Venom', 'Poison: 6 DPS / rank for 3 seconds', 3, 'Uncommon', 'projectile'],
    ['fire', 'Bushfire Blessing', '15% / rank chance: burn 10 DPS / rank', 3, 'Uncommon', 'projectile'],
    ['homing', 'Kukulkan Wind', 'Stronger gentle projectile homing', 3, 'Rare', 'projectile'],
    ['ward', 'Maya Ward', 'Block a hit every 25 → 20 → 15 → 10 seconds', 3, 'Rare'],
    ['bossDamage', 'Legend Hunter', '+20% boss damage', 3, 'Rare', 'boss'],
    ['courage', 'Jaguar Courage', 'While boss lives: speed, fire and damage', 1, 'Uncommon', 'boss'],
    ['trophy', 'Trophy Keeper', 'Each future boss: +5% damage · +10 max HP', 1, 'Legendary', 'boss'],
    ['sacred', 'Sacred Return', 'Boss death: heal 35% · guaranteed power', 1, 'Legendary', 'boss'],
    ['grandma', 'Grandma Knows Best', 'Fourth card with improved rarity odds', 1, 'Legendary'],
    ['commit', 'One Tool, One Path', 'Lock weapon · +40% damage · +20% fire', 1, 'Legendary']
  ].map(([id, name, detail, max, rarity, tag]) => ({ id, name, detail, max: max > 1 ? max + 1 : max, rarity, tag, icon: '✦' }));
  const POWERS = {
    heavy: { name: 'Heavy Bullets', duration: 8, color: '#ffe197' },
    freeze: { name: 'Freeze', duration: 5, color: '#9adfff' },
    shield: { name: 'Shield', duration: 5, color: '#b8fff1' },
    shock: { name: 'Shock', duration: 5, color: '#a5b9ff' },
    nuke: { name: 'Nuke', duration: 0, color: '#ff965f' },
    badman: { name: 'Badman', duration: 8, color: '#ff799a' },
    evolution: { name: 'Weapon Power Up', duration: 10, color: '#eebcff' },
    doubleXP: { name: 'Double Experience', duration: 10, color: '#8cffb5' },
    bonusXP: { name: 'Experience Bonus', duration: 0, color: '#d1ff83' },
    reflex: { name: 'Reflex Boost', duration: 7, color: '#80e0e2' }
  };
  function move(g, e, dx, dy) {
    const n = Math.max(1, Math.ceil(Math.max(Math.abs(dx), Math.abs(dy)) / 6)), b = g.arena.bounds;
    for (let i = 0; i < n; i++) {
      const x = clamp(e.x + dx / n, b.x + e.r, b.x + b.w - e.r);
      if (e.flying || !g.arena.obstacles.some(o => circleRect(x, e.y, e.r, o))) e.x = x;
      const y = clamp(e.y + dy / n, b.y + e.r + (e === g.player ? Base.AIM_HEIGHT : 0), b.y + b.h - e.r);
      if (e.flying || !g.arena.obstacles.some(o => circleRect(e.x, y, e.r, o))) e.y = y;
    }
  }
  const visible = (g, a, b, padding = 0) => !g.arena.obstacles.some(o => segmentRect(a, b, o, padding) !== null);
  function route(g, e, p) {
    if (visible(g, e, p, e.r + 1)) return p;
    g.navigation ||= {};
    let graph = g.navigation[e.r];
    if (!graph) {
      const nodes = [], b = g.arena.bounds;
      for (const o of g.arena.obstacles) for (const x of [o.x - e.r - 8, o.x + o.w + e.r + 8]) for (const y of [o.y - e.r - 8, o.y + o.h + e.r + 8]) {
        if (x < b.x + e.r || x > b.x + b.w - e.r || y < b.y + e.r || y > b.y + b.h - e.r || g.arena.obstacles.some(o => circleRect(x, y, e.r + 1, o))) continue;
        nodes.push({ x, y });
      }
      const edges = nodes.map((a, i) => nodes.map((b, j) => i !== j && visible(g, a, b, e.r + 1) ? dist(a, b) : Infinity));
      graph = g.navigation[e.r] = { nodes, edges };
    }
    const { nodes, edges } = graph, costs = nodes.map(n => visible(g, n, p, e.r + 1) ? dist(n, p) : Infinity), next = nodes.map(() => -1), visited = new Set();
    for (let step = 0; step < nodes.length; step++) {
      let index = -1;
      for (let i = 0; i < nodes.length; i++) if (!visited.has(i) && (index < 0 || costs[i] < costs[index])) index = i;
      if (index < 0 || !Number.isFinite(costs[index])) break;
      visited.add(index);
      for (let i = 0; i < nodes.length; i++) if (costs[index] + edges[index][i] < costs[i]) { costs[i] = costs[index] + edges[index][i]; next[i] = index; }
    }
    let best = -1, score = Infinity;
    // Movement can end touching cover; a larger start-ray padding would trap that enemy.
    for (let i = 0; i < nodes.length; i++) if (visible(g, e, nodes[i], Math.max(0, e.r - .5)) && dist(e, nodes[i]) + costs[i] < score) { best = i; score = dist(e, nodes[i]) + costs[i]; }
    if (best < 0) return p;
    if (dist(e, nodes[best]) < 12 && next[best] >= 0) return nodes[next[best]];
    return nodes[best];
  }
  class Game extends Base.Game {
    reset() {
      super.reset();
      this.arenaId = this.arenaId || 'open'; this.arena = ARENAS[this.arenaId]; this.totalWaves = this.totalWaves || SURVIVAL_WAVES;
      Object.assign(this.player, this.arena.spawn); this.player.weapon = 'slingshot';
      this.ranks = {}; this.weaponLevels = Object.fromEntries(WEAPONS.map(w => [w.id, 1]));
      this.powers = {}; this.drops = []; this.clouds = []; this.flashes = []; this.corpses = []; this.hazards = []; this.attackCount = 0;
      this.navigation = {};
      this.wardCooldown = 0; this.regenClock = 0; this.shockClock = 0; this.bossesDefeated = 0; this.commitWeapon = null; this.xpFraction = 0;
      this.trophyBosses = 0;
      this.xpNeeded = xpForLevel(this.level);
      this.spawnInterval = .882; this.enemyLimit = 32; this.view = null;
      this.refreshStats();
    }
    start(options = {}) {
      this.arenaId = Object.hasOwn(ARENAS, options.arena) ? options.arena : this.arenaId || 'open';
      this.totalWaves = options.mode === 'run' ? 10 : options.mode === 'survival' ? SURVIVAL_WAVES : this.totalWaves || SURVIVAL_WAVES;
      this.reset(); this.refreshStats(); this.mode = 'playing'; this.beginWave();
    }
    rank(id) { return this.ranks[id] || 0; }
    active(id) { return (this.powers[id] || 0) > 0; }
    powerPool() { return Object.keys(POWERS); }
    normalInterval(rank = this.rank('rate')) {
      const w = weapon(this.player.weapon), low = this.player.hp < this.player.maxHp * .35 && this.rank('second');
      const boss = this.enemies.some(e => e.boss && !e.dead);
      return Math.max(.065, 1 / w.rate * .45, 1 / w.rate / 1.18 ** rank / (this.commitWeapon ? 1.2 : 1) / (low ? 1.12 : 1) / (boss && this.rank('courage') ? 1.12 : 1));
    }
    refreshStats() {
      const p = this.player, w = weapon(p.weapon), enhancement = 1 + .15 * (this.weaponLevels[w.id] - 1);
      this.enduranceBonus = this.totalWaves > 10 ? clamp(this.wave - 40 + (this.finishedWave ? 1 : 0), 0, 100) * .01 : 0;
      const boss = this.enemies.some(e => e.boss && !e.dead), low = p.hp < p.maxHp * .35 && this.rank('second');
      p.damage = w.damage * enhancement * 1.25 ** this.rank('damage') * (1 + .05 * this.trophyBosses) * (1 + this.enduranceBonus) *
        (this.commitWeapon ? 1.4 : 1) * (boss && this.rank('courage') ? 1.1 : 1) * (low ? 1.1 : 1) *
        (this.active('heavy') ? 2 : 1) * (this.active('evolution') ? 1.5 : 1) * (w.explosive ? 1 + .15 * this.rank('blast') : 1);
      p.interval = this.normalInterval();
      if (this.active('badman')) p.interval = Math.max(.03, p.interval / 2.25);
      p.speed = Math.min(400, (218 + 24 * this.rank('speed')) * (low ? 1.15 : 1) * (boss && this.rank('courage') ? 1.12 : 1));
    }
    beginWave() {
      this.wave++; this.finishedWave = false; this.breakTime = 0;
      const late = this.totalWaves > 10 ? Math.max(0, this.wave - 10) : 0;
      const count = Math.ceil((6 + Math.floor(this.wave * 1.25) + Math.ceil(late / 5)) * 1.1);
      this.spawnInterval = late ? Math.max(.1, .72 - .62 * late / 90) : Math.max(.32, .9 - .018 * this.wave);
      this.enemyLimit = 32 + Math.min(64, Math.floor(late * 64 / 90));
      this.queue = Array.from({ length: count }, (_, i) => this.wave < 3 ? i % 3 === 0 ? 'jaguar' : 'crab' : ['crab', 'jaguar', 'shadow'][i % 3]);
      if (this.wave >= 4) this.queue = this.queue.map((type, i) => i % 7 === 3 ? 'tommy' : this.wave >= 7 && i % 7 === 6 ? 'miniLlorona' : type);
      this.queue = this.queue.map((type, i) => i % 2 === 0 ? COMMONS[(Math.floor(i / 2) + this.wave - 1) % COMMONS.length] : type);
      this.alphaCount = 0;
      if (this.wave > 10 && [3, 6, 9].includes(this.wave % 10)) {
        const max = Math.min(4, Math.floor(this.wave / 10));
        this.alphaCount = this.wave % 10 === 3 ? max : 1 + Math.floor(this.random() * max);
        const offset = Math.floor(this.random() * ALPHAS.length);
        // Alphas replace ordinary slots so the existing wave and active-enemy budgets stay bounded.
        this.queue.splice(0, this.alphaCount, ...Array.from({ length: this.alphaCount }, (_, i) => ALPHAS[(offset + i) % ALPHAS.length]));
      }
      if (this.wave % 5 === 0) this.queue.unshift(BOSSES[(this.wave / 5 - 1) % BOSSES.length]);
      this.spawnTimer = 1.3; this.banner = 'Wave ' + this.wave + ' · ' + (this.wave % 5 === 0 ? 'A guardian approaches' : this.arena.name); this.bannerTime = 3;
      if (this.alphaCount) this.banner = 'Wave ' + this.wave + ' · ' + this.alphaCount + (this.alphaCount === 1 ? ' ALPHA approaches' : ' ALPHAS approach');
      for (const drop of this.drops) if (drop.kind === 'weapon') drop.life = 5;
      this.refreshStats();
      this.events.push({ type: 'wave' });
    }
    spawn(type) {
      const spec = TYPES[type], b = this.arena.bounds;
      for (let i = 0; i < 40; i++) {
        let point;
        if (this.arenaId === 'open') {
          const view = this.view, margin = spec.boss ? 120 : 70;
          // A clamped square camera can hide the normal ring near corners; widen later retries.
          const extra = view && i >= 20 ? Math.hypot(this.player.x - view.x - view.w / 2, this.player.y - view.y - view.h / 2) : 0;
          const angle = this.random() * Math.PI * 2, radius = 450 + this.random() * (400 + extra);
          point = { x: this.player.x + Math.cos(angle) * radius, y: this.player.y + Math.sin(angle) * radius };
          const entire = view && view.x <= b.x && view.y <= b.y && view.x + view.w >= b.x + b.w && view.y + view.h >= b.y + b.h;
          if (view && !entire && point.x > view.x - margin && point.x < view.x + view.w + margin && point.y > view.y - margin && point.y < view.y + view.h + margin) continue;
          if (point.x < b.x + spec.r + 8 || point.x > b.x + b.w - spec.r - 8 || point.y < b.y + spec.r + 8 || point.y > b.y + b.h - spec.r - 8) continue;
        } else {
          const side = Math.floor(this.random() * 4), t = .08 + this.random() * .84;
          point = { x: side < 2 ? b.x + b.w * t : b.x + (side === 2 ? spec.r + 8 : b.w - spec.r - 8), y: side >= 2 ? b.y + b.h * t : b.y + (side === 0 ? spec.r + 8 : b.h - spec.r - 8) };
        }
        if (dist(point, this.player) < 230 || this.arena.obstacles.some(o => circleRect(point.x, point.y, spec.r, o)) || this.enemies.some(e => dist(e, point) < e.r + spec.r + 6)) continue;
        const late = this.totalWaves > 10 ? Math.max(0, this.wave - 40) : 0, early = this.wave - late;
        const scale = spec.boss ? 1 + .035 * (early - 5) + .025 * late : 1 + .065 * (early - 1) + .03 * late;
        const damageScale = 1 + .012 * (early - 1) + .006 * late;
        this.enemies.push({ ...spec, ...point, hp: spec.hp * scale, maxHp: spec.hp * scale, speed: spec.speed * Math.min(1.4, 1 + .012 * (this.wave - 1)), damage: spec.damage * damageScale,
          shotScale: spec.boss && this.totalWaves > 10 && this.wave > 10 ? damageScale / 1.108 : 1,
          type, id: this.nextId++, warmup: spec.boss || spec.alpha ? 1.7 : .85, shotTimer: 2, hit: 0, routeTimer: 0, rushTimer: 3.2, rushTime: 0, rushWindup: 0, statuses: {}, action: 'move', actionTime: 0, attackTimer: 1 });
        return true;
      }
      return false;
    }
    compatible(perk) {
      const w = weapon(this.player.weapon);
      if ((w.explosive || w.cloud) && ['pierce', 'ricochet', 'poison', 'fire'].includes(perk.id)) return false;
      if (perk.tag && perk.tag !== 'boss' && !w.tags.includes(perk.tag)) return false;
      if (perk.id === 'homing' && w.homing && this.weaponLevels[w.id] === 4) return false;
      return true;
    }
    eligible(perk) {
      const w = weapon(this.player.weapon);
      if (!this.compatible(perk)) return false;
      if (this.rank(perk.id) >= perk.max) return false;
      if (perk.tag === 'boss') return this.wave >= 5;
      if (perk.id === 'commit') return this.wave >= 5 && !this.commitWeapon;
      if (perk.id === 'rate' && w.cloud) return this.normalInterval(this.rank('rate') + 1) < this.normalInterval() - .000001;
      if (perk.id === 'homing') return (w.homing ? FEATHER_HOMING[this.weaponLevels[w.id] - 1] : 0) + .55 * this.rank('homing') < Math.PI - .001;
      return true;
    }
    roll(pool, grandma = false) {
      const weights = grandma ? [0, 45, 40, 15] : this.wave <= 5 ? [50, 32, 15, 3] : this.wave <= 10 ? [42, 33, 20, 5] : this.wave <= 20 ? [33, 34, 26, 7] : [25, 35, 30, 10];
      const names = ['Common', 'Uncommon', 'Rare', 'Legendary'], candidates = pool.map(p => ({ p, weight: weights[names.indexOf(p.rarity)] / pool.filter(q => q.rarity === p.rarity).length })).filter(q => q.weight > 0);
      let value = this.random() * candidates.reduce((sum, q) => sum + q.weight, 0);
      for (const q of candidates) { value -= q.weight; if (value <= 0) return q.p; }
      return candidates.at(-1)?.p || pool[Math.floor(this.random() * pool.length)];
    }
    levelUp() {
      if (this.xp < this.xpNeeded) return false;
      this.xp -= this.xpNeeded; this.level++; this.xpNeeded = xpForLevel(this.level);
      let available = PERKS.filter(p => this.eligible(p)); this.choices = [];
      const n = this.rank('grandma') ? 4 : 3;
      for (let i = 0; i < n; i++) {
        if (!available.length && this.choices.length) break;
        let pool = i === 0 ? available.filter(p => !p.tag && ['Common', 'Uncommon'].includes(p.rarity)) : i === 1 ? available.filter(p => p.tag !== 'boss') : available;
        if (!pool.length) pool = available;
        let pick = pool.length ? this.roll(pool, i === 3) : { id: 'overflowHeal', name: 'Jungle Vitality', detail: '+5 permanent max HP · heal 25 HP · repeatable', max: 0, rarity: 'Common', icon: '♡' };
        this.choices.push({ ...pick, detail: pick.detail + (pick.max ? ' · Current ' + this.rank(pick.id) + '/' + pick.max + ' · +1 rank' : '') });
        available = available.filter(p => p.id !== pick.id);
      }
      this.mode = 'upgrade'; this.events.push({ type: 'level' }); return true;
    }
    choose(index) {
      if (this.mode !== 'upgrade' || !this.choices[index]) return false;
      const id = this.choices[index].id;
      if (id === 'overflowHeal') { this.player.maxHp += 5; this.player.hp = Math.min(this.player.maxHp, this.player.hp + 25); }
      else {
        const perk = PERKS.find(p => p.id === id); if (!perk || this.rank(id) >= perk.max) return false;
        this.ranks[id] = this.rank(id) + 1; this.upgrades.push(id);
        if (id === 'health') { this.player.maxHp += 25; this.player.hp = Math.min(this.player.maxHp, this.player.hp + 25); }
        if (id === 'commit') this.commitWeapon = this.player.weapon;
      }
      this.choices = []; this.mode = 'playing'; this.refreshStats();
      if (!this.levelUp() && this.rank('breathing')) { this.player.invincible = Math.max(this.player.invincible, 1.5); this.pulse(this.player, 140, 0, '#a5f2d3', true); }
      return true;
    }
    hurt(amount) {
      if (this.mode !== 'playing' || this.player.invincible > 0 || this.active('shield')) return;
      if (this.rank('ward') && this.wardCooldown <= 0) { this.wardCooldown = 30 - 5 * this.rank('ward'); this.flashes.push({ x: this.player.x, y: this.player.y, r: 40, life: .25, color: '#a5f2ff' }); return; }
      if (this.random() < .06 * this.rank('dodge')) return;
      super.hurt(amount * (1 - .08 * this.rank('armor')));
    }
    damageEnemy(e, amount, statuses = null, reducedXP = false) {
      if (e.dead || e.warmup > 0) return;
      e.hp -= amount * (e.boss ? 1 + .2 * this.rank('bossDamage') : 1); e.hit = .12;
      if (amount >= 1 && this.effects.length < 45) this.effects.push({ x: e.x, y: e.y - 40, text: Math.round(amount), color: '#fff2cb', life: .5 });
      if (statuses) for (const [id, dps] of Object.entries(statuses)) if (dps > 0) { e.statuses ||= {}; const prev = e.statuses[id]; e.statuses[id] = { dps: Math.max(dps, prev?.dps || 0), remaining: 3 }; }
      if (e.hp <= 0) this.defeat(e, reducedXP);
    }
    addDrop(id, x, y, kind = 'weapon', boss = false) {
      if (this.drops.length >= 24) { const old = this.drops.findIndex(d => !d.boss); if (old < 0 && !boss) return; this.drops.splice(Math.max(0, old), 1); }
      const bounds = this.arena.bounds;
      x = clamp(x, bounds.x + 12, bounds.x + bounds.w - 12); y = clamp(y, bounds.y + 12, bounds.y + bounds.h - 12);
      const drop = { id, x, y, kind, boss, life: kind === 'weapon' ? 5 : boss ? Infinity : 45 };
      this.drops.push(drop); return drop;
    }
    defeat(e, reducedXP = false) {
      if (e.dead) return;
      e.dead = true; this.kills++;
      if (e.attack || e.bossAI) {
        this.corpses.push({ type: e.type, form: e.form, x: e.x, y: e.y, r: e.r, height: e.height, dead: true, life: .6 });
        if (this.corpses.length > 16) this.corpses.shift();
      }
      this.gems.push({ x: e.x, y: e.y, value: e.xp * (reducedXP ? .45 : 1), age: 0 });
      this.events.push({ type: 'defeat', x: e.x, y: e.y, boss: e.boss });
      this.hazards = this.hazards.filter(h => h.owner !== e.id);
      if (e.boss) {
        this.bossesDefeated++; this.addDrop(WEAPONS[Math.floor(this.random() * WEAPONS.length)].id, e.x, e.y, 'weapon', true);
        if (this.rank('trophy')) { this.trophyBosses++; this.player.maxHp += 10; this.player.hp += 10; }
        if (this.rank('sacred')) { this.player.hp = Math.min(this.player.maxHp, this.player.hp + this.player.maxHp * .35); this.addDrop('evolution', e.x + 30, e.y, 'power', true); }
      } else if (this.random() < .035) {
        const pool = this.powerPool(); this.addDrop(pool[Math.floor(this.random() * pool.length)], e.x, e.y, 'power');
      }
      if (!e.boss && this.random() < MOB_WEAPON_CHANCE) this.addDrop(WEAPONS[Math.floor(this.random() * WEAPONS.length)].id, e.x, e.y - 20);
      const rhythm = this.rank('rhythm');
      if (rhythm && this.kills % (30 - 5 * rhythm) === 0) this.pendingRhythm = true;
    }
    pickup() {
      if (this.mode !== 'playing') return false;
      const drop = this.drops.filter(d => d.kind === 'weapon' && dist(d, this.player) <= 36).sort((a, b) => dist(a, this.player) - dist(b, this.player))[0];
      if (!drop || this.commitWeapon && drop.id !== this.commitWeapon) return false;
      this.drops.splice(this.drops.indexOf(drop), 1);
      if (drop.id === this.player.weapon) {
        if (this.weaponLevels[drop.id] < 4) this.weaponLevels[drop.id]++;
        else this.player.hp = Math.min(this.player.maxHp, this.player.hp + this.player.maxHp * .1);
      } else {
        const old = { ...this.player, r: 8 };
        move(this, old, -Math.cos(this.player.angle) * 55, -Math.sin(this.player.angle) * 55);
        this.addDrop(this.player.weapon, old.x, old.y);
        this.player.weapon = drop.id;
      }
      this.player.fireCooldown = 0; this.refreshStats(); this.banner = weapon(drop.id).name + ' · Rank ' + this.weaponLevels[drop.id]; this.bannerTime = 2;
      this.events.push({ type: 'weapon' }); return true;
    }
    collectStaff() { return false; }
    collectPower(id) {
      if (!POWERS[id]) return;
      if (id === 'bonusXP') this.gainXP(Math.round(this.xpNeeded * .5), false);
      else if (id === 'nuke') {
        for (const e of [...this.enemies]) if (!e.dead) { e.hp = 0; this.defeat(e, true); }
        this.enemies = []; this.bullets = this.bullets.filter(b => !b.hostile);
        this.flashes.push({ x: this.player.x, y: this.player.y, r: Math.hypot(this.arena.width, this.arena.height), kind: 'nuke', color: '#ffcf8f', life: .7 });
      } else this.powers[id] = POWERS[id].duration * (1 + .2 * this.rank('resonance'));
      if (id === 'shock') this.shockClock = 0;
      this.banner = POWERS[id].name + ' collected'; this.bannerTime = 2; this.refreshStats();
    }
    gainXP(value, gem = true) {
      this.xpFraction += value * (gem ? 1 + .2 * this.rank('xp') : 1) * (this.active('doubleXP') ? 2 : 1);
      const whole = Math.floor(this.xpFraction); this.xp += whole; this.xpFraction -= whole;
    }
    shot(x, y, angle, hostile, damage, speed = 735, extra = {}) {
      const budget = hostile ? 150 : 200;
      if (this.bullets.filter(b => b.hostile === hostile).length >= budget) {
        const expendable = !hostile && !extra.secondary ? this.bullets.findIndex(b => !b.hostile && b.secondary) : -1;
        if (expendable < 0) return false;
        this.bullets.splice(expendable, 1);
      }
      this.bullets.push({ x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, hostile, damage, kind: hostile ? 'spirit' : 'magic', life: hostile ? 5 : 1.7, r: 6, hitIds: new Set(), ...extra });
      return true;
    }
    pulse(center, radius, damage, color, knockback = false, arc = null) {
      this.flashes.push({ x: center.x, y: center.y, r: radius, color, life: .25, arc });
      for (const e of [...this.enemies]) {
        if (e.dead || dist(e, center) > radius + e.r || !visible(this, center, e, 0)) continue;
        if (arc !== null && Math.abs(Math.atan2(Math.sin(Math.atan2(e.y - center.y, e.x - center.x) - arc), Math.cos(Math.atan2(e.y - center.y, e.x - center.x) - arc))) > Math.PI * 70 / 360) continue;
        if (damage) this.damageEnemy(e, damage);
        if (knockback && !e.dead) { const angle = Math.atan2(e.y - center.y, e.x - center.x); move(this, e, Math.cos(angle) * 45, Math.sin(angle) * 45); }
      }
    }
    fire() {
      const p = this.player, w = weapon(p.weapon); this.attackCount++;
      const origin = Base.aimAt(p, {}), rank = this.weaponLevels[w.id];
      let damage = p.damage;
      if (!w.cloud) for (let i = 1; i <= this.rank('rate'); i++) if (this.normalInterval(i) >= this.normalInterval(i - 1) - .000001) damage *= 1.05;
      if (this.random() < Math.min(.5, .08 * this.rank('crit'))) damage *= 2;
      if (w.melee || w.pulse) this.pulse(w.melee ? origin : p, w.range + (this.weaponLevels[w.id] - 1) * 5, damage, w.color, w.pulse, w.melee ? p.angle : null);
      else {
        const launch = (angle, multiplier = 1, secondary = false) => this.shot(origin.x + Math.cos(angle) * 24, origin.y + Math.sin(angle) * 24, angle, false, damage * multiplier,
          w.speed * (1 + .2 * this.rank('harpy')), { kind: w.id === 'slingshot' ? 'stone' : 'magic', color: w.color, r: w.r, life: w.range * (1 + .1 * this.rank('harpy')) / (w.speed * (1 + .2 * this.rank('harpy'))),
            pierce: (w.pierce || 0) + this.rank('pierce') + (this.active('heavy') ? 2 : 0), bounces: Math.min(2, this.rank('ricochet')), ricochetBoost: this.rank('ricochet') > 2 ? 1.15 : 1, homing: Math.min(Math.PI, (w.homing ? FEATHER_HOMING[rank - 1] : 0) + .55 * this.rank('homing')), weapon: w.id,
            targetId: w.homing ? this.homingTarget(origin, angle)?.id : undefined, seekingRank: w.homing ? rank : 0,
            poison: (w.poison || 0) + 6 * this.rank('poison'), burn: this.random() < .15 * this.rank('fire') ? 10 * this.rank('fire') : 0,
            explosive: w.explosive, cloud: w.cloud, secondary });
        launch(p.angle);
        if (this.rank('overflow') && this.attackCount % (7 - this.rank('overflow')) === 0) launch(p.angle + .1, 1, true);
        if (this.random() < .08 * this.rank('duplicate')) launch(p.angle - .12, .6, true);
      }
      this.events.push({ type: 'shot' }); p.fireCooldown = p.interval;
    }
    explode(b) {
      const radius = Math.min(160, (100 + 10 * this.rank('damage')) * (1 + .25 * this.rank('blast')) * (this.active('evolution') ? 1.2 : 1));
      this.flashes.push({ x: b.x, y: b.y, r: radius, kind: 'explosion', color: '#ffc378', life: .5 });
      for (const e of [...this.enemies]) if (dist(e, b) <= radius && visible(this, b, e)) this.damageEnemy(e, b.damage * (1 - .5 * clamp((dist(e, b) - radius / 2) / (radius / 2), 0, 1)));
    }
    homingTarget(origin, angle, hitIds = new Set()) {
      return this.enemies.filter(e => !e.dead && e.warmup <= 0 && !hitIds.has(e.id) && visible(this, origin, e))
        .map(e => ({ e, delta: Math.atan2(Math.sin(Math.atan2(e.y - origin.y, e.x - origin.x) - angle), Math.cos(Math.atan2(e.y - origin.y, e.x - origin.x) - angle)) }))
        .filter(q => Math.abs(q.delta) <= Math.PI / 2)
        .sort((a, b) => Math.abs(a.delta) * dist(a.e, origin) - Math.abs(b.delta) * dist(b.e, origin) || dist(a.e, origin) - dist(b.e, origin))[0]?.e;
    }
    enemyTick(e, dt) {
      e.hit = Math.max(0, e.hit - dt);
      if (e.warmup > 0) { e.warmup -= dt; return; }
      for (const [id, s] of Object.entries(e.statuses || {})) {
        const applied = Math.min(dt, s.remaining); s.remaining -= dt;
        this.damageEnemy(e, s.dps * applied); if (s.remaining <= 0) delete e.statuses[id]; if (e.dead) return;
      }
      if (e.bossAI) { this.bossTick(e, this.active('freeze') ? dt * .5 : dt); return; }
      if (e.attack) { this.rosterTick(e, dt); return; }
      e.routeTimer -= dt;
      if (e.routeTimer <= 0) { e.waypoint = route(this, e, this.player); e.routeTimer = .25; }
      const target = e.waypoint || this.player, angle = Math.atan2(target.y - e.y, target.x - e.x), d = dist(e, this.player);
      let speed = e.speed * (e.slow || 1);
      e.slow = 1;
      if (this.active('freeze')) { if (!e.boss) return; speed *= .5; }
      if (['shadow', 'miniLlorona'].includes(e.type) && visible(this, e, this.player, 6)) speed *= d < 190 ? -.55 : d < 285 ? 0 : 1;
      if (['jaguarBoss', 'tommy'].includes(e.type)) {
        e.rushTimer -= dt;
        if (e.rushTime > 0) { move(this, e, Math.cos(e.rushAngle) * (e.type === 'tommy' ? 300 : 420) * dt, Math.sin(e.rushAngle) * (e.type === 'tommy' ? 300 : 420) * dt); e.rushTime -= dt; }
        else if (e.rushWindup > 0) { e.rushWindup -= dt; if (e.rushWindup <= 0) e.rushTime = e.type === 'tommy' ? .3 : .48; }
        else if (e.rushTimer <= 0) { e.rushAngle = Math.atan2(this.player.y - e.y, this.player.x - e.x); e.rushX = Math.cos(e.rushAngle); e.rushY = Math.sin(e.rushAngle); e.rushWindup = e.type === 'tommy' ? .5 : .65; e.rushTimer = e.type === 'tommy' ? 3.5 : e.hp < e.maxHp / 2 ? 2.5 : 3.6; }
        else move(this, e, Math.cos(angle) * speed * dt, Math.sin(angle) * speed * dt);
      } else move(this, e, Math.cos(angle) * speed * dt, Math.sin(angle) * speed * dt);
      if (dist(e, this.player) < e.r + this.player.r) this.hurt(e.damage);
      e.shotTimer -= dt; e.casting = e.rushWindup > 0 || e.shotTimer < .45 && (['shadow', 'miniLlorona'].includes(e.type) || e.boss);
      if (e.shotTimer > 0) return;
      const aim = Math.atan2(this.player.y - e.y, this.player.x - e.x);
      if (e.type === 'shadow' && visible(this, e, this.player, 6)) { this.shot(e.x, e.y, aim, true, e.damage, 205); e.shotTimer = 2.35; }
      if (e.type === 'miniLlorona' && visible(this, e, this.player, 6)) {
        for (const offset of [-.13, 0, .13]) this.shot(e.x, e.y, aim + offset, true, e.damage * .7, 190);
        e.shotTimer = 3.1;
      }
      if (e.type === 'duende') {
        const count = e.hp < e.maxHp / 2 ? 12 : 9;
        for (let i = 0; i < count; i++) this.shot(e.x, e.y, this.time * .23 + i * Math.PI * 2 / count, true, 65 * (e.shotScale || 1), 170);
        for (const a of [-.14, 0, .14]) this.shot(e.x, e.y, aim + a, true, 65 * (e.shotScale || 1), 225);
        e.shotTimer = e.hp < e.maxHp / 2 ? 1.8 : 2.55;
      }
      if (e.type === 'jaguarBoss') { for (const a of (e.hp < e.maxHp / 2 ? [-.3, -.15, 0, .15, .3] : [-.2, 0, .2])) this.shot(e.x, e.y, aim + a, true, 14 * (e.shotScale || 1), 245); e.shotTimer = e.hp < e.maxHp / 2 ? 1.8 : 2.8; }
    }
    rosterTick(e, dt) {
      if (this.active('freeze')) return;
      const p = this.player, d = dist(e, p);
      const speed = e.speed * (e.slow || 1); e.slow = 1;
      e.actionTime += dt; e.attackTimer -= dt;
      if (e.action === 'windup') {
        if (e.actionTime < e.windup) return;
        e.actionTime = 0;
        if (e.attack === 'pounce') e.action = 'active';
        else {
          e.action = 'recover';
          if (e.attack === 'shot') {
            if (visible(this, e, p)) this.shot(e.x, e.y, e.attackAngle, true, e.damage, 200, { color: '#bda5d9', r: 5 });
          } else {
            if (e.alpha) this.addArea(e, e.x, e.y, e.reach, 0, .35, '#f5a06c');
            if (d <= e.reach + p.r && visible(this, e, p)) this.hurt(e.damage);
          }
        }
        return;
      }
      if (e.action === 'active') {
        move(this, e, Math.cos(e.attackAngle) * e.rushSpeed * dt, Math.sin(e.attackAngle) * e.rushSpeed * dt);
        if (dist(e, p) < e.r + p.r && visible(this, e, p)) this.hurt(e.damage);
        if (e.actionTime >= e.rushDuration) { e.action = 'recover'; e.actionTime = 0; }
        return;
      }
      if (e.action === 'recover') {
        if (e.actionTime >= .45) { e.action = 'move'; e.actionTime = 0; }
        return;
      }
      if (e.attackTimer <= 0 && d <= e.reach + p.r && visible(this, e, p)) {
        e.action = 'windup'; e.actionTime = 0; e.attackTimer = e.cooldown;
        e.attackAngle = Math.atan2(p.y - e.y, p.x - e.x); return;
      }
      e.routeTimer -= dt;
      if (e.flying) e.waypoint = p;
      else if (e.routeTimer <= 0) { e.waypoint = route(this, e, p); e.routeTimer = .25; }
      const target = e.waypoint || p, angle = Math.atan2(target.y - e.y, target.x - e.x);
      if (e.attack !== 'shot' || d > 210 || !visible(this, e, p)) move(this, e, Math.cos(angle) * speed * dt, Math.sin(angle) * speed * dt);
    }
    addArea(owner, x, y, radius, delay, life, color) {
      if (this.hazards.length >= 24) return false;
      const b = this.arena.bounds;
      x = clamp(x, b.x + 1, b.x + b.w - 1); y = clamp(y, b.y + 1, b.y + b.h - 1);
      if (this.arena.obstacles.some(o => circleRect(x, y, 1, o))) return false;
      this.hazards.push({ owner: owner.id, boss: !!owner.boss, x, y, r: radius, delay, warning: delay, life, damage: owner.damage, color });
      return true;
    }
    tickAreas(dt) {
      for (const h of this.hazards) {
        if (!this.enemies.some(e => e.id === h.owner && !e.dead)) continue;
        const step = this.active('freeze') ? h.boss ? dt * .5 : 0 : dt;
        if (step <= 0) continue;
        const active = Math.max(0, step - Math.max(0, h.delay)); h.delay -= step;
        if (active > 0) {
          if (dist(h, this.player) <= h.r + this.player.r && visible(this, h, this.player)) this.hurt(h.damage);
          h.life -= active;
        }
      }
      this.hazards = this.hazards.filter(h => h.life > 0 && this.enemies.some(e => e.id === h.owner && !e.dead));
    }
    bossTick(e, dt) {
      const p = this.player;
      if (e.type === 'sochBoss' && !e.transformed && e.hp < e.maxHp * .25) {
        e.transformed = true; e.form = 'transform'; e.formTime = 0; e.action = 'move';
      }
      if (e.form === 'transform') {
        e.formTime += dt;
        if (e.formTime >= 1.2) { e.form = 'harpy'; e.attackTimer = .4; }
        return;
      }
      e.actionTime += dt; e.attackTimer -= dt;
      if (e.action === 'windup') {
        if (e.actionTime < e.skill.warning) return;
        e.actionTime = 0;
        if (e.skill.kind === 'rush') { e.action = 'active'; return; }
        if (e.skill.kind === 'fan') {
          const count = e.skill.count + (e.form === 'harpy' ? 2 : 0);
          for (let i = 0; i < count; i++) this.shot(e.x, e.y, e.attackAngle + (i - (count - 1) / 2) * e.skill.spread, true, e.damage * .65, e.skill.speed, { color: e.skill.color, r: e.type === 'maleSisimite' ? 9 : 5 });
        }
        e.action = 'recover'; return;
      }
      if (e.action === 'active') {
        move(this, e, Math.cos(e.attackAngle) * e.skill.speed * dt, Math.sin(e.attackAngle) * e.skill.speed * dt);
        if (dist(e, p) < e.r + p.r && visible(this, e, p)) this.hurt(e.damage);
        if (e.actionTime >= e.skill.duration) { e.action = 'recover'; e.actionTime = 0; }
        return;
      }
      if (e.action === 'recover') { if (e.actionTime >= .55) { e.action = 'move'; e.actionTime = 0; } return; }
      if (e.attackTimer <= 0 && visible(this, e, p)) {
        const skills = BOSS_SKILLS[e.type]; e.skill = skills[(e.skillIndex || 0) % skills.length]; e.skillIndex = (e.skillIndex || 0) + 1;
        e.action = 'windup'; e.actionTime = 0; e.attackAngle = Math.atan2(p.y - e.y, p.x - e.x); e.attackTimer = e.form === 'harpy' ? 2 : 3;
        if (e.skill.kind === 'area') for (let i = 0; i < e.skill.count; i++) {
          const offset = (i - (e.skill.count - 1) / 2) * e.skill.radius * 1.7;
          this.addArea(e, e.skill.self ? e.x : p.x + Math.cos(e.attackAngle + Math.PI / 2) * offset,
            e.skill.self ? e.y : p.y + Math.sin(e.attackAngle + Math.PI / 2) * offset,
            e.skill.radius, e.skill.warning + dt, e.skill.life, e.skill.color);
        }
        return;
      }
      if (dist(e, p) > 190 || e.type === 'cadejoBoss' || e.type === 'maleSisimite') {
        e.routeTimer -= dt;
        if (e.routeTimer <= 0) { e.waypoint = e.flying ? p : route(this, e, p); e.routeTimer = .25; }
        const point = e.waypoint || p, angle = Math.atan2(point.y - e.y, point.x - e.x);
        move(this, e, Math.cos(angle) * e.speed * (e.slow || 1) * dt, Math.sin(angle) * e.speed * (e.slow || 1) * dt);
      }
      e.slow = 1;
      if (dist(e, p) < e.r + p.r) this.hurt(e.damage);
    }
    tick(dt, input) {
      this.time += dt; this.bannerTime = Math.max(0, this.bannerTime - dt);
      this.corpses = this.corpses.filter(e => { e.life -= dt; return e.life > 0; });
      const p = this.player; p.invincible = Math.max(0, p.invincible - dt); p.dashCooldown = Math.max(0, p.dashCooldown - dt); p.fireCooldown -= dt;
      this.wardCooldown = Math.max(0, this.wardCooldown - dt);
      for (const id of Object.keys(this.powers)) { this.powers[id] -= dt; if (this.powers[id] <= 0) delete this.powers[id]; }
      this.regenClock += dt; if (this.regenClock >= 4) { p.hp = Math.min(p.maxHp, p.hp + this.rank('regen')); this.regenClock -= 4; }
      this.refreshStats();
      const len = Math.hypot(input.dx || 0, input.dy || 0); p.walking = len > 0;
      if (p.dashTime > 0) { move(this, p, p.dashX * 940 * dt, p.dashY * 940 * dt); p.dashTime -= dt; }
      else move(this, p, len ? (input.dx || 0) / len * p.speed * dt : 0, len ? (input.dy || 0) / len * p.speed * dt : 0);
      Base.aimAt(p, input);
      if (input.shooting && p.fireCooldown <= 0) this.fire();
      if (this.breakTime > 0) { this.breakTime -= dt; if (this.breakTime <= 0) this.beginWave(); }
      else if (this.queue.length && this.enemies.length < this.enemyLimit) {
        this.spawnTimer -= dt;
        let attempts = 0;
        while (this.spawnTimer <= 1e-8 && this.queue.length && this.enemies.length < this.enemyLimit && attempts++ < 4) {
          if (!this.spawn(this.queue[0])) { this.spawnTimer = Math.min(.2, this.spawnInterval); break; }
          this.queue.shift(); this.spawnTimer += this.spawnInterval;
        }
      }
      const enemyDt = dt * (this.active('reflex') ? .5 : 1);
      for (const e of this.enemies) { if (!e.dead) this.enemyTick(e, enemyDt); if (this.mode !== 'playing') return; }
      this.tickAreas(enemyDt); if (this.mode !== 'playing') return;
      for (let i = 0; i < this.enemies.length; i++) for (let j = i + 1; j < this.enemies.length; j++) {
        const a = this.enemies[i], b = this.enemies[j], d = dist(a, b), min = a.r + b.r;
        if (a.dead || b.dead || a.warmup > 0 || b.warmup > 0 || d >= min) continue;
        const angle = d > .01 ? Math.atan2(b.y - a.y, b.x - a.x) : 0, push = Math.min((min - d) / 2, 60 * dt);
        move(this, a, -Math.cos(angle) * push, -Math.sin(angle) * push); move(this, b, Math.cos(angle) * push, Math.sin(angle) * push);
      }
      for (const b of this.bullets) {
        const step = Math.min(b.life, b.hostile ? enemyDt : dt);
        if (b.homing && !b.hostile) {
          const target = this.enemies.find(e => e.id === b.targetId && !e.dead && e.warmup <= 0 && !b.hitIds.has(e.id) && visible(this, b, e)) || this.homingTarget(b, Math.atan2(b.vy, b.vx), b.hitIds);
          if (target) {
            b.targetId = target.id;
            const a = Math.atan2(b.vy, b.vx), wanted = Math.atan2(target.y - b.y, target.x - b.x), delta = Math.atan2(Math.sin(wanted - a), Math.cos(wanted - a));
            const turn = clamp(delta, -b.homing * dt, b.homing * dt);
            b.speed ||= Math.hypot(b.vx, b.vy);
            const speed = b.seekingRank === 4 && Math.abs(delta) > .2 ? Math.min(b.speed, Math.max(180, dist(b, target) * Math.PI * .7)) : b.speed;
            b.vx = Math.cos(a + turn) * speed; b.vy = Math.sin(a + turn) * speed;
          }
        }
        const start = { x: b.x, y: b.y }, end = { x: b.x + b.vx * step, y: b.y + b.vy * step };
        let wallT = Infinity;
        for (const o of this.arena.obstacles) { const t = segmentRect(start, end, o, b.r); if (t !== null) wallT = Math.min(wallT, t); }
        const bounds = this.arena.bounds;
        for (const [key, size] of [['x', 'w'], ['y', 'h']]) {
          const lo = bounds[key] + b.r, hi = bounds[key] + bounds[size] - b.r, delta = end[key] - start[key];
          if (end[key] < lo || end[key] > hi) wallT = Math.min(wallT, delta ? clamp(((delta > 0 ? hi : lo) - start[key]) / delta, 0, 1) : 0);
        }
        const hits = (b.hostile ? [p] : this.enemies).filter(e => !e.dead && !(e.warmup > 0) && !b.hitIds.has(e.id)).map(e => ({ e, t: segmentCircle(start, end, { ...e, r: e.r + b.r }) })).filter(h => h.t !== null && h.t < wallT).sort((a, e) => a.t - e.t);
        b.x = end.x; b.y = end.y; b.life -= step;
        let stoppedAtHit = false;
        for (const hit of hits) {
          if (b.hostile) { this.hurt(b.damage); b.life = 0; stoppedAtHit = true; break; }
          b.hitIds.add(hit.e.id);
          if (b.explosive || b.cloud) { b.x = start.x + (end.x - start.x) * hit.t; b.y = start.y + (end.y - start.y) * hit.t; b.life = 0; stoppedAtHit = true; break; }
          this.damageEnemy(hit.e, b.damage, { poison: b.poison || 0, burn: b.burn || 0 });
          if (b.pierce > 0) { b.pierce--; b.damage *= .85; continue; }
          if (b.bounces > 0) {
            const next = this.enemies.filter(e => !e.dead && e.warmup <= 0 && !b.hitIds.has(e.id) && visible(this, hit.e, e)).sort((a, e) => dist(a, hit.e) - dist(e, hit.e))[0];
            if (next) { const a = Math.atan2(next.y - hit.e.y, next.x - hit.e.x), speed = Math.hypot(b.vx, b.vy); b.vx = Math.cos(a) * speed; b.vy = Math.sin(a) * speed; b.bounces--; b.damage *= .85 * (b.ricochetBoost || 1); b.ricochetBoost = 1; b.x = hit.e.x; b.y = hit.e.y; stoppedAtHit = true; break; }
          }
          b.life = 0; stoppedAtHit = true; break;
        }
        if (!stoppedAtHit && wallT < Infinity) { b.x = start.x + (end.x - start.x) * wallT; b.y = start.y + (end.y - start.y) * wallT; b.life = 0; }
        if (b.x < bounds.x + b.r || b.x > bounds.x + bounds.w - b.r || b.y < bounds.y + b.r || b.y > bounds.y + bounds.h - b.r) {
          b.x = clamp(b.x, bounds.x + b.r, bounds.x + bounds.w - b.r); b.y = clamp(b.y, bounds.y + b.r, bounds.y + bounds.h - b.r); b.life = 0;
        }
        if (b.life <= 0 && !b.hostile) {
          if (b.explosive) this.explode(b);
          if (b.cloud && this.clouds.length < 12) this.clouds.push({ x: b.x, y: b.y, r: 55, life: 2.5 + .3 * (this.weaponLevels.cacao - 1), damage: b.damage, color: '#c49d7f' });
        }
        if (this.mode !== 'playing') return;
      }
      this.bullets = this.bullets.filter(b => b.life > 0);
      for (const c of this.clouds) c.life -= dt;
      for (const e of this.enemies) {
        const clouds = this.clouds.filter(c => c.life > 0 && dist(c, e) < c.r && visible(this, c, e));
        if (clouds.length) { e.slow = e.boss ? .9 : .8; this.damageEnemy(e, Math.max(...clouds.map(c => c.damage)) * dt); }
      }
      this.clouds = this.clouds.filter(c => c.life > 0);
      this.shockClock -= dt;
      if (this.active('shock') && this.shockClock <= 0) {
        this.shockClock = .5;
        const origin = Base.aimAt(p, {});
        const linked = [], first = this.enemies.filter(e => !e.dead && e.warmup <= 0 && dist(e, origin) < 250 && visible(this, origin, e)).sort((a, b) => dist(a, origin) - dist(b, origin))[0];
        if (first) linked.push(first);
        while (linked.length && linked.length < 16) {
          const last = linked.at(-1), next = this.enemies.filter(e => !e.dead && e.warmup <= 0 && !linked.includes(e) && dist(e, last) <= 130 && visible(this, last, e)).sort((a, b) => dist(a, last) - dist(b, last))[0];
          if (!next) break; linked.push(next);
        }
        if (linked.length) this.flashes.push({ ...origin, r: 0, kind: 'shock', points: [origin, ...linked.map(e => ({ x: e.x, y: e.y }))], life: .25, color: '#a4bdff' });
        for (const e of linked) { this.flashes.push({ x: e.x, y: e.y, r: 22, life: .2, color: '#a4bdff' }); this.damageEnemy(e, 30); }
      }
      if (this.pendingRhythm) { this.pendingRhythm = false; this.pulse(p, 190, p.damage * .6, '#ffe2a1', true); }
      this.enemies = this.enemies.filter(e => !e.dead);
      for (const gem of this.gems) {
        gem.age += dt; const d = dist(gem, p);
        if (d < 115 + 45 * this.rank('magnet') || this.finishedWave) { const pull = Math.min(d, (this.finishedWave ? 600 : 330) * dt); if (d > .01) { gem.x += (p.x - gem.x) / d * pull; gem.y += (p.y - gem.y) / d * pull; } }
        if (dist(gem, p) < 22) { this.gainXP(gem.value); gem.collected = true; this.events.push({ type: 'gem' }); }
      }
      this.gems = this.gems.filter(g => !g.collected);
      for (const d of this.drops) { if (d.kind !== 'weapon' || !this.finishedWave) d.life -= dt; if (d.kind === 'power' && dist(d, p) < 26) { d.life = 0; this.collectPower(d.id); } }
      this.drops = this.drops.filter(d => d.life > 0);
      this.flashes = this.flashes.filter(f => { f.life -= dt; return f.life > 0; }).slice(-60);
      this.effects = this.effects.filter(e => { e.life -= dt; e.y -= dt * 22; return e.life > 0; }).slice(-45);
      if (this.levelUp()) return;
      if (!this.queue.length && !this.enemies.length && !this.finishedWave && this.breakTime <= 0) {
        this.finishedWave = true; this.bullets = [];
        this.refreshStats();
        if (this.wave === this.totalWaves) { this.mode = 'victory'; this.events.push({ type: 'end' }); return; }
        p.hp = Math.min(p.maxHp, p.hp + 15 + 10 * this.rank('recovery'));
        if (this.wave % 2 === 0) { const pool = this.powerPool(); this.addDrop(pool[Math.floor(this.wave / 2 - 1) % pool.length], p.x - 30, p.y, 'power'); }
        this.breakTime = 4; this.banner = 'Wave cleared · +15 HP · Collect drops before moving on'; this.bannerTime = 4;
      }
    }
  }
  const api = { Game, W, H, SURVIVAL_WAVES, ARENAS, TYPES, COMMONS, ALPHAS, BOSSES, MOB_WEAPON_CHANCE, WEAPONS, PERKS, POWERS, weapon, xpForLevel, move, visible };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.SurvivalCore = api;
})(typeof window !== 'undefined' ? window : globalThis);

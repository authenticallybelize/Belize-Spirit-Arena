const assert = require('node:assert/strict');
const { Game, TYPES, PERKS, WEAPONS, POWERS, xpForLevel } = require('../survival.js');
const Base = require('../core.js');
const oldHP = { crab: 42, jaguar: 25, shadow: 48, duende: 1050, jaguarBoss: 2400, tommy: 52, miniLlorona: 58, spiderling: 24, worker: 36, bees: 28, rootling: 42, owlShade: 30, alphaCrab: 168, alphaJaguar: 100, shadowBrute: 192 };
const oldCaps = { damage: 5, rate: 5, speed: 5, health: 5, harpy: 4, magnet: 4, xp: 5, armor: 4, dodge: 4, crit: 4, regen: 4, recovery: 3, second: 1, duplicate: 3, resonance: 3, rhythm: 3, breathing: 1, pierce: 3, ricochet: 2, overflow: 3, blast: 4, poison: 3, fire: 3, homing: 3, ward: 3, bossDamage: 3, courage: 1, trophy: 1, sacred: 1, grandma: 1, commit: 1 };
const near = (actual, expected) => assert(Math.abs(actual - expected) < 1e-7, actual + ' != ' + expected);
const seeded = seed => () => ((seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 4294967296);
function playing(weapon = 'slingshot') { const g = new Game(seeded(7)); g.start({ mode: 'survival' }); g.player.weapon = weapon; g.refreshStats(); g.queue = ['crab']; g.spawnTimer = 999; return g; }
for (const [id, hp] of Object.entries(oldHP)) near(TYPES[id].hp, hp * 1.15 * (TYPES[id].alpha ? 1.5 : id === 'duende' ? 5 : 1));
assert.equal(Base.TYPES.crab.hp, 42); assert.equal(Base.TYPES.duende.hp, 1050, 'Survival mutated Story/classic stats');
for (const p of PERKS) assert.equal(p.max, oldCaps[p.id] === 1 ? 1 : oldCaps[p.id] + 2, p.id);
assert.equal(PERKS.filter(p => p.max === 1).length, 7); assert.equal(PERKS.length, 31);
for (let level = 1; level <= 200; level++) {
  assert(Number.isInteger(xpForLevel(level))); assert(xpForLevel(level + 1) > xpForLevel(level));
  if (level > 1) assert(xpForLevel(level + 1) - xpForLevel(level) >= xpForLevel(level) - xpForLevel(level - 1));
}
const g = playing(); g.level = 39; g.xpNeeded = xpForLevel(g.level);
g.collectPower('doubleXP'); g.gainXP(3); assert.equal(g.xp, 6);
g.xp = g.xpNeeded + xpForLevel(40) + xpForLevel(41) + 17;
assert(g.levelUp()); assert.equal(g.level, 40); assert(g.active('doubleXP'));
assert(g.choose(0)); assert.equal(g.level, 41); assert(g.choose(0)); assert.equal(g.level, 42);
assert(g.choose(0)); assert.equal(g.mode, 'playing'); assert.equal(g.xp, 17);
for (const level of [40, 80, 150]) {
  const late = playing(); late.level = level; late.xpNeeded = xpForLevel(level);
  late.gainXP(11); assert.equal(late.xp, 11);
  late.collectPower('bonusXP'); assert(late.xp > 11); assert.equal(late.powerPool().length, Object.keys(POWERS).length);
  late.defeat({ x: 1000, y: 1000, xp: 5, type: 'crab' }); assert.equal(late.gems.length, 1);
}
const full = playing(); for (const p of PERKS) full.ranks[p.id] = p.max;
for (let i = 0; i < 4; i++) {
  full.xp = full.xpNeeded; assert(full.levelUp()); assert.equal(full.choices.length, 1);
  assert.equal(full.choices[0].id, 'overflowHeal'); const hp = full.player.maxHp;
  full.player.hp = hp; assert(full.choose(0)); assert.equal(full.player.maxHp, hp + 5); assert.equal(full.player.hp, hp + 5);
}
for (const w of WEAPONS) {
  const rate = playing(w.id); rate.ranks.rate = 5; rate.refreshStats();
  const fifthInterval = rate.player.interval; rate.fire(); const fifthDamage = rate.bullets[0]?.damage;
  rate.bullets = []; rate.flashes = []; rate.ranks.rate = 6; rate.refreshStats(); rate.fire();
  near(rate.player.interval, fifthInterval);
  if (w.cloud) { assert(!rate.eligible(PERKS.find(p => p.id === 'rate'))); near(rate.bullets[0].damage, fifthDamage); }
  else if (!w.melee && !w.pulse) near(rate.bullets[0].damage, fifthDamage * 1.05);
}
const ricochet = playing(); ricochet.player.angle = 0; ricochet.ranks.ricochet = 3; ricochet.fire();
assert.equal(ricochet.bullets[0].bounces, 2); assert.equal(ricochet.bullets[0].ricochetBoost, 1.15);
const first = { ...TYPES.crab, id: 1, x: 1300, y: ricochet.player.y - Base.AIM_HEIGHT, r: 12, hp: 1000, maxHp: 1000, warmup: 0, type: 'crab', statuses: {}, speed: 0, shotTimer: 999, routeTimer: 999 };
const second = { ...first, id: 2, x: 1400 }; const third = { ...first, id: 3, x: 1500 };
ricochet.enemies = [first, second, third]; const shot = ricochet.bullets[0], damage = shot.damage;
for (let i = 0; i < 90; i++) ricochet.update(1 / 120);
near(1000 - first.hp, damage); near(1000 - second.hp, damage * .85 * 1.15); near(1000 - third.hp, damage * .85 ** 2 * 1.15);
for (const weapon of ['claw', 'cohune']) {
  const late = playing(weapon); late.wave = 130;
  for (let i = 0; i < 200; i++) { late.xp = late.xpNeeded; assert(late.levelUp()); assert(late.choices.length); assert(late.choices.every(p => p.id === 'overflowHeal' || late.eligible(p))); assert(late.choose(0)); }
  assert.equal(late.level, 201, 'A late build stopped offering useful upgrades');
}
console.log('PASS: expanded stack caps/unique preservation, all HP multipliers, accelerating XP beyond level 200, XP powers/gems, queued upgrades, repeatable permanent vitality, bounded final-rank fire/ricochet bonuses.');

// Nuke clears crowd pressure but cannot skip a full-health elite encounter or farm its reward.
const blast = playing(); blast.wave = 199; blast.beginWave(); blast.level = 40; blast.ranks.bossDamage = 5;
for (const type of ['crab', 'alphaCrab', 'duende']) assert(blast.spawn(type));
const [mob, alpha, guardian] = blast.enemies, alphaHP = alpha.maxHp, guardianHP = guardian.maxHp, queue = [...blast.queue];
blast.shot(blast.player.x, blast.player.y, 0, true, 20); blast.addArea(guardian, blast.player.x, blast.player.y, 100, 0, 5, '#ffffff');
blast.collectPower('nuke');
assert(mob.dead); near(alpha.hp, alphaHP * .5); near(guardian.hp, guardianHP * .8);
assert.equal(blast.bossesDefeated, 0); assert(!blast.drops.some(d => d.boss));
assert.equal(blast.hazards.length, 0); assert(!blast.bullets.some(b => b.hostile)); assert.deepEqual(blast.queue, queue);
blast.collectPower('nuke'); assert(alpha.dead); assert(!guardian.dead);
for (let i = 0; i < 3; i++) blast.collectPower('nuke');
assert(guardian.dead, 'Five Nukes should remove one full boss health bar'); assert.equal(blast.bossesDefeated, 1); assert.equal(blast.drops.filter(d => d.boss).length, 1);

// Selecting an upgrade gives time to return from the card UI; the protection expires.
const grace = playing(); grace.mode = 'upgrade'; grace.choices = [PERKS.find(p => p.id === 'damage')];
assert(grace.choose(0)); grace.hurt(20); assert.equal(grace.player.hp, 100);
for (let i = 0; i < 4; i++) grace.update(.25);
grace.hurt(20); assert.equal(grace.player.hp, 80);
const breathing = playing(); breathing.mode = 'upgrade'; breathing.choices = [PERKS.find(p => p.id === 'breathing')];
assert(breathing.choose(0)); assert.equal(breathing.player.invincible, 1.5);
console.log('PASS: Nuke elite damage/rewards and crowd/shot/hazard clearance; upgrade protection expires and Breathing Room stays stronger.');

// Buff the requested hits; firing cadence, ranks and Joe's projectiles retain their rules.
const Run = require('../survival.js');
near(Run.POWER_DROP_CHANCE, .04025);
for (const [id, damage] of [['spear', 115], ['staff', 45.4]]) {
  const g = playing(id); near(g.player.damage, damage); g.fire(); near(g.bullets[0].damage, damage);
  g.weaponLevels[id] = 6; g.refreshStats(); near(g.player.damage, damage * 1.75);
}
for (const chance of [.035, .040249999, .04025, .999]) {
  const g = playing(), rolls = [chance, .5, .999]; g.random = () => rolls.shift();
  g.defeat({ type: 'crab', x: 100, y: 100, xp: 5 });
  assert.equal(g.drops.some(d => d.kind === 'power'), chance < .04025);
}
for (const speed of [170, 190, 205, 235, 245, 265, 470]) {
  const g = playing(); g.shot(600, 600, .7, true, 10, speed); g.shot(600, 600, .7, false, 10, speed);
  near(Math.hypot(g.bullets[0].vx, g.bullets[0].vy), speed * .85);
  near(Math.hypot(g.bullets[1].vx, g.bullets[1].vy), speed);
}
console.log('PASS: +15 spear/staff hit damage through VI, exact 15%-relative power-drop boundary and 15% slower hostile projectiles.');

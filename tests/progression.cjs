const assert = require('node:assert/strict');
const { Game, TYPES, ALPHAS, BOSSES, WEAPONS, WEAPON_RANKS, MAX_WEAPON_RANK, PERKS, xpForLevel } = require('../survival.js');
const Story = require('../story-campaign.js');
const seeded = seed => () => ((seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 4294967296);
const near = (a, b, message) => assert(Math.abs(a - b) < Math.max(1e-7, Math.abs(b) * 1e-10), message || `${a} != ${b}`);
function game(level = 1, wave = 23) {
  const g = new Game(seeded(71)); g.start({ mode: 'survival' });
  g.level = level; g.wave = wave - 1; g.enemies = []; g.beginWave(); g.spawnTimer = 999; return g;
}
// Compare the same wave at both sides of every milestone; wave scaling stays independent.
for (const [level, factor, rate] of [[1,1,1], [9,1,1], [10,2,1.5], [19,2,1.5], [20,4,2.25], [29,4,2.25], [30,8,3.375], [40,16,5.0625]]) {
  const g = game(level), baseline = game();
  const ordinary = baseline.queue.filter(id => !TYPES[id].boss && !TYPES[id].alpha).length;
  const specials = baseline.queue.length - ordinary;
  assert.equal(g.queuedEnemies(), ordinary * Math.min(8, factor) + specials);
  assert.equal(g.queue.length, baseline.queue.length, 'Expanded waves must remain compact in memory');
  assert.equal(g.alphaCount, baseline.alphaCount); near(g.spawnInterval, baseline.spawnInterval / rate);
  for (const type of ['crab', 'shadow', 'tommy', 'miniLlorona', 'grasshopper', 'corruptedHen', 'corruptedGrackle', 'corruptedMonkey', 'corruptedToad', ...ALPHAS, ...BOSSES]) {
    const a = game(level), b = game(); assert(a.spawn(type)); assert(b.spawn(type));
    const scaled = a.enemies[0], original = b.enemies[0], normal = !scaled.boss && !scaled.alpha;
    near(scaled.maxHp, original.maxHp * factor, type + ' HP');
    near(scaled.damage, original.damage * (normal ? factor : 1), type + ' damage');
    near(scaled.speed, normal ? Math.min(300, original.speed * factor) : original.speed, type + ' speed');
    near(scaled.attackScale || 1, normal ? Math.min(2, factor) : 1);
    if (normal && scaled.windup) assert(scaled.windup / scaled.attackScale >= .25);
    assert.equal(scaled.r, original.r); assert.equal(scaled.xp, original.xp);
  }
}
const active = game(9); assert(active.spawn('corruptedHen')); assert(active.spawn('alphaCrab')); assert(active.spawn('duende'));
const before = active.enemies.map(e => { e.hp = e.maxHp * .35; return { hp: e.hp, maxHp: e.maxHp, speed: e.speed, damage: e.damage }; });
active.xpNeeded = xpForLevel(9); active.xp = active.xpNeeded; assert(active.levelUp()); assert.equal(active.level, 10);
active.enemies.forEach((e, i) => { near(e.hp, before[i].hp * 2); near(e.hp / e.maxHp, .35); near(e.speed, before[i].speed * (i ? 1 : 2)); near(e.damage, before[i].damage * (i ? 1 : 2)); });
const hp = active.enemies[0].hp; active.syncDifficulty(); assert.equal(active.enemies[0].hp, hp, 'Sync compounded the same tier twice');
assert.equal(active.waveMobMultiplier, 1, 'A level-up changed an already scheduled wave population');
active.enemies = []; active.beginWave(); assert.equal(active.waveMobMultiplier, 2);
// All repeated ordinary spawns must actually arrive, and the single boss must stay single.
const repeated = game(20, 5); repeated.queue = ['corruptedHen', 'corruptedMonkey', 'lloronaBoss']; repeated.spawnTimer = 0; repeated.powers.freeze = 100;
const count = repeated.queuedEnemies(); assert.equal(count, 9);
for (let i = 0; i < 1200 && repeated.queue.length; i++) repeated.update(1 / 120);
assert.equal(repeated.queue.length, 0); assert.equal(repeated.enemies.length, count);
assert.equal(repeated.enemies.filter(e => e.boss).length, 1);
// New regular attacks complete their warnings in half the time at level ten.
for (const type of ['corruptedHen', 'corruptedMonkey', 'grasshopper', 'corruptedToad']) {
  const g = game(10); assert(g.spawn(type)); const e = g.enemies[0];
  Object.assign(e, { x: g.player.x - 25, y: g.player.y, warmup: 0, attackTimer: 0, speed: 0 });
  g.enemyTick(e, 1 / 120); assert.equal(e.action, 'windup');
  g.enemyTick(e, e.windup / 2 - .001); assert.equal(e.action, 'windup');
  g.enemyTick(e, .002); assert.notEqual(e.action, 'windup');
  if (e.attack === 'shot') { assert.equal(g.bullets.length, 1); near(Math.hypot(g.bullets[0].vx, g.bullets[0].vy), TYPES[type].shotSpeed * 2); }
}
const eggs = game(20); assert(eggs.spawn('voidEgg')); const egg = eggs.enemies[0]; egg.warmup = 0; egg.summonXP = 9;
eggs.enemyTick(egg, 5); assert.equal(egg.type, 'nightHatchling'); near(egg.speed, 300); near(egg.damage, TYPES.nightHatchling.damage * 4); assert.equal(egg.xp, 9); assert.equal(egg.attackScale, 2);
// High XP levels retain bounded pressure without allocating exponential arrays.
const large = game(200, 100); assert(large.queue.length < 250); assert.equal(large.queuedEnemies(), 1313); assert.equal(large.enemyLimit, 96);
assert.equal(large.difficultyTier(), 4); assert.equal(large.waveMobMultiplier, 8);
const capped = game(40, 100); near(large.spawnInterval, capped.spawnInterval);
for (const type of ['jaguar', 'corruptedMonkey', 'nightHatchling', 'alphaCrab', 'duende']) {
  large.enemies = []; capped.enemies = []; assert(large.spawn(type)); assert(capped.spawn(type));
  for (const field of ['hp', 'maxHp', 'damage', 'speed']) near(large.enemies[0][field], capped.enemies[0][field]);
}
assert.equal(MAX_WEAPON_RANK, 6); assert.equal(WEAPON_RANKS.at(-1), 'VI');
for (const w of WEAPONS) {
  const g = game(); g.player.weapon = w.id; g.refreshStats(); const base = g.player.damage;
  for (let rank = 2; rank <= 6; rank++) {
    g.addDrop(w.id, g.player.x, g.player.y); assert(g.pickup()); assert.equal(g.weaponLevels[w.id], rank);
    near(g.player.damage, base * (1 + .15 * (rank - 1)));
    g.bullets = []; g.fire(); assert(g.bullets.every(b => Number.isFinite(b.homing + b.damage)));
  }
  g.player.hp = 50; g.addDrop(w.id, g.player.x, g.player.y); assert(g.pickup()); assert.equal(g.weaponLevels[w.id], 6); assert.equal(g.player.hp, 60);
}
const ricochet = game(); ricochet.ranks.ricochet = 4; ricochet.fire(); near(ricochet.bullets[0].ricochetBoost, 1.3); assert.equal(ricochet.bullets[0].bounces, 2);
const ward = game(); ward.ranks.ward = PERKS.find(p => p.id === 'ward').max; ward.hurt(10); assert.equal(ward.wardCooldown, 5);
// Story keeps authored encounter pressure and can round-trip the newly valid weapon ranks.
const storage = { value: null, getItem() { return this.value; }, setItem(_, value) { this.value = value; } };
const story = new Story.Game(seeded(3)), store = new Story.Store(storage); story.startStory(store); story.level = 20;
assert.equal(story.difficultyTier(), 0); story.weaponLevels.slingshot = 6; assert(store.checkpoint(story));
const restored = new Story.Store(storage); assert(!restored.readOnly); assert.equal(restored.data.checkpoint.weaponLevels.slingshot, 6);
console.log('PASS: exact XP-decade thresholds, bounded ordinary stats/population/1.5x cadence, HP-only alphas/bosses, wounded-enemy transitions, lazy repeated spawns, attack clocks, hatch scaling, all twelve VI caps and healing, useful extra perk ranks, Story save compatibility.');

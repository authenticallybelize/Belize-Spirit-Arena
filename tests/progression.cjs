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
for (const [level, factor, movement, rate] of [[1,1,1,1], [9,1,1,1], [10,2,1.2,1.5], [19,2,1.2,1.5], [20,4,1.44,2.25], [29,4,1.44,2.25], [30,8,1.728,3.375], [40,16,2.0736,5.0625]]) {
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
    near(scaled.speed, original.speed * (normal ? movement : 1), type + ' intended speed');
    near(scaled.attackScale || 1, normal ? Math.min(2, factor) : 1);
    if (normal && scaled.windup) assert(scaled.windup / scaled.attackScale >= .25);
    assert.equal(scaled.r, original.r); assert.equal(scaled.xp, original.xp);
  }
}
const active = game(9); assert(active.spawn('corruptedHen')); assert(active.spawn('alphaCrab')); assert(active.spawn('duende'));
const before = active.enemies.map(e => { e.hp = e.maxHp * .35; return { hp: e.hp, maxHp: e.maxHp, speed: e.speed, damage: e.damage }; });
active.xpNeeded = xpForLevel(9); active.xp = active.xpNeeded; assert(active.levelUp()); assert.equal(active.level, 10);
active.enemies.forEach((e, i) => { near(e.hp, before[i].hp * 2); near(e.hp / e.maxHp, .35); near(e.speed, before[i].speed * (i ? 1 : 1.2)); near(e.damage, before[i].damage * (i ? 1 : 2)); });
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
eggs.enemyTick(egg, 5); assert.equal(egg.type, 'nightHatchling'); near(egg.speed, TYPES.nightHatchling.speed * 1.44); near(egg.damage, TYPES.nightHatchling.damage * 4); assert.equal(egg.xp, 9); assert.equal(egg.attackScale, 2);
// High XP levels retain bounded pressure without allocating exponential arrays.
const large = game(200, 100); assert(large.queue.length < 250); assert.equal(large.queuedEnemies(), 1313); assert.equal(large.enemyLimit, 96);
assert.equal(large.difficultyTier(), 4); assert.equal(large.waveMobMultiplier, 8);
const capped = game(40, 100); near(large.spawnInterval, capped.spawnInterval);
for (const type of ['jaguar', 'corruptedMonkey', 'nightHatchling', 'alphaCrab', 'duende']) {
  large.enemies = []; capped.enemies = []; assert(large.spawn(type)); assert(capped.spawn(type));
  for (const field of ['hp', 'maxHp', 'damage', 'speed']) near(large.enemies[0][field], capped.enemies[0][field]);
}
// Measure real displacement: ordinary movement, charges, sidesteps and latching
// must respect Joe's speed at every tier, including slows and speed upgrades.
for (const level of [1, 10, 40, 200]) for (const joeSpeed of [218 * .6, 218, 400]) for (const type of Object.keys(TYPES)) {
  const g = game(level, 100); g.arena = { ...g.arena, obstacles: [] }; Object.assign(g.player, { x: 1200, y: 1200, speed: joeSpeed });
  assert(g.spawn(type)); const e = g.enemies[0], dt = 1 / 120;
  const checkMove = (fields = {}) => {
    Object.assign(e, { x: 900, y: 1000, warmup: 0, action: 'move', actionTime: 0, attackTimer: 999, shotTimer: 999, rushTimer: 999, rushTime: 0, routeTimer: 0, ...fields });
    const x = e.x, y = e.y; g.enemyTick(e, dt);
    assert(Math.hypot(e.x - x, e.y - y) <= joeSpeed * dt + 1e-8, `${type} outran Joe at XP ${level}`);
    return Math.hypot(e.x - x, e.y - y) / dt;
  };
  const speed = checkMove();
  if (type === 'jaguar') near(speed, Math.min(e.speed, joeSpeed), 'Fast mobs should still reach Joe\'s running speed');
  if (['tommy', 'jaguarBoss'].includes(type)) checkMove({ rushTime: .2, rushAngle: .5 });
  if (e.attack === 'pounce') checkMove({ action: 'active', attackAngle: .5 });
  if (e.sidestep) checkMove({ action: 'sidestep', attackAngle: .5 });
  if (e.attach) checkMove({ x: 1160, y: 1200, action: 'attached' });
  if (e.bossAI) checkMove({ action: 'active', attackAngle: .5, skill: { kind: 'rush', speed: 440, duration: .5 } });
}
// Crowd separation shares the movement budget, and the cap follows Joe as a
// slow begins/expires, an upgrade is gained, or he dashes.
const crowd = game(200, 100); crowd.arena = { ...crowd.arena, obstacles: [] }; Object.assign(crowd.player, { x: 1200, y: 1200, invincible: 99 });
for (let i = 0; i < 8; i++) { assert(crowd.spawn('jaguar')); Object.assign(crowd.enemies.at(-1), { x: 1000 + i, y: 1000, warmup: 0, shotTimer: 999, rushTimer: 999 }); }
for (const slowTime of [5, 0]) {
  crowd.player.slowTime = slowTime;
  for (let step = 0; step < 20; step++) {
    const positions = crowd.enemies.map(e => ({ x: e.x, y: e.y })), dt = 1 / 120;
    crowd.update(dt, { dx: 1 });
    crowd.enemies.forEach((e, i) => assert(Math.hypot(e.x - positions[i].x, e.y - positions[i].y) <= crowd.player.speed * dt + 1e-8, 'Crowd push bypassed Joe\'s movement cap'));
    assert(crowd.enemies.every(e => e.movementLeft == null));
  }
}
crowd.ranks.speed = 6; crowd.refreshStats(); assert(crowd.dash({ dx: 1 }));
const dashPositions = crowd.enemies.map(e => ({ x: e.x, y: e.y })); crowd.update(1 / 120, { dx: 1 });
crowd.enemies.forEach((e, i) => assert(Math.hypot(e.x - dashPositions[i].x, e.y - dashPositions[i].y) <= crowd.player.speed / 120 + 1e-8, 'Joe\'s dash lifted the mob speed cap'));
const ended = game(); assert(ended.spawn('crab')); Object.assign(ended.enemies[0], { x: ended.player.x, y: ended.player.y, warmup: 0 }); ended.player.hp = 1;
ended.update(1 / 120); assert.equal(ended.mode, 'gameover'); assert(ended.enemies.every(e => e.movementLeft == null));
// Baseline spawning is 25% faster, before the restored 50% XP-decade increases.
const fasterSpawns = game(); near(fasterSpawns.spawnInterval, fasterSpawns.baseSpawnInterval / 1.25);
const arrivals = game(1, 1); arrivals.queue = ['crab', 'crab', 'crab']; arrivals.spawnTimer = 0; arrivals.powers.freeze = 99;
for (let i = 0; i < 180; i++) arrivals.update(1 / 120);
assert.equal(arrivals.enemies.length, 3); assert.equal(arrivals.queue.length, 0);
console.log('PASS: every enemy movement/charge path stays at or below Joe, including crowd pushes, slow expiry, upgrades and dash; faster baseline spawns actually arrive.');
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
console.log('PASS: exact XP-decade thresholds, 20% movement growth, bounded ordinary stats/population/1.5x spawn cadence, HP-only alphas/bosses, wounded-enemy transitions, lazy repeated spawns, attack clocks, hatch scaling, all twelve VI caps and healing, useful extra perk ranks, Story save compatibility.');

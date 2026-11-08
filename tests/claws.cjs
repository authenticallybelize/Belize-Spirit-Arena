const assert = require('node:assert/strict');
const { performance } = require('node:perf_hooks');
const { Game, PERKS, weapon } = require('../survival.js');
const { AIM_HEIGHT, circleRect } = require('../core.js');
const near = (a, b) => assert(Math.abs(a - b) < 1e-7, `${a} != ${b}`);
function game(rank = 3) {
  const g = new Game(() => .99); g.start({ mode: 'survival' }); g.arena = { ...g.arena, obstacles: [] };
  Object.assign(g.player, { x: 600, y: 600, angle: 0 }); g.player.weapon = 'claw'; g.weaponLevels.claw = rank; g.refreshStats();
  g.queue = ['crab']; g.spawnTimer = 999; return g;
}
function enemy(g, x, y, hp = 1000) {
  const e = { id: g.nextId++, type: 'crab', x, y, r: 12, hp, maxHp: hp, damage: 0, speed: 0, xp: 0, warmup: 0, shotTimer: 999, routeTimer: 999, hit: 0, statuses: {} };
  g.enemies.push(e); return e;
}
function advance(g, seconds, fps = 120) { for (let i = 0; i < Math.round(seconds * fps); i++) g.update(1 / fps); }
for (const rank of [1, 2]) {
  const g = game(rank), close = enemy(g, 640, 600 - AIM_HEIGHT), far = enemy(g, 840, 600 - AIM_HEIGHT);
  g.fire(); assert(close.hp < close.maxHp); assert.equal(far.hp, far.maxHp); assert.equal(g.bullets.length, 0);
  assert(!g.eligible(PERKS.find(p => p.id === 'harpy')), 'Projectile cards unlocked before Claws III');
}
const waves = game(), y = waves.player.y - AIM_HEIGHT;
const targets = [enemy(waves, 700, y - 42), enemy(waves, 800, y + 42), enemy(waves, 900, y)];
const outside = enemy(waves, 800, y + 100), behind = enemy(waves, 550, y);
waves.fire(); const wave = waves.bullets[0]; assert.equal(wave.kind, 'clawWave'); assert.equal(wave.waveRadius, 100);
advance(waves, .7); targets.forEach(e => near(e.hp, 1000 - waves.player.damage));
assert.equal(outside.hp, 1000); assert.equal(behind.hp, 1000);
assert(waves.bullets.length); advance(waves, .5); assert.equal(waves.bullets.length, 0);
targets.forEach(e => near(e.hp, 1000 - waves.player.damage));
for (const rank of [3, 4, 5, 6]) {
  const g = game(rank); g.fire(); const b = g.bullets[0];
  near(b.waveRadius, 90 + (rank - 1) * 5); near(b.damage, 24 * (1 + .15 * (rank - 1)));
  assert.equal(b.pierce, Infinity); assert.equal(b.bounces, 0); assert.equal(b.homing, 0);
  for (const id of ['pierce', 'ricochet', 'homing']) assert(!g.eligible(PERKS.find(p => p.id === id)));
  assert(g.eligible(PERKS.find(p => p.id === 'harpy')));
}
const cover = game(); cover.arena.obstacles = [{ x: 750, y: 480, w: 30, h: 150 }];
const safe = enemy(cover, 820, 600 - AIM_HEIGHT); cover.fire(); advance(cover, 1); assert.equal(safe.hp, 1000);
const flank = game(); flank.arena.obstacles = [{ x: 730, y: 580, w: 35, h: 30 }];
const shielded = enemy(flank, 820, 590); flank.fire(); advance(flank, 1); assert.equal(shielded.hp, 1000, 'Wide wave crossed side cover');
// Swept collision must catch a small enemy between frames and preserve full damage.
const fast = game(); const tiny = enemy(fast, 704, 600 - AIM_HEIGHT); tiny.r = 2;
fast.ranks.harpy = 6; fast.fire(); advance(fast, .25, 60); near(tiny.hp, 1000 - fast.player.damage);
const enhanced = game(); enhanced.ranks.duplicate = 5; enhanced.ranks.overflow = 4; enhanced.ranks.poison = 2; enhanced.random = () => 0;
enhanced.attackCount = 2; enhanced.fire(); assert.equal(enhanced.bullets.length, 3);
assert(enhanced.bullets.every(b => b.kind === 'clawWave' && b.poison === 12 && b.hitIds instanceof Set));
// The special cuts a safe corridor, damages each enemy once and uses active-time cooldown.
const rush = game(), pack = [enemy(rush, 650, 600), enemy(rush, 730, 625), enemy(rush, 800, 580)], offPath = enemy(rush, 730, 720);
assert(rush.special({ aimX: 1100, aimY: 600 })); assert(!rush.special({ dx: 1 }));
const damage = rush.player.damage * 2; assert(rush.player.invincible >= .24);
advance(rush, .3); assert(rush.player.x > 810 && rush.player.x < 830); near(rush.player.y, 600);
pack.forEach(e => near(e.hp, 1000 - damage)); assert.equal(offPath.hp, 1000); assert.equal(rush.clawRush, null);
const cooldown = rush.player.specialCooldown; rush.pause(); advance(rush, 1); near(rush.player.specialCooldown, cooldown); rush.resume();
advance(rush, 6); assert(rush.special({ dx: -1 }));
const blocked = game(); blocked.arena.obstacles = [{ x: 690, y: 500, w: 40, h: 200 }];
const protectedEnemy = enemy(blocked, 760, 600); assert(blocked.special({ dx: 1 })); advance(blocked, .4);
assert(blocked.player.x < 690); assert(!circleRect(blocked.player.x, blocked.player.y, blocked.player.r - .001, blocked.arena.obstacles[0]));
assert.equal(protectedEnemy.hp, 1000); assert.equal(blocked.clawRush, null);
for (const mode of ['paused', 'upgrade', 'gameover']) { const g = game(); g.mode = mode; assert(!g.special({ dx: 1 })); }
const other = game(); other.player.weapon = 'spear'; assert(!other.special({ dx: 1 }));
const swapped = game(); assert(swapped.special({ dx: 1 })); swapped.player.weapon = 'staff'; advance(swapped, .1); assert.equal(swapped.clawRush, null);
const reset = game(); assert(reset.special({ dx: 1 })); reset.start({ mode: 'survival' }); assert.equal(reset.clawRush, null); assert.equal(reset.player.specialCooldown, 0);
const stress = game(6); stress.enemyLimit = 96;
for (let i = 0; i < 96; i++) enemy(stress, 900 + i % 12 * 20, 430 + Math.floor(i / 12) * 25, 1e8);
stress.player.invincible = 99; stress.ranks.rate = 7; stress.ranks.duplicate = 5; stress.ranks.overflow = 4; stress.collectPower('badman');
const start = performance.now();
for (let i = 0; i < 600; i++) stress.update(1 / 120, { shooting: true, relativeAim: true, aimDX: 1, aimDY: 0 });
assert(stress.bullets.length <= 200); assert(stress.bullets.every(b => b.hitIds.size <= 96));
console.log('PASS: I/II melee, III unlock, matching-width multi-target waves through VI, one full hit per enemy, cover/range/swept collision, projectile perks, protected horde rush, active-time cooldown and desktop/touch engine controls.');
console.log(`Claw stress: ${((performance.now() - start) / 600).toFixed(2)} ms per 120 Hz step, 96 enemies; excludes rendering.`);

const assert = require('node:assert/strict');
const fs = require('node:fs'), path = require('node:path'), crypto = require('node:crypto'), vm = require('node:vm');
const { Game, TYPES, ALPHAS, ARENAS, WEAPONS, MOB_WEAPON_CHANCE } = require('../survival.js');
const Base = require('../core.js');
const seeded = seed => () => ((seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 4294967296);
function game() { const g = new Game(seeded(71)); g.start({ mode: 'survival' }); g.queue = ['crab']; g.spawnTimer = 999; return g; }
function foe(g, type, distance = 120) {
  assert(g.spawn(type)); const e = g.enemies.at(-1);
  Object.assign(e, { x: g.player.x - distance, y: g.player.y, warmup: 0, attackTimer: 0 }); return e;
}
function advance(g, seconds, input) { for (let i = 0; i < Math.round(seconds * 120); i++) { while (g.mode === 'upgrade') g.choose(0); g.update(1 / 120, input); } }
assert.equal(ALPHAS.length, 12); assert.equal(new Set(ALPHAS).size, 12);
for (let index = 0; index < ALPHAS.length; index++) {
  const g = game(); g.random = () => (index + .5) / ALPHAS.length; g.wave = 12; g.beginWave();
  assert.equal(g.queue[0], ALPHAS[index], 'Alpha is unreachable from the real random queue');
}
for (const type of ALPHAS) {
  for (const [index, weapon] of WEAPONS.entries()) {
    const g = game(), parent = foe(g, type), rolls = [.99, MOB_WEAPON_CHANCE - .000001, (index + .5) / WEAPONS.length];
    g.random = () => rolls.shift(); g.defeat(parent); g.defeat(parent);
    assert.equal(g.gems.length, 1); assert.equal(g.gems[0].value, TYPES[type].xp);
    assert.equal(g.drops.length, 1); assert.equal(g.drops[0].id, weapon.id); assert.equal(g.drops[0].kind, 'weapon');
    assert.equal(g.kills, 1); assert.equal(g.bossesDefeated, 0);
  }
  const boundary = game(), parent = foe(boundary, type), rolls = [.035, MOB_WEAPON_CHANCE];
  boundary.random = () => rolls.shift(); boundary.defeat(parent); assert.equal(boundary.drops.length, 0, type + ' changed drop probability boundaries');
  const powers = game().powerPool();
  for (const [index, power] of powers.entries()) {
    const g = game(), e = foe(g, type), rolls = [.035 - .000001, (index + .5) / powers.length, .99];
    g.random = () => rolls.shift(); g.defeat(e); assert.equal(g.drops.length, 1); assert.equal(g.drops[0].id, power); assert.equal(g.drops[0].kind, 'power');
  }
}
for (const [id, hp] of Object.entries({ chiwoj: 96, tigerSpider: 96, soldierAnt: 144, bulletAnt: 144, giantCentipede: 160, hiveGuardian: 112, giantTommy: 208, rotTapir: 240, jabiruReaper: 180 })) assert(Math.abs(TYPES[id].hp - hp * 1.15 * 1.5) < 1e-8);
const tiger = game(), spider = foe(tiger, 'tigerSpider'); tiger.enemyTick(spider, .01); assert.equal(spider.action, 'sidestep');
const y = spider.y; tiger.enemyTick(spider, .3); assert.notEqual(spider.y, y); assert.equal(spider.action, 'windup');
tiger.enemyTick(spider, spider.windup + .01); assert.equal(spider.action, 'active');
const ant = game(), soldier = foe(ant, 'soldierAnt', 40); ant.enemyTick(soldier, .01); ant.enemyTick(soldier, soldier.windup + .01);
assert.equal(soldier.action, 'attached'); ant.refreshStats(); assert.equal(ant.player.speed, 218 * .6);
assert(ant.dash({ dx: 1 })); assert.equal(soldier.action, 'recover'); ant.refreshStats(); assert.equal(ant.player.speed, 218);
const resistant = game(), blockedAnt = foe(resistant, 'soldierAnt', 40); resistant.collectPower('shield');
resistant.enemyTick(blockedAnt, .01); resistant.enemyTick(blockedAnt, blockedAnt.windup + .01); assert.notEqual(blockedAnt.action, 'attached');
const champion = game(), bullet = foe(champion, 'bulletAnt', 40); champion.enemyTick(bullet, .01); champion.enemyTick(bullet, .99); assert.equal(champion.player.hp, 100);
champion.enemyTick(bullet, .02); assert(champion.player.hp < 100); assert(champion.player.slowTime > 0); assert.equal(champion.hazards.length, 0, 'Ant bite created an unrelated area');
advance(champion, 1.6, { dx: 1 }); assert.equal(champion.player.slowTime, 0);
for (const id of ['giantCentipede', 'giantTommy']) {
  const g = game(), e = foe(g, id, 30); g.strike(e); assert.equal(g.player.venomTime, 3); const hp = g.player.hp;
  g.enemies = []; advance(g, 1.1); assert(g.player.hp < hp, id + ' venom did not tick');
  const time = g.player.venomTime; g.pause(); g.update(.25); assert.equal(g.player.venomTime, time);
  g.resume(); advance(g, 2.1); assert.equal(g.player.venomTime, 0); const after = g.player.hp; advance(g, 1); assert.equal(g.player.hp, after);
}
const hairs = game(), tarantula = foe(hairs, 'chiwoj'); hairs.enemyTick(tarantula, .01); hairs.enemyTick(tarantula, tarantula.windup + .01); hairs.enemyTick(tarantula, tarantula.rushDuration + .01);
assert.equal(hairs.hazards.length, 1); const cloud = hairs.hazards[0]; Object.assign(hairs.player, { x: cloud.x, y: cloud.y, invincible: 0, hp: 100 });
hairs.tickAreas(.79); assert.equal(hairs.player.hp, 100); hairs.tickAreas(.02); assert(hairs.player.hp < 100 && hairs.player.slowTime > 0);
const bile = game(), tapir = foe(bile, 'rotTapir'); bile.enemyTick(tapir, .01); assert.equal(bile.hazards.length, 1); assert(bile.hazards[0].delay > 1);
bile.enemyTick(tapir, tapir.windup + .01); assert.equal(bile.bullets.length, 3);
bile.damageEnemy(tapir, 1e6); bile.damageEnemy(tapir, 1e6); assert.equal(bile.kills, 1); assert.equal(bile.gems.length, 1); assert.equal(bile.pendingSummons.length, 3); assert.equal(bile.hazards.length, 0);
bile.queue = []; advance(bile, .05); assert.equal(bile.enemies.length, 3); assert(!bile.finishedWave); assert(bile.enemies.every(e => e.type === 'parasiteTapir'));
const gems = bile.gems.length, drops = bile.drops.length;
for (const e of bile.enemies) { e.warmup = 0; bile.damageEnemy(e, 1e6); }
assert.equal(bile.kills, 4); assert.equal(bile.gems.length, gems + 3); assert(bile.gems.slice(-3).every(gem => gem.value === TYPES.rotTapir.xp / 4)); assert.equal(bile.drops.length, drops); advance(bile, .01); assert(bile.finishedWave);
for (const arena of Object.keys(ARENAS)) {
  const g = game(); g.start({ mode: 'survival', arena }); g.queue = ['crab']; g.spawnTimer = 999;
  const e = foe(g, 'rotTapir', 300); g.defeat(e); advance(g, .1);
  assert.equal(g.enemies.length, 3, 'Tapir replacement failed in ' + arena);
  for (const child of g.enemies) assert(!g.arena.obstacles.some(o => Base.circleRect(child.x, child.y, child.r, o)));
}
for (const type of ['hiveGuardian', 'jabiruReaper']) {
  const g = game(), e = foe(g, type, 300); e.attackTimer = 999; const start = e.summonStart;
  advance(g, start - .1); assert.equal(g.enemies.length, 1, 'Summon arrived before its timer');
  advance(g, 1.5); assert.equal(g.enemies.length, 2); let child = g.enemies.find(c => c.owner === e.id); assert(child && child.summoned);
  const clock = e.summonTimer; g.pause(); g.update(.25); assert.equal(e.summonTimer, clock); g.resume(); g.collectPower('freeze'); advance(g, 1); assert.equal(e.summonTimer, clock);
  delete g.powers.freeze;
  if (type === 'jabiruReaper') {
    assert.equal(child.type, 'voidEgg'); assert.equal(child.warmup, 0, 'Egg is not immediately destructible'); const id = child.id; advance(g, 5); child = g.enemies.find(c => c.id === id); assert.equal(child.type, 'nightHatchling'); assert(child.flying && child.owner === e.id);
    // An egg cannot pay both its own reward and its hatchling's reward.
    assert(g.summon(e)); const egg = g.enemies.at(-1); egg.warmup = 0; const k = g.kills, d = g.drops.length;
    g.damageEnemy(egg, 1e6); assert.equal(g.kills, k); assert.equal(g.drops.length, d); assert.equal(g.gems.length, 0);
  }
  while (e.summonsMade < 3) assert(g.summon(e));
  assert(!g.summon(e)); const surviving = g.enemies.filter(c => c.owner === e.id && !c.dead);
  g.damageEnemy(e, 1e6); assert(surviving.every(c => !c.dead), 'Alpha death removed its mini mobs'); assert.equal(g.kills, 1);
}
const full = game(); full.enemyLimit = 4; const split = foe(full, 'rotTapir', 300);
for (let i = 0; i < 3; i++) assert(full.spawn('crab'));
full.defeat(split); advance(full, .05); assert.equal(full.enemies.length, 4); assert.equal(full.pendingSummons.length, 2);
full.collectPower('nuke'); assert.equal(full.enemies.length, 0); assert.equal(full.pendingSummons.length, 0);
full.start(); assert.equal(full.player.venomTime, undefined); assert.equal(full.pendingSummons.length, 0);
for (const type of ['hiveGuardian', 'jabiruReaper']) {
  const g = game(), parent = foe(g, type, 350), childXP = TYPES[type].xp / 4;
  for (let i = 0; i < 3; i++) {
    assert(g.summon(parent)); const child = g.enemies.at(-1); child.warmup = 0;
    if (child.type === 'voidEgg') g.enemyTick(child, 5.01);
    child.warmup = 0; assert.equal(child.xp, childXP);
    g.random = () => 0; g.damageEnemy(child, 1e6); g.damageEnemy(child, 1e6);
    assert.equal(g.gems.length, i + 1); assert.equal(g.gems.at(-1).value, childXP); assert.equal(g.drops.length, 0);
  }
  assert.equal(parent.summonsMade, 3); assert(!g.summon(parent), 'Dead children reset the reward-bearing brood limit');
  parent.summonTimer = 0; parent.action = 'move'; parent.attackTimer = 999; g.rosterTick(parent, .01); assert.equal(parent.action, 'move', 'Exhausted summoner played a useless cast');
  const total = g.gems.reduce((sum, gem) => sum + gem.value, 0); assert.equal(total, childXP * 3);
}
const fraction = game(), hive = foe(fraction, 'hiveGuardian');
for (let i = 0; i < 2; i++) { assert(fraction.summon(hive)); const bee = fraction.enemies.at(-1); bee.warmup = 0; fraction.defeat(bee); }
for (const gem of fraction.gems) fraction.gainXP(gem.value); assert.equal(fraction.xp, 15); assert.equal(fraction.xpFraction, 0);
const boosted = game(); boosted.ranks.xp = 1; boosted.collectPower('doubleXP'); boosted.gainXP(7.5); assert.equal(boosted.xp, 18);
const rhythm = game(), brood = foe(rhythm, 'hiveGuardian'); assert(rhythm.summon(brood)); const bee = rhythm.enemies.at(-1); bee.warmup = 0;
rhythm.ranks.rhythm = 1; rhythm.kills = 24; rhythm.defeat(bee); assert.equal(rhythm.kills, 25); assert(rhythm.pendingRhythm);
const purge = game(), bird = foe(purge, 'jabiruReaper'); assert(purge.summon(bird)); const egg = purge.enemies.at(-1); purge.enemyTick(egg, 5.01);
purge.collectPower('nuke'); assert.equal(purge.enemies.length, 0); assert.equal(purge.kills, 2);
assert.equal(purge.gems.length, 2); assert.equal(purge.gems[1].value, TYPES.jabiruReaper.xp / 4 * .45);
const legacySummon = game(), storyAdd = foe(legacySummon, 'owlShade'); storyAdd.summoned = true; legacySummon.defeat(storyAdd);
assert.equal(legacySummon.gems.length, 0); assert.equal(legacySummon.kills, 0, 'Story cave summons changed reward policy');
const clearBrood = game(), mother = foe(clearBrood, 'jabiruReaper', 350); assert(clearBrood.summon(mother));
const remainingEgg = clearBrood.enemies.at(-1); clearBrood.queue = []; clearBrood.defeat(mother); advance(clearBrood, .1); assert(!clearBrood.finishedWave);
remainingEgg.warmup = 0; clearBrood.damageEnemy(remainingEgg, 1e6); advance(clearBrood, .01); assert(clearBrood.finishedWave);
const artSandbox = { window: {} }; vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../assets/roster.js'), 'utf8'), artSandbox);
for (const e of JSON.parse(fs.readFileSync(path.join(__dirname, '../assets/ready/roster/manifest.json')))) {
  const bytes = fs.readFileSync(path.join(__dirname, '../assets', e.file)); assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'), e.runtimeSHA256);
  assert.equal(bytes[25], 6); assert(artSandbox.window.ARENA_ROSTER[e.id]);
}
console.log('PASS: twelve reachable alphas; HP boosts; sideways dash, latch/dash escape, shield, slow, venom, warned hairs/bile; timed destructible eggs/hatching; bounded persistent broods; exact three-Tapir replacement/cap retry; quarter-parent-XP minis; Nuke/restart and atlas hashes.');

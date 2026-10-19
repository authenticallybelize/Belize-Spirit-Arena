const assert = require('node:assert/strict');
const fs = require('node:fs'), path = require('node:path'), crypto = require('node:crypto'), vm = require('node:vm');
const { Game, TYPES, ALPHAS, ARENAS, WEAPONS, visible } = require('../survival.js');
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
assert.equal(bile.kills, 1); assert.equal(bile.gems.length, gems); assert.equal(bile.drops.length, drops); advance(bile, .01); assert(bile.finishedWave);
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
    // Killing an egg prevents hatching, and summons cannot farm XP or weapons.
    assert(g.summon(e)); const egg = g.enemies.at(-1); egg.warmup = 0; const k = g.kills, d = g.drops.length;
    g.damageEnemy(egg, 1e6); assert.equal(g.kills, k); assert.equal(g.drops.length, d); assert.equal(g.gems.length, 0);
  }
  while (g.enemies.filter(c => !c.dead && c.owner === e.id).length < 3) assert(g.summon(e));
  assert(!g.summon(e)); g.damageEnemy(e, 1e6); assert(g.enemies.filter(c => c.owner === e.id).every(c => c.dead)); assert.equal(g.kills, 1);
}
const full = game(); full.enemyLimit = 4; const split = foe(full, 'rotTapir', 300);
for (let i = 0; i < 3; i++) assert(full.spawn('crab'));
full.defeat(split); advance(full, .05); assert.equal(full.enemies.length, 4); assert.equal(full.pendingSummons.length, 2);
full.collectPower('nuke'); assert.equal(full.enemies.length, 0); assert.equal(full.pendingSummons.length, 0);
full.start(); assert.equal(full.player.venomTime, undefined); assert.equal(full.pendingSummons.length, 0);
const artSandbox = { window: {} }; vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../assets/roster.js'), 'utf8'), artSandbox);
for (const e of JSON.parse(fs.readFileSync(path.join(__dirname, '../assets/ready/roster/manifest.json')))) {
  const bytes = fs.readFileSync(path.join(__dirname, '../assets', e.file)); assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'), e.runtimeSHA256);
  assert.equal(bytes[25], 6); assert(artSandbox.window.ARENA_ROSTER[e.id]);
}
console.log('PASS: twelve reachable alphas; HP boosts; sideways dash, latch/dash escape, shield, slow, venom, warned hairs/bile; timed destructible eggs/hatching; capped summons/cleanup; exact three-Tapir replacement/cap retry; no summon rewards; Nuke/restart and atlas hashes.');

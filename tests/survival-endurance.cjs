const assert = require('node:assert/strict');
const { performance } = require('node:perf_hooks');
const { Game, TYPES, POWERS, PERKS, SURVIVAL_WAVES } = require('../survival.js');
const seeded = seed => () => ((seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 4294967296);
function atWave(wave, mode = 'survival', arena = 'open') {
  const g = new Game(seeded(wave + 51)); g.start({ mode, arena });
  g.wave = wave - 1; g.beginWave(); return g;
}
function deadFoe() { return { x: 1200, y: 1200, xp: 5, type: 'crab' }; }

const earlyCounts = [7, 8, 9, 11, 13, 13, 14, 16, 17, 19], table = [];
let lastMobs = 0, lastTotal = 0, lastHP = 0, lastDamage = 0, lastInterval = Infinity, lastLimit = 0;
for (let wave = 1; wave <= SURVIVAL_WAVES; wave++) {
  const g = atWave(wave), mobs = g.queue.filter(type => !TYPES[type].boss).length;
  assert(mobs > lastMobs, 'Ordinary mob count stopped growing at wave ' + wave);
  if (wave > 10) assert(g.queue.length > lastTotal, 'Total pressure stopped growing after a boss wave');
  assert(g.spawnInterval <= lastInterval && g.spawnInterval >= .1);
  assert(g.enemyLimit >= lastLimit && g.enemyLimit <= 96);
  assert.equal(g.queue.filter(type => TYPES[type].boss).length, wave % 5 === 0 ? 1 : 0);
  assert(g.spawn('crab')); const e = g.enemies[0];
  assert(e.hp > lastHP && e.damage > lastDamage, 'Enemy strength did not increase at wave ' + wave);
  if (wave <= 10) {
    const run = atWave(wave, 'run'); assert.deepEqual(g.queue, run.queue); assert.equal(g.queue.length, earlyCounts[wave - 1]);
    assert.equal(g.spawnInterval, run.spawnInterval); assert.equal(run.enemyLimit, 32); assert.equal(run.enduranceBonus, 0);
    assert(Math.abs(e.hp - TYPES.crab.hp * (1 + .065 * (wave - 1))) < 1e-8);
    assert(Math.abs(e.damage - TYPES.crab.damage * (1 + .012 * (wave - 1))) < 1e-8);
  }
  if ([1, 10, 40, 100, 140].includes(wave)) table.push({ wave, enemies: g.queue.length, interval: Number(g.spawnInterval.toFixed(3)), cap: g.enemyLimit, crabHP: Number(e.hp.toFixed(1)), hit: Number(e.damage.toFixed(2)), bonus: Math.round(g.enduranceBonus * 100) });
  [lastMobs, lastTotal, lastHP, lastDamage, lastInterval, lastLimit] = [mobs, g.queue.length, e.hp, e.damage, g.spawnInterval, g.enemyLimit];
}
const hundred = atWave(100); assert.equal(hundred.spawnInterval, .1); assert.equal(hundred.enemyLimit, 96);
const final = atWave(140); assert.equal(final.totalWaves, 140); assert.equal(final.enduranceBonus, 1); assert.equal(final.player.damage, 38);
const forty = atWave(40); assert.equal(forty.enduranceBonus, 0); forty.queue = []; forty.update(1 / 120);
assert.equal(forty.enduranceBonus, .01, 'Clearing wave forty did not begin endurance growth');
const snapshot = atWave(100); snapshot.fire(); const launchedDamage = snapshot.bullets[0].damage;
snapshot.wave++; snapshot.refreshStats(); assert(snapshot.player.damage > launchedDamage); assert.equal(snapshot.bullets[0].damage, launchedDamage, 'A live projectile changed damage with the next wave');

function cadence(fps) {
  const g = atWave(100); g.queue = Array(200).fill('crab'); g.spawnTimer = g.spawnInterval;
  for (let i = 0; i < fps * 2; i++) g.update(1 / fps);
  assert.equal(200 - g.queue.length, 20, 'Free-capacity cadence was not ten enemies per second');
  return g;
}
const sixty = cadence(60), oneTwenty = cadence(120); assert.equal(sixty.enemies.length, oneTwenty.enemies.length);
assert.deepEqual(sixty.enemies.map(e => [e.x, e.y]), oneTwenty.enemies.map(e => [e.x, e.y]));
const capacity = atWave(100); while (capacity.enemies.length < capacity.enemyLimit) assert(capacity.spawn('crab'));
const queued = [...capacity.queue]; capacity.spawnTimer = 0; capacity.update(1 / 120);
assert.deepEqual(capacity.queue, queued, 'Capacity consumed queued enemies'); assert.equal(capacity.enemies.length, 96);
capacity.enemies.pop(); capacity.update(1 / 120); assert.equal(capacity.enemies.length, 96); assert.equal(capacity.queue.length, queued.length - 1);
const blocked = atWave(100); blocked.random = () => 0; assert(blocked.spawn('crab'));
let attempts = 0; blocked.random = () => { attempts++; return 0; }; blocked.queue = ['crab']; blocked.spawnTimer = 0; blocked.update(1 / 120);
assert.deepEqual(blocked.queue, ['crab']); assert(attempts <= 80, 'Failed placement exceeded forty bounded attempts'); assert(blocked.spawnTimer > 0);

for (const player of [{ x: 1200, y: 1200 }, { x: 150, y: 150 }, { x: 2250, y: 2250 }]) {
  const g = atWave(100); Object.assign(g.player, player);
  g.view = { x: Math.max(0, Math.min(1200, player.x - 600)), y: Math.max(0, Math.min(1800, player.y - 300)), w: 1200, h: 600 };
  for (const type of ['crab', 'shadow', 'tommy', 'miniLlorona', 'duende', 'jaguarBoss']) {
    let placed = false; for (let retry = 0; retry < 5 && !placed; retry++) placed = g.spawn(type); assert(placed, 'Fair offscreen spawning stalled near an arena edge');
    const e = g.enemies.at(-1), d = Math.hypot(e.x - g.player.x, e.y - g.player.y), margin = e.boss ? 120 : 70;
    const extra = Math.hypot(g.player.x-g.view.x-g.view.w/2,g.player.y-g.view.y-g.view.h/2);
    assert(d >= 450 && d <= 850 + extra); assert(e.x - e.r >= g.arena.bounds.x && e.y - e.r >= g.arena.bounds.y);
    assert(e.x + e.r <= 2312 && e.y + e.r <= 2312);
    assert(e.x <= g.view.x - margin || e.x >= g.view.x + g.view.w + margin || e.y <= g.view.y - margin || e.y >= g.view.y + g.view.h + margin, 'Enemy popped into the camera');
  }
}
for (const position of [150,2250]) {
  const g=atWave(100); g.player.x=g.player.y=position;
  g.view={x:position===150?0:1200,y:position===150?0:1200,w:1200,h:1200};
  for(const type of ['crab','jaguarBoss']) {
    let placed=false;for(let i=0;i<5&&!placed;i++)placed=g.spawn(type);
    assert(placed,'Square-screen corner permanently stalled the wave');
    const e=g.enemies.at(-1),margin=e.boss?120:70;
    assert(e.x<=g.view.x-margin||e.x>=g.view.x+g.view.w+margin||e.y<=g.view.y-margin||e.y>=g.view.y+g.view.h+margin);
  }
}
const entire = atWave(100); entire.view = { x: 0, y: 0, w: 2400, h: 2400 };
assert(entire.spawn('duende')); assert(entire.enemies[0].warmup > 0, 'Show-entire mode removed spawn warning');

const levelCap = atWave(60); levelCap.level = 39; levelCap.xp = levelCap.xpNeeded;
levelCap.gems = [{ x: 0, y: 0, value: 5 }]; levelCap.powers.doubleXP = 2;
levelCap.addDrop('bonusXP', 1000, 1000, 'power'); levelCap.addDrop('doubleXP', 1050, 1000, 'power'); levelCap.addDrop('shield', 1100, 1000, 'power');
assert(levelCap.levelUp()); assert.equal(levelCap.level, 40); assert.equal(levelCap.powerPool().length, 8);
assert.deepEqual(levelCap.gems, []); assert.equal(levelCap.active('doubleXP'), false); assert.deepEqual(levelCap.drops.map(d => d.id), ['shield']);
levelCap.defeat(deadFoe()); assert.equal(levelCap.gems.length, 0, 'Zero-value XP gems accumulated past the cap');
levelCap.xp = 99999; assert(!levelCap.levelUp());
for (const perk of PERKS) levelCap.ranks[perk.id] = perk.max;
assert(PERKS.every(perk => !levelCap.eligible(perk)), 'Endurance reopened capped perks');
const validPowers = Object.keys(POWERS).filter(id => !['bonusXP', 'doubleXP'].includes(id)), randomPowers = [];
for (let index = 0; index < 8; index++) {
  const g = atWave(80); g.level = 40; const samples = [.034999, (index + .5) / 8]; g.random = () => samples.shift(); g.defeat(deadFoe()); randomPowers.push(g.drops[0].id);
}
assert.deepEqual(randomPowers, validPowers);
const chance = atWave(80); chance.level = 40; chance.random = () => .035; chance.defeat(deadFoe()); assert.equal(chance.drops.length, 0, 'Nominal power-drop chance increased');
const guaranteed = [];
for (let wave = 42; wave <= 56; wave += 2) { const g = atWave(wave); g.level = 40; g.queue = []; g.update(1 / 120); guaranteed.push(g.drops.find(d => d.kind === 'power').id); }
assert.deepEqual(new Set(guaranteed), new Set(validPowers), 'Guaranteed power cycle offered dead XP powers');

const stress = atWave(100); stress.level = 40; stress.collectPower('shield');
while (stress.enemies.length < stress.enemyLimit) assert(stress.spawn('crab'));
for (const e of stress.enemies) { e.warmup = 0; e.shotTimer = 99; }
for (let i = 0; i < 200; i++) stress.shot(1200, 1168, i * Math.PI / 100, false, 1, 620, { homing: Math.PI, seekingRank: 4 });
for (let i = 0; i < 150; i++) { const a = i * Math.PI / 75; stress.shot(1200 + Math.cos(a) * 300, 1200 + Math.sin(a) * 300, a, true, 1, 170); }
const started = performance.now(); for (let i = 0; i < 240; i++) stress.update(1 / 120);
assert(stress.enemies.length <= 96 && stress.bullets.length <= 350);
console.log('PASS: 140-wave increasing pressure, preserved first ten waves/Arena Run, ten-per-second cadence, active cap/retry, safe offscreen pressure spawning, capped progression/powers and damage snapshots.');
console.table(table);
console.log('Logic-only stress: ' + ((performance.now() - started) / 240).toFixed(2) + ' ms / 120Hz step with up to 96 mobs and 350 projectiles; excludes browser rendering and physical devices.');

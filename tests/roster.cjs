const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const crypto = require('node:crypto');
const { Game, TYPES, COMMONS, ALPHAS, WEAPONS, ARENAS, move } = require('../survival.js');
const Base = require('../core.js');
const seeded = seed => () => ((seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 4294967296);
function game(wave = 1, roll) {
  const g = new Game(seeded(wave + 43)); g.start({ mode: 'survival' });
  if (roll !== undefined) g.random = () => roll;
  g.wave = wave - 1; g.beginWave(); g.spawnTimer = 999; return g;
}
function foe(g, type, x = g.player.x + 50, y = g.player.y) {
  const e = { ...TYPES[type], x, y, maxHp: TYPES[type].hp, hp: TYPES[type].hp, type, id: g.nextId++,
    warmup: 0, statuses: {}, hit: 0, routeTimer: 0, action: 'move', actionTime: 0, attackTimer: 0 };
  g.enemies.push(e); return e;
}
assert.equal(COMMONS.length, 5); assert.equal(ALPHAS.length, 3);
for (let wave = 1; wave <= 140; wave++) {
  for (const roll of [0, .999999]) {
    const g = game(wave, roll), count = g.queue.filter(id => TYPES[id].alpha).length;
    const max = Math.min(4, Math.floor(wave / 10));
    const expected = wave > 10 && [3, 6, 9].includes(wave % 10) ? wave % 10 === 3 ? max : roll === 0 ? 1 : max : 0;
    assert.equal(count, expected, 'Alpha schedule at wave ' + wave);
    assert.equal(count, g.alphaCount);
    assert.equal(g.queue.length, Math.ceil((6 + Math.floor(wave * 1.25) + Math.ceil(Math.max(0, wave - 10) / 5)) * 1.1) + (wave % 5 === 0 ? 1 : 0), 'Alphas added extra crowd slots');
    assert(g.queue.every(id => TYPES[id]));
    assert.equal(g.queue.filter(id => TYPES[id].boss).length, wave % 5 === 0 ? 1 : 0);
  }
}
assert.equal(game(23).alphaCount, 2); assert.equal(game(33).alphaCount, 3);
assert.equal(new Set([...Array(5)].flatMap((_, i) => game(i + 1).queue.filter(id => COMMONS.includes(id)))).size, 5);
for (const [alpha, normal] of [['alphaCrab', 'crab'], ['alphaJaguar', 'jaguar'], ['shadowBrute', 'shadow']]) {
  for (const wave of [13, 23, 33, 100, 140]) {
    const g = game(wave); assert(g.spawn(alpha)); assert(g.spawn(normal));
    const [a, n] = g.enemies;
    assert(Math.abs(a.hp - n.hp * 6) < 1e-8); assert(Math.abs(a.damage - n.damage * 1.5) < 1e-8);
    assert(!a.boss && a.alpha && a.warmup === 1.7); assert(a.r > n.r);
  }
}
for (const arena of Object.keys(ARENAS)) for (const type of [...COMMONS, ...ALPHAS]) {
  const g = game(23); g.start({ arena, mode: 'survival' });
  assert(g.spawn(type), type + ' cannot spawn in ' + arena);
  const e = g.enemies[0], b = g.arena.bounds;
  assert(Math.hypot(e.x - g.player.x, e.y - g.player.y) >= 230);
  assert(e.x - e.r >= b.x && e.y - e.r >= b.y && e.x + e.r <= b.x + b.w && e.y + e.r <= b.y + b.h);
  assert(!g.arena.obstacles.some(o => Base.circleRect(e.x, e.y, e.r, o)));
}
for (const w of WEAPONS) for (const type of [...COMMONS, ...ALPHAS]) {
  const g = game(); g.start({ mode: 'survival' }); g.player.weapon = w.id; g.refreshStats(); g.spawnTimer = 999;
  const e = foe(g, type); e.hp = e.maxHp = 10000; e.speed = 0; e.attackTimer = 999;
  const aim = { shooting: true, aimX: e.x, aimY: e.y };
  for (let i = 0; i < 180; i++) g.update(1 / 120, aim);
  assert(e.hp < 10000, w.id + ' could not hit ' + type);
}
for (const type of [...COMMONS, ...ALPHAS]) {
  const g = game(), e = foe(g, type); e.hp = e.maxHp = 10000; e.speed = 0; e.attackTimer = 999;
  g.damageEnemy(e, 0, { poison: 10, burn: 5 });
  for (let i = 0; i < 120; i++) g.update(1 / 120);
  assert(e.hp < 9990, type + ' ignored damage over time');
  g.damageEnemy(e, 20000); g.damageEnemy(e, 20000);
  assert.equal(g.kills, 1); assert.equal(g.gems.length, 1); assert.equal(g.corpses.length, 1); assert.equal(g.bossesDefeated, 0);
  g.queue = []; g.update(1 / 120); assert(g.finishedWave, 'Corpse blocked wave clear');
  g.start(); assert.equal(g.corpses.length, 0);
}
for (const type of ['alphaCrab', 'shadowBrute']) {
  const g = game(), e = foe(g, type); g.enemyTick(e, 1 / 120);
  assert.equal(e.action, 'windup'); assert.equal(g.player.hp, 100);
  for (let i = 0; i < Math.floor(e.windup * 120) - 1; i++) g.enemyTick(e, 1 / 120);
  assert.equal(g.player.hp, 100, 'Slam landed before warning completed');
  g.player.y += 300; g.enemyTick(e, .05); assert.equal(g.player.hp, 100, 'Dodged slam still hit');
  const g2 = game(), e2 = foe(g2, type); g2.enemyTick(e2, 1 / 120); g2.enemyTick(e2, e2.windup + .01);
  assert.equal(g2.player.hp, 100 - e2.damage, 'Completed slam missed in-range target');
  const clock = e2.actionTime; g2.pause(); g2.update(.25); assert.equal(e2.actionTime, clock);
  g2.resume(); g2.collectPower('freeze'); g2.update(.2); assert.equal(e2.actionTime, clock, 'Freeze advanced attack clock');
}
const pounce = game(), jag = foe(pounce, 'alphaJaguar', 1100, 1200);
pounce.enemyTick(jag, 1 / 120); const locked = jag.attackAngle;
pounce.player.y += 300; pounce.enemyTick(jag, jag.windup + .01); pounce.enemyTick(jag, .2);
assert.equal(jag.attackAngle, locked); assert(jag.x > 1100); assert.equal(jag.y, 1200); assert.equal(pounce.player.hp, 100);
const plant = game(), root = foe(plant, 'rootling', 1000, 1200);
plant.enemyTick(root, 1 / 120); assert.equal(plant.bullets.length, 0);
plant.enemyTick(root, root.windup + .01); assert.equal(plant.bullets.length, 1); assert(plant.bullets[0].hostile);
const terrain = game(); terrain.start({ arena: 'canyon', mode: 'survival' });
const rock = terrain.arena.obstacles[0];
for (const flying of [false, true]) {
  const e = { x: rock.x - 30, y: rock.y + rock.h / 2, r: 11, flying };
  move(terrain, e, 60, 0);
  assert(flying ? e.x > rock.x : e.x + e.r <= rock.x, 'Flight/ground cover mismatch');
}
const walls = game(); walls.start({ arena: 'canyon', mode: 'survival' });
walls.player.x = rock.x + rock.w + 30; walls.player.y = rock.y + rock.h / 2;
const blocked = foe(walls, 'rootling', rock.x - 30, walls.player.y); walls.enemyTick(blocked, .01); assert.equal(blocked.action, 'move', 'Rootling cast through cover');
const sandbox = { window: {} }; vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../assets/roster.js'), 'utf8'), sandbox);
const art = sandbox.window.ARENA_ROSTER, manifest = JSON.parse(fs.readFileSync(path.join(__dirname, '../assets/ready/roster/manifest.json')));
assert.deepEqual(Object.keys(art).sort(), [...COMMONS, ...ALPHAS].sort());
for (const item of manifest) {
  const data = fs.readFileSync(path.join(__dirname, '../assets', item.file));
  assert.equal(data.readUInt32BE(16), 768); assert.equal(data.readUInt32BE(20), 512); assert.equal(data[25], 6);
  assert.equal(crypto.createHash('sha256').update(data).digest('hex'), item.runtimeSHA256);
  assert(item.bodyHeight > 30 && item.pivot.every(n => n >= 0 && n <= 128));
}
const stress = game(100), ids = [...COMMONS, ...ALPHAS]; stress.queue = ['crab']; stress.spawnTimer = 999;
for (let i = 0; i < 96; i++) { assert(stress.spawn(ids[i % ids.length])); stress.enemies.at(-1).warmup = 0; }
stress.player.invincible = 999;
for (let i = 0; i < 200; i++) stress.shot(1200, 1200, i * Math.PI / 100, false, .1, 200);
for (let i = 0; i < 150; i++) stress.shot(1200, 1200, i * Math.PI / 75, true, .1, 200);
for (let i = 0; i < 240; i++) stress.update(1 / 120);
assert(stress.enemies.length <= 96 && stress.bullets.length <= 350 && stress.corpses.length <= 16);
assert(stress.enemies.every(e => Number.isFinite(e.x + e.y + e.hp + e.actionTime)));
console.log('PASS: exactly five commons/three alphas, all 140 wave schedules and random extremes, 6x family HP/1.5x damage, all arenas/weapons, statuses, single rewards, warnings/dodges, pause/freeze, flight/cover, death cleanup and runtime sprite hashes.');

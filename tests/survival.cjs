const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { Game, WEAPONS, PERKS, POWERS, move } = require('../survival.js');
const { circleRect } = require('../core.js');
const seeded = seed => () => ((seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 4294967296);
function playing(weapon = 'slingshot', arena = 'canyon') { const g = new Game(seeded(8)); g.start({ weapon, arena, mode: 'survival' }); g.spawnTimer = 999; return g; }
function enemy(g, x = 710, y = 575, hp = 1000) {
  const e = { id: g.nextId++, x, y, r: 15, hp, maxHp: hp, xp: 5, type: 'crab', speed: 0, damage: 0, warmup: 0, hit: 0, routeTimer: 99, shotTimer: 99, statuses: {} };
  g.enemies.push(e); return e;
}
function pick(g, id) { g.mode = 'upgrade'; g.choices = [PERKS.find(p => p.id === id)]; return g.choose(0); }
assert.equal(WEAPONS.length, 12); assert.equal(PERKS.length, 31); assert.equal(Object.keys(POWERS).length, 10);
for (const w of WEAPONS) {
  const g = playing(w.id), e = enemy(g, w.melee ? 660 : 710);
  g.update(1 / 120, { shooting: true, aimX: e.x, aimY: e.y });
  for (let i = 0; i < 180; i++) g.update(1 / 120);
  assert(e.hp < 1000, w.name + ' did not damage target');
}
for (const arena of ['canyon', 'jungle', 'underworld', 'coast']) {
  const g = playing('slingshot', arena);
  for (const type of ['crab', 'jaguar', 'shadow', 'duende', 'jaguarBoss', 'tommy', 'miniLlorona']) {
    assert(g.spawn(type)); const e = g.enemies.at(-1);
    assert(Math.hypot(e.x - g.player.x, e.y - g.player.y) > 230);
    assert(!g.arena.obstacles.some(o => circleRect(e.x, e.y, e.r, o)));
  }
  const o = g.arena.obstacles[0], p = { x: o.x - 30, y: o.y + o.h / 2, r: 13 };
  move(g, p, 500, 0); assert(p.x + p.r <= o.x + .01);
}
const a = playing(), b = playing();
const navigation = playing(); navigation.player.x = 519; navigation.player.y = 566;
const routed = enemy(navigation, 501, 309); routed.speed = 145; routed.routeTimer = 0;
for (let i = 0; i < 600; i++) navigation.update(1 / 120);
assert(Math.hypot(routed.x - navigation.player.x, routed.y - navigation.player.y) < 60, 'Enemy stalled behind consecutive rock clusters');
const touching = playing(); Object.assign(touching.player, { x: 485, y: 351 });
const shadow = enemy(touching, 485, 551.001); shadow.type = 'shadow'; shadow.speed = 79; shadow.routeTimer = 0;
for (let i = 0; i < 360; i++) touching.update(1 / 120);
assert(Math.abs(shadow.x - 485) > 20, 'Touching cover prevented ranged enemy from finding a route');
for (let i = 0; i < 60; i++) a.update(1 / 60, { dx: 1 });
for (let i = 0; i < 120; i++) b.update(1 / 120, { dx: 1 });
assert(Math.abs(a.player.x - b.player.x) < .001, 'Canyon movement depends on frame rate');
const pause = playing(); pause.pause(); const before = pause.time; pause.update(.2, { shooting: true }); assert.equal(pause.time, before); pause.resume();
for (let i = 0; i < 5; i++) assert(pick(a, 'damage'));
assert(!a.eligible(PERKS.find(p => p.id === 'damage'))); assert(!pick(a, 'damage'));
assert(Math.abs(a.player.damage - 19 * 1.25 ** 5) < 1e-8);
const rolls = playing('claw'); rolls.wave = 1; rolls.xp = 25; assert(rolls.levelUp());
assert.equal(new Set(rolls.choices.map(p => p.id)).size, 3); assert(rolls.choices.every(p => p.tag !== 'projectile' && p.tag !== 'boss'));
rolls.choose(0); assert(pick(rolls, 'grandma')); rolls.xp = rolls.xpNeeded; assert(rolls.levelUp()); assert.equal(rolls.choices.length, 4);
const pickup = playing(); pickup.addDrop('bow', pickup.player.x, pickup.player.y); assert(pickup.pickup()); assert.equal(pickup.player.weapon, 'bow');
for (let i = 0; i < 3; i++) { pickup.addDrop('bow', pickup.player.x, pickup.player.y); assert(pickup.pickup()); }
assert.equal(pickup.weaponLevels.bow, 4); pickup.player.hp = 50; pickup.addDrop('bow', pickup.player.x, pickup.player.y); assert(pickup.pickup()); assert.equal(pickup.player.hp, 60);
pickup.drops = []; pickup.addDrop('crystal', pickup.player.x, pickup.player.y); assert(pickup.pickup()); pickup.drops = []; pickup.addDrop('bow', pickup.player.x, pickup.player.y); pickup.pickup(); assert.equal(pickup.weaponLevels.bow, 4);
const lock = playing(); lock.wave = 5; assert(pick(lock, 'commit')); lock.addDrop('staff', lock.player.x, lock.player.y, 'weapon', true); assert(!lock.pickup());
lock.queue = []; lock.enemies = []; lock.update(1 / 120); assert.equal(lock.finishedWave, true); assert(lock.breakTime > 0, 'Optional staff blocked next wave');
const expiry = playing(); expiry.addDrop('bow', 900, 700); expiry.addDrop('staff', 900, 750, 'weapon', true);
for (let i = 0; i < 200; i++) expiry.update(.25);
assert(!expiry.drops.some(d => d.id === 'bow')); assert(expiry.drops.some(d => d.id === 'staff'));
const venom = playing('dart'), v = enemy(venom); venom.damageEnemy(v, 0, { poison: 6 }); venom.damageEnemy(v, 0, { poison: 3 }); assert.equal(v.statuses.poison.dps, 6);
for (let i = 0; i < 360; i++) venom.update(1 / 120); assert(Math.abs(v.hp - 982) < .01, 'Poison refresh stacked or lost ticks');
const bomb = playing('cohune'); bomb.ranks.damage = 5; bomb.ranks.blast = 4; bomb.collectPower('evolution'); bomb.explode({ x: 610, y: 575, damage: 100 }); assert.equal(bomb.flashes.at(-1).r, 160);
const behind = enemy(bomb, 500, 480); bomb.explode({ x: 610, y: 480, damage: 100 }); assert.equal(behind.hp, 1000, 'Explosion crossed rock cover');
const nuke = playing(); enemy(nuke, 710, 575, 10); nuke.collectPower('nuke'); assert.equal(nuke.kills, 1); assert.equal(nuke.gems[0].value, 2.25);
const shield = playing(); shield.collectPower('shield'); shield.hurt(20); assert.equal(shield.player.hp, 100); shield.powers = {}; shield.hurt(20); assert.equal(shield.player.hp, 80);
const trophy = playing(); const firstBoss = enemy(trophy); firstBoss.boss = true; firstBoss.type = 'duende'; trophy.defeat(firstBoss);
assert(pick(trophy, 'trophy')); assert.equal(trophy.player.damage, 19, 'Trophy applied to a boss killed before acquiring it');
const secondBoss = enemy(trophy); secondBoss.boss = true; secondBoss.type = 'duende'; trophy.defeat(secondBoss); trophy.refreshStats(); assert.equal(trophy.player.damage, 19 * 1.05);
const homing = playing('feather'); homing.fire(); const initialTurn = homing.bullets[0].homing; homing.bullets = []; assert(pick(homing, 'homing')); homing.fire(); assert(homing.bullets[0].homing > initialTurn);
const budgets = playing();
for (let i = 0; i < 210; i++) budgets.shot(610, 575, 0, false, 1);
for (let i = 0; i < 160; i++) budgets.shot(610, 575, 0, true, 1);
assert.equal(budgets.bullets.filter(b => !b.hostile).length, 200); assert.equal(budgets.bullets.filter(b => b.hostile).length, 150);
budgets.bullets[0].secondary = true; assert(budgets.shot(610, 575, 0, false, 5)); assert.equal(budgets.bullets.filter(b => !b.hostile).length, 200);
const exhausted = playing(); for (const p of PERKS) exhausted.ranks[p.id] = p.max; exhausted.xp = exhausted.xpNeeded; exhausted.levelUp(); assert(exhausted.choices.every(p => p.id === 'overflowHeal'));
const progression = playing(); const bossWaves = [];
for (let wave = 1; wave <= 40; wave++) {
  assert.equal(progression.wave, wave);
  if (progression.queue.some(type => type === 'duende' || type === 'jaguarBoss')) bossWaves.push(wave);
  progression.queue = []; progression.enemies = []; progression.update(1 / 120);
  if (wave < 40) { assert.equal(progression.mode, 'playing'); while (progression.wave === wave) progression.update(.25); }
}
assert.deepEqual(bossWaves, [5, 10, 15, 20, 25, 30, 35, 40]); assert.equal(progression.mode, 'victory');
progression.start({ mode: 'run', arena: 'jungle', weapon: 'dart' }); assert.equal(progression.wave, 1); assert.equal(progression.totalWaves, 10); assert.equal(progression.player.weapon, 'dart'); assert.equal(progression.rank('damage'), 0);
progression.level = 40; progression.xp = 99999; assert(!progression.levelUp());
const png = fs.readFileSync(path.join(__dirname, '../assets/weapon-sheet.png')); const width = png.readUInt32BE(16), height = png.readUInt32BE(20);
for (const w of WEAPONS.filter(w => w.art)) { const [x, y, ww, hh] = w.art; assert(x >= 0 && y >= 0 && x + ww <= width && y + hh <= height); }
console.log('PASS: 12 weapons, all four arenas, collisions, cap/eligibility/fallback, four cards, enhancements/swaps, optional staff, powerups, statuses, cover/splash cap, separate projectile budgets, 40-wave progression, XP cap and restart.');

const snake = playing(); snake.spawn('tommy'); const striker = snake.enemies.at(-1);
Object.assign(striker, { x: 650, y: 575, warmup: 0, rushTimer: 0, routeTimer: 99 });
snake.enemyTick(striker, 1 / 120); assert(striker.rushWindup > 0); assert.equal(striker.rushTime, 0);
for (let i = 0; i < 62; i++) snake.enemyTick(striker, 1 / 120);
assert(striker.rushTime > 0, 'Tommy strike failed after warning');
const spirit = playing(); spirit.spawn('miniLlorona'); const echo = spirit.enemies.at(-1);
Object.assign(echo, { x: 710, y: 575, warmup: 0, shotTimer: 0, routeTimer: 99 });
spirit.enemyTick(echo, 1 / 120); assert.equal(spirit.bullets.filter(b => b.hostile).length, 3);
assert.equal(echo.boss, undefined, 'Mini Llorona incorrectly counts as a full boss');
console.log('PASS: Tommy warned strike and Mini Llorona ranged fan; neither changes Story enemy definitions.');

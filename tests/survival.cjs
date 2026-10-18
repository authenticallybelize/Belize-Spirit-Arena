const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { Game, SURVIVAL_WAVES, WEAPONS, PERKS, POWERS, move, visible } = require('../survival.js');
const { circleRect, AIM_HEIGHT, aimAt } = require('../core.js');
const originalArenas = require('./fixtures/original-arenas.json');
const originalBounds = { canyon: { x: 180, y: 145, w: 835, h: 685 }, underworld: { x: 180, y: 145, w: 835, h: 685 }, coast: { x: 180, y: 145, w: 835, h: 685 }, jungle: { x: 135, y: 232, w: 930, h: 728 } };
const seeded = seed => () => ((seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 4294967296);
function playing(weapon = 'slingshot', arena = 'canyon') { const g = new Game(seeded(8)); g.start({ arena, mode: 'survival' }); g.player.weapon = weapon; g.refreshStats(); g.spawnTimer = 999; return g; }
function enemy(g, x = 710, y = 575, hp = 1000) {
  const e = { id: g.nextId++, x, y, r: 15, hp, maxHp: hp, xp: 5, type: 'crab', speed: 0, damage: 0, warmup: 0, hit: 0, routeTimer: 99, shotTimer: 99, statuses: {} };
  g.enemies.push(e); return e;
}
function pick(g, id) { g.mode = 'upgrade'; g.choices = [PERKS.find(p => p.id === id)]; return g.choose(0); }
const northAim = playing(); northAim.player.x = 610; northAim.player.y = northAim.arena.bounds.y + northAim.player.r;
northAim.update(1 / 60, { shooting: true, relativeAim: true, aimDX: 1, aimDY: 0 });
assert(northAim.bullets.some(b => !b.hostile && b.y > northAim.arena.bounds.y), 'North-wall muzzle killed a horizontal shot');
assert.equal(northAim.player.y, northAim.arena.bounds.y + northAim.player.r + AIM_HEIGHT);
function field(weapon = 'slingshot') { const g = playing(weapon, 'open'); g.arena = { ...g.arena, obstacles: [] }; Object.assign(g.player, { x: 200, y: 400, angle: 0 }); return g; }
assert.equal(WEAPONS.length, 12); assert.equal(PERKS.length, 31); assert.equal(Object.keys(POWERS).length, 10);
for (const w of WEAPONS) {
  const g = playing(w.id), e = enemy(g, w.melee ? 660 : 710);
  g.update(1 / 120, { shooting: true, aimX: e.x, aimY: e.y });
  for (let i = 0; i < 180; i++) g.update(1 / 120);
  assert(e.hp < 1000, w.name + ' did not damage target');
}
for (const arena of ['canyon', 'jungle', 'underworld', 'coast']) {
  const g = playing('slingshot', arena);
  assert.equal(g.arena.width, 1200); assert.equal(g.arena.height, 1200);
  assert.deepEqual(g.arena.bounds, originalBounds[arena], 'Supplied map boundary changed');
  assert.deepEqual(g.arena.obstacles, originalArenas[arena].obstacles, 'Supplied map boulders/walls changed');
  assert.equal(require('node:crypto').createHash('sha256').update(fs.readFileSync(path.join(__dirname, '../assets', g.arena.image))).digest('hex'), originalArenas[arena].sha256, 'Supplied arena image changed');
  const edge = { x: g.arena.bounds.x + 14, y: g.arena.bounds.y + 14, r: 13 }; move(g, edge, -1000, -1000); assert.equal(edge.x, g.arena.bounds.x + 13); assert.equal(edge.y, g.arena.bounds.y + 13);
  for (const type of ['crab', 'jaguar', 'shadow', 'duende', 'jaguarBoss', 'tommy', 'miniLlorona']) {
    assert(g.spawn(type)); const e = g.enemies.at(-1);
    assert(Math.hypot(e.x - g.player.x, e.y - g.player.y) > 230);
    assert(!g.arena.obstacles.some(o => circleRect(e.x, e.y, e.r, o)));
  }
  const o = g.arena.obstacles[0], p = { x: o.x - 30, y: o.y + o.h / 2, r: 13 };
  move(g, p, 500, 0); assert(p.x + p.r <= o.x + .01);
}
const open = playing('slingshot', 'open'); assert.deepEqual(open.arena.bounds, { x: 88, y: 88, w: 2224, h: 2224 }); assert.deepEqual(open.arena.obstacles, []);
assert.equal(open.arena.width, 2400); assert.equal(open.arena.height, 2400); assert.deepEqual(open.player.x, 1200); assert.deepEqual(open.player.y, 1200);
for (const type of ['crab', 'jaguar', 'shadow', 'duende', 'jaguarBoss', 'tommy', 'miniLlorona']) assert(open.spawn(type), 'Open field spawn failed: ' + type);
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
const stick = field(); stick.update(1 / 120, { dx: 1, dy: 1, shooting: true, relativeAim: true, aimDX: .6, aimDY: .8, aimX: 0, aimY: 0 });
const directed = stick.bullets[0]; assert(Math.abs(directed.vx / directed.vy - .6 / .8) < 1e-9, 'Moving Joe shot toward stale joystick coordinates');
assert(Math.abs((directed.x - stick.player.x) / (directed.y - (stick.player.y - AIM_HEIGHT)) - .6 / .8) < 1e-9, 'Projectile muzzle was offset from its aim ray');
for (let i = 0; i < 15; i++) stick.update(1 / 120, { dx: -1, dy: 1, relativeAim: true, aimDX: .6, aimDY: .8 });
assert(Math.abs(stick.player.angle - Math.atan2(.8, .6)) < 1e-9, 'Movement drifted a held aiming stick');
const cursor = field(); cursor.update(1 / 120, { dx: 1, dy: 1, shooting: true, aimX: 600, aimY: 250 });
const cursorBullet = cursor.bullets[0], aimX = 600 - cursor.player.x, aimY = 250 - (cursor.player.y - AIM_HEIGHT);
assert(Math.abs(cursorBullet.vx * aimY - cursorBullet.vy * aimX) < 1e-6, 'Absolute aim was calculated before movement or from a different muzzle');
const aimedClaw = field('claw'), closeTarget = enemy(aimedClaw, aimedClaw.player.x + 30, aimedClaw.player.y - 20);
aimedClaw.update(1 / 120, { shooting: true, aimX: closeTarget.x, aimY: closeTarget.y });
assert.equal(closeTarget.hp, 976, 'Claw missed the cursor target because its arc used a different origin');
assert.equal(aimedClaw.flashes[0].y, aimedClaw.player.y - AIM_HEIGHT);
const groundedDrum = field('drum'); groundedDrum.fire(); assert.equal(groundedDrum.flashes[0].y, groundedDrum.player.y, 'Drum radial pulse lost its ground origin');
for (let i = 0; i < 6; i++) assert(pick(a, 'damage'));
assert(!a.eligible(PERKS.find(p => p.id === 'damage'))); assert(!pick(a, 'damage'));
assert(Math.abs(a.player.damage - 19 * 1.25 ** 6) < 1e-8);
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
for (let i = 0; i < 19; i++) expiry.update(.25); expiry.update(.24); assert.equal(expiry.drops.length, 2);
expiry.pause(); expiry.update(.25); assert.equal(expiry.drops.length, 2); expiry.resume(); expiry.update(.02); assert.equal(expiry.drops.length, 0);
const grace = playing(); grace.addDrop('bow', grace.player.x + 50, grace.player.y); grace.queue = []; grace.update(1 / 120); const reward = grace.drops.find(d => d.kind === 'weapon');
const rewardLife = reward.life; for (let i = 0; i < 12; i++) grace.update(.25); assert.equal(reward.life, rewardLife, 'Weapon grace expired during intermission');
while (grace.wave === 1) grace.update(.05); grace.spawnTimer = 999; assert(reward.life > 4.9, 'Round start did not give floor weapons five seconds');
for (let i = 0; i < 21; i++) grace.update(.25); assert(!grace.drops.includes(reward));
const venom = playing('dart'), v = enemy(venom); venom.damageEnemy(v, 0, { poison: 6 }); venom.damageEnemy(v, 0, { poison: 3 }); assert.equal(v.statuses.poison.dps, 6);
for (let i = 0; i < 360; i++) venom.update(1 / 120); assert(Math.abs(v.hp - 982) < .01, 'Poison refresh stacked or lost ticks');
const bomb = playing('cohune'); bomb.ranks.damage = 5; bomb.ranks.blast = 4; bomb.collectPower('evolution'); bomb.explode({ x: 610, y: 575, damage: 100 }); assert.equal(bomb.flashes.at(-1).r, 160);
const behind = enemy(bomb, 500, 480); bomb.explode({ x: 610, y: 480, damage: 100 }); assert.equal(behind.hp, 1000, 'Explosion crossed rock cover');
const nuke = playing(); enemy(nuke, 710, 575, 10); nuke.collectPower('nuke'); assert.equal(nuke.kills, 1); assert.equal(nuke.gems[0].value, 2.25);
const clearing = playing(); const queued = [...clearing.queue], waiting = enemy(clearing, 500, 480); waiting.warmup = 1;
const boss = enemy(clearing, 800, 900, 5000); Object.assign(boss, { boss: true, type: 'jaguarBoss', warmup: 1.7 });
clearing.shot(610, 575, 0, true, 5); clearing.collectPower('nuke');
assert.equal(clearing.enemies.length, 0); assert.equal(clearing.kills, 2); assert.equal(clearing.bossesDefeated, 1);
assert.equal(clearing.bullets.length, 0); assert.deepEqual(clearing.queue, queued, 'Nuke consumed future enemies');
assert(clearing.drops.some(d => d.kind === 'weapon' && d.boss)); assert.equal(clearing.mode, 'playing', 'Nuke fabricated a wave victory');
const shield = playing(); shield.collectPower('shield'); shield.hurt(20); assert.equal(shield.player.hp, 100); shield.powers = {}; shield.hurt(20); assert.equal(shield.player.hp, 80);
const trophy = playing(); const firstBoss = enemy(trophy); firstBoss.boss = true; firstBoss.type = 'duende'; trophy.defeat(firstBoss);
assert(pick(trophy, 'trophy')); assert.equal(trophy.player.damage, 19, 'Trophy applied to a boss killed before acquiring it');
const secondBoss = enemy(trophy); secondBoss.boss = true; secondBoss.type = 'duende'; trophy.defeat(secondBoss); trophy.refreshStats(); assert.equal(trophy.player.damage, 19 * 1.05);
const homing = playing('feather'); homing.fire(); const initialTurn = homing.bullets[0].homing; homing.bullets = []; assert(pick(homing, 'homing')); homing.fire(); assert(homing.bullets[0].homing > initialTurn);
let priorSeeking = 0;
for (let rank = 1; rank <= 4; rank++) {
  const feather = field('feather'); feather.weaponLevels.feather = rank; feather.refreshStats();
  const aimTarget = enemy(feather, 650, 408); enemy(feather, 150, 368); enemy(feather, 300, 520);
  feather.fire(); const shot = feather.bullets[0]; assert.equal(shot.targetId, aimTarget.id, 'Feather selected an enemy behind/off the aimed path');
  assert(shot.homing > priorSeeking); priorSeeking = shot.homing;
  enemy(feather, 400, 380); feather.update(1 / 120); assert.equal(shot.targetId, aimTarget.id, 'Feather changed its live target for a nearer enemy');
  for (let i = 0; i < 190; i++) feather.update(1 / 120);
  assert(feather.enemies.some(e => e.hp < 1000), 'Seeking feather missed every enemy');
  if (rank === 4) assert(!feather.eligible(PERKS.find(p => p.id === 'homing')), 'Fully seeking weapon offered a dead homing rank');
}
const tracking = field('feather'); tracking.weaponLevels.feather = 4; tracking.refreshStats(); const diagonal = enemy(tracking, 600, 650);
tracking.fire(); for (let i = 0; i < 190; i++) tracking.update(1 / 120); assert(diagonal.hp < 1000, 'Rank IV failed to capture a visible diagonal target');
for (const [distance, degrees] of [[120, -70], [120, 70], [250, 70], [700, -15], [700, 15], [700, 45]]) {
  const seek = field('feather'); Object.assign(seek.player, { x: 300, y: 550 }); seek.weaponLevels.feather = 4; seek.refreshStats();
  const angle = degrees * Math.PI / 180, target = enemy(seek, 300 + Math.cos(angle) * distance, seek.player.y - AIM_HEIGHT + Math.sin(angle) * distance);
  seek.fire(); for (let i = 0; i < 190; i++) seek.update(1 / 120);
  assert(target.hp < 1000, 'Rank IV overshot/expired before a visible target at ' + degrees + ' degrees / ' + distance + ' range');
}
const coveredFeather = field('feather'); coveredFeather.arena.obstacles = [{ x: 450, y: 250, w: 40, h: 500 }];
coveredFeather.weaponLevels.feather = 4; const protectedTarget = enemy(coveredFeather, 650, 368);
coveredFeather.fire(); for (let i = 0; i < 190; i++) coveredFeather.update(1 / 120); assert.equal(protectedTarget.hp, 1000, 'Seeking crossed solid cover');
for (const id of ['cohune', 'cacao']) {
  const incompatible = playing(id);
  for (const perk of ['pierce', 'ricochet', 'poison', 'fire']) assert(!incompatible.eligible(PERKS.find(p => p.id === perk)), id + ' offered a perk its attack cannot apply');
}
const smoke = field('cacao'); smoke.weaponLevels.cacao = 4; smoke.ranks.damage = 2; smoke.collectPower('heavy'); smoke.collectPower('evolution'); smoke.fire();
const smokeDamage = smoke.bullets[0].damage; for (let i = 0; i < 112; i++) smoke.update(1 / 120);
assert.equal(smoke.clouds[0].damage, smokeDamage, 'Cloud discarded its enhancement and power damage');

const rocket = field('cohune'), impact = enemy(rocket, 400, 368), splash = enemy(rocket, 450, 368), outside = enemy(rocket, 550, 368);
rocket.fire(); assert.equal(rocket.flashes.length, 0, 'Cohune fired an immediate pulse'); assert(rocket.bullets[0].explosive); assert(rocket.bullets[0].vx > 0);
rocket.update(.2); assert.equal(impact.hp, 1000, 'Rocket hit before reaching its target');
for (let i = 0; i < 35; i++) rocket.update(1 / 120);
assert.equal(impact.hp, 600); assert(splash.hp < 1000 && splash.hp >= 600); assert.equal(outside.hp, 1000);
assert(rocket.flashes.some(f => f.kind === 'explosion'), 'Rocket impact did not emit explosion metadata');
const ordered = field('cohune'); ordered.arena.obstacles = [{ x: 335, y: 250, w: 20, h: 100 }];
const beforeWall = enemy(ordered, 300, 300), afterWall = enemy(ordered, 370, 300);
ordered.shot(200, 300, 0, false, 100, 30000, { explosive: true, r: 9, life: 1 }); ordered.update(1 / 120);
assert.equal(ordered.flashes.find(f => f.kind === 'explosion').x, 276, 'Explosion moved from enemy contact to a downstream wall');
assert.equal(beforeWall.hp, 900); assert.equal(afterWall.hp, 1000, 'Impact splash crossed the downstream wall');
const ricochet = field(); ricochet.arena.obstacles = [{ x: 335, y: 250, w: 20, h: 100 }];
enemy(ricochet, 300, 300); const bounceTarget = enemy(ricochet, 250, 400);
ricochet.shot(200, 300, 0, false, 100, 30000, { bounces: 1 }); ricochet.update(1 / 120);
assert.equal(ricochet.bullets.length, 1, 'Old wall killed a redirected ricochet'); ricochet.update(1 / 120); assert.equal(bounceTarget.hp, 915);
const range = field('cohune'); range.shot(200, 300, 0, false, 100, 1000, { explosive: true, life: .001 }); range.update(1 / 120);
assert.equal(range.flashes.find(f => f.kind === 'explosion').x, 201, 'Rocket overshot the end of its flight');
const border = field('cohune'), rightEdge = border.arena.bounds.x + border.arena.bounds.w;
border.shot(rightEdge - 12, 300, 0, false, 100, 3000, { explosive: true, r: 9 }); border.update(1 / 120);
assert.equal(border.flashes.find(f => f.kind === 'explosion').x, rightEdge - 9, 'Rocket explosion escaped the playable boundary');

const shock = playing(); shock.arena = { ...shock.arena, obstacles: [] };
enemy(shock, 770, 575); enemy(shock, 650, 575); enemy(shock, 700, 575); shock.collectPower('shock'); shock.update(1 / 120);
assert.deepEqual(shock.flashes.find(f => f.kind === 'shock').points.slice(1).map(p => p.x), [650, 700, 770], 'Shock followed enemy array order instead of nearest links');
assert(shock.enemies.every(e => e.hp === 970), 'Shock hit an enemy more than once in one blast');
const boundedShock = field(); Object.assign(boundedShock.player, { x: 200, y: 350 });
for (let row = 0; row < 5; row++) for (let col = 0; col < 4; col++) enemy(boundedShock, 400 + col * 50, 350 + row * 50);
boundedShock.collectPower('shock'); boundedShock.update(1 / 120);
assert.equal(boundedShock.enemies.filter(e => e.hp < 1000).length, 16); assert(boundedShock.enemies.every(e => [970, 1000].includes(e.hp)));
assert.equal(boundedShock.flashes.find(f => f.kind === 'shock').points.length, 17);
const blockedShock = playing(); blockedShock.arena = { ...blockedShock.arena, obstacles: [{ x: 625, y: 550, w: 15, h: 50 }] }; const isolated = enemy(blockedShock, 650, 575);
blockedShock.collectPower('shock'); blockedShock.update(1 / 120); assert.equal(isolated.hp, 1000, 'Shock initiated through solid cover');
const torsoWall = playing(); torsoWall.arena = { ...torsoWall.arena, obstacles: [{ x: 625, y: 540, w: 10, h: 20 }] }; const torsoBlocked = enemy(torsoWall, 650, 575);
assert(visible(torsoWall, torsoWall.player, torsoBlocked)); assert(!visible(torsoWall, aimAt(torsoWall.player), torsoBlocked));
torsoWall.collectPower('shock'); torsoWall.update(1 / 120); assert.equal(torsoBlocked.hp, 1000, 'Shock checked visibility from feet while drawing its ray from the torso');
const feetWall = playing(); feetWall.arena = { ...feetWall.arena, obstacles: [{ x: 625, y: 570, w: 10, h: 10 }] }; const torsoVisible = enemy(feetWall, 650, 575);
assert(!visible(feetWall, feetWall.player, torsoVisible)); assert(visible(feetWall, aimAt(feetWall.player), torsoVisible));
feetWall.collectPower('shock'); feetWall.update(1 / 120); assert.equal(torsoVisible.hp, 970);
assert.deepEqual(feetWall.flashes.find(f => f.kind === 'shock').points[0], aimAt(feetWall.player));
const budgets = playing();
for (let i = 0; i < 210; i++) budgets.shot(610, 575, 0, false, 1);
for (let i = 0; i < 160; i++) budgets.shot(610, 575, 0, true, 1);
assert.equal(budgets.bullets.filter(b => !b.hostile).length, 200); assert.equal(budgets.bullets.filter(b => b.hostile).length, 150);
budgets.bullets[0].secondary = true; assert(budgets.shot(610, 575, 0, false, 5)); assert.equal(budgets.bullets.filter(b => !b.hostile).length, 200);
const exhausted = playing(); for (const p of PERKS) exhausted.ranks[p.id] = p.max; exhausted.xp = exhausted.xpNeeded; exhausted.levelUp(); assert(exhausted.choices.every(p => p.id === 'overflowHeal'));
assert.equal(exhausted.choices.length, 1, 'Exhausted pool repeated the same fallback card');
const capped = playing(); for (const p of PERKS) capped.ranks[p.id] = p.max; capped.ranks.speed--; capped.xp = capped.xpNeeded; capped.levelUp();
assert.deepEqual(capped.choices.map(p => p.id), ['speed'], 'Max-rank perks were offered');
assert(capped.choices[0].detail.includes('Current 5/6 · +1 rank'), 'Final available rank looked like an already-maxed perk');
assert(capped.choose(0)); assert.equal(capped.rank('speed'), 6);
capped.xp = capped.xpNeeded; capped.levelUp(); assert(!capped.choices.some(p => p.id === 'speed'), 'Choosing the final rank did not remove the perk');
const progression = playing(); const bossWaves = [];
for (let wave = 1; wave <= SURVIVAL_WAVES; wave++) {
  assert.equal(progression.wave, wave);
  if (progression.queue.some(type => require('../survival.js').TYPES[type].boss)) bossWaves.push(wave);
  progression.queue = []; progression.enemies = []; progression.update(1 / 120);
  if (wave < SURVIVAL_WAVES) { assert.equal(progression.mode, 'playing'); while (progression.wave === wave) progression.update(.25); }
}
assert.deepEqual(bossWaves, Array.from({ length: 28 }, (_, i) => (i + 1) * 5)); assert.equal(progression.mode, 'victory'); assert.equal(progression.enduranceBonus, 1);
progression.start({ mode: 'run', arena: 'jungle', weapon: 'dart' }); assert.equal(progression.wave, 1); assert.equal(progression.totalWaves, 10); assert.equal(progression.player.weapon, 'slingshot'); assert.equal(progression.rank('damage'), 0);
progression.level = 40; progression.xp = progression.xpNeeded; assert(progression.levelUp()); assert.equal(progression.level, 41);
const png = fs.readFileSync(path.join(__dirname, '../assets/weapon-sheet.png')); const width = png.readUInt32BE(16), height = png.readUInt32BE(20);
for (const w of WEAPONS.filter(w => w.art)) { const [x, y, ww, hh] = w.art; assert(x >= 0 && y >= 0 && x + ww <= width && y + hh <= height); }
console.log('PASS: 12 weapons, five arenas, collisions, perk caps/eligibility/fallback, four cards, enhancements, powers, statuses, cover/budgets, 140 waves, uncapped XP and restart.');

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
console.log('PASS: separate open-field 2224-square bounds, original map hashes/walls/borders, five-second floor weapons/intermission grace, maxed/dead perk filtering, rocket flight/splash/order/range/border, smoke damage snapshot, aimed/ranked feather seeking, bounded nearest-link Shock and full-map Nuke.');

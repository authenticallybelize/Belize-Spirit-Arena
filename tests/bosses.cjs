const assert = require('node:assert/strict'), fs = require('node:fs'), path = require('node:path'), vm = require('node:vm'), crypto = require('node:crypto');
const { Game, TYPES, BOSSES, WEAPONS, MOB_WEAPON_CHANCE, ARENAS } = require('../survival.js');
const Base = require('../core.js');
const seed = n => () => ((n = (Math.imul(n, 1664525) + 1013904223) >>> 0) / 4294967296);
function game(wave = 1) { const g = new Game(seed(91)); g.start({ mode: 'survival' }); g.wave = wave - 1; g.beginWave(); g.queue = ['crab']; g.spawnTimer = 999; return g; }
function boss(g, type) { assert(g.spawn(type)); const e = g.enemies.at(-1); Object.assign(e, { x: g.player.x - 110, y: g.player.y, warmup: 0, attackTimer: 0, shotTimer: 0, routeTimer: 0 }); return e; }
assert.equal(BOSSES.length, 9); assert.equal(new Set(BOSSES).size, 9); assert.equal(BOSSES[3], 'duende');
for (let wave = 1; wave <= 140; wave++) {
  const g = game(); g.wave = wave - 1; g.beginWave();
  assert.deepEqual(g.queue.filter(id => TYPES[id].boss), wave % 5 ? [] : [BOSSES[(wave / 5 - 1) % 9]]);
  if (wave < 20) assert(!g.queue.includes('duende'));
}
for (const mode of ['survival', 'run']) for (const w of WEAPONS) { const g = game(); g.start({ mode, weapon: w.id }); assert.equal(g.player.weapon, 'slingshot'); }
assert(!fs.readFileSync(path.join(__dirname, '../survival.html'), 'utf8').includes('starterWeapon'));
assert(!fs.readFileSync(path.join(__dirname, '../survival-ui.js'), 'utf8').includes('starterWeapon'));
const clear = game(); clear.queue = []; clear.update(.01); assert(!clear.drops.some(d => d.kind === 'weapon'), 'Wave clear still gives a free weapon');
for (const type of BOSSES) for (let index = 0; index < WEAPONS.length; index++) {
  const g = game(20), e = boss(g, type); g.random = () => (index + .5) / WEAPONS.length; g.defeat(e); g.defeat(e);
  const drops = g.drops.filter(d => d.kind === 'weapon'); assert.equal(drops.length, 1); assert.equal(drops[0].id, WEAPONS[index].id); assert(drops[0].boss); assert.equal(g.bossesDefeated, 1);
}
for (let index = 0; index < WEAPONS.length; index++) {
  const g = game(), e = boss(g, 'crab'), rolls = [.99, MOB_WEAPON_CHANCE - .00001, (index + .5) / WEAPONS.length];
  g.random = () => rolls.shift(); g.defeat(e); assert.equal(g.drops[0].id, WEAPONS[index].id);
}
const noDrop = game(), ordinary = boss(noDrop, 'crab'), rolls = [.99, MOB_WEAPON_CHANCE]; noDrop.random = () => rolls.shift(); noDrop.defeat(ordinary); assert.equal(noDrop.drops.length, 0);
const fullDrops = game(), guaranteed = boss(fullDrops, 'duende');
for (let i = 0; i < 24; i++) fullDrops.addDrop('shield', 1000, 1000, 'power', true);
fullDrops.defeat(guaranteed); assert.equal(fullDrops.drops.length, 24); assert(fullDrops.drops.some(d => d.kind === 'weapon' && d.boss));
assert(Math.abs(TYPES.duende.hp - 1050 * 1.15 * 5) < 1e-8); assert.equal(TYPES.duende.damage, 100); assert.equal(Base.TYPES.duende.hp, 1050); assert.equal(Base.TYPES.duende.damage, 20);
const duende = game(20), d = boss(duende, 'duende'); duende.enemyTick(d, .01); assert(duende.bullets.length >= 12); assert(duende.bullets.every(b => b.damage === 65 * d.shotScale));
for (const type of BOSSES.filter(id => TYPES[id].bossAI)) {
  const g = game(20), e = boss(g, type); g.player.maxHp = g.player.hp = 10000;
  for (let i = 0; i < 1800; i++) {
    g.enemyTick(e, 1 / 120); g.tickAreas(1 / 120); g.player.invincible = Math.max(0, g.player.invincible - 1 / 120);
    assert(Number.isFinite(e.x + e.y + e.actionTime)); assert(g.hazards.length <= 24); assert(g.bullets.length <= 150);
  }
  assert(e.skillIndex >= 2, type + ' never alternated skills');
  assert(g.bullets.length || g.player.hp < 10000, type + ' had no working damage attack');
}
for (const arena of Object.keys(ARENAS)) for (const type of BOSSES) { const g = game(20); g.start({ mode: 'survival', arena }); assert(g.spawn(type), type + ' failed to spawn in ' + arena); }
for (const type of BOSSES) {
  const g = game(20), e = boss(g, type);
  Object.assign(e, { x: g.player.x + 140, y: g.player.y - Base.AIM_HEIGHT, speed: 0, attackTimer: 999, shotTimer: 999 });
  const hp = e.hp; g.player.invincible = 999;
  for (let i = 0; i < 120; i++) g.update(1 / 120, { shooting: true, aimX: e.x, aimY: e.y });
  assert(e.hp < hp, 'Sling could not damage ' + type);
}
const area = game(), owner = boss(area, 'femaleSisimite'); area.addArea(owner, area.player.x, area.player.y, 80, 1, 1, '#ffffff');
area.tickAreas(.99); assert.equal(area.player.hp, 100); area.tickAreas(.02); assert(area.player.hp < 100, 'Active ground circle did not damage');
const hp = area.player.hp; area.tickAreas(.1); assert.equal(area.player.hp, hp, 'Area ignored damage immunity');
area.player.invincible = 0; area.player.x += 200; area.tickAreas(.1); assert.equal(area.player.hp, hp, 'Dodged circle dealt damage');
area.defeat(owner); assert.equal(area.hazards.length, 0, 'Parent defeat left hostile ground effects');
const covered = game(), c = boss(covered, 'anansiBoss'); covered.arena = { ...covered.arena, obstacles: [{ x: 1190, y: 1170, w: 10, h: 60 }] };
covered.addArea(c, 1180, 1200, 100, 0, 1, '#ffffff'); covered.tickAreas(.01); assert.equal(covered.player.hp, 100, 'Area crossed solid cover');
const paused = game(), p = boss(paused, 'xtabaiBoss'); paused.addArea(p, paused.player.x, paused.player.y, 80, 1, 1, '#ffffff');
paused.pause(); paused.update(.25); assert.equal(paused.hazards[0].delay, 1); paused.resume(); paused.collectPower('freeze'); paused.tickAreas(.2); assert.equal(paused.hazards[0].delay, .9);
for (let i = 0; i < 40; i++) paused.addArea(p, 1000, 1000, 30, 1, 1, '#ffffff'); assert.equal(paused.hazards.length, 24); paused.start(); assert.equal(paused.hazards.length, 0);
for (const type of ['alphaCrab', 'shadowBrute']) {
  const g = game(23), e = boss(g, type); e.x = g.player.x - e.reach + 5;
  g.enemyTick(e, .01); assert.equal(e.action, 'windup'); assert.equal(g.player.hp, 100);
  g.enemyTick(e, e.windup + .01); assert(g.player.hp < 100); assert.equal(g.hazards.length, 1);
  g.player.hp = 100; g.player.invincible = 0; g.tickAreas(.01); assert(g.player.hp < 100, 'Alpha impact area had no damage');
}
const soch = game(40), s = boss(soch, 'sochBoss'); s.hp = s.maxHp * .25; soch.enemyTick(s, .01); assert(!s.transformed);
s.hp -= 1; const remaining = s.hp; soch.enemyTick(s, .01); assert.equal(s.form, 'transform'); assert.equal(s.hp, remaining);
soch.enemyTick(s, 1.2); assert.equal(s.form, 'harpy'); soch.enemyTick(s, .5); assert.equal(s.form, 'harpy'); assert.equal(s.hp, remaining);
const sandbox = { window: {} };
for (const file of ['roster.js', 'bosses.js']) vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../assets', file), 'utf8'), sandbox);
const manifest = JSON.parse(fs.readFileSync(path.join(__dirname, '../assets/ready/bosses/manifest.json'))); assert.equal(manifest.length, 8);
for (const item of manifest) {
  const data = fs.readFileSync(path.join(__dirname, '../assets', item.file)); assert.equal(data.readUInt32BE(16), 768); assert.equal(data.readUInt32BE(20), 512); assert.equal(data[25], 6);
  assert.equal(crypto.createHash('sha256').update(data).digest('hex'), item.runtimeSHA256); assert(sandbox.window.ARENA_ROSTER[item.id]);
}
const drawSource = fs.readFileSync(path.join(__dirname, '../game.js'), 'utf8');
const start = drawSource.indexOf('  function drawEnemy('), end = drawSource.indexOf('  function drawJoe(', start), circles = [];
const drawing = { window: sandbox.window, game: { player: { x: 1200 } }, ctx: new Proxy({}, { get: (_, key) => key === 'arc' ? (...args) => circles.push(args) : () => {} }), shadow() {}, drawSprite() {} };
vm.createContext(drawing); vm.runInContext(drawSource.slice(start, end) + '\nthis.draw = drawEnemy;', drawing);
for (const type of ['spiderling', 'worker', 'bees', 'rootling', 'owlShade']) {
  circles.length = 0; drawing.draw({ ...TYPES[type], type, id: 1, x: 1200, y: 1200, warmup: 0, action: 'windup', actionTime: .1, attackAngle: 0, hp: 20, maxHp: 30 }, 0);
  assert.equal(circles.length, 0, type + ' still draws a misleading attack ring');
}
circles.length = 0; drawing.draw({ ...TYPES.alphaCrab, type: 'alphaCrab', id: 1, x: 1200, y: 1200, warmup: 0, action: 'windup', actionTime: .1, hp: 100, maxHp: 100 }, 0);
assert(circles.some(args => args[2] === TYPES.alphaCrab.reach), 'Alpha warning radius did not match its actual hit radius');
console.log('PASS: nine-boss rotation, wave-20 5x Duende, forced Sling start, all random weapon/drop boundaries, no free wave weapons, boss damage/AI/spawning, real warned areas/cover/pause/freeze/caps/cleanup, Soch 25% transformation and eight verified atlases.');

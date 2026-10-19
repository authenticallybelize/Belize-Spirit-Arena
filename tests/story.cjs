const assert = require('node:assert/strict'), fs = require('node:fs'), path = require('node:path'), crypto = require('node:crypto');
const Base = require('../core.js'), Run = require('../survival.js'), S = require('../story.js'), D = require('../story-dialogue.js');
const { Game, Store, Cinematic, SCENES, KEY, fresh } = S;
const seeded = seed => () => ((seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 4294967296);
function memory(raw = null) { const values = new Map(raw === null ? [] : [[KEY, raw]]); return { getItem(k) { return values.get(k) || null; }, setItem(k, v) { values.set(k, v); } }; }
function launch(scene = 0, skip = false) {
  const storage = memory(), store = new Store(storage), game = new Game(seeded(7));
  const film = new Cinematic(SCENES, skipped => { store.recordPrologue(skipped); game.startStory(store); });
  while (film.scene < scene) film.advance(); if (skip) film.end(true); else while (!film.done) film.advance();
  return { game, store, storage };
}
assert.equal(SCENES.length, 12);
for (const s of [...SCENES, ...D.AFTER.flat(), ...Object.values(D.BEATS).flat(), ...D.ENDING]) {
  for (const f of [s.art, s.actor].filter(Boolean)) assert(fs.existsSync(path.join(__dirname, '../assets', f)), 'Missing scene art ' + f);
  assert(s.lines.length && s.lines.every(l => l.length >= 2));
}
const watched = launch();
for (let scene = 0; scene < SCENES.length; scene++) {
  const skipped = launch(scene, true); assert.deepEqual(skipped.game.player, watched.game.player); assert.deepEqual(skipped.game.queue, watched.game.queue);
  assert(skipped.store.data.prologueSkipped); assert(S.valid(new Store(skipped.storage).data)); assert(!skipped.store.data.survivalUnlocked);
}
const film = new Cinematic(SCENES, () => {}); film.paused = true; film.update(1); assert.equal(film.time, 0); assert(!film.advance());
film.paused = false; film.update(.04); film.advance(); assert.equal(film.sceneTime, .04); film.advance(); assert.equal(film.sceneTime, 0);
const { game: g, store, storage } = watched;
g.wave = 2; g.player.hp = 70; g.ranks.damage = 1; g.upgrades = ['damage']; g.beginWave();
const cp = JSON.stringify(store.data.checkpoint); store.recordPrologue(true); assert.equal(JSON.stringify(store.data.checkpoint), cp);
const resumed = new Game(seeded(9)); resumed.startStory(new Store(storage), true); assert.equal(resumed.wave, 3); assert.equal(resumed.player.hp, 70); assert.equal(resumed.player.damage, 23.75);
assert.deepEqual(resumed.upgrades, ['damage']);
const legacyGame = new Base.Game(); legacyGame.start();
const legacy = { ...fresh(), version: 1, currentWave: 2, checkpoint: { wave: 2, level: 2, xp: 3, upgrades: ['damage'], player: { ...legacyGame.player, hp: 80 } } };
const legacyStorage = memory(JSON.stringify(legacy)), migrated = new Store(legacyStorage); assert(!migrated.readOnly); assert.equal(migrated.data.version, 2); assert.equal(migrated.data.checkpoint.ranks.damage, 1);
assert.equal(JSON.parse(legacyStorage.getItem(KEY)).version, 1); assert(migrated.recordPrologue(false));
const oldComplete = new Store(memory(JSON.stringify({ ...legacy, checkpoint: null, currentWave: 5, completedArenas: ['jungle'], unlockedWeapons: ['slingshot', 'staff'], survivalUnlocked: true })));
assert(!oldComplete.readOnly); assert.equal(oldComplete.data.checkpoint.stage, 'guardian'); assert(oldComplete.data.survivalUnlocked);
for (const raw of ['{bad json', JSON.stringify({ version: 99 }), JSON.stringify({ ...fresh(), checkpoint: { player: {} } }), JSON.stringify({ ...legacy, checkpoint: { ...legacy.checkpoint, player: { ...legacy.checkpoint.player, hp: null } } })]) {
  const storage = memory(raw), damaged = new Store(storage); damaged.recordPrologue(false); assert.equal(storage.getItem(KEY), raw); assert(damaged.readOnly);
}
const concurrent = memory(JSON.stringify(fresh())), first = new Store(concurrent), second = new Store(concurrent);
first.recordPrologue(false); second.recordPrologue(true); assert(second.readOnly); assert(!JSON.parse(concurrent.getItem(KEY)).prologueSkipped);
const unavailable = new Store({ getItem() { throw Error('denied'); } }); assert(unavailable.readOnly); unavailable.recordPrologue(true);
function encounter(id, wave, arena) {
  const { game } = launch(); game.selectArena(arena); game.wave = wave; game.mode = 'playing'; game.queue = ['crab']; game.enemies = []; game.spawnTimer = 999;
  assert(game.spawn(id)); const boss = game.enemies.find(e => e.boss); boss.warmup = 0; return { game, boss };
}
const keeper = encounter('hollowKeeper', 10, 'underworld');
assert.equal(keeper.game.enemies.filter(e => e.objective).length, 3);
keeper.game.damageEnemy(keeper.boss, 1e9); assert.equal(keeper.boss.hp, keeper.boss.maxHp);
for (const c of keeper.game.enemies.filter(e => e.objective)) { c.warmup = 0; keeper.game.damageEnemy(c, 1e5); }
assert.equal(keeper.game.restoredGround.length, 3); keeper.game.damageEnemy(keeper.boss, 200); assert.equal(keeper.boss.hp, keeper.boss.maxHp - 200);
keeper.boss.attackTimer = 0; keeper.game.enemyTick(keeper.boss, .01); assert(keeper.game.hazards.every(h => h.delay > 1));
keeper.game.pause(); const delay = keeper.game.hazards[0].delay; keeper.game.update(.2); assert.equal(keeper.game.hazards[0].delay, delay);
keeper.game.resume(); keeper.game.damageEnemy(keeper.boss, 1e9); assert(keeper.game.guardianReleased); assert(!keeper.game.hazards.some(h => h.owner === keeper.boss.id));
assert(keeper.game.gems.every(gem => Number.isFinite(gem.value) && gem.value > 0)); keeper.game.gainXP(keeper.game.gems[0].value); assert(Number.isFinite(keeper.game.xp));
const jag = encounter('jaguarBoss', 15, 'pine-ridge'); jag.boss.caveTimer = 0; jag.game.enemyTick(jag.boss, .01);
assert.equal(jag.game.enemies.filter(e => e.summoned).length, 2);
for (let i = 0; i < 20; i++) { jag.boss.caveTimer = 0; jag.game.enemyTick(jag.boss, .01); }
assert(jag.game.enemies.filter(e => e.summoned).length <= 6); jag.game.arenaClock = 5; jag.game.tick(.01, {}); assert(jag.game.hazards.some(h => h.delay > 1));
jag.boss.hp = jag.boss.maxHp * .4; jag.boss.rushTimer = 0; jag.boss.rushTime = 0; jag.boss.rushWindup = 0; jag.game.enemyTick(jag.boss, .01); assert.equal(jag.boss.rushTimer, 2.5); assert(jag.boss.rushWindup > 0);
const tide = encounter('tideWarden', 20, 'coast'), warden = tide.boss, coast = tide.game;
coast.damageEnemy(warden, 1e9); assert.equal(warden.phase, 2); assert.equal(warden.hp, warden.maxHp * .65);
coast.damageEnemy(warden, 1e9); assert.equal(warden.phase, 3); coast.damageEnemy(warden, 1e9); assert(!warden.dead); assert.equal(warden.hp, warden.maxHp * .3);
for (const d of coast.drums) {
  assert(!coast.arena.obstacles.some(o => Base.circleRect(d.x, d.y, 13, o)), 'Drum is blocked'); Object.assign(coast.player, { x: d.x, y: d.y });
  warden.action = 'windup'; coast.tickCoast(.5); assert.equal(d.charge, 0); warden.action = 'recover'; coast.tickCoast(1.21); assert(d.active);
}
coast.damageEnemy(warden, 1e9); assert(warden.dead); assert(coast.guardianReleased);
const campaign = launch(), run = campaign.game, doors = [], bosses = [];
function release(game, enemy) {
  enemy.warmup = 0;
  for (const c of game.enemies.filter(e => e.objective)) { c.warmup = 0; game.damageEnemy(c, 1e9); }
  if (enemy.type === 'tideWarden') { game.damageEnemy(enemy, 1e9); game.damageEnemy(enemy, 1e9); for (const d of game.drums) { Object.assign(game.player, { x: d.x, y: d.y }); enemy.action = 'recover'; game.tickCoast(1.3); } }
  game.damageEnemy(enemy, 1e9); game.enemies = game.enemies.filter(e => !e.dead);
}
while (run.wave <= 20) {
  if (run.mode === 'storyBeat') { run.mode = 'playing'; run.pendingBeat = null; }
  for (const id of [...run.queue]) { assert(run.spawn(id), id); const enemy = run.enemies.find(e => !e.dead && !e.objective); if (enemy.boss) bosses.push([run.wave, id]); release(run, enemy); }
  run.queue = []; for (const c of [...run.enemies]) release(run, c); run.gems = []; run.tick(.01, {});
  if (run.wave % 5) { assert(run.finishedWave); run.breakTime = 0; run.beginWave(); continue; }
  assert.equal(run.mode, 'storyGuardian'); assert.equal(campaign.store.data.completedArenas.length, run.wave / 5);
  const restored = new Game(seeded(15)); restored.startStory(new Store(campaign.storage), true); assert.equal(restored.mode, 'storyGuardian'); assert.equal(restored.queue.length, 0);
  assert.equal(new Store(campaign.storage).data.checkpoint.stage, 'guardian'); campaign.store.lastWritten = campaign.storage.getItem(KEY);
  if (run.wave === 20) { campaign.store.completeChapter(); break; }
  run.openDoor(); assert.equal(run.player.weapon, S.TRIALS[run.wave / 5 - 1].reward); doors.push(run.arenaId);
  const door = new Game(seeded(20)); door.startStory(new Store(campaign.storage), true); assert(door.portal); assert.equal(door.wave, run.wave);
  campaign.store.lastWritten = campaign.storage.getItem(KEY); assert(run.startNextTrial());
}
assert.deepEqual(bosses, [[5, 'duende'], [10, 'hollowKeeper'], [15, 'jaguarBoss'], [20, 'tideWarden']]); assert.deepEqual(doors, ['jungle', 'underworld', 'pine-ridge']);
assert(campaign.store.data.storyComplete); assert(campaign.store.data.survivalUnlocked); assert.equal(campaign.store.data.checkpoint, null);
assert.deepEqual(campaign.store.data.unlockedWeapons, ['slingshot', 'staff', 'obsidian', 'claw']); assert(S.valid(campaign.store.data));
assert(D.AFTER[1][0].lines.some(l => l[1] === 'No, child. I have never seen you.')); assert.equal(Run.BOSSES.length, 9); assert.equal(Run.BOSSES[3], 'duende');
assert.equal(Run.TYPES.duende.hp, Base.TYPES.duende.hp * 1.15 * 5);
const vm = require('node:vm'), access = fs.readFileSync(path.join(__dirname, '../story-access.js'), 'utf8');
for (const [testOpen, earned, redirect] of [[true, false, false], [false, false, true], [false, true, false]]) {
  let target = null; const data = { ...fresh(), storyComplete: earned, survivalUnlocked: earned, completedArenas: earned ? S.TRIALS.map(t => t.id) : [] };
  vm.runInNewContext(access, { StoryCampaign: { ...S, SURVIVAL_TEST_OPEN: testOpen }, localStorage: memory(JSON.stringify(data)), location: { replace(url) { target = url; } } });
  assert.equal(target, redirect ? 'story.html' : null);
}
for (const item of JSON.parse(fs.readFileSync(path.join(__dirname, '../assets/story/manifest.json')))) {
  const bytes = fs.readFileSync(path.join(__dirname, '../assets', item.file)); assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'), item.runtimeSHA256);
}
console.log('PASS: twenty waves/four Guardians, crystal shield, warned fissures/rockfalls, capped cave adds, mandatory three drums, permanent weapons, scene/door retries, v1 migration, protected/concurrent saves, watch/skip and unchanged Survival schedule.');

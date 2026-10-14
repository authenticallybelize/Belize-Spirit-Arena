const assert = require('node:assert/strict');
const fs = require('node:fs'), path = require('node:path');
const Base = require('../core.js');
const { Game, Store, Cinematic, SCENES, KEY, fresh } = require('../story.js');
const { vector } = require('../touch.js');
function memory(raw = null) {
  const values = new Map(raw === null ? [] : [[KEY, raw]]);
  return { getItem(k) { return values.get(k) || null; }, setItem(k, v) { values.set(k, v); } };
}
const baseline = new Base.Game(() => .5); baseline.start();
function launch(scene, skip) {
  const storage = memory(), store = new Store(storage), game = new Game(() => .5);
  const film = new Cinematic(SCENES, skipped => { store.recordPrologue(skipped); game.startStory(store); });
  while (film.scene < scene) film.advance();
  if (skip) film.end(true); else while (!film.done) film.advance();
  return { game, store, storage };
}
assert.equal(SCENES.length, 12);
assert.equal(new Set(SCENES.map(s => s.art)).size, 12);
for (const scene of SCENES) {
  const png = fs.readFileSync(path.join(__dirname, '../assets', scene.art));
  assert.equal(png.subarray(0, 8).toString('hex'), '89504e470d0a1a0a');
  assert(png.readUInt32BE(16) >= 1080 && png.readUInt32BE(20) > png.readUInt32BE(16), 'Missing high-resolution portrait frame: ' + scene.art);
}
const watched = launch(0, false);
assert.deepEqual(watched.game.player, baseline.player);
assert.deepEqual(watched.game.queue, baseline.queue);
assert.equal(watched.store.data.prologueWatched, true);
for (let scene = 0; scene < SCENES.length; scene++) {
  const skipped = launch(scene, true);
  assert.deepEqual(skipped.game.player, watched.game.player);
  assert.deepEqual(skipped.game.queue, watched.game.queue);
  assert.equal(skipped.store.data.prologueSkipped, true);
  const reloaded = new Store(skipped.storage);
  assert.equal(reloaded.data.currentWave, 1);
  assert.equal(reloaded.data.storyStarted, true);
  assert.equal(reloaded.data.survivalUnlocked, false);
}
const film = new Cinematic(SCENES, () => {});
film.paused = true; film.update(1); assert.equal(film.time, 0); assert.equal(film.advance(), false);
film.paused = false; film.update(.04); film.advance();
assert.equal(film.sceneTime, .04, 'Dialogue should not restart the frame camera');
film.advance(); assert.equal(film.sceneTime, 0, 'A new frame should start a new camera move');
const game = watched.game, store = watched.store;
game.wave = 2; game.player.hp = 70; game.player.damage *= 1.25; game.upgrades.push('damage'); game.beginWave();
const checkpoint = JSON.stringify(store.data.checkpoint);
store.recordPrologue(true);
assert.equal(JSON.stringify(store.data.checkpoint), checkpoint, 'Replay changed checkpoint');
const resumed = new Game(() => .5); resumed.startStory(new Store(watched.storage), true);
assert.equal(resumed.wave, 3); assert.equal(resumed.player.hp, 70); assert.equal(resumed.player.damage, 23.75);
assert.deepEqual(resumed.upgrades, ['damage']);
game.wave = 5; game.queue = []; game.enemies = []; game.finishedWave = true; game.player.weapon = 'staff';
game.tick(1 / 120, {});
assert.equal(game.mode, 'storyComplete'); assert.equal(game.breakTime, 0);
assert.deepEqual(store.data.completedArenas, ['jungle']);
assert(store.data.unlockedWeapons.includes('staff')); assert.equal(store.data.storyComplete, false); assert.equal(store.data.survivalUnlocked, false);
for (const raw of ['{bad json', JSON.stringify({ version: 99 }), JSON.stringify({ ...fresh(), checkpoint: { player: {} } })]) {
  const storage = memory(raw), damaged = new Store(storage);
  damaged.recordPrologue(false); assert.equal(storage.getItem(KEY), raw); assert(damaged.readOnly);
}
const oldUnlock = memory(JSON.stringify({ ...fresh(), survivalUnlocked: true }));
const preserved = new Store(oldUnlock); preserved.recordPrologue(false); assert.equal(new Store(oldUnlock).data.survivalUnlocked, true);
const concurrent = memory(JSON.stringify(fresh())), first = new Store(concurrent), second = new Store(concurrent);
first.recordPrologue(false); second.recordPrologue(true);
assert(second.readOnly); assert.equal(JSON.parse(concurrent.getItem(KEY)).prologueSkipped, false);
const unavailable = new Store({ getItem() { throw Error('denied'); } }); assert(unavailable.readOnly); unavailable.recordPrologue(true);
assert.deepEqual(vector(1, 1, 50), { x: 0, y: 0 });
assert(Math.abs(Math.hypot(...Object.values(vector(200, 200, 50))) - 1) < 1e-9);
console.log('PASS: twelve-frame watch/skip parity, unchanged Sling baseline, checkpoint resume, replay, partial Story completion, protected saves/unlocks, concurrent saves, pause and joystick dead zone.');

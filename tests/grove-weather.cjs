const assert = require('node:assert/strict'), fs = require('node:fs'), path = require('node:path'), crypto = require('node:crypto');
const Run = require('../survival.js'), Story = require('../story-campaign.js'), Weather = require('../weather.js'), Base = require('../core.js');
const seeded = seed => () => ((seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 4294967296);
function game(wave = 1, mode = 'survival') { const g = new Run.Game(seeded(97)); g.start({ arena: 'grove', mode }); g.wave = wave - 1; g.beginWave(); g.queue = ['crab']; g.spawnTimer = 999; return g; }
function advance(g, time) { for (let i = 0; i < Math.round(time * 120); i++) g.update(1 / 120); }
const grove = Run.ARENAS.grove, open = Run.ARENAS.open;
assert.equal(grove.width, 2400); assert.equal(grove.height, 2400); assert(grove.scrolling); assert(open.scrolling);
assert.deepEqual(grove.bounds, open.bounds); assert.deepEqual(grove.spawn, open.spawn); assert.equal(open.obstacles.length, 0);
assert.equal(grove.obstacles.length, 8); assert.equal(grove.decor.length, 3);
assert(!grove.obstacles.some(o => Base.circleRect(1200, 1200, 100, o)), 'Joe has no clear starting space');
for (const o of grove.obstacles) {
  const g = game(), wall = { x: o.x - 30, y: o.y + o.h / 2, r: 14 };
  Run.move(g, wall, o.w + 60, 0); assert(wall.x + wall.r <= o.x + .01, 'Landmark did not block ground movement');
  const bird = { x: o.x - 30, y: o.y + o.h / 2, r: 14, flying: true };
  Run.move(g, bird, o.w + 60, 0); assert(bird.x > o.x + o.w, 'Landmark blocked a flying creature');
  assert(!Run.visible(g, { x: o.x - 30, y: wall.y }, { x: o.x + o.w + 30, y: wall.y }), 'Landmark did not block shots');
}
for (const p of grove.decor) assert(!grove.obstacles.some(o => Base.circleRect(p.x + p.w / 2, p.y + p.h / 2, 25, o)), 'A puddle secretly contains solid cover');
for (const o of grove.obstacles) for (const radius of [14, 34]) {
  const g = game(); assert(g.spawn('crab')); const e = g.enemies[0];
  Object.assign(e, { x: o.x - 100, y: o.y + o.h / 2, r: radius, speed: 115, warmup: 0, shotTimer: 999 });
  Object.assign(g.player, { x: o.x + o.w + 150, y: e.y, invincible: 999 });
  for (let i = 0; i < 1200 && Math.hypot(e.x - g.player.x, e.y - g.player.y) > 50; i++) g.enemyTick(e, 1 / 60);
  assert(Math.hypot(e.x - g.player.x, e.y - g.player.y) < 50, 'Ground routing stalled at ' + o.image + ' / radius ' + radius);
}
// Sample cells and their edges use the same conservative padding as enemy routing.
const map = game(), b = grove.bounds, free = new Map();
for (let x = b.x + 50; x < b.x + b.w - 50; x += 40) for (let y = b.y + 50; y < b.y + b.h - 50; y += 40) if (Run.visible(map, { x, y }, { x, y }, 36)) free.set(x + ',' + y, { x, y });
const start = [...free.values()].sort((a, c) => Math.hypot(a.x - 1200, a.y - 1200) - Math.hypot(c.x - 1200, c.y - 1200))[0];
const queue = [start], seen = new Set([start.x + ',' + start.y]);
for (let i = 0; i < queue.length; i++) for (const [dx, dy] of [[40, 0], [-40, 0], [0, 40], [0, -40]]) {
  const p = queue[i], key = (p.x + dx) + ',' + (p.y + dy), next = free.get(key);
  if (next && !seen.has(key) && Run.visible(map, p, next, 36)) { seen.add(key); queue.push(next); }
}
assert.equal(seen.size, free.size, 'Landmarks created inaccessible pockets');
for (const position of [150, 1200, 2250]) for (const type of [...Run.COMMONS, ...Run.ALPHAS, ...Run.BOSSES]) {
  const g = game(100); g.player.x = g.player.y = position;
  g.view = { x: Math.max(0, Math.min(1200, position - 600)), y: Math.max(0, Math.min(1700, position - 350)), w: 1200, h: 700 };
  let ok = false; for (let retry = 0; retry < 5 && !ok; retry++) ok = g.spawn(type);
  assert(ok, type + ' could not arrive near ' + position); const e = g.enemies[0], margin = e.boss ? 120 : 70;
  assert(!grove.obstacles.some(o => Base.circleRect(e.x, e.y, e.r, o)));
  assert(e.x <= g.view.x - margin || e.x >= g.view.x + g.view.w + margin || e.y <= g.view.y - margin || e.y >= g.view.y + g.view.h + margin, 'Grove spawn appeared inside following camera');
}
for (let wave = 1; wave <= 140; wave++) {
  const g = game(wave); assert.equal(g.stormWave, wave % 10 === 0); assert.equal(g.banner.includes('Storm incoming'), wave % 10 === 0);
}
const storm = game(10); storm.random = () => { throw Error('Weather consumed combat randomness'); };
advance(storm, 1); assert(Math.abs(storm.storm - .5) < 1e-8); advance(storm, 8.1);
assert.equal(storm.storm, 1); assert.equal(storm.events.filter(e => e.type === 'thunder').length, 1);
const clock = storm.weatherTime; storm.pause(); storm.update(.25); assert.equal(storm.weatherTime, clock);
storm.resume(); storm.mode = 'upgrade'; storm.update(.25); assert.equal(storm.weatherTime, clock); storm.mode = 'playing';
storm.collectPower('freeze'); advance(storm, .25); assert(storm.weatherTime > clock, 'Freeze unexpectedly stopped ambient weather');
storm.finishedWave = true; storm.breakTime = 4; advance(storm, 2.1); assert.equal(storm.storm, 0);
storm.start({ arena: 'grove', mode: 'survival' }); assert.equal(storm.storm, 0); assert.equal(storm.weatherTime, 0); assert(!storm.stormWave);
for (const [wave, mode] of [[10, 'run'], [140, 'survival']]) {
  const g = game(wave, mode); g.queue = []; g.storm = 1; g.update(.01); assert.equal(g.mode, 'victory'); assert.equal(g.storm, 0); assert(!g.stormWave);
}
const story = new Story.Game(seeded(17)); story.startStory(null);
for (let wave = 1; wave <= 20; wave++) { story.selectArena(Story.TRIALS[Math.floor((wave - 1) / 5)].id); story.wave = wave - 1; story.beginWave(); assert(!story.stormWave); assert.equal(story.storm, 0); }
function drawing(time, strength, reduced = false) {
  const points = [], gradients = [], stack = []; let fills = 0, strokes = 0;
  const point = (...values) => { assert(values.every(Number.isFinite)); points.push(values); };
  const ctx = { globalAlpha: 1, save() { stack.push(this.globalAlpha); }, restore() { this.globalAlpha = stack.pop(); },
    createLinearGradient(...args) { point(...args); return { addColorStop(position, color) { gradients.push([position, color]); } }; },
    fillRect(...args) { fills++; point(...args); }, beginPath() {}, moveTo: point, lineTo: point, stroke() { strokes++; } };
  Weather.draw(ctx, { x: 250, y: 300, w: 1200, h: 700 }, time, strength, reduced);
  assert.equal(stack.length, 0); assert.equal(ctx.globalAlpha, 1); assert(points.length <= 201, 'Unbounded weather particles');
  return { points, gradients, fills, strokes };
}
assert.equal(drawing(9.05, 0).fills, 0); assert.equal(drawing(9.05, 1).strokes, 2);
assert.equal(drawing(9.05, 1, true).strokes, 0); assert.equal(drawing(9.05, 1, true).fills, 1);
assert.deepEqual(drawing(9.05, 1), drawing(9.05, 1), 'Paused weather is not deterministic');
const manifest = JSON.parse(fs.readFileSync(path.join(__dirname, '../assets/grove/manifest.json')));
assert.equal(manifest.entries.length, 4);
for (const item of manifest.entries) {
  const bytes = fs.readFileSync(path.join(__dirname, '../assets', item.file));
  assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'), item.runtimeSHA256); assert.equal(bytes[25], 6);
  assert.equal(bytes.readUInt32BE(16), item.width); assert.equal(bytes.readUInt32BE(20), item.height);
}
console.log('PASS: scrolling Ceiba Grove, real cover/flight/shot blocking, connected large-enemy paths, fair corner spawning, all 140 storm milestones, fade/pause/upgrade/freeze/restart/victory, unchanged Story, no combat RNG, bounded deterministic rain/lightning and reduced motion, four prop hashes.');

'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const root = path.resolve(__dirname, '..');
const assets = path.join(root, 'assets');
const manifest = JSON.parse(fs.readFileSync(path.join(assets, 'ready', 'manifest.json'), 'utf8'));
const hash = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
assert.equal(Object.keys(manifest.weapons).length, 12, 'Every live weapon needs ready art, including Duende Staff');
assert.equal(Object.keys(manifest.powers).length, 9, 'Nine supplied pickup designs; do not invent Reflex artwork');
assert(manifest.missing.includes('Reflex Boost pickup art'));
assert.equal(new Set(manifest.exports.map(item => item.file)).size, manifest.exports.length, 'No overwritten asset IDs');
for (const item of manifest.exports) {
  const file = path.resolve(assets, item.file);
  assert(file.startsWith(assets + path.sep), 'Asset paths must remain inside assets');
  const bytes = fs.readFileSync(file);
  assert.equal(bytes.subarray(0, 8).toString('hex'), '89504e470d0a1a0a', item.file + ' PNG signature');
  assert.equal(bytes.readUInt32BE(16), item.displaySize[0] * 2, item.file + ' width');
  assert.equal(bytes.readUInt32BE(20), item.displaySize[1] * 2, item.file + ' height');
  assert.equal(bytes[25], 6, item.file + ' must retain RGBA transparency');
  assert.equal(hash(bytes), item.sha256, item.file + ' changed without regenerating its manifest');
}
for (const weapon of Object.values(manifest.weapons)) {
  for (const role of ['pickup', 'held', 'projectile', 'impact']) assert(manifest.exports.some(item => item.file === weapon[role]), role + ' missing');
  assert(Number.isFinite(weapon.heldAngle) && Number.isFinite(weapon.projectileAngle));
}
const sourceSprites = JSON.parse(fs.readFileSync(path.join(assets, 'sprites.js'), 'utf8').match(/window\.ARENA_SPRITES = (\{.*?\});/s)[1]);
for (const [id, sprite] of Object.entries(manifest.sprites)) {
  assert.equal(sprite.frames.length, sourceSprites[id].frames.length, id + ' dropped source poses');
  assert.equal(sprite.pivots.length, sprite.frames.length, id + ' missing stable feet anchors');
  sprite.frames.forEach((file, i) => {
    assert(manifest.exports.some(item => item.file === file), id + ' frame not exported');
    assert(sprite.pivots[i].every((n, axis) => Number.isFinite(n) && n >= 0 && n <= sprite.frameSize[axis]), id + ' invalid frame pivot');
  });
}
let originals = 0;
for (const item of manifest.sourceInventory) {
  const file = path.join(root, '..', 'Assets', item.file);
  if (fs.existsSync(file)) { assert.equal(hash(fs.readFileSync(file)), item.sha256, 'Original changed: ' + item.file); originals++; }
}
console.log('Asset check passed: ' + manifest.exports.length + ' ready images; ' + originals + ' local source originals verified. Reflex Boost is explicitly missing.');

'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
const assets = path.join(root, 'assets');
const manifest = JSON.parse(fs.readFileSync(path.join(assets, 'ready', 'manifest.json'), 'utf8'));
const hash = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
assert.equal(Object.keys(manifest.weapons).length, 12, 'Every live weapon needs ready art, including Duende Staff');
assert.equal(Object.keys(manifest.holding).length, 12, 'Every weapon needs an integrated Joe/weapon pose');
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
const context = { window: {} }; vm.runInNewContext(fs.readFileSync(path.join(assets, 'sprites.js'), 'utf8'), context);
for (const [id, actor] of Object.entries(manifest.holding)) {
  assert.equal(actor.frames.length, 8, id + ' missing aim directions');
  assert.equal(actor.pivots.length, 8); assert.equal(actor.bodyHeights.length, 8); assert.equal(actor.angles.length, 8);
  actor.frames.forEach((file, i) => {
    assert(manifest.exports.some(item => item.file === file), id + ' held pose not exported');
    assert(actor.bodyHeights[i] > 40 && actor.bodyHeights[i] <= actor.frameSize[1]);
    assert(actor.pivots[i].every((n, axis) => Number.isFinite(n) && n >= 0 && n <= actor.frameSize[axis]));
    const pose = context.window.ArenaArt.holdingPose(actor, i * Math.PI / 4, 112.5);
    assert.equal(pose.index, i); assert(Math.abs(pose.turn) < 1e-8);
    assert(Math.abs(pose.scale * actor.bodyHeights[i] - 112.5) < 1e-8, id + ' body height changed');
  });
  for (const angle of [-Math.PI * 2 - .1, -.1, .2, Math.PI + .2, Math.PI * 2 + .1]) {
    const pose = context.window.ArenaArt.holdingPose(actor, angle, 112.5);
    assert(pose.index >= 0 && pose.index < 8 && Math.abs(pose.turn) <= Math.PI / 8 + 1e-8);
  }
}
for (const item of manifest.sourceInventory) {
  const file = path.join(root, '..', 'Assets', item.file);
  if (fs.existsSync(file)) { assert.equal(hash(fs.readFileSync(file)), item.sha256, 'Original changed: ' + item.file); originals++; }
}
console.log('Asset check passed: ' + manifest.exports.length + ' ready images; ' + originals + ' local source originals verified. Reflex Boost is explicitly missing.');
for (const [angle,row] of [[Math.PI/2,0],[0,1],[Math.PI,2],[-Math.PI/2,3]]) {
 const art=context.window.ArenaArt;
 assert.equal(art.nativeJoeFrame(angle,false,0),row*5);
 assert.equal(art.nativeJoeFrame(angle,true,0),row*5+1);
 assert.equal(art.nativeJoeFrame(angle,true,1/9+.001),row*5+2);
 for(const frame of [row*5,row*5+1,row*5+2]) {
  const [x,y,w,h]=sourceSprites.joe.frames[frame],[hx,hy,rx,ry,rw,rh]=art.carryHands[frame];
  assert(hx>=x&&hx<x+w&&hy>=y&&hy<y+h);
  assert(rx>=x&&ry>=y&&rx+rw<=x+w&&ry+rh<=y+h,'Carry hand escaped its native keyframe');
 }
}
assert.equal(Object.keys(context.window.ArenaArt.carryGrips).length,12);
for(const grip of Object.values(context.window.ArenaArt.carryGrips))assert(grip.every(n=>n>0&&n<64));
console.log('PASS: original idle/two-frame walking cycle and all twelve measured hand/weapon grip anchors.');
vm.runInNewContext(fs.readFileSync(path.join(assets,'joe-motion.js'),'utf8'),context);
const motion=context.window.ARENA_JOE_MOTION;
function polygonsValid(polys,size) { assert(polys.length>0); for(const poly of polys){assert(poly.length>=3);for(const pair of poly)assert(pair.length===2&&pair.every(v=>Number.isFinite(v)&&v>=0&&v<=size));} }
for(const [id,poses] of Object.entries(motion.holding)) {
 assert.equal(poses.length,8);poses.forEach((pose,i)=>{
  assert(pose.waist.every(v=>v>=0&&v<=160));polygonsValid(pose.polygons,160);
  assert.equal(pose.sha256,hash(fs.readFileSync(path.join(assets,manifest.holding[id].frames[i]))),'Stale motion mask: '+id+'/'+i);
 });
}
for(const frame of Object.keys(context.window.ArenaArt.carryHands)) {polygonsValid(motion.nativeLegs[frame].polygons,112);assert(motion.nativeWaists[frame].length===2);}
for(const frame of [8,9])assert(motion.nativeWaists[frame].length===2);
console.log('PASS: 96 motion masks match current PNG hashes, native waist/leg geometry and Sling charge/release joints.');

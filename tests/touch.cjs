const assert = require('node:assert/strict');
const { settings, load, vector, KEY } = require('../touch.js');
assert.deepEqual(settings(), { size: 112, opacity: .7, deadZone: .16, dashPosition: 'near', leftHanded: false });
assert.deepEqual(load({ getItem() { throw Error('denied'); } }), settings());
for (const raw of ['{', 'null', 'false', JSON.stringify({ size: 'bad', deadZone: 1, opacity: -2, dashPosition: 'wrong', leftHanded: 'true' })]) {
 const value = load({ getItem(key) { assert.equal(key, KEY); return raw; } });
 assert(value.size >= 90 && value.size <= 160); assert(value.opacity >= .25 && value.opacity <= 1); assert(value.deadZone >= .05 && value.deadZone <= .35);
}
const prefs = settings({ size: 160, opacity: .3, deadZone: .3, dashPosition: 'center', leftHanded: true });
assert.deepEqual(load({ getItem() { return JSON.stringify(prefs); } }), prefs);
assert.deepEqual(vector(15, 0, 50, .3), { x: 0, y: 0 });
assert(vector(15, 0, 50, .16).x > 0);
for (const [x,y] of [[100,0],[100,100],[-100,-100],[0,-100]]) assert(Math.abs(Math.hypot(...Object.values(vector(x,y,50))) - 1) < 1e-9);
console.log('PASS: bounded touch settings, malformed/blocked storage, persistence, configurable dead zone and normalized 360-degree movement.');

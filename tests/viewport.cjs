const assert = require('node:assert/strict');
const { follow, point } = require('../viewport.js');
const world = { w: 1200, h: 1200 }, middle = { x: 600, y: 600 };
const near = (a, b) => assert(Math.abs(a - b) < 1e-8, a + ' differs from ' + b);

for (const aspect of [390 / 844, 844 / 390, 1, 2]) {
  const view = follow(middle, world, aspect, false, null, 0);
  near(view.w / view.h, aspect);
  assert(view.w <= world.w && view.h <= world.h, 'Following distorted the world to fill the frame');
  assert(view.x >= 0 && view.y >= 0 && view.x + view.w <= world.w && view.y + view.h <= world.h);
}
const landscape = follow(middle, world, 2, false, null, 0);
assert.deepEqual(landscape, { x: 0, y: 300, w: 1200, h: 600 });
assert.deepEqual(follow({ x: 610, y: 640 }, world, 2, false, landscape, 1 / 60), landscape, 'Joe moved the camera inside its deadzone');
const scrolled = follow({ x: 600, y: 900 }, world, 2, false, landscape, 1 / 60);
assert(scrolled.y > landscape.y && scrolled.y < 552, 'Camera movement snapped instead of easing');
assert.deepEqual(follow({ x: 600, y: 900 }, world, 2, false, landscape, 0), landscape, 'Paused camera kept moving');
let sixty = landscape, oneTwenty = landscape;
for (let i = 0; i < 60; i++) sixty = follow({ x: 600, y: 900 }, world, 2, false, sixty, 1 / 60);
for (let i = 0; i < 120; i++) oneTwenty = follow({ x: 600, y: 900 }, world, 2, false, oneTwenty, 1 / 120);
near(sixty.y, oneTwenty.y);
assert.deepEqual(follow({ x: 1199, y: 1199 }, world, .5, false, null, 0), { x: 600, y: 0, w: 600, h: 1200 });
assert.deepEqual(follow({ x: 1, y: 1 }, world, 2, false, null, 0), { x: 0, y: 0, w: 1200, h: 600 });

const entire = follow(middle, world, 2, true, landscape, 1 / 60);
assert.deepEqual(entire, { x: -600, y: 0, w: 2400, h: 1200 }, 'Entire arena should letterbox instead of stretch');
assert.deepEqual(follow({ x: 1000, y: 1000 }, world, 2, true, entire, 1 / 60), entire, 'Entire arena view followed Joe');
assert.deepEqual(follow(middle, world, .5, true, entire, 0), { x: 0, y: -600, w: 1200, h: 2400 });
const portrait = follow({ x: 1000, y: 1000 }, world, .5, false, scrolled, 0);
assert.deepEqual(portrait, { x: 600, y: 0, w: 600, h: 1200 }, 'Orientation change retained the old camera dimensions');
const restored = follow(middle, world, 2, false, entire, 0);
assert.deepEqual(restored, landscape, 'Disabling entire view retained its letterbox offset');

const rect = { left: 40, top: 25, width: 800, height: 400 };
assert.deepEqual(point(landscape, rect, 440, 225), middle);
const movedAim = point(scrolled, rect, 440, 225);
near(movedAim.x, 600); near(movedAim.y - 600, scrolled.y - landscape.y);
assert.deepEqual(point(portrait, { left: 10, top: 20, width: 300, height: 600 }, 160, 320), { x: 900, y: 600 });
assert.deepEqual(point(entire, rect, 240, 25), { x: 0, y: 0 });
assert.deepEqual(point(entire, rect, 640, 425), { x: 1200, y: 1200 });
console.log('PASS: viewport aspect, smooth deadzone/bounds, frame-rate independence, static letterboxing, orientation changes and scrolling mouse-world coordinates.');
const large = {w:2400,h:2400}, center = {x:1200,y:1200};
const cropped = follow(center,large,2,false,null,0,1200);
assert.deepEqual(cropped,{x:600,y:900,w:1200,h:600});
const right = follow({x:1800,y:1800},large,2,false,cropped,1,1200);
assert(right.x>600 && right.y>900,'Large arena failed to scroll in both axes');
near(right.w/right.h,2);
const overview = follow(center,large,2,true,cropped,0,1200);
assert.deepEqual(overview,{x:-1200,y:0,w:4800,h:2400});
assert.deepEqual(point(cropped,{left:0,top:0,width:1600,height:800},800,400),center);
console.log('PASS: expanded world crops proportionally, follows both axes, preserves mouse coordinates and optional overview.');

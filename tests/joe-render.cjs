const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..'),sandbox={window:{}};
for(const file of ['sprites.js','ready-assets.js'])vm.runInNewContext(fs.readFileSync(path.join(root,'assets',file),'utf8'),sandbox);
Object.assign(sandbox,sandbox.window);
const source=fs.readFileSync(path.join(root,'game.js'),'utf8');
const start=source.indexOf('  function drawJoe(t)'),end=source.indexOf('  let groundPattern',start);
assert(start>=0&&end>start);
let translation=[0,0],stack=[],draws=[];
const ctx={save(){stack.push([...translation]);},restore(){assert(stack.length);translation=stack.pop();},translate(x,y){translation[0]+=x;translation[1]+=y;},rotate(){},beginPath(){},ellipse(){},stroke(){},drawImage(image,...args){draws.push({image,args,translation:[...translation]});},clip(){throw Error('Joe must not be assembled with clipped body layers');}};
const native=sandbox.ARENA_SPRITES.joe,ready=sandbox.ARENA_READY;
const images=Object.fromEntries([native.file,...Object.values(ready.holding).flatMap(a=>a.frames),...Object.values(ready.weapons).map(a=>a.held)].map(file=>[file,{file}]));
const player={x:1200,y:1200,r:18,dashTime:0,invincible:0},input={dx:0,dy:0,shooting:false};
Object.assign(sandbox,{ctx,images,game:{player,mode:'playing'},input,joeHeight:112.5,shadow(){}});
vm.runInNewContext(source.slice(start,end)+'\nthis.renderJoe=drawJoe;',sandbox);
for(const weapon of Object.keys(ready.holding))for(let i=0;i<32;i++)for(const firing of [false,true])for(const walking of [false,true])for(const time of [0,.125]) {
 const angle=Math.atan2(Math.sin(i*Math.PI/16-.01),Math.cos(i*Math.PI/16-.01));Object.assign(player,{weapon,angle,walking});Object.assign(input,{shooting:firing,dx:Math.cos(angle),dy:Math.sin(angle)});draws=[];translation=[0,0];stack=[];
 sandbox.renderJoe(time);assert.equal(stack.length,0,'Canvas transform leaked after Joe');assert.deepEqual(translation,[0,0]);
 const bodies=draws.filter(d=>firing?d.image.file.includes('/holding/'):d.image.file===native.file&&d.args[3]>200);
 assert.equal(bodies.length,1,'Each Joe pose must contain one complete character');
 const d=bodies[0];let foot;
 if(firing) {
  assert.equal(d.args.length,4,'Firing must draw the whole existing PNG');
  const pose=sandbox.ArenaArt.holdingPose(ready.holding[weapon],angle,112.5);
  assert.equal(d.image.file,pose.file);const [x,y,w,h]=d.args;
  assert(Math.abs(w/h-ready.holding[weapon].frameSize[0]/ready.holding[weapon].frameSize[1])<1e-8,'Held Joe stretched');
  foot=[d.translation[0]+x+pose.pivot[0]*pose.scale,d.translation[1]+y+pose.pivot[1]*pose.scale];
 } else {
  const frame=sandbox.ArenaArt.nativeJoeFrame(angle,walking,time),rect=native.frames[frame];
  assert.deepEqual(d.args.slice(0,4),Array.from(rect),'Wrong variable-sized native crop');
  const [sx,sy,sw,sh,x,y,w,h]=d.args;assert(Math.abs(w/sw-h/sh)<1e-8,'Native Joe stretched');
  foot=[d.translation[0]+x+(native.anchors[frame]-sx)*w/sw,d.translation[1]+y+h];
 }
 assert(Math.abs(foot[0]-player.x)<1e-8&&Math.abs(foot[1]-player.y-13)<1e-8,'Foot anchor shifted between poses');
}
console.log('PASS: whole-body Joe draw, variable crops, all weapons/directions/aim boundaries, idle/walk/fire, stable foot anchor and balanced Canvas transforms.');

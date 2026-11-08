const assert = require('node:assert/strict');
const fs = require('node:fs'), path = require('node:path'), crypto = require('node:crypto');
const { Game, TYPES, JADE_DROP_CHANCE, JADE_ICON, JADE_TRANSFORM_SECONDS, CORRUPTED_SECONDS, weapon } = require('../survival.js');
const Story = require('../story-campaign.js');
const seeded = seed => () => ((seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 4294967296);
const near = (a,b) => assert(Math.abs(a-b)<1e-7, `${a} != ${b}`);
function game() {
 const g = new Game(seeded(17)); g.start({ mode:'survival' }); g.arena = {...g.arena, obstacles:[]};
 Object.assign(g.player, {x:1000,y:1000}); g.queue=['crab']; g.spawnTimer=999; g.xpNeeded=1e9; return g;
}
function foe(g,type='crab',x=1400,y=1000) {
 assert(g.spawn(type)); const e=g.enemies.at(-1);
 Object.assign(e,{x,y,warmup:0,speed:0,attackTimer:999,shotTimer:999,summonTimer:999,rushTimer:999,xp:0}); return e;
}
function advance(g,seconds,input={}) {for(let elapsed=0;elapsed<seconds-1e-8;elapsed+=1/120) g.update(Math.min(1/120,seconds-elapsed),input);}
// Nuke clears the entire non-boss wave, including lazy queue copies and broods.
const clear=game(); foe(clear); const alpha=foe(clear,'rotTapir',1500); clear.queue=['crab','rotTapir','voidEgg']; clear.copiesLeft=3;
clear.pendingSummons=[{origin:alpha,type:'parasiteTapir'}]; clear.collectPower('nuke');
assert.equal(clear.enemies.length,0); assert.equal(clear.queue.length,0); assert.equal(clear.copiesLeft,0); assert.equal(clear.pendingSummons.length,0);
advance(clear,.01); assert(clear.finishedWave); assert.equal(clear.kills,2);
const bosses=game(); const live=foe(bosses,'duende'); bosses.queue=['crab','lloronaBoss','alphaCrab']; bosses.collectPower('nuke');
near(live.hp,live.maxHp/2); assert.deepEqual(bosses.queue,['lloronaBoss']); assert(bosses.spawn('lloronaBoss'));
const queued=bosses.enemies.at(-1); near(queued.hp,queued.maxHp/2); live.hp=live.maxHp*.2;
for(let i=0;i<5;i++) bosses.collectPower('nuke'); near(live.hp,live.maxHp*.2); near(queued.hp,queued.maxHp/2);
advance(bosses,.01); assert(!bosses.finishedWave); assert.equal(bosses.bossesDefeated,0);
bosses.wave++; assert(bosses.spawn('cadejoBoss')); near(bosses.enemies.at(-1).hp,bosses.enemies.at(-1).maxHp);
// Exactly 10% fewer Nuke selections, with replacement preserving power frequency.
const selection=game(); let nukes=0;
for(let i=0;i<1000;i++) for(let j=0;j<10;j++) {const rolls=[(i+.5)/1000,(j+.5)/10,.2];selection.random=()=>rolls.shift(); if(selection.rollPower()==='nuke') nukes++;}
assert.equal(nukes,900); selection.random=()=>.05; assert.notEqual(selection.rollPower('nuke'),'nuke'); selection.random=()=>.1; assert.equal(selection.rollPower('nuke'),'nuke');
const story = new Story.Game(seeded(19)); story.startStory(null); assert(!story.powerPool().includes('nuke'));
// A separate 0.1% roll, one per wave, never from bosses or combat minis.
near(JADE_DROP_CHANCE,.001);
const rare=game(), thresholdFoe=foe(rare); let rolls=[.99,.99,JADE_DROP_CHANCE]; rare.random=()=>rolls.shift() ?? .99; rare.defeat(thresholdFoe); assert.equal(rare.drops.length,0);
const makeRare = (g,e) => {const rolls=[.99,.99,JADE_DROP_CHANCE-.000001];g.random=()=>rolls.shift() ?? .99;g.defeat(e);};
makeRare(rare,foe(rare)); assert.equal(rare.drops.filter(d=>d.kind==='relic').length,1);
makeRare(rare,foe(rare)); assert.equal(rare.drops.filter(d=>d.kind==='relic').length,1);
rare.wave++; makeRare(rare,foe(rare,'alphaCrab')); assert.equal(rare.drops.filter(d=>d.kind==='relic').length,2);
const mini=game(), child=foe(mini); child.summoned=true; child.summonXP=1; mini.random=()=>0; mini.defeat(child); assert.equal(mini.drops.length,0);
const bossDrop=game(); bossDrop.random=()=>0; bossDrop.defeat(foe(bossDrop,'duende')); assert(!bossDrop.drops.some(d=>d.kind==='relic'));
// Floor pickup stores one charge; touching it does not automatically transform.
const g=game(); g.addDrop('jadeSkull',g.player.x,g.player.y,'relic'); advance(g,.01); assert.equal(g.jadeCharges,1); assert.equal(g.corruptedRemaining,0);
assert(!g.collectJade()); const e=foe(g,'alphaCrab',1300), eggParent=foe(g,'jabiruReaper',1500); assert(g.summon(eggParent));
const egg=g.enemies.at(-1); g.shot(1300,1000,Math.PI,true,30); g.addArea(e,1100,1000,60,.8,2,'#ffffff');
Object.assign(g.player,{slowTime:2,venomTime:3,venomDamage:999});
const baseDamage=g.player.damage; assert(g.activateJade()); assert(!g.activateJade()); assert.equal(g.jadeCharges,0); assert(!g.dash({dx:1}));
const snapshot=JSON.stringify({enemies:g.enemies,bullets:g.bullets,hazards:g.hazards,queue:g.queue,time:g.time,spawn:g.spawnTimer,x:g.player.x});
g.hurt(10000); advance(g,JADE_TRANSFORM_SECONDS/2,{dx:1,shooting:true}); assert.equal(g.player.hp,100);
assert.equal(JSON.stringify({enemies:g.enemies,bullets:g.bullets,hazards:g.hazards,queue:g.queue,time:g.time,spawn:g.spawnTimer,x:g.player.x}),snapshot);
g.pause(); const intro=g.transformRemaining; advance(g,1); near(g.transformRemaining,intro); g.resume(); advance(g,JADE_TRANSFORM_SECONDS/2);
near(g.corruptedRemaining,CORRUPTED_SECONDS); near(g.player.damage,baseDamage*2); assert.equal(g.player.venomTime,0); assert.equal(g.player.slowTime,0);
const eggX=egg.x; advance(g,.05,{dx:1}); assert(g.player.x>1000); assert.notEqual(egg.x,eggX,'Mobs did not resume after the transformation');
const hp=g.player.hp; g.hurt(1e9); assert.equal(g.player.hp,hp);
g.pause(); const remaining=g.corruptedRemaining; advance(g,1); near(g.corruptedRemaining,remaining); g.resume();
g.mode='upgrade'; advance(g,1); near(g.corruptedRemaining,remaining); g.mode='playing';
// All weapons receive exactly double current damage, without changing rate or move speed.
for(const id of ['slingshot','spear','staff','claw']) {g.player.weapon=id;g.refreshStats();near(g.player.damage,weapon(id).damage*2);}
// Ordinary/alpha mobs instantly melt; bosses receive frame-rate independent continuous DPS.
for(const fps of [60,120]) {
 const m=game(); m.corruptedRemaining=30; m.refreshStats();
 const normal=foe(m,'crab',m.player.x), alpha=foe(m,'alphaCrab',m.player.x), boss=foe(m,'duende',m.player.x); const before=boss.hp;
 const expected=m.player.damage/m.player.interval;
 for(let i=0;i<fps;i++)m.meltContacts(1/fps);
 assert(normal.dead && alpha.dead); assert(!boss.dead); near(before-boss.hp,expected); assert(m.flashes.some(f=>f.kind==='melt'));
 const drops=m.drops.filter(d=>d.kind==='relic'); assert.equal(drops.length,0);
}
const expire=game(); expire.collectJade(); expire.activateJade(); advance(expire,JADE_TRANSFORM_SECONDS+30);
assert.equal(expire.corruptedRemaining,0); near(expire.player.damage,weapon('slingshot').damage); expire.player.invincible=0; expire.hurt(10); near(expire.player.hp,90);
expire.collectJade(); expire.start({mode:'survival'}); assert.equal(expire.jadeCharges,0); assert.equal(expire.corruptedRemaining,0); assert.equal(expire.transformRemaining,0);
// Story environmental timers also freeze during the awakening.
story.collectJade(); story.activateJade(); const clock=story.arenaClock; advance(story,.5); near(story.arenaClock,clock);
story.portal={x:9999,y:9999}; advance(story,JADE_TRANSFORM_SECONDS-.5); near(story.corruptedRemaining,30);
advance(story,.5); near(story.corruptedRemaining,29.5);
const png=fs.readFileSync(path.join(__dirname,'../assets',JADE_ICON)); assert.equal(png.subarray(1,4).toString(),'PNG'); assert.equal(png[25],6,'Jade art must preserve transparency');
const art=JSON.parse(fs.readFileSync(path.join(__dirname,'../assets/ready/relics/manifest.json')));
assert.equal(crypto.createHash('sha256').update(png).digest('hex'),art.sha256); assert.equal(png.readUInt32BE(16),art.width); assert.equal(png.readUInt32BE(20),art.height);
console.log('PASS: full-wave Nuke, queued boss half-HP cap/no healing, exact 10% Nuke reduction, rare bounded Jade drops, stored charge, frozen cinematic, 30s form, 2x weapons, invulnerability, instant mob/alpha melt, continuous boss DPS, pause/upgrade/reset and transparent art.');

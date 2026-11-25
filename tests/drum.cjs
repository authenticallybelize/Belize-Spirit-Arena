const assert = require('node:assert/strict');
const fs = require('node:fs'), path = require('node:path'), crypto = require('node:crypto');
const {performance} = require('node:perf_hooks');
const {Game, TYPES, ARENAS, WEAPONS, maxWeaponRank, DRUM_DROP_CHANCE, DRUM_AURA_RADIUS, DRUM_ICON, JADE_DROP_CHANCE, move} = require('../survival.js');
const Story = require('../story-campaign.js');
const near = (a,b) => assert(Math.abs(a-b)<1e-6, `${a} != ${b}`);
const seeded = seed => () => ((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296);
function game(rank=1) {
 const g=new Game(seeded(29));g.start({mode:'survival'});g.arena={...g.arena,obstacles:[]};g.queue=['crab'];g.spawnTimer=999;
 Object.assign(g.player,{x:1200,y:1200,weapon:'drum',invincible:999});g.weaponLevels.drum=rank;g.xpNeeded=1e9;g.refreshStats();return g;
}
function foe(g,type='corruptedHen',dx=200,dy=0,hp=1e6) {
 assert(g.spawn(type));const e=g.enemies.at(-1);Object.assign(e,{x:g.player.x+dx,y:g.player.y+dy,warmup:0,hp,maxHp:hp,xp:0,speed:0,attackTimer:999,shotTimer:999,rushTimer:999,summonTimer:999});return e;
}
function advance(g,seconds,input={}) {for(let t=0;t<seconds-1e-8;t+=1/120)g.update(Math.min(1/120,seconds-t),input);}
function evolve(g) {assert(g.collectDrumRelic());assert(!g.drumEvolved);assert(g.evolveDrum());assert(g.drumEvolved);assert(!g.evolveDrum());}
// Only Drum gains VII; duplicate at its true maximum heals, never upgrades to VIII.
for(const w of WEAPONS)assert.equal(maxWeaponRank(w.id),w.id==='drum'?7:6);
const ranks=game();for(let rank=2;rank<=7;rank++){ranks.addDrop('drum',ranks.player.x,ranks.player.y);assert(ranks.pickup());assert.equal(ranks.weaponLevels.drum,rank);near(ranks.player.damage,65*(1+.15*(rank-1)));}
ranks.player.hp=50;ranks.addDrop('drum',ranks.player.x,ranks.player.y);ranks.pickup();assert.equal(ranks.weaponLevels.drum,7);near(ranks.player.hp,60);near(ranks.drumRadius(),170);
// The blue VII pulse is passive, movement-only, local and emitted every two active seconds.
const aura=game(7), inside=foe(aura,'corruptedHen',90),outside=foe(aura,'corruptedHen',230);inside.speed=100;
advance(aura,.01);near(aura.enemyMoveScale(inside),.25);near(aura.enemyMoveScale(outside),1);near(inside.hp,inside.maxHp);
const x=inside.x;aura.enemyTick(inside,.1);near(x-inside.x,2.5);assert.equal(inside.speed,100);
const first=aura.flashes.find(f=>f.kind==='drumCalm');assert(first);advance(aura,.9);assert(!aura.flashes.includes(first));assert(!aura.flashes.some(f=>f.kind==='drumCalm'));
advance(aura,1.12);assert(aura.flashes.some(f=>f.kind==='drumCalm'));
inside.x=aura.player.x+DRUM_AURA_RADIUS+inside.r+2;near(aura.enemyMoveScale(inside),1,'Slow lingered outside aura');
inside.x=aura.player.x+60;inside.drumSlowTime=.01;aura.drumAuraClock=1;aura.tickDrum(.02,{});near(aura.enemyMoveScale(inside),1);
aura.player.weapon='staff';inside.drumSlowTime=2;near(aura.enemyMoveScale(inside),1);
const sixth=game(6);foe(sixth);advance(sixth,2.2);assert(!sixth.flashes.some(f=>f.kind==='drumCalm'));
// Exact same rare-drop threshold as Jade, independent roll, bounded at one per wave.
near(DRUM_DROP_CHANCE,JADE_DROP_CHANCE);const rare=game();
function rollDrop(value,type='corruptedHen') {const e=foe(rare,type);const rolls=[.99,.99,.99,value];rare.random=()=>rolls.shift()??.99;rare.defeat(e);}
rollDrop(DRUM_DROP_CHANCE);assert(!rare.drops.some(d=>d.id==='ultimateDrum'));
rollDrop(DRUM_DROP_CHANCE-.000001);assert.equal(rare.drops.filter(d=>d.id==='ultimateDrum').length,1);
rollDrop(0);assert.equal(rare.drops.filter(d=>d.id==='ultimateDrum').length,1);
const mini=game(),child=foe(mini);child.summoned=true;mini.random=()=>0;mini.defeat(child);assert.equal(mini.drops.length,0);
const reward=game(),boss=foe(reward,'duende');reward.random=()=>0;reward.defeat(boss);assert(!reward.drops.some(d=>d.id==='ultimateDrum'));
// Store the pickup, choose evolution while equipped, and retain doubled normal radius at every rank.
for(let rank=1;rank<=7;rank++){const g=game(rank),base=g.drumRadius();evolve(g);near(g.drumRadius(),base*2);g.fire();near(g.flashes[0].r,base*2);}
const floor=game();floor.player.weapon='staff';floor.addDrop('ultimateDrum',floor.player.x,floor.player.y,'relic');advance(floor,.01);assert.equal(floor.drumRelic,1);assert(!floor.evolveDrum());floor.player.weapon='drum';assert(floor.evolveDrum());
const modes=game();modes.collectDrumRelic();for(const mode of ['paused','upgrade','gameover']){modes.mode=mode;assert(!modes.evolveDrum());}
// Continuous hold plays charge beats; release sets reach and is limited by normal attack cooldown.
const partial=game();evolve(partial);const target=foe(partial,'corruptedHen',400),before=target.hp;
advance(partial,4,{shooting:true});near(partial.drumCharge,4);near(target.hp,before);assert(partial.events.some(e=>e.type==='drumBeat'));
const radius=partial.drumRadius(4);assert(radius>partial.drumRadius());assert(Math.PI*radius**2/(partial.arena.bounds.w*partial.arena.bounds.h)>.2);assert(Math.PI*radius**2/(partial.arena.bounds.w*partial.arena.bounds.h)<.35);
advance(partial,.01);near(target.hp,before-partial.player.damage);assert(!partial.drumUltimateUsed);assert(!partial.drumFinale);
const one=target.hp;advance(partial,.1,{shooting:true});advance(partial,.01);near(target.hp,one,'Rapid release bypassed attack cooldown');
for(const [id,a]of Object.entries(ARENAS)){const g=game();g.arena=a;Object.assign(g.player,a.spawn);evolve(g);let previous=g.drumRadius();for(let second=1;second<=8;second++){assert(g.drumRadius(second)>previous,id);previous=g.drumRadius(second);}for(const x of [a.bounds.x,a.bounds.x+a.bounds.w])for(const y of [a.bounds.y,a.bounds.y+a.bounds.h])assert(Math.hypot(x-g.player.x,y-g.player.y)<=g.drumRadius(8)+1e-8);}
// Six-second warning slows nearby movement by 75%; it never slows unrelated movement or AI damage clocks.
const charge=game();evolve(charge);const nearMob=foe(charge,'corruptedHen',65),farMob=foe(charge,'corruptedHen',260);
advance(charge,5.9,{shooting:true});near(charge.enemyMoveScale(nearMob),1);advance(charge,.2,{shooting:true});near(charge.enemyMoveScale(nearMob),.25);near(charge.enemyMoveScale(farMob),1);
const position=nearMob.x;move(charge,nearMob,1000,0,.1);assert(nearMob.x-position<=charge.player.speed*.1*.25+1e-8);near(charge.enemyMoveScale(charge.player),1);
const snapshot=charge.drumCharge;charge.pause();advance(charge,1);near(charge.drumCharge,snapshot);charge.resume();charge.cancelDrumCharge();advance(charge,.01);assert(!charge.drumFinale);near(charge.drumCharge,0);
// Eight seconds readies but never auto-fires: release begins a protected, one-use finale.
const full=game(7);evolve(full);const mob=foe(full,'corruptedHen',80),alpha=foe(full,'rotTapir',-80),guardian=foe(full,'duende',360);guardian.hp=guardian.maxHp*.2;
full.queue=['crab','lloronaBoss','alphaCrab'];full.copiesLeft=3;full.pendingSummons=[{origin:alpha,type:'parasiteTapir'}];
advance(full,9,{shooting:true});near(full.drumCharge,8);assert(!full.drumFinale);assert(!full.drumUltimateUsed);
advance(full,.01);assert(full.drumFinale);assert(full.drumUltimateUsed);near(full.enemyMoveScale(mob),.01);near(full.enemyMoveScale(guardian),.01);
full.player.invincible=0;const hp=full.player.hp;full.hurt(1e6);near(full.player.hp,hp);assert(!full.dash({dx:1}));
full.addDrop('staff',full.player.x,full.player.y);assert(!full.pickup());full.jadeCharges=1;assert(!full.activateJade());
const playerX=full.player.x;advance(full,.5,{dx:1});near(full.player.x,playerX);assert(!mob.dead);
full.pause();const beat=full.drumFinale.time;advance(full,1);near(full.drumFinale.time,beat);full.resume();advance(full,2);
assert(mob.dead&&alpha.dead);assert.equal(full.pendingSummons.length,0);assert.deepEqual(full.queue,['lloronaBoss']);assert.equal(full.copiesLeft,0);near(guardian.hp,guardian.maxHp*.2);assert(!guardian.dead);assert(!full.finishedWave);assert(full.flashes.some(f=>f.kind==='drumFinal'));
assert(full.spawn('lloronaBoss'));near(full.enemies.at(-1).hp,full.enemies.at(-1).maxHp*.5);
advance(full,9,{shooting:true});assert(!full.drumFinale);assert(full.drumUltimateUsed);assert(full.drumEvolved);near(full.drumCharge,0);assert(!full.collectDrumRelic());
// The form expires on clear, regardless of time. VII stays; the next wave can drop another relic.
const expire=game(7);evolve(expire);advance(expire,45);assert(expire.drumEvolved);expire.queue=[];advance(expire,.01);assert(expire.finishedWave);assert(!expire.drumEvolved);near(expire.drumRelic,0);near(expire.weaponLevels.drum,7);near(expire.drumRadius(),170);
expire.beginWave();assert(expire.collectDrumRelic());assert(expire.evolveDrum());expire.start({mode:'survival'});assert(!expire.drumEvolved);near(expire.drumRelic,0);assert(!expire.drumFinale);
const skipped=game();skipped.collectDrumRelic();skipped.beginWave();assert.equal(skipped.drumRelic,0);
const story=new Story.Game(seeded(7));story.startStory(null);assert(!story.drumRelicAllowed());
const storage={value:null,getItem(){return this.value;},setItem(_,v){this.value=v;}},store=new Story.Store(storage);story.startStory(store);story.weaponLevels.drum=7;assert(store.checkpoint(story));assert(!new Story.Store(storage).readOnly);story.weaponLevels.staff=7;assert(!store.checkpoint(story));
const bytes=fs.readFileSync(path.join(__dirname,'../assets',DRUM_ICON));assert.equal(bytes[25],6);
const manifest=JSON.parse(fs.readFileSync(path.join(__dirname,'../assets/ready/relics/ultimate-drum.json')));assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'),manifest.sha256);
const stress=game(7);stress.enemyLimit=96;for(let i=0;i<96;i++)foe(stress,i%2?'corruptedHen':'corruptedToad',150+i%12*28,-180+Math.floor(i/12)*40,1e8);evolve(stress);
const start=performance.now();advance(stress,8,{shooting:true});assert(stress.enemies.length<=96);assert(stress.flashes.length<=60);console.log(`Drum logic stress: ${((performance.now()-start)/960).toFixed(2)} ms per 120 Hz step with 96 mobs.`);
console.log('PASS: Drum-only VII cap/healing/save compatibility; 2s local damage-free slowing aura; exact rare drop; opt-in evolution; doubled radius; charge/partial release/cooldown; all-map reach; 6s 75% slow; held readiness; release-only protected 1% finale; one use; full wave/brood clear; boss half-HP/no healing; wave expiry/reset; transparent art/hash.');

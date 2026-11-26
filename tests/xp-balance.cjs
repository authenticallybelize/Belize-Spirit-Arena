const assert=require('node:assert/strict'),fs=require('node:fs'),crypto=require('node:crypto');
const {Game,TYPES,COMMONS,ALPHAS,BOSSES,PERKS,RARE_XP_CHANCE,FLOOR_POWER_SECONDS,TRIPLE_XP_ICON,xpForLevel}=require('../survival.js');
const Story=require('../story-campaign.js');
const seeded=n=>()=>((n=(Math.imul(n,1664525)+1013904223)>>>0)/4294967296);
const near=(a,b)=>assert(Math.abs(a-b)<Math.max(1e-7,Math.abs(b)*1e-10),`${a} != ${b}`);
function game(level=1,wave=20){const g=new Game(seeded(191));g.start({mode:'survival'});g.level=level;g.wave=wave-1;g.beginWave();g.arena={...g.arena,obstacles:[]};g.queue=['crab'];g.spawnTimer=999;g.random=()=>.99;g.xpNeeded=1e9;return g;}
function foe(g,type='crab',offset=200){assert(g.spawn(type));const e=g.enemies.at(-1);Object.assign(e,{x:g.player.x+offset,y:g.player.y,warmup:0,attackTimer:999,shotTimer:999,summonTimer:999,rushTimer:999});return e;}
function advance(g,seconds){for(let t=0;t<seconds-1e-8;t+=1/120)g.update(Math.min(1/120,seconds-t));}
// Five is an XP level, not a five-damage cap. Every regular species holds its damage through 19.
for(const type of [...COMMONS,'crab','jaguar','shadow','tommy','miniLlorona']){
 for(const wave of [1,20,100,200]){
  const expected=TYPES[type].damage*1.048;
  for(const [level,steps]of [[5,0],[6,0],[10,0],[15,0],[19,0],[20,1],[24,1],[25,2],[29,2],[30,3]]){
   const g=game(level,wave),e=foe(g,type);near(e.damage,expected*1.05**steps);assert(g.projectileDamage(e)>e.damage);assert(e.damage>5);
  }
 }
}
const early=game(1),small=foe(early,'grasshopper');near(small.damage,6);const five=game(5),grown=foe(five,'grasshopper');assert(grown.damage>small.damage);
// Existing wounded enemies update once at exact five-level boundaries; health and speed keep their prior rules.
const active=game(19),mob=foe(active,'corruptedMonkey');mob.hp=mob.maxHp*.4;const oldHP=mob.maxHp,oldDamage=mob.damage;active.xpNeeded=xpForLevel(19);active.xp=active.xpNeeded;assert(active.levelUp());near(mob.damage,oldDamage*1.05);near(mob.maxHp,oldHP*2);near(mob.hp/mob.maxHp,.4);active.syncDifficulty();near(mob.damage,oldDamage*1.05);active.level=24;active.xpNeeded=xpForLevel(24);active.xp=active.xpNeeded;assert(active.levelUp());near(mob.damage,oldDamage*1.05**2);near(mob.maxHp,oldHP*2);
// The actual projectile attacks hit harder than body contact, including Mini Llorona's reduced fan.
for(const type of ['shadow','miniLlorona','rootling','corruptedMonkey']){
 const g=game(20),e=foe(g,type,180);e.shotTimer=0;e.attackTimer=0;
 for(let i=0;i<360&&!g.bullets.length;i++)g.enemyTick(e,1/120);
 assert(g.bullets.length,type+' failed to fire');assert(g.bullets.every(b=>b.hostile&&b.damage>e.damage));assert(g.bullets.every(b=>b.damage<100));
}
// A healthy, unarmored Joe survives the wave-20 Duende's actual melee and a real projectile collision.
const encounter=game(20,20),duende=foe(encounter,'duende',0);encounter.player.invincible=0;encounter.enemyTick(duende,.01);assert(encounter.player.hp>0&&encounter.player.hp<100);near(encounter.player.hp,100-35*1.228);
duende.x+=240;duende.shotTimer=0;encounter.player.hp=100;encounter.player.invincible=0;encounter.enemyTick(duende,.01);assert(encounter.bullets.length>=12);assert(encounter.bullets.every(b=>b.damage>duende.damage&&b.damage<100));const shot=encounter.bullets[0];Object.assign(shot,{x:encounter.player.x,y:encounter.player.y,vx:1,vy:0});encounter.enemyTick=()=>{};advance(encounter,.01);assert.equal(encounter.mode,'playing');assert(encounter.player.hp>0&&encounter.player.hp<100);
for(const type of [...ALPHAS,...BOSSES]){const g=game(20,20),e=foe(g,type);assert(e.damage<100,type+' can one-shot 100 HP through contact');}
// Mahogany Skin improves at every existing rank and never grants complete immunity.
for(let rank=0;rank<=6;rank++){const g=game();g.ranks.armor=rank;g.player.invincible=0;g.hurt(100);assert.equal(g.player.hp,rank*10);}
assert.equal(PERKS.find(p=>p.id==='armor').max,6);assert.equal(PERKS.find(p=>p.id==='xp').max,7);
// Memory Seeker preserves I–V, then reaches 2.5× and 3×. It applies to every XP pickup, including Bonus XP.
for(const [rank,factor]of [[0,1],[1,1.2],[5,2],[6,2.5],[7,3]]){
 const g=game();g.ranks.xp=rank;for(const value of [.5,5,8,25,50]){g.xp=0;g.xpFraction=0;g.gainXP(value);near(g.xp+g.xpFraction,value*factor);}
 g.xp=0;g.xpFraction=0;g.xpNeeded=100;g.collectPower('bonusXP');near(g.xp+g.xpFraction,50*factor);
}
const triple=game();triple.collectPower('doubleXP');triple.gainXP(5);near(triple.xp,15);triple.ranks.xp=7;triple.gainXP(5);near(triple.xp,60);assert.equal(triple.gemAppearance({tier:1}).color,'#bd8bff');
// Source tiers preserve existing generous alpha/boss rewards and give normal mobs their authored XP.
for(const type of ['crab',...ALPHAS,...BOSSES]){const g=game(),e=foe(g,type);g.defeat(e);const gem=g.gems[0];assert.equal(gem.tier,e.alpha?2:e.boss?3:1);assert(gem.value>=TYPES[type].xp);const style=g.gemAppearance(gem);assert.equal(style.shape,'gem');assert.equal(style.color,e.boss?'#bd8bff':e.alpha?'#78f2a3':'#64c9ff');}
const generous=game(),elite=foe(generous,'alphaCrab');elite.xp=200;generous.defeat(elite);assert.equal(generous.gems[0].value,200);
// Elite rare shards are separate, exact-boundary 2% rewards, and ordinary mobs/minis cannot produce them.
near(RARE_XP_CHANCE,.02);
for(const type of ['alphaCrab','duende','crab'])for(const roll of [.019999,.02]){const g=game(),e=foe(g,type);g.random=()=>roll;g.defeat(e);const rare=g.gems.filter(g=>g.tier===5);assert.equal(rare.length,type!=='crab'&&roll<.02?1:0);if(rare.length){const ordinary=g.gems[0];near(rare[0].value,ordinary.value/ordinary.tier*5);assert.deepEqual(g.gemAppearance(rare[0]),{color:'#77d8ff',shape:'shard',label:'5× XP'});}}
let rares=0;const distribution=game();for(let i=0;i<1000;i++){distribution.gems=[];distribution.drops=[];distribution.random=()=>(i+.5)/1000;distribution.defeat({id:i,type:'alphaCrab',alpha:true,x:1000,y:1000,xp:20});rares+=distribution.gems.filter(g=>g.tier===5).length;}assert.equal(rares,20);
const brood=game(),parent=foe(brood,'hiveGuardian');for(let i=0;i<3;i++){assert(brood.summon(parent));const mini=brood.enemies.at(-1);mini.warmup=0;brood.random=()=>0;brood.defeat(mini);}assert.equal(brood.gems.length,3);assert(brood.gems.every(g=>g.tier===.5&&g.value===.5));for(const gem of brood.gems)brood.gainXP(gem.value);near(brood.xp+brood.xpFraction,1.5);assert.deepEqual(brood.gemAppearance(brood.gems[0]),{color:'#64c9ff',shape:'circle',label:'0.5 XP'});
// Floor power and wildcard time doubles; pause freezes it. Consumed powers keep Resonance's 3× active duration.
assert.equal(FLOOR_POWER_SECONDS,90);const floor=game();floor.enemyTick=()=>{};floor.addDrop('shield',floor.player.x+200,floor.player.y,'power');floor.addDrop('jadeSkull',floor.player.x+300,floor.player.y,'relic');advance(floor,45);assert.equal(floor.drops.length,2);const clock=floor.drops[0].life;floor.pause();advance(floor,2);near(floor.drops[0].life,clock);floor.resume();advance(floor,44.99);assert.equal(floor.drops.length,2);advance(floor,.02);assert.equal(floor.drops.length,0);floor.addDrop('heavy',1000,1000,'power',true);assert.equal(floor.drops[0].life,Infinity);floor.ranks.resonance=7;floor.collectPower('heavy');near(floor.powers.heavy,24);
// Story keeps authored damage growth and the original Duende projectile, with compatible XP/perk ranks.
const story=new Story.Game(seeded(3));story.startStory(null);story.level=20;story.wave=5;assert(story.spawn('duende'));const guardian=story.enemies.at(-1);near(guardian.damage,20);near(story.duendeShotDamage(guardian),13);assert.equal(story.regularDamageScale(),null);story.enemies=[];assert(story.spawn('jaguarBoss'));near(story.jaguarShotDamage(story.enemies.at(-1)),14);
const art=fs.readFileSync('assets/'+TRIPLE_XP_ICON),manifest=JSON.parse(fs.readFileSync('assets/ready/powers/tripleXP/source.json'));assert.equal(art[25],6);assert.equal(crypto.createHash('sha256').update(art).digest('hex'),manifest.sha256);
console.log('PASS: XP-5 damage freeze/20+ five-level growth, no wave-damage bypass, live transitions and idempotence; stronger ordinary projectiles and surviving real wave-20 Duende hits; 10% Mahogany ranks; Memory VII/Bonus XP/triple power/fractions; preserved elite XP/color tiers/0.5 mini circles/2% extra 5× shards; 90s floor lifetime/pause; Story compatibility.');

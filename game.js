/* Copyright (c) 2026 Authentically Belize Movement. See LICENSE. */
(() => {
  'use strict';
  const extended = !!window.SurvivalCore;
  const story = !!window.StoryCore;
  const { Game } = story ? StoryCore : extended ? SurvivalCore : ArenaCore;
  let { W, H } = extended ? SurvivalCore : ArenaCore;
  const { OBSTACLES, WAVES } = ArenaCore;
  const game = new Game(), canvas = document.getElementById('arena'), ctx = canvas.getContext('2d');
  const $ = id => document.getElementById(id), overlay = $('overlay'), content = $('dialogContent');
  const menuLogo = '<img class="menu-logo" src="assets/branding/logo.png?v=0.5.2" srcset="assets/branding/logo.png?v=0.5.2 886w, assets/branding/logo@2x.png?v=0.5.2 1774w" sizes="280px" width="1774" height="887" alt="" decoding="async">';
  const startButton = $('startButton');
  const joeHeight = 1200 * ArenaArt.playerHeightRatio;
  let view = { x: 0, y: 0, w: W, h: H }, mouse = null, mousePointer = null;
  function sizeCanvas() {
    const rect = canvas.getBoundingClientRect(), width = rect.width || W, height = rect.height || H;
    const mobile = matchMedia('(pointer:coarse)').matches || navigator.maxTouchPoints > 0;
    const density = Math.min(window.devicePixelRatio || 1, mobile ? 2 : Infinity, 2400 / width, 2400 / height);
    canvas.width = Math.round(width * density); canvas.height = Math.round(height * density);
  }
  new ResizeObserver(() => { sizeCanvas(); render(game.time); }).observe(canvas);
  window.addEventListener('resize', sizeCanvas); sizeCanvas();
  if (extended || story) window.spiritArena = game;
  const keys = new Set(), input = { dx: 0, dy: 0, shooting: false, aimX: 920, aimY: 350 };
  const images = {}, particles = [], reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  $('waveDots').innerHTML = (story ? Array(4).fill(0) : extended ? Array(28).fill(0) : WAVES).map(() => '<i></i>').join('');
  let ready = false, previousMode = '', last = 0, lastHud = 0, shake = 0, helpOpen = false, helpMode = 'menu';
  let soundOn = false, audio = null;
  let touch = null;
  function clearInput() { keys.clear(); input.dx = input.dy = 0; input.shooting = false; input.aiming = false; mousePointer = null; touch?.reset(); }
  function movement() {
    input.dx = Number(keys.has('d') || keys.has('ArrowRight')) - Number(keys.has('a') || keys.has('ArrowLeft'));
    input.dy = Number(keys.has('s') || keys.has('ArrowDown')) - Number(keys.has('w') || keys.has('ArrowUp'));
  }
  function tone(frequency, seconds, volume, endFrequency = frequency, wave = 'sine') {
    if (!soundOn) return;
    try {
      audio ||= new (window.AudioContext || window.webkitAudioContext)();
      if (audio.state === 'suspended') audio.resume().catch(() => {});
      const oscillator = audio.createOscillator(), gain = audio.createGain(), t = audio.currentTime;
      oscillator.type = wave; oscillator.frequency.setValueAtTime(frequency, t); oscillator.frequency.exponentialRampToValueAtTime(endFrequency, t + seconds);
      gain.gain.setValueAtTime(volume, t); gain.gain.exponentialRampToValueAtTime(.0001, t + seconds);
      oscillator.connect(gain); gain.connect(audio.destination); oscillator.start(t); oscillator.stop(t + seconds);
    } catch { soundOn = false; $('soundButton').setAttribute('aria-pressed', 'false'); }
  }
  function burst(x, y, color, count = 8) {
    for (let i = 0; i < count && particles.length < 140; i++) {
      const a = Math.random() * Math.PI * 2, speed = 25 + Math.random() * 85;
      particles.push({ x, y, vx: Math.cos(a) * speed, vy: Math.sin(a) * speed, color, life: .3 + Math.random() * .25 });
    }
  }
  function whisper() {
    if (!soundOn || !audio) return;
    const buffer = audio.createBuffer(1, Math.ceil(audio.sampleRate * .5), audio.sampleRate), data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * Math.sin(Math.PI * i / data.length);
    const source = audio.createBufferSource(), filter = audio.createBiquadFilter(), gain = audio.createGain();
    source.buffer = buffer; filter.type = 'bandpass'; filter.frequency.value = 1300; filter.Q.value = 1.8; gain.gain.value = .012;
    source.connect(filter); filter.connect(gain); gain.connect(audio.destination); source.start();
  }
  function handleEvents() {
    for (const event of game.events.splice(0)) {
      if (event.type === 'shot') tone(game.player.weapon === 'staff' ? 590 : 320, .05, .025, 140, 'triangle');
      if (event.type === 'gem') tone(830, .08, .025, 1250);
      if (event.type === 'dash') { tone(240, .13, .04, 90, 'triangle'); burst(game.player.x, game.player.y, '#84eacc', 12); }
      if (event.type === 'hurt') { shake = .18; tone(120, .14, .06, 50, 'triangle'); }
      if (event.type === 'thunder') tone(65, .8, .045, 32, 'sine');
      if (event.type === 'impact') burst(event.x, event.y, event.hostile ? '#c898f0' : '#f4d593', 4);
      if (event.type === 'defeat') { burst(event.x, event.y, '#75e8be', event.boss ? 24 : 10); tone(200, .06, .02, 85); }
      if (event.type === 'level') tone(530, .3, .04, 1060);
      if (event.type === 'wave') tone(330, .3, .04, 440);
      if (event.type === 'weapon') { tone(430, .35, .05, 1200); burst(game.player.x, game.player.y, '#81ebac', 24); }
    }
  }
  function drawSprite(type, index, x, bottom, height, flip = false, alpha = 1, hurt = false) {
    const roster = window.ARENA_ROSTER?.[type];
    if (roster) {
      const size = roster.cell, scale = height / roster.bodyHeight;
      ctx.save(); ctx.globalAlpha = alpha; ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high';
      ctx.translate(Math.round(x), Math.round(bottom));
      if (hurt) ctx.filter = 'brightness(1.8)';
      ctx.drawImage(images[roster.file], index % 6 * size, Math.floor(index / 6) * size, size, size,
        -roster.pivot[0] * scale, -roster.pivot[1] * scale, size * scale, size * scale);
      ctx.restore(); return;
    }
    const id = type === 'jaguar' ? 'minijaguar' : type === 'lloronaBoss' ? 'miniLlorona' : type, art = ARENA_READY.sprites[id];
    index = art.frames[index] ? index : 0;
    const frame = ARENA_SPRITES[id].frames[index], pivot = art.pivots[index];
    const scale = height / (frame[3] * Math.min(art.frameSize[0] / frame[2], art.frameSize[1] / frame[3]));
    ctx.save(); ctx.globalAlpha = alpha; ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high';
    ctx.translate(Math.round(x), Math.round(bottom)); if (flip) ctx.scale(-1, 1);
    if (hurt) ctx.filter = 'brightness(2)';
    ctx.drawImage(images[art.frames[index]], -pivot[0] * scale, -pivot[1] * scale, art.frameSize[0] * scale, art.frameSize[1] * scale); ctx.restore();
  }
  function shadow(x, y, r, alpha = .26) {
    ctx.fillStyle = `rgba(3,20,10,${alpha})`; ctx.beginPath(); ctx.ellipse(x, y + 4, r * 1.25, r * .4, 0, 0, Math.PI * 2); ctx.fill();
  }
  function paintPortraits() {
    if (!ready) return;
    document.querySelectorAll('.joe-portrait').forEach(portrait => {
      const context = portrait.getContext('2d'); context.clearRect(0, 0, 64, 64); context.imageSmoothingEnabled = true; context.imageSmoothingQuality = 'high';
      context.drawImage(images[ARENA_READY.sprites.joe.portrait], 1, 0, 62, 64);
    });
  }
  function drawEnemy(enemy, t) {
    const { x, y, type } = enemy;
    if (story && enemy.objective) { StoryUI.drawCrystal(enemy, ctx, images); return; }
    if (enemy.dead && !window.ARENA_ROSTER?.[type]) { drawSprite(type, 4, x, y + 13, enemy.height || 60, false, Math.min(1, enemy.life * 4)); return; }
    if (window.ARENA_ROSTER?.[type]) {
      const sprite = type === 'sochBoss' && enemy.form === 'transform' ? 'sochTransform' : type === 'sochBoss' && enemy.form === 'harpy' ? 'sochHarpy' : type;
      const height = enemy.height, bottom = y + 13 - (enemy.flying ? 12 : 0);
      if (enemy.dead) {
        const frames = enemy.deathFrames || [18, 19, 20, 21, 22, 23];
        drawSprite(sprite, frames[Math.min(frames.length - 1, Math.floor((.6 - enemy.life) * 10))], x, bottom, height, false, Math.min(1, enemy.life * 4)); return;
      }
      shadow(x, y, enemy.r);
      const skill = enemy.skill, attack = skill?.kind || enemy.attack;
      if (enemy.warmup > 0 || enemy.action === 'windup' && enemy.alpha && attack === 'slam') {
        const spawn = enemy.warmup > 0, radius = spawn ? enemy.r + 12 : enemy.reach;
        ctx.save(); ctx.strokeStyle = enemy.alpha ? '#ffb17c' : '#c9b1e5'; ctx.fillStyle = enemy.alpha ? '#e7793c22' : '#b69bd51c'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(x, y, radius, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
        ctx.restore();
      }
      if (enemy.warmup <= 0 && enemy.action === 'windup' && !enemy.summoning && ['pounce', 'rush', 'shot', 'fan'].includes(attack)) {
        const length = attack === 'pounce' ? enemy.rushSpeed * enemy.rushDuration : attack === 'rush' ? skill.speed * skill.duration : 190;
        ctx.save(); ctx.strokeStyle = enemy.boss ? '#f4be8c' : '#bc9bda'; ctx.lineWidth = 2; ctx.setLineDash([8, 6]);
        const count = attack === 'fan' || enemy.shotCount ? 3 : 1;
        for (let i = 0; i < count; i++) {
          const angle = enemy.attackAngle + (i - (count - 1) / 2) * (skill ? skill.spread * (skill.count - 1) / 2 : enemy.shotCount ? .2 : 0);
          ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + Math.cos(angle) * length, y + Math.sin(angle) * length); ctx.stroke();
        }
        ctx.restore();
      }
      const row = enemy.summoning ? 1 : enemy.bossAI ? ((enemy.skillIndex || 1) % 2 ? 1 : 2) : enemy.attackRow || (enemy.attack === 'shot' ? 2 : 1);
      const actionFrame = enemy.action === 'windup' ? Math.min(2, Math.floor(enemy.actionTime / (skill?.warning || enemy.windup) * 3))
        : enemy.action === 'active' ? 3 : Math.min(5, 3 + Math.floor(enemy.actionTime / .45 * 3));
      const index = enemy.form === 'transform' ? Math.min(17, Math.floor(enemy.formTime / 1.2 * 18)) : enemy.warmup > 0 ? 0 : enemy.hit > 0 ? (type === 'rotTapir' ? 12 : type === 'jabiruReaper' ? 0 : 18) : enemy.action !== 'move' && enemy.action !== 'sidestep' ? row * 6 + actionFrame : Math.floor(t * (enemy.flying ? 10 : 7) + enemy.id) % 6;
      drawSprite(sprite, index, x, bottom, height, false, enemy.warmup > 0 ? .35 : 1, enemy.hit > 0);
      if (enemy.warmup <= 0 && !enemy.boss) {
        const width = enemy.r * 2 + 10;
        ctx.fillStyle = '#102416'; ctx.fillRect(x - width / 2 - 1, y - height - 2, width + 2, 6);
        ctx.fillStyle = enemy.alpha ? '#ffc17d' : '#e86b52'; ctx.fillRect(x - width / 2, y - height - 1, width * Math.max(0, enemy.hp / enemy.maxHp), 4);
        if (enemy.alpha) { ctx.font = 'bold 11px Arial'; ctx.textAlign = 'center'; ctx.fillStyle = '#ffe0b0'; ctx.fillText('ALPHA · ' + enemy.name, x, y - height - 9); }
      }
      return;
    }
    if (enemy.warmup > 0) {
      const progress = 1 - enemy.warmup / (enemy.boss ? 1.7 : .85);
      ctx.save(); ctx.strokeStyle = '#d0a7f2'; ctx.lineWidth = 2; ctx.globalAlpha = .7;
      ctx.beginPath(); ctx.ellipse(x, y, 16 + progress * 14, 7 + progress * 7, 0, 0, Math.PI * 2); ctx.stroke();
      ctx.setLineDash([4, 6]); ctx.beginPath(); ctx.arc(x, y, 32 - progress * 12, 0, Math.PI * 2); ctx.stroke(); ctx.restore();
      drawSprite(type, 0, x, y + 10, enemy.boss ? 96 : 43, false, .12 + progress * .4); return;
    }
    shadow(x, y, enemy.r);
    if (enemy.casting && (enemy.boss || !extended)) { ctx.strokeStyle = type === 'duende' ? '#e6ca74' : '#c598ef'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(x, y, enemy.r + 6 + Math.sin(t * 20) * 2, 0, Math.PI * 2); ctx.stroke(); }
    if (type === 'lloronaBoss' && enemy.action === 'windup' && enemy.skill?.kind === 'fan') {
      ctx.save(); ctx.strokeStyle = '#9cdeec'; ctx.setLineDash([8, 6]);
      for (const offset of [-.36, 0, .36]) { const angle = enemy.attackAngle + offset; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + Math.cos(angle) * 190, y + Math.sin(angle) * 190); ctx.stroke(); }
      ctx.restore();
    }
    if (enemy.rushWindup > 0) {
      ctx.save(); ctx.strokeStyle = '#f29477'; ctx.lineWidth = 3; ctx.setLineDash([9, 8]);
      ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + enemy.rushX * 190, y + enemy.rushY * 190); ctx.stroke(); ctx.restore();
    }
    const height = enemy.height || { crab: 39, jaguar: 43, shadow: 57, duende: 96, jaguarBoss: 112, tommy: 45, miniLlorona: 54 }[type];
    const index = type === 'duende' ? 0 : type === 'jaguarBoss' ? enemy.hit > 0 ? 6 : enemy.casting ? 5 : enemy.rushTime > 0 ? 3 : 1 + Math.floor(t * 7) % 2 : enemy.hit > 0 ? 4 : enemy.casting || enemy.action === 'windup' ? 3 : Math.floor(t * (type === 'jaguar' ? 9 : 5)) % 3;
    drawSprite(type, index, x, y + 13 + (['shadow', 'miniLlorona'].includes(type) ? Math.sin(t * 3 + enemy.id) * 3 : 0), height, ['jaguar', 'jaguarBoss', 'tommy'].includes(type) && game.player.x < x, 1, enemy.hit > 0);
    if (!enemy.boss) {
      const w = enemy.r * 2 + 9;
      ctx.fillStyle = '#102416'; ctx.fillRect(x - w / 2 - 1, y - height - 2, w + 2, 6);
      ctx.fillStyle = '#e86b52'; ctx.fillRect(x - w / 2, y - height - 1, w * Math.max(0, enemy.hp / enemy.maxHp), 4);
    }
  }
  function drawJoe(t) {
    const p = game.player, firing = input.shooting && game.mode === 'playing';
    const direction = firing || !p.walking ? p.angle : Math.atan2(input.dy,input.dx);
    const frame = ArenaArt.nativeJoeFrame(direction, p.walking, t), native = ARENA_SPRITES.joe;
    const rect = native.frames[frame], scale = joeHeight / rect[3], anchor = (native.anchors[frame] - rect[0]) * scale;
    const row = Math.floor(frame / 5), alpha = p.invincible > .24 && Math.floor(t * 18) % 2 ? .5 : 1;
    const art = ARENA_READY.holding[p.weapon], held = ArenaArt.holdingPose(art, p.angle, joeHeight);
    shadow(p.x, p.y, p.r);
    ctx.strokeStyle = p.dashTime > 0 ? '#b8ffe3' : '#a8e7c28c'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.ellipse(p.x, p.y + 4, 22, 11, 0, 0, Math.PI * 2); ctx.stroke();
    function body() { ctx.drawImage(images[native.file], ...rect, -anchor, -joeHeight, rect[2] * scale, joeHeight); }
    function pose(x, y, opacity) {
      ctx.save(); ctx.globalAlpha = opacity; ctx.translate(x, y + 13);
      if (!firing) {
        body();
        const [hx,hy,rx,ry,rw,rh] = ArenaArt.carryHands[frame], weapon = ARENA_READY.weapons[p.weapon], grip = ArenaArt.carryGrips[p.weapon];
        const size = ['spear','staff','crystal'].includes(p.weapon) ? 68 : p.weapon === 'claw' ? 34 : 48;
        const carryAngle = ['spear','staff','crystal','cacao','feather','obsidian'].includes(p.weapon) ? -Math.PI / 2 : row === 2 ? 2 : 1.14;
        ctx.save(); ctx.translate((hx-rect[0])*scale-anchor,(hy-rect[1])*scale-joeHeight); ctx.rotate(carryAngle-weapon.heldAngle);
        ctx.drawImage(images[weapon.held],-grip[0]*size/64,-grip[1]*size/64,size,size); ctx.restore();
        // The original moving fist occludes the handle at its measured grip keyframe.
        ctx.drawImage(images[native.file],rx,ry,rw,rh,(rx-rect[0])*scale-anchor,(ry-rect[1])*scale-joeHeight,rw*scale,rh*scale);
      } else {
        // Keep the complete held pose and its foot pivot; these images are not compatible body layers.
        ctx.drawImage(images[held.file],-held.pivot[0]*held.scale,-held.pivot[1]*held.scale,art.frameSize[0]*held.scale,art.frameSize[1]*held.scale);
      }
      ctx.restore();
    }
    if (p.dashTime > 0) for (let i = 3; i > 0; i--) pose(p.x-p.dashX*i*15,p.y-p.dashY*i*15,.1);
    pose(p.x,p.y,alpha);
  }
  let groundPattern = null;
  function drawOpenGround() {
    const image = images[game.arena.image], ratio = image.naturalWidth / 1200;
    if (!groundPattern) {
      const tile = document.createElement('canvas'); tile.width = tile.height = 1500;
      const paint = tile.getContext('2d');
      for (let y=0;y<2;y++) for (let x=0;x<2;x++) {
        paint.save(); paint.translate(x ? 1500 : 0,y ? 1500 : 0); paint.scale(x ? -1 : 1,y ? -1 : 1);
        paint.drawImage(image,225*ratio,225*ratio,750*ratio,750*ratio,0,0,750,750); paint.restore();
      }
      groundPattern = ctx.createPattern(tile,'repeat');
    }
    ctx.fillStyle=groundPattern; ctx.fillRect(0,0,W,H);
    const edge=(sx,sy,w,h,x,y)=>ctx.drawImage(image,sx*ratio,sy*ratio,w*ratio,h*ratio,x,y,w,h);
    for (let x=88;x<W-88;x+=1024) { const width=Math.min(1024,W-88-x); edge(88,0,width,88,x,0); edge(88,1112,width,88,x,H-88); }
    for (let y=88;y<H-88;y+=1024) { const height=Math.min(1024,H-88-y); edge(0,88,88,height,0,y); edge(1112,88,88,height,W-88,y); }
    for (const x of [0,W-88]) for (const y of [0,H-88]) edge(x ? 1112 : 0,y ? 1112 : 0,88,88,x,y);
  }
  function render(t) {
    if (extended) { W=game.arena.width; H=game.arena.height; }
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#081811'; ctx.fillRect(0, 0, canvas.width, canvas.height); if (!ready) return;
    const zoom = canvas.width / view.w;
    ctx.setTransform(zoom, 0, 0, canvas.height / view.h, -view.x * zoom, -view.y * canvas.height / view.h);
    ctx.save();
    if (shake > 0 && !reducedMotion) ctx.translate(Math.sin(t * 175) * 3, Math.cos(t * 150) * 3);
    ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high';
    if (extended && game.arena.scrolling) drawOpenGround(); else ctx.drawImage(images[extended ? game.arena.image : 'jungle-arena.png'], 0, 0, W, H);
    if (extended && game.arena.scrolling) {
      const b = game.arena.bounds;
      ctx.save(); ctx.strokeStyle = '#c2cf91aa'; ctx.lineWidth = 5; ctx.setLineDash([14, 10]); ctx.strokeRect(b.x, b.y, b.w, b.h); ctx.restore();
    }
    for (const d of extended ? game.arena.decor || [] : []) ctx.drawImage(images[d.image], d.x, d.y, d.w, d.h);
    const drawables = (extended ? game.arena.obstacles.filter(o => game.arenaId === 'jungle' || o.image) : OBSTACLES).map(o => ({ y: o.y + o.h, draw: () => {
      if (o.image) {
        const image = images[o.image], height = o.w * (image.naturalHeight || image.height) / (image.naturalWidth || image.width);
        ctx.drawImage(image, o.x, o.y + o.h - height, o.w, height); return;
      }
      shadow(o.x + o.w / 2, o.y + o.h - 15, o.w * .44, .17);
      const width = o.w + 16, height = width * 642 / 1059;
      ctx.drawImage(images['limestone-ruins.png'], 304, 180, 1059, 642, o.x - 8, o.y + o.h + 4 - height, width, height);
    } }));
    if (game.staffPickup) {
      const drop = game.staffPickup;
      ctx.strokeStyle = '#8ff4b1'; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(drop.x, drop.y + 4, 26, 13, 0, 0, Math.PI * 2); ctx.stroke();
      const staff = ARENA_READY.weapons.staff; ctx.drawImage(images[staff.pickup], drop.x - 24, drop.y - 44, 48, 48);
      ctx.fillStyle = '#0b281ade'; ctx.fillRect(drop.x - 57, drop.y + 21, 114, 21); ctx.fillStyle = '#baffca'; ctx.font = '12px Arial'; ctx.textAlign = 'center'; ctx.fillText('DUENDE STAFF', drop.x, drop.y + 36);
    }
    for (const gem of game.gems) {
      const y = gem.y + Math.sin(t * 3 + gem.x) * 2;
      shadow(gem.x, gem.y + 7, 6, .15);
      ctx.fillStyle = '#123f30'; ctx.beginPath(); ctx.moveTo(gem.x, y - 11); ctx.lineTo(gem.x + 8, y); ctx.lineTo(gem.x, y + 11); ctx.lineTo(gem.x - 8, y); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#65efc0'; ctx.beginPath(); ctx.moveTo(gem.x, y - 9); ctx.lineTo(gem.x + 6, y); ctx.lineTo(gem.x, y + 9); ctx.lineTo(gem.x - 6, y); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#d4ffdf'; ctx.beginPath(); ctx.moveTo(gem.x, y - 8); ctx.lineTo(gem.x, y); ctx.lineTo(gem.x - 5, y); ctx.fill();
    }
    const enemies = game.mode === 'menu' ? [
      { ...ArenaCore.TYPES.crab, type: 'crab', x: 220, y: 485, maxHp: 42 },
      { ...ArenaCore.TYPES.jaguar, type: 'jaguar', x: 1015, y: 255, maxHp: 25 },
      { ...ArenaCore.TYPES.shadow, type: 'shadow', x: 970, y: 460, maxHp: 48, id: 1 }
    ] : game.enemies;
    for (const enemy of enemies) drawables.push({ y: enemy.y, draw: () => drawEnemy(enemy, t) });
    for (const corpse of game.corpses || []) drawables.push({ y: corpse.y, draw: () => drawEnemy(corpse, t) });
    drawables.sort((a, b) => a.y - b.y).forEach(item => item.draw());
    if (extended && !story) ArenaWeather.draw(ctx, view, game.weatherTime, game.storm, reducedMotion);
    if (extended) SurvivalUI.draw(game, ctx, images);
    if (story) StoryUI.draw(game, ctx);
    for (const b of game.bullets) {
      const len = Math.hypot(b.vx, b.vy), color = b.color || (b.hostile ? '#d99cfa' : b.kind === 'magic' ? '#9fffd0' : '#c5b39a');
      ctx.lineWidth = b.hostile ? 3 : 3.5; ctx.strokeStyle = b.hostile ? '#8948b5aa' : b.kind === 'magic' ? '#58dca88c' : '#77664e66';
      ctx.beginPath(); ctx.moveTo(b.x - b.vx / len * (b.kind === 'stone' ? 7 : 18), b.y - b.vy / len * (b.kind === 'stone' ? 7 : 18)); ctx.lineTo(b.x, b.y); ctx.stroke();
      ctx.fillStyle = color; ctx.beginPath(); ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2); ctx.fill();
      const readyArt = ARENA_READY.weapons[b.weapon || (b.kind === 'stone' ? 'slingshot' : 'staff')];
      if (!b.hostile && readyArt && images[readyArt.projectile]) {
        const width = b.explosive ? 38 : 32, height = width * .75;
        ctx.save(); ctx.translate(b.x, b.y); ctx.rotate(Math.atan2(b.vy, b.vx) - readyArt.projectileAngle);
        ctx.drawImage(images[readyArt.projectile], -width / 2, -height / 2, width, height); ctx.restore();
      }
    }
    // Joe covers the initial shot segment inside his held weapon, rather than bullets crossing his hands/body.
    drawJoe(t);
    if (extended) SurvivalUI.drawPlayer(game, ctx, images, joeHeight);
    for (const particle of particles) { ctx.globalAlpha = Math.min(1, particle.life * 3); ctx.fillStyle = particle.color; ctx.fillRect(particle.x - 2, particle.y - 2, 4, 4); } ctx.globalAlpha = 1;
    ctx.font = 'bold 16px Arial'; ctx.textAlign = 'center';
    for (const effect of game.effects) { ctx.globalAlpha = Math.min(1, effect.life * 4); ctx.fillStyle = '#092217'; ctx.fillText(effect.text, effect.x + 1, effect.y + 1); ctx.fillStyle = effect.color; ctx.fillText(effect.text, effect.x, effect.y); } ctx.globalAlpha = 1;
    if (game.mode === 'playing' && !helpOpen) {
      const x = input.relativeAim ? game.player.x + Math.cos(game.player.angle) * 230 : input.aimX;
      const y = input.relativeAim ? game.player.y - ArenaCore.AIM_HEIGHT + Math.sin(game.player.angle) * 230 : input.aimY;
      ctx.strokeStyle = '#fff4d7'; ctx.lineWidth = 1.5;
      ctx.save(); ctx.globalAlpha = .2; ctx.setLineDash([5, 9]); ctx.beginPath(); ctx.moveTo(game.player.x, game.player.y - ArenaCore.AIM_HEIGHT); ctx.lineTo(x, y); ctx.stroke(); ctx.restore();
      ctx.beginPath(); ctx.arc(x, y, 7, 0, Math.PI * 2); ctx.stroke();
      for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) { ctx.beginPath(); ctx.moveTo(x + dx * 10, y + dy * 10); ctx.lineTo(x + dx * 15, y + dy * 15); ctx.stroke(); }
    }
    if (game.player.invincible > .55 && game.mode !== 'menu') { ctx.strokeStyle = '#ec5d5899'; ctx.lineWidth = 12; ctx.strokeRect(6, 6, W - 12, H - 12); }
    ctx.restore();
  }
  function updateHud() {
    const p = game.player;
    $('healthLabel').textContent = `${Math.ceil(p.hp)} / ${p.maxHp}`; $('healthFill').style.width = `${p.hp / p.maxHp * 100}%`;
    $('healthMeter').setAttribute('aria-valuenow', Math.ceil(p.hp)); $('healthMeter').setAttribute('aria-valuemax', p.maxHp);
    $('levelLabel').textContent = `LEVEL ${game.level}`; $('xpLabel').textContent = `${game.xp} / ${game.xpNeeded}`;
    $('xpFill').style.width = `${game.xp / game.xpNeeded * 100}%`; $('xpMeter').setAttribute('aria-valuenow', game.xp); $('xpMeter').setAttribute('aria-valuemax', game.xpNeeded);
    $('waveLabel').textContent = `WAVE ${Math.max(1, game.wave)} / ${story ? 20 : extended ? game.totalWaves : WAVES.length}`;
    [...$('waveDots').children].forEach((dot, index) => { const current = extended ? Math.ceil(Math.max(1, game.wave) / 5) : Math.max(1, game.wave); dot.className = index + 1 < current ? 'done' : index + 1 === current ? 'active' : ''; });
    $('killsLabel').textContent = `${game.kills} spirit${game.kills === 1 ? '' : 's'} released`;
    $('dashLabel').textContent = p.dashCooldown > 0 ? `SPACE · DASH ${p.dashCooldown.toFixed(1)}s` : 'SPACE · DASH READY';
    $('dashLabel').style.color = p.dashCooldown > 0 ? '#aeb7a4' : '#bcf3cf';
    $('weaponLabel').textContent = p.weapon === 'staff' ? 'DUENDE STAFF' : 'SLINGSHOT';
    if (story) StoryUI.hud(game); else if (extended) SurvivalUI.hud(game);
    const boss = game.enemies.find(e => e.boss); $('bossHud').hidden = !boss;
    if (boss) { $('bossFill').style.width = `${Math.max(0, boss.hp / boss.maxHp * 100)}%`; $('bossName').textContent = boss.name.toUpperCase(); }
    $('waveBanner').hidden = !!boss || game.bannerTime <= 0 || game.mode !== 'playing' || helpOpen;
    $('waveBanner').textContent = game.banner;
    $('pauseButton').disabled = !['playing', 'paused', 'cinematic'].includes(game.mode) || helpOpen;
    $('pauseButton').textContent = game.mode === 'paused' ? '▷' : 'Ⅱ';
    $('pauseButton').setAttribute('aria-label', game.mode === 'paused' ? 'Resume game' : 'Pause game');
  }
  let starting = false;
  async function start() {
    if (!ready || starting) return;
    touch?.enterGameplay();
    if (story) { StoryUI.restart(); return; }
    const options = extended ? SurvivalUI.options() : undefined;
    starting = true; clearInput();
    const button = content.querySelector('#restartButton') || startButton, label = button.textContent;
    button.disabled = true; button.textContent = 'Loading arena…';
    try {
      if (extended) await Promise.all(arenaFiles(SurvivalCore.ARENAS[options.arena]).map(loadImage));
      particles.length = 0; game.start(options);
      if (extended) for (const arena of Object.values(SurvivalCore.ARENAS)) if (arena.image !== game.arena.image) { delete images[arena.image]; loads.delete(arena.image); }
      previousMode = ''; last = performance.now(); syncOverlay(); canvas.focus();
    } catch (error) { content.querySelector('p').textContent = error.message + '. Try again when artwork is available.'; console.error(error); }
    finally { starting = false; button.disabled = false; button.textContent = label; }
  }
  function startStory(store, resume) {
    touch?.enterGameplay(); clearInput(); particles.length = 0; game.startStory(store, resume); previousMode = ''; last = performance.now(); syncOverlay(); canvas.focus();
  }
  function togglePause() { clearInput(); if (story && StoryUI.active) { StoryUI.key({ key: 'Escape', preventDefault() {} }); return; } if (game.mode === 'playing') game.pause(); else game.resume(); syncOverlay(); }
  function choose(index) { if (game.choose(index)) { clearInput(); previousMode = ''; syncOverlay(); if (game.mode === 'playing') canvas.focus(); } }
  function syncOverlay() {
    if (helpOpen || previousMode === game.mode) return;
    previousMode = game.mode; overlay.hidden = ['playing', 'cinematic'].includes(game.mode); document.body.classList.toggle('paused', game.mode !== 'playing'); updateHud();
    document.body.classList.toggle('in-game', ['playing', 'paused', 'upgrade'].includes(game.mode));
    if (game.mode === 'playing' || game.mode === 'menu') return;
    if (story && game.mode === 'cinematic') return;
    clearInput();
    if (story && StoryUI.overlay(game)) return;
    if (game.mode === 'upgrade') {
      content.innerHTML = `<h2 id="overlayTitle">Your spirit grows.</h2><p>Level ${game.level} · Choose one upgrade.<br>The jungle can wait.</p><div class="choices">${game.choices.map((choice, index) => `<button class="choice" data-choice="${index}"><span class="choice-icon" aria-hidden="true">${choice.icon}</span><span><strong>${choice.name}</strong><small>${choice.detail}</small></span><kbd>${index + 1}</kbd></button>`).join('')}</div><span class="small-note">Choose with your mouse or the numbered keys.</span>`;
      content.querySelectorAll('[data-choice]').forEach(button => button.onclick = () => choose(Number(button.dataset.choice)));
    } else if (game.mode === 'paused') {
      content.innerHTML = menuLogo + '<h2 id="overlayTitle">Take a breath.</h2><p>Your run is paused. Nothing moves until you return.</p><button id="resumeButton" class="primary">Back to the jungle</button><br><button id="restartButton" class="secondary">Restart run</button><span class="small-note">Esc to resume · Switching tabs pauses automatically</span>';
      $('resumeButton').onclick = togglePause; $('restartButton').onclick = start;
      if (extended) { const viewButton = document.createElement('button'); viewButton.className = 'secondary'; viewButton.textContent = $('entireArena').checked ? 'Use following camera' : 'Show entire arena'; viewButton.onclick = () => { $('entireArena').checked = !$('entireArena').checked; viewButton.textContent = $('entireArena').checked ? 'Use following camera' : 'Show entire arena'; }; content.append(viewButton); }
      if (story) { const back = document.createElement('button'); back.className = 'secondary'; back.textContent = 'Story menu'; back.onclick = StoryUI.menu; content.append(back); }
    } else {
      const won = game.mode === 'victory', seconds = Math.floor(game.time);
      content.innerHTML = `${menuLogo}<h2 id="overlayTitle">${won ? 'The jungle is yours.' : 'The spirits prevailed.'}</h2><p>${won ? (extended ? game.totalWaves + ' waves survived. Guardians defeated.<br>Joe Grind lives to tell the story.' : 'Ten waves survived. Both bosses released.<br>Joe Grind lives to tell the story.') : 'Every run makes you wiser.<br>Gather light, use cover, and keep moving.'}</p><div class="run-stats"><div><b>${game.kills}</b><span>SPIRITS RELEASED</span></div><div><b>${game.level}</b><span>LEVEL</span></div><div><b>${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}</b><span>RUN TIME</span></div></div><button id="restartButton" class="primary">Play again</button><span class="small-note">${won ? `VICTORY · ${extended ? game.totalWaves : WAVES.length} / ${extended ? game.totalWaves : WAVES.length} waves` : `Reached wave ${game.wave} / ${extended ? game.totalWaves : WAVES.length}`}</span>`;
      $('restartButton').onclick = start;
    }
    paintPortraits(); content.querySelector('button')?.focus();
  }
  startButton.onclick = start; $('pauseButton').onclick = togglePause;
  const fullscreenButton=document.createElement('button'); fullscreenButton.id='fullscreenButton'; fullscreenButton.className='secondary'; fullscreenButton.textContent='Full screen';
  fullscreenButton.onclick=()=>document.fullscreenElement ? document.exitFullscreen() : touch?.enterGameplay();
  document.querySelector('.masthead nav').prepend(fullscreenButton);
  document.addEventListener('fullscreenchange',()=>{fullscreenButton.textContent=document.fullscreenElement ? 'Window view' : 'Full screen';});

  $('soundButton').onclick = () => {
    soundOn = !soundOn; $('soundButton').setAttribute('aria-pressed', String(soundOn));
    $('soundButton').setAttribute('aria-label', soundOn ? 'Mute sound' : 'Enable sound'); $('soundButton').title = soundOn ? 'Sound on' : 'Sound off';
    $('soundButton').style.opacity = soundOn ? '1' : '.6'; tone(660, .12, .04);
  };
  let savedContent = null;
  function closeHelp() {
    helpOpen = false; clearInput();
    if (helpMode === 'menu') { content.replaceChildren(...savedContent); overlay.hidden = false; previousMode = 'menu'; }
    else { if (helpMode === 'playing') game.resume(); previousMode = ''; syncOverlay(); }
    savedContent = null; if (game.mode === 'playing') canvas.focus(); else content.querySelector('button')?.focus();
  }
  $('helpButton').onclick = () => {
    if (helpOpen) return;
    helpMode = game.mode; game.pause(); clearInput(); helpOpen = true; savedContent = [...content.childNodes]; overlay.hidden = false;
    content.innerHTML = '<h2 id="overlayTitle">Know the jungle.</h2><div class="instructions"><p><strong>Move</strong> with WASD or arrow keys. Aim with your mouse and hold left-click to fire your slingshot.</p><p><strong>Dash</strong> with Space. It grants brief protection and recharges in 1.65 seconds.</p><p><strong>Gather mint gems</strong> to level up. Combat pauses while you choose an upgrade.</p><p><strong>Use the ruins</strong> as cover. They block movement and shots. Purple rings warn you before enemies appear.</p><p><strong>Wave 5: Tata Duende.</strong> Defeat him and walk over his dropped staff. It grants +60% damage and 15% faster firing, keeping your perks. Collect it to continue to wave six.</p><p><strong>Wave 10: Corrupted Jaguar Spirit.</strong> Dodge its marked charge and spirit volleys to win.</p><p><strong>Rest between waves:</strong> recover 15 health and gather remaining gems. Esc pauses; switching tabs pauses too.</p></div><button id="closeHelpButton" class="primary">Got it</button><span class="small-note">Folklore-inspired fiction. Combat abilities are original game rules.</span>';
    if (story) content.innerHTML = '<h2 id="overlayTitle">The Four Spirit Trials</h2><div class="instructions"><p>Move with WASD / arrows, aim with your mouse and hold left click to attack. Space dashes; Escape pauses. On touch, use both sticks and the Dash button.</p><p>Start with Joe’s Sling. E or the touch Weapon button cycles permanently unlocked spirit weapons when no drop is nearby. Collect gems and choose upgrades; each level needs more XP.</p><p>Four trials, twenty waves. Restore Duende at wave 5, the Hollow Keeper at 10, the Jaguar at 15 and the Tide Warden at 20. Walk through each purple doorway after its conversation.</p><p>Underworld crystals protect nearby foes. Shoot all three protective crystals before attacking the Keeper’s core. Green restored ground briefly heals.</p><p>Rockfalls show warning rings before they strike. The Jaguar summons up to six cave reinforcements and accelerates below half health.</p><p>The Coast’s tides reduce safe space. Stand in drum circles for brief protection and recovery. In the Warden’s final phase, charge each of the three circles between attacks to break its barrier.</p><p>Wave-start checkpoints retain your build. Death restarts that wave. Conversations may be skipped with the same rewards. The three spirit weapons remain unlocked on this device. Survival stays open during testing; full release requires Chapter I.</p></div><button id="closeHelpButton" class="primary">Got it</button>'; else if (extended) content.innerHTML = SurvivalUI.help;
    if (story) content.innerHTML = '<h2 id="overlayTitle">The first trial.</h2><div class="instructions"><p><strong>Desktop:</strong> WASD / arrows move; mouse aims; hold left-click to fire. Space dashes; Escape pauses.</p><p><strong>Touch:</strong> left stick moves and faces Joe; right stick aims and fires while pushed. Dash and Pause have buttons. Walk over gems and the dropped Duende Staff.</p><p><strong>Prologue:</strong> tap the scene or Continue, or press Enter. Skip prologue / Space skips the whole opening. Escape pauses it. Replay is available in the Story menu.</p><p><strong>The Jungle Remembers:</strong> five waves, ending with Tata Duende. Purify his manifestation, release the remaining creatures and collect his staff to complete this trial.</p><p><strong>Progress:</strong> Continue restarts the saved wave with its starting build. The other three Story encounters are still in development. Production Survival unlocks after all four trials.</p></div><button id="closeHelpButton" class="primary">Got it</button>';
    $('closeHelpButton').onclick = closeHelp; $('closeHelpButton').focus(); updateHud();
  };
  function mouseAim(event) {
    if (event.pointerType === 'touch') return;
    mouse = { x: event.clientX, y: event.clientY }; input.relativeAim = false; input.aiming = true;
    const target = ArenaViewport.point(view, canvas.getBoundingClientRect(), mouse.x, mouse.y);
    input.aimX = target.x; input.aimY = target.y;
  }
  canvas.addEventListener('pointermove', mouseAim);
  canvas.addEventListener('pointerdown', event => {
    if (event.pointerType === 'touch' || event.button !== 0 || game.mode !== 'playing') return;
    canvas.focus(); canvas.setPointerCapture(event.pointerId); mousePointer = event.pointerId; input.shooting = true; mouseAim(event);
  });
  function mouseRelease(event) { if (event.pointerId === mousePointer) { input.shooting = false; mousePointer = null; } }
  window.addEventListener('pointerup', mouseRelease);
  canvas.addEventListener('pointercancel', mouseRelease);
  canvas.addEventListener('lostpointercapture', mouseRelease);
  canvas.addEventListener('contextmenu', event => event.preventDefault());
  window.addEventListener('keydown', event => {
    const key = event.key.length === 1 ? event.key.toLowerCase() : event.key;
    if (key === 'Tab' && !overlay.hidden) {
      const buttons = [...content.querySelectorAll('button:not(:disabled)')];
      if (buttons.length) { const i = buttons.indexOf(document.activeElement); buttons[(i + (event.shiftKey ? -1 : 1) + buttons.length) % buttons.length].focus(); event.preventDefault(); } return;
    }
    if (story && !helpOpen && StoryUI.key(event)) return;
    if (key === 'Escape') { event.preventDefault(); if (!event.repeat) { if (helpOpen) closeHelp(); else togglePause(); } return; }
    if (helpOpen) return;
    if (game.mode === 'upgrade' && /^[1234]$/.test(key) && !event.repeat) { event.preventDefault(); choose(Number(key) - 1); return; }
    if (game.mode !== 'playing') return;
    if (['w', 'a', 's', 'd', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(key)) event.preventDefault();
    if (extended && key === 'e' && !event.repeat) { event.preventDefault(); game.pickup(); return; }
    keys.add(key); movement(); if (key === ' ' && !event.repeat) game.dash(input);
  });
  window.addEventListener('keyup', event => { keys.delete(event.key.length === 1 ? event.key.toLowerCase() : event.key); movement(); });
  function loseFocus() { clearInput(); if (story) StoryUI.loseFocus(); if (game.pause()) syncOverlay(); }
  window.addEventListener('blur', loseFocus); document.addEventListener('visibilitychange', () => { if (document.hidden) loseFocus(); last = performance.now(); });
  function frame(now) {
    const dt = last ? Math.min((now - last) / 1000, .05) : 0; last = now;
    if (ready) {
      const rect = canvas.getBoundingClientRect();
      if (extended) { W=game.arena.width; H=game.arena.height; }
      view = ArenaViewport.follow(game.player, { w: W, h: H }, rect.width / rect.height, extended && !!$('entireArena')?.checked, view, game.mode === 'playing' ? dt : 0, extended && game.arena.scrolling ? 1200 : 0);
      if (extended) game.view = view;
      if (mouse && !input.relativeAim) { const target = ArenaViewport.point(view, rect, mouse.x, mouse.y); input.aimX = target.x; input.aimY = target.y; }
      touch?.update(); game.update(dt, input); handleEvents(); syncOverlay();
      if (story) StoryUI.update(dt, reducedMotion);
      if (game.mode === 'playing') for (const p of particles) { p.x += p.vx * dt; p.y += p.vy * dt; p.life -= dt; }
      for (let i = particles.length - 1; i >= 0; i--) if (particles[i].life <= 0) particles.splice(i, 1);
      shake = Math.max(0, shake - dt); if (now - lastHud > 80) { updateHud(); lastHud = now; }
    }
    if (!story || !StoryUI.active) render(game.mode === 'menu' ? now / 1000 : game.time);
    requestAnimationFrame(frame);
  }
  const weaponIds = story ? ['slingshot', 'staff', 'obsidian', 'claw'] : extended ? Object.keys(ARENA_READY.weapons) : ['slingshot', 'staff'];
  const weaponFiles = weaponIds.flatMap(id => { const a = ARENA_READY.weapons[id]; return [a.pickup, a.held, a.projectile, ...(extended ? a.impactFrames || [a.impact] : [])]; });
  const holdingFiles = weaponIds.flatMap(id => ARENA_READY.holding[id].frames);
  const spriteFiles = Object.entries(ARENA_READY.sprites).filter(([key]) => extended || !['tommy', 'miniLlorona'].includes(key)).flatMap(([key,a]) => [...(key === 'joe' ? [] : a.frames), ...(a.portrait ? [a.portrait] : [])]);
  const rosterFiles = extended ? Object.entries(window.ARENA_ROSTER || {}).filter(([id]) => !story || ['spiderling', 'worker', 'bees', 'rootling', 'owlShade', 'hollowKeeper', 'tideWarden'].includes(id)).map(([, a]) => a.file) : [];
  function arenaFiles(arena) { return [...new Set([arena.image, ...arena.obstacles.map(o => o.image), ...(arena.decor || []).map(d => d.image)].filter(Boolean))]; }
  const files = [...new Set([...rosterFiles, ...spriteFiles, ...holdingFiles, 'teenage-joe.png', ...(extended ? arenaFiles(game.arena) : ['jungle-arena.png']), 'limestone-ruins.png', ...weaponFiles,
    ...(story ? StoryCore.TRIALS.map(t => StoryCore.arenaFor(t.id).image) : []),
    ...(extended ? [...Object.values(ARENA_READY.powers).map(a => a.pickup), ...ARENA_READY.powers.shield.bubbleFrames] : [])])];
  const loads = new Map();
  function loadImage(file) {
    if (!loads.has(file)) loads.set(file, new Promise((resolve, reject) => {
      const image = new Image(), timeout = setTimeout(() => fail(), 45000);
      function fail() { clearTimeout(timeout); reject(new Error(`Artwork failed to load/decode: assets/${file}`)); }
      image.onload = async () => {
        try { if (image.decode) await image.decode(); images[file] = ArenaArt.sourceGrid(image, file); clearTimeout(timeout); resolve(); }
        catch { fail(); }
      };
      image.onerror = fail; image.src = `assets/${file}?v=0.5.2`;
    }).catch(error => { loads.delete(file); throw error; }));
    return loads.get(file);
  }
  async function loadArtwork(files) {
    const queue = [...files]; let completed = 0;
    await Promise.all(Array.from({ length: 6 }, async () => {
      while (queue.length) {
        await loadImage(queue.shift()); completed++;
        startButton.textContent = 'Loading artwork… ' + completed + ' / ' + files.length;
      }
    }));
  }
  loadArtwork(files).then(() => {
    ready = true; startButton.disabled = false; startButton.textContent = 'Enter the arena';
    if (window.TouchControls) touch = TouchControls.attach({ game, input, canvas, togglePause });
    if (story) StoryUI.init({ game, clearInput, startStory, tone, whisper, images, touch });
    updateHud(); paintPortraits();
  })
    .catch(error => { startButton.disabled = false; startButton.textContent = 'Retry loading'; startButton.onclick = () => location.reload(); content.querySelector('p').textContent = 'Artwork did not finish loading. Check your connection, then retry.'; console.error(error); });
  requestAnimationFrame(frame);
})();

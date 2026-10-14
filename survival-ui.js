/* Copyright (c) 2026 Authentically Belize Movement. See LICENSE. */
(() => {
  'use strict';
  const { WEAPONS, PERKS, POWERS } = SurvivalCore;
  const $ = id => document.getElementById(id);
  const powerArt = ARENA_READY.powers;
  $('starterWeapon').innerHTML = WEAPONS.map(w => '<option value="' + w.id + '">' + w.name + '</option>').join('');
  function icon(ctx, images, file, x, y, size) {
    ctx.drawImage(images[file], x - size / 2, y - size / 2, size, size);
  }
  window.SurvivalUI = {
    powerArt,
    options() { return { arena: $('arenaSelect').value, mode: $('modeSelect').value, weapon: $('starterWeapon').value }; },
    draw(game, ctx, images) {
      for (const c of game.clouds) { ctx.save(); ctx.globalAlpha = .2; ctx.fillStyle = c.color; ctx.beginPath(); ctx.arc(c.x, c.y, c.r, 0, Math.PI * 2); ctx.fill(); ctx.restore(); }
      for (const f of game.flashes) {
        ctx.save(); ctx.globalAlpha = Math.min(.9, f.life * 4);
        if (f.kind === 'shock') {
          ctx.strokeStyle = '#e8f5ff'; ctx.lineWidth = 3; ctx.shadowColor = '#82baff'; ctx.shadowBlur = 12;
          ctx.beginPath(); f.points.forEach((p, i) => i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)); ctx.stroke();
        } else if (f.kind === 'explosion') {
          const frames = ARENA_READY.weapons.cohune.impactFrames;
          const image = frames[Math.min(frames.length - 1, Math.floor((.5 - f.life) / .5 * frames.length))];
          icon(ctx, images, image, f.x, f.y, f.r * 2);
          ctx.fillStyle = '#ffbc6133'; ctx.beginPath(); ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2); ctx.fill();
        } else if (f.kind === 'nuke') {
          ctx.fillStyle = '#ffdf9a'; ctx.globalAlpha = Math.min(.5, f.life * .65); ctx.fillRect(0, 0, SurvivalCore.W, SurvivalCore.H);
        } else {
          ctx.strokeStyle = f.color; ctx.lineWidth = 4; ctx.beginPath();
          if (f.arc === null || f.arc === undefined) ctx.arc(f.x, f.y, f.r * (1 - f.life / .8), 0, Math.PI * 2);
          else ctx.arc(f.x, f.y, f.r, f.arc - Math.PI * 70 / 360, f.arc + Math.PI * 70 / 360);
          ctx.stroke();
        }
        ctx.restore();
      }
      for (const d of game.drops) {
        const w = SurvivalCore.weapon(d.id), color = d.kind === 'power' ? POWERS[d.id].color : '#ffe199';
        ctx.strokeStyle = color; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(d.x, d.y + 9, 25, 12, 0, 0, Math.PI * 2); ctx.stroke();
        if (d.kind === 'weapon') icon(ctx, images, ARENA_READY.weapons[d.id].pickup, d.x, d.y - 14, 48);
        else if (powerArt[d.id]) icon(ctx, images, powerArt[d.id].pickup, d.x, d.y - 14 + Math.sin(game.time * 3 + d.x) * 3, 48);
        else { ctx.fillStyle = color; ctx.font = 'bold 24px Arial'; ctx.textAlign = 'center'; ctx.fillText('✦', d.x, d.y); }
        const nearby = Math.hypot(d.x - game.player.x, d.y - game.player.y) <= 50;
        if (nearby || d.boss) {
          const text = d.kind === 'power' ? POWERS[d.id].name : (nearby ? 'PICK UP · ' : '') + w.name + ' · ' + Math.max(0, d.life).toFixed(1) + 's';
          ctx.font = '13px Arial'; ctx.textAlign = 'center'; const width = ctx.measureText(text).width + 16;
          ctx.fillStyle = '#092119ee'; ctx.fillRect(d.x - width / 2, d.y + 23, width, 22); ctx.fillStyle = color; ctx.fillText(text, d.x, d.y + 39);
        }
      }
    },
    drawPlayer(game, ctx, images, height) {
      const p = game.player;
      if (game.active('shield')) {
        const frames = ARENA_READY.powers.shield.bubbleFrames;
        ctx.save(); ctx.globalAlpha = .55; ctx.globalCompositeOperation = 'screen';
        ctx.drawImage(images[frames[Math.floor(game.time * 8) % frames.length]], p.x - height * .58, p.y + 13 - height * 1.17, height * 1.16, height * 1.35);
        ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1; ctx.strokeStyle = '#b7fff2'; ctx.lineWidth = 2; ctx.fillStyle = '#77ffdd0a';
        ctx.beginPath(); ctx.ellipse(p.x, p.y + 13 - height / 2, height * .5, height * .62, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); ctx.restore();
      }
    },
    hud(game) {
      const w = SurvivalCore.weapon(game.player.weapon), rank = ['I', 'II', 'III', 'IV'][game.weaponLevels[w.id] - 1];
      $('weaponLabel').textContent = w.name + ' ' + rank; $('buildWeapon').textContent = w.name + ' ' + rank;
      $('buildStats').textContent = game.player.damage.toFixed(1) + ' damage · ' + (1 / game.player.interval).toFixed(2) + '/sec';
      $('activePowers').textContent = Object.entries(game.powers).map(([id, time]) => POWERS[id].name + ' ' + Math.ceil(time) + 's').join(' · ') || 'No temporary powers active';
      const owned = PERKS.filter(p => game.rank(p.id));
      $('buildPerks').replaceChildren(...owned.map(p => { const item = document.createElement('li'); item.textContent = p.name + ' ' + game.rank(p.id) + '/' + p.max; if (!game.compatible(p)) item.textContent += ' · dormant'; return item; }));
      $('buildEmpty').hidden = owned.length > 0; $('arenaName').textContent = game.arena.name + ' · ' + (game.totalWaves === 40 ? 'Survival' : 'Arena Run');
      const d = game.drops.filter(d => d.kind === 'weapon' && Math.hypot(d.x - game.player.x, d.y - game.player.y) <= 36)[0];
      $('pickupHint').textContent = d ? game.commitWeapon && d.id !== game.commitWeapon ? 'Weapon locked by One Tool, One Path' : 'E · Pick up ' + SurvivalCore.weapon(d.id).name : 'E · Claim nearby weapon';
      for (const id of ['arenaSelect', 'modeSelect', 'starterWeapon']) $(id).disabled = !['menu', 'victory', 'gameover'].includes(game.mode);
    },
    help: '<h2 id="overlayTitle">Find your build.</h2><div class="instructions"><p><strong>WASD / arrows:</strong> move. Mouse aims; hold left-click to attack. Space dashes; Esc pauses.</p><p><strong>E:</strong> collect a nearby weapon. Replaced weapons drop. A duplicate enhances up to IV; another duplicate heals 10% max HP. Ranks survive swapping. Floor weapons last five active seconds; intermission pauses their timer, and the next wave grants five seconds.</p><p><strong>Gems:</strong> choose perks with 1–3, or 4 after Grandma Knows Best. Maxed and incompatible choices are filtered. Owned incompatible perks become dormant.</p><p><strong>Bosses:</strong> every five waves. Duende drops his staff; Jaguar drops its claw. Both are optional. Survive wave 40 to finish.</p><p><strong>Powers:</strong> walk over illustrated pickups. Shock chains through nearby enemies; Nuke releases every enemy currently on the map. Weapon rewards require E. All twelve starters are available for testing.</p><p><strong>Cover:</strong> rocks and ruins block movement, shots and explosions. Open Jungle Clearing is a separate flat 1024 × 1024 field with no internal cover. The four original maps retain their previous borders, walls and boulder collisions. Decorative terrain is not an additional hazard.</p><p>XP level is capped at 40; waves are separate. This test has 31 perks. Permanent unlocks, arena hazards and the remaining designs are future work.</p></div><button id="closeHelpButton" class="primary">Got it</button>'
  };
})();

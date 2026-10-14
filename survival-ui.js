/* Copyright (c) 2026 Authentically Belize Movement. See LICENSE. */
(() => {
  'use strict';
  const { WEAPONS, PERKS, POWERS } = SurvivalCore;
  const $ = id => document.getElementById(id);
  const powerArt = {
    badman: { file: 'powers/badman.png', rect: [54, 275, 129, 116] },
    nuke: { file: 'powers/nuke.png', rect: [39, 318, 145, 148] },
    bonusXP: { file: 'powers/bonusXP.png', rect: [35, 295, 181, 193] },
    doubleXP: { file: 'powers/doubleXP.png', rect: [42, 270, 202, 200] },
    freeze: { file: 'powers/freeze.png', rect: [51, 274, 144, 129] },
    heavy: { file: 'powers/heavy.png', rect: [51, 294, 155, 150] },
    shield: { file: 'powers/shield.png', rect: [47, 308, 158, 158] },
    shock: { file: 'powers/shock.png', rect: [48, 342, 126, 130] },
    evolution: { file: 'powers/evolution.png', rect: [50, 235, 164, 158] }
  };
  $('starterWeapon').innerHTML = WEAPONS.map(w => '<option value="' + w.id + '">' + w.name + '</option>').join('');
  function icon(ctx, image, w, x, y, height) {
    if (!w.art) return;
    const width = w.art[2] / w.art[3] * height;
    ctx.drawImage(image, ...w.art, x - width / 2, y - height / 2, width, height);
  }
  window.SurvivalUI = {
    powerArt,
    options() { return { arena: $('arenaSelect').value, mode: $('modeSelect').value, weapon: $('starterWeapon').value }; },
    draw(game, ctx, images) {
      for (const c of game.clouds) { ctx.save(); ctx.globalAlpha = .2; ctx.fillStyle = c.color; ctx.beginPath(); ctx.arc(c.x, c.y, c.r, 0, Math.PI * 2); ctx.fill(); ctx.restore(); }
      for (const f of game.flashes) {
        ctx.save(); ctx.globalAlpha = Math.min(.8, f.life * 3); ctx.strokeStyle = f.color; ctx.lineWidth = 4; ctx.beginPath();
        if (f.arc === null || f.arc === undefined) ctx.arc(f.x, f.y, f.r * (1 - f.life / .8), 0, Math.PI * 2);
        else ctx.arc(f.x, f.y, f.r, f.arc - Math.PI * 70 / 360, f.arc + Math.PI * 70 / 360);
        ctx.stroke(); ctx.restore();
      }
      for (const d of game.drops) {
        const w = SurvivalCore.weapon(d.id), color = d.kind === 'power' ? POWERS[d.id].color : '#ffe199';
        ctx.strokeStyle = color; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(d.x, d.y + 9, 25, 12, 0, 0, Math.PI * 2); ctx.stroke();
        if (d.kind === 'weapon' && w.art) icon(ctx, images['weapon-sheet.png'], w, d.x, d.y - 14, 40);
        else if (d.kind === 'power' && powerArt[d.id]) {
          const art = powerArt[d.id]; ctx.save(); ctx.globalCompositeOperation = 'screen';
          ctx.drawImage(images[art.file], ...art.rect, d.x - 24, d.y - 36 + Math.sin(game.time * 3 + d.x) * 3, 48, 48); ctx.restore();
        } else { ctx.fillStyle = color; ctx.font = 'bold 24px Arial'; ctx.textAlign = 'center'; ctx.fillText(d.kind === 'power' ? '✦' : '♜', d.x, d.y); }
        const nearby = Math.hypot(d.x - game.player.x, d.y - game.player.y) <= 50;
        if (nearby || d.boss) {
          const text = d.kind === 'power' ? POWERS[d.id].name : (nearby ? 'E · ' : '') + w.name;
          ctx.font = '13px Arial'; ctx.textAlign = 'center'; const width = ctx.measureText(text).width + 16;
          ctx.fillStyle = '#092119ee'; ctx.fillRect(d.x - width / 2, d.y + 23, width, 22); ctx.fillStyle = color; ctx.fillText(text, d.x, d.y + 39);
        }
      }
      const p = game.player, w = SurvivalCore.weapon(p.weapon);
      if (w.art && p.weapon !== 'slingshot') { ctx.save(); ctx.translate(p.x + Math.cos(p.angle) * 16, p.y - 19); ctx.rotate(p.angle + Math.PI / 4); icon(ctx, images['weapon-sheet.png'], w, 0, 0, 28); ctx.restore(); }
      if (game.active('shield')) { ctx.strokeStyle = '#b7fff2'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(p.x, p.y - 12, 36, 0, Math.PI * 2); ctx.stroke(); }
    },
    hud(game) {
      const w = SurvivalCore.weapon(game.player.weapon), rank = ['I', 'II', 'III', 'IV'][game.weaponLevels[w.id] - 1];
      $('weaponLabel').textContent = w.name + ' ' + rank; $('buildWeapon').textContent = w.name + ' ' + rank;
      $('buildStats').textContent = game.player.damage.toFixed(1) + ' damage · ' + (1 / game.player.interval).toFixed(2) + '/sec';
      $('activePowers').textContent = Object.entries(game.powers).map(([id, time]) => POWERS[id].name + ' ' + Math.ceil(time) + 's').join(' · ') || 'No temporary powers active';
      const owned = PERKS.filter(p => game.rank(p.id));
      $('buildPerks').replaceChildren(...owned.map(p => { const item = document.createElement('li'); item.textContent = p.name + ' ' + game.rank(p.id) + '/' + p.max; if (p.tag && p.tag !== 'boss' && !w.tags.includes(p.tag)) item.textContent += ' · dormant'; return item; }));
      $('buildEmpty').hidden = owned.length > 0; $('arenaName').textContent = game.arena.name + ' · ' + (game.totalWaves === 40 ? 'Survival' : 'Arena Run');
      const d = game.drops.filter(d => d.kind === 'weapon' && Math.hypot(d.x - game.player.x, d.y - game.player.y) <= 36)[0];
      $('pickupHint').textContent = d ? game.commitWeapon && d.id !== game.commitWeapon ? 'Weapon locked by One Tool, One Path' : 'E · Pick up ' + SurvivalCore.weapon(d.id).name : 'E · Claim nearby weapon';
      for (const id of ['arenaSelect', 'modeSelect', 'starterWeapon']) $(id).disabled = !['menu', 'victory', 'gameover'].includes(game.mode);
    },
    help: '<h2 id="overlayTitle">Find your build.</h2><div class="instructions"><p><strong>WASD / arrows:</strong> move. Mouse aims; hold left-click to attack. Space dashes; Esc pauses.</p><p><strong>E:</strong> collect a nearby weapon. Replaced weapons drop. A duplicate enhances up to IV; another duplicate heals 10% max HP. Ranks survive swapping.</p><p><strong>Gems:</strong> choose perks with 1–3, or 4 after Grandma Knows Best. Maxed and incompatible choices are filtered. Owned incompatible perks become dormant.</p><p><strong>Bosses:</strong> every five waves. Duende drops his staff; Jaguar drops its claw. Both are optional. Survive wave 40 to finish.</p><p><strong>Powers:</strong> walk over glowing stars. Weapon rewards require E. All twelve starters are available for testing.</p><p><strong>Cover:</strong> rocks and ruins block movement, shots and explosions. Water and cliffs surround the clearing.</p><p>XP level is capped at 40; waves are separate. This test has 31 perks. Permanent unlocks, arena hazards and the remaining designs are future work.</p></div><button id="closeHelpButton" class="primary">Got it</button>'
  };
})();

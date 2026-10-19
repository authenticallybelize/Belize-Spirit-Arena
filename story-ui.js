/* Copyright (c) 2026 Authentically Belize Movement. See LICENSE. */
(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const menuLogo = '<img class="menu-logo" src="assets/branding/logo.png?v=0.5.2" srcset="assets/branding/logo.png?v=0.5.2 886w, assets/branding/logo@2x.png?v=0.5.2 1774w" sizes="280px" width="1774" height="887" alt="" decoding="async">';
  let storage;
  try { storage = window.localStorage; } catch { storage = { getItem() { throw Error('Unavailable'); } }; }
  const store = new StoryCore.Store(storage);
  let bridge, cinematic = null, view = 'main', pulseClock = 0;
  let artRequest = 0, loadingArt = false;
  const artCache = new Map();
  function preload(art) {
    if (!artCache.has(art)) artCache.set(art, new Promise((resolve, reject) => {
      const image = new Image();
      const timeout = setTimeout(() => reject(Error('Illustration timed out')), 15000);
      image.onload = () => { clearTimeout(timeout); image.decode().then(() => resolve(image), () => resolve(image)); };
      image.onerror = () => { clearTimeout(timeout); reject(Error('Illustration unavailable')); };
      image.src = 'assets/' + art;
    }));
    return artCache.get(art);
  }
  function paintArt(scene) {
    const image = $('cinemaArt'), previous = $('cinemaPrevious'), request = ++artRequest;
    image.dataset.requested = scene.art; loadingArt = true; $('cinemaNext').disabled = true;
    previous.hidden = !image.naturalWidth;
    if (image.naturalWidth) { previous.src = image.src; previous.style.transform = image.style.transform; }
    image.classList.remove('ready');
    $('cinemaPlaceholder').hidden = false; $('cinemaPlaceholder').textContent = 'Loading illustration…';
    preload(scene.art).then(art => {
      if (!cinematic || request !== artRequest) return;
      image.src = art.src; image.alt = scene.title + ' · illustrated comic frame'; image.dataset.scene = scene.id;
      image.classList.add('ready'); $('cinemaPlaceholder').hidden = true; loadingArt = false;
      $('cinemaNext').disabled = cinematic.paused;
      const next = cinematic.scenes[cinematic.scene + 1]?.art;
      // Keep only the current and next decoded frames on memory-constrained phones.
      for (const key of artCache.keys()) if (key !== scene.art && key !== next) artCache.delete(key);
      if (next) preload(next).catch(() => {});
    }).catch(() => {
      if (!cinematic || request !== artRequest) return;
      previous.hidden = true; loadingArt = false; $('cinemaNext').disabled = cinematic.paused;
      $('cinemaPlaceholder').textContent = 'Illustration unavailable · ' + scene.title + '. You can continue or skip.';
    });
  }
  const esc = text => String(text).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  function button(id, text, primary = false, disabled = false) {
    return '<button id="' + id + '" class="' + (primary ? 'primary' : 'secondary') + '"' + (disabled ? ' disabled' : '') + '>' + text + '</button>';
  }
  function show(html) {
    bridge.clearInput(); $('overlay').hidden = false; $('dialogContent').innerHTML = menuLogo + html;
    $('dialogContent').querySelector('button:not(:disabled)')?.focus();
  }
  function home() {
    artRequest++; artCache.clear(); loadingArt = false;
    cinematic = null; $('cinematic').hidden = true; document.body.classList.remove('cinematic-open');
    bridge.game.mode = 'menu'; view = 'main';
    show('<h2 id="overlayTitle" class="visually-hidden">Belize: Spirit Arena</h2><p>Chapter I · Seven years later.<br>A stone. A doorway. A jungle that remembers.</p><div class="story-menu">' +
      button('storyMenu', 'STORY MODE', true) + button('survivalMenu', StoryCore.SURVIVAL_TEST_OPEN ? 'SURVIVAL · OPEN TEST' : 'SURVIVAL MODE', false, !StoryCore.SURVIVAL_TEST_OPEN && !store.data.survivalUnlocked) +
      button('leaderboardMenu', 'LEADERBOARD') + button('howMenu', 'HOW TO PLAY') + button('optionsMenu', 'OPTIONS') +
      '</div><p class="menu-footnote">' + (store.data.survivalUnlocked ? 'Chapter I complete · Survival earned.' : 'Survival is open for testing. Full release: complete Chapter I to unlock it.') +
      '</p><a href="survival.html" class="test-link">Open Survival test · open field + four arenas</a><br><a href="index.html" class="test-link">Original ten-wave prototype</a>' +
      (store.warning ? '<p class="save-warning" role="status">' + esc(store.warning) + '</p>' : ''));
    $('storyMenu').onclick = storyMenu;
    $('survivalMenu').onclick = () => { if (StoryCore.SURVIVAL_TEST_OPEN || store.data.survivalUnlocked) location.href = 'survival.html'; };
    $('leaderboardMenu').onclick = () => { view = 'info'; show('<h2 id="overlayTitle">Leaderboard</h2><p>Online rankings are not connected in this local prototype.<br>Story progress is saved on this device.</p>' + button('backMenu', 'Back')); $('backMenu').onclick = home; };
    $('howMenu').onclick = () => $('helpButton').click();
    $('optionsMenu').onclick = () => {
      view = 'info';
      show('<h2 id="overlayTitle">Options</h2><p>Sound is optional and starts muted.<br>Reduced motion follows your device preference.<br>Touch controls appear automatically on phones and tablets.</p>' +
        button('optionSound', 'Toggle sound') + button('optionTouch', 'Touch controls') + button('backMenu', 'Back'));
      $('optionSound').onclick = () => $('soundButton').click(); $('optionTouch').onclick = () => bridge.touch?.openSettings(); $('backMenu').onclick = home;
    };
  }
  function storyMenu() {
    bridge.game.mode = 'menu'; view = 'story'; const checkpoint = store.data.checkpoint;
    show('<h2 id="overlayTitle">The Four Spirit Trials</h2><p>Joe Grind, age 16. Seven years later.<br>Four Guardians. Twenty waves. One broken fragment.</p>' +
      button('newStory', 'New Story game', true) +
      (checkpoint ? button('continueStory', 'Continue · ' + checkpoint.arena + ' · wave ' + checkpoint.wave) : '') +
      button('replayPrologue', 'Replay prologue') + button('backMenu', 'Back') +
      '<span class="small-note">' + store.data.completedArenas.length + ' / 4 Guardians restored.<br>Continue restarts the saved wave with its starting build. Guardian scenes and open doors also save.<br>Permanent weapons: ' + store.data.unlockedWeapons.map(w => esc(SurvivalCore.weapon(w).name)).join(' · ') + '</span>');
    $('newStory').onclick = () => begin(false);
    if ($('continueStory')) $('continueStory').onclick = () => bridge.startStory(store, true);
    $('replayPrologue').onclick = () => begin(true); $('backMenu').onclick = home;
  }
  function begin(replay) {
    bridge.touch?.enterGameplay();
    play(StoryCore.SCENES, skipped => {
      store.recordPrologue(skipped);
      if (replay) { bridge.game.mode = 'menu'; storyMenu(); } else bridge.startStory(store, false);
    });
  }
  function play(scenes, finish) {
    bridge.clearInput(); bridge.game.mode = 'cinematic'; $('overlay').hidden = true;
    $('cinematic').hidden = false; document.body.classList.add('cinematic-open');
    cinematic = new StoryCore.Cinematic(scenes, skipped => {
      $('cinematic').hidden = true; document.body.classList.remove('cinematic-open');
      cinematic = null; artRequest++; artCache.clear(); loadingArt = false; bridge.clearInput();
      finish(skipped);
    });
    $('cinemaArt').dataset.requested = ''; paintLine(); $('cinemaStage').focus();
  }
  function paintLine() {
    if (!cinematic) return;
    const scene = cinematic.current, [speaker, text, effect] = scene.lines[cinematic.line];
    const image = $('cinemaArt');
    if (image.dataset.requested !== scene.art) paintArt(scene);
    $('cinemaTitle').textContent = scene.title;
    $('cinemaSpeaker').textContent = speaker; $('cinemaText').textContent = text;
    $('cinemaCount').textContent = 'FRAME ' + (cinematic.scene + 1) + ' / ' + cinematic.scenes.length;
    $('cinematic').dataset.effect = effect || scene.effect || '';
    const actor = $('cinemaActor'); actor.hidden = !scene.actor; if (scene.actor) actor.src = 'assets/' + scene.actor;
    $('spiritSymbols').hidden = !['heart', 'doors'].includes(scene.effect);
    $('spiritSymbols').dataset.restored = scene.effect === 'doors' ? '4' : '12';
    $('cinemaNext').textContent = cinematic.scene === cinematic.scenes.length - 1 && cinematic.line === scene.lines.length - 1 ? 'Continue →' : 'Continue';
    $('cinemaNext').disabled = cinematic.paused || loadingArt;
    const sound = $('soundButton').getAttribute('aria-pressed') === 'true';
    $('cinemaSound').textContent = sound ? 'Sound on' : 'Sound off'; $('cinemaSound').setAttribute('aria-pressed', String(sound));
    $('cinemaPause').textContent = cinematic.paused ? 'Resume' : 'Pause';
    $('cinemaPaused').hidden = !cinematic.paused; pulseClock = 0;
    if (effect === 'pulse') bridge.tone(62, .75, .06, 35);
  }
  function advance() { if (!loadingArt && cinematic?.advance()) paintLine(); }
  function pause() { if (!cinematic) return; cinematic.paused = !cinematic.paused; bridge.clearInput(); paintLine(); }
  window.StoryUI = {
    store,
    play,
    get active() { return !!cinematic; },
    init(context) {
      bridge = context;
      const pickup = $('touchPickup'); if (pickup) pickup.textContent = 'WEAPON';
      $('cinemaNext').onclick = advance; $('cinemaSkip').onclick = () => cinematic?.end(true); $('cinemaPause').onclick = pause;
      $('cinemaStage').onclick = advance;
      $('cinemaSound').onclick = () => { $('soundButton').click(); paintLine(); };
      home();
    },
    key(event) {
      if (!bridge) return true;
      if (cinematic) {
        if (event.key === 'Enter' && event.target?.tagName === 'BUTTON') return true;
        if (['Enter', ' ', 'Escape'].includes(event.key)) {
          event.preventDefault();
          if (!event.repeat) { if (event.key === ' ') cinematic.end(true); else if (event.key === 'Escape') pause(); else advance(); }
        }
        return true;
      }
      if (bridge.game.mode === 'menu' && event.key === 'Escape') { event.preventDefault(); home(); return true; }
      return false;
    },
    loseFocus() { if (cinematic && !cinematic.paused) { cinematic.paused = true; paintLine(); } },
    update(dt, motion) {
      $('helpButton').disabled = !!cinematic;
      if (!cinematic) return;
      cinematic.update(dt); const t = cinematic.sceneTime;
      $('cinemaArt').style.transform = motion ? '' : 'scale(' + (1 + Math.min(t, 20) * .0004) + ') translateX(' + Math.sin(t * .12) * 2 + 'px)';
      const effect = cinematic.current.lines[cinematic.line][2];
      $('cinemaVeil').style.opacity = cinematic.paused ? '.4' : effect === 'black' ? Math.min(.6, cinematic.time * .3) : 0;
      if (cinematic.paused) return;
      pulseClock -= dt;
      if (pulseClock <= 0) {
        pulseClock = cinematic.current.id === 'bedroom' ? .9 : 1.4;
        if (cinematic.current.id === 'bedroom') {
          bridge.tone(58, .16, .025, 38); bridge.whisper();
        } else if (['home', 'errand', 'discovery', 'morning'].includes(cinematic.current.id) && effect !== 'pulse') bridge.tone(1400, .08, .007, 1900);
        else if (['four-of-twelve', 'remaining-doors', 'coast-entry', 'last-tide'].includes(cinematic.current.id)) bridge.whisper();
      }
    },
    overlay(game) {
      if (game.mode === 'storyBeat') {
        play(StoryDialogue.BEATS[game.pendingBeat], () => { game.pendingBeat = null; game.mode = 'playing'; }); return true;
      }
      if (game.mode === 'storyDoor') { game.startNextTrial(); $('overlay').hidden = true; return true; }
      if (game.mode === 'storyGuardian') {
        const index = Math.floor((game.wave - 1) / 5);
        play(StoryDialogue.AFTER[index], () => {
          if (index < 3) game.openDoor();
          else play(StoryDialogue.ENDING, () => { store.completeChapter(); game.mode = 'chapterComplete'; });
        }); return true;
      }
      if (game.mode === 'gameover') {
        show('<h2 id="overlayTitle">The trial awaits.</h2><p>Joe reached wave ' + game.wave + ' / 20.<br>Return with the build saved at the start of this wave.</p>' + button('retryStory', 'Retry checkpoint', true) + button('backMenu', 'Story menu'));
        $('retryStory').onclick = () => bridge.startStory(store, true); $('backMenu').onclick = storyMenu; return true;
      }
      if (game.mode !== 'chapterComplete') return false;
      view = 'complete';
      show('<h2 id="overlayTitle">CHAPTER I COMPLETE</h2><p>FOUR OF TWELVE DOORS RESTORED</p><p>The Arena still remembers you.</p>' +
        button('playSurvival', 'SURVIVAL MODE UNLOCKED', true) + button('backMenu', 'Story menu') + '<span class="small-note">The Duende Staff, Obsidian Spirit Shard and Jaguar Spirit Claw are permanently unlocked on this device.</span>' +
        (store.warning ? '<p class="save-warning">' + esc(store.warning) + '</p>' : ''));
      $('playSurvival').onclick = () => { location.href = 'survival.html'; }; $('backMenu').onclick = storyMenu; return true;
    },
    menu: home,
    restart() { begin(false); },
    hud(game) {
      const trial = StoryCore.TRIALS[Math.floor((Math.max(1, game.wave) - 1) / 5)];
      $('storyArena').textContent = trial.name;
      $('weaponLabel').textContent = SurvivalCore.weapon(game.player.weapon).name;
      const boss = game.enemies.find(e => e.boss && !e.dead), crystals = game.enemies.filter(e => e.objective && !e.dead);
      $('storyObjective').textContent = game.portal ? 'Guardian restored. Walk into the purple doorway.' : boss?.type === 'hollowKeeper' ?
        (crystals.length ? 'Destroy ' + crystals.length + ' protective crystals · the Keeper’s core is sealed' : 'The core is exposed · release the Keeper') :
        boss?.type === 'tideWarden' && boss.phase === 3 ? 'Barrier · ' + game.drums.filter(d => d.active).length + '/3 drums · stand inside each circle between attacks' :
        game.arenaId === 'underworld' ? 'Shoot violet crystals · nearby foes lose their protection' : game.arenaId === 'pine-ridge' ? 'Dodge marked rockfalls · watch the cave mouths' :
        game.arenaId === 'coast' ? 'Keep clear of the rising tide · drum circles protect and heal' : 'Survive the trial · restore its Guardian';
      $('storyWeapons').textContent = 'E / touch Weapon · cycle your unlocked spirit weapons';
      $('storySave').textContent = store.warning || 'Wave-start checkpoints save your build on this device.';
    },
    drawCrystal(e, ctx, images) {
      ctx.save(); ctx.globalAlpha = e.warmup > 0 ? .4 : 1;
      ctx.strokeStyle = '#ac7fde44'; ctx.lineWidth = 2; ctx.setLineDash([6, 8]); ctx.beginPath(); ctx.arc(e.x, e.y, 210, 0, Math.PI * 2); ctx.stroke(); ctx.setLineDash([]);
      ctx.drawImage(images[ARENA_READY.weapons.obsidian.pickup], e.x - 33, e.y - 54, 66, 66);
      ctx.fillStyle = '#1c102b'; ctx.fillRect(e.x - 25, e.y - 61, 50, 5); ctx.fillStyle = '#d8afff'; ctx.fillRect(e.x - 25, e.y - 61, 50 * Math.max(0, e.hp / e.maxHp), 5); ctx.restore();
    },
    draw(game, ctx) {
      ctx.save();
      for (const g of game.restoredGround || []) { ctx.fillStyle = '#82ffbc22'; ctx.beginPath(); ctx.arc(g.x, g.y, 95, 0, Math.PI * 2); ctx.fill(); }
      if (game.arenaId === 'coast') {
        const b = game.arena.bounds, t = game.tide || 0; ctx.fillStyle = '#277ea15c'; ctx.strokeStyle = '#c0f1f9aa'; ctx.lineWidth = 2;
        ctx.fillRect(b.x, b.y, t, b.h); ctx.fillRect(b.x + b.w - t, b.y, t, b.h); ctx.fillRect(b.x, b.y + b.h - t, b.w, t);
        for (const d of game.drums || []) {
          ctx.fillStyle = d.active ? '#91e9bc55' : '#e7c56b22'; ctx.strokeStyle = d.active ? '#b1ffce' : '#f1d185';
          ctx.beginPath(); ctx.arc(d.x, d.y, 38, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
          ctx.fillStyle = '#142a22'; ctx.fillRect(d.x - 13, d.y - 15, 26, 25); ctx.fillStyle = '#d8be88'; ctx.beginPath(); ctx.ellipse(d.x, d.y - 15, 15, 7, 0, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = '#fff1c8'; ctx.font = '12px Arial'; ctx.textAlign = 'center'; ctx.fillText(d.active ? 'RESTORED' : d.charge ? Math.min(100, Math.floor(d.charge / 1.2 * 100)) + '%' : 'DRUM', d.x, d.y + 56);
        }
      }
      const boss = game.enemies.find(e => e.boss && !e.dead);
      if (boss?.remembering) { ctx.fillStyle = '#b1ffd933'; ctx.beginPath(); ctx.ellipse(boss.x, boss.y - 35, 45, 60, 0, 0, Math.PI * 2); ctx.fill(); }
      if (boss && (boss.type === 'hollowKeeper' && game.enemies.some(e => e.objective && !e.dead && e.owner === boss.id) || boss.type === 'tideWarden' && boss.phase === 3 && game.drums.some(d => !d.active))) {
        ctx.strokeStyle = '#bbadf0'; ctx.fillStyle = '#7a69d522'; ctx.lineWidth = 4; ctx.beginPath(); ctx.ellipse(boss.x, boss.y - 45, 70, 100, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      }
      if (game.portal) {
        const p = game.portal; ctx.fillStyle = '#b772ff55'; ctx.strokeStyle = '#d4b2ff'; ctx.lineWidth = 7; ctx.beginPath(); ctx.ellipse(p.x, p.y - 55, 40, 70, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
        ctx.font = 'bold 15px Arial'; ctx.textAlign = 'center'; ctx.fillStyle = '#f5e4ff'; ctx.fillText('ENTER THE DOOR', p.x, p.y + 38);
      }
      ctx.restore();
    },
    waveCount: 20
  };
})();

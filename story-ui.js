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
      button('storyMenu', 'STORY MODE', true) + button('survivalMenu', 'SURVIVAL MODE', false, !store.data.survivalUnlocked) +
      button('leaderboardMenu', 'LEADERBOARD') + button('howMenu', 'HOW TO PLAY') + button('optionsMenu', 'OPTIONS') +
      '</div><p class="menu-footnote">' + (store.data.survivalUnlocked ? 'Survival unlocked.' : 'Survival unlocks after all four Story trials.') +
      '</p><a href="survival.html" class="test-link">Open Survival test · open field + four arenas</a><br><a href="index.html" class="test-link">Original ten-wave prototype</a>' +
      (store.warning ? '<p class="save-warning" role="status">' + esc(store.warning) + '</p>' : ''));
    $('storyMenu').onclick = storyMenu;
    $('survivalMenu').onclick = () => { if (store.data.survivalUnlocked) location.href = 'survival.html'; };
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
    view = 'story'; const checkpoint = store.data.checkpoint;
    show('<h2 id="overlayTitle">The Jungle Remembers</h2><p>Joe Grind, age 16.<br>Begin with his Sling. Face the first guardian.</p>' +
      button('newStory', 'New Story game', true) +
      (checkpoint ? button('continueStory', 'Continue · wave ' + checkpoint.wave) : '') +
      button('replayPrologue', 'Replay prologue') + button('backMenu', 'Back') +
      '<span class="small-note">Arena 1 is playable. Arenas 2–4 await their Story encounters.<br>Continue restarts the saved wave with its starting build.</span>');
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
    $('cinematic').dataset.effect = effect || '';
    $('cinemaNext').textContent = cinematic.scene === cinematic.scenes.length - 1 && cinematic.line === scene.lines.length - 1 ? 'Enter the jungle' : 'Continue';
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
        } else if (['home', 'errand', 'discovery'].includes(cinematic.current.id) && effect !== 'pulse') bridge.tone(1400, .08, .007, 1900);
      }
    },
    overlay(game) {
      if (game.mode !== 'storyComplete') return false;
      view = 'complete';
      show('<h2 id="overlayTitle">The first door opens.</h2><p>Tata Duende is purified. His staff is yours.<br>The Jungle Remembers trial is complete.</p><p>The Corrupted Underworld Story encounter is still in development. Chapter I remains unfinished.</p>' +
        button('backMenu', 'Story menu', true) + '<span class="small-note">' + (store.data.survivalUnlocked ? 'Your existing Survival unlock is preserved.' : 'One of four trials restored. Production Survival remains locked.') + '</span>');
      $('backMenu').onclick = () => { bridge.game.mode = 'menu'; storyMenu(); }; return true;
    },
    menu: home,
    restart() { begin(false); },
    waveCount: 5
  };
})();

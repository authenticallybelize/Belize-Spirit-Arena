/* Copyright (c) 2026 Authentically Belize Movement. See LICENSE. */
(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  let storage;
  try { storage = window.localStorage; } catch { storage = { getItem() { throw Error('Unavailable'); } }; }
  const store = new StoryCore.Store(storage);
  let bridge, cinematic = null, view = 'main', pulseClock = 0;
  const esc = text => String(text).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  function button(id, text, primary = false, disabled = false) {
    return '<button id="' + id + '" class="' + (primary ? 'primary' : 'secondary') + '"' + (disabled ? ' disabled' : '') + '>' + text + '</button>';
  }
  function show(html) {
    bridge.clearInput(); $('overlay').hidden = false; $('dialogContent').innerHTML = html;
    $('dialogContent').querySelector('button:not(:disabled)')?.focus();
  }
  function home() {
    cinematic = null; $('cinematic').hidden = true; document.body.classList.remove('cinematic-open');
    bridge.game.mode = 'menu'; view = 'main';
    show('<h2 id="overlayTitle">Belize: Spirit Arena</h2><p>Chapter I · Seven years later.<br>A stone. A doorway. A jungle that remembers.</p><div class="story-menu">' +
      button('storyMenu', 'STORY MODE', true) + button('survivalMenu', 'SURVIVAL MODE', false, !store.data.survivalUnlocked) +
      button('leaderboardMenu', 'LEADERBOARD') + button('howMenu', 'HOW TO PLAY') + button('optionsMenu', 'OPTIONS') +
      '</div><p class="menu-footnote">' + (store.data.survivalUnlocked ? 'Survival unlocked.' : 'Survival unlocks after all four Story trials.') +
      '</p><a href="survival.html" class="test-link">Open Survival test · four arenas</a><br><a href="index.html" class="test-link">Original ten-wave prototype</a>' +
      (store.warning ? '<p class="save-warning" role="status">' + esc(store.warning) + '</p>' : ''));
    $('storyMenu').onclick = storyMenu;
    $('survivalMenu').onclick = () => { if (store.data.survivalUnlocked) location.href = 'survival.html'; };
    $('leaderboardMenu').onclick = () => { view = 'info'; show('<h2 id="overlayTitle">Leaderboard</h2><p>Online rankings are not connected in this local prototype.<br>Story progress is saved on this device.</p>' + button('backMenu', 'Back')); $('backMenu').onclick = home; };
    $('howMenu').onclick = () => $('helpButton').click();
    $('optionsMenu').onclick = () => {
      view = 'info';
      show('<h2 id="overlayTitle">Options</h2><p>Sound is optional and starts muted.<br>Reduced motion follows your device preference.<br>Touch controls appear automatically on phones and tablets.</p>' +
        button('optionSound', 'Toggle sound') + button('backMenu', 'Back'));
      $('optionSound').onclick = () => $('soundButton').click(); $('backMenu').onclick = home;
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
      cinematic = null; bridge.clearInput();
      finish(skipped);
    });
    paintLine(); $('cinemaNext').focus();
  }
  function paintLine() {
    if (!cinematic) return;
    const scene = cinematic.current, [speaker, text, effect] = scene.lines[cinematic.line];
    const image = $('cinemaArt');
    image.style.objectPosition = ['discovery', 'bedroom'].includes(scene.id) ? '65% 42%' : '50% 42%';
    if (image.dataset.scene !== scene.id) { image.src = 'assets/' + scene.art; image.dataset.scene = scene.id; }
    $('cinemaTitle').textContent = scene.id === 'arena' ? 'THE JUNGLE REMEMBERS' : scene.title;
    $('cinemaActor').hidden = scene.id !== 'arena';
    $('cinemaSpeaker').textContent = speaker; $('cinemaText').textContent = text;
    $('cinemaCount').textContent = 'SCENE ' + (cinematic.scene + 1) + ' / ' + cinematic.scenes.length;
    $('cinematic').dataset.effect = effect || '';
    $('cinemaNext').textContent = scene.id === 'arena' && cinematic.line === scene.lines.length - 1 ? 'Enter the jungle' : 'Continue';
    $('cinemaPause').textContent = cinematic.paused ? 'Resume' : 'Pause';
    $('cinemaPaused').hidden = !cinematic.paused; pulseClock = 0;
    if (effect === 'pulse') bridge.tone(62, .75, .06, 35);
  }
  function advance() { if (cinematic?.advance()) paintLine(); }
  function pause() { if (!cinematic) return; cinematic.paused = !cinematic.paused; bridge.clearInput(); paintLine(); }
  window.StoryUI = {
    store,
    play,
    get active() { return !!cinematic; },
    init(context) {
      bridge = context;
      $('cinemaNext').onclick = advance; $('cinemaSkip').onclick = () => cinematic?.end(true); $('cinemaPause').onclick = pause;
      $('cinemaStage').onclick = advance;
      $('cinemaArt').onerror = () => {
        $('cinemaArt').hidden = true; $('cinemaPlaceholder').hidden = false;
        $('cinemaPlaceholder').textContent = 'Illustration unavailable · ' + cinematic?.current.title;
      };
      $('cinemaArt').onload = () => { $('cinemaArt').hidden = false; $('cinemaPlaceholder').hidden = true; };
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
      cinematic.update(dt); const t = cinematic.time;
      if (cinematic.current.id === 'arena') {
        const art = ARENA_SPRITES.joe, actor = $('cinemaActor'), ctx = actor.getContext('2d');
        const frame = art.frames[(motion ? 0 : Math.floor(t / 2) % 4) * 5];
        ctx.clearRect(0, 0, actor.width, actor.height); ctx.imageSmoothingEnabled = false;
        ctx.drawImage(bridge.images[art.file], ...frame, (actor.width - frame[2]) / 2, actor.height - frame[3], frame[2], frame[3]);
      }
      $('cinemaArt').style.transform = motion ? '' : 'scale(' + (1.025 + Math.min(t, 12) * .0015) + ') translateX(' + Math.sin(t * .15) * 5 + 'px)';
      $('cinemaVeil').style.opacity = cinematic.paused ? '.4' : Math.max(0, 1 - t * 3);
      if (cinematic.paused) return;
      pulseClock -= dt;
      if (pulseClock <= 0) {
        pulseClock = cinematic.current.id === 'bedroom' ? .9 : 1.4;
        const effect = cinematic.current.lines[cinematic.line][2];
        if (cinematic.current.id === 'bedroom') {
          bridge.tone(58, .16, .025, 38); bridge.whisper();
        } else if (['home', 'discovery'].includes(cinematic.current.id) && effect !== 'pulse') bridge.tone(1400, .08, .007, 1900);
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

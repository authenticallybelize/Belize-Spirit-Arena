/* Copyright (c) 2026 Authentically Belize Movement. See LICENSE. */
(function (root) {
  'use strict';
  const KEY = 'bsa-touch-v1';
  const DEFAULTS = { size: 112, opacity: .7, deadZone: .16, dashPosition: 'near', leftHanded: false };
  function settings(value = {}) {
    const clamp = (key, min, max) => Number.isFinite(value[key]) ? Math.max(min, Math.min(max, value[key])) : DEFAULTS[key];
    return { size: clamp('size', 90, 160), opacity: clamp('opacity', .25, 1), deadZone: clamp('deadZone', .05, .35),
      dashPosition: ['near', 'center'].includes(value.dashPosition) ? value.dashPosition : 'near', leftHanded: value.leftHanded === true };
  }
  function load(storage) { try { const v = JSON.parse(storage.getItem(KEY)); return settings(v && typeof v === 'object' ? v : {}); } catch { return settings(); } }
  function vector(x, y, radius, deadZone = DEFAULTS.deadZone) {
    const length = Math.hypot(x, y), scale = Math.max(radius, length);
    return length <= radius * deadZone ? { x: 0, y: 0 } : { x: x / scale, y: y / scale };
  }
  function attach({ game, input, canvas, togglePause }) {
    let prefs; try { prefs = load(localStorage); } catch { prefs = settings(); }
    const frame = canvas.closest('.game-frame');
    const panel = document.createElement('div'); panel.className = 'touch-controls'; panel.setAttribute('aria-label', 'Touch controls');
    panel.innerHTML = '<div class="stick" id="moveStick" role="group" aria-label="Move joystick"><i></i><span>MOVE</span></div><div class="touch-actions"><button id="touchDash">DASH</button><button id="touchPickup">PICK UP</button><button id="touchPause">PAUSE</button></div><div class="stick" id="aimStick" role="group" aria-label="Aim and shoot joystick"><i></i><span>AIM / FIRE</span></div>';
    frame.append(panel);
    const rotate = document.createElement('div'); rotate.className = 'rotate-prompt'; rotate.setAttribute('role', 'status');
    rotate.innerHTML = '<strong>Turn your phone sideways</strong><p>Your run is paused and stays right here.<br>Landscape gives both thumbs room to play.</p>';
    frame.append(rotate);
    const weapon = document.createElement('img'); weapon.id = 'touchWeapon'; weapon.alt = 'Equipped weapon'; frame.append(weapon);
    const gear = document.createElement('button'); gear.id = 'touchSettings'; gear.className = 'icon-button'; gear.textContent = '⚙'; gear.setAttribute('aria-label', 'Touch settings');
    document.querySelector('.masthead nav').prepend(gear);
    const dialog = document.createElement('div'); dialog.className = 'touch-settings'; dialog.hidden = true; dialog.setAttribute('role', 'dialog'); dialog.setAttribute('aria-modal', 'true'); dialog.setAttribute('aria-labelledby', 'touchSettingsTitle');
    dialog.innerHTML = '<form class="dialog"><h2 id="touchSettingsTitle">Touch controls</h2><label>Joystick size <output id="sizeValue"></output><input id="touchSize" type="range" min="90" max="160" step="2"></label><label>Joystick opacity <output id="opacityValue"></output><input id="touchOpacity" type="range" min="0.25" max="1" step="0.05"></label><label>Dead zone <output id="deadZoneValue"></output><input id="touchDeadZone" type="range" min="0.05" max="0.35" step="0.01"></label><label>Dash position<select id="dashPosition"><option value="near">Above aiming stick</option><option value="center">Center buttons</option></select></label><label class="handed-option"><input id="leftHanded" type="checkbox"> Left-handed: aim on the left</label><button id="touchFullscreen" type="button" class="secondary">Enter fullscreen</button><button id="touchDefaults" type="button" class="secondary">Reset controls</button><p id="touchSaveStatus" role="status"></p><button id="closeTouchSettings" type="submit" class="primary">Done</button></form>';
    document.body.append(dialog);
    const $ = id => dialog.querySelector('#' + id), sticks = [{ element: panel.querySelector('#moveStick'), pointer: null, x: 0, y: 0 }, { element: panel.querySelector('#aimStick'), pointer: null, x: 0, y: 0 }];
    let wasMoving = false, wasAiming = false, resumeSettings = false, oldFocus = null;
    const mobile = matchMedia('(pointer:coarse)').matches || navigator.maxTouchPoints > 0;
    if (mobile) document.body.classList.add('touch-enabled');
    let portrait = innerHeight > innerWidth;
    function resetStick(stick) {
      const pointer = stick.pointer; stick.pointer = null; stick.x = stick.y = 0; stick.element.querySelector('i').style.transform = '';
      if (pointer !== null && stick.element.hasPointerCapture(pointer)) stick.element.releasePointerCapture(pointer);
    }
    function reset() { sticks.forEach(resetStick); wasMoving = wasAiming = false; input.dx = input.dy = 0; input.shooting = false; input.relativeAim = false; input.aiming = false; }
    function apply() {
      document.body.style.setProperty('--stick-size', prefs.size + 'px'); document.body.style.setProperty('--stick-opacity', prefs.opacity);
      panel.classList.toggle('left-handed', prefs.leftHanded); panel.classList.toggle('dash-near', prefs.dashPosition === 'near');
      $('touchSize').value = prefs.size; $('sizeValue').textContent = prefs.size + 'px'; $('touchOpacity').value = prefs.opacity; $('opacityValue').textContent = Math.round(prefs.opacity * 100) + '%';
      $('touchDeadZone').value = prefs.deadZone; $('deadZoneValue').textContent = Math.round(prefs.deadZone * 100) + '%'; $('dashPosition').value = prefs.dashPosition; $('leftHanded').checked = prefs.leftHanded;
    }
    function save() {
      reset(); apply();
      try { localStorage.setItem(KEY, JSON.stringify(prefs)); $('touchSaveStatus').textContent = 'Saved on this device.'; }
      catch { $('touchSaveStatus').textContent = 'Storage unavailable. These settings last until you close this page.'; }
    }
    dialog.addEventListener('input', () => { prefs = settings({ size: Number($('touchSize').value), opacity: Number($('touchOpacity').value), deadZone: Number($('touchDeadZone').value), dashPosition: $('dashPosition').value, leftHanded: $('leftHanded').checked }); save(); });
    $('touchDefaults').onclick = () => { prefs = settings(); save(); };
    async function enterGameplay() {
      try {
        if (!document.fullscreenElement) {
          if (!document.documentElement.requestFullscreen) { $('touchSaveStatus').textContent = 'Browser fullscreen is unavailable; gameplay still fills the viewport.'; return; }
          await document.documentElement.requestFullscreen();
        }
        try { if (mobile) await screen.orientation?.lock?.('landscape'); } catch { /* The rotate prompt covers browsers that do not allow orientation locks. */ }
      } catch { $('touchSaveStatus').textContent = 'Fullscreen was unavailable. Gameplay still fills the viewport.'; }
    }
    $('touchFullscreen').onclick = enterGameplay;
    function openSettings() { oldFocus = document.activeElement; resumeSettings = game.mode === 'playing'; if (resumeSettings) togglePause(); reset(); dialog.hidden = false; apply(); $('touchSize').focus(); }
    function closeSettings() { dialog.hidden = true; reset(); if (resumeSettings && game.mode === 'paused' && (!mobile || innerWidth >= innerHeight)) togglePause(); resumeSettings = false; oldFocus?.focus(); }
    gear.onclick = openSettings;
    dialog.querySelector('form').onsubmit = event => { event.preventDefault(); closeSettings(); };
    dialog.addEventListener('keydown', event => {
      if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); closeSettings(); }
      if (event.key === 'Tab') {
        const controls = [...dialog.querySelectorAll('input,select,button')], index = controls.indexOf(document.activeElement);
        controls[(index + (event.shiftKey ? -1 : 1) + controls.length) % controls.length].focus(); event.preventDefault(); event.stopPropagation();
      }
    });
    function orientation() {
      const next = innerHeight > innerWidth;
      if (next !== portrait) { reset(); if (game.mode === 'playing') togglePause(); }
      portrait = next;
    }
    window.addEventListener('resize', orientation); window.addEventListener('orientationchange', () => { reset(); if (game.mode === 'playing') togglePause(); });
    window.addEventListener('blur', () => { reset(); resumeSettings = false; });
    document.addEventListener('visibilitychange', () => { if (document.hidden) { reset(); resumeSettings = false; } });
    function position(stick, event) {
      const rect = stick.element.getBoundingClientRect(), radius = rect.width * .34;
      const v = vector(event.clientX - rect.left - rect.width / 2, event.clientY - rect.top - rect.height / 2, radius, prefs.deadZone);
      stick.x = v.x; stick.y = v.y; stick.element.querySelector('i').style.transform = 'translate(' + v.x * radius + 'px,' + v.y * radius + 'px)';
    }
    for (const stick of sticks) {
      stick.element.addEventListener('pointerdown', event => {
        event.preventDefault(); if (game.mode !== 'playing' || stick.pointer !== null || !dialog.hidden || mobile && portrait) return;
        stick.pointer = event.pointerId; stick.element.setPointerCapture(event.pointerId); position(stick, event);
      });
      stick.element.addEventListener('pointermove', event => { if (event.pointerId === stick.pointer) { event.preventDefault(); position(stick, event); } });
      for (const type of ['pointerup', 'pointercancel', 'lostpointercapture']) stick.element.addEventListener(type, event => { if (event.pointerId === stick.pointer) { resetStick(stick); update(); } });
    }
    let shownWeapon = '';
    function update() {
      panel.hidden = !['playing', 'paused'].includes(game.mode);
      if (shownWeapon !== game.player.weapon) { shownWeapon = game.player.weapon; weapon.src = 'assets/' + ARENA_READY.weapons[shownWeapon].pickup; weapon.alt = 'Equipped: ' + (root.SurvivalCore ? SurvivalCore.weapon(shownWeapon).name : shownWeapon === 'staff' ? 'Duende Staff' : 'Joe’s Sling'); }
      const dash = panel.querySelector('#touchDash'), cooldown = game.player.dashCooldown;
      dash.textContent = cooldown > 0 ? 'DASH ' + cooldown.toFixed(1) + 's' : 'DASH'; dash.disabled = cooldown > 0 || game.mode !== 'playing'; dash.style.setProperty('--dash-ready', (1 - Math.min(1, cooldown / 1.65)) * 100 + '%');
      if (game.mode !== 'playing') { if (wasMoving || wasAiming) reset(); return; }
      if (mobile && portrait) { reset(); togglePause(); return; }
      const [move, aim] = sticks;
      if (move.pointer !== null) { input.dx = move.x; input.dy = move.y; }
      else if (wasMoving) input.dx = input.dy = 0;
      wasMoving = move.pointer !== null;
      const active = aim.pointer !== null && Math.hypot(aim.x, aim.y) > 0;
      if (active || move.pointer !== null && Math.hypot(move.x, move.y) > 0) {
        const v = active ? aim : move;
        input.relativeAim = true; input.aimDX = v.x; input.aimDY = v.y; input.aiming = true;
        input.aimX = game.player.x + v.x * 600; input.aimY = game.player.y - ArenaCore.AIM_HEIGHT + v.y * 600;
      } else if (wasAiming && aim.pointer === null && move.pointer === null) input.aiming = false;
      if (aim.pointer !== null || wasAiming) input.shooting = active;
      wasAiming = aim.pointer !== null;
    }
    panel.querySelector('#touchDash').addEventListener('pointerdown', event => { event.preventDefault(); if (!dialog.hidden) return; update(); game.dash(input); });
    panel.querySelector('#touchPickup').addEventListener('pointerdown', event => { event.preventDefault(); if (game.mode === 'playing' && game.pickup) game.pickup(); });
    panel.querySelector('#touchPickup').hidden = typeof game.pickup !== 'function';
    panel.querySelector('#touchPause').onclick = () => { if (['playing', 'paused'].includes(game.mode)) togglePause(); };
    apply();
    return { update, reset, openSettings, enterGameplay };
  }
  const api = { attach, vector, settings, load, KEY };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.TouchControls = api;
})(typeof window !== 'undefined' ? window : globalThis);

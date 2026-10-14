/* Copyright (c) 2026 Authentically Belize Movement. See LICENSE. */
(function (root) {
  'use strict';
  function vector(x, y, radius) {
    const length = Math.hypot(x, y), scale = Math.max(radius, length);
    return length < radius * .16 ? { x: 0, y: 0 } : { x: x / scale, y: y / scale };
  }
  function attach({ game, input, canvas, togglePause }) {
    const panel = document.createElement('div'); panel.className = 'touch-controls'; panel.setAttribute('aria-label', 'Touch controls');
    panel.innerHTML = '<div class="stick" id="moveStick" role="group" aria-label="Move joystick"><i></i><span>MOVE</span></div><div class="touch-actions"><button id="touchDash">DASH</button><button id="touchPickup">PICK UP</button><button id="touchPause">PAUSE</button></div><div class="stick" id="aimStick" role="group" aria-label="Aim and shoot joystick"><i></i><span>AIM / FIRE</span></div>';
    canvas.closest('.game-frame').append(panel);
    const sticks = [{ element: panel.querySelector('#moveStick'), pointer: null, x: 0, y: 0 }, { element: panel.querySelector('#aimStick'), pointer: null, x: 0, y: 0 }];
    function resetStick(stick) { stick.pointer = null; stick.x = stick.y = 0; stick.element.querySelector('i').style.transform = ''; }
    function position(stick, event) {
      const rect = stick.element.getBoundingClientRect(), radius = rect.width * .34;
      const v = vector(event.clientX - rect.left - rect.width / 2, event.clientY - rect.top - rect.height / 2, radius);
      stick.x = v.x; stick.y = v.y; stick.element.querySelector('i').style.transform = 'translate(' + v.x * radius + 'px,' + v.y * radius + 'px)';
    }
    for (const stick of sticks) {
      stick.element.addEventListener('pointerdown', event => {
        event.preventDefault(); if (game.mode !== 'playing' || stick.pointer !== null) return;
        stick.pointer = event.pointerId; stick.element.setPointerCapture(event.pointerId); position(stick, event);
      });
      stick.element.addEventListener('pointermove', event => { if (event.pointerId === stick.pointer) { event.preventDefault(); position(stick, event); } });
      for (const type of ['pointerup', 'pointercancel', 'lostpointercapture']) stick.element.addEventListener(type, event => { if (event.pointerId === stick.pointer) { resetStick(stick); update(); } });
    }
    function update() {
      panel.hidden = !['playing', 'paused'].includes(game.mode);
      if (game.mode !== 'playing') return;
      const [move, aim] = sticks;
      if (move.pointer !== null) { input.dx = move.x; input.dy = move.y; }
      else if (wasMoving) input.dx = input.dy = 0;
      wasMoving = move.pointer !== null;
      const a = aim.pointer !== null && Math.hypot(aim.x, aim.y) > 0;
      if (a || move.pointer !== null && Math.hypot(move.x, move.y) > 0) {
        const v = a ? aim : move;
        input.relativeAim = true; input.aimDX = v.x; input.aimDY = v.y; input.aiming = true;
        input.aimX = game.player.x + v.x * 600; input.aimY = game.player.y - ArenaCore.AIM_HEIGHT + v.y * 600;
      }
      if (aim.pointer !== null || wasAiming) input.shooting = !!a;
      wasAiming = aim.pointer !== null;
    }
    let wasMoving = false, wasAiming = false;
    panel.querySelector('#touchDash').addEventListener('pointerdown', e => { e.preventDefault(); update(); game.dash(input); });
    panel.querySelector('#touchPickup').addEventListener('pointerdown', e => { e.preventDefault(); if (game.mode === 'playing' && game.pickup) game.pickup(); });
    panel.querySelector('#touchPickup').hidden = typeof game.pickup !== 'function';
    panel.querySelector('#touchPause').onclick = () => { if (['playing', 'paused'].includes(game.mode)) togglePause(); };
    if (matchMedia('(pointer:coarse)').matches || navigator.maxTouchPoints > 0) document.body.classList.add('touch-enabled');
    return { update, reset() { sticks.forEach(resetStick); wasMoving = wasAiming = false; input.dx = input.dy = 0; input.shooting = false; input.relativeAim = false; input.aiming = false; } };
  }
  if (typeof module !== 'undefined' && module.exports) module.exports = { vector }; else root.TouchControls = { attach, vector };
})(typeof window !== 'undefined' ? window : globalThis);

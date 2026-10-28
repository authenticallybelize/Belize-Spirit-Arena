/* Copyright (c) 2026 Authentically Belize Movement. See LICENSE. */
(function (root) {
  'use strict';
  function draw(ctx, view, time, strength, reducedMotion = false) {
    if (!(strength > 0)) return;
    const t = reducedMotion ? 0 : time, { x, y, w, h } = view;
    ctx.save(); ctx.globalAlpha = strength;
    const clouds = ctx.createLinearGradient(x, y, x + w, y + h);
    clouds.addColorStop(0, '#091b3c55'); clouds.addColorStop(.5, '#1c345b38'); clouds.addColorStop(1, '#081b344d');
    ctx.fillStyle = clouds; ctx.fillRect(x, y, w, h);
    if (!reducedMotion) {
      const count = Math.min(96, Math.round(w * h / 12000));
      ctx.globalAlpha = strength * .4; ctx.strokeStyle = '#c4d9e5'; ctx.lineWidth = 1.3;
      ctx.beginPath();
      for (let i = 0; i < count; i++) {
        const rx = x + (i * 137.51 + t * 135) % w, ry = y + (i * 199.93 + t * 610) % h;
        ctx.moveTo(rx, ry); ctx.lineTo(rx - 11, ry - 25);
      }
      ctx.stroke();
      if (time >= 9 && time % 9 < .18) {
        const bx = x + w * (.25 + Math.floor(time / 9) % 3 * .22);
        ctx.globalAlpha = strength * (1 - time % 9 / .18) * .65;
        ctx.strokeStyle = '#d4e8ff'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(bx, y); ctx.lineTo(bx - w * .02, y + h * .12);
        ctx.lineTo(bx + w * .01, y + h * .11); ctx.lineTo(bx - w * .03, y + h * .27); ctx.stroke();
      }
    }
    ctx.restore();
  }
  const api = { draw };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.ArenaWeather = api;
})(typeof window !== 'undefined' ? window : globalThis);

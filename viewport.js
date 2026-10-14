/* Copyright (c) 2026 Authentically Belize Movement. See LICENSE. */
(function (root) {
  'use strict';
  function follow(player, world, aspect, entire, previous, dt) {
    const ratio = world.w / world.h;
    const w = entire ? aspect > ratio ? world.h * aspect : world.w : aspect > ratio ? world.w : world.h * aspect;
    const h = w / aspect;
    if (entire) return { x: (world.w - w) / 2, y: (world.h - h) / 2, w, h };
    const clamp = (n, max) => Math.max(0, Math.min(max, n));
    if (!previous || Math.abs(previous.w - w) > .1 || Math.abs(previous.h - h) > .1) return { x: clamp(player.x - w / 2, world.w - w), y: clamp(player.y - h / 2, world.h - h), w, h };
    let x = previous.x, y = previous.y;
    if (player.x < x + w * .42) x = player.x - w * .42;
    else if (player.x > x + w * .58) x = player.x - w * .58;
    if (player.y < y + h * .42) y = player.y - h * .42;
    else if (player.y > y + h * .58) y = player.y - h * .58;
    const blend = 1 - Math.exp(-12 * Math.max(0, dt));
    return { x: previous.x + (clamp(x, world.w - w) - previous.x) * blend, y: previous.y + (clamp(y, world.h - h) - previous.y) * blend, w, h };
  }
  function point(view, rect, x, y) { return { x: view.x + (x - rect.left) / rect.width * view.w, y: view.y + (y - rect.top) / rect.height * view.h }; }
  const api = { follow, point };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.ArenaViewport = api;
})(typeof window !== 'undefined' ? window : globalThis);

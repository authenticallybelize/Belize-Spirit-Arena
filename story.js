/* Copyright (c) 2026 Authentically Belize Movement. See LICENSE. */
(function (root) {
  'use strict';
  const Base = typeof module !== 'undefined' && module.exports ? require('./core.js') : root.ArenaCore;
  const KEY = 'belize-spirit-arena.story', VERSION = 1;
  const ARENAS = ['jungle', 'underworld', 'pine-ridge', 'coast'];
  const fresh = () => ({ version: VERSION, prologueWatched: false, prologueSkipped: false, storyStarted: false,
    currentArena: 'jungle', currentWave: 1, completedArenas: [], unlockedWeapons: ['slingshot'],
    storyComplete: false, survivalUnlocked: false, checkpoint: null });
  const booleanFields = ['prologueWatched', 'prologueSkipped', 'storyStarted', 'storyComplete', 'survivalUnlocked'];
  function valid(data) {
    return data && data.version === VERSION && booleanFields.every(k => typeof data[k] === 'boolean') &&
      ARENAS.includes(data.currentArena) && Number.isInteger(data.currentWave) && data.currentWave >= 1 && data.currentWave <= 20 &&
      Array.isArray(data.completedArenas) && data.completedArenas.every(a => ARENAS.includes(a)) &&
      Array.isArray(data.unlockedWeapons) && data.unlockedWeapons.every(w => typeof w === 'string' && w.length < 60) &&
      (!data.storyComplete || ARENAS.every(a => data.completedArenas.includes(a))) && validCheckpoint(data.checkpoint);
  }
  function validCheckpoint(c) {
    if (c === null) return true;
    if (!c || !Number.isInteger(c.wave) || c.wave < 1 || c.wave > 5 || !Number.isInteger(c.level) || c.level < 1 ||
        !Number.isFinite(c.xp) || c.xp < 0 || !Array.isArray(c.upgrades) || c.upgrades.some(id => !Base.UPGRADES.some(p => p.id === id))) return false;
    const p = c.player;
    return p && ['slingshot', 'staff'].includes(p.weapon) &&
      ['hp', 'maxHp', 'speed', 'damage', 'interval', 'x', 'y', 'r'].every(k => Number.isFinite(p[k]) && p[k] > 0) &&
      p.hp <= p.maxHp && p.interval >= .065 && p.r === 13 &&
      p.x >= Base.BOUNDS.x + p.r && p.x <= Base.BOUNDS.x + Base.BOUNDS.w - p.r &&
      p.y >= Base.BOUNDS.y + p.r && p.y <= Base.BOUNDS.y + Base.BOUNDS.h - p.r &&
      !Base.OBSTACLES.some(o => Base.circleRect(p.x, p.y, p.r, o));
  }
  class Store {
    constructor(storage) {
      this.storage = storage; this.data = fresh(); this.warning = ''; this.readOnly = false;
      try {
        const raw = storage.getItem(KEY);
        if (!raw) return;
        const parsed = JSON.parse(raw);
        if (!valid(parsed)) { this.readOnly = true; this.warning = 'Saved Story data is unsupported or damaged. It was preserved; this session cannot overwrite it.'; return; }
        this.data = parsed; this.loaded = JSON.parse(raw); this.lastWritten = raw;
      } catch {
        this.readOnly = true; this.warning = 'Story storage is unavailable or unreadable. Play is available, but progress cannot be saved.';
      }
    }
    save() {
      if (this.readOnly) return false;
      try {
        if (!valid(this.data)) return false;
        // Do not overwrite a newer or concurrently updated save from another tab.
        const raw = this.storage.getItem(KEY);
        if (raw && raw !== this.lastWritten && JSON.stringify(JSON.parse(raw)) !== JSON.stringify(this.loaded || this.data)) {
          this.readOnly = true; this.warning = 'Story progress changed in another tab. Reload to continue saving.'; return false;
        }
        const encoded = JSON.stringify(this.data);
        this.storage.setItem(KEY, encoded); this.lastWritten = encoded; this.loaded = JSON.parse(encoded); return true;
      } catch { this.warning = 'Progress could not be saved. Keep this tab open to continue this session.'; return false; }
    }
    recordPrologue(skipped) {
      if (skipped) this.data.prologueSkipped = true; else this.data.prologueWatched = true;
      return this.save();
    }
    checkpoint(game) {
      this.data.storyStarted = true; this.data.currentArena = 'jungle'; this.data.currentWave = game.wave;
      this.data.checkpoint = { wave: game.wave, level: game.level, xp: game.xp, upgrades: [...game.upgrades],
        player: { ...game.player, hp: Math.max(1, game.player.hp), invincible: 0, fireCooldown: 0, dashCooldown: 0, dashTime: 0, walking: false } };
      this.save();
    }
    completeJungle() {
      if (!this.data.completedArenas.includes('jungle')) this.data.completedArenas.push('jungle');
      if (!this.data.unlockedWeapons.includes('staff')) this.data.unlockedWeapons.push('staff');
      this.data.currentWave = 5; this.data.checkpoint = null;
      // Unbuilt guardians cannot complete Chapter I or unlock production Survival.
      this.save();
    }
  }
  class Game extends Base.Game {
    beginWave() {
      super.beginWave();
      this.banner = 'The Jungle Remembers · Wave ' + this.wave + ' / 5';
      if (this.store) this.store.checkpoint(this);
    }
    startStory(store, resume = false) {
      this.store = store;
      const checkpoint = resume && store.data.checkpoint;
      this.reset(); this.mode = 'playing';
      if (checkpoint && validCheckpoint(checkpoint)) {
        this.wave = checkpoint.wave - 1; this.level = checkpoint.level; this.xp = checkpoint.xp;
        this.xpNeeded = 25 + (this.level - 1) * 13; this.upgrades = [...checkpoint.upgrades];
        Object.assign(this.player, checkpoint.player);
      }
      this.beginWave();
    }
    tick(dt, input) {
      super.tick(dt, input);
      if (this.wave === 5 && this.finishedWave && this.player.weapon === 'staff' && this.mode === 'playing') {
        this.mode = 'storyComplete'; this.breakTime = 0; this.store?.completeJungle();
      }
    }
    defeat(enemy) {
      const alreadyDead = enemy.dead;
      super.defeat(enemy);
      if (!alreadyDead && enemy.type === 'duende' && this.store && !this.store.data.unlockedWeapons.includes('staff')) {
        this.store.data.unlockedWeapons.push('staff'); this.store.save();
      }
    }
  }
  const SCENES = [
    { id: 'home', title: 'Seven years later', art: 'prologue/home.png', lines: [
      ['Narrator', 'Seven years after the events of Legends of Belize…'],
      ['Narrator', 'Joe Grind, age 16.'],
      ['Grandma', 'Joe, go collect some firewood fi me.']] },
    { id: 'discovery', title: 'Something under the roots', art: 'prologue/discovery.png', lines: [
      ['Narrator', 'Among roots and fallen leaves, a faint purple glow catches Joe’s eye.'],
      ['Narrator', 'He touches the black obsidian. The forest falls silent. Something breathes far below.', 'pulse'],
      ['Joe', '…Weird.'],
      ['Narrator', 'The birds return. Joe takes the stone home.']] },
    { id: 'warning', title: 'Grandma’s warning', art: 'prologue/warning.png', lines: [
      ['Grandma', 'Where yu get that, Joe?'],
      ['Joe', 'I just found it in the bush.'],
      ['Grandma', 'Noh carry strange thing outta bush.'],
      ['Narrator', 'She examines the stone longer than expected. Then sets it down.']] },
    { id: 'bedroom', title: 'That night', art: 'prologue/bedroom.png', lines: [
      ['Narrator', 'Joe falls asleep. Beside him, the obsidian begins to glow.'],
      ['Narrator', 'A heartbeat. A whisper without words. Then darkness.', 'black']] },
    { id: 'arena', title: 'The Jungle Remembers', art: 'jungle-arena.png', lines: [
      ['Joe', '…This noh my room.'],
      ['Narrator', 'His sling is still with him.'],
      ['Joe', 'Da just wah dream… right?'],
      ['Narrator', 'Five waves. One jungle. Stand your ground.']] }
  ];
  class Cinematic {
    constructor(scenes, finish) { this.scenes = scenes; this.finish = finish; this.scene = 0; this.line = 0; this.time = 0; this.paused = false; this.done = false; }
    get current() { return this.scenes[this.scene]; }
    advance() {
      if (this.paused || this.done) return false;
      this.time = 0;
      if (++this.line >= this.current.lines.length) { this.line = 0; if (++this.scene >= this.scenes.length) return this.end(false); }
      return true;
    }
    end(skipped) { if (this.done) return false; this.done = true; this.finish(skipped); return true; }
    update(dt) { if (!this.done && !this.paused) this.time += Math.min(.05, Math.max(0, dt)); }
  }
  const api = { Game, Store, Cinematic, SCENES, KEY, VERSION, fresh, valid, validCheckpoint };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.StoryCore = api;
})(typeof window !== 'undefined' ? window : globalThis);

/* Copyright (c) 2026 Authentically Belize Movement. See LICENSE. */
(function (root) {
  'use strict';
  const Campaign = typeof module !== 'undefined' && module.exports ? require('./story-campaign.js') : root.StoryCampaign;
  const SCENES = [
    { id: 'home', title: 'Seven years later', art: 'prologue/frame-01.png', lines: [
      ['Narrator', 'Seven years after the events of Legends of Belize…'],
      ['Narrator', 'Joe Grind, age 16. Another normal day helping Grandma at home.']] },
    { id: 'errand', title: 'Into the bush', art: 'prologue/frame-02.png', lines: [
      ['Grandma', 'Joe, go collect some firewood fi me.']] },
    { id: 'discovery', title: 'Something under the roots', art: 'prologue/frame-03.png', lines: [
      ['Narrator', 'While gathering firewood, Joe finds a black obsidian stone beneath roots and leaves. Its purple fractures glow faintly.']] },
    { id: 'silence', title: 'The forest falls silent', art: 'prologue/frame-04.png', lines: [
      ['Narrator', 'He picks up the stone. No birds. No insects. Just a deep, distant pulse.', 'pulse'],
      ['Narrator', 'Joe looks around. The forest returns to normal. He takes the stone home.']] },
    { id: 'warning', title: 'Grandma’s warning', art: 'prologue/frame-05.png', lines: [
      ['Grandma', 'Where yu get that, Joe?'],
      ['Joe', 'I just found it in the bush.'],
      ['Grandma', 'Noh carry strange thing outta bush.'],
      ['Narrator', 'Grandma looks at the stone longer than she should. She seems concerned, but does not explain why.']] },
    { id: 'bedroom', title: 'That night', art: 'prologue/frame-06.png', lines: [
      ['Narrator', 'Joe falls asleep. Beside him, the obsidian begins to glow.'],
      ['Narrator', 'A heartbeat. A whisper without words. He dreams… or so he thinks.', 'black']] },
    { id: 'awakening', title: 'Somewhere unfamiliar', art: 'prologue/frame-07.png', lines: [
      ['Joe', 'How I reach yah?']] },
    { id: 'arena', title: 'THE JUNGLE REMEMBERS', art: 'prologue/frame-08.png', lines: [
      ['An echo through the ruins', 'The jungle remembers.']] },
    { id: 'sling', title: 'Stand your ground', art: 'prologue/frame-09.png', lines: [
      ['Joe', 'Da just wah dream… right?'],
      ['Joe', 'Then why does it feel so real?']] },
    { id: 'arrivals', title: 'The first shadows', art: 'prologue/frame-10.png', lines: [
      ['Narrator', 'The first creatures emerge from the shadows. Survive the waves, uncover the truth.']] },
    { id: 'journey', title: 'Between dream and reality', art: 'prologue/frame-11.png', lines: [
      ['Narrator', 'Joe begins a journey he cannot yet understand.'],
      ['Narrator', 'This is only the beginning. Four arenas. Four guardians. A deeper mystery.']] },
    { id: 'title', title: 'BELIZE: SPIRIT ARENA', art: 'prologue/frame-12.png', lines: [
      ['Chapter I', 'The Four Spirit Trials. Your first trial begins.']] }
  ];
  class Cinematic {
    constructor(scenes, finish) { this.scenes = scenes; this.finish = finish; this.scene = 0; this.line = 0; this.time = 0; this.sceneTime = 0; this.paused = false; this.done = false; }
    get current() { return this.scenes[this.scene]; }
    advance() {
      if (this.paused || this.done) return false;
      this.time = 0;
      if (++this.line >= this.current.lines.length) { this.line = 0; this.sceneTime = 0; if (++this.scene >= this.scenes.length) return this.end(false); }
      return true;
    }
    end(skipped) { if (this.done) return false; this.done = true; this.finish(skipped); return true; }
    update(dt) { if (!this.done && !this.paused) { const step = Math.min(.05, Math.max(0, dt)); this.time += step; this.sceneTime += step; } }
  }
  const api = { ...Campaign, Cinematic, SCENES };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.StoryCore = api;
})(typeof window !== 'undefined' ? window : globalThis);

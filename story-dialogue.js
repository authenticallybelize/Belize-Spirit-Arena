/* Official Chapter I direction, 18 October 2026. Guardian identities survive purification. */
(function (root) {
  'use strict';
  const scene = (id, title, art, lines, actor, effect) => ({ id, title, art, lines, actor, effect });
  const AFTER = [
    [scene('first-guardian', 'The First Guardian', 'jungle-arena.png', [
      ['Narrator', 'The hostile manifestation dissolves into brilliant green spirit light. Tata Duende remains. Joe lowers his sling.'],
      ['Joe', 'Finally! I thought you wah kill me!'], ['Tata', 'Kill yu? Bwai, if dat was my intention, we wouldn’t be talking.'],
      ['Tata', 'Seven years, and yu still finding trouble.'], ['Joe', 'How you know about me?'],
      ['Narrator', 'Tata looks toward the glowing mark on Joe’s hand.'],
      ['Tata', 'More important… why that stone choose fi wake up now?'], ['Narrator', 'Joe tries to ask another question, but Tata raises his staff.'],
      ['Tata', 'One door open. Three remain.'], ['Reward', 'The Duende Staff materializes. Permanently unlocked. A stone doorway opens, spilling purple light.']
    ], 'ready/sprites/duende/frame-01.png')],
    [scene('broken-fragment', 'The Broken Fragment', 'underworld-arena.png', [
      ['Narrator', 'The Keeper collapses. Darkness drains from its limestone, roots and obsidian. Its original consciousness returns.'],
      ['Hollow Keeper', 'The darkness… it has loosened.'], ['Joe', 'You know me?'], ['Hollow Keeper', 'No, child. I have never seen you.'],
      ['Hollow Keeper', 'But I know what you carry.'], ['Joe', 'The stone?'], ['Hollow Keeper', 'A fragment of the Obsidian Heart.'],
      ['Joe', 'What happen to it?'], ['Hollow Keeper', 'It was broken.'], ['Joe', 'By who?'], ['Hollow Keeper', 'That memory was taken from me.'],
      ['Narrator', 'Someone—or something—has deliberately damaged the Guardians. The Heart’s precise nature remains unknown.'],
      ['Reward', 'Obsidian Spirit Shard permanently unlocked.'], ['Hollow Keeper', 'The next Guardian still remembers what I cannot.'],
      ['Narrator', 'A doorway opens. Beyond it, wind moves through pine trees.']
    ], 'story/hollow-keeper-portrait.png')],
    [scene('recognition', 'Recognition', 'story/pine-ridge.png', [
      ['Narrator', 'The corrupted markings break. Joe approaches carefully, lowering his weapon. The restored Jaguar places its forehead against his palm.'],
      ['Joe', 'I know you…'], ['Narrator', 'A glowing claw-shaped mark appears. The Jaguar shares a memory.']
    ], 'ready/sprites/jaguarBoss/frame-01.png'), scene('heart-vision', 'The Jaguar’s Memory', 'story/pine-ridge.png', [
      ['Narrator', 'The Obsidian Heart. Twelve glowing symbols surround it. A dark fracture spreads across its surface. The vision ends before Joe can see who caused it.'],
      ['Joe', 'Twelve?'], ['Reward', 'A spectral claw becomes the Jaguar Spirit Claw. Permanently unlocked.'],
      ['Narrator', 'The Jaguar gives a final low growl. Joe smiles slightly.'], ['Joe', 'Good fi see you too.'],
      ['Narrator', 'The next doorway opens toward a bright coastal landscape.']
    ], null, 'heart')],
    [scene('four-of-twelve', 'Four of Twelve', 'coast-arena.png', [
      ['Narrator', 'The barrier breaks. Joe releases the corruption. The ocean becomes calm, and the Tide Warden returns to its original form.'],
      ['Tide Warden', 'Four Guardians restored.'], ['Joe', 'So… is that it?'], ['Tide Warden', 'For this night.'],
      ['Joe', 'What is this place?'], ['Tide Warden', 'A boundary. A memory. A place between what lives and what remembers.'],
      ['Joe', 'And the stone?'], ['Tide Warden', 'A broken piece of the Heart that holds these doors apart.'],
      ['Joe', 'Who broke it?'], ['Tide Warden', 'That truth lies beyond the doors you have opened.'],
      ['Joe', 'All this fighting, and nobody can tell me who doing this?'],
      ['Tide Warden', 'You were brought here because the doors were failing. You have restored four.']
    ], 'story/tide-warden-portrait.png'), scene('remaining-doors', 'Not tonight', 'coast-arena.png', [
      ['Narrator', 'Above the water, twelve symbols appear. Four shine brightly. Eight remain dark.'], ['Joe', 'Eight more?'],
      ['Tide Warden', 'Not tonight.'], ['Narrator', 'Blinding light. Joe closes his eyes. The ocean fades into birds singing.']
    ], null, 'doors')]
  ];
  const BEATS = {
    6: [scene('underworld-entry', 'A realm that feels sick', 'underworld-arena.png', [
      ['Narrator', 'Obsidian, ancient limestone and strange roots. Corruption spreads through the walls. Violet crystals strengthen nearby creatures. Shoot them to weaken the creatures and briefly restore the ground.'],
      ['Joe', 'This da the same light from that rock…']])],
    9: [scene('fragment-call', 'Who carries the broken fragment?', 'underworld-arena.png', [
      ['A voice within the cavern', 'Who carries the broken fragment?'], ['Joe', 'Who deh?'],
      ['The voice', 'That stone… where did you find it?'], ['Joe', 'Eena the bush, near my grandma house!'], ['The voice', 'Impossible.'],
      ['Narrator', 'The cavern trembles. A corrupted Guardian is waiting. Destroy its protective crystals to expose its core.']])],
    11: [scene('pine-entry', 'Pine Ridge · The Jaguar’s Memory', 'story/pine-ridge.png', [
      ['Narrator', 'Cold air among pines, waterfalls and limestone caves. The landscape is unstable. Rockfalls are marked before they strike. Creatures emerge through the caves.'],
      ['Joe', 'Who broke the Heart?']])],
    14: [scene('familiar-growl', 'Something remembers', 'story/pine-ridge.png', [
      ['Narrator', 'A growl among the trees. Joe recognizes its sound from his younger adventures. A massive spectral Jaguar waits within a cave, its body covered in corrupted markings.'],
      ['Joe', 'I know that sound…']])],
    16: [scene('coast-entry', 'The Spirit Coast · The Last Tide', 'coast-arena.png', [
      ['Narrator', 'Bright sand. Fishing structures. Turquoise water. The tide moves without wind. Three ancient drum circles glow. Stand inside for brief protection and recovery.'],
      ['A distant memory', 'The doors must remain.']])],
    19: [scene('last-tide', 'The Guardians cannot hold forever', 'coast-arena.png', [
      ['A distant memory', 'The Heart is fractured.'], ['Another memory', 'The Guardians cannot hold forever.'],
      ['Narrator', 'These arenas protect connected sections of the Spirit Layer. Corruption is weakening the barriers to the waking world.'],
      ['Narrator', 'The Tide Warden is being pulled apart. When its barrier rises, stand in all three drum circles between attacks to break the corruption.']])]
  };
  const ENDING = [scene('morning', 'Back at Grandma’s House', 'story/ending.png', [
    ['Narrator', 'Morning sunlight fills Joe’s room. Outside, chickens make noise.'], ['Grandma', 'Joe! You wah sleep all day?'],
    ['Joe', 'Just wah dream…'], ['Narrator', 'The obsidian is still on the bedside table. Four marks glow faintly. He picks it up. For an instant, the Jaguar’s spirit mark appears on his hand. Joe freezes.'],
    ['Grandma', 'Joe! Breakfast!'], ['Joe', '…Coming, Grandma.'], ['Narrator', 'Joe slowly puts down the stone. Four marks pulse. Eight remain dark.']
  ]), scene('chapter-complete', 'CHAPTER I COMPLETE', 'story/ending.png', [
    ['BELIZE: SPIRIT ARENA', 'FOUR OF TWELVE DOORS RESTORED'], ['Survival Mode unlocked', 'The Arena still remembers you.']
  ], null, 'doors')];
  const api = { AFTER, BEATS, ENDING };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.StoryDialogue = api;
})(typeof window !== 'undefined' ? window : globalThis);

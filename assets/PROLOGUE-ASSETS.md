# Prologue and mobile edition assets — 0.3.1

All **twelve** storyboard moments now have distinct included illustrations. The built-in Image Gen tool redrew each panel using the actual supplied comic as its reference, keeping its painterly style and teenage Joe. Generated PNGs are native **1086 × 1448**, portrait 3:4; no comic numbers or small embedded captions. They are not video animation. The game supplies dialogue, subtle camera motion, fades and particles.

| File in assets/prologue | Scene |
|---|---|
| frame-01.png | Joe and Grandma at home |
| frame-02.png | Firewood errand |
| frame-03.png | Obsidian beneath roots |
| frame-04.png | The forest falls silent |
| frame-05.png | Grandma’s warning |
| frame-06.png | Joe sleeps beside the stone |
| frame-07.png | Awakening in the ruins |
| frame-08.png | The Jungle Remembers |
| frame-09.png | Joe draws his Sling |
| frame-10.png | The first creatures |
| frame-11.png | A deeper journey |
| frame-12.png | Belize: Spirit Arena title background |

The illustrations use object-fit: contain in every layout. Portrait phones put captions below the art; landscape/tablet-wide layouts place them beside it. Current/next frames preload, with only those two retained in the image cache, plus the outgoing DOM frame during a fade. Loading failures/timeouts leave readable dialogue and working Continue/Skip controls. The menu no longer waits for twelve large scene downloads. The prior four landscape runtime copies were replaced; their generated originals remain untouched.

See [PROLOGUE-PROMPTS.md](PROLOGUE-PROMPTS.md) for the complete prompt set and generated source paths. Runtime art is copied into this repository; nothing depends on a .codex folder to run.

Joe gameplay still uses the supplied **1402 × 1122** teenage-joe.png sheet and twenty existing measured rectangles. Every rectangle contains visible pixels. The renderer uses smooth high-quality scaling, a subtle outline, a phone-size display minimum and a foreground pass after world pickups/cover. Collision radius, movement, damage and attack intervals are unchanged. The Canvas backing store follows display pixel density up to 2× the logical world size; no CSS enlargement is claimed as new sprite detail.

Audio is existing Web Audio synthesis, not recorded voices: birdlike chirps, a low pulse, heartbeat and filtered wordless noise. Final recordings remain optional future replacements: jungle-ambience.ogg/.mp3, obsidian-pulse.ogg/.mp3, heartbeat.ogg/.mp3, wordless-whisper.ogg/.mp3. No missing audio URLs are requested. Never identify the whisper’s source.

The supplied Underworld and Hopkins concept arenas, intact power-up sheets, Tommy Goff and Llorona sprites retain their 0.3.0 provenance and mechanics. Reflex Boost still lacks dedicated art. See ART-SOURCES.md and LICENSE. Original Legends of Belize assets and saves were not changed.

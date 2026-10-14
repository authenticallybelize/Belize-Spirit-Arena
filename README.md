# Belize: Spirit Arena

A separate, local Canvas arena shooter prototype starring teenage Joe Grind. No accounts, downloads, package installation, or external services are needed to play. The original Legends of Belize files and save data are untouched.

## Story opening and mobile edition — 0.3.1

Launch **story.html** for the main menu and canon prologue, **survival.html** for the four-arena test, or **index.html** for the preserved classic game. `npm start` serves this checkout on port 4180 (use `$env:PORT=4181` if another preview is running). Hostinger's DirectoryIndex serves story.html at the site root.

Joe is sixteen, seven years after Legends of Belize. All twelve comic panels now have their own generated portrait illustrations, based directly on the supplied storyboard: home, errand, discovery, silence, warning, sleep, awakening, the ruins’ echo, Sling preparation, first creatures, journey and title card. Native image output is 1086 × 1448; full compositions fit phone screens without cropping. Text stays readable below the art or beside it in landscape. Frames crossfade and pan gently; advancing dialogue no longer resets the camera. Only current/next frames preload, and loading failure has a readable Continue/Skip fallback. No twelve-image download blocks the main menu. Reduced motion follows the OS preference. Audio remains synthesized ambient tones, not recorded voice acting.

Joe’s twenty source poses were checked for bounds and visible pixels. Shared rendering now uses high-quality smoothing, pixel-density-aware Canvas backing, a larger phone silhouette, a subtle light outline and a foreground player pass above cover, crowds and world pickups. The gameplay sheet, physics, collision radius, weapons and stats are unchanged. Source artwork limits remain; the renderer does not manufacture sprite detail.

Tap the scene / Continue or press Enter to advance. Skip prologue / Space skips every scene; Escape and Pause pause it. Sound starts muted; the sound button works during the prologue. Story menu offers New Story, Continue and Replay. Replay does not initialize a run or erase checkpoints.

Story uses the unchanged classic jungle physics, first five wave queues, four perks, enemies and Sling baseline: HP 100, damage 19, firing interval 0.24 seconds, movement 218. Clearing wave five and collecting the Duende Staff completes the first trial. The campaign stops honestly there: Hollow Keeper / Tide Warden encounters and connected arena transitions are not implemented. No fake victories or premature Chapter I / Survival unlocks. Existing unlocked Survival flags are preserved. A separate clearly labeled Survival test remains accessible as before.

Story saves use only `belize-spirit-arena.story` in this site's localStorage, with schema version 1. Tracked fields: watched/skipped prologue, Story started, arena/wave, completed arenas, unlocked weapons, Story completion and Survival unlock. Continue restarts a saved wave with its starting player build, HP, XP and perks; it is not an exact mid-wave save. Unknown versions, corrupt data or concurrent tab changes are preserved instead of overwritten. There was no prior Spirit Arena save system to migrate. No Legends of Belize save keys are accessed. Storage failure is reported; gameplay remains available for the session. Saves are browser/origin-specific, so localhost progress does not automatically transfer to the hosted domain.

Touch controls appear on phones/tablets: left stick moves and faces Joe; right stick aims and fires automatically while pushed. Both work simultaneously, have a dead zone and reset on release, cancellation, pause or focus loss. Dash, pickup and pause have touch buttons; upgrades and menus use ordinary taps. Keyboard/mouse remains supported. This is a responsive browser edition, not a native app.

The Survival/Arena Run test now has Jungle Ruins, Ancient Forest Canyon, The Corrupted Underworld and Spirit Coast (Hopkins), with solid bounds and mapped major rock collision. The supplied Maya Arena Concept is retained in the user's source folder; it was not added as a fifth selectable map. Decorative geometry is not all collidable; crystal, tide and rockfall hazards are future systems.

Two added ordinary mobs use copied Legends assets: Tommy Goff (52 HP, speed 90, radius 16, damage 13, XP 9; 0.5-second warned strike at speed 300 for 0.3 seconds every 3.5 seconds) and Mini Llorona (58 HP, speed 68, radius 16, contact damage 10, XP 12; three 7-damage spirit shots at speed 190 every 3.1 seconds). They use the existing Survival scaling and cover collision. Tommy replaces some scheduled mobs from wave 4; Mini Llorona joins from wave 7. Total enemy counts and existing boss schedule remain unchanged. Mini Llorona is an ordinary ranged variant, not a full boss or the future Crying Echo Mini Boss.

Nine supplied Power Ups sheets provide measured pickup-icon crops: Badman, Nuke, Bonus XP, Double XP, Freeze, Heavy Bullets, Shield, Shock and Weapon Power Up. Runtime Canvas cropping with screen blending uses the intact source files. Their effects retain the existing code rules; printed sheet durations/rewards are concept annotations, not new mechanics. Reflex Boost keeps its clearly generic star pending art.

Changed surfaces: story.js (save and cinematic state, Story game adapter), story-ui.js (menu/dialogue/presentation), story.html/story.css, touch.js/touch.css, shared game.js hooks, Survival arena/enemy definitions, power pickup rendering, sprite metadata, supplied/generated asset copies, tests and hosting DirectoryIndex. core.js is byte-for-byte unchanged.

Validation for 0.3.1: `npm test` passes classic, Survival and twelve-frame Story checks, including every skip point and actual portrait asset files. Playwright/Edge checks at 1440 × 1080, 820 × 1180, 390 × 844, 844 × 390 and 320 × 568 watched all twelve frames, tested sound/pause/skip, keyboard and simultaneous sticks, replay/checkpoint/reload and actual Joe visibility. A Canvas pixel comparison covered twenty rendered direction/move/fire states plus hurt/cover, with at least 3,637 changed Joe pixels in the phone backing store; numerical position alone was not treated as proof of visibility. All four Survival maps and classic gameplay rendered without app console/page errors. Missing-image fallback, reduced motion, Enter/Escape/Space isolation and resize were checked. A headless light-wave sample averaged 16.61 ms between animation frames (p95 16.9 ms); it does not establish a real-phone FPS guarantee. The unchanged core.js SHA-256 is 78c1d2911c703aaaaa7b490d834096a5776462f4f31243894cee036692d690e9.

Previous 0.3.0 validation: `npm test` passes classic, expanded Survival and Story checks. Browser plugin not available; installed Playwright / Edge used instead, with no new dependency. Browser QA at 1440×1080, tablet 820×1180, phone 390×844 and 844×390 verified page identity, nonblank screens, watch/skip at every scene, cinematic input isolation, sound toggle, movement/shooting/dash/pause, replay/checkpoint/reload, first-trial completion fixtures, all four maps/mob/pickup rendering, game over/restart and simultaneous touch sticks. No page/console/resource errors. A model stress fixture ran 32 enemies / 150 initial hostile shots for ten simulated seconds in each map without invalid coordinates; this is not a real-device frame-rate result. Existing forty-wave progression fixtures still pass; the new mob balance has not had a fresh full human Survival playtest.

Remaining limits: later Story encounters and transition scenes, online leaderboard, final voiced/recorded ambient audio, Reflex pickup art, real iOS/Android hardware and Safari QA, exact mid-wave/cloud saves, hazards and final mobile performance/balance. See [assets/PROLOGUE-ASSETS.md](assets/PROLOGUE-ASSETS.md) for art/audio requirements and provenance.

## Play

**Canyon & Survival edition (0.2.0):** open [survival.html](survival.html), or visit **http://127.0.0.1:4180/survival.html** while the local server is running. Select Jungle Ruins, Ancient Forest Canyon, The Corrupted Underworld or Spirit Coast, then a ten-wave Arena Run or forty-wave Survival test. The original game remains available at index.html.

Survival has 40 waves and a separate XP-level cap of 40. Bosses alternate Tata Duende and Corrupted Jaguar every five waves. The complete schedule contains 1,258 enemies, with at most 32 alive simultaneously.

All twelve starter weapons are available for testing. Hold left-click to attack. **E** collects nearby weapons; a duplicate enhances the equipped weapon up to IV, and further duplicates heal 10% maximum HP. Replaced weapons drop, enhancement ranks survive swaps, and boss weapons are optional. Rank damage multipliers are 1.00 / 1.15 / 1.30 / 1.45.

The new edition implements 31 capped perks, compatible choices, wave-dependent rarity, Foundation/Build/Wildcard slots, Grandma's fourth card (key **4**), a visible build list and ten temporary powers. Heart remains multiplicative with five ranks. Normal firing floors are weapon-specific; Badman temporarily bypasses them. Cohune splash has one final 160-unit cap. Poison/burning refresh, piercing remembers targets, ricochets are bounded, and separate 200-player/150-enemy projectile budgets favor primary shots over secondary duplicates.

The supplied square canyon image is used intact; mapped rocks block movement and shots. The dry canyon image is archived as a reference rather than another arena. No image-processing dependency or external runtime service is needed.

**Test-edition limits:** permanent unlocks/saves, arena hazards/mastery, seasons/cosmetics and 19 remaining perk designs are deferred. Weapon Power Up is a temporary 50% damage boost, not twelve bespoke evolutions. Enhancements use the damage curve above; Cacao additionally gains cloud duration, and Drum/Claw gain reach. No charge/windup system was added. Keyboard/mouse and simultaneous touch sticks are supported in the current edition; real-device performance still needs testing. Balance is experimental.

New browser QA checked 1440×1080 and 390×844, direct-file launch, arena/mode selection, movement, held fire, dash, pause, E enhancement, 1–4 choices, temporary powers, game over, restart and the original game. An accelerated browser run completed all forty waves, all 1,258 kills and XP level 40 using earned upgrades and ordinary combat inputs. Transition fixtures were tested separately. No console/resource errors remained. npm test runs classic and Survival checks.

Open this folder's `index.html` in a desktop browser. Keep `assets/`, `core.js`, `game.js`, and `styles.css` together.

For an HTTP preview, with Node 18 or newer installed:

```powershell
cd "C:\Users\holis\OneDrive\Projects\The Legends Of Belize\Belize-spirit-arena\Build"
npm start
```

Visit **http://127.0.0.1:4180**. Stop the server with Ctrl+C. To use another port: `$env:PORT=4181; npm start`.

## Controls and goal

- WASD or arrows: move. Diagonal movement is normalized.
- Mouse: aim. Hold left-click: shoot stones with the slingshot, then magic with the Duende Staff.
- Space: dash in the movement direction, or toward the cursor when stationary. Dash gives brief protection and has a 1.65-second cooldown.
- Esc: pause/resume. Leaving the window or switching tabs pauses automatically; resume explicitly when you return.
- Mint experience gems: approach to collect. Level-ups pause the fight and offer three different upgrades; click one or press 1, 2, or 3.
- Survive ten waves. Tata Duende is the first boss in wave five; the original Legends of Belize Corrupted Jaguar Spirit is the second boss in wave ten. Restart is available after defeat, victory, or from pause.

Joe uses the supplied teenage sprite sheet: backwards cap, white vest, blue shorts, backpack, four-direction walking and slingshot poses. He begins every run with the slingshot. Defeating Tata Duende drops a visible staff at the boss's position. Walk over it to equip it: damage increases by 60%, firing becomes 15% faster, and every earned perk is retained. Wave six waits for the pickup; no inventory or extra action key is required. Restart removes the staff and restores the slingshot.

Crabs pursue slowly, mini jaguars rush quickly with low health, and shadow spirits maintain range and fire telegraphed projectiles. Tata Duende fires aimed spreads and radial patterns, speeding up below half health. The final Jaguar boss uses the original purple-and-green spirit artwork, telegraphs a fast charge with a dashed line, and fires wider volleys below half health. Edge arrivals are marked before enemies become active. The four limestone ruins block movement and shots; clear paths let enemies navigate around cover. A short grace period prevents contact from draining health every frame. Between waves, Joe regains 15 health and remaining gems gather automatically.

The ten waves contain 6, 9, 13, 18, 15, 20, 23, 26, 29 and 31 enemies, respectively: 190 enemies total, including both bosses. Later mobs gain health and speed while Joe gains perks and the staff.

## Check

```powershell
npm test
```

The small Node check covers movement at 60/120 Hz, diagonal speed, dash cooldown, movement/projectile collisions, safe spawning, damage protection, collected XP, upgrade selection and pausing, staff drop/proximity pickup, perk preservation, the wave-five transition, Jaguar charge/volleys, victory/restart, and valid sprite crops. No dependencies are installed.

Browser QA used installed Edge/Playwright because the in-app browser repeatedly lost its tab binding. Verified desktop 1440×1000 and narrow 390×844 layouts, direct-file launch, the new Joe artwork/portraits, real movement and held slingshot fire, a Duende kill/drop/walk-over pickup, staff magic, perks, wave-six continuation, the Jaguar's original art/health bar/charge, focus-loss pause, game over, ten-wave victory, and clean restart with no console or resource errors. Transition fixtures exercised the UI. Separate accelerated automated runs in Node and the browser earned all ten waves and both boss defeats using ordinary movement, shots, collected gems, the staff pickup, and upgrades, with no modified health, damage, or enemies. The completed run released all 190 enemies; this is not human balance testing.

## Files

- `core.js`: DOM-free simulation, collision, spawning, AI, XP and upgrades. Physics uses at most 1/120-second steps.
- `game.js`: Canvas renderer, input, menus, HUD and optional synthesized sound.
- `assets/sprites.js`: measured source rectangles adapted from Legends of Belize.
- `assets/`: independent copies of used sprites and the new jungle/ruins artwork. See `ART-SOURCES.md`.

## Prototype limits

- Keyboard/mouse and dual touch joysticks; no gamepad controls.
- One fixed arena and ten waves. Upgrades and the collected staff last for the current run; there is no saved progression.
- Balance is preliminary. Human playtesting and Safari/Firefox performance are not yet verified.
- Enemy steering is simple cover avoidance, not a general pathfinding system for larger maps.
- Folklore characters inspire the fiction; combat abilities are original game rules.

Copyright © 2026 Authentically Belize Movement. `LICENSE` is an unchanged copy of the parent repository's license; its exceptions apply to the reused material.

## Repository workflow

The official repository is https://github.com/authenticallybelize/Belize-Spirit-Arena.

- `main`: the current playable baseline and accepted releases.
- `features`: gameplay and asset integration work.
- `drafting`: experiments and work in progress.
- `next-launch`: the candidate for the next release.

All four branches begin with the same 0.2.0 prototype. Merge reviewed changes between branches; release from `main` after validation. Branch names do not enforce protections or deploy the game automatically.

From any local checkout, run `npm test` to check game logic and `npm start` to launch the local server. Open `http://127.0.0.1:4180/survival.html` for Canyon and Survival, or `http://127.0.0.1:4180/` for the classic game.

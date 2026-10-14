# Belize: Spirit Arena

A separate, local Canvas arena shooter prototype starring teenage Joe Grind. No accounts, downloads, package installation, or external services are needed to play. The original Legends of Belize files and save data are untouched.

## Mobile controls and fullscreen — 0.4.2

This update is a mobile input/presentation change. core.js, survival.js, story.js, viewport.js, weapon definitions, enemies, arena colliders, source/runtime artwork and progression saves are unchanged.

Audit: the prior build already supported independent joystick pointer IDs, original weapon cooldowns, movement/dash, landscape overlays, automatic blur pause and the current/next prologue image cache. Missing pieces were configurable controls, a rotate prompt, explicit fullscreen entry, a compact weapon-icon HUD, touch dash cooldown feedback and selective arena loading. The previous missing Joe bug was Safari/CDN resizing source sheets while keeping original crop coordinates; the source-grid normalization and integrated 320-square held poses remain intact.

Implemented: available landscape viewport fills gameplay with safe-area offsets and unchanged camera math. Mobile attempts browser fullscreen from a user gesture and requests landscape lock where permitted. Unsupported fullscreen falls back to the viewport. Portrait gameplay pauses behind a friendly rotate-device prompt; return to landscape and resume. Resize/orientation, pointer cancellation, pause and blur clear captured stick pointers and shooting. Left stick moves/faces; right stick aims/fires only beyond its dead zone. Fire rates, cooldowns and invulnerability still come from the existing engine.

Dash is above the aiming stick by default, with an optional center position, visible countdown and cooldown fill. Left-handed layout places aiming/dash on the left. Weapon icon is top-left; level, health, XP and wave occupy the central overlay; pause remains top-right and boss bars remain below the HUD. No reference-game art, logos or graphics were copied.

Open the gear button or Story Options > Touch controls. Settings persist under the separate bsa-touch-v1 key: joystick size 90–160 CSS pixels (limited to fit the viewport), opacity 25–100%, dead zone 5–35%, dash above aiming stick or center, and left-handed layout. Defaults: 112 px, 70%, 16%, dash near aim, right-handed. Invalid/blocked storage uses defaults and reports when changes cannot persist. Existing Story/Survival save keys are untouched. The settings dialog pauses active combat and traps keyboard focus.

Rendering: mobile Canvas density is capped at 2x, and neither backing dimension exceeds 2400 pixels; desktop policy is unchanged. Image objects are cached and explicitly decoded before entering render use. Only the current arena background is retained; the next selection loads before run initialization, and a failure leaves the old state intact with a retry message. Prologue artwork still loads current/next frames on demand. No sprite quality reduction, replacement or new dependencies.

Local verification: npm test passed classic combat, Survival weapons/perks/40-wave progression, Story/save protection, 227 ready assets/93 source hashes, viewport and new touch-settings assertions. Installed Edge + Playwright 1.62.1 was used because the Browser plugin is not available. Desktop 1440x1000, touch/Safari-UA 844x390 at device DPR3 (Canvas DPR2), portrait 390x844, touch tablet 1024x768, and compact 667x375 at DPR4 (Canvas DPR2) passed. No unexpected page/console errors.

Browser interactions: WASD/mouse firing/release/Space/Escape; independent move/aim pointers; northeast projectile direction; third-finger dash with cooldown; center dead zone; individual release and touch cancellation; settings persistence/reset/left-handed geometry; blur-handler pause and orientation state preservation; weapon pickup/icon/held sprite switching; level-up choices; boss bar; all four supplied arena entries after decode; Story Options, initial comic dialogue/pause/skip/replay, Sling/base stats and the implemented first-trial exit. Boss release/trial exit use explicit fixtures, not human play. A controlled aborted arena-image request displayed the failure and successfully retried without resetting the existing mode. Unsupported fullscreen was simulated; the viewport fallback worked. Requested joystick sizes 90 and 160 produced actual 90 and 135px controls on the compact viewport.

Known limitations: no physical iPhone/iPad/Android or actual Safari/WebKit engine testing. OS/browser-specific orientation locks, notches, address bars and backgrounding still need hardware verification. Later Story arena doors/encounters remain unimplemented; the existing first-trial completion correctly reports that and preserves the Survival lock. No human boss or forty-wave balancing run was performed in this update. Full walk/fire sprite animation cycles remain a pre-existing art gap.

Files: game.js (decode/cache/on-demand arena start/mobile density), touch.js (input/settings/fullscreen/rotation/HUD), touch.css (layout/safe areas/settings), story-ui.js (Options integration), index.html/story.html/survival.html (cache versions), package.json (0.4.2/test command), tests/touch.cjs (small assert check), README.md (release record).

Rollback: backup-before-0.4.2 preserves 32d0bb0. Full pre-edit ZIP: Backups/Build_before_0.4.2_20261014_070006.zip. Original Legends of Belize and its saves are untouched.

Hosted verification pending. Earlier entries record historical releases.

## Held weapons and separate open Survival field — 0.4.1

Joe now visibly holds all twelve live weapons. Each weapon uses eight transparent, integrated teenage Joe poses; hands, weapon and body are one image. The detached rotating weapon overlay is removed. Joe keeps his backward tan cap, white tank, blue shorts, backpack and jade pendant. A small turn between directional poses follows continuous aiming; subtle walking compression and firing recoil are procedural, not full animation cycles.

Survival defaults to a separate Open Jungle Clearing: a flat 1024 x 1024 playable box in the 1200-square world, without interior obstacles. The four supplied arenas remain selectable with their original artwork and colliders. Jungle bounds are x=135, y=232, width=930, height=728. Canyon, Underworld and Coast bounds are x=180, y=145, width=835, height=685. Automated checks compare their images and obstacle layouts against the original backup. Camera following and the whole-arena option remain available. Shared aiming now uses a 54-unit hand height; bullets render behind Joe while inside his held pose. Combat damage, firing rates and saves are unchanged.

Asset work: twelve new holding atlases and one open-field background were generated with the built-in image tool. Sources and prompts are beside their respective Assets items. The exporter produces 96 integrated poses at 160-square display size and 320-square phone size, plus native isolated crops. There are 227 verified runtime exports and 93 source images; all 80 pre-existing source hashes remain unchanged. Supplied arena artwork was not edited. tools/holding-source-map.json records holding prompts and source locations.

Validation: npm test passed physics/combat, Survival, Story/save protection, asset geometry/hashes and camera checks. Installed Edge/Playwright passed local desktop, 844 x 390 touch landscape at DPR 3, and 390 x 844 portrait, all twelve weapons in eight directions, mouse attacks, movement, maximum-perk filtering, simultaneous move/aim-fire touch events, pause, all original maps, and Story skip into Sling/base stats. No application console/page errors. Browser-plugin tools were unavailable. An invulnerable stationary aim bot using normal damage, spawns, XP, perk choices and rewards completed wave 40: 1,258 releases, level 40, 50,167 ticks / 835.95 simulated seconds. No forced enemy clears; this is a progression fixture, not a human difficulty result.

Rollback: backup-before-0.4.1 points to 886c152 (0.4.0). Full backup: Backups/Build_before_0.4.1_20261014_044956.zip. Original Legends of Belize files and saves are untouched.

Remaining limits: real iPhone Safari/Android hardware is untested; Safari-user-agent checks use Edge. The integrated poses have eight aiming directions, not complete walk/attack frame cycles. Generated art still benefits from manual anatomy/perspective review. Reflex Boost still lacks supplied artwork; recorded audio and later Story encounters remain unfinished.

Published 2026-10-14: implementation commit 1329ee0 on GitHub features; Hostinger deployment accepted, cache cleared, and live desktop/touch/browser checks passed for 0.4.1. All twelve integrated grips/eight directions, actual mouse attacks, simultaneous mobile move/aim-fire, pause, original maps, and Story skip passed without application errors. Hostinger presented its existing browser challenge before several initial navigations; those transport responses are logged separately, then the game loaded normally. Static deployment archive: Backups/Build_20261014_065407.zip. Backup tag backup-before-0.4.1 preserves 886c152. Evidence and screenshots: Backups/QA_0.4.1. Main, drafting and next-launch branches were not moved. Earlier sections below describe their own historical releases.

## Combat, mobile and asset audit — 0.4.0

This release repairs the audited weapon/input problems and expands all four Survival maps to a **1024 × 1024 playable box**, inside the existing 1200 × 1200 logical world. It is published on GitHub features and deployed at https://bsa.authenticallybelize.com/. Both local and hosted browser interaction checks passed. Earlier sections below record their own versions and are retained as history.

- Mouse and mobile stick attacks share a hand/muzzle origin. Aim is calculated after movement; Joe faces the active aim and the isolated held weapon rotates to it. Projectile artwork preserves its shape, orientation and collision center. Claw uses the same origin for its aimed arc. A 32-unit north clearance keeps Joe's muzzle inside the boundary; his collision radius remains 13.
- Landscape gameplay fills the available viewport with corner sticks, centered Dash / Pick Up / Pause, a compact fixed HP/XP/level HUD and safe-area-aware settings. The camera preserves world proportions, follows smoothly outside a central dead zone, and translates mouse positions into world coordinates. Survival has **Show entire arena** in setup and pause; its static view uses letterboxing.
- Shield uses six extracted shimmer frames around a bubble sized from Joe's rendered height. Survival/Arena Run weapons on the floor last **five active combat seconds**, including boss and replaced weapons. Intermission pauses that timer; starting the next wave gives remaining weapons five seconds. Gameplay pause and upgrades also stop it.
- Cohune remains a travelling launcher projectile: 400 base damage, one shot every eight seconds, speed 450 and range 530. It explodes at first impact or flight/border end, uses four illustrated explosion frames, and deals one splash hit per enemy. Inner-half damage is full; outer falloff reaches 50%. Cover blocks splash. The final radius is capped at 160.
- Kukulkan Feather seeking strengthens at weapon ranks I–IV, selects a visible target near the aimed path and retains it while valid. Rank IV turns up to 180 degrees/sec and slows around tight turns to reduce overshooting. Cover and finite range still apply. Shock visibly jumps through nearest reachable enemies, at most sixteen per blast. Nuke releases every currently spawned enemy, including guardians and arrivals, and clears hostile shots; it does not erase the future spawn queue.
- Maxed Survival perks remain excluded. Choice labels now show the current rank and the offered increment, rather than looking already maxed. Exhausted pools show one healing fallback. Cohune/Cacao no longer offer effects their attacks cannot apply. Cacao clouds now retain the fired shot's damage bonuses. Earlier enemy impact/ricochet results are no longer overwritten by a later wall in the same step.

Joe and every live mob now render from separate **224 × 224 RGBA frames**, using manifest foot pivots; Joe’s portrait uses a separate **128 × 128** image. Rendered actor heights are unchanged. Small independent images avoid the large-sheet CDN resizing and crop-coordinate failure; original sheets remain source/backup records. Source-grid normalization still protects the cropped limestone sheet. Pose counts and pivots are covered by the asset check.

All twelve live weapons now use extracted pickup, held and projectile art, including Duende Staff. Nine supplied pickup designs and Shield/Cohune sequences use transparent ready assets. The user's original 78 PNGs are preserved; two existing enemy sheets were copied into source folders, giving 80 inventoried sources and 131 verified exports. Beside-source folders contain **Game Ready/Full Resolution**, **Game Ready/Game Resolution** and 2x variants. “Full Resolution” preserves the reviewed source crop; it does not invent higher detail. See [asset audit](assets/ASSET-AUDIT.md), [manifest](assets/ready/manifest.json), and [export script](tools/export-assets.py). Reflex Boost remains an explicitly identified procedural fallback because no source icon was supplied.

Validation: `npm test` covers classic, Survival, Story, ready assets and viewport logic. Local Edge/Playwright QA passed desktop 1440 × 1000, Safari-user-agent touch layouts 844 × 390 and 667 × 375, and portrait 390 × 844, with no application console/page errors. Real simultaneous touch events checked southwest movement, northeast aim/fire, dash without losing aim, release, centered pickup and pause. All twelve held/drop/attack representations, actual max-rank menus, Cohune flight/explosion, Shock/Nuke presentation and Story skip-to-Sling were checked. Browser power and victory/game-over cases use explicit test fixtures; they are not a forty-wave human playthrough. The Node forty-wave progression check uses transition fixtures that explicitly clear enemies. A bounded moving, invulnerable aim/navigation bot reached wave 21, 402 kills and level 29 after 180,000 ticks / 3,000 simulated seconds; it did not complete forty waves and is not a human balance result. All local browser QA passed again after switching actors to independent frames. A separate 844 × 390 / DPR 3 high-density fixture seeded 32 enemies, 120 player shots and 180 attempted hostile shots (150 accepted by the hostile cap; 270 total), returning median 16.7 ms / p95 16.9 ms between frames with no application errors. The actual five-second floor-weapon expiry also passed in the browser. These timings describe the Edge test machine; Safari user-agent checks are not a Safari engine or physical iPhone test.

Rollback: Git tag **backup-before-0.4.0** preserves commit **e735fa9** (0.3.2). A full pre-edit ZIP is at `../Backups/Build_before_0.4.0_20261013_215544.zip`. The original Legends of Belize project and saves are untouched. This release changes BSA's shared core aiming and north-edge clearance; earlier byte-for-byte core statements below refer to their earlier versions.

Remaining limits: actual iOS/Android hardware, moving-target human balance, recorded audio, full directional teenage held-weapon animations, Reflex art, later Story encounters, arena hazards and online progression. Prepared single impact samples and unused effect samples are not claimed as complete runtime animation sequences. Actor poses are now actual runtime assets, with full directional teenage held-weapon animation still unfinished.

## iPhone sprite repair — 0.3.2

The user’s Safari screenshot was reproduced exactly: Hostinger CDN serves the 1402 × 1122 Joe sheet as an **800 × 640 WebP** to an iPhone Safari user agent. The original crop coordinates then select fragments or neighboring poses; the HUD samples a whole small character rather than Joe’s face. Earlier Chromium mobile-layout tests used Chrome’s image delivery and missed this CDN variation.

The shared asset loader now restores every cropped sheet to its authored pixel grid when its decoded size differs, using one ordinary transparent HTML Canvas per affected source. This fixes Joe, his portrait, mobs, ruin crops, weapon icons and pickup icons together. Full-image backgrounds need no normalization. Native-sized images are reused directly; conversion errors flow into the existing artwork-load error handler. Source files are unchanged.

Joe now matches the active Legends of Belize renderer: 30 pixels tall on a 320-pixel-wide logical view, or **9.375% of arena width**. Each pose scales by its own crop height so Joe keeps a constant height and stable feet. Collision radius, movement, weapons, saves and combat balance are unchanged. All three pages version both shared scripts as 0.3.2.

`npm test` includes the actual 800 × 640 mismatch, authored-dimension validation, native-image reuse and Legends size. Browser testing used installed Edge/Playwright with an **iPhone Safari user agent and the real Hostinger CDN image responses**, not only local images. Twenty movement/firing states were visibly rendered, with at least 4,405 changed player pixels in the phone backing store. Portrait, cover/hurt, controls and all four Survival maps passed without app console errors. This is not an actual Safari engine or physical iPhone test. The original Legends renderer used for the size comparison is src/graphics.js:1088, and its logical canvas is 320 × 240.

Open https://bsa.authenticallybelize.com/?v=0.3.2 to request the updated page without clearing saved progress.

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

## Published release verification — 2026-10-14

Implementation commit: ba2723e on GitHub features. The backup-before-0.4.0 tag is pushed and resolves to e735fa9. Public launch: https://bsa.authenticallybelize.com/survival.html?v=0.4.0. Story root: https://bsa.authenticallybelize.com/?v=0.4.0.

Hostinger accepted and extracted Build_20261014_000608.zip (168 static files; 57,688,425 bytes). Server/CDN cache was cleared. The public-site interaction suite passed on installed Edge/Playwright, including Safari-user-agent touch delivery, twelve weapon representations, movement/aim, dual touch, mobile buttons, upgrades, powers, restart, and Story prologue skip. There were zero application console/page errors. Hostinger's existing browser-verification page briefly returns HTTP 403 before the game loads; it completed normally and is recorded separately from game errors. Security settings were unchanged.

Evidence is outside the vault at C:/Users/holis/.codex/visualizations/2026/10/13/01a135d1-9a29-7451-b9cd-9e448290d45b/qa-0.4.0-live-results.json, qa-0.4.0-results.json and qa-stress-0.4.0-results.json, with screenshot files alongside. These are emulated layouts and real hosted image delivery, not physical iPhone Safari or a full human forty-wave run.

# Ceiba Grove Clearing and milestone storms — 0.10.0

Choose **Ceiba Grove Clearing · New** from the Survival page's Arena menu. It is a second large scrolling field, built from the same unchanged Open Jungle Clearing ground texture: 2400×2400 world, playable rectangle (88, 88, 2224, 2224), center spawn (1200, 1200), 1200-unit following camera extent and optional whole-map view.

The new map adds eight solid landmark groups: three mossy boulder clusters, two fallen ceiba logs and three broken limestone markers. They block ground movement, shots and explosions through the existing obstacle system; flying enemies can cross them. Their art and collision footprints share the same coordinates, and tall props sort by their ground edge with actors. Three shallow puddles are decorative and walkable. Wide routes around the landmarks and an open center leave room for bosses, alpha summons and Joe's dash. The original Open Jungle Clearing stays available with no internal cover; the four authored arenas keep their original geometry and artwork. Survival now has six map choices.

## Storm timing

Boss **waves 10, 20, 30 … 140** bring storms in Survival; the ten-wave Arena Run also gets its wave-10 storm. These are wave milestones, independent of Joe's XP level. Storms start with that boss wave, build over two active seconds, stay through the remaining enemies and fade over two seconds during the intermission after the wave clears. Victory clears the weather immediately. Restart resets it. Pausing or choosing upgrades freezes the weather clock; enemy Freeze power does not stop the atmosphere.

The storm adds blue-grey cloud cover, wind-slanted rain, a distant lightning stroke roughly every nine active seconds and a low thunder tone when the existing sound toggle is enabled. Weather is atmospheric: it creates no damage zones, slows, collision changes or extra attacks. Enemy ground-warning areas, bullets and Joe render above the weather. Directional/spawn warnings remain readable through the light cloud tint. There is no full-screen lightning flash. Reduced motion keeps the cloud tint and removes animated rain/lightning. Rain is capped at 96 short lines and uses no combat RNG. Story Chapter I and the original ten-wave game keep their existing atmosphere.

Pause/upgrade dialogs now hide the gameplay touch controls. This fixes the bottom touch-action panel blocking the pause menu's whole-map button on a phone; controls return on resume.

## Art and code

- Game definitions, collisions, fair ring spawning and weather timing: `survival.js`.
- Prop loading, following camera, depth sorting and weather layering: `game.js`.
- Bounded rain/cloud/lightning drawing: `weather.js`.
- New props, dimensions, slicing bounds and SHA-256 hashes: `assets/grove/manifest.json`.
- Original generated prop atlas and the exact built-in image-tool prompt: `assets/source/grove/landmarks-v1.png` and [PROMPT.md](assets/source/grove/PROMPT.md).

The built-in image tool generated only the four landmark types. Standard atlas packing slices the two-by-two source, trims transparency and creates proportional PNG exports. Existing terrain, creatures and original RPG assets are preserved. All twelve alphas, quarter-parent-XP minis, drops, wave pressure, weapon/perk rules and Duende's wave-20 strength retain their previous behavior.

## Verification

Thirteen automated suites pass. New checks cover cover/flight/shot blocking, actual ground-enemy routing at small and boss-sized radii, a connected conservative route grid, all common/alpha/boss arrivals near center/corners, every storm milestone through wave 140, fade/pause/upgrade/Freeze/restart/victory, untouched Story weather, no combat-RNG consumption, bounded deterministic drawing, reduced motion and all four runtime prop hashes. Existing creature, quarter-XP, boss/drop, Story/save, player rendering and input suites also pass.

Local Edge/Playwright checks at 1440×1000 desktop and 844×390 touch, including a separate reduced-motion context, verify the map selector, decoded prop files before play, real keyboard/mouse/twin-stick movement/fire, camera follow, storms with wave-10 Jaguar and wave-20 Duende, cloud pixel changes, rain/lightning drawing, pause/overview/fade/restart, switching to the original clearing and Story/classic entry. The Browser plugin is unavailable. Screenshots and reports stay outside the repo under `C:/Users/holis/.codex/workspaces/bsa-grove-storms-20261019`.

Controlled fixtures verify state transitions; physical-phone performance and human balance on the new cover layout remain unverified.

# Belize: Spirit Arena

A separate, local Canvas arena shooter prototype starring teenage Joe Grind. No accounts, downloads, package installation, or external services are needed to play. The original Legends of Belize files and save data are untouched.

## Play

**Canyon & Survival edition (0.2.0):** open [survival.html](survival.html), or visit **http://127.0.0.1:4180/survival.html** while the local server is running. Select Ancient Forest Canyon or Jungle Ruins, then a ten-wave Arena Run or forty-wave Survival test. The original game remains available at index.html.

Survival has 40 waves and a separate XP-level cap of 40. Bosses alternate Tata Duende and Corrupted Jaguar every five waves. The complete schedule contains 1,258 enemies, with at most 32 alive simultaneously.

All twelve starter weapons are available for testing. Hold left-click to attack. **E** collects nearby weapons; a duplicate enhances the equipped weapon up to IV, and further duplicates heal 10% maximum HP. Replaced weapons drop, enhancement ranks survive swaps, and boss weapons are optional. Rank damage multipliers are 1.00 / 1.15 / 1.30 / 1.45.

The new edition implements 31 capped perks, compatible choices, wave-dependent rarity, Foundation/Build/Wildcard slots, Grandma's fourth card (key **4**), a visible build list and ten temporary powers. Heart remains multiplicative with five ranks. Normal firing floors are weapon-specific; Badman temporarily bypasses them. Cohune splash has one final 160-unit cap. Poison/burning refresh, piercing remembers targets, ricochets are bounded, and separate 200-player/150-enemy projectile budgets favor primary shots over secondary duplicates.

The supplied square canyon image is used intact; mapped rocks block movement and shots. The dry canyon image is archived as a reference rather than another arena. No image-processing dependency or external runtime service is needed.

**Test-edition limits:** permanent unlocks/saves, arena hazards/mastery, seasons/cosmetics and 19 remaining perk designs are deferred. Weapon Power Up is a temporary 50% damage boost, not twelve bespoke evolutions. Enhancements use the damage curve above; Cacao additionally gains cloud duration, and Drum/Claw gain reach. No charge/windup system was added. Keyboard/mouse only; narrow layout checks do not establish mobile/touch support. Balance is experimental.

New browser QA checked 1440×1080 and 390×844, direct-file launch, arena/mode selection, movement, held fire, dash, pause, E enhancement, 1–4 choices, temporary powers, game over, restart and the original game. An accelerated browser run completed all forty waves, all 1,258 kills and XP level 40 using earned upgrades and ordinary combat inputs. Transition fixtures were tested separately. No console/resource errors remained. npm test runs classic and Survival checks.

Open this folder's `index.html` in a desktop browser. Keep `assets/`, `core.js`, `game.js`, and `styles.css` together.

For an HTTP preview, with Node 18 or newer installed:

```powershell
cd "C:\Users\holis\OneDrive\Documents\The Legends of Belize\spirit-arena"
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

- Keyboard and mouse only; no touch or gamepad controls.
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

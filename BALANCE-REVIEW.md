# Balance review — 0.14.0

Reviewed with the Ponytail workflow: keep the existing engine and assets; change the rules that remove counterplay. No new dependency or parallel difficulty system.

## Measured problems

These are deterministic simulation measurements at wave 100, not a human full-run playtest. Joe walks at 218–400 units/second and dashes at 940.

| XP level | Previous Jaguar movement | Previous Grasshopper warning | Previous queued enemies |
| --- | ---: | ---: | ---: |
| 10 | 406 units/s | 225 ms | 329 |
| 20 | 812 units/s | 112.5 ms | 657 |
| 30 | 1,624 units/s | 56.25 ms | 1,313 |
| 40 | 3,248 units/s | 28.125 ms | 2,625 |
| 200 | 212,860,928 units/s | less than 0.001 ms | 171,966,465 |

Unbounded speed and warning compression remove the ability to dodge. Unbounded populations turn later waves into extremely long queues even with only 96 active enemies. A full-health wave-20 Duende (9,207.1875 HP before XP scaling) also died instantly to a single Nuke, guaranteeing a boss weapon and skipping the encounter.

## Changes

| Rule | Balanced behavior |
| --- | --- |
| XP difficulty | HP/damage double at 10, 20, 30 and 40, then stop at ×16. Alphas/bosses still scale HP only. Existing per-wave growth continues through wave 200. |
| Ordinary movement | Maximum 300 units/s; ordinary pounces remain below Joe's dash speed. |
| Ordinary attack clock | Maximum ×2, with at least 250 ms of warned windup. Alpha/boss attack timings retain their authored values. |
| Wave population | Doubles at 10, 20 and 30, capped at ×8. Wave-100 queue remains 1,313 even at XP level 200. |
| Spawn cadence | +50% per tier through XP level 40, capped at ×5.0625. Existing active-enemy and simulation limits still apply. |
| Nuke | Clears ordinary mobs/minis, hostile shots, hazards and pending broods; removes 50% maximum alpha HP or 20% maximum boss HP. Only a defeated elite awards its reward. Legend Hunter does not multiply this percentage. Arrival warnings do not protect against Nuke. |
| Upgrade selection | 0.75 active seconds of protection after returning from cards; Breathing Room retains 1.5 seconds plus knockback. Chained cards do not consume this time while paused. |

The difficulty caps replace 0.12/0.13's unbounded XP multipliers. XP itself remains uncapped, the 200-wave endpoint remains, all twelve weapons still reach VI, and all extra perk ranks remain. Story retains its authored roster/difficulty and excludes Nuke; shared upgrade-selection protection also applies there. Classic retains its rules.

## Verification and limits

`npm test` covers the 200-wave schedules and existing combat, save, asset, camera and input rules. Updated progression checks cover each tier, speed/warning bounds, hatch transformations and finite high-level populations. Balance checks verify Nuke damage, real elite rewards, clearing hostile pressure and expiration of upgrade protection. `npm run build` exports the release; desktop and touch browser fixtures verify the actual rendered/input flows.

The exported build passes Chromium checks at 1440×1000 desktop and 844×390 touch. Real keyboard/joystick movement, walk-over Nuke collection and keyboard/touch upgrade choices work. A level-60, wave-100 fixture retains the boss at 80% HP and alpha at 50%, with no early elite reward. Upgrade protection blocks immediate damage and then expires. Story/classic entry loads, and no application or failed-asset errors occur. Browser runtime tools are unavailable in this session; installed Playwright/Chromium supplies these checks.

These checks establish rule behavior and counterplay bounds, not completion rates or player preference. Physical phones and an uninterrupted earned 200-wave run remain untested. Follow-up tuning should use player deaths by wave/cause, average wave duration and weapon choices; avoid speculative weapon-wide buffs before those observations exist.

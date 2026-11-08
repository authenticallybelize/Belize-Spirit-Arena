# Balance review — 0.15.0

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
| Enemy movement | Ordinary movement grows 20% per XP decade through level 40. Actual movement, including alpha/boss charges, sidesteps and crowd separation, never exceeds Joe's current running speed. The cap follows his upgrades and slows; Joe's dash does not raise it. Weapon knockback retains its force. |
| Ordinary attack clock | Maximum ×2, with at least 250 ms of warned windup. Alpha/boss attack timings retain their authored values. |
| Wave population | Doubles at 10, 20 and 30, capped at ×8. Wave-100 initial queue is 1,314 at XP level 200, including the two scheduled guardians. |
| Spawn cadence | Baseline spawns are 25% more frequent and the first arrival delay is reduced proportionally. Spawn rate then grows 50% per XP decade through level 40, capped at ×5.0625 on the faster baseline (×6.328125 overall). Existing active-enemy and simulation limits still apply. |
| Power-up chance | 4.025% per ordinary/alpha defeat, a 15% relative increase from 3.5%; minis grant no pickups. |
| Weapon damage | Spear 115 and Duende Staff 45.4 base damage per hit; original fire rates and VI multipliers remain. |
| Hostile projectiles | Every hostile shot is 15% slower; player shot speed remains. |
| Alpha broods | Three matching minis per parent lifetime; existing Tapir split and Jabiru egg schedule remain. Jabiru eggs launch, land, then hatch after five active seconds. |
| Late bosses | Two distinct scheduled bosses after wave 40; 20% chance of one extra boss on ordinary waves after 50. Each gives its own health bar and reward. |
| Nuke | Clears ordinary mobs/minis, hostile shots, hazards and pending broods; removes 50% maximum alpha HP or 20% maximum boss HP. Only a defeated elite awards its reward. Legend Hunter does not multiply this percentage. Arrival warnings do not protect against Nuke. |
| Upgrade selection | 0.75 active seconds of protection after returning from cards; Breathing Room retains 1.5 seconds plus knockback. Chained cards do not consume this time while paused. |

The difficulty caps replace 0.12/0.13's unbounded XP multipliers. XP itself remains uncapped, the 200-wave endpoint remains, all twelve weapons still reach VI, and all extra perk ranks remain. Story retains its authored roster, spawn schedule and HP/damage, and excludes Nuke; shared movement limits and upgrade-selection protection also apply there. Classic retains its rules.

## Verification and limits

`npm test` covers the 200-wave schedules and existing combat, save, asset, camera and input rules. Updated progression checks measure actual displacement for every enemy type, charges, sidesteps, latching and crowded groups across XP tiers and Joe's slow/normal/upgraded speeds. They verify slow expiry, dash behavior, movement-budget cleanup and actual faster spawn arrivals. Cadence remains equal at 60 and 120 FPS. The logic-only stress fixture measures 1.72 ms per 120 Hz step with up to 96 enemies and 350 projectiles; this excludes rendering and physical devices. Balance checks verify Nuke damage, real elite rewards, clearing hostile pressure and expiration of upgrade protection. `npm run build` exports the release; desktop and touch browser fixtures verify the actual rendered/input flows.

The exported build passes Chromium checks at 1440×1000 desktop and 844×390 touch. Grasshopper pounce displacement stays at Joe's running speed both normally and while slowed. Real keyboard/joystick movement, walk-over Nuke collection and keyboard/touch upgrade choices work. A level-60, wave-100 fixture retains the boss at 80% HP and alpha at 50%, with no early elite reward. Upgrade protection blocks immediate damage and then expires. Story/classic entry loads, and no application or failed-asset errors occur. Browser runtime tools are unavailable in this session; installed Playwright/Chromium supplies these checks.

These checks establish rule behavior and counterplay bounds, not completion rates or player preference. Physical phones and an uninterrupted earned 200-wave run remain untested. Follow-up tuning should use player deaths by wave/cause, average wave duration and weapon choices; avoid speculative weapon-wide buffs before those observations exist.

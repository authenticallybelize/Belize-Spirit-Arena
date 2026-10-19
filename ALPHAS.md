# Survival alphas — 0.9.0

All twelve recorded alphas are now reachable in Survival. The nine added identities reuse approved source sheets. Existing three alphas, ten common enemies and nine bosses remain: **31 primary Survival identities**. The three helper forms below are part of parent encounters, not new primary bestiary entries. Chapter I and ten-wave Arena Run keep their own queues.

| Added alpha | Baseline HP | Damage | XP | Working behavior |
|---|---:|---:|---:|---|
| Chiwoj — Red-Rumped Tarantula | 165.6 | 16 | 25 | 0.9s warned pounce; landing leaves a 90-radius hair patch with 0.8s warning, three-second damage/40% slow. |
| Tiger Wandering Spider | 165.6 | 15 | 25 | 0.3s sideways movement, 0.65s locked-direction warning, fast dash/bite. |
| Wee-Wee Soldier Ant | 248.4 | 16 | 26 | 0.65s bite warning; successful bite latches for at most 1.3s and slows Joe 40%; dash breaks the latch. |
| Bullet Ant Champion | 248.4 | 24 | 30 | Slow approach, one-second heavy bite warning; successful hit slows Joe 40% for 1.5s. |
| Giant Centipede | 276 | 19 | 30 | Warned venom dash; one body hit circle avoids multiplying splash/pierce damage across segments. |
| Hive Guardian | 193.2 | 15 | 30 | Flying three-shot fan; summon warning first at six active seconds, then every ten; one Bee Swarm per successful cast, maximum three owned swarms. |
| Giant Tommy Goff | 358.8 | 25 | 35 | 1.1s coiling warning before a fast venom strike. |
| Rot-Tapir | 414 | 20 | 36 | Three-shot bile cone and warned 78-radius, five-second acid patch; at zero HP the shell breaks into exactly three fast Parasite-Tapirs. |
| Jabiru-Reaper | 310.5 | 22 | 36 | Flying warned dive; egg-cast warning first at ten active seconds, then every sixty; destructible Void Egg hatches five active seconds after landing. |

These are pre-wave values. Every new alpha includes the existing 15% general HP increase and additional 50% alpha increase. Spider/ant/bee/snake variants use four times their family’s original HP before those multipliers (six times the upgraded ordinary family). Centipede, Tapir and Jabiru use original archetype baselines of 40/60/45 respectively because their regular family counterparts are not installed. Damage is tuned per attack; only the original Crab/Jaguar/Shadow family variants retain an exact 1.5× damage ratio. Venom follows a successful hit with three one-second ticks of 15% attack damage, subject to normal immunity, shield and armor.

Alphas replace ordinary wave slots on waves ending in 3, 6 and 9 after wave 10. Wave 13 introduces one, wave 23 guarantees two, wave 33 three, and wave 43 four. Ending-6/9 encounters randomize from one to the current maximum; four remains the cap. Existing wave counts, 10% crowd increase, bosses every five waves, wave-20 Duende, Sling-only start, random weapon rules and 140-wave endpoint remain.

## Summons and cleanup

Parasite-Tapirs have 25.3 base HP/8 damage; Void Eggs 27.6 HP/no attack; Night Hatchlings 23 HP/8 damage. Wave scaling applies. Tapirs use the existing mini-tapir artwork, eggs and hatchlings use existing Jabiru sheet poses, and Hive swarms reuse the common bee artwork. Mini tapirs have one isolated pose; the hatchlings have two, with hit flash/fading defeat rather than newly generated full animation cycles.

All children share the current active-enemy cap (32 rising to 96). Jabiru allows at most three owned eggs/hatchlings combined; Hive allows three owned swarms. A full cap skips a Hive/Jabiru summon until a later cast. Tapir replacements instead wait in a bounded per-encounter queue and prevent premature wave completion until all three can enter safely. Children give no XP, kill-count increment, weapon or power drops. The parent gives its normal reward once. Hive/Jabiru children dissolve when their parent is defeated; mini tapirs survive the broken shell and must be cleared. Nuke clears current enemies and pending replacements without splitting a new Tapir. Restart clears all summons, hazards and player impairments. Pause/Freeze stop summon, hatch and enemy warning timers; player venom follows active player time.

## Artwork and validation

Runtime atlases and hashes: `assets/ready/roster/manifest.json`; metadata: `assets/roster.js`. All are transparent 768×512 RGBA atlases on the existing six-by-four grid. Original sheets are preserved. The built-in image tool extracted transparent Tapir/Jabiru versions, saved under `assets/source/alphas/`; prompts are recorded there. Standard atlas packing isolates child poses and removes adjacent-cell fragments.

Twelve automated suites cover all 140 queue/count boundaries, twelve reachable alphas, all twelve weapons and five arenas, damage/statuses, attack counterplay, hatch/summon timing and caps, single parent rewards, cleanup, art hashes and unchanged Story progression/saves. Local desktop 1440×1000 and touch 844×390 Edge/Playwright checks show all nine new sprites, actual controls and a Sling alpha defeat, warning states, Tapir splitting, egg/hatchling rendering, pause/restart and Story/classic entry. Browser plugin is unavailable. Controlled fixtures do not establish human balance or physical-phone performance.

Published 19 October 2026 as gameplay commit `048f39a` on `features` and `codex/eight-enemy-roster`. The same desktop/touch checks pass against the live Hostinger site, with no application errors or failed game assets. Hosted Survival/rendering/UI scripts, roster metadata, Story/Survival HTML and `.htaccess` match the release. Obsidian's shared bestiary, all creature status blocks, five shelves, summoned-forms note, progression/boss links and project home are synchronized; the original 58 backstories and source world/RPG registers match their backups. There are 698 verified wiki links in the checked notes. Full static rollback, local/live screenshots and reports are under `C:/Users/holis/.codex/workspaces/bsa-alphas-20261019`; previous Git state is tagged `backup-before-0.9.0`. The original RPG checkout and save data remain untouched.

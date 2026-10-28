# Survival alphas — 0.9.1

All twelve recorded alphas are now reachable in Survival. The nine added identities reuse approved source sheets. Existing three alphas, ten common enemies and nine bosses remain: **31 primary Survival identities**. The three helper forms below are part of parent encounters, not new primary bestiary entries. Chapter I and ten-wave Arena Run keep their own queues.

| Added alpha | Baseline HP | Damage | XP | Working behavior |
|---|---:|---:|---:|---|
| Chiwoj — Red-Rumped Tarantula | 165.6 | 16 | 25 | 0.9s warned pounce; landing leaves a 90-radius hair patch with 0.8s warning, three-second damage/40% slow. |
| Tiger Wandering Spider | 165.6 | 15 | 25 | 0.3s sideways movement, 0.65s locked-direction warning, fast dash/bite. |
| Wee-Wee Soldier Ant | 248.4 | 16 | 26 | 0.65s bite warning; successful bite latches for at most 1.3s and slows Joe 40%; dash breaks the latch. |
| Bullet Ant Champion | 248.4 | 24 | 30 | Slow approach, one-second heavy bite warning; successful hit slows Joe 40% for 1.5s. |
| Giant Centipede | 276 | 19 | 30 | Warned venom dash; one body hit circle avoids multiplying splash/pierce damage across segments. |
| Hive Guardian | 193.2 | 15 | 30 | Flying three-shot fan; summon warning first at six active seconds, then every ten; one Bee Swarm per successful cast, maximum three over the parent's lifetime. |
| Giant Tommy Goff | 358.8 | 25 | 35 | 1.1s coiling warning before a fast venom strike. |
| Rot-Tapir | 414 | 20 | 36 | Three-shot bile cone and warned 78-radius, five-second acid patch; at zero HP the shell breaks into exactly three fast Parasite-Tapirs. |
| Jabiru-Reaper | 310.5 | 22 | 36 | Flying warned dive; egg-cast warning first at ten active seconds, then every sixty; at most three eggs over the parent's lifetime; destructible egg hatches five active seconds after landing. |

These are pre-wave values. Every new alpha includes the existing 15% general HP increase and additional 50% alpha increase. Spider/ant/bee/snake variants use four times their family’s original HP before those multipliers (six times the upgraded ordinary family). Centipede, Tapir and Jabiru use original archetype baselines of 40/60/45 respectively because their regular family counterparts are not installed. Damage is tuned per attack; only the original Crab/Jaguar/Shadow family variants retain an exact 1.5× damage ratio. Venom follows a successful hit with three one-second ticks of 15% attack damage, subject to normal immunity, shield and armor.

Alphas replace ordinary wave slots on waves ending in 3, 6 and 9 after wave 10. Wave 13 introduces one, wave 23 guarantees two, wave 33 three, and wave 43 four. Ending-6/9 encounters randomize from one to the current maximum; four remains the cap. Existing wave counts, 10% crowd increase, bosses every five waves, wave-20 Duende, Sling-only start, random weapon rules and 140-wave endpoint remain.

## Summons and cleanup

Parasite-Tapirs have 25.3 base HP/8 damage; Void Eggs 27.6 HP/no attack; Night Hatchlings 23 HP/8 damage. Wave scaling applies. Tapirs use the existing mini-tapir artwork, eggs and hatchlings use existing Jabiru sheet poses, and Hive swarms reuse the common bee artwork. Mini tapirs have one isolated pose; the hatchlings have two, with hit flash/fading defeat rather than newly generated full animation cycles.

All children share the current active-enemy cap (32 rising to 96). Jabiru lays at most three eggs over its lifetime; Hive summons at most three swarms over its lifetime. Killing children does not replenish that allowance, preventing unlimited XP farming. A full cap skips a Hive/Jabiru summon until a later cast without spending its allowance. Tapir replacements instead wait in a bounded per-encounter queue and prevent premature wave completion until all three can enter safely.

**Mini rewards in 0.9.1:** every defeated combat mini drops one XP gem worth **¼ of its parent alpha's base XP**. Parasite-Tapirs and Night Hatchlings give **9 XP** each; Hive swarms give **7.5 XP** each. Fractional XP is retained across pickups, and Memory Seeker/Double XP apply normally. Destructible unhatched eggs give no XP, preventing an egg-plus-hatchling double reward. Each combat mini counts once as a released spirit and toward Belizean Rhythm, but gives no weapon or power pickups. Story cave summons retain their previous reward rules.

Parents give their usual full XP once, a 6% random weapon chance and a separate 3.5% random power chance. All twelve weapon identities and all power identities are eligible. Bosses retain guaranteed random weapons. Hive/Jabiru children now survive their parent's defeat, just like the mini tapirs, and must be cleared before the wave ends. Nuke clears current enemies and pending replacements without splitting a new Tapir; existing minis award their usual reduced Nuke XP once. Restart clears all summons, hazards and player impairments. Pause/Freeze stop summon, hatch and enemy warning timers; player venom follows active player time. Duende's wave-20 HP, attack power and boss behavior are unchanged.

## Artwork and validation

Runtime atlases and hashes: `assets/ready/roster/manifest.json`; metadata: `assets/roster.js`. All are transparent 768×512 RGBA atlases on the existing six-by-four grid. Original sheets are preserved. The built-in image tool extracted transparent Tapir/Jabiru versions, saved under `assets/source/alphas/`; prompts are recorded there. Standard atlas packing isolates child poses and removes adjacent-cell fragments.

Twelve automated suites cover all 140 queue/count boundaries, twelve reachable alphas, all twelve weapons and five arenas, damage/statuses, attack counterplay, hatch/summon timing and caps, single parent rewards, cleanup, art hashes and unchanged Story progression/saves. Local desktop 1440×1000 and touch 844×390 Edge/Playwright checks show all nine new sprites, actual controls and a Sling alpha defeat, warning states, Tapir splitting, egg/hatchling rendering, pause/restart and Story/classic entry. Browser plugin is unavailable. Controlled fixtures do not establish human balance or physical-phone performance.

The preceding 0.9.0 release was published as gameplay commit `048f39a` on `features` and `codex/eight-enemy-roster`. Its desktop/touch checks, static rollback and original Obsidian backups remain under `C:/Users/holis/.codex/workspaces/bsa-alphas-20261019`. Version 0.9.1 updates the mini reward/persistence policy above; all twelve automated suites pass, including every alpha's full XP and all weapon/power drop boundaries, fractional mini XP, XP modifiers, one-time rewards, persistent broods, lifetime limits, Nuke and unchanged Story/boss rules. Its evidence and rollback are kept separately under `C:/Users/holis/.codex/workspaces/bsa-alpha-drops-20261019`.

Version 0.9.1 is published as gameplay commit `f647c86`, verified on the live Hostinger site at desktop 1440×1000 and touch 844×390. Checks include actual gem collection showing 7 XP plus a retained half point from a 7.5-XP mini reward, persistent broods, the updated help, pause/restart and Story/classic entry. No app errors or failed game assets were recorded. Hosted scripts/HTML/root routing match the release. Obsidian has 21 synchronized notes and 310 validated wiki links; all 58 backstories and original source registers are preserved. Git tag `backup-before-0.9.1` and the QA folder retain the previous release and vault text. New sessions load the update; reload between runs to preserve a current Survival run.

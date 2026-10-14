# Source asset audit and exports

## 0.4.1 update

twelve new holding atlases and one open-field background were generated with the built-in image tool. Sources and prompts are beside their respective Assets items. The exporter produces 96 integrated poses at 160-square display size and 320-square phone size, plus native isolated crops. There are 227 verified runtime exports and 93 source images; all 80 pre-existing source hashes remain unchanged. Supplied arena artwork was not edited. tools/holding-source-map.json records holding prompts and source locations.

Eight integrated held directions per weapon are now runtime artwork. Full walking/firing cycles remain missing. Earlier source inventory below describes 0.4.0.

The supplied Assets folder contains 78 original PNGs. Two existing runtime enemy sheets, Tommy Goff and Mini Llorona, are also copied into their own source folders so their references have a home. Original source images are preserved. Generated derivatives sit beside each item in `Game Ready/Full Resolution` and `Game Ready/Game Resolution`, with a local `README.txt`.

`Full Resolution` means the reviewed region at its original pixel dimensions. It does not claim new detail or invented high-resolution art. `Game Resolution` contains fitted transparent images at display dimensions and a 2x variant for phone rendering. Arena exports preserve the complete original 1254×1254 scene and provide a 1200×1200 game derivative. The Maya arena concept remains an unused concept, with no invented campaign completion.

Run `python tools/export-assets.py` with Python and Pillow to reproduce the exports. Run `node tests/assets.cjs` to verify PNG dimensions, transparency mode, checksums, weapon coverage, every actor’s pose count and foot pivot, and any local original source hashes. The manifest is [ready/manifest.json](ready/manifest.json); runtime references are [ready-assets.js](ready-assets.js).

## Ready assets

| Category | Coverage | Display dimensions |
| --- | --- | --- |
| Weapon pickup and held artwork | All twelve live weapons, including Duende Staff | 48×48 pickup; 64×64 held |
| Weapon projectiles | All twelve definitions; Drum/Claw exports are their effect forms | 32×24 |
| Weapon impact samples | All twelve weapons | 96×96 |
| Cohune explosions | Four sequential explosion/debris frames from its dedicated board | 128×128 |
| Pickups | Nine supplied pickup designs | 48×48 |
| Shield shimmer | Six bubble frames, without the example adult Joe | 128×128 |
| Shock and Heavy Bullets effects | Lightning bolt and powered bullet | 48×96; 64×32 |
| Characters | Twenty teenage Joe poses, portrait, and seven live enemy identities; used by the runtime renderer | 112×112 base fit; 224×224 RGBA runtime frames; 128×128 runtime portrait |
| Arena concepts | Canyon, Corrupted Underworld, Coast and Maya concept | 1200×1200 scene |

The weapon atlas already has transparency. Reviewed crop boundaries avoid headings, captions, grid lines and nearby frames. RGB pickup/weapon boards retain their own intended icon framing; their edge-connected dark background is removed, while enclosed dark outlines remain. Held and projectile orientation offsets are recorded individually so the renderer can rotate towards the actual aim direction.

The 131 referenced runtime exports total approximately 6 MB: 1.56 MB for weapons/effects, 0.63 MB for pickups/effects, and 3.85 MB for character frames. The old nine 1254×1254 power boards should remain source/reference files rather than decode into memory for 48-pixel pickups. Load only categories currently drawn. Joe and every live enemy now render from the independent 224×224 RGBA images using manifest foot pivots. Joe’s portrait renders from a separate 128×128 image. Display heights stay unchanged; the larger pixel buffers are 2x exports, not larger actors or invented source detail. Original actor sheets remain source/backup references. Small independent frames avoid the large-sheet CDN resize/crop failure; source-grid correction remains in use for limestone artwork.

## Missing or incomplete

- Reflex Boost has an empty source folder and no supplied icon. Its procedural fallback must stay clearly identified; unrelated art is not a finished replacement.
- Food pickups, arena hazard artwork, spawn effects, perk icons, mobile control art, menu/HUD/UI art, Spirit Powers and general Projectiles directories have no supplied source PNGs.
- Dedicated weapon concept boards frequently show a different/adult Joe. These character examples are excluded from the canonical teenage Joe export. Full directional held-weapon animations matching teenage Joe remain needed for polished animation; rotating isolated weapons is the practical current implementation.
- Several magic impact samples are illustrative glow art, not complete uniform animation sequences. Cohune explosion and shield shimmer have reviewed sequences; the other single impact exports are samples.
- Source concept text does not silently change live combat rules. Durations, weapon tiers and descriptive marketing claims on those boards may differ from the implementation.
- Higher-detail arena source art would be needed for genuinely higher native detail than 1254 pixels. A larger playable map or high-DPI canvas does not create additional source pixels.

First-pass unused arena upscales were moved into the project Backups/UnusedArenaUpscales_0.4.0 folder. Redundant nested actor exports were preserved in Backups/RedundantActorExports_0.4.0. Neither set is included in Git or deployment.

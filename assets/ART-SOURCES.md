# Spirit Arena artwork and references

## Canyon & Survival edition

- User-supplied Ancient Forest Canyon Arena.png is copied intact as canyon-arena.png. Its full square view is rendered without cropping; code-native collisions follow the clearing's main rocks.
- User-supplied ChatGPT Image Oct 13, 2026, 09_21_31 AM-1.png is copied intact as dry-canyon-reference.png. This is a reference, not a third selectable arena.
- User-supplied Mesoamerican Fantasy Weapon Sprite Sheet.png is copied intact as weapon-sheet.png. Measured pickup/held source rectangles exclude labels and table borders.
- concepts/canyon-survival.png is a UI concept made with the built-in image generator, using the canyon and weapon sheet as references. Prompt: full desktop Belize Spirit Arena screen, existing dark forest green/warm gold styling, square canyon view, health/XP/wave HUD, arena/mode/starter controls and restrained build summary; preserve supplied artwork and keep controls/text code-native. It guides layout and is not the game's background.

The reused enemy and teenage Joe provenance follows below.

Existing Legends of Belize enemy art was **copied**, with no modification of the original files: `mini-jaguar.png`, `cave-crab-v1.png`, `cave-shadow-v1.png`, `duende-v1.png`, and `jaguar-clean-v1.png` (copied here as `jaguar-spirit.png`). The latter is the original Corrupted Jaguar Spirit, used as wave ten's boss; alpha-based runtime frame crops remove empty padding so its full silhouette reads at boss scale. Character source rectangles and the proportional, feet-anchored frame drawing approach were adapted from `../../src/graphics.js`, `../../src/adventure.js`, and `../../assets/MOB-SHEETS.json`. The adventure engine is not loaded, and none of its save keys or service workers are used. Original ownership/source records remain in `../../assets/ART-SOURCES.md` and `../../LICENSE`.

`teenage-joe.png` is an unchanged copy of the user's `C:/Users/holis/Downloads/Belizean Slingshot Hero Sprite Sheet.png` (1402×1122 RGBA). It replaces the original Joe in this separate game, including HUD/menu portraits. Twenty source rectangles were measured from the alpha without changing the image's pixels. The rows are front, right, left and back; the first three columns are idle/walking and the last two are slingshot poses. Runtime crops exclude the sheet's separate demonstration stones; all fired stones are live projectiles. Per-pose foot anchors keep the body stable while aiming. Left-facing slingshot attacks mirror the right-facing attack poses. Portrait canvases crop the first pose's head and work over HTTP or direct local files. No ImageGen edits were needed for this update. The dropped/held crook staff is a small code-native graphic matching the existing Duende staff's wood and green magic.

The user's seven supplied reference images informed the jungle scenery, limestone cover, turquoise stream, clear combat silhouettes, gems, and boss presentation. Only one jungle arena was implemented.

New assets were generated with the built-in ImageGen tool on 2026-10-13, copied unchanged into this folder, and rendered with measured source rectangles. No CLI/API fallback, accounts, or runtime generation is involved.

- `jungle-arena.png`: generated source `C:/Users/holis/.codex/generated_images/01a135d1-9a29-7451-b9cd-9e448290d45b/exec-5df65144-964c-4838-bc5c-a4dc01bf1f61.png`. Full 3:2 overhead jungle clearing, existing game palette, limestone paths, decorative edge ruins, tropical vegetation and far-right turquoise water. The live simulation and cover are drawn separately.
- `limestone-ruins.png`: generated source `C:/Users/holis/.codex/generated_images/01a135d1-9a29-7451-b9cd-9e448290d45b/exec-fbdc2b11-5ce5-4128-a0b7-a8e0a35b2199.png`. RGBA transparent obstacle; visible crop `[304,180,1059,642]`. Pixel data/alpha are unchanged.
- Design concept: `C:/Users/holis/.codex/generated_images/01a135d1-9a29-7451-b9cd-9e448290d45b/exec-4804d4f5-7807-48f5-b62c-1ae08a8c5cb5.png`. Forest-green chrome, ivory serif heading, gold utilities, health/XP HUD, four cover clusters, native controls and five-wave progression.

Final background brief: "A complete 3:2 near-overhead Belize jungle arena background compatible with existing colorful pixel-game sprites. Warm emerald grass and cracked limestone ground, clear cross paths, small temple and torches at the top edge, tropical border palms/ferns/bromeliads, turquoise water only at the far right. Keep the playable rectangular clearing free of solid objects. No characters, enemies, gems, projectiles, UI, text, religious symbols, or watermark. Upper-left daylight and readable ground contrast." References: the user's first jungle image and existing `belize-terrain.png`.

Final obstacle brief: "One isolated compact rectangular cluster of three weathered limestone columns connected by broken low wall and rubble, viewed from 75-degree overhead. Match existing colorful pixel-game scenery, pale beige/gray stones, sage moss and magenta bromeliads, upper-left light, tight transparent padding, true alpha. No ground patch beyond the footprint, people, glyphs, religious symbols, text, labels, background or duplicates." Reference: existing `foliage-v2.png`.

Tata Duende identity was cross-checked against the [Belize Tourism Board's folklore introduction](https://www.travelbelize.org/blog/get-know-belizes-folklore/). His battle abilities are invented game mechanics. No folklore source was used as an instruction to perform actions.

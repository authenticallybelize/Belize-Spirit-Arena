# Prologue and mobile edition assets — 0.3.0

Four included scene illustrations were generated with the built-in Image Gen tool on 2026-10-13 from scene briefs based on the user's storyboard. They are new cinematic art, not extracted storyboard panels. No text is baked into the art; the game supplies dialogue and controls.

| Runtime file | Dimensions | Scene |
|---|---|---|
| prologue/home.png | 1536 × 1024 | Late afternoon rural home, Joe and Grandma |
| prologue/discovery.png | 1536 × 1024 | Firewood, roots, glowing obsidian |
| prologue/warning.png | 1536 × 1024 | Grandma studies the stone |
| prologue/bedroom.png | 1536 × 1024 | Joe sleeps; purple fractures glow |
| jungle-arena.png | Existing arena image | Awakening; reused with Joe's existing sprite |

Generated source copies remain in C:\Users\holis\.codex\generated_images\01a135d1-9a29-7451-b9cd-9e448290d45b. Runtime copies are kept here so the game does not depend on that location. The reference storyboard remains the user-supplied attachment; it was not altered.

Optional final replacements should keep these filenames and 1536 × 1024 landscape dimensions, with important faces/stone in the central 60% for portrait cropping and a quiet lower quarter for dialogue. Current images are working generated illustrations, not missing-image placeholders.

Audio uses Web Audio synthesis: birdlike chirps, a distant low pulse, heartbeat tones and filtered wordless noise. These are temporary sound design, not recordings or character voices. Final audio still needed:

- jungle-ambience.ogg / .mp3 — seamless ambient jungle loop; fade on touching obsidian.
- obsidian-pulse.ogg / .mp3 — brief supernatural low sound.
- heartbeat.ogg / .mp3 — quiet repeating heartbeat.
- wordless-whisper.ogg / .mp3 — restrained, unintelligible texture; never identify its source.
- Optional recorded Joe / Grandma lines, only after approving the dialogue.

These filenames are a production checklist, not runtime requests; no missing audio URLs are fetched.

The user's source Assets/Arenas supplied Underworld Corrupted Maya Arena Concept.png and Hopkins Beach Concept.png, copied intact as underworld-arena.png and coast-arena.png. Their collision rectangles are game metadata. Crystals, tides and decorative structures do not gain hazards merely because they appear in the artwork.

Nine full, opaque Power Ups concept sheets were copied intact from Assets/Pickups/Power Ups into powers/. survival-ui.js has measured pickup-icon rectangles. Labels, character examples and concept statistics are excluded from the crops. Runtime screen blending softens dark background squares; no permanent alpha extraction was performed. A dedicated Reflex Boost icon is missing; the existing generic star remains its temporary symbol. Animation/VFX sections of these sheets are not all integrated.

Tommy Goff and Llorona sheets were copied intact from the original Legends of Belize assets. Their original measured crops were adapted in sprites.js. Original sources and saves were never edited. Existing copyright and prototype asset policies still apply; see ART-SOURCES.md and LICENSE.

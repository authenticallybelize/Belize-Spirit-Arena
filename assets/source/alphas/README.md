# Existing-sheet transparency extraction

Built-in image generation tool, 19 October 2026. Original approved source sheets are preserved under `C:/Users/holis/OneDrive/Documents/The Legends of Belize/assets/generated/shadow-creatures-v1/`.

`rot-tapir-transparent-v1.png` prompt:

> Use case: background-extraction. Edit target: the attached Rot-Tapir sprite sheet. Remove ONLY the white paper background, producing true transparent alpha around every sprite. Preserve all existing artwork, all creature poses, green bile and violet miasma, exact six-column four-row 1536x1024 grid and cell positions. Do not redesign, move, add, remove or crop creatures, mini tapirs, particles or frames. No text. This is a game atlas; layout must remain exactly unchanged.

`jabiru-reaper-transparent-v1.png` prompt:

> Use case: background-extraction. Edit target: the attached Jabiru-Reaper sprite sheet. Remove ONLY the white paper background, producing true transparent alpha around every sprite. Preserve all existing artwork, bird poses, purple eggs, bat-like hatchlings and particles, exact six-column four-row 1536x1024 grid and cell positions. Do not redesign, move, add, remove or crop anything. No text. This is a game atlas; layout must remain exactly unchanged.

Both outputs have genuine alpha, the original 1536×1024 grid and all existing phases. Runtime packing reduces them to 768×512, derives anchors, discards tiny disconnected neighboring-frame fragments and extracts the existing miniature forms. Parasite-Tapir uses one isolated miniature pose; Night Hatchling uses two existing poses. No replacement enemy designs were requested or added.

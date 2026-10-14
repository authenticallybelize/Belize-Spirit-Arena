"""Export reviewed source-art regions without changing their source files.

Run with Python and Pillow: python tools/export-assets.py
Full Resolution preserves native crop pixels. Game Resolution is the game's
display size plus a 2x export for sharp phone rendering.
"""
from collections import deque
from hashlib import sha256
from pathlib import Path
import json
import re
import shutil

from PIL import Image

BUILD = Path(__file__).resolve().parents[1]
SOURCE = BUILD.parent / "Assets"
READY = BUILD / "assets" / "ready"
ATLAS = SOURCE / "Weapons" / "Mesoamerican Fantasy Weapon Sprite Sheet.png"
WEAPONS = {
    "slingshot": ("Slingshot", [12,112,90,111], [113,114,121,104], [246,141,41,40], [466,129,82,80]),
    "bow": ("Belize Hardwood Bow", [571,113,94,110], [678,118,114,100], [804,151,70,26], [1021,130,81,76]),
    "dart": ("Maya Dart Launcher", [1127,112,94,111], [1228,114,106,103], [1340,155,76,23], [1581,127,74,83]),
    "spear": ("Fishing Spear thrower", [11,344,96,123], [112,345,128,120], [248,394,200,29], [466,354,84,110]),
    "crystal": ("Crystal Staff", [574,345,90,124], [683,348,107,118], [803,393,41,33], [1017,357,88,108]),
    "cacao": ("Staff Of Cacao Smoke", [1137,347,83,121], [1236,345,92,119], [1338,383,65,44], [1567,363,93,90]),
    "drum": ("Drums OF My Calling", [13,587,94,108], [117,588,117,107], [240,617,34,57], [459,587,89,106]),
    "claw": ("Jaguar Spirit Claw", [576,584,89,115], [684,582,105,112], [803,598,56,89], [1012,592,96,102]),
    "feather": ("Kukulkan Feather Cast", [1127,586,90,110], [1230,584,97,112], [1338,590,54,102], [1575,590,83,108]),
    "obsidian": ("Obsidian Spirit Shards", [12,820,75,103], [115,819,124,107], [248,849,86,47], [500,815,99,110]),
    "cohune": ("Cohune Bomb Launcher", [635,816,85,108], [744,819,157,107], [916,842,102,67], [1191,859,49,47]),
}
POWERS = {
    "badman": ("Badman/Badman.png", [54,275,129,116]),
    "nuke": ("Big Bomb/Nuke.png", [39,318,145,148]),
    "bonusXP": ("Bonus XP/Bonus XP.png", [35,295,181,193]),
    "doubleXP": ("Double XP/Double Xp.png", [42,270,202,200]),
    "freeze": ("Freeze/Freeze.png", [51,274,122,129]),
    "heavy": ("Heavy Bullets/Heavy Bullets.png", [51,294,155,150]),
    "shield": ("Sheild/Shield.png", [47,308,158,158]),
    "shock": ("Shock/Shock.png", [48,342,126,130]),
    "evolution": ("Weapon Power Up/Weapon Power Up.png", [50,235,164,158]),
}
HELD_ANGLES = {"slingshot": -.2, "bow": 0, "dart": -.72, "spear": -.57, "crystal": -.74, "cacao": -.92, "drum": 0, "claw": 0, "feather": -.93, "obsidian": -.49, "cohune": -.32, "staff": -1.5707963267948966}
PROJECTILE_ANGLES = {"feather": -.5, "obsidian": -.24}
manifest = {"version": 1, "weapons": {}, "powers": {}, "sprites": {}, "arenas": {}, "exports": []}


def crop(source, rect, matte=False):
    image = Image.open(source).convert("RGBA")
    x, y, w, h = rect
    assert w > 0 and h > 0 and 0 <= x <= image.width-w and 0 <= y <= image.height-h, (source, rect, image.size)
    image = image.crop((x, y, x+w, y+h))
    if matte:
        # Keep enclosed dark outlines; only connected background pixels become clear.
        pixels = image.load()
        visited = set()
        pending = deque([(x, y) for x in range(w) for y in (0, h-1)] + [(x, y) for y in range(h) for x in (0, w-1)])
        while pending:
            x, y = pending.popleft()
            if (x,y) in visited or not 0 <= x < w or not 0 <= y < h:
                continue
            visited.add((x,y))
            r,g,b,a = pixels[x,y]
            if max(r,g,b) > 48:
                continue
            pixels[x,y] = (r,g,b,0)
            pending.extend(((x-1,y), (x+1,y), (x,y-1), (x,y+1)))
    assert image.getchannel("A").getbbox(), (source, rect)
    return image


def fit(image, size):
    scale = min(size[0]/image.width, size[1]/image.height)
    image = image.resize((max(1,round(image.width*scale)), max(1,round(image.height*scale))), Image.Resampling.LANCZOS)
    result = Image.new("RGBA", size)
    result.alpha_composite(image, ((size[0]-image.width)//2, (size[1]-image.height)//2))
    return result


def export(folder, category, asset_id, name, source, rect, size, matte=False):
    native = crop(source, rect, matte)
    full = folder / "Game Ready" / "Full Resolution" / (name + ".png")
    game = folder / "Game Ready" / "Game Resolution" / (name + ".png")
    hires = game.with_name(name + "@2x.png")
    runtime = READY / category / asset_id / (name + ".png")
    for file in (full, game, hires, runtime):
        file.parent.mkdir(parents=True, exist_ok=True)
    native.save(full, optimize=True)
    fit(native, size).save(game, optimize=True)
    fit(native, (size[0]*2, size[1]*2)).save(hires, optimize=True)
    shutil.copyfile(hires, runtime)
    record = {
        "id": asset_id, "role": name,
        "source": str(source.relative_to(BUILD.parent)).replace("\\", "/"),
        "sourceRect": rect, "nativeSize": list(native.size), "displaySize": list(size),
        "fullResolution": str(full.relative_to(BUILD.parent)).replace("\\", "/"),
        "gameResolution": str(game.relative_to(BUILD.parent)).replace("\\", "/"),
        "file": str(runtime.relative_to(BUILD / "assets")).replace("\\", "/"),
        "sha256": sha256(runtime.read_bytes()).hexdigest(),
    }
    manifest["exports"].append(record)
    return record["file"]


for asset_id, (directory, *rects) in WEAPONS.items():
    folder = SOURCE / "Weapons" / directory
    art = {"heldAngle": HELD_ANGLES[asset_id], "projectileAngle": PROJECTILE_ANGLES.get(asset_id,0)}
    for name, rect, size in zip(("pickup", "held", "projectile", "impact"), rects, ((48,48),(64,64),(32,24),(96,96))):
        art[name] = export(folder, "weapons", asset_id, name, ATLAS, rect, size)
    manifest["weapons"][asset_id] = art

folder = SOURCE / "Weapons" / "Duende Staff"
design = folder / "Duende Staff Design Concept.png"
projectiles = folder / "Duende Staff projectile fram.png"
manifest["weapons"]["staff"] = {
    "heldAngle": HELD_ANGLES["staff"],
    "projectileAngle": 0,
    "pickup": export(folder, "weapons", "staff", "pickup", design, [742,207,164,154], (48,48), True),
    "held": export(folder, "weapons", "staff", "held", design, [22,153,164,670], (64,64), True),
    "projectile": export(folder, "weapons", "staff", "projectile", projectiles, [352,213,140,87], (32,24), True),
    "impact": export(folder, "weapons", "staff", "impact", projectiles, [288,1062,144,133], (96,96), True),
}

# The dedicated Cohune board has separate explosions, instead of a drum-like pulse.
folder = SOURCE / "Weapons" / "Cohune Bomb Launcher"
source = folder / "Cohune Bomb Launcher Sprite Sheet-4.png"
manifest["weapons"]["cohune"]["impactFrames"] = [
    export(folder, "weapons", "cohune", "explosion-"+str(i+1), source, rect, (128,128), True)
    for i, rect in enumerate(([611,419,210,161],[820,419,171,161],[994,419,178,160],[1187,439,175,141]))
]

for asset_id, (file, rect) in POWERS.items():
    source = SOURCE / "Pickups" / "Power Ups" / file
    manifest["powers"][asset_id] = {"pickup": export(source.parent, "powers", asset_id, "pickup", source, rect, (48,48), True)}

source = SOURCE / "Pickups" / "Power Ups" / "Sheild" / "Shield.png"
manifest["powers"]["shield"]["bubbleFrames"] = [
    export(source.parent, "powers", "shield", "bubble-"+str(i+1), source, [x,650,112,135], (128,128), True)
    for i, x in enumerate((27,145,263,387,510,645))
]
source = SOURCE / "Pickups" / "Power Ups" / "Shock" / "Shock.png"
manifest["powers"]["shock"]["bolt"] = export(source.parent, "powers", "shock", "bolt", source, [585,980,112,175], (48,96), True)
source = SOURCE / "Pickups" / "Power Ups" / "Heavy Bullets" / "Heavy Bullets.png"
manifest["powers"]["heavy"]["projectile"] = export(source.parent, "powers", "heavy", "projectile", source, [211,575,220,145], (64,32), True)

sprites = json.loads(re.search(r"window.ARENA_SPRITES = (\{.*?\});", (BUILD / "assets" / "sprites.js").read_text()).group(1))
for asset_id, art in sprites.items():
    original = next((p for p in SOURCE.rglob("*.png") if p.name.lower() == art["file"].lower() and "Game Ready" not in p.parts), None)
    if asset_id == "joe":
        original = SOURCE / "Main Character" / "Teenage-Joe-Sprite-Slingshot.png"
    if original is None:
        original = BUILD / "assets" / art["file"]
        directory = SOURCE / "Mobs" / "Betas" / ("Tommy Goff" if asset_id == "tommy" else "Mini Llorona")
        directory.mkdir(parents=True, exist_ok=True)
        source_copy = directory / art["file"]
        if not source_copy.exists():
            shutil.copyfile(original, source_copy)
        original = source_copy
    else:
        directory = original.parent if asset_id in ("tommy", "miniLlorona") else original.parent / ("Joe Grind" if asset_id == "joe" else asset_id)
    frames = [export(directory, "sprites", asset_id, "frame-"+str(i+1).zfill(2), original, rect, (112,112)) for i, rect in enumerate(art["frames"])]
    pivots = []
    for i, (x,y,w,h) in enumerate(art["frames"]):
        scale = min(112/w,112/h)
        anchor = art["anchors"][i]-x if art.get("anchors") else w/2
        pivots.append([round((112-round(w*scale))//2 + anchor*scale,2), round((112-round(h*scale))//2 + h*scale,2)])
    manifest["sprites"][asset_id] = {"frames": frames, "pivots": pivots, "frameSize": [112,112]}
    full = directory / "Game Ready" / "Full Resolution"
    shutil.copyfile(original, full / "source-sheet.png")
    (directory / "Game Ready" / "frames.json").write_text(json.dumps({"sourceSize":list(Image.open(original).size), "sourceFrames":art["frames"], "gamePivots":pivots, "gameFrameSize":[112,112]},indent=2)+"\n", encoding="utf-8")
    if art.get("portrait"):
        manifest["sprites"][asset_id]["portrait"] = export(directory, "sprites", asset_id, "portrait", original, art["portrait"], (64,64))

for asset_id, name in {"canyon":"Ancient Forest Canyon Arena.png", "coast":"Hopkins Beach Concept.png", "maya":"Maya Arena Concept.png", "underworld":"Underworld Corrupted Maya Arena Concept.png"}.items():
    source = SOURCE / "Arenas" / name
    image = Image.open(source)
    folder = source.parent / asset_id / "Game Ready"
    for subfolder in ("Full Resolution", "Game Resolution"):
        (folder / subfolder).mkdir(parents=True, exist_ok=True)
    shutil.copyfile(source, folder / "Full Resolution" / "arena.png")
    image.resize((1200,1200), Image.Resampling.LANCZOS).save(folder / "Game Resolution" / "arena.png", optimize=True)
    manifest["arenas"][asset_id] = {"nativeSize": list(image.size), "gameSize": [1200,1200], "liveFile": None if asset_id == "maya" else asset_id+"-arena.png"}

inventory = []
for source in sorted(SOURCE.rglob("*.png")):
    if "Game Ready" in source.parts:
        continue
    image = Image.open(source)
    inventory.append({"file": str(source.relative_to(SOURCE)).replace("\\", "/"), "size": list(image.size), "mode": image.mode, "sha256": sha256(source.read_bytes()).hexdigest()})
manifest["sourceInventory"] = inventory
manifest["missing"] = ["Reflex Boost pickup art", "Food pickups", "Arena hazards", "Enemy spawn effects", "Perk icons", "Mobile control artwork", "Full directional held-weapon animations matching canonical teenage Joe"]
READY.mkdir(parents=True, exist_ok=True)
(READY / "manifest.json").write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")
client = {key: manifest[key] for key in ("version", "weapons", "powers", "sprites", "arenas")}
(BUILD / "assets" / "ready-assets.js").write_text("// Generated by tools/export-assets.py; paths point to separate transparent sprites.\nwindow.ARENA_READY = " + json.dumps(client, separators=(",", ":")) + ";\n", encoding="utf-8")

# Boundaries, alpha, and source hashes catch blank crops and accidental source edits.
for record in manifest["exports"]:
    runtime = BUILD / "assets" / record["file"]
    image = Image.open(runtime)
    assert image.mode == "RGBA" and image.getchannel("A").getbbox(), record["file"]
    assert image.size == tuple(n*2 for n in record["displaySize"]), record["file"]
for item in inventory:
    assert sha256((SOURCE / item["file"]).read_bytes()).hexdigest() == item["sha256"]
for folder in sorted(SOURCE.rglob("Game Ready")):
    records = [record for record in manifest["exports"] if record["fullResolution"].startswith(str(folder.relative_to(BUILD.parent)).replace("\\", "/")+"/")]
    text = "Game-ready exports\n\nFull Resolution preserves source pixels in reviewed art-only crops.\nGame Resolution contains display-size sprites and @2x phone rendering variants.\nOriginal art is unchanged. The export manifest records exact source rectangles and SHA-256 hashes.\nRebuild with Python + Pillow: python Build/tools/export-assets.py\n\n"
    if records:
        text += "Sources:\n" + "\n".join(sorted({record["source"] for record in records})) + "\n\n"
        text += "Exports:\n" + "\n".join(record["role"]+" — native "+"x".join(map(str,record["nativeSize"]))+"; game "+"x".join(map(str,record["displaySize"])) for record in records) + "\n"
    elif "Arenas" in folder.parts:
        text += "Arena exports: original 1254x1254 scene; runtime derivative 1200x1200. Upscaling does not add source detail.\n"
    else:
        text += "Previous review exports; the current runtime manifest does not reference this folder.\n"
    (folder / "README.txt").write_text(text, encoding="utf-8")
print(f"Verified {len(manifest['exports'])} transparent/runtime exports from {len(inventory)} untouched source PNGs. Reflex Boost remains explicitly missing.")

window.ARENA_SPRITES = {"joe":{"file":"teenage-joe.png","frames":[[134,41,154,236],[384,35,145,253],[627,35,147,259],[886,51,145,243],[1128,59,194,235],[127,319,116,249],[380,318,146,244],[620,319,156,239],[863,329,199,230],[1118,336,193,227],[149,590,116,238],[384,589,152,234],[621,589,149,234],[866,595,193,235],[1122,600,194,235],[129,850,154,229],[383,844,145,245],[623,843,144,246],[876,851,146,228],[1138,852,184,227]],"anchors":[210,455,704,957,1200,195,450,690,931,1187,210,458,699,954,1210,208,457,704,954,1211],"portrait":[151,34,135,140]},"minijaguar":{"file":"mini-jaguar.png","frames":[[22,4,165,162],[214,18,202,148],[426,4,198,162],[642,4,186,162],[846,4,197,162],[1054,47,202,119]]},"crab":{"file":"cave-crab-v1.png","frames":[[15,46,101,62],[144,46,102,62],[273,46,96,65],[23,137,98,90],[157,154,72,71],[276,174,85,51]]},"shadow":{"file":"cave-shadow-v1.png","frames":[[35,17,70,105],[156,20,75,101],[279,26,77,96],[25,145,109,95],[162,158,66,82],[269,187,96,56]]},"duende":{"file":"duende-v1.png","frames":[[25,175,342,440]]},"jaguarBoss":{"file":"jaguar-spirit.png","frames":[[24,77,311,344],[426,165,389,255],[879,169,356,250],[1307,84,454,326],[31,559,410,252],[463,469,388,361],[897,527,336,280],[1303,537,439,274]]},"tommy":{"file":"tommy-goff-v2.png","frames":[[38,252,243,291],[304,328,394,185],[701,350,407,178],[1148,257,321,282],[1487,233,258,301],[1784,419,353,128]]},"miniLlorona":{"file":"llorona.png","frames":[[24,46,107,149],[160,26,102,168],[294,32,110,162],[433,32,104,163],[29,230,102,154],[148,228,126,156],[298,228,105,156],[440,228,102,156]]}};

// Crop coordinates use the original sheet grid; mobile CDNs may deliver smaller images.
window.ArenaArt = {
  playerHeightRatio: 30 / 320,
  sourceSizes: {"cave-crab-v1.png":[384,256],"cave-shadow-v1.png":[384,256],"duende-v1.png":[2172,724],"jaguar-spirit.png":[1774,887],"limestone-ruins.png":[1659,948],"llorona.png":[577,433],"mini-jaguar.png":[1260,170],"teenage-joe.png":[1402,1122],"tommy-goff-v2.png":[2172,724],"weapon-sheet.png":[1672,941],"powers/badman.png":[1254,1254],"powers/bonusXP.png":[1254,1254],"powers/doubleXP.png":[1254,1254],"powers/evolution.png":[1254,1254],"powers/freeze.png":[1254,1254],"powers/heavy.png":[1254,1254],"powers/nuke.png":[1254,1254],"powers/shield.png":[1254,1254],"powers/shock.png":[1254,1254]},
  sourceGrid(image, file) {
    const size = this.sourceSizes[file];
    if (!size || image.naturalWidth === size[0] && image.naturalHeight === size[1]) return image;
    const sheet = document.createElement('canvas'); sheet.width = size[0]; sheet.height = size[1];
    const context = sheet.getContext('2d'); context.imageSmoothingEnabled = true; context.imageSmoothingQuality = 'high';
    context.drawImage(image, 0, 0, sheet.width, sheet.height);
    return sheet;
  }
};

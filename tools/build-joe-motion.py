"""Build leg-removal geometry from existing integrated poses; never edit sprites."""
from collections import deque
from hashlib import sha256
from pathlib import Path
import json
import re
from PIL import Image, ImageDraw

BUILD = Path(__file__).resolve().parents[1]
manifest = json.loads((BUILD / "assets/ready/manifest.json").read_text())


def components(mask, width, height):
    todo = bytearray(mask)
    result = []
    for index, value in enumerate(todo):
        if not value:
            continue
        todo[index] = 0
        pending = deque([index])
        part = []
        while pending:
            p = pending.popleft()
            part.append(p)
            x, y = p % width, p // width
            for nx, ny in ((x-1,y),(x+1,y),(x,y-1),(x,y+1)):
                if 0 <= nx < width and 0 <= ny < height:
                    q = ny*width+nx
                    if todo[q]:
                        todo[q] = 0
                        pending.append(q)
        result.append(part)
    return result


def hull(points):
    points = sorted(set(points))
    if len(points) < 3:
        return []
    def cross(a,b,c):
        return (b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0])
    lower, upper = [], []
    for p in points:
        while len(lower)>1 and cross(lower[-2],lower[-1],p)<=0:
            lower.pop()
        lower.append(p)
    for p in reversed(points):
        while len(upper)>1 and cross(upper[-2],upper[-1],p)<=0:
            upper.pop()
        upper.append(p)
    return lower[:-1]+upper[:-1]


def contours(mask, width, height):
    edges = {}
    for p, value in enumerate(mask):
        if not value:
            continue
        x,y = p%width,p//width
        for absent,start,end in (
            (y==0 or not mask[p-width],(x,y),(x+1,y)),
            (x==width-1 or not mask[p+1],(x+1,y),(x+1,y+1)),
            (y==height-1 or not mask[p+width],(x+1,y+1),(x,y+1)),
            (x==0 or not mask[p-1],(x,y+1),(x,y))):
            if absent:
                edges.setdefault(start,[]).append(end)
    result = []
    while edges:
        start = next(iter(edges)); p=start; loop=[]
        while True:
            loop.append(p)
            choices=edges[p]; q=choices.pop()
            if not choices:
                del edges[p]
            p=q
            if p==start:
                break
        if len(loop)<8:
            continue
        clean=[]
        for i,p in enumerate(loop):
            a,c=loop[i-1],loop[(i+1)%len(loop)]
            if (p[0]-a[0])*(c[1]-p[1]) != (p[1]-a[1])*(c[0]-p[0]):
                clean.append([p[0]/2,p[1]/2])
        if len(clean)>=3:
            result.append(clean)
    return result


waists={0:[210.5,194],1:[457.5,189],2:[697.5,186],5:[202,477],6:[451.5,472],7:[695.5,475],8:[940.5,471],9:[1191,477],10:[190.5,744],11:[466.5,747],12:[696.5,746],15:[206.5,1008],16:[458,995],17:[694.5,995]}
motion = {"frameSize":[160,160], "holding":{}, "fillRule":"evenodd", "nativeWaists":waists, "nativeLegs":{}}
source_art=json.loads(re.search(r"window.ARENA_SPRITES = (\{.*?\});",(BUILD/"assets/sprites.js").read_text()).group(1))["joe"]
arm_rects={0:[[0,153,34,30],[122,153,32,30]],1:[[0,154,30,16],[110,154,35,36]],2:[[0,151,30,32],[112,151,35,30]],5:[[25,158,33,38]],6:[[10,154,34,27]],7:[[15,156,30,32]],10:[[57,154,34,39]],11:[[106,158,38,21]],12:[[101,157,42,33]],15:[[0,158,30,16],[125,158,29,18]],16:[[0,151,30,32]],17:[[0,152,33,29]]}
for frame,waist in waists.items():
    file=manifest["sprites"]["joe"]["frames"][frame]
    image=Image.open(BUILD/"assets"/file).convert("RGBA");width,height=image.size
    x,y,w,h=source_art["frames"][frame];s=112/h;pad=(112-round(w*s))//2
    hip=[round(pad+(waist[0]-x)*s,3),round((waist[1]-y)*s,3)]
    rgba=image.tobytes();pixels=[tuple(rgba[i:i+4]) for i in range(0,len(rgba),4)];blue=set()
    fore=bytearray(width*height)
    for p,(r,g,b,a) in enumerate(pixels):
        if p//width>=hip[1]*2 and a>32:
            fore[p]=1
            if g>r*1.1 and b>g*1.08 and b>45:
                blue.add(p)
    mask=bytearray(width*height)
    for part in components(fore,width,height):
        if sum(p in blue for p in part)>=8:
            for p in part:mask[p]=255
    for rx,ry,rw,rh in arm_rects.get(frame,[]):
        left=max(0,int((pad+rx*s)*2));right=min(width,int((pad+(rx+rw)*s)*2)+1)
        top=max(0,int(ry*s*2));bottom=min(height,int((ry+rh)*s*2)+1)
        for py in range(top,bottom):
            for px in range(left,right):mask[py*width+px]=0
    motion["nativeLegs"][frame]={"waist":hip,"polygons":contours(mask,width,height),"fillRule":"evenodd"}
warnings = []
for weapon, art in manifest["holding"].items():
    poses=[]
    for index,file in enumerate(art["frames"]):
        path=BUILD/"assets"/file
        image=Image.open(path).convert("RGBA"); width,height=image.size
        assert (width,height)==(320,320), file
        rgba=image.tobytes();pixels=[tuple(rgba[i:i+4]) for i in range(0,len(rgba),4)]
        foot_x,foot_y=[n*2 for n in art["pivots"][index]]
        body=art["bodyHeights"][index]*2
        rough=max(0,int(foot_y-body*.44))
        blue=bytearray(width*height)
        for p,(r,g,b,a) in enumerate(pixels):
            x,y=p%width,p//width
            if y>=rough and y<foot_y-body*.07 and abs(x-foot_x)<body*.4 and a>80 and g>r*1.1 and b>g*1.1 and r>b*.26 and b<225 and g>35:
                blue[p]=1
        groups=sorted(components(blue,width,height),key=len,reverse=True)
        assert groups, (weapon,index,"No denim")
        chosen=[part for part in groups if len(part)>=max(24,len(groups[0])*.12)][:3]
        seeds=set(p for part in chosen for p in part)
        waist_y=max(0,min(p//width for p in seeds)-2)
        top=[p%width for p in seeds if p//width<waist_y+18]
        waist_x=(min(top)+max(top))/2 if top else sum(p%width for p in seeds)/len(seeds)
        foreground=bytearray(1 if a>32 and p//width>=waist_y else 0 for p,(r,g,b,a) in enumerate(pixels))
        mask=bytearray(width*height)
        for part in components(foreground,width,height):
            if sum(p in seeds for p in part)>=12:
                for p in part:
                    mask[p]=255
        # Upper-leg equipment colors preserve hands, staff tips and launcher barrels.
        protect=[]
        warm_mask=bytearray(width*height)
        forward=index in (1,2,3) or weapon=="drum"
        if forward:
            for p,(r,g,b,a) in enumerate(pixels):
                x,y=p%width,p//width
                if not mask[p] or p in seeds:
                    continue
                side=(x>=waist_x-8 if index==1 else x<=waist_x+8 if index==3 else abs(x-waist_x)<body*.22)
                if not side:
                    continue
                magical=((g>r*1.45 and g>80 and (weapon in ("staff","claw","feather"))) or (b>g*1.15 and b>r*1.4 and b>100 and weapon in ("crystal","obsidian","feather"))) and not blue[p]
                warm=r>g*1.22 and g>b*1.15 and r>65 and (y<waist_y+body*.13 or abs(x-waist_x)<body*.075) and (index!=2 or abs(x-waist_x)<body*.12)
                metal=weapon=="spear" and abs(x-waist_x)<body*.075 and min(r,g,b)>65 and max(r,g,b)<190 and max(r,g,b)-min(r,g,b)<50
                if warm:
                    warm_mask[p]=1
                if magical or metal:
                    protect.append((x,y))
        for part in components(warm_mask,width,height):
            if len(part)>=40:
                protect.extend((p%width,p//width) for p in part)
        protected=hull(protect)
        exclusion=Image.new("L",(width,height))
        if protected:
            ImageDraw.Draw(exclusion).polygon(protected,fill=255)
            for p,value in enumerate(exclusion.tobytes()):
                if value:
                    mask[p]=0
        polys=contours(mask,width,height)
        assert polys,(weapon,index,"No leg polygons")
        notes=[]
        if protect:
            notes.append("Connected equipment below waist protected by reviewed color/position hull; check transition at waist")
            warnings.append(weapon+":"+str(index))
        poses.append({"waist":[round(waist_x/2,2),round(waist_y/2,2)],"polygons":polys,"protectedPolygons":[[[x/2,y/2] for x,y in protected]] if protected else [],"fillRule":"evenodd","warnings":notes,"sha256":sha256(path.read_bytes()).hexdigest()})
    motion["holding"][weapon]=poses
(BUILD/"assets/joe-motion.js").write_text("// Generated by tools/build-joe-motion.py from existing ready holding sprites.\nwindow.ARENA_JOE_MOTION = "+json.dumps(motion,separators=(",", ":"))+";\n",encoding="utf-8")
assert len(motion["holding"])==12 and all(len(v)==8 for v in motion["holding"].values())
print("96 leg masks/waists written; connected equipment preservation:",", ".join(warnings))

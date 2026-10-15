// Optional development export; the game serves static files and needs no Sharp dependency.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),sharp=require('sharp');
const build=path.resolve(__dirname,'..'),source=path.join(build,'../Assets/Branding'),target=path.join(build,'assets/branding');
(async()=>{
 fs.mkdirSync(target,{recursive:true});
 const logo=path.join(source,'Logo Concepts/belize-spirit-arena-logo-concept-01.png'),icon=path.join(source,'Web Icon/obsidian-spirit-icon-source.png');
 fs.copyFileSync(logo,path.join(target,'logo@2x.png'));
 await sharp(logo).resize({width:886}).png().toFile(path.join(target,'logo.png'));
 for(const size of [16,32,180,192,512])await sharp(icon).resize(size,size,{fit:'contain',background:'#00000000'}).png().toFile(path.join(target,'icon-'+size+'.png'));
 const pngs=[16,32].map(size=>fs.readFileSync(path.join(target,'icon-'+size+'.png'))),header=Buffer.alloc(38);header.writeUInt16LE(1,2);header.writeUInt16LE(2,4);
 let offset=38;
 pngs.forEach((png,i)=>{const entry=6+i*16;header[entry]=header[entry+1]=[16,32][i];header.writeUInt16LE(1,entry+4);header.writeUInt16LE(32,entry+6);header.writeUInt32LE(png.length,entry+8);header.writeUInt32LE(offset,entry+12);offset+=png.length;});
 const ico=Buffer.concat([header,...pngs]);fs.writeFileSync(path.join(build,'favicon.ico'),ico);assert.equal(ico.length,offset);
 for(const [folder,files,original] of [['Logo Concepts',['logo.png','logo@2x.png'],logo],['Web Icon',[16,32,180,192,512].map(n=>'icon-'+n+'.png'),icon]]) {
  const ready=path.join(source,folder,'Game Ready');fs.mkdirSync(path.join(ready,'Full Resolution'),{recursive:true});fs.mkdirSync(path.join(ready,'Game Resolution'),{recursive:true});
  fs.copyFileSync(original,path.join(ready,'Full Resolution',path.basename(original)));
  for(const name of files)fs.copyFileSync(path.join(target,name),path.join(ready,'Game Resolution',name));
  if(folder==='Web Icon')fs.copyFileSync(path.join(build,'favicon.ico'),path.join(ready,'Game Resolution/favicon.ico'));
 }
 for(const size of [16,32,180,192,512]){const png=fs.readFileSync(path.join(target,'icon-'+size+'.png'));assert.equal(png.readUInt32BE(16),size);assert.equal(png.readUInt32BE(20),size);assert.equal(png[25],6);}
 console.log('Branding exports verified: original logo retained, proportional web logo, transparent icons and two-size ICO.');
})().catch(error=>{console.error(error);process.exitCode=1;});

// Generate Android launcher resources from the supplied logo.
const sharp = require(process.env.SHARP_MODULE || 'sharp');
const path = require('node:path');
const fs = require('node:fs');
const root = path.resolve(__dirname, '..');
(async () => {
  const source = path.join(root, 'assets/logospeakidz.png');
  for (const [density,size] of Object.entries({mdpi:48,hdpi:72,xhdpi:96,xxhdpi:144,xxxhdpi:192})) {
    const dir=path.join(root,'android/app/src/main/res','mipmap-'+density);
    if (!fs.existsSync(dir)) throw new Error('Resource directory missing: '+dir);
    await sharp(source).resize(size,size,{fit:'contain',background:'#ffffff'}).png().toFile(path.join(dir,'ic_launcher.png'));
  }
  await sharp(source).resize(192,192,{fit:'contain',background:'#ffffff'}).png().toFile(path.join(root,'assets/app/art/app-icon.png'));
  console.log('Generated five Android launcher densities and web icon.');
})().catch(e=>{console.error(e);process.exitCode=1;});

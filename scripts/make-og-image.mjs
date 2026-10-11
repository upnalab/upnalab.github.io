// Generates public/og-default.png (1200×630): the UPNALAB logo centred on the brand dark background.
// Run with `npm run og` whenever the logo changes. Output is committed, so this is not part of the build.
import sharp from 'sharp';

const WIDTH = 1200;
const HEIGHT = 630;
const LOGO = 'src/assets/images/site/upnalab_header_logo.png';
const OUT = 'public/og-default.png';

const logo = await sharp(LOGO)
  .resize({ width: 760, fit: 'inside', withoutEnlargement: false })
  .toBuffer();
const { width: lw, height: lh } = await sharp(logo).metadata();

const tagline = Buffer.from(`
<svg width="${WIDTH}" height="${HEIGHT}" xmlns="http://www.w3.org/2000/svg">
  <text x="${WIDTH / 2}" y="${HEIGHT / 2 + lh / 2 + 70}" text-anchor="middle"
        font-family="Inter, Helvetica, Arial, sans-serif" font-size="30" fill="#cbd5e1" font-weight="500">
    Interactive devices · Universidad Pública de Navarra
  </text>
</svg>`);

await sharp({
  create: { width: WIDTH, height: HEIGHT, channels: 4, background: '#0f172a' },
})
  .composite([
    { input: logo, left: Math.round((WIDTH - lw) / 2), top: Math.round((HEIGHT - lh) / 2 - 30) },
    { input: tagline, left: 0, top: 0 },
  ])
  .png({ compressionLevel: 9 })
  .toFile(OUT);

console.log(`Wrote ${OUT} (${WIDTH}×${HEIGHT})`);

// Convierte las imágenes de public/casos (y subcarpetas) a WebP de alta calidad.
// Uso: npm run images
import sharp from 'sharp';
import { readdir, stat } from 'node:fs/promises';
import path from 'node:path';

const DIR = path.resolve('public/casos');
// Ancho máximo: 2x el tamaño mostrado, nítido en pantallas retina.
const MAX_WIDTH = 1860;
const QUALITY = 92;

// Recorre carpeta + subcarpetas, junta PNG/JPG.
async function walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const out = [];
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...(await walk(full)));
    else if (/\.(png|jpe?g)$/i.test(e.name)) out.push(full);
  }
  return out;
}

const sources = await walk(DIR);

if (sources.length === 0) {
  console.log('No hay PNG/JPG que convertir en public/casos');
  process.exit(0);
}

for (const input of sources) {
  const output = input.replace(/\.(png|jpe?g)$/i, '.webp');
  const img = sharp(input);
  const meta = await img.metadata();
  const width = Math.min(meta.width ?? MAX_WIDTH, MAX_WIDTH);

  await img
    .resize({ width, withoutEnlargement: true })
    .webp({ quality: QUALITY, smartSubsample: true, effort: 6 })
    .toFile(output);

  const { size } = await stat(output);
  console.log(`${path.relative(DIR, input)} -> ${path.basename(output)} (${Math.round(size / 1024)} KB, ${width}px)`);
}

import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

const uiDir = path.resolve('public', 'generated', 'ui');
const oldDir = path.resolve('public', 'generated', 'animations');

if (!fs.existsSync(uiDir)) {
  fs.mkdirSync(uiDir, { recursive: true });
}

// 4 reused ones
const conversions = [
  { src: path.join(oldDir, 'gold-dust-scatter.png'), dst: 'gold-dust.webp' },
  { src: path.join(oldDir, 'gold-foil-texture.png'), dst: 'gold-foil.webp' },
  { src: path.join(oldDir, 'ivory-silk-texture.png'), dst: 'ivory-silk.webp' },
  { src: path.join(oldDir, 'home-hero.png'), dst: 'home-hero.webp' },
];

// 4 new ones
const artifactsDir = '/Users/workspace/.gemini/antigravity/brain/e9b5a6b4-7386-492e-a32e-8a69b5a2822e/';
const files = fs.readdirSync(artifactsDir);
const findLatest = (prefix) => {
  return files.filter(f => f.startsWith(prefix) && f.endsWith('.png')).sort().pop();
};

const newFiles = [
  { prefix: 'gold_radial_glow', dst: 'gold-radial-glow.webp' },
  { prefix: 'light_leak', dst: 'light-leak.webp' },
  { prefix: 'black_marble', dst: 'black-marble.webp' },
  { prefix: 'empty_state', dst: 'empty-state.webp' },
];

newFiles.forEach(({ prefix, dst }) => {
  const file = findLatest(prefix);
  if (file) {
    conversions.push({ src: path.join(artifactsDir, file), dst });
  } else {
    console.error('Could not find', prefix);
  }
});

async function processFiles() {
  for (const { src, dst } of conversions) {
    if (fs.existsSync(src)) {
      console.log(`Converting ${src} to ${dst}`);
      await sharp(src)
        .webp({ quality: 80 })
        .toFile(path.join(uiDir, dst));
    } else {
      console.error('Missing source file:', src);
    }
  }
  console.log('Done converting to WebP');
}

processFiles();

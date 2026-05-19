import { GoogleGenAI } from '@google/genai';
import * as fs from 'node:fs';
import * as path from 'node:path';
import 'dotenv/config';

const outputDir = path.resolve('public', 'generated', 'animations');

// Ensure directories exist
const ensureDir = (dirPath) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
};
ensureDir(outputDir);

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// Helpers
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function generateImage(modelName, prompt, aspectRatio, filename, folder = outputDir) {
  const filePath = path.join(folder, filename);
  if (fs.existsSync(filePath)) {
    console.log(`[SKIP] ${filename} already exists.`);
    return;
  }

  console.log(`[GENERATING] ${filename} via ${modelName}...`);
  try {
    const response = await ai.models.generateContent({
      model: modelName,
      contents: prompt,
      config: {
        responseModalities: ['IMAGE'],
        responseFormat: {
          image: {
            aspectRatio: aspectRatio,
            imageSize: '1K'
          }
        }
      }
    });

    const part = response.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
    if (part && part.inlineData) {
      const buffer = Buffer.from(part.inlineData.data, 'base64');
      fs.writeFileSync(filePath, buffer);
      console.log(`[SUCCESS] Saved ${filename}`);
    } else {
      console.error(`[ERROR] No image data returned for ${filename}`);
    }
  } catch (error) {
    console.error(`[ERROR] Failed to generate ${filename}:`, error.message);
  }
}

// BATCH 1: Textures
const batch1 = [
  { name: 'gold-dust-scatter.png', aspect: '16:9', prompt: "Fine gold dust particles scattered across a pure deep black background (#0A0A0A). The particles vary in size from tiny pinpoints to small specks, distributed evenly but organically with subtle clustering. Metallic gold (#D4AF37) with a soft glow. Cinematic luxury perfume commercial aesthetic. Tileable texture. No text, no subject, no central focal point." },
  { name: 'gold-foil-texture.png', aspect: '1:1', prompt: "Tileable metallic gold foil texture, slightly worn and luxurious, with subtle scratches and depth variations. Color is a rich warm gold (#D4AF37 base with deeper amber and brighter highlights). Studio lit. No text, no subject." },
  { name: 'ivory-silk-texture.png', aspect: '16:9', prompt: "Soft draped ivory silk fabric texture, photographed in gentle diffused natural light. Subtle folds and shadows. The color is warm ivory (#FAF7F2). Luxurious and minimal. No text, no subject." },
  { name: 'black-marble-texture.png', aspect: '16:9', prompt: "Polished black marble surface texture, photographed top-down in studio lighting. Subtle gold veining runs through the marble. Reflective and luxurious. Dark and minimal. No text, no subject." },
  { name: 'light-leak-warm.png', aspect: '16:9', prompt: "A single soft warm golden light leak bleeding in from the right edge of a pure black frame. Like vintage film light leak. Diffuse, dreamy, cinematic. Gold and amber tones (#D4AF37 to #E8C77E). No text, no subject." },
  { name: 'radial-glow-gold.png', aspect: '1:1', prompt: "A soft radial glow of warm metallic gold light at the center of a deep black background, fading smoothly to pure black at the edges. Like candlelight in a dark perfume boutique. Pure abstract — no shapes, no objects. The center is brightest, fading outward. No text." },
  { name: 'radial-glow-ivory.png', aspect: '1:1', prompt: "A soft radial glow of warm ivory light at the center of a deep black background, fading smoothly to black at the edges. Like soft candlelight. Pure abstract — no shapes, no objects. No text." },
  { name: 'vignette-overlay.png', aspect: '16:9', prompt: "A pure black vignette overlay — completely transparent (or pure white) at the center, fading smoothly to pure black at all four edges. For use as a darkening overlay. No text, no subject, no objects." },
];

async function runBatch1() {
  console.log('--- Starting Batch 1: Textures ---');
  for (const asset of batch1) {
    await generateImage('gemini-2.5-flash-image', asset.prompt, asset.aspect, asset.name);
    await delay(3000); // Prevent rate limiting
  }
}

// BATCH 2: Sequences
const sequences = [
  {
    folder: 'mist-disperse',
    promptTemplate: (i, pct) => `Frame ${i} of 12 in a sequence: a soft puff of luminous golden mist drifting upward against a pure deep black background. In frame 1, the mist is concentrated at the bottom center. By frame 6 it has risen to the middle and started to disperse. By frame 12 it has nearly faded to transparent at the top. This is frame ${i}, so the mist should be at ${pct}% of its journey. Consistent camera angle, consistent particle density profile across the sequence. Metallic gold (#D4AF37) particles with soft glow. Luxury perfume commercial aesthetic. No text, no subject, no bottle.`,
  },
  {
    folder: 'gold-shimmer-sweep',
    promptTemplate: (i, pct) => `Frame ${i} of 12 in a sequence: a thin horizontal streak of brilliant metallic gold light traveling left-to-right across a pure deep black background. In this frame, the streak is at ${pct}% across the screen. The streak is sharp at its head with a soft glowing trail behind it. Consistent thickness and brightness across frames. Cinematic luxury aesthetic. No text, no subject.`,
  },
  {
    folder: 'gold-dust-drift',
    promptTemplate: (i, pct) => `Frame ${i} of 12 in a continuous loop: fine gold dust particles slowly drifting from the bottom-right to the upper-left across a pure deep black background. In this frame, the particles are at ${pct}% through their loop. The motion is subtle, dreamy, almost imperceptible. Sparse particles, not a swarm. Consistent particle size and density. Loops seamlessly back to frame 1. No text, no subject.`,
  }
];

async function runBatch2() {
  console.log('--- Starting Batch 2: Sequences ---');
  for (const seq of sequences) {
    const seqDir = path.join(outputDir, seq.folder);
    ensureDir(seqDir);
    for (let i = 1; i <= 12; i++) {
      const pct = Math.round((i / 12) * 100);
      const filename = `frame-${i.toString().padStart(2, '0')}.png`;
      await generateImage('gemini-2.5-flash-image', seq.promptTemplate(i, pct), '16:9', filename, seqDir);
      await delay(3000);
    }
  }
}

// BATCH 3: Heroes
const batch3 = [
  { name: 'home-hero.png', aspect: '16:9', prompt: "A single luxury perfume bottle made of dark amber glass with a polished gold cap, sitting on a polished black marble surface. Dramatic chiaroscuro lighting from the upper right casts deep shadows. Atmospheric gold dust hangs in the air. The background fades to pure black on the right two-thirds of the frame, leaving negative space for text. Tom Ford fragrance campaign aesthetic. Photorealistic, 4K, ultra-detailed. No text on bottle, no labels." },
  { name: 'home-hero-mobile.png', aspect: '3:4', prompt: "A single luxury perfume bottle made of dark amber glass with a polished gold cap, sitting on a polished black marble surface. Vertical composition. Dramatic chiaroscuro lighting. Atmospheric gold dust. Tom Ford fragrance campaign aesthetic. Photorealistic, 4K, ultra-detailed. No text." },
  { name: 'about-banner.png', aspect: '16:9', prompt: "A vintage perfume atelier — wooden shelves lined with amber glass bottles in soft warm candlelight. Dust motes drift in the air. A weathered leather notebook lies open on a dark walnut workbench. Cinematic, intimate, Old World luxury fragrance house aesthetic. Photorealistic, 4K. No text, no labels." },
  { name: 'shop-banner.png', aspect: '16:9', prompt: "An overhead flat-lay of seven luxury perfume bottles in different shapes and amber-gold tones, arranged loosely on a black marble surface with scattered rose petals and a few saffron threads. Dramatic golden rim lighting. Composition leaves negative space top-right. Editorial fragrance magazine aesthetic. Photorealistic, 4K. No text on any bottle, no labels." },
  { name: 'contact-banner.png', aspect: '16:9', prompt: "A close-up of an elegant gold-edged business card sitting on dark velvet beside a luxury perfume bottle blurred in the background. Warm chiaroscuro lighting. Sophisticated, minimal, Tom Ford boutique aesthetic. Photorealistic, 4K. No text on the card or bottle." },
  { name: 'order-confirmed-bg.png', aspect: '16:9', prompt: "Soft warm golden light radiating from an unseen source against a deep black background. Subtle gold dust particles. Like the glow inside a luxurious gift box being opened. Cinematic, celebratory but restrained. No text, no subject, no objects." },
];

async function runBatch3() {
  console.log('--- Starting Batch 3: Heroes ---');
  for (const asset of batch3) {
    await generateImage('gemini-3-pro-image-preview', asset.prompt, asset.aspect, asset.name);
    await delay(5000); // Pro model might need more delay
  }
}

// BATCH 4: UI States
const batch4 = [
  { name: 'loading-shimmer.png', aspect: '16:9', prompt: "A single horizontal gradient sweep going from transparent to soft warm gold (#D4AF37 at 30% opacity) and back to transparent, on a transparent background. Used for loading shimmer skeleton effects. Soft and subtle. No text, no subject." },
  { name: 'empty-cart.png', aspect: '1:1', prompt: "A minimalist illustration of an elegant empty crystal perfume bottle laying gently on its side on a soft ivory surface. Single subtle shadow. Editorial line-art style with a single gold accent. White background. Photographed-illustration hybrid aesthetic. No text." },
  { name: 'empty-orders.png', aspect: '1:1', prompt: "A minimalist illustration of an elegant empty fragrance gift box on a soft ivory surface, with a gold ribbon laid loosely beside it. Editorial line-art aesthetic with single gold accent. White background. No text." },
  { name: 'not-found-404.png', aspect: '16:9', prompt: "An elegant lost perfume bottle floating in a deep black void with a single beam of soft warm golden light illuminating it from above. Atmospheric, mysterious, cinematic. Tom Ford fragrance commercial aesthetic. No text, no labels." },
];

async function runBatch4() {
  console.log('--- Starting Batch 4: UI States ---');
  for (const asset of batch4) {
    await generateImage('gemini-2.5-flash-image', asset.prompt, asset.aspect, asset.name);
    await delay(3000);
  }
}

async function main() {
  const args = process.argv.slice(2);
  const runAll = args.length === 0 || args.includes('all');
  
  if (runAll || args.includes('batch1')) await runBatch1();
  if (runAll || args.includes('batch2')) await runBatch2();
  if (runAll || args.includes('batch3')) await runBatch3();
  if (runAll || args.includes('batch4')) await runBatch4();

  console.log('✨ All requested generations complete!');
}

main();

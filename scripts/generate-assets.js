import { GoogleGenAI } from '@google/genai';
import * as fs from 'node:fs';
import * as path from 'node:path';
import 'dotenv/config';

// Make sure output directory exists
const outputDir = path.resolve('public', 'assets', 'generated');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Initialize Nano Banana
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const assetsToGenerate = [
  {
    name: 'hero-bg.png',
    prompt: 'A stunning, high-fashion minimalist background for a luxury perfume website. Abstract gold waves merging with dark charcoal smoke. Highly cinematic, moody lighting, 8k resolution, photorealistic.',
    aspectRatio: '16:9'
  },
  {
    name: 'intro-frame-1.png',
    prompt: 'Cinematic storyboard frame for a luxury perfume commercial. A single drop of golden liquid falling in slow motion against a pitch-black background. Macro photography, high contrast, elegant.',
    aspectRatio: '16:9'
  },
  {
    name: 'particle-texture.png',
    prompt: 'A seamless texture of floating golden dust particles against a dark charcoal background. Bokeh effect, magical, luxurious, abstract.',
    aspectRatio: '16:9'
  }
];

async function generateAssets() {
  if (!process.env.GEMINI_API_KEY) {
    console.error('Error: GEMINI_API_KEY environment variable is not set.');
    console.error('Please create a .env file in the root directory and add your API key: GEMINI_API_KEY="your_api_key_here"');
    process.exit(1);
  }

  console.log('🍌 Starting Nano Banana Asset Generation...');

  for (const asset of assetsToGenerate) {
    const filePath = path.join(outputDir, asset.name);
    
    // Skip if it already exists to avoid unnecessary API calls
    if (fs.existsSync(filePath)) {
      console.log(`[SKIP] ${asset.name} already exists.`);
      continue;
    }

    console.log(`[GENERATING] ${asset.name}...`);
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3.1-flash-image-preview',
        contents: asset.prompt,
        config: {
          responseModalities: ['IMAGE'],
          responseFormat: {
            image: {
              aspectRatio: asset.aspectRatio,
              imageSize: '1K'
            }
          }
        }
      });

      const part = response.candidates[0].content.parts.find(p => p.inlineData);
      
      if (part && part.inlineData) {
        const base64Data = part.inlineData.data;
        const buffer = Buffer.from(base64Data, 'base64');
        fs.writeFileSync(filePath, buffer);
        console.log(`[SUCCESS] Saved to ${filePath}`);
      } else {
        console.error(`[ERROR] No image data returned for ${asset.name}`);
      }
    } catch (error) {
      console.error(`[ERROR] Failed to generate ${asset.name}:`, error.message);
    }
  }
  
  console.log('✨ Asset generation complete!');
}

generateAssets();

/*
IMPORTANT NOTICE: DO NOT REMOVE
This is a script that generates an image and saves it to the assets folder. 
You should not use this script unless the user EXPLICITLY asks you to generate an asset.
DO NOT PROACTIVELY GENERATE ASSETS FOR THE USER.

You will need to update the prompt and the options (2nd parameter of the generateImage function) depending on your use case.
options: {
  size?: "1024x1024" | "1536x1024" | "1024x1536" | "auto";
  quality?: "low" | "medium" | "high" | "auto";
  format?: "png" | "jpeg" | "webp";
  background?: undefined | "transparent";
}

If you need to generate many assets, REFACTOR THIS SCRIPT TO CONCURRENTLY GENERATE UP TO 3 ASSETS AT A TIME. If you do not, the bash tool may time out.
use npx tsx generate-asset-script.ts to run this script.
*/

import { generateImage } from './src/api/image-generation';
import * as fs from 'fs';
import * as path from 'path';
import { Readable } from 'stream';
import { finished } from 'stream/promises';

async function downloadImage(url: string, outputPath: string): Promise<void> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to download image: ${response.status} ${response.statusText}`);
  }
  
  const fileStream = fs.createWriteStream(outputPath);
  // @ts-ignore - Node.js types are not fully compatible with the fetch API
  await finished(Readable.fromWeb(response.body).pipe(fileStream));
  console.log(`Image downloaded successfully to ${outputPath}`);
}

async function generateAndSave(prompt: string, filename: string, options: any = {}): Promise<string> {
  console.log(`Generating image: ${filename} with prompt: ${prompt}`);
  
  const imageUrl = await generateImage(prompt, {
    size: "1024x1024",
    quality: "high",
    format: "png",
    ...options
  });
  
  console.log(`Image generated successfully for ${filename}. URL: ${imageUrl}`);
  
  const outputPath = path.join(__dirname, 'assets', filename);
  await downloadImage(imageUrl, outputPath);
  
  return imageUrl;
}

async function main() {
  try {
    // Create assets directory if it doesn't exist
    const assetsDir = path.join(__dirname, 'assets');
    if (!fs.existsSync(assetsDir)) {
      fs.mkdirSync(assetsDir, { recursive: true });
    }

    // Generate scene backgrounds for the new scenes
    const scenesToGenerate = [
      {
        prompt: "A simple cartoon town backdrop for a mobile pet game with colorful buildings, roads, and a clear blue sky. No characters, just the environment, suitable for a vertical mobile game.",
        filename: "town_background.png"
      },
      {
        prompt: "A cartoon park backdrop for a mobile pet game with green grass, trees, a small pond, and playground equipment. No characters, just the environment, suitable for a vertical mobile game.",
        filename: "park_background.png"
      },
      {
        prompt: "A cartoon city backdrop for a mobile pet game with tall buildings, skyscrapers, streets, and a cityscape horizon. No characters, just the environment, suitable for a vertical mobile game.",
        filename: "city_background.png"
      }
    ];
    
    // Generate scenes in batches to prevent timeout
    console.log("Generating scene backgrounds...");
    for (let i = 0; i < scenesToGenerate.length; i += 3) {
      const batch = scenesToGenerate.slice(i, i + 3);
      const promises = batch.map(scene => 
        generateAndSave(scene.prompt, scene.filename)
      );
      
      const results = await Promise.all(promises);
      console.log(`Generated batch ${i/3 + 1} successfully`);
      
      // Give a short break between batches if needed
      if (i + 3 < scenesToGenerate.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    console.log("All scene backgrounds generated successfully");
  } catch (error) {
    console.error("Error:", error);
  }
}

main();
/*
IMPORTANT NOTICE: DO NOT REMOVE
This is a custom asset generation service that uses a custom API endpoint maintained by Vibecode. If the user wants to build an app that generates images, assets, icons, or anything else, you must use this internal endpoint. Do not attempt to use replicate or chatgpt.
You may update this service, but you should not need to.
This endpoint uses openai's latest image generation API, AKA gpt4o, AKA gpt-image-1, so if the user is asking for that, this is the right service to use.
Does not support video and audio generation.
*/

// API endpoint configuration
const baseUrl = "https://api.vibecodeapp.com";
const endpoint = "/api/storage/generate-image";

/**
 * Generate an image using the custom API endpoint
 * @param prompt The text prompt to generate an image from
 * @param options Optional parameters for image generation
 * @returns URL of the generated image, usable to render in the app directly.
 */
export async function generateImage(
  prompt: string,
  options?: {
    size?: "1024x1024" | "1536x1024" | "1024x1536" | "auto";
    quality?: "low" | "medium" | "high" | "auto";
    format?: "png" | "jpeg" | "webp";
    background?: undefined | "transparent";
  },
): Promise<string> {
  try {
    // Create request body
    const requestBody = {
      projectId: process.env.EXPO_PUBLIC_PROJECT_ID,
      prompt,
      options: {
        ...options,
      },
    };

    // Make API request
    const response = await fetch(`${baseUrl}${endpoint}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("[AssetGenerationService] Error response:", errorData);
      throw new Error(`Image generation API error: ${response.status} ${JSON.stringify(errorData)}`);
    }

    const result = await response.json();
    console.log("[AssetGenerationService] Image generated successfully");

    // Return the image data from the response
    if (result.success && result.data) {
      return result.data.imageUrl as string;
    } else {
      console.error("[AssetGenerationService] Invalid response format:", result);
      throw new Error("Invalid response format from API");
    }
  } catch (error) {
    console.error("Image Generation Error:", error);
    throw error;
  }
}

/**
 * Generate a scene background image for game locations
 * @param scene The scene/location name
 * @returns URL of the generated scene image
 */
export async function generateSceneImage(scene: string): Promise<string> {
  let prompt = '';
  
  // Base prompts for each scene with very distinct visual characteristics
  switch(scene) {
    case 'warehouse':
      prompt = "A detailed cryptocurrency mining warehouse interior with rows of blue-lit server racks, glowing computer screens, cooling systems with visible fans, and dim ambient lighting filtering through server aisles. High-tech digital aesthetic with cables, LED indicators, and control panels. Industrial ceiling with exposed ducts and pipes. Temperature monitoring displays visible. Synthetic materials and hard surfaces. Wide view with depth perspective. Very distinct from outdoor or town settings.";
      break;
    case 'park':
      prompt = "A vibrant sunny park with lush green grass, cherry blossom trees in bloom, colorful flower beds, winding stone walking paths, and wooden benches. Peaceful natural setting with bright blue sky, fluffy white clouds, and a small pond with lily pads. Families picnicking on checkered blankets. Children playing with kites. Clearly an outdoor setting with no buildings or urban elements. Golden sunlight creating dappled shadows on the ground.";
      break;
    case 'town':
      prompt = "A charming small European town scene with quaint pastel-colored buildings, shops with striped awnings, cobblestone streets, a central fountain square, and hanging flower baskets. Warm, inviting atmosphere with soft afternoon lighting creating long shadows. Street cafés with outdoor seating, small boutique shops, and old-fashioned street lamps. The buildings have distinct architectural details: timber frames, ornate balconies, and slate roofs. Completely different from the digital warehouse or modern city environments.";
      break;
    case 'city':
      prompt = "A futuristic city skyline at dusk with gleaming skyscrapers featuring geometric patterns, digital billboards displaying cryptocurrency symbols, busy multi-level streets with flying vehicles, and tech-focused architecture with glass and chrome materials. Neon lighting in purple and blue tones, holographic advertisements, and floating transportation pods. Modern urban environment with no natural elements. Office workers in business attire. Strong contrast to the park's natural setting or the town's historical aesthetic.";
      break;
    default:
      prompt = `A highly detailed and unique scenic background for a ${scene} location in a virtual pet game. Distinctive environment with specific atmospheric elements that make it clearly different from other locations.`;
  }
  
  return await generateImage(prompt, {
    size: "1536x1024", // Landscape for backgrounds
    quality: "high",
    format: "png"
  });
}

/**
 * Convert aspect ratio to size format
 * @param aspectRatio The aspect ratio to convert
 * @returns The corresponding size format
 */
export function convertAspectRatioToSize(aspectRatio: string): "1024x1024" | "1536x1024" | "1024x1536" | "auto" {
  switch (aspectRatio) {
    case "1:1":
      return "1024x1024";
    case "3:2":
      return "1536x1024";
    case "2:3":
      return "1024x1536";
    default:
      return "auto";
  }
}

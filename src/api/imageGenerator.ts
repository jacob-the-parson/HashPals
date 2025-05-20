/*
This file manages image generation for shop items using GPT-4o (gpt-image)
It includes caching to avoid regenerating the same images repeatedly
*/
import { generateImage } from './image-generation';

// This will store our generated images for caching
const imageCache: Record<string, string> = {};

// Default placeholder image to show while loading
const PLACEHOLDER_IMAGE = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGQAAABkCAYAAABw4pVUAAAACXBIWXMAAAsTAAALEwEAmpwYAAAGwmlUWHRYTUw6Y29tLmFkb2JlLnhtcAAAAAAAPD94cGFja2V0IGJlZ2luPSLvu78iIGlkPSJXNU0wTXBDZWhpSHpyZVN6TlRjemtjOWQiPz4gPHg6eG1wbWV0YSB4bWxuczp4PSJhZG9iZTpuczptZXRhLyIgeDp4bXB0az0iQWRvYmUgWE1QIENvcmUgNy4xLWMwMDAgNzkuZGFiYWNiYiwgMjAyMS8wNC8xNC0wMDozOTo0NCAgICAgICAgIj4gPHJkZjpSREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj4gPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9IiIgeG1sbnM6eG1wPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvIiB4bWxuczpkYz0iaHR0cDovL3B1cmwub3JnL2RjL2VsZW1lbnRzLzEuMS8iIHhtbG5zOnBob3Rvc2hvcD0iaHR0cDovL25zLmFkb2JlLmNvbS9waG90b3Nob3AvMS4wLyIgeG1sbnM6eG1wTU09Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9tbS8iIHhtbG5zOnN0RXZ0PSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvc1R5cGUvUmVzb3VyY2VFdmVudCMiIHhtcDpDcmVhdG9yVG9vbD0iQWRvYmUgUGhvdG9zaG9wIDIyLjQgKFdpbmRvd3MpIiB4bXA6Q3JlYXRlRGF0ZT0iMjAyMy0wNS0yOFQxOTowODo1NiswMjowMCIgeG1wOk1vZGlmeURhdGU9IjIwMjMtMDUtMjhUMTk6MTI6MDIrMDI6MDAiIHhtcDpNZXRhZGF0YURhdGU9IjIwMjMtMDUtMjhUMTk6MTI6MDIrMDI6MDAiIGRjOmZvcm1hdD0iaW1hZ2UvcG5nIiBwaG90b3Nob3A6Q29sb3JNb2RlPSIzIiBwaG90b3Nob3A6SUNDUHJvZmlsZT0ic1JHQiBJRUM2MTk2Ni0yLjEiIHhtcE1NOkluc3RhbmNlSUQ9InhtcC5paWQ6ZmEwZDhmMzctZGU2MS1lODRmLTg2ZWUtYzUxMWY5YjcyYWVkIiB4bXBNTTpEb2N1bWVudElEPSJhZG9iZTpkb2NpZDpwaG90b3Nob3A6NWVmNjNmMjktOGFlOS01YzRlLThlZDgtNDYwMDU2YmQ1YWM1IiB4bXBNTTpPcmlnaW5hbERvY3VtZW50SUQ9InhtcC5kaWQ6MDFhMjM0YzUtMzA3MC0wNTQzLWIzNmUtOWQwZjlkMzEzNGJlIj4gPHhtcE1NOkhpc3Rvcnk+IDxyZGY6U2VxPiA8cmRmOmxpIHN0RXZ0OmFjdGlvbj0iY3JlYXRlZCIgc3RFdnQ6aW5zdGFuY2VJRD0ieG1wLmlpZDowMWEyMzRjNS0zMDcwLTA1NDMtYjM2ZS05ZDA2OWVlZmRlZTQiIHN0RXZ0OndoZW49IjIwMjMtMDUtMjhUMTk6MDg6NTYrMDI6MDAiIHN0RXZ0OnNvZnR3YXJlQWdlbnQ9IkFkb2JlIFBob3Rvc2hvcCAyMi40IChXaW5kb3dzKSIvPiA8cmRmOmxpIHN0RXZ0OmFjdGlvbj0ic2F2ZWQiIHN0RXZ0Omluc3RhbmNlSUQ9InhtcC5paWQ6ZmEwZDhmMzctZGU2MS1lODRmLTg2ZWUtYzUxMWY5YjcyYWVkIiBzdEV2dDp3aGVuPSIyMDIzLTA1LTI4VDE5OjEyOjAyKzAyOjAwIiBzdEV2dDpzb2Z0d2FyZUFnZW50PSJBZG9iZSBQaG90b3Nob3AgMjIuNCAoV2luZG93cykiIHN0RXZ0OmNoYW5nZWQ9Ii8iLz4gPC9yZGY6U2VxPiA8L3htcE1NOkhpc3Rvcnk+IDwvcmRmOkRlc2NyaXB0aW9uPiA8L3JkZjpSREY+IDwveDp4bXBtZXRhPiA8P3hwYWNrZXQgZW5kPSJyIj8+Fr4BkQAABEJJREFUeJzt3b9uVEcUBvBv9uxuE+RADFYIblhLiIYAEsQWooOGPAFNHGxEQQVSpOQVQpe8QrBCiYTsLg0SjwokoEApEEmAWhpECRFlueD8IUlhuXf2zh93dp25YvY3upqZO+ecs/Z4GBERERERERFJRMgdgKt/LZVb3vJPWvhVK0V1OBWFA26ByqLsWOJno8uptJQ0QnXavpJmMRiAWkNoWcKNUdP7CaCbcpqi7xQcCLZQcnTlLsX9WNYQyac+ARTPGANqflTzXcU5x5DsGKNK3qvLY3BJCzF1RV/XhTO4pIVUOCxMutZsU5zBJaFYgkun+U7q8jU57G+xBJcJ90+czfN+HoTYZW3BxfescOh6drH8vhIJu66n3DHEJ/rg4mVZa+6YwnI9O/A4M/ju0t/wP9wJvhJifS6cb7uuxTwai/cpo8t5XH/GWaZcRXVfOfHyNeCa718OeAT72Eku3ivLlXRviMcLvJK/fRK9Ksvl7CigDvpsP8rHQeG9slzOjoqfWR2yvxhLcKm9JJzt+S3g3qKVrg1P1PuQoBxCXHWJiNQXTyMifUdFsb+xb5ahzv3wlGgliOToNYSIfBJCneY2xXbTC3wGwSVqnRMcXB+rtGzrw5Dlm9NQQNU29toqyI4EBxeTkPddGxS5Y3rMtazAYngx4Az6jrA9KC3ueILj8ZJ97GXXk4ayY5EbGAaXVLLjOiCcZcdxDq85LnXq0mg76XzymJkE1+NaQyxnx3FU4+XdQnyWOQQXXyv5tJskgzM8eyZZ5xtNScUn2+D0xfJXgiPJD38Hl0xmb4h/I0aUupbBU8P6flTbPinKDrF3LawZfH6Cg+/B4U51b+x7Ke67FE9w8XRlx7RN0z2JsDJOmlstnWLJzQxqSc8Qj9c1+F2wyZmCQ0ifGGNeOf7lAfFrQox0xRFcDbjeM8LyZ7JmlX+QnVhaT/HUoI0onbn7+fxG9Yc7MaVk3vnlzoMw+vlx5JOsyuoLdx5j8PPLnQWv8YQslcXEELJU1lzvIb38h5ilssTQqMvcMURERNCoyzzUqMvdZbpURJDP3DewUZe6yroQq1RWzMFlvIVcwaXuVVbOoNqcdrcQQ/eYxvUeEkP3mMZUKqtKwaVGhYJLsVeSSd1D6hBcCruShFTpXVbaQ0RqyriHxDDcyLcMhGokjK9UVq3eo7FRl3oolaW6DEdF5JNGXeaiVNZYCFEq6weqpbJayF4dPj9MDV2UyqovxM9mx9SUpbLGTqksEYmQrt5daullMt8PL3P9PcVz69jEh7j+ngKPL3/0cg8Jee9yFdX/CQ5vlY5CnCGmX34Qd54D58v45YrFeskcU+v4byzrg/ePRM4Qt09fpOGXMi5denzepJLyLC33DSYh5dsUXwxdJRx/dhnDjP5qISHkcVfmua1Un3xwAd441h3aIgV/5TpROtD+vuPkK575ERERERERkX35HwQ/guaUnPA8AAAAAElFTkSuQmCC';

/**
 * Generates a descriptive prompt based on the item name and type
 * 
 * @param name - The name of the item
 * @param type - The type of the item (food, toy, accessory) 
 * @param accessoryType - Optional accessory subtype (hat, glasses, collar)
 * @returns A detailed prompt for image generation
 */
const generateItemPrompt = (name: string, type?: string, accessoryType?: string): string => {
  // Base style description for all items
  const baseStyle = "pixel art style, cute, vibrant colors, for a virtual pet game, doge theme, on transparent background, no text";
  
  // Specific prompts based on item type
  if (type === 'food') {
    return `A cute ${name} item for dogs, dog food or treat, ${baseStyle}`;
  }
  else if (type === 'toy') {
    // Special prompt for squeaky bone
    if (name === 'Squeaky Bone') {
      return `A dog toy bone with cute cartoony eyes and different bright colors, dog chew toy, ${baseStyle}`;
    }
    return `A colorful ${name} dog toy, ${baseStyle}`;
  }
  else if (type === 'accessory') {
    if (accessoryType === 'hat') {
      return `A cute ${name} hat for a dog to wear on its head, ${baseStyle}`;
    }
    else if (accessoryType === 'glasses') {
      return `Cute ${name} glasses for a dog to wear, ${baseStyle}`;
    }
    else if (accessoryType === 'collar') {
      return `A fancy ${name} collar for dogs, ${baseStyle}`;
    }
    return `A cute ${name} accessory for dogs, ${baseStyle}`;
  }
  
  // Default prompt if type is not specified
  return `Cute pixel art ${name} item for a virtual pet dog game, doge-themed, transparent background`;
};

/**
 * Gets an image URL for an item, generating it if it doesn't exist in cache
 * 
 * @param name - The name of the item
 * @param type - Optional type of the item (food, toy, accessory)
 * @param accessoryType - Optional accessory subtype (hat, glasses, collar)
 * @returns A promise that resolves to an image URL
 */
export const getItemImageUrl = async (
  name: string, 
  type?: string, 
  accessoryType?: string
): Promise<string> => {
  // Create a unique key for the cache
  const cacheKey = `${name}_${type || ''}_${accessoryType || ''}`;
  
  // Return cached image if available
  if (imageCache[cacheKey]) {
    return imageCache[cacheKey];
  }
  
  try {
    // Generate an appropriate prompt based on the item details
    const prompt = generateItemPrompt(name, type, accessoryType);
    
    // Call the image generation API
    const imageUrl = await generateImage(prompt, {
      size: "1024x1024",
      quality: "medium",
      format: "png",
      background: "transparent"
    });
    
    // Store in cache and return
    imageCache[cacheKey] = imageUrl;
    return imageUrl;
  } catch (error) {
    console.error("Failed to generate image:", error);
    // Return placeholder in case of error
    return PLACEHOLDER_IMAGE;
  }
};

/**
 * Synchronous version that returns either a cached image or placeholder
 * This is useful for initial rendering while the async version fetches the actual image
 * 
 * @param name - The name of the item
 * @param type - Optional type of the item
 * @param accessoryType - Optional accessory type
 * @returns Either the cached image URL or a placeholder
 */
export const getItemImageUrlSync = (
  name: string,
  type?: string,
  accessoryType?: string
): string => {
  const cacheKey = `${name}_${type || ''}_${accessoryType || ''}`;
  return imageCache[cacheKey] || PLACEHOLDER_IMAGE;
};

/**
 * Clears the image cache for a specific item and regenerates it
 * 
 * @param name - The name of the item to regenerate
 * @param type - Optional type of the item
 * @param accessoryType - Optional accessory type
 * @returns A promise that resolves to the new image URL
 */
export const regenerateItemImage = async (
  name: string,
  type?: string,
  accessoryType?: string
): Promise<string> => {
  // Create the cache key
  const cacheKey = `${name}_${type || ''}_${accessoryType || ''}`;
  
  // Delete from cache if exists
  if (imageCache[cacheKey]) {
    delete imageCache[cacheKey];
  }
  
  // Generate a new image with a slightly modified prompt for variety
  let prompt = '';
  
  // Special handling for the squeaky bone toy
  if (name === 'Squeaky Bone' && type === 'toy') {
    prompt = "A cute dog bone toy with googly eyes, blue and pink colors, cartoon style, pixel art, for a virtual pet game, doge theme, on transparent background, no text";
  } else {
    prompt = generateItemPrompt(name, type, accessoryType) + ", unique design, different perspective";
  }
  
  try {
    // Call the image generation API with higher quality
    const imageUrl = await generateImage(prompt, {
      size: "1024x1024",
      quality: "high",
      format: "png",
      background: "transparent"
    });
    
    // Store in cache and return
    imageCache[cacheKey] = imageUrl;
    return imageUrl;
  } catch (error) {
    console.error("Failed to regenerate image:", error);
    return PLACEHOLDER_IMAGE;
  }
};
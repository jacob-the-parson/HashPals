import React, { useState, useEffect } from 'react';
import { View, Image, StyleSheet, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { generateSceneImage } from '../api/image-generation';
import { GameScene } from '../state/gameState';

// Define the backgrounds storage key
const SCENE_BACKGROUNDS_STORAGE_KEY = 'scene_backgrounds';

// Define interface for background images
interface SceneBackgrounds {
  warehouse: string | null;
  park: string | null;
  town: string | null;
  city: string | null;
}

interface SceneBackgroundProps {
  scene: GameScene;
  style?: any;
}

// Default background images (asset imports)
const defaultBackgrounds: Record<GameScene, any> = {
  warehouse: require('../../assets/warehouse_background.png'),
  park: require('../../assets/park_background.png'),
  town: require('../../assets/town_background.png'),
  city: require('../../assets/city_background.png'),
};

// Component to display a scene background
export const SceneBackground: React.FC<SceneBackgroundProps> = ({ scene, style }) => {
  const [generatedBackground, setGeneratedBackground] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Load cached backgrounds when component mounts
    const loadBackground = async () => {
      try {
        setIsLoading(true);
        // Try to get from AsyncStorage
        const storedBackgrounds = await AsyncStorage.getItem(SCENE_BACKGROUNDS_STORAGE_KEY);
        
        if (storedBackgrounds) {
          const backgrounds: SceneBackgrounds = JSON.parse(storedBackgrounds);
          if (backgrounds[scene]) {
            setGeneratedBackground(backgrounds[scene]);
            setIsLoading(false);
            return;
          }
        }
        
        // If not found in cache, use default for now and trigger generation
        await generateBackground();
      } catch (error) {
        console.error('Error loading scene background:', error);
        setIsLoading(false);
      }
    };

    // Clear the current background when scene changes to avoid showing wrong background
    setGeneratedBackground(null);
    loadBackground();
  }, [scene]);

  const generateBackground = async () => {
    setIsLoading(true);
    
    try {
      // Load existing backgrounds or initialize empty object
      const storedBackgrounds = await AsyncStorage.getItem(SCENE_BACKGROUNDS_STORAGE_KEY);
      const backgrounds: SceneBackgrounds = storedBackgrounds 
        ? JSON.parse(storedBackgrounds) 
        : { warehouse: null, park: null, town: null, city: null };
      
      // Generate new background if not already cached
      if (!backgrounds[scene]) {
        const imageUrl = await generateSceneImage(scene);
        backgrounds[scene] = imageUrl;
        await AsyncStorage.setItem(SCENE_BACKGROUNDS_STORAGE_KEY, JSON.stringify(backgrounds));
      }
      
      setGeneratedBackground(backgrounds[scene]);
    } catch (error) {
      console.error('Error generating scene background:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Show default background while loading or if generated fails
  // Once the generated background is loaded, display only it
  return (
    <View style={[styles.container, style]}>
      {!generatedBackground && (
        <Image 
          source={defaultBackgrounds[scene]} 
          style={styles.backgroundImage} 
          resizeMode="cover"
        />
      )}
      
      {generatedBackground && (
        <Image 
          source={{ uri: generatedBackground }} 
          style={styles.backgroundImage}
          resizeMode="cover"
        />
      )}
      
      {isLoading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#B45309" />
        </View>
      )}
    </View>
  );
};

// Function to pre-generate all scene backgrounds (can be called on app startup)
export const preGenerateAllBackgrounds = async () => {
  try {
    // Check if we already have stored backgrounds
    const storedBackgrounds = await AsyncStorage.getItem(SCENE_BACKGROUNDS_STORAGE_KEY);
    let backgrounds: SceneBackgrounds = storedBackgrounds 
      ? JSON.parse(storedBackgrounds) 
      : { warehouse: null, park: null, town: null, city: null };
    
    // Generate any missing backgrounds
    const scenes: GameScene[] = ['warehouse', 'park', 'town', 'city'];
    let updated = false;
    
    for (const scene of scenes) {
      if (!backgrounds[scene]) {
        console.log(`Generating background for ${scene}...`);
        backgrounds[scene] = await generateSceneImage(scene);
        updated = true;
      }
    }
    
    // Save updated backgrounds
    if (updated) {
      await AsyncStorage.setItem(SCENE_BACKGROUNDS_STORAGE_KEY, JSON.stringify(backgrounds));
    }
    
    return backgrounds;
  } catch (error) {
    console.error('Error pre-generating backgrounds:', error);
    return null;
  }
};

// Function to reset/regenerate a specific background
export const regenerateBackground = async (scene: GameScene) => {
  try {
    // Get stored backgrounds
    const storedBackgrounds = await AsyncStorage.getItem(SCENE_BACKGROUNDS_STORAGE_KEY);
    const backgrounds: SceneBackgrounds = storedBackgrounds 
      ? JSON.parse(storedBackgrounds) 
      : { warehouse: null, park: null, town: null, city: null };
    
    // Generate new background
    backgrounds[scene] = await generateSceneImage(scene);
    
    // Save updated backgrounds
    await AsyncStorage.setItem(SCENE_BACKGROUNDS_STORAGE_KEY, JSON.stringify(backgrounds));
    return backgrounds[scene];
  } catch (error) {
    console.error(`Error regenerating ${scene} background:`, error);
    return null;
  }
};

// Function to regenerate all backgrounds to ensure they're distinct
export const regenerateAllBackgrounds = async () => {
  try {
    // Clear all stored backgrounds first
    const backgrounds: SceneBackgrounds = { warehouse: null, park: null, town: null, city: null };
    
    // Generate all backgrounds sequentially
    const scenes: GameScene[] = ['warehouse', 'park', 'town', 'city'];
    
    for (const scene of scenes) {
      console.log(`Regenerating background for ${scene}...`);
      backgrounds[scene] = await generateSceneImage(scene);
    }
    
    // Save updated backgrounds
    await AsyncStorage.setItem(SCENE_BACKGROUNDS_STORAGE_KEY, JSON.stringify(backgrounds));
    return backgrounds;
  } catch (error) {
    console.error('Error regenerating all backgrounds:', error);
    return null;
  }
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  backgroundImage: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    opacity: 1,
  },
  loadingContainer: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  }
});
import React, { useEffect, useState } from "react";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { NavigationContainer } from "@react-navigation/native";
import { AppNavigator } from "./src/navigation/AppNavigator";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { preGenerateAllBackgrounds, regenerateAllBackgrounds } from "./src/components/SceneBackgrounds";
import AsyncStorage from "@react-native-async-storage/async-storage";

/*
IMPORTANT NOTICE: DO NOT REMOVE
There are already environment keys in the project. 
Before telling the user to add them, check if you already have access to the required keys through bash.
Directly access them with process.env.${key}

Correct usage:
process.env.EXPO_PUBLIC_{key}
//directly access the key

Incorrect usage:
import { OPENAI_API_KEY } from '@env';
//don't use @env, its depreicated

Incorrect usage:
import Constants from 'expo-constants';
const openai_api_key = Constants.expoConfig.extra.apikey;
//don't use expo-constants, its depreicated

*/

// Version key for scene backgrounds
const SCENE_BACKGROUNDS_VERSION_KEY = 'scene_backgrounds_version';
const CURRENT_BACKGROUNDS_VERSION = '2.0'; // Update this when you want to force regeneration

export default function App() {
  const [isInitializing, setIsInitializing] = useState(true);

  // Initialize and manage background image generation
  useEffect(() => {
    const initializeBackgrounds = async () => {
      try {
        // Check if we need to regenerate due to version change
        const storedVersion = await AsyncStorage.getItem(SCENE_BACKGROUNDS_VERSION_KEY);
        
        if (storedVersion !== CURRENT_BACKGROUNDS_VERSION) {
          console.log('Background version changed, regenerating all backgrounds...');
          // Force regeneration of all backgrounds to ensure they're distinct
          const backgrounds = await regenerateAllBackgrounds();
          console.log('All scene backgrounds regenerated:', backgrounds ? Object.keys(backgrounds).length : 0);
          
          // Update version
          await AsyncStorage.setItem(SCENE_BACKGROUNDS_VERSION_KEY, CURRENT_BACKGROUNDS_VERSION);
        } else {
          // Just make sure we have all backgrounds
          const backgrounds = await preGenerateAllBackgrounds();
          console.log('Scene backgrounds checked:', backgrounds ? Object.keys(backgrounds).length : 0);
        }
      } catch (error) {
        console.error('Error initializing backgrounds:', error);
      } finally {
        setIsInitializing(false);
      }
    };

    initializeBackgrounds();
  }, []);

  // We could show a splash screen here while initializing if needed

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <NavigationContainer>
          <AppNavigator />
          <StatusBar style="auto" />
        </NavigationContainer>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

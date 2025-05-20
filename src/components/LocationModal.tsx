import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, Modal, StyleSheet, Image, ScrollView, ActivityIndicator } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useGameStore, GameScene } from '../state/gameState';
import { FadeIn } from 'react-native-reanimated';
import { cn } from '../utils/cn';
import { formatNumber } from '../utils/gameUtils';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { regenerateBackground } from './SceneBackgrounds';

interface LocationModalProps {
  isVisible: boolean;
  onClose: () => void;
}

interface LocationItemProps {
  scene: GameScene;
  isSelected: boolean;
  isLocked: boolean;
  onSelect: (scene: GameScene) => void;
  onUnlock: (scene: GameScene) => void;
  label: string;
  icon: keyof typeof Feather.glyphMap;
  imageSource: any;
  unlockCost?: number;
}

// Scene backgrounds storage key (must match the key in SceneBackgrounds.tsx)
const SCENE_BACKGROUNDS_STORAGE_KEY = 'scene_backgrounds';

const LocationItem: React.FC<LocationItemProps> = ({ 
  scene, 
  isSelected, 
  isLocked,
  onSelect,
  onUnlock,
  label, 
  icon, 
  imageSource,
  unlockCost 
}) => {
  const { coins } = useGameStore();
  const canUnlock = coins >= (unlockCost || 0);
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
  const [isRegenerating, setIsRegenerating] = useState(false);
  
  // Load generated background if available
  useEffect(() => {
    const loadGeneratedBackground = async () => {
      try {
        const storedBackgrounds = await AsyncStorage.getItem(SCENE_BACKGROUNDS_STORAGE_KEY);
        if (storedBackgrounds) {
          const backgrounds = JSON.parse(storedBackgrounds);
          if (backgrounds[scene]) {
            setGeneratedImageUrl(backgrounds[scene]);
          }
        }
      } catch (error) {
        console.error(`Error loading background for ${scene}:`, error);
      }
    };
    
    loadGeneratedBackground();
  }, [scene]);
  
  // Function to regenerate this scene's background
  const handleRegenerateBackground = async () => {
    if (isRegenerating) return;
    
    setIsRegenerating(true);
    try {
      const newBackgroundUrl = await regenerateBackground(scene);
      if (newBackgroundUrl) {
        setGeneratedImageUrl(newBackgroundUrl);
      }
    } catch (error) {
      console.error(`Error regenerating ${scene} background:`, error);
    } finally {
      setIsRegenerating(false);
    }
  };
  
  return (
    <TouchableOpacity 
      onPress={() => !isLocked && onSelect(scene)} 
      className={cn(
        "mb-4 rounded-xl overflow-hidden border-2", 
        isSelected ? "border-amber-500" : isLocked ? "border-gray-300" : "border-gray-200",
        isLocked && "opacity-70"
      )}
    >
      <View className="relative">
        {/* Default image only as fallback if no generated image */}
        {!generatedImageUrl && (
          <Image source={imageSource} style={styles.locationImage} resizeMode="cover" />
        )}
        
        {/* Generated image if available */}
        {generatedImageUrl && (
          <Image source={{ uri: generatedImageUrl }} style={styles.locationImage} resizeMode="cover" />
        )}
        
        {isLocked ? (
          <View className="absolute inset-0 bg-black bg-opacity-40 items-center justify-center">
            <View className="items-center">
              <Feather name="lock" size={24} color="white" />
              {unlockCost && (
                <View className="flex-row items-center bg-amber-500 rounded-full px-3 py-1 mt-2">
                  <Feather name="server" size={14} color="white" />
                  <Text className="text-white font-bold ml-1">
                    {formatNumber(unlockCost)}
                  </Text>
                </View>
              )}
              <TouchableOpacity 
                className={cn(
                  "mt-2 rounded-full px-4 py-2", 
                  canUnlock ? "bg-emerald-500" : "bg-gray-500"
                )}
                disabled={!canUnlock}
                onPress={() => onUnlock(scene)}
              >
                <Text className="text-white font-medium">Unlock</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View className="absolute bottom-0 left-0 right-0 flex-row">
            {/* Location name */}
            <View className={cn(
              "flex-1 bg-black bg-opacity-40 flex-row items-center justify-center py-2",
              isSelected && "bg-amber-500 bg-opacity-70"
            )}>
              <Feather name={icon} size={16} color="white" />
              <Text className="text-white ml-2 font-medium">{label}</Text>
            </View>
            
            {/* Refresh button (not for locked scenes) */}
            {!isLocked && (
              <TouchableOpacity 
                onPress={handleRegenerateBackground}
                disabled={isRegenerating}
                className={cn(
                  "px-3 items-center justify-center",
                  isSelected ? "bg-amber-600 bg-opacity-80" : "bg-black bg-opacity-60"
                )}
              >
                {isRegenerating ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <Feather name="refresh-cw" size={16} color="white" />
                )}
              </TouchableOpacity>
            )}
          </View>
        )}
        
        {isSelected && !isLocked && (
          <View className="absolute top-2 left-2 bg-amber-500 rounded-full p-1">
            <Feather name="check" size={14} color="white" />
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

export const LocationModal: React.FC<LocationModalProps> = ({ isVisible, onClose }) => {
  const { currentScene, setScene, coins, unlockScene, unlockedScenes } = useGameStore();
  
  // Define costs to unlock each location
  const unlockCosts: Record<GameScene, number> = {
    warehouse: 0,
    park: 200,
    town: 500,
    city: 1000,
  };
  
  const handleSceneChange = (scene: GameScene) => {
    if (scene === currentScene || !unlockedScenes[scene]) return;
    setScene(scene);
    onClose();
  };
  
  const handleUnlockLocation = (scene: GameScene) => {
    if (unlockedScenes[scene]) return;
    const cost = unlockCosts[scene];
    unlockScene(scene, cost);
  };

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={isVisible}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text className="text-xl font-bold text-gray-800">Travel Locations</Text>
            <TouchableOpacity onPress={onClose} className="p-2">
              <Feather name="x" size={24} color="#666" />
            </TouchableOpacity>
          </View>
          
          <ScrollView contentContainerStyle={styles.locationsContainer}>
            <LocationItem 
              scene="warehouse"
              isSelected={currentScene === "warehouse"}
              isLocked={!unlockedScenes.warehouse}
              onSelect={handleSceneChange}
              onUnlock={handleUnlockLocation}
              label="Warehouse"
              icon="server"
              imageSource={require('../../assets/warehouse_background.png')}
            />
            
            <LocationItem 
              scene="park"
              isSelected={currentScene === "park"}
              isLocked={!unlockedScenes.park}
              onSelect={handleSceneChange}
              onUnlock={handleUnlockLocation}
              label="Park"
              icon="sun"
              imageSource={require('../../assets/park_background.png')}
              unlockCost={unlockCosts.park}
            />
            
            <LocationItem 
              scene="town"
              isSelected={currentScene === "town"}
              isLocked={!unlockedScenes.town}
              onSelect={handleSceneChange}
              onUnlock={handleUnlockLocation}
              label="Town"
              icon="home"
              imageSource={require('../../assets/town_background.png')}
              unlockCost={unlockCosts.town}
            />
            
            <LocationItem 
              scene="city"
              isSelected={currentScene === "city"}
              isLocked={!unlockedScenes.city}
              onSelect={handleSceneChange}
              onUnlock={handleUnlockLocation}
              label="City"
              icon="grid"
              imageSource={require('../../assets/city_background.png')}
              unlockCost={unlockCosts.city}
            />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: 'white',
    borderRadius: 20,
    width: '85%',
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#ddd',
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  locationsContainer: {
    padding: 20,
  },
  locationImage: {
    width: '100%',
    height: 150,
  },
});
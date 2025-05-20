import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Image, ActivityIndicator } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useGameStore } from '../state/gameState';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { getItemImageUrl, getItemImageUrlSync } from '../api/imageGenerator';

export const AccessoriesScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { accessories, equipAccessory, unequipAccessory } = useGameStore();
  const [selectedCategory, setSelectedCategory] = useState<'hat' | 'glasses' | 'collar'>('hat');
  const [message, setMessage] = useState<string | null>(null);
  const [accessoryImages, setAccessoryImages] = useState<Record<string, string>>({});
  const [loadingImages, setLoadingImages] = useState(true);
  
  // Filter accessories by type
  const filteredAccessories = accessories.filter(acc => acc.type === selectedCategory);
  
  // Find the currently equipped accessory for each type
  const equippedHat = accessories.find(acc => acc.type === 'hat' && acc.equipped);
  const equippedGlasses = accessories.find(acc => acc.type === 'glasses' && acc.equipped);
  const equippedCollar = accessories.find(acc => acc.type === 'collar' && acc.equipped);
  
  // Load images for accessories
  useEffect(() => {
    const loadAccessoryImages = async () => {
      setLoadingImages(true);
      
      if (accessories.length === 0) {
        setLoadingImages(false);
        return;
      }
      
      // Generate and load images for all accessories
      const promises = accessories.map(async (accessory) => {
        try {
          // If the accessory already has an image URL, use it
          if (accessory.imageUrl && !accessory.imageUrl.includes('placeholder')) {
            return { id: accessory.id, imageUrl: accessory.imageUrl };
          }
          
          // Otherwise generate a new one
          const imageUrl = await getItemImageUrl(accessory.name, 'accessory', accessory.type);
          return { id: accessory.id, imageUrl };
        } catch (error) {
          console.error(`Failed to load image for ${accessory.name}:`, error);
          return { id: accessory.id, imageUrl: getItemImageUrlSync(accessory.name, 'accessory', accessory.type) };
        }
      });
      
      // Wait for all images to be generated/loaded
      const results = await Promise.all(promises);
      
      // Convert results to a record for easy lookup
      const imageMap: Record<string, string> = {};
      results.forEach(({ id, imageUrl }) => {
        imageMap[id] = imageUrl;
      });
      
      setAccessoryImages(imageMap);
      setLoadingImages(false);
    };
    
    loadAccessoryImages();
  }, [accessories]);
  
  // Handle equipping an accessory
  const handleEquip = (id: string) => {
    equipAccessory(id);
    setMessage('Accessory equipped!');
    setTimeout(() => setMessage(null), 2000);
  };
  
  // Handle removing an accessory
  const handleRemove = (type: 'hat' | 'glasses' | 'collar') => {
    unequipAccessory(type);
    setMessage('Accessory removed');
    setTimeout(() => setMessage(null), 2000);
  };
  
  return (
    <SafeAreaView className="flex-1 bg-amber-50">
      <View className="flex-1" style={{ paddingBottom: insets.bottom }}>
        {/* Header */}
        <View className="flex-row justify-between items-center px-4 py-3">
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Feather name="chevron-left" size={24} color="#78716C" />
          </TouchableOpacity>
          <Text className="text-xl font-bold text-amber-800">Pet Customization</Text>
          <View style={{ width: 24 }} />
        </View>
        
        {/* Notification message */}
        {message && (
          <Animated.View 
            className="bg-amber-100 px-4 py-2 mx-4 rounded-lg"
            entering={FadeIn.duration(200)}
            exiting={FadeOut.duration(200)}
          >
            <Text className="text-center text-amber-800">{message}</Text>
          </Animated.View>
        )}
        
        {/* Doge preview */}
        <View className="items-center py-6">
          <View className="bg-amber-200 rounded-full mb-2 overflow-hidden" style={styles.dogeCircleFrame}>
            <Image 
              source={require('../../assets/doge_character.png')} 
              style={styles.dogeImage}
              defaultSource={require('../../assets/doge_character.png')}
            />
            
            {/* Equipped accessories */}
            {equippedHat && (
              <View style={styles.hatPosition}>
                {loadingImages ? (
                  <ActivityIndicator size="small" color="#3B82F6" />
                ) : accessoryImages[equippedHat.id] ? (
                  <Image 
                    source={{ uri: accessoryImages[equippedHat.id] }} 
                    style={styles.equippedAccessory}
                    resizeMode="contain"
                  />
                ) : (
                  <Feather name="award" size={32} color="#3B82F6" />
                )}
              </View>
            )}
            
            {equippedGlasses && (
              <View style={styles.glassesPosition}>
                {loadingImages ? (
                  <ActivityIndicator size="small" color="#8B5CF6" />
                ) : accessoryImages[equippedGlasses.id] ? (
                  <Image 
                    source={{ uri: accessoryImages[equippedGlasses.id] }} 
                    style={styles.equippedAccessory}
                    resizeMode="contain"
                  />
                ) : (
                  <Feather name="eye" size={26} color="#8B5CF6" />
                )}
              </View>
            )}
            
            {equippedCollar && (
              <View style={styles.collarPosition}>
                {loadingImages ? (
                  <ActivityIndicator size="small" color="#EC4899" />
                ) : accessoryImages[equippedCollar.id] ? (
                  <Image 
                    source={{ uri: accessoryImages[equippedCollar.id] }} 
                    style={styles.equippedAccessory}
                    resizeMode="contain"
                  />
                ) : (
                  <Feather name="circle" size={28} color="#EC4899" />
                )}
              </View>
            )}
          </View>
          
          <Text className="text-lg text-gray-700 text-center px-6 mt-2">
            Choose accessories to customize your pet!
          </Text>
        </View>
        
        {/* Category selector */}
        <View className="flex-row px-4 py-2 border-b border-amber-100">
          <TouchableOpacity
            className={`mr-4 pb-1 ${selectedCategory === 'hat' ? 'border-b-2 border-amber-500' : ''}`}
            onPress={() => setSelectedCategory('hat')}
          >
            <Text className={`${selectedCategory === 'hat' ? 'text-amber-800' : 'text-gray-500'}`}>
              Hats
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            className={`mr-4 pb-1 ${selectedCategory === 'glasses' ? 'border-b-2 border-amber-500' : ''}`}
            onPress={() => setSelectedCategory('glasses')}
          >
            <Text className={`${selectedCategory === 'glasses' ? 'text-amber-800' : 'text-gray-500'}`}>
              Glasses
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            className={`mr-4 pb-1 ${selectedCategory === 'collar' ? 'border-b-2 border-amber-500' : ''}`}
            onPress={() => setSelectedCategory('collar')}
          >
            <Text className={`${selectedCategory === 'collar' ? 'text-amber-800' : 'text-gray-500'}`}>
              Collars
            </Text>
          </TouchableOpacity>
        </View>
        
        {/* Accessories list */}
        <ScrollView className="flex-1 px-4 pt-4">
          {filteredAccessories.length === 0 ? (
            <View className="py-8 items-center">
              <Feather name="package" size={40} color="#D1D5DB" />
              <Text className="text-gray-400 text-center mt-4 text-lg">No {selectedCategory}s yet</Text>
              <Text className="text-gray-400 text-center mt-1">Visit the shop to buy some!</Text>
            </View>
          ) : (
            filteredAccessories.map((accessory) => (
              <View key={accessory.id} className="bg-white rounded-xl p-4 mb-3 shadow-sm flex-row">
                <View className="mr-3">
                  <View 
                    style={styles.itemIconContainer} 
                    className={
                      selectedCategory === 'hat'
                        ? 'bg-blue-100'
                        : selectedCategory === 'glasses'
                          ? 'bg-purple-100'
                          : 'bg-pink-100'
                    }
                  >
                    {loadingImages ? (
                      <ActivityIndicator size="small" color="#9CA3AF" />
                    ) : accessoryImages[accessory.id] ? (
                      <Image 
                        source={{ uri: accessoryImages[accessory.id] }} 
                        style={styles.itemImage}
                        resizeMode="contain"
                      />
                    ) : (
                      <>
                        {selectedCategory === 'hat' && <Feather name="award" size={24} color="#3B82F6" />}
                        {selectedCategory === 'glasses' && <Feather name="eye" size={24} color="#8B5CF6" />}
                        {selectedCategory === 'collar' && <Feather name="circle" size={24} color="#EC4899" />}
                      </>
                    )}
                  </View>
                </View>
                
                <View className="flex-1">
                  <Text className="text-lg font-medium text-gray-800">{accessory.name}</Text>
                  <Text className="text-gray-500 text-sm mb-2">{accessory.description}</Text>
                  
                  <View className="flex-row justify-between items-center">
                    <View className="flex-row">
                      <View className="flex-row items-center">
                        <Feather name="star" size={14} color="#8B5CF6" />
                        <Text className="text-purple-500 text-xs ml-1">{accessory.type}</Text>
                      </View>
                    </View>
                    
                    {accessory.equipped ? (
                      <TouchableOpacity
                        className="py-1 px-3 rounded-full flex-row items-center bg-gray-300"
                        onPress={() => handleRemove(accessory.type)}
                      >
                        <Feather name="x-circle" size={14} color="#4B5563" />
                        <Text className="ml-1 font-medium text-gray-700">Remove</Text>
                      </TouchableOpacity>
                    ) : (
                      <TouchableOpacity
                        className="py-1 px-3 rounded-full flex-row items-center bg-amber-400"
                        onPress={() => handleEquip(accessory.id)}
                      >
                        <Feather name="check-circle" size={14} color="#78350F" />
                        <Text className="ml-1 font-medium text-amber-900">Equip</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              </View>
            ))
          )}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  dogeCircleFrame: {
    width: 160, 
    height: 160,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 5,
    borderColor: '#FCD34D',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.27,
    shadowRadius: 4.65,
    elevation: 6,
    position: 'relative',
  },
  dogeImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  hatPosition: {
    position: 'absolute',
    top: 5,
    alignItems: 'center',
    width: '100%',
    zIndex: 10,
  },
  glassesPosition: {
    position: 'absolute',
    top: '42%',
    alignItems: 'center',
    width: '100%',
    zIndex: 10,
  },
  collarPosition: {
    position: 'absolute',
    bottom: 20,
    alignItems: 'center',
    width: '100%',
    zIndex: 10,
  },
  itemIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  equippedAccessory: {
    width: 45,
    height: 45,
  },
  itemImage: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
  },
});
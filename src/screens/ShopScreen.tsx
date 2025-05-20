import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, Image, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useGameStore } from '../state/gameState';
import Animated, { FadeIn } from 'react-native-reanimated';
import { GameItem } from '../types/game';
import { formatNumber } from '../utils/gameUtils';
import { getItemImageUrl, getItemImageUrlSync, regenerateItemImage } from '../api/imageGenerator';

// Create shop items with placeholder imageUrls that will be updated later
const createShopItems = (): GameItem[] => {
  // Base items without imageUrls
  const items: GameItem[] = [
    // Food items
    {
      id: '1',
      name: 'Premium Kibble',
      description: 'High quality food that boosts energy significantly',
      cost: 50,
      type: 'food',
      energyBoost: 40,
      happinessBoost: 10,
    },
    {
      id: '5',
      name: 'Energy Treat',
      description: 'Special treat that quickly restores energy',
      cost: 30,
      type: 'food',
      energyBoost: 20,
    },
    {
      id: '7',
      name: 'Luxury Feast',
      description: 'Gourmet meal for your pet',
      cost: 75,
      type: 'food',
      energyBoost: 30,
      happinessBoost: 25,
    },
    
    // Toy items
    {
      id: '2',
      name: 'Squeaky Bone',
      description: 'A fun toy that makes your pet happy',
      cost: 80,
      type: 'toy',
      happinessBoost: 30,
    },
    {
      id: '6',
      name: 'Interactive Ball',
      description: 'A bouncy ball to play with',
      cost: 60,
      type: 'toy',
      happinessBoost: 25,
    },
    {
      id: '8',
      name: 'Mining Pickaxe',
      description: 'A toy that simulates mining',
      cost: 100,
      type: 'toy',
      happinessBoost: 35,
    },
    
    // Accessory items - hats
    {
      id: '3',
      name: 'Dogecoin Hat',
      description: 'Stylish hat for your crypto-loving pet',
      cost: 150,
      type: 'accessory',
      accessoryType: 'hat',
    },
    {
      id: '9',
      name: 'Miner Hat',
      description: 'A hat with a headlamp for mining in style',
      cost: 200,
      type: 'accessory',
      accessoryType: 'hat',
    },
    
    // Accessory items - glasses
    {
      id: '10',
      name: 'Cool Sunglasses',
      description: 'Stylish sunglasses for your pet',
      cost: 120,
      type: 'accessory',
      accessoryType: 'glasses',
    },
    {
      id: '11',
      name: 'Crypto Visor',
      description: 'Futuristic glasses for monitoring crypto prices',
      cost: 180,
      type: 'accessory',
      accessoryType: 'glasses',
    },
    
    // Accessory items - collars
    {
      id: '12',
      name: 'Diamond Collar',
      description: 'Luxurious collar with diamond studs',
      cost: 250,
      type: 'accessory',
      accessoryType: 'collar',
    },
    {
      id: '13',
      name: 'Bitcoin Collar',
      description: 'A collar with Bitcoin symbols',
      cost: 220,
      type: 'accessory',
      accessoryType: 'collar',
    },
    
    // AI Credits
    {
      id: 'c1',
      name: 'Basic Credit Pack',
      description: '5 AI conversation credits for your pet',
      cost: 50,
      type: 'credit',
      creditAmount: 5,
    },
    {
      id: 'c2',
      name: 'Premium Credit Pack',
      description: '15 AI conversation credits for your pet',
      cost: 120,
      type: 'credit',
      creditAmount: 15,
    },
    {
      id: 'c3',
      name: 'Ultimate Credit Pack',
      description: '50 AI conversation credits for your pet',
      cost: 350,
      type: 'credit',
      creditAmount: 50,
    },
  ];
  
  // Add placeholder imageUrl to each item
  return items.map(item => ({
    ...item,
    imageUrl: getItemImageUrlSync(item.name, item.type, item.accessoryType)
  }));
};

const SHOP_ITEMS: GameItem[] = createShopItems();

export const ShopScreen = ({ route }) => {
  const insets = useSafeAreaInsets();
  const { coins, aiCredits, buyItem, inventory } = useGameStore();
  
  // Get default tab from route params or use 'all'
  const initialTab = route?.params?.defaultTab || 'all';
  const [selectedTab, setSelectedTab] = useState<'all' | 'food' | 'toy' | 'accessory' | 'credits' | 'inventory'>(
    initialTab as 'all' | 'food' | 'toy' | 'accessory' | 'credits' | 'inventory'
  );
  
  const [purchaseMessage, setPurchaseMessage] = useState<string | null>(null);
  const [itemImages, setItemImages] = useState<Record<string, string>>({});
  const [loadingImages, setLoadingImages] = useState(true);
  const [regeneratingItemId, setRegeneratingItemId] = useState<string | null>(null);
  
  // Load images asynchronously once the component mounts
  useEffect(() => {
    const loadItemImages = async () => {
      setLoadingImages(true);
      
      // Generate and load images for all shop items
      const promises = SHOP_ITEMS.map(async (item) => {
        try {
          const imageUrl = await getItemImageUrl(item.name, item.type, item.accessoryType);
          return { id: item.id, imageUrl };
        } catch (error) {
          console.error(`Failed to load image for ${item.name}:`, error);
          return { id: item.id, imageUrl: getItemImageUrlSync(item.name, item.type, item.accessoryType) };
        }
      });
      
      // Wait for all images to be generated/loaded
      const results = await Promise.all(promises);
      
      // Convert results to a record for easy lookup
      const imageMap: Record<string, string> = {};
      results.forEach(({ id, imageUrl }) => {
        imageMap[id] = imageUrl;
      });
      
      setItemImages(imageMap);
      setLoadingImages(false);
    };
    
    loadItemImages();
  }, []);
  
  // Function to regenerate the image for the squeaky bone toy
  const regenerateSqueakyBoneImage = async () => {
    // Find the squeaky bone item (ID: 2)
    const squeakyBone = SHOP_ITEMS.find(item => item.id === '2');
    if (!squeakyBone) return;
    
    try {
      setRegeneratingItemId('2'); // Set the ID of the item being regenerated
      
      // Regenerate the image
      const newImageUrl = await regenerateItemImage(
        squeakyBone.name, 
        squeakyBone.type, 
        squeakyBone.accessoryType
      );
      
      // Update the image in the state
      setItemImages(prev => ({
        ...prev,
        '2': newImageUrl
      }));
      
      setPurchaseMessage("Squeaky Bone image regenerated!");
      setTimeout(() => setPurchaseMessage(null), 2000);
    } catch (error) {
      console.error("Failed to regenerate squeaky bone image:", error);
      setPurchaseMessage("Failed to regenerate image");
      setTimeout(() => setPurchaseMessage(null), 2000);
    } finally {
      setRegeneratingItemId(null);
    }
  };
  
  // Filter items based on selected tab
  const filteredItems = selectedTab === 'all' 
    ? SHOP_ITEMS 
    : selectedTab === 'inventory' || selectedTab === 'credits'
    ? [] // Inventory and credits are handled separately
    : SHOP_ITEMS.filter(item => item.type === selectedTab);
    
  // Get credit items for the credits tab
  const creditItems = SHOP_ITEMS.filter(item => item.type === 'credit');
  
  const handlePurchase = (item: GameItem) => {
    if (coins < item.cost) {
      setPurchaseMessage("Not enough coins!");
      setTimeout(() => setPurchaseMessage(null), 2000);
      return;
    }
    
    // Use the new buyItem action
    buyItem(item);
    
    setPurchaseMessage(`Purchased ${item.name}!`);
    setTimeout(() => setPurchaseMessage(null), 2000);
  };
  
  // Group inventory items by type for the inventory view
  const foodItems = inventory.filter(item => item.type === 'food');
  const toyItems = inventory.filter(item => item.type === 'toy');
  
  // Function to handle using inventory items
  const { useInventoryItem } = useGameStore();
  
  const handleUseInventoryItem = (itemId: string, itemName: string) => {
    useInventoryItem(itemId);
    setPurchaseMessage(`Used ${itemName}!`);
    setTimeout(() => setPurchaseMessage(null), 2000);
  };

  return (
    <SafeAreaView className="flex-1 bg-amber-50">
      <View className="flex-1" style={{ paddingBottom: insets.bottom }}>
        {/* Header */}
        <View className="flex-row justify-between items-center px-4 py-3">
          <View className="flex-row items-center">
            <Feather name="server" size={20} color="#B45309" />
            <Text className="text-amber-700 text-lg font-bold ml-1">{formatNumber(coins)}</Text>
          </View>
          <Text className="text-xl font-bold text-amber-800">HashShop</Text>
          <View style={{ width: 20 }} />
        </View>
        
        {/* Tab filters */}
        <View className="border-b border-amber-100">
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            className="px-2"
            contentContainerStyle={{ paddingVertical: 8 }}
          >
            <TouchableOpacity
              className={`mx-2 px-3 py-1.5 rounded-full ${selectedTab === 'all' ? 'bg-amber-500' : 'bg-amber-100'}`}
              onPress={() => setSelectedTab('all')}
            >
              <Text className={`font-medium ${selectedTab === 'all' ? 'text-white' : 'text-amber-800'}`}>
                All Items
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              className={`mx-2 px-3 py-1.5 rounded-full flex-row items-center ${selectedTab === 'food' ? 'bg-amber-500' : 'bg-amber-100'}`}
              onPress={() => setSelectedTab('food')}
            >
              <Feather name="coffee" size={14} color={selectedTab === 'food' ? '#FFFFFF' : '#B45309'} style={{ marginRight: 4 }} />
              <Text className={`font-medium ${selectedTab === 'food' ? 'text-white' : 'text-amber-800'}`}>
                Food
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              className={`mx-2 px-3 py-1.5 rounded-full flex-row items-center ${selectedTab === 'toy' ? 'bg-amber-500' : 'bg-amber-100'}`}
              onPress={() => setSelectedTab('toy')}
            >
              <Feather name="zap" size={14} color={selectedTab === 'toy' ? '#FFFFFF' : '#B45309'} style={{ marginRight: 4 }} />
              <Text className={`font-medium ${selectedTab === 'toy' ? 'text-white' : 'text-amber-800'}`}>
                Toys
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              className={`mx-2 px-3 py-1.5 rounded-full flex-row items-center ${selectedTab === 'accessory' ? 'bg-amber-500' : 'bg-amber-100'}`}
              onPress={() => setSelectedTab('accessory')}
            >
              <Feather name="star" size={14} color={selectedTab === 'accessory' ? '#FFFFFF' : '#B45309'} style={{ marginRight: 4 }} />
              <Text className={`font-medium ${selectedTab === 'accessory' ? 'text-white' : 'text-amber-800'}`}>
                Accessories
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              className={`mx-2 px-3 py-1.5 rounded-full flex-row items-center ${selectedTab === 'credits' ? 'bg-amber-500' : 'bg-amber-100'}`}
              onPress={() => setSelectedTab('credits')}
            >
              <Feather name="message-circle" size={14} color={selectedTab === 'credits' ? '#FFFFFF' : '#B45309'} style={{ marginRight: 4 }} />
              <Text className={`font-medium ${selectedTab === 'credits' ? 'text-white' : 'text-amber-800'}`}>
                AI Credits
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              className={`mx-2 px-3 py-1.5 rounded-full flex-row items-center ${selectedTab === 'inventory' ? 'bg-amber-500' : 'bg-amber-100'}`}
              onPress={() => setSelectedTab('inventory')}
            >
              <Feather name="package" size={14} color={selectedTab === 'inventory' ? '#FFFFFF' : '#B45309'} style={{ marginRight: 4 }} />
              <Text className={`font-medium ${selectedTab === 'inventory' ? 'text-white' : 'text-amber-800'}`}>
                Inventory
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
        
        {/* Purchase message */}
        {purchaseMessage && (
          <Animated.View 
            className="bg-amber-100 px-4 py-2 mx-4 mt-2 rounded-lg"
            entering={FadeIn.duration(200)}
          >
            <Text className="text-center text-amber-800">{purchaseMessage}</Text>
          </Animated.View>
        )}
        
        {/* Credits View */}
        {selectedTab === 'credits' ? (
          <ScrollView className="flex-1 px-3">
            {/* Current credits */}
            <View className="mt-4 mb-6 items-center">
              <View className="bg-indigo-100 p-4 rounded-full">
                <Feather name="message-circle" size={36} color="#4F46E5" />
              </View>
              <Text className="text-2xl font-bold text-gray-800 mt-3">{aiCredits}</Text>
              <Text className="text-gray-500">Available AI Credits</Text>
              <Text className="text-sm text-gray-400 text-center mt-3 px-4">
                AI Credits allow your pet to have conversations with you. Each response uses 1 credit.
              </Text>
            </View>
            
            {/* Credits purchase options */}
            <View className="mb-4">
              <Text className="font-bold text-gray-800 text-lg mb-4 px-2">Buy more credits</Text>
              
              {creditItems.map((item) => (
                <View key={item.id} className="bg-white rounded-xl p-4 mb-3 shadow-sm">
                  <View className="flex-row items-center mb-3">
                    <View style={styles.itemIconContainer} className="bg-indigo-100 mr-3">
                      <Feather name="message-square" size={24} color="#4F46E5" />
                    </View>
                    <View>
                      <Text className="text-lg font-medium text-gray-800">{item.name}</Text>
                      <Text className="text-gray-500 text-sm">{item.description}</Text>
                    </View>
                  </View>
                  
                  <View className="flex-row justify-between items-center border-t border-gray-100 pt-3">
                    <View className="flex-row items-center">
                      <Feather name="zap" size={18} color="#4F46E5" />
                      <Text className="text-indigo-700 font-semibold ml-1">+{item.creditAmount} Credits</Text>
                    </View>
                    
                    <TouchableOpacity
                      className={`py-2 px-4 rounded-full flex-row items-center ${coins >= item.cost ? 'bg-indigo-500' : 'bg-gray-300'}`}
                      onPress={() => handlePurchase(item)}
                      disabled={coins < item.cost}
                    >
                      <Feather name="server" size={14} color={coins >= item.cost ? '#fff' : '#666'} />
                      <Text className={`ml-1 font-medium ${coins >= item.cost ? 'text-white' : 'text-gray-600'}`}>
                        {item.cost}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          </ScrollView>
        ) : selectedTab === 'inventory' ? (
          <ScrollView className="flex-1 px-3">
            {/* Empty inventory message */}
            {inventory.length === 0 && (
              <View className="py-8 px-4 items-center">
                <Feather name="archive" size={40} color="#D1D5DB" />
                <Text className="text-gray-400 text-center mt-4 text-lg">Your inventory is empty!</Text>
                <Text className="text-gray-400 text-center mt-1">Buy items from the shop to use later.</Text>
              </View>
            )}
            
            {/* Food section */}
            {foodItems.length > 0 && (
              <View className="mt-4">
                <Text className="font-bold text-gray-800 text-lg mb-2 px-2">Food</Text>
                {foodItems.map((item) => (
                  <View key={item.id} className="bg-white rounded-xl p-4 mb-3 shadow-sm flex-row">
                    <View className="mr-3">
                      <View style={styles.itemIconContainer} className="bg-orange-100">
                        {item.imageUrl ? (
                          <Image 
                            source={{ uri: item.imageUrl }} 
                            style={styles.itemImage} 
                            resizeMode="contain"
                          />
                        ) : (
                          <Feather name="coffee" size={24} color="#F59E0B" />
                        )}
                      </View>
                    </View>
                    
                    <View className="flex-1">
                      <View className="flex-row justify-between">
                        <Text className="text-lg font-medium text-gray-800">{item.name}</Text>
                        <View className="bg-amber-100 px-2 rounded-full">
                          <Text className="text-amber-800 font-medium">x{item.quantity}</Text>
                        </View>
                      </View>
                      <Text className="text-gray-500 text-sm mb-2">{item.description}</Text>
                      
                      <View className="flex-row justify-between items-center">
                        <View className="flex-row">
                          {item.energyBoost && (
                            <View className="flex-row items-center mr-2">
                              <Feather name="battery" size={14} color="#3B82F6" />
                              <Text className="text-blue-500 text-xs ml-1">+{item.energyBoost}</Text>
                            </View>
                          )}
                          {item.happinessBoost && (
                            <View className="flex-row items-center">
                              <Feather name="smile" size={14} color="#F59E0B" />
                              <Text className="text-amber-500 text-xs ml-1">+{item.happinessBoost}</Text>
                            </View>
                          )}
                        </View>
                        
                        <TouchableOpacity
                          className="py-1 px-3 rounded-full flex-row items-center bg-orange-400"
                          onPress={() => handleUseInventoryItem(item.id, item.name)}
                        >
                          <Feather name="check-circle" size={14} color="#FFF" />
                          <Text className="ml-1 font-medium text-white">Use</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                ))}
              </View>
            )}
            
            {/* Toy section */}
            {toyItems.length > 0 && (
              <View className="mt-4 mb-4">
                <Text className="font-bold text-gray-800 text-lg mb-2 px-2">Toys</Text>
                {toyItems.map((item) => (
                  <View key={item.id} className="bg-white rounded-xl p-4 mb-3 shadow-sm flex-row">
                    <View className="mr-3">
                      <View style={styles.itemIconContainer} className="bg-emerald-100">
                        {item.imageUrl ? (
                          <Image 
                            source={{ uri: item.imageUrl }} 
                            style={styles.itemImage} 
                            resizeMode="contain"
                          />
                        ) : (
                          <Feather name="zap" size={24} color="#10B981" />
                        )}
                      </View>
                    </View>
                    
                    <View className="flex-1">
                      <View className="flex-row justify-between">
                        <Text className="text-lg font-medium text-gray-800">{item.name}</Text>
                        <View className="bg-emerald-100 px-2 rounded-full">
                          <Text className="text-emerald-800 font-medium">x{item.quantity}</Text>
                        </View>
                      </View>
                      <Text className="text-gray-500 text-sm mb-2">{item.description}</Text>
                      
                      <View className="flex-row justify-between items-center">
                        <View className="flex-row">
                          {item.happinessBoost && (
                            <View className="flex-row items-center">
                              <Feather name="smile" size={14} color="#F59E0B" />
                              <Text className="text-amber-500 text-xs ml-1">+{item.happinessBoost}</Text>
                            </View>
                          )}
                        </View>
                        
                        <TouchableOpacity
                          className="py-1 px-3 rounded-full flex-row items-center bg-emerald-400"
                          onPress={() => handleUseInventoryItem(item.id, item.name)}
                        >
                          <Feather name="check-circle" size={14} color="#FFF" />
                          <Text className="ml-1 font-medium text-white">Use</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </ScrollView>
        ) : (
          /* Shop items */
          <FlatList
            data={filteredItems}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ padding: 12 }}
            renderItem={({ item }) => (
              <View className="bg-white rounded-xl p-4 mb-3 shadow-sm flex-row">
                <View className="mr-3">
                  <View style={{ position: 'relative' }}>
                    <View 
                      style={styles.itemIconContainer} 
                      className={
                        item.type === 'food' 
                          ? 'bg-orange-100' 
                          : item.type === 'toy' 
                            ? 'bg-emerald-100'
                            : item.accessoryType === 'hat'
                              ? 'bg-blue-100'
                              : item.accessoryType === 'glasses'
                                ? 'bg-purple-100'
                                : 'bg-pink-100'
                      }
                    >
                      {regeneratingItemId === item.id ? (
                        <ActivityIndicator size="small" color="#10B981" />
                      ) : loadingImages ? (
                        <ActivityIndicator size="small" color="#9CA3AF" />
                      ) : itemImages[item.id] ? (
                        <Image 
                          source={{ uri: itemImages[item.id] }} 
                          style={styles.itemImage} 
                          resizeMode="contain"
                        />
                      ) : (
                        <Feather 
                          name={item.type === 'food' ? 'coffee' : item.type === 'toy' ? 'zap' : 'star'} 
                          size={24} 
                          color={item.type === 'food' ? '#F59E0B' : item.type === 'toy' ? '#10B981' : '#8B5CF6'} 
                        />
                      )}
                    </View>
                    
                    {/* Refresh button for squeaky bone */}
                    {item.id === '2' && (
                      <TouchableOpacity 
                        style={styles.refreshButton}
                        onPress={regenerateSqueakyBoneImage}
                        disabled={regeneratingItemId === '2'}
                      >
                        <Feather name="refresh-cw" size={12} color="#FFFFFF" />
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
                
                <View className="flex-1">
                  <Text className="text-lg font-medium text-gray-800">{item.name}</Text>
                  <Text className="text-gray-500 text-sm mb-2">{item.description}</Text>
                  
                  <View className="flex-row justify-between items-center">
                    <View className="flex-row">
                      {item.energyBoost && (
                        <View className="flex-row items-center mr-2">
                          <Feather name="battery" size={14} color="#3B82F6" />
                          <Text className="text-blue-500 text-xs ml-1">+{item.energyBoost}</Text>
                        </View>
                      )}
                      {item.happinessBoost && (
                        <View className="flex-row items-center">
                          <Feather name="smile" size={14} color="#F59E0B" />
                          <Text className="text-amber-500 text-xs ml-1">+{item.happinessBoost}</Text>
                        </View>
                      )}
                      {item.type === 'accessory' && (
                        <View className="flex-row items-center">
                          <Feather name="star" size={14} color="#8B5CF6" />
                          <Text className="text-purple-500 text-xs ml-1">{item.accessoryType}</Text>
                        </View>
                      )}
                    </View>
                    
                    <TouchableOpacity
                      className={`py-1 px-3 rounded-full flex-row items-center ${coins >= item.cost ? 'bg-amber-400' : 'bg-gray-300'}`}
                      onPress={() => handlePurchase(item)}
                      disabled={coins < item.cost}
                    >
                      <Feather name="server" size={14} color={coins >= item.cost ? '#78350F' : '#666'} />
                      <Text className={`ml-1 font-medium ${coins >= item.cost ? 'text-amber-900' : 'text-gray-600'}`}>
                        {item.cost}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            )}
          />
        )}
      </View>
    </SafeAreaView>
  );
};

// Add ScrollView import
import { ScrollView } from 'react-native';

const styles = StyleSheet.create({
  itemIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  itemImage: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
  },
  refreshButton: {
    position: 'absolute',
    bottom: -5,
    right: -5,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#10B981',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1,
    elevation: 2,
  },
});
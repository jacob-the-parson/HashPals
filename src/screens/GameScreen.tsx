import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { ProgressBar } from '../components/ProgressBar';
import { ActionButton } from '../components/ActionButton';
import { LocationModal } from '../components/LocationModal';
import { SceneBackground } from '../components/SceneBackgrounds';
import { useGameStore } from '../state/gameState';
import { getDogeCurrentMood, generateRandomCoins, formatNumber } from '../utils/gameUtils';
import { DogeAnimation, DogeMood, Animation } from '../types/game';
import { Feather } from '@expo/vector-icons';
import { getItemImageUrl, getItemImageUrlSync } from '../api/imageGenerator';
import { getPetResponse } from '../api/chat-service';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSequence, 
  withTiming,
  withSpring,
  withRepeat,
  runOnJS,
  Easing,
  FadeIn,
  FadeOut
} from 'react-native-reanimated';

export const GameScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { 
    coins, 
    happiness, 
    energy, 
    aiCredits,
    feed, 
    play, 
    pet, 
    earnCoins, 
    lastActive,
    updateLastActive,
    updateHappiness,
    updateMiningEnergy,
    startMining: startMiningState,
    stopMining: stopMiningState,
    isMining: isMiningState,
    accessories,
    dailyRewards,
    currentScene,
    setScene,
    useAiCredit,
    feeding,
    inventory
  } = useGameStore();
  
  // Location modal state
  const [locationModalVisible, setLocationModalVisible] = useState(false);
  const [currentAnimation, setCurrentAnimation] = useState<Animation | null>(null);
  const [isMining, setIsMining] = useState(false);
  const [miningSpeed, setMiningSpeed] = useState(1);
  const [showCoinPopup, setShowCoinPopup] = useState(false);
  const [coinAmount, setCoinAmount] = useState(0);
  const [lastInteractionTime, setLastInteractionTime] = useState(Date.now());
  const [accessoryImages, setAccessoryImages] = useState<Record<string, string>>({});
  const [loadingImages, setLoadingImages] = useState(true);
  const miningIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  // Animation values
  const scale = useSharedValue(1);
  const translateY = useSharedValue(0);
  const rotation = useSharedValue(0);
  const miningRotation = useSharedValue(0);
  const coinPopupTranslateY = useSharedValue(0);
  const coinPopupOpacity = useSharedValue(0);
  
  // Get current mood based on happiness and energy
  const dogeMood = getDogeCurrentMood(happiness, energy);
  
  // Handle mining feature
  const startMining = () => {
    if (energy < 20) {
      // Not enough energy to mine
      return;
    }
    
    // Update local UI state
    setIsMining(true);
    
    // Update global state
    startMiningState();
    
    // Start mining animation
    miningRotation.value = withRepeat(
      withTiming(2 * Math.PI, { duration: 1500 / miningSpeed }),
      -1, // repeat indefinitely
      false
    );
    
    // Mine coins at intervals
    if (miningIntervalRef.current) {
      clearInterval(miningIntervalRef.current);
    }
    
    miningIntervalRef.current = setInterval(() => {
      // Stop mining if energy is too low
      if (energy < 5) {
        stopMining();
        return;
      }
      
      // Generate coins based on mining speed
      const amount = generateRandomCoins(1, 3) * miningSpeed;
      earnCoins(amount);
      showCoinEarned(amount);
      
      // Note: Mining only affects energy, not happiness
      // Energy decays gradually over 8 hours while mining (handled by updateMiningEnergy)
    }, 5000 / miningSpeed); // Faster mining = more frequent rewards
  };
  
  const stopMining = () => {
    // Update local UI state
    setIsMining(false);
    
    // Update global state
    stopMiningState();
    
    // Clear the mining interval
    if (miningIntervalRef.current) {
      clearInterval(miningIntervalRef.current);
      miningIntervalRef.current = null;
    }
    
    // Stop mining animation
    miningRotation.value = withTiming(0);
  };
  
  // Handle petting the doge (tap animation)
  const handlePet = () => {
    setLastInteractionTime(Date.now());
    pet();
    setCurrentAnimation({
      type: DogeAnimation.TAP,
      duration: 500,
      startTime: Date.now(),
    });
    
    // Animate scale
    scale.value = withSequence(
      withTiming(1.1, { duration: 150 }),
      withTiming(1, { duration: 150 })
    );
    
    // Give random coins sometimes when petting
    const shouldGiveCoins = Math.random() < 0.4;
    if (shouldGiveCoins) {
      const amount = generateRandomCoins(1, 5);
      earnCoins(amount);
      showCoinEarned(amount);
    }
  };
  
  // Show coin earned popup
  const showCoinEarned = (amount: number) => {
    setCoinAmount(amount);
    setShowCoinPopup(true);
    
    coinPopupOpacity.value = 1;
    coinPopupTranslateY.value = 0;
    
    // Animate coin popup
    coinPopupTranslateY.value = withTiming(-50, { duration: 1000 });
    coinPopupOpacity.value = withTiming(0, { duration: 1000 }, () => {
      runOnJS(hidePopup)();
    });
  };
  
  const hidePopup = () => {
    setShowCoinPopup(false);
  };
  
  // Handle feeding
  const handleFeed = () => {
    setLastInteractionTime(Date.now());
    
    // Check for remaining allowance
    if (feeding.remainingAllowance <= 0) {
      // Check if user has food items in inventory
      const foodItems = inventory.filter(item => item.type === 'food');
      
      if (foodItems.length > 0) {
        // Navigate to inventory to let user select a food item
        navigation.navigate('Shop', { screen: 'Shop', params: { defaultTab: 'inventory' } });
        return;
      } else {
        // Show out of food message
        setShowNeedsFood(true);
        setTimeout(() => {
          setShowNeedsFood(false);
        }, 3000);
        return;
      }
    }
    
    // If we have allowance, use it
    feed();
    
    setCurrentAnimation({
      type: DogeAnimation.FEED,
      duration: 1000,
      startTime: Date.now(),
    });
    
    // Animate up and down
    translateY.value = withSequence(
      withTiming(-20, { duration: 200 }),
      withTiming(0, { duration: 300 })
    );
    
    // Show food animation
    setShowFood(true);
    setTimeout(() => {
      setShowFood(false);
    }, 2000);
  };
  
  // State for showing no food message
  const [showNeedsFood, setShowNeedsFood] = useState(false);
  
  const [showFood, setShowFood] = useState(false);
  
  // Pet response state
  const [petResponse, setPetResponse] = useState<string | null>(null);
  const [showPetResponse, setShowPetResponse] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [showNoCredits, setShowNoCredits] = useState(false);
  
  // Handle playing
  const handlePlay = async () => {
    setLastInteractionTime(Date.now());
    play();
    setCurrentAnimation({
      type: DogeAnimation.PLAY,
      duration: 1200,
      startTime: Date.now(),
    });
    
    // Animate rotation
    rotation.value = withSequence(
      withTiming(-0.1, { duration: 200 }),
      withTiming(0.1, { duration: 200 }),
      withTiming(-0.05, { duration: 200 }),
      withTiming(0.05, { duration: 200 }),
      withTiming(0, { duration: 200 })
    );

    // Check if user has AI credits
    if (aiCredits <= 0) {
      setPetResponse("I need AI credits to talk!");
      setShowPetResponse(true);
      setShowNoCredits(true);
      
      // Hide pet response bubble after 3 seconds
      setTimeout(() => {
        setShowPetResponse(false);
        setShowNoCredits(false);
      }, 3000);
      return;
    }
    
    try {
      setAiLoading(true);
      
      // Deduct one AI credit
      const success = useAiCredit();
      if (!success) {
        // This should not happen since we already checked above
        throw new Error("No credits available");
      }
      
      // Get pet response from AI
      const response = await getPetResponse();
      setPetResponse(response);
      
      // Show pet response bubble
      setShowPetResponse(true);
      
      // Hide pet response bubble after 3 seconds
      setTimeout(() => {
        setShowPetResponse(false);
      }, 3000);
    } catch (error) {
      console.error('Error getting pet response:', error);
      setPetResponse("Woof! (AI error)");
      setShowPetResponse(true);
      setTimeout(() => {
        setShowPetResponse(false);
      }, 3000);
    } finally {
      setAiLoading(false);
    }
  };
  
  // Upgrade mining speed
  const upgradeMining = () => {
    if (coins >= 100 * miningSpeed) {
      earnCoins(-100 * miningSpeed);
      setMiningSpeed(prev => Math.min(5, prev + 1));
    }
  };
  
  // Regular happiness decay check (every 30 seconds)
  useEffect(() => {
    const statsDecayTimer = setInterval(() => {
      // Update happiness with decay
      updateHappiness();
      // Update energy with decay if mining
      updateMiningEnergy();
    }, 30000); // Check every 30 seconds
    
    return () => clearInterval(statsDecayTimer);
  }, [updateHappiness, updateMiningEnergy]);
  
  // Apply happiness decay immediately when component mounts or after focus
  useEffect(() => {
    // Apply happiness decay calculation when the screen comes into focus
    updateHappiness();
    // Apply energy decay calculation if mining
    updateMiningEnergy();
  }, [updateHappiness, updateMiningEnergy]);
  
  // Sync local mining state with global state
  useEffect(() => {
    setIsMining(isMiningState);
    
    // If global state says we're mining but local animation isn't running, start it
    if (isMiningState && miningRotation.value === 0) {
      miningRotation.value = withRepeat(
        withTiming(2 * Math.PI, { duration: 1500 / miningSpeed }),
        -1, // repeat indefinitely
        false
      );
    }
    
    // If global state says we're not mining but animation is running, stop it
    if (!isMiningState && miningRotation.value !== 0) {
      miningRotation.value = withTiming(0);
    }
  }, [isMiningState]);
  
  // Check for inactivity and handle real-time stat decay
  useEffect(() => {
    const inactivityTimer = setInterval(() => {
      const now = Date.now();
      const timeSinceLastInteraction = now - lastInteractionTime;
      const timeSinceLastActive = now - lastActive;
      
      // Handle real-time decay (since last active in the app)
      if (timeSinceLastActive > 10 * 60 * 1000) { // 10 minutes
        // Update the last active time to now
        updateLastActive();
        
        // Calculate how much time has passed in hours (capped at 24 hours)
        const hoursPassed = Math.min(24, timeSinceLastActive / (60 * 60 * 1000));
        
        // Decrease happiness and energy based on time passed
        // Only feed (which increases happiness) if not mining
        if (energy > hoursPassed * 1.5 && !isMining) {
          feed(); // This will use some energy
        }
      }
      
      // If inactive for more than 3 minutes in the current session
      if (timeSinceLastInteraction > 3 * 60 * 1000) {
        // Update last interaction to avoid spamming
        setLastInteractionTime(now - 2 * 60 * 1000);
      }
    }, 60000);
    
    return () => clearInterval(inactivityTimer);
  }, [lastInteractionTime, happiness, lastActive]);
  
  // Clear animation after duration
  useEffect(() => {
    if (currentAnimation) {
      const timeout = setTimeout(() => {
        setCurrentAnimation(null);
      }, currentAnimation.duration);
      
      return () => clearTimeout(timeout);
    }
  }, [currentAnimation]);
  
  // Cleanup for mining interval
  useEffect(() => {
    return () => {
      if (miningIntervalRef.current) {
        clearInterval(miningIntervalRef.current);
      }
    };
  }, []);
  
  // Load images for equipped accessories
  useEffect(() => {
    const loadAccessoryImages = async () => {
      setLoadingImages(true);
      
      const equippedAccessories = accessories.filter(acc => acc.equipped);
      if (equippedAccessories.length === 0) {
        setLoadingImages(false);
        return;
      }
      
      // Generate and load images for all equipped accessories
      const promises = equippedAccessories.map(async (accessory) => {
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
  
  // Define animations
  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { scale: scale.value },
        { translateY: translateY.value },
        { rotateZ: `${rotation.value}rad` }
      ]
    };
  });
  
  const miningAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ rotateZ: `${miningRotation.value}rad` }],
    };
  });
  
  const coinPopupStyle = useAnimatedStyle(() => {
    return {
      opacity: coinPopupOpacity.value,
      transform: [{ translateY: coinPopupTranslateY.value }],
    };
  });

  // Get scene-specific styling
  const getSceneStyles = () => {
    switch(currentScene) {
      case 'park':
        return 'bg-emerald-50';
      case 'town':
        return 'bg-slate-50';
      case 'city':
        return 'bg-sky-50';
      case 'warehouse':
      default:
        return 'bg-amber-50';
    }
  };

  return (
    <SafeAreaView className={`flex-1 ${getSceneStyles()}`} style={{paddingBottom: 0}}>
      <View className="flex-1 pt-2">
        {/* Dynamic scene header */}
        <View className="flex-row justify-between items-center px-4 py-2">
          <View className="flex-row items-center space-x-2 flex-1">
            <View className="flex-row items-center">
              <Feather name="server" size={20} color="#B45309" />
              <Text className="text-amber-700 text-lg font-bold ml-1">{formatNumber(coins)}</Text>
            </View>
          </View>
          <View className="items-center flex-1">
            <Text className="text-xl font-bold text-amber-800">HashPals</Text>
          </View>
          <View className="flex-row justify-end flex-1">
            {/* Daily Rewards Button with indicator */}
            <TouchableOpacity 
              className="relative px-2"
              onPress={() => navigation.navigate('DailyRewards')}
            >
              <Feather name="gift" size={20} color="#78716C" />
              {/* Check if daily reward is available */}
              {(() => {
                const today = new Date().setHours(0, 0, 0, 0);
                const lastClaim = new Date(dailyRewards.lastClaimDate).setHours(0, 0, 0, 0);
                const canClaim = lastClaim !== today;
                
                if (canClaim) {
                  return (
                    <View className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full" />
                  );
                }
                return null;
              })()}
            </TouchableOpacity>
            
            {/* Customize Button */}
            <TouchableOpacity 
              onPress={() => navigation.navigate('Accessories')}
              className="px-2"
            >
              <Feather name="user" size={20} color="#78716C" />
            </TouchableOpacity>
          </View>
        </View>
        
        {/* Main game area with dynamic background based on scene */}
        <View className={`flex-1 items-center justify-center ${getSceneStyles()}`}>
          {/* Current location indicator */}
          <View className="absolute top-2 left-0 right-0 flex justify-center items-center z-10">
            <View className="flex-row items-center bg-amber-100 px-3 py-1 rounded-full shadow-sm">
              <Feather 
                name={
                  currentScene === "warehouse" ? "server" :
                  currentScene === "park" ? "sun" :
                  currentScene === "town" ? "home" : "grid"
                } 
                size={14} 
                color="#B45309" 
              />
              <Text className="text-amber-700 text-xs ml-1 font-medium">
                Location: {currentScene === "warehouse" ? "Warehouse" :
                currentScene === "park" ? "Park" :
                currentScene === "town" ? "Town" : "City"}
              </Text>
            </View>
          </View>
          
          <SceneBackground
            scene={currentScene}
            style={styles.backgroundImage}
          />
          
          {/* Scene-specific decorative elements at the bottom of the screen */}
          {currentScene === "park" && (
            <View style={styles.sceneDecoration}>
              <View style={styles.sceneIconsPanel} className="absolute bottom-1 left-2 right-2 bg-white bg-opacity-50 rounded-lg py-1.5 px-1 flex-row justify-around">
                <View className="items-center bg-emerald-50 bg-opacity-70 rounded-lg p-1.5">
                  <Feather name="sun" size={20} color="rgba(234, 179, 8, 0.9)" />
                  <Text style={{fontSize: 10}} className="text-amber-700 mt-0.5 font-medium">Sunshine</Text>
                </View>
                <View className="items-center bg-emerald-50 bg-opacity-70 rounded-lg p-1.5">
                  <Feather name="cloud" size={20} color="rgba(107, 114, 128, 0.9)" />
                  <Text style={{fontSize: 10}} className="text-gray-600 mt-0.5 font-medium">Clouds</Text>
                </View>
                <View className="items-center bg-emerald-50 bg-opacity-70 rounded-lg p-1.5">
                  <Feather name="wind" size={20} color="rgba(107, 114, 128, 0.9)" />
                  <Text style={{fontSize: 10}} className="text-gray-600 mt-0.5 font-medium">Fresh Air</Text>
                </View>
              </View>
            </View>
          )}
          
          {currentScene === "town" && (
            <View style={styles.sceneDecoration}>
              <View style={styles.sceneIconsPanel} className="absolute bottom-1 left-2 right-2 bg-white bg-opacity-50 rounded-lg py-1.5 px-1 flex-row justify-around">
                <View className="items-center bg-slate-50 bg-opacity-70 rounded-lg p-1.5">
                  <Feather name="home" size={20} color="rgba(120, 113, 108, 0.9)" />
                  <Text style={{fontSize: 10}} className="text-gray-600 mt-0.5 font-medium">Houses</Text>
                </View>
                <View className="items-center bg-slate-50 bg-opacity-70 rounded-lg p-1.5">
                  <Feather name="shopping-bag" size={20} color="rgba(120, 113, 108, 0.9)" />
                  <Text style={{fontSize: 10}} className="text-gray-600 mt-0.5 font-medium">Shop</Text>
                </View>
                <View className="items-center bg-slate-50 bg-opacity-70 rounded-lg p-1.5">
                  <Feather name="coffee" size={20} color="rgba(120, 113, 108, 0.9)" />
                  <Text style={{fontSize: 10}} className="text-gray-600 mt-0.5 font-medium">Café</Text>
                </View>
              </View>
            </View>
          )}
          
          {currentScene === "city" && (
            <View style={styles.sceneDecoration}>
              <View style={styles.sceneIconsPanel} className="absolute bottom-1 left-2 right-2 bg-white bg-opacity-50 rounded-lg py-1.5 px-1 flex-row justify-around">
                <View className="items-center bg-sky-50 bg-opacity-70 rounded-lg p-1.5">
                  <Feather name="wifi" size={20} color="rgba(20, 184, 166, 0.9)" />
                  <Text style={{fontSize: 10}} className="text-teal-700 mt-0.5 font-medium">Network</Text>
                </View>
                <View className="items-center bg-sky-50 bg-opacity-70 rounded-lg p-1.5">
                  <Feather name="smartphone" size={20} color="rgba(20, 184, 166, 0.9)" />
                  <Text style={{fontSize: 10}} className="text-teal-700 mt-0.5 font-medium">Mobile</Text>
                </View>
                <View className="items-center bg-sky-50 bg-opacity-70 rounded-lg p-1.5">
                  <Feather name="monitor" size={20} color="rgba(20, 184, 166, 0.9)" />
                  <Text style={{fontSize: 10}} className="text-teal-700 mt-0.5 font-medium">Tech</Text>
                </View>
              </View>
            </View>
          )}
          
          {currentScene === "warehouse" && (
            <View style={styles.sceneDecoration}>
              <View style={styles.sceneIconsPanel} className="absolute bottom-1 left-2 right-2 bg-white bg-opacity-50 rounded-lg py-1.5 px-1 flex-row justify-around">
                <View className="items-center bg-amber-50 bg-opacity-70 rounded-lg p-1.5">
                  <Feather name="server" size={20} color="rgba(180, 83, 9, 0.9)" />
                  <Text style={{fontSize: 10}} className="text-amber-700 mt-0.5 font-medium">Servers</Text>
                </View>
                <View className="items-center bg-amber-50 bg-opacity-70 rounded-lg p-1.5">
                  <Feather name="box" size={20} color="rgba(180, 83, 9, 0.9)" />
                  <Text style={{fontSize: 10}} className="text-amber-700 mt-0.5 font-medium">Storage</Text>
                </View>
                <View className="items-center bg-amber-50 bg-opacity-70 rounded-lg p-1.5">
                  <Feather name="cpu" size={20} color="rgba(180, 83, 9, 0.9)" />
                  <Text style={{fontSize: 10}} className="text-amber-700 mt-0.5 font-medium">Mining</Text>
                </View>
              </View>
            </View>
          )}
          
          {/* Coins earned popup */}
          {showCoinPopup && (
            <Animated.View 
              style={[styles.coinPopup, coinPopupStyle]}
              pointerEvents="none"
            >
              <View className="flex-row items-center">
                <Feather name="server" size={16} color="#B45309" />
                <Text className="text-amber-700 font-bold ml-1">+{coinAmount}</Text>
              </View>
            </Animated.View>
          )}

          {/* Mining indicator - left */}
          {isMining && (
            <View className="absolute top-2 left-2 bg-amber-100 px-2.5 py-1 rounded-full flex-row items-center">
              <Animated.View style={miningAnimatedStyle}>
                <Feather name="loader" size={16} color="#B45309" />
              </Animated.View>
              <Text className="text-amber-800 ml-1 font-medium">Mining x{miningSpeed}</Text>
            </View>
          )}
          
          {/* Mood indicator - right */}
          <View className={`absolute top-2 right-2 px-2.5 py-1 rounded-full flex-row items-center shadow-sm ${
            dogeMood === DogeMood.HAPPY || dogeMood === DogeMood.EXCITED ? "bg-emerald-100" :
            dogeMood === DogeMood.NEUTRAL ? "bg-amber-100" :
            dogeMood === DogeMood.SLEEPY ? "bg-indigo-100" : "bg-rose-100"
          }`} style={styles.moodIndicator}>
            <Feather 
              name={
                dogeMood === DogeMood.HAPPY || dogeMood === DogeMood.EXCITED ? "smile" :
                dogeMood === DogeMood.NEUTRAL ? "meh" :
                dogeMood === DogeMood.SLEEPY ? "moon" : "frown"
              } 
              size={16} 
              color={
                dogeMood === DogeMood.HAPPY || dogeMood === DogeMood.EXCITED ? "#047857" :
                dogeMood === DogeMood.NEUTRAL ? "#B45309" :
                dogeMood === DogeMood.SLEEPY ? "#6366F1" : "#F43F5E"
              } 
            />
            <Text className={`ml-1 font-medium ${
              dogeMood === DogeMood.HAPPY || dogeMood === DogeMood.EXCITED ? "text-emerald-800" :
              dogeMood === DogeMood.NEUTRAL ? "text-amber-800" :
              dogeMood === DogeMood.SLEEPY ? "text-indigo-800" : "text-rose-800"
            }`}>
              {dogeMood === DogeMood.HAPPY && "Happy"}
              {dogeMood === DogeMood.NEUTRAL && "Alright"}
              {dogeMood === DogeMood.SAD && "Sad"}
              {dogeMood === DogeMood.SLEEPY && "Sleepy"}
              {dogeMood === DogeMood.EXCITED && "Excited!"}
            </Text>
          </View>
          
          {/* Food animation */}
          {showFood && (
            <Animated.View 
              style={[styles.foodContainer, { position: 'absolute', bottom: 180, zIndex: 10 }]}
              entering={FadeIn.duration(300)}
              exiting={FadeOut.duration(300)}
            >
              <Image 
                source={require('../../assets/doge_food.png')} 
                style={styles.foodImage}
              />
            </Animated.View>
          )}
          
          {/* Doge character */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={handlePet}
            className="items-center"
          >
            <Animated.View style={animatedStyle}>
              <View className="items-center">
                <View className="bg-amber-200 rounded-full mb-2 overflow-hidden" style={styles.dogeCircleFrame}>
                  <Image 
                    source={require('../../assets/doge_character.png')} 
                    style={styles.dogeImage}
                    defaultSource={require('../../assets/doge_character.png')}
                  />
                  
                  {/* Equipped accessories */}
                  {accessories.filter(acc => acc.equipped).map(accessory => (
                    <View 
                      key={accessory.id}
                      style={
                        accessory.type === 'hat' ? styles.hatPosition :
                        accessory.type === 'glasses' ? styles.glassesPosition :
                        styles.collarPosition
                      }
                    >
                      {loadingImages ? (
                        <ActivityIndicator 
                          size="small" 
                          color={
                            accessory.type === 'hat' ? "#3B82F6" :
                            accessory.type === 'glasses' ? "#8B5CF6" :
                            "#EC4899"
                          }
                        />
                      ) : accessoryImages[accessory.id] ? (
                        <Image 
                          source={{ uri: accessoryImages[accessory.id] }}
                          style={accessory.type === 'hat' ? styles.hatImage : 
                                 accessory.type === 'glasses' ? styles.glassesImage :
                                 styles.collarImage}
                          resizeMode="contain"
                        />
                      ) : (
                        <Feather 
                          name={
                            accessory.type === 'hat' ? "award" :
                            accessory.type === 'glasses' ? "eye" :
                            "circle"
                          } 
                          size={accessory.type === 'hat' ? 38 : accessory.type === 'glasses' ? 30 : 34} 
                          color={
                            accessory.type === 'hat' ? "#3B82F6" :
                            accessory.type === 'glasses' ? "#8B5CF6" :
                            "#EC4899"
                          }
                        />
                      )}
                    </View>
                  ))}
                </View>
                
                {showPetResponse && (
                  <Animated.View 
                    entering={FadeIn.duration(300)}
                    exiting={FadeOut.duration(300)}
                    className={`${showNoCredits ? 'bg-indigo-100' : 'bg-amber-100'} rounded-lg p-2 px-4 shadow-md mb-2`}
                    style={styles.speechBubble}
                  >
                    {aiLoading ? (
                      <View className="flex-row items-center">
                        <ActivityIndicator size="small" color="#4F46E5" style={{marginRight: 5}} />
                        <Text className="text-center font-medium text-indigo-900">
                          Thinking...
                        </Text>
                      </View>
                    ) : showNoCredits ? (
                      <View>
                        <Text className="text-center font-medium text-indigo-900">
                          {petResponse}
                        </Text>
                        <TouchableOpacity 
                          onPress={() => navigation.navigate('Shop', { screen: 'Shop', params: { defaultTab: 'credits' } })}
                          className="mt-2 bg-indigo-500 py-1 px-2 rounded-full"
                        >
                          <Text className="text-white text-center text-xs font-medium">Get credits in shop</Text>
                        </TouchableOpacity>
                      </View>
                    ) : (
                      <Text className="text-center font-medium text-amber-900">
                        {petResponse}
                      </Text>
                    )}
                  </Animated.View>
                )}
              </View>
            </Animated.View>
          </TouchableOpacity>
        </View>
        
        {/* Stats and controls */}
        <View className="bg-white rounded-t-3xl shadow-lg px-5 pt-1.5" style={{
          paddingBottom: Math.max(4, insets.bottom),
          marginBottom: -insets.bottom
        }}>
          <View className="mb-1.5 mt-0.5">
            <View className="mb-4">
              <ProgressBar 
                value={happiness} 
                label="Happiness" 
                color="bg-amber-400" 
              />
              <Text className="text-xs text-gray-500 mt-1.5 ml-1 mb-1">
                Decreases slowly over 6 hours when not interacting with your pet
              </Text>
            </View>
            <View>
              <ProgressBar 
                value={energy} 
                label="Energy" 
                color="bg-blue-400" 
              />
              <Text className="text-xs text-gray-500 mt-1.5 ml-1">
                Mining depletes energy; daily food refills automatically ({feeding.dailyAllowance}/day)
              </Text>
            </View>
          </View>
          
          {/* No food allowance message */}
          {showNeedsFood && (
            <Animated.View 
              entering={FadeIn.duration(300)}
              exiting={FadeOut.duration(300)}
              className="bg-amber-100 rounded-lg px-4 py-2 mb-2"
            >
              <Text className="text-amber-800 text-center">
                Out of daily food! Buy snacks from the shop.
              </Text>
            </Animated.View>
          )}
          
          {/* First row of buttons */}
          <View className="flex-row justify-around pb-1 mb-1">
            <ActionButton 
              label={feeding.remainingAllowance > 0 ? `Feed (${feeding.remainingAllowance})` : "Need Food"} 
              icon="coffee" 
              onPress={handleFeed} 
              color={feeding.remainingAllowance > 0 ? "bg-orange-300" : "bg-gray-300"}
            />
            <ActionButton 
              label={aiCredits > 0 ? `Talk (${aiCredits})` : "Talk (0)"} 
              icon="message-circle" 
              onPress={handlePlay} 
              color={aiCredits > 0 ? "bg-emerald-300" : "bg-gray-300"}
            />
          </View>
          
          {/* Second row of buttons */}
          <View className="flex-row justify-around">
            <ActionButton
              label={isMining ? "Stop Mining" : "Mine Coins"} 
              icon={isMining ? "pause" : "cpu"} 
              onPress={isMining ? stopMining : startMining}
              color={isMining ? "bg-red-300" : "bg-blue-300"}
              disabled={!isMining && energy < 20}
            />
            <ActionButton
              label="Scene" 
              icon="map-pin" 
              onPress={() => setLocationModalVisible(true)}
              color="bg-indigo-300"
            />
          </View>
          
          {/* Upgrade button (centered below) */}
          <View className="flex items-center justify-center mt-1.5 mb-0 px-4 w-full">
            <ActionButton
              label={`Upgrade Mining x${miningSpeed + 1}`} 
              icon="zap" 
              onPress={upgradeMining}
              color="bg-purple-400"
              disabled={coins < 100 * miningSpeed || miningSpeed >= 5}
              cost={miningSpeed < 5 ? 100 * miningSpeed : undefined}
            />
          </View>
        </View>
      </View>
      
      {/* Location Modal */}
      <LocationModal 
        isVisible={locationModalVisible} 
        onClose={() => setLocationModalVisible(false)} 
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  dogeCircleFrame: {
    width: 180, 
    height: 180,
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
  backgroundImage: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    opacity: 1,
  },
  foodImage: {
    width: 80,
    height: 80,
    resizeMode: 'contain',
  },
  foodContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    borderRadius: 10,
    padding: 5,
  },
  coinPopup: {
    position: 'absolute',
    top: '40%',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 3,
    zIndex: 20,
  },
  // Accessory position styles
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
  hatImage: {
    width: 70,
    height: 50,
  },
  glassesImage: {
    width: 65,
    height: 40,
  },
  collarImage: {
    width: 60,
    height: 40,
  },
  sceneDecoration: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    pointerEvents: 'none',
  },
  sceneIconsPanel: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 5,
  },
  speechBubble: {
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    maxWidth: 200,
  },
  moodIndicator: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.2,
    shadowRadius: 2.5,
    elevation: 3,
  }
});
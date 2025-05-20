import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useGameStore } from '../state/gameState';
import Animated, { FadeIn, FadeOut, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { formatNumber } from '../utils/gameUtils';

export const DailyRewardsScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { dailyRewards, claimDailyReward, coins } = useGameStore();
  const [showRewardPopup, setShowRewardPopup] = useState(false);
  const [claimedReward, setClaimedReward] = useState<any>(null);
  
  // Check if today's reward is claimable
  const canClaim = () => {
    const today = new Date().setHours(0, 0, 0, 0);
    const lastClaim = new Date(dailyRewards.lastClaimDate).setHours(0, 0, 0, 0);
    return lastClaim !== today;
  };
  
  // Current day in streak (1-7)
  const currentDay = ((dailyRewards.currentStreak) % 7) + 1;
  
  const handleClaimReward = () => {
    if (!canClaim()) return;
    
    // Get the reward being claimed
    const day = ((dailyRewards.currentStreak) % 7) + 1;
    const reward = dailyRewards.rewards.find(r => r.day === day);
    
    if (reward) {
      setClaimedReward(reward);
      setShowRewardPopup(true);
      
      // Actually claim the reward in game state
      claimDailyReward();
    }
  };
  
  // Animation value for the glow effect
  const glowOpacity = useSharedValue(0.5);
  
  useEffect(() => {
    // Animation loop for glow effect when reward is claimable
    if (canClaim()) {
      glowOpacity.value = withTiming(1, { duration: 1000 });
      const interval = setInterval(() => {
        glowOpacity.value = glowOpacity.value === 0.5 ? withTiming(1, { duration: 1000 }) : withTiming(0.5, { duration: 1000 });
      }, 1000);
      
      return () => clearInterval(interval);
    }
  }, [canClaim()]);
  
  const glowStyle = useAnimatedStyle(() => {
    return {
      opacity: glowOpacity.value,
    };
  });
  
  return (
    <SafeAreaView className="flex-1 bg-amber-50">
      <View className="flex-1" style={{ paddingBottom: insets.bottom }}>
        {/* Header */}
        <View className="flex-row justify-between items-center px-4 py-3">
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Feather name="chevron-left" size={24} color="#78716C" />
          </TouchableOpacity>
          <Text className="text-xl font-bold text-amber-800">Daily Rewards</Text>
          <View className="flex-row items-center">
            <Feather name="server" size={20} color="#B45309" />
            <Text className="text-amber-700 text-lg font-bold ml-1">{formatNumber(coins)}</Text>
          </View>
        </View>
        
        {/* Current streak info */}
        <View className="bg-white mx-4 mt-2 rounded-xl p-4 shadow-sm">
          <Text className="text-xl font-bold text-amber-800 text-center">
            Day {dailyRewards.currentStreak > 0 ? dailyRewards.currentStreak : '1'}
          </Text>
          <Text className="text-gray-500 text-center mt-1">
            {dailyRewards.currentStreak > 0 ? `Keep playing to earn more rewards!` : 'Claim your first daily reward!'}
          </Text>
          <View className="flex-row items-center justify-center mt-2">
            <Feather name="award" size={16} color="#B45309" />
            <Text className="text-amber-700 ml-1">Max Streak: {dailyRewards.maxStreak}</Text>
          </View>
        </View>
        
        {/* Rewards calendar */}
        <View className="flex-1 px-4 py-6">
          <Text className="text-gray-700 font-medium mb-4">7-DAY REWARDS CYCLE</Text>
          
          <View className="flex-row flex-wrap justify-between">
            {dailyRewards.rewards.map((reward) => {
              const isCurrentDay = reward.day === currentDay;
              const isPastDay = (dailyRewards.currentStreak >= reward.day) && !isCurrentDay;
              const isFutureDay = reward.day > currentDay;
              
              return (
                <View 
                  key={`day-${reward.day}`} 
                  className="bg-white rounded-xl shadow-sm mb-4"
                  style={styles.rewardCard}
                >
                  {/* Day indicator */}
                  <View className={`rounded-full w-7 h-7 items-center justify-center absolute -top-2 -right-2 ${isPastDay ? 'bg-green-500' : isCurrentDay && canClaim() ? 'bg-amber-500' : 'bg-gray-300'}`}>
                    <Text className="text-white font-bold text-xs">{reward.day}</Text>
                  </View>
                  
                  {/* Reward content */}
                  <View className="items-center justify-center py-4">
                    {reward.reward.type === 'coins' ? (
                      <>
                        <View className={`rounded-full w-14 h-14 items-center justify-center ${isPastDay ? 'bg-gray-100' : 'bg-amber-100'}`}>
                          <Feather name="server" size={24} color={isPastDay ? '#9CA3AF' : '#B45309'} />
                        </View>
                        <Text className={`text-lg font-bold mt-2 ${isPastDay ? 'text-gray-400' : 'text-amber-700'}`}>{reward.reward.value}</Text>
                      </>
                    ) : (
                      <>
                        <View className={`rounded-full w-14 h-14 items-center justify-center ${isPastDay ? 'bg-gray-100' : 'bg-emerald-100'}`}>
                          <Feather 
                            name={reward.reward.itemId?.includes('food') ? 'coffee' : 'zap'} 
                            size={24} 
                            color={isPastDay ? '#9CA3AF' : reward.reward.itemId?.includes('food') ? '#F59E0B' : '#10B981'} 
                          />
                        </View>
                        <Text className={`text-sm font-bold mt-2 ${isPastDay ? 'text-gray-400' : 'text-gray-700'}`}>
                          {reward.reward.itemId === 'premium_food' ? 'Premium Food' : 'Super Toy'}
                        </Text>
                      </>
                    )}
                    
                    {/* Status indicators */}
                    {isPastDay && (
                      <View className="absolute inset-0 bg-white/80 items-center justify-center">
                        <Feather name="check-circle" size={28} color="#10B981" />
                      </View>
                    )}
                    
                    {isCurrentDay && canClaim() && (
                      <Animated.View style={[styles.glow, glowStyle]} className="absolute inset-0 rounded-xl bg-amber-200" />
                    )}
                  </View>
                </View>
              );
            })}
          </View>
        </View>
        
        {/* Claim button */}
        <View className="px-6 py-4">
          <TouchableOpacity
            className={`py-3 rounded-xl items-center ${canClaim() ? 'bg-amber-500' : 'bg-gray-300'}`}
            onPress={handleClaimReward}
            disabled={!canClaim()}
          >
            <Text className={`font-bold text-lg ${canClaim() ? 'text-white' : 'text-gray-500'}`}>
              {canClaim() ? 'Claim Daily Reward' : 'Already Claimed Today'}
            </Text>
          </TouchableOpacity>
          
          {!canClaim() && (
            <Text className="text-xs text-gray-500 text-center mt-2">
              Come back tomorrow for your next reward!
            </Text>
          )}
        </View>
      </View>
      
      {/* Reward popup */}
      {showRewardPopup && claimedReward && (
        <Animated.View 
          className="absolute inset-0 bg-black/50 items-center justify-center"
          entering={FadeIn.duration(300)}
          exiting={FadeOut.duration(300)}
        >
          <View className="bg-white rounded-2xl p-6 m-8 items-center">
            <Feather name="gift" size={40} color="#F59E0B" />
            <Text className="text-xl font-bold text-gray-800 mt-4 mb-2">Reward Claimed!</Text>
            
            {claimedReward.reward.type === 'coins' ? (
              <>
                <View className="bg-amber-100 rounded-full p-4 my-4">
                  <Feather name="server" size={36} color="#B45309" />
                </View>
                <Text className="text-amber-700 text-xl font-bold">+{claimedReward.reward.value} coins</Text>
              </>
            ) : (
              <>
                <View className={`bg-${claimedReward.reward.itemId?.includes('food') ? 'orange' : 'emerald'}-100 rounded-full p-4 my-4`}>
                  <Feather 
                    name={claimedReward.reward.itemId?.includes('food') ? 'coffee' : 'zap'} 
                    size={36} 
                    color={claimedReward.reward.itemId?.includes('food') ? '#F59E0B' : '#10B981'} 
                  />
                </View>
                <Text className="text-gray-700 text-xl font-bold">
                  {claimedReward.reward.itemId === 'premium_food' ? 'Premium Food' : 'Super Toy'}
                </Text>
                <Text className="text-gray-500 text-center mt-1">Added to your inventory</Text>
              </>
            )}
            
            <TouchableOpacity
              className="mt-6 bg-amber-500 py-3 px-6 rounded-xl w-full"
              onPress={() => setShowRewardPopup(false)}
            >
              <Text className="text-white font-bold text-center">Awesome!</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  rewardCard: {
    width: '30%', 
    aspectRatio: 1,
    position: 'relative',
    overflow: 'hidden',
  },
  glow: {
    position: 'absolute',
  },
});
import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useGameStore } from '../state/gameState';
import { formatNumber } from '../utils/gameUtils';
import Animated, { FadeIn } from 'react-native-reanimated';

// Mock history data
const mockActivityHistory = [
  { id: '1', type: 'feed', timestamp: Date.now() - 3600000, amount: 20 },
  { id: '2', type: 'play', timestamp: Date.now() - 7200000, amount: 15 },
  { id: '3', type: 'shop', timestamp: Date.now() - 10800000, item: 'Premium Kibble', cost: 50 },
  { id: '4', type: 'pet', timestamp: Date.now() - 18000000, amount: 5 },
  { id: '5', type: 'feed', timestamp: Date.now() - 86400000, amount: 20 },
  { id: '6', type: 'shop', timestamp: Date.now() - 172800000, item: 'Squeaky Bone', cost: 80 },
];

export const StatsScreen = () => {
  const insets = useSafeAreaInsets();
  const { coins, happiness, energy, resetStats } = useGameStore();
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  
  // Format timestamp to readable time
  const formatTime = (timestamp: number): string => {
    const date = new Date(timestamp);
    return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')} - ${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}`;
  };
  
  // Handle game reset
  const handleReset = () => {
    resetStats();
    setShowResetConfirm(false);
  };

  return (
    <SafeAreaView className="flex-1 bg-amber-50">
      <View className="flex-1" style={{ paddingBottom: insets.bottom }}>
        {/* Header */}
        <View className="flex-row justify-between items-center px-4 py-3">
          <Text className="text-xl font-bold text-amber-800">DogeStats</Text>
          <TouchableOpacity 
            className="bg-red-100 px-3 py-1 rounded-full"
            onPress={() => setShowResetConfirm(true)}
          >
            <Text className="text-red-700 font-medium">Reset Game</Text>
          </TouchableOpacity>
        </View>
        
        {/* Reset confirmation */}
        {showResetConfirm && (
          <Animated.View 
            className="bg-white m-4 rounded-xl p-4 shadow-md"
            entering={FadeIn.duration(300)}
          >
            <Text className="text-center text-gray-800 mb-3">Are you sure you want to reset all game progress?</Text>
            <View className="flex-row justify-around">
              <TouchableOpacity 
                className="bg-gray-200 px-5 py-2 rounded-lg"
                onPress={() => setShowResetConfirm(false)}
              >
                <Text className="font-medium">Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                className="bg-red-500 px-5 py-2 rounded-lg"
                onPress={handleReset}
              >
                <Text className="font-medium text-white">Reset</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        )}
        
        <ScrollView className="flex-1">
          {/* Current stats */}
          <View className="m-4 bg-white rounded-xl p-4 shadow-sm">
            <Text className="text-lg font-bold text-gray-800 mb-3">Current Stats</Text>
            
            <View className="flex-row justify-between mb-2">
              <Text className="text-gray-700">Coins:</Text>
              <View className="flex-row items-center">
                <Feather name="server" size={16} color="#B45309" />
                <Text className="text-amber-700 font-bold ml-1">{formatNumber(coins)}</Text>
              </View>
            </View>
            
            <View className="flex-row justify-between mb-2">
              <Text className="text-gray-700">Happiness:</Text>
              <View className="flex-row items-center">
                <Feather name="smile" size={16} color="#F59E0B" />
                <Text className="text-amber-700 font-bold ml-1">{parseFloat(happiness.toFixed(2))}%</Text>
              </View>
            </View>
            
            <View className="flex-row justify-between mb-2">
              <Text className="text-gray-700">Energy:</Text>
              <View className="flex-row items-center">
                <Feather name="battery" size={16} color="#3B82F6" />
                <Text className="text-amber-700 font-bold ml-1">{parseFloat(energy.toFixed(2))}%</Text>
              </View>
            </View>
          </View>
          
          {/* Achievements */}
          <View className="m-4 bg-white rounded-xl p-4 shadow-sm">
            <Text className="text-lg font-bold text-gray-800 mb-3">Achievements</Text>
            
            <View className="flex-row items-center mb-2">
              <View style={styles.achievementIcon} className="bg-amber-200">
                <Feather name={coins >= 500 ? "award" : "lock"} size={18} color={coins >= 500 ? "#B45309" : "#9CA3AF"} />
              </View>
              <View className="ml-3 flex-1">
                <Text className={`font-medium ${coins >= 500 ? "text-gray-800" : "text-gray-400"}`}>Doge Tycoon</Text>
                <Text className="text-xs text-gray-500">Collect 500 coins</Text>
              </View>
              <Text className={`${coins >= 500 ? "text-amber-500" : "text-gray-300"} font-bold`}>
                {coins >= 500 ? "✓" : `${Math.min(100, Math.round((coins / 500) * 100))}%`}
              </Text>
            </View>
            
            <View className="flex-row items-center mb-2">
              <View style={styles.achievementIcon} className="bg-blue-200">
                <Feather name={happiness >= 90 ? "thumbs-up" : "lock"} size={18} color={happiness >= 90 ? "#2563EB" : "#9CA3AF"} />
              </View>
              <View className="ml-3 flex-1">
                <Text className={`font-medium ${happiness >= 90 ? "text-gray-800" : "text-gray-400"}`}>Happy Doge</Text>
                <Text className="text-xs text-gray-500">Reach 90% happiness</Text>
              </View>
              <Text className={`${happiness >= 90 ? "text-amber-500" : "text-gray-300"} font-bold`}>
                {happiness >= 90 ? "✓" : `${Math.min(100, Math.round((happiness / 90) * 100))}%`}
              </Text>
            </View>
            
            <View className="flex-row items-center">
              <View style={styles.achievementIcon} className="bg-green-200">
                <Feather name={energy >= 95 ? "battery-charging" : "lock"} size={18} color={energy >= 95 ? "#059669" : "#9CA3AF"} />
              </View>
              <View className="ml-3 flex-1">
                <Text className={`font-medium ${energy >= 95 ? "text-gray-800" : "text-gray-400"}`}>Energetic Doge</Text>
                <Text className="text-xs text-gray-500">Reach 95% energy</Text>
              </View>
              <Text className={`${energy >= 95 ? "text-amber-500" : "text-gray-300"} font-bold`}>
                {energy >= 95 ? "✓" : `${Math.min(100, Math.round((energy / 95) * 100))}%`}
              </Text>
            </View>
          </View>
          
          {/* Activity history */}
          <View className="m-4 bg-white rounded-xl p-4 shadow-sm mb-4">
            <Text className="text-lg font-bold text-gray-800 mb-3">Recent Activity</Text>
            
            {mockActivityHistory.map((activity) => (
              <View key={activity.id} className="border-b border-gray-100 py-2 last:border-0">
                {activity.type === 'feed' && (
                  <View className="flex-row justify-between">
                    <View className="flex-row items-center">
                      <Feather name="coffee" size={14} color="#F59E0B" />
                      <Text className="ml-2 text-gray-700">Fed your Doge</Text>
                    </View>
                    <Text className="text-xs text-gray-500">{formatTime(activity.timestamp)}</Text>
                  </View>
                )}
                
                {activity.type === 'play' && (
                  <View className="flex-row justify-between">
                    <View className="flex-row items-center">
                      <Feather name="zap" size={14} color="#10B981" />
                      <Text className="ml-2 text-gray-700">Played with your Doge</Text>
                    </View>
                    <Text className="text-xs text-gray-500">{formatTime(activity.timestamp)}</Text>
                  </View>
                )}
                
                {activity.type === 'pet' && (
                  <View className="flex-row justify-between">
                    <View className="flex-row items-center">
                      <Feather name="hand" size={14} color="#6366F1" />
                      <Text className="ml-2 text-gray-700">Petted your Doge</Text>
                    </View>
                    <Text className="text-xs text-gray-500">{formatTime(activity.timestamp)}</Text>
                  </View>
                )}
                
                {activity.type === 'shop' && (
                  <View className="flex-row justify-between">
                    <View className="flex-row items-center">
                      <Feather name="shopping-bag" size={14} color="#8B5CF6" />
                      <Text className="ml-2 text-gray-700">
                        Bought {activity.item} (-{activity.cost})
                      </Text>
                    </View>
                    <Text className="text-xs text-gray-500">{formatTime(activity.timestamp)}</Text>
                  </View>
                )}
              </View>
            ))}
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  achievementIcon: {
    width: 36, 
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
import React from 'react';
import { View, Text } from 'react-native';
import { cn } from '../utils/cn';

interface ProgressBarProps {
  value: number;
  maxValue?: number;
  label?: string;
  color?: string;
  showValue?: boolean;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  value,
  maxValue = 100,
  label,
  color = 'bg-blue-500',
  showValue = true,
}) => {
  const percentage = Math.min(100, Math.max(0, (value / maxValue) * 100));

  return (
    <View className="mb-2 w-full">
      {label && (
        <View className="flex-row justify-between">
          <Text className="text-sm text-gray-700 mb-1">{label}</Text>
          {showValue && (
            <Text className="text-sm text-gray-700 mb-1">{parseFloat(value.toFixed(2))}/{maxValue}</Text>
          )}
        </View>
      )}
      <View className="h-3 bg-gray-200 rounded-full overflow-hidden">
        <View
          style={{ width: `${percentage}%` }}
          className={cn("h-full rounded-full", color)}
        />
      </View>
    </View>
  );
};
import React from 'react';
import { TouchableOpacity, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { cn } from '../utils/cn';

interface ActionButtonProps {
  label: string;
  onPress: () => void;
  icon?: keyof typeof Feather.glyphMap;
  color?: string;
  disabled?: boolean;
  cost?: number;
}

export const ActionButton: React.FC<ActionButtonProps> = ({
  label,
  onPress,
  icon,
  color = 'bg-amber-400',
  disabled = false,
  cost,
}) => {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      className={cn(
        "rounded-full py-2 px-5 items-center flex-row justify-center mx-1",
        color,
        disabled && "opacity-50"
      )}
    >
      {icon && <Feather name={icon} size={18} color="#333" className="mr-2" />}
      <Text className="font-medium text-gray-800">{label}</Text>
      {cost && (
        <View className="flex-row items-center ml-2">
          <Feather name="server" size={14} color="#333" />
          <Text className="font-bold text-gray-800 ml-1">{cost}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
};
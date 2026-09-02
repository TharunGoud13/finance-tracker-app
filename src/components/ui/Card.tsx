import React from 'react';
import { View, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import { HapticPressable } from './HapticPressable';

interface CardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  elevated?: boolean;
  onPress?: () => void;
  hapticType?: 'light' | 'medium' | 'selection';
}

export const Card: React.FC<CardProps> = ({
  children,
  style,
  elevated = false,
  onPress,
  hapticType = 'light',
}) => {
  const cardStyle = [
    styles.card,
    elevated && styles.elevated,
    style,
  ];

  if (onPress) {
    return (
      <HapticPressable
        onPress={onPress}
        hapticType={hapticType}
        style={cardStyle}
      >
        {children}
      </HapticPressable>
    );
  }

  return <View style={cardStyle}>{children}</View>;
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#121216',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    padding: 16,
    overflow: 'hidden',
  },
  elevated: {
    backgroundColor: '#18181f',
    borderColor: 'rgba(255, 255, 255, 0.12)',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 4,
  },
});

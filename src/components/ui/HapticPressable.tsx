import React from 'react';
import {
  Pressable,
  PressableProps,
  StyleSheet,
  ViewStyle,
  StyleProp,
} from 'react-native';
import { triggerHaptic } from '../../utils/haptics';

interface HapticPressableProps extends PressableProps {
  hapticType?: 'light' | 'medium' | 'heavy' | 'selection' | 'none';
  activeOpacity?: number;
  style?: StyleProp<ViewStyle> | ((state: { pressed: boolean }) => StyleProp<ViewStyle>);
  children?: React.ReactNode;
}

export const HapticPressable: React.FC<HapticPressableProps> = ({
  hapticType = 'light',
  activeOpacity = 0.75,
  onPress,
  style,
  children,
  disabled,
  ...rest
}) => {
  const handlePress = (e: any) => {
    if (disabled) return;
    if (hapticType !== 'none') {
      triggerHaptic[hapticType]();
    }
    onPress?.(e);
  };

  return (
    <Pressable
      onPress={handlePress}
      disabled={disabled}
      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      style={({ pressed }) => [
        typeof style === 'function' ? style({ pressed }) : style,
        pressed && !disabled && { opacity: activeOpacity },
        disabled && styles.disabled,
      ]}
      {...rest}
    >
      {children}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  disabled: {
    opacity: 0.5,
  },
});

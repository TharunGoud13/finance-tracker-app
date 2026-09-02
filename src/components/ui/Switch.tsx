import React from 'react';
import { StyleSheet, View, StyleProp, ViewStyle, Pressable } from 'react-native';
import { triggerHaptic } from '../../utils/haptics';

interface SwitchProps {
  value: boolean;
  onValueChange: (val: boolean) => void;
  disabled?: boolean;
  activeColor?: string;
  style?: StyleProp<ViewStyle>;
}

export const Switch: React.FC<SwitchProps> = ({
  value,
  onValueChange,
  disabled = false,
  activeColor = '#eb0028',
  style,
}) => {
  return (
    <Pressable
      onPress={() => {
        triggerHaptic.selection();
        onValueChange(!value);
      }}
      disabled={disabled}
      style={({ pressed }) => [
        styles.track,
        { backgroundColor: value ? activeColor : 'rgba(255, 255, 255, 0.16)' },
        disabled && styles.disabled,
        style,
        pressed && { opacity: 0.8 }
      ]}
    >
      <View
        style={[
          styles.thumb,
          value ? styles.thumbActive : styles.thumbInactive,
        ]}
      />
    </Pressable>
  );
};

const styles = StyleSheet.create({
  track: {
    width: 50,
    height: 30,
    borderRadius: 15,
    padding: 2,
    justifyContent: 'center',
  },
  thumb: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#ffffff',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 3,
    elevation: 3,
  },
  thumbActive: {
    alignSelf: 'flex-end',
  },
  thumbInactive: {
    alignSelf: 'flex-start',
  },
  disabled: {
    opacity: 0.45,
  },
});

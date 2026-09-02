import React from 'react';
import { View, StyleSheet, ViewStyle, StyleProp } from 'react-native';

interface ProgressBarProps {
  progress: number; // 0 to 100
  color?: string;
  trackColor?: string;
  height?: number;
  style?: StyleProp<ViewStyle>;
  overflowColor?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  progress,
  color = '#1a73e8',
  trackColor = 'rgba(255, 255, 255, 0.08)',
  height = 8,
  style,
  overflowColor = '#ef4444',
}) => {
  const isOverflow = progress > 100;
  const clampedProgress = Math.min(100, Math.max(0, progress));
  const activeColor = isOverflow ? overflowColor : color;

  return (
    <View
      style={[
        styles.track,
        {
          height,
          backgroundColor: trackColor,
          borderRadius: height / 2,
        },
        style,
      ]}
    >
      <View
        style={[
          styles.fill,
          {
            width: `${clampedProgress}%`,
            backgroundColor: activeColor,
            borderRadius: height / 2,
          },
        ]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  track: {
    width: '100%',
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
  },
});

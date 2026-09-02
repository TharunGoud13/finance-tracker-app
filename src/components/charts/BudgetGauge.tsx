import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle, G } from 'react-native-svg';

interface BudgetGaugeProps {
  percentageUsed: number;
  size?: number;
  strokeWidth?: number;
}

export const BudgetGauge: React.FC<BudgetGaugeProps> = ({
  percentageUsed,
  size = 120,
  strokeWidth = 12,
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const center = size / 2;

  const clamped = Math.min(100, Math.max(0, percentageUsed));
  const strokeDashoffset = circumference - (clamped / 100) * circumference;

  let gaugeColor = '#10b981';
  if (percentageUsed > 100) {
    gaugeColor = '#ef4444';
  } else if (percentageUsed >= 80) {
    gaugeColor = '#f59e0b';
  } else if (percentageUsed >= 60) {
    gaugeColor = '#38bdf8';
  }

  return (
    <View style={styles.container}>
      <View style={{ width: size, height: size, position: 'relative' }}>
        <Svg width={size} height={size}>
          <Circle
            cx={center}
            cy={center}
            r={radius}
            stroke="rgba(255, 255, 255, 0.08)"
            strokeWidth={strokeWidth}
            fill="none"
          />
          <G rotation="-90" origin={`${center}, ${center}`}>
            <Circle
              cx={center}
              cy={center}
              r={radius}
              stroke={gaugeColor}
              strokeWidth={strokeWidth}
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              fill="none"
            />
          </G>
        </Svg>
        <View style={[styles.centerTextContainer, { width: size, height: size }]}>
          <Text style={[styles.percentageText, { color: gaugeColor }]}>
            {percentageUsed}%
          </Text>
          <Text style={styles.labelText}>Used</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerTextContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  percentageText: {
    fontSize: 20,
    fontWeight: '800',
  },
  labelText: {
    fontSize: 11,
    color: '#94a3b8',
    fontWeight: '600',
    textTransform: 'uppercase',
  },
});

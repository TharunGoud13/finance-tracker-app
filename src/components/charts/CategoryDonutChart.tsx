import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle, G } from 'react-native-svg';
import { CategorySpending } from '../../types';
import { SensitiveAmount } from '../common/SensitiveAmount';

interface CategoryDonutChartProps {
  categories: CategorySpending[];
  totalExpensePaise: number;
  size?: number;
  strokeWidth?: number;
}

export const CategoryDonutChart: React.FC<CategoryDonutChartProps> = ({
  categories,
  totalExpensePaise,
  size = 180,
  strokeWidth = 24,
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const center = size / 2;

  // Filter categories with spending
  const activeCats = categories.filter((c) => c.spentPaise > 0);

  let accumulatedPercentage = 0;

  return (
    <View style={styles.container}>
      <View style={{ width: size, height: size, position: 'relative' }}>
        <Svg width={size} height={size}>
          {/* Background track circle */}
          <Circle
            cx={center}
            cy={center}
            r={radius}
            stroke="rgba(255, 255, 255, 0.06)"
            strokeWidth={strokeWidth}
            fill="none"
          />

          <G rotation="-90" origin={`${center}, ${center}`}>
            {activeCats.map((item) => {
              const fraction = totalExpensePaise > 0 ? item.spentPaise / totalExpensePaise : 0;
              const strokeDasharray = `${fraction * circumference} ${circumference}`;
              const strokeDashoffset = -(accumulatedPercentage * circumference);
              accumulatedPercentage += fraction;

              return (
                <Circle
                  key={item.categoryId}
                  cx={center}
                  cy={center}
                  r={radius}
                  stroke={item.category.color}
                  strokeWidth={strokeWidth}
                  strokeDasharray={strokeDasharray}
                  strokeDashoffset={strokeDashoffset}
                  fill="none"
                  strokeLinecap="round"
                />
              );
            })}
          </G>
        </Svg>

        {/* Center Text */}
        <View style={[styles.centerTextContainer, { width: size, height: size }]}>
          <Text style={styles.centerSub}>Total Spent</Text>
          <SensitiveAmount
            amountPaise={totalExpensePaise}
            compact
            style={styles.centerAmount}
          />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
  },
  centerTextContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerSub: {
    fontSize: 11,
    color: '#94a3b8',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  centerAmount: {
    fontSize: 18,
    fontWeight: '800',
    color: '#f8fafc',
    marginTop: 2,
  },
});

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Rect, Defs, LinearGradient, Stop, Line } from 'react-native-svg';
import { SensitiveAmount } from '../common/SensitiveAmount';

interface MonthlyBarChartProps {
  incomePaise: number;
  expensePaise: number;
  savingsPaise: number;
  height?: number;
}

export const MonthlyBarChart: React.FC<MonthlyBarChartProps> = ({
  incomePaise,
  expensePaise,
  savingsPaise,
  height = 160,
}) => {
  const maxVal = Math.max(incomePaise, expensePaise, Math.abs(savingsPaise), 100000); // at least ₹1000
  const chartHeight = height - 40;

  const getBarHeight = (paise: number) => {
    return Math.max(8, (Math.max(0, paise) / maxVal) * chartHeight);
  };

  const incomeHeight = getBarHeight(incomePaise);
  const expenseHeight = getBarHeight(expensePaise);
  const savingsHeight = getBarHeight(savingsPaise);

  return (
    <View style={styles.container}>
      <View style={styles.chartArea}>
        {/* SVG Bars */}
        <Svg width="100%" height={chartHeight} style={styles.svg}>
          <Defs>
            <LinearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0%" stopColor="#10b981" stopOpacity="1" />
              <Stop offset="100%" stopColor="#059669" stopOpacity="0.8" />
            </LinearGradient>
            <LinearGradient id="expenseGrad" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0%" stopColor="#f43f5e" stopOpacity="1" />
              <Stop offset="100%" stopColor="#be123c" stopOpacity="0.8" />
            </LinearGradient>
            <LinearGradient id="savingsGrad" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0%" stopColor="#1a73e8" stopOpacity="1" />
              <Stop offset="100%" stopColor="#0284c7" stopOpacity="0.8" />
            </LinearGradient>
          </Defs>

          {/* Grid lines */}
          <Line
            x1="0"
            y1={chartHeight - 1}
            x2="100%"
            y2={chartHeight - 1}
            stroke="rgba(255,255,255,0.08)"
            strokeWidth="1"
          />
          <Line
            x1="0"
            y1={chartHeight / 2}
            x2="100%"
            y2={chartHeight / 2}
            stroke="rgba(255,255,255,0.04)"
            strokeWidth="1"
            strokeDasharray="4, 4"
          />

          {/* Bar 1: Income */}
          <Rect
            x="15%"
            y={chartHeight - incomeHeight}
            width="18%"
            height={incomeHeight}
            rx="6"
            fill="url(#incomeGrad)"
          />

          {/* Bar 2: Expense */}
          <Rect
            x="41%"
            y={chartHeight - expenseHeight}
            width="18%"
            height={expenseHeight}
            rx="6"
            fill="url(#expenseGrad)"
          />

          {/* Bar 3: Savings */}
          <Rect
            x="67%"
            y={chartHeight - savingsHeight}
            width="18%"
            height={savingsHeight}
            rx="6"
            fill="url(#savingsGrad)"
          />
        </Svg>
      </View>

      {/* X Axis Labels and Values */}
      <View style={styles.legendRow}>
        <View style={styles.column}>
          <Text style={[styles.barLabel, { color: '#10b981' }]}>Income</Text>
          <SensitiveAmount
            amountPaise={incomePaise}
            compact
            style={styles.barValue}
          />
        </View>

        <View style={styles.column}>
          <Text style={[styles.barLabel, { color: '#f43f5e' }]}>Expense</Text>
          <SensitiveAmount
            amountPaise={expensePaise}
            compact
            style={styles.barValue}
          />
        </View>

        <View style={styles.column}>
          <Text style={[styles.barLabel, { color: '#38bdf8' }]}>Savings</Text>
          <SensitiveAmount
            amountPaise={savingsPaise}
            compact
            style={styles.barValue}
          />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  chartArea: {
    width: '100%',
    position: 'relative',
  },
  svg: {
    overflow: 'visible',
  },
  legendRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.06)',
  },
  column: {
    alignItems: 'center',
    flex: 1,
  },
  barLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 2,
  },
  barValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#f8fafc',
  },
});

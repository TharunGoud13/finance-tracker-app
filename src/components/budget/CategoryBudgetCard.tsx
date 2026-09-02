import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { CategoryBreakdownItem } from '../../types';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Icon } from '../ui/Icon';
import { SensitiveAmount } from '../common/SensitiveAmount';

interface CategoryBudgetCardProps {
  item: CategoryBreakdownItem;
  onPress: () => void;
}

export const CategoryBudgetCard: React.FC<CategoryBudgetCardProps> = ({
  item,
  onPress,
}) => {
  const { category, spentPaise, budgetLimitPaise, percentageUsed, healthStatus, hasBudget } = item;

  const getProgressColor = () => {
    switch (healthStatus) {
      case 'exceeded':
        return '#ff4d6a';
      case 'warning':
        return '#ff9f0a';
      case 'moderate':
        return '#30d158'; // changed to standard green for moderate instead of blue
      default:
        return '#30d158';
    }
  };

  const remainingPaise = hasBudget ? budgetLimitPaise - spentPaise : 0;
  const isOver = remainingPaise < 0;

  return (
    <Card style={styles.card} onPress={onPress}>
      <View style={styles.headerRow}>
        <View style={styles.headerLeft}>
          <View
            style={[
              styles.iconCircle,
              { backgroundColor: `${category.color}22` },
            ]}
          >
            <Icon name={category.icon || 'Tag'} size={20} color={category.color} />
          </View>
          <View style={styles.titleCol}>
            <Text style={styles.categoryName} numberOfLines={1}>
              {category.name}
            </Text>
            {hasBudget ? (
              <Text style={styles.remainingText}>
                {isOver ? 'Over by ' : 'Left: '}
                <SensitiveAmount
                  amountPaise={Math.abs(remainingPaise)}
                  compact
                  style={[styles.remainingAmount, isOver && { color: '#ff4d6a' }]}
                />
              </Text>
            ) : (
              <Text style={styles.remainingText}>No Limit Set</Text>
            )}
          </View>
        </View>

        <View style={styles.spentCol}>
          <SensitiveAmount
            amountPaise={spentPaise}
            style={styles.spentValue}
          />
          {hasBudget && (
            <Text style={styles.totalText}>of <SensitiveAmount amountPaise={budgetLimitPaise} compact /></Text>
          )}
        </View>
      </View>

      {/* Progress Bar Area */}
      {hasBudget && (
        <View style={styles.progressContainer}>
          <View style={styles.progressBarBg}>
            <View
              style={[
                styles.progressBarFill,
                {
                  width: `${Math.min(percentageUsed, 100)}%`,
                  backgroundColor: getProgressColor(),
                },
              ]}
            />
          </View>
          <Text style={[styles.percentText, healthStatus === 'exceeded' && { color: '#ff4d6a' }]}>
            {percentageUsed}%
          </Text>
        </View>
      )}
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#1c1c22',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 10,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    flexShrink: 0,
  },
  titleCol: {
    flex: 1,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
    letterSpacing: -0.3,
    marginBottom: 2,
  },
  remainingText: {
    fontSize: 13,
    color: 'rgba(235, 235, 245, 0.6)',
    flexDirection: 'row',
    alignItems: 'center',
  },
  remainingAmount: {
    fontSize: 13,
    fontWeight: '600',
    color: 'rgba(235, 235, 245, 0.8)',
  },
  spentCol: {
    alignItems: 'flex-end',
  },
  spentValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 2,
  },
  totalText: {
    fontSize: 12,
    color: 'rgba(235, 235, 245, 0.4)',
    flexDirection: 'row',
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  progressBarBg: {
    flex: 1,
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  percentText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(235, 235, 245, 0.6)',
    width: 38,
    textAlign: 'right',
  },
});

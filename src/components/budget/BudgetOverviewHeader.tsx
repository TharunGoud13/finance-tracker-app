import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MonthlyFinancialSummary } from '../../types';
import { SensitiveAmount } from '../common/SensitiveAmount';
import { Icon } from '../ui/Icon';

interface BudgetOverviewHeaderProps {
  summary: MonthlyFinancialSummary;
}

export const BudgetOverviewHeader: React.FC<BudgetOverviewHeaderProps> = ({
  summary,
}) => {
  const allocationPercentage =
    summary.totalIncomePaise > 0
      ? Math.round((summary.totalAllocatedBudgetPaise / summary.totalIncomePaise) * 100)
      : 0;

  const isWarning = summary.isOverAllocated;

  return (
    <View style={[styles.container, isWarning && styles.containerWarning]}>
      <View style={styles.topRow}>
        <Text style={styles.title}>Budget Allocation</Text>
        <View style={styles.percentBadge}>
          <Text style={styles.percentText}>{allocationPercentage}%</Text>
        </View>
      </View>

      <View style={styles.mainAmountContainer}>
        <SensitiveAmount
          amountPaise={summary.totalAllocatedBudgetPaise}
          style={styles.mainAmount}
        />
        <Text style={styles.subText}>of</Text>
        <SensitiveAmount
          amountPaise={summary.totalIncomePaise}
          style={styles.totalAmount}
        />
        <Text style={styles.subText}>income</Text>
      </View>

      <View style={styles.progressBarBg}>
        <View
          style={[
            styles.progressBarFill,
            { width: `${Math.min(allocationPercentage, 100)}%` },
            isWarning && { backgroundColor: '#ff4d6a' },
          ]}
        />
      </View>

      <View style={styles.footerRow}>
        <View style={styles.footerItem}>
          <View style={[styles.dot, { backgroundColor: '#38bdf8' }]} />
          <Text style={styles.footerLabel}>Unallocated</Text>
          <SensitiveAmount
            amountPaise={summary.unallocatedIncomePaise}
            compact
            style={styles.footerValue}
          />
        </View>

        {isWarning && (
          <View style={styles.warningPill}>
            <Icon name="AlertTriangle" size={12} color="#ff4d6a" />
            <Text style={styles.warningText}>Over-allocated</Text>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 20,
    borderRadius: 24,
    backgroundColor: '#1c1c22',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  containerWarning: {
    borderColor: 'rgba(255, 77, 106, 0.3)',
    backgroundColor: 'rgba(255, 77, 106, 0.05)',
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
  },
  percentBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  percentText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#ffffff',
  },
  mainAmountContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 16,
    flexWrap: 'wrap',
    gap: 6,
  },
  mainAmount: {
    fontSize: 28,
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: -0.5,
  },
  subText: {
    fontSize: 15,
    fontWeight: '600',
    color: 'rgba(235, 235, 245, 0.5)',
  },
  totalAmount: {
    fontSize: 18,
    fontWeight: '700',
    color: 'rgba(235, 235, 245, 0.8)',
  },
  progressBarBg: {
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 16,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#ffffff',
    borderRadius: 4,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  footerItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  footerLabel: {
    fontSize: 13,
    color: 'rgba(235, 235, 245, 0.6)',
    marginRight: 6,
  },
  footerValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#ffffff',
  },
  warningPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 77, 106, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  warningText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#ff4d6a',
  },
});

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MonthlyFinancialSummary } from '../../types';
import { Card } from '../ui/Card';
import { Icon } from '../ui/Icon';
import { SensitiveAmount } from '../common/SensitiveAmount';

interface SummaryCardsProps {
  summary: MonthlyFinancialSummary;
}

export const SummaryCards: React.FC<SummaryCardsProps> = ({ summary }) => {
  const isIncomePositive = summary.incomeChangePercentage >= 0;
  const isExpenseLower = summary.expenseChangePercentage <= 0;

  return (
    <View style={styles.container}>
      {/* 1. Main Hero Card - Net Remaining Balance */}
      <Card style={styles.heroCard}>
        <View style={styles.heroTopRow}>
          <View style={styles.heroLabelRow}>
            <View style={styles.heroIconBox}>
              <Icon name="Wallet" size={14} color="#eb0028" />
            </View>
            <Text style={styles.heroLabel}>Net Balance</Text>
          </View>

          {summary.totalIncomePaise > 0 && (
            <View style={styles.savingsBadge}>
              <Icon name="TrendingUp" size={11} color="#ff2d55" style={{ marginRight: 4 }} />
              <Text style={styles.savingsBadgeText}>
                {summary.savingsRate}% Saved
              </Text>
            </View>
          )}
        </View>

        <SensitiveAmount
          amountPaise={summary.remainingBalancePaise}
          style={styles.heroAmount}
        />

        <View style={styles.heroBottomRow}>
          <Text style={styles.heroSubtext}>
            {summary.remainingBalancePaise >= 0
              ? 'Available for savings & future goals'
              : 'Deficit spending this month'}
          </Text>
        </View>
      </Card>

      {/* 2. Side-by-Side Income & Expenses Cards */}
      <View style={styles.subGrid}>
        {/* Income Card */}
        <Card style={styles.subCard}>
          <View style={styles.subHeader}>
            <View style={[styles.iconCircle, { backgroundColor: 'rgba(48, 209, 88, 0.15)' }]}>
              <Icon name="ArrowDownLeft" size={16} color="#30d158" />
            </View>
            <Text style={styles.subLabel}>Income</Text>
          </View>

          <SensitiveAmount
            amountPaise={summary.totalIncomePaise}
            style={[styles.subAmount, { color: '#30d158' }]}
          />

          {summary.prevMonthIncomePaise > 0 && (
            <View style={styles.trendRow}>
              <Icon
                name={isIncomePositive ? 'TrendingUp' : 'TrendingDown'}
                size={12}
                color={isIncomePositive ? '#30d158' : 'rgba(235, 235, 245, 0.5)'}
              />
              <Text style={styles.trendText}>
                {Math.abs(summary.incomeChangePercentage)}% vs last mo
              </Text>
            </View>
          )}
        </Card>

        {/* Expense Card */}
        <Card style={styles.subCard}>
          <View style={styles.subHeader}>
            <View style={[styles.iconCircle, { backgroundColor: 'rgba(235, 0, 40, 0.15)' }]}>
              <Icon name="ArrowUpRight" size={16} color="#eb0028" />
            </View>
            <Text style={styles.subLabel}>Expenses</Text>
          </View>

          <SensitiveAmount
            amountPaise={summary.totalExpensePaise}
            style={[styles.subAmount, { color: '#ffffff' }]}
          />

          {summary.prevMonthExpensePaise > 0 && (
            <View style={styles.trendRow}>
              <Icon
                name={isExpenseLower ? 'TrendingDown' : 'TrendingUp'}
                size={12}
                color={isExpenseLower ? '#30d158' : '#eb0028'}
              />
              <Text style={styles.trendText}>
                {Math.abs(summary.expenseChangePercentage)}% vs last mo
              </Text>
            </View>
          )}
        </Card>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  heroCard: {
    backgroundColor: '#121216',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    marginBottom: 12,
  },
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  heroLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  heroIconBox: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(235, 0, 40, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  heroLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(235, 235, 245, 0.65)',
    letterSpacing: 0.2,
  },
  savingsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(235, 0, 40, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(235, 0, 40, 0.25)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  savingsBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#ff2d55',
  },
  heroAmount: {
    fontSize: 34,
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: -0.5,
  },
  heroBottomRow: {
    marginTop: 8,
  },
  heroSubtext: {
    fontSize: 13,
    color: 'rgba(235, 235, 245, 0.5)',
  },
  subGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  subCard: {
    flex: 1,
    backgroundColor: '#121216',
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  subHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 8,
  },
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  subLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: 'rgba(235, 235, 245, 0.65)',
    flexShrink: 1,
  },
  subAmount: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  trendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    gap: 4,
  },
  trendText: {
    fontSize: 11,
    color: 'rgba(235, 235, 245, 0.5)',
  },
});

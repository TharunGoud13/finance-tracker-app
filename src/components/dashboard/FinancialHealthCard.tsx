import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { HealthScoreResult } from '../../types';
import { Card } from '../ui/Card';
import { Badge, BadgeVariant } from '../ui/Badge';
import { ProgressBar } from '../ui/ProgressBar';
import { Icon } from '../ui/Icon';

interface FinancialHealthCardProps {
  healthScore: HealthScoreResult;
}

export const FinancialHealthCard: React.FC<FinancialHealthCardProps> = ({
  healthScore,
}) => {
  const getBadgeVariant = (): BadgeVariant => {
    switch (healthScore.rating) {
      case 'Excellent':
        return 'healthy';
      case 'Good':
        return 'moderate';
      case 'Needs Attention':
        return 'warning';
      case 'Critical':
        return 'exceeded';
    }
  };

  const getScoreColor = () => {
    if (healthScore.score >= 80) return '#30d158';
    if (healthScore.score >= 60) return '#0a84ff';
    if (healthScore.score >= 40) return '#ff9f0a';
    return '#eb0028';
  };

  return (
    <View style={styles.container}>
      <Card style={styles.card}>
        {/* Header Row: Clean flex layout to prevent any badge/text overlap */}
        <View style={styles.headerRow}>
          <View style={styles.headerLeft}>
            <View style={styles.iconCircle}>
              <Icon name="Activity" size={18} color="#30d158" />
            </View>
            <View style={styles.titleColumn}>
              <Text style={styles.title} numberOfLines={1}>
                Spending Health
              </Text>
              <Text style={styles.subtitle} numberOfLines={1}>
                Personal financial discipline score
              </Text>
            </View>
          </View>

          <Badge
            label={healthScore.rating}
            variant={getBadgeVariant()}
            size="sm"
          />
        </View>

        {/* Score & Summary Row */}
        <View style={styles.scoreRow}>
          <View style={styles.scoreBlock}>
            <Text style={[styles.scoreNumber, { color: getScoreColor() }]}>
              {healthScore.score}
            </Text>
            <Text style={styles.scoreMax}> / 100</Text>
          </View>
          <Text style={styles.summaryText} numberOfLines={2}>
            {healthScore.description}
          </Text>
        </View>

        {/* Progress Bar */}
        <ProgressBar
          progress={healthScore.score}
          color={getScoreColor()}
          height={6}
          style={styles.progressBar}
        />

        {/* Breakdown Metric Cells */}
        <View style={styles.breakdownGrid}>
          <View style={styles.metricCell}>
            <Text style={styles.metricLabel}>Savings Rate</Text>
            <Text style={styles.metricValue}>
              {healthScore.breakdown.savingsRateScore}/35
            </Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.metricCell}>
            <Text style={styles.metricLabel}>Budget Adherence</Text>
            <Text style={styles.metricValue}>
              {healthScore.breakdown.budgetAdherenceScore}/35
            </Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.metricCell}>
            <Text style={styles.metricLabel}>Expense Ratio</Text>
            <Text style={styles.metricValue}>
              {healthScore.breakdown.expenseRatioScore}/30
            </Text>
          </View>
        </View>
      </Card>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  card: {
    backgroundColor: '#121216',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
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
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(48, 209, 88, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    flexShrink: 0,
  },
  titleColumn: {
    flex: 1,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    color: '#ffffff',
    letterSpacing: -0.2,
  },
  subtitle: {
    fontSize: 12,
    color: 'rgba(235, 235, 245, 0.6)',
    marginTop: 1,
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: 6,
    gap: 12,
  },
  scoreBlock: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  scoreNumber: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  scoreMax: {
    fontSize: 14,
    color: 'rgba(235, 235, 245, 0.4)',
    fontWeight: '600',
  },
  summaryText: {
    flex: 1,
    fontSize: 12,
    color: 'rgba(235, 235, 245, 0.65)',
    lineHeight: 16,
  },
  progressBar: {
    marginVertical: 12,
  },
  breakdownGrid: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#18181f',
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 6,
  },
  metricCell: {
    flex: 1,
    alignItems: 'center',
  },
  metricLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: 'rgba(235, 235, 245, 0.5)',
    marginBottom: 2,
    textAlign: 'center',
  },
  metricValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#ffffff',
  },
  divider: {
    width: 1,
    height: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
});

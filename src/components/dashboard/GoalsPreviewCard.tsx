import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useGoalStore } from '../../store/useGoalStore';
import { Card } from '../ui/Card';
import { ProgressBar } from '../ui/ProgressBar';
import { Icon } from '../ui/Icon';
import { HapticPressable } from '../ui/HapticPressable';
import { SensitiveAmount } from '../common/SensitiveAmount';

export const GoalsPreviewCard: React.FC = () => {
  const router = useRouter();
  const goals = useGoalStore((state) => state.goals);

  if (goals.length === 0) return null;

  return (
    <View style={styles.container}>
      <Card style={styles.card}>
        <View style={styles.headerRow}>
          <View style={styles.headerLeft}>
            <View style={styles.iconCircle}>
              <Icon name="Target" size={16} color="#0a84ff" />
            </View>
            <Text style={styles.headerTitle}>Savings Targets</Text>
          </View>
          <HapticPressable
            onPress={() => router.push('/modal/savings-goals')}
            hapticType="light"
            style={styles.manageBtn}
          >
            <Text style={styles.manageText}>Manage</Text>
            <Icon name="ChevronRight" size={14} color="#0a84ff" />
          </HapticPressable>
        </View>

        <View style={styles.goalsList}>
          {goals.slice(0, 2).map((goal, idx) => {
            const progress = Math.min(
              100,
              Math.round((goal.currentAmount / goal.targetAmount) * 100)
            );

            return (
              <View
                key={goal.id}
                style={[
                  styles.goalItem,
                  idx > 0 && styles.goalItemBorder,
                ]}
              >
                <View style={styles.goalTop}>
                  <View style={styles.goalTitleRow}>
                    <Icon
                      name={goal.icon || 'Shield'}
                      size={16}
                      color={goal.color || '#30d158'}
                      style={{ marginRight: 8 }}
                    />
                    <Text style={styles.goalTitle} numberOfLines={1}>
                      {goal.title}
                    </Text>
                  </View>
                  <Text style={[styles.goalPct, { color: goal.color || '#30d158' }]}>
                    {progress}%
                  </Text>
                </View>

                <ProgressBar
                  progress={progress}
                  color={goal.color || '#30d158'}
                  height={5}
                  style={styles.progressBar}
                />

                <View style={styles.goalBottom}>
                  <Text style={styles.savedLabel}>Saved</Text>
                  <View style={styles.amountsRow}>
                    <SensitiveAmount
                      amountPaise={goal.currentAmount}
                      style={styles.currentAmountText}
                    />
                    <Text style={styles.slashText}> / </Text>
                    <SensitiveAmount
                      amountPaise={goal.targetAmount}
                      style={styles.targetAmountText}
                    />
                  </View>
                </View>
              </View>
            );
          })}
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
  },
  iconCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(10, 132, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#ffffff',
  },
  manageBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  manageText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0a84ff',
  },
  goalsList: {
    gap: 12,
  },
  goalItem: {
    paddingTop: 2,
  },
  goalItemBorder: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.06)',
    paddingTop: 12,
  },
  goalTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  goalTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },
  goalTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
  },
  goalPct: {
    fontSize: 13,
    fontWeight: '700',
  },
  progressBar: {
    marginBottom: 6,
  },
  goalBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  savedLabel: {
    fontSize: 11,
    color: 'rgba(235, 235, 245, 0.5)',
  },
  amountsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  currentAmountText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#ffffff',
  },
  slashText: {
    fontSize: 12,
    color: 'rgba(235, 235, 245, 0.4)',
  },
  targetAmountText: {
    fontSize: 12,
    fontWeight: '500',
    color: 'rgba(235, 235, 245, 0.6)',
  },
});

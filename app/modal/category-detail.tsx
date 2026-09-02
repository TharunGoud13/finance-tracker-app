import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useBudgetStore } from '../../src/store/useBudgetStore';
import { useTransactionStore } from '../../src/store/useTransactionStore';
import { useSettingsStore } from '../../src/store/useSettingsStore';
import { ScreenHeader } from '../../src/components/common/ScreenHeader';
import { Card } from '../../src/components/ui/Card';
import { Badge } from '../../src/components/ui/Badge';
import { ProgressBar } from '../../src/components/ui/ProgressBar';
import { Button } from '../../src/components/ui/Button';
import { Icon } from '../../src/components/ui/Icon';
import { SensitiveAmount } from '../../src/components/common/SensitiveAmount';
import { TransactionItem } from '../../src/components/transaction/TransactionItem';
import { EmptyState } from '../../src/components/common/EmptyState';
import {
  calculateCategorySpending,
  calculateBudgetUsage,
  getBudgetHealthStatus,
  getPreviousMonth,
  isSameMonth,
} from '../../src/utils/calculations';
import { parseInputToPaise, paiseToInputString, formatCurrency, formatMonthYear } from '../../src/utils/formatters';

export default function CategoryDetailModal() {
  const router = useRouter();
  const { categoryId, month: paramMonth } = useLocalSearchParams<{
    categoryId: string;
    month?: string;
  }>();

  const selectedMonth = useBudgetStore((state) => state.selectedMonth);
  const month = paramMonth || selectedMonth;

  const categories = useBudgetStore((state) => state.categories);
  const budgets = useBudgetStore((state) => state.budgets);
  const setBudget = useBudgetStore((state) => state.setBudget);
  const transactions = useTransactionStore((state) => state.transactions);
  const currency = useSettingsStore((state) => state.settings.currency);

  const [isEditBudgetModalVisible, setIsEditBudgetModalVisible] = useState(false);
  const [budgetLimitInput, setBudgetLimitInput] = useState('');

  const category = categories.find((c) => c.id === categoryId);
  const budget = budgets.find((b) => b.categoryId === categoryId && b.month === month);
  const budgetLimitPaise = budget ? budget.limit : 0;

  // Monthly stats
  const spentPaise = useMemo(
    () => calculateCategorySpending(transactions, categoryId, month),
    [transactions, categoryId, month]
  );

  const prevMonth = getPreviousMonth(month);
  const prevSpentPaise = useMemo(
    () => calculateCategorySpending(transactions, categoryId, prevMonth),
    [transactions, categoryId, prevMonth]
  );

  const diffPaise = spentPaise - prevSpentPaise;
  const isSpendingHigher = diffPaise > 0;

  const percentageUsed = calculateBudgetUsage(spentPaise, budgetLimitPaise);
  const remainingPaise = Math.max(0, budgetLimitPaise - spentPaise);
  const healthStatus = getBudgetHealthStatus(percentageUsed);

  // Category transactions
  const categoryTransactions = useMemo(
    () =>
      transactions
        .filter((tx) => tx.categoryId === categoryId && isSameMonth(tx.date, month))
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    [transactions, categoryId, month]
  );

  if (!category) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar style="light" />
        <ScreenHeader title="Category Not Found" showBack onBack={() => router.back()} />
      </SafeAreaView>
    );
  }

  const handleSaveBudget = async () => {
    const paise = parseInputToPaise(budgetLimitInput, currency);
    await setBudget(category.id, paise, month);
    setIsEditBudgetModalVisible(false);
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <StatusBar style="light" />
      <View style={styles.container}>
        <ScreenHeader
          title={category.name}
          subtitle={`Analytics for ${formatMonthYear(month)}`}
          showBack
          onBack={() => router.back()}
        />

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
          {/* 1. Main Category Hero Summary Card */}
          <Card style={styles.heroCard}>
            <View style={styles.heroHeader}>
              <View style={styles.catTitleRow}>
                <View
                  style={[
                    styles.iconCircle,
                    { backgroundColor: `${category.color}22`, borderColor: `${category.color}44` },
                  ]}
                >
                  <Icon name={category.icon || 'Tag'} size={22} color={category.color} />
                </View>
                <View>
                  <Text style={styles.heroTitle}>{category.name}</Text>
                  <Text style={styles.heroSub}>{category.type.toUpperCase()}</Text>
                </View>
              </View>

              {budgetLimitPaise > 0 && (
                <Badge
                  label={`${percentageUsed}% ${healthStatus.toUpperCase()}`}
                  variant={healthStatus}
                />
              )}
            </View>

            {/* Spent vs Budget Grid */}
            <View style={styles.statsGrid}>
              <View style={styles.statBox}>
                <Text style={styles.statLabel}>Spent This Month</Text>
                <SensitiveAmount
                  amountPaise={spentPaise}
                  style={styles.statValue}
                />
              </View>

              <View style={styles.statDivider} />

              <View style={styles.statBox}>
                <Text style={styles.statLabel}>Monthly Limit</Text>
                {budgetLimitPaise > 0 ? (
                  <SensitiveAmount
                    amountPaise={budgetLimitPaise}
                    style={styles.statValue}
                  />
                ) : (
                  <Text style={[styles.statValue, { color: 'rgba(235, 235, 245, 0.4)' }]}>None</Text>
                )}
              </View>

              <View style={styles.statDivider} />

              <View style={styles.statBox}>
                <Text style={styles.statLabel}>Remaining</Text>
                {budgetLimitPaise > 0 ? (
                  <SensitiveAmount
                    amountPaise={remainingPaise}
                    style={[
                      styles.statValue,
                      { color: remainingPaise > 0 ? '#30d158' : '#eb0028' },
                    ]}
                  />
                ) : (
                  <Text style={[styles.statValue, { color: 'rgba(235, 235, 245, 0.4)' }]}>—</Text>
                )}
              </View>
            </View>

            {budgetLimitPaise > 0 && (
              <ProgressBar
                progress={percentageUsed}
                color={
                  healthStatus === 'exceeded'
                    ? '#eb0028'
                    : healthStatus === 'warning'
                    ? '#ff9f0a'
                    : healthStatus === 'moderate'
                    ? '#0a84ff'
                    : '#30d158'
                }
                height={6}
                style={{ marginTop: 16 }}
              />
            )}

            {/* Edit Budget Button */}
            <Button
              title={budgetLimitPaise > 0 ? 'Edit Budget Limit' : 'Set Budget Limit'}
              icon="Pencil"
              variant="secondary"
              size="sm"
              onPress={() => {
                setBudgetLimitInput(
                  budgetLimitPaise > 0 ? paiseToInputString(budgetLimitPaise, currency) : ''
                );
                setIsEditBudgetModalVisible(true);
              }}
              style={{ marginTop: 16 }}
            />
          </Card>

          {/* 2. Month-over-Month Comparison Card */}
          {prevSpentPaise > 0 && (
            <Card style={styles.trendCard}>
              <View style={styles.trendRow}>
                <View
                  style={[
                    styles.trendIconCircle,
                    { backgroundColor: isSpendingHigher ? 'rgba(235, 0, 40, 0.15)' : 'rgba(48, 209, 88, 0.15)' },
                  ]}
                >
                  <Icon
                    name={isSpendingHigher ? 'TrendingUp' : 'TrendingDown'}
                    size={18}
                    color={isSpendingHigher ? '#eb0028' : '#30d158'}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.trendTitle}>Comparison with Previous Month</Text>
                  <Text style={styles.trendDesc}>
                    You spent {formatCurrency(Math.abs(diffPaise), currency)}{' '}
                    {isSpendingHigher ? 'more' : 'less'} compared to last month ({formatCurrency(prevSpentPaise, currency)}).
                  </Text>
                </View>
              </View>
            </Card>
          )}

          {/* 3. Category Transactions History */}
          <View style={styles.historySection}>
            <View style={styles.historyHeader}>
              <Text style={styles.historyTitle}>
                Transactions ({categoryTransactions.length})
              </Text>
            </View>

            {categoryTransactions.length === 0 ? (
              <EmptyState
                icon="Receipt"
                title="No Transactions"
                message={`No transactions recorded under ${category.name} in ${formatMonthYear(month)}.`}
                actionTitle="Add Expense"
                onAction={() => router.push('/modal/add-transaction')}
              />
            ) : (
              categoryTransactions.map((tx) => (
                <TransactionItem
                  key={tx.id}
                  transaction={tx}
                  category={category}
                  onPress={() => {
                    router.push({
                      pathname: '/modal/edit-transaction',
                      params: { transactionId: tx.id },
                    });
                  }}
                />
              ))
            )}
          </View>
        </ScrollView>

        {/* Set / Edit Budget Modal */}
        <Modal
          visible={isEditBudgetModalVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setIsEditBudgetModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Set {category.name} Budget</Text>
              <Text style={styles.modalSub}>
                Enter monthly limit for {formatMonthYear(month)}
              </Text>

              <View style={styles.inputWrapper}>
                <TextInput
                  value={budgetLimitInput}
                  onChangeText={setBudgetLimitInput}
                  placeholder="0"
                  placeholderTextColor="rgba(235, 235, 245, 0.35)"
                  keyboardType="numeric"
                  autoFocus
                  style={styles.budgetInput}
                />
              </View>

              <View style={{ flexDirection: 'row', gap: 12, marginTop: 16 }}>
                <Button
                  title="Cancel"
                  variant="secondary"
                  onPress={() => setIsEditBudgetModalVisible(false)}
                  style={{ flex: 1 }}
                />
                <Button
                  title="Save Limit"
                  variant="primary"
                  onPress={handleSaveBudget}
                  style={{ flex: 1 }}
                />
              </View>
            </View>
          </View>
        </Modal>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#000000',
  },
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  heroCard: {
    padding: 18,
    borderRadius: 20,
    backgroundColor: '#121216',
    borderColor: 'rgba(255, 255, 255, 0.08)',
    marginBottom: 16,
  },
  heroHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  catTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  heroTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
  },
  heroSub: {
    fontSize: 11,
    color: 'rgba(235, 235, 245, 0.6)',
    fontWeight: '600',
    marginTop: 2,
  },
  statsGrid: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#18181f',
    borderRadius: 14,
    padding: 12,
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 11,
    color: 'rgba(235, 235, 245, 0.55)',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ffffff',
  },
  statDivider: {
    width: 1,
    height: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  trendCard: {
    padding: 14,
    borderRadius: 16,
    backgroundColor: '#121216',
    marginBottom: 16,
  },
  trendRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  trendIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  trendTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 2,
  },
  trendDesc: {
    fontSize: 12,
    color: 'rgba(235, 235, 245, 0.65)',
    lineHeight: 16,
  },
  historySection: {
    marginTop: 8,
  },
  historyHeader: {
    marginBottom: 12,
  },
  historyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  modalContent: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: '#121216',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    padding: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 4,
    textAlign: 'center',
  },
  modalSub: {
    fontSize: 12,
    color: 'rgba(235, 235, 245, 0.6)',
    textAlign: 'center',
    marginBottom: 16,
  },
  inputWrapper: {
    backgroundColor: '#18181f',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  budgetInput: {
    fontSize: 28,
    fontWeight: '800',
    color: '#ffffff',
    textAlign: 'center',
  },
});

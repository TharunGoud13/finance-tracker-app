import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { useTransactionStore } from '../../src/store/useTransactionStore';
import { useBudgetStore } from '../../src/store/useBudgetStore';
import { useSettingsStore } from '../../src/store/useSettingsStore';
import { THEME } from '../../src/constants/theme';
import { Icon } from '../../src/components/ui/Icon';
import { formatCurrency, formatDate, getGreeting } from '../../src/utils/formatters';
import { triggerHaptic } from '../../src/utils/haptics';

export default function DashboardScreen() {
  const router = useRouter();

  const transactions = useTransactionStore((state) => state.transactions);
  const budgets = useBudgetStore((state) => state.budgets);
  const categories = useBudgetStore((state) => state.categories);
  const selectedMonth = useBudgetStore((state) => state.selectedMonth);

  const settings = useSettingsStore((state) => state.settings);
  const currency = settings.currency;
  const userName = settings.userName;

  const [isReminderDismissed, setIsReminderDismissed] = useState(false);

  // In-app expense reminder if last expense was > reminderIntervalHours ago
  const showExpenseReminderPrompt = useMemo(() => {
    if (isReminderDismissed || !settings.notificationsEnabled) return false;
    const expenseTxs = transactions
      .filter((tx) => tx.type === 'expense')
      .sort(
        (a, b) =>
          new Date(b.createdAt || b.date).getTime() - new Date(a.createdAt || a.date).getTime()
      );

    if (expenseTxs.length === 0) return true;

    const lastExpenseTime = new Date(
      expenseTxs[0].createdAt || expenseTxs[0].date
    ).getTime();
    const diffHours = (Date.now() - lastExpenseTime) / (1000 * 60 * 60);
    return diffHours >= (settings.reminderIntervalHours || 3);
  }, [
    transactions,
    isReminderDismissed,
    settings.notificationsEnabled,
    settings.reminderIntervalHours,
  ]);

  const categoryMap = useMemo(
    () => new Map(categories.map((c) => [c.id, c])),
    [categories]
  );

  // Filter current month transactions
  const monthTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      const txMonth = tx.date ? tx.date.substring(0, 7) : '';
      return txMonth === selectedMonth;
    });
  }, [transactions, selectedMonth]);

  // Financial Metrics
  const { totalIncome, totalExpense, totalInvestment, netBalance } = useMemo(() => {
    let income = 0;
    let expense = 0;
    let investment = 0;
    for (const tx of monthTransactions) {
      if (tx.type === 'income') {
        income += tx.amount;
      } else if (tx.type === 'investment') {
        investment += tx.amount;
      } else {
        expense += tx.amount;
      }
    }
    return {
      totalIncome: income,
      totalExpense: expense,
      totalInvestment: investment,
      netBalance: income - expense - investment,
    };
  }, [monthTransactions]);

  // Overall Monthly Budget
  const totalBudgetLimit = useMemo(() => {
    return budgets
      .filter((b) => b.month === selectedMonth)
      .reduce((sum, b) => sum + b.limit, 0);
  }, [budgets, selectedMonth]);

  const budgetProgress =
    totalBudgetLimit > 0
      ? Math.min(100, Math.round((totalExpense / totalBudgetLimit) * 100))
      : 0;

  // Category Spending breakdown for top categories
  const topCategories = useMemo(() => {
    const spendingByCat: Record<string, number> = {};
    for (const tx of monthTransactions) {
      if (tx.type === 'expense') {
        spendingByCat[tx.categoryId] = (spendingByCat[tx.categoryId] || 0) + tx.amount;
      }
    }
    return Object.entries(spendingByCat)
      .map(([catId, amount]) => ({
        category: categoryMap.get(catId),
        amount,
        percent: totalExpense > 0 ? Math.round((amount / totalExpense) * 100) : 0,
      }))
      .filter((item) => item.category)
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 4);
  }, [monthTransactions, categoryMap, totalExpense]);

  // Recent 5 transactions
  const recentTransactions = useMemo(() => {
    return [...transactions]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5);
  }, [transactions]);

  const { greeting } = getGreeting(userName || 'Tharun');

  const displayAmount = (paise: number) => {
    return formatCurrency(paise, currency);
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <StatusBar style="light" />
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* OnePlus Header Bar */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greetingText}>{greeting}</Text>
            <Text style={styles.subGreetingText}>Never Settle • Financial Tracker</Text>
          </View>
        </View>

        {/* In-App Periodic Expense Reminder Banner */}
        {showExpenseReminderPrompt && (
          <View style={styles.reminderBanner}>
            <View style={styles.reminderLeft}>
              <View style={styles.reminderIconWrap}>
                <Icon name="BellRing" size={16} color={THEME.colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.reminderTitle}>Update Recent Expenses</Text>
                <Text style={styles.reminderSubtitle}>
                  Did you spend anything in the last {settings.reminderIntervalHours || 3} hours?
                </Text>
              </View>
            </View>
            <View style={styles.reminderActions}>
              <Pressable
                style={styles.reminderAddBtn}
                onPress={() => {
                  triggerHaptic.medium();
                  router.push('/modal/add-transaction');
                }}
              >
                <Text style={styles.reminderAddBtnText}>+ Log</Text>
              </Pressable>
              <Pressable
                style={styles.reminderCloseBtn}
                onPress={() => {
                  triggerHaptic.light();
                  setIsReminderDismissed(true);
                }}
                hitSlop={8}
              >
                <Icon name="X" size={16} color={THEME.colors.textMuted} />
              </Pressable>
            </View>
          </View>
        )}

        {/* Hero Balance Card */}
        <View style={styles.heroCard}>
          <View style={styles.heroCardTop}>
            <Text style={styles.heroLabel}>Net Balance ({selectedMonth})</Text>
            <View style={styles.activeTag}>
              <View style={styles.pulseDot} />
              <Text style={styles.activeTagText}>OnePlus Red</Text>
            </View>
          </View>

          <Text
            style={[
              styles.heroBalanceText,
              netBalance < 0 && { color: THEME.colors.expense },
            ]}
          >
            {displayAmount(netBalance)}
          </Text>

          {/* Cashflow & Wealth Breakdown (2+1 Layout: Inflow/Outflow + Wealth Pillar) */}
          <View style={styles.cashFlowContainer}>
            {/* Top Tier: Living Inflow & Outflow (50% / 50%) */}
            <View style={styles.cashFlowTopRow}>
              {/* Income Box */}
              <Pressable
                style={[styles.cashFlowBox, styles.incomeBox]}
                onPress={() => {
                  triggerHaptic.light();
                  router.push('/(tabs)/budget');
                }}
              >
                <View style={styles.cashFlowBoxHeader}>
                  <View style={[styles.cashFlowIconWrap, { backgroundColor: THEME.colors.incomeBg }]}>
                    <Icon name="ArrowDownLeft" size={14} color={THEME.colors.income} />
                  </View>
                  <Text style={styles.cashFlowLabel}>Income</Text>
                </View>
                <Text
                  style={styles.incomeAmount}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                >
                  {displayAmount(totalIncome)}
                </Text>
              </Pressable>

              {/* Expense Box */}
              <Pressable
                style={[styles.cashFlowBox, styles.expenseBox]}
                onPress={() => {
                  triggerHaptic.light();
                  router.push('/(tabs)/budget');
                }}
              >
                <View style={styles.cashFlowBoxHeader}>
                  <View style={[styles.cashFlowIconWrap, { backgroundColor: THEME.colors.expenseBg }]}>
                    <Icon name="ArrowUpRight" size={14} color={THEME.colors.expense} />
                  </View>
                  <Text style={styles.cashFlowLabel}>Expenses</Text>
                </View>
                <Text
                  style={styles.expenseAmount}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                >
                  {displayAmount(totalExpense)}
                </Text>
              </Pressable>
            </View>

            {/* Bottom Tier: Investments / Future Wealth (Full Width) */}
            <Pressable
              style={styles.investmentFullCard}
              onPress={() => {
                triggerHaptic.light();
                router.push('/(tabs)/budget');
              }}
            >
              <View style={styles.investmentLeftBlock}>
                <View style={[styles.cashFlowIconWrap, { backgroundColor: THEME.colors.investmentBg }]}>
                  <Icon name="TrendingUp" size={15} color={THEME.colors.investment} />
                </View>
                <View style={styles.investmentLabelCol}>
                  <Text style={styles.investmentTitle}>Investments</Text>
                  <Text style={styles.investmentSubtitle} numberOfLines={1}>Wealth & Future Assets</Text>
                </View>
              </View>
              <Text
                style={styles.investmentAmountLarge}
                numberOfLines={1}
                adjustsFontSizeToFit
              >
                {displayAmount(totalInvestment)}
              </Text>
            </Pressable>
          </View>
        </View>

        {/* Quick Actions Row */}
        <View style={styles.quickActionsContainer}>
          <Pressable
            style={[styles.actionButton, styles.actionButtonExpense]}
            onPress={() => {
              triggerHaptic.medium();
              router.push('/modal/add-transaction');
            }}
          >
            <View style={[styles.actionIconBadge, { backgroundColor: THEME.colors.expenseBg }]}>
              <Icon name="Minus" size={16} color={THEME.colors.expense} />
            </View>
            <Text style={styles.actionLabel} numberOfLines={1} adjustsFontSizeToFit>Expense</Text>
          </Pressable>

          <Pressable
            style={[styles.actionButton, styles.actionButtonInvestment]}
            onPress={() => {
              triggerHaptic.medium();
              router.push('/modal/add-transaction');
            }}
          >
            <View style={[styles.actionIconBadge, { backgroundColor: THEME.colors.investmentBg }]}>
              <Icon name="TrendingUp" size={16} color={THEME.colors.investment} />
            </View>
            <Text style={styles.actionLabel} numberOfLines={1} adjustsFontSizeToFit>Invest</Text>
          </Pressable>

          <Pressable
            style={[styles.actionButton, styles.actionButtonIncome]}
            onPress={() => {
              triggerHaptic.medium();
              router.push('/modal/add-transaction');
            }}
          >
            <View style={[styles.actionIconBadge, { backgroundColor: THEME.colors.incomeBg }]}>
              <Icon name="Plus" size={16} color={THEME.colors.income} />
            </View>
            <Text style={styles.actionLabel} numberOfLines={1} adjustsFontSizeToFit>Income</Text>
          </Pressable>

          <Pressable
            style={styles.actionButton}
            onPress={() => {
              triggerHaptic.light();
              router.push('/(tabs)/budget');
            }}
          >
            <View style={[styles.actionIconBadge, { backgroundColor: THEME.colors.primaryGlow }]}>
              <Icon name="PieChart" size={16} color={THEME.colors.primary} />
            </View>
            <Text style={styles.actionLabel} numberOfLines={1} adjustsFontSizeToFit>Analytics</Text>
          </Pressable>
        </View>

        {/* Monthly Budget Tracker Card */}
        {totalBudgetLimit > 0 && (
          <Pressable
            style={styles.card}
            onPress={() => {
              triggerHaptic.light();
              router.push('/(tabs)/budget');
            }}
          >
            <View style={styles.cardHeader}>
              <View style={styles.cardTitleRow}>
                <Icon name="Target" size={18} color={THEME.colors.primary} />
                <Text style={styles.cardTitle}>Monthly Budget</Text>
              </View>
              <Text style={styles.budgetPercentText}>{budgetProgress}% used</Text>
            </View>

            <View style={styles.progressBarBackground}>
              <View
                style={[
                  styles.progressBarFill,
                  {
                    width: `${Math.min(100, budgetProgress)}%`,
                    backgroundColor:
                      budgetProgress > 90
                        ? THEME.colors.expense
                        : budgetProgress > 70
                        ? THEME.colors.warning
                        : THEME.colors.primary,
                  },
                ]}
              />
            </View>

            <View style={styles.budgetStatsRow}>
              <Text style={styles.budgetTextMuted}>
                Spent: <Text style={styles.budgetTextBold}>{displayAmount(totalExpense)}</Text>
              </Text>
              <Text style={styles.budgetTextMuted}>
                Limit: <Text style={styles.budgetTextBold}>{displayAmount(totalBudgetLimit)}</Text>
              </Text>
            </View>
          </Pressable>
        )}

        {/* Top Spending Categories */}
        {topCategories.length > 0 && (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.cardTitleRow}>
                <Icon name="BarChart3" size={18} color={THEME.colors.primary} />
                <Text style={styles.cardTitle}>Top Spending</Text>
              </View>
              <Pressable
                onPress={() => {
                  triggerHaptic.light();
                  router.push('/(tabs)/budget');
                }}
              >
                <Text style={styles.seeAllText}>Details</Text>
              </Pressable>
            </View>

            <View style={styles.categoryList}>
              {topCategories.map((item) => (
                <Pressable
                  key={item.category?.id}
                  style={styles.categoryRow}
                  onPress={() => triggerHaptic.selection()}
                >
                  <View style={styles.categoryInfo}>
                    <View
                      style={[
                        styles.categoryIconWrap,
                        { backgroundColor: `${item.category?.color || '#EB0028'}22` },
                      ]}
                    >
                      <Icon
                        name={item.category?.icon || 'Tag'}
                        size={16}
                        color={item.category?.color || THEME.colors.primary}
                      />
                    </View>
                    <View style={styles.categoryMeta}>
                      <Text style={styles.categoryName}>{item.category?.name}</Text>
                      <View style={styles.categoryBarTrack}>
                        <View
                          style={[
                            styles.categoryBarFill,
                            {
                              width: `${Math.min(100, item.percent)}%`,
                              backgroundColor: item.category?.color || THEME.colors.primary,
                            },
                          ]}
                        />
                      </View>
                    </View>
                  </View>
                  <View style={styles.categoryAmountCol}>
                    <Text style={styles.categoryAmount}>{displayAmount(item.amount)}</Text>
                    <Text style={styles.categoryPercent}>{item.percent}%</Text>
                  </View>
                </Pressable>
              ))}
            </View>
          </View>
        )}

        {/* Recent Activity List */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Recent Activity</Text>
            <Pressable
              onPress={() => {
                triggerHaptic.light();
                router.push('/(tabs)/transactions');
              }}
              hitSlop={8}
            >
              <Text style={styles.seeAllText}>See All</Text>
            </Pressable>
          </View>

          {recentTransactions.length === 0 ? (
            <View style={styles.emptyCard}>
              <Icon name="Inbox" size={36} color={THEME.colors.textMuted} />
              <Text style={styles.emptyTitle}>No Transactions Yet</Text>
              <Text style={styles.emptySubtitle}>
                Add your first transaction to begin tracking your finances!
              </Text>
              <Pressable
                style={styles.emptyButton}
                onPress={() => {
                  triggerHaptic.medium();
                  router.push('/modal/add-transaction');
                }}
              >
                <Text style={styles.emptyButtonText}>+ Add Transaction</Text>
              </Pressable>
            </View>
          ) : (
            <View style={styles.transactionList}>
              {recentTransactions.map((tx) => {
                const category = categoryMap.get(tx.categoryId);
                const isExpense = tx.type === 'expense';
                return (
                  <Pressable
                    key={tx.id}
                    style={styles.transactionItem}
                    onPress={() => {
                      triggerHaptic.light();
                      router.push({
                        pathname: '/modal/edit-transaction',
                        params: { transactionId: tx.id },
                      });
                    }}
                  >
                    <View
                      style={[
                        styles.transactionIconWrap,
                        {
                          backgroundColor: `${category?.color || '#EB0028'}22`,
                        },
                      ]}
                    >
                      <Icon
                        name={category?.icon || 'DollarSign'}
                        size={18}
                        color={category?.color || THEME.colors.primaryLight}
                      />
                    </View>

                    <View style={styles.transactionDetails}>
                      <Text style={styles.transactionTitle} numberOfLines={1}>
                        {tx.description || category?.name || 'Transaction'}
                      </Text>
                      <Text style={styles.transactionDate}>
                        {formatDate(tx.date, 'short')} • {category?.name || 'General'}
                      </Text>
                    </View>

                    {(() => {
                      const isExpense = tx.type === 'expense';
                      const isInvestment = tx.type === 'investment';
                      return (
                        <Text
                          style={[
                            styles.transactionAmount,
                            isExpense
                              ? styles.amountExpense
                              : isInvestment
                              ? styles.amountInvestment
                              : styles.amountIncome,
                          ]}
                          numberOfLines={1}
                          adjustsFontSizeToFit
                        >
                          {isExpense ? '-' : isInvestment ? '•' : '+'}
                          {displayAmount(tx.amount)}
                        </Text>
                      );
                    })()}
                  </Pressable>
                );
              })}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: THEME.colors.background,
  },
  container: {
    flex: 1,
    backgroundColor: THEME.colors.background,
  },
  contentContainer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 110,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  greetingText: {
    fontSize: 22,
    fontWeight: '800',
    color: THEME.colors.textPrimary,
    letterSpacing: -0.3,
    fontFamily: THEME.typography.fontFamily,
  },
  subGreetingText: {
    fontSize: 13,
    color: THEME.colors.primaryLight,
    marginTop: 2,
    fontWeight: '600',
    fontFamily: THEME.typography.fontFamily,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: THEME.colors.surface,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroCard: {
    backgroundColor: THEME.colors.surface,
    borderRadius: THEME.borderRadius.xl,
    padding: 20,
    borderWidth: 1,
    borderColor: THEME.colors.borderStrong,
    marginBottom: 16,
    ...THEME.shadows.card,
  },
  heroCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  heroLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: THEME.colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    fontFamily: THEME.typography.fontFamily,
  },
  activeTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.colors.primaryGlow,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    gap: 5,
    borderWidth: 1,
    borderColor: 'rgba(235, 0, 40, 0.4)',
  },
  pulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: THEME.colors.primary,
  },
  activeTagText: {
    fontSize: 10,
    fontWeight: '800',
    color: THEME.colors.primaryLight,
    letterSpacing: 0.3,
    fontFamily: THEME.typography.fontFamily,
  },
  heroBalanceText: {
    fontSize: 34,
    fontWeight: '900',
    color: THEME.colors.textPrimary,
    letterSpacing: -1,
    marginBottom: 18,
    fontFamily: THEME.typography.fontFamily,
  },
  cashFlowContainer: {
    gap: 10,
  },
  cashFlowTopRow: {
    flexDirection: 'row',
    gap: 10,
  },
  cashFlowBox: {
    flex: 1,
    minWidth: 0,
    backgroundColor: THEME.colors.backgroundElevated,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: THEME.borderRadius.md,
    borderWidth: 1,
    gap: 6,
  },
  incomeBox: {
    borderColor: THEME.colors.incomeBorder,
  },
  expenseBox: {
    borderColor: THEME.colors.expenseBorder,
  },
  cashFlowBoxHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cashFlowIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cashFlowLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: THEME.colors.textSecondary,
    fontFamily: THEME.typography.fontFamily,
  },
  incomeAmount: {
    fontSize: 16,
    fontWeight: '800',
    color: THEME.colors.income,
    fontFamily: THEME.typography.fontFamily,
  },
  expenseAmount: {
    fontSize: 16,
    fontWeight: '800',
    color: THEME.colors.expense,
    fontFamily: THEME.typography.fontFamily,
  },
  investmentFullCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: THEME.colors.backgroundElevated,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: THEME.borderRadius.md,
    borderWidth: 1,
    borderColor: THEME.colors.investmentBorder,
    gap: 10,
  },
  investmentLeftBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    minWidth: 0,
  },
  investmentLabelCol: {
    flex: 1,
    minWidth: 0,
  },
  investmentTitle: {
    fontSize: 12.5,
    fontWeight: '700',
    color: THEME.colors.textPrimary,
    fontFamily: THEME.typography.fontFamily,
  },
  investmentSubtitle: {
    fontSize: 10.5,
    color: THEME.colors.textMuted,
    marginTop: 1,
    fontFamily: THEME.typography.fontFamily,
  },
  investmentAmountLarge: {
    fontSize: 16,
    fontWeight: '900',
    color: THEME.colors.investment,
    fontFamily: THEME.typography.fontFamily,
    flexShrink: 0,
  },
  quickActionsContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  actionButton: {
    flex: 1,
    minWidth: 0,
    backgroundColor: THEME.colors.surface,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    borderRadius: THEME.borderRadius.lg,
    paddingVertical: 10,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  actionButtonExpense: {},
  actionButtonInvestment: {},
  actionButtonIncome: {},
  actionIconBadge: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: THEME.colors.textSecondary,
    textAlign: 'center',
    fontFamily: THEME.typography.fontFamily,
  },
  card: {
    backgroundColor: THEME.colors.surface,
    borderRadius: THEME.borderRadius.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: THEME.colors.textPrimary,
    fontFamily: THEME.typography.fontFamily,
  },
  budgetPercentText: {
    fontSize: 12,
    fontWeight: '800',
    color: THEME.colors.primary,
    fontFamily: THEME.typography.fontFamily,
  },
  progressBarBackground: {
    height: 8,
    borderRadius: 4,
    backgroundColor: THEME.colors.surfaceSubtle,
    overflow: 'hidden',
    marginBottom: 10,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  budgetStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  budgetTextMuted: {
    fontSize: 12,
    color: THEME.colors.textMuted,
    fontFamily: THEME.typography.fontFamily,
  },
  budgetTextBold: {
    color: THEME.colors.textPrimary,
    fontWeight: '700',
  },
  seeAllText: {
    fontSize: 12,
    fontWeight: '700',
    color: THEME.colors.primary,
    fontFamily: THEME.typography.fontFamily,
  },
  categoryList: {
    gap: 12,
  },
  categoryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  categoryInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 10,
    marginRight: 12,
  },
  categoryIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryMeta: {
    flex: 1,
  },
  categoryName: {
    fontSize: 13,
    fontWeight: '700',
    color: THEME.colors.textPrimary,
    marginBottom: 4,
    fontFamily: THEME.typography.fontFamily,
  },
  categoryBarTrack: {
    height: 4,
    borderRadius: 2,
    backgroundColor: THEME.colors.surfaceSubtle,
    overflow: 'hidden',
    width: '100%',
  },
  categoryBarFill: {
    height: '100%',
    borderRadius: 2,
  },
  categoryAmountCol: {
    alignItems: 'flex-end',
  },
  categoryAmount: {
    fontSize: 13,
    fontWeight: '800',
    color: THEME.colors.textPrimary,
    fontFamily: THEME.typography.fontFamily,
  },
  categoryPercent: {
    fontSize: 10,
    color: THEME.colors.textMuted,
    marginTop: 2,
    fontFamily: THEME.typography.fontFamily,
  },
  sectionContainer: {
    marginBottom: 16,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: THEME.colors.textPrimary,
    fontFamily: THEME.typography.fontFamily,
  },
  emptyCard: {
    backgroundColor: THEME.colors.surface,
    borderRadius: THEME.borderRadius.lg,
    padding: 28,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: THEME.colors.textPrimary,
    marginTop: 12,
    fontFamily: THEME.typography.fontFamily,
  },
  emptySubtitle: {
    fontSize: 12,
    color: THEME.colors.textMuted,
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 16,
    maxWidth: 240,
    fontFamily: THEME.typography.fontFamily,
  },
  emptyButton: {
    backgroundColor: THEME.colors.primary,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: THEME.borderRadius.md,
    ...THEME.shadows.floating,
  },
  emptyButtonText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
    fontFamily: THEME.typography.fontFamily,
  },
  transactionList: {
    backgroundColor: THEME.colors.surface,
    borderRadius: THEME.borderRadius.lg,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    overflow: 'hidden',
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: THEME.colors.border,
  },
  transactionIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  transactionDetails: {
    flex: 1,
    minWidth: 0,
    marginRight: 10,
  },
  transactionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: THEME.colors.textPrimary,
    marginBottom: 2,
    fontFamily: THEME.typography.fontFamily,
  },
  transactionDate: {
    fontSize: 11,
    color: THEME.colors.textMuted,
    fontFamily: THEME.typography.fontFamily,
  },
  transactionAmount: {
    fontSize: 14,
    fontWeight: '800',
    fontFamily: THEME.typography.fontFamily,
    flexShrink: 0,
  },
  amountExpense: {
    color: THEME.colors.expense,
  },
  amountInvestment: {
    color: THEME.colors.investment,
  },
  amountIncome: {
    color: THEME.colors.income,
  },
  reminderBanner: {
    marginBottom: 16,
    padding: 12,
    borderRadius: THEME.borderRadius.lg,
    backgroundColor: 'rgba(235, 0, 41, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(235, 0, 41, 0.25)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  reminderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    minWidth: 0,
  },
  reminderIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: THEME.colors.primaryGlow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reminderTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: THEME.colors.textPrimary,
    fontFamily: THEME.typography.fontFamily,
  },
  reminderSubtitle: {
    fontSize: 11,
    color: THEME.colors.textSecondary,
    marginTop: 1,
    fontFamily: THEME.typography.fontFamily,
  },
  reminderActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  reminderAddBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: THEME.colors.primary,
  },
  reminderAddBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: THEME.typography.fontFamily,
  },
  reminderCloseBtn: {
    padding: 4,
  },
});

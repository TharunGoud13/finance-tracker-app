import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Modal,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { useTransactionStore } from '../../src/store/useTransactionStore';
import { useBudgetStore } from '../../src/store/useBudgetStore';
import { useSettingsStore } from '../../src/store/useSettingsStore';
import { Category, Transaction } from '../../src/types';
import { THEME } from '../../src/constants/theme';
import { Icon } from '../../src/components/ui/Icon';
import { formatCurrency, formatMonthYear, parseInputToPaise, formatDate } from '../../src/utils/formatters';
import { triggerHaptic } from '../../src/utils/haptics';

type AnalyticsTabType = 'expenses' | 'investment' | 'income';

export default function BudgetAnalyticsScreen() {
  const router = useRouter();
  const transactions = useTransactionStore((state) => state.transactions);
  const budgets = useBudgetStore((state) => state.budgets);
  const categories = useBudgetStore((state) => state.categories);
  const selectedMonth = useBudgetStore((state) => state.selectedMonth);
  const setSelectedMonth = useBudgetStore((state) => state.setSelectedMonth);
  const setBudget = useBudgetStore((state) => state.setBudget);

  const currency = useSettingsStore((state) => state.settings.currency);

  // Active sub-tab: 'expenses' | 'investment' | 'income'
  const [activeTab, setActiveTab] = useState<AnalyticsTabType>('expenses');

  // Month selector modal
  const [isMonthModalVisible, setIsMonthModalVisible] = useState(false);

  // Budget edit modal
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [budgetInput, setBudgetInput] = useState('');

  const availableMonths = useMemo(() => {
    const months: string[] = [];
    const date = new Date();
    date.setMonth(date.getMonth() + 1);
    for (let i = 0; i < 7; i++) {
      months.push(date.toISOString().slice(0, 7));
      date.setMonth(date.getMonth() - 1);
    }
    if (selectedMonth && !months.includes(selectedMonth)) {
      months.unshift(selectedMonth);
    }
    return months;
  }, [selectedMonth]);

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

  // Financial Metrics: Income, Pure Expenses, and Investments
  const { totalIncome, totalExpense, totalInvestment, netBalance } = useMemo(() => {
    let inc = 0;
    let exp = 0;
    let inv = 0;
    for (const tx of monthTransactions) {
      if (tx.type === 'income') {
        inc += tx.amount;
      } else if (tx.type === 'investment') {
        inv += tx.amount;
      } else {
        exp += tx.amount;
      }
    }
    return {
      totalIncome: inc,
      totalExpense: exp,
      totalInvestment: inv,
      netBalance: inc - exp - inv,
    };
  }, [monthTransactions]);

  const netSavings = Math.max(0, totalIncome - totalExpense);
  const savingsRate = totalIncome > 0 ? Math.round((netSavings / totalIncome) * 100) : 0;
  const investmentRate = totalIncome > 0 ? Math.round((totalInvestment / totalIncome) * 100) : 0;

  // Category Budgets Map for the selected month
  const categoryBudgets = useMemo(() => {
    const map = new Map<string, number>();
    for (const b of budgets) {
      if (b.month === selectedMonth) {
        map.set(b.categoryId, b.limit);
      }
    }
    return map;
  }, [budgets, selectedMonth]);

  // 1. Expense Categories Breakdown (living expenses only, excluding investments)
  const expenseBreakdown = useMemo(() => {
    const spendingMap = new Map<string, number>();
    for (const tx of monthTransactions) {
      if (tx.type === 'expense') {
        spendingMap.set(
          tx.categoryId,
          (spendingMap.get(tx.categoryId) || 0) + tx.amount
        );
      }
    }

    const expenseCategories = categories.filter((c) => c.type === 'expense');

    return expenseCategories
      .map((cat) => {
        const spent = spendingMap.get(cat.id) || 0;
        const limit = categoryBudgets.get(cat.id) || 0;
        const percentOfTotal = totalExpense > 0 ? Math.round((spent / totalExpense) * 100) : 0;
        const percentOfBudget = limit > 0 ? Math.round((spent / limit) * 100) : 0;
        const isOverBudget = limit > 0 && spent > limit;

        return {
          category: cat,
          spent,
          limit,
          percentOfTotal,
          percentOfBudget,
          isOverBudget,
        };
      })
      .filter((item) => item.spent > 0 || item.limit > 0)
      .sort((a, b) => b.spent - a.spent);
  }, [monthTransactions, categories, categoryBudgets, totalExpense]);

  // 2. Investment Categories Breakdown (Asset Allocation)
  const investmentBreakdown = useMemo(() => {
    const invMap = new Map<string, number>();
    for (const tx of monthTransactions) {
      if (tx.type === 'investment') {
        invMap.set(
          tx.categoryId,
          (invMap.get(tx.categoryId) || 0) + tx.amount
        );
      }
    }

    const invCategories = categories.filter((c) => c.type === 'investment');

    return invCategories
      .map((cat) => {
        const invested = invMap.get(cat.id) || 0;
        const percentOfTotal = totalInvestment > 0 ? Math.round((invested / totalInvestment) * 100) : 0;

        return {
          category: cat,
          invested,
          percentOfTotal,
        };
      })
      .filter((item) => item.invested > 0)
      .sort((a, b) => b.invested - a.invested);
  }, [monthTransactions, categories, totalInvestment]);

  // 3. Income Categories Breakdown
  const incomeBreakdown = useMemo(() => {
    const incMap = new Map<string, number>();
    for (const tx of monthTransactions) {
      if (tx.type === 'income') {
        incMap.set(
          tx.categoryId,
          (incMap.get(tx.categoryId) || 0) + tx.amount
        );
      }
    }

    const incCategories = categories.filter((c) => c.type === 'income');

    return incCategories
      .map((cat) => {
        const amount = incMap.get(cat.id) || 0;
        const percentOfTotal = totalIncome > 0 ? Math.round((amount / totalIncome) * 100) : 0;

        return {
          category: cat,
          amount,
          percentOfTotal,
        };
      })
      .filter((item) => item.amount > 0)
      .sort((a, b) => b.amount - a.amount);
  }, [monthTransactions, categories, totalIncome]);

  // Total Monthly Budget for Living Expenses
  const totalBudgetLimit = useMemo(() => {
    return Array.from(categoryBudgets.values()).reduce((sum, lim) => sum + lim, 0);
  }, [categoryBudgets]);

  const totalBudgetProgress =
    totalBudgetLimit > 0
      ? Math.min(100, Math.round((totalExpense / totalBudgetLimit) * 100))
      : 0;

  // Monthly transactions filtered by current active tab
  const activeTabTransactions = useMemo(() => {
    const targetType = activeTab === 'expenses' ? 'expense' : activeTab === 'investment' ? 'investment' : 'income';
    return monthTransactions
      .filter((tx) => tx.type === targetType)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [monthTransactions, activeTab]);

  const displayAmount = (paise: number) => {
    return formatCurrency(paise, currency);
  };

  const handleSaveBudget = async () => {
    if (!editingCategory) return;
    const limitPaise = parseInputToPaise(budgetInput, currency);
    await setBudget(editingCategory.id, limitPaise, selectedMonth);
    setEditingCategory(null);
    triggerHaptic.success();
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <StatusBar style="light" />
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Header with Month Switcher */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>Analytics</Text>
            <Text style={styles.headerSubtitle}>Cashflow, Living Costs & Investments</Text>
          </View>
          <Pressable
            style={styles.monthBadge}
            onPress={() => {
              triggerHaptic.selection();
              setIsMonthModalVisible(true);
            }}
          >
            <Icon name="Calendar" size={14} color={THEME.colors.primary} />
            <Text style={styles.monthBadgeText}>{formatMonthYear(selectedMonth)}</Text>
            <Icon name="ChevronDown" size={14} color={THEME.colors.textMuted} />
          </Pressable>
        </View>

        {/* 1. Monthly Executive Cashflow & Wealth Overview */}
        <View style={styles.overviewCard}>
          <View style={styles.overviewTop}>
            <View>
              <Text style={styles.overviewLabel}>MONTHLY CASHFLOW & WEALTH</Text>
              <Text style={styles.overviewNetText}>
                {displayAmount(netBalance)}
              </Text>
              <Text style={styles.overviewNetSubtext}>
                Net Cash Surplus after Expenses & Investments
              </Text>
            </View>
            <View style={styles.rateBadge}>
              <Icon name="TrendingUp" size={14} color={THEME.colors.income} />
              <Text style={styles.rateBadgeText}>{savingsRate}% Saved</Text>
            </View>
          </View>

          {/* Tri-color Wealth Distribution Bar */}
          <View style={styles.meterContainer}>
            <View
              style={[
                styles.meterIncomeFill,
                { flex: Math.max(1, totalIncome) },
              ]}
            />
            <View
              style={[
                styles.meterExpenseFill,
                { flex: Math.max(1, totalExpense) },
              ]}
            />
            <View
              style={[
                styles.meterInvestmentFill,
                { flex: Math.max(1, totalInvestment) },
              ]}
            />
          </View>

          {/* Tri-color Legend with exact numbers */}
          <View style={styles.triLegendGrid}>
            <View style={styles.legendBox}>
              <View style={[styles.legendDot, { backgroundColor: THEME.colors.income }]} />
              <View>
                <Text style={styles.legendLabel}>Income</Text>
                <Text style={styles.legendValue}>{displayAmount(totalIncome)}</Text>
              </View>
            </View>

            <View style={styles.legendBox}>
              <View style={[styles.legendDot, { backgroundColor: THEME.colors.expense }]} />
              <View>
                <Text style={styles.legendLabel}>Expenses</Text>
                <Text style={styles.legendValue}>{displayAmount(totalExpense)}</Text>
              </View>
            </View>

            <View style={styles.legendBox}>
              <View style={[styles.legendDot, { backgroundColor: THEME.colors.investment }]} />
              <View>
                <Text style={styles.legendLabel}>Invested</Text>
                <Text style={styles.legendValue}>{displayAmount(totalInvestment)}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* 2. Three Dedicated Analytics Tabs: Expenses | Investment | Income */}
        <View style={styles.analyticsTabBar}>
          <Pressable
            style={[
              styles.tabBtn,
              activeTab === 'expenses' && styles.tabBtnActiveExpenses,
            ]}
            onPress={() => {
              triggerHaptic.selection();
              setActiveTab('expenses');
            }}
          >
            <Icon
              name="ArrowUpRight"
              size={15}
              color={activeTab === 'expenses' ? THEME.colors.expense : THEME.colors.textMuted}
            />
            <Text
              style={[
                styles.tabBtnText,
                activeTab === 'expenses' && styles.tabBtnTextActiveExpenses,
              ]}
            >
              Expenses
            </Text>
          </Pressable>

          <Pressable
            style={[
              styles.tabBtn,
              activeTab === 'investment' && styles.tabBtnActiveInvestment,
            ]}
            onPress={() => {
              triggerHaptic.selection();
              setActiveTab('investment');
            }}
          >
            <Icon
              name="TrendingUp"
              size={15}
              color={activeTab === 'investment' ? THEME.colors.investment : THEME.colors.textMuted}
            />
            <Text
              style={[
                styles.tabBtnText,
                activeTab === 'investment' && styles.tabBtnTextActiveInvestment,
              ]}
            >
              Investment
            </Text>
          </Pressable>

          <Pressable
            style={[
              styles.tabBtn,
              activeTab === 'income' && styles.tabBtnActiveIncome,
            ]}
            onPress={() => {
              triggerHaptic.selection();
              setActiveTab('income');
            }}
          >
            <Icon
              name="ArrowDownLeft"
              size={15}
              color={activeTab === 'income' ? THEME.colors.income : THEME.colors.textMuted}
            />
            <Text
              style={[
                styles.tabBtnText,
                activeTab === 'income' && styles.tabBtnTextActiveIncome,
              ]}
            >
              Income
            </Text>
          </Pressable>
        </View>

        {/* ========================================================================= */}
        {/* TAB 1: EXPENSES VIEW (Monthly living expenses apart from investment)       */}
        {/* ========================================================================= */}
        {activeTab === 'expenses' && (
          <>
            {/* Total Monthly Living Expenses Hero Card */}
            <View style={styles.metricHeroCard}>
              <View style={styles.metricHeroHeader}>
                <View>
                  <Text style={styles.metricHeroLabel}>TOTAL MONTHLY EXPENSES</Text>
                  <Text style={[styles.metricHeroValue, { color: THEME.colors.expense }]}>
                    {displayAmount(totalExpense)}
                  </Text>
                </View>
                <View style={[styles.pillBadge, { backgroundColor: THEME.colors.expenseBg, borderColor: THEME.colors.expenseBorder }]}>
                  <Text style={[styles.pillBadgeText, { color: THEME.colors.expense }]}>
                    Living & Lifestyle
                  </Text>
                </View>
              </View>
              <Text style={styles.metricHeroClarification}>
                Includes bills, food, housing & leisure. Excludes wealth investments.
              </Text>

              {/* Total Monthly Budget Tracker Bar */}
              <View style={styles.budgetProgressSection}>
                <View style={styles.budgetHeaderRow}>
                  <Text style={styles.budgetHeaderTitle}>Monthly Spending Budget</Text>
                  <Text
                    style={[
                      styles.budgetStatusTag,
                      totalBudgetProgress > 100
                        ? { color: THEME.colors.expense }
                        : { color: THEME.colors.income },
                    ]}
                  >
                    {totalBudgetLimit > 0
                      ? totalBudgetProgress > 100
                        ? 'Over Budget'
                        : `${100 - totalBudgetProgress}% left`
                      : 'No Limit Set'}
                  </Text>
                </View>

                {totalBudgetLimit > 0 ? (
                  <>
                    <View style={styles.progressBarBackground}>
                      <View
                        style={[
                          styles.progressBarFill,
                          {
                            width: `${Math.min(100, totalBudgetProgress)}%`,
                            backgroundColor:
                              totalBudgetProgress > 100
                                ? THEME.colors.expense
                                : totalBudgetProgress > 80
                                ? THEME.colors.warning
                                : THEME.colors.primary,
                          },
                        ]}
                      />
                    </View>
                    <View style={styles.budgetValuesRow}>
                      <Text style={styles.budgetValueText}>
                        Spent: <Text style={styles.textWhite}>{displayAmount(totalExpense)}</Text>
                      </Text>
                      <Text style={styles.budgetValueText}>
                        Budget: <Text style={styles.textWhite}>{displayAmount(totalBudgetLimit)}</Text>
                      </Text>
                    </View>
                  </>
                ) : (
                  <Text style={styles.noBudgetNote}>
                    Set category spending limits below to keep your lifestyle costs controlled.
                  </Text>
                )}
              </View>
            </View>

            {/* Category Breakdown Header */}
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>Expense Categories</Text>
              <Text style={styles.sectionSubtitle}>Tap category to set budget</Text>
            </View>

            {/* Category Breakdown List */}
            <View style={styles.categoryListCard}>
              {expenseBreakdown.length === 0 ? (
                <View style={styles.emptyCategories}>
                  <Icon name="ShoppingBag" size={32} color={THEME.colors.textMuted} />
                  <Text style={styles.emptyCategoriesText}>No expenses logged in this month</Text>
                </View>
              ) : (
                expenseBreakdown.map((item, index) => {
                  const isLast = index === expenseBreakdown.length - 1;
                  return (
                    <Pressable
                      key={item.category.id}
                      style={[
                        styles.categoryRowItem,
                        !isLast && styles.categoryRowBorder,
                      ]}
                      onPress={() => {
                        triggerHaptic.selection();
                        setEditingCategory(item.category);
                        setBudgetInput(
                          item.limit > 0
                            ? (item.limit / (currency === 'INR' ? 100 : 100)).toString()
                            : ''
                        );
                      }}
                    >
                      <View
                        style={[
                          styles.catIconWrap,
                          { backgroundColor: `${item.category.color || '#EB0028'}22` },
                        ]}
                      >
                        <Icon
                          name={item.category.icon || 'Tag'}
                          size={18}
                          color={item.category.color || THEME.colors.primary}
                        />
                      </View>

                      <View style={styles.catMeta}>
                        <View style={styles.catNameRow}>
                          <Text style={styles.catName}>{item.category.name}</Text>
                          <Text style={styles.catSpent}>{displayAmount(item.spent)}</Text>
                        </View>

                        {/* Progress Bar */}
                        <View style={styles.catProgressTrack}>
                          <View
                            style={[
                              styles.catProgressFill,
                              {
                                width: `${Math.min(
                                  100,
                                  item.limit > 0 ? item.percentOfBudget : item.percentOfTotal
                                )}%`,
                                backgroundColor: item.isOverBudget
                                  ? THEME.colors.expense
                                  : item.category.color || THEME.colors.primary,
                              },
                            ]}
                          />
                        </View>

                        <View style={styles.catSubRow}>
                          <Text style={styles.catSubText}>
                            {item.percentOfTotal}% of monthly expenses
                          </Text>
                          <Text
                            style={[
                              styles.catBudgetStatus,
                              item.isOverBudget && styles.catBudgetOver,
                            ]}
                          >
                            {item.limit > 0
                              ? `Limit: ${displayAmount(item.limit)} (${item.percentOfBudget}%)`
                              : 'Set Limit +'}
                          </Text>
                        </View>
                      </View>
                    </Pressable>
                  );
                })
              )}
            </View>
          </>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: INVESTMENT VIEW (Building wealth for the future, not consumption)   */}
        {/* ========================================================================= */}
        {activeTab === 'investment' && (
          <>
            {/* Total Investments Hero Card */}
            <View style={styles.metricHeroCard}>
              <View style={styles.metricHeroHeader}>
                <View>
                  <Text style={styles.metricHeroLabel}>TOTAL CAPITAL INVESTED</Text>
                  <Text style={[styles.metricHeroValue, { color: THEME.colors.investment }]}>
                    {displayAmount(totalInvestment)}
                  </Text>
                </View>
                <View style={[styles.pillBadge, { backgroundColor: THEME.colors.investmentBg, borderColor: THEME.colors.investmentBorder }]}>
                  <Text style={[styles.pillBadgeText, { color: THEME.colors.investment }]}>
                    Future Wealth
                  </Text>
                </View>
              </View>

              <View style={styles.wealthPhilosophyCard}>
                <Icon name="ShieldCheck" size={16} color={THEME.colors.investment} />
                <Text style={styles.wealthPhilosophyText}>
                  Investment is not spending. It is allocating capital to assets for your future financial freedom.
                </Text>
              </View>

              <View style={styles.investStatsGrid}>
                <View style={styles.investStatBox}>
                  <Text style={styles.investStatNumber}>{investmentRate}%</Text>
                  <Text style={styles.investStatLabel}>Of Income Invested</Text>
                </View>
                <View style={styles.investStatBox}>
                  <Text style={styles.investStatNumber}>{investmentBreakdown.length}</Text>
                  <Text style={styles.investStatLabel}>Asset Classes</Text>
                </View>
                <View style={styles.investStatBox}>
                  <Text style={styles.investStatNumber}>{activeTabTransactions.length}</Text>
                  <Text style={styles.investStatLabel}>Contributions</Text>
                </View>
              </View>
            </View>

            {/* Portfolio Asset Allocation Header */}
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>Asset Allocation Portfolio</Text>
              <Text style={styles.sectionSubtitle}>Distribution by asset class</Text>
            </View>

            {/* Asset Allocation Breakdown */}
            <View style={styles.categoryListCard}>
              {investmentBreakdown.length === 0 ? (
                <View style={styles.emptyCategories}>
                  <Icon name="TrendingUp" size={32} color={THEME.colors.textMuted} />
                  <Text style={styles.emptyCategoriesText}>No investments recorded this month</Text>
                  <Pressable
                    style={styles.addInvestBtn}
                    onPress={() => {
                      triggerHaptic.medium();
                      router.push('/modal/add-transaction');
                    }}
                  >
                    <Icon name="Plus" size={16} color="#FFFFFF" />
                    <Text style={styles.addInvestBtnText}>Log New Investment</Text>
                  </Pressable>
                </View>
              ) : (
                investmentBreakdown.map((item, index) => {
                  const isLast = index === investmentBreakdown.length - 1;
                  return (
                    <View
                      key={item.category.id}
                      style={[
                        styles.categoryRowItem,
                        !isLast && styles.categoryRowBorder,
                      ]}
                    >
                      <View
                        style={[
                          styles.catIconWrap,
                          { backgroundColor: `${item.category.color || THEME.colors.investment}22` },
                        ]}
                      >
                        <Icon
                          name={item.category.icon || 'TrendingUp'}
                          size={18}
                          color={item.category.color || THEME.colors.investment}
                        />
                      </View>

                      <View style={styles.catMeta}>
                        <View style={styles.catNameRow}>
                          <Text style={styles.catName}>{item.category.name}</Text>
                          <Text style={[styles.catSpent, { color: THEME.colors.investment }]}>
                            {displayAmount(item.invested)}
                          </Text>
                        </View>

                        {/* Allocation Bar */}
                        <View style={styles.catProgressTrack}>
                          <View
                            style={[
                              styles.catProgressFill,
                              {
                                width: `${Math.min(100, item.percentOfTotal)}%`,
                                backgroundColor: item.category.color || THEME.colors.investment,
                              },
                            ]}
                          />
                        </View>

                        <View style={styles.catSubRow}>
                          <Text style={styles.catSubText}>
                            {item.percentOfTotal}% of total portfolio invested
                          </Text>
                          <Text style={[styles.catBudgetStatus, { color: THEME.colors.investment }]}>
                            Asset Allocation
                          </Text>
                        </View>
                      </View>
                    </View>
                  );
                })
              )}
            </View>
          </>
        )}

        {/* ========================================================================= */}
        {/* TAB 3: INCOME VIEW (Monthly Earnings & Inflow sources)                    */}
        {/* ========================================================================= */}
        {activeTab === 'income' && (
          <>
            {/* Total Monthly Income Hero Card */}
            <View style={styles.metricHeroCard}>
              <View style={styles.metricHeroHeader}>
                <View>
                  <Text style={styles.metricHeroLabel}>TOTAL MONTHLY INCOME</Text>
                  <Text style={[styles.metricHeroValue, { color: THEME.colors.income }]}>
                    {displayAmount(totalIncome)}
                  </Text>
                </View>
                <View style={[styles.pillBadge, { backgroundColor: THEME.colors.incomeBg, borderColor: THEME.colors.incomeBorder }]}>
                  <Text style={[styles.pillBadgeText, { color: THEME.colors.income }]}>
                    Cash Inflow
                  </Text>
                </View>
              </View>
              <Text style={styles.metricHeroClarification}>
                Total earnings from salary, freelance, investments returns, and other sources.
              </Text>
            </View>

            {/* Income Sources Header */}
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>Income Sources</Text>
              <Text style={styles.sectionSubtitle}>Breakdown by source</Text>
            </View>

            {/* Income Sources List */}
            <View style={styles.categoryListCard}>
              {incomeBreakdown.length === 0 ? (
                <View style={styles.emptyCategories}>
                  <Icon name="ArrowDownLeft" size={32} color={THEME.colors.textMuted} />
                  <Text style={styles.emptyCategoriesText}>No income logged in this month</Text>
                </View>
              ) : (
                incomeBreakdown.map((item, index) => {
                  const isLast = index === incomeBreakdown.length - 1;
                  return (
                    <View
                      key={item.category.id}
                      style={[
                        styles.categoryRowItem,
                        !isLast && styles.categoryRowBorder,
                      ]}
                    >
                      <View
                        style={[
                          styles.catIconWrap,
                          { backgroundColor: `${item.category.color || THEME.colors.income}22` },
                        ]}
                      >
                        <Icon
                          name={item.category.icon || 'Briefcase'}
                          size={18}
                          color={item.category.color || THEME.colors.income}
                        />
                      </View>

                      <View style={styles.catMeta}>
                        <View style={styles.catNameRow}>
                          <Text style={styles.catName}>{item.category.name}</Text>
                          <Text style={[styles.catSpent, { color: THEME.colors.income }]}>
                            {displayAmount(item.amount)}
                          </Text>
                        </View>

                        {/* Income Share Bar */}
                        <View style={styles.catProgressTrack}>
                          <View
                            style={[
                              styles.catProgressFill,
                              {
                                width: `${Math.min(100, item.percentOfTotal)}%`,
                                backgroundColor: item.category.color || THEME.colors.income,
                              },
                            ]}
                          />
                        </View>

                        <View style={styles.catSubRow}>
                          <Text style={styles.catSubText}>
                            {item.percentOfTotal}% of total monthly income
                          </Text>
                          <Text style={[styles.catBudgetStatus, { color: THEME.colors.income }]}>
                            Inflow Stream
                          </Text>
                        </View>
                      </View>
                    </View>
                  );
                })
              )}
            </View>
          </>
        )}

        {/* Monthly Activity List for the Selected Tab */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>
            {activeTab === 'expenses'
              ? 'Monthly Expense Records'
              : activeTab === 'investment'
              ? 'Monthly Investment Records'
              : 'Monthly Income Records'}
          </Text>
          <Text style={styles.sectionSubtitle}>
            {activeTabTransactions.length} transaction{activeTabTransactions.length === 1 ? '' : 's'}
          </Text>
        </View>

        <View style={styles.transactionsListCard}>
          {activeTabTransactions.length === 0 ? (
            <View style={styles.emptyCategories}>
              <Text style={styles.emptyCategoriesText}>
                No {activeTab} logged for {formatMonthYear(selectedMonth)}
              </Text>
            </View>
          ) : (
            activeTabTransactions.map((tx, idx) => {
              const cat = categoryMap.get(tx.categoryId);
              const isLast = idx === activeTabTransactions.length - 1;
              const color =
                tx.type === 'income'
                  ? THEME.colors.income
                  : tx.type === 'investment'
                  ? THEME.colors.investment
                  : THEME.colors.expense;

              return (
                <Pressable
                  key={tx.id}
                  style={[styles.txRow, !isLast && styles.txRowBorder]}
                  onPress={() => {
                    triggerHaptic.light();
                    router.push({
                      pathname: '/modal/edit-transaction',
                      params: { transactionId: tx.id },
                    });
                  }}
                >
                  <View style={[styles.txIconWrap, { backgroundColor: `${cat?.color || color}22` }]}>
                    <Icon
                      name={cat?.icon || (tx.type === 'income' ? 'ArrowDownLeft' : tx.type === 'investment' ? 'TrendingUp' : 'ShoppingBag')}
                      size={17}
                      color={cat?.color || color}
                    />
                  </View>
                  <View style={styles.txInfo}>
                    <Text style={styles.txDesc} numberOfLines={1}>
                      {tx.description || cat?.name || 'Transaction'}
                    </Text>
                    <Text style={styles.txMeta}>
                      {cat?.name || tx.type} • {formatDate(tx.date, 'short')}
                    </Text>
                  </View>
                  <Text style={[styles.txAmount, { color }]}>
                    {tx.type === 'income' ? '+' : tx.type === 'investment' ? '↗ ' : '-'}
                    {displayAmount(tx.amount)}
                  </Text>
                </Pressable>
              );
            })
          )}
        </View>

        {/* Month Selector Modal */}
        <Modal
          visible={isMonthModalVisible}
          transparent
          animationType="fade"
          onRequestClose={() => {
            triggerHaptic.light();
            setIsMonthModalVisible(false);
          }}
        >
          <View style={styles.modalBackdrop}>
            <View style={styles.modalCard}>
              <Text style={styles.modalTitle}>Select Period</Text>
              <View style={styles.monthOptionsList}>
                {availableMonths.map((m) => {
                  const isSelected = m === selectedMonth;
                  return (
                    <Pressable
                      key={m}
                      style={[
                        styles.monthOption,
                        isSelected && styles.monthOptionActive,
                      ]}
                      onPress={() => {
                        triggerHaptic.selection();
                        setSelectedMonth(m);
                        setIsMonthModalVisible(false);
                      }}
                    >
                      <Text
                        style={[
                          styles.monthOptionText,
                          isSelected && styles.monthOptionTextActive,
                        ]}
                      >
                        {formatMonthYear(m)}
                      </Text>
                      {isSelected && (
                        <Icon name="Check" size={18} color={THEME.colors.primary} />
                      )}
                    </Pressable>
                  );
                })}
              </View>
              <Pressable
                style={styles.modalCloseButton}
                onPress={() => {
                  triggerHaptic.light();
                  setIsMonthModalVisible(false);
                }}
              >
                <Text style={styles.modalCloseButtonText}>Close</Text>
              </Pressable>
            </View>
          </View>
        </Modal>

        {/* Set / Edit Budget Modal */}
        {editingCategory && (
          <Modal
            visible={!!editingCategory}
            transparent
            animationType="fade"
            onRequestClose={() => {
              triggerHaptic.light();
              setEditingCategory(null);
            }}
          >
            <View style={styles.modalBackdrop}>
              <View style={styles.modalCard}>
                <View style={styles.editBudgetHeader}>
                  <View
                    style={[
                      styles.catIconWrap,
                      { backgroundColor: `${editingCategory.color || '#EB0028'}22` },
                    ]}
                  >
                    <Icon
                      name={editingCategory.icon || 'Tag'}
                      size={20}
                      color={editingCategory.color || THEME.colors.primary}
                    />
                  </View>
                  <View>
                    <Text style={styles.editBudgetTitle}>Set Budget Limit</Text>
                    <Text style={styles.editBudgetSubtitle}>{editingCategory.name}</Text>
                  </View>
                </View>

                <View style={styles.editInputCard}>
                  <Text style={styles.editInputLabel}>MONTHLY SPENDING LIMIT</Text>
                  <TextInput
                    style={styles.editTextInput}
                    placeholder="Enter limit (0 to remove)"
                    placeholderTextColor={THEME.colors.textMuted}
                    keyboardType="numeric"
                    value={budgetInput}
                    onChangeText={setBudgetInput}
                    autoFocus
                  />
                </View>

                <View style={styles.modalActionsRow}>
                  <Pressable
                    style={styles.editCancelBtn}
                    onPress={() => {
                      triggerHaptic.light();
                      setEditingCategory(null);
                    }}
                  >
                    <Text style={styles.editCancelText}>Cancel</Text>
                  </Pressable>
                  <Pressable
                    style={styles.editSaveBtn}
                    onPress={handleSaveBudget}
                  >
                    <Text style={styles.editSaveText}>Save Limit</Text>
                  </Pressable>
                </View>
              </View>
            </View>
          </Modal>
        )}
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
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: '900',
    color: THEME.colors.textPrimary,
    letterSpacing: -0.5,
    fontFamily: THEME.typography.fontFamily,
  },
  headerSubtitle: {
    fontSize: 13,
    color: THEME.colors.textMuted,
    marginTop: 2,
    fontFamily: THEME.typography.fontFamily,
  },
  monthBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.colors.surface,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: THEME.borderRadius.full,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    gap: 6,
  },
  monthBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: THEME.colors.textPrimary,
    fontFamily: THEME.typography.fontFamily,
  },
  overviewCard: {
    backgroundColor: THEME.colors.surface,
    borderRadius: THEME.borderRadius.xl,
    padding: 18,
    borderWidth: 1,
    borderColor: THEME.colors.borderStrong,
    marginBottom: 16,
    ...THEME.shadows.card,
  },
  overviewTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  overviewLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: THEME.colors.textMuted,
    letterSpacing: 0.8,
    fontFamily: THEME.typography.fontFamily,
  },
  overviewNetText: {
    fontSize: 28,
    fontWeight: '900',
    color: THEME.colors.textPrimary,
    letterSpacing: -0.5,
    marginTop: 2,
    fontFamily: THEME.typography.fontFamily,
  },
  overviewNetSubtext: {
    fontSize: 11,
    color: THEME.colors.textMuted,
    marginTop: 2,
    fontFamily: THEME.typography.fontFamily,
  },
  rateBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.colors.incomeBg,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: THEME.borderRadius.md,
    gap: 6,
    borderWidth: 1,
    borderColor: THEME.colors.incomeBorder,
  },
  rateBadgeText: {
    fontSize: 12,
    fontWeight: '800',
    color: THEME.colors.income,
    fontFamily: THEME.typography.fontFamily,
  },
  meterContainer: {
    height: 10,
    borderRadius: 5,
    overflow: 'hidden',
    flexDirection: 'row',
    backgroundColor: THEME.colors.surfaceSubtle,
    marginBottom: 14,
    gap: 2,
  },
  meterIncomeFill: {
    backgroundColor: THEME.colors.income,
  },
  meterExpenseFill: {
    backgroundColor: THEME.colors.expense,
  },
  meterInvestmentFill: {
    backgroundColor: THEME.colors.investment,
  },
  triLegendGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: THEME.colors.border,
  },
  legendBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendLabel: {
    fontSize: 10,
    color: THEME.colors.textMuted,
    fontWeight: '600',
    fontFamily: THEME.typography.fontFamily,
  },
  legendValue: {
    fontSize: 13,
    color: THEME.colors.textPrimary,
    fontWeight: '800',
    fontFamily: THEME.typography.fontFamily,
  },
  analyticsTabBar: {
    flexDirection: 'row',
    backgroundColor: THEME.colors.surfaceSubtle,
    borderRadius: THEME.borderRadius.lg,
    padding: 4,
    marginBottom: 16,
    gap: 4,
  },
  tabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: THEME.borderRadius.md,
    gap: 6,
  },
  tabBtnActiveExpenses: {
    backgroundColor: THEME.colors.expenseBg,
    borderWidth: 1,
    borderColor: THEME.colors.expenseBorder,
  },
  tabBtnActiveInvestment: {
    backgroundColor: THEME.colors.investmentBg,
    borderWidth: 1,
    borderColor: THEME.colors.investmentBorder,
  },
  tabBtnActiveIncome: {
    backgroundColor: THEME.colors.incomeBg,
    borderWidth: 1,
    borderColor: THEME.colors.incomeBorder,
  },
  tabBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: THEME.colors.textMuted,
    fontFamily: THEME.typography.fontFamily,
  },
  tabBtnTextActiveExpenses: {
    color: THEME.colors.expense,
    fontWeight: '800',
  },
  tabBtnTextActiveInvestment: {
    color: THEME.colors.investment,
    fontWeight: '800',
  },
  tabBtnTextActiveIncome: {
    color: THEME.colors.income,
    fontWeight: '800',
  },
  metricHeroCard: {
    backgroundColor: THEME.colors.surface,
    borderRadius: THEME.borderRadius.xl,
    padding: 18,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    marginBottom: 16,
    ...THEME.shadows.card,
  },
  metricHeroHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  metricHeroLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: THEME.colors.textMuted,
    letterSpacing: 0.7,
    fontFamily: THEME.typography.fontFamily,
  },
  metricHeroValue: {
    fontSize: 30,
    fontWeight: '900',
    letterSpacing: -0.5,
    marginTop: 2,
    fontFamily: THEME.typography.fontFamily,
  },
  pillBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  pillBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    fontFamily: THEME.typography.fontFamily,
  },
  metricHeroClarification: {
    fontSize: 12,
    color: THEME.colors.textMuted,
    lineHeight: 16,
    marginTop: 2,
    fontFamily: THEME.typography.fontFamily,
  },
  wealthPhilosophyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.colors.investmentBg,
    padding: 10,
    borderRadius: THEME.borderRadius.md,
    gap: 8,
    borderWidth: 1,
    borderColor: THEME.colors.investmentBorder,
    marginTop: 12,
    marginBottom: 12,
  },
  wealthPhilosophyText: {
    fontSize: 11.5,
    color: THEME.colors.textPrimary,
    lineHeight: 16,
    flex: 1,
    fontWeight: '600',
    fontFamily: THEME.typography.fontFamily,
  },
  investStatsGrid: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 6,
  },
  investStatBox: {
    flex: 1,
    backgroundColor: THEME.colors.backgroundElevated,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: THEME.borderRadius.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  investStatNumber: {
    fontSize: 18,
    fontWeight: '900',
    color: THEME.colors.investment,
    fontFamily: THEME.typography.fontFamily,
  },
  investStatLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: THEME.colors.textMuted,
    marginTop: 2,
    fontFamily: THEME.typography.fontFamily,
  },
  budgetProgressSection: {
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: THEME.colors.border,
  },
  budgetHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  budgetHeaderTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: THEME.colors.textPrimary,
    fontFamily: THEME.typography.fontFamily,
  },
  budgetStatusTag: {
    fontSize: 11,
    fontWeight: '800',
    fontFamily: THEME.typography.fontFamily,
  },
  progressBarBackground: {
    height: 8,
    borderRadius: 4,
    backgroundColor: THEME.colors.surfaceSubtle,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  budgetValuesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  budgetValueText: {
    fontSize: 11,
    color: THEME.colors.textMuted,
    fontFamily: THEME.typography.fontFamily,
  },
  textWhite: {
    color: THEME.colors.textPrimary,
    fontWeight: '700',
  },
  noBudgetNote: {
    fontSize: 11.5,
    color: THEME.colors.textMuted,
    lineHeight: 16,
    fontFamily: THEME.typography.fontFamily,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    marginTop: 8,
    paddingHorizontal: 2,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: THEME.colors.textPrimary,
    fontFamily: THEME.typography.fontFamily,
  },
  sectionSubtitle: {
    fontSize: 11,
    color: THEME.colors.textMuted,
    fontFamily: THEME.typography.fontFamily,
  },
  categoryListCard: {
    backgroundColor: THEME.colors.surface,
    borderRadius: THEME.borderRadius.lg,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    marginBottom: 18,
    overflow: 'hidden',
  },
  categoryRowItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 12,
  },
  categoryRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: THEME.colors.border,
  },
  catIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  catMeta: {
    flex: 1,
  },
  catNameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  catName: {
    fontSize: 14,
    fontWeight: '700',
    color: THEME.colors.textPrimary,
    fontFamily: THEME.typography.fontFamily,
  },
  catSpent: {
    fontSize: 14,
    fontWeight: '800',
    color: THEME.colors.textPrimary,
    fontFamily: THEME.typography.fontFamily,
  },
  catProgressTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: THEME.colors.surfaceSubtle,
    overflow: 'hidden',
    marginBottom: 6,
  },
  catProgressFill: {
    height: '100%',
    borderRadius: 3,
  },
  catSubRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  catSubText: {
    fontSize: 11,
    color: THEME.colors.textMuted,
    fontFamily: THEME.typography.fontFamily,
  },
  catBudgetStatus: {
    fontSize: 11,
    fontWeight: '700',
    color: THEME.colors.primary,
    fontFamily: THEME.typography.fontFamily,
  },
  catBudgetOver: {
    color: THEME.colors.expense,
  },
  emptyCategories: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
    paddingHorizontal: 20,
    gap: 8,
  },
  emptyCategoriesText: {
    fontSize: 13,
    color: THEME.colors.textMuted,
    fontWeight: '600',
    fontFamily: THEME.typography.fontFamily,
  },
  addInvestBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.colors.investment,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: THEME.borderRadius.md,
    gap: 6,
    marginTop: 8,
  },
  addInvestBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
    fontFamily: THEME.typography.fontFamily,
  },
  transactionsListCard: {
    backgroundColor: THEME.colors.surface,
    borderRadius: THEME.borderRadius.lg,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    marginBottom: 24,
    overflow: 'hidden',
  },
  txRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 12,
  },
  txRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: THEME.colors.border,
  },
  txIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  txInfo: {
    flex: 1,
  },
  txDesc: {
    fontSize: 13.5,
    fontWeight: '700',
    color: THEME.colors.textPrimary,
    fontFamily: THEME.typography.fontFamily,
  },
  txMeta: {
    fontSize: 11,
    color: THEME.colors.textMuted,
    marginTop: 2,
    fontFamily: THEME.typography.fontFamily,
  },
  txAmount: {
    fontSize: 14,
    fontWeight: '800',
    fontFamily: THEME.typography.fontFamily,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalCard: {
    width: '100%',
    backgroundColor: THEME.colors.surface,
    borderRadius: THEME.borderRadius.xl,
    padding: 20,
    borderWidth: 1,
    borderColor: THEME.colors.borderStrong,
    ...THEME.shadows.card,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: THEME.colors.textPrimary,
    marginBottom: 16,
    fontFamily: THEME.typography.fontFamily,
  },
  monthOptionsList: {
    gap: 8,
    marginBottom: 16,
  },
  monthOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: THEME.borderRadius.md,
    backgroundColor: THEME.colors.backgroundElevated,
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  monthOptionActive: {
    borderColor: THEME.colors.primary,
    backgroundColor: THEME.colors.primaryGlow,
  },
  monthOptionText: {
    fontSize: 14,
    fontWeight: '600',
    color: THEME.colors.textSecondary,
    fontFamily: THEME.typography.fontFamily,
  },
  monthOptionTextActive: {
    color: THEME.colors.textPrimary,
    fontWeight: '800',
  },
  modalCloseButton: {
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: THEME.borderRadius.md,
    backgroundColor: THEME.colors.surfaceSubtle,
  },
  modalCloseButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: THEME.colors.textPrimary,
    fontFamily: THEME.typography.fontFamily,
  },
  editBudgetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  editBudgetTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: THEME.colors.textPrimary,
    fontFamily: THEME.typography.fontFamily,
  },
  editBudgetSubtitle: {
    fontSize: 12,
    color: THEME.colors.textMuted,
    fontFamily: THEME.typography.fontFamily,
  },
  editInputCard: {
    backgroundColor: THEME.colors.backgroundElevated,
    borderRadius: THEME.borderRadius.md,
    padding: 12,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    marginBottom: 16,
  },
  editInputLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: THEME.colors.textMuted,
    letterSpacing: 0.6,
    marginBottom: 6,
    fontFamily: THEME.typography.fontFamily,
  },
  editTextInput: {
    fontSize: 20,
    fontWeight: '800',
    color: THEME.colors.textPrimary,
    fontFamily: THEME.typography.fontFamily,
    padding: 0,
  },
  modalActionsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  editCancelBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: THEME.borderRadius.md,
    backgroundColor: THEME.colors.surfaceSubtle,
  },
  editCancelText: {
    fontSize: 13,
    fontWeight: '700',
    color: THEME.colors.textMuted,
    fontFamily: THEME.typography.fontFamily,
  },
  editSaveBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: THEME.borderRadius.md,
    backgroundColor: THEME.colors.primary,
  },
  editSaveText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
    fontFamily: THEME.typography.fontFamily,
  },
});

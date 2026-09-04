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
import { useTransactionStore } from '../../src/store/useTransactionStore';
import { useBudgetStore } from '../../src/store/useBudgetStore';
import { useSettingsStore } from '../../src/store/useSettingsStore';
import { usePrivacyStore } from '../../src/store/usePrivacyStore';
import { Category } from '../../src/types';
import { THEME } from '../../src/constants/theme';
import { Icon } from '../../src/components/ui/Icon';
import { formatCurrency, formatMonthYear, parseInputToPaise } from '../../src/utils/formatters';
import { triggerHaptic } from '../../src/utils/haptics';

export default function BudgetAnalyticsScreen() {
  const transactions = useTransactionStore((state) => state.transactions);
  const budgets = useBudgetStore((state) => state.budgets);
  const categories = useBudgetStore((state) => state.categories);
  const selectedMonth = useBudgetStore((state) => state.selectedMonth);
  const setSelectedMonth = useBudgetStore((state) => state.setSelectedMonth);
  const setBudget = useBudgetStore((state) => state.setBudget);

  const currency = useSettingsStore((state) => state.settings.currency);
  const isSensitiveDataVisible = usePrivacyStore((state) => state.isSensitiveDataVisible);

  // Month selector modal
  const [isMonthModalVisible, setIsMonthModalVisible] = useState(false);

  // Budget edit modal
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [budgetInput, setBudgetInput] = useState('');

  const availableMonths = ['2026-09', '2026-08', '2026-07', '2026-06'];

  const categoryMap = useMemo(
    () => new Map(categories.map((c) => [c.id, c])),
    [categories]
  );

  // Month transactions
  const monthTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      const txMonth = tx.date ? tx.date.substring(0, 7) : '';
      return txMonth === selectedMonth;
    });
  }, [transactions, selectedMonth]);

  // Income vs Expense
  const { totalIncome, totalExpense } = useMemo(() => {
    let inc = 0;
    let exp = 0;
    for (const tx of monthTransactions) {
      if (tx.type === 'income') {
        inc += tx.amount;
      } else {
        exp += tx.amount;
      }
    }
    return { totalIncome: inc, totalExpense: exp };
  }, [monthTransactions]);

  const netSavings = Math.max(0, totalIncome - totalExpense);
  const savingsRate = totalIncome > 0 ? Math.round((netSavings / totalIncome) * 100) : 0;

  // Category spending and budget map
  const categoryBudgets = useMemo(() => {
    const map = new Map<string, number>();
    for (const b of budgets) {
      if (b.month === selectedMonth) {
        map.set(b.categoryId, b.limit);
      }
    }
    return map;
  }, [budgets, selectedMonth]);

  const categoryBreakdown = useMemo(() => {
    const spendingMap = new Map<string, number>();
    for (const tx of monthTransactions) {
      if (tx.type === 'expense') {
        spendingMap.set(
          tx.categoryId,
          (spendingMap.get(tx.categoryId) || 0) + tx.amount
        );
      }
    }

    // Include categories that either have spending or have a budget set
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

  const totalBudgetLimit = useMemo(() => {
    return Array.from(categoryBudgets.values()).reduce((sum, lim) => sum + lim, 0);
  }, [categoryBudgets]);

  const totalBudgetProgress =
    totalBudgetLimit > 0
      ? Math.min(100, Math.round((totalExpense / totalBudgetLimit) * 100))
      : 0;

  const displayAmount = (paise: number) => {
    if (!isSensitiveDataVisible) return '••••••';
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
            <Text style={styles.headerSubtitle}>Spending & Budget Health</Text>
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

        {/* Cashflow & Savings Overview Card */}
        <View style={styles.overviewCard}>
          <View style={styles.overviewTop}>
            <View>
              <Text style={styles.overviewLabel}>SAVINGS RATE</Text>
              <Text style={styles.savingsRateText}>{savingsRate}%</Text>
            </View>
            <View style={styles.savingsBadge}>
              <Icon name="TrendingUp" size={16} color={THEME.colors.income} />
              <Text style={styles.savingsBadgeText}>
                {displayAmount(netSavings)} saved
              </Text>
            </View>
          </View>

          {/* Bi-color Cashflow Meter */}
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
          </View>

          <View style={styles.meterLegend}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: THEME.colors.income }]} />
              <Text style={styles.legendText}>Income: {displayAmount(totalIncome)}</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: THEME.colors.expense }]} />
              <Text style={styles.legendText}>Spent: {displayAmount(totalExpense)}</Text>
            </View>
          </View>
        </View>

        {/* Total Monthly Budget Card */}
        <View style={styles.budgetCard}>
          <View style={styles.budgetHeader}>
            <View style={styles.cardTitleRow}>
              <Icon name="Target" size={18} color={THEME.colors.primary} />
              <Text style={styles.cardTitle}>Total Monthly Budget</Text>
            </View>
            <Text
              style={[
                styles.budgetStatusText,
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
                  Limit: <Text style={styles.textWhite}>{displayAmount(totalBudgetLimit)}</Text>
                </Text>
              </View>
            </>
          ) : (
            <Text style={styles.noBudgetNote}>
              Set category limits below to establish your monthly spending budget.
            </Text>
          )}
        </View>

        {/* Category Breakdown Header */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Category Spending & Budgets</Text>
          <Text style={styles.sectionSubtitle}>Tap to set budget</Text>
        </View>

        {/* Category Cards List */}
        <View style={styles.categoryListCard}>
          {categoryBreakdown.length === 0 ? (
            <View style={styles.emptyCategories}>
              <Icon name="PieChart" size={32} color={THEME.colors.textMuted} />
              <Text style={styles.emptyCategoriesText}>No expenses in this month</Text>
            </View>
          ) : (
            categoryBreakdown.map((item, index) => {
              const isLast = index === categoryBreakdown.length - 1;
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
                        {item.percentOfTotal}% of total spend
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
    padding: 20,
    borderWidth: 1,
    borderColor: THEME.colors.borderStrong,
    marginBottom: 16,
    ...THEME.shadows.card,
  },
  overviewTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  overviewLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: THEME.colors.textMuted,
    letterSpacing: 0.8,
    fontFamily: THEME.typography.fontFamily,
  },
  savingsRateText: {
    fontSize: 32,
    fontWeight: '900',
    color: THEME.colors.textPrimary,
    letterSpacing: -0.5,
    marginTop: 2,
    fontFamily: THEME.typography.fontFamily,
  },
  savingsBadge: {
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
  savingsBadgeText: {
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
    marginBottom: 12,
  },
  meterIncomeFill: {
    backgroundColor: THEME.colors.income,
  },
  meterExpenseFill: {
    backgroundColor: THEME.colors.expense,
  },
  meterLegend: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 12,
    color: THEME.colors.textSecondary,
    fontWeight: '600',
    fontFamily: THEME.typography.fontFamily,
  },
  budgetCard: {
    backgroundColor: THEME.colors.surface,
    borderRadius: THEME.borderRadius.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    marginBottom: 20,
  },
  budgetHeader: {
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
  budgetStatusText: {
    fontSize: 12,
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
    fontSize: 12,
    color: THEME.colors.textMuted,
    fontFamily: THEME.typography.fontFamily,
  },
  textWhite: {
    color: THEME.colors.textPrimary,
    fontWeight: '700',
  },
  noBudgetNote: {
    fontSize: 12,
    color: THEME.colors.textMuted,
    lineHeight: 16,
    fontFamily: THEME.typography.fontFamily,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingHorizontal: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: THEME.colors.textPrimary,
    fontFamily: THEME.typography.fontFamily,
  },
  sectionSubtitle: {
    fontSize: 11,
    color: THEME.colors.primary,
    fontWeight: '700',
    fontFamily: THEME.typography.fontFamily,
  },
  categoryListCard: {
    backgroundColor: THEME.colors.surface,
    borderRadius: THEME.borderRadius.lg,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    overflow: 'hidden',
  },
  categoryRowItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 14,
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
    marginRight: 12,
  },
  catMeta: {
    flex: 1,
  },
  catNameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
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
    height: 5,
    borderRadius: 2.5,
    backgroundColor: THEME.colors.surfaceSubtle,
    overflow: 'hidden',
    marginBottom: 6,
  },
  catProgressFill: {
    height: '100%',
    borderRadius: 2.5,
  },
  catSubRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  catSubText: {
    fontSize: 11,
    color: THEME.colors.textMuted,
    fontFamily: THEME.typography.fontFamily,
  },
  catBudgetStatus: {
    fontSize: 11,
    color: THEME.colors.primary,
    fontWeight: '700',
    fontFamily: THEME.typography.fontFamily,
  },
  catBudgetOver: {
    color: THEME.colors.expense,
  },
  emptyCategories: {
    padding: 30,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  emptyCategoriesText: {
    fontSize: 13,
    color: THEME.colors.textMuted,
    fontFamily: THEME.typography.fontFamily,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.82)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 340,
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
    marginBottom: 14,
    textAlign: 'center',
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
    fontWeight: '700',
    color: THEME.colors.textSecondary,
    fontFamily: THEME.typography.fontFamily,
  },
  monthOptionTextActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  modalCloseButton: {
    paddingVertical: 10,
    alignItems: 'center',
  },
  modalCloseButtonText: {
    fontSize: 14,
    color: THEME.colors.textMuted,
    fontWeight: '700',
    fontFamily: THEME.typography.fontFamily,
  },
  editBudgetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 18,
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
    marginBottom: 18,
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
    fontSize: 22,
    fontWeight: '800',
    color: THEME.colors.textPrimary,
    padding: 0,
    fontFamily: THEME.typography.fontFamily,
  },
  modalActionsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  editCancelBtn: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: THEME.borderRadius.md,
    backgroundColor: THEME.colors.surfaceSubtle,
  },
  editCancelText: {
    fontSize: 14,
    fontWeight: '700',
    color: THEME.colors.textSecondary,
    fontFamily: THEME.typography.fontFamily,
  },
  editSaveBtn: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: THEME.borderRadius.md,
    backgroundColor: THEME.colors.primary,
    ...THEME.shadows.floating,
  },
  editSaveText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
    fontFamily: THEME.typography.fontFamily,
  },
});

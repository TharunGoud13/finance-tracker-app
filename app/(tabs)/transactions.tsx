import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Pressable,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { useTransactionStore } from '../../src/store/useTransactionStore';
import { useBudgetStore } from '../../src/store/useBudgetStore';
import { useSettingsStore } from '../../src/store/useSettingsStore';
import { Transaction, TransactionType } from '../../src/types';
import { THEME } from '../../src/constants/theme';
import { Icon } from '../../src/components/ui/Icon';
import { formatCurrency, formatDate } from '../../src/utils/formatters';
import { triggerHaptic } from '../../src/utils/haptics';

export default function TransactionsScreen() {
  const router = useRouter();

  const transactions = useTransactionStore((state) => state.transactions);
  const deleteTransaction = useTransactionStore((state) => state.deleteTransaction);
  const categories = useBudgetStore((state) => state.categories);
  const currency = useSettingsStore((state) => state.settings.currency);

  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'expense' | 'income' | 'investment'>('all');
  const [selectedCatId, setSelectedCatId] = useState<string>('all');

  // Transaction detail / action sheet state
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);
  const [txToDelete, setTxToDelete] = useState<Transaction | null>(null);

  const categoryMap = useMemo(
    () => new Map(categories.map((c) => [c.id, c])),
    [categories]
  );

  // Filtered list
  const filteredTransactions = useMemo(() => {
    return transactions
      .filter((tx) => {
        // Type filter
        if (typeFilter !== 'all' && tx.type !== typeFilter) return false;

        // Category filter
        if (selectedCatId !== 'all' && tx.categoryId !== selectedCatId) return false;

        // Search query
        if (searchQuery.trim()) {
          const query = searchQuery.toLowerCase();
          const catName = categoryMap.get(tx.categoryId)?.name?.toLowerCase() || '';
          const desc = (tx.description || '').toLowerCase();
          const notes = (tx.notes || '').toLowerCase();
          if (!desc.includes(query) && !catName.includes(query) && !notes.includes(query)) {
            return false;
          }
        }

        return true;
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [transactions, typeFilter, selectedCatId, searchQuery, categoryMap]);

  // Group by Date
  const groupedTransactions = useMemo(() => {
    const groups: { dateKey: string; label: string; items: Transaction[] }[] = [];
    const dateMap: Record<string, Transaction[]> = {};

    for (const tx of filteredTransactions) {
      const dateKey = tx.date ? tx.date.split('T')[0] : 'other';
      if (!dateMap[dateKey]) {
        dateMap[dateKey] = [];
      }
      dateMap[dateKey].push(tx);
    }

    for (const [dateKey, items] of Object.entries(dateMap)) {
      groups.push({
        dateKey,
        label: formatDate(dateKey, 'relative'),
        items,
      });
    }

    return groups;
  }, [filteredTransactions]);

  // Calculate sum of filtered transactions
  const totalFilteredAmount = useMemo(() => {
    let sum = 0;
    for (const tx of filteredTransactions) {
      if (tx.type === 'expense') {
        sum -= tx.amount;
      } else if (tx.type === 'investment') {
        sum += tx.amount;
      } else {
        sum += tx.amount;
      }
    }
    return sum;
  }, [filteredTransactions]);

  const displayAmount = (paise: number) => {
    return formatCurrency(paise, currency);
  };

  const handleDelete = async () => {
    if (!txToDelete) return;
    const id = txToDelete.id;
    setTxToDelete(null);
    setSelectedTx(null);
    await deleteTransaction(id);
    triggerHaptic.heavy();
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <StatusBar style="light" />
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>Activity</Text>
            <Text style={styles.headerSubtitle}>History & Transactions</Text>
          </View>
          <Pressable
            style={styles.addButton}
            onPress={() => {
              triggerHaptic.medium();
              router.push('/modal/add-transaction');
            }}
          >
            <Icon name="Plus" size={18} color="#FFFFFF" strokeWidth={2.5} />
            <Text style={styles.addButtonText}>Add</Text>
          </Pressable>
        </View>

        {/* Search Bar */}
        <View style={styles.searchBarContainer}>
          <Icon name="Search" size={18} color={THEME.colors.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search notes, merchants, categories..."
            placeholderTextColor={THEME.colors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
            clearButtonMode="while-editing"
          />
          {searchQuery.length > 0 && (
            <Pressable
              onPress={() => {
                triggerHaptic.light();
                setSearchQuery('');
              }}
            >
              <Icon name="XCircle" size={18} color={THEME.colors.textSecondary} />
            </Pressable>
          )}
        </View>

        {/* Type Filter Pills (Horizontal Scrollable: All / Expenses / Investments / Income) */}
        <View style={styles.typeFilterWrapper}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.typeFilterScrollContent}
          >
            <Pressable
              style={[styles.typePill, typeFilter === 'all' && styles.typePillActive]}
              onPress={() => {
                triggerHaptic.selection();
                setTypeFilter('all');
              }}
            >
              <Text style={[styles.typePillText, typeFilter === 'all' && styles.typePillTextActive]}>
                All
              </Text>
            </Pressable>

            <Pressable
              style={[styles.typePill, typeFilter === 'expense' && styles.typePillActiveExpense]}
              onPress={() => {
                triggerHaptic.selection();
                setTypeFilter('expense');
              }}
            >
              <Text
                style={[
                  styles.typePillText,
                  typeFilter === 'expense' && styles.typePillTextActiveExpense,
                ]}
              >
                Expenses
              </Text>
            </Pressable>

            <Pressable
              style={[styles.typePill, typeFilter === 'investment' && styles.typePillActiveInvestment]}
              onPress={() => {
                triggerHaptic.selection();
                setTypeFilter('investment');
              }}
            >
              <Text
                style={[
                  styles.typePillText,
                  typeFilter === 'investment' && styles.typePillTextActiveInvestment,
                ]}
              >
                Investments
              </Text>
            </Pressable>

            <Pressable
              style={[styles.typePill, typeFilter === 'income' && styles.typePillActiveIncome]}
              onPress={() => {
                triggerHaptic.selection();
                setTypeFilter('income');
              }}
            >
              <Text
                style={[
                  styles.typePillText,
                  typeFilter === 'income' && styles.typePillTextActiveIncome,
                ]}
              >
                Income
              </Text>
            </Pressable>
          </ScrollView>
        </View>

        {/* Category Filter Horizontal Scroll */}
        <View style={styles.catScrollWrapper}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.catScrollContent}
          >
            <Pressable
              style={[styles.catPill, selectedCatId === 'all' && styles.catPillActive]}
              onPress={() => {
                triggerHaptic.selection();
                setSelectedCatId('all');
              }}
            >
              <Text
                style={[
                  styles.catPillText,
                  selectedCatId === 'all' && styles.catPillTextActive,
                ]}
              >
                All Categories
              </Text>
            </Pressable>

            {categories.map((cat) => {
              const isSelected = selectedCatId === cat.id;
              return (
                <Pressable
                  key={cat.id}
                  style={[
                    styles.catPill,
                    isSelected && {
                      backgroundColor: `${THEME.colors.primary}25`,
                      borderColor: THEME.colors.primary,
                    },
                  ]}
                  onPress={() => {
                    triggerHaptic.selection();
                    setSelectedCatId(isSelected ? 'all' : cat.id);
                  }}
                >
                  <View
                    style={[
                      styles.catDot,
                      { backgroundColor: cat.color || THEME.colors.primary },
                    ]}
                  />
                  <Text
                    style={[
                      styles.catPillText,
                      isSelected && { color: '#FFFFFF', fontWeight: '800' },
                    ]}
                  >
                    {cat.name}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        {/* Filter Summary Strip */}
        <View style={styles.summaryStrip}>
          <Text style={styles.summaryCount}>
            {filteredTransactions.length} transaction{filteredTransactions.length === 1 ? '' : 's'}
          </Text>
          <Text
            style={[
              styles.summaryTotal,
              totalFilteredAmount < 0 ? styles.summaryTotalExpense : styles.summaryTotalIncome,
            ]}
          >
            Net: {displayAmount(totalFilteredAmount)}
          </Text>
        </View>

        {/* Main List */}
        <ScrollView
          style={styles.listContainer}
          contentContainerStyle={styles.listContentContainer}
          showsVerticalScrollIndicator={false}
        >
          {groupedTransactions.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Icon name="SearchX" size={44} color={THEME.colors.textMuted} />
              <Text style={styles.emptyTitle}>No matching transactions</Text>
              <Text style={styles.emptySubtitle}>
                Try adjusting your filters or search terms.
              </Text>
            </View>
          ) : (
            groupedTransactions.map((group) => (
              <View key={group.dateKey} style={styles.groupContainer}>
                <Text style={styles.groupLabel}>{group.label}</Text>
                <View style={styles.groupCard}>
                  {group.items.map((tx, idx) => {
                    const category = categoryMap.get(tx.categoryId);
                    const isExpense = tx.type === 'expense';
                    const isInvestment = tx.type === 'investment';
                    const isLast = idx === group.items.length - 1;

                    return (
                      <Pressable
                        key={tx.id}
                        style={[
                          styles.transactionRow,
                          !isLast && styles.transactionRowBorder,
                        ]}
                        onPress={() => {
                          triggerHaptic.light();
                          setSelectedTx(tx);
                        }}
                      >
                        <View
                          style={[
                            styles.categoryIconCircle,
                            {
                              backgroundColor: `${
                                category?.color ||
                                (isInvestment
                                  ? THEME.colors.investment
                                  : isExpense
                                  ? THEME.colors.expense
                                  : THEME.colors.income)
                              }22`,
                            },
                          ]}
                        >
                          <Icon
                            name={
                              category?.icon ||
                              (isInvestment ? 'TrendingUp' : isExpense ? 'ArrowUpRight' : 'ArrowDownLeft')
                            }
                            size={18}
                            color={
                              category?.color ||
                              (isInvestment
                                ? THEME.colors.investment
                                : isExpense
                                ? THEME.colors.expense
                                : THEME.colors.income)
                            }
                          />
                        </View>

                        <View style={styles.txInfo}>
                          <Text style={styles.txTitle} numberOfLines={1}>
                            {tx.description || category?.name || 'Transaction'}
                          </Text>
                          <Text style={styles.txCategory} numberOfLines={1}>
                            {category?.name || 'Uncategorized'}
                            {tx.notes ? ` • ${tx.notes}` : ''}
                          </Text>
                        </View>

                        <Text
                          style={[
                            styles.txAmount,
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
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            ))
          )}
        </ScrollView>

        {/* Transaction Detail Sheet / Modal */}
        {selectedTx && (
          <Modal
            visible={!!selectedTx}
            transparent
            animationType="fade"
            onRequestClose={() => {
              triggerHaptic.light();
              setSelectedTx(null);
            }}
          >
            <View style={styles.modalBackdrop}>
              <View style={styles.modalCard}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Transaction Details</Text>
                  <Pressable
                    onPress={() => {
                      triggerHaptic.light();
                      setSelectedTx(null);
                    }}
                    hitSlop={8}
                    style={styles.modalCloseBtn}
                  >
                    <Icon name="X" size={18} color={THEME.colors.textSecondary} />
                  </Pressable>
                </View>

                {/* Amount Header */}
                <View style={styles.modalAmountBlock}>
                  <Text
                    style={[
                      styles.modalAmountText,
                      selectedTx.type === 'expense'
                        ? styles.amountExpense
                        : selectedTx.type === 'investment'
                        ? styles.amountInvestment
                        : styles.amountIncome,
                    ]}
                    numberOfLines={1}
                    adjustsFontSizeToFit
                  >
                    {selectedTx.type === 'expense'
                      ? '-'
                      : selectedTx.type === 'investment'
                      ? '•'
                      : '+'}
                    {displayAmount(selectedTx.amount)}
                  </Text>
                  <Text style={styles.modalDescription} numberOfLines={2}>
                    {selectedTx.description || 'No description'}
                  </Text>
                </View>

                {/* Metadata List */}
                <View style={styles.modalDetailsList}>
                  <View style={styles.modalDetailRow}>
                    <Text style={styles.modalDetailLabel}>Category</Text>
                    <Text style={styles.modalDetailValue} numberOfLines={1}>
                      {categoryMap.get(selectedTx.categoryId)?.name || 'General'}
                    </Text>
                  </View>
                  <View style={styles.modalDetailRow}>
                    <Text style={styles.modalDetailLabel}>Date</Text>
                    <Text style={styles.modalDetailValue} numberOfLines={1}>
                      {formatDate(selectedTx.date, 'full')}
                    </Text>
                  </View>
                  <View style={styles.modalDetailRow}>
                    <Text style={styles.modalDetailLabel}>Type</Text>
                    <Text style={styles.modalDetailValue} numberOfLines={1}>
                      {selectedTx.type === 'expense'
                        ? 'Expense'
                        : selectedTx.type === 'investment'
                        ? 'Investment'
                        : 'Income'}
                    </Text>
                  </View>
                  {selectedTx.notes ? (
                    <View style={styles.modalDetailRow}>
                      <Text style={styles.modalDetailLabel}>Notes</Text>
                      <Text style={styles.modalDetailValue}>{selectedTx.notes}</Text>
                    </View>
                  ) : null}
                </View>

                {/* Action Buttons */}
                <View style={styles.modalActionsRow}>
                  <Pressable
                    style={[styles.modalActionBtn, styles.editBtn]}
                    onPress={() => {
                      triggerHaptic.medium();
                      const id = selectedTx.id;
                      setSelectedTx(null);
                      router.push({
                        pathname: '/modal/edit-transaction',
                        params: { transactionId: id },
                      });
                    }}
                  >
                    <Icon name="Pencil" size={16} color="#FFFFFF" />
                    <Text style={styles.editBtnText}>Edit</Text>
                  </Pressable>

                  <Pressable
                    style={[styles.modalActionBtn, styles.deleteBtn]}
                    onPress={() => {
                      triggerHaptic.medium();
                      setTxToDelete(selectedTx);
                    }}
                  >
                    <Icon name="Trash2" size={16} color={THEME.colors.expense} />
                    <Text style={styles.deleteBtnText}>Delete</Text>
                  </Pressable>
                </View>
              </View>
            </View>
          </Modal>
        )}

        {/* Delete Confirmation Alert Modal */}
        {txToDelete && (
          <Modal
            visible={!!txToDelete}
            transparent
            animationType="fade"
            onRequestClose={() => {
              triggerHaptic.light();
              setTxToDelete(null);
            }}
          >
            <View style={styles.modalBackdrop}>
              <View style={[styles.modalCard, { maxWidth: 320 }]}>
                <View style={styles.alertIconWrap}>
                  <Icon name="AlertTriangle" size={28} color={THEME.colors.expense} />
                </View>
                <Text style={styles.alertTitle}>Delete Transaction?</Text>
                <Text style={styles.alertSubtitle}>
                  This record will be permanently deleted from your local device storage.
                </Text>

                <View style={styles.alertActions}>
                  <Pressable
                    style={styles.alertCancelBtn}
                    onPress={() => {
                      triggerHaptic.light();
                      setTxToDelete(null);
                    }}
                  >
                    <Text style={styles.alertCancelText}>Cancel</Text>
                  </Pressable>
                  <Pressable
                    style={styles.alertConfirmBtn}
                    onPress={handleDelete}
                  >
                    <Text style={styles.alertConfirmText}>Delete</Text>
                  </Pressable>
                </View>
              </View>
            </View>
          </Modal>
        )}
      </View>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    marginBottom: 12,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: '900',
    color: THEME.colors.textPrimary,
    letterSpacing: -0.5,
    fontFamily: THEME.typography.fontFamily,
  },
  headerSubtitle: {
    fontSize: 12,
    color: THEME.colors.textMuted,
    marginTop: 2,
    fontFamily: THEME.typography.fontFamily,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.colors.primary,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: THEME.borderRadius.md,
    gap: 6,
    ...THEME.shadows.floating,
  },
  addButtonText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
    fontFamily: THEME.typography.fontFamily,
  },
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.colors.surface,
    marginHorizontal: 16,
    paddingHorizontal: 12,
    height: 44,
    borderRadius: THEME.borderRadius.md,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    marginBottom: 10,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    color: THEME.colors.textPrimary,
    fontSize: 14,
    paddingVertical: 0,
    fontFamily: THEME.typography.fontFamily,
  },
  typeFilterWrapper: {
    marginBottom: 10,
  },
  typeFilterScrollContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  typePill: {
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: THEME.borderRadius.full,
    backgroundColor: THEME.colors.surface,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  typePillActive: {
    backgroundColor: THEME.colors.surfaceHover,
  },
  typePillActiveExpense: {
    backgroundColor: THEME.colors.expenseBg,
    borderWidth: 1,
    borderColor: THEME.colors.expenseBorder,
  },
  typePillActiveInvestment: {
    backgroundColor: THEME.colors.investmentBg,
    borderWidth: 1,
    borderColor: THEME.colors.investmentBorder,
  },
  typePillActiveIncome: {
    backgroundColor: THEME.colors.incomeBg,
    borderWidth: 1,
    borderColor: THEME.colors.incomeBorder,
  },
  typePillText: {
    fontSize: 12,
    fontWeight: '700',
    color: THEME.colors.textMuted,
    fontFamily: THEME.typography.fontFamily,
  },
  typePillTextActive: {
    color: THEME.colors.textPrimary,
    fontWeight: '800',
  },
  typePillTextActiveExpense: {
    color: THEME.colors.expense,
    fontWeight: '800',
  },
  typePillTextActiveInvestment: {
    color: THEME.colors.investment,
    fontWeight: '800',
  },
  typePillTextActiveIncome: {
    color: THEME.colors.income,
    fontWeight: '800',
  },
  catScrollWrapper: {
    marginBottom: 10,
  },
  catScrollContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  catPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.colors.surface,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: THEME.borderRadius.full,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    gap: 6,
  },
  catPillActive: {
    backgroundColor: THEME.colors.primary,
    borderColor: THEME.colors.primary,
  },
  catDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  catPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: THEME.colors.textSecondary,
    fontFamily: THEME.typography.fontFamily,
  },
  catPillTextActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  summaryStrip: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: 16,
    paddingVertical: 4,
    marginBottom: 8,
  },
  summaryCount: {
    fontSize: 12,
    fontWeight: '700',
    color: THEME.colors.textMuted,
    fontFamily: THEME.typography.fontFamily,
  },
  summaryTotal: {
    fontSize: 12,
    fontWeight: '800',
    fontFamily: THEME.typography.fontFamily,
  },
  summaryTotalExpense: {
    color: THEME.colors.expense,
  },
  summaryTotalIncome: {
    color: THEME.colors.income,
  },
  listContainer: {
    flex: 1,
  },
  listContentContainer: {
    paddingHorizontal: 16,
    paddingBottom: 110,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 50,
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
    marginTop: 4,
    textAlign: 'center',
    fontFamily: THEME.typography.fontFamily,
  },
  groupContainer: {
    marginBottom: 16,
  },
  groupLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: THEME.colors.primaryLight,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 6,
    marginLeft: 4,
    fontFamily: THEME.typography.fontFamily,
  },
  groupCard: {
    backgroundColor: THEME.colors.surface,
    borderRadius: THEME.borderRadius.lg,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    overflow: 'hidden',
  },
  transactionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  transactionRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: THEME.colors.border,
  },
  categoryIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  txInfo: {
    flex: 1,
    minWidth: 0,
    marginRight: 10,
  },
  txTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: THEME.colors.textPrimary,
    marginBottom: 2,
    fontFamily: THEME.typography.fontFamily,
  },
  txCategory: {
    fontSize: 11,
    color: THEME.colors.textMuted,
    fontFamily: THEME.typography.fontFamily,
  },
  txAmount: {
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
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.82)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: THEME.colors.surface,
    borderRadius: THEME.borderRadius.xl,
    padding: 20,
    borderWidth: 1,
    borderColor: THEME.colors.borderStrong,
    ...THEME.shadows.card,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: THEME.colors.textPrimary,
    fontFamily: THEME.typography.fontFamily,
  },
  modalCloseBtn: {
    padding: 4,
  },
  modalAmountBlock: {
    alignItems: 'center',
    paddingVertical: 12,
    backgroundColor: THEME.colors.backgroundElevated,
    borderRadius: THEME.borderRadius.md,
    marginBottom: 16,
  },
  modalAmountText: {
    fontSize: 28,
    fontWeight: '900',
    marginBottom: 4,
    fontFamily: THEME.typography.fontFamily,
  },
  modalDescription: {
    fontSize: 14,
    color: THEME.colors.textSecondary,
    fontWeight: '600',
    fontFamily: THEME.typography.fontFamily,
  },
  modalDetailsList: {
    gap: 10,
    marginBottom: 20,
  },
  modalDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalDetailLabel: {
    fontSize: 13,
    color: THEME.colors.textMuted,
    fontFamily: THEME.typography.fontFamily,
  },
  modalDetailValue: {
    fontSize: 13,
    fontWeight: '700',
    color: THEME.colors.textPrimary,
    maxWidth: '60%',
    textAlign: 'right',
    fontFamily: THEME.typography.fontFamily,
  },
  modalActionsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  modalActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: THEME.borderRadius.md,
    gap: 6,
  },
  editBtn: {
    backgroundColor: THEME.colors.primary,
  },
  editBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
    fontFamily: THEME.typography.fontFamily,
  },
  deleteBtn: {
    backgroundColor: THEME.colors.expenseBg,
    borderWidth: 1,
    borderColor: THEME.colors.expenseBorder,
  },
  deleteBtnText: {
    color: THEME.colors.expense,
    fontSize: 14,
    fontWeight: '800',
    fontFamily: THEME.typography.fontFamily,
  },
  alertIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: THEME.colors.expenseBg,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: 12,
  },
  alertTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: THEME.colors.textPrimary,
    textAlign: 'center',
    marginBottom: 6,
    fontFamily: THEME.typography.fontFamily,
  },
  alertSubtitle: {
    fontSize: 12,
    color: THEME.colors.textMuted,
    textAlign: 'center',
    marginBottom: 18,
    lineHeight: 18,
    fontFamily: THEME.typography.fontFamily,
  },
  alertActions: {
    flexDirection: 'row',
    gap: 10,
  },
  alertCancelBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: THEME.borderRadius.md,
    backgroundColor: THEME.colors.surfaceSubtle,
    alignItems: 'center',
  },
  alertCancelText: {
    fontSize: 13,
    fontWeight: '700',
    color: THEME.colors.textSecondary,
    fontFamily: THEME.typography.fontFamily,
  },
  alertConfirmBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: THEME.borderRadius.md,
    backgroundColor: THEME.colors.expense,
    alignItems: 'center',
  },
  alertConfirmText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
    fontFamily: THEME.typography.fontFamily,
  },
});

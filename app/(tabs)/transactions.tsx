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
import { useRouter } from 'expo-router';
import { useTransactionStore } from '../../src/store/useTransactionStore';
import { useBudgetStore } from '../../src/store/useBudgetStore';
import { Transaction, TransactionType } from '../../src/types';
import { TransactionItem } from '../../src/components/transaction/TransactionItem';
import { DeleteConfirmDialog } from '../../src/components/transaction/DeleteConfirmDialog';
import { UndoSnackbar } from '../../src/components/common/UndoSnackbar';
import { EmptyState } from '../../src/components/common/EmptyState';
import { HapticPressable } from '../../src/components/ui/HapticPressable';
import { Button } from '../../src/components/ui/Button';
import { Icon } from '../../src/components/ui/Icon';
import { Tabs, TabsList, TabsTrigger } from '../../src/components/ui/Tabs';
import {
  groupTransactionsByDate,
  filterTransactions,
  DateGroupedTransactions,
} from '../../src/utils/calculations';
import { triggerHaptic } from '../../src/utils/haptics';

export default function TransactionsScreen() {
  const router = useRouter();
  const transactions = useTransactionStore((state) => state.transactions);
  const deleteTransaction = useTransactionStore((state) => state.deleteTransaction);
  const restoreLastDeletedTransaction = useTransactionStore(
    (state) => state.restoreLastDeletedTransaction
  );
  const lastDeletedTx = useTransactionStore((state) => state.lastDeletedTransaction);
  const categories = useBudgetStore((state) => state.categories);

  // Filters & State
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<TransactionType | 'all'>('all');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | 'all'>('all');
  const [sortBy, setSortBy] = useState<'date-desc' | 'date-asc' | 'amount-desc' | 'amount-asc'>('date-desc');
  const [isFilterModalVisible, setIsFilterModalVisible] = useState(false);

  // Deletion States
  const [txToDelete, setTxToDelete] = useState<Transaction | null>(null);
  const [showUndoSnackbar, setShowUndoSnackbar] = useState(false);

  const categoryMap = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories]);

  // Filtered & Sorted Transactions
  const filteredList: Transaction[] = useMemo(() => {
    return filterTransactions(transactions, {
      type: typeFilter,
      categoryId: selectedCategoryId,
      searchQuery,
      sortBy,
    });
  }, [transactions, typeFilter, selectedCategoryId, searchQuery, sortBy]);

  // Grouped by Date (e.g. "Today", "Yesterday", "Sep 1, 2026")
  const groupedList: DateGroupedTransactions[] = useMemo(() => {
    return groupTransactionsByDate(filteredList);
  }, [filteredList]);

  const handleDeleteConfirm = async () => {
    if (!txToDelete) return;
    const tx = txToDelete;
    setTxToDelete(null);
    await deleteTransaction(tx.id);
    setShowUndoSnackbar(true);
    triggerHaptic.medium();
  };

  const handleUndo = async () => {
    setShowUndoSnackbar(false);
    await restoreLastDeletedTransaction();
    triggerHaptic.success();
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <StatusBar style="light" />
      <View style={styles.container}>
        {/* Header with Title and Add Button */}
        <View style={styles.header}>
          <Text style={styles.screenTitle}>Activity</Text>
          <View style={styles.headerActions}>
            <HapticPressable
              onPress={() => router.push('/modal/add-transaction')}
              hapticType="medium"
              style={styles.addBtn}
            >
              <Icon name="Plus" size={20} color="#ffffff" />
            </HapticPressable>
          </View>
        </View>

        {/* Search & Filter Row */}
        <View style={styles.searchContainer}>
          <View style={styles.searchBar}>
            <Icon name="Search" size={16} color="rgba(235, 235, 245, 0.4)" style={{ marginRight: 8 }} />
            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search expenses..."
              placeholderTextColor="rgba(235, 235, 245, 0.35)"
              style={styles.searchInput}
              clearButtonMode="while-editing"
            />
            {searchQuery.length > 0 && (
              <HapticPressable onPress={() => setSearchQuery('')} hapticType="light">
                <Icon name="XCircle" size={16} color="rgba(235, 235, 245, 0.4)" />
              </HapticPressable>
            )}
          </View>
          <HapticPressable
            onPress={() => setIsFilterModalVisible(true)}
            hapticType="light"
            style={[
              styles.filterButton,
              (selectedCategoryId !== 'all' || sortBy !== 'date-desc') && styles.filterButtonActive,
            ]}
          >
            <Icon name="SlidersHorizontal" size={16} color="#ffffff" />
          </HapticPressable>
        </View>

        {/* Type Filter Tabs */}
        <Tabs
          value={typeFilter}
          onValueChange={(v) => setTypeFilter(v as TransactionType | 'all')}
          style={styles.tabsWrapper}
        >
          <TabsList style={styles.tabsList}>
            <TabsTrigger
              value="all"
              label="All"
              icon="Layers"
              accentColor="#ffffff"
            />
            <TabsTrigger
              value="expense"
              label="Expenses"
              icon="ArrowUpRight"
              accentColor="#eb0028"
            />
            <TabsTrigger
              value="income"
              label="Income"
              icon="ArrowDownLeft"
              accentColor="#30d158"
            />
          </TabsList>
        </Tabs>

        {/* Grouped Transactions List */}
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        >
          {filteredList.length === 0 ? (
            <EmptyState
              icon="Search"
              title="No Transactions Found"
              message={
                searchQuery
                  ? `No transactions matching "${searchQuery}"`
                  : 'No transactions recorded yet in this category.'
              }
              actionTitle="Add Transaction"
              onAction={() => router.push('/modal/add-transaction')}
            />
          ) : (
            groupedList.map((group: DateGroupedTransactions) => (
              <View key={group.dateLabel} style={styles.dateGroup}>
                <View style={styles.dateHeaderRow}>
                  <Text style={styles.dateLabel}>{group.dateLabel}</Text>
                </View>

                <View style={styles.listGroup}>
                  {group.transactions.map((tx: Transaction, index) => (
                    <React.Fragment key={tx.id}>
                      <TransactionItem
                        transaction={tx}
                        category={categoryMap.get(tx.categoryId)}
                        onPress={() => {
                          router.push({
                            pathname: '/modal/edit-transaction',
                            params: { transactionId: tx.id },
                          });
                        }}
                        onLongPress={() => {
                          triggerHaptic.heavy();
                          setTxToDelete(tx);
                        }}
                      />
                      {index < group.transactions.length - 1 && (
                        <View style={styles.separator} />
                      )}
                    </React.Fragment>
                  ))}
                </View>
              </View>
            ))
          )}
        </ScrollView>

        {/* Filter / Sort Sheet (Apple Inset Grouped Style) */}
        <Modal
          visible={isFilterModalVisible}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={() => setIsFilterModalVisible(false)}
        >
          <SafeAreaView style={{ flex: 1, backgroundColor: '#000000' }}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Sort & Filter</Text>
              <HapticPressable
                onPress={() => setIsFilterModalVisible(false)}
                hapticType="light"
                style={styles.modalCloseBtn}
              >
                <Icon name="X" size={20} color="#ffffff" />
              </HapticPressable>
            </View>

            <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 48 }}>
              <Text style={styles.filterSectionTitle}>SORT ORDER</Text>
              <View style={styles.insetGroup}>
                {[
                  { value: 'date-desc', label: 'Newest First' },
                  { value: 'date-asc', label: 'Oldest First' },
                  { value: 'amount-desc', label: 'Highest Amount' },
                  { value: 'amount-asc', label: 'Lowest Amount' },
                ].map((opt, i, arr) => (
                  <React.Fragment key={opt.value}>
                    <HapticPressable
                      onPress={() => setSortBy(opt.value as any)}
                      hapticType="selection"
                      style={styles.insetRow}
                    >
                      <Text
                        style={[
                          styles.insetRowText,
                          sortBy === opt.value && { color: '#ffffff', fontWeight: '700' },
                        ]}
                      >
                        {opt.label}
                      </Text>
                      {sortBy === opt.value && (
                        <Icon name="Check" size={18} color="#eb0028" />
                      )}
                    </HapticPressable>
                    {i < arr.length - 1 && <View style={styles.insetSeparator} />}
                  </React.Fragment>
                ))}
              </View>

              <Text style={[styles.filterSectionTitle, { marginTop: 24 }]}>
                FILTER BY CATEGORY
              </Text>
              <View style={styles.insetGroup}>
                <HapticPressable
                  onPress={() => setSelectedCategoryId('all')}
                  hapticType="selection"
                  style={styles.insetRow}
                >
                  <Text
                    style={[
                      styles.insetRowText,
                      selectedCategoryId === 'all' && { color: '#ffffff', fontWeight: '700' },
                    ]}
                  >
                    All Categories
                  </Text>
                  {selectedCategoryId === 'all' && (
                    <Icon name="Check" size={18} color="#eb0028" />
                  )}
                </HapticPressable>
                <View style={styles.insetSeparator} />

                {categories.map((cat, i) => (
                  <React.Fragment key={cat.id}>
                    <HapticPressable
                      onPress={() => setSelectedCategoryId(cat.id)}
                      hapticType="selection"
                      style={styles.insetRow}
                    >
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <View
                          style={[
                            styles.catIconCircle,
                            { backgroundColor: `${cat.color}22` },
                          ]}
                        >
                          <Icon name={cat.icon || 'Tag'} size={14} color={cat.color} />
                        </View>
                        <Text
                          style={[
                            styles.insetRowText,
                            { marginLeft: 12 },
                            selectedCategoryId === cat.id && { color: '#ffffff', fontWeight: '700' },
                          ]}
                        >
                          {cat.name}
                        </Text>
                      </View>
                      {selectedCategoryId === cat.id && (
                        <Icon name="Check" size={18} color="#eb0028" />
                      )}
                    </HapticPressable>
                    {i < categories.length - 1 && <View style={styles.insetSeparator} />}
                  </React.Fragment>
                ))}
              </View>

              <Button
                title="Done"
                variant="primary"
                onPress={() => setIsFilterModalVisible(false)}
                style={{ marginTop: 32, marginBottom: 40 }}
              />
            </ScrollView>
          </SafeAreaView>
        </Modal>

        {/* Delete Confirmation Dialog */}
        <DeleteConfirmDialog
          visible={Boolean(txToDelete)}
          title="Delete Transaction?"
          message={`Are you sure you want to delete "${txToDelete?.description || 'this transaction'}"?`}
          onCancel={() => setTxToDelete(null)}
          onConfirm={handleDeleteConfirm}
        />

        {/* Undo Snackbar */}
        {showUndoSnackbar && lastDeletedTx && (
          <UndoSnackbar
            visible={showUndoSnackbar}
            message={`Deleted "${lastDeletedTx.description || 'Transaction'}"`}
            onUndo={handleUndo}
            onDismiss={() => setShowUndoSnackbar(false)}
          />
        )}
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 14,
  },
  screenTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: -0.5,
  },
  headerActions: {
    flexDirection: 'row',
  },
  addBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#eb0028',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#eb0028',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 4,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 12,
    gap: 10,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1c1c22',
    borderRadius: 14,
    paddingHorizontal: 12,
    height: 46,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#ffffff',
  },
  filterButton: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: '#1c1c22',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
  },
  filterButtonActive: {
    backgroundColor: 'rgba(235, 0, 40, 0.15)',
    borderWidth: 1,
    borderColor: '#eb0028',
  },
  tabsWrapper: {
    paddingHorizontal: 20,
    paddingBottom: 14,
  },
  tabsList: {
    // overrides the component default to be full-width
    alignSelf: 'stretch',
  },
  scrollView: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingTop: 4,
    paddingBottom: 136,
  },
  dateGroup: {
    marginBottom: 24,
  },
  dateHeaderRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 10,
    paddingHorizontal: 4,
  },
  dateLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: 'rgba(235,235,245,0.75)',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  listGroup: {
    backgroundColor: '#121216',
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    paddingVertical: 6,
    paddingHorizontal: 4,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    marginHorizontal: 16,
    marginLeft: 72,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#ffffff',
  },
  modalCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#1c1c1e',
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterSectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(235, 235, 245, 0.5)',
    letterSpacing: 0.5,
    marginBottom: 10,
    marginLeft: 16,
    textTransform: 'uppercase',
  },
  insetGroup: {
    backgroundColor: '#1c1c22',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
  },
  insetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
    minHeight: 52,
  },
  insetRowText: {
    fontSize: 15,
    fontWeight: '500',
    color: 'rgba(235, 235, 245, 0.85)',
  },
  insetSeparator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(255, 255, 255, 0.09)',
    marginLeft: 16,
  },
  catIconCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

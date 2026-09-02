import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Modal,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { useBudgetStore } from '../../src/store/useBudgetStore';
import { useCategoryAnalytics } from '../../src/hooks/useCategoryAnalytics';
import { useFinancialSummary } from '../../src/hooks/useFinancialSummary';
import { BudgetOverviewHeader } from '../../src/components/budget/BudgetOverviewHeader';
import { CategoryBudgetCard } from '../../src/components/budget/CategoryBudgetCard';
import { AllocationWarning } from '../../src/components/budget/AllocationWarning';
import { Button } from '../../src/components/ui/Button';
import { Icon } from '../../src/components/ui/Icon';
import { HapticPressable } from '../../src/components/ui/HapticPressable';
import { formatMonthYear, parseInputToPaise } from '../../src/utils/formatters';
import { useSettingsStore } from '../../src/store/useSettingsStore';
import { AppDialog } from '../../src/components/ui/AppDialog';

export default function BudgetScreen() {
  const router = useRouter();
  const selectedMonth = useBudgetStore((state) => state.selectedMonth);
  const setSelectedMonth = useBudgetStore((state) => state.setSelectedMonth);
  const setBudget = useBudgetStore((state) => state.setBudget);
  const copyPreviousMonthBudgets = useBudgetStore((state) => state.copyPreviousMonthBudgets);
  const resetMonthBudgets = useBudgetStore((state) => state.resetMonthBudgets);
  const currency = useSettingsStore((state) => state.settings.currency);

  const [isMonthModalVisible, setIsMonthModalVisible] = useState(false);
  const [budgetEditModalCat, setBudgetEditModalCat] = useState<{
    id: string;
    name: string;
    currentLimit: number;
  } | null>(null);
  const [newLimitInput, setNewLimitInput] = useState('');

  const [dialog, setDialog] = useState<{
    visible: boolean; title: string; message?: string;
    icon?: string; iconColor?: string;
    actions: { label: string; onPress: () => void; style?: 'default' | 'cancel' | 'destructive' }[];
  }>({ visible: false, title: '', actions: [] });

  const showAlert = (title: string, message?: string, icon = 'Info', iconColor = '#0a84ff') =>
    setDialog({ visible: true, title, message, icon, iconColor,
      actions: [{ label: 'OK', onPress: () => setDialog((d) => ({ ...d, visible: false })), style: 'cancel' }] });

  const showConfirm = (title: string, message: string, confirmLabel: string, onConfirm: () => void, destructive = false) =>
    setDialog({ visible: true, title, message, icon: 'AlertTriangle', iconColor: '#ff453a',
      actions: [
        { label: 'Cancel', onPress: () => setDialog((d) => ({ ...d, visible: false })), style: 'cancel' },
        { label: confirmLabel, onPress: () => { setDialog((d) => ({ ...d, visible: false })); onConfirm(); }, style: destructive ? 'destructive' : 'default' },
      ] });

  const summary = useFinancialSummary(selectedMonth);
  const categoryAnalytics = useCategoryAnalytics(selectedMonth);

  const availableMonths = [
    '2026-09',
    '2026-08',
    '2026-07',
    '2026-06',
    '2026-05',
  ];

  const handleCopyPrevBudgets = async () => {
    const count = await copyPreviousMonthBudgets(selectedMonth);
    if (count > 0) {
      showAlert('Budgets Copied', `Successfully copied ${count} category budgets from previous month.`, 'CheckCircle2', '#30d158');
    } else {
      showAlert('No Budgets Found', 'No budgets were found in the previous month to copy.', 'Info', '#0a84ff');
    }
  };

  const handleResetBudgets = () => {
    showConfirm(
      'Reset Month Budgets?',
      `Are you sure you want to clear all allocated budgets for ${formatMonthYear(selectedMonth)}?`,
      'Reset',
      () => resetMonthBudgets(selectedMonth),
      true
    );
  };

  const handleSaveBudgetLimit = async () => {
    if (!budgetEditModalCat) return;
    const paise = parseInputToPaise(newLimitInput, currency);
    await setBudget(budgetEditModalCat.id, paise, selectedMonth);
    setBudgetEditModalCat(null);
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <StatusBar style="light" />
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.screenTitle}>Budget</Text>
          <View style={styles.headerActions}>
            <HapticPressable
              onPress={() => router.push('/modal/manage-categories')}
              hapticType="medium"
              style={styles.iconBtn}
            >
              <Icon name="SlidersHorizontal" size={18} color="#ffffff" />
            </HapticPressable>
          </View>
        </View>

        <View style={styles.monthRow}>
          <HapticPressable
            onPress={() => setIsMonthModalVisible(true)}
            hapticType="light"
            style={styles.monthBadge}
          >
            <Icon name="Calendar" size={13} color="#eb0028" style={{ marginRight: 6 }} />
            <Text style={styles.monthText}>{formatMonthYear(selectedMonth)}</Text>
            <Icon name="ChevronDown" size={12} color="rgba(235, 235, 245, 0.5)" style={{ marginLeft: 4 }} />
          </HapticPressable>
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
          {/* 1. Allocation Overview */}
          <BudgetOverviewHeader summary={summary} />

          {/* 2. Over-Allocation Warning */}
          <AllocationWarning overAllocatedAmountPaise={summary.overAllocatedAmountPaise} />

          {/* 3. Month Actions Bar */}
          <View style={styles.actionsBar}>
            <Button
              title="Copy Prev"
              icon="Copy"
              variant="secondary"
              size="sm"
              onPress={handleCopyPrevBudgets}
              style={{ flex: 1 }}
            />
            <Button
              title="Reset"
              icon="RotateCcw"
              variant="secondary"
              size="sm"
              onPress={handleResetBudgets}
              style={{ flex: 1 }}
            />
          </View>

          {/* 4. Category Spending List */}
          <View style={styles.categoriesSection}>
            <Text style={styles.sectionTitle}>CATEGORY BUDGETS</Text>
            <View style={styles.listGroup}>
              {categoryAnalytics.map((item) => (
                <CategoryBudgetCard
                  key={item.categoryId}
                  item={item}
                  onPress={() => {
                    router.push({
                      pathname: '/modal/category-detail',
                      params: {
                        categoryId: item.categoryId,
                        month: selectedMonth,
                      },
                    });
                  }}
                />
              ))}
            </View>
          </View>
        </ScrollView>
      </View>

      {/* Month Selector Modal */}
      <Modal
        visible={isMonthModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setIsMonthModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Budget Month</Text>
            <View style={{ gap: 8 }}>
              {availableMonths.map((m) => {
                const isSelected = m === selectedMonth;
                return (
                  <HapticPressable
                    key={m}
                    onPress={() => {
                      setSelectedMonth(m);
                      setIsMonthModalVisible(false);
                    }}
                    hapticType="selection"
                    style={[
                      styles.monthOption,
                      isSelected && styles.monthOptionActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.monthOptionText,
                        isSelected && styles.monthOptionTextActive,
                      ]}
                    >
                      {formatMonthYear(m)}
                    </Text>
                    {isSelected && <Icon name="Check" size={18} color="#eb0028" />}
                  </HapticPressable>
                );
              })}
            </View>
            <Button
              title="Close"
              variant="secondary"
              onPress={() => setIsMonthModalVisible(false)}
              style={{ marginTop: 16 }}
            />
          </View>
        </View>
      </Modal>

      {/* Universal in-app dialog */}
      <AppDialog
        visible={dialog.visible}
        title={dialog.title}
        message={dialog.message}
        icon={dialog.icon}
        iconColor={dialog.iconColor}
        actions={dialog.actions}
        onRequestClose={() => setDialog((d) => ({ ...d, visible: false }))}
      />
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
    paddingBottom: 136,
    paddingTop: 4,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 8,
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
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1c1c22',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  monthBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1c1c22',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 14,
    gap: 6,
  },
  monthText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#ffffff',
  },
  actionsBar: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    marginBottom: 28,
  },
  categoriesSection: {
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(235, 235, 245, 0.5)',
    letterSpacing: 0.5,
    marginBottom: 14,
    marginLeft: 4,
    textTransform: 'uppercase',
  },
  listGroup: {
    gap: 12,
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
    marginBottom: 16,
    textAlign: 'center',
  },
  monthOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 14,
    backgroundColor: '#1c1c1e',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  monthOptionActive: {
    backgroundColor: 'rgba(235, 0, 40, 0.12)',
    borderColor: '#eb0028',
  },
  monthOptionText: {
    fontSize: 15,
    fontWeight: '600',
    color: 'rgba(235, 235, 245, 0.7)',
  },
  monthOptionTextActive: {
    color: '#ffffff',
    fontWeight: '700',
  },
});

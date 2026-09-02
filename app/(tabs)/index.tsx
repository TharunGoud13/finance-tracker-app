import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { useTransactionStore } from '../../src/store/useTransactionStore';
import { useBudgetStore } from '../../src/store/useBudgetStore';
import { useFinancialSummary } from '../../src/hooks/useFinancialSummary';
import { GreetingHeader } from '../../src/components/dashboard/GreetingHeader';
import { SummaryCards } from '../../src/components/dashboard/SummaryCards';
import { FinancialHealthCard } from '../../src/components/dashboard/FinancialHealthCard';
import { InsightsCarousel } from '../../src/components/dashboard/InsightsCarousel';
import { GoalsPreviewCard } from '../../src/components/dashboard/GoalsPreviewCard';
import { RecentTransactionsList } from '../../src/components/dashboard/RecentTransactionsList';
import { Button } from '../../src/components/ui/Button';
import { Icon } from '../../src/components/ui/Icon';
import { HapticPressable } from '../../src/components/ui/HapticPressable';
import { generateFinancialInsights } from '../../src/utils/insights';
import { calculateFinancialHealthScore } from '../../src/utils/healthScore';
import { formatMonthYear } from '../../src/utils/formatters';

export default function DashboardScreen() {
  const router = useRouter();
  const transactions = useTransactionStore((state) => state.transactions);
  const budgets = useBudgetStore((state) => state.budgets);
  const categories = useBudgetStore((state) => state.categories);
  const selectedMonth = useBudgetStore((state) => state.selectedMonth);
  const setSelectedMonth = useBudgetStore((state) => state.setSelectedMonth);

  const [isMonthModalVisible, setIsMonthModalVisible] = useState(false);

  // Derive reactive summaries and insights
  const currentSummary = useFinancialSummary(selectedMonth);

  const insights = generateFinancialInsights({
    transactions,
    budgets,
    categories,
    selectedMonth,
  });

  const healthScore = calculateFinancialHealthScore(
    transactions,
    budgets,
    categories,
    selectedMonth
  );

  const availableMonths = [
    '2026-09',
    '2026-08',
    '2026-07',
    '2026-06',
    '2026-05',
  ];

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <StatusBar style="light" />
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* 1. Header with Greeting & Privacy Toggle */}
        <GreetingHeader onPressMonthPicker={() => setIsMonthModalVisible(true)} />

        {/* 2. Primary Summary Cards (Remaining Balance Hero, Income, Expense) */}
        <SummaryCards summary={currentSummary} />

        {/* 3. Personal Financial Health Score */}
        <FinancialHealthCard healthScore={healthScore} />

        {/* 4. Smart Insights Engine */}
        <InsightsCarousel insights={insights} />

        {/* 5. Savings Goals Preview */}
        <GoalsPreviewCard />

        {/* 6. Recent Activity List */}
        <RecentTransactionsList
          transactions={transactions}
          categories={categories}
          onSelectTransaction={(tx) => {
            router.push({
              pathname: '/modal/edit-transaction',
              params: { transactionId: tx.id },
            });
          }}
        />
      </ScrollView>

      {/* Month Selector Modal */}
      <Modal
        visible={isMonthModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setIsMonthModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Month</Text>
            <View style={styles.monthsList}>
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
                    {isSelected && (
                      <Icon name="Check" size={18} color="#eb0028" />
                    )}
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
  contentContainer: {
    paddingBottom: 136,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
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
    marginBottom: 14,
    textAlign: 'center',
  },
  monthsList: {
    gap: 8,
  },
  monthOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 14,
    backgroundColor: '#18181f',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  monthOptionActive: {
    borderColor: '#eb0028',
    backgroundColor: 'rgba(235, 0, 40, 0.12)',
  },
  monthOptionText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(235, 235, 245, 0.65)',
  },
  monthOptionTextActive: {
    color: '#ffffff',
    fontWeight: '700',
  },
});

import { useMemo } from 'react';
import { useTransactionStore } from '../store/useTransactionStore';
import { useBudgetStore } from '../store/useBudgetStore';
import { calculateMonthlySummary } from '../utils/calculations';
import { MonthlyFinancialSummary } from '../types';

export function useFinancialSummary(customMonth?: string): MonthlyFinancialSummary {
  const transactions = useTransactionStore((state) => state.transactions);
  const budgets = useBudgetStore((state) => state.budgets);
  const categories = useBudgetStore((state) => state.categories);
  const selectedMonth = useBudgetStore((state) => state.selectedMonth);

  const month = customMonth || selectedMonth;

  return useMemo(() => {
    return calculateMonthlySummary(transactions, budgets, categories, month);
  }, [transactions, budgets, categories, month]);
}

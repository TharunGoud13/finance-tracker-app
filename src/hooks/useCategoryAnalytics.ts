import { useMemo } from 'react';
import { useTransactionStore } from '../store/useTransactionStore';
import { useBudgetStore } from '../store/useBudgetStore';
import { calculateCategoryBreakdown } from '../utils/calculations';
import { CategorySpending } from '../types';

export function useCategoryAnalytics(customMonth?: string): CategorySpending[] {
  const transactions = useTransactionStore((state) => state.transactions);
  const budgets = useBudgetStore((state) => state.budgets);
  const categories = useBudgetStore((state) => state.categories);
  const selectedMonth = useBudgetStore((state) => state.selectedMonth);

  const month = customMonth || selectedMonth;

  return useMemo(() => {
    return calculateCategoryBreakdown(transactions, budgets, categories, month);
  }, [transactions, budgets, categories, month]);
}

import {
  Transaction,
  Budget,
  Category,
  CategorySpending,
  BudgetHealthStatus,
  MonthlyFinancialSummary,
  TransactionType,
} from '../types';

/**
 * Returns true if transaction date falls within "YYYY-MM"
 */
export function isSameMonth(dateString: string, targetMonth: string): boolean {
  if (!dateString || !targetMonth) return false;
  // targetMonth format: "YYYY-MM"
  return dateString.startsWith(targetMonth);
}

/**
 * Get previous month string in "YYYY-MM" format
 */
export function getPreviousMonth(monthStr: string): string {
  const [year, month] = monthStr.split('-').map(Number);
  if (month === 1) {
    return `${year - 1}-12`;
  }
  const prevMonth = (month - 1).toString().padStart(2, '0');
  return `${year}-${prevMonth}`;
}

/**
 * Get next month string in "YYYY-MM" format
 */
export function getNextMonth(monthStr: string): string {
  const [year, month] = monthStr.split('-').map(Number);
  if (month === 12) {
    return `${year + 1}-01`;
  }
  const nextMonth = (month + 1).toString().padStart(2, '0');
  return `${year}-${nextMonth}`;
}

/**
 * Calculate total income in paise for all transactions or a specific month
 */
export function calculateTotalIncome(
  transactions: Transaction[],
  month?: string
): number {
  return transactions
    .filter((tx) => tx.type === 'income' && (!month || isSameMonth(tx.date, month)))
    .reduce((sum, tx) => sum + Math.round(tx.amount), 0);
}

/**
 * Calculate total expense in paise for all transactions or a specific month
 */
export function calculateTotalExpense(
  transactions: Transaction[],
  month?: string
): number {
  return transactions
    .filter((tx) => tx.type === 'expense' && (!month || isSameMonth(tx.date, month)))
    .reduce((sum, tx) => sum + Math.round(tx.amount), 0);
}

/**
 * Calculate remaining balance (Income - Expense) in paise
 */
export function calculateRemainingBalance(
  transactions: Transaction[],
  month?: string
): number {
  const income = calculateTotalIncome(transactions, month);
  const expense = calculateTotalExpense(transactions, month);
  return income - expense;
}

/**
 * Calculate total spending in paise for a specific category
 */
export function calculateCategorySpending(
  transactions: Transaction[],
  categoryId: string,
  month?: string
): number {
  return transactions
    .filter(
      (tx) =>
        tx.type === 'expense' &&
        tx.categoryId === categoryId &&
        (!month || isSameMonth(tx.date, month))
    )
    .reduce((sum, tx) => sum + Math.round(tx.amount), 0);
}

/**
 * Calculate budget usage percentage
 */
export function calculateBudgetUsage(
  spentPaise: number,
  limitPaise: number
): number {
  if (!limitPaise || limitPaise <= 0) return 0;
  return Math.round((spentPaise / limitPaise) * 100);
}

/**
 * Determine semantic budget health status
 * 0% - 60%: Healthy
 * 60% - 80%: Moderate
 * 80% - 100%: Warning
 * Above 100%: Exceeded
 */
export function getBudgetHealthStatus(percentageUsed: number): BudgetHealthStatus {
  if (percentageUsed > 100) return 'exceeded';
  if (percentageUsed >= 80) return 'warning';
  if (percentageUsed >= 60) return 'moderate';
  return 'healthy';
}

/**
 * Calculate savings rate as percentage (0% to 100%)
 */
export function calculateSavingsRate(
  incomePaise: number,
  expensePaise: number
): number {
  if (incomePaise <= 0) return 0;
  const netSavings = incomePaise - expensePaise;
  if (netSavings <= 0) return 0;
  return Math.min(100, Math.round((netSavings / incomePaise) * 100));
}

/**
 * Calculate complete category breakdown for a month
 */
export function calculateCategoryBreakdown(
  transactions: Transaction[],
  budgets: Budget[],
  categories: Category[],
  month: string
): CategorySpending[] {
  const expenseCategories = categories.filter((c) => c.type === 'expense');
  const monthBudgets = budgets.filter((b) => b.month === month);
  const totalExpensePaise = calculateTotalExpense(transactions, month);

  return expenseCategories
    .map((category) => {
      const spentPaise = calculateCategorySpending(transactions, category.id, month);
      const budget = monthBudgets.find((b) => b.categoryId === category.id);
      const budgetLimitPaise = budget ? budget.limit : 0;
      const hasBudget = Boolean(budget && budget.limit > 0);
      const percentageUsed = hasBudget
        ? calculateBudgetUsage(spentPaise, budgetLimitPaise)
        : 0;
      const percentageOfTotalExpense =
        totalExpensePaise > 0
          ? Math.round((spentPaise / totalExpensePaise) * 100)
          : 0;
      const remainingPaise = hasBudget ? budgetLimitPaise - spentPaise : 0;
      const healthStatus = hasBudget
        ? getBudgetHealthStatus(percentageUsed)
        : 'healthy';

      return {
        categoryId: category.id,
        category,
        spentPaise,
        budgetLimitPaise,
        hasBudget,
        percentageUsed,
        percentageOfTotalExpense,
        remainingPaise,
        healthStatus,
      };
    })
    .sort((a, b) => b.spentPaise - a.spentPaise);
}

/**
 * Calculate comprehensive monthly financial summary
 */
export function calculateMonthlySummary(
  transactions: Transaction[],
  budgets: Budget[],
  categories: Category[],
  month: string
): MonthlyFinancialSummary {
  const currentIncomePaise = calculateTotalIncome(transactions, month);
  const currentExpensePaise = calculateTotalExpense(transactions, month);
  const remainingBalancePaise = currentIncomePaise - currentExpensePaise;
  const savingsRate = calculateSavingsRate(currentIncomePaise, currentExpensePaise);

  const monthBudgets = budgets.filter((b) => b.month === month);
  const totalAllocatedBudgetPaise = monthBudgets.reduce(
    (sum, b) => sum + Math.round(b.limit),
    0
  );

  const unallocatedIncomePaise = Math.max(
    0,
    currentIncomePaise - totalAllocatedBudgetPaise
  );
  const isOverAllocated = totalAllocatedBudgetPaise > currentIncomePaise && currentIncomePaise > 0;
  const overAllocatedAmountPaise = isOverAllocated
    ? totalAllocatedBudgetPaise - currentIncomePaise
    : 0;

  const prevMonth = getPreviousMonth(month);
  const prevMonthIncomePaise = calculateTotalIncome(transactions, prevMonth);
  const prevMonthExpensePaise = calculateTotalExpense(transactions, prevMonth);

  const incomeChangePercentage =
    prevMonthIncomePaise > 0
      ? Math.round(
          ((currentIncomePaise - prevMonthIncomePaise) / prevMonthIncomePaise) * 100
        )
      : 0;

  const expenseChangePercentage =
    prevMonthExpensePaise > 0
      ? Math.round(
          ((currentExpensePaise - prevMonthExpensePaise) / prevMonthExpensePaise) * 100
        )
      : 0;

  const breakdown = calculateCategoryBreakdown(
    transactions,
    budgets,
    categories,
    month
  );
  const highestCategoryItem = breakdown.find((item) => item.spentPaise > 0);
  const highestSpendingCategory = highestCategoryItem
    ? {
        category: highestCategoryItem.category,
        amountPaise: highestCategoryItem.spentPaise,
      }
    : undefined;

  const monthTransactions = transactions.filter(
    (tx) => tx.type === 'expense' && isSameMonth(tx.date, month)
  );
  const largestTransaction =
    monthTransactions.length > 0
      ? [...monthTransactions].sort((a, b) => b.amount - a.amount)[0]
      : undefined;

  return {
    month,
    totalIncomePaise: currentIncomePaise,
    totalExpensePaise: currentExpensePaise,
    remainingBalancePaise,
    savingsRate,
    totalAllocatedBudgetPaise,
    unallocatedIncomePaise,
    isOverAllocated,
    overAllocatedAmountPaise,
    highestSpendingCategory,
    largestTransaction,
    prevMonthIncomePaise,
    prevMonthExpensePaise,
    incomeChangePercentage,
    expenseChangePercentage,
  };
}

export interface FilterOptions {
  type?: TransactionType | 'all';
  categoryId?: string | 'all';
  searchQuery?: string;
  sortBy?: 'date-desc' | 'date-asc' | 'amount-desc' | 'amount-asc';
}

/**
 * Filter and sort transactions list
 */
export function filterTransactions(
  transactions: Transaction[],
  options: FilterOptions
): Transaction[] {
  let list = [...transactions];

  if (options.type && options.type !== 'all') {
    list = list.filter((tx) => tx.type === options.type);
  }

  if (options.categoryId && options.categoryId !== 'all') {
    list = list.filter((tx) => tx.categoryId === options.categoryId);
  }

  if (options.searchQuery && options.searchQuery.trim().length > 0) {
    const q = options.searchQuery.trim().toLowerCase();
    list = list.filter(
      (tx) =>
        (tx.description && tx.description.toLowerCase().includes(q)) ||
        (tx.notes && tx.notes.toLowerCase().includes(q))
    );
  }

  const sortBy = options.sortBy || 'date-desc';
  list.sort((a, b) => {
    if (sortBy === 'date-desc') {
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    }
    if (sortBy === 'date-asc') {
      return new Date(a.date).getTime() - new Date(b.date).getTime();
    }
    if (sortBy === 'amount-desc') {
      return b.amount - a.amount;
    }
    if (sortBy === 'amount-asc') {
      return a.amount - b.amount;
    }
    return 0;
  });

  return list;
}

export interface DateGroupedTransactions {
  dateLabel: string;
  transactions: Transaction[];
}

/**
 * Groups transactions by date with friendly headings (Today, Yesterday, etc.)
 */
export function groupTransactionsByDate(
  transactions: Transaction[]
): DateGroupedTransactions[] {
  const groupsMap = new Map<string, Transaction[]>();

  const todayStr = new Date().toISOString().split('T')[0];
  const yesterdayStr = new Date(Date.now() - 86400000).toISOString().split('T')[0];

  transactions.forEach((tx) => {
    let label = tx.date;
    if (tx.date === todayStr) {
      label = 'Today';
    } else if (tx.date === yesterdayStr) {
      label = 'Yesterday';
    } else {
      const d = new Date(tx.date);
      label = d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    }

    if (!groupsMap.has(label)) {
      groupsMap.set(label, []);
    }
    groupsMap.get(label)!.push(tx);
  });

  const result: DateGroupedTransactions[] = [];
  groupsMap.forEach((txList, dateLabel) => {
    result.push({
      dateLabel,
      transactions: txList,
    });
  });

  return result;
}

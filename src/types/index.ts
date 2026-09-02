export type TransactionType = 'income' | 'expense';

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number; // Stored in smallest currency unit (paise for INR, cents for USD)
  categoryId: string;
  description?: string;
  date: string; // ISO string or YYYY-MM-DD
  notes?: string;
  isRecurring?: boolean;
  recurringId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: string;
  name: string;
  icon: string; // Lucide icon identifier
  color: string; // Hex color code
  type: TransactionType;
  isDefault: boolean;
  createdAt: string;
}

export interface Budget {
  id: string;
  categoryId: string;
  limit: number; // Stored in smallest currency unit (paise)
  month: string; // Format: "YYYY-MM"
}

export interface SavingsGoal {
  id: string;
  title: string;
  targetAmount: number; // in paise
  currentAmount: number; // in paise
  targetDate?: string;
  color: string;
  icon: string;
  createdAt: string;
}

export type RecurringFrequency = 'daily' | 'weekly' | 'monthly' | 'yearly';

export interface RecurringTransaction {
  id: string;
  title: string;
  amount: number; // in paise
  categoryId: string;
  type: TransactionType;
  frequency: RecurringFrequency;
  startDate: string;
  nextDueDate: string;
  active: boolean;
}

export type InsightType = 'success' | 'warning' | 'danger' | 'info';

export interface Insight {
  id: string;
  type: InsightType;
  title: string;
  message: string;
  categoryId?: string;
  priority: number; // Higher number = more urgent
  actionLabel?: string;
  actionRoute?: string;
}

export type CurrencyCode = 'INR' | 'USD' | 'EUR' | 'GBP' | 'JPY';

export interface CurrencyConfig {
  code: CurrencyCode;
  symbol: string;
  label: string;
  smallestUnitMultiplier: number; // e.g. 100 for paise/cents, 1 for JPY
  decimals: number;
}

export interface AppSettings {
  currency: CurrencyCode;
  userName: string;
  privacyModeEnabled: boolean;
  biometricAuthEnabled: boolean;
  autoLockOnBackground: boolean;
  theme: 'dark' | 'light' | 'system';
  notificationsEnabled: boolean;
  notificationThresholds: number[]; // e.g. [50, 75, 90, 100]
  dailyReminderTime: string; // e.g. "21:00"
}

export type BudgetHealthStatus = 'healthy' | 'moderate' | 'warning' | 'exceeded';

export interface CategorySpending {
  categoryId: string;
  category: Category;
  spentPaise: number;
  budgetLimitPaise: number;
  hasBudget: boolean;
  percentageUsed: number;
  percentageOfTotalExpense: number;
  remainingPaise: number;
  healthStatus: BudgetHealthStatus;
}

export type CategoryBreakdownItem = CategorySpending;

export interface MonthlyFinancialSummary {
  month: string; // "YYYY-MM"
  totalIncomePaise: number;
  totalExpensePaise: number;
  remainingBalancePaise: number;
  savingsRate: number; // 0 - 100%
  totalAllocatedBudgetPaise: number;
  unallocatedIncomePaise: number;
  isOverAllocated: boolean;
  overAllocatedAmountPaise: number;
  highestSpendingCategory?: {
    category: Category;
    amountPaise: number;
  };
  largestTransaction?: Transaction;
  prevMonthIncomePaise: number;
  prevMonthExpensePaise: number;
  incomeChangePercentage: number;
  expenseChangePercentage: number;
}

export interface HealthScoreResult {
  score: number; // 0 - 100
  rating: 'Excellent' | 'Good' | 'Needs Attention' | 'Critical';
  color: string;
  breakdown: {
    savingsRateScore: number; // max 35
    budgetAdherenceScore: number; // max 35
    expenseRatioScore: number; // max 30
  };
  description: string;
}

import {
  Transaction,
  Budget,
  Category,
  Insight,
} from '../types';
import {
  calculateCategoryBreakdown,
  calculateMonthlySummary,
} from './calculations';
import { formatCurrency } from './formatters';

interface GenerateInsightsParams {
  transactions: Transaction[];
  budgets: Budget[];
  categories: Category[];
  selectedMonth: string;
  currency?: string;
}

/**
 * Deterministic Rule-Based Financial Insight Engine
 * Analyzes transactions, budgets, categories, and MOM trends.
 */
export function generateFinancialInsights({
  transactions,
  budgets,
  categories,
  selectedMonth,
}: GenerateInsightsParams): Insight[] {
  const insights: Insight[] = [];
  const summary = calculateMonthlySummary(transactions, budgets, categories, selectedMonth);
  const categoryBreakdowns = calculateCategoryBreakdown(
    transactions,
    budgets,
    categories,
    selectedMonth
  );

  // 1. Check for Exceeded Budgets (Danger - Priority 100)
  const exceededCategories = categoryBreakdowns.filter(
    (c) => c.hasBudget && c.percentageUsed > 100
  );
  exceededCategories.forEach((cat) => {
    const overAmount = cat.spentPaise - cat.budgetLimitPaise;
    insights.push({
      id: `insight-exceeded-${cat.categoryId}`,
      type: 'danger',
      title: `${cat.category.name} Budget Exceeded`,
      message: `You exceeded your ${cat.category.name} budget by ${formatCurrency(overAmount)}. Spent ${formatCurrency(cat.spentPaise)} of ${formatCurrency(cat.budgetLimitPaise)}.`,
      categoryId: cat.categoryId,
      priority: 100,
      actionLabel: 'Adjust Budget',
      actionRoute: '/(tabs)/budget',
    });
  });

  // 2. Check for Warning Budgets (80% - 100%) (Warning - Priority 80)
  const warningCategories = categoryBreakdowns.filter(
    (c) => c.hasBudget && c.percentageUsed >= 80 && c.percentageUsed <= 100
  );
  warningCategories.forEach((cat) => {
    insights.push({
      id: `insight-warning-${cat.categoryId}`,
      type: 'warning',
      title: `${cat.category.name} budget almost reached`,
      message: `You have used ${cat.percentageUsed}% of your monthly ${cat.category.name} budget. ${formatCurrency(cat.remainingPaise)} remaining.`,
      categoryId: cat.categoryId,
      priority: 80,
    });
  });

  // 3. Over-allocated Budget Warning (Priority 90)
  if (summary.isOverAllocated) {
    insights.push({
      id: 'insight-overallocation',
      type: 'warning',
      title: 'Budget Exceeds Monthly Income',
      message: `Your total allocated budget exceeds your monthly income by ${formatCurrency(summary.overAllocatedAmountPaise)}.`,
      priority: 90,
      actionLabel: 'Review Budgets',
      actionRoute: '/(tabs)/budget',
    });
  }

  // 4. Month-over-Month Spending Comparison (Priority 70)
  if (summary.prevMonthExpensePaise > 0 && summary.totalExpensePaise > 0) {
    if (summary.expenseChangePercentage < -10) {
      insights.push({
        id: 'insight-mom-reduced',
        type: 'success',
        title: 'Spending Decreased',
        message: `You spent ${Math.abs(summary.expenseChangePercentage)}% less than last month. Excellent spending discipline!`,
        priority: 70,
      });
    } else if (summary.expenseChangePercentage > 15) {
      insights.push({
        id: 'insight-mom-increased',
        type: 'warning',
        title: 'Higher Spending this Month',
        message: `You spent ${summary.expenseChangePercentage}% more than last month. Keep an eye on non-essential purchases.`,
        priority: 70,
      });
    }
  }

  // 5. Highest Spending Category Insight (Priority 60)
  if (summary.highestSpendingCategory && summary.totalExpensePaise > 0) {
    const highest = summary.highestSpendingCategory;
    const pct = Math.round((highest.amountPaise / summary.totalExpensePaise) * 100);
    if (pct >= 25) {
      insights.push({
        id: 'insight-highest-spend',
        type: 'info',
        title: 'Top Expense Category',
        message: `${highest.category.name} accounts for ${pct}% of your total spending this month (${formatCurrency(highest.amountPaise)}).`,
        categoryId: highest.category.id,
        priority: 60,
      });
    }
  }

  // 6. Savings Rate Milestone (Priority 75)
  if (summary.totalIncomePaise > 0) {
    if (summary.savingsRate >= 40) {
      insights.push({
        id: 'insight-great-savings',
        type: 'success',
        title: 'High Savings Rate',
        message: `You are saving ${summary.savingsRate}% of your income this month (${formatCurrency(summary.remainingBalancePaise)}). You are on track for your financial goals!`,
        priority: 75,
      });
    } else if (summary.savingsRate > 0 && summary.savingsRate < 15) {
      insights.push({
        id: 'insight-low-savings',
        type: 'info',
        title: 'Savings Opportunity',
        message: `Current savings rate is ${summary.savingsRate}%. Try to target at least 20% to build an emergency safety net.`,
        priority: 50,
      });
    }
  }

  // 7. Spending without Budget Configured (Priority 40)
  const unbudgetedHighSpending = categoryBreakdowns.filter(
    (c) => !c.hasBudget && c.spentPaise >= 100000 // >= ₹1,000 without budget
  );
  if (unbudgetedHighSpending.length > 0) {
    const topUnbudgeted = unbudgetedHighSpending[0];
    insights.push({
      id: `insight-no-budget-${topUnbudgeted.categoryId}`,
      type: 'info',
      title: 'Unbudgeted Category',
      message: `You spent ${formatCurrency(topUnbudgeted.spentPaise)} in ${topUnbudgeted.category.name}, but no monthly budget is set.`,
      categoryId: topUnbudgeted.categoryId,
      priority: 40,
      actionLabel: 'Set Budget',
      actionRoute: '/(tabs)/budget',
    });
  }

  // 8. General Healthy Status if no issues (Priority 10)
  if (insights.length === 0 && summary.totalIncomePaise > 0) {
    insights.push({
      id: 'insight-all-healthy',
      type: 'success',
      title: 'On Track with Budget',
      message: `You are currently within your planned monthly budget with ${formatCurrency(summary.remainingBalancePaise)} remaining.`,
      priority: 10,
    });
  }

  // Sort insights by priority (highest first)
  return insights.sort((a, b) => b.priority - a.priority);
}

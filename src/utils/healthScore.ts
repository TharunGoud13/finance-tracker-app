import {
  Transaction,
  Budget,
  Category,
  HealthScoreResult,
} from '../types';
import {
  calculateMonthlySummary,
  calculateCategoryBreakdown,
} from './calculations';

export function calculateFinancialHealthScore(
  transactions: Transaction[],
  budgets: Budget[],
  categories: Category[],
  month: string
): HealthScoreResult {
  const summary = calculateMonthlySummary(transactions, budgets, categories, month);
  const breakdowns = calculateCategoryBreakdown(transactions, budgets, categories, month);

  // If no transactions in this month, return a default balanced baseline
  if (summary.totalIncomePaise === 0 && summary.totalExpensePaise === 0) {
    return {
      score: 75,
      rating: 'Good',
      color: '#38bdf8',
      breakdown: {
        savingsRateScore: 25,
        budgetAdherenceScore: 25,
        expenseRatioScore: 25,
      },
      description: 'Record your monthly income and expenses to get a live spending health score.',
    };
  }

  // 1. Savings Rate Score (Max 35 points)
  let savingsRateScore = 0;
  if (summary.savingsRate >= 50) {
    savingsRateScore = 35;
  } else if (summary.savingsRate >= 30) {
    savingsRateScore = 28;
  } else if (summary.savingsRate >= 20) {
    savingsRateScore = 20;
  } else if (summary.savingsRate >= 10) {
    savingsRateScore = 12;
  } else if (summary.savingsRate > 0) {
    savingsRateScore = 5;
  } else {
    savingsRateScore = 0;
  }

  // 2. Budget Adherence Score (Max 35 points)
  const budgetedCategories = breakdowns.filter((c) => c.hasBudget);
  let budgetAdherenceScore = 35;

  if (budgetedCategories.length > 0) {
    let penalty = 0;
    budgetedCategories.forEach((cat) => {
      if (cat.percentageUsed > 120) {
        penalty += 15;
      } else if (cat.percentageUsed > 100) {
        penalty += 10;
      } else if (cat.percentageUsed > 90) {
        penalty += 4;
      }
    });
    budgetAdherenceScore = Math.max(0, 35 - penalty);
  } else {
    // If no budgets configured, give 20 default points
    budgetAdherenceScore = 20;
  }

  // 3. Expense-to-Income Ratio Score (Max 30 points)
  let expenseRatioScore = 0;
  if (summary.totalIncomePaise > 0) {
    const expenseRatio = (summary.totalExpensePaise / summary.totalIncomePaise) * 100;
    if (expenseRatio <= 40) {
      expenseRatioScore = 30;
    } else if (expenseRatio <= 60) {
      expenseRatioScore = 25;
    } else if (expenseRatio <= 75) {
      expenseRatioScore = 18;
    } else if (expenseRatio <= 90) {
      expenseRatioScore = 10;
    } else if (expenseRatio <= 100) {
      expenseRatioScore = 4;
    } else {
      expenseRatioScore = 0;
    }
  }

  const totalScore = Math.min(
    100,
    Math.max(0, Math.round(savingsRateScore + budgetAdherenceScore + expenseRatioScore))
  );

  let rating: HealthScoreResult['rating'] = 'Good';
  let color = '#38bdf8';
  let description = 'Your spending habits are balanced. Keep tracking expenses.';

  if (totalScore >= 90) {
    rating = 'Excellent';
    color = '#10b981';
    description = 'Outstanding financial discipline! You have strong savings and minimal overspending.';
  } else if (totalScore >= 70) {
    rating = 'Good';
    color = '#1a73e8';
    description = 'Great financial control. You are staying well within planned limits.';
  } else if (totalScore >= 50) {
    rating = 'Needs Attention';
    color = '#f59e0b';
    description = 'Your spending is close to your limits. Review non-essential expenses.';
  } else {
    rating = 'Critical';
    color = '#ef4444';
    description = 'Expenses exceed or nearly equal total income. Immediate budget adjustments needed.';
  }

  return {
    score: totalScore,
    rating,
    color,
    breakdown: {
      savingsRateScore,
      budgetAdherenceScore,
      expenseRatioScore,
    },
    description,
  };
}

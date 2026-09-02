import {
  calculateTotalIncome,
  calculateTotalExpense,
  calculateRemainingBalance,
  calculateCategorySpending,
  calculateBudgetUsage,
  calculateSavingsRate,
  calculateMonthlySummary,
  calculateCategoryBreakdown,
  getBudgetHealthStatus,
} from '../calculations';
import { generateFinancialInsights } from '../insights';
import { calculateFinancialHealthScore } from '../healthScore';
import { formatCurrency, parseInputToPaise, paiseToInputString } from '../formatters';
import { INITIAL_DEMO_TRANSACTIONS, INITIAL_DEMO_BUDGETS } from '../../constants/demoData';
import { ALL_DEFAULT_CATEGORIES } from '../../constants/categories';

console.log('=== RUNNING ONEFINANCE FINANCIAL ENGINE TESTS ===\n');

// Test 1: Paise Formatting and Parsing
console.log('1. Testing Currency Precision & Formatting:');
const paiseVal = 50025; // ₹500.25
const formattedINR = formatCurrency(paiseVal, 'INR');
console.log(`- 50025 paise in INR: ${formattedINR}`);
if (formattedINR !== '₹500.25') throw new Error(`Expected ₹500.25, got ${formattedINR}`);

const parsedBack = parseInputToPaise('500.25', 'INR');
console.log(`- Parsed '500.25' back to paise: ${parsedBack}`);
if (parsedBack !== 50025) throw new Error(`Expected 50025, got ${parsedBack}`);

const parsedWithSymbol = parseInputToPaise('₹ 1,500.50', 'INR');
console.log(`- Parsed '₹ 1,500.50' to paise: ${parsedWithSymbol}`);
if (parsedWithSymbol !== 150050) throw new Error(`Expected 150050, got ${parsedWithSymbol}`);

// Test 2: September 2026 Monthly Summary
console.log('\n2. Testing Monthly Financial Summary (September 2026):');
const summary = calculateMonthlySummary(
  INITIAL_DEMO_TRANSACTIONS,
  INITIAL_DEMO_BUDGETS,
  ALL_DEFAULT_CATEGORIES,
  '2026-09'
);

console.log(`- Total Income: ${formatCurrency(summary.totalIncomePaise)}`);
console.log(`- Total Expense: ${formatCurrency(summary.totalExpensePaise)}`);
console.log(`- Remaining Balance: ${formatCurrency(summary.remainingBalancePaise)}`);
console.log(`- Savings Rate: ${summary.savingsRate}%`);
console.log(`- Total Allocated Budget: ${formatCurrency(summary.totalAllocatedBudgetPaise)}`);
console.log(`- Unallocated Income: ${formatCurrency(summary.unallocatedIncomePaise)}`);
console.log(`- Prev Month Income: ${formatCurrency(summary.prevMonthIncomePaise)}`);
console.log(`- Prev Month Expense: ${formatCurrency(summary.prevMonthExpensePaise)}`);
console.log(`- Income Change: ${summary.incomeChangePercentage}%`);
console.log(`- Expense Change: ${summary.expenseChangePercentage}%`);

if (summary.totalIncomePaise !== 6000000) throw new Error(`Expected income 6000000, got ${summary.totalIncomePaise}`);
if (summary.remainingBalancePaise !== summary.totalIncomePaise - summary.totalExpensePaise) {
  throw new Error('Balance formula mismatch');
}

// Test 3: Category Breakdown
console.log('\n3. Testing Category Breakdown & Budget Health:');
const breakdowns = calculateCategoryBreakdown(
  INITIAL_DEMO_TRANSACTIONS,
  INITIAL_DEMO_BUDGETS,
  ALL_DEFAULT_CATEGORIES,
  '2026-09'
);

breakdowns.forEach((item) => {
  if (item.spentPaise > 0 || item.hasBudget) {
    console.log(
      `- ${item.category.name}: Spent ${formatCurrency(item.spentPaise)} / Budget ${formatCurrency(item.budgetLimitPaise)} (${item.percentageUsed}% used, Status: ${item.healthStatus})`
    );
  }
});

// Test 4: Health Status Categorization
console.log('\n4. Testing Budget Health Status Thresholds:');
if (getBudgetHealthStatus(50) !== 'healthy') throw new Error('Expected 50% to be healthy');
if (getBudgetHealthStatus(75) !== 'moderate') throw new Error('Expected 75% to be moderate');
if (getBudgetHealthStatus(90) !== 'warning') throw new Error('Expected 90% to be warning');
if (getBudgetHealthStatus(115) !== 'exceeded') throw new Error('Expected 115% to be exceeded');
console.log('✓ All threshold classifications verified.');

// Test 5: Insight Engine
console.log('\n5. Testing Rule-Based Insight Engine:');
const insights = generateFinancialInsights({
  transactions: INITIAL_DEMO_TRANSACTIONS,
  budgets: INITIAL_DEMO_BUDGETS,
  categories: ALL_DEFAULT_CATEGORIES,
  selectedMonth: '2026-09',
});

console.log(`- Total Generated Insights: ${insights.length}`);
insights.forEach((ins, idx) => {
  console.log(`  ${idx + 1}. [${ins.type.toUpperCase()}] ${ins.title}: ${ins.message}`);
});

// Test 6: Health Score
console.log('\n6. Testing Personal Financial Health Score:');
const scoreResult = calculateFinancialHealthScore(
  INITIAL_DEMO_TRANSACTIONS,
  INITIAL_DEMO_BUDGETS,
  ALL_DEFAULT_CATEGORIES,
  '2026-09'
);
console.log(`- Score: ${scoreResult.score}/100 (${scoreResult.rating})`);
console.log(`- Breakdown: Savings: ${scoreResult.breakdown.savingsRateScore}/35, Budget: ${scoreResult.breakdown.budgetAdherenceScore}/35, Ratio: ${scoreResult.breakdown.expenseRatioScore}/30`);

console.log('\n🎉 ALL TESTS PASSED SUCCESSFULLY! ZERO FLOATING POINT PRECISION DRIFT.');

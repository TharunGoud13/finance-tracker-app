import { Transaction, Budget, SavingsGoal, RecurringTransaction } from '../types';

export const INITIAL_DEMO_TRANSACTIONS: Transaction[] = [
  // September 2026 (Current Month)
  {
    id: 'tx-sep-01',
    type: 'income',
    amount: 6000000, // ₹60,000 in paise
    categoryId: 'inc-salary',
    description: 'Monthly Salary - Acme Corp',
    date: '2026-09-01T09:00:00.000Z',
    notes: 'Credited directly to HDFC salary account',
    isRecurring: true,
    createdAt: '2026-09-01T09:00:00.000Z',
    updatedAt: '2026-09-01T09:00:00.000Z',
  },
  {
    id: 'tx-sep-02',
    type: 'expense',
    amount: 900000, // ₹9,000 in paise
    categoryId: 'exp-rent',
    description: 'Apartment Monthly Rent',
    date: '2026-09-01T11:30:00.000Z',
    notes: 'Paid to landlord via UPI',
    isRecurring: true,
    createdAt: '2026-09-01T11:30:00.000Z',
    updatedAt: '2026-09-01T11:30:00.000Z',
  },
  {
    id: 'tx-sep-03',
    type: 'expense',
    amount: 160000, // ₹1,600 in paise
    categoryId: 'exp-gym',
    description: 'Cult.fit Monthly Membership',
    date: '2026-09-01T14:15:00.000Z',
    notes: 'Auto-debit from card',
    isRecurring: true,
    createdAt: '2026-09-01T14:15:00.000Z',
    updatedAt: '2026-09-01T14:15:00.000Z',
  },
  {
    id: 'tx-sep-04',
    type: 'expense',
    amount: 350000, // ₹3,500 in paise
    categoryId: 'exp-food',
    description: 'Nature Basket Organic Groceries',
    date: '2026-09-01T16:45:00.000Z',
    notes: 'Monthly staples and vegetables',
    createdAt: '2026-09-01T16:45:00.000Z',
    updatedAt: '2026-09-01T16:45:00.000Z',
  },
  {
    id: 'tx-sep-05',
    type: 'expense',
    amount: 65000, // ₹650 in paise
    categoryId: 'exp-transport',
    description: 'Petrol Refuel - HPCL Station',
    date: '2026-09-01T18:20:00.000Z',
    notes: 'Speed petrol for bike',
    createdAt: '2026-09-01T18:20:00.000Z',
    updatedAt: '2026-09-01T18:20:00.000Z',
  },
  {
    id: 'tx-sep-06',
    type: 'expense',
    amount: 200000, // ₹2,000 in paise
    categoryId: 'exp-shopping',
    description: 'Zara Casual Linen Shirts',
    date: '2026-09-01T19:50:00.000Z',
    notes: 'Weekend sale discount applied',
    createdAt: '2026-09-01T19:50:00.000Z',
    updatedAt: '2026-09-01T19:50:00.000Z',
  },
  {
    id: 'tx-sep-07',
    type: 'expense',
    amount: 120000, // ₹1,200 in paise
    categoryId: 'exp-bills',
    description: 'High-Speed Fiber Wifi Bill',
    date: '2026-09-01T20:10:00.000Z',
    notes: 'Airtel Broadband 300Mbps plan',
    isRecurring: true,
    createdAt: '2026-09-01T20:10:00.000Z',
    updatedAt: '2026-09-01T20:10:00.000Z',
  },
  {
    id: 'tx-sep-08',
    type: 'expense',
    amount: 500000, // ₹5,000 in paise
    categoryId: 'exp-investment',
    description: 'Nifty 50 Index Mutual Fund SIP',
    date: '2026-09-01T08:00:00.000Z',
    notes: 'Zerodha Coin auto-debit',
    isRecurring: true,
    createdAt: '2026-09-01T08:00:00.000Z',
    updatedAt: '2026-09-01T08:00:00.000Z',
  },
  {
    id: 'tx-sep-09',
    type: 'expense',
    amount: 45000, // ₹450 in paise
    categoryId: 'exp-food',
    description: "McDonald's Gourmet Meal",
    date: '2026-09-01T13:00:00.000Z',
    notes: 'Lunch with colleagues',
    createdAt: '2026-09-01T13:00:00.000Z',
    updatedAt: '2026-09-01T13:00:00.000Z',
  },

  // August 2026 (Previous Month for MOM Trends & Comparisons)
  {
    id: 'tx-aug-01',
    type: 'income',
    amount: 5500000, // ₹55,000
    categoryId: 'inc-salary',
    description: 'Monthly Salary - Acme Corp',
    date: '2026-08-01T09:00:00.000Z',
    createdAt: '2026-08-01T09:00:00.000Z',
    updatedAt: '2026-08-01T09:00:00.000Z',
  },
  {
    id: 'tx-aug-02',
    type: 'income',
    amount: 800000, // ₹8,000
    categoryId: 'inc-freelance',
    description: 'Mobile App UI Consulting',
    date: '2026-08-15T15:00:00.000Z',
    createdAt: '2026-08-15T15:00:00.000Z',
    updatedAt: '2026-08-15T15:00:00.000Z',
  },
  {
    id: 'tx-aug-03',
    type: 'expense',
    amount: 900000, // ₹9,000
    categoryId: 'exp-rent',
    description: 'Apartment Monthly Rent',
    date: '2026-08-02T10:00:00.000Z',
    createdAt: '2026-08-02T10:00:00.000Z',
    updatedAt: '2026-08-02T10:00:00.000Z',
  },
  {
    id: 'tx-aug-04',
    type: 'expense',
    amount: 480000, // ₹4,800
    categoryId: 'exp-food',
    description: 'Groceries & Dining Out',
    date: '2026-08-10T19:00:00.000Z',
    createdAt: '2026-08-10T19:00:00.000Z',
    updatedAt: '2026-08-10T19:00:00.000Z',
  },
  {
    id: 'tx-aug-05',
    type: 'expense',
    amount: 320000, // ₹3,200
    categoryId: 'exp-shopping',
    description: 'Electronics & Accessories',
    date: '2026-08-18T17:30:00.000Z',
    createdAt: '2026-08-18T17:30:00.000Z',
    updatedAt: '2026-08-18T17:30:00.000Z',
  },
  {
    id: 'tx-aug-06',
    type: 'expense',
    amount: 145000, // ₹1,450
    categoryId: 'exp-transport',
    description: 'Uber & Fuel Expenses',
    date: '2026-08-25T11:00:00.000Z',
    createdAt: '2026-08-25T11:00:00.000Z',
    updatedAt: '2026-08-25T11:00:00.000Z',
  },
];

export const INITIAL_DEMO_BUDGETS: Budget[] = [
  // September 2026 Budgets
  { id: 'bgt-sep-housing', categoryId: 'exp-rent', limit: 1000000, month: '2026-09' }, // ₹10,000
  { id: 'bgt-sep-food', categoryId: 'exp-food', limit: 600000, month: '2026-09' }, // ₹6,000
  { id: 'bgt-sep-transport', categoryId: 'exp-transport', limit: 300000, month: '2026-09' }, // ₹3,000
  { id: 'bgt-sep-shopping', categoryId: 'exp-shopping', limit: 500000, month: '2026-09' }, // ₹5,000
  { id: 'bgt-sep-gym', categoryId: 'exp-gym', limit: 200000, month: '2026-09' }, // ₹2,000
  { id: 'bgt-sep-bills', categoryId: 'exp-bills', limit: 250000, month: '2026-09' }, // ₹2,500
  { id: 'bgt-sep-entertainment', categoryId: 'exp-entertainment', limit: 200000, month: '2026-09' }, // ₹2,000
  { id: 'bgt-sep-investment', categoryId: 'exp-investment', limit: 1000000, month: '2026-09' }, // ₹10,000

  // August 2026 Budgets (for copy testing)
  { id: 'bgt-aug-housing', categoryId: 'exp-rent', limit: 1000000, month: '2026-08' },
  { id: 'bgt-aug-food', categoryId: 'exp-food', limit: 550000, month: '2026-08' },
  { id: 'bgt-aug-transport', categoryId: 'exp-transport', limit: 300000, month: '2026-08' },
  { id: 'bgt-aug-shopping', categoryId: 'exp-shopping', limit: 400000, month: '2026-08' },
];

export const INITIAL_DEMO_SAVINGS_GOALS: SavingsGoal[] = [
  {
    id: 'goal-emergency-fund',
    title: 'Emergency Fund',
    targetAmount: 30000000, // ₹300,000 (3 Lakhs)
    currentAmount: 21300000, // ₹213,000 (71% completed)
    targetDate: '2026-12-31',
    color: '#10b981',
    icon: 'Shield',
    createdAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'goal-macbook',
    title: 'MacBook Pro M3 Max',
    targetAmount: 18000000, // ₹180,000
    currentAmount: 9500000, // ₹95,000 (52.7%)
    targetDate: '2026-11-30',
    color: '#3b82f6',
    icon: 'Laptop',
    createdAt: '2026-04-01T00:00:00.000Z',
  },
  {
    id: 'goal-japan-trip',
    title: 'Tokyo Japan Vacation',
    targetAmount: 25000000, // ₹250,000
    currentAmount: 6500000, // ₹65,000 (26%)
    targetDate: '2027-04-15',
    color: '#ec4899',
    icon: 'Plane',
    createdAt: '2026-06-01T00:00:00.000Z',
  },
];

export const INITIAL_DEMO_RECURRING: RecurringTransaction[] = [
  {
    id: 'rec-salary',
    title: 'Acme Corp Monthly Salary',
    amount: 6000000, // ₹60,000
    categoryId: 'inc-salary',
    type: 'income',
    frequency: 'monthly',
    startDate: '2026-01-01',
    nextDueDate: '2026-10-01',
    active: true,
  },
  {
    id: 'rec-rent',
    title: 'Apartment Monthly Rent',
    amount: 900000, // ₹9,000
    categoryId: 'exp-rent',
    type: 'expense',
    frequency: 'monthly',
    startDate: '2026-01-01',
    nextDueDate: '2026-10-01',
    active: true,
  },
  {
    id: 'rec-gym',
    title: 'Cult.fit Gym Membership',
    amount: 160000, // ₹1,600
    categoryId: 'exp-gym',
    type: 'expense',
    frequency: 'monthly',
    startDate: '2026-01-01',
    nextDueDate: '2026-10-01',
    active: true,
  },
  {
    id: 'rec-sip',
    title: 'Nifty 50 Index SIP',
    amount: 500000, // ₹5,000
    categoryId: 'exp-investment',
    type: 'expense',
    frequency: 'monthly',
    startDate: '2026-01-01',
    nextDueDate: '2026-10-01',
    active: true,
  },
];

import { Category } from '../types';

export const DEFAULT_EXPENSE_CATEGORIES: Category[] = [
  {
    id: 'exp-food',
    name: 'Food & Dining',
    icon: 'Utensils',
    color: '#f97316', // Vibrant Orange
    type: 'expense',
    isDefault: true,
    createdAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'exp-rent',
    name: 'Rent & Housing',
    icon: 'Home',
    color: '#6366f1', // Indigo
    type: 'expense',
    isDefault: true,
    createdAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'exp-transport',
    name: 'Transport & Fuel',
    icon: 'Car',
    color: '#0ea5e9', // Sky Blue
    type: 'expense',
    isDefault: true,
    createdAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'exp-shopping',
    name: 'Shopping',
    icon: 'ShoppingBag',
    color: '#ec4899', // Pink
    type: 'expense',
    isDefault: true,
    createdAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'exp-entertainment',
    name: 'Entertainment',
    icon: 'Film',
    color: '#8b5cf6', // Violet
    type: 'expense',
    isDefault: true,
    createdAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'exp-health',
    name: 'Health & Medical',
    icon: 'Activity',
    color: '#10b981', // Emerald
    type: 'expense',
    isDefault: true,
    createdAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'exp-gym',
    name: 'Gym & Fitness',
    icon: 'Dumbbell',
    color: '#14b8a6', // Teal
    type: 'expense',
    isDefault: true,
    createdAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'exp-bills',
    name: 'Bills & Utilities',
    icon: 'Zap',
    color: '#eab308', // Amber Yellow
    type: 'expense',
    isDefault: true,
    createdAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'exp-education',
    name: 'Education',
    icon: 'GraduationCap',
    color: '#3b82f6', // Blue
    type: 'expense',
    isDefault: true,
    createdAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'exp-travel',
    name: 'Travel & Trips',
    icon: 'Plane',
    color: '#06b6d4', // Cyan
    type: 'expense',
    isDefault: true,
    createdAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'exp-investment',
    name: 'Investment & SIP',
    icon: 'TrendingUp',
    color: '#22c55e', // Green
    type: 'expense',
    isDefault: true,
    createdAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'exp-other',
    name: 'Other Expenses',
    icon: 'MoreHorizontal',
    color: '#64748b', // Slate
    type: 'expense',
    isDefault: true,
    createdAt: '2026-01-01T00:00:00.000Z',
  },
];

export const DEFAULT_INCOME_CATEGORIES: Category[] = [
  {
    id: 'inc-salary',
    name: 'Salary',
    icon: 'Briefcase',
    color: '#10b981', // Emerald
    type: 'income',
    isDefault: true,
    createdAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'inc-freelance',
    name: 'Freelance & Side Gig',
    icon: 'Laptop',
    color: '#3b82f6', // Blue
    type: 'income',
    isDefault: true,
    createdAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'inc-bonus',
    name: 'Bonus & Incentives',
    icon: 'Award',
    color: '#f59e0b', // Amber
    type: 'income',
    isDefault: true,
    createdAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'inc-investment-returns',
    name: 'Investment Returns',
    icon: 'DollarSign',
    color: '#84cc16', // Lime
    type: 'income',
    isDefault: true,
    createdAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'inc-gift',
    name: 'Gift & Cash',
    icon: 'Gift',
    color: '#ec4899', // Pink
    type: 'income',
    isDefault: true,
    createdAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'inc-other',
    name: 'Other Income',
    icon: 'PlusCircle',
    color: '#64748b', // Slate
    type: 'income',
    isDefault: true,
    createdAt: '2026-01-01T00:00:00.000Z',
  },
];

export const ALL_DEFAULT_CATEGORIES: Category[] = [
  ...DEFAULT_INCOME_CATEGORIES,
  ...DEFAULT_EXPENSE_CATEGORIES,
];

export const CATEGORY_COLOR_PALETTE = [
  '#f97316', '#6366f1', '#0ea5e9', '#ec4899', '#8b5cf6',
  '#10b981', '#14b8a6', '#eab308', '#3b82f6', '#06b6d4',
  '#22c55e', '#f43f5e', '#84cc16', '#a855f7', '#64748b'
];

export const AVAILABLE_CATEGORY_ICONS = [
  'Utensils', 'Home', 'Car', 'ShoppingBag', 'Film', 'Activity',
  'Dumbbell', 'Zap', 'GraduationCap', 'Plane', 'TrendingUp',
  'Briefcase', 'Laptop', 'Award', 'DollarSign', 'Gift',
  'Coffee', 'Smartphone', 'Shield', 'Music', 'Book', 'Tv',
  'CreditCard', 'Wifi', 'Tag', 'Sparkles', 'MoreHorizontal'
];

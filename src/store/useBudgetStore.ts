import { create } from 'zustand';
import { Budget, Category } from '../types';
import { StorageService, STORAGE_KEYS } from '../services/storageService';
import { ALL_DEFAULT_CATEGORIES } from '../constants/categories';
import { INITIAL_DEMO_BUDGETS } from '../constants/demoData';
import { getPreviousMonth } from '../utils/calculations';

interface BudgetState {
  budgets: Budget[];
  categories: Category[];
  selectedMonth: string; // "YYYY-MM"
  isLoading: boolean;

  // Actions
  loadBudgetsAndCategories: () => Promise<void>;
  setSelectedMonth: (month: string) => void;
  setBudget: (categoryId: string, limitPaise: number, month?: string) => Promise<void>;
  deleteBudget: (budgetId: string) => Promise<void>;
  copyPreviousMonthBudgets: (targetMonth?: string) => Promise<number>; // returns count of copied budgets
  resetMonthBudgets: (targetMonth?: string) => Promise<void>;
  
  // Category management
  addCategory: (category: Omit<Category, 'id' | 'isDefault' | 'createdAt'>) => Promise<Category>;
  updateCategory: (id: string, categoryUpdate: Partial<Category>) => Promise<void>;
  deleteCategory: (id: string) => Promise<{ success: boolean; message?: string }>;
  
  seedDemoBudgets: () => Promise<void>;
  clearAllBudgets: () => Promise<void>;
}

const DEFAULT_CURRENT_MONTH = '2026-09';

export const useBudgetStore = create<BudgetState>((set, get) => ({
  budgets: [],
  categories: ALL_DEFAULT_CATEGORIES,
  selectedMonth: DEFAULT_CURRENT_MONTH,
  isLoading: true,

  loadBudgetsAndCategories: async () => {
    set({ isLoading: true });
    try {
      let storedCategories = await StorageService.getItem<Category[]>(
        STORAGE_KEYS.CATEGORIES,
        ALL_DEFAULT_CATEGORIES
      );
      // Ensure any new default categories are merged
      const existingIds = new Set(storedCategories.map((c) => c.id));
      const missingDefaults = ALL_DEFAULT_CATEGORIES.filter((c) => !existingIds.has(c.id));
      if (missingDefaults.length > 0) {
        storedCategories = [...storedCategories, ...missingDefaults];
        await StorageService.setItem(STORAGE_KEYS.CATEGORIES, storedCategories);
      }

      const hasClearedDemo = await StorageService.getItem<boolean>('@onefinance_demo_budgets_cleared_v2', false);
      let storedBudgets = await StorageService.getItem<Budget[]>(
        STORAGE_KEYS.BUDGETS,
        []
      );
      if (!hasClearedDemo) {
        storedBudgets = [];
        await StorageService.setItem(STORAGE_KEYS.BUDGETS, []);
        await StorageService.setItem('@onefinance_demo_budgets_cleared_v2', true);
      }

      set({
        categories: storedCategories,
        budgets: storedBudgets,
        isLoading: false,
      });
    } catch (e) {
      console.error('[useBudgetStore] Error loading:', e);
      set({ isLoading: false });
    }
  },

  setSelectedMonth: (month: string) => {
    set({ selectedMonth: month });
  },

  setBudget: async (categoryId, limitPaise, month) => {
    const targetMonth = month || get().selectedMonth;
    const existingIndex = get().budgets.findIndex(
      (b) => b.categoryId === categoryId && b.month === targetMonth
    );

    let updatedBudgets: Budget[];

    if (limitPaise <= 0) {
      // Remove budget if limit is 0
      updatedBudgets = get().budgets.filter(
        (b) => !(b.categoryId === categoryId && b.month === targetMonth)
      );
    } else if (existingIndex >= 0) {
      updatedBudgets = get().budgets.map((b, i) =>
        i === existingIndex ? { ...b, limit: limitPaise } : b
      );
    } else {
      const newBudget: Budget = {
        id: `bgt-${targetMonth}-${categoryId}-${Date.now()}`,
        categoryId,
        limit: limitPaise,
        month: targetMonth,
      };
      updatedBudgets = [...get().budgets, newBudget];
    }

    set({ budgets: updatedBudgets });
    await StorageService.setItem(STORAGE_KEYS.BUDGETS, updatedBudgets);
  },

  deleteBudget: async (budgetId) => {
    const updated = get().budgets.filter((b) => b.id !== budgetId);
    set({ budgets: updated });
    await StorageService.setItem(STORAGE_KEYS.BUDGETS, updated);
  },

  copyPreviousMonthBudgets: async (targetMonthParam) => {
    const targetMonth = targetMonthParam || get().selectedMonth;
    const prevMonth = getPreviousMonth(targetMonth);

    const prevBudgets = get().budgets.filter((b) => b.month === prevMonth);
    if (prevBudgets.length === 0) return 0;

    // Filter out existing target month budgets
    const otherBudgets = get().budgets.filter((b) => b.month !== targetMonth);

    const copiedBudgets: Budget[] = prevBudgets.map((b) => ({
      id: `bgt-${targetMonth}-${b.categoryId}-${Date.now()}`,
      categoryId: b.categoryId,
      limit: b.limit,
      month: targetMonth,
    }));

    const updated = [...otherBudgets, ...copiedBudgets];
    set({ budgets: updated });
    await StorageService.setItem(STORAGE_KEYS.BUDGETS, updated);
    return copiedBudgets.length;
  },

  resetMonthBudgets: async (targetMonthParam) => {
    const targetMonth = targetMonthParam || get().selectedMonth;
    const updated = get().budgets.filter((b) => b.month !== targetMonth);
    set({ budgets: updated });
    await StorageService.setItem(STORAGE_KEYS.BUDGETS, updated);
  },

  addCategory: async (categoryData) => {
    const newCat: Category = {
      ...categoryData,
      id: `cat-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      isDefault: false,
      createdAt: new Date().toISOString(),
    };

    const updated = [...get().categories, newCat];
    set({ categories: updated });
    await StorageService.setItem(STORAGE_KEYS.CATEGORIES, updated);
    return newCat;
  },

  updateCategory: async (id, categoryUpdate) => {
    const updated = get().categories.map((c) =>
      c.id === id ? { ...c, ...categoryUpdate } : c
    );
    set({ categories: updated });
    await StorageService.setItem(STORAGE_KEYS.CATEGORIES, updated);
  },

  deleteCategory: async (id) => {
    const cat = get().categories.find((c) => c.id === id);
    if (!cat) return { success: false, message: 'Category not found' };
    if (cat.isDefault) {
      return { success: false, message: 'Default categories cannot be deleted' };
    }

    const updatedCats = get().categories.filter((c) => c.id !== id);
    // Also remove associated budgets
    const updatedBudgets = get().budgets.filter((b) => b.categoryId !== id);

    set({ categories: updatedCats, budgets: updatedBudgets });
    await StorageService.setItem(STORAGE_KEYS.CATEGORIES, updatedCats);
    await StorageService.setItem(STORAGE_KEYS.BUDGETS, updatedBudgets);
    return { success: true };
  },

  seedDemoBudgets: async () => {
    set({ budgets: INITIAL_DEMO_BUDGETS, categories: ALL_DEFAULT_CATEGORIES });
    await StorageService.setItem(STORAGE_KEYS.BUDGETS, INITIAL_DEMO_BUDGETS);
    await StorageService.setItem(STORAGE_KEYS.CATEGORIES, ALL_DEFAULT_CATEGORIES);
  },

  clearAllBudgets: async () => {
    set({ budgets: [] });
    await StorageService.setItem(STORAGE_KEYS.BUDGETS, []);
  },
}));

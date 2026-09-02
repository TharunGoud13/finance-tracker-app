import { create } from 'zustand';
import { SavingsGoal } from '../types';
import { StorageService, STORAGE_KEYS } from '../services/storageService';
import { INITIAL_DEMO_SAVINGS_GOALS } from '../constants/demoData';

interface GoalState {
  goals: SavingsGoal[];
  isLoading: boolean;

  loadGoals: () => Promise<void>;
  addGoal: (goal: Omit<SavingsGoal, 'id' | 'createdAt'>) => Promise<SavingsGoal>;
  updateGoal: (id: string, goalUpdate: Partial<SavingsGoal>) => Promise<void>;
  deleteGoal: (id: string) => Promise<void>;
  addFundsToGoal: (id: string, amountPaise: number) => Promise<void>;
  withdrawFundsFromGoal: (id: string, amountPaise: number) => Promise<void>;
  seedDemoGoals: () => Promise<void>;
  clearAllGoals: () => Promise<void>;
}

export const useGoalStore = create<GoalState>((set, get) => ({
  goals: [],
  isLoading: true,

  loadGoals: async () => {
    set({ isLoading: true });
    try {
      const hasClearedDemo = await StorageService.getItem<boolean>('@onefinance_demo_goals_cleared_v2', false);
      let storedGoals = await StorageService.getItem<SavingsGoal[]>(
        STORAGE_KEYS.SAVINGS_GOALS,
        []
      );
      if (!hasClearedDemo) {
        storedGoals = [];
        await StorageService.setItem(STORAGE_KEYS.SAVINGS_GOALS, []);
        await StorageService.setItem('@onefinance_demo_goals_cleared_v2', true);
      }
      set({ goals: storedGoals, isLoading: false });
    } catch (e) {
      console.error('[useGoalStore] Error loading goals:', e);
      set({ isLoading: false });
    }
  },

  addGoal: async (goalData) => {
    const newGoal: SavingsGoal = {
      ...goalData,
      id: `goal-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      createdAt: new Date().toISOString(),
    };

    const updated = [...get().goals, newGoal];
    set({ goals: updated });
    await StorageService.setItem(STORAGE_KEYS.SAVINGS_GOALS, updated);
    return newGoal;
  },

  updateGoal: async (id, goalUpdate) => {
    const updated = get().goals.map((g) =>
      g.id === id ? { ...g, ...goalUpdate } : g
    );
    set({ goals: updated });
    await StorageService.setItem(STORAGE_KEYS.SAVINGS_GOALS, updated);
  },

  deleteGoal: async (id) => {
    const updated = get().goals.filter((g) => g.id !== id);
    set({ goals: updated });
    await StorageService.setItem(STORAGE_KEYS.SAVINGS_GOALS, updated);
  },

  addFundsToGoal: async (id, amountPaise) => {
    const updated = get().goals.map((g) =>
      g.id === id
        ? {
            ...g,
            currentAmount: Math.min(
              g.targetAmount * 2, // Allow reasonable overflow
              Math.max(0, g.currentAmount + amountPaise)
            ),
          }
        : g
    );
    set({ goals: updated });
    await StorageService.setItem(STORAGE_KEYS.SAVINGS_GOALS, updated);
  },

  withdrawFundsFromGoal: async (id, amountPaise) => {
    const updated = get().goals.map((g) =>
      g.id === id
        ? {
            ...g,
            currentAmount: Math.max(0, g.currentAmount - amountPaise),
          }
        : g
    );
    set({ goals: updated });
    await StorageService.setItem(STORAGE_KEYS.SAVINGS_GOALS, updated);
  },

  seedDemoGoals: async () => {
    set({ goals: INITIAL_DEMO_SAVINGS_GOALS });
    await StorageService.setItem(STORAGE_KEYS.SAVINGS_GOALS, INITIAL_DEMO_SAVINGS_GOALS);
  },

  clearAllGoals: async () => {
    set({ goals: [] });
    await StorageService.setItem(STORAGE_KEYS.SAVINGS_GOALS, []);
  },
}));

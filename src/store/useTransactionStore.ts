import { create } from 'zustand';
import { Transaction, TransactionType } from '../types';
import { StorageService, STORAGE_KEYS } from '../services/storageService';
import { INITIAL_DEMO_TRANSACTIONS } from '../constants/demoData';

interface TransactionFilterState {
  searchQuery: string;
  typeFilter: 'all' | 'income' | 'expense';
  categoryFilter: string | null; // categoryId or null
  monthFilter: string; // "YYYY-MM"
  sortBy: 'newest' | 'oldest' | 'highest' | 'lowest';
}

interface TransactionState {
  transactions: Transaction[];
  isLoading: boolean;
  filters: TransactionFilterState;
  lastDeletedTransaction: Transaction | null;

  // Actions
  loadTransactions: () => Promise<void>;
  addTransaction: (tx: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Transaction>;
  updateTransaction: (id: string, tx: Partial<Transaction>) => Promise<void>;
  deleteTransaction: (id: string) => Promise<Transaction | null>;
  restoreLastDeletedTransaction: () => Promise<void>;
  clearLastDeletedTransaction: () => void;
  setFilters: (filters: Partial<TransactionFilterState>) => void;
  resetFilters: () => void;
  seedDemoTransactions: () => Promise<void>;
  clearAllTransactions: () => Promise<void>;
}

const DEFAULT_MONTH = '2026-09';

const DEFAULT_FILTERS: TransactionFilterState = {
  searchQuery: '',
  typeFilter: 'all',
  categoryFilter: null,
  monthFilter: DEFAULT_MONTH,
  sortBy: 'newest',
};

export const useTransactionStore = create<TransactionState>((set, get) => ({
  transactions: [],
  isLoading: true,
  filters: DEFAULT_FILTERS,
  lastDeletedTransaction: null,

  loadTransactions: async () => {
    set({ isLoading: true });
    try {
      const hasClearedDemo = await StorageService.getItem<boolean>('@onefinance_demo_cleared_v2', false);
      let data = await StorageService.getItem<Transaction[]>(STORAGE_KEYS.TRANSACTIONS, []);

      if (!hasClearedDemo) {
        data = [];
        await StorageService.setItem(STORAGE_KEYS.TRANSACTIONS, []);
        await StorageService.setItem('@onefinance_demo_cleared_v2', true);
      }

      set({ transactions: data, isLoading: false });
    } catch (e) {
      console.error('[useTransactionStore] Error loading:', e);
      set({ transactions: [], isLoading: false });
    }
  },

  addTransaction: async (txData) => {
    const now = new Date().toISOString();
    const newTx: Transaction = {
      ...txData,
      id: `tx-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      createdAt: now,
      updatedAt: now,
    };

    const updated = [newTx, ...get().transactions];
    set({ transactions: updated });
    await StorageService.setItem(STORAGE_KEYS.TRANSACTIONS, updated);
    return newTx;
  },

  updateTransaction: async (id, txUpdate) => {
    const updated = get().transactions.map((tx) =>
      tx.id === id
        ? {
            ...tx,
            ...txUpdate,
            updatedAt: new Date().toISOString(),
          }
        : tx
    );
    set({ transactions: updated });
    await StorageService.setItem(STORAGE_KEYS.TRANSACTIONS, updated);
  },

  deleteTransaction: async (id) => {
    const target = get().transactions.find((tx) => tx.id === id);
    if (!target) return null;

    const updated = get().transactions.filter((tx) => tx.id !== id);
    set({ transactions: updated, lastDeletedTransaction: target });
    await StorageService.setItem(STORAGE_KEYS.TRANSACTIONS, updated);
    return target;
  },

  restoreLastDeletedTransaction: async () => {
    const deleted = get().lastDeletedTransaction;
    if (!deleted) return;

    const updated = [deleted, ...get().transactions];
    set({ transactions: updated, lastDeletedTransaction: null });
    await StorageService.setItem(STORAGE_KEYS.TRANSACTIONS, updated);
  },

  clearLastDeletedTransaction: () => {
    set({ lastDeletedTransaction: null });
  },

  setFilters: (newFilters) => {
    set({ filters: { ...get().filters, ...newFilters } });
  },

  resetFilters: () => {
    set({ filters: { ...DEFAULT_FILTERS, monthFilter: get().filters.monthFilter } });
  },

  seedDemoTransactions: async () => {
    set({ transactions: INITIAL_DEMO_TRANSACTIONS });
    await StorageService.setItem(STORAGE_KEYS.TRANSACTIONS, INITIAL_DEMO_TRANSACTIONS);
  },

  clearAllTransactions: async () => {
    set({ transactions: [] });
    await StorageService.setItem(STORAGE_KEYS.TRANSACTIONS, []);
  },
}));

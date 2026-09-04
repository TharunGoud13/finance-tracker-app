import { create } from 'zustand';
import { RecurringTransaction } from '../types';
import { StorageService, STORAGE_KEYS } from '../services/storageService';

interface RecurringState {
  recurring: RecurringTransaction[];
  isLoading: boolean;

  loadRecurring: () => Promise<void>;
  addRecurring: (item: Omit<RecurringTransaction, 'id'>) => Promise<RecurringTransaction>;
  updateRecurring: (id: string, update: Partial<RecurringTransaction>) => Promise<void>;
  deleteRecurring: (id: string) => Promise<void>;
  toggleRecurringActive: (id: string) => Promise<void>;
}

export const useRecurringStore = create<RecurringState>((set, get) => ({
  recurring: [],
  isLoading: true,

  loadRecurring: async () => {
    set({ isLoading: true });
    try {
      const stored = await StorageService.getItem<RecurringTransaction[]>(
        STORAGE_KEYS.RECURRING,
        []
      );
      set({ recurring: stored || [], isLoading: false });
    } catch (e) {
      console.error('[useRecurringStore] Error loading:', e);
      set({ recurring: [], isLoading: false });
    }
  },

  addRecurring: async (itemData) => {
    const newItem: RecurringTransaction = {
      ...itemData,
      id: `rec-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
    };

    const updated = [...get().recurring, newItem];
    set({ recurring: updated });
    await StorageService.setItem(STORAGE_KEYS.RECURRING, updated);
    return newItem;
  },

  updateRecurring: async (id, update) => {
    const updated = get().recurring.map((item) =>
      item.id === id ? { ...item, ...update } : item
    );
    set({ recurring: updated });
    await StorageService.setItem(STORAGE_KEYS.RECURRING, updated);
  },

  deleteRecurring: async (id) => {
    const updated = get().recurring.filter((item) => item.id !== id);
    set({ recurring: updated });
    await StorageService.setItem(STORAGE_KEYS.RECURRING, updated);
  },

  toggleRecurringActive: async (id) => {
    const updated = get().recurring.map((item) =>
      item.id === id ? { ...item, active: !item.active } : item
    );
    set({ recurring: updated });
    await StorageService.setItem(STORAGE_KEYS.RECURRING, updated);
  },
}));

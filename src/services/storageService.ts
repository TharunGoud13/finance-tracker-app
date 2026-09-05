import AsyncStorage from '@react-native-async-storage/async-storage';
import { Transaction, Budget, Category, SavingsGoal, RecurringTransaction, AppSettings } from '../types';

export const STORAGE_KEYS = {
  TRANSACTIONS: '@onefinance_transactions_v1',
  BUDGETS: '@onefinance_budgets_v1',
  CATEGORIES: '@onefinance_categories_v1',
  SAVINGS_GOALS: '@onefinance_goals_v1',
  RECURRING: '@onefinance_recurring_v1',
  SETTINGS: '@onefinance_settings_v1',
  INITIALIZED: '@onefinance_is_initialized_v1',
};

export interface ExportDataPayload {
  version: string;
  exportedAt: string;
  transactions: Transaction[];
  budgets: Budget[];
  categories: Category[];
  savingsGoals: SavingsGoal[];
  recurring: RecurringTransaction[];
  settings: AppSettings;
}

export const StorageService = {
  async getItem<T>(key: string, defaultValue: T): Promise<T> {
    try {
      const data = await AsyncStorage.getItem(key);
      if (data !== null) {
        return JSON.parse(data) as T;
      }
    } catch (e) {
      console.warn(`[StorageService] Error reading key ${key}:`, e);
    }
    return defaultValue;
  },

  async setItem<T>(key: string, value: T): Promise<boolean> {
    try {
      await AsyncStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (e) {
      console.error(`[StorageService] Error writing key ${key}:`, e);
      return false;
    }
  },

  async removeItem(key: string): Promise<boolean> {
    try {
      await AsyncStorage.removeItem(key);
      return true;
    } catch (e) {
      console.error(`[StorageService] Error removing key ${key}:`, e);
      return false;
    }
  },

  async clearAll(): Promise<boolean> {
    try {
      const keys = Object.values(STORAGE_KEYS);
      await AsyncStorage.multiRemove(keys);
      return true;
    } catch (e) {
      console.error('[StorageService] Error clearing all data:', e);
      return false;
    }
  },

  async exportAllData(): Promise<string> {
    const transactions = await this.getItem<Transaction[]>(STORAGE_KEYS.TRANSACTIONS, []);
    const budgets = await this.getItem<Budget[]>(STORAGE_KEYS.BUDGETS, []);
    const categories = await this.getItem<Category[]>(STORAGE_KEYS.CATEGORIES, []);
    const savingsGoals = await this.getItem<SavingsGoal[]>(STORAGE_KEYS.SAVINGS_GOALS, []);
    const recurring = await this.getItem<RecurringTransaction[]>(STORAGE_KEYS.RECURRING, []);
    const settings = await this.getItem<AppSettings>(STORAGE_KEYS.SETTINGS, {
      currency: 'INR',
      userName: 'Tharun',
      privacyModeEnabled: false,
      biometricAuthEnabled: false,
      autoLockOnBackground: true,
      theme: 'dark',
      notificationsEnabled: true,
      notificationThresholds: [50, 75, 90, 100],
      dailyReminderTime: '21:00',
      reminderIntervalHours: 3,
    });

    const exportPayload: ExportDataPayload = {
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      transactions,
      budgets,
      categories,
      savingsGoals,
      recurring,
      settings,
    };

    return JSON.stringify(exportPayload, null, 2);
  },

  async importData(jsonString: string): Promise<boolean> {
    try {
      const data = JSON.parse(jsonString) as Partial<ExportDataPayload>;
      if (!data) return false;

      if (Array.isArray(data.transactions)) {
        await this.setItem(STORAGE_KEYS.TRANSACTIONS, data.transactions);
      }
      if (Array.isArray(data.budgets)) {
        await this.setItem(STORAGE_KEYS.BUDGETS, data.budgets);
      }
      if (Array.isArray(data.categories)) {
        await this.setItem(STORAGE_KEYS.CATEGORIES, data.categories);
      }
      if (Array.isArray(data.savingsGoals)) {
        await this.setItem(STORAGE_KEYS.SAVINGS_GOALS, data.savingsGoals);
      }
      if (Array.isArray(data.recurring)) {
        await this.setItem(STORAGE_KEYS.RECURRING, data.recurring);
      }
      if (data.settings) {
        await this.setItem(STORAGE_KEYS.SETTINGS, data.settings);
      }

      return true;
    } catch (e) {
      console.error('[StorageService] Error importing data:', e);
      return false;
    }
  },
};

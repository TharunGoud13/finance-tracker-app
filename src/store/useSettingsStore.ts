import { create } from 'zustand';
import { AppSettings, CurrencyCode } from '../types';
import { StorageService, STORAGE_KEYS } from '../services/storageService';

interface SettingsState {
  settings: AppSettings;
  isLoading: boolean;

  loadSettings: () => Promise<void>;
  updateSettings: (newSettings: Partial<AppSettings>) => Promise<void>;
  setCurrency: (currency: CurrencyCode) => Promise<void>;
  setTheme: (theme: AppSettings['theme']) => Promise<void>;
  setUserName: (name: string) => Promise<void>;
  toggleNotificationThreshold: (threshold: number) => Promise<void>;
  resetAllData: () => Promise<void>;
}

const DEFAULT_SETTINGS: AppSettings = {
  currency: 'INR',
  userName: 'Tharun',
  privacyModeEnabled: false,
  biometricAuthEnabled: false,
  autoLockOnBackground: true,
  theme: 'dark',
  notificationsEnabled: true,
  notificationThresholds: [50, 75, 90, 100],
  dailyReminderTime: '21:00',
};

export const useSettingsStore = create<SettingsState>((set, get) => ({
  settings: DEFAULT_SETTINGS,
  isLoading: true,

  loadSettings: async () => {
    set({ isLoading: true });
    try {
      const stored = await StorageService.getItem<AppSettings>(
        STORAGE_KEYS.SETTINGS,
        DEFAULT_SETTINGS
      );
      set({ settings: { ...DEFAULT_SETTINGS, ...stored }, isLoading: false });
    } catch (e) {
      console.error('[useSettingsStore] Error loading settings:', e);
      set({ isLoading: false });
    }
  },

  updateSettings: async (newSettings) => {
    const updated = { ...get().settings, ...newSettings };
    set({ settings: updated });
    await StorageService.setItem(STORAGE_KEYS.SETTINGS, updated);
  },

  setCurrency: async (currency) => {
    await get().updateSettings({ currency });
  },

  setTheme: async (theme) => {
    await get().updateSettings({ theme });
  },

  setUserName: async (userName) => {
    await get().updateSettings({ userName });
  },

  toggleNotificationThreshold: async (threshold) => {
    const current = get().settings.notificationThresholds;
    const exists = current.includes(threshold);
    const updated = exists
      ? current.filter((t) => t !== threshold)
      : [...current, threshold].sort((a, b) => a - b);
    await get().updateSettings({ notificationThresholds: updated });
  },

  resetAllData: async () => {
    await StorageService.clearAll();
    set({ settings: DEFAULT_SETTINGS });
  },
}));

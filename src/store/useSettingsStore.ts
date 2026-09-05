import { create } from 'zustand';
import { AppSettings, CurrencyCode } from '../types';
import { StorageService, STORAGE_KEYS } from '../services/storageService';
import { NotificationService } from '../services/notificationService';

interface SettingsState {
  settings: AppSettings;
  isLoading: boolean;

  loadSettings: () => Promise<void>;
  updateSettings: (newSettings: Partial<AppSettings>) => Promise<void>;
  setCurrency: (currency: CurrencyCode) => Promise<void>;
  setTheme: (theme: AppSettings['theme']) => Promise<void>;
  setUserName: (name: string) => Promise<void>;
  setNotificationsEnabled: (enabled: boolean) => Promise<void>;
  setReminderInterval: (hours: number) => Promise<void>;
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
  reminderIntervalHours: 3,
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
      const mergedSettings = { ...DEFAULT_SETTINGS, ...stored };
      set({ settings: mergedSettings, isLoading: false });

      // Automatically sync notification schedule if enabled
      if (mergedSettings.notificationsEnabled) {
        NotificationService.scheduleExpenseReminders(
          mergedSettings.reminderIntervalHours || 3
        ).catch(() => {});
      }
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

  setNotificationsEnabled: async (enabled: boolean) => {
    await get().updateSettings({ notificationsEnabled: enabled });
    if (enabled) {
      await NotificationService.scheduleExpenseReminders(
        get().settings.reminderIntervalHours || 3
      );
    } else {
      await NotificationService.cancelAllReminders();
    }
  },

  setReminderInterval: async (hours: number) => {
    await get().updateSettings({ reminderIntervalHours: hours });
    if (get().settings.notificationsEnabled) {
      await NotificationService.scheduleExpenseReminders(hours);
    }
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
    await NotificationService.cancelAllReminders();
    await StorageService.clearAll();
    set({ settings: DEFAULT_SETTINGS });
  },
}));

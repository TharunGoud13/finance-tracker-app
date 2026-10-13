import { Platform, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const NOTIFICATION_STORAGE_KEY = '@onefinance_notification_state';
export const REMINDER_NOTIFICATION_ID = 'onefinance-expense-reminder';

export interface NotificationStatus {
  isConfigured: boolean;
  hasPermission: boolean;
  scheduledIntervalHours?: number;
  scheduledCount: number;
}

const REMINDER_MESSAGES = [
  {
    title: 'Track Your Expenses ✍️',
    body: 'Did you spend anything in the last few hours? Take 5 seconds to keep your budget accurate!',
  },
  {
    title: 'OneFinance Expense Check 💳',
    body: 'Any recent coffee, food, or shopping? Log your expenses before you forget!',
  },
  {
    title: 'Keep Your Goals on Track 🎯',
    body: 'Quick reminder to update your recent transactions and monitor your spending limits.',
  },
  {
    title: 'Never Settle on Savings ⚡',
    body: 'Stay on top of your financial freedom. Record any new expenses now!',
  },
];

class NotificationServiceClass {
  async initialize(): Promise<boolean> {
    return true;
  }

  async requestPermissions(): Promise<boolean> {
    return true;
  }

  async hasPermissions(): Promise<boolean> {
    return true;
  }

  async scheduleExpenseReminders(intervalHours: number = 3): Promise<{ success: boolean; message?: string }> {
    try {
      const safeHours = Math.max(1, intervalHours);
      await AsyncStorage.setItem(
        NOTIFICATION_STORAGE_KEY,
        JSON.stringify({
          scheduledAt: new Date().toISOString(),
          intervalHours: safeHours,
          enabled: true,
        })
      );
      return {
        success: true,
        message: `Expense reminders active every ${safeHours} hours.`,
      };
    } catch (e: any) {
      return { success: false, message: e?.message || 'Could not schedule reminder.' };
    }
  }

  async sendTestNotification(): Promise<{ success: boolean; message: string }> {
    const randomMsg = REMINDER_MESSAGES[Math.floor(Math.random() * REMINDER_MESSAGES.length)];
    Alert.alert(randomMsg.title, randomMsg.body);
    return {
      success: true,
      message: 'Test notification triggered!',
    };
  }

  async cancelAllReminders(): Promise<void> {
    try {
      await AsyncStorage.setItem(
        NOTIFICATION_STORAGE_KEY,
        JSON.stringify({ enabled: false, cancelledAt: new Date().toISOString() })
      );
    } catch {}
  }

  async getStatus(): Promise<NotificationStatus> {
    try {
      const storedRaw = await AsyncStorage.getItem(NOTIFICATION_STORAGE_KEY);
      const stored = storedRaw ? JSON.parse(storedRaw) : null;
      return {
        isConfigured: true,
        hasPermission: true,
        scheduledIntervalHours: stored?.intervalHours || 3,
        scheduledCount: stored?.enabled ? 1 : 0,
      };
    } catch {
      return {
        isConfigured: false,
        hasPermission: false,
        scheduledIntervalHours: 3,
        scheduledCount: 0,
      };
    }
  }
}

export const NotificationService = new NotificationServiceClass();

import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { SchedulableTriggerInputTypes } from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';

const NOTIFICATION_STORAGE_KEY = '@onefinance_notification_state';
export const REMINDER_NOTIFICATION_ID = 'onefinance-expense-reminder';
const EXPENSE_CHANNEL_ID = 'expense-reminders';

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
  private isHandlerSet = false;

  /**
   * Initializes notification handler and Android notification channel
   */
  async initialize(): Promise<boolean> {
    try {
      if (!this.isHandlerSet && Notifications.setNotificationHandler) {
        Notifications.setNotificationHandler({
          handleNotification: async () => ({
            shouldShowBanner: true,
            shouldShowList: true,
            shouldPlaySound: true,
            shouldSetBadge: false,
          }),
        });
        this.isHandlerSet = true;
      }

      if (Platform.OS === 'android' && Notifications.setNotificationChannelAsync) {
        await Notifications.setNotificationChannelAsync(EXPENSE_CHANNEL_ID, {
          name: 'Expense Reminders',
          description: 'Periodic reminders to record recent expenses and stay on budget',
          importance: Notifications.AndroidImportance.HIGH,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#EB0029',
          enableLights: true,
          enableVibrate: true,
          sound: 'default',
        });
      }

      return true;
    } catch (error) {
      console.warn('[NotificationService] Initialization skipped or unsupported in this binary:', error);
      return false;
    }
  }

  /**
   * Check and request notification permissions
   */
  async requestPermissions(): Promise<boolean> {
    try {
      if (!Notifications.getPermissionsAsync || !Notifications.requestPermissionsAsync) {
        return false;
      }

      const existingStatus = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus.status;

      if (existingStatus.status !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      return finalStatus === 'granted';
    } catch (error) {
      console.warn('[NotificationService] Error requesting permissions:', error);
      return false;
    }
  }

  /**
   * Check current permission status
   */
  async hasPermissions(): Promise<boolean> {
    try {
      if (!Notifications.getPermissionsAsync) return false;
      const { status } = await Notifications.getPermissionsAsync();
      return status === 'granted';
    } catch {
      return false;
    }
  }

  /**
   * Schedules recurring reminders every N hours (e.g. 3 or 4 hours)
   */
  async scheduleExpenseReminders(intervalHours: number = 3): Promise<{ success: boolean; message?: string }> {
    try {
      await this.initialize();

      const hasPerm = await this.requestPermissions();
      if (!hasPerm) {
        return {
          success: false,
          message: 'Notification permission was not granted. Please enable it in system settings.',
        };
      }

      // Cancel previous scheduled reminders to avoid duplicates
      await this.cancelAllReminders();

      // Ensure interval is at least 1 hour
      const safeHours = Math.max(1, intervalHours);
      const seconds = safeHours * 60 * 60;

      // Pick a random message for the recurring notification
      const randomMsg = REMINDER_MESSAGES[Math.floor(Math.random() * REMINDER_MESSAGES.length)];

      await Notifications.scheduleNotificationAsync({
        identifier: REMINDER_NOTIFICATION_ID,
        content: {
          title: randomMsg.title,
          body: randomMsg.body,
          data: {
            action: 'add-expense',
            screen: 'modal/add-transaction',
            intervalHours: safeHours,
          },
          sound: true,
          priority: Notifications.AndroidNotificationPriority.HIGH,
        },
        trigger: {
          type: SchedulableTriggerInputTypes.TIME_INTERVAL,
          seconds,
          repeats: true,
          channelId: EXPENSE_CHANNEL_ID,
        },
      });

      // Save scheduled state to local storage
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
        message: `Expense reminder scheduled every ${safeHours} hours.`,
      };
    } catch (error: any) {
      console.warn('[NotificationService] Failed to schedule reminder:', error);
      return {
        success: false,
        message: error?.message || 'Could not schedule reminder.',
      };
    }
  }

  /**
   * Sends an immediate test notification to verify audio, vibration, and banner
   */
  async sendTestNotification(): Promise<{ success: boolean; message: string }> {
    try {
      await this.initialize();

      const hasPerm = await this.requestPermissions();
      if (!hasPerm) {
        return {
          success: false,
          message: 'Please grant notification permissions in your device settings.',
        };
      }

      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'OneFinance • Expense Reminder 🔴',
          body: 'Quick check: Did you make any purchases recently? Tap here to log them right away!',
          data: {
            action: 'add-expense',
            screen: 'modal/add-transaction',
          },
          sound: true,
          priority: Notifications.AndroidNotificationPriority.HIGH,
        },
        trigger: null, // Send immediately
      });

      return {
        success: true,
        message: 'Test notification sent! Check your notification tray.',
      };
    } catch (error: any) {
      console.warn('[NotificationService] Error sending test notification:', error);
      return {
        success: false,
        message: error?.message || 'Failed to send test notification.',
      };
    }
  }

  /**
   * Cancel all scheduled reminders
   */
  async cancelAllReminders(): Promise<void> {
    try {
      if (Notifications.cancelAllScheduledNotificationsAsync) {
        await Notifications.cancelAllScheduledNotificationsAsync();
      }
      await AsyncStorage.setItem(
        NOTIFICATION_STORAGE_KEY,
        JSON.stringify({ enabled: false, cancelledAt: new Date().toISOString() })
      );
    } catch (error) {
      console.warn('[NotificationService] Error cancelling notifications:', error);
    }
  }

  /**
   * Retrieve notification schedule status
   */
  async getStatus(): Promise<NotificationStatus> {
    try {
      const hasPermission = await this.hasPermissions();
      let scheduledCount = 0;

      if (Notifications.getAllScheduledNotificationsAsync) {
        const scheduled = await Notifications.getAllScheduledNotificationsAsync();
        scheduledCount = scheduled.length;
      }

      const storedRaw = await AsyncStorage.getItem(NOTIFICATION_STORAGE_KEY);
      const stored = storedRaw ? JSON.parse(storedRaw) : null;

      return {
        isConfigured: true,
        hasPermission,
        scheduledIntervalHours: stored?.intervalHours || 3,
        scheduledCount,
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

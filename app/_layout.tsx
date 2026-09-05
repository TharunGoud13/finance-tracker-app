import React, { useEffect } from 'react';
import { Stack, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View, StyleSheet, Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { useTransactionStore } from '../src/store/useTransactionStore';
import { useBudgetStore } from '../src/store/useBudgetStore';
import { useGoalStore } from '../src/store/useGoalStore';
import { useRecurringStore } from '../src/store/useRecurringStore';
import { useSettingsStore } from '../src/store/useSettingsStore';
import { useAppLock } from '../src/hooks/useAppLock';
import { NotificationService } from '../src/services/notificationService';
import '../global.css';

export default function RootLayout() {
  const loadTransactions = useTransactionStore((state) => state.loadTransactions);
  const loadBudgetsAndCategories = useBudgetStore((state) => state.loadBudgetsAndCategories);
  const loadGoals = useGoalStore((state) => state.loadGoals);
  const loadRecurring = useRecurringStore((state) => state.loadRecurring);
  const loadSettings = useSettingsStore((state) => state.loadSettings);

  // Initialize privacy auto-lock listener
  useAppLock();

  useEffect(() => {
    // Parallel initial load
    Promise.all([
      loadSettings(),
      loadTransactions(),
      loadBudgetsAndCategories(),
      loadGoals(),
      loadRecurring(),
    ]);

    // Initialize notification service
    NotificationService.initialize().catch(() => {});

    // Listen for notification interaction (when user taps reminder)
    let subscription: Notifications.EventSubscription | null = null;
    try {
      if (Notifications.addNotificationResponseReceivedListener) {
        subscription = Notifications.addNotificationResponseReceivedListener((response) => {
          const data = response?.notification?.request?.content?.data;
          if (data?.screen) {
            router.push('/modal/add-transaction');
          } else {
            router.push('/modal/add-transaction');
          }
        });
      }
    } catch {
      // Graceful fallback for non-native / unsupported runtime
    }

    return () => {
      if (subscription && subscription.remove) {
        subscription.remove();
      }
    };
  }, [
    loadSettings,
    loadTransactions,
    loadBudgetsAndCategories,
    loadGoals,
    loadRecurring,
  ]);

  return (
    <View style={styles.outerContainer}>
      <StatusBar style="light" />
      <View style={styles.innerContainer}>
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: '#000000' },
            animation: 'slide_from_right',
          }}
        >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="modal/add-transaction"
          options={{
            presentation: 'modal',
            animation: 'slide_from_bottom',
          }}
        />
        <Stack.Screen
          name="modal/edit-transaction"
          options={{
            presentation: 'modal',
            animation: 'slide_from_bottom',
          }}
        />
        <Stack.Screen
          name="modal/category-detail"
          options={{
            presentation: 'modal',
            animation: 'slide_from_bottom',
          }}
        />
        <Stack.Screen
          name="modal/manage-categories"
          options={{
            presentation: 'modal',
            animation: 'slide_from_bottom',
          }}
        />
        <Stack.Screen
          name="modal/savings-goals"
          options={{
            presentation: 'modal',
            animation: 'slide_from_bottom',
          }}
        />
        <Stack.Screen
          name="modal/recurring"
          options={{
            presentation: 'modal',
            animation: 'slide_from_bottom',
          }}
        />
        <Stack.Screen
          name="modal/privacy-auth"
          options={{
            presentation: 'transparentModal',
            animation: 'fade',
          }}
        />
      </Stack>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outerContainer: {
    flex: 1,
    backgroundColor: '#000000',
    ...(Platform.OS === 'web' ? { alignItems: 'center' } : {}),
  },
  innerContainer: {
    flex: 1,
    width: '100%',
    backgroundColor: '#000000',
    ...(Platform.OS === 'web'
      ? {
          maxWidth: 640,
          borderLeftWidth: 1,
          borderRightWidth: 1,
          borderColor: 'rgba(255, 255, 255, 0.08)',
          minHeight: '100vh' as any,
          boxShadow: '0 0 50px rgba(0, 0, 0, 0.8)',
        }
      : {}),
  },
});

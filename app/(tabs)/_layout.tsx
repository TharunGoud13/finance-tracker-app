import React from 'react';
import { StyleSheet, View, Platform } from 'react-native';
import { Tabs, router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon } from '../../src/components/ui/Icon';
import { triggerHaptic } from '../../src/utils/haptics';
import { THEME } from '../../src/constants/theme';

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const bottomInset = Math.max(insets.bottom, Platform.OS === 'ios' ? 16 : 8);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: THEME.colors.primary,
        tabBarInactiveTintColor: THEME.colors.textMuted,
        tabBarStyle: {
          backgroundColor: THEME.colors.backgroundElevated,
          borderTopWidth: 1,
          borderTopColor: THEME.colors.border,
          height: 62 + (Platform.OS === 'ios' ? bottomInset : 4),
          paddingBottom: bottomInset,
          paddingTop: 6,
          ...(Platform.OS === 'web'
            ? {
                maxWidth: 600,
                marginHorizontal: 'auto' as any,
                width: '100%',
              }
            : {}),
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '700',
          letterSpacing: 0.1,
          marginTop: 2,
          fontFamily: THEME.typography.fontFamily,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, focused }) => (
            <Icon
              name="LayoutDashboard"
              size={22}
              color={focused ? THEME.colors.primary : color}
              strokeWidth={focused ? 2.5 : 2}
            />
          ),
        }}
        listeners={{
          tabPress: () => triggerHaptic.selection(),
        }}
      />
      <Tabs.Screen
        name="transactions"
        options={{
          title: 'Activity',
          tabBarIcon: ({ color, focused }) => (
            <Icon
              name="ArrowLeftRight"
              size={22}
              color={focused ? THEME.colors.primary : color}
              strokeWidth={focused ? 2.5 : 2}
            />
          ),
        }}
        listeners={{
          tabPress: () => triggerHaptic.selection(),
        }}
      />
      <Tabs.Screen
        name="add-placeholder"
        options={{
          title: '',
          tabBarIcon: () => (
            <View style={styles.fabContainer}>
              <View style={styles.fabButton}>
                <Icon name="Plus" size={24} color="#FFFFFF" strokeWidth={2.5} />
              </View>
            </View>
          ),
        }}
        listeners={() => ({
          tabPress: (e) => {
            e.preventDefault();
            triggerHaptic.medium();
            router.push('/modal/add-transaction');
          },
        })}
      />
      <Tabs.Screen
        name="budget"
        options={{
          title: 'Analytics',
          tabBarIcon: ({ color, focused }) => (
            <Icon
              name="PieChart"
              size={22}
              color={focused ? THEME.colors.primary : color}
              strokeWidth={focused ? 2.5 : 2}
            />
          ),
        }}
        listeners={{
          tabPress: () => triggerHaptic.selection(),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color, focused }) => (
            <Icon
              name="Settings"
              size={22}
              color={focused ? THEME.colors.primary : color}
              strokeWidth={focused ? 2.5 : 2}
            />
          ),
        }}
        listeners={{
          tabPress: () => triggerHaptic.selection(),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  fabContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -8,
  },
  fabButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: THEME.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: THEME.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.55,
    shadowRadius: 12,
    elevation: 9,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
});

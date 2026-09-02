import React from 'react';
import { StyleSheet, View, Platform } from 'react-native';
import { Tabs, router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon } from '../../src/components/ui/Icon';
import { triggerHaptic } from '../../src/utils/haptics';

export default function TabLayout() {
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#eb0028',
        tabBarInactiveTintColor: 'rgba(235, 235, 245, 0.45)',
        tabBarStyle: {
          position: 'absolute',
          bottom: Platform.OS === 'web' ? 12 : Math.max(insets.bottom, 12),
          left: Platform.OS === 'web' ? 0 : 16,
          right: Platform.OS === 'web' ? 0 : 16,
          ...(Platform.OS === 'web'
            ? {
                maxWidth: 600,
                marginHorizontal: 'auto' as any,
                boxShadow: '0 8px 30px rgba(0,0,0,0.6)',
                backdropFilter: 'blur(20px)',
              }
            : {
                shadowColor: '#000000',
                shadowOffset: { width: 0, height: 6 },
                shadowOpacity: 0.45,
                shadowRadius: 14,
                elevation: 10,
              }),
          backgroundColor: '#121216',
          height: 64,
          borderRadius: 22,
          borderWidth: 1,
          borderColor: 'rgba(255, 255, 255, 0.12)',
          paddingBottom: 6,
          paddingTop: 6,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '600',
          letterSpacing: 0.2,
          marginTop: 2,
        },
        tabBarItemStyle: {
          paddingVertical: 4,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color }) => (
            <Icon name="LayoutGrid" size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="transactions"
        options={{
          title: 'Activity',
          tabBarIcon: ({ color }) => (
            <Icon name="List" size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="add-placeholder"
        options={{
          title: '',
          tabBarIcon: () => (
            <View style={{
              width: 52,
              height: 52,
              borderRadius: 26,
              backgroundColor: '#eb0028',
              alignItems: 'center',
              justifyContent: 'center',
              marginTop: -4,
              shadowColor: '#eb0028',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.45,
              shadowRadius: 10,
              elevation: 8,
            }}>
              <Icon name="Plus" size={26} color="#ffffff" />
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
          title: 'Budget',
          tabBarIcon: ({ color }) => (
            <Icon name="Wallet" size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color }) => (
            <Icon name="Settings" size={24} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}

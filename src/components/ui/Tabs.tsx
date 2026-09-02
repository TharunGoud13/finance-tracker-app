import React, { createContext, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ViewStyle,
  StyleProp,
} from 'react-native';
import { HapticPressable } from './HapticPressable';
import { Icon } from './Icon';

// ── Context ───────────────────────────────────────────────────────────────────
interface TabsContextValue {
  value: string;
  onValueChange: (v: string) => void;
}
const TabsCtx = createContext<TabsContextValue>({ value: '', onValueChange: () => {} });

// ── Tabs (root) ───────────────────────────────────────────────────────────────
interface TabsProps {
  value: string;
  onValueChange: (v: string) => void;
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}
export function Tabs({ value, onValueChange, children, style }: TabsProps) {
  return (
    <TabsCtx.Provider value={{ value, onValueChange }}>
      <View style={[styles.root, style]}>{children}</View>
    </TabsCtx.Provider>
  );
}

// ── TabsList ──────────────────────────────────────────────────────────────────
interface TabsListProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}
export function TabsList({ children, style }: TabsListProps) {
  return <View style={[styles.listContainer, style]}>{children}</View>;
}

// ── TabsTrigger ───────────────────────────────────────────────────────────────
interface TabsTriggerProps {
  value: string;
  label: string;
  icon?: string;
  /** Accent color when active. Defaults to white */
  accentColor?: string;
  style?: StyleProp<ViewStyle>;
}
export function TabsTrigger({
  value,
  label,
  icon,
  accentColor = '#ffffff',
  style,
}: TabsTriggerProps) {
  const { value: activeValue, onValueChange } = useContext(TabsCtx);
  const isActive = activeValue === value;

  const isWhiteAccent = accentColor.toLowerCase() === '#ffffff';

  const activeBg = isWhiteAccent ? '#2a2a34' : `${accentColor}1e`;
  const activeBorder = isWhiteAccent ? 'rgba(255, 255, 255, 0.22)' : `${accentColor}55`;
  const activeTextColor = isWhiteAccent ? '#ffffff' : accentColor;
  const activeIconColor = isWhiteAccent ? '#ffffff' : accentColor;

  return (
    <HapticPressable
      onPress={() => onValueChange(value)}
      hapticType="selection"
      style={[
        styles.trigger,
        isActive && [
          styles.triggerActive,
          {
            backgroundColor: activeBg,
            borderColor: activeBorder,
          },
        ],
        style,
      ]}
    >
      {icon ? (
        <Icon
          name={icon}
          size={14}
          color={isActive ? activeIconColor : 'rgba(235, 235, 245, 0.45)'}
          style={{ marginRight: 5 }}
        />
      ) : (
        isActive && (
          <View
            style={[
              styles.dot,
              { backgroundColor: activeTextColor },
            ]}
          />
        )
      )}
      <Text
        style={[
          styles.label,
          { color: isActive ? activeTextColor : 'rgba(235, 235, 245, 0.55)' },
          isActive && styles.labelActive,
        ]}
        numberOfLines={1}
      >
        {label}
      </Text>
    </HapticPressable>
  );
}

// ── TabsContent ───────────────────────────────────────────────────────────────
interface TabsContentProps {
  value: string;
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}
export function TabsContent({ value, children, style }: TabsContentProps) {
  const { value: activeValue } = useContext(TabsCtx);
  if (activeValue !== value) return null;
  return <View style={style}>{children}</View>;
}

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: {
    width: '100%',
  },
  listContainer: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#18181f',
    borderRadius: 14,
    padding: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  trigger: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 9,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'transparent',
    minHeight: 38,
    marginHorizontal: 1,
  },
  triggerActive: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 2,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  label: {
    fontSize: 13,
    fontWeight: '500',
    letterSpacing: 0.1,
  },
  labelActive: {
    fontWeight: '700',
  },
});

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useSettingsStore } from '../../store/useSettingsStore';
import { useBudgetStore } from '../../store/useBudgetStore';
import { usePrivacyStore } from '../../store/usePrivacyStore';
import { HapticPressable } from '../ui/HapticPressable';
import { Icon } from '../ui/Icon';
import { getGreeting, formatMonthYear } from '../../utils/formatters';

interface GreetingHeaderProps {
  onPressMonthPicker: () => void;
}

export const GreetingHeader: React.FC<GreetingHeaderProps> = ({
  onPressMonthPicker,
}) => {
  const router = useRouter();
  const userName = useSettingsStore((state) => state.settings.userName);
  const selectedMonth = useBudgetStore((state) => state.selectedMonth);
  const isLocked = usePrivacyStore((state) => state.isLocked);
  const toggleLock = usePrivacyStore((state) => state.toggleLock);

  const greetingInfo = getGreeting();

  return (
    <View style={styles.container}>
      <View style={styles.topRow}>
        <View style={styles.greetingBlock}>
          <Text style={styles.greetingSubtitle}>{greetingInfo.greeting}</Text>
          <Text style={styles.greetingTitle} numberOfLines={1}>
            {userName}
          </Text>
        </View>

        <View style={styles.actionsRow}>
          {/* Add Transaction Button */}
          <HapticPressable
            onPress={() => router.push('/modal/add-transaction')}
            hapticType="medium"
            style={styles.addBtn}
          >
            <Icon name="Plus" size={20} color="#ffffff" />
          </HapticPressable>

          {/* Privacy Eye Toggle */}
          <HapticPressable
            onPress={toggleLock}
            hapticType="medium"
            style={[
              styles.iconBtn,
              isLocked && styles.iconBtnActive,
            ]}
          >
            <Icon
              name={isLocked ? 'EyeOff' : 'Eye'}
              size={18}
              color={isLocked ? '#eb0028' : '#ffffff'}
            />
          </HapticPressable>
        </View>
      </View>

      <View style={styles.monthRow}>
        <HapticPressable
          onPress={onPressMonthPicker}
          hapticType="light"
          style={styles.monthBadge}
        >
          <Icon name="Calendar" size={13} color="#eb0028" style={{ marginRight: 6 }} />
          <Text style={styles.monthText}>{formatMonthYear(selectedMonth)}</Text>
          <Icon name="ChevronDown" size={12} color="rgba(235, 235, 245, 0.5)" style={{ marginLeft: 4 }} />
        </HapticPressable>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 20,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  greetingBlock: {
    flex: 1,
    marginRight: 12,
  },
  greetingSubtitle: {
    fontSize: 13,
    fontWeight: '500',
    color: 'rgba(235, 235, 245, 0.6)',
    letterSpacing: 0.2,
  },
  greetingTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: -0.5,
    marginTop: 2,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  addBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#eb0028',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#eb0028',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 4,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1c1c1e',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBtnActive: {
    backgroundColor: 'rgba(235, 0, 40, 0.15)',
    borderColor: 'rgba(235, 0, 40, 0.3)',
  },
  monthRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  monthBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1c1c22',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 14,
    gap: 6,
  },
  monthText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#ffffff',
  },
});

import React from 'react';
import { View, Text, StyleSheet, ViewStyle, StyleProp, Pressable } from 'react-native';
import { triggerHaptic } from '../../utils/haptics';
import { Icon } from './Icon';

export interface SegmentOption<T extends string = string> {
  value: T;
  label: string;
  icon?: string;
  activeColor?: string;
}

interface SegmentedControlProps<T extends string = string> {
  options: SegmentOption<T>[];
  selectedValue: T;
  onSelect: (value: T) => void;
  style?: StyleProp<ViewStyle>;
  size?: 'sm' | 'md';
}

export function SegmentedControl<T extends string = string>({
  options,
  selectedValue,
  onSelect,
  style,
  size = 'md',
}: SegmentedControlProps<T>) {
  return (
    <View style={[styles.container, style]}>
      {options.map((opt) => {
        const isSelected = opt.value === selectedValue;
        const activeColor = opt.activeColor || '#eb0028';

        return (
          <Pressable
            key={opt.value}
            onPress={() => {
              triggerHaptic.selection();
              onSelect(opt.value);
            }}
            style={({ pressed }) => [
              styles.segment,
              size === 'sm' ? styles.segment_sm : styles.segment_md,
              isSelected
                ? { backgroundColor: activeColor }
                : pressed
                ? styles.segmentPressed
                : null,
            ]}
          >
            {opt.icon && (
              <Icon
                name={opt.icon}
                size={size === 'sm' ? 13 : 15}
                color={isSelected ? '#ffffff' : 'rgba(235, 235, 245, 0.5)'}
                style={{ marginRight: 5 }}
              />
            )}
            <Text
              style={[
                styles.label,
                size === 'sm' ? styles.label_sm : styles.label_md,
                isSelected ? styles.labelSelected : styles.labelUnselected,
              ]}
              numberOfLines={1}
            >
              {opt.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#1c1c22',
    borderRadius: 14,
    padding: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    width: '100%',
  },
  segment: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    paddingHorizontal: 10,
  },
  segment_sm: {
    paddingVertical: 8,
    minHeight: 36,
  },
  segment_md: {
    paddingVertical: 11,
    minHeight: 46,
  },
  segmentPressed: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
  },
  label: {
    fontWeight: '500',
    textAlign: 'center',
  },
  label_sm: {
    fontSize: 13,
  },
  label_md: {
    fontSize: 14,
  },
  labelSelected: {
    fontWeight: '700',
    color: '#ffffff',
  },
  labelUnselected: {
    color: 'rgba(235, 235, 245, 0.5)',
  },
});

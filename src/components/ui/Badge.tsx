import React from 'react';
import { View, Text, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import { Icon } from './Icon';

export type BadgeVariant =
  | 'healthy'
  | 'moderate'
  | 'warning'
  | 'exceeded'
  | 'income'
  | 'expense'
  | 'neutral'
  | 'primary';

interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
  icon?: string;
  size?: 'sm' | 'md';
  style?: StyleProp<ViewStyle>;
}

export const Badge: React.FC<BadgeProps> = ({
  label,
  variant = 'neutral',
  icon,
  size = 'md',
  style,
}) => {
  const getBadgeColors = () => {
    switch (variant) {
      case 'healthy':
      case 'income':
        return { bg: 'rgba(48, 209, 88, 0.15)', text: '#30d158', border: 'rgba(48, 209, 88, 0.3)' };
      case 'moderate':
        return { bg: 'rgba(10, 132, 255, 0.15)', text: '#0a84ff', border: 'rgba(10, 132, 255, 0.3)' };
      case 'warning':
        return { bg: 'rgba(255, 159, 10, 0.15)', text: '#ff9f0a', border: 'rgba(255, 159, 10, 0.3)' };
      case 'exceeded':
      case 'expense':
        return { bg: 'rgba(235, 0, 40, 0.15)', text: '#eb0028', border: 'rgba(235, 0, 40, 0.3)' };
      case 'primary':
        return { bg: 'rgba(235, 0, 40, 0.15)', text: '#eb0028', border: 'rgba(235, 0, 40, 0.3)' };
      default:
        return { bg: 'rgba(255, 255, 255, 0.08)', text: 'rgba(235, 235, 245, 0.7)', border: 'rgba(255, 255, 255, 0.12)' };
    }
  };

  const colors = getBadgeColors();
  const iconSize = size === 'sm' ? 11 : 13;

  return (
    <View
      style={[
        styles.badge,
        size === 'sm' ? styles.badge_sm : styles.badge_md,
        { backgroundColor: colors.bg, borderColor: colors.border },
        style,
      ]}
    >
      {icon && (
        <Icon
          name={icon}
          size={iconSize}
          color={colors.text}
          style={{ marginRight: 4 }}
        />
      )}
      <Text
        style={[
          styles.label,
          size === 'sm' ? styles.label_sm : styles.label_md,
          { color: colors.text },
        ]}
        numberOfLines={1}
      >
        {label}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    borderWidth: 1,
    alignSelf: 'flex-start',
    flexShrink: 0,
  },
  badge_sm: {
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  badge_md: {
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  label: {
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  label_sm: {
    fontSize: 11,
  },
  label_md: {
    fontSize: 12,
  },
});

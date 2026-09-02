import React from 'react';
import {
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
  StyleProp,
  View,
} from 'react-native';
import { HapticPressable } from './HapticPressable';
import { Icon } from './Icon';

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: string;
  iconPosition?: 'left' | 'right';
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  icon,
  iconPosition = 'left',
  loading = false,
  disabled = false,
  fullWidth = false,
  style,
  textStyle,
}) => {
  const getContainerStyle = () => {
    return [
      styles.button,
      styles[variant],
      styles[`size_${size}`],
      fullWidth && styles.fullWidth,
      disabled && styles.disabled,
      style,
    ];
  };

  const getTextColor = () => {
    if (variant === 'ghost') return '#a1a1aa';
    if (variant === 'secondary') return '#ffffff';
    return '#ffffff';
  };

  const iconSize = size === 'sm' ? 16 : size === 'lg' ? 20 : 18;

  return (
    <HapticPressable
      onPress={onPress}
      disabled={disabled || loading}
      hapticType={variant === 'primary' || variant === 'danger' ? 'medium' : 'light'}
      style={getContainerStyle() as any}
    >
      {loading ? (
        <ActivityIndicator color={getTextColor()} size="small" />
      ) : (
        <View style={styles.contentRow}>
          {icon && iconPosition === 'left' && (
            <Icon
              name={icon}
              size={iconSize}
              color={getTextColor()}
              style={{ marginRight: 6 }}
            />
          )}
          <Text
            style={[
              styles.text,
              styles[`textSize_${size}`],
              { color: getTextColor() },
              textStyle,
            ]}
          >
            {title}
          </Text>
          {icon && iconPosition === 'right' && (
            <Icon
              name={icon}
              size={iconSize}
              color={getTextColor()}
              style={{ marginLeft: 6 }}
            />
          )}
        </View>
      )}
    </HapticPressable>
  );
};

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    overflow: 'hidden',
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullWidth: {
    width: '100%',
  },
  disabled: {
    opacity: 0.45,
  },
  // Variants
  primary: {
    backgroundColor: '#eb0028',
    shadowColor: '#eb0028',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 4,
  },
  secondary: {
    backgroundColor: '#1c1c22',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  danger: {
    backgroundColor: '#eb0028',
  },
  ghost: {
    backgroundColor: 'transparent',
  },
  // Sizes
  size_sm: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    minHeight: 36,
  },
  size_md: {
    paddingHorizontal: 18,
    paddingVertical: 12,
    minHeight: 48,
  },
  size_lg: {
    paddingHorizontal: 24,
    paddingVertical: 14,
    minHeight: 52,
  },
  text: {
    fontWeight: '600',
    textAlign: 'center',
  },
  textSize_sm: {
    fontSize: 13,
  },
  textSize_md: {
    fontSize: 15,
  },
  textSize_lg: {
    fontSize: 17,
  },
});

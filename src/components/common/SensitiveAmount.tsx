import React from 'react';
import { Text, TextStyle, StyleProp } from 'react-native';
import { usePrivacyStore } from '../../store/usePrivacyStore';
import { useSettingsStore } from '../../store/useSettingsStore';
import { formatCurrency } from '../../utils/formatters';
import { PrivacyService } from '../../services/privacyService';

interface SensitiveAmountProps {
  amountPaise: number;
  currencyCode?: string;
  style?: StyleProp<TextStyle>;
  maskChar?: string;
  prefix?: string;
  compact?: boolean;
}

/**
 * Renders monetary amount with universal privacy masking
 * Displays "₹••••••" when Privacy mode / App lock is active
 */
export const SensitiveAmount: React.FC<SensitiveAmountProps> = ({
  amountPaise,
  currencyCode,
  style,
  maskChar = '•',
  prefix = '',
  compact = false,
}) => {
  const isLocked = usePrivacyStore((state) => state.isLocked);
  const defaultCurrency = useSettingsStore((state) => state.settings.currency);

  const activeCurrency = (currencyCode || defaultCurrency) as any;
  const formattedActual = formatCurrency(amountPaise, activeCurrency, { compact });

  return (
    <Text style={style} numberOfLines={1} adjustsFontSizeToFit>
      {prefix}{formattedActual}
    </Text>
  );
};

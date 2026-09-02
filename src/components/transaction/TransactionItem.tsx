import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Transaction, Category } from '../../types';
import { HapticPressable } from '../ui/HapticPressable';
import { Icon } from '../ui/Icon';
import { SensitiveAmount } from '../common/SensitiveAmount';
import { formatDate } from '../../utils/formatters';

interface TransactionItemProps {
  transaction: Transaction;
  category?: Category;
  onPress: () => void;
  onLongPress?: () => void;
  showDivider?: boolean;
}

export const TransactionItem: React.FC<TransactionItemProps> = ({
  transaction,
  category,
  onPress,
  onLongPress,
  showDivider = false,
}) => {
  const isIncome = transaction.type === 'income';
  const catColor = category?.color || (isIncome ? '#30d158' : '#eb0028');
  const catIcon = category?.icon || (isIncome ? 'ArrowDownLeft' : 'ShoppingBag');

  return (
    <HapticPressable
      onPress={onPress}
      onLongPress={onLongPress}
      hapticType="light"
      style={styles.cell}
    >
      {/* 1. Left Icon Container (Apple 40x40 circle) */}
      <View
        style={[
          styles.iconCircle,
          { backgroundColor: `${catColor}20` },
        ]}
      >
        <Icon name={catIcon} size={18} color={catColor} />
      </View>

      {/* 2. Middle Content (Description & Subtitle) */}
      <View style={styles.textContainer}>
        <Text style={styles.description} numberOfLines={1}>
          {transaction.description || category?.name || 'Transaction'}
        </Text>
        <View style={styles.subtitleRow}>
          <Text style={styles.categoryName} numberOfLines={1}>
            {category?.name || (isIncome ? 'Income' : 'Expense')}
          </Text>
          <Text style={styles.dotSeparator}>•</Text>
          <Text style={styles.dateText}>
            {formatDate(transaction.date, 'short')}
          </Text>
          {transaction.isRecurring && (
            <>
              <Text style={styles.dotSeparator}>•</Text>
              <Icon name="Repeat" size={10} color="#0a84ff" />
            </>
          )}
        </View>
      </View>

      {/* 3. Right Element (Amount) */}
      <View style={styles.amountContainer}>
        <SensitiveAmount
          amountPaise={transaction.amount}
          style={[
            styles.amountText,
            { color: isIncome ? '#30d158' : '#ffffff' },
          ]}
          prefix={isIncome ? '+' : '-'}
        />
      </View>
    </HapticPressable>
  );
};

const styles = StyleSheet.create({
  // Outer row — explicit flex:row so icon/text/amount are always horizontal
  cell: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: 'transparent',
  },

  // Left: colored icon circle
  iconCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    flexShrink: 0,
  },

  // Middle: description + subtitle — fills remaining space with padding
  textContainer: {
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'center',
    paddingVertical: 2,
    paddingHorizontal: 6,
    marginRight: 8,
  },

  description: {
    fontSize: 15,
    fontWeight: '600',
    color: '#ffffff',
    letterSpacing: -0.2,
    marginBottom: 3,
  },

  // Subtitle: category • date [• repeat icon] — explicit flex-row
  subtitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'nowrap',
  },
  categoryName: {
    fontSize: 12,
    color: 'rgba(235, 235, 245, 0.55)',
    flexShrink: 1,
  },
  dotSeparator: {
    fontSize: 11,
    color: 'rgba(235, 235, 245, 0.28)',
    marginHorizontal: 5,
  },
  dateText: {
    fontSize: 12,
    color: 'rgba(235, 235, 245, 0.45)',
  },

  // Right: amount — flex row container aligned to end
  amountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingLeft: 8,
    flexShrink: 0,
  },
  amountText: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
});

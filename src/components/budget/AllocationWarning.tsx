import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Icon } from '../ui/Icon';
import { SensitiveAmount } from '../common/SensitiveAmount';

interface AllocationWarningProps {
  overAllocatedAmountPaise: number;
}

export const AllocationWarning: React.FC<AllocationWarningProps> = ({
  overAllocatedAmountPaise,
}) => {
  if (overAllocatedAmountPaise <= 0) return null;

  return (
    <View style={styles.banner}>
      <Icon name="AlertTriangle" size={18} color="#f59e0b" style={styles.icon} />
      <View style={styles.textContainer}>
        <Text style={styles.title}>Budget Exceeds Monthly Income</Text>
        <View style={styles.descRow}>
          <Text style={styles.desc}>Allocated limits exceed income by </Text>
          <SensitiveAmount
            amountPaise={overAllocatedAmountPaise}
            style={styles.amount}
          />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
    borderRadius: 16,
    padding: 14,
    marginHorizontal: 20,
    marginBottom: 16,
  },
  icon: {
    marginRight: 10,
    marginTop: 2,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
    color: '#f59e0b',
    marginBottom: 2,
  },
  descRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  desc: {
    fontSize: 12,
    color: '#cbd5e1',
  },
  amount: {
    fontSize: 12,
    fontWeight: '700',
    color: '#f59e0b',
  },
});

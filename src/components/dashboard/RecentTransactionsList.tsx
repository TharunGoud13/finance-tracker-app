import React, { Fragment } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Transaction, Category } from '../../types';
import { TransactionItem } from '../transaction/TransactionItem';
import { HapticPressable } from '../ui/HapticPressable';
import { Icon } from '../ui/Icon';
import { EmptyState } from '../common/EmptyState';

interface RecentTransactionsListProps {
  transactions: Transaction[];
  categories: Category[];
  onSelectTransaction: (transaction: Transaction) => void;
}

export const RecentTransactionsList: React.FC<RecentTransactionsListProps> = ({
  transactions,
  categories,
  onSelectTransaction,
}) => {
  const router = useRouter();
  const categoryMap = new Map(categories.map((c) => [c.id, c]));
  const recentTransactions = transactions.slice(0, 5);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Recent Activity</Text>
        {transactions.length > 0 && (
          <HapticPressable
            onPress={() => router.push('/(tabs)/transactions')}
            hapticType="light"
            style={styles.viewAllBtn}
          >
            <Text style={styles.viewAllText}>View All</Text>
            <Icon name="ChevronRight" size={14} color="#0a84ff" />
          </HapticPressable>
        )}
      </View>

      {recentTransactions.length === 0 ? (
        <EmptyState
          icon="Receipt"
          title="No Recent Transactions"
          message="Record your daily expenses or income to track where your money goes."
          actionTitle="Add Transaction"
          onAction={() => router.push('/modal/add-transaction')}
        />
      ) : (
        <View style={styles.listCard}>
          {recentTransactions.map((tx, index) => (
            <Fragment key={tx.id}>
              <TransactionItem
                transaction={tx}
                category={categoryMap.get(tx.categoryId)}
                onPress={() => onSelectTransaction(tx)}
              />
              {index < recentTransactions.length - 1 && (
                <View style={styles.separator} />
              )}
            </Fragment>
          ))}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    color: '#ffffff',
    letterSpacing: -0.3,
  },
  viewAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 6,
  },
  viewAllText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0a84ff',
  },
  listCard: {
    backgroundColor: '#121216',
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    marginLeft: 72,
    marginHorizontal: 16,
  },
});

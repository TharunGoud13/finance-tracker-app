import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTransactionStore } from '../../src/store/useTransactionStore';
import { useBudgetStore } from '../../src/store/useBudgetStore';
import { TransactionForm } from '../../src/components/forms/TransactionForm';
import { ScreenHeader } from '../../src/components/common/ScreenHeader';
import { DeleteConfirmDialog } from '../../src/components/transaction/DeleteConfirmDialog';
import { HapticPressable } from '../../src/components/ui/HapticPressable';
import { Icon } from '../../src/components/ui/Icon';
import { triggerHaptic } from '../../src/utils/haptics';

export default function EditTransactionModal() {
  const router = useRouter();
  const { transactionId } = useLocalSearchParams<{ transactionId: string }>();

  const transactions = useTransactionStore((state) => state.transactions);
  const updateTransaction = useTransactionStore((state) => state.updateTransaction);
  const deleteTransaction = useTransactionStore((state) => state.deleteTransaction);
  const categories = useBudgetStore((state) => state.categories);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const targetTx = transactions.find((tx) => tx.id === transactionId);

  if (!targetTx) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar style="light" />
        <ScreenHeader title="Transaction Not Found" showBack onBack={() => router.back()} />
      </SafeAreaView>
    );
  }

  const handleUpdate = async (updatedData: any) => {
    setIsSubmitting(true);
    try {
      await updateTransaction(targetTx.id, updatedData);
      triggerHaptic.success();
      router.back();
    } catch (e) {
      console.error('Error updating transaction:', e);
      triggerHaptic.error();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    setShowDeleteConfirm(false);
    await deleteTransaction(targetTx.id);
    triggerHaptic.medium();
    router.back();
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <StatusBar style="light" />
      <View style={styles.container}>
        <ScreenHeader
          title="Edit Transaction"
          showBack
          onBack={() => router.back()}
          rightAction={
            <HapticPressable
              onPress={() => setShowDeleteConfirm(true)}
              hapticType="heavy"
              style={styles.deleteHeaderBtn}
            >
              <Icon name="Trash2" size={18} color="#eb0028" />
            </HapticPressable>
          }
        />
        <TransactionForm
          initialData={targetTx}
          categories={categories}
          onSubmit={handleUpdate}
          onCancel={() => router.back()}
          isSubmitting={isSubmitting}
        />

        <DeleteConfirmDialog
          visible={showDeleteConfirm}
          title="Delete Transaction?"
          message={`Are you sure you want to delete "${targetTx.description || 'this transaction'}"?`}
          onCancel={() => setShowDeleteConfirm(false)}
          onConfirm={handleDelete}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#000000',
  },
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  deleteHeaderBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(235, 0, 40, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

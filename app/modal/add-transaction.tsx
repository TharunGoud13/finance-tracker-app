import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { useTransactionStore } from '../../src/store/useTransactionStore';
import { useBudgetStore } from '../../src/store/useBudgetStore';
import { TransactionForm } from '../../src/components/forms/TransactionForm';
import { ScreenHeader } from '../../src/components/common/ScreenHeader';
import { triggerHaptic } from '../../src/utils/haptics';

export default function AddTransactionModal() {
  const router = useRouter();
  const addTransaction = useTransactionStore((state) => state.addTransaction);
  const categories = useBudgetStore((state) => state.categories);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (txData: any) => {
    setIsSubmitting(true);
    try {
      await addTransaction(txData);
      triggerHaptic.success();
      router.back();
    } catch (e) {
      console.error('Error adding transaction:', e);
      triggerHaptic.error();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <StatusBar style="light" />
      <View style={styles.container}>
        <ScreenHeader
          title="New Transaction"
          subtitle="Record expense or income"
          showBack
          onBack={() => router.back()}
        />
        <TransactionForm
          categories={categories}
          onSubmit={handleSubmit}
          onCancel={() => router.back()}
          isSubmitting={isSubmitting}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#090D16',
  },
  container: {
    flex: 1,
    backgroundColor: '#090D16',
  },
});

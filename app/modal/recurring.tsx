import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { useRecurringStore } from '../../src/store/useRecurringStore';
import { useBudgetStore } from '../../src/store/useBudgetStore';
import { useSettingsStore } from '../../src/store/useSettingsStore';
import { RecurringTransaction, RecurringFrequency, TransactionType } from '../../src/types';
import { ScreenHeader } from '../../src/components/common/ScreenHeader';
import { Card } from '../../src/components/ui/Card';
import { Switch } from '../../src/components/ui/Switch';
import { Button } from '../../src/components/ui/Button';
import { Icon } from '../../src/components/ui/Icon';
import { SegmentedControl } from '../../src/components/ui/SegmentedControl';
import { SensitiveAmount } from '../../src/components/common/SensitiveAmount';
import { EmptyState } from '../../src/components/common/EmptyState';
import { parseInputToPaise } from '../../src/utils/formatters';
import { AppDialog } from '../../src/components/ui/AppDialog';

export default function RecurringModal() {
  const router = useRouter();
  const recurring = useRecurringStore((state) => state.recurring);
  const addRecurring = useRecurringStore((state) => state.addRecurring);
  const toggleRecurringActive = useRecurringStore((state) => state.toggleRecurringActive);
  const deleteRecurring = useRecurringStore((state) => state.deleteRecurring);
  const categories = useBudgetStore((state) => state.categories);
  const currency = useSettingsStore((state) => state.settings.currency);

  const [isAddModalVisible, setIsAddModalVisible] = useState(false);
  const [title, setTitle] = useState('');
  const [amountInput, setAmountInput] = useState('');
  const [type, setType] = useState<TransactionType>('expense');
  const [frequency, setFrequency] = useState<RecurringFrequency>('monthly');

  const [dialog, setDialog] = useState<{
    visible: boolean; title: string; message?: string;
    icon?: string; iconColor?: string;
    actions: { label: string; onPress: () => void; style?: 'default' | 'cancel' | 'destructive' }[];
  }>({ visible: false, title: '', actions: [] });

  const showAlert = (title: string, message?: string) =>
    setDialog({ visible: true, title, message, icon: 'AlertCircle', iconColor: '#eb0028',
      actions: [{ label: 'OK', onPress: () => setDialog((d) => ({ ...d, visible: false })), style: 'cancel' }] });

  const showConfirm = (title: string, message: string, onConfirm: () => void) =>
    setDialog({ visible: true, title, message, icon: 'Trash2', iconColor: '#ff453a',
      actions: [
        { label: 'Cancel', onPress: () => setDialog((d) => ({ ...d, visible: false })), style: 'cancel' },
        { label: 'Delete', onPress: () => { setDialog((d) => ({ ...d, visible: false })); onConfirm(); }, style: 'destructive' },
      ] });

  const categoryMap = new Map(categories.map((c) => [c.id, c]));

  const handleCreateRecurring = async () => {
    if (!title.trim()) {
      showAlert('Error', 'Please enter a title');
      return;
    }
    const paise = parseInputToPaise(amountInput, currency);
    if (paise <= 0) {
      showAlert('Error', 'Amount must be greater than 0');
      return;
    }
    const catId = categories.find((c) => c.type === type)?.id ?? '';

    await addRecurring({
      title: title.trim(),
      amount: paise,
      categoryId: catId,
      type,
      frequency,
      startDate: new Date().toISOString().split('T')[0],
      nextDueDate: new Date().toISOString().split('T')[0],
      active: true,
    });

    setIsAddModalVisible(false);
    setTitle('');
    setAmountInput('');
  };

  const handleDelete = (item: RecurringTransaction) => {
    showConfirm('Delete Recurring Template', `Delete "${item.title}"?`, () => deleteRecurring(item.id));
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <StatusBar style="light" />
      <View style={styles.container}>
        <ScreenHeader
          title="Recurring"
          subtitle="Fixed bills, subscriptions & salary"
          showBack
          onBack={() => router.back()}
          rightAction={
            <Button
              title="New"
              icon="Plus"
              variant="primary"
              size="sm"
              onPress={() => setIsAddModalVisible(true)}
            />
          }
        />

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
          {recurring.length === 0 ? (
            <EmptyState
              icon="Repeat"
              title="No Recurring Transactions"
              message="Add repeating transactions like salary, rent, Netflix, or SIP investments."
              actionTitle="Add Recurring"
              onAction={() => setIsAddModalVisible(true)}
            />
          ) : (
            recurring.map((item) => {
              const cat = categoryMap.get(item.categoryId);
              const isIncome = item.type === 'income';

              return (
                <Card key={item.id} style={styles.card}>
                  <View style={styles.row}>
                    <View style={styles.left}>
                      <View
                        style={[
                          styles.iconCircle,
                          {
                            backgroundColor: isIncome
                              ? 'rgba(48, 209, 88, 0.15)'
                              : 'rgba(235, 0, 40, 0.15)',
                          },
                        ]}
                      >
                        <Icon
                          name={cat?.icon || (isIncome ? 'ArrowDownLeft' : 'ArrowUpRight')}
                          size={18}
                          color={isIncome ? '#30d158' : '#eb0028'}
                        />
                      </View>
                      <View style={styles.cardTextContainer}>
                        <Text style={styles.title}>{item.title}</Text>
                        <Text style={styles.subText}>
                          {item.frequency.charAt(0).toUpperCase() + item.frequency.slice(1)} • Next: {item.nextDueDate}
                        </Text>
                      </View>
                    </View>

                    <Switch
                      value={item.active}
                      onValueChange={() => toggleRecurringActive(item.id)}
                      activeColor={isIncome ? '#30d158' : '#eb0028'}
                    />
                  </View>

                  <View style={styles.bottomRow}>
                    <SensitiveAmount
                      amountPaise={item.amount}
                      style={[
                        styles.amount,
                        { color: isIncome ? '#30d158' : '#ffffff' },
                      ]}
                    />
                    <Button
                      title="Delete"
                      variant="ghost"
                      size="sm"
                      icon="Trash2"
                      onPress={() => handleDelete(item)}
                    />
                  </View>
                </Card>
              );
            })
          )}
        </ScrollView>

        {/* Add Recurring Modal */}
        <Modal
          visible={isAddModalVisible}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={() => setIsAddModalVisible(false)}
        >
          <SafeAreaView style={{ flex: 1, backgroundColor: '#000000' }}>
            <StatusBar style="light" />
            <ScreenHeader
              title="New Recurring Item"
              showBack
              onBack={() => setIsAddModalVisible(false)}
            />
            <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 48 }}>
              <SegmentedControl
                options={[
                  { value: 'expense', label: 'Expense', activeColor: '#eb0028' },
                  { value: 'income', label: 'Income', activeColor: '#30d158' },
                ]}
                selectedValue={type}
                onSelect={(val) => setType(val as any)}
                style={{ marginBottom: 16 }}
              />

              <View style={styles.formSection}>
                <Text style={styles.formLabel}>TITLE</Text>
                <TextInput
                  value={title}
                  onChangeText={setTitle}
                  placeholder="e.g. Netflix, Gym, Apartment Rent"
                  placeholderTextColor="rgba(235, 235, 245, 0.35)"
                  style={styles.formInput}
                />
              </View>

              <View style={styles.formSection}>
                <Text style={styles.formLabel}>AMOUNT</Text>
                <TextInput
                  value={amountInput}
                  onChangeText={setAmountInput}
                  placeholder="0"
                  placeholderTextColor="rgba(235, 235, 245, 0.35)"
                  keyboardType="numeric"
                  style={styles.formInput}
                />
              </View>

              <View style={styles.formSection}>
                <Text style={styles.formLabel}>FREQUENCY</Text>
                <SegmentedControl
                  size="sm"
                  options={[
                    { value: 'daily', label: 'Daily' },
                    { value: 'weekly', label: 'Weekly' },
                    { value: 'monthly', label: 'Monthly' },
                    { value: 'yearly', label: 'Yearly' },
                  ]}
                  selectedValue={frequency}
                  onSelect={(val) => setFrequency(val as any)}
                />
              </View>

              <View style={{ flexDirection: 'row', gap: 12, marginTop: 24 }}>
                <Button
                  title="Cancel"
                  variant="secondary"
                  onPress={() => setIsAddModalVisible(false)}
                  style={{ flex: 1 }}
                />
                <Button
                  title="Save Template"
                  variant="primary"
                  onPress={handleCreateRecurring}
                  style={{ flex: 2 }}
                />
              </View>
            </ScrollView>
          </SafeAreaView>
        </Modal>
      </View>

      {/* Universal in-app dialog */}
      <AppDialog
        visible={dialog.visible}
        title={dialog.title}
        message={dialog.message}
        icon={dialog.icon}
        iconColor={dialog.iconColor}
        actions={dialog.actions}
        onRequestClose={() => setDialog((d) => ({ ...d, visible: false }))}
      />
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
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 48,
    gap: 12,
  },
  card: {
    padding: 16,
    borderRadius: 20,
    backgroundColor: '#121216',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
  },
  iconCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    flexShrink: 0,
  },
  cardTextContainer: {
    flex: 1,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    color: '#ffffff',
    letterSpacing: -0.2,
  },
  subText: {
    fontSize: 12,
    color: 'rgba(235, 235, 245, 0.5)',
    marginTop: 3,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.06)',
  },
  amount: {
    fontSize: 16,
    fontWeight: '700',
  },
  formSection: {
    marginBottom: 20,
  },
  formLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(235, 235, 245, 0.45)',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  formInput: {
    backgroundColor: '#1c1c22',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: '#ffffff',
    fontSize: 15,
  },
});

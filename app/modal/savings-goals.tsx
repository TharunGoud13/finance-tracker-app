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
import { useGoalStore } from '../../src/store/useGoalStore';
import { useFinancialSummary } from '../../src/hooks/useFinancialSummary';
import { useSettingsStore } from '../../src/store/useSettingsStore';
import { SavingsGoal } from '../../src/types';
import { ScreenHeader } from '../../src/components/common/ScreenHeader';
import { Card } from '../../src/components/ui/Card';
import { ProgressBar } from '../../src/components/ui/ProgressBar';
import { Button } from '../../src/components/ui/Button';
import { Icon } from '../../src/components/ui/Icon';
import { HapticPressable } from '../../src/components/ui/HapticPressable';
import { SensitiveAmount } from '../../src/components/common/SensitiveAmount';
import { EmptyState } from '../../src/components/common/EmptyState';
import { parseInputToPaise, formatDate } from '../../src/utils/formatters';
import { AppDialog } from '../../src/components/ui/AppDialog';

export default function SavingsGoalsModal() {
  const router = useRouter();
  const goals = useGoalStore((state) => state.goals);
  const addGoal = useGoalStore((state) => state.addGoal);
  const deleteGoal = useGoalStore((state) => state.deleteGoal);
  const addFundsToGoal = useGoalStore((state) => state.addFundsToGoal);
  const withdrawFundsFromGoal = useGoalStore((state) => state.withdrawFundsFromGoal);
  const currency = useSettingsStore((state) => state.settings.currency);

  const summary = useFinancialSummary();

  // Dialog States
  const [isAddGoalModalVisible, setIsAddGoalModalVisible] = useState(false);
  const [fundsModalGoal, setFundsModalGoal] = useState<SavingsGoal | null>(null);
  const [fundsActionType, setFundsActionType] = useState<'deposit' | 'withdraw'>('deposit');
  const [fundsAmountInput, setFundsAmountInput] = useState('');

  const [dialog, setDialog] = useState<{
    visible: boolean; title: string; message?: string;
    icon?: string; iconColor?: string;
    actions: { label: string; onPress: () => void; style?: 'default' | 'cancel' | 'destructive' }[];
  }>({ visible: false, title: '', actions: [] });

  const showAlert = (title: string, message?: string, icon = 'AlertCircle', iconColor = '#eb0028') =>
    setDialog({ visible: true, title, message, icon, iconColor,
      actions: [{ label: 'OK', onPress: () => setDialog((d) => ({ ...d, visible: false })), style: 'cancel' }] });

  const showConfirm = (title: string, message: string, onConfirm: () => void) =>
    setDialog({ visible: true, title, message, icon: 'Trash2', iconColor: '#ff453a',
      actions: [
        { label: 'Cancel', onPress: () => setDialog((d) => ({ ...d, visible: false })), style: 'cancel' },
        { label: 'Delete', onPress: () => { setDialog((d) => ({ ...d, visible: false })); onConfirm(); }, style: 'destructive' },
      ] });

  // Form State for new goal
  const [newTitle, setNewTitle] = useState('');
  const [newTargetInput, setNewTargetInput] = useState('');
  const [newCurrentInput, setNewCurrentInput] = useState('');
  const [newTargetDate, setNewTargetDate] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() + 6);
    return d.toISOString().slice(0, 10);
  });

  const handleCreateGoal = async () => {
    if (!newTitle.trim()) {
      showAlert('Validation Error', 'Please enter a goal title');
      return;
    }
    const targetPaise = parseInputToPaise(newTargetInput, currency);
    if (targetPaise <= 0) {
      showAlert('Validation Error', 'Target amount must be greater than 0');
      return;
    }
    const currentPaise = parseInputToPaise(newCurrentInput, currency);

    await addGoal({
      title: newTitle.trim(),
      targetAmount: targetPaise,
      currentAmount: currentPaise,
      targetDate: newTargetDate,
      icon: 'Shield',
      color: '#30d158',
    });

    setIsAddGoalModalVisible(false);
    setNewTitle('');
    setNewTargetInput('');
    setNewCurrentInput('');
  };

  const handleFundsSubmit = async () => {
    if (!fundsModalGoal) return;
    const amountPaise = parseInputToPaise(fundsAmountInput, currency);
    if (amountPaise <= 0) return;

    if (fundsActionType === 'deposit') {
      await addFundsToGoal(fundsModalGoal.id, amountPaise);
    } else {
      await withdrawFundsFromGoal(fundsModalGoal.id, amountPaise);
    }

    setFundsModalGoal(null);
    setFundsAmountInput('');
  };

  const handleDeleteGoal = (goal: SavingsGoal) => {
    showConfirm(
      'Delete Goal',
      `Are you sure you want to delete "${goal.title}"?`,
      () => deleteGoal(goal.id)
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <StatusBar style="light" />
      <View style={styles.container}>
        <ScreenHeader
          title="Savings Goals"
          subtitle="Track targets & milestones"
          showBack
          onBack={() => router.back()}
          rightAction={
            <Button
              title="New Goal"
              icon="Plus"
              variant="primary"
              size="sm"
              onPress={() => setIsAddGoalModalVisible(true)}
            />
          }
        />

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
          {goals.length === 0 ? (
            <EmptyState
              icon="Target"
              title="No Goals Yet"
              message="Create a savings goal to start building your emergency fund or saving for dreams."
              actionTitle="Create First Goal"
              onAction={() => setIsAddGoalModalVisible(true)}
            />
          ) : (
            goals.map((goal) => {
              const progress = Math.min(
                100,
                Math.round((goal.currentAmount / goal.targetAmount) * 100)
              );
              const remainingPaise = Math.max(0, goal.targetAmount - goal.currentAmount);

              let completionEstimate = '';
              if (summary.remainingBalancePaise > 0 && remainingPaise > 0) {
                const months = Math.ceil(remainingPaise / summary.remainingBalancePaise);
                completionEstimate = `At current savings rate: ~${months} mo${months > 1 ? 's' : ''} to completion`;
              }

              return (
                <Card key={goal.id} style={styles.goalCard}>
                  <View style={styles.goalTopRow}>
                    <View style={styles.goalLeft}>
                      <View
                        style={[
                          styles.goalIconCircle,
                          { backgroundColor: `${goal.color}22` },
                        ]}
                      >
                        <Icon name={goal.icon || 'Shield'} size={20} color={goal.color} />
                      </View>
                      <View>
                        <Text style={styles.goalTitle}>{goal.title}</Text>
                        {goal.targetDate && (
                          <Text style={styles.targetDateText}>
                            Target: {formatDate(goal.targetDate, 'short')}
                          </Text>
                        )}
                      </View>
                    </View>

                    <HapticPressable
                      onPress={() => handleDeleteGoal(goal)}
                      hapticType="heavy"
                      style={styles.trashBtn}
                    >
                      <Icon name="Trash2" size={15} color="rgba(235, 235, 245, 0.4)" />
                    </HapticPressable>
                  </View>

                  {/* Amounts & Progress */}
                  <View style={styles.amountProgressRow}>
                    <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
                      <SensitiveAmount
                        amountPaise={goal.currentAmount}
                        style={[styles.currentSavedText, { color: goal.color }]}
                      />
                      <Text style={styles.targetSlashText}> / </Text>
                      <SensitiveAmount
                        amountPaise={goal.targetAmount}
                        style={styles.targetAmountText}
                      />
                    </View>

                    <Text style={[styles.progressPctText, { color: goal.color }]}>
                      {progress}%
                    </Text>
                  </View>

                  <ProgressBar
                    progress={progress}
                    color={goal.color}
                    height={6}
                    style={{ marginVertical: 10 }}
                  />

                  {completionEstimate.length > 0 && (
                    <Text style={styles.estimateText}>{completionEstimate}</Text>
                  )}

                  {/* Add / Withdraw Funds Actions */}
                  <View style={styles.goalActionsRow}>
                    <Button
                      title="Add Funds"
                      icon="Plus"
                      variant="secondary"
                      size="sm"
                      onPress={() => {
                        setFundsModalGoal(goal);
                        setFundsActionType('deposit');
                        setFundsAmountInput('');
                      }}
                      style={{ flex: 1 }}
                    />
                    <Button
                      title="Withdraw"
                      icon="Minus"
                      variant="secondary"
                      size="sm"
                      onPress={() => {
                        setFundsModalGoal(goal);
                        setFundsActionType('withdraw');
                        setFundsAmountInput('');
                      }}
                      style={{ flex: 1 }}
                    />
                  </View>
                </Card>
              );
            })
          )}
        </ScrollView>

        {/* New Goal Modal */}
        <Modal
          visible={isAddGoalModalVisible}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={() => setIsAddGoalModalVisible(false)}
        >
          <SafeAreaView style={{ flex: 1, backgroundColor: '#000000' }}>
            <StatusBar style="light" />
            <ScreenHeader
              title="New Savings Goal"
              showBack
              onBack={() => setIsAddGoalModalVisible(false)}
            />
            <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 48 }}>
              <View style={styles.formSection}>
                <Text style={styles.formLabel}>GOAL TITLE</Text>
                <TextInput
                  value={newTitle}
                  onChangeText={setNewTitle}
                  placeholder="e.g. Emergency Fund, New Laptop, Vacation"
                  placeholderTextColor="rgba(235, 235, 245, 0.35)"
                  style={styles.formInput}
                />
              </View>

              <View style={styles.formSection}>
                <Text style={styles.formLabel}>TARGET AMOUNT</Text>
                <TextInput
                  value={newTargetInput}
                  onChangeText={setNewTargetInput}
                  placeholder="e.g. 300000"
                  placeholderTextColor="rgba(235, 235, 245, 0.35)"
                  keyboardType="numeric"
                  style={styles.formInput}
                />
              </View>

              <View style={styles.formSection}>
                <Text style={styles.formLabel}>CURRENT AMOUNT (OPTIONAL)</Text>
                <TextInput
                  value={newCurrentInput}
                  onChangeText={setNewCurrentInput}
                  placeholder="e.g. 50000"
                  placeholderTextColor="rgba(235, 235, 245, 0.35)"
                  keyboardType="numeric"
                  style={styles.formInput}
                />
              </View>

              <View style={styles.formSection}>
                <Text style={styles.formLabel}>TARGET DATE (YYYY-MM-DD)</Text>
                <TextInput
                  value={newTargetDate}
                  onChangeText={setNewTargetDate}
                  placeholder="2026-12-31"
                  placeholderTextColor="rgba(235, 235, 245, 0.35)"
                  style={styles.formInput}
                />
              </View>

              <View style={{ flexDirection: 'row', gap: 12, marginTop: 24 }}>
                <Button
                  title="Cancel"
                  variant="secondary"
                  onPress={() => setIsAddGoalModalVisible(false)}
                  style={{ flex: 1 }}
                />
                <Button
                  title="Save Goal"
                  variant="primary"
                  onPress={handleCreateGoal}
                  style={{ flex: 2 }}
                />
              </View>
            </ScrollView>
          </SafeAreaView>
        </Modal>

        {/* Deposit / Withdraw Modal */}
        <Modal
          visible={Boolean(fundsModalGoal)}
          transparent
          animationType="fade"
          onRequestClose={() => setFundsModalGoal(null)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>
                {fundsActionType === 'deposit' ? 'Add Funds to' : 'Withdraw from'}{' '}
                {fundsModalGoal?.title}
              </Text>

              <View style={styles.fundsInputWrapper}>
                <TextInput
                  value={fundsAmountInput}
                  onChangeText={setFundsAmountInput}
                  placeholder="0"
                  placeholderTextColor="rgba(235, 235, 245, 0.35)"
                  keyboardType="numeric"
                  autoFocus
                  style={styles.fundsInput}
                />
              </View>

              <View style={{ flexDirection: 'row', gap: 12, marginTop: 16 }}>
                <Button
                  title="Cancel"
                  variant="secondary"
                  onPress={() => setFundsModalGoal(null)}
                  style={{ flex: 1 }}
                />
                <Button
                  title={fundsActionType === 'deposit' ? 'Deposit' : 'Withdraw'}
                  variant="primary"
                  onPress={handleFundsSubmit}
                  style={{ flex: 1 }}
                />
              </View>
            </View>
          </View>
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
    padding: 20,
    paddingBottom: 40,
    gap: 12,
  },
  goalCard: {
    padding: 18,
    borderRadius: 20,
    backgroundColor: '#121216',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  goalTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  goalLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
  },
  goalIconCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    flexShrink: 0,
  },
  goalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
    letterSpacing: -0.2,
  },
  targetDateText: {
    fontSize: 12,
    color: 'rgba(235, 235, 245, 0.5)',
    marginTop: 2,
  },
  trashBtn: {
    padding: 6,
  },
  amountProgressRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  currentSavedText: {
    fontSize: 17,
    fontWeight: '800',
  },
  targetSlashText: {
    fontSize: 13,
    color: 'rgba(235, 235, 245, 0.4)',
  },
  targetAmountText: {
    fontSize: 13,
    fontWeight: '600',
    color: 'rgba(235, 235, 245, 0.65)',
  },
  progressPctText: {
    fontSize: 15,
    fontWeight: '800',
  },
  estimateText: {
    fontSize: 12,
    color: '#0a84ff',
    backgroundColor: 'rgba(10, 132, 255, 0.10)',
    padding: 8,
    borderRadius: 8,
    marginVertical: 6,
  },
  goalActionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  modalContent: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: '#121216',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    padding: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 16,
    textAlign: 'center',
  },
  fundsInputWrapper: {
    backgroundColor: '#18181f',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  fundsInput: {
    fontSize: 28,
    fontWeight: '800',
    color: '#ffffff',
    textAlign: 'center',
  },
});

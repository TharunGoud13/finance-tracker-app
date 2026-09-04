import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Category, TransactionType, Transaction } from '../../types';
import { THEME } from '../../constants/theme';
import { Icon } from '../ui/Icon';
import { useSettingsStore } from '../../store/useSettingsStore';
import { SUPPORTED_CURRENCIES } from '../../constants/currencies';
import { parseInputToPaise, paiseToInputString } from '../../utils/formatters';
import { triggerHaptic } from '../../utils/haptics';

interface TransactionFormProps {
  initialData?: Partial<Transaction>;
  categories: Category[];
  onSubmit: (data: {
    amount: number;
    categoryId: string;
    type: TransactionType;
    date: string;
    description: string;
    notes?: string;
    isRecurring: boolean;
  }) => Promise<void>;
  onCancel: () => void;
  isSubmitting?: boolean;
}

export const TransactionForm: React.FC<TransactionFormProps> = ({
  initialData,
  categories,
  onSubmit,
  onCancel,
  isSubmitting = false,
}) => {
  const currency = useSettingsStore((state) => state.settings.currency);
  const currencySymbol = SUPPORTED_CURRENCIES[currency]?.symbol || '₹';

  const [type, setType] = useState<TransactionType>(initialData?.type || 'expense');
  const [amountInput, setAmountInput] = useState(
    initialData?.amount ? paiseToInputString(initialData.amount, currency) : ''
  );
  const [categoryId, setCategoryId] = useState<string>(
    initialData?.categoryId ||
      categories.find((c) => c.type === (initialData?.type || 'expense'))?.id ||
      categories[0]?.id ||
      ''
  );
  const [description, setDescription] = useState(initialData?.description || '');
  const [notes, setNotes] = useState(initialData?.notes || '');

  const todayStr = new Date().toISOString().split('T')[0];
  const yesterdayStr = new Date(Date.now() - 86400000).toISOString().split('T')[0];
  const [date, setDate] = useState(
    initialData?.date ? initialData.date.split('T')[0] : todayStr
  );

  const [errorMsg, setErrorMsg] = useState('');

  const filteredCategories = categories.filter((c) => c.type === type);

  const handleTypeChange = (newType: TransactionType) => {
    triggerHaptic.selection();
    setType(newType);
    const firstCat = categories.find((c) => c.type === newType);
    if (firstCat) setCategoryId(firstCat.id);
  };

  const handleQuickAddAmount = (addValue: number) => {
    triggerHaptic.light();
    const current = parseFloat(amountInput) || 0;
    const next = current + addValue;
    setAmountInput(next.toString());
  };

  const handleFormSubmit = async () => {
    setErrorMsg('');
    const paise = parseInputToPaise(amountInput, currency);

    if (paise <= 0) {
      setErrorMsg('Please enter a valid amount greater than 0');
      triggerHaptic.error();
      return;
    }

    if (!categoryId) {
      setErrorMsg('Please select a category');
      triggerHaptic.error();
      return;
    }

    const currentCat = categories.find((c) => c.id === categoryId);
    const finalDesc = description.trim() || currentCat?.name || 'Transaction';

    try {
      await onSubmit({
        amount: paise,
        categoryId,
        type,
        date: `${date}T12:00:00.000Z`,
        description: finalDesc,
        notes: notes.trim(),
        isRecurring: false,
      });
    } catch (e: any) {
      setErrorMsg(e?.message || 'Failed to save transaction');
    }
  };

  const quickChips = currency === 'INR' ? [100, 500, 1000, 2000] : [10, 25, 50, 100];

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Type Switcher (Expense / Income) */}
        <View style={styles.segmentedControl}>
          <Pressable
            style={[
              styles.segmentItem,
              type === 'expense' && styles.segmentActiveExpense,
            ]}
            onPress={() => handleTypeChange('expense')}
          >
            <Icon
              name="ArrowUpRight"
              size={18}
              color={type === 'expense' ? '#FFFFFF' : THEME.colors.textMuted}
              strokeWidth={2.5}
            />
            <Text
              style={[
                styles.segmentText,
                type === 'expense' && styles.segmentTextActive,
              ]}
            >
              Expense
            </Text>
          </Pressable>

          <Pressable
            style={[
              styles.segmentItem,
              type === 'income' && styles.segmentActiveIncome,
            ]}
            onPress={() => handleTypeChange('income')}
          >
            <Icon
              name="ArrowDownLeft"
              size={18}
              color={type === 'income' ? '#FFFFFF' : THEME.colors.textMuted}
              strokeWidth={2.5}
            />
            <Text
              style={[
                styles.segmentText,
                type === 'income' && styles.segmentTextActive,
              ]}
            >
              Income
            </Text>
          </Pressable>
        </View>

        {/* Hero Amount Input Card */}
        <View style={styles.amountCard}>
          <Text style={styles.amountLabel}>ENTER AMOUNT</Text>
          <View style={styles.amountInputRow}>
            <Text
              style={[
                styles.currencyPrefix,
                type === 'expense' ? styles.expenseColor : styles.incomeColor,
              ]}
            >
              {currencySymbol}
            </Text>
            <TextInput
              style={[
                styles.amountTextInput,
                type === 'expense' ? styles.expenseColor : styles.incomeColor,
              ]}
              placeholder="0"
              placeholderTextColor={THEME.colors.textDisabled}
              keyboardType="decimal-pad"
              value={amountInput}
              onChangeText={setAmountInput}
              autoFocus={!initialData}
            />
          </View>

          {/* Quick Increment Chips */}
          <View style={styles.chipsRow}>
            {quickChips.map((val) => (
              <Pressable
                key={val}
                style={styles.chipButton}
                onPress={() => handleQuickAddAmount(val)}
              >
                <Text style={styles.chipText}>+{val}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Error Message */}
        {errorMsg ? (
          <View style={styles.errorBanner}>
            <Icon name="AlertCircle" size={16} color={THEME.colors.expense} />
            <Text style={styles.errorText}>{errorMsg}</Text>
          </View>
        ) : null}

        {/* Category Grid */}
        <View style={styles.sectionBlock}>
          <Text style={styles.sectionLabel}>SELECT CATEGORY</Text>
          <View style={styles.categoryGrid}>
            {filteredCategories.map((cat) => {
              const isSelected = cat.id === categoryId;
              return (
                <Pressable
                  key={cat.id}
                  style={[
                    styles.categoryCard,
                    isSelected && {
                      borderColor: THEME.colors.primary,
                      backgroundColor: `${THEME.colors.primary}25`,
                    },
                  ]}
                  onPress={() => {
                    triggerHaptic.selection();
                    setCategoryId(cat.id);
                  }}
                >
                  <View
                    style={[
                      styles.catIconWrap,
                      { backgroundColor: `${cat.color || '#EB0028'}22` },
                      isSelected && { backgroundColor: THEME.colors.primary },
                    ]}
                  >
                    <Icon
                      name={cat.icon || 'Tag'}
                      size={20}
                      color={isSelected ? '#FFFFFF' : cat.color || THEME.colors.primary}
                    />
                  </View>
                  <Text
                    style={[
                      styles.categoryCardText,
                      isSelected && { color: '#FFFFFF', fontWeight: '800' },
                    ]}
                    numberOfLines={1}
                  >
                    {cat.name}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Description & Note Input */}
        <View style={styles.sectionBlock}>
          <Text style={styles.sectionLabel}>DETAILS & NOTE</Text>
          <View style={styles.inputCard}>
            <View style={styles.fieldRow}>
              <Icon name="FileText" size={18} color={THEME.colors.textMuted} />
              <TextInput
                style={styles.textInput}
                placeholder="Description / Merchant (e.g. Starbucks)"
                placeholderTextColor={THEME.colors.textMuted}
                value={description}
                onChangeText={setDescription}
              />
            </View>

            <View style={styles.divider} />

            <View style={styles.fieldRow}>
              <Icon name="MessageSquare" size={18} color={THEME.colors.textMuted} />
              <TextInput
                style={styles.textInput}
                placeholder="Additional notes (optional)"
                placeholderTextColor={THEME.colors.textMuted}
                value={notes}
                onChangeText={setNotes}
              />
            </View>
          </View>
        </View>

        {/* Date Selector */}
        <View style={styles.sectionBlock}>
          <Text style={styles.sectionLabel}>TRANSACTION DATE</Text>
          <View style={styles.dateSelectorRow}>
            <Pressable
              style={[styles.dateChip, date === todayStr && styles.dateChipActive]}
              onPress={() => {
                triggerHaptic.selection();
                setDate(todayStr);
              }}
            >
              <Text style={[styles.dateChipText, date === todayStr && styles.dateChipTextActive]}>
                Today
              </Text>
            </Pressable>

            <Pressable
              style={[styles.dateChip, date === yesterdayStr && styles.dateChipActive]}
              onPress={() => {
                triggerHaptic.selection();
                setDate(yesterdayStr);
              }}
            >
              <Text
                style={[
                  styles.dateChipText,
                  date === yesterdayStr && styles.dateChipTextActive,
                ]}
              >
                Yesterday
              </Text>
            </Pressable>

            <View style={styles.dateCustomInputWrap}>
              <Icon name="Calendar" size={14} color={THEME.colors.textMuted} />
              <TextInput
                style={styles.dateCustomInput}
                value={date}
                onChangeText={setDate}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={THEME.colors.textMuted}
              />
            </View>
          </View>
        </View>

        {/* Actions Button */}
        <View style={styles.buttonGroup}>
          <Pressable
            style={[
              styles.submitButton,
              type === 'expense' ? styles.submitExpense : styles.submitIncome,
              isSubmitting && { opacity: 0.6 },
            ]}
            onPress={handleFormSubmit}
            disabled={isSubmitting}
          >
            <Text style={styles.submitButtonText}>
              {isSubmitting ? 'Saving...' : initialData ? 'Update Transaction' : 'Save Transaction'}
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.colors.background,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 40,
  },
  segmentedControl: {
    flexDirection: 'row',
    backgroundColor: THEME.colors.surfaceSubtle,
    borderRadius: THEME.borderRadius.lg,
    padding: 4,
    marginBottom: 16,
  },
  segmentItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: THEME.borderRadius.md,
    gap: 8,
  },
  segmentActiveExpense: {
    backgroundColor: THEME.colors.expense,
  },
  segmentActiveIncome: {
    backgroundColor: THEME.colors.income,
  },
  segmentText: {
    fontSize: 14,
    fontWeight: '700',
    color: THEME.colors.textMuted,
    fontFamily: THEME.typography.fontFamily,
  },
  segmentTextActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  amountCard: {
    backgroundColor: THEME.colors.surface,
    borderRadius: THEME.borderRadius.xl,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: THEME.colors.border,
    marginBottom: 16,
    ...THEME.shadows.card,
  },
  amountLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: THEME.colors.textMuted,
    letterSpacing: 0.8,
    marginBottom: 10,
    fontFamily: THEME.typography.fontFamily,
  },
  amountInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  currencyPrefix: {
    fontSize: 36,
    fontWeight: '800',
    marginRight: 6,
    fontFamily: THEME.typography.fontFamily,
  },
  amountTextInput: {
    fontSize: 44,
    fontWeight: '900',
    minWidth: 120,
    textAlign: 'left',
    padding: 0,
    fontFamily: THEME.typography.fontFamily,
  },
  expenseColor: {
    color: THEME.colors.expense,
  },
  incomeColor: {
    color: THEME.colors.income,
  },
  chipsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  chipButton: {
    backgroundColor: THEME.colors.backgroundElevated,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: THEME.borderRadius.full,
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '700',
    color: THEME.colors.textSecondary,
    fontFamily: THEME.typography.fontFamily,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.colors.expenseBg,
    padding: 10,
    borderRadius: THEME.borderRadius.md,
    gap: 8,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: THEME.colors.expenseBorder,
  },
  errorText: {
    fontSize: 13,
    color: THEME.colors.expense,
    fontWeight: '700',
    fontFamily: THEME.typography.fontFamily,
  },
  sectionBlock: {
    marginBottom: 16,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: THEME.colors.textMuted,
    letterSpacing: 0.6,
    marginBottom: 8,
    marginLeft: 2,
    fontFamily: THEME.typography.fontFamily,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryCard: {
    width: '31%',
    backgroundColor: THEME.colors.surface,
    borderRadius: THEME.borderRadius.md,
    paddingVertical: 12,
    paddingHorizontal: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: THEME.colors.border,
    gap: 6,
  },
  catIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryCardText: {
    fontSize: 11,
    fontWeight: '600',
    color: THEME.colors.textSecondary,
    textAlign: 'center',
    fontFamily: THEME.typography.fontFamily,
  },
  inputCard: {
    backgroundColor: THEME.colors.surface,
    borderRadius: THEME.borderRadius.lg,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    paddingHorizontal: 14,
  },
  fieldRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 10,
  },
  textInput: {
    flex: 1,
    color: THEME.colors.textPrimary,
    fontSize: 14,
    padding: 0,
    fontFamily: THEME.typography.fontFamily,
  },
  divider: {
    height: 1,
    backgroundColor: THEME.colors.border,
  },
  dateSelectorRow: {
    flexDirection: 'row',
    gap: 8,
  },
  dateChip: {
    backgroundColor: THEME.colors.surface,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: THEME.borderRadius.md,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateChipActive: {
    backgroundColor: THEME.colors.primary,
    borderColor: THEME.colors.primary,
  },
  dateChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: THEME.colors.textSecondary,
    fontFamily: THEME.typography.fontFamily,
  },
  dateChipTextActive: {
    color: '#FFFFFF',
  },
  dateCustomInputWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.colors.surface,
    paddingHorizontal: 12,
    borderRadius: THEME.borderRadius.md,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    gap: 6,
  },
  dateCustomInput: {
    flex: 1,
    color: THEME.colors.textPrimary,
    fontSize: 12,
    padding: 0,
    fontFamily: THEME.typography.fontFamily,
  },
  buttonGroup: {
    marginTop: 8,
  },
  submitButton: {
    borderRadius: THEME.borderRadius.lg,
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
    ...THEME.shadows.floating,
  },
  submitExpense: {
    backgroundColor: THEME.colors.expense,
  },
  submitIncome: {
    backgroundColor: THEME.colors.income,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.2,
    fontFamily: THEME.typography.fontFamily,
  },
});

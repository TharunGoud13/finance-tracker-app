import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Category, TransactionType, Transaction } from '../../types';
import { SegmentedControl } from '../ui/SegmentedControl';
import { Button } from '../ui/Button';
import { Switch } from '../ui/Switch';
import { Icon } from '../ui/Icon';
import { HapticPressable } from '../ui/HapticPressable';
import { useSettingsStore } from '../../store/useSettingsStore';
import { SUPPORTED_CURRENCIES } from '../../constants/currencies';
import { parseInputToPaise, paiseToInputString } from '../../utils/formatters';

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
      ''
  );
  const [description, setDescription] = useState(initialData?.description || '');
  const [notes, setNotes] = useState(initialData?.notes || '');
  const [isRecurring, setIsRecurring] = useState(initialData?.isRecurring || false);

  const todayStr = new Date().toISOString().split('T')[0];
  const yesterdayStr = new Date(Date.now() - 86400000).toISOString().split('T')[0];
  const [date, setDate] = useState(
    initialData?.date ? initialData.date.split('T')[0] : todayStr
  );

  const [errorMsg, setErrorMsg] = useState('');

  const filteredCategories = categories.filter((c) => c.type === type);

  const handleTypeChange = (newType: TransactionType) => {
    setType(newType);
    const firstCat = categories.find((c) => c.type === newType);
    if (firstCat) setCategoryId(firstCat.id);
  };

  const handleFormSubmit = async () => {
    setErrorMsg('');
    const paise = parseInputToPaise(amountInput, currency);

    if (paise <= 0) {
      setErrorMsg('Please enter a valid amount greater than 0');
      return;
    }

    if (!categoryId) {
      setErrorMsg('Please select a category');
      return;
    }

    try {
      await onSubmit({
        amount: paise,
        categoryId,
        type,
        date,
        description: description.trim() || categories.find((c) => c.id === categoryId)?.name || 'Transaction',
        notes: notes.trim(),
        isRecurring,
      });
    } catch (e: any) {
      setErrorMsg(e?.message || 'Failed to save transaction');
    }
  };

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
        <View style={styles.segmentWrapper}>
          <SegmentedControl
            options={[
              { value: 'expense', label: 'Expense', icon: 'ArrowUpRight', activeColor: '#eb0028' },
              { value: 'income', label: 'Income', icon: 'ArrowDownLeft', activeColor: '#30d158' },
            ]}
            selectedValue={type}
            onSelect={handleTypeChange}
            size="md"
          />
        </View>

        {/* Large Amount Input Area */}
        <View style={styles.amountArea}>
          <Text
            style={[
              styles.currencyPrefix,
              { color: type === 'income' ? '#30d158' : '#eb0028' },
            ]}
          >
            {currencySymbol}
          </Text>
          <TextInput
            value={amountInput}
            onChangeText={(val) => {
              setAmountInput(val);
              if (errorMsg) setErrorMsg('');
            }}
            placeholder="0"
            placeholderTextColor="rgba(235, 235, 245, 0.25)"
            keyboardType="numeric"
            style={styles.amountInput}
            autoFocus={!initialData}
          />
        </View>

        {errorMsg.length > 0 && (
          <View style={styles.errorBanner}>
            <Icon name="AlertCircle" size={16} color="#eb0028" style={{ marginRight: 6 }} />
            <Text style={styles.errorText}>{errorMsg}</Text>
          </View>
        )}

        {/* Inset Group: Details */}
        <Text style={styles.sectionTitle}>TRANSACTION DETAILS</Text>
        <View style={styles.insetGroup}>
          <View style={styles.insetRow}>
            <Text style={styles.insetRowLabel}>Title</Text>
            <TextInput
              value={description}
              onChangeText={setDescription}
              placeholder="e.g. Starbucks, Salary"
              placeholderTextColor="rgba(235, 235, 245, 0.35)"
              style={styles.insetTextInput}
            />
          </View>
          <View style={styles.separator} />
          
          <View style={styles.insetRow}>
            <Text style={styles.insetRowLabel}>Date</Text>
            <View style={styles.dateChipsRow}>
              <HapticPressable
                onPress={() => setDate(todayStr)}
                hapticType="selection"
                style={[styles.dateChip, date === todayStr && styles.dateChipActive]}
              >
                <Text style={[styles.dateChipText, date === todayStr && styles.dateChipTextActive]}>Today</Text>
              </HapticPressable>
              <HapticPressable
                onPress={() => setDate(yesterdayStr)}
                hapticType="selection"
                style={[styles.dateChip, date === yesterdayStr && styles.dateChipActive]}
              >
                <Text style={[styles.dateChipText, date === yesterdayStr && styles.dateChipTextActive]}>Yesterday</Text>
              </HapticPressable>
            </View>
          </View>
          <View style={styles.separator} />

          <View style={styles.insetRow}>
            <Text style={styles.insetRowLabel}>Custom Date</Text>
            <TextInput
              value={date}
              onChangeText={setDate}
              placeholder="YYYY-MM-DD"
              placeholderTextColor="rgba(235, 235, 245, 0.35)"
              style={styles.insetTextInput}
            />
          </View>
        </View>

        {/* Category Picker Grid */}
        <Text style={styles.sectionTitle}>CATEGORY</Text>
        <View style={styles.categoryGrid}>
          {filteredCategories.map((cat) => {
            const isSelected = cat.id === categoryId;
            return (
              <View key={cat.id} style={styles.categoryCol}>
                <HapticPressable
                  onPress={() => setCategoryId(cat.id)}
                  hapticType="selection"
                  style={[
                    styles.categoryTile,
                    isSelected && {
                      backgroundColor: `${cat.color}18`,
                      borderColor: cat.color,
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.categoryIconCircle,
                      { backgroundColor: isSelected ? cat.color : `${cat.color}22` },
                    ]}
                  >
                    <Icon
                      name={cat.icon || 'Tag'}
                      size={20}
                      color={isSelected ? '#ffffff' : cat.color}
                    />
                  </View>
                  <Text
                    style={[
                      styles.categoryName,
                      isSelected && { color: '#ffffff', fontWeight: '700' },
                    ]}
                    numberOfLines={2}
                  >
                    {cat.name}
                  </Text>
                  {isSelected && (
                    <View style={[styles.selectedBadge, { backgroundColor: cat.color }]}>
                      <Icon name="Check" size={10} color="#ffffff" strokeWidth={3} />
                    </View>
                  )}
                </HapticPressable>
              </View>
            );
          })}
        </View>

        {/* Options */}
        <Text style={styles.sectionTitle}>OPTIONS</Text>
        <View style={styles.insetGroup}>
          <View style={styles.insetRow}>
            <Text style={styles.insetRowLabel}>Recurring Monthly</Text>
            <Switch
              value={isRecurring}
              onValueChange={setIsRecurring}
              activeColor={type === 'income' ? '#30d158' : '#eb0028'}
            />
          </View>
          <View style={styles.separator} />
          <View style={[styles.insetRow, { alignItems: 'flex-start', paddingVertical: 12 }]}>
            <Text style={[styles.insetRowLabel, { paddingTop: 6 }]}>Notes</Text>
            <TextInput
              value={notes}
              onChangeText={setNotes}
              placeholder="Add extra context..."
              placeholderTextColor="rgba(235, 235, 245, 0.35)"
              multiline
              numberOfLines={2}
              style={[styles.insetTextInput, { height: 48, textAlignVertical: 'top' }]}
            />
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionsRow}>
          <Button
            title="Cancel"
            variant="secondary"
            onPress={onCancel}
            style={{ flex: 1 }}
          />
          <Button
            title={initialData ? 'Update Record' : 'Save'}
            variant="primary"
            onPress={handleFormSubmit}
            loading={isSubmitting}
            style={{ flex: 2 }}
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  segmentWrapper: {
    marginBottom: 28,
  },
  amountArea: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 28,
  },
  currencyPrefix: {
    fontSize: 48,
    fontWeight: '800',
    marginRight: 6,
  },
  amountInput: {
    fontSize: 64,
    fontWeight: '800',
    color: '#ffffff',
    minWidth: 120,
    textAlign: 'center',
    letterSpacing: -2,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(235, 0, 40, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(235, 0, 40, 0.3)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 20,
  },
  errorText: {
    color: '#ff4d6a',
    fontSize: 14,
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(235, 235, 245, 0.45)',
    letterSpacing: 0.8,
    marginBottom: 10,
    marginLeft: 4,
    textTransform: 'uppercase',
  },
  insetGroup: {
    backgroundColor: '#1c1c22',
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
  },
  insetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 52,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  insetRowLabel: {
    fontSize: 15,
    fontWeight: '500',
    color: '#ffffff',
    flex: 1,
  },
  insetTextInput: {
    flex: 2,
    fontSize: 15,
    color: 'rgba(235, 235, 245, 0.8)',
    textAlign: 'right',
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(255, 255, 255, 0.09)',
    marginLeft: 16,
  },
  dateChipsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  dateChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  dateChipActive: {
    backgroundColor: 'rgba(235, 0, 40, 0.2)',
  },
  dateChipText: {
    fontSize: 14,
    fontWeight: '500',
    color: 'rgba(235, 235, 245, 0.7)',
  },
  dateChipTextActive: {
    color: '#ffffff',
    fontWeight: '700',
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
    marginBottom: 28,
  },
  categoryCol: {
    width: '33.333%',
    padding: 4,
  },
  categoryTile: {
    backgroundColor: '#18181f',
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 6,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 96,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.07)',
    position: 'relative',
  },
  categoryIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  categoryName: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(235, 235, 245, 0.75)',
    textAlign: 'center',
    lineHeight: 16,
  },
  selectedBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 12,
  },
});

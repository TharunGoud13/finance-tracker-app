import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput } from 'react-native';
import { Category, TransactionType } from '../../types';
import { SegmentedControl } from '../ui/SegmentedControl';
import { Button } from '../ui/Button';
import { Icon } from '../ui/Icon';
import { HapticPressable } from '../ui/HapticPressable';
import { CATEGORY_COLOR_PALETTE, AVAILABLE_CATEGORY_ICONS } from '../../constants/categories';

interface CategoryFormProps {
  initialData?: Partial<Category>;
  onSubmit: (data: Omit<Category, 'id' | 'isDefault' | 'createdAt'>) => Promise<void>;
  onCancel: () => void;
  isSubmitting?: boolean;
}

export const CategoryForm: React.FC<CategoryFormProps> = ({
  initialData,
  onSubmit,
  onCancel,
  isSubmitting = false,
}) => {
  const [name, setName] = useState(initialData?.name || '');
  const [type, setType] = useState<TransactionType>(initialData?.type || 'expense');
  const [selectedIcon, setSelectedIcon] = useState(initialData?.icon || 'Tag');
  const [selectedColor, setSelectedColor] = useState(
    initialData?.color || CATEGORY_COLOR_PALETTE[0]
  );
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!name.trim()) {
      setError('Category name is required');
      return;
    }
    setError('');
    await onSubmit({
      name: name.trim(),
      type,
      icon: selectedIcon,
      color: selectedColor,
    });
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      <SegmentedControl
        options={[
          { value: 'expense', label: 'Expense Category', activeColor: '#f43f5e' },
          { value: 'income', label: 'Income Category', activeColor: '#10b981' },
        ]}
        selectedValue={type}
        onSelect={(val) => setType(val)}
        style={{ marginBottom: 20 }}
      />

      {/* Name Input */}
      <View style={styles.section}>
        <Text style={styles.label}>Category Name</Text>
        <View style={styles.inputWrapper}>
          <TextInput
            value={name}
            onChangeText={(text) => {
              setName(text);
              if (error) setError('');
            }}
            placeholder="e.g. Subscriptions, Coffee, Pet Care"
            placeholderTextColor="#64748b"
            style={styles.input}
          />
        </View>
        {Boolean(error) && <Text style={styles.errorText}>{error}</Text>}
      </View>

      {/* Color Palette Selector */}
      <View style={styles.section}>
        <Text style={styles.label}>Category Color</Text>
        <View style={styles.paletteRow}>
          {CATEGORY_COLOR_PALETTE.map((color) => {
            const isSelected = color === selectedColor;
            return (
              <HapticPressable
                key={color}
                onPress={() => setSelectedColor(color)}
                hapticType="selection"
                style={[
                  styles.colorCircle,
                  { backgroundColor: color },
                  isSelected && styles.colorCircleSelected,
                ]}
              >
                {isSelected && <Icon name="Check" size={14} color="#ffffff" />}
              </HapticPressable>
            );
          })}
        </View>
      </View>

      {/* Icon Selector Grid */}
      <View style={styles.section}>
        <Text style={styles.label}>Category Icon</Text>
        <View style={styles.iconGrid}>
          {AVAILABLE_CATEGORY_ICONS.map((iconName) => {
            const isSelected = iconName === selectedIcon;
            return (
              <HapticPressable
                key={iconName}
                onPress={() => setSelectedIcon(iconName)}
                hapticType="selection"
                style={[
                  styles.iconTile,
                  isSelected && {
                    backgroundColor: `${selectedColor}25`,
                    borderColor: selectedColor,
                  },
                ]}
              >
                <Icon
                  name={iconName}
                  size={20}
                  color={isSelected ? selectedColor : '#94a3b8'}
                />
              </HapticPressable>
            );
          })}
        </View>
      </View>

      {/* Buttons */}
      <View style={styles.buttonRow}>
        <Button
          title="Cancel"
          variant="secondary"
          onPress={onCancel}
          style={styles.cancelBtn}
        />
        <Button
          title={initialData ? 'Update Category' : 'Create Category'}
          variant="primary"
          onPress={handleSubmit}
          loading={isSubmitting}
          style={styles.saveBtn}
        />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0b0f19',
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  section: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
    color: '#f8fafc',
    marginBottom: 8,
  },
  inputWrapper: {
    backgroundColor: '#121927',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 14,
    minHeight: 48,
    justifyContent: 'center',
  },
  input: {
    color: '#f8fafc',
    fontSize: 15,
  },
  errorText: {
    color: '#ef4444',
    fontSize: 12,
    marginTop: 4,
  },
  paletteRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  colorCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  colorCircleSelected: {
    borderWidth: 3,
    borderColor: '#ffffff',
  },
  iconGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  iconTile: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: '#121927',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 10,
  },
  cancelBtn: {
    flex: 1,
  },
  saveBtn: {
    flex: 2,
  },
});

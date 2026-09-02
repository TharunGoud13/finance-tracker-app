import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { useBudgetStore } from '../../src/store/useBudgetStore';
import { useTransactionStore } from '../../src/store/useTransactionStore';
import { Category, TransactionType } from '../../src/types';
import { ScreenHeader } from '../../src/components/common/ScreenHeader';
import { CategoryForm } from '../../src/components/forms/CategoryForm';
import { SegmentedControl } from '../../src/components/ui/SegmentedControl';
import { Button } from '../../src/components/ui/Button';
import { Icon } from '../../src/components/ui/Icon';
import { HapticPressable } from '../../src/components/ui/HapticPressable';
import { AppDialog } from '../../src/components/ui/AppDialog';

export default function ManageCategoriesModal() {
  const router = useRouter();
  const categories = useBudgetStore((state) => state.categories);
  const addCategory = useBudgetStore((state) => state.addCategory);
  const updateCategory = useBudgetStore((state) => state.updateCategory);
  const deleteCategory = useBudgetStore((state) => state.deleteCategory);
  const transactions = useTransactionStore((state) => state.transactions);

  const [activeTab, setActiveTab] = useState<TransactionType>('expense');
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [dialog, setDialog] = useState<{
    visible: boolean; title: string; message?: string;
    icon?: string; iconColor?: string;
    actions: { label: string; onPress: () => void; style?: 'default' | 'cancel' | 'destructive' }[];
  }>({ visible: false, title: '', actions: [] });

  const showAlert = (title: string, message?: string) =>
    setDialog({ visible: true, title, message, icon: 'Info', iconColor: '#0a84ff',
      actions: [{ label: 'OK', onPress: () => setDialog((d) => ({ ...d, visible: false })), style: 'cancel' }] });

  const showConfirm = (title: string, message: string, onConfirm: () => void) =>
    setDialog({ visible: true, title, message, icon: 'Trash2', iconColor: '#ff453a',
      actions: [
        { label: 'Cancel', onPress: () => setDialog((d) => ({ ...d, visible: false })), style: 'cancel' },
        { label: 'Delete', onPress: () => { setDialog((d) => ({ ...d, visible: false })); onConfirm(); }, style: 'destructive' },
      ] });

  const filteredCategories = categories.filter((c) => c.type === activeTab);

  const handleCreateCategory = async (catData: any) => {
    setIsSubmitting(true);
    try {
      await addCategory(catData);
      setIsCreatingNew(false);
    } catch (e) {
      console.error('Error creating category:', e);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateCategory = async (catData: any) => {
    if (!editingCategory) return;
    setIsSubmitting(true);
    try {
      await updateCategory(editingCategory.id, catData);
      setEditingCategory(null);
    } catch (e) {
      console.error('Error updating category:', e);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteCategory = (cat: Category) => {
    if (cat.isDefault) {
      showAlert('Cannot Delete', 'Default system categories cannot be deleted.');
      return;
    }

    const linkedCount = transactions.filter((tx) => tx.categoryId === cat.id).length;
    const message =
      linkedCount > 0
        ? `This category has ${linkedCount} transaction(s) associated with it. Deleting will unlink those transactions.`
        : 'Are you sure you want to delete this category?';

    showConfirm('Delete Category', message, () => deleteCategory(cat.id));
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <StatusBar style="light" />
      <View style={styles.container}>
        <ScreenHeader
          title="Manage Categories"
          subtitle="Customize categories & icons"
          showBack
          onBack={() => router.back()}
          rightAction={
            <Button
              title="New"
              icon="Plus"
              variant="primary"
              size="sm"
              onPress={() => setIsCreatingNew(true)}
            />
          }
        />

        <View style={styles.tabBar}>
          <SegmentedControl
            options={[
              { value: 'expense', label: 'Expenses', activeColor: '#eb0028' },
              { value: 'income', label: 'Income', activeColor: '#30d158' },
            ]}
            selectedValue={activeTab}
            onSelect={(val) => setActiveTab(val as any)}
            size="sm"
          />
        </View>

        <ScrollView
          style={styles.list}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        >
          {filteredCategories.map((cat) => {
            const txCount = transactions.filter((tx) => tx.categoryId === cat.id).length;

            return (
              <View key={cat.id} style={styles.categoryCard}>
                <View style={styles.catLeft}>
                  <View
                    style={[
                      styles.iconCircle,
                      { backgroundColor: `${cat.color}22` },
                    ]}
                  >
                    <Icon name={cat.icon || 'Tag'} size={18} color={cat.color} />
                  </View>
                  <View>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <Text style={styles.catName}>{cat.name}</Text>
                      {cat.isDefault && (
                        <View style={styles.defaultBadge}>
                          <Text style={styles.defaultBadgeText}>DEFAULT</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.txCount}>{txCount} transactions</Text>
                  </View>
                </View>

                <View style={styles.actionsRow}>
                  <HapticPressable
                    onPress={() => setEditingCategory(cat)}
                    hapticType="light"
                    style={styles.actionBtn}
                  >
                    <Icon name="Pencil" size={15} color="rgba(235, 235, 245, 0.6)" />
                  </HapticPressable>

                  {!cat.isDefault && (
                    <HapticPressable
                      onPress={() => handleDeleteCategory(cat)}
                      hapticType="heavy"
                      style={[styles.actionBtn, { marginLeft: 8 }]}
                    >
                      <Icon name="Trash2" size={15} color="#eb0028" />
                    </HapticPressable>
                  )}
                </View>
              </View>
            );
          })}
        </ScrollView>

        {/* Create / Edit Category Modal */}
        <Modal
          visible={isCreatingNew || Boolean(editingCategory)}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={() => {
            setIsCreatingNew(false);
            setEditingCategory(null);
          }}
        >
          <SafeAreaView style={{ flex: 1, backgroundColor: '#000000' }}>
            <StatusBar style="light" />
            <ScreenHeader
              title={editingCategory ? 'Edit Category' : 'Create Category'}
              showBack
              onBack={() => {
                setIsCreatingNew(false);
                setEditingCategory(null);
              }}
            />
            <CategoryForm
              initialData={editingCategory || { type: activeTab }}
              onSubmit={editingCategory ? handleUpdateCategory : handleCreateCategory}
              onCancel={() => {
                setIsCreatingNew(false);
                setEditingCategory(null);
              }}
              isSubmitting={isSubmitting}
            />
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
  tabBar: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 14,
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingTop: 4,
    paddingBottom: 40,
    gap: 10,
  },
  categoryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 14,
    backgroundColor: '#1c1c22',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  catLeft: {
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
  catName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#ffffff',
    letterSpacing: -0.2,
  },
  defaultBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    marginLeft: 6,
  },
  defaultBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: 'rgba(235, 235, 245, 0.5)',
  },
  txCount: {
    fontSize: 12,
    color: 'rgba(235, 235, 245, 0.45)',
    marginTop: 2,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.07)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

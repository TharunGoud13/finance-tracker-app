import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Switch,
  Modal,
  TextInput,
  Share,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useSettingsStore } from '../../src/store/useSettingsStore';
import { useTransactionStore } from '../../src/store/useTransactionStore';
import { useBudgetStore } from '../../src/store/useBudgetStore';
import { usePrivacyStore } from '../../src/store/usePrivacyStore';
import { CurrencyCode } from '../../src/types';
import { THEME } from '../../src/constants/theme';
import { Icon } from '../../src/components/ui/Icon';
import { triggerHaptic } from '../../src/utils/haptics';

const CURRENCIES: { code: CurrencyCode; label: string; symbol: string }[] = [
  { code: 'INR', label: 'Indian Rupee', symbol: '₹' },
  { code: 'USD', label: 'US Dollar', symbol: '$' },
  { code: 'EUR', label: 'Euro', symbol: '€' },
  { code: 'GBP', label: 'British Pound', symbol: '£' },
  { code: 'JPY', label: 'Japanese Yen', symbol: '¥' },
];

export default function SettingsScreen() {
  const settings = useSettingsStore((state) => state.settings);
  const setCurrency = useSettingsStore((state) => state.setCurrency);
  const setUserName = useSettingsStore((state) => state.setUserName);

  const transactions = useTransactionStore((state) => state.transactions);
  const seedDemoTransactions = useTransactionStore((state) => state.seedDemoTransactions);
  const clearAllTransactions = useTransactionStore((state) => state.clearAllTransactions);

  const categories = useBudgetStore((state) => state.categories);
  const budgets = useBudgetStore((state) => state.budgets);
  const seedDemoBudgets = useBudgetStore((state) => state.seedDemoBudgets);
  const clearAllBudgets = useBudgetStore((state) => state.clearAllBudgets);

  const isSensitiveDataVisible = usePrivacyStore((state) => state.isSensitiveDataVisible);
  const toggleSensitiveData = usePrivacyStore((state) => state.toggleSensitiveData);

  const [isCurrencyModalVisible, setIsCurrencyModalVisible] = useState(false);
  const [isNameModalVisible, setIsNameModalVisible] = useState(false);
  const [nameInput, setNameInput] = useState(settings.userName || 'Tharun');

  const [isClearModalVisible, setIsClearModalVisible] = useState(false);
  const [statusBanner, setStatusBanner] = useState('');

  const handleRestoreDemoData = async () => {
    triggerHaptic.medium();
    await seedDemoTransactions();
    await seedDemoBudgets();
    triggerHaptic.success();
    setStatusBanner('OnePlus Demo data restored successfully!');
    setTimeout(() => setStatusBanner(''), 3500);
  };

  const handleClearData = async () => {
    setIsClearModalVisible(false);
    triggerHaptic.heavy();
    await clearAllTransactions();
    await clearAllBudgets();
    triggerHaptic.warning();
    setStatusBanner('All data has been cleared from local storage.');
    setTimeout(() => setStatusBanner(''), 3500);
  };

  const handleExportData = async () => {
    triggerHaptic.light();
    const exportPayload = JSON.stringify(
      {
        version: '1.0',
        exportedAt: new Date().toISOString(),
        transactions,
        budgets,
        settings,
      },
      null,
      2
    );

    try {
      await Share.share({
        message: exportPayload,
        title: 'OnePlus Finance Tracker Backup',
      });
      triggerHaptic.success();
    } catch (e) {
      triggerHaptic.error();
    }
  };

  const currentCurrencyObj =
    CURRENCIES.find((c) => c.code === settings.currency) || CURRENCIES[0];

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <StatusBar style="light" />
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Screen Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Settings</Text>
          <Text style={styles.headerSubtitle}>Preferences & Local Device Storage</Text>
        </View>

        {/* Status Toast */}
        {statusBanner ? (
          <View style={styles.toastCard}>
            <Icon name="CheckCircle2" size={16} color={THEME.colors.primary} />
            <Text style={styles.toastText}>{statusBanner}</Text>
          </View>
        ) : null}

        {/* Local Storage Information Hero Card */}
        <View style={styles.storageCard}>
          <View style={styles.storageCardHeader}>
            <View style={styles.storageIconWrap}>
              <Icon name="HardDrive" size={20} color={THEME.colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <View style={styles.storageTitleRow}>
                <Text style={styles.storageTitle}>Local Mobile Storage</Text>
                <View style={styles.offlineBadge}>
                  <View style={styles.onlineDot} />
                  <Text style={styles.offlineBadgeText}>100% Offline</Text>
                </View>
              </View>
              <Text style={styles.storageSubtitle}>
                Persistent in mobile AsyncStorage. Never Settle on Privacy.
              </Text>
            </View>
          </View>

          <View style={styles.storageStatsGrid}>
            <View style={styles.statBox}>
              <Text style={styles.statNumber}>{transactions.length}</Text>
              <Text style={styles.statLabel}>Transactions</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statNumber}>{categories.length}</Text>
              <Text style={styles.statLabel}>Categories</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statNumber}>{budgets.length}</Text>
              <Text style={styles.statLabel}>Active Budgets</Text>
            </View>
          </View>
        </View>

        {/* Section: General Preferences */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>GENERAL PREFERENCES</Text>
          <View style={styles.card}>
            {/* Currency Selector */}
            <Pressable
              style={styles.rowItem}
              onPress={() => {
                triggerHaptic.selection();
                setIsCurrencyModalVisible(true);
              }}
            >
              <View style={styles.rowLeft}>
                <View style={[styles.itemIcon, { backgroundColor: THEME.colors.primaryGlow }]}>
                  <Icon name="DollarSign" size={18} color={THEME.colors.primary} />
                </View>
                <View>
                  <Text style={styles.rowTitle}>Currency</Text>
                  <Text style={styles.rowSubtitle}>
                    {currentCurrencyObj.label} ({currentCurrencyObj.symbol})
                  </Text>
                </View>
              </View>
              <Icon name="ChevronRight" size={18} color={THEME.colors.textMuted} />
            </Pressable>

            <View style={styles.divider} />

            {/* Profile Name */}
            <Pressable
              style={styles.rowItem}
              onPress={() => {
                triggerHaptic.selection();
                setNameInput(settings.userName || '');
                setIsNameModalVisible(true);
              }}
            >
              <View style={styles.rowLeft}>
                <View style={[styles.itemIcon, { backgroundColor: THEME.colors.incomeBg }]}>
                  <Icon name="User" size={18} color={THEME.colors.income} />
                </View>
                <View>
                  <Text style={styles.rowTitle}>User Name</Text>
                  <Text style={styles.rowSubtitle}>{settings.userName || 'Tharun'}</Text>
                </View>
              </View>
              <Icon name="ChevronRight" size={18} color={THEME.colors.textMuted} />
            </Pressable>

            <View style={styles.divider} />

            {/* Privacy Mode */}
            <View style={styles.rowItem}>
              <View style={styles.rowLeft}>
                <View style={[styles.itemIcon, { backgroundColor: 'rgba(255, 159, 10, 0.15)' }]}>
                  <Icon name="EyeOff" size={18} color={THEME.colors.warning} />
                </View>
                <View>
                  <Text style={styles.rowTitle}>Privacy Mode</Text>
                  <Text style={styles.rowSubtitle}>Hide sensitive balances on screen</Text>
                </View>
              </View>
              <Switch
                value={!isSensitiveDataVisible}
                onValueChange={() => {
                  triggerHaptic.selection();
                  toggleSensitiveData();
                }}
                trackColor={{ false: THEME.colors.surfaceSubtle, true: THEME.colors.primary }}
                thumbColor="#FFFFFF"
              />
            </View>
          </View>
        </View>

        {/* Section: Data Storage Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>DATA MANAGEMENT</Text>
          <View style={styles.card}>
            {/* Seed Demo Data */}
            <Pressable style={styles.rowItem} onPress={handleRestoreDemoData}>
              <View style={styles.rowLeft}>
                <View style={[styles.itemIcon, { backgroundColor: THEME.colors.primaryGlow }]}>
                  <Icon name="Database" size={18} color={THEME.colors.primary} />
                </View>
                <View>
                  <Text style={styles.rowTitle}>Load Demo Data</Text>
                  <Text style={styles.rowSubtitle}>Populate sample expenses & budgets</Text>
                </View>
              </View>
              <Icon name="Download" size={18} color={THEME.colors.primary} />
            </Pressable>

            <View style={styles.divider} />

            {/* Export Data */}
            <Pressable style={styles.rowItem} onPress={handleExportData}>
              <View style={styles.rowLeft}>
                <View style={[styles.itemIcon, { backgroundColor: 'rgba(255, 255, 255, 0.08)' }]}>
                  <Icon name="Share2" size={18} color={THEME.colors.textPrimary} />
                </View>
                <View>
                  <Text style={styles.rowTitle}>Backup & Export</Text>
                  <Text style={styles.rowSubtitle}>Export JSON to files or clipboard</Text>
                </View>
              </View>
              <Icon name="ChevronRight" size={18} color={THEME.colors.textMuted} />
            </Pressable>

            <View style={styles.divider} />

            {/* Clear All Storage */}
            <Pressable
              style={styles.rowItem}
              onPress={() => {
                triggerHaptic.medium();
                setIsClearModalVisible(true);
              }}
            >
              <View style={styles.rowLeft}>
                <View style={[styles.itemIcon, { backgroundColor: THEME.colors.expenseBg }]}>
                  <Icon name="Trash2" size={18} color={THEME.colors.expense} />
                </View>
                <View>
                  <Text style={[styles.rowTitle, { color: THEME.colors.expense }]}>
                    Clear Local Storage
                  </Text>
                  <Text style={styles.rowSubtitle}>Delete all saved records</Text>
                </View>
              </View>
              <Icon name="ChevronRight" size={18} color={THEME.colors.textMuted} />
            </Pressable>
          </View>
        </View>

        {/* Footer Note */}
        <View style={styles.footerNote}>
          <Text style={styles.footerText}>Never Settle • OnePlus Design</Text>
          <Text style={styles.footerSubtext}>100% On-Device Mobile Storage</Text>
        </View>

        {/* Currency Picker Modal */}
        <Modal
          visible={isCurrencyModalVisible}
          transparent
          animationType="fade"
          onRequestClose={() => {
            triggerHaptic.light();
            setIsCurrencyModalVisible(false);
          }}
        >
          <View style={styles.modalBackdrop}>
            <View style={styles.modalCard}>
              <Text style={styles.modalTitle}>Choose Currency</Text>
              <View style={styles.currencyList}>
                {CURRENCIES.map((c) => {
                  const isSelected = settings.currency === c.code;
                  return (
                    <Pressable
                      key={c.code}
                      style={[styles.currencyItem, isSelected && styles.currencyItemActive]}
                      onPress={async () => {
                        triggerHaptic.selection();
                        await setCurrency(c.code);
                        setIsCurrencyModalVisible(false);
                      }}
                    >
                      <View style={styles.currencyInfo}>
                        <Text style={styles.currencySymbol}>{c.symbol}</Text>
                        <Text style={styles.currencyName}>{c.label}</Text>
                      </View>
                      {isSelected && (
                        <Icon name="Check" size={18} color={THEME.colors.primary} />
                      )}
                    </Pressable>
                  );
                })}
              </View>
              <Pressable
                style={styles.modalCloseBtn}
                onPress={() => {
                  triggerHaptic.light();
                  setIsCurrencyModalVisible(false);
                }}
              >
                <Text style={styles.modalCloseText}>Cancel</Text>
              </Pressable>
            </View>
          </View>
        </Modal>

        {/* Name Edit Modal */}
        <Modal
          visible={isNameModalVisible}
          transparent
          animationType="fade"
          onRequestClose={() => {
            triggerHaptic.light();
            setIsNameModalVisible(false);
          }}
        >
          <View style={styles.modalBackdrop}>
            <View style={styles.modalCard}>
              <Text style={styles.modalTitle}>Your Name</Text>
              <TextInput
                style={styles.nameTextInput}
                value={nameInput}
                onChangeText={setNameInput}
                placeholder="Enter your name"
                placeholderTextColor={THEME.colors.textMuted}
                autoFocus
              />
              <View style={styles.modalButtonsRow}>
                <Pressable
                  style={styles.modalCancelBtn}
                  onPress={() => {
                    triggerHaptic.light();
                    setIsNameModalVisible(false);
                  }}
                >
                  <Text style={styles.modalCancelText}>Cancel</Text>
                </Pressable>
                <Pressable
                  style={styles.modalSaveBtn}
                  onPress={async () => {
                    await setUserName(nameInput.trim() || 'Tharun');
                    setIsNameModalVisible(false);
                    triggerHaptic.success();
                  }}
                >
                  <Text style={styles.modalSaveText}>Save</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>

        {/* Clear Data Confirmation Modal */}
        <Modal
          visible={isClearModalVisible}
          transparent
          animationType="fade"
          onRequestClose={() => {
            triggerHaptic.light();
            setIsClearModalVisible(false);
          }}
        >
          <View style={styles.modalBackdrop}>
            <View style={styles.modalCard}>
              <View style={styles.dangerIconWrap}>
                <Icon name="AlertTriangle" size={26} color={THEME.colors.expense} />
              </View>
              <Text style={styles.modalTitle}>Clear Local Storage?</Text>
              <Text style={styles.confirmSubtitle}>
                This will delete all saved transactions and budgets from your mobile device. This action cannot be undone.
              </Text>
              <View style={styles.modalButtonsRow}>
                <Pressable
                  style={styles.modalCancelBtn}
                  onPress={() => {
                    triggerHaptic.light();
                    setIsClearModalVisible(false);
                  }}
                >
                  <Text style={styles.modalCancelText}>Cancel</Text>
                </Pressable>
                <Pressable
                  style={[styles.modalSaveBtn, { backgroundColor: THEME.colors.expense }]}
                  onPress={handleClearData}
                >
                  <Text style={styles.modalSaveText}>Clear Everything</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: THEME.colors.background,
  },
  container: {
    flex: 1,
    backgroundColor: THEME.colors.background,
  },
  contentContainer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 110,
  },
  header: {
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: '900',
    color: THEME.colors.textPrimary,
    letterSpacing: -0.5,
    fontFamily: THEME.typography.fontFamily,
  },
  headerSubtitle: {
    fontSize: 13,
    color: THEME.colors.textMuted,
    marginTop: 2,
    fontFamily: THEME.typography.fontFamily,
  },
  toastCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.colors.primaryGlow,
    borderWidth: 1,
    borderColor: 'rgba(235, 0, 40, 0.4)',
    padding: 12,
    borderRadius: THEME.borderRadius.md,
    gap: 8,
    marginBottom: 16,
  },
  toastText: {
    fontSize: 13,
    color: THEME.colors.textPrimary,
    fontWeight: '700',
    fontFamily: THEME.typography.fontFamily,
  },
  storageCard: {
    backgroundColor: THEME.colors.surface,
    borderRadius: THEME.borderRadius.xl,
    padding: 18,
    borderWidth: 1,
    borderColor: THEME.colors.borderStrong,
    marginBottom: 20,
    ...THEME.shadows.card,
  },
  storageCardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 16,
  },
  storageIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: THEME.colors.backgroundElevated,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  storageTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 3,
  },
  storageTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: THEME.colors.textPrimary,
    fontFamily: THEME.typography.fontFamily,
  },
  offlineBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.colors.primaryGlow,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    gap: 5,
    borderWidth: 1,
    borderColor: 'rgba(235, 0, 40, 0.4)',
  },
  onlineDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: THEME.colors.primary,
  },
  offlineBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: THEME.colors.primaryLight,
    fontFamily: THEME.typography.fontFamily,
  },
  storageSubtitle: {
    fontSize: 12,
    color: THEME.colors.textMuted,
    lineHeight: 16,
    fontFamily: THEME.typography.fontFamily,
  },
  storageStatsGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  statBox: {
    flex: 1,
    backgroundColor: THEME.colors.backgroundElevated,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: THEME.borderRadius.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  statNumber: {
    fontSize: 18,
    fontWeight: '900',
    color: THEME.colors.textPrimary,
    fontFamily: THEME.typography.fontFamily,
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: THEME.colors.textMuted,
    marginTop: 2,
    fontFamily: THEME.typography.fontFamily,
  },
  section: {
    marginBottom: 20,
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
  card: {
    backgroundColor: THEME.colors.surface,
    borderRadius: THEME.borderRadius.lg,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    overflow: 'hidden',
  },
  rowItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  itemIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: THEME.colors.textPrimary,
    fontFamily: THEME.typography.fontFamily,
  },
  rowSubtitle: {
    fontSize: 12,
    color: THEME.colors.textMuted,
    marginTop: 2,
    fontFamily: THEME.typography.fontFamily,
  },
  divider: {
    height: 1,
    backgroundColor: THEME.colors.border,
  },
  footerNote: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  footerText: {
    fontSize: 12,
    color: THEME.colors.primaryLight,
    fontWeight: '800',
    letterSpacing: 0.5,
    fontFamily: THEME.typography.fontFamily,
  },
  footerSubtext: {
    fontSize: 11,
    color: THEME.colors.textMuted,
    marginTop: 2,
    fontFamily: THEME.typography.fontFamily,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.82)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: THEME.colors.surface,
    borderRadius: THEME.borderRadius.xl,
    padding: 20,
    borderWidth: 1,
    borderColor: THEME.colors.borderStrong,
    ...THEME.shadows.card,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: THEME.colors.textPrimary,
    marginBottom: 14,
    textAlign: 'center',
    fontFamily: THEME.typography.fontFamily,
  },
  currencyList: {
    gap: 8,
    marginBottom: 16,
  },
  currencyItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: THEME.borderRadius.md,
    backgroundColor: THEME.colors.backgroundElevated,
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  currencyItemActive: {
    borderColor: THEME.colors.primary,
    backgroundColor: THEME.colors.primaryGlow,
  },
  currencyInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  currencySymbol: {
    fontSize: 16,
    fontWeight: '800',
    color: THEME.colors.primary,
    width: 24,
    fontFamily: THEME.typography.fontFamily,
  },
  currencyName: {
    fontSize: 14,
    fontWeight: '700',
    color: THEME.colors.textPrimary,
    fontFamily: THEME.typography.fontFamily,
  },
  modalCloseBtn: {
    paddingVertical: 10,
    alignItems: 'center',
  },
  modalCloseText: {
    fontSize: 14,
    color: THEME.colors.textMuted,
    fontWeight: '700',
    fontFamily: THEME.typography.fontFamily,
  },
  nameTextInput: {
    backgroundColor: THEME.colors.backgroundElevated,
    borderRadius: THEME.borderRadius.md,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: THEME.colors.textPrimary,
    fontSize: 15,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    marginBottom: 18,
    fontFamily: THEME.typography.fontFamily,
  },
  modalButtonsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  modalCancelBtn: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: THEME.borderRadius.md,
    backgroundColor: THEME.colors.surfaceSubtle,
  },
  modalCancelText: {
    fontSize: 14,
    fontWeight: '700',
    color: THEME.colors.textSecondary,
    fontFamily: THEME.typography.fontFamily,
  },
  modalSaveBtn: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: THEME.borderRadius.md,
    backgroundColor: THEME.colors.primary,
    ...THEME.shadows.floating,
  },
  modalSaveText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
    fontFamily: THEME.typography.fontFamily,
  },
  dangerIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: THEME.colors.expenseBg,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: 12,
  },
  confirmSubtitle: {
    fontSize: 13,
    color: THEME.colors.textMuted,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 18,
    fontFamily: THEME.typography.fontFamily,
  },
});

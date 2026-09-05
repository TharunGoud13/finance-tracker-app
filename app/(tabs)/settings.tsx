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
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useSettingsStore } from '../../src/store/useSettingsStore';
import { useTransactionStore } from '../../src/store/useTransactionStore';
import { useBudgetStore } from '../../src/store/useBudgetStore';
import { useGoalStore } from '../../src/store/useGoalStore';
import { usePrivacyStore } from '../../src/store/usePrivacyStore';
import { UpdateService } from '../../src/services/updateService';
import { NotificationService } from '../../src/services/notificationService';
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
  const setNotificationsEnabled = useSettingsStore((state) => state.setNotificationsEnabled);
  const setReminderInterval = useSettingsStore((state) => state.setReminderInterval);

  const transactions = useTransactionStore((state) => state.transactions);
  const clearAllTransactions = useTransactionStore((state) => state.clearAllTransactions);

  const categories = useBudgetStore((state) => state.categories);
  const budgets = useBudgetStore((state) => state.budgets);
  const clearAllBudgets = useBudgetStore((state) => state.clearAllBudgets);
  const clearAllGoals = useGoalStore((state) => state.clearAllGoals);

  const isSensitiveDataVisible = usePrivacyStore((state) => state.isSensitiveDataVisible);
  const toggleSensitiveData = usePrivacyStore((state) => state.toggleSensitiveData);

  const [isCurrencyModalVisible, setIsCurrencyModalVisible] = useState(false);
  const [isNameModalVisible, setIsNameModalVisible] = useState(false);
  const [nameInput, setNameInput] = useState(settings.userName || 'Tharun');

  const [isClearModalVisible, setIsClearModalVisible] = useState(false);
  const [statusBanner, setStatusBanner] = useState('');
  const [isTestingNotification, setIsTestingNotification] = useState(false);

  const handleToggleNotifications = async (val: boolean) => {
    triggerHaptic.selection();
    await setNotificationsEnabled(val);
    setStatusBanner(
      val
        ? `Expense reminders active (Every ${settings.reminderIntervalHours || 3} hours)`
        : 'Expense reminders disabled'
    );
    setTimeout(() => setStatusBanner(''), 3500);
  };

  const handleSelectInterval = async (hours: number) => {
    triggerHaptic.selection();
    await setReminderInterval(hours);
    setStatusBanner(`Reminder scheduled for every ${hours} hours`);
    setTimeout(() => setStatusBanner(''), 3000);
  };

  const handleTestNotification = async () => {
    triggerHaptic.medium();
    setIsTestingNotification(true);
    try {
      const res = await NotificationService.sendTestNotification();
      setIsTestingNotification(false);
      if (res.success) {
        triggerHaptic.success();
        setStatusBanner('Test reminder sent! Check your notification tray.');
        setTimeout(() => setStatusBanner(''), 3500);
      } else {
        triggerHaptic.warning();
        Alert.alert('Notification Notice', res.message);
      }
    } catch (e: any) {
      setIsTestingNotification(false);
      triggerHaptic.error();
      Alert.alert('Error', e?.message || 'Could not send test notification.');
    }
  };

  // Updates state
  const [isCheckingUpdate, setIsCheckingUpdate] = useState(false);
  const [isDownloadingUpdate, setIsDownloadingUpdate] = useState(false);
  const [updateSubtitle, setUpdateSubtitle] = useState('EAS OTA Channel: production • Tap to check');
  const updateMetadata = UpdateService.getMetadata();

  const handleCheckUpdates = async () => {
    triggerHaptic.medium();
    setIsCheckingUpdate(true);
    setUpdateSubtitle('Connecting to EAS Update servers...');

    try {
      const checkResult = await UpdateService.checkForUpdate();

      if (checkResult.isDevelopment) {
        setIsCheckingUpdate(false);
        setUpdateSubtitle('EAS Updates active in APK/release builds');
        Alert.alert(
          'Development Mode',
          'EAS OTA Updates run on standalone production APK builds. In local development, updates are served instantly by Metro.',
          [{ text: 'OK' }]
        );
        return;
      }

      if (checkResult.error) {
        setIsCheckingUpdate(false);
        setUpdateSubtitle('Update check failed');
        Alert.alert(
          'Update Check Failed',
          checkResult.error || 'Could not connect to update servers. Check your internet connection.',
          [{ text: 'OK' }]
        );
        return;
      }

      if (checkResult.isAvailable) {
        setIsCheckingUpdate(false);
        setIsDownloadingUpdate(true);
        setUpdateSubtitle('Downloading update bundle...');
        triggerHaptic.success();

        Alert.alert(
          'Update Available!',
          'A new update is available. Downloading and applying it now...',
          [
            {
              text: 'Apply & Restart',
              onPress: async () => {
                const downloadResult = await UpdateService.fetchAndApplyUpdate();
                if (!downloadResult.success) {
                  setIsDownloadingUpdate(false);
                  setUpdateSubtitle('Failed to install update');
                  Alert.alert('Update Error', downloadResult.error || 'Could not apply update.');
                }
              },
            },
          ]
        );

        const downloadResult = await UpdateService.fetchAndApplyUpdate();
        if (!downloadResult.success) {
          setIsDownloadingUpdate(false);
          setUpdateSubtitle('Failed to install update');
          Alert.alert('Update Error', downloadResult.error || 'Could not apply update.');
        }
      } else {
        setIsCheckingUpdate(false);
        setUpdateSubtitle('App is up to date (Latest bundle)');
        triggerHaptic.success();
        setStatusBanner('You are running the latest version of OneFinance.');
        setTimeout(() => setStatusBanner(''), 3500);
        Alert.alert('No Updates Available', 'OneFinance is already running the latest version.', [
          { text: 'OK' },
        ]);
      }
    } catch (e: any) {
      setIsCheckingUpdate(false);
      setIsDownloadingUpdate(false);
      setUpdateSubtitle('Error checking updates');
      Alert.alert('Error', e?.message || 'An unexpected error occurred while checking for updates.');
    }
  };

  const handleClearData = async () => {
    setIsClearModalVisible(false);
    triggerHaptic.heavy();
    await clearAllTransactions();
    await clearAllBudgets();
    await clearAllGoals();
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

        {/* Section: Notifications & Expense Reminders */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>NOTIFICATIONS & REMINDERS</Text>
          <View style={styles.card}>
            {/* Master Toggle */}
            <View style={styles.rowItem}>
              <View style={styles.rowLeft}>
                <View style={[styles.itemIcon, { backgroundColor: THEME.colors.primaryGlow }]}>
                  <Icon name="BellRing" size={18} color={THEME.colors.primary} />
                </View>
                <View style={{ flex: 1, paddingRight: 8 }}>
                  <Text style={styles.rowTitle}>Expense Reminders</Text>
                  <Text style={styles.rowSubtitle}>
                    {settings.notificationsEnabled
                      ? `Active • Reminds every ${settings.reminderIntervalHours || 3} hours`
                      : 'Disabled • Turn on for timely reminders'}
                  </Text>
                </View>
              </View>
              <Switch
                value={settings.notificationsEnabled}
                onValueChange={handleToggleNotifications}
                trackColor={{ false: THEME.colors.surfaceSubtle, true: THEME.colors.primary }}
                thumbColor="#FFFFFF"
              />
            </View>

            {settings.notificationsEnabled && (
              <>
                <View style={styles.divider} />

                {/* Interval Selection */}
                <View style={styles.intervalContainer}>
                  <View style={styles.intervalHeader}>
                    <Text style={styles.intervalTitle}>REMINDER FREQUENCY</Text>
                    <Text style={styles.intervalSubtitle}>
                      Prompt to log expenses every {settings.reminderIntervalHours || 3} hours
                    </Text>
                  </View>

                  <View style={styles.intervalChipsRow}>
                    {[
                      { hours: 3, label: 'Every 3 Hours', tag: 'Recommended' },
                      { hours: 4, label: 'Every 4 Hours', tag: 'Balanced' },
                      { hours: 6, label: 'Every 6 Hours', tag: 'Relaxed' },
                    ].map((item) => {
                      const isActive = (settings.reminderIntervalHours || 3) === item.hours;
                      return (
                        <Pressable
                          key={item.hours}
                          style={[
                            styles.intervalChip,
                            isActive && styles.intervalChipActive,
                          ]}
                          onPress={() => handleSelectInterval(item.hours)}
                        >
                          <Text
                            style={[
                              styles.intervalChipText,
                              isActive && styles.intervalChipTextActive,
                            ]}
                          >
                            {item.hours} hrs
                          </Text>
                          <Text
                            style={[
                              styles.intervalChipTag,
                              isActive && styles.intervalChipTagActive,
                            ]}
                          >
                            {item.tag}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </View>

                <View style={styles.divider} />

                {/* Send Test Notification Button */}
                <Pressable
                  style={styles.rowItem}
                  disabled={isTestingNotification}
                  onPress={handleTestNotification}
                >
                  <View style={styles.rowLeft}>
                    <View style={[styles.itemIcon, { backgroundColor: 'rgba(255, 255, 255, 0.08)' }]}>
                      {isTestingNotification ? (
                        <ActivityIndicator size="small" color={THEME.colors.primary} />
                      ) : (
                        <Icon name="Send" size={18} color={THEME.colors.textPrimary} />
                      )}
                    </View>
                    <View>
                      <Text style={styles.rowTitle}>Send Test Notification</Text>
                      <Text style={styles.rowSubtitle}>
                        Test audio, banner & vibration immediately
                      </Text>
                    </View>
                  </View>
                  <Icon name="ChevronRight" size={18} color={THEME.colors.textMuted} />
                </Pressable>

                {/* Educational Tip Box */}
                <View style={styles.notificationTipCard}>
                  <Icon name="Sparkles" size={15} color={THEME.colors.primary} />
                  <Text style={styles.notificationTipText}>
                    Tapping the notification opens OneFinance directly to the expense logger so you can record spending in 5 seconds.
                  </Text>
                </View>
              </>
            )}
          </View>
        </View>

        {/* Section: Data Storage Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>DATA MANAGEMENT</Text>
          <View style={styles.card}>
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
                  <Text style={styles.rowSubtitle}>Delete all saved records (start fresh)</Text>
                </View>
              </View>
              <Icon name="ChevronRight" size={18} color={THEME.colors.textMuted} />
            </Pressable>
          </View>
        </View>

        {/* Section: System & EAS Updates */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>SYSTEM & UPDATES</Text>
          <View style={styles.card}>
            {/* Check for Updates */}
            <Pressable
              style={styles.rowItem}
              disabled={isCheckingUpdate || isDownloadingUpdate}
              onPress={handleCheckUpdates}
            >
              <View style={styles.rowLeft}>
                <View style={[styles.itemIcon, { backgroundColor: THEME.colors.primaryGlow }]}>
                  {isCheckingUpdate || isDownloadingUpdate ? (
                    <ActivityIndicator size="small" color={THEME.colors.primary} />
                  ) : (
                    <Icon name="CloudDownload" size={18} color={THEME.colors.primary} />
                  )}
                </View>
                <View style={{ flex: 1, paddingRight: 8 }}>
                  <Text style={styles.rowTitle}>Check for Updates</Text>
                  <Text style={styles.rowSubtitle} numberOfLines={2}>
                    {updateSubtitle}
                  </Text>
                </View>
              </View>
              {isCheckingUpdate || isDownloadingUpdate ? (
                <Text style={styles.updatingText}>
                  {isDownloadingUpdate ? 'Downloading...' : 'Checking...'}
                </Text>
              ) : (
                <Icon name="ChevronRight" size={18} color={THEME.colors.textMuted} />
              )}
            </Pressable>

            <View style={styles.divider} />

            {/* Version & Channel Info */}
            <View style={styles.rowItem}>
              <View style={styles.rowLeft}>
                <View style={[styles.itemIcon, { backgroundColor: 'rgba(255, 255, 255, 0.08)' }]}>
                  <Icon name="Info" size={18} color={THEME.colors.textPrimary} />
                </View>
                <View>
                  <Text style={styles.rowTitle}>App Version</Text>
                  <Text style={styles.rowSubtitle}>
                    v1.0.0 • EAS Channel: {updateMetadata.channel}
                  </Text>
                </View>
              </View>
              <View style={styles.versionBadge}>
                <Text style={styles.versionBadgeText}>Production</Text>
              </View>
            </View>
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
  updatingText: {
    fontSize: 12,
    fontWeight: '700',
    color: THEME.colors.primary,
    fontFamily: THEME.typography.fontFamily,
  },
  versionBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  versionBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: THEME.colors.textSecondary,
    fontFamily: THEME.typography.fontFamily,
  },
  intervalContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  intervalHeader: {
    marginBottom: 10,
  },
  intervalTitle: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.1,
    color: THEME.colors.textMuted,
    fontFamily: THEME.typography.fontFamily,
  },
  intervalSubtitle: {
    fontSize: 12,
    color: THEME.colors.textSecondary,
    marginTop: 2,
    fontFamily: THEME.typography.fontFamily,
  },
  intervalChipsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  intervalChip: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: THEME.borderRadius.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  intervalChipActive: {
    borderColor: THEME.colors.primary,
    backgroundColor: THEME.colors.primaryGlow,
  },
  intervalChipText: {
    fontSize: 13,
    fontWeight: '700',
    color: THEME.colors.textSecondary,
    fontFamily: THEME.typography.fontFamily,
  },
  intervalChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  intervalChipTag: {
    fontSize: 9,
    fontWeight: '600',
    color: THEME.colors.textMuted,
    marginTop: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    fontFamily: THEME.typography.fontFamily,
  },
  intervalChipTagActive: {
    color: THEME.colors.primary,
    fontWeight: '700',
  },
  notificationTipCard: {
    marginHorizontal: 16,
    marginBottom: 14,
    marginTop: 4,
    padding: 12,
    borderRadius: THEME.borderRadius.md,
    backgroundColor: 'rgba(235, 0, 41, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(235, 0, 41, 0.15)',
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
  },
  notificationTipText: {
    flex: 1,
    fontSize: 12,
    color: THEME.colors.textSecondary,
    lineHeight: 17,
    fontFamily: THEME.typography.fontFamily,
  },
});

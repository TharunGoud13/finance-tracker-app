import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Modal,
  TextInput,
  Share,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { useSettingsStore } from '../../src/store/useSettingsStore';
import { useTransactionStore } from '../../src/store/useTransactionStore';
import { useBudgetStore } from '../../src/store/useBudgetStore';
import { useGoalStore } from '../../src/store/useGoalStore';
import { useRecurringStore } from '../../src/store/useRecurringStore';
import { StorageService } from '../../src/services/storageService';
import { SUPPORTED_CURRENCIES } from '../../src/constants/currencies';
import { Switch } from '../../src/components/ui/Switch';
import { Button } from '../../src/components/ui/Button';
import { Icon } from '../../src/components/ui/Icon';
import { HapticPressable } from '../../src/components/ui/HapticPressable';
import { AppDialog, AppAlert } from '../../src/components/ui/AppDialog';
import { UpdateService } from '../../src/services/updateService';
import { CurrencyCode } from '../../src/types';

export default function SettingsScreen() {
  const router = useRouter();
  const settings = useSettingsStore((state) => state.settings);
  const updateSettings = useSettingsStore((state) => state.updateSettings);
  const resetAllSettings = useSettingsStore((state) => state.resetAllData);

  const [isCheckingUpdate, setIsCheckingUpdate] = useState(false);

  const [isCurrencyModalVisible, setIsCurrencyModalVisible] = useState(false);
  const [isNameModalVisible, setIsNameModalVisible] = useState(false);
  const [nameInput, setNameInput] = useState(settings.userName);

  // In-app dialog state (replaces Alert.alert)
  const [dialog, setDialog] = useState<{
    visible: boolean;
    title: string;
    message?: string;
    icon?: string;
    iconColor?: string;
    actions: { label: string; onPress: () => void; style?: 'default' | 'cancel' | 'destructive' }[];
  }>({ visible: false, title: '', actions: [] });

  const showAlert = (title: string, message?: string, icon = 'Info', iconColor = '#0a84ff') => {
    setDialog({
      visible: true, title, message, icon, iconColor,
      actions: [{ label: 'OK', onPress: () => setDialog((d) => ({ ...d, visible: false })), style: 'cancel' }],
    });
  };

  const showConfirm = (
    title: string,
    message: string,
    confirmLabel: string,
    onConfirm: () => void,
    destructive = false,
    icon = 'AlertTriangle',
    iconColor = '#ff453a'
  ) => {
    setDialog({
      visible: true, title, message, icon, iconColor,
      actions: [
        { label: 'Cancel', onPress: () => setDialog((d) => ({ ...d, visible: false })), style: 'cancel' },
        { label: confirmLabel, onPress: () => { setDialog((d) => ({ ...d, visible: false })); onConfirm(); }, style: destructive ? 'destructive' : 'default' },
      ],
    });
  };

  const handleExportData = async () => {
    try {
      const json = await StorageService.exportAllData();
      await Share.share({ title: 'OneFinance Backup Data', message: json });
    } catch (e) {
      showAlert('Export Failed', 'Could not export financial data.', 'AlertCircle', '#eb0028');
    }
  };

  const handleCheckForUpdates = async () => {
    setIsCheckingUpdate(true);
    try {
      const res = await UpdateService.checkForAndApplyUpdate();
      if (res.status === 'updated') {
        showAlert('Update Applied', 'The latest version was downloaded and applied!', 'CheckCircle2', '#30d158');
      } else if (res.status === 'no_update') {
        showAlert('Up to Date', 'You are running the latest version of OneFinance.', 'CheckCircle2', '#30d158');
      } else if (res.status === 'dev_mode') {
        showAlert(
          'Development Mode',
          'Over-The-Air (OTA) updates are active in standalone production and preview builds. In local development, Metro reloads your code automatically.',
          'Info',
          '#0a84ff'
        );
      } else {
        showAlert('Update Notice', res.message, 'AlertCircle', '#ff9f0a');
      }
    } catch (e: any) {
      showAlert('Update Error', e?.message || 'Could not verify updates.', 'AlertCircle', '#eb0028');
    } finally {
      setIsCheckingUpdate(false);
    }
  };

  const handleClearAllData = () => {
    showConfirm(
      'Clear All Data?',
      'This will permanently delete all your transactions, custom categories, budgets, and savings goals. This cannot be undone.',
      'Clear Everything',
      async () => {
        await resetAllSettings();
        await useTransactionStore.getState().clearAllTransactions();
        await useBudgetStore.getState().clearAllBudgets();
        await useGoalStore.getState().clearAllGoals();
        showAlert('Data Cleared', 'All financial data has been wiped.', 'Trash2', '#ff453a');
      },
      true
    );
  };

  const handleSaveName = async () => {
    if (nameInput.trim()) {
      await updateSettings({ userName: nameInput.trim() });
      setIsNameModalVisible(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <StatusBar style="light" />
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.screenTitle}>Settings</Text>
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
          {/* Profile Card */}
          <View style={styles.profileCard}>
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarText}>
                {settings.userName.charAt(0).toUpperCase()}
              </Text>
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.userName}>{settings.userName}</Text>
              <Text style={styles.userRole}>Personal Account</Text>
            </View>
            <HapticPressable
              onPress={() => { setNameInput(settings.userName); setIsNameModalVisible(true); }}
              hapticType="light"
              style={styles.editBtn}
            >
              <Text style={styles.editBtnText}>Edit</Text>
            </HapticPressable>
          </View>

          {/* Finance Tools */}
          <Text style={styles.sectionLabel}>FINANCE TOOLS</Text>
          <View style={styles.group}>
            <SettingsRow
              iconName="Target"
              iconBg="#30d158"
              label="Savings Goals"
              onPress={() => router.push('/modal/savings-goals')}
              showChevron
            />
            <View style={styles.divider} />
            <SettingsRow
              iconName="Repeat"
              iconBg="#0a84ff"
              label="Recurring Transactions"
              onPress={() => router.push('/modal/recurring')}
              showChevron
            />
            <View style={styles.divider} />
            <SettingsRow
              iconName="Tag"
              iconBg="#af52de"
              label="Custom Categories"
              onPress={() => router.push('/modal/manage-categories')}
              showChevron
            />
          </View>

          {/* Preferences */}
          <Text style={styles.sectionLabel}>PREFERENCES</Text>
          <View style={styles.group}>
            <View style={styles.row}>
              <View style={styles.rowLeft}>
                <View style={[styles.iconBox, { backgroundColor: '#ff9f0a' }]}>
                  <Icon name="DollarSign" size={16} color="#ffffff" />
                </View>
                <Text style={styles.rowLabel}>Currency</Text>
              </View>
              <HapticPressable
                onPress={() => setIsCurrencyModalVisible(true)}
                hapticType="light"
                style={styles.rowRight}
              >
                <Text style={styles.rowValue}>{SUPPORTED_CURRENCIES[settings.currency]?.label}</Text>
                <Icon name="ChevronRight" size={16} color="rgba(235, 235, 245, 0.3)" />
              </HapticPressable>
            </View>
            <View style={styles.divider} />
            <View style={styles.row}>
              <View style={styles.rowLeft}>
                <View style={[styles.iconBox, { backgroundColor: '#ff453a' }]}>
                  <Icon name="Bell" size={16} color="#ffffff" />
                </View>
                <Text style={styles.rowLabel}>Daily Reminders</Text>
              </View>
              <Switch
                value={settings.notificationsEnabled}
                onValueChange={(val) => updateSettings({ notificationsEnabled: val })}
              />
            </View>
          </View>

          {/* Privacy & Security */}
          <Text style={styles.sectionLabel}>PRIVACY & SECURITY</Text>
          <View style={styles.group}>
            <View style={styles.row}>
              <View style={styles.rowLeft}>
                <View style={[styles.iconBox, { backgroundColor: '#5e5ce6' }]}>
                  <Icon name="EyeOff" size={16} color="#ffffff" />
                </View>
                <Text style={styles.rowLabel}>Hide on Background</Text>
              </View>
              <Switch
                value={settings.autoLockOnBackground}
                onValueChange={(val) => updateSettings({ autoLockOnBackground: val })}
              />
            </View>
            <View style={styles.divider} />
            <View style={styles.row}>
              <View style={styles.rowLeft}>
                <View style={[styles.iconBox, { backgroundColor: '#64d2ff' }]}>
                  <Icon name="Fingerprint" size={16} color="#ffffff" />
                </View>
                <Text style={styles.rowLabel}>Biometric Unlock</Text>
              </View>
              <Switch
                value={settings.biometricAuthEnabled}
                onValueChange={(val) => updateSettings({ biometricAuthEnabled: val })}
              />
            </View>
          </View>

          {/* Data Management */}
          <Text style={styles.sectionLabel}>DATA MANAGEMENT</Text>
          <View style={styles.group}>
            <View style={styles.row}>
              <View style={styles.rowLeft}>
                <View style={[styles.iconBox, { backgroundColor: '#636366' }]}>
                  <Icon name="Database" size={16} color="#ffffff" />
                </View>
                <Text style={styles.rowLabel}>Local Storage Used</Text>
              </View>
              <Text style={styles.rowValue}>~2.4 MB</Text>
            </View>
            <View style={styles.divider} />
            <SettingsRow
              iconName="Download"
              iconBg="#5e5ce6"
              label="Export Data to JSON"
              onPress={handleExportData}
              showChevron
            />
            <View style={styles.divider} />
            <SettingsRow
              iconName="Trash2"
              iconBg="rgba(255,69,58,0.15)"
              iconBorder="rgba(255,69,58,0.3)"
              iconColor="#ff453a"
              label="Clear All Data"
              labelColor="#ff453a"
              onPress={handleClearAllData}
              showChevron
              chevronColor="rgba(255,69,58,0.4)"
              hapticType="heavy"
            />
          </View>

          {/* App Updates Section (OTA EAS Updates) */}
          <Text style={styles.sectionLabel}>UPDATES & VERSION</Text>
          <View style={styles.group}>
            <SettingsRow
              iconName="RefreshCw"
              iconBg="rgba(10,132,255,0.2)"
              iconBorder="rgba(10,132,255,0.35)"
              iconColor="#0a84ff"
              label={isCheckingUpdate ? "Checking for Updates..." : "Check for Updates"}
              labelColor="#0a84ff"
              onPress={handleCheckForUpdates}
              showChevron
              chevronColor="rgba(10,132,255,0.4)"
              hapticType="medium"
            />
          </View>

          {/* About */}
          <View style={styles.aboutSection}>
            <Text style={styles.appName}>OneFinance Mobile</Text>
            <Text style={styles.appVersion}>Version 1.0.0 · EAS OTA Updates Enabled</Text>
          </View>
        </ScrollView>
      </View>

      {/* Currency Modal */}
      <Modal
        visible={isCurrencyModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setIsCurrencyModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Select Currency</Text>
            <View style={{ gap: 8 }}>
              {Object.keys(SUPPORTED_CURRENCIES).map((key) => {
                const code = key as CurrencyCode;
                const conf = SUPPORTED_CURRENCIES[code];
                const active = settings.currency === code;
                return (
                  <HapticPressable
                    key={code}
                    onPress={() => { updateSettings({ currency: code }); setIsCurrencyModalVisible(false); }}
                    hapticType="selection"
                    style={[styles.currOption, active && styles.currOptionActive]}
                  >
                    <View style={styles.currLeft}>
                      <Text style={styles.currSymbol}>{conf.symbol}</Text>
                      <Text style={styles.currLabel}>{conf.label}</Text>
                    </View>
                    {active && <Icon name="Check" size={18} color="#eb0028" />}
                  </HapticPressable>
                );
              })}
            </View>
            <Button title="Close" variant="secondary" onPress={() => setIsCurrencyModalVisible(false)} style={{ marginTop: 14 }} />
          </View>
        </View>
      </Modal>

      {/* Edit Name Modal */}
      <Modal
        visible={isNameModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setIsNameModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Update Name</Text>
            <TextInput
              value={nameInput}
              onChangeText={setNameInput}
              placeholder="Enter your name"
              placeholderTextColor="rgba(235, 235, 245, 0.35)"
              style={styles.nameInput}
              autoFocus
            />
            <View style={{ flexDirection: 'row', gap: 12, marginTop: 16 }}>
              <Button title="Cancel" variant="secondary" onPress={() => setIsNameModalVisible(false)} style={{ flex: 1 }} />
              <Button title="Save" variant="primary" onPress={handleSaveName} style={{ flex: 1 }} />
            </View>
          </View>
        </View>
      </Modal>

      {/* Universal in-app dialog (replaces Alert.alert) */}
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

// ─── Reusable row component ──────────────────────────────────────────────────
interface SettingsRowProps {
  iconName: string;
  iconBg: string;
  iconBorder?: string;
  iconColor?: string;
  label: string;
  labelColor?: string;
  onPress: () => void;
  showChevron?: boolean;
  chevronColor?: string;
  hapticType?: 'light' | 'medium' | 'heavy' | 'selection';
}

function SettingsRow({
  iconName, iconBg, iconBorder, iconColor = '#ffffff',
  label, labelColor = '#ffffff',
  onPress, showChevron, chevronColor = 'rgba(235,235,245,0.3)',
  hapticType = 'light',
}: SettingsRowProps) {
  return (
    <HapticPressable
      onPress={onPress}
      hapticType={hapticType}
      style={[
        styles.row,
        { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: '100%' },
      ]}
    >
      {/* Icon + Label — always row direction */}
      <View style={styles.rowLeft}>
        <View
          style={[
            styles.iconBox,
            { backgroundColor: iconBg },
            iconBorder ? { borderWidth: 1, borderColor: iconBorder } : null,
          ]}
        >
          <Icon name={iconName} size={16} color={iconColor} />
        </View>
        <Text style={[styles.rowLabel, labelColor !== '#ffffff' && { color: labelColor }]}>
          {label}
        </Text>
      </View>
      {/* Chevron — always on the right, same row */}
      {showChevron && (
        <View style={styles.chevronBox}>
          <Icon name="ChevronRight" size={16} color={chevronColor} />
        </View>
      )}
    </HapticPressable>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#000000' },
  container: { flex: 1, backgroundColor: '#000000' },
  header: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  screenTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: -0.5,
  },
  scrollView: { flex: 1 },
  contentContainer: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 136,
  },

  // Profile
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1c1c22',
    borderRadius: 20,
    padding: 16,
    marginBottom: 28,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
  },
  avatarCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#eb0028',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
    flexShrink: 0,
  },
  avatarText: { fontSize: 24, fontWeight: '800', color: '#ffffff' },
  profileInfo: { flex: 1 },
  userName: { fontSize: 18, fontWeight: '700', color: '#ffffff', marginBottom: 2 },
  userRole: { fontSize: 13, color: 'rgba(235,235,245,0.55)' },
  editBtn: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 12,
  },
  editBtnText: { fontSize: 13, fontWeight: '600', color: '#ffffff' },

  // Section label
  sectionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(235,235,245,0.45)',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 8,
    marginLeft: 4,
  },

  // Group / rows
  group: {
    backgroundColor: '#1c1c22',
    borderRadius: 18,
    overflow: 'hidden',
    marginBottom: 28,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    paddingVertical: 4,
    paddingHorizontal: 4,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
    minHeight: 56,
    width: '100%',
    borderRadius: 12,
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
    gap: 12,
  },
  iconBox: {
    width: 34,
    height: 34,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  rowLabel: {
    fontSize: 15,
    fontWeight: '500',
    color: '#ffffff',
    flex: 1,
  },
  rowRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 4,
    paddingHorizontal: 4,
  },
  rowValue: {
    fontSize: 14,
    color: 'rgba(235,235,245,0.55)',
  },
  chevronBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 2,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(255,255,255,0.09)',
    marginLeft: 60,
    marginRight: 16,
  },

  // About
  aboutSection: { alignItems: 'center', paddingVertical: 20, marginBottom: 20 },
  appName: { fontSize: 13, fontWeight: '700', color: 'rgba(235,235,245,0.4)' },
  appVersion: { fontSize: 12, color: 'rgba(235,235,245,0.25)', marginTop: 4 },

  // Modals
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  modalBox: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: '#1c1c22',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 16,
    textAlign: 'center',
  },
  currOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 13,
    paddingHorizontal: 14,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  currOptionActive: {
    backgroundColor: 'rgba(235,0,40,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(235,0,40,0.3)',
  },
  currLeft: { flexDirection: 'row', alignItems: 'center' },
  currSymbol: {
    fontSize: 16,
    fontWeight: '800',
    color: '#eb0028',
    width: 26,
  },
  currLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#ffffff',
    marginLeft: 6,
  },
  nameInput: {
    backgroundColor: '#000000',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: '#ffffff',
    fontSize: 16,
  },
});

import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  Pressable,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon } from '../ui/Icon';
import { THEME } from '../../constants/theme';
import { triggerHaptic } from '../../utils/haptics';
import { formatCurrency, formatMonthYear } from '../../utils/formatters';
import { useTransactionStore } from '../../store/useTransactionStore';
import { useBudgetStore } from '../../store/useBudgetStore';
import { useSettingsStore } from '../../store/useSettingsStore';
import {
  PdfExportService,
  getMonthDateRange,
} from '../../services/pdfExportService';

interface ExportPdfModalProps {
  visible: boolean;
  onClose: () => void;
  initialMonth?: string; // 'YYYY-MM'
}

export const ExportPdfModal: React.FC<ExportPdfModalProps> = ({
  visible,
  onClose,
  initialMonth,
}) => {
  const insets = useSafeAreaInsets();
  const transactions = useTransactionStore((state) => state.transactions);
  const categories = useBudgetStore((state) => state.categories);
  const settings = useSettingsStore((state) => state.settings);

  // Default to current month or initialMonth
  const currentMonthStr = useMemo(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  }, []);

  const [selectedMonth, setSelectedMonth] = useState<string>(
    initialMonth || currentMonthStr
  );
  const [isGenerating, setIsGenerating] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string>('');

  // Update selected month if initialMonth changes when opened
  React.useEffect(() => {
    if (initialMonth) {
      setSelectedMonth(initialMonth);
    }
  }, [initialMonth]);

  // Compute available recent months (last 12 months)
  const availableMonths = useMemo(() => {
    const months: string[] = [];
    const date = new Date();
    for (let i = 0; i < 12; i++) {
      const y = date.getFullYear();
      const m = String(date.getMonth() + 1).padStart(2, '0');
      months.push(`${y}-${m}`);
      date.setMonth(date.getMonth() - 1);
    }
    return months;
  }, []);

  const { formattedRange, startDateStr, endDateStr, totalDays } = useMemo(
    () => getMonthDateRange(selectedMonth),
    [selectedMonth]
  );

  // Month-filtered transactions strictly from 1st to end of month
  const monthTransactions = useMemo(() => {
    return transactions
      .filter((tx) => {
        const txDate = tx.date ? tx.date.split('T')[0] : '';
        return txDate >= startDateStr && txDate <= endDateStr;
      })
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [transactions, startDateStr, endDateStr]);

  // Compute month statistics
  const { totalIncome, totalExpense, totalInvestment, netBalance } = useMemo(() => {
    let inc = 0;
    let exp = 0;
    let inv = 0;
    monthTransactions.forEach((tx) => {
      if (tx.type === 'income') inc += tx.amount;
      else if (tx.type === 'investment') inv += tx.amount;
      else exp += tx.amount;
    });
    return {
      totalIncome: inc,
      totalExpense: exp,
      totalInvestment: inv,
      netBalance: inc - exp - inv,
    };
  }, [monthTransactions]);

  const handlePrevMonth = () => {
    triggerHaptic.light();
    const [yStr, mStr] = selectedMonth.split('-');
    const date = new Date(parseInt(yStr, 10), parseInt(mStr, 10) - 2, 1);
    const newY = date.getFullYear();
    const newM = String(date.getMonth() + 1).padStart(2, '0');
    setSelectedMonth(`${newY}-${newM}`);
  };

  const handleNextMonth = () => {
    triggerHaptic.light();
    const [yStr, mStr] = selectedMonth.split('-');
    const date = new Date(parseInt(yStr, 10), parseInt(mStr, 10), 1);
    const newY = date.getFullYear();
    const newM = String(date.getMonth() + 1).padStart(2, '0');
    setSelectedMonth(`${newY}-${newM}`);
  };

  const handleSaveToDevice = async () => {
    triggerHaptic.medium();
    setIsGenerating(true);
    setStatusMessage('Generating PDF statement...');
    try {
      const result = await PdfExportService.saveToDeviceStorage({
        month: selectedMonth,
        transactions,
        categories,
        currency: settings.currency,
        userName: settings.userName,
        includeSummary: true,
        includeBreakdown: true,
        includeTransactions: true,
      });

      if (result.success) {
        triggerHaptic.success();
        Alert.alert(
          'PDF Saved Successfully',
          `Your statement "${result.fileName}" for ${formatMonthYear(selectedMonth)} (1st to ${totalDays}th) has been saved to your selected storage folder.`,
          [{ text: 'OK', onPress: onClose }]
        );
      } else if (result.action !== 'cancelled') {
        triggerHaptic.error();
        Alert.alert('Export Failed', result.error || 'Failed to save PDF');
      }
    } catch (e: any) {
      triggerHaptic.error();
      Alert.alert('Export Error', e?.message || 'An unexpected error occurred');
    } finally {
      setIsGenerating(false);
      setStatusMessage('');
    }
  };

  const handleSharePdf = async () => {
    triggerHaptic.medium();
    setIsGenerating(true);
    setStatusMessage('Preparing statement to share...');
    try {
      const result = await PdfExportService.sharePdf({
        month: selectedMonth,
        transactions,
        categories,
        currency: settings.currency,
        userName: settings.userName,
        includeSummary: true,
        includeBreakdown: true,
        includeTransactions: true,
      });

      if (result.success) {
        triggerHaptic.success();
      } else {
        triggerHaptic.error();
        Alert.alert('Share Failed', result.error || 'Could not open share sheet');
      }
    } catch (e: any) {
      triggerHaptic.error();
      Alert.alert('Share Error', e?.message || 'An unexpected error occurred');
    } finally {
      setIsGenerating(false);
      setStatusMessage('');
    }
  };

  const handleOpenPdf = async () => {
    triggerHaptic.light();
    setIsGenerating(true);
    setStatusMessage('Opening in PDF viewer...');
    try {
      const { base64, fileName } = await PdfExportService.generateMonthlyPdfBase64({
        month: selectedMonth,
        transactions,
        categories,
        currency: settings.currency,
        userName: settings.userName,
        includeSummary: true,
        includeBreakdown: true,
        includeTransactions: true,
      });
      const fileUri = await PdfExportService.saveToLocalCache(base64, fileName);
      const res = await PdfExportService.openInViewer(fileUri, fileName);

      if (res.success) {
        triggerHaptic.success();
      } else {
        triggerHaptic.warning();
        Alert.alert('Viewer Notice', 'Could not open PDF viewer directly. Use "Save to Device" instead.');
      }
    } catch (e: any) {
      triggerHaptic.error();
      Alert.alert('Error', e?.message || 'Failed to open PDF');
    } finally {
      setIsGenerating(false);
      setStatusMessage('');
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={[styles.sheetContainer, { paddingBottom: Math.max(insets.bottom, 24) }]}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={styles.iconCircle}>
                <Icon name="FileText" size={20} color="#EB0029" />
              </View>
              <View>
                <Text style={styles.headerTitle}>Export Monthly PDF</Text>
                <Text style={styles.headerSubtitle}>Complete statement (1st to end of month)</Text>
              </View>
            </View>
            <Pressable
              style={styles.closeButton}
              onPress={() => {
                triggerHaptic.light();
                onClose();
              }}
            >
              <Icon name="X" size={20} color={THEME.colors.textMuted} />
            </Pressable>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {/* Month Navigator */}
            <View style={styles.monthSelectorCard}>
              <View style={styles.monthNavigator}>
                <Pressable
                  style={styles.monthNavBtn}
                  onPress={handlePrevMonth}
                  disabled={isGenerating}
                >
                  <Icon name="ChevronLeft" size={22} color={THEME.colors.textPrimary} />
                </Pressable>

                <View style={styles.monthDisplayCenter}>
                  <Text style={styles.monthTitleText}>{formatMonthYear(selectedMonth)}</Text>
                  <Text style={styles.monthRangeText}>{formattedRange}</Text>
                </View>

                <Pressable
                  style={styles.monthNavBtn}
                  onPress={handleNextMonth}
                  disabled={isGenerating}
                >
                  <Icon name="ChevronRight" size={22} color={THEME.colors.textPrimary} />
                </Pressable>
              </View>

              {/* Quick Month Chips */}
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.chipsScroll}
                contentContainerStyle={styles.chipsContainer}
              >
                {availableMonths.map((m) => {
                  const isSelected = m === selectedMonth;
                  return (
                    <Pressable
                      key={m}
                      style={[styles.monthChip, isSelected && styles.monthChipActive]}
                      onPress={() => {
                        triggerHaptic.selection();
                        setSelectedMonth(m);
                      }}
                      disabled={isGenerating}
                    >
                      <Text style={[styles.monthChipText, isSelected && styles.monthChipTextActive]}>
                        {formatMonthYear(m)}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
            </View>

            {/* Live Data Summary Card */}
            <View style={styles.summaryCard}>
              <View style={styles.summaryHeader}>
                <Text style={styles.summaryTitle}>STATEMENT PREVIEW</Text>
                <View style={styles.txBadge}>
                  <Text style={styles.txBadgeText}>
                    {monthTransactions.length} {monthTransactions.length === 1 ? 'Transaction' : 'Transactions'}
                  </Text>
                </View>
              </View>

              <View style={styles.metricsGrid}>
                {/* Income */}
                <View style={styles.metricItem}>
                  <Text style={styles.metricLabel}>Income</Text>
                  <Text style={[styles.metricValue, { color: THEME.colors.income }]}>
                    {formatCurrency(totalIncome, settings.currency)}
                  </Text>
                </View>

                {/* Expenses */}
                <View style={styles.metricItem}>
                  <Text style={styles.metricLabel}>Expenses</Text>
                  <Text style={[styles.metricValue, { color: THEME.colors.expense }]}>
                    {formatCurrency(totalExpense, settings.currency)}
                  </Text>
                </View>

                {/* Investments */}
                <View style={styles.metricItem}>
                  <Text style={styles.metricLabel}>Investments</Text>
                  <Text style={[styles.metricValue, { color: '#3B82F6' }]}>
                    {formatCurrency(totalInvestment, settings.currency)}
                  </Text>
                </View>

                {/* Net Balance */}
                <View style={styles.metricItem}>
                  <Text style={styles.metricLabel}>Net Balance</Text>
                  <Text
                    style={[
                      styles.metricValue,
                      { color: netBalance >= 0 ? THEME.colors.income : THEME.colors.expense },
                    ]}
                  >
                    {formatCurrency(netBalance, settings.currency)}
                  </Text>
                </View>
              </View>
            </View>

            {/* Required Data Included Callout */}
            <View style={styles.requiredDataBox}>
              <View style={styles.requiredHeader}>
                <Icon name="CheckCircle2" size={16} color="#10B981" />
                <Text style={styles.requiredTitle}>Required Data Included in PDF</Text>
              </View>
              <Text style={styles.requiredItem}>• Full month range: 1st {formatMonthYear(selectedMonth).split(' ')[0]} to {totalDays}th {formatMonthYear(selectedMonth)}</Text>
              <Text style={styles.requiredItem}>• 4 Pillars Summary (Income, Expenses, Investments & Net)</Text>
              <Text style={styles.requiredItem}>• Category-wise spending breakdown with % shares</Text>
              <Text style={styles.requiredItem}>• Chronological itemized transaction ledger</Text>
              <Text style={styles.requiredItem}>• Clean printable A4 format with page numbers</Text>
            </View>

            {/* Action Buttons */}
            {isGenerating ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#EB0029" />
                <Text style={styles.loadingText}>{statusMessage}</Text>
              </View>
            ) : (
              <View style={styles.actionButtons}>
                {/* Save to Device Storage (SAF - Downloads/Folder) */}
                <Pressable
                  style={[styles.primaryButton, monthTransactions.length === 0 && styles.disabledButton]}
                  onPress={handleSaveToDevice}
                  disabled={isGenerating || monthTransactions.length === 0}
                >
                  <Icon name="Download" size={18} color="#FFFFFF" />
                  <Text style={styles.primaryButtonText}>Save PDF to Device</Text>
                </Pressable>

                {/* Share PDF */}
                <Pressable
                  style={[styles.secondaryButton, monthTransactions.length === 0 && styles.disabledButton]}
                  onPress={handleSharePdf}
                  disabled={isGenerating || monthTransactions.length === 0}
                >
                  <Icon name="Share2" size={18} color={THEME.colors.textPrimary} />
                  <Text style={styles.secondaryButtonText}>Share PDF</Text>
                </Pressable>

                {/* Open in PDF Viewer */}
                <Pressable
                  style={styles.tertiaryButton}
                  onPress={handleOpenPdf}
                  disabled={isGenerating || monthTransactions.length === 0}
                >
                  <Icon name="ExternalLink" size={16} color={THEME.colors.textMuted} />
                  <Text style={styles.tertiaryButtonText}>Open in PDF Reader</Text>
                </Pressable>
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    backgroundColor: '#121212',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.06)',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(235, 0, 41, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: THEME.colors.textPrimary,
  },
  headerSubtitle: {
    fontSize: 12,
    color: THEME.colors.textMuted,
    marginTop: 2,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    padding: 20,
    gap: 16,
  },
  monthSelectorCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  monthNavigator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  monthNavBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthDisplayCenter: {
    alignItems: 'center',
  },
  monthTitleText: {
    fontSize: 18,
    fontWeight: '700',
    color: THEME.colors.textPrimary,
  },
  monthRangeText: {
    fontSize: 12,
    color: '#EB0029',
    fontWeight: '600',
    marginTop: 2,
  },
  chipsScroll: {
    marginTop: 14,
  },
  chipsContainer: {
    gap: 8,
  },
  monthChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  monthChipActive: {
    backgroundColor: 'rgba(235, 0, 41, 0.15)',
    borderColor: '#EB0029',
  },
  monthChipText: {
    fontSize: 12,
    color: THEME.colors.textMuted,
    fontWeight: '500',
  },
  monthChipTextActive: {
    color: '#EB0029',
    fontWeight: '700',
  },
  summaryCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  summaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  summaryTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: THEME.colors.textMuted,
    letterSpacing: 0.8,
  },
  txBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  txBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: THEME.colors.textSecondary,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  metricItem: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.04)',
  },
  metricLabel: {
    fontSize: 11,
    color: THEME.colors.textMuted,
    marginBottom: 4,
  },
  metricValue: {
    fontSize: 15,
    fontWeight: '700',
  },
  requiredDataBox: {
    backgroundColor: 'rgba(16, 185, 129, 0.05)',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.15)',
    gap: 4,
  },
  requiredHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  requiredTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#10B981',
  },
  requiredItem: {
    fontSize: 12,
    color: THEME.colors.textSecondary,
    lineHeight: 18,
  },
  actionButtons: {
    gap: 10,
    marginTop: 4,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#EB0029',
    paddingVertical: 14,
    borderRadius: 14,
  },
  primaryButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingVertical: 13,
    borderRadius: 14,
  },
  secondaryButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: THEME.colors.textPrimary,
  },
  tertiaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
  },
  tertiaryButtonText: {
    fontSize: 13,
    color: THEME.colors.textMuted,
  },
  disabledButton: {
    opacity: 0.5,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: THEME.colors.textSecondary,
    fontWeight: '500',
  },
});

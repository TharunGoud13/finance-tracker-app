import { PDFDocument, rgb, StandardFonts, PDFPage, PDFFont } from 'pdf-lib';
import * as FileSystem from 'expo-file-system/legacy';
import * as Linking from 'expo-linking';
import { Platform, Alert } from 'react-native';
import { Transaction, Category, CurrencyCode } from '../types';
import { SUPPORTED_CURRENCIES } from '../constants/currencies';
import { formatMonthYear } from '../utils/formatters';

export interface MonthlyPdfOptions {
  month: string; // 'YYYY-MM' e.g. '2026-10'
  transactions: Transaction[];
  categories: Category[];
  currency: CurrencyCode;
  userName?: string;
  includeSummary?: boolean;
  includeBreakdown?: boolean;
  includeTransactions?: boolean;
  transactionFilter?: 'all' | 'expense' | 'income' | 'investment';
}

export interface PdfExportResult {
  success: boolean;
  uri?: string;
  fileName?: string;
  action?: 'shared' | 'saved' | 'opened' | 'cancelled';
  error?: string;
}

/**
 * Sanitizes text to WinAnsi range to prevent PDF encoding crashes
 */
function sanitizeText(str: string): string {
  if (!str) return '';
  return str
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/[–—]/g, '-')
    .replace(/[₹]/g, 'Rs. ')
    .replace(/[^\x20-\x7E\xA0-\xFF]/g, ' ')
    .trim();
}

/**
 * Formats amount in paise for PDF export using safe ASCII currency symbols
 */
export function formatPaiseForPdf(paise: number, currencyCode: CurrencyCode = 'INR'): string {
  const config = SUPPORTED_CURRENCIES[currencyCode] || SUPPORTED_CURRENCIES.INR;
  const absPaise = Math.abs(paise);
  const mainValue = absPaise / config.smallestUnitMultiplier;
  const isNegative = paise < 0;

  const locale = currencyCode === 'INR' ? 'en-IN' : 'en-US';
  const numStr = mainValue.toLocaleString(locale, {
    minimumFractionDigits: config.decimals,
    maximumFractionDigits: config.decimals,
  });

  const prefix =
    currencyCode === 'INR'
      ? 'Rs. '
      : currencyCode === 'USD'
      ? '$ '
      : `${currencyCode} `;

  return `${isNegative ? '-' : ''}${prefix}${numStr}`;
}

/**
 * Formats date into DD/MM/YYYY
 */
function formatShortDate(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr.split('T')[0] || '';
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  } catch {
    return dateStr.split('T')[0] || '';
  }
}

/**
 * Gets exact first and last day dates for the month
 */
export function getMonthDateRange(monthStr: string): {
  startDateStr: string;
  endDateStr: string;
  formattedRange: string;
  totalDays: number;
} {
  const [yearStr, monthNumStr] = monthStr.split('-');
  const year = parseInt(yearStr, 10);
  const monthNum = parseInt(monthNumStr, 10); // 1-12

  const firstDay = new Date(year, monthNum - 1, 1);
  const lastDay = new Date(year, monthNum, 0);

  const startFormatted = `01 ${firstDay.toLocaleDateString('en-US', { month: 'short' })} ${year}`;
  const endFormatted = `${String(lastDay.getDate()).padStart(2, '0')} ${lastDay.toLocaleDateString('en-US', { month: 'short' })} ${year}`;

  return {
    startDateStr: `${yearStr}-${String(monthNum).padStart(2, '0')}-01`,
    endDateStr: `${yearStr}-${String(monthNum).padStart(2, '0')}-${String(lastDay.getDate()).padStart(2, '0')}`,
    formattedRange: `${startFormatted} - ${endFormatted}`,
    totalDays: lastDay.getDate(),
  };
}

export const PdfExportService = {
  /**
   * Generates a monthly financial statement PDF and returns base64
   */
  async generateMonthlyPdfBase64(options: MonthlyPdfOptions): Promise<{ base64: string; fileName: string }> {
    const {
      month,
      transactions,
      categories,
      currency,
      userName = 'Tharun',
      includeSummary = true,
      includeBreakdown = true,
      includeTransactions = true,
      transactionFilter = 'all',
    } = options;

    const { startDateStr, endDateStr, formattedRange } = getMonthDateRange(month);
    const monthTitle = formatMonthYear(month);
    const fileName = `OneFinance_Statement_${month}.pdf`;

    const categoryMap = new Map<string, Category>();
    categories.forEach((cat) => categoryMap.set(cat.id, cat));

    // Filter transactions strictly for the month (1st to last day)
    const monthTransactions = transactions
      .filter((tx) => {
        const txDate = tx.date ? tx.date.split('T')[0] : '';
        if (txDate < startDateStr || txDate > endDateStr) return false;
        if (transactionFilter !== 'all' && tx.type !== transactionFilter) return false;
        return true;
      })
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // Compute month totals
    let totalIncome = 0;
    let totalExpense = 0;
    let totalInvestment = 0;

    monthTransactions.forEach((tx) => {
      if (tx.type === 'income') totalIncome += tx.amount;
      else if (tx.type === 'investment') totalInvestment += tx.amount;
      else totalExpense += tx.amount;
    });

    const netSavings = totalIncome - totalExpense - totalInvestment;
    const savingsRate = totalIncome > 0 ? Math.round((Math.max(0, netSavings) / totalIncome) * 100) : 0;

    // Compute category breakdown
    const categoryTotals: Record<string, { category: Category; amount: number; count: number }> = {};
    monthTransactions.forEach((tx) => {
      const cat = categoryMap.get(tx.categoryId) || {
        id: tx.categoryId,
        name: 'Other',
        type: tx.type,
        icon: 'HelpCircle',
        color: '#666666',
        isDefault: false,
        createdAt: '',
      };
      if (!categoryTotals[cat.id]) {
        categoryTotals[cat.id] = { category: cat, amount: 0, count: 0 };
      }
      categoryTotals[cat.id].amount += tx.amount;
      categoryTotals[cat.id].count += 1;
    });

    const breakdownItems = Object.values(categoryTotals).sort((a, b) => b.amount - a.amount);

    // Create PDF Document
    const doc = await PDFDocument.create();
    const helvetica = await doc.embedFont(StandardFonts.Helvetica);
    const helveticaBold = await doc.embedFont(StandardFonts.HelveticaBold);

    const pageWidth = 595.28; // A4 standard width
    const pageHeight = 841.89; // A4 standard height
    const margin = 40;
    const contentWidth = pageWidth - margin * 2;

    // Palette
    const cPrimaryDark = rgb(0.08, 0.1, 0.13);
    const cAccentRed = rgb(0.92, 0, 0.16);
    const cTextPrimary = rgb(0.06, 0.09, 0.16);
    const cTextMuted = rgb(0.42, 0.47, 0.53);
    const cIncomeGreen = rgb(0.06, 0.65, 0.4);
    const cExpenseRed = rgb(0.88, 0.15, 0.15);
    const cInvestmentBlue = rgb(0.18, 0.45, 0.88);
    const cBorderLight = rgb(0.88, 0.9, 0.93);
    const cRowAlt = rgb(0.97, 0.98, 0.99);

    let page = doc.addPage([pageWidth, pageHeight]);
    let y = pageHeight;

    // Function to draw header on page
    const drawDocumentHeader = (p: PDFPage, isFirstPage: boolean) => {
      // Top accent banner
      p.drawRectangle({
        x: 0,
        y: pageHeight - 6,
        width: pageWidth,
        height: 6,
        color: cAccentRed,
      });

      if (isFirstPage) {
        // App title
        p.drawText('OneFinance', {
          x: margin,
          y: pageHeight - 42,
          size: 22,
          font: helveticaBold,
          color: cPrimaryDark,
        });

        p.drawText('MONTHLY FINANCIAL STATEMENT', {
          x: margin,
          y: pageHeight - 56,
          size: 9,
          font: helveticaBold,
          color: cAccentRed,
        });

        // Statement meta (Right side)
        const dateNow = new Date().toLocaleDateString('en-US', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        });

        const metaLines = [
          `Period: ${formattedRange}`,
          `Account: ${sanitizeText(userName)}`,
          `Generated: ${dateNow}`,
          `Currency: ${currency}`,
        ];

        let metaY = pageHeight - 36;
        metaLines.forEach((line) => {
          const textWidth = helvetica.widthOfTextAtSize(line, 8.5);
          p.drawText(line, {
            x: pageWidth - margin - textWidth,
            y: metaY,
            size: 8.5,
            font: helvetica,
            color: cTextMuted,
          });
          metaY -= 13;
        });

        // Divider
        p.drawLine({
          start: { x: margin, y: pageHeight - 88 },
          end: { x: pageWidth - margin, y: pageHeight - 88 },
          thickness: 1,
          color: cBorderLight,
        });
      } else {
        // Continuation Header
        p.drawText('OneFinance • Monthly Financial Statement (Continued)', {
          x: margin,
          y: pageHeight - 28,
          size: 9,
          font: helveticaBold,
          color: cTextMuted,
        });
        p.drawText(`Period: ${monthTitle}`, {
          x: pageWidth - margin - 120,
          y: pageHeight - 28,
          size: 8.5,
          font: helvetica,
          color: cTextMuted,
        });
        p.drawLine({
          start: { x: margin, y: pageHeight - 36 },
          end: { x: pageWidth - margin, y: pageHeight - 36 },
          thickness: 0.5,
          color: cBorderLight,
        });
      }
    };

    // Draw first page header
    drawDocumentHeader(page, true);
    y = pageHeight - 105;

    // 1. Executive Summary Cards
    if (includeSummary) {
      page.drawText('1. Executive Financial Summary', {
        x: margin,
        y,
        size: 11,
        font: helveticaBold,
        color: cPrimaryDark,
      });
      y -= 16;

      const cardWidth = (contentWidth - 18) / 4;
      const cardHeight = 54;
      const cards = [
        {
          label: 'Total Income',
          value: formatPaiseForPdf(totalIncome, currency),
          sub: `${monthTransactions.filter((t) => t.type === 'income').length} entries`,
          color: cIncomeGreen,
        },
        {
          label: 'Total Expenses',
          value: formatPaiseForPdf(totalExpense, currency),
          sub: `${monthTransactions.filter((t) => t.type === 'expense').length} entries`,
          color: cExpenseRed,
        },
        {
          label: 'Investments',
          value: formatPaiseForPdf(totalInvestment, currency),
          sub: `${monthTransactions.filter((t) => t.type === 'investment').length} entries`,
          color: cInvestmentBlue,
        },
        {
          label: 'Net Balance',
          value: formatPaiseForPdf(netSavings, currency),
          sub: `Savings: ${savingsRate}%`,
          color: netSavings >= 0 ? cIncomeGreen : cExpenseRed,
        },
      ];

      cards.forEach((c, idx) => {
        const cardX = margin + idx * (cardWidth + 6);
        // Card background
        page.drawRectangle({
          x: cardX,
          y: y - cardHeight,
          width: cardWidth,
          height: cardHeight,
          color: cRowAlt,
          borderColor: cBorderLight,
          borderWidth: 1,
        });

        // Top color indicator
        page.drawRectangle({
          x: cardX,
          y: y - 3,
          width: cardWidth,
          height: 3,
          color: c.color,
        });

        page.drawText(c.label, {
          x: cardX + 8,
          y: y - 16,
          size: 7.5,
          font: helvetica,
          color: cTextMuted,
        });

        page.drawText(c.value, {
          x: cardX + 8,
          y: y - 32,
          size: 9.5,
          font: helveticaBold,
          color: c.color,
        });

        page.drawText(c.sub, {
          x: cardX + 8,
          y: y - 46,
          size: 7,
          font: helvetica,
          color: cTextMuted,
        });
      });

      y -= cardHeight + 20;
    }

    // 2. Category Breakdown Section
    if (includeBreakdown && breakdownItems.length > 0) {
      page.drawText('2. Category Spending & Breakdown', {
        x: margin,
        y,
        size: 11,
        font: helveticaBold,
        color: cPrimaryDark,
      });
      y -= 16;

      // Table Header
      const colCat = margin + 8;
      const colType = margin + 180;
      const colCount = margin + 280;
      const colAmount = pageWidth - margin - 8;

      page.drawRectangle({
        x: margin,
        y: y - 18,
        width: contentWidth,
        height: 18,
        color: rgb(0.93, 0.94, 0.96),
      });

      page.drawText('Category', { x: colCat, y: y - 12, size: 8, font: helveticaBold, color: cTextPrimary });
      page.drawText('Pillar Type', { x: colType, y: y - 12, size: 8, font: helveticaBold, color: cTextPrimary });
      page.drawText('Count', { x: colCount, y: y - 12, size: 8, font: helveticaBold, color: cTextPrimary });
      const amtHdr = 'Amount (% Share)';
      const amtHdrWidth = helveticaBold.widthOfTextAtSize(amtHdr, 8);
      page.drawText(amtHdr, { x: colAmount - amtHdrWidth, y: y - 12, size: 8, font: helveticaBold, color: cTextPrimary });

      y -= 18;

      // Breakdown Rows (top 8 to fit nicely)
      const visibleBreakdown = breakdownItems.slice(0, 8);
      visibleBreakdown.forEach((item, rIdx) => {
        const isAlt = rIdx % 2 === 1;
        if (isAlt) {
          page.drawRectangle({
            x: margin,
            y: y - 16,
            width: contentWidth,
            height: 16,
            color: cRowAlt,
          });
        }

        const catName = sanitizeText(item.category.name || 'Other');
        const typeLabel = item.category.type.toUpperCase();
        const baseTotal = item.category.type === 'income' ? totalIncome : totalExpense + totalInvestment;
        const pct = baseTotal > 0 ? Math.round((item.amount / baseTotal) * 100) : 0;
        const amountStr = `${formatPaiseForPdf(item.amount, currency)} (${pct}%)`;

        page.drawText(catName, { x: colCat, y: y - 11, size: 8, font: helvetica, color: cTextPrimary });
        page.drawText(typeLabel, { x: colType, y: y - 11, size: 7.5, font: helvetica, color: cTextMuted });
        page.drawText(String(item.count), { x: colCount, y: y - 11, size: 8, font: helvetica, color: cTextMuted });

        const amtWidth = helveticaBold.widthOfTextAtSize(amountStr, 8);
        page.drawText(amountStr, {
          x: colAmount - amtWidth,
          y: y - 11,
          size: 8,
          font: helveticaBold,
          color: item.category.type === 'income' ? cIncomeGreen : cTextPrimary,
        });

        y -= 16;
      });

      y -= 16;
    }

    // 3. Itemized Transactions List (from 1st to end of month)
    if (includeTransactions) {
      const checkAndCreateNewPageIfNeeded = (neededHeight: number) => {
        if (y - neededHeight < 55) {
          page = doc.addPage([pageWidth, pageHeight]);
          drawDocumentHeader(page, false);
          y = pageHeight - 55;
          drawTransactionsTableHeader();
        }
      };

      const drawTransactionsTableHeader = () => {
        page.drawRectangle({
          x: margin,
          y: y - 18,
          width: contentWidth,
          height: 18,
          color: rgb(0.93, 0.94, 0.96),
        });

        page.drawText('Date', { x: margin + 8, y: y - 12, size: 8, font: helveticaBold, color: cTextPrimary });
        page.drawText('Description / Notes', { x: margin + 80, y: y - 12, size: 8, font: helveticaBold, color: cTextPrimary });
        page.drawText('Category', { x: margin + 260, y: y - 12, size: 8, font: helveticaBold, color: cTextPrimary });
        page.drawText('Type', { x: margin + 375, y: y - 12, size: 8, font: helveticaBold, color: cTextPrimary });

        const amtTitle = 'Amount';
        const w = helveticaBold.widthOfTextAtSize(amtTitle, 8);
        page.drawText(amtTitle, { x: pageWidth - margin - 8 - w, y: y - 12, size: 8, font: helveticaBold, color: cTextPrimary });

        y -= 18;
      };

      checkAndCreateNewPageIfNeeded(40);

      page.drawText(`3. Itemized Transactions (${formattedRange})`, {
        x: margin,
        y,
        size: 11,
        font: helveticaBold,
        color: cPrimaryDark,
      });
      y -= 16;

      drawTransactionsTableHeader();

      if (monthTransactions.length === 0) {
        checkAndCreateNewPageIfNeeded(24);
        page.drawText('No transactions recorded for this month.', {
          x: margin + 8,
          y: y - 14,
          size: 8.5,
          font: helvetica,
          color: cTextMuted,
        });
        y -= 24;
      } else {
        monthTransactions.forEach((tx, idx) => {
          checkAndCreateNewPageIfNeeded(18);

          const isAlt = idx % 2 === 1;
          if (isAlt) {
            page.drawRectangle({
              x: margin,
              y: y - 17,
              width: contentWidth,
              height: 17,
              color: cRowAlt,
            });
          }

          const dateStr = formatShortDate(tx.date);
          const rawDesc = tx.description || tx.notes || 'Transaction';
          const desc = sanitizeText(rawDesc).slice(0, 32);
          const catName = sanitizeText(categoryMap.get(tx.categoryId)?.name || 'General').slice(0, 20);
          const typeStr = tx.type.charAt(0).toUpperCase() + tx.type.slice(1);

          let sign = '';
          let amtColor = cTextPrimary;
          if (tx.type === 'income') {
            sign = '+';
            amtColor = cIncomeGreen;
          } else if (tx.type === 'expense') {
            sign = '-';
            amtColor = cExpenseRed;
          } else {
            amtColor = cInvestmentBlue;
          }

          const amtStr = `${sign}${formatPaiseForPdf(tx.amount, currency)}`;

          page.drawText(dateStr, { x: margin + 8, y: y - 12, size: 8, font: helvetica, color: cTextPrimary });
          page.drawText(desc, { x: margin + 80, y: y - 12, size: 8, font: helvetica, color: cTextPrimary });
          page.drawText(catName, { x: margin + 260, y: y - 12, size: 8, font: helvetica, color: cTextMuted });
          page.drawText(typeStr, { x: margin + 375, y: y - 12, size: 7.5, font: helvetica, color: cTextMuted });

          const amtWidth = helveticaBold.widthOfTextAtSize(amtStr, 8);
          page.drawText(amtStr, {
            x: pageWidth - margin - 8 - amtWidth,
            y: y - 12,
            size: 8,
            font: helveticaBold,
            color: amtColor,
          });

          y -= 17;
        });

        // Summary footer row
        checkAndCreateNewPageIfNeeded(24);
        page.drawLine({
          start: { x: margin, y: y - 2 },
          end: { x: pageWidth - margin, y: y - 2 },
          thickness: 1,
          color: cBorderLight,
        });
        y -= 6;

        page.drawText(`Total: ${monthTransactions.length} transactions`, {
          x: margin + 8,
          y: y - 11,
          size: 8,
          font: helveticaBold,
          color: cTextMuted,
        });

        const netStr = `Net: ${formatPaiseForPdf(netSavings, currency)}`;
        const netW = helveticaBold.widthOfTextAtSize(netStr, 8.5);
        page.drawText(netStr, {
          x: pageWidth - margin - 8 - netW,
          y: y - 11,
          size: 8.5,
          font: helveticaBold,
          color: netSavings >= 0 ? cIncomeGreen : cExpenseRed,
        });
        y -= 18;
      }
    }

    // Footers on all pages
    const totalPages = doc.getPageCount();
    doc.getPages().forEach((p, idx) => {
      p.drawLine({
        start: { x: margin, y: 35 },
        end: { x: pageWidth - margin, y: 35 },
        thickness: 0.5,
        color: cBorderLight,
      });

      p.drawText('OneFinance • Confidential Personal Financial Statement', {
        x: margin,
        y: 22,
        size: 7.5,
        font: helvetica,
        color: cTextMuted,
      });

      const pageStr = `Page ${idx + 1} of ${totalPages}`;
      const pageStrW = helvetica.widthOfTextAtSize(pageStr, 7.5);
      p.drawText(pageStr, {
        x: pageWidth - margin - pageStrW,
        y: 22,
        size: 7.5,
        font: helvetica,
        color: cTextMuted,
      });
    });

    const base64 = await doc.saveAsBase64({ dataUri: false });
    return { base64, fileName };
  },

  /**
   * Saves the generated PDF into app cache / document directory and prepares for export
   */
  async saveToLocalCache(base64: string, fileName: string): Promise<string> {
    const dir = FileSystem.cacheDirectory || FileSystem.documentDirectory;
    const fileUri = `${dir}${fileName}`;
    await FileSystem.writeAsStringAsync(fileUri, base64, {
      encoding: FileSystem.EncodingType.Base64,
    });
    return fileUri;
  },

  /**
   * Exports PDF using system share sheet (expo-sharing) if available, or falls back to direct open / save
   */
  async sharePdf(options: MonthlyPdfOptions): Promise<PdfExportResult> {
    try {
      const { base64, fileName } = await this.generateMonthlyPdfBase64(options);
      const fileUri = await this.saveToLocalCache(base64, fileName);

      // Try expo-sharing first
      let shared = false;
      try {
        const Sharing = require('expo-sharing');
        if (Sharing && (await Sharing.isAvailableAsync?.())) {
          await Sharing.shareAsync(fileUri, {
            mimeType: 'application/pdf',
            dialogTitle: `Share ${formatMonthYear(options.month)} Statement`,
            UTI: 'com.adobe.pdf',
          });
          shared = true;
          return { success: true, uri: fileUri, fileName, action: 'shared' };
        }
      } catch (e) {
        console.log('[PdfExportService] expo-sharing not available:', e);
      }

      // If sharing unavailable, try opening directly in PDF viewer
      return await this.openInViewer(fileUri, fileName);
    } catch (error: any) {
      console.error('[PdfExportService] Share error:', error);
      return { success: false, error: error?.message || 'Failed to share PDF' };
    }
  },

  /**
   * Saves PDF to user's device folder (Downloads/Documents) using Storage Access Framework on Android
   */
  async saveToDeviceStorage(options: MonthlyPdfOptions): Promise<PdfExportResult> {
    try {
      const { base64, fileName } = await this.generateMonthlyPdfBase64(options);

      if (Platform.OS === 'android') {
        const permissions = await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync();
        if (permissions.granted) {
          const createdUri = await FileSystem.StorageAccessFramework.createFileAsync(
            permissions.directoryUri,
            fileName,
            'application/pdf'
          );
          await FileSystem.writeAsStringAsync(createdUri, base64, {
            encoding: FileSystem.EncodingType.Base64,
          });

          return { success: true, uri: createdUri, fileName, action: 'saved' };
        } else {
          return { success: false, action: 'cancelled', error: 'Directory permission was not granted' };
        }
      } else {
        // iOS: Cache and open / share
        const fileUri = await this.saveToLocalCache(base64, fileName);
        return await this.openInViewer(fileUri, fileName);
      }
    } catch (error: any) {
      console.error('[PdfExportService] Save to storage error:', error);
      return { success: false, error: error?.message || 'Failed to save PDF to storage' };
    }
  },

  /**
   * Opens the PDF in the device's native PDF viewer
   */
  async openInViewer(fileUri: string, fileName: string): Promise<PdfExportResult> {
    try {
      if (Platform.OS === 'android') {
        const contentUri = await FileSystem.getContentUriAsync(fileUri);
        await Linking.openURL(contentUri);
      } else {
        await Linking.openURL(fileUri);
      }
      return { success: true, uri: fileUri, fileName, action: 'opened' };
    } catch (e: any) {
      console.warn('[PdfExportService] Open in viewer error:', e);
      return { success: false, error: e?.message || 'Could not open PDF viewer' };
    }
  },
};

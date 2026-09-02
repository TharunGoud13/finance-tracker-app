import { CurrencyCode } from '../types';
import { SUPPORTED_CURRENCIES, DEFAULT_CURRENCY } from '../constants/currencies';

interface CurrencyFormatOptions {
  hideSymbol?: boolean;
  showDecimals?: boolean;
  compact?: boolean;
  includeSign?: boolean;
}

/**
 * Formats monetary amounts stored in smallest currency unit (e.g. paise, cents)
 * Example: 50025 -> "₹500.25" (or "₹500" if decimals are .00)
 */
export function formatCurrency(
  paise: number,
  currencyCode: CurrencyCode = DEFAULT_CURRENCY,
  options: CurrencyFormatOptions = {}
): string {
  const config = SUPPORTED_CURRENCIES[currencyCode] || SUPPORTED_CURRENCIES.INR;
  const isNegative = paise < 0;
  const absPaise = Math.abs(paise);
  const mainUnits = absPaise / config.smallestUnitMultiplier;

  let formattedValue: string;

  if (options.compact && absPaise >= 10000000) {
    // Crores / Millions for Indian / Western notation
    if (currencyCode === 'INR') {
      const cr = mainUnits / 10000000;
      formattedValue = `${cr >= 10 ? cr.toFixed(1) : cr.toFixed(2)} Cr`;
    } else {
      const m = mainUnits / 1000000;
      formattedValue = `${m.toFixed(1)}M`;
    }
  } else if (options.compact && absPaise >= 100000) {
    // Lakhs / Thousands
    if (currencyCode === 'INR') {
      const lk = mainUnits / 100000;
      formattedValue = `${lk >= 10 ? lk.toFixed(1) : lk.toFixed(2)} L`;
    } else {
      const k = mainUnits / 1000;
      formattedValue = `${k.toFixed(1)}K`;
    }
  } else {
    // Standard locale formatting
    const hasDecimals = absPaise % config.smallestUnitMultiplier !== 0;
    const decimalPlaces = options.showDecimals ?? hasDecimals ? config.decimals : 0;

    const locale = currencyCode === 'INR' ? 'en-IN' : 'en-US';
    formattedValue = mainUnits.toLocaleString(locale, {
      minimumFractionDigits: decimalPlaces,
      maximumFractionDigits: decimalPlaces,
    });
  }

  const symbol = options.hideSymbol ? '' : `${config.symbol}`;
  const sign = isNegative ? '-' : options.includeSign ? '+' : '';

  return `${sign}${symbol}${formattedValue}`;
}

/**
 * Converts user text input (e.g. "500.25") into integer paise (50025)
 */
export function parseInputToPaise(
  input: string,
  currencyCode: CurrencyCode = DEFAULT_CURRENCY
): number {
  if (!input) return 0;
  // Strip everything except digits and dot
  const cleanInput = input.replace(/[^0-9.]/g, '');
  const numericVal = parseFloat(cleanInput);
  if (isNaN(numericVal)) return 0;

  const config = SUPPORTED_CURRENCIES[currencyCode] || SUPPORTED_CURRENCIES.INR;
  return Math.round(numericVal * config.smallestUnitMultiplier);
}

/**
 * Converts integer paise (50025) into clean input string ("500.25")
 */
export function paiseToInputString(
  paise: number,
  currencyCode: CurrencyCode = DEFAULT_CURRENCY
): string {
  if (!paise) return '';
  const config = SUPPORTED_CURRENCIES[currencyCode] || SUPPORTED_CURRENCIES.INR;
  const val = paise / config.smallestUnitMultiplier;
  return val % 1 === 0 ? val.toString() : val.toFixed(config.decimals);
}

/**
 * Formats dates into human readable strings
 */
export function formatDate(
  dateString: string,
  style: 'relative' | 'short' | 'medium' | 'monthYear' | 'full' = 'relative'
): string {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return dateString;

  const today = new Date();
  const isToday =
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear();

  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  const isYesterday =
    date.getDate() === yesterday.getDate() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getFullYear() === yesterday.getFullYear();

  if (style === 'relative') {
    if (isToday) return 'Today';
    if (isYesterday) return 'Yesterday';
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  if (style === 'short') {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  if (style === 'monthYear') {
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  }

  if (style === 'full') {
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  }

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

/**
 * Format "YYYY-MM" into "September 2026"
 */
export function formatMonthYear(monthStr: string): string {
  if (!monthStr) return '';
  const [year, month] = monthStr.split('-').map(Number);
  const date = new Date(year, month - 1, 1);
  return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

/**
 * Format percentages: +12%, -8%, 75%
 */
export function formatPercentage(
  value: number,
  options: { includeSign?: boolean; suffix?: string } = {}
): string {
  const rounded = Math.round(value);
  const sign = options.includeSign && rounded > 0 ? '+' : '';
  const suffix = options.suffix ?? '%';
  return `${sign}${rounded}${suffix}`;
}

/**
 * Format greeting by current time of day
 */
export function getGreeting(userName: string = 'Tharun'): { greeting: string; period: string } {
  const hour = new Date().getHours();
  let greeting = 'Good Morning';
  let period = 'morning';

  if (hour >= 12 && hour < 17) {
    greeting = 'Good Afternoon';
    period = 'afternoon';
  } else if (hour >= 17 || hour < 4) {
    greeting = 'Good Evening';
    period = 'evening';
  }

  return {
    greeting: `${greeting}, ${userName}`,
    period,
  };
}

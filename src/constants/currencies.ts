import { CurrencyCode, CurrencyConfig } from '../types';

export const SUPPORTED_CURRENCIES: Record<CurrencyCode, CurrencyConfig> = {
  INR: {
    code: 'INR',
    symbol: '₹',
    label: 'Indian Rupee (INR)',
    smallestUnitMultiplier: 100,
    decimals: 2,
  },
  USD: {
    code: 'USD',
    symbol: '$',
    label: 'US Dollar (USD)',
    smallestUnitMultiplier: 100,
    decimals: 2,
  },
  EUR: {
    code: 'EUR',
    symbol: '€',
    label: 'Euro (EUR)',
    smallestUnitMultiplier: 100,
    decimals: 2,
  },
  GBP: {
    code: 'GBP',
    symbol: '£',
    label: 'British Pound (GBP)',
    smallestUnitMultiplier: 100,
    decimals: 2,
  },
  JPY: {
    code: 'JPY',
    symbol: '¥',
    label: 'Japanese Yen (JPY)',
    smallestUnitMultiplier: 1,
    decimals: 0,
  },
};

export const DEFAULT_CURRENCY: CurrencyCode = 'INR';

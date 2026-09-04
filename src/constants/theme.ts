import { Platform } from 'react-native';

export const THEME = {
  colors: {
    // Signature OnePlus Black & Dark theme palette
    background: '#000000',
    backgroundElevated: '#0C0C0F',
    surface: '#121216',
    surfaceSubtle: '#1A1A20',
    surfaceHover: '#22222A',
    border: 'rgba(255, 255, 255, 0.10)',
    borderStrong: 'rgba(255, 255, 255, 0.20)',

    // Signature OnePlus Red & Accents
    primary: '#EB0028', // OnePlus Never Settle Red
    primaryLight: '#FF2D55',
    primaryDark: '#C00021',
    primaryGlow: 'rgba(235, 0, 40, 0.30)',

    // Financial Indicators
    income: '#30D158', // Vibrant Crisp Green
    incomeBg: 'rgba(48, 209, 88, 0.14)',
    incomeBorder: 'rgba(48, 209, 88, 0.30)',

    expense: '#EB0028', // OnePlus Red
    expenseBg: 'rgba(235, 0, 40, 0.14)',
    expenseBorder: 'rgba(235, 0, 40, 0.30)',

    savings: '#EB0028',
    savingsBg: 'rgba(235, 0, 40, 0.14)',

    warning: '#FF9F0A',
    warningBg: 'rgba(255, 159, 10, 0.14)',

    // Typography
    textPrimary: '#FFFFFF',
    textSecondary: 'rgba(235, 235, 245, 0.70)',
    textMuted: 'rgba(235, 235, 245, 0.45)',
    textDisabled: 'rgba(235, 235, 245, 0.25)',
  },
  typography: {
    fontFamily: Platform.select({
      ios: 'OnePlus Sans, -apple-system, BlinkMacSystemFont',
      android: 'OnePlus Sans, Roboto, sans-serif',
      default: 'OnePlus Sans, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    }),
  },
  borderRadius: {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 22,
    full: 9999,
  },
  shadows: {
    card: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.45,
      shadowRadius: 10,
      elevation: 6,
    },
    floating: {
      shadowColor: '#EB0028',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.45,
      shadowRadius: 14,
      elevation: 9,
    },
  },
};

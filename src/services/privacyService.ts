import * as LocalAuthentication from 'expo-local-authentication';
import { Platform } from 'react-native';

export interface PrivacyServiceInterface {
  authenticate: (reason?: string) => Promise<boolean>;
  maskAmount: (actualText: string, maskChar?: string) => string;
}

class PrivacyServiceImplementation implements PrivacyServiceInterface {
  /**
   * Biometric or device authentication using Expo Local Authentication
   */
  async authenticate(
    reason: string = 'Unlock to view sensitive financial information'
  ): Promise<boolean> {
    if (Platform.OS === 'web') {
      return true;
    }

    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();

      if (!hasHardware || !isEnrolled) {
        // Device lacks biometric enrollment, fallback to true or prompt passcode
        return true;
      }

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: reason,
        fallbackLabel: 'Use Passcode',
        cancelLabel: 'Cancel',
        disableDeviceFallback: false,
      });

      return result.success;
    } catch (e) {
      console.warn('[PrivacyService] LocalAuthentication error:', e);
      return true; // Graceful fallback
    }
  }

  /**
   * Mask monetary values into dots
   * Example: "₹60,000" -> "₹••••••"
   */
  maskAmount(actualText: string, maskChar: string = '•'): string {
    if (!actualText) return `${maskChar}${maskChar}${maskChar}${maskChar}`;
    const firstChar = actualText.trim().charAt(0);
    const hasSymbol = ['₹', '$', '€', '£', '¥'].includes(firstChar);
    const symbol = hasSymbol ? firstChar : '';
    return `${symbol}${maskChar.repeat(6)}`;
  }
}

export const PrivacyService = new PrivacyServiceImplementation();

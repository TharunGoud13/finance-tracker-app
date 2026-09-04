import * as LocalAuthentication from 'expo-local-authentication';
import { Platform, Alert } from 'react-native';

export interface PrivacyServiceInterface {
  authenticate: (reason?: string) => Promise<boolean>;
  maskAmount: (actualText: string, maskChar?: string) => string;
  hasBiometrics: () => Promise<boolean>;
}

class PrivacyServiceImplementation implements PrivacyServiceInterface {
  async hasBiometrics(): Promise<boolean> {
    if (Platform.OS === 'web') return true;
    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      return hasHardware && isEnrolled;
    } catch {
      return false;
    }
  }

  /**
   * Biometric or device authentication using Expo Local Authentication
   */
  async authenticate(
    reason: string = 'Scan fingerprint to view financial details'
  ): Promise<boolean> {
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && typeof window.confirm === 'function') {
        return window.confirm(
          `[OnePlus Biometric Security]\n\n${reason}\n\nPress OK to simulate fingerprint pass, or Cancel to deny.`
        );
      }
      return true;
    }

    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      if (!hasHardware) {
        Alert.alert(
          'Biometrics Unavailable',
          'This device does not have fingerprint or biometric sensor hardware.'
        );
        return false;
      }

      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      if (!isEnrolled) {
        Alert.alert(
          'No Fingerprint Enrolled',
          'Please enroll your fingerprint or set up screen lock in your device settings to use this feature.'
        );
        return false;
      }

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: reason,
        cancelLabel: 'Cancel',
        fallbackLabel: 'Use Device Passcode',
        disableDeviceFallback: false,
      });

      return result.success;
    } catch (e) {
      console.warn('[PrivacyService] LocalAuthentication error:', e);
      return false;
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

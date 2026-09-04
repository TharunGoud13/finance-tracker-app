import { create } from 'zustand';
import { PrivacyService } from '../services/privacyService';
import { triggerHaptic } from '../utils/haptics';

interface PrivacyState {
  isSensitiveDataVisible: boolean;
  isLocked: boolean;
  isAuthenticating: boolean;

  // Actions
  toggleLock: () => void;
  toggleSensitiveData: (reason?: string) => Promise<boolean>;
  revealSensitiveData: () => void;
  hideSensitiveData: () => void;
  authenticateAndReveal: (reason?: string) => Promise<boolean>;
  lockApp: () => void;
  unlockApp: () => void;
}

export const usePrivacyStore = create<PrivacyState>((set, get) => ({
  isSensitiveDataVisible: false, // Protected by default
  isLocked: false,
  isAuthenticating: false,

  toggleLock: () => {
    const nextLocked = !get().isLocked;
    set({ isLocked: nextLocked, isSensitiveDataVisible: !nextLocked });
  },

  toggleSensitiveData: async (reason) => {
    const isCurrentlyVisible = get().isSensitiveDataVisible;

    if (isCurrentlyVisible) {
      // Concealing details does not require biometrics
      triggerHaptic.light();
      set({ isSensitiveDataVisible: false });
      return true;
    }

    // Viewing details requires fingerprint / biometric authentication!
    set({ isAuthenticating: true });
    try {
      const passed = await PrivacyService.authenticate(
        reason || 'Scan fingerprint to view sensitive financial details'
      );

      if (passed) {
        set({ isSensitiveDataVisible: true, isAuthenticating: false, isLocked: false });
        triggerHaptic.success();
        return true;
      } else {
        triggerHaptic.error();
      }
    } catch (e) {
      console.error('[usePrivacyStore] Authentication error:', e);
      triggerHaptic.error();
    }

    set({ isAuthenticating: false });
    return false;
  },

  revealSensitiveData: () => {
    set({ isSensitiveDataVisible: true });
  },

  hideSensitiveData: () => {
    set({ isSensitiveDataVisible: false });
  },

  authenticateAndReveal: async (reason) => {
    set({ isAuthenticating: true });
    try {
      const success = await PrivacyService.authenticate(reason);
      if (success) {
        set({ isSensitiveDataVisible: true, isLocked: false, isAuthenticating: false });
        triggerHaptic.success();
        return true;
      } else {
        triggerHaptic.error();
      }
    } catch (e) {
      console.error('[usePrivacyStore] Auth error:', e);
      triggerHaptic.error();
    }
    set({ isAuthenticating: false });
    return false;
  },

  lockApp: () => {
    set({ isLocked: true, isSensitiveDataVisible: false });
  },

  unlockApp: () => {
    set({ isLocked: false, isSensitiveDataVisible: true });
  },
}));

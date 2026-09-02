import { create } from 'zustand';
import { PrivacyService } from '../services/privacyService';

interface PrivacyState {
  isSensitiveDataVisible: boolean;
  isLocked: boolean;
  isAuthenticating: boolean;

  // Actions
  toggleLock: () => void;
  toggleSensitiveData: () => void;
  revealSensitiveData: () => void;
  hideSensitiveData: () => void;
  authenticateAndReveal: (reason?: string) => Promise<boolean>;
  lockApp: () => void;
  unlockApp: () => void;
}

export const usePrivacyStore = create<PrivacyState>((set, get) => ({
  isSensitiveDataVisible: true,
  isLocked: false,
  isAuthenticating: false,

  toggleLock: () => {
    const nextLocked = !get().isLocked;
    set({ isLocked: nextLocked, isSensitiveDataVisible: !nextLocked });
  },

  toggleSensitiveData: () => {
    set({ isSensitiveDataVisible: !get().isSensitiveDataVisible });
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
        return true;
      }
    } catch (e) {
      console.error('[usePrivacyStore] Auth error:', e);
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

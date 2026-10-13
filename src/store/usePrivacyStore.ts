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
  isSensitiveDataVisible: true, // Always visible (privacy mode disabled)
  isLocked: false,
  isAuthenticating: false,

  toggleLock: () => {
    // Privacy mode turned off
    set({ isLocked: false, isSensitiveDataVisible: true });
  },

  toggleSensitiveData: async () => {
    set({ isSensitiveDataVisible: true, isLocked: false, isAuthenticating: false });
    return true;
  },

  revealSensitiveData: () => {
    set({ isSensitiveDataVisible: true });
  },

  hideSensitiveData: () => {
    // Privacy mode disabled - remain visible
    set({ isSensitiveDataVisible: true });
  },

  authenticateAndReveal: async () => {
    set({ isSensitiveDataVisible: true, isLocked: false, isAuthenticating: false });
    return true;
  },

  lockApp: () => {
    // Privacy mode disabled - do not lock
    set({ isLocked: false, isSensitiveDataVisible: true });
  },

  unlockApp: () => {
    set({ isLocked: false, isSensitiveDataVisible: true });
  },
}));

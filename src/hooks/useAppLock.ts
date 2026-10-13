import { useEffect } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { usePrivacyStore } from '../store/usePrivacyStore';
import { useSettingsStore } from '../store/useSettingsStore';

export function useAppLock() {
  // Privacy mode removed - no-op
}

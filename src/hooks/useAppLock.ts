import { useEffect } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { usePrivacyStore } from '../store/usePrivacyStore';
import { useSettingsStore } from '../store/useSettingsStore';

export function useAppLock() {
  const autoLock = useSettingsStore((state) => state.settings.autoLockOnBackground);
  const hideSensitiveData = usePrivacyStore((state) => state.hideSensitiveData);

  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (autoLock && (nextAppState === 'background' || nextAppState === 'inactive')) {
        hideSensitiveData();
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => {
      subscription.remove();
    };
  }, [autoLock, hideSensitiveData]);
}

import * as Updates from 'expo-updates';

export interface UpdateCheckResult {
  isAvailable: boolean;
  isDevelopment: boolean;
  message?: string;
  error?: string;
}

export const UpdateService = {
  /**
   * Returns current update metadata for display in Settings
   */
  getMetadata() {
    return {
      isEnabled: Updates.isEnabled,
      channel: Updates.channel || 'production',
      runtimeVersion: typeof Updates.runtimeVersion === 'string' ? Updates.runtimeVersion : '1.0.0',
      updateId: Updates.updateId || null,
      isEmbeddedLaunch: Updates.isEmbeddedLaunch,
      createdAt: Updates.createdAt ? new Date(Updates.createdAt).toLocaleString() : null,
    };
  },

  /**
   * Checks EAS Update servers for a new published bundle
   */
  async checkForUpdate(): Promise<UpdateCheckResult> {
    // In Expo Go or standard dev client, Updates are not enabled
    if (__DEV__ || !Updates.isEnabled) {
      return {
        isAvailable: false,
        isDevelopment: true,
        message: 'Updates are disabled in development mode. EAS Updates run automatically on production and preview APK builds.',
      };
    }

    try {
      const update = await Updates.checkForUpdateAsync();
      return {
        isAvailable: update.isAvailable,
        isDevelopment: false,
        message: update.isAvailable
          ? 'A new version of OneFinance is available.'
          : 'You are on the latest version of OneFinance.',
      };
    } catch (e: any) {
      console.warn('[UpdateService] Check failed:', e);
      return {
        isAvailable: false,
        isDevelopment: false,
        error: e?.message || 'Unable to reach update servers. Please check your internet connection.',
      };
    }
  },

  /**
   * Fetches the update bundle and immediately reloads the application
   */
  async fetchAndApplyUpdate(): Promise<{ success: boolean; error?: string }> {
    if (!Updates.isEnabled) {
      return { success: false, error: 'Updates are not enabled in this build environment.' };
    }

    try {
      await Updates.fetchUpdateAsync();
      await Updates.reloadAsync();
      return { success: true };
    } catch (e: any) {
      console.error('[UpdateService] Download failed:', e);
      return {
        success: false,
        error: e?.message || 'Failed to download or apply the update.',
      };
    }
  },
};

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
      if (update.isAvailable) {
        return {
          isAvailable: true,
          isDevelopment: false,
          message: 'A new version of OneFinance is available.',
        };
      }

      // Check if a downloaded update is pending reload or fetch directly
      try {
        const fetchRes = await Updates.fetchUpdateAsync();
        if (fetchRes.isNew) {
          return {
            isAvailable: true,
            isDevelopment: false,
            message: 'A new version of OneFinance is downloaded and ready to apply.',
          };
        }
      } catch {
        // No pending new update
      }

      return {
        isAvailable: false,
        isDevelopment: false,
        message: 'You are on the latest version of OneFinance.',
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
   * Immediately reloads the application into the latest downloaded bundle
   */
  async reloadApp(): Promise<void> {
    if (Updates.isEnabled) {
      await Updates.reloadAsync();
    }
  },

  /**
   * Downloads the update bundle into local disk cache without forcing an immediate reload
   */
  async downloadUpdateOnly(): Promise<{ success: boolean; error?: string }> {
    if (!Updates.isEnabled) {
      return { success: false, error: 'Updates are not enabled in this build environment.' };
    }

    try {
      await Updates.fetchUpdateAsync();
      return { success: true };
    } catch (e: any) {
      console.error('[UpdateService] Download failed:', e);
      return {
        success: false,
        error: e?.message || 'Failed to download the update.',
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
      // Fallback: try direct reload if already downloaded
      try {
        await Updates.reloadAsync();
        return { success: true };
      } catch {}
      return {
        success: false,
        error: e?.message || 'Failed to download or apply the update.',
      };
    }
  },
};

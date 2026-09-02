import * as Updates from 'expo-updates';

export interface UpdateStatusResult {
  status: 'updated' | 'no_update' | 'dev_mode' | 'error';
  message: string;
}

export const UpdateService = {
  /**
   * True if running in a standalone build with expo-updates enabled
   */
  isEnabled(): boolean {
    return Updates.isEnabled && !__DEV__;
  },

  /**
   * Details about the currently running update bundle
   */
  getUpdateInfo() {
    return {
      updateId: Updates.updateId,
      channel: Updates.channel || 'default',
      runtimeVersion: Updates.runtimeVersion,
      isEmbeddedLaunch: Updates.isEmbeddedLaunch,
      createdAt: Updates.createdAt ? Updates.createdAt.toLocaleDateString() : null,
    };
  },

  /**
   * Manually check for an update and apply it immediately
   */
  async checkForAndApplyUpdate(): Promise<UpdateStatusResult> {
    if (__DEV__ || !Updates.isEnabled) {
      return {
        status: 'dev_mode',
        message:
          'Over-the-air updates work on production and preview builds. In local development, Metro reloads your code live.',
      };
    }

    try {
      const check = await Updates.checkForUpdateAsync();
      if (!check.isAvailable) {
        return {
          status: 'no_update',
          message: 'Your app is up to date with the latest release.',
        };
      }

      // Download the new update bundle
      await Updates.fetchUpdateAsync();

      // Instantly reload into the new version
      await Updates.reloadAsync();

      return {
        status: 'updated',
        message: 'Update downloaded and applied successfully!',
      };
    } catch (error: any) {
      console.error('[UpdateService] Update check failed:', error);
      return {
        status: 'error',
        message: error?.message || 'Could not check for updates. Please try again.',
      };
    }
  },
};

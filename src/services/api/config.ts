import { Platform } from 'react-native';

/**
 * FitVerse API Configuration Bridge
 *
 * Automatically resolves the correct backend host depending on whether
 * the app is running on Web, Android Emulator, iOS Simulator, or a physical device.
 */
export const API_CONFIG = {
  /**
   * Default local FastAPI port
   */
  PORT: 8000,

  /**
   * Determine the optimal local backend host for Expo:
   * - Web / iOS Simulator: http://localhost:8000
   * - Android Emulator: http://10.0.2.2:8000 (Android maps host loopback to 10.0.2.2)
   * - Physical Device (Expo Go): Replace with your machine's LAN IP (e.g., http://192.168.1.50:8000)
   */
  getBaseUrl(): string {
    // If an environment variable is configured in the future, use it
    if (process.env.EXPO_PUBLIC_API_URL) {
      return process.env.EXPO_PUBLIC_API_URL;
    }

    if (Platform.OS === 'android') {
      return `http://10.0.2.2:${this.PORT}`;
    }

    return `http://localhost:${this.PORT}`;
  },

  /**
   * Full API v1 prefix
   */
  getApiV1Url(): string {
    return `${this.getBaseUrl()}/api/v1`;
  },

  TIMEOUT_MS: 10000,
};

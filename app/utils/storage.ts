import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Internal memory fallback for cases where native storage fails
const memoryCache: Record<string, string> = {};

// Robust, cross-platform storage adapter for AutoFusion Admin
export const SafeStorage = {
  /**
   * Retrieves a value from platform-specific storage.
   * Silently falls back to memory cache if the native module is unavailable.
   */
  async getItem(key: string): Promise<string | null> {
    try {
      if (Platform.OS === 'web') {
        return localStorage.getItem(key);
      }
      // Check if AsyncStorage is defined and has the method
      if (AsyncStorage && typeof AsyncStorage.getItem === 'function') {
        return await AsyncStorage.getItem(key);
      }
      return memoryCache[key] || null;
    } catch (e) {
      // Use log instead of warn/error to avoid triggering red screens in some environments
      console.log(`[SafeStorage] Memory fallback used for key: ${key}`);
      return memoryCache[key] || null;
    }
  },

  /**
   * Saves a value to platform-specific storage.
   */
  async setItem(key: string, value: string): Promise<void> {
    try {
      memoryCache[key] = value;
      if (Platform.OS === 'web') {
        localStorage.setItem(key, value);
      } else if (AsyncStorage && typeof AsyncStorage.setItem === 'function') {
        await AsyncStorage.setItem(key, value);
      }
    } catch (e) {
      console.log(`[SafeStorage] Write failed, stored in memory for: ${key}`);
    }
  },

  /**
   * Clears all platform-specific storage linked to this app.
   */
  async clear(): Promise<void> {
    try {
      Object.keys(memoryCache).forEach(key => delete memoryCache[key]);
      if (Platform.OS === 'web') {
        localStorage.clear();
      } else if (AsyncStorage && typeof AsyncStorage.clear === 'function') {
        await AsyncStorage.clear();
      }
    } catch (e) {
      console.log(`[SafeStorage] Clear failed`);
    }
  },

  /**
   * Removes a specific item from storage.
   */
  async removeItem(key: string): Promise<void> {
    try {
      if (Platform.OS === 'web') {
        localStorage.removeItem(key);
      } else {
        await AsyncStorage.removeItem(key);
      }
    } catch (e) {
      console.warn(`[SafeStorage] Unable to remove key: ${key}`, e);
    }
  }
};

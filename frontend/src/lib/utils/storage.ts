// Storage Utilities - Hour 4.3 (10 min)
// - setItem(key, value) - Set item in localStorage
// - getItem(key) - Get item from localStorage
// - removeItem(key) - Remove item from localStorage
// - clear() - Clear all localStorage
// - setSecureItem(key, value) - Set encrypted item
// - getSecureItem(key) - Get encrypted item

/**
 * Simple encryption key for secure storage
 * In production, this should be stored securely and not hardcoded
 */
const ENCRYPTION_KEY = 'vision-tf-secure-key-2024';

/**
 * Simple encryption function using XOR cipher
 * In production, use a proper encryption library like crypto-js
 */
function simpleEncrypt(text: string): string {
  let result = '';
  for (let i = 0; i < text.length; i++) {
    result += String.fromCharCode(text.charCodeAt(i) ^ ENCRYPTION_KEY.charCodeAt(i % ENCRYPTION_KEY.length));
  }
  return btoa(result); // Base64 encode
}

/**
 * Simple decryption function using XOR cipher
 * In production, use a proper encryption library like crypto-js
 */
function simpleDecrypt(encryptedText: string): string {
  try {
    const decoded = atob(encryptedText); // Base64 decode
    let result = '';
    for (let i = 0; i < decoded.length; i++) {
      result += String.fromCharCode(decoded.charCodeAt(i) ^ ENCRYPTION_KEY.charCodeAt(i % ENCRYPTION_KEY.length));
    }
    return result;
  } catch (error) {
    console.error('Failed to decrypt item:', error);
    return '';
  }
}

/**
 * Check if localStorage is available
 */
function isLocalStorageAvailable(): boolean {
  try {
    const test = '__localStorage_test__';
    localStorage.setItem(test, test);
    localStorage.removeItem(test);
    return true;
  } catch {
    return false;
  }
}

/**
 * Set item in localStorage
 * @param key - Storage key
 * @param value - Value to store (will be JSON stringified)
 */
export function setItem(key: string, value: any): void {
  if (!isLocalStorageAvailable()) {
    console.warn('localStorage is not available');
    return;
  }

  try {
    const serializedValue = JSON.stringify(value);
    localStorage.setItem(key, serializedValue);
  } catch (error) {
    console.error('Failed to set item in localStorage:', error);
  }
}

/**
 * Get item from localStorage
 * @param key - Storage key
 * @returns Parsed value or null if not found
 */
export function getItem<T = any>(key: string): T | null {
  if (!isLocalStorageAvailable()) {
    console.warn('localStorage is not available');
    return null;
  }

  try {
    const item = localStorage.getItem(key);
    if (item === null) {
      return null;
    }
    return JSON.parse(item);
  } catch (error) {
    console.error('Failed to get item from localStorage:', error);
    return null;
  }
}

/**
 * Remove item from localStorage
 * @param key - Storage key
 */
export function removeItem(key: string): void {
  if (!isLocalStorageAvailable()) {
    console.warn('localStorage is not available');
    return;
  }

  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.error('Failed to remove item from localStorage:', error);
  }
}

/**
 * Clear all localStorage
 */
export function clear(): void {
  if (!isLocalStorageAvailable()) {
    console.warn('localStorage is not available');
    return;
  }

  try {
    localStorage.clear();
  } catch (error) {
    console.error('Failed to clear localStorage:', error);
  }
}

/**
 * Set encrypted item in localStorage
 * @param key - Storage key
 * @param value - Value to store (will be encrypted and JSON stringified)
 */
export function setSecureItem(key: string, value: any): void {
  if (!isLocalStorageAvailable()) {
    console.warn('localStorage is not available');
    return;
  }

  try {
    const serializedValue = JSON.stringify(value);
    const encryptedValue = simpleEncrypt(serializedValue);
    localStorage.setItem(key, encryptedValue);
  } catch (error) {
    console.error('Failed to set secure item in localStorage:', error);
  }
}

/**
 * Get encrypted item from localStorage
 * @param key - Storage key
 * @returns Parsed value or null if not found
 */
export function getSecureItem<T = any>(key: string): T | null {
  if (!isLocalStorageAvailable()) {
    console.warn('localStorage is not available');
    return null;
  }

  try {
    const encryptedItem = localStorage.getItem(key);
    if (encryptedItem === null) {
      return null;
    }
    const decryptedItem = simpleDecrypt(encryptedItem);
    return JSON.parse(decryptedItem);
  } catch (error) {
    console.error('Failed to get secure item from localStorage:', error);
    return null;
  }
}

/**
 * Check if an item exists in localStorage
 * @param key - Storage key
 * @returns True if item exists
 */
export function hasItem(key: string): boolean {
  if (!isLocalStorageAvailable()) {
    return false;
  }

  try {
    return localStorage.getItem(key) !== null;
  } catch (error) {
    console.error('Failed to check item in localStorage:', error);
    return false;
  }
}

/**
 * Get all keys from localStorage
 * @returns Array of storage keys
 */
export function getKeys(): string[] {
  if (!isLocalStorageAvailable()) {
    return [];
  }

  try {
    return Object.keys(localStorage);
  } catch (error) {
    console.error('Failed to get keys from localStorage:', error);
    return [];
  }
}

/**
 * Get storage size information
 * @returns Object with storage usage information
 */
export function getStorageInfo(): {
  totalSize: number;
  usedSize: number;
  availableSize: number;
  itemCount: number;
} {
  if (!isLocalStorageAvailable()) {
    return {
      totalSize: 0,
      usedSize: 0,
      availableSize: 0,
      itemCount: 0,
    };
  }

  try {
    const keys = getKeys();
    let usedSize = 0;

    keys.forEach(key => {
      const item = localStorage.getItem(key);
      if (item) {
        usedSize += item.length;
      }
    });

    // Approximate total size (varies by browser, typically 5-10MB)
    const totalSize = 5 * 1024 * 1024; // 5MB estimate
    const availableSize = totalSize - usedSize;

    return {
      totalSize,
      usedSize,
      availableSize,
      itemCount: keys.length,
    };
  } catch (error) {
    console.error('Failed to get storage info:', error);
    return {
      totalSize: 0,
      usedSize: 0,
      availableSize: 0,
      itemCount: 0,
    };
  }
}

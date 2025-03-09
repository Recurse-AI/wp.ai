/**
 * Utility functions for working with localStorage
 */

/**
 * Set an item in localStorage and dispatch a custom event to notify listeners
 * @param key The localStorage key
 * @param value The value to store
 */
export function setLocalStorageItem(key: string, value: any): void {
  if (typeof window === 'undefined') return;
  
  // Convert value to string if it's not already
  const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
  
  // Set the value in localStorage
  localStorage.setItem(key, stringValue);
  
  // Dispatch a custom event to notify listeners in the same window
  window.dispatchEvent(
    new CustomEvent('localStorageChange', {
      detail: {
        key,
        newValue: stringValue,
      },
    })
  );
}

/**
 * Get an item from localStorage
 * @param key The localStorage key
 * @param defaultValue Default value to return if the key doesn't exist
 * @returns The parsed value or defaultValue if not found
 */
export function getLocalStorageItem<T>(key: string, defaultValue: T): T {
  if (typeof window === 'undefined') return defaultValue;
  
  const value = localStorage.getItem(key);
  if (value === null) return defaultValue;
  
  try {
    return JSON.parse(value) as T;
  } catch (e) {
    // If it's not valid JSON, return as string
    return value as unknown as T;
  }
}

/**
 * Remove an item from localStorage
 * @param key The localStorage key
 */
export function removeLocalStorageItem(key: string): void {
  if (typeof window === 'undefined') return;
  
  localStorage.removeItem(key);
  
  // Dispatch a custom event to notify listeners in the same window
  window.dispatchEvent(
    new CustomEvent('localStorageChange', {
      detail: {
        key,
        newValue: null,
      },
    })
  );
} 
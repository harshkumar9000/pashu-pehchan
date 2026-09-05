// In-memory fallback
const memoryStore = new Map<string, string>();

export const getItem = async (key: string): Promise<string | null> => {
  try {
    let AsyncStorage: any = null;
    try {
      AsyncStorage = require('@react-native-async-storage/async-storage').default;
    } catch (e) {
      // ignore
    }
    if (AsyncStorage) {
      return await AsyncStorage.getItem(key);
    }
  } catch (err) {
    console.warn('AsyncStorage read error:', err);
  }
  return memoryStore.get(key) || null;
};

export const setItem = async (key: string, value: string): Promise<void> => {
  try {
    let AsyncStorage: any = null;
    try {
      AsyncStorage = require('@react-native-async-storage/async-storage').default;
    } catch (e) {
      // ignore
    }
    if (AsyncStorage) {
      await AsyncStorage.setItem(key, value);
      return;
    }
  } catch (err) {
    console.warn('AsyncStorage write error:', err);
  }
  memoryStore.set(key, value);
};

export const removeItem = async (key: string): Promise<void> => {
  try {
    let AsyncStorage: any = null;
    try {
      AsyncStorage = require('@react-native-async-storage/async-storage').default;
    } catch (e) {
      // ignore
    }
    if (AsyncStorage) {
      await AsyncStorage.removeItem(key);
      return;
    }
  } catch (err) {
    console.warn('AsyncStorage remove error:', err);
  }
  memoryStore.delete(key);
};

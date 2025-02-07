import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEYS = {
  USER_TOKEN: '@user_token',
  USER_DATA: '@user_data',
  SETTINGS: '@app_settings',
  LAST_SYNC: '@last_sync',
};

export const storeData = async (key, value) => {
  try {
    const jsonValue = JSON.stringify(value);
    await AsyncStorage.setItem(key, jsonValue);
    return true;
  } catch (error) {
    console.error('Error storing data:', error);
    return false;
  }
};

export const getData = async (key) => {
  try {
    const jsonValue = await AsyncStorage.getItem(key);
    return jsonValue != null ? JSON.parse(jsonValue) : null;
  } catch (error) {
    console.error('Error retrieving data:', error);
    return null;
  }
};

export const removeData = async (key) => {
  try {
    await AsyncStorage.removeItem(key);
    return true;
  } catch (error) {
    console.error('Error removing data:', error);
    return false;
  }
};

// User related storage functions
export const storeUserToken = async (token) => {
  return await storeData(STORAGE_KEYS.USER_TOKEN, token);
};

export const getUserToken = async () => {
  return await getData(STORAGE_KEYS.USER_TOKEN);
};

export const removeUserToken = async () => {
  return await removeData(STORAGE_KEYS.USER_TOKEN);
};

export const storeUserData = async (userData) => {
  return await storeData(STORAGE_KEYS.USER_DATA, userData);
};

export const getUserData = async () => {
  return await getData(STORAGE_KEYS.USER_DATA);
};

export const removeUserData = async () => {
  return await removeData(STORAGE_KEYS.USER_DATA);
};

// App settings storage functions
export const storeSettings = async (settings) => {
  return await storeData(STORAGE_KEYS.SETTINGS, settings);
};

export const getSettings = async () => {
  return await getData(STORAGE_KEYS.SETTINGS);
};

export const updateSettings = async (newSettings) => {
  const currentSettings = await getSettings() || {};
  return await storeSettings({ ...currentSettings, ...newSettings });
};

// Sync timestamp storage functions
export const updateLastSync = async () => {
  return await storeData(STORAGE_KEYS.LAST_SYNC, new Date().toISOString());
};

export const getLastSync = async () => {
  return await getData(STORAGE_KEYS.LAST_SYNC);
};

// Clear all app data
export const clearAllData = async () => {
  try {
    await AsyncStorage.clear();
    return true;
  } catch (error) {
    console.error('Error clearing all data:', error);
    return false;
  }
}; 
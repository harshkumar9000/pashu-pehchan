import { Platform } from 'react-native';
import * as WebStorage from './Storage.web';
import * as NativeStorage from './Storage.native';

export const getItem = Platform.OS === 'web' ? WebStorage.getItem : NativeStorage.getItem;
export const setItem = Platform.OS === 'web' ? WebStorage.setItem : NativeStorage.setItem;
export const removeItem = Platform.OS === 'web' ? WebStorage.removeItem : NativeStorage.removeItem;

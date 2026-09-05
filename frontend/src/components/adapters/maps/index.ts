import { Platform } from 'react-native';
import * as WebMaps from './MapDirections.web';
import * as NativeMaps from './MapDirections.native';

export const openMapDirections =
  Platform.OS === 'web' ? WebMaps.openMapDirections : NativeMaps.openMapDirections;

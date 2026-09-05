import { Platform } from 'react-native';
import * as WebLocation from './Location.web';
import * as NativeLocation from './Location.native';

export type { UserCoordinates } from './Location.web';
export { DEFAULT_COORDINATES } from './Location.web';

export const getCurrentPosition =
  Platform.OS === 'web'
    ? WebLocation.getCurrentPosition
    : NativeLocation.getCurrentPosition;

import { Platform } from 'react-native';
import * as WebCall from './Call.web';
import * as NativeCall from './Call.native';

export const initiatePhoneCall =
  Platform.OS === 'web' ? WebCall.initiatePhoneCall : NativeCall.initiatePhoneCall;

import { Linking } from 'react-native';

export const initiatePhoneCall = (phoneNumber: string): void => {
  const cleanNumber = phoneNumber.replace(/[^0-9+]/g, '');
  Linking.openURL(`tel:${cleanNumber}`).catch((err) => {
    console.warn('Failed to dial number on native:', err);
  });
};

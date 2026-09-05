export const initiatePhoneCall = (phoneNumber: string): void => {
  const cleanNumber = phoneNumber.replace(/[^0-9+]/g, '');
  if (typeof window !== 'undefined') {
    window.location.href = `tel:${cleanNumber}`;
  }
};

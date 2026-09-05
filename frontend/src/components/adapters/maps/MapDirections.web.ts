export const openMapDirections = (
  latitude: number,
  longitude: number,
  label: string = 'Veterinary Clinic'
): void => {
  const encodedLabel = encodeURIComponent(label);
  const url = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}&destination_place_id=${encodedLabel}`;
  if (typeof window !== 'undefined') {
    window.open(url, '_blank', 'noopener,noreferrer');
  }
};

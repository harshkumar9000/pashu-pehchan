export interface UserCoordinates {
  latitude: number;
  longitude: number;
}

// Default fallback coordinates (Anand, Gujarat - Dairy capital of India)
export const DEFAULT_COORDINATES: UserCoordinates = {
  latitude: 22.5645,
  longitude: 72.9289,
};

export const getCurrentPosition = async (): Promise<UserCoordinates> => {
  if (typeof window !== 'undefined' && 'geolocation' in navigator) {
    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          resolve({
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
          });
        },
        (err) => {
          console.warn('Web Geolocation error or denied:', err.message);
          resolve(DEFAULT_COORDINATES);
        },
        { timeout: 8000, enableHighAccuracy: true }
      );
    });
  }
  return DEFAULT_COORDINATES;
};

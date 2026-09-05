import { UserCoordinates, DEFAULT_COORDINATES } from './Location.web';

export const getCurrentPosition = async (): Promise<UserCoordinates> => {
  try {
    let Location: any = null;
    try {
      Location = require('expo-location');
    } catch (e) {
      console.warn('expo-location not available');
    }

    if (Location) {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        return {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        };
      }
    }
  } catch (err) {
    console.warn('Native location error:', err);
  }
  return DEFAULT_COORDINATES;
};

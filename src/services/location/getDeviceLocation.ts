import * as Location from 'expo-location';

export type DeviceLocationResult =
  | { ok: true; lat: number; lng: number; label: string }
  | { ok: false; message: string };

/** Pobiera aktualną lokalizację urządzenia / przeglądarki (za zgodą). */
export async function getDeviceLocation(): Promise<DeviceLocationResult> {
  try {
    const current = await Location.getForegroundPermissionsAsync();
    let status = current.status;
    if (status !== 'granted') {
      const requested = await Location.requestForegroundPermissionsAsync();
      status = requested.status;
    }

    if (status !== 'granted') {
      return {
        ok: false,
        message:
          'Brak zgody na lokalizację. Wpisz nazwę miejscowości, wsi albo powiatu.',
      };
    }

    const position = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });

    const { latitude, longitude } = position.coords;
    let label = `Twoja lokalizacja (${latitude.toFixed(3)}, ${longitude.toFixed(3)})`;

    try {
      const places = await Location.reverseGeocodeAsync({
        latitude,
        longitude,
      });
      const first = places[0];
      if (first) {
        const parts = [
          first.name,
          first.street,
          first.city ?? first.subregion ?? first.region,
        ].filter(Boolean);
        if (parts.length) {
          label = parts.slice(0, 2).join(', ');
        }
      }
    } catch {
      // Zostaw współrzędne w etykiecie.
    }

    return { ok: true, lat: latitude, lng: longitude, label };
  } catch {
    return {
      ok: false,
      message:
        'Nie udało się odczytać lokalizacji. Wpisz okolicę ręcznie (miasto, wieś, gmina).',
    };
  }
}

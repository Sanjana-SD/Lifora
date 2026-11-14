import * as Location from 'expo-location';
import { Platform } from 'react-native';

import * as settingsRepository from '@/database/repositories/settingsRepository';
import { forecastUrl, parseForecast, placeName, type WeatherSnapshot } from '@/utils/weather';

// Weather is the one feature that uses the network: the phone's approximate
// (city-level) position goes to Open-Meteo, a free service that needs no
// account or key. The last result is cached so Home still shows something
// useful offline.

const CACHE_KEY = 'weather_cache';
/** Re-fetch at most this often; weather doesn't change minute to minute. */
export const WEATHER_MAX_AGE_MS = 30 * 60_000;
const TIMEOUT_MS = 10_000;

export type LocationAccess = 'granted' | 'undetermined' | 'denied';

export async function getLocationAccess(): Promise<LocationAccess> {
  try {
    const { status, canAskAgain } = await Location.getForegroundPermissionsAsync();
    if (status === 'granted') return 'granted';
    return status === 'undetermined' || canAskAgain ? 'undetermined' : 'denied';
  } catch {
    return 'denied';
  }
}

export async function requestLocationAccess(): Promise<LocationAccess> {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    return status === 'granted' ? 'granted' : 'denied';
  } catch {
    return 'denied';
  }
}

export async function readCachedWeather(): Promise<WeatherSnapshot | null> {
  try {
    const raw = await settingsRepository.getSetting(CACHE_KEY);
    return raw ? (JSON.parse(raw) as WeatherSnapshot) : null;
  } catch {
    return null;
  }
}

export function isFresh(snapshot: WeatherSnapshot | null, now: Date = new Date()): boolean {
  return !!snapshot && now.getTime() - new Date(snapshot.fetchedAt).getTime() < WEATHER_MAX_AGE_MS;
}

async function currentCoords(): Promise<{ latitude: number; longitude: number }> {
  // A recent fix is instant and costs no battery; fall back to a low-accuracy read.
  const last = await Location.getLastKnownPositionAsync({ maxAge: WEATHER_MAX_AGE_MS }).catch(() => null);
  const position = last ?? (await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Low }));
  return { latitude: position.coords.latitude, longitude: position.coords.longitude };
}

async function lookUpPlace(coords: { latitude: number; longitude: number }): Promise<string | null> {
  if (Platform.OS === 'web') return null; // reverse geocoding isn't available on web
  try {
    return placeName((await Location.reverseGeocodeAsync(coords))[0]);
  } catch {
    return null;
  }
}

/** Fetches fresh weather and caches it. Throws when location or network fails. */
export async function fetchWeather(now: Date = new Date()): Promise<WeatherSnapshot> {
  const coords = await currentCoords();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const [response, place] = await Promise.all([
      fetch(forecastUrl(coords.latitude, coords.longitude), { signal: controller.signal }),
      lookUpPlace(coords),
    ]);
    if (!response.ok) throw new Error(`Weather service returned ${response.status}`);
    const snapshot = parseForecast(await response.json(), place, now);
    if (!snapshot) throw new Error('Unexpected weather response');
    await settingsRepository.setSetting(CACHE_KEY, JSON.stringify(snapshot)).catch(() => {});
    return snapshot;
  } finally {
    clearTimeout(timer);
  }
}

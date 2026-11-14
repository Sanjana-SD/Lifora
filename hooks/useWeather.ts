import { useFocusEffect } from 'expo-router';
import { useCallback, useRef, useState } from 'react';

import * as weatherService from '@/services/weatherService';
import type { WeatherSnapshot } from '@/utils/weather';

export interface WeatherState {
  access: weatherService.LocationAccess | null;
  weather: WeatherSnapshot | null;
  loading: boolean;
  /** True when showing cached data because a refresh failed (e.g. offline). */
  stale: boolean;
}

/**
 * Shows the cached forecast immediately, then refreshes it when it's older
 * than 30 minutes, each time Home gains focus.
 */
export function useWeather() {
  const [state, setState] = useState<WeatherState>({ access: null, weather: null, loading: false, stale: false });
  const busy = useRef(false);

  const load = useCallback(async (force: boolean) => {
    if (busy.current) return;
    busy.current = true;
    try {
      const [access, cached] = await Promise.all([weatherService.getLocationAccess(), weatherService.readCachedWeather()]);
      setState((s) => ({ ...s, access, weather: cached ?? s.weather }));
      if (access !== 'granted' || (!force && weatherService.isFresh(cached))) return;
      setState((s) => ({ ...s, loading: true }));
      try {
        const weather = await weatherService.fetchWeather();
        setState((s) => ({ ...s, weather, loading: false, stale: false }));
      } catch {
        setState((s) => ({ ...s, loading: false, stale: s.weather !== null }));
      }
    } finally {
      busy.current = false;
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void load(false);
    }, [load]),
  );

  const enable = useCallback(async () => {
    const access = await weatherService.requestLocationAccess();
    setState((s) => ({ ...s, access }));
    if (access === 'granted') await load(true);
  }, [load]);

  return { ...state, refresh: () => load(true), enable };
}

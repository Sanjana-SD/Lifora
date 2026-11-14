// Pure helpers for the Home weather widget: Open-Meteo response parsing and
// WMO weather-code labels (https://open-meteo.com/en/docs, "WMO Weather
// interpretation codes").

export type WeatherIconKey =
  | 'clear'
  | 'partly-cloudy'
  | 'cloudy'
  | 'fog'
  | 'drizzle'
  | 'rain'
  | 'snow'
  | 'thunder';

export interface WeatherSnapshot {
  temperatureC: number;
  feelsLikeC: number;
  highC: number;
  lowC: number;
  code: number;
  isDay: boolean;
  /** Approximate place name, when the phone could resolve one. */
  place: string | null;
  /** ISO time the data was fetched. */
  fetchedAt: string;
}

const CODES: Record<number, { label: string; icon: WeatherIconKey }> = {
  0: { label: 'Clear', icon: 'clear' },
  1: { label: 'Mostly clear', icon: 'partly-cloudy' },
  2: { label: 'Partly cloudy', icon: 'partly-cloudy' },
  3: { label: 'Cloudy', icon: 'cloudy' },
  45: { label: 'Fog', icon: 'fog' },
  48: { label: 'Fog', icon: 'fog' },
  51: { label: 'Light drizzle', icon: 'drizzle' },
  53: { label: 'Drizzle', icon: 'drizzle' },
  55: { label: 'Heavy drizzle', icon: 'drizzle' },
  56: { label: 'Freezing drizzle', icon: 'drizzle' },
  57: { label: 'Freezing drizzle', icon: 'drizzle' },
  61: { label: 'Light rain', icon: 'rain' },
  63: { label: 'Rain', icon: 'rain' },
  65: { label: 'Heavy rain', icon: 'rain' },
  66: { label: 'Freezing rain', icon: 'rain' },
  67: { label: 'Freezing rain', icon: 'rain' },
  71: { label: 'Light snow', icon: 'snow' },
  73: { label: 'Snow', icon: 'snow' },
  75: { label: 'Heavy snow', icon: 'snow' },
  77: { label: 'Snow grains', icon: 'snow' },
  80: { label: 'Rain showers', icon: 'rain' },
  81: { label: 'Rain showers', icon: 'rain' },
  82: { label: 'Heavy showers', icon: 'rain' },
  85: { label: 'Snow showers', icon: 'snow' },
  86: { label: 'Snow showers', icon: 'snow' },
  95: { label: 'Thunderstorm', icon: 'thunder' },
  96: { label: 'Thunderstorm, hail', icon: 'thunder' },
  99: { label: 'Thunderstorm, hail', icon: 'thunder' },
};

export function describeWeather(code: number): { label: string; icon: WeatherIconKey } {
  return CODES[code] ?? { label: 'Weather', icon: 'cloudy' };
}

export function forecastUrl(latitude: number, longitude: number): string {
  const params = [
    `latitude=${latitude.toFixed(3)}`,
    `longitude=${longitude.toFixed(3)}`,
    'current=temperature_2m,apparent_temperature,weather_code,is_day',
    'daily=temperature_2m_max,temperature_2m_min',
    'timezone=auto',
    'forecast_days=1',
  ];
  return `https://api.open-meteo.com/v1/forecast?${params.join('&')}`;
}

/** Validates and maps an Open-Meteo forecast response; null when the shape is unexpected. */
export function parseForecast(json: unknown, place: string | null, fetchedAt: Date): WeatherSnapshot | null {
  const data = json as {
    current?: { temperature_2m?: unknown; apparent_temperature?: unknown; weather_code?: unknown; is_day?: unknown };
    daily?: { temperature_2m_max?: unknown[]; temperature_2m_min?: unknown[] };
  };
  const num = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) ? v : null);
  const temperature = num(data?.current?.temperature_2m);
  const code = num(data?.current?.weather_code);
  if (temperature === null || code === null) return null;
  return {
    temperatureC: temperature,
    feelsLikeC: num(data.current?.apparent_temperature) ?? temperature,
    highC: num(data.daily?.temperature_2m_max?.[0]) ?? temperature,
    lowC: num(data.daily?.temperature_2m_min?.[0]) ?? temperature,
    code,
    isDay: data.current?.is_day !== 0,
    place,
    fetchedAt: fetchedAt.toISOString(),
  };
}

/** City-level place name from a reverse-geocoded address. */
export function placeName(address: { city?: string | null; district?: string | null; subregion?: string | null; region?: string | null } | undefined): string | null {
  if (!address) return null;
  return address.city || address.district || address.subregion || address.region || null;
}

export const formatTemp = (c: number) => `${Math.round(c)}°`;

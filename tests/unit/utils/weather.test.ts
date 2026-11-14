import { describeWeather, forecastUrl, formatTemp, parseForecast, placeName } from '@/utils/weather';

const NOW = new Date('2026-11-14T06:00:00Z');

describe('weather helpers', () => {
  it('parses an Open-Meteo forecast', () => {
    const json = {
      current: { temperature_2m: 28.6, apparent_temperature: 31.1, weather_code: 61, is_day: 0 },
      daily: { temperature_2m_max: [31.2], temperature_2m_min: [22.4] },
    };
    expect(parseForecast(json, 'Pune', NOW)).toEqual({
      temperatureC: 28.6,
      feelsLikeC: 31.1,
      highC: 31.2,
      lowC: 22.4,
      code: 61,
      isDay: false,
      place: 'Pune',
      fetchedAt: NOW.toISOString(),
    });
  });

  it('rejects unexpected responses instead of showing wrong numbers', () => {
    expect(parseForecast({}, null, NOW)).toBeNull();
    expect(parseForecast({ current: { temperature_2m: 'hot', weather_code: 1 } }, null, NOW)).toBeNull();
    expect(parseForecast(null, null, NOW)).toBeNull();
  });

  it('falls back to the current temperature when daily values are missing', () => {
    const s = parseForecast({ current: { temperature_2m: 20, weather_code: 0 } }, null, NOW)!;
    expect([s.highC, s.lowC, s.feelsLikeC, s.isDay]).toEqual([20, 20, 20, true]);
  });

  it('labels WMO codes, with a safe default', () => {
    expect(describeWeather(0)).toEqual({ label: 'Clear', icon: 'clear' });
    expect(describeWeather(95).icon).toBe('thunder');
    expect(describeWeather(1234)).toEqual({ label: 'Weather', icon: 'cloudy' });
  });

  it('asks only for city-level precision', () => {
    expect(forecastUrl(22.572645, 88.363892)).toContain('latitude=22.573&longitude=88.364');
  });

  it('picks a city-level place name', () => {
    expect(placeName({ city: null, district: 'Salt Lake', region: 'West Bengal' })).toBe('Salt Lake');
    expect(placeName(undefined)).toBeNull();
    expect(formatTemp(-0.4)).toBe('0°');
    expect(formatTemp(28.5)).toBe('29°');
  });
});

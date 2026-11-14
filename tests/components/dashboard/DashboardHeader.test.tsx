import { fireEvent } from '@testing-library/react-native';
import React from 'react';

const mockWeather = {
  access: 'granted' as string | null,
  weather: null as unknown,
  loading: false,
  stale: false,
  refresh: jest.fn(),
  enable: jest.fn(),
};
jest.mock('@/hooks/useWeather', () => ({ useWeather: () => mockWeather }));

import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { renderWithTheme } from '../../testUtils';

const snapshot = {
  temperatureC: 28.6,
  feelsLikeC: 31,
  highC: 31.2,
  lowC: 22.4,
  code: 2,
  isDay: true,
  place: 'Kolkata',
  fetchedAt: new Date().toISOString(),
};

beforeEach(() => {
  jest.clearAllMocks();
  Object.assign(mockWeather, { access: 'granted', weather: null, loading: false, stale: false });
});

describe('DashboardHeader', () => {
  it('renders a greeting and a formatted date', async () => {
    const { getByText } = await renderWithTheme(<DashboardHeader />);
    const greetings = ['Good morning', 'Good afternoon', 'Good evening', 'Good night'];
    const matches = greetings.filter((g) => {
      try {
        getByText(g);
        return true;
      } catch {
        return false;
      }
    });
    expect(matches.length).toBe(1);
  });

  it('shows the temperature, place, condition and high/low like a phone widget', async () => {
    mockWeather.weather = snapshot;
    const { getByText, getByLabelText } = await renderWithTheme(<DashboardHeader />);
    expect(getByText('29°')).toBeTruthy();
    expect(getByText('Kolkata')).toBeTruthy();
    expect(getByText('Partly cloudy')).toBeTruthy();
    expect(getByText(/H 31°\s+L 22°/)).toBeTruthy();
    await fireEvent.press(getByLabelText(/^Weather\. Kolkata: 29°, Partly cloudy/));
    expect(mockWeather.refresh).toHaveBeenCalled();
  });

  it('says when it is showing an older reading', async () => {
    mockWeather.weather = snapshot;
    mockWeather.stale = true;
    const { getByText } = await renderWithTheme(<DashboardHeader />);
    expect(getByText(/^As of /)).toBeTruthy();
  });

  it('offers to show weather until location has been asked for', async () => {
    mockWeather.access = 'undetermined';
    const { getByLabelText } = await renderWithTheme(<DashboardHeader />);
    await fireEvent.press(getByLabelText('Show local weather'));
    expect(mockWeather.enable).toHaveBeenCalled();
  });

  it('shows nothing for weather when location is denied', async () => {
    mockWeather.access = 'denied';
    const { queryByLabelText } = await renderWithTheme(<DashboardHeader />);
    expect(queryByLabelText('Show local weather')).toBeNull();
    expect(queryByLabelText(/^Weather\./)).toBeNull();
  });
});

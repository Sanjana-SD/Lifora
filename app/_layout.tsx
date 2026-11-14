import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';

import { TYPE } from '@/constants/appConfig';
import type { ThemePreference } from '@/constants/colors';
import { getDatabase } from '@/database/database';
import { useNotificationLifecycle } from '@/hooks/useNotificationLifecycle';
import { ThemeProvider, useTheme } from '@/hooks/useTheme';
import * as settingsService from '@/services/settingsService';

export { ErrorBoundary } from 'expo-router';

export const unstable_settings = {
  anchor: '(tabs)',
};

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  // null until the database is open and the saved appearance is known.
  const [themePreference, setThemePreference] = useState<ThemePreference | null>(null);
  const [initError, setInitError] = useState<Error | null>(null);

  useEffect(() => {
    getDatabase()
      .then(() => settingsService.getThemePreference().catch((): ThemePreference => 'system'))
      .then(setThemePreference)
      .catch((error) => setInitError(error instanceof Error ? error : new Error(String(error))));
  }, []);

  const isReady = themePreference !== null;

  useEffect(() => {
    if (isReady || initError) {
      SplashScreen.hideAsync();
    }
  }, [isReady, initError]);

  if (initError) {
    throw initError;
  }

  if (!isReady) {
    return null;
  }

  return (
    <ThemeProvider initialPreference={themePreference} persist>
      <RootStack />
    </ThemeProvider>
  );
}

// Pushed screens (editors, details, stubs) get a themed header with a
// back button; the tab group renders its own headers.
function RootStack() {
  const { colors, scheme } = useTheme();
  useNotificationLifecycle(true);

  return (
    <>
      {/* Edge-to-edge: the status bar is transparent, so its icons must contrast with the ivory/dark page. */}
      <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.accent,
          headerTitleStyle: { ...TYPE.heading, color: colors.text },
          headerShadowVisible: false,
          contentStyle: { backgroundColor: colors.background },
        }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="index" options={{ headerShown: false }} />
      </Stack>
    </>
  );
}

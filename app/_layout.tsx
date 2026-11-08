import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import 'react-native-reanimated';

import { getDatabase } from '@/database/database';
import { ThemeProvider, useTheme } from '@/hooks/useTheme';

export { ErrorBoundary } from 'expo-router';

export const unstable_settings = {
  anchor: '(tabs)',
};

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [isDatabaseReady, setIsDatabaseReady] = useState(false);
  const [initError, setInitError] = useState<Error | null>(null);

  useEffect(() => {
    getDatabase()
      .then(() => setIsDatabaseReady(true))
      .catch((error) => setInitError(error instanceof Error ? error : new Error(String(error))));
  }, []);

  useEffect(() => {
    if (isDatabaseReady || initError) {
      SplashScreen.hideAsync();
    }
  }, [isDatabaseReady, initError]);

  if (initError) {
    throw initError;
  }

  if (!isDatabaseReady) {
    return null;
  }

  return (
    <ThemeProvider>
      <RootStack />
    </ThemeProvider>
  );
}

// Pushed screens (editors, details, stubs) get a themed header with a
// back button; the tab group renders its own headers.
function RootStack() {
  const { colors } = useTheme();

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.background },
        headerTintColor: colors.accent,
        headerTitleStyle: { color: colors.text },
        headerShadowVisible: false,
        contentStyle: { backgroundColor: colors.background },
      }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="index" options={{ headerShown: false }} />
    </Stack>
  );
}

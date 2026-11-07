import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import 'react-native-reanimated';

import { getDatabase } from '@/database/database';
import { ThemeProvider } from '@/hooks/useTheme';

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
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
      </Stack>
    </ThemeProvider>
  );
}

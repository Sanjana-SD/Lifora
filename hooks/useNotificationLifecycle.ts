import * as Notifications from 'expo-notifications';
import { router, type Href } from 'expo-router';
import { useEffect } from 'react';
import { AppState, Platform } from 'react-native';

import { initializeNotifications, syncNotifications } from '@/services/notificationService';

function openFrom(response: Notifications.NotificationResponse | null) {
  const route = response?.notification.request.content.data?.route;
  if (typeof route === 'string' && route.startsWith('/')) router.push(route as Href);
}

/**
 * App-wide notification upkeep: set up channels, re-plan on launch and
 * whenever the app returns to the foreground (which also covers device
 * restarts and timezone changes), and open the right screen when a
 * notification is tapped, including from a cold start.
 */
export function useNotificationLifecycle(enabled: boolean) {
  useEffect(() => {
    if (!enabled || Platform.OS === 'web') return;
    let cancelled = false;

    void initializeNotifications().then(() => syncNotifications());
    Notifications.getLastNotificationResponseAsync()
      .then((response) => {
        if (!cancelled) openFrom(response);
      })
      .catch(() => {});

    const tapped = Notifications.addNotificationResponseReceivedListener(openFrom);
    const foreground = AppState.addEventListener('change', (state) => {
      if (state === 'active') void syncNotifications();
    });

    return () => {
      cancelled = true;
      tapped.remove();
      foreground.remove();
    };
  }, [enabled]);
}

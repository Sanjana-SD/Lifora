import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';

import { getExactAlarmState, getPermissionState, type PermissionState } from '@/services/notificationService';

export interface NotificationAccess {
  notifications: PermissionState;
  /** Android 12+: whether alerts can fire at the exact minute. */
  exactAlarms: 'granted' | 'denied' | 'unsupported';
}

/** Re-checked on focus, so returning from system settings updates the banner. */
export function useNotificationAccess(): { access: NotificationAccess | null; refresh: () => void } {
  const [access, setAccess] = useState<NotificationAccess | null>(null);
  const mounted = useRef(true);
  useEffect(
    () => () => {
      mounted.current = false;
    },
    [],
  );

  const refresh = useCallback(() => {
    Promise.all([getPermissionState(), getExactAlarmState()])
      .then(([notifications, exactAlarms]) => mounted.current && setAccess({ notifications, exactAlarms }))
      .catch(() => mounted.current && setAccess({ notifications: 'unsupported', exactAlarms: 'unsupported' }));
  }, []);

  useFocusEffect(refresh);
  return { access, refresh };
}

export function useNotificationPermission(): PermissionState | null {
  return useNotificationAccess().access?.notifications ?? null;
}

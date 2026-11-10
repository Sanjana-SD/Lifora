import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';

import { getPermissionState, type PermissionState } from '@/services/notificationService';

/** Re-checked on focus, so returning from system settings updates the banner. */
export function useNotificationPermission(): PermissionState | null {
  const [state, setState] = useState<PermissionState | null>(null);
  useFocusEffect(
    useCallback(() => {
      let active = true;
      getPermissionState()
        .then((s) => active && setState(s))
        .catch(() => active && setState('unsupported'));
      return () => {
        active = false;
      };
    }, []),
  );
  return state;
}

import { BellRing } from 'lucide-react-native';
import React from 'react';

import { ComingSoonScreen } from '@/components/common/ComingSoonScreen';

export default function RemindersScreen() {
  return (
    <ComingSoonScreen
      headerTitle="Reminders"
      icon={BellRing}
      title="Reminders are coming soon"
      description="Reminders, with notifications and snooze, arrive in Phase 5."
    />
  );
}

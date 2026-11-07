import { BellPlus } from 'lucide-react-native';
import React from 'react';

import { ComingSoonScreen } from '@/components/common/ComingSoonScreen';

export default function AddReminderScreen() {
  return (
    <ComingSoonScreen
      headerTitle="Add Reminder"
      icon={BellPlus}
      title="Reminder creation is coming soon"
      description="Reminders, with notifications and snooze, arrive in Phase 5."
    />
  );
}

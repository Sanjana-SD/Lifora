import { CalendarPlus } from 'lucide-react-native';
import React from 'react';

import { ComingSoonScreen } from '@/components/common/ComingSoonScreen';

export default function AddEventScreen() {
  return (
    <ComingSoonScreen
      headerTitle="Add Event"
      icon={CalendarPlus}
      title="Event creation is coming soon"
      description="Calendar, with event creation and recurrence, arrives in Phase 5."
    />
  );
}

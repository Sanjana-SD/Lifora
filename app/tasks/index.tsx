import { ListChecks } from 'lucide-react-native';
import React from 'react';

import { ComingSoonScreen } from '@/components/common/ComingSoonScreen';

export default function TasksScreen() {
  return (
    <ComingSoonScreen
      headerTitle="Tasks"
      icon={ListChecks}
      title="Tasks are coming soon"
      description="Task management, with deadlines and priorities, arrives in Phase 5."
    />
  );
}

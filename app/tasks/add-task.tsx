import { ListPlus } from 'lucide-react-native';
import React from 'react';

import { ComingSoonScreen } from '@/components/common/ComingSoonScreen';

export default function AddTaskScreen() {
  return (
    <ComingSoonScreen
      headerTitle="Add Task"
      icon={ListPlus}
      title="Task creation is coming soon"
      description="Task management, with deadlines and priorities, arrives in Phase 5."
    />
  );
}

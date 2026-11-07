import { FilePlus } from 'lucide-react-native';
import React from 'react';

import { ComingSoonScreen } from '@/components/common/ComingSoonScreen';

export default function CreateNoteScreen() {
  return (
    <ComingSoonScreen
      headerTitle="New Note"
      icon={FilePlus}
      title="Note creation is coming soon"
      description="Notes and checklists arrive in Phase 3."
    />
  );
}

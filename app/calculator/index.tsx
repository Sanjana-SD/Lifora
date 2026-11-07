import { Calculator } from 'lucide-react-native';
import React from 'react';

import { ComingSoonScreen } from '@/components/common/ComingSoonScreen';

export default function CalculatorScreen() {
  return (
    <ComingSoonScreen
      headerTitle="Calculator"
      icon={Calculator}
      title="Calculator is coming soon"
      description="The basic calculator and EMI, GST, discount, and split-bill tools arrive in Phase 4."
    />
  );
}

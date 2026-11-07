import { WalletCards } from 'lucide-react-native';
import React from 'react';

import { ComingSoonScreen } from '@/components/common/ComingSoonScreen';

export default function AddTransactionScreen() {
  return (
    <ComingSoonScreen
      headerTitle="Add Transaction"
      icon={WalletCards}
      title="Expense tracking is coming soon"
      description="Manual income and expense entry arrives in Phase 6."
    />
  );
}

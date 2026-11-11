import { Stack, router, useLocalSearchParams } from 'expo-router';
import React, { useState } from 'react';

import { TransactionForm } from '@/components/finance/TransactionForm';
import { createTransaction } from '@/services/financeService';
import type { TransactionDraft } from '@/types/transaction';

export default function AddTransactionScreen() {
  const { type } = useLocalSearchParams<{ type?: string }>();
  const [initial] = useState<TransactionDraft>(() => ({
    type: type === 'income' ? 'income' : 'expense',
    amount: '',
    date: new Date(),
    categoryId: null,
    paymentMethod: null,
    description: '',
    note: '',
  }));

  return (
    <>
      <Stack.Screen options={{ title: 'Add Transaction' }} />
      <TransactionForm
        initial={initial}
        submitLabel="Save transaction"
        onSubmit={async (draft) => {
          await createTransaction(draft);
          router.back();
        }}
      />
    </>
  );
}

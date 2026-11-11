import { Stack, router, useLocalSearchParams } from 'expo-router';
import { ReceiptText, Trash2 } from 'lucide-react-native';
import React, { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { EmptyState } from '@/components/common/EmptyState';
import { TransactionForm } from '@/components/finance/TransactionForm';
import { SPACING, TYPE } from '@/constants/appConfig';
import { useTransaction } from '@/hooks/useFinance';
import { useTheme } from '@/hooks/useTheme';
import * as financeService from '@/services/financeService';
import { formatRelativeUpdated } from '@/utils/dateUtils';
import { formatPaise, paiseToInputString } from '@/utils/money';

export default function TransactionDetailsScreen() {
  const { colors } = useTheme();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const transactionId = Number(id);
  const { transaction: t, loading } = useTransaction(transactionId);
  const [deleting, setDeleting] = useState(false);

  if (!t) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <Stack.Screen options={{ title: 'Transaction' }} />
        {loading ? (
          <ActivityIndicator color={colors.accent} />
        ) : (
          <EmptyState icon={ReceiptText} title="Transaction not found" description="It may have been deleted." />
        )}
      </View>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: t.type === 'income' ? 'Income' : 'Expense',
          headerRight: () => (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Delete transaction"
              onPress={() => setDeleting(true)}
              hitSlop={8}
              style={styles.headerIcon}>
              <Trash2 size={20} color={colors.danger} />
            </Pressable>
          ),
        }}
      />
      <TransactionForm
        initial={financeService.draftFromTransaction(t, paiseToInputString(t.amountPaise))}
        submitLabel="Save changes"
        onSubmit={async (draft) => {
          await financeService.updateTransaction(transactionId, draft);
          router.back();
        }}
        footer={
          <Text style={[styles.meta, { color: colors.textMuted }]}>
            {t.source === 'import' ? 'Imported from a bank statement' : 'Added manually'} · {formatRelativeUpdated(t.createdAt)}
          </Text>
        }
      />
      <ConfirmDialog
        visible={deleting}
        title="Delete this transaction?"
        message={`${formatPaise(t.amountPaise)} will be removed from your totals. This can't be undone.`}
        confirmLabel="Delete"
        destructive
        onConfirm={async () => {
          setDeleting(false);
          await financeService.deleteTransaction(transactionId);
          router.back();
        }}
        onCancel={() => setDeleting(false)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: 'center',
  },
  headerIcon: {
    padding: SPACING.sm,
  },
  meta: {
    ...TYPE.caption,
    textAlign: 'center',
    marginTop: SPACING.lg,
  },
});

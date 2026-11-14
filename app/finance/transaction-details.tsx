import { format } from 'date-fns';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { ArrowDownLeft, ArrowUpRight, ReceiptText, Trash2 } from 'lucide-react-native';
import React, { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/common/Button';
import { Card } from '@/components/common/Card';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { EmptyState } from '@/components/common/EmptyState';
import { CategoryPicker } from '@/components/common/FormPickers';
import { Input } from '@/components/common/Input';
import { KeyboardAwareScreen } from '@/components/common/KeyboardAwareScreen';
import { SegmentedControl } from '@/components/common/SegmentedControl';
import { SPACING, TYPE } from '@/constants/appConfig';
import { PAYMENT_METHOD_LABELS } from '@/constants/paymentMethods';
import { useTransaction } from '@/hooks/useFinance';
import { useTheme } from '@/hooks/useTheme';
import * as financeService from '@/services/financeService';
import type { Transaction, TransactionType } from '@/types/transaction';
import { formatPaise } from '@/utils/money';
import { detectChannel } from '@/utils/statementParser';
import { ValidationError } from '@/utils/validationUtils';

const DIRECTIONS = [
  { value: 'expense', label: 'Money out' },
  { value: 'income', label: 'Money in' },
] as const;

export default function TransactionDetailsScreen() {
  const { colors } = useTheme();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const transactionId = Number(id);
  const { transaction: t, loading } = useTransaction(transactionId);

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
  // Keyed so a reload after saving starts the form from the saved values.
  return <Details key={`${t.id}:${t.type}:${t.categoryId}:${t.description}`} transaction={t} />;
}

function Details({ transaction: t }: { transaction: Transaction }) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [type, setType] = useState<TransactionType>(t.type);
  const [categoryId, setCategoryId] = useState<number | null>(t.categoryId);
  const [payee, setPayee] = useState(t.description);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const income = type === 'income';
  const Icon = income ? ArrowDownLeft : ArrowUpRight;
  const channel = detectChannel(t.note);
  const changed = type !== t.type || categoryId !== t.categoryId || payee.trim() !== t.description;

  const details: [string, string][] = [
    ['Date', format(financeService.fromDateKey(t.occurredOn), 'EEEE, d MMMM yyyy')],
    ['Via', channel === 'Other' ? PAYMENT_METHOD_LABELS[t.paymentMethod] : channel],
    ...(t.externalReference ? [['Reference', t.externalReference] as [string, string]] : []),
    ['Source', t.source === 'import' ? 'Bank statement' : 'Added manually'],
  ];

  const save = async () => {
    setSaving(true);
    setError(null);
    try {
      await financeService.updateTransactionDetails(t.id, { type, categoryId, description: payee });
      router.back();
    } catch (e) {
      setError(e instanceof ValidationError ? e.message : "Couldn't save the changes. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <KeyboardAwareScreen>
      <Stack.Screen
        options={{
          title: income ? 'Money in' : 'Money out',
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
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: SPACING.xxl + insets.bottom }]} keyboardShouldPersistTaps="handled">
        {/* Receipt header, like a payment app's transaction screen. */}
        <View style={styles.receipt} accessible accessibilityLabel={`${income ? 'Received from' : 'Paid to'} ${t.description}, ${formatPaise(t.amountPaise)}`}>
          <View style={[styles.avatar, { backgroundColor: income ? colors.surfaceAlt : colors.accentSoft, borderColor: income ? colors.success : colors.accent }]}>
            <Icon size={28} color={income ? colors.success : colors.accent} />
          </View>
          <Text style={[styles.payeeLabel, { color: colors.textMuted }]}>{income ? 'Received from' : 'Paid to'}</Text>
          <Text style={[styles.payee, { color: colors.text }]} numberOfLines={2}>
            {t.description}
          </Text>
          <Text style={[styles.amount, { color: income ? colors.success : colors.text }]}>
            {formatPaise(income ? t.amountPaise : -t.amountPaise, { signed: true })}
          </Text>
        </View>

        <Card style={styles.card}>
          {details.map(([label, value], i) => (
            <View key={label} style={[styles.detailRow, i > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border }]}>
              <Text style={[styles.detailLabel, { color: colors.textMuted }]}>{label}</Text>
              <Text style={[styles.detailValue, { color: colors.text }]} selectable>
                {value}
              </Text>
            </View>
          ))}
        </Card>

        {t.note ? (
          <Card style={styles.card}>
            <Text style={[styles.detailLabel, { color: colors.textMuted }]}>Bank description</Text>
            <Text style={[styles.narration, { color: colors.text }]} selectable>
              {t.note}
            </Text>
          </Card>
        ) : null}

        <Text style={[styles.section, { color: colors.textMuted }]} accessibilityRole="header">
          Correct the details
        </Text>
        <View style={styles.block}>
          <SegmentedControl<TransactionType> options={DIRECTIONS} value={type} onChange={setType} />
        </View>
        <Input label="Payee name" value={payee} onChangeText={setPayee} maxLength={financeService.PAYEE_MAX_LENGTH} />
        <CategoryPicker scope="finance" allowNone={false} value={categoryId} onChange={setCategoryId} />
        {error ? (
          <Text accessibilityRole="alert" style={[styles.error, { color: colors.danger }]}>
            {error}
          </Text>
        ) : null}
        <Button label="Save changes" onPress={save} loading={saving} disabled={!changed} style={styles.save} />
      </ScrollView>

      <ConfirmDialog
        visible={deleting}
        title="Delete this transaction?"
        message={`${formatPaise(t.amountPaise)} will be removed from your totals. Importing the same statement again would bring it back.`}
        confirmLabel="Delete"
        destructive
        onConfirm={async () => {
          setDeleting(false);
          await financeService.deleteTransaction(t.id);
          router.back();
        }}
        onCancel={() => setDeleting(false)}
      />
    </KeyboardAwareScreen>
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
  content: {
    padding: SPACING.lg,
  },
  receipt: {
    alignItems: 'center',
    paddingVertical: SPACING.lg,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.md,
  },
  payeeLabel: {
    ...TYPE.label,
  },
  payee: {
    ...TYPE.title,
    textAlign: 'center',
    marginTop: 2,
  },
  amount: {
    fontSize: 40,
    lineHeight: 48,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
    marginTop: SPACING.sm,
  },
  card: {
    marginBottom: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: SPACING.md,
    paddingVertical: SPACING.sm + 2,
  },
  detailLabel: {
    ...TYPE.label,
  },
  detailValue: {
    ...TYPE.bodySmall,
    fontWeight: '600',
    flexShrink: 1,
    textAlign: 'right',
  },
  narration: {
    ...TYPE.bodySmall,
    marginTop: SPACING.xs,
  },
  section: {
    ...TYPE.overline,
    marginTop: SPACING.md,
    marginBottom: SPACING.sm,
  },
  block: {
    marginBottom: SPACING.lg,
  },
  error: {
    ...TYPE.bodySmall,
    marginTop: SPACING.sm,
  },
  save: {
    marginTop: SPACING.md,
  },
});

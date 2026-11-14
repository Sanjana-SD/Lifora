import { format } from 'date-fns';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { SPACING, TOUCH_TARGET, TYPE } from '@/constants/appConfig';
import { PAYMENT_METHOD_LABELS } from '@/constants/paymentMethods';
import { useTheme } from '@/hooks/useTheme';
import { fromDateKey } from '@/services/financeService';
import type { Category } from '@/types/category';
import type { Transaction } from '@/types/transaction';
import { formatPaise } from '@/utils/money';
import { detectChannel } from '@/utils/statementParser';

interface TransactionRowProps {
  transaction: Transaction;
  category?: Category;
  onPress: () => void;
  /** Show the date in the meta line (lists that aren't grouped by day). */
  showDate?: boolean;
}

/** The title shown for a transaction: its payee, else its category. */
export function transactionTitle(t: Transaction, category?: Category): string {
  return t.description || category?.name || 'Uncategorized';
}

/** "UPI", "NEFT", "Card"… from the bank narration, else the payment-method label. */
export function transactionVia(t: Transaction): string {
  const channel = detectChannel(t.note);
  return channel === 'Other' ? PAYMENT_METHOD_LABELS[t.paymentMethod] : channel;
}

/** A payment-app style row: payee initial, payee, category and channel, signed amount. */
export function TransactionRow({ transaction: t, category, onPress, showDate = false }: TransactionRowProps) {
  const { colors } = useTheme();
  const income = t.type === 'income';
  const title = transactionTitle(t, category);
  const categoryName = category?.name ?? 'Uncategorized';
  const via = transactionVia(t);
  const meta = [showDate ? format(fromDateKey(t.occurredOn), 'd MMM') : null, categoryName, via].filter(Boolean).join(' · ');
  // The "+"/"−" sign, not colour alone, shows direction.
  const amount = formatPaise(income ? t.amountPaise : -t.amountPaise, { signed: true });

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${income ? 'Received from' : 'Paid to'} ${title}, ${formatPaise(t.amountPaise)}, ${categoryName}, ${via}`}
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed && { backgroundColor: colors.surfaceAlt }]}>
      <View style={[styles.avatar, { backgroundColor: colors.surfaceAlt, borderColor: category?.colorHex ?? colors.border }]}>
        <Text style={[styles.initial, { color: colors.text }]}>{title.charAt(0).toUpperCase()}</Text>
      </View>
      <View style={styles.text}>
        <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>
          {title}
        </Text>
        <Text style={[styles.meta, { color: colors.textMuted }]} numberOfLines={1}>
          {meta}
        </Text>
      </View>
      <Text style={[styles.amount, { color: income ? colors.success : colors.text }]}>{amount}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    minHeight: TOUCH_TARGET + 12,
    paddingVertical: SPACING.sm,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initial: {
    ...TYPE.subheading,
    fontWeight: '700',
  },
  text: {
    flex: 1,
  },
  title: {
    ...TYPE.subheading,
  },
  meta: {
    ...TYPE.caption,
    marginTop: 2,
  },
  amount: {
    ...TYPE.subheading,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
});

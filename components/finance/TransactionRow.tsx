import { format } from 'date-fns';
import { ArrowDownLeft, ArrowUpRight } from 'lucide-react-native';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { SPACING, TOUCH_TARGET, TYPE } from '@/constants/appConfig';
import { PAYMENT_METHOD_LABELS } from '@/constants/paymentMethods';
import { useTheme } from '@/hooks/useTheme';
import { fromDateKey } from '@/services/financeService';
import type { Category } from '@/types/category';
import type { Transaction } from '@/types/transaction';
import { formatPaise } from '@/utils/money';

interface TransactionRowProps {
  transaction: Transaction;
  category?: Category;
  onPress: () => void;
  /** Show the date in the meta line (lists that aren't grouped by day). */
  showDate?: boolean;
}

/** The title shown for a transaction: its description, else its category. */
export function transactionTitle(t: Transaction, category?: Category): string {
  return t.description || category?.name || 'Uncategorized';
}

export function TransactionRow({ transaction: t, category, onPress, showDate = false }: TransactionRowProps) {
  const { colors } = useTheme();
  const income = t.type === 'income';
  const title = transactionTitle(t, category);
  const categoryName = category?.name ?? 'Uncategorized';
  const meta = [
    showDate ? format(fromDateKey(t.occurredOn), 'd MMM') : null,
    t.description ? categoryName : null,
    PAYMENT_METHOD_LABELS[t.paymentMethod],
  ]
    .filter(Boolean)
    .join(' · ');
  const amount = formatPaise(income ? t.amountPaise : -t.amountPaise, { signed: true });
  const Icon = income ? ArrowDownLeft : ArrowUpRight;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${title}, ${income ? 'income' : 'expense'} ${formatPaise(t.amountPaise)}, ${categoryName}, ${PAYMENT_METHOD_LABELS[t.paymentMethod]}`}
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed && { backgroundColor: colors.surfaceAlt }]}>
      {/* Category colour carries identity; the arrow (not colour alone) shows direction. */}
      <View style={[styles.well, { backgroundColor: colors.surfaceAlt, borderColor: category?.colorHex ?? colors.border }]}>
        <Icon size={18} color={income ? colors.success : colors.text} />
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
  well: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
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

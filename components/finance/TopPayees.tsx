import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { SPACING, TYPE } from '@/constants/appConfig';
import { useTheme } from '@/hooks/useTheme';
import type { PayeeTotal } from '@/types/transaction';
import { formatPaise } from '@/utils/money';

/** Where the money went, by payee, largest first (like a payment app's "top people & businesses"). */
export function TopPayees({ payees }: { payees: PayeeTotal[] }) {
  const { colors } = useTheme();
  const max = Math.max(...payees.map((p) => p.totalPaise), 1);

  return (
    <View>
      {payees.map((p) => (
        <View
          key={p.name}
          style={styles.row}
          accessible
          accessibilityLabel={`${p.name}, ${formatPaise(p.totalPaise)} across ${p.count} ${p.count === 1 ? 'payment' : 'payments'}`}>
          <View style={[styles.avatar, { backgroundColor: colors.accentSoft }]}>
            <Text style={[styles.initial, { color: colors.accent }]}>{p.name.charAt(0).toUpperCase()}</Text>
          </View>
          <View style={styles.body}>
            <View style={styles.labels}>
              <Text style={[styles.name, { color: colors.text }]} numberOfLines={1}>
                {p.name}
              </Text>
              <Text style={[styles.amount, { color: colors.text }]}>{formatPaise(p.totalPaise, { decimals: 'auto' })}</Text>
            </View>
            <View style={[styles.track, { backgroundColor: colors.surfaceAlt }]}>
              <View style={[styles.fill, { width: `${(p.totalPaise / max) * 100}%`, backgroundColor: colors.chartOut }]} />
            </View>
            <Text style={[styles.count, { color: colors.textMuted }]}>
              {p.count} {p.count === 1 ? 'payment' : 'payments'}
            </Text>
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initial: {
    ...TYPE.heading,
  },
  body: {
    flex: 1,
  },
  labels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: SPACING.sm,
    marginBottom: 6,
  },
  name: {
    ...TYPE.subheading,
    flex: 1,
  },
  amount: {
    ...TYPE.subheading,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  track: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  fill: {
    height: 6,
    borderRadius: 3,
  },
  count: {
    ...TYPE.caption,
    marginTop: 4,
  },
});

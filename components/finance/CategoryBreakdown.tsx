import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { SPACING, TYPE } from '@/constants/appConfig';
import { useTheme } from '@/hooks/useTheme';
import type { Category } from '@/types/category';
import type { CategoryTotal } from '@/types/transaction';
import { formatPaise, percentOf } from '@/utils/money';

const SHOWN = 5;

interface CategoryBreakdownProps {
  totals: CategoryTotal[];
  categories: Map<number, Category>;
}

/**
 * Ranked bars, largest first. Bars share one hue (they encode amount);
 * the category's own colour sits on the dot beside its name (identity).
 * Past the top five, the rest fold into one row rather than adding hues.
 */
export function CategoryBreakdown({ totals, categories }: CategoryBreakdownProps) {
  const { colors } = useTheme();
  const total = totals.reduce((sum, t) => sum + t.totalPaise, 0);
  const top = totals.slice(0, SHOWN);
  const rest = totals.slice(SHOWN);
  const rows = top.map((t) => {
    const category = t.categoryId !== null ? categories.get(t.categoryId) : undefined;
    return { key: String(t.categoryId), name: category?.name ?? 'Uncategorized', color: category?.colorHex ?? colors.textMuted, totalPaise: t.totalPaise };
  });
  if (rest.length > 0) {
    rows.push({
      key: 'rest',
      name: `Everything else (${rest.length})`,
      color: colors.textMuted,
      totalPaise: rest.reduce((sum, t) => sum + t.totalPaise, 0),
    });
  }
  const max = Math.max(...rows.map((r) => r.totalPaise), 1);

  return (
    <View>
      {rows.map((row) => {
        const pct = percentOf(row.totalPaise, total);
        return (
          <View
            key={row.key}
            style={styles.row}
            accessible
            accessibilityLabel={`${row.name}, ${formatPaise(row.totalPaise)}, ${pct}% of spending`}>
            <View style={styles.labels}>
              <View style={[styles.dot, { backgroundColor: row.color }]} />
              <Text style={[styles.name, { color: colors.text }]} numberOfLines={1}>
                {row.name}
              </Text>
              <Text style={[styles.amount, { color: colors.text }]}>{formatPaise(row.totalPaise, { decimals: 'auto' })}</Text>
              <Text style={[styles.pct, { color: colors.textMuted }]}>{pct}%</Text>
            </View>
            <View style={[styles.track, { backgroundColor: colors.surfaceAlt }]}>
              <View style={[styles.fill, { width: `${(row.totalPaise / max) * 100}%`, backgroundColor: colors.accent }]} />
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    paddingVertical: SPACING.sm,
  },
  labels: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: 6,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  name: {
    ...TYPE.bodySmall,
    fontWeight: '600',
    flex: 1,
  },
  amount: {
    ...TYPE.bodySmall,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  pct: {
    ...TYPE.caption,
    minWidth: 34,
    textAlign: 'right',
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
});

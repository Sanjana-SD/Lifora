import { format } from 'date-fns';
import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { SPACING, TYPE } from '@/constants/appConfig';
import { useTheme } from '@/hooks/useTheme';
import { fromDateKey } from '@/services/financeService';
import type { DayTotal } from '@/types/transaction';
import { formatPaise } from '@/utils/money';

const PLOT_HEIGHT = 96;
const TICK_DAYS = new Set([1, 8, 15, 22, 29]);

/**
 * Spending per day of the month: one series, one hue, no legend. The
 * biggest day is labelled until the user taps another day to read it.
 */
export function DailySpendingChart({ days }: { days: DayTotal[] }) {
  const { colors } = useTheme();
  const max = Math.max(...days.map((d) => d.expensePaise), 0);
  const biggest = days.reduce<DayTotal | null>((best, d) => (d.expensePaise > (best?.expensePaise ?? 0) ? d : best), null);
  const [picked, setPicked] = useState<string | null>(null);
  const shown = days.find((d) => d.date === picked) ?? biggest;

  if (max === 0) {
    return <Text style={[styles.empty, { color: colors.textMuted }]}>No spending recorded this month.</Text>;
  }

  return (
    <View>
      {shown ? (
        <Text style={[styles.readout, { color: colors.text }]}>
          {picked ? '' : 'Biggest day · '}
          {format(fromDateKey(shown.date), 'EEE d MMM')}: {formatPaise(shown.expensePaise, { decimals: 'auto' })}
        </Text>
      ) : null}
      <View style={styles.chart}>
        {days.map((d) => {
          const isShown = d.date === shown?.date;
          const height = d.expensePaise > 0 ? Math.max(3, (d.expensePaise / max) * PLOT_HEIGHT) : 0;
          return (
            <Pressable
              key={d.date}
              accessibilityRole="button"
              accessibilityState={{ selected: isShown }}
              accessibilityLabel={`${format(fromDateKey(d.date), 'd MMMM')}: spent ${formatPaise(d.expensePaise)}`}
              onPress={() => setPicked(d.date)}
              hitSlop={{ top: 8, bottom: 8 }}
              style={styles.column}>
              <View style={styles.plot}>
                <View
                  style={[styles.bar, { height, backgroundColor: colors.chartOut, opacity: isShown || !picked ? 1 : 0.55 }]}
                />
              </View>
            </Pressable>
          );
        })}
      </View>
      <View style={[styles.baseline, { backgroundColor: colors.border }]} />
      <View style={styles.ticks}>
        {days.map((d) => {
          const day = fromDateKey(d.date).getDate();
          return (
            <Text key={d.date} style={[styles.tick, { color: colors.textMuted }]}>
              {TICK_DAYS.has(day) ? day : ''}
            </Text>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  empty: {
    ...TYPE.bodySmall,
    paddingVertical: SPACING.sm,
  },
  readout: {
    ...TYPE.bodySmall,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
    marginBottom: SPACING.sm,
  },
  chart: {
    flexDirection: 'row',
    height: PLOT_HEIGHT,
    alignItems: 'flex-end',
    gap: 2,
  },
  column: {
    flex: 1,
    height: PLOT_HEIGHT,
    justifyContent: 'flex-end',
  },
  plot: {
    alignItems: 'stretch',
  },
  bar: {
    borderTopLeftRadius: 3,
    borderTopRightRadius: 3,
  },
  baseline: {
    height: 1,
  },
  ticks: {
    flexDirection: 'row',
    gap: 2,
    marginTop: SPACING.xs,
  },
  tick: {
    ...TYPE.caption,
    flex: 1,
    textAlign: 'left',
    fontSize: 11,
  },
});

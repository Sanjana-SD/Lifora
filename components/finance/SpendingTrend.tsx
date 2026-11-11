import { format } from 'date-fns';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { SPACING, TYPE } from '@/constants/appConfig';
import { useTheme } from '@/hooks/useTheme';
import { fromDateKey } from '@/services/financeService';
import type { MonthTotal } from '@/types/transaction';
import { formatPaise } from '@/utils/money';

const PLOT_HEIGHT = 112;

interface SpendingTrendProps {
  months: MonthTotal[];
  /** 'yyyy-MM' of the month the dashboard is showing. */
  selected: string;
  onSelect: (month: Date) => void;
}

/**
 * Monthly spending as one series of bars: one hue, no legend (the card
 * title names it), and a value label only on the selected month. Tapping
 * a bar shows that month on the dashboard.
 */
export function SpendingTrend({ months, selected, onSelect }: SpendingTrendProps) {
  const { colors } = useTheme();
  const max = Math.max(...months.map((m) => m.expensePaise), 1);

  return (
    <View style={styles.chart}>
      {months.map((m) => {
        const date = fromDateKey(`${m.month}-01`);
        const isSelected = m.month === selected;
        const height = m.expensePaise > 0 ? Math.max(4, (m.expensePaise / max) * PLOT_HEIGHT) : 0;
        return (
          <Pressable
            key={m.month}
            accessibilityRole="button"
            accessibilityState={{ selected: isSelected }}
            accessibilityLabel={`${format(date, 'MMMM yyyy')}: spent ${formatPaise(m.expensePaise)}`}
            onPress={() => onSelect(date)}
            style={styles.column}>
            <View style={styles.plot}>
              {isSelected ? (
                <Text style={[styles.value, { color: colors.text }]} numberOfLines={1}>
                  {formatPaise(m.expensePaise, { decimals: 'auto' })}
                </Text>
              ) : null}
              <View
                style={[
                  styles.bar,
                  { height, backgroundColor: colors.accent, opacity: isSelected ? 1 : 0.6 },
                ]}
              />
            </View>
            <View style={[styles.baseline, { backgroundColor: colors.border }]} />
            <Text
              style={[
                styles.month,
                { color: isSelected ? colors.accent : colors.textMuted, fontWeight: isSelected ? '700' : '500' },
              ]}>
              {format(date, 'MMM')}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  chart: {
    flexDirection: 'row',
    // 2px surface gap between neighbouring bars, plus room to tap each one.
    gap: 2,
  },
  column: {
    flex: 1,
    alignItems: 'center',
  },
  plot: {
    height: PLOT_HEIGHT + 22,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  value: {
    ...TYPE.caption,
    fontWeight: '700',
    marginBottom: 4,
    fontVariant: ['tabular-nums'],
  },
  bar: {
    width: '62%',
    maxWidth: 36,
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
  },
  baseline: {
    height: 1,
    alignSelf: 'stretch',
  },
  month: {
    ...TYPE.caption,
    marginTop: SPACING.xs,
  },
});

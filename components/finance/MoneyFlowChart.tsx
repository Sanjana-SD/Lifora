import { format } from 'date-fns';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { SPACING, TYPE } from '@/constants/appConfig';
import { useTheme } from '@/hooks/useTheme';
import { fromDateKey } from '@/services/financeService';
import type { MonthTotal } from '@/types/transaction';
import { formatPaise } from '@/utils/money';

const PLOT_HEIGHT = 120;

interface MoneyFlowChartProps {
  months: MonthTotal[];
  /** 'yyyy-MM' of the month the dashboard is showing. */
  selected: string;
  onSelect: (month: Date) => void;
}

/**
 * Money in vs money out per month: paired bars on one axis, a legend for
 * the two series, and the selected month's figures as text. The two fills
 * are a colour-blind-checked pair (they differ in lightness, not just hue).
 */
export function MoneyFlowChart({ months, selected, onSelect }: MoneyFlowChartProps) {
  const { colors } = useTheme();
  const max = Math.max(...months.flatMap((m) => [m.expensePaise, m.incomePaise]), 1);
  const current = months.find((m) => m.month === selected);
  const height = (paise: number) => (paise > 0 ? Math.max(3, (paise / max) * PLOT_HEIGHT) : 0);

  return (
    <View>
      <View style={styles.legend}>
        <LegendItem color={colors.chartIn} label="Money in" />
        <LegendItem color={colors.chartOut} label="Money out" />
      </View>
      {current ? (
        <Text style={[styles.readout, { color: colors.text }]}>
          {format(fromDateKey(`${current.month}-01`), 'MMMM')}: in {formatPaise(current.incomePaise, { decimals: 'auto' })} · out{' '}
          {formatPaise(current.expensePaise, { decimals: 'auto' })}
        </Text>
      ) : null}
      <View style={styles.chart}>
        {months.map((m) => {
          const date = fromDateKey(`${m.month}-01`);
          const isSelected = m.month === selected;
          return (
            <Pressable
              key={m.month}
              accessibilityRole="button"
              accessibilityState={{ selected: isSelected }}
              accessibilityLabel={`${format(date, 'MMMM yyyy')}: money in ${formatPaise(m.incomePaise)}, money out ${formatPaise(m.expensePaise)}`}
              onPress={() => onSelect(date)}
              style={[styles.column, isSelected && { backgroundColor: colors.surfaceAlt }]}>
              <View style={styles.plot}>
                <View style={[styles.bar, { height: height(m.incomePaise), backgroundColor: colors.chartIn }]} />
                <View style={[styles.bar, { height: height(m.expensePaise), backgroundColor: colors.chartOut }]} />
              </View>
              <View style={[styles.baseline, { backgroundColor: colors.border }]} />
              <Text
                style={[styles.month, { color: isSelected ? colors.accent : colors.textMuted, fontWeight: isSelected ? '700' : '500' }]}>
                {format(date, 'MMM')}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function LegendItem({ color, label }: { color: string; label: string }) {
  const { colors } = useTheme();
  return (
    <View style={styles.legendItem}>
      <View style={[styles.swatch, { backgroundColor: color }]} />
      <Text style={[styles.legendText, { color: colors.textMuted }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  legend: {
    flexDirection: 'row',
    gap: SPACING.lg,
    marginBottom: SPACING.xs,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  swatch: {
    width: 10,
    height: 10,
    borderRadius: 2,
  },
  legendText: {
    ...TYPE.caption,
  },
  readout: {
    ...TYPE.bodySmall,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
    marginBottom: SPACING.sm,
  },
  chart: {
    flexDirection: 'row',
    gap: 2,
  },
  column: {
    flex: 1,
    alignItems: 'center',
    borderRadius: 8,
    paddingTop: SPACING.xs,
  },
  plot: {
    height: PLOT_HEIGHT,
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 2,
  },
  bar: {
    width: 12,
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
  },
  baseline: {
    height: 1,
    alignSelf: 'stretch',
  },
  month: {
    ...TYPE.caption,
    marginVertical: SPACING.xs,
  },
});

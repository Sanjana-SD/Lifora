import { format, isSameDay, isSameMonth } from 'date-fns';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { RADIUS, SPACING } from '@/constants/appConfig';
import { useTheme } from '@/hooks/useTheme';
import { buildMonthGrid, dayKey } from '@/utils/calendarGrid';

const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const MAX_DOTS = 3;

interface MonthGridProps {
  month: Date;
  selected: Date | null;
  onSelect: (date: Date) => void;
  /** Dot colors per day key (e.g. event category colors). */
  markers?: Map<string, string[]>;
  today?: Date;
}

export function MonthGrid({ month, selected, onSelect, markers, today = new Date() }: MonthGridProps) {
  const { colors } = useTheme();

  return (
    <View>
      <View style={styles.row}>
        {WEEKDAYS.map((d, i) => (
          <Text key={i} style={[styles.weekday, { color: colors.textMuted }]} importantForAccessibility="no">
            {d}
          </Text>
        ))}
      </View>
      {buildMonthGrid(month).map((week) => (
        <View key={dayKey(week[0])} style={styles.row}>
          {week.map((day) => {
            const inMonth = isSameMonth(day, month);
            const isSelected = selected !== null && isSameDay(day, selected);
            const isToday = isSameDay(day, today);
            const dots = markers?.get(dayKey(day)) ?? [];
            const count = dots.length;
            return (
              <Pressable
                key={dayKey(day)}
                accessibilityRole="button"
                accessibilityState={{ selected: isSelected }}
                accessibilityLabel={`${format(day, 'EEEE, d MMMM')}${isToday ? ', today' : ''}${
                  count ? `, ${count} event${count === 1 ? '' : 's'}` : ''
                }`}
                onPress={() => onSelect(day)}
                style={styles.cell}>
                <View
                  style={[
                    styles.dayCircle,
                    isSelected && { backgroundColor: colors.primary },
                    !isSelected && isToday && { borderColor: colors.accent, borderWidth: 1.5 },
                  ]}>
                  <Text
                    style={[
                      styles.dayText,
                      { color: isSelected ? colors.onPrimary : isToday ? colors.accent : inMonth ? colors.text : colors.textMuted },
                      !inMonth && styles.outside,
                      isToday && styles.todayText,
                    ]}>
                    {format(day, 'd')}
                  </Text>
                </View>
                <View style={styles.dots}>
                  {dots.slice(0, MAX_DOTS).map((color, i) => (
                    <View key={i} style={[styles.dot, { backgroundColor: color }]} />
                  ))}
                </View>
              </Pressable>
            );
          })}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
  },
  weekday: {
    flex: 1,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '700',
    paddingVertical: SPACING.xs,
  },
  cell: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 2,
    minHeight: 50,
  },
  dayCircle: {
    width: 38,
    height: 38,
    borderRadius: RADIUS.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayText: {
    fontSize: 14.5,
    fontWeight: '500',
  },
  todayText: {
    fontWeight: '800',
  },
  outside: {
    opacity: 0.45,
  },
  dots: {
    flexDirection: 'row',
    gap: 2,
    height: 6,
    marginTop: 2,
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 3,
  },
});

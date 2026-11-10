import { endOfDay, format, startOfDay } from 'date-fns';
import { router, type Href } from 'expo-router';
import { CalendarDays } from 'lucide-react-native';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { addEventOn, openOccurrence } from '@/components/calendar/navigation';
import { SPACING } from '@/constants/appConfig';
import { useCategoryMap, useOccurrences } from '@/hooks/useCalendar';
import { useCurrentDate } from '@/hooks/useCurrentDate';
import { useTheme } from '@/hooks/useTheme';
import type { EventOccurrence } from '@/types/event';
import { AddLink } from './AddLink';
import { DashboardSection } from './DashboardSection';

const SHOWN = 3;

export function EventLine({ occurrence, label }: { occurrence: EventOccurrence; label: string }) {
  const { colors } = useTheme();
  const categories = useCategoryMap('calendar');
  const color = (occurrence.categoryId !== null && categories.get(occurrence.categoryId)?.colorHex) || colors.accent;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${occurrence.title}, ${label}`}
      onPress={() => openOccurrence(occurrence)}
      style={styles.line}>
      <View style={[styles.dot, { backgroundColor: color }]} />
      <Text style={[styles.time, { color: colors.textMuted }]}>{label}</Text>
      <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>
        {occurrence.title}
      </Text>
    </Pressable>
  );
}

export function TodayEventsCard() {
  const { colors } = useTheme();
  // Ticks every minute, so "today" rolls over at midnight (PRD 1.4).
  const today = useCurrentDate();
  const { occurrences, error } = useOccurrences(startOfDay(today), endOfDay(today));

  return (
    <DashboardSection icon={CalendarDays} title="Today's Events" onPress={() => router.push('/(tabs)/calendar' as Href)}>
      {error ? (
        <Text style={[styles.empty, { color: colors.danger }]}>{"Couldn't load events."}</Text>
      ) : occurrences.length === 0 ? (
        <Text style={[styles.empty, { color: colors.textMuted }]}>
          Nothing scheduled today — enjoy the calm, or plan ahead.
        </Text>
      ) : (
        <>
          {occurrences.slice(0, SHOWN).map((o) => (
            <EventLine key={o.key} occurrence={o} label={o.start < startOfDay(today) ? 'Ongoing' : format(o.start, 'h:mm a')} />
          ))}
          {occurrences.length > SHOWN ? (
            <Text style={[styles.more, { color: colors.textMuted }]}>+{occurrences.length - SHOWN} more today</Text>
          ) : null}
        </>
      )}
      <AddLink label="Add an event" onPress={() => addEventOn(today)} />
    </DashboardSection>
  );
}

const styles = StyleSheet.create({
  empty: {
    fontSize: 13,
    lineHeight: 18,
  },
  line: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    paddingVertical: SPACING.xs,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  time: {
    fontSize: 12.5,
    minWidth: 64,
  },
  title: {
    flex: 1,
    fontSize: 13.5,
    fontWeight: '600',
  },
  more: {
    fontSize: 12,
    marginTop: 2,
  },
});

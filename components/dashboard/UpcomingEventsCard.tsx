import { endOfDay, format } from 'date-fns';
import { router, type Href } from 'expo-router';
import { CalendarClock } from 'lucide-react-native';
import React from 'react';
import { StyleSheet, Text } from 'react-native';

import { useUpcomingEvents } from '@/hooks/useCalendar';
import { useTheme } from '@/hooks/useTheme';
import { formatDue } from '@/utils/dateUtils';
import { DashboardSection } from './DashboardSection';
import { EventLine } from './TodayEventsCard';

const SHOWN = 3;

export function UpcomingEventsCard() {
  const { colors } = useTheme();
  const { occurrences, error } = useUpcomingEvents();
  const afterToday = occurrences.filter((o) => o.start > endOfDay(new Date())).slice(0, SHOWN);

  return (
    <DashboardSection icon={CalendarClock} title="Upcoming" onPress={() => router.push('/(tabs)/calendar' as Href)}>
      {error ? (
        <Text style={[styles.empty, { color: colors.danger }]}>{"Couldn't load events."}</Text>
      ) : afterToday.length === 0 ? (
        <Text style={[styles.empty, { color: colors.textMuted }]}>No upcoming events in the next 30 days.</Text>
      ) : (
        afterToday.map((o) => (
          <EventLine key={o.key} occurrence={o} label={formatDue(o.start, new Date(), false) + ' · ' + format(o.start, 'h:mm a')} />
        ))
      )}
    </DashboardSection>
  );
}

const styles = StyleSheet.create({
  empty: {
    fontSize: 13,
    lineHeight: 18,
  },
});

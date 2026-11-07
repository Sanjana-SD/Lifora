import { router } from 'expo-router';
import { CalendarClock } from 'lucide-react-native';
import React from 'react';
import { StyleSheet, Text } from 'react-native';

import { useTheme } from '@/hooks/useTheme';
import { DashboardSection } from './DashboardSection';

export function UpcomingEventsCard() {
  const { colors } = useTheme();

  return (
    <DashboardSection icon={CalendarClock} title="Upcoming" onPress={() => router.push('/(tabs)/calendar')}>
      <Text style={[styles.empty, { color: colors.textMuted }]}>
        No upcoming events in the next 30 days.
      </Text>
    </DashboardSection>
  );
}

const styles = StyleSheet.create({
  empty: {
    fontSize: 13,
    lineHeight: 18,
  },
});

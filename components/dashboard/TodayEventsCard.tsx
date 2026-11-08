import { router, type Href } from 'expo-router';
import { CalendarDays } from 'lucide-react-native';
import React from 'react';
import { StyleSheet, Text } from 'react-native';

import { useTheme } from '@/hooks/useTheme';
import { AddLink } from './AddLink';
import { DashboardSection } from './DashboardSection';

export function TodayEventsCard() {
  const { colors } = useTheme();

  return (
    <DashboardSection
      icon={CalendarDays}
      title="Today's Events"
      onPress={() => router.push('/(tabs)/calendar' as Href)}>
      <Text style={[styles.empty, { color: colors.textMuted }]}>
        Nothing scheduled today — enjoy the calm, or plan ahead.
      </Text>
      <AddLink label="Add an event" onPress={() => router.push('/calendar/add-event' as Href)} />
    </DashboardSection>
  );
}

const styles = StyleSheet.create({
  empty: {
    fontSize: 13,
    lineHeight: 18,
  },
});

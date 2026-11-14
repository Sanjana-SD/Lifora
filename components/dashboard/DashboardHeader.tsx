import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { SPACING, TYPE } from '@/constants/appConfig';
import { useCurrentDate } from '@/hooks/useCurrentDate';
import { useTheme } from '@/hooks/useTheme';
import { formatHeaderDate, getGreeting } from '@/utils/dateUtils';
import { WeatherWidget } from './WeatherWidget';

export function DashboardHeader() {
  const { colors } = useTheme();
  const now = useCurrentDate();

  return (
    <View style={styles.container}>
      <View style={styles.text}>
        <Text style={[styles.date, { color: colors.accent }]}>{formatHeaderDate(now)}</Text>
        <Text style={[styles.greeting, { color: colors.text }]} accessibilityRole="header">
          {getGreeting(now)}
        </Text>
      </View>
      <WeatherWidget />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    marginBottom: SPACING.lg,
  },
  text: {
    flex: 1,
  },
  date: {
    ...TYPE.overline,
  },
  greeting: {
    ...TYPE.display,
    marginTop: SPACING.xs,
  },
});

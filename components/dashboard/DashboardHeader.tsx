import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { SPACING } from '@/constants/appConfig';
import { useCurrentDate } from '@/hooks/useCurrentDate';
import { useTheme } from '@/hooks/useTheme';
import { formatHeaderDate, getGreeting } from '@/utils/dateUtils';

export function DashboardHeader() {
  const { colors } = useTheme();
  const now = useCurrentDate();

  return (
    <View style={styles.container}>
      <Text style={[styles.date, { color: colors.textMuted }]}>{formatHeaderDate(now)}</Text>
      <Text style={[styles.greeting, { color: colors.text }]}>{getGreeting(now)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: SPACING.lg,
  },
  date: {
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  greeting: {
    fontSize: 24,
    fontWeight: '700',
    marginTop: SPACING.xs,
  },
});

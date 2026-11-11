import { router, type Href } from 'expo-router';
import { Calculator } from 'lucide-react-native';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { RADIUS, SPACING, TOUCH_TARGET, TYPE } from '@/constants/appConfig';
import { useCurrentDate } from '@/hooks/useCurrentDate';
import { useTheme } from '@/hooks/useTheme';
import { formatHeaderDate, getGreeting } from '@/utils/dateUtils';

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
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Open Calculator"
        onPress={() => router.push('/calculator' as Href)}
        style={({ pressed }) => [
          styles.shortcut,
          { backgroundColor: pressed ? colors.accentSoft : colors.surface, borderColor: colors.border },
        ]}>
        <Calculator size={22} color={colors.accent} />
      </Pressable>
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
  shortcut: {
    width: TOUCH_TARGET,
    height: TOUCH_TARGET,
    borderRadius: RADIUS.pill,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
  date: {
    ...TYPE.overline,
  },
  greeting: {
    ...TYPE.display,
    marginTop: SPACING.xs,
  },
});

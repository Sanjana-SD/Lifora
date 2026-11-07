import { router } from 'expo-router';
import { BellRing } from 'lucide-react-native';
import React from 'react';
import { StyleSheet, Text } from 'react-native';

import { useTheme } from '@/hooks/useTheme';
import { AddLink } from './AddLink';
import { DashboardSection } from './DashboardSection';

export function RemindersCard() {
  const { colors } = useTheme();

  return (
    <DashboardSection icon={BellRing} title="Reminders" onPress={() => router.push('/reminders/index')}>
      <Text style={[styles.empty, { color: colors.textMuted }]}>No pending reminders.</Text>
      <AddLink label="Add a reminder" onPress={() => router.push('/reminders/add-reminder')} />
    </DashboardSection>
  );
}

const styles = StyleSheet.create({
  empty: {
    fontSize: 13,
    lineHeight: 18,
  },
});

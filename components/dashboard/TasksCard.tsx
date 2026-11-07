import { router } from 'expo-router';
import { ListChecks } from 'lucide-react-native';
import React from 'react';
import { StyleSheet, Text } from 'react-native';

import { useTheme } from '@/hooks/useTheme';
import { AddLink } from './AddLink';
import { DashboardSection } from './DashboardSection';

export function TasksCard() {
  const { colors } = useTheme();

  return (
    <DashboardSection icon={ListChecks} title="Tasks" onPress={() => router.push('/tasks/index')}>
      <Text style={[styles.empty, { color: colors.textMuted }]}>No tasks yet — pending and completed will show up here.</Text>
      <AddLink label="Add a task" onPress={() => router.push('/tasks/add-task')} />
    </DashboardSection>
  );
}

const styles = StyleSheet.create({
  empty: {
    fontSize: 13,
    lineHeight: 18,
  },
});

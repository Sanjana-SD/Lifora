import { router } from 'expo-router';
import { NotebookPen } from 'lucide-react-native';
import React from 'react';
import { StyleSheet, Text } from 'react-native';

import { useTheme } from '@/hooks/useTheme';
import { AddLink } from './AddLink';
import { DashboardSection } from './DashboardSection';

export function RecentNotesCard() {
  const { colors } = useTheme();

  return (
    <DashboardSection icon={NotebookPen} title="Recent Notes" onPress={() => router.push('/(tabs)/notes')}>
      <Text style={[styles.empty, { color: colors.textMuted }]}>
        Your notes will show up here once you create one.
      </Text>
      <AddLink label="Create a note" onPress={() => router.push('/notes/create-note')} />
    </DashboardSection>
  );
}

const styles = StyleSheet.create({
  empty: {
    fontSize: 13,
    lineHeight: 18,
  },
});

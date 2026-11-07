import { Stack } from 'expo-router';
import type { LucideIcon } from 'lucide-react-native';
import React from 'react';
import { StyleSheet, View } from 'react-native';

import { useTheme } from '@/hooks/useTheme';
import { EmptyState } from './EmptyState';

interface ComingSoonScreenProps {
  headerTitle: string;
  icon: LucideIcon;
  title: string;
  description: string;
}

// A deliberately minimal placeholder for a route named in the PRD's
// folder structure (Section 10) but not yet built out by its phase
// (Section 14). Gives quick-add buttons and card navigation a real
// destination today; the phase that owns this screen replaces it.
export function ComingSoonScreen({ headerTitle, icon, title, description }: ComingSoonScreenProps) {
  const { colors } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen options={{ title: headerTitle }} />
      <EmptyState icon={icon} title={title} description={description} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
  },
});

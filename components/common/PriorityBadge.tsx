import { Flag } from 'lucide-react-native';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { PRIORITY_LABELS, type Priority } from '@/constants/priorities';
import { useTheme } from '@/hooks/useTheme';

/** Only high and low are shown; medium is the unremarkable default. */
export function PriorityBadge({ priority }: { priority: Priority }) {
  const { colors } = useTheme();
  if (priority === 'medium') return null;
  const color = priority === 'high' ? colors.danger : colors.textMuted;
  return (
    <View style={styles.badge}>
      <Flag size={11} color={color} />
      <Text style={[styles.text, { color }]}>{PRIORITY_LABELS[priority]}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  text: {
    fontSize: 11.5,
    fontWeight: '700',
  },
});

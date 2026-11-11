import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { SPACING, TYPE } from '@/constants/appConfig';
import { useTheme } from '@/hooks/useTheme';

interface SectionHeaderProps {
  title: string;
  count?: number;
  tone?: 'default' | 'danger';
}

/** Small uppercase label above a group of rows ("OVERDUE · 2"). */
export function SectionHeader({ title, count, tone = 'default' }: SectionHeaderProps) {
  const { colors } = useTheme();
  return (
    <View style={[styles.row, { backgroundColor: colors.background }]}>
      <Text accessibilityRole="header" style={[styles.text, { color: tone === 'danger' ? colors.danger : colors.textMuted }]}>
        {count !== undefined ? `${title} · ${count}` : title}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    paddingTop: SPACING.md,
    paddingBottom: SPACING.sm,
  },
  text: {
    ...TYPE.overline,
  },
});

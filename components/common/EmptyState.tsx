import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { LucideIcon } from 'lucide-react-native';

import { useTheme } from '@/hooks/useTheme';
import { SPACING } from '@/constants/appConfig';
import { Button } from './Button';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({ icon: Icon, title, description, actionLabel, onAction }: EmptyStateProps) {
  const { colors } = useTheme();

  return (
    <View style={styles.container}>
      {Icon ? <Icon size={40} color={colors.textMuted} strokeWidth={1.5} /> : null}
      <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
      {description ? (
        <Text style={[styles.description, { color: colors.textMuted }]}>{description}</Text>
      ) : null}
      {actionLabel && onAction ? (
        <Button label={actionLabel} onPress={onAction} style={styles.action} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.xxl,
    paddingHorizontal: SPACING.lg,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    marginTop: SPACING.md,
    textAlign: 'center',
  },
  description: {
    fontSize: 13,
    marginTop: SPACING.xs,
    textAlign: 'center',
    lineHeight: 18,
  },
  action: {
    marginTop: SPACING.lg,
    minWidth: 160,
  },
});

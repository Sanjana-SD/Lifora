import { ChevronRight, type LucideIcon } from 'lucide-react-native';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Card } from '@/components/common/Card';
import { SPACING } from '@/constants/appConfig';
import { useTheme } from '@/hooks/useTheme';

interface DashboardSectionProps {
  icon: LucideIcon;
  title: string;
  onPress?: () => void;
  children: React.ReactNode;
}

export function DashboardSection({ icon: Icon, title, onPress, children }: DashboardSectionProps) {
  const { colors } = useTheme();

  const header = (
    <View style={styles.header}>
      <View style={styles.headerLeft}>
        <Icon size={18} color={colors.accent} />
        <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
      </View>
      {onPress ? <ChevronRight size={18} color={colors.textMuted} /> : null}
    </View>
  );

  return (
    <Card style={styles.card}>
      {onPress ? (
        <Pressable onPress={onPress} accessibilityRole="button" hitSlop={4}>
          {header}
        </Pressable>
      ) : (
        header
      )}
      <View style={styles.body}>{children}</View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: SPACING.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  title: {
    fontSize: 14.5,
    fontWeight: '700',
  },
  body: {
    marginTop: SPACING.sm,
  },
});

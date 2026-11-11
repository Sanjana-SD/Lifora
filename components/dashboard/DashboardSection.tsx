import { ChevronRight, type LucideIcon } from 'lucide-react-native';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Card } from '@/components/common/Card';
import { RADIUS, SPACING, TOUCH_TARGET, TYPE } from '@/constants/appConfig';
import { useTheme } from '@/hooks/useTheme';

interface DashboardSectionProps {
  icon: LucideIcon;
  title: string;
  /** Opens the full screen for this section; shows "See all". */
  onPress?: () => void;
  children: React.ReactNode;
}

export function DashboardSection({ icon: Icon, title, onPress, children }: DashboardSectionProps) {
  const { colors } = useTheme();

  const header = (
    <View style={styles.header}>
      <View style={[styles.iconWell, { backgroundColor: colors.accentSoft }]}>
        <Icon size={16} color={colors.accent} />
      </View>
      <Text style={[styles.title, { color: colors.text }]} accessibilityRole="header">
        {title}
      </Text>
      {onPress ? (
        <View style={styles.seeAll}>
          <Text style={[styles.seeAllText, { color: colors.accent }]}>See all</Text>
          <ChevronRight size={16} color={colors.accent} />
        </View>
      ) : null}
    </View>
  );

  return (
    <Card style={styles.card}>
      {onPress ? (
        <Pressable onPress={onPress} accessibilityRole="button" accessibilityHint={`Opens ${title}`}>
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
    paddingTop: SPACING.xs,
    paddingBottom: SPACING.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    minHeight: TOUCH_TARGET,
  },
  iconWell: {
    width: 28,
    height: 28,
    borderRadius: RADIUS.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    ...TYPE.heading,
    flex: 1,
  },
  seeAll: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  seeAllText: {
    ...TYPE.label,
  },
  body: {
    marginTop: SPACING.xs,
  },
});

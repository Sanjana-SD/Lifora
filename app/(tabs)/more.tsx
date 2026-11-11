import { router, type Href } from 'expo-router';
import { BellRing, Calculator, ChevronRight, ListChecks, Settings, type LucideIcon } from 'lucide-react-native';
import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Card } from '@/components/common/Card';
import { SectionHeader } from '@/components/common/SectionHeader';
import { RADIUS, SPACING, TOUCH_TARGET, TYPE } from '@/constants/appConfig';
import { useTheme } from '@/hooks/useTheme';

interface MenuItem {
  label: string;
  description: string;
  icon: LucideIcon;
  href: string;
}

// PRD Section 5.1: More holds Reminders & Tasks, Calculator, and Settings.
const GROUPS: { title: string; items: MenuItem[] }[] = [
  {
    title: 'Plan',
    items: [
      { label: 'Reminders', description: 'Timed alerts, repeats, and snooze', icon: BellRing, href: '/reminders' },
      { label: 'Tasks', description: 'To-dos with deadlines and priorities', icon: ListChecks, href: '/tasks' },
    ],
  },
  {
    title: 'Tools',
    items: [{ label: 'Calculator', description: 'Everyday arithmetic with history', icon: Calculator, href: '/calculator' }],
  },
  {
    title: 'App',
    items: [{ label: 'Settings', description: 'Appearance and app info', icon: Settings, href: '/settings' }],
  },
];

export default function MoreScreen() {
  const { colors } = useTheme();

  return (
    <ScrollView style={{ backgroundColor: colors.background }} contentContainerStyle={styles.content}>
      {GROUPS.map((group) => (
        <View key={group.title}>
          <SectionHeader title={group.title} />
          <Card style={styles.group}>
            {group.items.map(({ label, description, icon: Icon, href }, index) => (
              <Pressable
                key={label}
                accessibilityRole="button"
                accessibilityLabel={label}
                accessibilityHint={description}
                onPress={() => router.push(href as Href)}
                style={({ pressed }) => [
                  styles.row,
                  index > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border },
                  pressed && { backgroundColor: colors.surfaceAlt },
                ]}>
                <View style={[styles.iconWell, { backgroundColor: colors.accentSoft }]}>
                  <Icon size={20} color={colors.accent} />
                </View>
                <View style={styles.text}>
                  <Text style={[styles.label, { color: colors.text }]}>{label}</Text>
                  <Text style={[styles.description, { color: colors.textMuted }]}>{description}</Text>
                </View>
                <ChevronRight size={18} color={colors.textMuted} />
              </Pressable>
            ))}
          </Card>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.xl,
  },
  group: {
    padding: 0,
    overflow: 'hidden',
    marginBottom: SPACING.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    minHeight: TOUCH_TARGET + 16,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  iconWell: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    flex: 1,
  },
  label: {
    ...TYPE.subheading,
  },
  description: {
    ...TYPE.bodySmall,
    marginTop: 2,
  },
});

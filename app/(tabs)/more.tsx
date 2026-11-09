import { router, type Href } from 'expo-router';
import { BellRing, Calculator, ChevronRight, ListChecks, Settings, type LucideIcon } from 'lucide-react-native';
import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { RADIUS, SPACING } from '@/constants/appConfig';
import { useTheme } from '@/hooks/useTheme';

interface MenuItem {
  label: string;
  description: string;
  icon: LucideIcon;
  href: string | null;
}

// PRD Section 5.1: More holds Reminders & Tasks, Calculator, and Settings.
const ITEMS: MenuItem[] = [
  { label: 'Calculator', description: 'Everyday arithmetic with history', icon: Calculator, href: '/calculator' },
  { label: 'Reminders', description: 'Coming in Phase 5', icon: BellRing, href: '/reminders' },
  { label: 'Tasks', description: 'Coming in Phase 5', icon: ListChecks, href: '/tasks' },
  { label: 'Settings', description: 'Coming in a later phase', icon: Settings, href: null },
];

export default function MoreScreen() {
  const { colors } = useTheme();

  return (
    <ScrollView style={{ backgroundColor: colors.background }} contentContainerStyle={styles.content}>
      {ITEMS.map(({ label, description, icon: Icon, href }) => {
        const enabled = href !== null;
        return (
          <Pressable
            key={label}
            accessibilityRole="button"
            accessibilityLabel={label}
            accessibilityHint={description}
            accessibilityState={{ disabled: !enabled }}
            disabled={!enabled}
            onPress={() => href && router.push(href as Href)}
            style={({ pressed }) => [
              styles.row,
              {
                backgroundColor: pressed ? colors.surfaceAlt : colors.surface,
                borderColor: colors.border,
                opacity: enabled ? 1 : 0.55,
              },
            ]}>
            <View style={[styles.iconWrap, { backgroundColor: colors.surfaceAlt }]}>
              <Icon size={20} color={colors.accent} />
            </View>
            <View style={styles.text}>
              <Text style={[styles.label, { color: colors.text }]}>{label}</Text>
              <Text style={[styles.description, { color: colors.textMuted }]}>{description}</Text>
            </View>
            {enabled ? <ChevronRight size={18} color={colors.textMuted} /> : null}
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: SPACING.lg,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    borderWidth: 1,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
  },
  iconWrap: {
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
    fontSize: 15,
    fontWeight: '700',
  },
  description: {
    fontSize: 12.5,
    marginTop: 2,
  },
});

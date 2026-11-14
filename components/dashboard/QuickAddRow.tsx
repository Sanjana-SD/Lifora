import { router, type Href } from 'expo-router';
import { BellPlus, CalendarPlus, FilePlus, FileUp, ListPlus, type LucideIcon } from 'lucide-react-native';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { RADIUS, SPACING, TYPE } from '@/constants/appConfig';
import { useTheme } from '@/hooks/useTheme';

interface QuickAction {
  key: string;
  label: string;
  accessibilityLabel: string;
  icon: LucideIcon;
  href: Href;
}

// Cast as Href: expo-router's typed-routes union is only regenerated
// when the dev server starts (not on `expo export` or `tsc`), so
// relying on the literal union here makes typechecking depend on
// dev-server state. These paths are verified against app/ directly
// in tests/components/dashboard/QuickAddRow.test.tsx instead.
// Finance is fed by bank statements, so its quick action imports one.
const ITEMS: QuickAction[] = [
  { key: 'event', label: 'Event', accessibilityLabel: 'Add Event', icon: CalendarPlus, href: '/calendar/add-event' as Href },
  { key: 'task', label: 'Task', accessibilityLabel: 'Add Task', icon: ListPlus, href: '/tasks/add-task' as Href },
  { key: 'reminder', label: 'Reminder', accessibilityLabel: 'Add Reminder', icon: BellPlus, href: '/reminders/add-reminder' as Href },
  { key: 'statement', label: 'Statement', accessibilityLabel: 'Import bank statement', icon: FileUp, href: '/finance/import' as Href },
  { key: 'note', label: 'Note', accessibilityLabel: 'Add Note', icon: FilePlus, href: '/notes/create-note' as Href },
];

export function QuickAddRow() {
  const { colors } = useTheme();

  return (
    <View style={styles.row}>
      {ITEMS.map(({ key, label, accessibilityLabel, icon: Icon, href }) => (
        <Pressable
          key={key}
          onPress={() => router.push(href)}
          accessibilityRole="button"
          accessibilityLabel={accessibilityLabel}
          style={styles.item}>
          {({ pressed }) => (
            <>
              <View style={[styles.tile, { backgroundColor: pressed ? colors.accent : colors.accentSoft }]}>
                <Icon size={22} color={pressed ? colors.surface : colors.accent} />
              </View>
              <Text style={[styles.label, { color: colors.text }]} numberOfLines={1}>
                {label}
              </Text>
            </>
          )}
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.lg,
  },
  item: {
    alignItems: 'center',
    flex: 1,
  },
  tile: {
    width: 56,
    height: 56,
    borderRadius: RADIUS.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    ...TYPE.caption,
    marginTop: SPACING.xs + 2,
  },
});

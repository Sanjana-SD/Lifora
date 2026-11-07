import { router } from 'expo-router';
import { BellPlus, CalendarPlus, FilePlus, ListPlus, WalletCards, type LucideIcon } from 'lucide-react-native';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { RADIUS, SPACING } from '@/constants/appConfig';
import { useTheme } from '@/hooks/useTheme';

interface QuickAddItem {
  key: string;
  label: string;
  icon: LucideIcon;
  href: Parameters<typeof router.push>[0];
}

const ITEMS: QuickAddItem[] = [
  { key: 'event', label: 'Event', icon: CalendarPlus, href: '/calendar/add-event' },
  { key: 'task', label: 'Task', icon: ListPlus, href: '/tasks/add-task' },
  { key: 'reminder', label: 'Reminder', icon: BellPlus, href: '/reminders/add-reminder' },
  { key: 'expense', label: 'Expense', icon: WalletCards, href: '/finance/add-transaction' },
  { key: 'note', label: 'Note', icon: FilePlus, href: '/notes/create-note' },
];

export function QuickAddRow() {
  const { colors } = useTheme();

  return (
    <View style={styles.row}>
      {ITEMS.map(({ key, label, icon: Icon, href }) => (
        <Pressable
          key={key}
          onPress={() => router.push(href)}
          accessibilityRole="button"
          accessibilityLabel={`Add ${label}`}
          style={styles.item}>
          <View style={[styles.iconCircle, { backgroundColor: colors.surfaceAlt, borderColor: colors.border }]}>
            <Icon size={20} color={colors.accent} />
          </View>
          <Text style={[styles.label, { color: colors.textMuted }]}>{label}</Text>
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
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: 11,
    marginTop: SPACING.xs,
    fontWeight: '600',
  },
});

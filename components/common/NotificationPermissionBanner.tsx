import { BellOff } from 'lucide-react-native';
import React from 'react';
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';

import { RADIUS, SPACING } from '@/constants/appConfig';
import { useNotificationPermission } from '@/hooks/useNotificationPermission';
import { useTheme } from '@/hooks/useTheme';

/**
 * Non-blocking explanation shown when alerts can't fire (PRD 3.C): items
 * still save; only the notification is missing.
 */
export function NotificationPermissionBanner() {
  const { colors } = useTheme();
  const state = useNotificationPermission();
  if (state !== 'denied') return null;

  return (
    <View
      accessibilityRole="alert"
      style={[styles.banner, { backgroundColor: colors.dangerSurface, borderColor: colors.danger }]}>
      <BellOff size={18} color={colors.danger} />
      <View style={styles.text}>
        <Text style={[styles.title, { color: colors.text }]}>Notifications are off</Text>
        <Text style={[styles.body, { color: colors.textMuted }]}>
          Your items are saved, but LIFORA can&apos;t alert you until notifications are allowed.
        </Text>
        <Pressable accessibilityRole="button" onPress={() => Linking.openSettings()} hitSlop={6}>
          <Text style={[styles.link, { color: colors.accent }]}>Open settings</Text>
        </Pressable>
      </View>
    </View>
  );
}

/** Honest note about Android delivery timing (PRD 3.C, Section 16). */
export function DeliveryNote() {
  const { colors } = useTheme();
  return (
    <Text style={[styles.note, { color: colors.textMuted }]}>
      Alerts may arrive a few minutes late when your phone is saving battery. This is how Android schedules them.
    </Text>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    gap: SPACING.md,
    borderWidth: 1,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  text: {
    flex: 1,
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
  },
  body: {
    fontSize: 12.5,
    lineHeight: 17,
    marginTop: 2,
  },
  link: {
    fontSize: 13,
    fontWeight: '700',
    marginTop: SPACING.xs,
  },
  note: {
    fontSize: 11.5,
    lineHeight: 16,
    marginTop: SPACING.md,
  },
});

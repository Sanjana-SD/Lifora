import { AlarmClockOff, BellOff } from 'lucide-react-native';
import React from 'react';
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';

import { RADIUS, SPACING, TYPE } from '@/constants/appConfig';
import { useNotificationAccess } from '@/hooks/useNotificationPermission';
import { useTheme } from '@/hooks/useTheme';
import { requestExactAlarms } from '@/services/notificationService';

/**
 * Non-blocking explanation shown when alerts can't fire, or can't fire on
 * time (PRD 3.C): items still save; only the alert is affected.
 */
export function NotificationPermissionBanner() {
  const { colors } = useTheme();
  const { access, refresh } = useNotificationAccess();
  if (!access) return null;

  if (access.notifications === 'denied') {
    return (
      <Banner
        icon={<BellOff size={18} color={colors.danger} />}
        tone="danger"
        title="Notifications are off"
        body="Your items are saved, but LIFORA can't alert you until notifications are allowed."
        action="Open settings"
        onAction={() => Linking.openSettings()}
      />
    );
  }

  if (access.notifications === 'granted' && access.exactAlarms === 'denied') {
    return (
      <Banner
        icon={<AlarmClockOff size={18} color={colors.warning} />}
        tone="warning"
        title="Alerts may arrive late"
        body='Allow "Alarms & reminders" so Android delivers reminders at the exact time, even when saving battery.'
        action="Allow on-time alerts"
        onAction={async () => {
          await requestExactAlarms();
          refresh();
        }}
      />
    );
  }

  return null;
}

function Banner({
  icon,
  tone,
  title,
  body,
  action,
  onAction,
}: {
  icon: React.ReactNode;
  tone: 'danger' | 'warning';
  title: string;
  body: string;
  action: string;
  onAction: () => void;
}) {
  const { colors } = useTheme();
  const edge = tone === 'danger' ? colors.danger : colors.warningFill;
  return (
    <View accessibilityRole="alert" style={[styles.banner, { backgroundColor: colors.surface, borderColor: edge }]}>
      {icon}
      <View style={styles.text}>
        <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
        <Text style={[styles.body, { color: colors.textMuted }]}>{body}</Text>
        <Pressable accessibilityRole="button" onPress={onAction} style={styles.actionButton}>
          <Text style={[styles.link, { color: colors.accent }]}>{action}</Text>
        </Pressable>
      </View>
    </View>
  );
}

/** Shown under alert pickers only while Android may still delay alerts. */
export function DeliveryNote() {
  const { colors } = useTheme();
  const { access } = useNotificationAccess();
  if (!access || access.exactAlarms !== 'denied') return null;
  return (
    <Text style={[styles.note, { color: colors.textMuted }]}>
      Alerts may arrive a few minutes late until on-time alerts are allowed.
    </Text>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    gap: SPACING.md,
    borderWidth: 1,
    borderLeftWidth: 4,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  text: {
    flex: 1,
  },
  title: {
    ...TYPE.subheading,
    fontWeight: '700',
  },
  body: {
    ...TYPE.bodySmall,
    marginTop: 2,
  },
  actionButton: {
    alignSelf: 'flex-start',
    minHeight: 40,
    justifyContent: 'center',
  },
  link: {
    ...TYPE.label,
    fontWeight: '700',
  },
  note: {
    ...TYPE.caption,
    marginTop: SPACING.sm,
  },
});

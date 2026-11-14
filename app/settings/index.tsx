import { Stack } from 'expo-router';
import { AlarmClock, Bell, Moon, ShieldCheck, Smartphone, Sun, type LucideIcon } from 'lucide-react-native';
import React, { useState } from 'react';
import { Linking, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/common/Button';
import { Card } from '@/components/common/Card';
import { SectionHeader } from '@/components/common/SectionHeader';
import { APP_NAME, APP_TAGLINE, RADIUS, SPACING, TOUCH_TARGET, TYPE } from '@/constants/appConfig';
import type { ThemePreference } from '@/constants/colors';
import { useNotificationAccess } from '@/hooks/useNotificationPermission';
import { useTheme } from '@/hooks/useTheme';
import { ensurePermission, requestExactAlarms, sendTestNotification } from '@/services/notificationService';

const APPEARANCE: { value: ThemePreference; label: string; description: string; icon: LucideIcon }[] = [
  { value: 'system', label: 'System default', description: 'Match your phone’s light or dark setting', icon: Smartphone },
  { value: 'light', label: 'Light', description: 'Ivory background, always', icon: Sun },
  { value: 'dark', label: 'Dark', description: 'Easier on the eyes at night', icon: Moon },
];

export default function SettingsScreen() {
  const { colors, preference, setPreference } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <>
      <Stack.Screen options={{ title: 'Settings' }} />
      <ScrollView
        style={{ backgroundColor: colors.background }}
        contentContainerStyle={[styles.content, { paddingBottom: SPACING.xl + insets.bottom }]}>
        <SectionHeader title="Appearance" />
        <Card style={styles.group}>
          <View accessibilityRole="radiogroup" accessibilityLabel="Appearance">
            {APPEARANCE.map(({ value, label, description, icon: Icon }, index) => {
              const selected = preference === value;
              return (
                <Pressable
                  key={value}
                  accessibilityRole="radio"
                  accessibilityLabel={label}
                  accessibilityHint={description}
                  accessibilityState={{ checked: selected }}
                  onPress={() => setPreference(value)}
                  style={({ pressed }) => [
                    styles.option,
                    index > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border },
                    pressed && { backgroundColor: colors.surfaceAlt },
                  ]}>
                  <View style={[styles.iconWell, { backgroundColor: colors.accentSoft }]}>
                    <Icon size={18} color={colors.accent} />
                  </View>
                  <View style={styles.optionText}>
                    <Text style={[styles.optionLabel, { color: colors.text }]}>{label}</Text>
                    <Text style={[styles.optionDescription, { color: colors.textMuted }]}>{description}</Text>
                  </View>
                  <View style={[styles.radio, { borderColor: selected ? colors.accent : colors.borderStrong }]}>
                    {selected ? <View style={[styles.radioDot, { backgroundColor: colors.accent }]} /> : null}
                  </View>
                </Pressable>
              );
            })}
          </View>
        </Card>

        {Platform.OS !== 'web' ? <NotificationSettings /> : null}

        <SectionHeader title="About" />
        <Card style={styles.about}>
          <Text style={[styles.appName, { color: colors.accent }]}>{APP_NAME}</Text>
          <Text style={[styles.optionDescription, { color: colors.textMuted }]}>{APP_TAGLINE}</Text>
          <View style={styles.privacy}>
            <ShieldCheck size={18} color={colors.success} />
            <Text style={[styles.privacyText, { color: colors.text }]}>
              Everything you add stays on this device: no account, no cloud sync. Statements and documents are read on
              the phone. Only your approximate location is sent to Open-Meteo to fetch the weather.
            </Text>
          </View>
        </Card>
      </ScrollView>
    </>
  );
}

function NotificationSettings() {
  const { colors } = useTheme();
  const { access, refresh } = useNotificationAccess();
  const [testState, setTestState] = useState<string | null>(null);
  if (!access) return null;

  const notificationsOn = access.notifications === 'granted';
  const rows = [
    {
      key: 'notifications',
      icon: Bell,
      label: 'Notifications',
      status: notificationsOn ? 'Allowed' : 'Off',
      ok: notificationsOn,
      action: notificationsOn ? null : access.notifications === 'denied' ? 'Open settings' : 'Allow',
      onAction: async () => {
        if (access.notifications === 'denied') await Linking.openSettings();
        else await ensurePermission();
        refresh();
      },
    },
    ...(access.exactAlarms === 'unsupported'
      ? []
      : [
          {
            key: 'exact',
            icon: AlarmClock,
            label: 'On-time alerts',
            status: access.exactAlarms === 'granted' ? 'On: alerts fire at the exact minute' : 'Off: Android may delay alerts',
            ok: access.exactAlarms === 'granted',
            action: access.exactAlarms === 'granted' ? null : 'Allow',
            onAction: async () => {
              await requestExactAlarms();
              refresh();
            },
          },
        ]),
  ];

  return (
    <>
      <SectionHeader title="Notifications" />
      <Card style={styles.group}>
        {rows.map(({ key, icon: Icon, label, status, ok, action, onAction }, index) => (
          <View
            key={key}
            style={[styles.option, index > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border }]}>
            <View style={[styles.iconWell, { backgroundColor: colors.accentSoft }]}>
              <Icon size={18} color={colors.accent} />
            </View>
            <View style={styles.optionText}>
              <Text style={[styles.optionLabel, { color: colors.text }]}>{label}</Text>
              <Text style={[styles.optionDescription, { color: ok ? colors.success : colors.warning }]}>{status}</Text>
            </View>
            {action ? <Button label={action} variant="secondary" onPress={onAction} style={styles.rowButton} /> : null}
          </View>
        ))}
      </Card>
      <Button
        label="Send a test notification"
        variant="secondary"
        icon={Bell}
        onPress={async () => {
          const result = await sendTestNotification();
          setTestState(result === 'granted' ? 'Sent. It should appear in about 5 seconds.' : 'Notifications are off, so the test could not be sent.');
          refresh();
        }}
      />
      {testState ? <Text style={[styles.testNote, { color: colors.textMuted }]}>{testState}</Text> : null}
      <View style={styles.sectionGap} />
    </>
  );
}

const styles = StyleSheet.create({
  rowButton: {
    paddingHorizontal: SPACING.md,
  },
  testNote: {
    ...TYPE.caption,
    marginTop: SPACING.sm,
    textAlign: 'center',
  },
  sectionGap: {
    height: SPACING.md,
  },
  content: {
    padding: SPACING.lg,
  },
  group: {
    padding: 0,
    overflow: 'hidden',
    marginBottom: SPACING.lg,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    minHeight: TOUCH_TARGET + 16,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  iconWell: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionText: {
    flex: 1,
  },
  optionLabel: {
    ...TYPE.subheading,
  },
  optionDescription: {
    ...TYPE.bodySmall,
    marginTop: 2,
  },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  about: {
    gap: SPACING.xs,
  },
  appName: {
    ...TYPE.heading,
    letterSpacing: 1.5,
  },
  privacy: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginTop: SPACING.sm,
  },
  privacyText: {
    ...TYPE.bodySmall,
    flex: 1,
  },
});

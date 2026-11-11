import { Stack } from 'expo-router';
import { Moon, ShieldCheck, Smartphone, Sun, type LucideIcon } from 'lucide-react-native';
import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Card } from '@/components/common/Card';
import { SectionHeader } from '@/components/common/SectionHeader';
import { APP_NAME, APP_TAGLINE, RADIUS, SPACING, TOUCH_TARGET, TYPE } from '@/constants/appConfig';
import type { ThemePreference } from '@/constants/colors';
import { useTheme } from '@/hooks/useTheme';

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

        <SectionHeader title="About" />
        <Card style={styles.about}>
          <Text style={[styles.appName, { color: colors.accent }]}>{APP_NAME}</Text>
          <Text style={[styles.optionDescription, { color: colors.textMuted }]}>{APP_TAGLINE}</Text>
          <View style={styles.privacy}>
            <ShieldCheck size={18} color={colors.success} />
            <Text style={[styles.privacyText, { color: colors.text }]}>
              Everything you add stays on this device. No account, no cloud sync.
            </Text>
          </View>
        </Card>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
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

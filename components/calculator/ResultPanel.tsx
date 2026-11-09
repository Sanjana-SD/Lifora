import * as Clipboard from 'expo-clipboard';
import { Check, Copy, History } from 'lucide-react-native';
import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Card } from '@/components/common/Card';
import { RADIUS, SPACING } from '@/constants/appConfig';
import { useTheme } from '@/hooks/useTheme';

export interface ResultRow {
  label: string;
  value: string;
  emphasis?: boolean;
}

interface ResultPanelProps {
  primaryLabel: string;
  primaryValue: string;
  rows?: ResultRow[];
  copyValue: string;
  onSave: () => Promise<void>;
  children?: React.ReactNode;
}

export function ResultPanel({ primaryLabel, primaryValue, rows = [], copyValue, onSave, children }: ResultPanelProps) {
  const { colors } = useTheme();
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState<string | null>(null);

  const copy = async () => {
    await Clipboard.setStringAsync(copyValue);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const save = async () => {
    try {
      await onSave();
      setSaved(primaryValue);
    } catch {
      setSaved(null);
    }
  };

  const alreadySaved = saved === primaryValue;

  return (
    <Card style={styles.card}>
      <Text style={[styles.primaryLabel, { color: colors.textMuted }]}>{primaryLabel}</Text>
      <Text
        style={[styles.primaryValue, { color: colors.accent }]}
        accessibilityLabel={`${primaryLabel}: ${primaryValue}`}
        adjustsFontSizeToFit
        numberOfLines={1}>
        {primaryValue}
      </Text>
      {rows.map((row) => (
        <View key={row.label} style={[styles.row, { borderColor: colors.border }]}>
          <Text style={[styles.rowLabel, { color: colors.textMuted }]}>{row.label}</Text>
          <Text style={[styles.rowValue, { color: colors.text, fontWeight: row.emphasis ? '700' : '600' }]}>
            {row.value}
          </Text>
        </View>
      ))}
      {children}
      <View style={styles.actions}>
        <ActionButton
          label={copied ? 'Copied' : 'Copy'}
          accessibilityLabel={`Copy ${primaryLabel}`}
          onPress={copy}
          icon={copied ? <Check size={16} color={colors.accent} /> : <Copy size={16} color={colors.accent} />}
        />
        <ActionButton
          label={alreadySaved ? 'Saved' : 'Save to history'}
          accessibilityLabel="Save to history"
          onPress={save}
          disabled={alreadySaved}
          icon={alreadySaved ? <Check size={16} color={colors.accent} /> : <History size={16} color={colors.accent} />}
        />
      </View>
    </Card>
  );
}

function ActionButton({
  label,
  accessibilityLabel,
  onPress,
  icon,
  disabled = false,
}: {
  label: string;
  accessibilityLabel: string;
  onPress: () => void;
  icon: React.ReactNode;
  disabled?: boolean;
}) {
  const { colors } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.action,
        { borderColor: colors.border, backgroundColor: pressed ? colors.surfaceAlt : colors.background },
      ]}>
      {icon}
      <Text style={[styles.actionLabel, { color: colors.accent }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    marginTop: SPACING.sm,
  },
  primaryLabel: {
    fontSize: 12.5,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  primaryValue: {
    fontSize: 32,
    fontWeight: '800',
    marginTop: SPACING.xs,
    marginBottom: SPACING.sm,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: SPACING.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  rowLabel: {
    fontSize: 13.5,
  },
  rowValue: {
    fontSize: 14,
  },
  actions: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginTop: SPACING.md,
  },
  action: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.xs,
    minHeight: 44,
    borderWidth: 1,
    borderRadius: RADIUS.md,
  },
  actionLabel: {
    fontSize: 13.5,
    fontWeight: '700',
  },
});

import { Delete } from 'lucide-react-native';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { RADIUS, SPACING } from '@/constants/appConfig';
import { useTheme } from '@/hooks/useTheme';
import type { CalcKey } from '@/utils/calculatorInput';

const ROWS: CalcKey[][] = [
  ['C', '⌫', '%', '÷'],
  ['7', '8', '9', '×'],
  ['4', '5', '6', '−'],
  ['1', '2', '3', '+'],
  ['0', '.', '='],
];

const LABELS: Partial<Record<CalcKey, string>> = {
  C: 'Clear',
  '⌫': 'Delete',
  '%': 'Percent',
  '÷': 'Divide',
  '×': 'Multiply',
  '−': 'Minus',
  '+': 'Plus',
  '.': 'Decimal point',
  '=': 'Equals',
};

type KeyKind = 'digit' | 'operator' | 'function' | 'equals';

function kindOf(key: CalcKey): KeyKind {
  if (key === '=') return 'equals';
  if (['÷', '×', '−', '+'].includes(key)) return 'operator';
  if (['C', '⌫', '%'].includes(key)) return 'function';
  return 'digit';
}

export function Keypad({ onPress }: { onPress: (key: CalcKey) => void }) {
  const { colors } = useTheme();

  const style: Record<KeyKind, { bg: string; pressed: string; fg: string; border: string }> = {
    digit: { bg: colors.surface, pressed: colors.surfaceAlt, fg: colors.text, border: colors.border },
    function: { bg: colors.surfaceAlt, pressed: colors.border, fg: colors.accent, border: colors.border },
    operator: { bg: colors.accentSoft, pressed: colors.border, fg: colors.accent, border: colors.accentSoft },
    equals: { bg: colors.primary, pressed: colors.primaryPressed, fg: colors.onPrimary, border: colors.primary },
  };

  return (
    <View style={styles.pad}>
      {ROWS.map((row, r) => (
        <View key={r} style={styles.row}>
          {row.map((key) => {
            const s = style[kindOf(key)];
            return (
              <Pressable
                key={key}
                accessibilityRole="button"
                accessibilityLabel={LABELS[key] ?? key}
                onPress={() => onPress(key)}
                style={({ pressed }) => [
                  styles.key,
                  key === '0' && styles.wide,
                  { backgroundColor: pressed ? s.pressed : s.bg, borderColor: s.border },
                ]}>
                {key === '⌫' ? (
                  <Delete size={26} color={s.fg} />
                ) : (
                  <Text style={[styles.keyText, { color: s.fg }, kindOf(key) !== 'digit' && styles.symbol]}>{key}</Text>
                )}
              </Pressable>
            );
          })}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  pad: {
    gap: SPACING.sm + 2,
  },
  row: {
    flexDirection: 'row',
    gap: SPACING.sm + 2,
  },
  key: {
    flex: 1,
    height: 68,
    borderRadius: RADIUS.xl,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
  wide: {
    flex: 2.12,
  },
  keyText: {
    fontSize: 28,
    fontWeight: '500',
  },
  symbol: {
    fontWeight: '700',
  },
});

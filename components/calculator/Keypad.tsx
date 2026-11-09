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

  const background: Record<KeyKind, string> = {
    digit: colors.surface,
    function: colors.surfaceAlt,
    operator: colors.surfaceAlt,
    equals: colors.accent,
  };
  const foreground: Record<KeyKind, string> = {
    digit: colors.text,
    function: colors.text,
    operator: colors.accent,
    equals: colors.onAccent,
  };

  return (
    <View style={styles.pad}>
      {ROWS.map((row, r) => (
        <View key={r} style={styles.row}>
          {row.map((key) => {
            const kind = kindOf(key);
            return (
              <Pressable
                key={key}
                accessibilityRole="button"
                accessibilityLabel={LABELS[key] ?? key}
                onPress={() => onPress(key)}
                style={({ pressed }) => [
                  styles.key,
                  key === '0' && styles.wide,
                  { backgroundColor: background[kind], borderColor: colors.border, opacity: pressed ? 0.7 : 1 },
                ]}>
                {key === '⌫' ? (
                  <Delete size={24} color={foreground[kind]} />
                ) : (
                  <Text style={[styles.keyText, { color: foreground[kind] }]}>{key}</Text>
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
    gap: SPACING.sm,
  },
  row: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  key: {
    flex: 1,
    height: 62,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  wide: {
    flex: 2.08,
  },
  keyText: {
    fontSize: 24,
    fontWeight: '600',
  },
});

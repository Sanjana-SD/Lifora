import * as Clipboard from 'expo-clipboard';
import { Stack, router, type Href } from 'expo-router';
import { Check, Copy, History } from 'lucide-react-native';
import React, { useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Keypad } from '@/components/calculator/Keypad';
import { RADIUS, SPACING, TOUCH_TARGET, TYPE } from '@/constants/appConfig';
import { useTheme } from '@/hooks/useTheme';
import { recordCalculation } from '@/services/calculationHistoryService';
import { INITIAL_CALC_STATE, pressKey, previewResult, type CalcKey } from '@/utils/calculatorInput';

export default function CalculatorScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [state, setState] = useState(INITIAL_CALC_STATE);
  const stateRef = useRef(state);
  const [copied, setCopied] = useState(false);

  const press = (key: CalcKey) => {
    const { state: next, evaluation } = pressKey(stateRef.current, key);
    stateRef.current = next;
    setState(next);
    setCopied(false);
    if (evaluation) {
      // History is a convenience: a failed write must never block the calculator.
      recordCalculation('basic', { expression: evaluation.expression }, `${evaluation.expression} = ${evaluation.result}`, evaluation.result).catch(
        () => {},
      );
    }
  };

  const preview = state.justEvaluated ? null : previewResult(state.expression);
  const copyable = state.justEvaluated ? state.expression : preview;

  const copy = async () => {
    if (!copyable) return;
    await Clipboard.setStringAsync(copyable.replace('−', '-'));
    setCopied(true);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingBottom: SPACING.lg + insets.bottom }]}>
      <Stack.Screen
        options={{
          title: 'Calculator',
          headerRight: () => (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Calculation history"
              onPress={() => router.push('/calculator/history' as Href)}
              hitSlop={8}
              style={styles.headerIcon}>
              <History size={22} color={colors.accent} />
            </Pressable>
          ),
        }}
      />

      <View style={[styles.display, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Text
          accessibilityLabel="Expression"
          style={[
            styles.expression,
            { color: state.justEvaluated ? colors.accent : colors.text },
          ]}
          adjustsFontSizeToFit
          numberOfLines={2}>
          {state.expression || '0'}
        </Text>
        <View style={styles.secondaryRow}>
          {copyable ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Copy result"
              onPress={copy}
              hitSlop={8}
              style={({ pressed }) => [
                styles.copy,
                { backgroundColor: copied || pressed ? colors.accentSoft : colors.surfaceAlt },
              ]}>
              {copied ? <Check size={16} color={colors.accent} /> : <Copy size={16} color={colors.accent} />}
              <Text style={[styles.copyText, { color: colors.accent }]}>
                {copied ? 'Copied' : 'Copy'}
              </Text>
            </Pressable>
          ) : (
            <View />
          )}
          <Text
            accessibilityLabel={state.error ? 'Error' : 'Preview'}
            accessibilityLiveRegion="polite"
            style={[styles.secondary, { color: state.error ? colors.danger : colors.textMuted }]}
            numberOfLines={1}>
            {state.error ?? (preview ? `= ${preview}` : '')}
          </Text>
        </View>
      </View>

      <Keypad onPress={press} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: SPACING.lg,
  },
  headerIcon: {
    padding: SPACING.sm,
  },
  // A flexible display card above a fixed keypad keeps the keys in thumb reach on tall phones.
  display: {
    flex: 1,
    justifyContent: 'flex-end',
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: RADIUS.xl,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    marginBottom: SPACING.lg,
  },
  expression: {
    fontSize: 56,
    lineHeight: 64,
    fontWeight: '600',
    textAlign: 'right',
    fontVariant: ['tabular-nums'],
  },
  secondaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: SPACING.sm,
    minHeight: TOUCH_TARGET,
    marginTop: SPACING.xs,
  },
  secondary: {
    flex: 1,
    fontSize: 22,
    textAlign: 'right',
    fontVariant: ['tabular-nums'],
  },
  copy: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    minHeight: 36,
    paddingHorizontal: SPACING.md,
    borderRadius: RADIUS.pill,
  },
  copyText: {
    ...TYPE.label,
  },
});

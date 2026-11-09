import * as Clipboard from 'expo-clipboard';
import { Stack, router, type Href } from 'expo-router';
import { Check, Copy, History } from 'lucide-react-native';
import React, { useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Keypad } from '@/components/calculator/Keypad';
import { SPACING } from '@/constants/appConfig';
import { useTheme } from '@/hooks/useTheme';
import { recordCalculation } from '@/services/calculationHistoryService';
import { INITIAL_CALC_STATE, pressKey, previewResult, type CalcKey } from '@/utils/calculatorInput';

export default function CalculatorScreen() {
  const { colors } = useTheme();
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
    <View style={[styles.container, { backgroundColor: colors.background }]}>
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
              <History size={22} color={colors.text} />
            </Pressable>
          ),
        }}
      />

      <View style={styles.display}>
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
              style={styles.copy}>
              {copied ? <Check size={16} color={colors.accent} /> : <Copy size={16} color={colors.textMuted} />}
              <Text style={[styles.copyText, { color: copied ? colors.accent : colors.textMuted }]}>
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
  display: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingVertical: SPACING.lg,
  },
  expression: {
    fontSize: 44,
    fontWeight: '600',
    textAlign: 'right',
  },
  secondaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 28,
    marginTop: SPACING.xs,
  },
  secondary: {
    flex: 1,
    fontSize: 20,
    textAlign: 'right',
  },
  copy: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  copyText: {
    fontSize: 13,
    fontWeight: '600',
  },
});

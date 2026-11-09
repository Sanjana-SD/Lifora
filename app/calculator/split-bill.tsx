import { Stack } from 'expo-router';
import { Minus, Plus } from 'lucide-react-native';
import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { NumberField } from '@/components/calculator/NumberField';
import { ResultPanel } from '@/components/calculator/ResultPanel';
import { Card } from '@/components/common/Card';
import { Chip } from '@/components/common/Chip';
import { SegmentedControl } from '@/components/common/SegmentedControl';
import { RADIUS, SPACING } from '@/constants/appConfig';
import { useTheme } from '@/hooks/useTheme';
import { recordCalculation } from '@/services/calculationHistoryService';
import {
  formatBasisPoints,
  formatPaise,
  paiseToPlainString,
  parseField,
  parseRupeesToPaise,
} from '@/utils/currencyUtils';
import { MAX_SPLIT_PEOPLE, customSplitStatus, splitEqually } from '@/utils/financialCalculators';

type Mode = 'equal' | 'custom';
const MODES = [
  { value: 'equal', label: 'Split equally' },
  { value: 'custom', label: 'Custom amounts' },
] as const;
const TIP_OPTIONS_BP = [0, 500, 1000, 1500];

/** "1 person pays ₹333.34 · 2 pay ₹333.33" */
function describeShares(shares: number[]): string {
  const counts = new Map<number, number>();
  for (const s of shares) counts.set(s, (counts.get(s) ?? 0) + 1);
  return [...counts.entries()]
    .sort((a, b) => b[0] - a[0])
    .map(([amount, n]) => `${n} ${n === 1 ? 'person pays' : 'pay'} ${formatPaise(amount)}`)
    .join(' · ');
}

export default function SplitBillScreen() {
  const { colors } = useTheme();
  const [totalText, setTotalText] = useState('');
  const [tipBp, setTipBp] = useState(0);
  const [people, setPeople] = useState(2);
  const [mode, setMode] = useState<Mode>('equal');
  const [customTexts, setCustomTexts] = useState<string[]>([]);

  const total = parseField(totalText, parseRupeesToPaise);
  const totalError = total.value === 0 ? 'Enter a bill amount greater than zero.' : total.error;
  const split = total.value && !totalError ? splitEqually(total.value, people, tipBp) : null;

  const customFields = Array.from({ length: people }, (_, i) => parseField(customTexts[i] ?? '', parseRupeesToPaise));
  const customAmounts = customFields.map((f) => f.value ?? 0);
  const customStatus = split ? customSplitStatus(split.grandTotalPaise, customAmounts) : null;
  const customValid = customFields.every((f) => f.error === null && f.value !== null);

  const changePeople = (delta: number) => setPeople((p) => Math.min(MAX_SPLIT_PEOPLE, Math.max(1, p + delta)));
  const setCustom = (index: number, text: string) =>
    setCustomTexts((prev) => {
      const next = [...prev];
      next[index] = text;
      return next;
    });

  const saveEqual = async () => {
    if (!split || !total.value) return;
    await recordCalculation(
      'split_bill',
      { totalPaise: total.value, tipBp, people, mode: 'equal', sharesPaise: split.sharesPaise },
      `${formatPaise(split.grandTotalPaise)} split ${people} ways: ${describeShares(split.sharesPaise)}`,
      paiseToPlainString(split.sharesPaise[0]),
    );
  };

  const saveCustom = async () => {
    if (!split || !total.value) return;
    await recordCalculation(
      'split_bill',
      { totalPaise: total.value, tipBp, people, mode: 'custom', sharesPaise: customAmounts },
      `${formatPaise(split.grandTotalPaise)} split ${people} ways: ${customAmounts.map((a, i) => `P${i + 1} ${formatPaise(a)}`).join(', ')}`,
      paiseToPlainString(split.grandTotalPaise),
    );
  };

  const rows = split
    ? [
        { label: 'Bill', value: formatPaise(total.value ?? 0) },
        ...(split.tipPaise > 0 ? [{ label: `Tip (${formatBasisPoints(tipBp)})`, value: formatPaise(split.tipPaise) }] : []),
        { label: 'Grand total', value: formatPaise(split.grandTotalPaise), emphasis: true },
      ]
    : [];

  return (
    <ScrollView
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled">
      <Stack.Screen options={{ title: 'Split Bill' }} />
      <NumberField
        label="Total bill"
        prefix="₹"
        value={totalText}
        onChangeText={setTotalText}
        placeholder="1,000"
        error={totalError}
      />

      <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>Tip</Text>
      <View style={styles.chips}>
        {TIP_OPTIONS_BP.map((bp) => (
          <Chip key={bp} label={bp === 0 ? 'No tip' : formatBasisPoints(bp)} selected={tipBp === bp} onPress={() => setTipBp(bp)} />
        ))}
      </View>

      <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>People</Text>
      <View style={[styles.stepper, { borderColor: colors.border }]}>
        <StepButton label="Fewer people" disabled={people <= 1} onPress={() => changePeople(-1)}>
          <Minus size={20} color={people <= 1 ? colors.textMuted : colors.accent} />
        </StepButton>
        <Text style={[styles.count, { color: colors.text }]} accessibilityLabel={`${people} ${people === 1 ? 'person' : 'people'}`}>
          {people}
        </Text>
        <StepButton label="More people" disabled={people >= MAX_SPLIT_PEOPLE} onPress={() => changePeople(1)}>
          <Plus size={20} color={people >= MAX_SPLIT_PEOPLE ? colors.textMuted : colors.accent} />
        </StepButton>
      </View>

      <View style={styles.mode}>
        <SegmentedControl options={MODES} value={mode} onChange={setMode} />
      </View>

      {!split ? (
        <Text style={[styles.hint, { color: colors.textMuted }]}>Enter the bill amount to split it.</Text>
      ) : mode === 'equal' ? (
        <ResultPanel
          primaryLabel={people === 1 ? 'You pay' : 'Each pays'}
          primaryValue={formatPaise(split.sharesPaise[0])}
          copyValue={paiseToPlainString(split.sharesPaise[0])}
          onSave={saveEqual}
          rows={rows}>
          {new Set(split.sharesPaise).size > 1 ? (
            <Text style={[styles.note, { color: colors.textMuted }]}>
              {describeShares(split.sharesPaise)} — the extra paise go to the first {split.sharesPaise.filter((s) => s === split.sharesPaise[0]).length === 1 ? 'person' : 'people'} so the total adds up exactly.
            </Text>
          ) : null}
        </ResultPanel>
      ) : (
        <>
          {Array.from({ length: people }, (_, i) => (
            <NumberField
              key={i}
              label={`Person ${i + 1}`}
              prefix="₹"
              value={customTexts[i] ?? ''}
              onChangeText={(t) => setCustom(i, t)}
              placeholder={paiseToPlainString(split.sharesPaise[i])}
              error={customFields[i].error}
            />
          ))}
          {customStatus && customValid && customStatus.remainingPaise === 0 ? (
            <ResultPanel
              primaryLabel="Balanced"
              primaryValue={formatPaise(split.grandTotalPaise)}
              copyValue={paiseToPlainString(split.grandTotalPaise)}
              onSave={saveCustom}
              rows={rows}
            />
          ) : customStatus ? (
            <Card style={styles.statusCard}>
              <Text style={[styles.statusLabel, { color: colors.textMuted }]}>
                Assigned {formatPaise(customStatus.assignedPaise)} of {formatPaise(split.grandTotalPaise)}
              </Text>
              <Text
                accessibilityLiveRegion="polite"
                style={[styles.statusValue, { color: customStatus.remainingPaise < 0 ? colors.danger : colors.warning }]}>
                {customStatus.remainingPaise < 0
                  ? `Over by ${formatPaise(-customStatus.remainingPaise)}`
                  : `${formatPaise(customStatus.remainingPaise)} left to assign`}
              </Text>
            </Card>
          ) : null}
        </>
      )}
    </ScrollView>
  );
}

function StepButton({
  label,
  disabled,
  onPress,
  children,
}: {
  label: string;
  disabled: boolean;
  onPress: () => void;
  children: React.ReactNode;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      hitSlop={6}
      style={styles.stepButton}>
      {children}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: SPACING.lg,
    paddingBottom: SPACING.xxl,
  },
  sectionLabel: {
    fontSize: 12.5,
    fontWeight: '600',
    marginBottom: SPACING.sm,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    rowGap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: RADIUS.md,
    marginBottom: SPACING.md,
  },
  stepButton: {
    width: 52,
    height: 46,
    alignItems: 'center',
    justifyContent: 'center',
  },
  count: {
    fontSize: 18,
    fontWeight: '700',
  },
  mode: {
    marginBottom: SPACING.md,
  },
  hint: {
    fontSize: 13.5,
    lineHeight: 19,
    marginTop: SPACING.sm,
  },
  note: {
    fontSize: 12,
    lineHeight: 17,
    marginTop: SPACING.sm,
  },
  statusCard: {
    marginTop: SPACING.sm,
  },
  statusLabel: {
    fontSize: 13,
  },
  statusValue: {
    fontSize: 18,
    fontWeight: '700',
    marginTop: SPACING.xs,
  },
});

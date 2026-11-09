import { Stack } from 'expo-router';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { NumberField } from '@/components/calculator/NumberField';
import { ResultPanel } from '@/components/calculator/ResultPanel';
import { Chip } from '@/components/common/Chip';
import { SegmentedControl } from '@/components/common/SegmentedControl';
import { SPACING } from '@/constants/appConfig';
import { useTheme } from '@/hooks/useTheme';
import { recordCalculation } from '@/services/calculationHistoryService';
import {
  formatBasisPoints,
  formatPaise,
  paiseToPlainString,
  parseField,
  parsePercentToBasisPoints,
  parseRupeesToPaise,
} from '@/utils/currencyUtils';
import { calculateGst, type GstMode } from '@/utils/financialCalculators';

// Preset slabs from PRD Module 6.B. "Custom" covers any other rate.
const PRESET_RATES_BP = [500, 1200, 1800, 2800];
const MODES = [
  { value: 'add', label: 'Add GST' },
  { value: 'remove', label: 'Remove GST' },
] as const;

const halfRateLabel = (rateBp: number) => (rateBp % 2 === 0 ? formatBasisPoints(rateBp / 2) : 'half');

export default function GstCalculatorScreen() {
  const { colors } = useTheme();
  const [amountText, setAmountText] = useState('');
  const [mode, setMode] = useState<GstMode>('add');
  const [presetBp, setPresetBp] = useState<number | 'custom'>(1800);
  const [customText, setCustomText] = useState('');

  const amount = parseField(amountText, parseRupeesToPaise);
  const custom = parseField(customText, (t) => parsePercentToBasisPoints(t, 100));
  const rateBp = presetBp === 'custom' ? custom.value : presetBp;

  const result = amount.value !== null && rateBp !== null ? calculateGst(amount.value, rateBp, mode) : null;

  const save = async () => {
    if (!result || amount.value === null || rateBp === null) return;
    const action = mode === 'add' ? 'added to' : 'removed from';
    await recordCalculation(
      'gst',
      { amountPaise: amount.value, rateBp, mode },
      `GST ${formatBasisPoints(rateBp)} ${action} ${formatPaise(amount.value)}: base ${formatPaise(result.basePaise)}, GST ${formatPaise(result.gstPaise)}, total ${formatPaise(result.totalPaise)}`,
      paiseToPlainString(mode === 'add' ? result.totalPaise : result.basePaise),
    );
  };

  return (
    <ScrollView
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled">
      <Stack.Screen options={{ title: 'GST Calculator' }} />
      <View style={styles.mode}>
        <SegmentedControl options={MODES} value={mode} onChange={setMode} />
      </View>
      <NumberField
        label={mode === 'add' ? 'Amount (before GST)' : 'Amount (including GST)'}
        prefix="₹"
        value={amountText}
        onChangeText={setAmountText}
        placeholder="1,000"
        error={amount.error}
      />

      <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>GST rate</Text>
      <View style={styles.rates}>
        {PRESET_RATES_BP.map((bp) => (
          <Chip key={bp} label={formatBasisPoints(bp)} selected={presetBp === bp} onPress={() => setPresetBp(bp)} />
        ))}
        <Chip label="Custom" selected={presetBp === 'custom'} onPress={() => setPresetBp('custom')} />
      </View>
      {presetBp === 'custom' ? (
        <NumberField
          label="Custom rate"
          suffix="%"
          value={customText}
          onChangeText={setCustomText}
          placeholder="3"
          error={custom.error}
        />
      ) : null}

      {result && rateBp !== null ? (
        <ResultPanel
          primaryLabel={mode === 'add' ? 'Total with GST' : 'Amount before GST'}
          primaryValue={formatPaise(mode === 'add' ? result.totalPaise : result.basePaise)}
          copyValue={paiseToPlainString(mode === 'add' ? result.totalPaise : result.basePaise)}
          onSave={save}
          rows={[
            { label: 'Base amount', value: formatPaise(result.basePaise) },
            { label: `GST (${formatBasisPoints(rateBp)})`, value: formatPaise(result.gstPaise) },
            { label: `CGST (${halfRateLabel(rateBp)})`, value: formatPaise(result.cgstPaise) },
            { label: `SGST (${halfRateLabel(rateBp)})`, value: formatPaise(result.sgstPaise) },
            { label: 'Total', value: formatPaise(result.totalPaise), emphasis: true },
          ]}
        />
      ) : (
        <Text style={[styles.hint, { color: colors.textMuted }]}>Enter an amount to see the GST breakdown.</Text>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: SPACING.lg,
    paddingBottom: SPACING.xxl,
  },
  mode: {
    marginBottom: SPACING.lg,
  },
  sectionLabel: {
    fontSize: 12.5,
    fontWeight: '600',
    marginBottom: SPACING.sm,
  },
  rates: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    rowGap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  hint: {
    fontSize: 13.5,
    lineHeight: 19,
    marginTop: SPACING.md,
  },
});

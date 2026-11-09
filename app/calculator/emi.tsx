import { Stack } from 'expo-router';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { NumberField } from '@/components/calculator/NumberField';
import { ResultPanel } from '@/components/calculator/ResultPanel';
import { ProgressBar } from '@/components/common/ProgressBar';
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
  parseWholeNumber,
} from '@/utils/currencyUtils';
import { MAX_TENURE_MONTHS, calculateEmi } from '@/utils/financialCalculators';

type TenureUnit = 'years' | 'months';
const UNITS = [
  { value: 'years', label: 'Years' },
  { value: 'months', label: 'Months' },
] as const;
const MAX_RATE_PERCENT = 50;

export default function EmiCalculatorScreen() {
  const { colors } = useTheme();
  const [principalText, setPrincipalText] = useState('');
  const [rateText, setRateText] = useState('');
  const [tenureText, setTenureText] = useState('');
  const [unit, setUnit] = useState<TenureUnit>('years');

  const principal = parseField(principalText, parseRupeesToPaise);
  const principalError = principal.value === 0 ? 'Enter an amount greater than zero.' : principal.error;
  const rate = parseField(rateText, (t) => parsePercentToBasisPoints(t, MAX_RATE_PERCENT));
  const maxTenure = unit === 'years' ? MAX_TENURE_MONTHS / 12 : MAX_TENURE_MONTHS;
  const tenure = parseField(tenureText, (t) => parseWholeNumber(t, 1, maxTenure, unit));
  const months = tenure.value === null ? null : unit === 'years' ? tenure.value * 12 : tenure.value;

  const result =
    principal.value && !principalError && rate.value !== null && months !== null
      ? calculateEmi(principal.value, rate.value, months)
      : null;

  const save = async () => {
    if (!result || !principal.value || rate.value === null || months === null) return;
    await recordCalculation(
      'emi',
      { principalPaise: principal.value, annualRateBp: rate.value, months },
      `EMI ${formatPaise(result.emiPaise)}/month · ${formatPaise(principal.value)} @ ${formatBasisPoints(rate.value)} for ${months} months`,
      paiseToPlainString(result.emiPaise),
    );
  };

  const principalShare =
    result && principal.value ? Math.round((principal.value / result.totalPaymentPaise) * 100) : 0;

  return (
    <ScrollView
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled">
      <Stack.Screen options={{ title: 'EMI Calculator' }} />
      <NumberField
        label="Loan amount"
        prefix="₹"
        value={principalText}
        onChangeText={setPrincipalText}
        placeholder="5,00,000"
        error={principalError}
      />
      <NumberField
        label="Interest rate (per year)"
        suffix="%"
        value={rateText}
        onChangeText={setRateText}
        placeholder="9"
        error={rate.error}
      />
      <NumberField
        label="Loan tenure"
        suffix={unit === 'years' ? 'years' : 'months'}
        value={tenureText}
        onChangeText={setTenureText}
        placeholder={unit === 'years' ? '5' : '60'}
        integer
        error={tenure.error}
      />
      <View style={styles.unit}>
        <SegmentedControl options={UNITS} value={unit} onChange={setUnit} />
      </View>

      {result && principal.value ? (
        <ResultPanel
          primaryLabel="Monthly EMI"
          primaryValue={formatPaise(result.emiPaise)}
          copyValue={paiseToPlainString(result.emiPaise)}
          onSave={save}
          rows={[
            { label: 'Principal', value: formatPaise(principal.value) },
            { label: 'Total interest', value: formatPaise(result.totalInterestPaise) },
            { label: 'Total payment', value: formatPaise(result.totalPaymentPaise), emphasis: true },
            { label: 'Number of EMIs', value: String(result.months) },
          ]}>
          <View style={styles.breakdown}>
            <ProgressBar percent={principalShare} />
            <Text style={[styles.breakdownText, { color: colors.textMuted }]}>
              {principalShare}% principal · {100 - principalShare}% interest
            </Text>
          </View>
        </ResultPanel>
      ) : (
        <Text style={[styles.hint, { color: colors.textMuted }]}>
          Enter the loan amount, interest rate, and tenure to see your monthly EMI.
        </Text>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: SPACING.lg,
    paddingBottom: SPACING.xxl,
  },
  unit: {
    marginBottom: SPACING.md,
  },
  hint: {
    fontSize: 13.5,
    lineHeight: 19,
    marginTop: SPACING.md,
  },
  breakdown: {
    marginTop: SPACING.md,
    gap: SPACING.xs,
  },
  breakdownText: {
    fontSize: 12,
  },
});

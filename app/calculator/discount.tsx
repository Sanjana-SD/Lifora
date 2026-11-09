import { Stack } from 'expo-router';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { NumberField } from '@/components/calculator/NumberField';
import { ResultPanel } from '@/components/calculator/ResultPanel';
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
import { calculateDiscount, type DiscountInput } from '@/utils/financialCalculators';

type Kind = DiscountInput['kind'];
const KINDS = [
  { value: 'percent', label: 'Percent off' },
  { value: 'flat', label: 'Amount off' },
] as const;

export default function DiscountCalculatorScreen() {
  const { colors } = useTheme();
  const [priceText, setPriceText] = useState('');
  const [kind, setKind] = useState<Kind>('percent');
  const [discountText, setDiscountText] = useState('');

  const price = parseField(priceText, parseRupeesToPaise);
  const priceError = price.value === 0 ? 'Enter a price greater than zero.' : price.error;
  const discount = parseField(discountText, kind === 'percent' ? (t) => parsePercentToBasisPoints(t, 100) : parseRupeesToPaise);

  let discountError = discount.error;
  if (!discountError && kind === 'flat' && discount.value !== null && price.value !== null && discount.value > price.value) {
    discountError = "The discount can't be more than the price.";
  }

  const input: DiscountInput | null =
    discount.value === null ? null : kind === 'percent' ? { kind, basisPoints: discount.value } : { kind, paise: discount.value };
  const result = price.value && !priceError && input && !discountError ? calculateDiscount(price.value, input) : null;

  const save = async () => {
    if (!result || !price.value || !input) return;
    const off = input.kind === 'percent' ? formatBasisPoints(input.basisPoints) : formatPaise(input.paise);
    await recordCalculation(
      'discount',
      { pricePaise: price.value, ...input },
      `${off} off ${formatPaise(price.value)}: pay ${formatPaise(result.finalPaise)}, save ${formatPaise(result.discountPaise)}`,
      paiseToPlainString(result.finalPaise),
    );
  };

  const changeKind = (next: Kind) => {
    setKind(next);
    setDiscountText('');
  };

  return (
    <ScrollView
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled">
      <Stack.Screen options={{ title: 'Discount Calculator' }} />
      <NumberField
        label="Original price"
        prefix="₹"
        value={priceText}
        onChangeText={setPriceText}
        placeholder="2,499"
        error={priceError}
      />
      <View style={styles.kind}>
        <SegmentedControl options={KINDS} value={kind} onChange={changeKind} />
      </View>
      <NumberField
        label={kind === 'percent' ? 'Discount' : 'Discount amount'}
        prefix={kind === 'flat' ? '₹' : undefined}
        suffix={kind === 'percent' ? '%' : undefined}
        value={discountText}
        onChangeText={setDiscountText}
        placeholder={kind === 'percent' ? '20' : '500'}
        error={discountError}
      />

      {result && price.value ? (
        <ResultPanel
          primaryLabel="Final price"
          primaryValue={formatPaise(result.finalPaise)}
          copyValue={paiseToPlainString(result.finalPaise)}
          onSave={save}
          rows={[
            { label: 'Original price', value: formatPaise(price.value) },
            { label: 'You save', value: formatPaise(result.discountPaise), emphasis: true },
          ]}
        />
      ) : (
        <Text style={[styles.hint, { color: colors.textMuted }]}>Enter a price and a discount to see what you pay.</Text>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: SPACING.lg,
    paddingBottom: SPACING.xxl,
  },
  kind: {
    marginBottom: SPACING.md,
  },
  hint: {
    fontSize: 13.5,
    lineHeight: 19,
    marginTop: SPACING.md,
  },
});

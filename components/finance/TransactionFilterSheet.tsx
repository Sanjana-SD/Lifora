import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { BottomSheet } from '@/components/common/BottomSheet';
import { Button } from '@/components/common/Button';
import { Chip } from '@/components/common/Chip';
import { FieldLabel } from '@/components/common/FormPickers';
import { SPACING } from '@/constants/appConfig';
import { PAYMENT_METHODS, PAYMENT_METHOD_LABELS, type PaymentMethod } from '@/constants/paymentMethods';
import { useCategories } from '@/hooks/useCalendar';
import { DATE_RANGE_LABELS, type DateRangePreset } from '@/services/financeService';

export interface HistoryFilters {
  range: DateRangePreset;
  categoryId: number | null;
  paymentMethod: PaymentMethod | null;
}

export const NO_FILTERS: HistoryFilters = { range: 'all', categoryId: null, paymentMethod: null };

export function activeFilterCount(f: HistoryFilters): number {
  return (f.range !== 'all' ? 1 : 0) + (f.categoryId !== null ? 1 : 0) + (f.paymentMethod !== null ? 1 : 0);
}

interface TransactionFilterSheetProps {
  visible: boolean;
  value: HistoryFilters;
  onChange: (value: HistoryFilters) => void;
  onClose: () => void;
}

/** Filters apply as they're tapped, so the list behind the sheet is always current. */
export function TransactionFilterSheet({ visible, value, onChange, onClose }: TransactionFilterSheetProps) {
  const { categories } = useCategories('finance');
  const set = (patch: Partial<HistoryFilters>) => onChange({ ...value, ...patch });

  return (
    <BottomSheet visible={visible} onClose={onClose} title="Filter transactions" maxHeight="85%">
      <ScrollView>
        <FieldLabel>Date</FieldLabel>
        <View style={styles.wrap}>
          {(Object.keys(DATE_RANGE_LABELS) as DateRangePreset[]).map((range) => (
            <Chip key={range} label={DATE_RANGE_LABELS[range]} selected={value.range === range} onPress={() => set({ range })} />
          ))}
        </View>

        <FieldLabel>Category</FieldLabel>
        <View style={styles.wrap}>
          <Chip label="Any category" selected={value.categoryId === null} onPress={() => set({ categoryId: null })} />
          {categories.map((c) => (
            <Chip key={c.id} label={c.name} selected={value.categoryId === c.id} onPress={() => set({ categoryId: c.id })} />
          ))}
        </View>

        <FieldLabel>Payment method</FieldLabel>
        <View style={styles.wrap}>
          <Chip label="Any method" selected={value.paymentMethod === null} onPress={() => set({ paymentMethod: null })} />
          {PAYMENT_METHODS.map((m) => (
            <Chip key={m} label={PAYMENT_METHOD_LABELS[m]} selected={value.paymentMethod === m} onPress={() => set({ paymentMethod: m })} />
          ))}
        </View>

        <View style={styles.actions}>
          <Button label="Clear all" variant="secondary" onPress={() => onChange(NO_FILTERS)} style={styles.action} />
          <Button label="Show results" onPress={onClose} style={styles.action} />
        </View>
      </ScrollView>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    rowGap: SPACING.md,
    marginBottom: SPACING.lg,
  },
  actions: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginTop: SPACING.sm,
  },
  action: {
    flex: 1,
  },
});

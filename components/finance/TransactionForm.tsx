import { addDays } from 'date-fns';
import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { Button } from '@/components/common/Button';
import { Chip } from '@/components/common/Chip';
import { DateTimeField } from '@/components/common/DateTimeField';
import { CategoryPicker, FieldLabel } from '@/components/common/FormPickers';
import { Input } from '@/components/common/Input';
import { KeyboardAwareScreen } from '@/components/common/KeyboardAwareScreen';
import { SegmentedControl } from '@/components/common/SegmentedControl';
import { RADIUS, SPACING, TYPE } from '@/constants/appConfig';
import { PAYMENT_METHODS, PAYMENT_METHOD_LABELS } from '@/constants/paymentMethods';
import { useCategories } from '@/hooks/useCalendar';
import { useTheme } from '@/hooks/useTheme';
import { DESCRIPTION_MAX_LENGTH, NOTE_MAX_LENGTH, suggestCategoryId } from '@/services/financeService';
import type { TransactionDraft, TransactionType } from '@/types/transaction';
import { sanitizeAmountInput } from '@/utils/money';
import { ValidationError } from '@/utils/validationUtils';

const TYPES = [
  { value: 'expense', label: 'Expense' },
  { value: 'income', label: 'Income' },
] as const;

interface TransactionFormProps {
  initial: TransactionDraft;
  submitLabel: string;
  onSubmit: (draft: TransactionDraft) => Promise<void>;
  footer?: React.ReactNode;
}

export function TransactionForm({ initial, submitLabel, onSubmit, footer }: TransactionFormProps) {
  const { colors } = useTheme();
  const { categories } = useCategories('finance');
  const [draft, setDraft] = useState<TransactionDraft>(initial);
  // Once the user picks a category, typing a description stops changing it.
  const [categoryChosen, setCategoryChosen] = useState(initial.categoryId !== null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const suggested = useMemo(
    () => suggestCategoryId(draft.description, draft.type, categories),
    [draft.description, draft.type, categories],
  );
  // While the user hasn't chosen, the category follows the description (PRD 4.D).
  const categoryId = categoryChosen ? draft.categoryId : suggested;
  const showSuggestion = !categoryChosen && suggested !== null;

  const update = (patch: Partial<TransactionDraft>) => {
    setDraft((d) => ({ ...d, ...patch }));
    setError(null);
  };

  const quickDays = useMemo(() => {
    const today = new Date();
    return [
      { label: 'Today', day: today },
      { label: 'Yesterday', day: addDays(today, -1) },
    ];
  }, []);

  const submit = async () => {
    setSaving(true);
    try {
      await onSubmit({ ...draft, categoryId });
    } catch (e) {
      setError(e instanceof ValidationError ? e.message : "Couldn't save the transaction. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const isIncome = draft.type === 'income';

  return (
    <KeyboardAwareScreen>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.block}>
          <SegmentedControl<TransactionType> options={TYPES} value={draft.type} onChange={(type) => update({ type })} />
        </View>

        <View style={[styles.amountBox, { backgroundColor: colors.surface, borderColor: colors.borderStrong }]}>
          <Text style={[styles.currency, { color: isIncome ? colors.success : colors.accent }]}>₹</Text>
          <TextInput
            accessibilityLabel="Amount"
            value={draft.amount}
            onChangeText={(text) => update({ amount: sanitizeAmountInput(text) })}
            placeholder="0"
            placeholderTextColor={colors.textMuted}
            keyboardType="decimal-pad"
            inputMode="decimal"
            autoFocus={!initial.amount}
            selectionColor={colors.accent}
            cursorColor={colors.accent}
            maxLength={14}
            style={[styles.amount, { color: colors.text }]}
          />
        </View>

        <Input
          label="Description"
          value={draft.description}
          onChangeText={(description) => update({ description })}
          placeholder={isIncome ? 'e.g. Salary, client payment' : 'e.g. Swiggy, Uber, electricity bill'}
          maxLength={DESCRIPTION_MAX_LENGTH}
        />

        <CategoryPicker
          scope="finance"
          allowNone={false}
          value={categoryId}
          hint={showSuggestion ? 'Suggested from the description. Tap another to change it.' : null}
          onChange={(id) => {
            setCategoryChosen(true);
            update({ categoryId: id });
          }}
        />

        <View style={styles.block}>
          <FieldLabel>{isIncome ? 'Received via' : 'Paid with'}</FieldLabel>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            {PAYMENT_METHODS.map((method) => (
              <Chip
                key={method}
                label={PAYMENT_METHOD_LABELS[method]}
                selected={draft.paymentMethod === method}
                onPress={() => update({ paymentMethod: method })}
              />
            ))}
          </ScrollView>
          <Text style={[styles.disclaimer, { color: colors.textMuted }]}>
            A label for your records. LIFORA doesn&apos;t connect to any payment app.
          </Text>
        </View>

        <DateTimeField
          label="Date"
          mode="date"
          value={draft.date}
          quickDays={quickDays}
          onChange={(date) => date && update({ date })}
        />

        <Input
          label="Note"
          value={draft.note}
          onChangeText={(note) => update({ note })}
          placeholder="Optional"
          multiline
          maxLength={NOTE_MAX_LENGTH}
          style={styles.multiline}
        />

        {error ? (
          <Text accessibilityRole="alert" style={[styles.error, { color: colors.danger }]}>
            {error}
          </Text>
        ) : null}
        <Button label={submitLabel} onPress={submit} loading={saving} style={styles.submit} />
        {footer}
      </ScrollView>
    </KeyboardAwareScreen>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: SPACING.lg,
    paddingBottom: SPACING.xxl,
  },
  block: {
    marginBottom: SPACING.lg,
  },
  amountBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    borderWidth: 1,
    borderRadius: RADIUS.lg,
    paddingHorizontal: SPACING.lg,
    minHeight: 76,
    marginBottom: SPACING.lg,
  },
  currency: {
    fontSize: 32,
    fontWeight: '700',
  },
  amount: {
    flex: 1,
    // Let the input shrink below its intrinsic width (web sizes it in characters).
    minWidth: 0,
    fontSize: 36,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
    paddingVertical: SPACING.sm,
  },
  disclaimer: {
    ...TYPE.caption,
    marginTop: SPACING.sm,
  },
  multiline: {
    minHeight: 70,
    textAlignVertical: 'top',
    paddingVertical: SPACING.sm,
  },
  error: {
    ...TYPE.bodySmall,
    marginTop: SPACING.md,
  },
  submit: {
    marginTop: SPACING.lg,
  },
});

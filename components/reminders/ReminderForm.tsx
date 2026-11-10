import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text } from 'react-native';

import { Button } from '@/components/common/Button';
import { DateTimeField } from '@/components/common/DateTimeField';
import { CategoryPicker, PriorityPicker } from '@/components/common/FormPickers';
import { Input } from '@/components/common/Input';
import { DeliveryNote, NotificationPermissionBanner } from '@/components/common/NotificationPermissionBanner';
import { RecurrencePicker } from '@/components/common/RecurrencePicker';
import { SPACING } from '@/constants/appConfig';
import { useTheme } from '@/hooks/useTheme';
import { ensurePermission } from '@/services/notificationService';
import { REMINDER_TITLE_MAX_LENGTH } from '@/services/reminderService';
import type { ReminderDraft } from '@/types/reminder';
import { ValidationError } from '@/utils/validationUtils';

interface ReminderFormProps {
  initial: ReminderDraft;
  submitLabel: string;
  onSubmit: (draft: ReminderDraft) => Promise<void>;
  footer?: React.ReactNode;
}

export function ReminderForm({ initial, submitLabel, onSubmit, footer }: ReminderFormProps) {
  const { colors } = useTheme();
  const [draft, setDraft] = useState<ReminderDraft>(initial);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const update = (patch: Partial<ReminderDraft>) => {
    setDraft((d) => ({ ...d, ...patch }));
    setError(null);
  };

  const submit = async () => {
    setSaving(true);
    try {
      // Reminders always alert, so this is where permission is asked for
      // in context (PRD 3.C), not at first launch.
      await ensurePermission();
      await onSubmit(draft);
    } catch (e) {
      setError(e instanceof ValidationError ? e.message : "Couldn't save the reminder. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.flex, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <NotificationPermissionBanner />
        <Input
          label="Title"
          value={draft.title}
          onChangeText={(title) => update({ title })}
          placeholder="Remind me to…"
          maxLength={REMINDER_TITLE_MAX_LENGTH}
          autoFocus={!initial.title}
        />
        <DateTimeField label="When" value={draft.dueAt} onChange={(dueAt) => dueAt && update({ dueAt })} />
        <Input
          label="Notes"
          value={draft.description}
          onChangeText={(description) => update({ description })}
          placeholder="Optional"
          multiline
          style={styles.multiline}
        />
        <CategoryPicker value={draft.categoryId} onChange={(categoryId) => update({ categoryId })} />
        <PriorityPicker value={draft.priority} onChange={(priority) => update({ priority })} />
        <RecurrencePicker
          value={draft.recurrence}
          start={draft.dueAt}
          allowCount={false}
          onChange={(recurrence) => update({ recurrence })}
        />
        <DeliveryNote />
        {error ? (
          <Text accessibilityRole="alert" style={[styles.error, { color: colors.danger }]}>
            {error}
          </Text>
        ) : null}
        <Button label={submitLabel} onPress={submit} loading={saving} style={styles.submit} />
        {footer}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  content: {
    padding: SPACING.lg,
    paddingBottom: SPACING.xxl,
  },
  multiline: {
    minHeight: 70,
    textAlignVertical: 'top',
    paddingVertical: SPACING.sm,
  },
  error: {
    fontSize: 13.5,
    marginTop: SPACING.md,
  },
  submit: {
    marginTop: SPACING.lg,
  },
});

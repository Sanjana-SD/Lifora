import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text } from 'react-native';

import { Button } from '@/components/common/Button';
import { DateTimeField } from '@/components/common/DateTimeField';
import { CategoryPicker, NotificationOffsetPicker, PriorityPicker } from '@/components/common/FormPickers';
import { Input } from '@/components/common/Input';
import { DeliveryNote, NotificationPermissionBanner } from '@/components/common/NotificationPermissionBanner';
import { RecurrencePicker } from '@/components/common/RecurrencePicker';
import { SPACING } from '@/constants/appConfig';
import { useTheme } from '@/hooks/useTheme';
import { EVENT_TITLE_MAX_LENGTH } from '@/services/calendarService';
import { ensurePermission } from '@/services/notificationService';
import type { EventDraft } from '@/types/event';
import { ValidationError } from '@/utils/validationUtils';

interface EventFormProps {
  initial: EventDraft;
  submitLabel: string;
  /** False when editing a single occurrence, which can't have its own repeat rule. */
  showRecurrence?: boolean;
  onSubmit: (draft: EventDraft) => Promise<void>;
}

export function EventForm({ initial, submitLabel, showRecurrence = true, onSubmit }: EventFormProps) {
  const { colors } = useTheme();
  const [draft, setDraft] = useState<EventDraft>(initial);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const update = (patch: Partial<EventDraft>) => {
    setDraft((d) => ({ ...d, ...patch }));
    setError(null);
  };

  // Moving the start keeps the event's length.
  const changeStart = (start: Date | null) => {
    if (!start) return;
    const duration = draft.endAt.getTime() - draft.startAt.getTime();
    update({ startAt: start, endAt: new Date(start.getTime() + Math.max(0, duration)) });
  };

  const submit = async () => {
    setSaving(true);
    try {
      if (draft.notificationOffsetMinutes !== null) await ensurePermission();
      await onSubmit(draft);
    } catch (e) {
      setError(e instanceof ValidationError ? e.message : "Couldn't save the event. Please try again.");
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
          placeholder="What's happening?"
          maxLength={EVENT_TITLE_MAX_LENGTH}
          autoFocus={!initial.title}
        />
        <DateTimeField label="Starts" value={draft.startAt} onChange={changeStart} />
        <DateTimeField label="Ends" value={draft.endAt} onChange={(endAt) => endAt && update({ endAt })} />
        <Input
          label="Location"
          value={draft.location}
          onChangeText={(location) => update({ location })}
          placeholder="Optional"
          maxLength={200}
        />
        <Input
          label="Description"
          value={draft.description}
          onChangeText={(description) => update({ description })}
          placeholder="Optional"
          multiline
          style={styles.multiline}
        />
        <CategoryPicker value={draft.categoryId} onChange={(categoryId) => update({ categoryId })} />
        <PriorityPicker value={draft.priority} onChange={(priority) => update({ priority })} />
        {showRecurrence ? (
          <RecurrencePicker value={draft.recurrence} start={draft.startAt} onChange={(recurrence) => update({ recurrence })} />
        ) : null}
        <NotificationOffsetPicker
          value={draft.notificationOffsetMinutes}
          onChange={(notificationOffsetMinutes) => update({ notificationOffsetMinutes })}
        />
        {draft.notificationOffsetMinutes !== null ? <DeliveryNote /> : null}

        {error ? (
          <Text accessibilityRole="alert" style={[styles.error, { color: colors.danger }]}>
            {error}
          </Text>
        ) : null}
        <Button label={submitLabel} onPress={submit} loading={saving} style={styles.submit} />
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
    minHeight: 80,
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

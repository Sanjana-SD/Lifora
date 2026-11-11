import { addDays, setHours, setMinutes, startOfDay } from 'date-fns';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Switch, Text, View } from 'react-native';

import { KeyboardAwareScreen } from '@/components/common/KeyboardAwareScreen';
import { Button } from '@/components/common/Button';
import { DateTimeField } from '@/components/common/DateTimeField';
import { CategoryPicker, FieldLabel, PriorityPicker } from '@/components/common/FormPickers';
import { Input } from '@/components/common/Input';
import { DeliveryNote, NotificationPermissionBanner } from '@/components/common/NotificationPermissionBanner';
import { SegmentedControl } from '@/components/common/SegmentedControl';
import { SPACING } from '@/constants/appConfig';
import { useTheme } from '@/hooks/useTheme';
import { ensurePermission } from '@/services/notificationService';
import { TASK_TITLE_MAX_LENGTH } from '@/services/taskService';
import type { TaskDraft } from '@/types/task';
import { DATE_ONLY_TASK_HOUR } from '@/utils/notificationPlanner';
import { ValidationError } from '@/utils/validationUtils';

const DEADLINE_KINDS = [
  { value: 'date', label: 'Date only' },
  { value: 'datetime', label: 'Date & time' },
] as const;

interface TaskFormProps {
  initial: TaskDraft;
  submitLabel: string;
  onSubmit: (draft: TaskDraft) => Promise<void>;
  footer?: React.ReactNode;
}

export function TaskForm({ initial, submitLabel, onSubmit, footer }: TaskFormProps) {
  const { colors } = useTheme();
  const [draft, setDraft] = useState<TaskDraft>(initial);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const update = (patch: Partial<TaskDraft>) => {
    setDraft((d) => ({ ...d, ...patch }));
    setError(null);
  };

  const setHasTime = (kind: 'date' | 'datetime') => {
    const hasTime = kind === 'datetime';
    const base = draft.deadline ?? addDays(new Date(), 1);
    update({ deadlineHasTime: hasTime, deadline: hasTime ? setMinutes(setHours(startOfDay(base), 17), 0) : startOfDay(base) });
  };

  const submit = async () => {
    setSaving(true);
    try {
      if (draft.deadline && draft.notify) await ensurePermission();
      await onSubmit(draft);
    } catch (e) {
      setError(e instanceof ValidationError ? e.message : "Couldn't save the task. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <KeyboardAwareScreen>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {draft.notify ? <NotificationPermissionBanner /> : null}
        <Input
          label="Title"
          value={draft.title}
          onChangeText={(title) => update({ title })}
          placeholder="What needs doing?"
          maxLength={TASK_TITLE_MAX_LENGTH}
          autoFocus={!initial.title}
        />
        <Input
          label="Notes"
          value={draft.description}
          onChangeText={(description) => update({ description })}
          placeholder="Optional"
          multiline
          style={styles.multiline}
        />
        <DateTimeField
          label="Deadline"
          mode={draft.deadlineHasTime ? 'datetime' : 'date'}
          value={draft.deadline}
          placeholder="No deadline"
          clearable
          onChange={(deadline) => update({ deadline, notify: deadline ? draft.notify : false })}
        />
        {draft.deadline ? (
          <>
            <View style={styles.block}>
              <SegmentedControl
                options={DEADLINE_KINDS}
                value={draft.deadlineHasTime ? 'datetime' : 'date'}
                onChange={setHasTime}
              />
            </View>
            <View style={styles.switchRow}>
              <View style={styles.flex}>
                <FieldLabel>Remind me</FieldLabel>
                <Text style={[styles.hint, { color: colors.textMuted }]}>
                  {draft.deadlineHasTime
                    ? 'Alert at the deadline'
                    : `Alert at ${DATE_ONLY_TASK_HOUR}:00 AM on the day`}
                </Text>
              </View>
              <Switch
                accessibilityLabel="Remind me"
                value={draft.notify}
                onValueChange={(notify) => update({ notify })}
                trackColor={{ true: colors.accent, false: colors.border }}
              />
            </View>
            {draft.notify ? <DeliveryNote /> : null}
          </>
        ) : null}
        <View style={styles.spacer} />
        <CategoryPicker value={draft.categoryId} onChange={(categoryId) => update({ categoryId })} />
        <PriorityPicker value={draft.priority} onChange={(priority) => update({ priority })} />
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
  block: {
    marginBottom: SPACING.md,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  hint: {
    fontSize: 12.5,
  },
  spacer: {
    height: SPACING.md,
  },
  error: {
    fontSize: 13.5,
    marginTop: SPACING.md,
  },
  submit: {
    marginTop: SPACING.lg,
  },
});

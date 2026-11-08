import { ListChecks } from 'lucide-react-native';
import React, { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { RADIUS, SPACING } from '@/constants/appConfig';
import { CHECKLIST_TEMPLATES } from '@/constants/checklistTemplates';
import { useTheme } from '@/hooks/useTheme';
import * as checklistService from '@/services/checklistService';
import { ValidationError } from '@/utils/validationUtils';

interface NewChecklistSheetProps {
  visible: boolean;
  onClose: () => void;
  onCreated: (checklistId: number) => void;
}

export function NewChecklistSheet({ visible, onClose, onCreated }: NewChecklistSheetProps) {
  const { colors } = useTheme();
  const [title, setTitle] = useState('');
  const [error, setError] = useState<string | undefined>();
  const [busy, setBusy] = useState(false);

  const close = () => {
    setTitle('');
    setError(undefined);
    onClose();
  };

  const run = async (create: () => Promise<number>) => {
    setBusy(true);
    try {
      const id = await create();
      setTitle('');
      setError(undefined);
      onCreated(id);
    } catch (e) {
      setError(e instanceof ValidationError ? e.message : "Couldn't create the checklist. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={close}>
      <Pressable style={styles.backdrop} onPress={close} accessibilityLabel="Close" />
      <View style={[styles.sheet, { backgroundColor: colors.background, borderColor: colors.border }]}>
        <Text style={[styles.heading, { color: colors.text }]}>New checklist</Text>
        <ScrollView keyboardShouldPersistTaps="handled">
          <Input
            label="Blank checklist"
            placeholder="Checklist name"
            value={title}
            onChangeText={(text) => {
              setTitle(text);
              setError(undefined);
            }}
            maxLength={checklistService.CHECKLIST_TITLE_MAX_LENGTH}
            errorMessage={error}
            returnKeyType="done"
            onSubmitEditing={() => run(() => checklistService.createBlankChecklist(title))}
          />
          <Button
            label="Create blank checklist"
            onPress={() => run(() => checklistService.createBlankChecklist(title))}
            loading={busy}
          />

          <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>Or start from a template</Text>
          {CHECKLIST_TEMPLATES.map((template) => (
            <Pressable
              key={template.key}
              accessibilityRole="button"
              accessibilityLabel={`Template: ${template.title}`}
              disabled={busy}
              onPress={() => run(() => checklistService.createFromTemplate(template.key))}
              style={({ pressed }) => [
                styles.template,
                { borderColor: colors.border, backgroundColor: pressed ? colors.surfaceAlt : colors.surface },
              ]}>
              <ListChecks size={18} color={colors.accent} />
              <View style={styles.templateText}>
                <Text style={[styles.templateTitle, { color: colors.text }]}>{template.title}</Text>
                <Text style={[styles.templateMeta, { color: colors.textMuted }]} numberOfLines={1}>
                  {template.items.join(', ')}
                </Text>
              </View>
            </Pressable>
          ))}
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
  },
  sheet: {
    maxHeight: '80%',
    borderTopLeftRadius: RADIUS.lg,
    borderTopRightRadius: RADIUS.lg,
    borderWidth: 1,
    padding: SPACING.lg,
  },
  heading: {
    fontSize: 17,
    fontWeight: '700',
    marginBottom: SPACING.md,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginTop: SPACING.xl,
    marginBottom: SPACING.sm,
  },
  template: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    borderWidth: 1,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
  },
  templateText: {
    flex: 1,
  },
  templateTitle: {
    fontSize: 14.5,
    fontWeight: '600',
  },
  templateMeta: {
    fontSize: 12,
    marginTop: 2,
  },
});

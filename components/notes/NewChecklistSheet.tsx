import { ChevronRight, ListChecks } from 'lucide-react-native';
import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { BottomSheet } from '@/components/common/BottomSheet';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { RADIUS, SPACING, TOUCH_TARGET, TYPE } from '@/constants/appConfig';
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
    <BottomSheet visible={visible} onClose={close} title="New checklist">
      <ScrollView keyboardShouldPersistTaps="handled">
        {/* Templates first: each is a one-tap start. */}
        <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>Start from a template</Text>
        {CHECKLIST_TEMPLATES.map((template) => (
          <Pressable
            key={template.key}
            accessibilityRole="button"
            accessibilityLabel={`Template: ${template.title}`}
            disabled={busy}
            onPress={() => run(() => checklistService.createFromTemplate(template.key))}
            style={({ pressed }) => [
              styles.template,
              { borderColor: colors.border, backgroundColor: pressed ? colors.accentSoft : colors.surface },
            ]}>
            <View style={[styles.iconWell, { backgroundColor: colors.accentSoft }]}>
              <ListChecks size={18} color={colors.accent} />
            </View>
            <View style={styles.templateText}>
              <Text style={[styles.templateTitle, { color: colors.text }]}>{template.title}</Text>
              <Text style={[styles.templateMeta, { color: colors.textMuted }]} numberOfLines={1}>
                {template.items.join(', ')}
              </Text>
            </View>
            <ChevronRight size={18} color={colors.textMuted} />
          </Pressable>
        ))}

        <Text style={[styles.sectionLabel, styles.blankLabel, { color: colors.textMuted }]}>Or start blank</Text>
        <Input
          label="Checklist name"
          placeholder="e.g. Packing for Goa"
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
          variant="secondary"
          onPress={() => run(() => checklistService.createBlankChecklist(title))}
          loading={busy}
        />
      </ScrollView>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  sectionLabel: {
    ...TYPE.overline,
    marginBottom: SPACING.sm,
  },
  blankLabel: {
    marginTop: SPACING.lg,
  },
  template: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    minHeight: TOUCH_TARGET + 12,
    borderWidth: 1,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.sm,
  },
  iconWell: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  templateText: {
    flex: 1,
  },
  templateTitle: {
    ...TYPE.subheading,
  },
  templateMeta: {
    ...TYPE.caption,
    marginTop: 2,
  },
});

import { Stack, router, useLocalSearchParams } from 'expo-router';
import { CheckCircle2, ListX, Plus, Trash2 } from 'lucide-react-native';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { EmptyState } from '@/components/common/EmptyState';
import { ProgressBar } from '@/components/common/ProgressBar';
import { ChecklistItemRow } from '@/components/notes/ChecklistItemRow';
import { RADIUS, SPACING } from '@/constants/appConfig';
import { useChecklist } from '@/hooks/useChecklists';
import { useTheme } from '@/hooks/useTheme';
import * as checklistService from '@/services/checklistService';
import { ValidationError } from '@/utils/validationUtils';

export default function ChecklistDetailsScreen() {
  const { colors } = useTheme();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const checklistId = Number(id);
  const { checklist, items, loading, notFound, reload } = useChecklist(checklistId);

  const [title, setTitle] = useState('');
  const [newItem, setNewItem] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  // Resync the editable title when the saved one changes (React's
  // "adjust state during render" pattern, instead of an effect).
  const savedTitle = checklist?.title;
  const [syncedTitle, setSyncedTitle] = useState<string | undefined>(undefined);
  if (savedTitle !== undefined && savedTitle !== syncedTitle) {
    setSyncedTitle(savedTitle);
    setTitle(savedTitle);
  }

  const attempt = async (action: () => Promise<unknown>) => {
    try {
      setMessage(null);
      await action();
    } catch (e) {
      setMessage(e instanceof ValidationError ? e.message : 'Something went wrong. Please try again.');
    } finally {
      await reload();
    }
  };

  const commitTitle = () => {
    if (!checklist || title.trim() === checklist.title) return;
    if (!title.trim()) {
      setTitle(checklist.title);
      return;
    }
    void attempt(() => checklistService.renameChecklist(checklistId, title));
  };

  const addItem = () => {
    if (!newItem.trim()) return;
    const label = newItem;
    setNewItem('');
    void attempt(() => checklistService.addItem(checklistId, label));
  };

  const deleteChecklist = async () => {
    setConfirmingDelete(false);
    await checklistService.deleteChecklist(checklistId);
    router.back();
  };

  if (!checklist) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <Stack.Screen options={{ title: 'Checklist' }} />
        {loading && !notFound ? (
          <ActivityIndicator color={colors.accent} />
        ) : (
          <EmptyState icon={ListX} title="Checklist not found" description="It may have been deleted." />
        )}
      </View>
    );
  }

  const completed = items.filter((i) => i.isCompleted).length;
  const percent = checklistService.completionPercent(completed, items.length);
  const done = items.length > 0 && completed === items.length;

  return (
    <KeyboardAvoidingView
      style={[styles.flex, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Stack.Screen
        options={{
          title: 'Checklist',
          headerRight: () => (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Delete checklist"
              onPress={() => setConfirmingDelete(true)}
              hitSlop={8}
              style={styles.headerIcon}>
              <Trash2 size={20} color={colors.danger} />
            </Pressable>
          ),
        }}
      />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <TextInput
          value={title}
          onChangeText={setTitle}
          onEndEditing={commitTitle}
          maxLength={checklistService.CHECKLIST_TITLE_MAX_LENGTH}
          accessibilityLabel="Checklist title"
          style={[styles.title, { color: colors.text }]}
        />

        <View style={styles.progressRow}>
          <View style={styles.flex}>
            <ProgressBar percent={percent} />
          </View>
          <Text style={[styles.progressText, { color: colors.textMuted }]}>
            {completed}/{items.length} done
          </Text>
        </View>
        {done ? (
          <View style={styles.doneRow}>
            <CheckCircle2 size={16} color={colors.accent} />
            <Text style={[styles.doneText, { color: colors.accent }]}>All done — nice work.</Text>
          </View>
        ) : null}

        {message ? <Text style={[styles.message, { color: colors.danger }]}>{message}</Text> : null}

        <View style={styles.items}>
          {items.map((item) => (
            <ChecklistItemRow
              key={item.id}
              item={item}
              onToggle={() => attempt(() => checklistService.setItemCompleted(checklistId, item.id, !item.isCompleted))}
              onRename={(label) => attempt(() => checklistService.renameItem(checklistId, item.id, label))}
              onDelete={() => attempt(() => checklistService.deleteItem(checklistId, item.id))}
            />
          ))}
          {items.length === 0 ? (
            <Text style={[styles.emptyItems, { color: colors.textMuted }]}>No items yet — add your first one below.</Text>
          ) : null}
        </View>

        <View style={[styles.addRow, { borderColor: colors.border, backgroundColor: colors.surface }]}>
          <TextInput
            value={newItem}
            onChangeText={setNewItem}
            placeholder="Add an item"
            placeholderTextColor={colors.textMuted}
            maxLength={checklistService.CHECKLIST_ITEM_MAX_LENGTH}
            returnKeyType="done"
            submitBehavior="submit"
            onSubmitEditing={addItem}
            accessibilityLabel="New item"
            style={[styles.addInput, { color: colors.text }]}
          />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Add item"
            onPress={addItem}
            disabled={!newItem.trim()}
            hitSlop={8}>
            <Plus size={22} color={newItem.trim() ? colors.accent : colors.textMuted} />
          </Pressable>
        </View>
      </ScrollView>

      <ConfirmDialog
        visible={confirmingDelete}
        title="Delete this checklist?"
        message={`"${checklist.title}" and its ${items.length} item${items.length === 1 ? '' : 's'} will be removed. This can't be undone.`}
        confirmLabel="Delete"
        destructive
        onConfirm={deleteChecklist}
        onCancel={() => setConfirmingDelete(false)}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
  },
  content: {
    padding: SPACING.lg,
    paddingBottom: SPACING.xxl,
  },
  headerIcon: {
    padding: SPACING.sm,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    paddingVertical: SPACING.sm,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    marginTop: SPACING.xs,
  },
  progressText: {
    fontSize: 12.5,
    fontWeight: '600',
  },
  doneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    marginTop: SPACING.sm,
  },
  doneText: {
    fontSize: 13,
    fontWeight: '700',
  },
  message: {
    fontSize: 13,
    marginTop: SPACING.sm,
  },
  items: {
    marginTop: SPACING.lg,
  },
  emptyItems: {
    fontSize: 13.5,
    paddingVertical: SPACING.md,
  },
  addRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginTop: SPACING.lg,
    paddingHorizontal: SPACING.md,
    borderWidth: 1,
    borderRadius: RADIUS.md,
    minHeight: 46,
  },
  addInput: {
    flex: 1,
    fontSize: 15,
    paddingVertical: SPACING.sm,
  },
});

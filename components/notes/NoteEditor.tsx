import { Stack, router } from 'expo-router';
import { Check, Pin, PinOff, Star, Trash2 } from 'lucide-react-native';
import React, { useEffect, useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { Chip } from '@/components/common/Chip';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { SPACING } from '@/constants/appConfig';
import { NOTE_CATEGORIES, type NoteCategory } from '@/constants/noteCategories';
import { NOTE_COLOR_KEYS, NOTE_COLOR_LABELS, noteSwatch, type NoteColorKey } from '@/constants/noteColors';
import { useAutosave } from '@/hooks/useAutosave';
import { useTheme } from '@/hooks/useTheme';
import * as noteService from '@/services/noteService';
import type { Note, NoteDraft } from '@/types/note';

interface NoteEditorProps {
  initialNote: Note | null;
}

const STATUS_TEXT = {
  idle: '',
  saving: 'Saving…',
  saved: 'Saved',
  error: "Couldn't save — your text is still here, keep editing to retry",
} as const;

export function NoteEditor({ initialNote }: NoteEditorProps) {
  const { colors, scheme } = useTheme();

  const [draft, setDraft] = useState<NoteDraft>(() =>
    initialNote
      ? {
          title: initialNote.title,
          body: initialNote.body,
          colorKey: initialNote.colorKey,
          category: initialNote.category,
        }
      : noteService.EMPTY_DRAFT,
  );
  const [noteId, setNoteId] = useState<number | null>(initialNote?.id ?? null);
  const [isPinned, setIsPinned] = useState(initialNote?.isPinned ?? false);
  const [isFavourite, setIsFavourite] = useState(initialNote?.isFavourite ?? false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  const idRef = useRef<number | null>(noteId);
  const draftRef = useRef(draft);
  const deletedRef = useRef(false);

  const { status, schedule, flush, cancel } = useAutosave<NoteDraft>(async (value) => {
    const id = await noteService.saveNote(idRef.current, value);
    if (id !== idRef.current) {
      idRef.current = id;
      setNoteId(id);
    }
  });

  // useAutosave flushes on unmount (its cleanup runs first); this then
  // removes a note the user emptied, since notes can't be blank (PRD 5.A).
  useEffect(
    () => () => {
      if (deletedRef.current) return;
      void flush().then(() => noteService.discardIfEmpty(idRef.current, draftRef.current));
    },
    [flush],
  );

  const update = (patch: Partial<NoteDraft>) => {
    const next = { ...draftRef.current, ...patch };
    draftRef.current = next;
    setDraft(next);
    schedule(next);
  };

  const ensureSaved = async (): Promise<number | null> => {
    await flush();
    return idRef.current;
  };

  const togglePinned = async () => {
    const id = await ensureSaved();
    if (id === null) return;
    const next = !isPinned;
    setIsPinned(next);
    await noteService.setPinned(id, next);
  };

  const toggleFavourite = async () => {
    const id = await ensureSaved();
    if (id === null) return;
    const next = !isFavourite;
    setIsFavourite(next);
    await noteService.setFavourite(id, next);
  };

  const deleteNote = async () => {
    setConfirmingDelete(false);
    deletedRef.current = true;
    cancel();
    await flush();
    if (idRef.current !== null) await noteService.deleteNote(idRef.current);
    router.back();
  };

  const empty = noteService.isDraftEmpty(draft);
  const canToggle = !empty;

  return (
    <KeyboardAvoidingView
      style={[styles.flex, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Stack.Screen
        options={{
          title: initialNote ? 'Edit Note' : 'New Note',
          headerRight: () => (
            <View style={styles.headerActions}>
              <HeaderIcon
                label={isPinned ? 'Unpin note' : 'Pin note'}
                disabled={!canToggle}
                onPress={togglePinned}>
                {isPinned ? (
                  <PinOff size={20} color={colors.accent} />
                ) : (
                  <Pin size={20} color={canToggle ? colors.text : colors.textMuted} />
                )}
              </HeaderIcon>
              <HeaderIcon
                label={isFavourite ? 'Remove from favourites' : 'Add to favourites'}
                disabled={!canToggle}
                onPress={toggleFavourite}>
                <Star
                  size={20}
                  color={isFavourite ? colors.warning : canToggle ? colors.text : colors.textMuted}
                  fill={isFavourite ? colors.warning : 'transparent'}
                />
              </HeaderIcon>
              <HeaderIcon
                label="Delete note"
                onPress={() => (empty && noteId === null ? router.back() : setConfirmingDelete(true))}>
                <Trash2 size={20} color={colors.danger} />
              </HeaderIcon>
            </View>
          ),
        }}
      />

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <TextInput
          value={draft.title}
          onChangeText={(title) => update({ title })}
          placeholder="Title"
          placeholderTextColor={colors.textMuted}
          maxLength={noteService.NOTE_TITLE_MAX_LENGTH}
          autoFocus={!initialNote}
          accessibilityLabel="Note title"
          style={[styles.title, { color: colors.text }]}
        />
        <Text style={[styles.status, { color: status === 'error' ? colors.danger : colors.textMuted }]}>
          {STATUS_TEXT[status]}
        </Text>
        <TextInput
          value={draft.body}
          onChangeText={(body) => update({ body })}
          placeholder="Start writing…"
          placeholderTextColor={colors.textMuted}
          multiline
          textAlignVertical="top"
          accessibilityLabel="Note body"
          style={[styles.body, { color: colors.text }]}
        />

        <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>Colour</Text>
        <View style={styles.swatches}>
          {NOTE_COLOR_KEYS.map((key: NoteColorKey) => {
            const selected = draft.colorKey === key;
            return (
              <Pressable
                key={key}
                accessibilityRole="radio"
                accessibilityState={{ selected }}
                accessibilityLabel={`Colour: ${NOTE_COLOR_LABELS[key]}`}
                onPress={() => update({ colorKey: key })}
                style={[
                  styles.swatch,
                  {
                    backgroundColor: noteSwatch(key, scheme),
                    borderColor: selected ? colors.text : colors.border,
                  },
                ]}>
                {selected ? <Check size={16} color={key === 'default' ? colors.text : '#FFFFFF'} /> : null}
              </Pressable>
            );
          })}
        </View>

        <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>Category</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          <Chip label="None" selected={draft.category === null} onPress={() => update({ category: null })} />
          {NOTE_CATEGORIES.map((category: NoteCategory) => (
            <Chip
              key={category}
              label={category}
              selected={draft.category === category}
              onPress={() => update({ category })}
            />
          ))}
        </ScrollView>
      </ScrollView>

      <ConfirmDialog
        visible={confirmingDelete}
        title="Delete this note?"
        message="This can't be undone."
        confirmLabel="Delete"
        destructive
        onConfirm={deleteNote}
        onCancel={() => setConfirmingDelete(false)}
      />
    </KeyboardAvoidingView>
  );
}

function HeaderIcon({
  label,
  disabled = false,
  onPress,
  children,
}: {
  label: string;
  disabled?: boolean;
  onPress: () => void;
  children: React.ReactNode;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      hitSlop={8}
      style={styles.headerIcon}>
      {children}
    </Pressable>
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
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerIcon: {
    padding: SPACING.sm,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    paddingVertical: SPACING.sm,
  },
  status: {
    fontSize: 12,
    minHeight: 16,
  },
  body: {
    fontSize: 15.5,
    lineHeight: 22,
    minHeight: 220,
    paddingVertical: SPACING.md,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginTop: SPACING.lg,
    marginBottom: SPACING.sm,
  },
  swatches: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  swatch: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

import { Stack, useLocalSearchParams } from 'expo-router';
import { FileQuestion } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { EmptyState } from '@/components/common/EmptyState';
import { NoteEditor } from '@/components/notes/NoteEditor';
import { useTheme } from '@/hooks/useTheme';
import * as noteService from '@/services/noteService';
import type { Note } from '@/types/note';

type LoadState = { kind: 'loading' } | { kind: 'missing' } | { kind: 'ready'; note: Note };

export default function EditNoteScreen() {
  const { colors } = useTheme();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const noteId = Number(id);
  const validId = Number.isInteger(noteId) && noteId > 0;
  const [loaded, setLoaded] = useState<LoadState>({ kind: 'loading' });
  const state: LoadState = validId ? loaded : { kind: 'missing' };

  // Loaded once, not on focus: the editor owns the note's state while
  // it's open, and reloading underneath it would clobber unsaved typing.
  useEffect(() => {
    if (!validId) return;
    let active = true;
    noteService
      .getNote(noteId)
      .then((note) => active && setLoaded(note ? { kind: 'ready', note } : { kind: 'missing' }))
      .catch(() => active && setLoaded({ kind: 'missing' }));
    return () => {
      active = false;
    };
  }, [noteId, validId]);

  if (state.kind === 'ready') return <NoteEditor initialNote={state.note} />;

  return (
    <View style={[styles.center, { backgroundColor: colors.background }]}>
      <Stack.Screen options={{ title: 'Note' }} />
      {state.kind === 'loading' ? (
        <ActivityIndicator color={colors.accent} />
      ) : (
        <EmptyState
          icon={FileQuestion}
          title="Note not found"
          description="It may have been deleted."
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: 'center',
  },
});

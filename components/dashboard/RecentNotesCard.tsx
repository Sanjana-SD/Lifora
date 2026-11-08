import { router, type Href } from 'expo-router';
import { NotebookPen, Pin } from 'lucide-react-native';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { SPACING } from '@/constants/appConfig';
import { useRecentNotes } from '@/hooks/useNotes';
import { useTheme } from '@/hooks/useTheme';
import { displayTitle } from '@/services/noteService';
import { formatRelativeUpdated } from '@/utils/dateUtils';
import { AddLink } from './AddLink';
import { DashboardSection } from './DashboardSection';

export function RecentNotesCard() {
  const { colors } = useTheme();
  const { notes, error } = useRecentNotes(3);

  return (
    <DashboardSection icon={NotebookPen} title="Recent Notes" onPress={() => router.push('/(tabs)/notes' as Href)}>
      {error ? (
        <Text style={[styles.empty, { color: colors.danger }]}>{"Couldn't load notes."}</Text>
      ) : notes.length === 0 ? (
        <Text style={[styles.empty, { color: colors.textMuted }]}>
          Your notes will show up here once you create one.
        </Text>
      ) : (
        notes.map((note) => (
          <Pressable
            key={note.id}
            accessibilityRole="button"
            accessibilityLabel={`Open note: ${displayTitle(note)}`}
            onPress={() => router.push(`/notes/edit-note?id=${note.id}` as Href)}
            style={styles.row}>
            <View style={styles.rowTitle}>
              {note.isPinned ? <Pin size={12} color={colors.accent} /> : null}
              <Text style={[styles.noteTitle, { color: colors.text }]} numberOfLines={1}>
                {displayTitle(note)}
              </Text>
            </View>
            <Text style={[styles.noteMeta, { color: colors.textMuted }]}>{formatRelativeUpdated(note.updatedAt)}</Text>
          </Pressable>
        ))
      )}
      <AddLink label="Create a note" onPress={() => router.push('/notes/create-note' as Href)} />
    </DashboardSection>
  );
}

const styles = StyleSheet.create({
  empty: {
    fontSize: 13,
    lineHeight: 18,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SPACING.xs,
    gap: SPACING.sm,
  },
  rowTitle: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  noteTitle: {
    flex: 1,
    fontSize: 13.5,
    fontWeight: '600',
  },
  noteMeta: {
    fontSize: 11.5,
  },
});

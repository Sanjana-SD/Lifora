import { Pin, Star } from 'lucide-react-native';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { RADIUS, SPACING } from '@/constants/appConfig';
import { noteSwatch } from '@/constants/noteColors';
import { useTheme } from '@/hooks/useTheme';
import { bodySnippet, displayTitle } from '@/services/noteService';
import type { Note } from '@/types/note';
import { formatRelativeUpdated } from '@/utils/dateUtils';

interface NoteCardProps {
  note: Note;
  onPress: () => void;
}

export function NoteCard({ note, onPress }: NoteCardProps) {
  const { colors, scheme } = useTheme();
  const snippet = bodySnippet(note);
  const title = displayTitle(note);
  // Lucide icons render aria-hidden, so pinned/favourite state has to be
  // spoken via the card's own label rather than the icons.
  const status = [note.isPinned && 'pinned', note.isFavourite && 'favourite'].filter(Boolean).join(', ');

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Note: ${title}${status ? `, ${status}` : ''}`}
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        { backgroundColor: colors.surface, borderColor: colors.border, opacity: pressed ? 0.85 : 1 },
      ]}>
      <View style={[styles.stripe, { backgroundColor: noteSwatch(note.colorKey, scheme) }]} />
      <View style={styles.content}>
        <View style={styles.titleRow}>
          <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>
            {title}
          </Text>
          {note.isPinned ? <Pin size={14} color={colors.accent} /> : null}
          {note.isFavourite ? <Star size={14} color={colors.warning} fill={colors.warning} /> : null}
        </View>
        {snippet ? (
          <Text style={[styles.snippet, { color: colors.textMuted }]} numberOfLines={2}>
            {snippet}
          </Text>
        ) : null}
        <Text style={[styles.meta, { color: colors.textMuted }]}>
          {note.category ? `${note.category} · ` : ''}
          {formatRelativeUpdated(note.updatedAt)}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: SPACING.sm,
  },
  stripe: {
    width: 5,
  },
  content: {
    flex: 1,
    padding: SPACING.md,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  title: {
    flex: 1,
    fontSize: 15,
    fontWeight: '700',
  },
  snippet: {
    fontSize: 13,
    lineHeight: 18,
    marginTop: 2,
  },
  meta: {
    fontSize: 11.5,
    marginTop: SPACING.xs,
  },
});

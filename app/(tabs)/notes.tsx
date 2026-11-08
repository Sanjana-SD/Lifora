import { router, type Href } from 'expo-router';
import { ListChecks, NotebookPen, Search, SearchX } from 'lucide-react-native';
import React, { useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { Button } from '@/components/common/Button';
import { Chip } from '@/components/common/Chip';
import { EmptyState } from '@/components/common/EmptyState';
import { FloatingActionButton } from '@/components/common/FloatingActionButton';
import { SegmentedControl } from '@/components/common/SegmentedControl';
import { ChecklistCard } from '@/components/notes/ChecklistCard';
import { NewChecklistSheet } from '@/components/notes/NewChecklistSheet';
import { NoteCard } from '@/components/notes/NoteCard';
import { RADIUS, SPACING } from '@/constants/appConfig';
import { NOTE_CATEGORIES, type NoteCategory } from '@/constants/noteCategories';
import { useChecklists } from '@/hooks/useChecklists';
import { useNotes } from '@/hooks/useNotes';
import { useTheme } from '@/hooks/useTheme';

type Segment = 'notes' | 'checklists';
type NoteFilter = 'all' | 'favourites' | NoteCategory;

const SEGMENTS = [
  { value: 'notes', label: 'Notes' },
  { value: 'checklists', label: 'Checklists' },
] as const;

const openNote = (id: number) => router.push(`/notes/edit-note?id=${id}` as Href);
const openChecklist = (id: number) => router.push(`/notes/checklist-details?id=${id}` as Href);

export default function NotesScreen() {
  const { colors } = useTheme();
  const [segment, setSegment] = useState<Segment>('notes');

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.segmentWrap}>
        <SegmentedControl options={SEGMENTS} value={segment} onChange={setSegment} />
      </View>
      {segment === 'notes' ? <NotesPane /> : <ChecklistsPane />}
    </View>
  );
}

function NotesPane() {
  const { colors } = useTheme();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<NoteFilter>('all');
  const { notes, loading, error, reload } = useNotes(search);

  const visible = useMemo(() => {
    if (filter === 'all') return notes;
    if (filter === 'favourites') return notes.filter((n) => n.isFavourite);
    return notes.filter((n) => n.category === filter);
  }, [notes, filter]);

  const searching = search.trim() !== '' || filter !== 'all';

  return (
    <View style={styles.flex}>
      <View style={[styles.searchBox, { borderColor: colors.border, backgroundColor: colors.surface }]}>
        <Search size={18} color={colors.textMuted} />
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Search notes"
          placeholderTextColor={colors.textMuted}
          accessibilityLabel="Search notes"
          returnKeyType="search"
          style={[styles.searchInput, { color: colors.text }]}
        />
      </View>
      <View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filters}
          keyboardShouldPersistTaps="handled">
          <Chip label="All" selected={filter === 'all'} onPress={() => setFilter('all')} />
          <Chip label="★ Favourites" selected={filter === 'favourites'} onPress={() => setFilter('favourites')} />
          {NOTE_CATEGORIES.map((category) => (
            <Chip
              key={category}
              label={category}
              selected={filter === category}
              onPress={() => setFilter(category)}
            />
          ))}
        </ScrollView>
      </View>

      {error ? (
        <View style={styles.center}>
          <Text style={[styles.errorText, { color: colors.danger }]}>{"Couldn't load your notes."}</Text>
          <Button label="Try again" variant="secondary" onPress={reload} />
        </View>
      ) : loading && notes.length === 0 ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.accent} />
        </View>
      ) : (
        <FlatList
          data={visible}
          keyExtractor={(note) => String(note.id)}
          renderItem={({ item }) => <NoteCard note={item} onPress={() => openNote(item.id)} />}
          contentContainerStyle={styles.list}
          keyboardShouldPersistTaps="handled"
          ListEmptyComponent={
            searching ? (
              <EmptyState
                icon={SearchX}
                title="No matching notes"
                description="Try a different word, or clear the search and filters."
              />
            ) : (
              <EmptyState
                icon={NotebookPen}
                title="No notes yet"
                description="Capture ideas, lists, and anything worth remembering."
                actionLabel="Create a note"
                onAction={() => router.push('/notes/create-note' as Href)}
              />
            )
          }
        />
      )}
      <FloatingActionButton accessibilityLabel="Create a note" onPress={() => router.push('/notes/create-note' as Href)} />
    </View>
  );
}

function ChecklistsPane() {
  const { colors } = useTheme();
  const { checklists, loading, error, reload } = useChecklists();
  const [sheetOpen, setSheetOpen] = useState(false);

  return (
    <View style={styles.flex}>
      {error ? (
        <View style={styles.center}>
          <Text style={[styles.errorText, { color: colors.danger }]}>{"Couldn't load your checklists."}</Text>
          <Button label="Try again" variant="secondary" onPress={reload} />
        </View>
      ) : loading && checklists.length === 0 ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.accent} />
        </View>
      ) : (
        <FlatList
          data={checklists}
          keyExtractor={(c) => String(c.id)}
          renderItem={({ item }) => <ChecklistCard checklist={item} onPress={() => openChecklist(item.id)} />}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <EmptyState
              icon={ListChecks}
              title="No checklists yet"
              description="Start blank or from a template — shopping, college, travel, and more."
              actionLabel="New checklist"
              onAction={() => setSheetOpen(true)}
            />
          }
        />
      )}
      <FloatingActionButton accessibilityLabel="New checklist" onPress={() => setSheetOpen(true)} />
      <NewChecklistSheet
        visible={sheetOpen}
        onClose={() => setSheetOpen(false)}
        onCreated={(id) => {
          setSheetOpen(false);
          openChecklist(id);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  segmentWrap: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.sm,
    paddingBottom: SPACING.md,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginHorizontal: SPACING.lg,
    paddingHorizontal: SPACING.md,
    borderWidth: 1,
    borderRadius: RADIUS.md,
    minHeight: 44,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    paddingVertical: SPACING.sm,
  },
  filters: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
  },
  list: {
    flexGrow: 1,
    paddingHorizontal: SPACING.lg,
    paddingBottom: 96,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.md,
    padding: SPACING.xl,
  },
  errorText: {
    fontSize: 14,
    fontWeight: '600',
  },
});

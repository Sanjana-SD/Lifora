import { addDays, addMonths, endOfDay, format, isSameMonth, startOfDay, startOfMonth } from 'date-fns';
import { CalendarX, ChevronLeft, ChevronRight, Repeat, Search, SearchX } from 'lucide-react-native';
import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, SectionList, StyleSheet, Text, TextInput, View } from 'react-native';

import { AgendaItem } from '@/components/calendar/AgendaItem';
import { addEventOn, openOccurrence } from '@/components/calendar/navigation';
import { EmptyState } from '@/components/common/EmptyState';
import { FloatingActionButton } from '@/components/common/FloatingActionButton';
import { MonthGrid } from '@/components/common/MonthGrid';
import { SegmentedControl } from '@/components/common/SegmentedControl';
import { RADIUS, SPACING } from '@/constants/appConfig';
import { useCategoryMap, useEventSearch, useOccurrences, useUpcomingEvents } from '@/hooks/useCalendar';
import { useTheme } from '@/hooks/useTheme';
import type { EventOccurrence, EventRecord } from '@/types/event';
import { dayKey, monthGridRange } from '@/utils/calendarGrid';
import { describeRecurrence } from '@/utils/recurrence';

type Pane = 'month' | 'upcoming';
const PANES = [
  { value: 'month', label: 'Month' },
  { value: 'upcoming', label: 'Upcoming' },
] as const;

export default function CalendarScreen() {
  const { colors } = useTheme();
  const [pane, setPane] = useState<Pane>('month');
  const [selected, setSelected] = useState<Date>(startOfDay(new Date()));

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.paneSwitch}>
        <SegmentedControl options={PANES} value={pane} onChange={setPane} />
      </View>
      {pane === 'month' ? <MonthPane selected={selected} onSelect={setSelected} /> : <UpcomingPane />}
      <FloatingActionButton accessibilityLabel="Add event" onPress={() => addEventOn(selected)} />
    </View>
  );
}

function MonthPane({ selected, onSelect }: { selected: Date; onSelect: (d: Date) => void }) {
  const { colors } = useTheme();
  const [month, setMonth] = useState(startOfMonth(selected));
  const range = useMemo(() => monthGridRange(month), [month]);
  const { occurrences } = useOccurrences(range.start, range.end);
  const categories = useCategoryMap('calendar');

  // Every day an occurrence touches gets a dot in its category color.
  const markers = useMemo(() => {
    const map = new Map<string, string[]>();
    for (const o of occurrences) {
      const color = (o.categoryId !== null && categories.get(o.categoryId)?.colorHex) || colors.accent;
      for (let d = startOfDay(o.start); d <= o.end && d <= range.end; d = addDays(d, 1)) {
        const key = dayKey(d);
        map.set(key, [...(map.get(key) ?? []), color]);
      }
    }
    return map;
  }, [occurrences, categories, colors.accent, range.end]);

  const dayStart = startOfDay(selected);
  const dayEnd = endOfDay(selected);
  const dayItems = occurrences.filter((o) => o.start <= dayEnd && o.end >= dayStart);

  const goTo = (target: Date) => {
    setMonth(startOfMonth(target));
    onSelect(startOfDay(target));
  };

  return (
    <ScrollView contentContainerStyle={styles.scroll}>
      <View style={styles.monthHeader}>
        <Pressable accessibilityRole="button" accessibilityLabel="Previous month" onPress={() => setMonth((m) => addMonths(m, -1))} hitSlop={8} style={styles.navButton}>
          <ChevronLeft size={22} color={colors.text} />
        </Pressable>
        <Text style={[styles.monthTitle, { color: colors.text }]} accessibilityRole="header">
          {format(month, 'MMMM yyyy')}
        </Text>
        <Pressable accessibilityRole="button" accessibilityLabel="Next month" onPress={() => setMonth((m) => addMonths(m, 1))} hitSlop={8} style={styles.navButton}>
          <ChevronRight size={22} color={colors.text} />
        </Pressable>
        {!isSameMonth(month, new Date()) || dayKey(selected) !== dayKey(new Date()) ? (
          <Pressable
            accessibilityRole="button"
            onPress={() => goTo(new Date())}
            style={[styles.todayButton, { borderColor: colors.border }]}>
            <Text style={[styles.todayText, { color: colors.accent }]}>Today</Text>
          </Pressable>
        ) : null}
      </View>

      <MonthGrid
        month={month}
        selected={selected}
        markers={markers}
        onSelect={(day) => {
          onSelect(day);
          if (!isSameMonth(day, month)) setMonth(startOfMonth(day));
        }}
      />

      <Text style={[styles.dayTitle, { color: colors.text }]} accessibilityRole="header">
        {format(selected, 'EEEE, d MMMM')}
      </Text>
      {dayItems.length === 0 ? (
        <EmptyState
          icon={CalendarX}
          title="Nothing scheduled"
          description="Tap + to add an event on this day."
        />
      ) : (
        dayItems.map((o) => (
          <AgendaItem
            key={o.key}
            occurrence={o}
            category={o.categoryId !== null ? categories.get(o.categoryId) : undefined}
            onPress={() => openOccurrence(o)}
          />
        ))
      )}
    </ScrollView>
  );
}

function UpcomingPane() {
  const { colors } = useTheme();
  const [search, setSearch] = useState('');
  const searching = search.trim() !== '';

  return (
    <View style={styles.flex}>
      <View style={[styles.searchBox, { borderColor: colors.border, backgroundColor: colors.surface }]}>
        <Search size={18} color={colors.textMuted} />
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Search events"
          placeholderTextColor={colors.textMuted}
          accessibilityLabel="Search events"
          returnKeyType="search"
          style={[styles.searchInput, { color: colors.text }]}
        />
      </View>
      {searching ? <SearchResults term={search} /> : <UpcomingList />}
    </View>
  );
}

function UpcomingList() {
  const { colors } = useTheme();
  const { occurrences } = useUpcomingEvents();
  const categories = useCategoryMap('calendar');

  // Grouped by day; something already in progress is listed under today.
  const sections = useMemo(() => {
    const now = new Date();
    const byDay = new Map<string, EventOccurrence[]>();
    for (const o of occurrences) {
      if (o.end < now) continue;
      const key = dayKey(o.start < now ? now : o.start);
      byDay.set(key, [...(byDay.get(key) ?? []), o]);
    }
    return [...byDay.entries()].map(([key, data]) => ({ title: format(new Date(`${key}T00:00:00`), 'EEEE, d MMMM'), data }));
  }, [occurrences]);

  return (
    <SectionList
      sections={sections}
      keyExtractor={(o) => o.key}
      contentContainerStyle={styles.list}
      renderSectionHeader={({ section }) => (
        <Text style={[styles.sectionHeader, { color: colors.textMuted, backgroundColor: colors.background }]}>
          {section.title}
        </Text>
      )}
      renderItem={({ item }) => (
        <AgendaItem
          occurrence={item}
          category={item.categoryId !== null ? categories.get(item.categoryId) : undefined}
          onPress={() => openOccurrence(item)}
        />
      )}
      ListEmptyComponent={
        <EmptyState icon={CalendarX} title="No upcoming events" description="Events in the next 30 days show up here." />
      }
    />
  );
}

function SearchResults({ term }: { term: string }) {
  const { colors } = useTheme();
  const { results } = useEventSearch(term);

  const open = (e: EventRecord) =>
    openOccurrence({
      seriesId: e.parentEventId ?? e.id,
      originalStart: e.originalStartAt ?? e.startAt,
    });

  return (
    <ScrollView contentContainerStyle={styles.list} keyboardShouldPersistTaps="handled">
      {results.length === 0 ? (
        <EmptyState icon={SearchX} title="No matching events" description="Try a different word." />
      ) : (
        results.map((e) => (
          <Pressable
            key={e.id}
            accessibilityRole="button"
            onPress={() => open(e)}
            style={[styles.result, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.resultTitle, { color: colors.text }]}>{e.title}</Text>
            <Text style={[styles.resultMeta, { color: colors.textMuted }]}>
              {format(e.startAt, 'EEE d MMM yyyy, h:mm a')}
              {e.location ? ` · ${e.location}` : ''}
            </Text>
            {e.recurrence.freq !== 'none' ? (
              <View style={styles.resultRepeat}>
                <Repeat size={12} color={colors.textMuted} />
                <Text style={[styles.resultMeta, { color: colors.textMuted }]}>{describeRecurrence(e.recurrence, e.startAt)}</Text>
              </View>
            ) : null}
          </Pressable>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  paneSwitch: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.sm,
    paddingBottom: SPACING.sm,
  },
  scroll: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: 96,
  },
  monthHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  navButton: {
    padding: SPACING.xs,
  },
  monthTitle: {
    fontSize: 17,
    fontWeight: '700',
    marginHorizontal: SPACING.sm,
  },
  todayButton: {
    marginLeft: 'auto',
    borderWidth: 1,
    borderRadius: RADIUS.lg,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
  },
  todayText: {
    fontSize: 13,
    fontWeight: '700',
  },
  dayTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginTop: SPACING.lg,
    marginBottom: SPACING.sm,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginHorizontal: SPACING.lg,
    marginBottom: SPACING.sm,
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
  list: {
    flexGrow: 1,
    paddingHorizontal: SPACING.lg,
    paddingBottom: 96,
  },
  sectionHeader: {
    fontSize: 12.5,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.sm,
  },
  result: {
    borderWidth: 1,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
  },
  resultTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  resultMeta: {
    fontSize: 12.5,
    marginTop: 2,
  },
  resultRepeat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
});

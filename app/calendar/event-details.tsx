import { format } from 'date-fns';
import { Stack, router, useLocalSearchParams, type Href } from 'expo-router';
import { Bell, CalendarX, Flag, MapPin, Pencil, Repeat, Tag, Trash2, type LucideIcon } from 'lucide-react-native';
import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { timeRange } from '@/components/calendar/AgendaItem';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { EmptyState } from '@/components/common/EmptyState';
import { NOTIFICATION_OFFSETS } from '@/components/common/FormPickers';
import { ScopeDialog, type EditScope } from '@/components/common/ScopeDialog';
import { SPACING } from '@/constants/appConfig';
import { PRIORITY_LABELS } from '@/constants/priorities';
import { useCategoryMap, useOccurrence } from '@/hooks/useCalendar';
import { useFocusedQuery } from '@/hooks/useFocusedQuery';
import { useTheme } from '@/hooks/useTheme';
import * as calendar from '@/services/calendarService';
import { describeRecurrence } from '@/utils/recurrence';

export default function EventDetailsScreen() {
  const { colors } = useTheme();
  const params = useLocalSearchParams<{ seriesId?: string; start?: string }>();
  const seriesId = Number(params.seriesId);
  const originalStart = params.start ? new Date(params.start) : null;
  const { occurrence, loading } = useOccurrence(seriesId, originalStart);
  const { data: series } = useFocusedQuery(useCallback(() => calendar.getSeries(seriesId), [seriesId]));
  const categories = useCategoryMap('calendar');
  const [deleting, setDeleting] = useState(false);

  if (!occurrence) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <Stack.Screen options={{ title: 'Event' }} />
        {loading ? (
          <ActivityIndicator color={colors.accent} />
        ) : (
          <EmptyState icon={CalendarX} title="Event not found" description="It may have been deleted." />
        )}
      </View>
    );
  }

  const category = occurrence.categoryId !== null ? categories.get(occurrence.categoryId) : undefined;
  const offsetLabel = NOTIFICATION_OFFSETS.find((o) => o.minutes === occurrence.notificationOffsetMinutes)?.label;
  const editHref = `/calendar/edit-event?seriesId=${seriesId}&start=${encodeURIComponent(params.start ?? '')}` as Href;

  const remove = async (scope: EditScope) => {
    setDeleting(false);
    if (scope === 'all') await calendar.deleteSeries(occurrence.seriesId);
    else await calendar.deleteOccurrence(occurrence);
    router.back();
  };

  return (
    <ScrollView style={{ backgroundColor: colors.background }} contentContainerStyle={styles.content}>
      <Stack.Screen
        options={{
          title: 'Event',
          headerRight: () => (
            <View style={styles.headerActions}>
              <Pressable accessibilityRole="button" accessibilityLabel="Edit event" onPress={() => router.push(editHref)} hitSlop={8} style={styles.headerIcon}>
                <Pencil size={20} color={colors.text} />
              </Pressable>
              <Pressable accessibilityRole="button" accessibilityLabel="Delete event" onPress={() => setDeleting(true)} hitSlop={8} style={styles.headerIcon}>
                <Trash2 size={20} color={colors.danger} />
              </Pressable>
            </View>
          ),
        }}
      />
      <View style={[styles.colorBar, { backgroundColor: category?.colorHex ?? colors.accent }]} />
      <Text style={[styles.title, { color: colors.text }]} accessibilityRole="header">
        {occurrence.title}
      </Text>
      <Text style={[styles.when, { color: colors.text }]}>{format(occurrence.start, 'EEEE, d MMMM yyyy')}</Text>
      <Text style={[styles.time, { color: colors.textMuted }]}>{timeRange(occurrence)}</Text>

      <View style={[styles.details, { borderColor: colors.border }]}>
        {series && series.recurrence.freq !== 'none' ? (
          <Detail icon={Repeat} text={`${describeRecurrence(series.recurrence, series.startAt)}${occurrence.isException ? ' · this occurrence was edited' : ''}`} />
        ) : null}
        {occurrence.location ? <Detail icon={MapPin} text={occurrence.location} /> : null}
        {category ? <Detail icon={Tag} text={category.name} /> : null}
        <Detail icon={Flag} text={`${PRIORITY_LABELS[occurrence.priority]} priority`} />
        {offsetLabel && occurrence.notificationOffsetMinutes !== null ? <Detail icon={Bell} text={`Notify ${offsetLabel.toLowerCase()}`} /> : null}
      </View>

      {occurrence.description ? (
        <Text style={[styles.description, { color: colors.text }]}>{occurrence.description}</Text>
      ) : null}

      {occurrence.isRecurring ? (
        <ScopeDialog
          visible={deleting}
          title="Delete event?"
          destructive
          onChoose={remove}
          onCancel={() => setDeleting(false)}
        />
      ) : (
        <ConfirmDialog
          visible={deleting}
          title="Delete this event?"
          message="This can't be undone."
          confirmLabel="Delete"
          destructive
          onConfirm={() => remove('this')}
          onCancel={() => setDeleting(false)}
        />
      )}
    </ScrollView>
  );
}

function Detail({ icon: Icon, text }: { icon: LucideIcon; text: string }) {
  const { colors } = useTheme();
  return (
    <View style={styles.detail}>
      <Icon size={16} color={colors.textMuted} />
      <Text style={[styles.detailText, { color: colors.text }]}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: 'center',
  },
  content: {
    padding: SPACING.lg,
    paddingBottom: SPACING.xxl,
  },
  headerActions: {
    flexDirection: 'row',
  },
  headerIcon: {
    padding: SPACING.sm,
  },
  colorBar: {
    width: 40,
    height: 5,
    borderRadius: 3,
    marginBottom: SPACING.md,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
  },
  when: {
    fontSize: 15,
    fontWeight: '600',
    marginTop: SPACING.sm,
  },
  time: {
    fontSize: 14,
    marginTop: 2,
  },
  details: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingVertical: SPACING.md,
    marginTop: SPACING.lg,
    gap: SPACING.sm,
  },
  detail: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  detailText: {
    fontSize: 14,
    flexShrink: 1,
  },
  description: {
    fontSize: 15,
    lineHeight: 22,
    marginTop: SPACING.lg,
  },
});

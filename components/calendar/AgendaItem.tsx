import { format, isSameDay } from 'date-fns';
import { Bell, MapPin, Repeat } from 'lucide-react-native';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { RADIUS, SPACING } from '@/constants/appConfig';
import { useTheme } from '@/hooks/useTheme';
import type { Category } from '@/types/category';
import type { EventOccurrence } from '@/types/event';

export function timeRange(o: Pick<EventOccurrence, 'start' | 'end'>): string {
  if (isSameDay(o.start, o.end)) return `${format(o.start, 'h:mm a')} – ${format(o.end, 'h:mm a')}`;
  return `${format(o.start, 'd MMM, h:mm a')} – ${format(o.end, 'd MMM, h:mm a')}`;
}

interface AgendaItemProps {
  occurrence: EventOccurrence;
  category?: Category;
  onPress: () => void;
  showDate?: boolean;
}

export function AgendaItem({ occurrence: o, category, onPress, showDate = false }: AgendaItemProps) {
  const { colors } = useTheme();
  const when = showDate ? `${format(o.start, 'EEE d MMM')} · ${timeRange(o)}` : timeRange(o);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${o.title}, ${when}${o.location ? `, at ${o.location}` : ''}${o.isRecurring ? ', repeating' : ''}`}
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        { backgroundColor: colors.surface, borderColor: colors.border, opacity: pressed ? 0.85 : 1 },
      ]}>
      <View style={[styles.bar, { backgroundColor: category?.colorHex ?? colors.border }]} />
      <View style={styles.content}>
        <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>
          {o.title}
        </Text>
        <Text style={[styles.meta, { color: colors.textMuted }]}>{when}</Text>
        <View style={styles.tags}>
          {category ? <Text style={[styles.tag, { color: colors.textMuted }]}>{category.name}</Text> : null}
          {o.location ? (
            <View style={styles.inline}>
              <MapPin size={12} color={colors.textMuted} />
              <Text style={[styles.tag, { color: colors.textMuted }]} numberOfLines={1}>
                {o.location}
              </Text>
            </View>
          ) : null}
          {o.isRecurring ? <Repeat size={12} color={colors.textMuted} /> : null}
          {o.notificationOffsetMinutes !== null ? <Bell size={12} color={colors.textMuted} /> : null}
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    borderWidth: 1,
    borderRadius: RADIUS.md,
    overflow: 'hidden',
    marginBottom: SPACING.sm,
  },
  bar: {
    width: 5,
  },
  content: {
    flex: 1,
    padding: SPACING.md,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
  },
  meta: {
    fontSize: 12.5,
    marginTop: 2,
  },
  tags: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginTop: SPACING.xs,
  },
  inline: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    flexShrink: 1,
  },
  tag: {
    fontSize: 11.5,
  },
});

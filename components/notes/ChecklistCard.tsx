import { CheckCircle2 } from 'lucide-react-native';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { ProgressBar } from '@/components/common/ProgressBar';
import { RADIUS, SPACING } from '@/constants/appConfig';
import { useTheme } from '@/hooks/useTheme';
import { completionPercent, isComplete } from '@/services/checklistService';
import type { ChecklistSummary } from '@/types/checklist';

interface ChecklistCardProps {
  checklist: ChecklistSummary;
  onPress: () => void;
}

export function ChecklistCard({ checklist, onPress }: ChecklistCardProps) {
  const { colors } = useTheme();
  const percent = completionPercent(checklist.completedItems, checklist.totalItems);
  const complete = isComplete(checklist);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Checklist: ${checklist.title}, ${checklist.completedItems} of ${checklist.totalItems} done`}
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        { backgroundColor: colors.surface, borderColor: colors.border, opacity: pressed ? 0.85 : 1 },
      ]}>
      <View style={styles.titleRow}>
        <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>
          {checklist.title}
        </Text>
        {complete ? (
          <View style={styles.badge}>
            <CheckCircle2 size={14} color={colors.accent} />
            <Text style={[styles.badgeText, { color: colors.accent }]}>Completed</Text>
          </View>
        ) : null}
      </View>
      <ProgressBar percent={percent} />
      <Text style={[styles.meta, { color: colors.textMuted }]}>
        {checklist.totalItems === 0
          ? 'No items yet'
          : `${checklist.completedItems}/${checklist.totalItems} done · ${percent}%`}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    gap: SPACING.sm,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  title: {
    flex: 1,
    fontSize: 15,
    fontWeight: '700',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  meta: {
    fontSize: 12,
  },
});

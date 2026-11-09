import * as Clipboard from 'expo-clipboard';
import { Stack } from 'expo-router';
import { Check, Copy, History, X } from 'lucide-react-native';
import React, { useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/common/Button';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { EmptyState } from '@/components/common/EmptyState';
import { RADIUS, SPACING } from '@/constants/appConfig';
import { useCalculationHistory } from '@/hooks/useCalculationHistory';
import { useTheme } from '@/hooks/useTheme';
import { clearHistory, deleteEntry } from '@/services/calculationHistoryService';
import type { CalculationRecord } from '@/types/calculation';
import { formatRelativeUpdated } from '@/utils/dateUtils';

export default function CalculationHistoryScreen() {
  const { colors } = useTheme();
  const { entries, loading, error, reload } = useCalculationHistory();
  const [confirmingClear, setConfirmingClear] = useState(false);
  const [copiedId, setCopiedId] = useState<number | null>(null);

  const copy = async (entry: CalculationRecord) => {
    await Clipboard.setStringAsync(entry.resultValue.replace('−', '-'));
    setCopiedId(entry.id);
  };

  const remove = async (id: number) => {
    await deleteEntry(id);
    await reload();
  };

  const clearAll = async () => {
    setConfirmingClear(false);
    await clearHistory();
    await reload();
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen
        options={{
          title: 'History',
          headerRight: () =>
            entries.length > 0 ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Clear history"
                onPress={() => setConfirmingClear(true)}
                hitSlop={8}
                style={styles.headerAction}>
                <Text style={[styles.headerActionText, { color: colors.danger }]}>Clear</Text>
              </Pressable>
            ) : null,
        }}
      />
      {error ? (
        <View style={styles.center}>
          <Text style={[styles.error, { color: colors.danger }]}>{"Couldn't load history."}</Text>
          <Button label="Try again" variant="secondary" onPress={reload} />
        </View>
      ) : loading && entries.length === 0 ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.accent} />
        </View>
      ) : (
        <FlatList
          data={entries}
          keyExtractor={(e) => String(e.id)}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <EmptyState
              icon={History}
              title="No calculations yet"
              description="Every result you calculate with = appears here."
            />
          }
          renderItem={({ item }) => (
            <View style={[styles.row, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={styles.rowText}>
                <Text style={[styles.type, { color: colors.accent }]}>
                  {formatRelativeUpdated(item.createdAt)}
                </Text>
                <Text style={[styles.summary, { color: colors.text }]}>{item.resultSummary}</Text>
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Copy ${item.resultValue}`}
                onPress={() => copy(item)}
                hitSlop={8}
                style={styles.icon}>
                {copiedId === item.id ? <Check size={18} color={colors.accent} /> : <Copy size={18} color={colors.textMuted} />}
              </Pressable>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Delete entry: ${item.resultSummary}`}
                onPress={() => remove(item.id)}
                hitSlop={8}
                style={styles.icon}>
                <X size={18} color={colors.textMuted} />
              </Pressable>
            </View>
          )}
        />
      )}
      <ConfirmDialog
        visible={confirmingClear}
        title="Clear all history?"
        message="Every saved calculation will be removed. This can't be undone."
        confirmLabel="Clear"
        destructive
        onConfirm={clearAll}
        onCancel={() => setConfirmingClear(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  list: {
    flexGrow: 1,
    padding: SPACING.lg,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.md,
  },
  error: {
    fontSize: 14,
    fontWeight: '600',
  },
  headerAction: {
    padding: SPACING.sm,
  },
  headerActionText: {
    fontSize: 15,
    fontWeight: '600',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    gap: SPACING.sm,
  },
  rowText: {
    flex: 1,
  },
  type: {
    fontSize: 11.5,
    fontWeight: '700',
    marginBottom: 2,
  },
  summary: {
    fontSize: 14,
    lineHeight: 19,
  },
  icon: {
    padding: SPACING.xs,
  },
});

import { Stack, router, type Href } from 'expo-router';
import { ListChecks, Search, SearchX } from 'lucide-react-native';
import React, { useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { Button } from '@/components/common/Button';
import { Chip } from '@/components/common/Chip';
import { EmptyState } from '@/components/common/EmptyState';
import { FloatingActionButton } from '@/components/common/FloatingActionButton';
import { SegmentedControl } from '@/components/common/SegmentedControl';
import { TaskRow } from '@/components/tasks/TaskRow';
import { RADIUS, SPACING } from '@/constants/appConfig';
import { useTasks } from '@/hooks/useTasks';
import { useTheme } from '@/hooks/useTheme';
import * as taskService from '@/services/taskService';
import type { TaskSort, TaskStatusFilter } from '@/services/taskService';

const STATUSES: { value: TaskStatusFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'pending', label: 'Pending' },
  { value: 'overdue', label: 'Overdue' },
  { value: 'completed', label: 'Completed' },
];
const SORTS = [
  { value: 'deadline', label: 'By deadline' },
  { value: 'priority', label: 'By priority' },
] as const;

const openTask = (id: number) => router.push(`/tasks/task-details?id=${id}` as Href);

export default function TasksScreen() {
  const { colors } = useTheme();
  const { tasks, loading, error, reload } = useTasks();
  const [status, setStatus] = useState<TaskStatusFilter>('pending');
  const [sort, setSort] = useState<TaskSort>('deadline');
  const [search, setSearch] = useState('');
  const now = new Date();

  const visible = useMemo(
    () => taskService.sortTasks(taskService.filterTasks(tasks, status, search), sort),
    [tasks, status, search, sort],
  );
  const counts = useMemo(() => taskService.summarizeTasks(tasks), [tasks]);

  const toggle = async (id: number, completed: boolean) => {
    await taskService.setTaskCompleted(id, !completed);
    await reload();
  };

  const filtered = status !== 'all' || search.trim() !== '';

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen options={{ title: 'Tasks' }} />
      <View style={[styles.searchBox, { borderColor: colors.border, backgroundColor: colors.surface }]}>
        <Search size={18} color={colors.textMuted} />
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Search tasks"
          placeholderTextColor={colors.textMuted}
          accessibilityLabel="Search tasks"
          style={[styles.searchInput, { color: colors.text }]}
        />
      </View>
      <View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters} keyboardShouldPersistTaps="handled">
          {STATUSES.map((s) => (
            <Chip
              key={s.value}
              label={s.value === 'overdue' && counts.overdue > 0 ? `${s.label} (${counts.overdue})` : s.label}
              selected={status === s.value}
              onPress={() => setStatus(s.value)}
            />
          ))}
        </ScrollView>
      </View>
      <View style={styles.sort}>
        <SegmentedControl options={SORTS} value={sort} onChange={setSort} />
      </View>

      {error ? (
        <View style={styles.center}>
          <Text style={[styles.error, { color: colors.danger }]}>{"Couldn't load tasks."}</Text>
          <Button label="Try again" variant="secondary" onPress={reload} />
        </View>
      ) : loading && tasks.length === 0 ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.accent} />
        </View>
      ) : (
        <FlatList
          data={visible}
          keyExtractor={(t) => String(t.id)}
          contentContainerStyle={styles.list}
          keyboardShouldPersistTaps="handled"
          renderItem={({ item }) => (
            <TaskRow task={item} now={now} onToggle={() => toggle(item.id, item.isCompleted)} onPress={() => openTask(item.id)} />
          )}
          ListEmptyComponent={
            tasks.length > 0 && filtered ? (
              <EmptyState icon={SearchX} title="No matching tasks" description="Try another filter or search." />
            ) : (
              <EmptyState
                icon={ListChecks}
                title="No tasks yet"
                description="Add what you need to get done, with an optional deadline."
                actionLabel="Add a task"
                onAction={() => router.push('/tasks/add-task' as Href)}
              />
            )
          }
        />
      )}
      <FloatingActionButton accessibilityLabel="Add task" onPress={() => router.push('/tasks/add-task' as Href)} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginHorizontal: SPACING.lg,
    marginTop: SPACING.md,
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
    paddingTop: SPACING.md,
  },
  sort: {
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
  },
  error: {
    fontSize: 14,
    fontWeight: '600',
  },
});

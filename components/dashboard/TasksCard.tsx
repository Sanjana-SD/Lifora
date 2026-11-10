import { router, type Href } from 'expo-router';
import { ListChecks } from 'lucide-react-native';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { TaskRow } from '@/components/tasks/TaskRow';
import { SPACING } from '@/constants/appConfig';
import { useTasks } from '@/hooks/useTasks';
import { useTheme } from '@/hooks/useTheme';
import { setTaskCompleted, sortTasks, summarizeTasks } from '@/services/taskService';
import { AddLink } from './AddLink';
import { DashboardSection } from './DashboardSection';

const SHOWN = 3;

export function TasksCard() {
  const { colors } = useTheme();
  const { tasks, error, reload } = useTasks();
  const now = new Date();
  const summary = summarizeTasks(tasks, now);
  const next = sortTasks(tasks.filter((t) => !t.isCompleted), 'deadline').slice(0, SHOWN);

  const stats = [
    { label: 'Pending', value: summary.pending, danger: false },
    { label: 'Overdue', value: summary.overdue, danger: summary.overdue > 0 },
    { label: 'Done today', value: summary.completedToday, danger: false },
  ];

  return (
    <DashboardSection icon={ListChecks} title="Tasks" onPress={() => router.push('/tasks/index' as Href)}>
      {error ? (
        <Text style={[styles.empty, { color: colors.danger }]}>{"Couldn't load tasks."}</Text>
      ) : tasks.length === 0 ? (
        <Text style={[styles.empty, { color: colors.textMuted }]}>No tasks yet — pending and completed will show up here.</Text>
      ) : (
        <>
          <View style={styles.stats}>
            {stats.map((s) => (
              <View key={s.label} style={styles.stat} accessible accessibilityLabel={`${s.value} ${s.label.toLowerCase()}`}>
                <Text style={[styles.statValue, { color: s.danger ? colors.danger : colors.text }]}>{s.value}</Text>
                <Text style={[styles.statLabel, { color: colors.textMuted }]}>{s.label}</Text>
              </View>
            ))}
          </View>
          {next.map((t) => (
            <TaskRow
              key={t.id}
              task={t}
              now={now}
              onToggle={async () => {
                await setTaskCompleted(t.id, true);
                await reload();
              }}
              onPress={() => router.push(`/tasks/task-details?id=${t.id}` as Href)}
            />
          ))}
        </>
      )}
      <AddLink label="Add a task" onPress={() => router.push('/tasks/add-task' as Href)} />
    </DashboardSection>
  );
}

const styles = StyleSheet.create({
  empty: {
    fontSize: 13,
    lineHeight: 18,
  },
  stats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.sm,
  },
  stat: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '800',
  },
  statLabel: {
    fontSize: 11,
  },
});

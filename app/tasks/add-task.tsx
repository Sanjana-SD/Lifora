import { Stack, router } from 'expo-router';
import React, { useState } from 'react';

import { TaskForm } from '@/components/tasks/TaskForm';
import { createTask } from '@/services/taskService';
import type { TaskDraft } from '@/types/task';

export default function AddTaskScreen() {
  const [initial] = useState<TaskDraft>({
    title: '',
    description: '',
    deadline: null,
    deadlineHasTime: false,
    notify: false,
    priority: 'medium',
    categoryId: null,
  });

  return (
    <>
      <Stack.Screen options={{ title: 'New Task' }} />
      <TaskForm
        initial={initial}
        submitLabel="Save task"
        onSubmit={async (draft) => {
          await createTask(draft);
          router.back();
        }}
      />
    </>
  );
}

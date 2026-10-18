import { Badge, Group, Paper, Stack, Text } from '@mantine/core';
import { IconNotes } from '@tabler/icons-react';
import dayjs from 'dayjs';
import { useNavigate } from 'react-router-dom';
import type { TaskStatus } from '../hooks';
import { recurrenceLabels } from '../period';
import { TaskSlots } from './TaskSlots';

export function TaskRow({ status, showRecurrence = true }: { status: TaskStatus; showRecurrence?: boolean }) {
  const navigate = useNavigate();
  const { task, period, doneCount, completed } = status;
  const overdue = task.recurrence === 'once' && !completed && task.dueDate && dayjs(task.dueDate).isBefore(dayjs(), 'day');

  return (
    <Paper
      withBorder
      p="sm"
      style={{ cursor: 'pointer', opacity: completed ? 0.6 : 1 }}
      onClick={() => navigate(`/tasks/${task.id}`)}
    >
      <Group wrap="nowrap" gap="sm" align="center">
        <TaskSlots status={status} />
        <Stack gap={2} style={{ flex: 1, minWidth: 0 }}>
          <Group gap={6} wrap="nowrap">
            <Text fw={500} truncate td={completed ? 'line-through' : undefined}>
              {task.title}
            </Text>
            {task.note.trim() && <IconNotes size={14} style={{ flexShrink: 0, opacity: 0.5 }} aria-label="メモあり" />}
          </Group>
          <Group gap={6}>
            {showRecurrence && (
              <Badge size="xs" variant="light">
                {recurrenceLabels[task.recurrence]}
              </Badge>
            )}
            {task.recurrence !== 'once' && (
              <Text size="xs" c="dimmed">
                {period.label}
              </Text>
            )}
            {task.timesPerPeriod > 1 && (
              <Text size="xs" c="dimmed">
                {doneCount}/{task.timesPerPeriod}回
              </Text>
            )}
            {task.dueDate && (
              <Text size="xs" c={overdue ? 'red.5' : 'dimmed'}>
                期限 {dayjs(task.dueDate).format('M/D')}
              </Text>
            )}
            {status.previousMissed && !completed && (
              <Badge size="xs" color="orange" variant="light">
                前回未完了
              </Badge>
            )}
            {status.missingNumberTypeIds.length > 0 && (
              <Badge size="xs" color="orange" variant="outline">
                番号未記録
              </Badge>
            )}
            {task.archived && (
              <Badge size="xs" color="gray" variant="outline">
                アーカイブ
              </Badge>
            )}
            {task.tags.map((t) => (
              <Badge key={t} size="xs" variant="dot" color="gray">
                {t}
              </Badge>
            ))}
          </Group>
        </Stack>
      </Group>
    </Paper>
  );
}

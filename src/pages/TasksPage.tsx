import { Button, Group, SegmentedControl, ScrollArea, Stack, Switch, Text, TextInput, Title } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconListCheck, IconPlus, IconSearch } from '@tabler/icons-react';
import { useState } from 'react';
import { PageHeader } from '@/components/common/PageHeader';
import { EmptyState } from '@/components/common/EmptyState';
import type { Recurrence } from '@/db/types';
import { useTaskStatuses } from '@/features/tasks/hooks';
import { recurrenceLabels, recurrenceOrder } from '@/features/tasks/period';
import { TaskRow } from '@/features/tasks/components/TaskRow';
import { TaskFormModal } from '@/features/tasks/components/TaskFormModal';
import { groupBy } from '@/lib/collections';

type Filter = 'all' | Recurrence;

export function TasksPage() {
  const [opened, { open, close }] = useDisclosure(false);
  const [filter, setFilter] = useState<Filter>('all');
  const [query, setQuery] = useState('');
  const [showArchived, setShowArchived] = useState(false);
  const statuses = useTaskStatuses({ includeArchived: showArchived });

  const q = query.trim().toLowerCase();
  const visible = (statuses ?? []).filter(
    (s) =>
      (filter === 'all' || s.task.recurrence === filter) &&
      (!q || s.task.title.toLowerCase().includes(q) || s.task.note.toLowerCase().includes(q) || s.task.tags.some((t) => t.toLowerCase().includes(q))),
  );
  const groups = groupBy(visible, (s) => s.task.recurrence);

  return (
    <>
      <PageHeader
        title="タスク"
        description="実施してもリストからは消えず、次の期間で再び未実施に戻ります"
        actions={
          <Button leftSection={<IconPlus size={16} />} onClick={open}>
            追加
          </Button>
        }
      />
      <Stack gap="sm" mb="md">
        <ScrollArea type="never">
          <SegmentedControl
            value={filter}
            onChange={(v) => setFilter(v as Filter)}
            data={[{ value: 'all', label: 'すべて' }, ...recurrenceOrder.map((r) => ({ value: r, label: recurrenceLabels[r] }))]}
          />
        </ScrollArea>
        <Group gap="sm" wrap="nowrap">
          <TextInput
            style={{ flex: 1 }}
            placeholder="タスク名・中身・タグで検索"
            leftSection={<IconSearch size={16} />}
            value={query}
            onChange={(e) => setQuery(e.currentTarget.value)}
          />
          <Switch label="アーカイブ" checked={showArchived} onChange={(e) => setShowArchived(e.currentTarget.checked)} />
        </Group>
      </Stack>

      {statuses && statuses.length === 0 ? (
        <EmptyState
          icon={<IconListCheck size={26} stroke={1.5} />}
          title="タスクがまだありません"
          description="毎日・毎週・毎月など、繰り返し行う作業を登録しましょう"
          action={
            <Button mt="xs" leftSection={<IconPlus size={16} />} onClick={open}>
              最初のタスクを追加
            </Button>
          }
        />
      ) : visible.length === 0 && statuses ? (
        <Text c="dimmed" size="sm">
          条件に一致するタスクはありません
        </Text>
      ) : (
        <Stack gap="lg">
          {recurrenceOrder
            .filter((r) => groups.has(r))
            .map((r) => {
              const list = groups.get(r)!;
              const done = list.filter((s) => s.completed).length;
              return (
                <Stack key={r} gap="xs">
                  <Group gap="xs">
                    <Title order={3} size="h5">
                      {recurrenceLabels[r]}
                    </Title>
                    <Text size="xs" c="dimmed">
                      {done}/{list.length} 完了
                    </Text>
                  </Group>
                  {list.map((s) => (
                    <TaskRow key={s.task.id} status={s} showRecurrence={false} />
                  ))}
                </Stack>
              );
            })}
        </Stack>
      )}
      <TaskFormModal opened={opened} onClose={close} />
    </>
  );
}

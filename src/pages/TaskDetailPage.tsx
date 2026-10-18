import { ActionIcon, Badge, Button, Card, Group, Menu, Stack, Text, Timeline, Title } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { modals } from '@mantine/modals';
import { notifications } from '@mantine/notifications';
import { IconArchive, IconArrowLeft, IconCheck, IconDots, IconEdit, IconRestore, IconTrash } from '@tabler/icons-react';
import dayjs from 'dayjs';
import { useLiveQuery } from 'dexie-react-hooks';
import { useNavigate, useParams } from 'react-router-dom';
import { Markdown } from '@/components/common/Markdown';
import { db } from '@/db/db';
import { useTaskStatus } from '@/features/tasks/hooks';
import { daysLeft, labelOfPeriodKey, recurrenceLabels } from '@/features/tasks/period';
import { deleteTask, updateTask } from '@/features/tasks/repository';
import { TaskSlots } from '@/features/tasks/components/TaskSlots';
import { TaskFormModal } from '@/features/tasks/components/TaskFormModal';
import { groupBy } from '@/lib/collections';

const HISTORY_LIMIT = 60;

export function TaskDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const status = useTaskStatus(id);
  const [editing, { open: openEdit, close: closeEdit }] = useDisclosure(false);
  const history = useLiveQuery(
    () => (id ? db.completions.where('taskId').equals(id).reverse().sortBy('doneAt') : []),
    [id],
  );

  if (status === undefined) return null;
  if (status === null) {
    return (
      <Stack align="flex-start">
        <Text>タスクが見つかりません。</Text>
        <Button variant="default" onClick={() => navigate('/tasks')}>
          タスク一覧へ
        </Button>
      </Stack>
    );
  }

  const { task, period, doneCount, completed } = status;
  const recent = (history ?? []).slice(0, HISTORY_LIMIT);
  const byPeriod = groupBy(recent, (c) => c.periodKey);

  const confirmDelete = () =>
    modals.openConfirmModal({
      title: 'タスクを削除しますか?',
      children: (
        <Text size="sm">
          「{task.title}」と実施記録が削除されます。記録した番号は残ります。
          使わなくなっただけなら「アーカイブ」がおすすめです。
        </Text>
      ),
      labels: { confirm: '削除する', cancel: 'キャンセル' },
      confirmProps: { color: 'red' },
      onConfirm: async () => {
        await deleteTask(task.id);
        notifications.show({ message: 'タスクを削除しました' });
        navigate('/tasks');
      },
    });

  const toggleArchive = async () => {
    await updateTask(task.id, { archived: !task.archived });
    notifications.show({ message: task.archived ? 'アーカイブを解除しました' : 'アーカイブしました' });
  };

  return (
    <Stack gap="md" maw={820}>
      <Group justify="space-between" wrap="nowrap">
        <Button variant="subtle" color="gray" leftSection={<IconArrowLeft size={16} />} onClick={() => navigate(-1)} px={4}>
          戻る
        </Button>
        <Group gap="xs" wrap="nowrap">
          <Button variant="default" leftSection={<IconEdit size={16} />} onClick={openEdit}>
            編集
          </Button>
          <Menu position="bottom-end">
            <Menu.Target>
              <ActionIcon variant="default" size="lg" aria-label="その他の操作">
                <IconDots size={18} />
              </ActionIcon>
            </Menu.Target>
            <Menu.Dropdown>
              <Menu.Item leftSection={task.archived ? <IconRestore size={16} /> : <IconArchive size={16} />} onClick={toggleArchive}>
                {task.archived ? 'アーカイブ解除' : 'アーカイブ'}
              </Menu.Item>
              <Menu.Item color="red" leftSection={<IconTrash size={16} />} onClick={confirmDelete}>
                削除
              </Menu.Item>
            </Menu.Dropdown>
          </Menu>
        </Group>
      </Group>

      <Card>
        <Stack gap="sm">
          <Group gap="xs">
            <Badge variant="light">{recurrenceLabels[task.recurrence]}</Badge>
            {task.timesPerPeriod > 1 && <Badge variant="outline">{task.timesPerPeriod}回</Badge>}
            {task.archived && (
              <Badge color="gray" variant="outline">
                アーカイブ
              </Badge>
            )}
            {task.tags.map((t) => (
              <Badge key={t} variant="dot" color="gray">
                {t}
              </Badge>
            ))}
          </Group>
          <Title order={2} size="h3">
            {task.title}
          </Title>
          <Group justify="space-between" wrap="wrap">
            <Text size="sm" c="dimmed">
              {task.recurrence === 'once'
                ? task.dueDate
                  ? `期限 ${dayjs(task.dueDate).format('YYYY/M/D')}`
                  : '期限なし'
                : `今の期間: ${period.label}(残り${daysLeft(period, dayjs())}日)・${doneCount}/${task.timesPerPeriod}回`}
            </Text>
            <Group gap="xs">
              {completed && (
                <Badge color="sage" leftSection={<IconCheck size={12} />}>
                  完了
                </Badge>
              )}
              <TaskSlots status={status} />
            </Group>
          </Group>
        </Stack>
      </Card>

      <Card>
        <Title order={3} size="h5" mb="xs">
          中身
        </Title>
        {task.note.trim() ? (
          <Markdown>{task.note}</Markdown>
        ) : (
          <Text size="sm" c="dimmed">
            手順やメモはまだありません。「編集」から追加できます。
          </Text>
        )}
      </Card>

      <Card>
        <Title order={3} size="h5" mb="sm">
          実施履歴
        </Title>
        {recent.length === 0 ? (
          <Text size="sm" c="dimmed">
            まだ実施記録はありません
          </Text>
        ) : (
          <Timeline bulletSize={18} lineWidth={2} active={byPeriod.size}>
            {[...byPeriod.entries()].map(([key, list]) => (
              <Timeline.Item key={key} bullet={<IconCheck size={11} />} title={<Text size="sm">{labelOfPeriodKey(key)}</Text>}>
                <Text size="xs" c="dimmed">
                  {list
                    .map((c) => dayjs(c.doneAt).format('M/D HH:mm'))
                    .reverse()
                    .join('、')}
                  {task.timesPerPeriod > 1 && `(${list.length}/${task.timesPerPeriod}回)`}
                </Text>
              </Timeline.Item>
            ))}
          </Timeline>
        )}
      </Card>

      <TaskFormModal opened={editing} onClose={closeEdit} task={task} />
    </Stack>
  );
}

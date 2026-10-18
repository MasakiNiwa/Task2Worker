import { ActionIcon, Badge, Button, Card, Group, Menu, SimpleGrid, Stack, Text, Timeline, Title } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { modals } from '@mantine/modals';
import { notifications } from '@mantine/notifications';
import { IconAlertTriangle, IconArchive, IconArrowLeft, IconCheck, IconDots, IconEdit, IconPlus, IconRestore, IconTrash } from '@tabler/icons-react';
import { useNumberTypeMap } from '@/features/numbers/hooks';
import { NumberRecordRow } from '@/features/numbers/components/NumberRecordRow';
import { useNumberRecordEditor } from '@/features/numbers/components/useNumberRecordEditor';
import dayjs from 'dayjs';
import { useLiveQuery } from 'dexie-react-hooks';
import { useNavigate, useParams } from 'react-router-dom';
import { Markdown } from '@/components/common/Markdown';
import { db } from '@/db/db';
import { usePeriodSettings, useTaskStatus, useToday } from '@/features/tasks/hooks';
import { streakOf } from '@/features/tasks/stats';
import { ActivityHeatmap } from '@/components/common/ActivityHeatmap';
import { daysLeft, labelOfPeriodKey, logicalDate, recurrenceLabels } from '@/features/tasks/period';
import { deleteTask, updateTask } from '@/features/tasks/repository';
import { TaskSlots } from '@/features/tasks/components/TaskSlots';
import { TaskFormModal } from '@/features/tasks/components/TaskFormModal';
import { groupBy } from '@/lib/collections';

const HISTORY_LIMIT = 60;

export function TaskDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const status = useTaskStatus(id);
  const today = useToday();
  const settings = usePeriodSettings();
  const [editing, { open: openEdit, close: closeEdit }] = useDisclosure(false);
  const typeMap = useNumberTypeMap();
  const numberEditor = useNumberRecordEditor();
  const numberRecords = useLiveQuery(
    () => (id ? db.numberRecords.where('taskId').equals(id).reverse().sortBy('date') : []),
    [id],
  );
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
  const all = history ?? [];
  const recent = all.slice(0, HISTORY_LIMIT);
  const streak = streakOf(task, all, today, settings);
  const dailyCounts = new Map<string, number>();
  for (const c of all) {
    const key = logicalDate(c.doneAt, settings).format('YYYY-MM-DD');
    dailyCounts.set(key, (dailyCounts.get(key) ?? 0) + 1);
  }
  const lastDone = all[0]?.doneAt;
  const unit = task.recurrence === 'daily' ? '日' : task.recurrence === 'weekly' ? '週' : task.recurrence === 'monthly' ? 'か月' : task.recurrence === 'quarterly' ? '四半期' : '年';
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
                : `今の期間: ${period.label}(残り${daysLeft(period, today)}日)・${doneCount}/${task.timesPerPeriod}回`}
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

      {(task.numberTypeIds.length > 0 || (numberRecords?.length ?? 0) > 0) && (
        <Card>
          <Group justify="space-between" mb="sm">
            <Title order={3} size="h5">
              番号
            </Title>
            <Button
              size="xs"
              variant="light"
              leftSection={<IconPlus size={14} />}
              onClick={() =>
                numberEditor.openNew({
                  taskId: task.id,
                  periodKey: period.key,
                  typeId: status.missingNumberTypeIds[0] ?? task.numberTypeIds[0],
                })
              }
            >
              記録
            </Button>
          </Group>
          {status.missingNumberTypeIds.length > 0 && (
            <Group gap={6} mb="sm" c="orange.5">
              <IconAlertTriangle size={16} />
              <Text size="sm">
                今の期間の{status.missingNumberTypeIds.map((t) => typeMap.get(t)?.name ?? '番号').join('・')}
                がまだ記録されていません
              </Text>
            </Group>
          )}
          <Stack gap="xs">
            {(numberRecords ?? []).slice(0, 20).map((r) => (
              <NumberRecordRow
                key={r.id}
                record={r}
                type={typeMap.get(r.typeId)}
                task={task}
                onEdit={numberEditor.openEdit}
                onReuse={numberEditor.openReuse}
              />
            ))}
            {numberRecords?.length === 0 && (
              <Text size="sm" c="dimmed">
                まだ番号は記録されていません
              </Text>
            )}
          </Stack>
        </Card>
      )}

      <Card>
        <Title order={3} size="h5" mb="sm">
          実績
        </Title>
        <SimpleGrid cols={3} mb="md">
          {[
            { label: '連続達成', value: task.recurrence === 'once' ? '—' : `${streak}${unit}` },
            { label: '累計実施', value: `${all.length}回` },
            { label: '最終実施', value: lastDone ? dayjs(lastDone).format('M/D HH:mm') : '—' },
          ].map((m) => (
            <Stack key={m.label} gap={0}>
              <Text size="xs" c="dimmed">
                {m.label}
              </Text>
              <Text fw={600} size="md">
                {m.value}
              </Text>
            </Stack>
          ))}
        </SimpleGrid>
        <ActivityHeatmap counts={dailyCounts} today={today} weekStartsOn={settings.weekStartsOn} />
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
                {(numberRecords ?? [])
                  .filter((r) => r.periodKey === key)
                  .map((r) => (
                    <Text key={r.id} size="xs" ff="monospace">
                      {typeMap.get(r.typeId)?.name ?? '番号'}: {r.value}
                    </Text>
                  ))}
              </Timeline.Item>
            ))}
          </Timeline>
        )}
      </Card>

      <TaskFormModal opened={editing} onClose={closeEdit} task={task} />
      {numberEditor.modal}
    </Stack>
  );
}

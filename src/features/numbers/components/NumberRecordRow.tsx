import { ActionIcon, Anchor, Badge, Group, Menu, Paper, Stack, Text } from '@mantine/core';
import { modals } from '@mantine/modals';
import { IconDots, IconEdit, IconRepeat, IconTrash } from '@tabler/icons-react';
import dayjs from 'dayjs';
import { Link } from 'react-router-dom';
import type { NumberRecord, NumberType, Task } from '@/db/types';
import { labelOfPeriodKey } from '@/features/tasks/period';
import { deleteNumberRecord } from '../repository';
import { CopyNumberButton } from './CopyNumberButton';

interface Props {
  record: NumberRecord;
  type?: NumberType;
  task?: Task;
  showType?: boolean;
  onEdit: (r: NumberRecord) => void;
  onReuse: (r: NumberRecord) => void;
}

export function NumberRecordRow({ record, type, task, showType = true, onEdit, onReuse }: Props) {
  const confirmDelete = () =>
    modals.openConfirmModal({
      title: '番号の記録を削除しますか?',
      children: <Text size="sm">「{record.value}」の記録を削除します。</Text>,
      labels: { confirm: '削除する', cancel: 'キャンセル' },
      confirmProps: { color: 'red' },
      onConfirm: () => deleteNumberRecord(record.id),
    });

  return (
    <Paper withBorder p="sm">
      <Group wrap="nowrap" align="flex-start" gap="xs">
        <Stack gap={2} style={{ flex: 1, minWidth: 0 }}>
          <Group gap={4} wrap="nowrap">
            <Text ff="monospace" fw={600} size="md" truncate>
              {record.value}
            </Text>
            <CopyNumberButton value={record.value} />
          </Group>
          <Group gap={6}>
            {showType && type && (
              <Badge size="xs" variant="light">
                {type.name}
              </Badge>
            )}
            <Text size="xs" c="dimmed">
              {dayjs(record.date).format('YYYY/M/D')}
            </Text>
            {task && (
              <Anchor component={Link} to={`/tasks/${task.id}`} size="xs">
                {task.title}
                {record.periodKey && record.periodKey !== 'once' && `(${labelOfPeriodKey(record.periodKey)})`}
              </Anchor>
            )}
          </Group>
          {record.memo && (
            <Text size="xs" c="dimmed" style={{ whiteSpace: 'pre-wrap' }}>
              {record.memo}
            </Text>
          )}
        </Stack>
        <Menu position="bottom-end">
          <Menu.Target>
            <ActionIcon variant="subtle" color="gray" aria-label="操作">
              <IconDots size={16} />
            </ActionIcon>
          </Menu.Target>
          <Menu.Dropdown>
            <Menu.Item leftSection={<IconEdit size={16} />} onClick={() => onEdit(record)}>
              編集
            </Menu.Item>
            <Menu.Item leftSection={<IconRepeat size={16} />} onClick={() => onReuse(record)}>
              この番号で新しく記録
            </Menu.Item>
            <Menu.Item color="red" leftSection={<IconTrash size={16} />} onClick={confirmDelete}>
              削除
            </Menu.Item>
          </Menu.Dropdown>
        </Menu>
      </Group>
    </Paper>
  );
}

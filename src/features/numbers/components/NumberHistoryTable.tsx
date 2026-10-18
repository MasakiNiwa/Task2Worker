import { Anchor, Button, Group, Table, Text } from '@mantine/core';
import { modals } from '@mantine/modals';
import { Link } from 'react-router-dom';
import type { NumberRecord, NumberType, Task } from '@/db/types';
import { labelOfPeriodKey } from '@/features/tasks/period';
import { deleteNumberRecord } from '../repository';
import { CopyNumberButton } from './CopyNumberButton';

export function NumberHistoryTable({
  records,
  types,
  tasks,
  onEdit,
  onReuse,
}: {
  records: NumberRecord[];
  types: Map<string, NumberType>;
  tasks: Map<string, Task>;
  onEdit: (r: NumberRecord) => void;
  onReuse: (r: NumberRecord) => void;
}) {
  return (
    <Table.ScrollContainer minWidth={850}>
      <Table striped highlightOnHover withTableBorder>
        <Table.Thead>
          <Table.Tr>
            {['日付', 'タスク / 対象期間', '種類', '番号', 'メモ', '操作'].map((h) => (
              <Table.Th key={h}>{h}</Table.Th>
            ))}
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {records.map((r) => (
            <Table.Tr key={r.id}>
              <Table.Td style={{ whiteSpace: 'nowrap' }}>{r.date}</Table.Td>
              <Table.Td>
                {r.taskId && tasks.has(r.taskId) ? (
                  <Anchor component={Link} to={`/tasks/${r.taskId}`}>
                    {tasks.get(r.taskId)!.title}
                  </Anchor>
                ) : (
                  '関連タスクなし'
                )}
                {r.periodKey && (
                  <Text size="xs" c="dimmed">
                    {labelOfPeriodKey(r.periodKey)}
                  </Text>
                )}
              </Table.Td>
              <Table.Td>{types.get(r.typeId)?.name ?? '削除された種類'}</Table.Td>
              <Table.Td>
                <Group gap={4} wrap="nowrap">
                  <Text ff="monospace" style={{ overflowWrap: 'anywhere' }}>
                    {r.value}
                  </Text>
                  <CopyNumberButton value={r.value} />
                </Group>
              </Table.Td>
              <Table.Td maw={260} style={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>
                {r.memo}
              </Table.Td>
              <Table.Td>
                <Group gap={4}>
                  <Button size="compact-xs" variant="subtle" onClick={() => onEdit(r)}>
                    編集
                  </Button>
                  <Button size="compact-xs" variant="subtle" onClick={() => onReuse(r)}>
                    再利用
                  </Button>
                  <Button
                    size="compact-xs"
                    variant="subtle"
                    color="red"
                    onClick={() =>
                      modals.openConfirmModal({
                        title: '番号の記録を削除しますか?',
                        children: <Text>「{r.value}」の記録を削除します。</Text>,
                        labels: { confirm: '削除する', cancel: 'キャンセル' },
                        confirmProps: { color: 'red' },
                        onConfirm: () => deleteNumberRecord(r.id),
                      })
                    }
                  >
                    削除
                  </Button>
                </Group>
              </Table.Td>
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>
    </Table.ScrollContainer>
  );
}

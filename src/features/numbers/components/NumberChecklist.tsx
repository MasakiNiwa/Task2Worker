import { Anchor, Badge, Button, Group, Select, Stack, Switch, Table, Text, TextInput } from '@mantine/core';
import dayjs from 'dayjs';
import { useLiveQuery } from 'dexie-react-hooks';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { db } from '@/db/db';
import type { NumberType } from '@/db/types';
import { usePeriodSettings, useToday } from '@/features/tasks/hooks';
import { recurrenceLabels, recurrenceOrder } from '@/features/tasks/period';
import { TaskSlots } from '@/features/tasks/components/TaskSlots';
import { numberChecklist } from '../checklist';
import { CopyNumberButton } from './CopyNumberButton';
import type { useNumberRecordEditor } from './useNumberRecordEditor';

export function NumberChecklist({
  types,
  editor,
  query,
  typeFilter,
}: {
  types: NumberType[];
  editor: ReturnType<typeof useNumberRecordEditor>;
  query: string;
  typeFilter: string;
}) {
  const today = useToday();
  const settings = usePeriodSettings();
  const [selectedDate, setSelectedDate] = useState('');
  const date = selectedDate || today.format('YYYY-MM-DD');
  const [recurrence, setRecurrence] = useState('all');
  const [missingOnly, setMissingOnly] = useState(false);
  const data = useLiveQuery(async () => ({
    tasks: await db.tasks.orderBy('order').toArray(),
    records: await db.numberRecords.toArray(),
    completions: await db.completions.toArray(),
  }));
  if (!data) return <Text c="dimmed">読み込み中…</Text>;
  const q = query.trim().toLowerCase();
  const rows = numberChecklist(data.tasks, data.records, data.completions, dayjs(date), settings)
    .filter(({ status }) => recurrence === 'all' || status.task.recurrence === recurrence)
    .map((row) => ({
      ...row,
      entries: row.entries.filter((e) => typeFilter === 'all' || e.typeId === typeFilter),
    }))
    .filter(
      ({ status, entries }) =>
        entries.length &&
        (!missingOnly || entries.some((e) => !e.records.length)) &&
        (!q ||
          status.task.title.toLowerCase().includes(q) ||
          status.task.note.toLowerCase().includes(q) ||
          entries.some((e) => e.records.some((r) => `${r.value} ${r.memo}`.toLowerCase().includes(q)))),
    );
  return (
    <Stack gap="sm">
      <Group align="end">
        <TextInput
          type="date"
          label="対象日（この日を含む期間）"
          value={date}
          onChange={(e) => {
            const value = e.currentTarget.value;
            if (!value || /^\d{4}-\d{2}-\d{2}$/.test(value)) setSelectedDate(value);
          }}
        />
        <Button variant="default" onClick={() => setSelectedDate('')}>
          今日
        </Button>
        <Select
          label="繰り返し"
          value={recurrence}
          onChange={(v) => setRecurrence(v ?? 'all')}
          data={[
            { value: 'all', label: 'すべて' },
            ...recurrenceOrder.map((r) => ({
              value: r,
              label: recurrenceLabels[r],
            })),
          ]}
        />
        <Switch
          label="番号未記録のみ"
          checked={missingOnly}
          onChange={(e) => setMissingOnly(e.currentTarget.checked)}
        />
      </Group>
      <Text size="sm" c="dimmed">
        {rows.length}
        件の作業。番号が必要なタスクを表示します。完了後も行は残ります。表は横にスクロールできます。
      </Text>
      <Table.ScrollContainer minWidth={860}>
        <Table striped highlightOnHover withTableBorder withColumnBorders>
          <Table.Thead>
            <Table.Tr>
              {['タスク・作業内容', '対象期間', '実施チェック', '番号の種類', '今回の番号', '過去の番号・再利用'].map(
                (h) => (
                  <Table.Th key={h}>{h}</Table.Th>
                ),
              )}
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {rows.flatMap(({ status, entries }) =>
              entries.map((entry, index) => {
                const defaults = {
                  taskId: status.task.id,
                  typeId: entry.typeId,
                  periodKey: status.period.key,
                  date,
                };
                return (
                  <Table.Tr key={`${status.task.id}:${entry.typeId}`}>
                    {index === 0 && (
                      <>
                        <Table.Td rowSpan={entries.length} maw={280} style={{ verticalAlign: 'top' }}>
                          <Anchor component={Link} to={`/tasks/${status.task.id}`}>
                            {status.task.title}
                          </Anchor>
                          <Text size="xs" c="dimmed">
                            {recurrenceLabels[status.task.recurrence]}
                            {status.task.dueDate && ` / 期限 ${status.task.dueDate}`}
                          </Text>
                          {status.task.note && (
                            <details>
                              <summary>作業内容</summary>
                              <Text
                                size="sm"
                                style={{
                                  whiteSpace: 'pre-wrap',
                                  overflowWrap: 'anywhere',
                                }}
                              >
                                {status.task.note}
                              </Text>
                            </details>
                          )}
                        </Table.Td>
                        <Table.Td rowSpan={entries.length}>{status.period.label}</Table.Td>
                        <Table.Td rowSpan={entries.length}>
                          <Stack gap="xs">
                            <TaskSlots status={status} size="md" />
                            <Text size="xs">
                              {status.doneCount}/{status.task.timesPerPeriod} 実施済み
                            </Text>
                          </Stack>
                        </Table.Td>
                      </>
                    )}
                    <Table.Td>{types.find((t) => t.id === entry.typeId)?.name ?? '削除された種類'}</Table.Td>
                    <Table.Td>
                      <Stack gap={6}>
                        {entry.records.length ? (
                          entry.records.map((r) => (
                            <Group key={r.id} gap={4} wrap="nowrap">
                              <Button variant="subtle" size="compact-sm" onClick={() => editor.openEdit(r)}>
                                {r.value}
                              </Button>
                              <CopyNumberButton value={r.value} />
                            </Group>
                          ))
                        ) : (
                          <Badge color={status.doneCount ? 'orange' : 'gray'} variant="light">
                            未記録
                          </Badge>
                        )}
                        <Button size="compact-xs" variant="light" onClick={() => editor.openNew(defaults)}>
                          番号を記録
                        </Button>
                      </Stack>
                    </Table.Td>
                    <Table.Td>
                      {entry.previous ? (
                        <Stack gap={4}>
                          <Group gap={4}>
                            <Text size="sm" ff="monospace">
                              {entry.previous.value}
                            </Text>
                            <CopyNumberButton value={entry.previous.value} />
                          </Group>
                          <Text size="xs" c="dimmed">
                            {entry.previous.date}
                          </Text>
                          <Button
                            size="compact-xs"
                            variant="default"
                            onClick={() =>
                              editor.openNew({
                                ...defaults,
                                value: entry.previous!.value,
                                memo: entry.previous!.memo,
                              })
                            }
                          >
                            今回に再利用
                          </Button>
                        </Stack>
                      ) : (
                        <Text size="xs" c="dimmed">
                          履歴なし
                        </Text>
                      )}
                    </Table.Td>
                  </Table.Tr>
                );
              }),
            )}
          </Table.Tbody>
        </Table>
      </Table.ScrollContainer>
      {!rows.length && (
        <Text c="dimmed">対象の作業はありません。タスクの編集で「実施時に記録する番号」を設定してください。</Text>
      )}
    </Stack>
  );
}

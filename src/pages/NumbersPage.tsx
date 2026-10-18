import { Button, Group, ScrollArea, SegmentedControl, Stack, Text, TextInput } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconHash, IconPlus, IconSearch, IconSettings } from '@tabler/icons-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { useState } from 'react';
import { PageHeader } from '@/components/common/PageHeader';
import { EmptyState } from '@/components/common/EmptyState';
import { db } from '@/db/db';
import { useNumberTypes } from '@/features/numbers/hooks';
import { createNumberType } from '@/features/numbers/repository';
import { NumberTypeManager } from '@/features/numbers/components/NumberTypeManager';
import { NumberRecordRow } from '@/features/numbers/components/NumberRecordRow';
import { useNumberRecordEditor } from '@/features/numbers/components/useNumberRecordEditor';

const PAGE_SIZE = 100;

export function NumbersPage() {
  const types = useNumberTypes();
  const [managing, { open: openManager, close: closeManager }] = useDisclosure(false);
  const editor = useNumberRecordEditor();
  const [typeFilter, setTypeFilter] = useState('all');
  const [query, setQuery] = useState('');
  const [limit, setLimit] = useState(PAGE_SIZE);

  const records = useLiveQuery(() => db.numberRecords.orderBy('createdAt').reverse().toArray()) ?? [];
  const tasks = useLiveQuery(() => db.tasks.toArray()) ?? [];
  const taskMap = new Map(tasks.map((t) => [t.id, t]));
  const typeMap = new Map((types ?? []).map((t) => [t.id, t]));

  if (types === undefined) return null;

  const activeType = typeMap.has(typeFilter) ? typeFilter : 'all';
  const q = query.trim().toLowerCase();
  const filtered = records
    .filter((r) => activeType === 'all' || r.typeId === activeType)
    .filter(
      (r) =>
        !q ||
        r.value.toLowerCase().includes(q) ||
        r.memo.toLowerCase().includes(q) ||
        (r.taskId && taskMap.get(r.taskId)?.title.toLowerCase().includes(q)),
    )
    .sort((a, b) => b.date.localeCompare(a.date) || b.createdAt - a.createdAt);

  return (
    <>
      <PageHeader
        title="番号"
        description="伝票番号などをタスクと紐付けて記録し、記録漏れの防止や再利用に使います"
        actions={
          <>
            <Button variant="default" leftSection={<IconSettings size={16} />} onClick={openManager}>
              種類
            </Button>
            <Button
              leftSection={<IconPlus size={16} />}
              disabled={types.length === 0}
              onClick={() => editor.openNew(activeType !== 'all' ? { typeId: activeType } : undefined)}
            >
              記録
            </Button>
          </>
        }
      />

      {types.length === 0 ? (
        <EmptyState
          icon={<IconHash size={26} stroke={1.5} />}
          title="まずは番号の種類を作りましょう"
          description="伝票番号・請求書番号など、管理したい番号の種類を作成します"
          action={
            <Group mt="xs" gap="xs">
              <Button onClick={() => createNumberType({ name: '伝票番号', description: '会計システムの伝票番号' })}>
                「伝票番号」を作成
              </Button>
              <Button variant="default" onClick={openManager}>
                自分で作成
              </Button>
            </Group>
          }
        />
      ) : (
        <Stack gap="sm">
          {types.length > 1 && (
            <ScrollArea type="never">
              <SegmentedControl
                value={activeType}
                onChange={setTypeFilter}
                data={[{ value: 'all', label: 'すべて' }, ...types.map((t) => ({ value: t.id, label: t.name }))]}
              />
            </ScrollArea>
          )}
          <TextInput
            placeholder="番号・メモ・タスク名で検索"
            leftSection={<IconSearch size={16} />}
            value={query}
            onChange={(e) => setQuery(e.currentTarget.value)}
          />
          {filtered.length === 0 ? (
            <Text c="dimmed" size="sm">
              {records.length === 0 ? 'まだ番号の記録はありません。' : '条件に一致する番号はありません。'}
            </Text>
          ) : (
            <>
              <Text size="xs" c="dimmed">
                {filtered.length}件
              </Text>
              {filtered.slice(0, limit).map((r) => (
                <NumberRecordRow
                  key={r.id}
                  record={r}
                  type={typeMap.get(r.typeId)}
                  task={r.taskId ? taskMap.get(r.taskId) : undefined}
                  showType={activeType === 'all' && types.length > 1}
                  onEdit={editor.openEdit}
                  onReuse={editor.openReuse}
                />
              ))}
              {filtered.length > limit && (
                <Button variant="subtle" onClick={() => setLimit((l) => l + PAGE_SIZE)}>
                  さらに表示
                </Button>
              )}
            </>
          )}
        </Stack>
      )}
      <NumberTypeManager opened={managing} onClose={closeManager} />
      {editor.modal}
    </>
  );
}

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
import { NumberHistoryTable } from '@/features/numbers/components/NumberHistoryTable';
import { NumberChecklist } from '@/features/numbers/components/NumberChecklist';
import { useNumberRecordEditor } from '@/features/numbers/components/useNumberRecordEditor';

const PAGE_SIZE = 100;

export function NumbersPage() {
  const types = useNumberTypes();
  const [managing, { open: openManager, close: closeManager }] = useDisclosure(false);
  const editor = useNumberRecordEditor();
  const [view, setView] = useState('checklist');
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
        description="作業と番号を表で確認し、記録漏れの防止や過去の番号の再利用に使います"
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
              <Button
                onClick={() =>
                  createNumberType({
                    name: '伝票番号',
                    description: '会計システムの伝票番号',
                  })
                }
              >
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
          <SegmentedControl
            aria-label="番号の表示"
            value={view}
            onChange={setView}
            data={[
              { value: 'checklist', label: '作業チェック表' },
              { value: 'history', label: '番号の履歴表' },
            ]}
          />
          {types.length > 1 && (
            <ScrollArea type="never">
              <SegmentedControl
                value={activeType}
                onChange={(v) => {
                  setTypeFilter(v);
                  setLimit(PAGE_SIZE);
                }}
                data={[{ value: 'all', label: 'すべて' }, ...types.map((t) => ({ value: t.id, label: t.name }))]}
              />
            </ScrollArea>
          )}
          <TextInput
            placeholder={view === 'checklist' ? 'タスク名・作業内容・今回の番号で検索' : '番号・メモ・タスク名で検索'}
            leftSection={<IconSearch size={16} />}
            value={query}
            onChange={(e) => {
              setQuery(e.currentTarget.value);
              setLimit(PAGE_SIZE);
            }}
          />
          <Button
            variant="subtle"
            size="compact-sm"
            style={{ alignSelf: 'flex-start' }}
            onClick={() => {
              setQuery('');
              setTypeFilter('all');
              setLimit(PAGE_SIZE);
            }}
          >
            検索をクリア
          </Button>
          {view === 'checklist' ? (
            <NumberChecklist types={types} editor={editor} query={query} typeFilter={activeType} />
          ) : filtered.length === 0 ? (
            <Text c="dimmed" size="sm">
              {records.length === 0 ? 'まだ番号の記録はありません。' : '条件に一致する番号はありません。'}
            </Text>
          ) : (
            <>
              <Text size="xs" c="dimmed">
                {filtered.length}件
              </Text>
              <NumberHistoryTable
                records={filtered.slice(0, limit)}
                types={typeMap}
                tasks={taskMap}
                onEdit={editor.openEdit}
                onReuse={editor.openReuse}
              />
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

import { Autocomplete, Button, Group, Stack, Text } from '@mantine/core';
import { modals } from '@mantine/modals';
import { notifications } from '@mantine/notifications';
import { useState } from 'react';
import type { Completion, NumberType, Task } from '@/db/types';
import { db } from '@/db/db';
import { useNumberTypeMap, useSuggestions } from '../hooks';
import { addNumberRecord, todayString } from '../repository';

function NumberField({ type, taskId, value, onChange }: { type: NumberType; taskId: string; value: string; onChange: (v: string) => void }) {
  const suggestions = useSuggestions(type.id, taskId);
  return (
    <Autocomplete
      label={type.name}
      description={type.description || undefined}
      placeholder="番号を入力(過去の番号から選択も可)"
      data={suggestions}
      value={value}
      onChange={onChange}
    />
  );
}

function NumberPromptForm({ task, completion, onClose }: { task: Task; completion: Completion; onClose: () => void }) {
  const typeMap = useNumberTypeMap();
  const types = task.numberTypeIds.map((id) => typeMap.get(id)).filter((t): t is NumberType => !!t);
  const [values, setValues] = useState<Record<string, string>>({});

  const save = async () => {
    const entries = types.filter((t) => values[t.id]?.trim());
    for (const t of entries) {
      await addNumberRecord({
        typeId: t.id,
        value: values[t.id]!,
        memo: '',
        date: todayString(),
        taskId: task.id,
        periodKey: completion.periodKey,
        completionId: completion.id,
      });
    }
    if (entries.length) notifications.show({ message: '番号を記録しました' });
    onClose();
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        void save();
      }}
    >
      <Stack gap="sm">
        <Text size="sm" c="dimmed">
          「{task.title}」を実施しました。番号を記録しておきましょう。
        </Text>
        {types.map((t, i) => (
          <NumberField
            key={t.id}
            type={t}
            taskId={task.id}
            value={values[t.id] ?? ''}
            onChange={(v) => setValues((prev) => ({ ...prev, [t.id]: v }))}
            {...(i === 0 ? { 'data-autofocus': true } : {})}
          />
        ))}
        <Group justify="flex-end" gap="xs">
          <Button variant="default" onClick={onClose}>
            あとで
          </Button>
          <Button type="submit">記録</Button>
        </Group>
      </Stack>
    </form>
  );
}

/** タスク実施直後に、記録すべき番号の入力を促す */
export async function promptNumbersAfterCompletion(task: Task, completion: Completion): Promise<void> {
  if (task.numberTypeIds.length === 0) return;
  const existing = await db.numberRecords.where('taskId').equals(task.id).filter((r) => r.periodKey === completion.periodKey).toArray();
  if (task.numberTypeIds.every((id) => existing.some((r) => r.typeId === id))) return;
  const modalId = modals.open({
    title: '番号の記録',
    children: <NumberPromptForm task={task} completion={completion} onClose={() => modals.close(modalId)} />,
  });
}

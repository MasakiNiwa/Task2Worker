import { Autocomplete, Button, Group, Modal, Select, Stack, Textarea } from '@mantine/core';
import { DatePickerInput } from '@mantine/dates';
import { useForm } from '@mantine/form';
import { useMediaQuery } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { useLiveQuery } from 'dexie-react-hooks';
import { useEffect } from 'react';
import { db } from '@/db/db';
import type { NumberRecord } from '@/db/types';
import { useNumberTypes, useSuggestions } from '../hooks';
import { addNumberRecord, todayString, updateNumberRecord, type NumberRecordInput } from '../repository';

interface Props {
  opened: boolean;
  onClose: () => void;
  /** 編集する記録 */
  record?: NumberRecord;
  /** 新規作成時の初期値 */
  defaults?: Partial<NumberRecordInput>;
}

type FormValues = {
  typeId: string;
  value: string;
  memo: string;
  date: string;
  taskId: string;
};

function toValues(record?: NumberRecord, defaults?: Partial<NumberRecordInput>): FormValues {
  const src = record ?? defaults ?? {};
  return {
    typeId: src.typeId ?? '',
    value: src.value ?? '',
    memo: src.memo ?? '',
    date: src.date ?? todayString(),
    taskId: src.taskId ?? '',
  };
}

export function NumberRecordModal({ opened, onClose, record, defaults }: Props) {
  const isMobile = useMediaQuery('(max-width: 36em)');
  const types = useNumberTypes() ?? [];
  const tasks = useLiveQuery(() => db.tasks.orderBy('order').toArray()) ?? [];
  const form = useForm<FormValues>({
    initialValues: toValues(record, defaults),
    validate: {
      typeId: (v) => (v ? null : '番号の種類を選んでください'),
      value: (v) => (v.trim() ? null : '番号を入力してください'),
    },
  });
  const suggestions = useSuggestions(form.values.typeId, form.values.taskId || undefined);

  useEffect(() => {
    if (opened) {
      const values = toValues(record, defaults);
      if (!values.typeId && types.length === 1) values.typeId = types[0]!.id;
      form.setValues(values);
      form.clearErrors();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opened, record]);

  const submit = form.onSubmit(async (v) => {
    const base = record ?? defaults ?? {};
    // 関連タスク・日付を変えた場合は、元の期間・実施記録との紐付けを外す
    const sameTask = (base.taskId ?? '') === v.taskId && (!base.date || base.date === v.date);
    const input: NumberRecordInput = {
      periodKey: sameTask ? base.periodKey : undefined,
      completionId: sameTask ? base.completionId : undefined,
      typeId: v.typeId,
      value: v.value,
      memo: v.memo,
      date: v.date,
      taskId: v.taskId || undefined,
    };
    if (record) await updateNumberRecord(record.id, input);
    else await addNumberRecord(input);
    notifications.show({
      message: record ? '番号を更新しました' : '番号を記録しました',
    });
    onClose();
  });

  return (
    <Modal opened={opened} onClose={onClose} title={record ? '番号を編集' : '番号を記録'} fullScreen={isMobile}>
      <form onSubmit={submit}>
        <Stack gap="sm">
          <Select
            label="種類"
            data={types.map((t) => ({ value: t.id, label: t.name }))}
            allowDeselect={false}
            withAsterisk
            {...form.getInputProps('typeId')}
          />
          <Autocomplete
            label="番号"
            description="過去の番号から選んで再利用することもできます"
            placeholder="例: 2026-001234"
            data={suggestions}
            withAsterisk
            data-autofocus
            {...form.getInputProps('value')}
          />
          <DatePickerInput
            label="日付"
            valueFormat="YYYY/MM/DD"
            value={form.values.date}
            onChange={(v) => v && form.setFieldValue('date', v)}
          />
          <Select
            label="関連タスク"
            placeholder="なし"
            clearable
            searchable
            data={tasks.map((t) => ({ value: t.id, label: t.title }))}
            value={form.values.taskId || null}
            onChange={(v) => form.setFieldValue('taskId', v ?? '')}
          />
          <Textarea label="メモ" autosize minRows={2} {...form.getInputProps('memo')} />
          <Group justify="space-between" mt="xs">
            <Button variant="subtle" color="gray" onClick={() => form.setValues({ value: '', memo: '' })}>
              入力をクリア
            </Button>
            <Group gap="xs">
              <Button variant="default" onClick={onClose}>
                キャンセル
              </Button>
              <Button type="submit">保存</Button>
            </Group>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}

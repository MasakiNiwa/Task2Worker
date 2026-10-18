import { Button, Group, Modal, NumberInput, Select, Stack, TagsInput, Textarea, TextInput } from '@mantine/core';
import { DatePickerInput } from '@mantine/dates';
import { useForm } from '@mantine/form';
import { useMediaQuery } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { useEffect } from 'react';
import type { Recurrence, Task } from '@/db/types';
import { useAllTags } from '../hooks';
import { recurrenceLabels, recurrenceOrder } from '../period';
import { createTask, emptyTaskInput, updateTask, type TaskInput } from '../repository';

interface Props {
  opened: boolean;
  onClose: () => void;
  /** 指定すると編集モード */
  task?: Task;
  onSaved?: (id: string) => void;
}

const recurrenceOptions = recurrenceOrder.map((r) => ({ value: r, label: recurrenceLabels[r] }));

function toInput(task?: Task): TaskInput {
  if (!task) return emptyTaskInput;
  const { title, note, recurrence, timesPerPeriod, tags, numberTypeIds, dueDate } = task;
  return { title, note, recurrence, timesPerPeriod, tags, numberTypeIds, dueDate };
}

export function TaskFormModal({ opened, onClose, task, onSaved }: Props) {
  const allTags = useAllTags();
  const isMobile = useMediaQuery('(max-width: 36em)');
  const form = useForm<TaskInput>({
    initialValues: toInput(task),
    validate: {
      title: (v) => (v.trim() ? null : 'タスク名を入力してください'),
      timesPerPeriod: (v) => (v >= 1 && v <= 24 ? null : '1〜24回で指定してください'),
    },
  });

  useEffect(() => {
    if (opened) {
      form.setValues(toInput(task));
      form.resetDirty();
      form.clearErrors();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opened, task]);

  const submit = form.onSubmit(async (values) => {
    const input: TaskInput = {
      ...values,
      title: values.title.trim(),
      dueDate: values.recurrence === 'once' ? values.dueDate : undefined,
    };
    const id = task ? (await updateTask(task.id, input), task.id) : await createTask(input);
    notifications.show({ message: task ? 'タスクを更新しました' : 'タスクを追加しました' });
    onSaved?.(id);
    onClose();
  });

  const r = form.values.recurrence;
  const unit = r === 'daily' ? '1日' : r === 'weekly' ? '1週' : r === 'monthly' ? '1か月' : r === 'quarterly' ? '1四半期' : '1年';

  return (
    <Modal opened={opened} onClose={onClose} title={task ? 'タスクを編集' : 'タスクを追加'} size="lg" fullScreen={isMobile}>
      <form onSubmit={submit}>
        <Stack gap="sm">
          <TextInput label="タスク名" placeholder="例: 経費精算の仕訳を切る" data-autofocus withAsterisk {...form.getInputProps('title')} />
          <Group grow align="flex-start">
            <Select
              label="繰り返し"
              data={recurrenceOptions}
              allowDeselect={false}
              {...form.getInputProps('recurrence')}
              onChange={(v) => v && form.setFieldValue('recurrence', v as Recurrence)}
            />
            {r === 'once' ? (
              <DatePickerInput
                label="期限"
                placeholder="任意"
                clearable
                valueFormat="YYYY/MM/DD"
                value={form.values.dueDate ?? null}
                onChange={(v) => form.setFieldValue('dueDate', v ?? undefined)}
              />
            ) : (
              <NumberInput label={`${unit}あたりの回数`} min={1} max={24} {...form.getInputProps('timesPerPeriod')} />
            )}
          </Group>
          <TagsInput label="タグ" placeholder="Enter で追加" data={allTags} clearable {...form.getInputProps('tags')} />
          <Textarea
            label="中身(手順・メモ)"
            description="Markdown が使えます(- 箇条書き、**太字**、[リンク](https://...) など)"
            autosize
            minRows={4}
            maxRows={14}
            {...form.getInputProps('note')}
          />
          <Group justify="space-between" mt="xs">
            <Button variant="subtle" color="gray" onClick={() => form.setValues({ ...emptyTaskInput, recurrence: form.values.recurrence })}>
              入力をクリア
            </Button>
            <Group gap="xs">
              <Button variant="default" onClick={onClose}>
                キャンセル
              </Button>
              <Button type="submit">{task ? '保存' : '追加'}</Button>
            </Group>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}

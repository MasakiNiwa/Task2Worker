import { ActionIcon, Group, Tooltip } from '@mantine/core';
import { IconCheck } from '@tabler/icons-react';
import dayjs from 'dayjs';
import type { TaskStatus } from '../hooks';
import { completeSlot, uncompleteSlot } from '../repository';

/** 期間内の実施回数ぶんのチェックボタン。押すと実施/取り消しを切り替える */
export function TaskSlots({ status, size = 'lg' }: { status: TaskStatus; size?: 'md' | 'lg' }) {
  const { task, period, completions, doneSlots } = status;
  return (
    <Group gap={6} wrap="nowrap">
      {Array.from({ length: task.timesPerPeriod }, (_, slot) => {
        const done = doneSlots.has(slot);
        const at = completions.find((c) => c.slot === slot)?.doneAt;
        const label = done
          ? `${dayjs(at).format('M/D HH:mm')} 実施済み(押すと取り消し)`
          : task.timesPerPeriod > 1
            ? `${slot + 1}回目を実施済みにする`
            : '実施済みにする';
        return (
          <Tooltip key={slot} label={label} openDelay={400}>
            <ActionIcon
              size={size}
              radius="xl"
              variant={done ? 'filled' : 'default'}
              aria-label={label}
              aria-pressed={done}
              onClick={(e) => {
                e.stopPropagation();
                if (done) void uncompleteSlot(task.id, period.key, slot);
                else void completeSlot(task.id, period.key, slot);
              }}
            >
              {done ? <IconCheck size={18} stroke={2.4} /> : task.timesPerPeriod > 1 ? slot + 1 : null}
            </ActionIcon>
          </Tooltip>
        );
      })}
    </Group>
  );
}

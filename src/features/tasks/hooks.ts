import { useLiveQuery } from 'dexie-react-hooks';
import dayjs, { type Dayjs } from 'dayjs';
import { useMemo } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { db } from '@/db/db';
import type { Completion, Task } from '@/db/types';
import { useSettings } from '@/features/settings/store';
import { useNow } from '@/hooks/useNow';
import { groupBy } from '@/lib/collections';
import { logicalDate, periodOf, type Period, type PeriodSettings } from './period';

export interface TaskStatus {
  task: Task;
  period: Period;
  completions: Completion[];
  doneSlots: Set<number>;
  doneCount: number;
  completed: boolean;
}

export function usePeriodSettings(): PeriodSettings {
  return useSettings(
    useShallow((s) => ({
      weekStartsOn: s.weekStartsOn,
      fiscalYearStartMonth: s.fiscalYearStartMonth,
      dayStartHour: s.dayStartHour,
    })),
  );
}

/** 論理上の「今日」(1日の切り替わり時刻を考慮) */
export function useToday(): Dayjs {
  const now = useNow();
  const settings = usePeriodSettings();
  const key = logicalDate(now, settings).valueOf();
  // 日付が変わったときだけ新しいオブジェクトを返す
  return useMemo(() => dayjs(key), [key]);
}

export function buildStatus(task: Task, period: Period, completions: Completion[]): TaskStatus {
  const doneSlots = new Set(completions.filter((c) => c.slot < task.timesPerPeriod).map((c) => c.slot));
  return {
    task,
    period,
    completions,
    doneSlots,
    doneCount: doneSlots.size,
    completed: doneSlots.size >= task.timesPerPeriod,
  };
}

/** 全タスクの「今の期間」での実施状況 */
export function useTaskStatuses(options: { includeArchived?: boolean } = {}): TaskStatus[] | undefined {
  const today = useToday();
  const settings = usePeriodSettings();
  const includeArchived = options.includeArchived ?? false;

  return useLiveQuery(async () => {
    const all = await db.tasks.orderBy('order').toArray();
    const tasks = includeArchived ? all : all.filter((t) => !t.archived);
    const periods = new Map(tasks.map((t) => [t.id, periodOf(t.recurrence, today, settings)]));
    const completions = await db.completions
      .where('[taskId+periodKey]')
      .anyOf(tasks.map((t) => [t.id, periods.get(t.id)!.key]))
      .toArray();
    const byTask = groupBy(completions, (c) => c.taskId);
    return tasks.map((t) => buildStatus(t, periods.get(t.id)!, byTask.get(t.id) ?? []));
  }, [today, settings.weekStartsOn, settings.fiscalYearStartMonth, settings.dayStartHour, includeArchived]);
}

export function useTaskStatus(taskId: string | undefined): TaskStatus | null | undefined {
  const today = useToday();
  const settings = usePeriodSettings();
  return useLiveQuery(async () => {
    if (!taskId) return null;
    const task = await db.tasks.get(taskId);
    if (!task) return null;
    const period = periodOf(task.recurrence, today, settings);
    const completions = await db.completions.where({ taskId, periodKey: period.key }).toArray();
    return buildStatus(task, period, completions);
  }, [taskId, today, settings.weekStartsOn, settings.fiscalYearStartMonth, settings.dayStartHour]);
}

export function useAllTags(): string[] {
  return (
    useLiveQuery(async () => {
      const keys = await db.tasks.orderBy('tags').uniqueKeys();
      return keys.map(String);
    }) ?? []
  );
}

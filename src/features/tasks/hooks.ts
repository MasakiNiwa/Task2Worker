import { useLiveQuery } from 'dexie-react-hooks';
import dayjs, { type Dayjs } from 'dayjs';
import { useMemo } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { db } from '@/db/db';
import type { Completion, NumberRecord, Task } from '@/db/types';
import { useSettings } from '@/features/settings/store';
import { useNow } from '@/hooks/useNow';
import { groupBy } from '@/lib/collections';
import { logicalDate, periodOf, previousPeriod, type Period, type PeriodSettings } from './period';
import { missedPreviousPeriod } from './stats';

export interface TaskStatus {
  task: Task;
  period: Period;
  completions: Completion[];
  doneSlots: Set<number>;
  doneCount: number;
  completed: boolean;
  /** 前の期間をやり残したか */
  previousMissed: boolean;
  /** 今の期間に実施したのに、まだ記録していない番号の種類 */
  missingNumberTypeIds: string[];
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

function distinctSlots(task: Task, completions: Completion[]): Set<number> {
  return new Set(completions.filter((c) => c.slot < task.timesPerPeriod).map((c) => c.slot));
}

export function buildStatus(
  task: Task,
  period: Period,
  completions: Completion[],
  previousCompletions: Completion[],
  numberRecords: NumberRecord[],
  today: Dayjs,
  settings: PeriodSettings,
): TaskStatus {
  const doneSlots = distinctSlots(task, completions);
  const recorded = new Set(
    numberRecords
      .filter((r) => (r.periodKey ?? periodOf(task.recurrence, dayjs(r.date), settings).key) === period.key)
      .map((r) => r.typeId),
  );
  return {
    task,
    period,
    completions,
    doneSlots,
    doneCount: doneSlots.size,
    completed: doneSlots.size >= task.timesPerPeriod,
    previousMissed: missedPreviousPeriod(task, distinctSlots(task, previousCompletions).size, today, settings),
    missingNumberTypeIds: doneSlots.size > 0 ? task.numberTypeIds.filter((id) => !recorded.has(id)) : [],
  };
}

/** タスクの今の期間と前の期間 */
function periodsOf(task: Task, today: Dayjs, settings: PeriodSettings): [Period, Period] {
  const current = periodOf(task.recurrence, today, settings);
  return [current, previousPeriod(task.recurrence, current, settings)];
}

/** 全タスクの「今の期間」での実施状況 */
export function useTaskStatuses(options: { includeArchived?: boolean } = {}): TaskStatus[] | undefined {
  const today = useToday();
  const settings = usePeriodSettings();
  const includeArchived = options.includeArchived ?? false;

  return useLiveQuery(async () => {
    const all = await db.tasks.orderBy('order').toArray();
    const tasks = includeArchived ? all : all.filter((t) => !t.archived);
    const periods = new Map(tasks.map((t) => [t.id, periodsOf(t, today, settings)]));
    const completions = await db.completions
      .where('[taskId+periodKey]')
      .anyOf(tasks.flatMap((t) => periods.get(t.id)!.map((p) => [t.id, p.key])))
      .toArray();
    const byTaskPeriod = groupBy(completions, (c) => `${c.taskId}|${c.periodKey}`);
    const numberRecords = await db.numberRecords
      .where('taskId')
      .anyOf(tasks.filter((t) => t.numberTypeIds.length).map((t) => t.id))
      .toArray();
    const recordsByTask = groupBy(numberRecords, (r) => r.taskId);
    return tasks.map((t) => {
      const [current, previous] = periods.get(t.id)!;
      return buildStatus(
        t,
        current,
        byTaskPeriod.get(`${t.id}|${current.key}`) ?? [],
        byTaskPeriod.get(`${t.id}|${previous.key}`) ?? [],
        recordsByTask.get(t.id) ?? [],
        today,
        settings,
      );
    });
  }, [today, settings.weekStartsOn, settings.fiscalYearStartMonth, settings.dayStartHour, includeArchived]);
}

export function useTaskStatus(taskId: string | undefined): TaskStatus | null | undefined {
  const today = useToday();
  const settings = usePeriodSettings();
  return useLiveQuery(async () => {
    if (!taskId) return null;
    const task = await db.tasks.get(taskId);
    if (!task) return null;
    const [current, previous] = periodsOf(task, today, settings);
    const completions = await db.completions.where({ taskId, periodKey: current.key }).toArray();
    const previousCompletions = await db.completions.where({ taskId, periodKey: previous.key }).toArray();
    const numberRecords = await db.numberRecords.where('taskId').equals(taskId).toArray();
    return buildStatus(task, current, completions, previousCompletions, numberRecords, today, settings);
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

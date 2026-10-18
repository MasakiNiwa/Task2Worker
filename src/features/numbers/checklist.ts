import dayjs, { type Dayjs } from 'dayjs';
import type { Completion, NumberRecord, Task } from '@/db/types';
import { buildStatus } from '@/features/tasks/hooks';
import { periodOf, previousPeriod, type PeriodSettings } from '@/features/tasks/period';

/** Explicit period keys are authoritative; legacy records without one use their date. */
export function recordPeriodKey(record: NumberRecord, task: Task, settings: PeriodSettings): string {
  return record.periodKey ?? periodOf(task.recurrence, dayjs(record.date), settings).key;
}

export function numberChecklist(
  tasks: Task[],
  records: NumberRecord[],
  completions: Completion[],
  date: Dayjs,
  settings: PeriodSettings,
) {
  return tasks
    .filter((t) => !t.archived && t.numberTypeIds.length > 0)
    .map((task) => {
      const period = periodOf(task.recurrence, date, settings);
      const previous = previousPeriod(task.recurrence, period, settings);
      const taskRecords = records.filter((r) => r.taskId === task.id);
      const currentRecords = taskRecords.filter((r) => recordPeriodKey(r, task, settings) === period.key);
      const status = buildStatus(
        task,
        period,
        completions.filter((c) => c.taskId === task.id && c.periodKey === period.key),
        completions.filter((c) => c.taskId === task.id && c.periodKey === previous.key),
        currentRecords.map((r) => ({ ...r, periodKey: period.key })),
        date,
        settings,
      );
      return {
        status,
        entries: task.numberTypeIds.map((typeId) => ({
          typeId,
          records: currentRecords.filter((r) => r.typeId === typeId),
          previous: taskRecords
            .filter(
              (r) =>
                r.typeId === typeId &&
                recordPeriodKey(r, task, settings) !== period.key &&
                r.date <= period.end.format('YYYY-MM-DD'),
            )
            .sort((a, b) => b.date.localeCompare(a.date) || b.createdAt - a.createdAt)[0],
        })),
      };
    });
}

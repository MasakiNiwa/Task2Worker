import type { Task } from '@/db/types';
import type { FactFilter } from './facts';

/** 実施記録用のフィルタをタスク単位に当てはめる */
export function applyFilterToTask(t: Task, f: FactFilter): boolean {
  return (
    (!f.taskIds?.length || f.taskIds.includes(t.id)) &&
    (!f.recurrences?.length || f.recurrences.includes(t.recurrence)) &&
    (!f.tags?.length || t.tags.some((x) => f.tags!.includes(x)))
  );
}

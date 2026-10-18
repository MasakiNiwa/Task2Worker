import type { Dayjs } from 'dayjs';
import dayjs from 'dayjs';
import type { Completion, Task } from '@/db/types';
import { periodOf, previousPeriod, type PeriodSettings } from './period';

/** 期間キーごとの実施回数(同じ回の重複は数えない) */
export function countByPeriod(task: Task, completions: Completion[]): Map<string, number> {
  const slots = new Map<string, Set<number>>();
  for (const c of completions) {
    if (c.slot >= task.timesPerPeriod) continue;
    const set = slots.get(c.periodKey) ?? new Set<number>();
    set.add(c.slot);
    slots.set(c.periodKey, set);
  }
  return new Map([...slots].map(([k, v]) => [k, v.size]));
}

const MAX_STREAK_LOOKBACK = 3660;

/**
 * 連続達成数。今の期間が完了していれば今期から、まだなら前の期間から遡って数える。
 * タスク作成日より前の期間は数えない。
 */
export function streakOf(task: Task, completions: Completion[], today: Dayjs, s: PeriodSettings): number {
  if (task.recurrence === 'once') return 0;
  const counts = countByPeriod(task, completions);
  const created = dayjs(task.createdAt).startOf('day');
  const isDone = (key: string) => (counts.get(key) ?? 0) >= task.timesPerPeriod;

  let p = periodOf(task.recurrence, today, s);
  if (!isDone(p.key)) p = previousPeriod(task.recurrence, p, s);
  let streak = 0;
  for (let i = 0; i < MAX_STREAK_LOOKBACK && isDone(p.key) && !p.end.isBefore(created); i++) {
    streak++;
    p = previousPeriod(task.recurrence, p, s);
  }
  return streak;
}

/** 前の期間をやり残したか(タスク作成前の期間は対象外) */
export function missedPreviousPeriod(task: Task, previousCount: number, today: Dayjs, s: PeriodSettings): boolean {
  if (task.recurrence === 'once') return false;
  const prev = previousPeriod(task.recurrence, periodOf(task.recurrence, today, s), s);
  if (prev.end.isBefore(dayjs(task.createdAt).startOf('day'))) return false;
  return previousCount < task.timesPerPeriod;
}

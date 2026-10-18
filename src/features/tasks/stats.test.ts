import dayjs from 'dayjs';
import { describe, expect, it } from 'vitest';
import type { Completion, Task } from '@/db/types';
import { missedPreviousPeriod, streakOf } from './stats';

const s = { weekStartsOn: 1 as const, fiscalYearStartMonth: 4, dayStartHour: 0 };
const today = dayjs('2026-10-18');
const task = (over: Partial<Task> = {}): Task => ({
  id: 't',
  title: 't',
  note: '',
  recurrence: 'daily',
  timesPerPeriod: 1,
  tags: [],
  numberTypeIds: [],
  archived: false,
  order: 0,
  createdAt: dayjs('2026-01-01').valueOf(),
  updatedAt: 0,
  ...over,
});
const done = (periodKey: string, slot = 0): Completion => ({ id: periodKey + slot, taskId: 't', periodKey, slot, doneAt: 0 });

describe('streakOf', () => {
  it('counts back from yesterday when today is not done yet', () => {
    const cs = [done('D2026-10-17'), done('D2026-10-16'), done('D2026-10-14')];
    expect(streakOf(task(), cs, today, s)).toBe(2);
  });

  it('includes today when done', () => {
    const cs = [done('D2026-10-18'), done('D2026-10-17')];
    expect(streakOf(task(), cs, today, s)).toBe(2);
  });

  it('requires all slots for multi-times tasks', () => {
    const t = task({ timesPerPeriod: 2 });
    const cs = [done('D2026-10-17', 0), done('D2026-10-17', 1), done('D2026-10-16', 0)];
    expect(streakOf(t, cs, today, s)).toBe(1);
  });

  it('stops at task creation', () => {
    const t = task({ createdAt: dayjs('2026-10-17').valueOf() });
    const cs = [done('D2026-10-17'), done('D2026-10-16')];
    expect(streakOf(t, cs, today, s)).toBe(1);
  });
});

describe('missedPreviousPeriod', () => {
  it('is true when last period is incomplete', () => {
    expect(missedPreviousPeriod(task({ recurrence: 'weekly' }), 0, today, s)).toBe(true);
    expect(missedPreviousPeriod(task({ recurrence: 'weekly' }), 1, today, s)).toBe(false);
  });

  it('ignores periods before the task existed', () => {
    expect(missedPreviousPeriod(task({ createdAt: today.valueOf() }), 0, today, s)).toBe(false);
  });
});

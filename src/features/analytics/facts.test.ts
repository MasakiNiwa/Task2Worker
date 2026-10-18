import dayjs from 'dayjs';
import { describe, expect, it } from 'vitest';
import type { Completion, Task } from '@/db/types';
import { achievements, buildFacts, drilldown, histogramCpu, hourWeekdayBins } from './facts';

const s = { weekStartsOn: 1 as const, fiscalYearStartMonth: 4, dayStartHour: 0 };
const task = (id: string, over: Partial<Task> = {}): Task => ({
  id,
  title: id,
  note: '',
  recurrence: 'daily',
  timesPerPeriod: 1,
  tags: [],
  numberTypeIds: [],
  archived: false,
  order: 0,
  createdAt: dayjs('2025-01-01').valueOf(),
  updatedAt: 0,
  ...over,
});
const comp = (taskId: string, at: string, periodKey = '', slot = 0): Completion => ({
  id: `${taskId}${at}${slot}`,
  taskId,
  periodKey,
  slot,
  doneAt: dayjs(at).valueOf(),
});

const tasks = [task('a', { tags: ['健康'] }), task('b', { recurrence: 'monthly' })];
const completions = [
  comp('a', '2026-03-31T09:00'),
  comp('a', '2026-04-01T09:00'),
  comp('a', '2026-10-18T21:00'),
  comp('b', '2026-10-05T10:00'),
];
const facts = buildFacts(tasks, completions, s);

describe('drilldown', () => {
  it('lists fiscal years at the top level', () => {
    const r = drilldown(facts, [], {}, s);
    expect(r.level).toBe('year');
    expect(r.buckets.map((b) => [b.key, b.count])).toEqual([
      ['FY2025', 1],
      ['FY2026', 3],
    ]);
  });

  it('drills down to quarters with empty buckets filled', () => {
    const r = drilldown(facts, ['FY2026'], {}, s);
    expect(r.buckets.map((b) => b.label)).toEqual(['Q1', 'Q2', 'Q3', 'Q4']);
    expect(r.buckets.map((b) => b.count)).toEqual([1, 0, 2, 0]);
    expect(r.byTask).toEqual([
      { taskId: 'a', count: 2 },
      { taskId: 'b', count: 1 },
    ]);
  });

  it('drills down to months and days', () => {
    expect(drilldown(facts, ['FY2026', 'FY2026-Q3'], {}, s).buckets.map((b) => b.key)).toEqual([
      'M2026-10',
      'M2026-11',
      'M2026-12',
    ]);
    const days = drilldown(facts, ['FY2026', 'FY2026-Q3', 'M2026-10'], {}, s);
    expect(days.level).toBe('day');
    expect(days.canDrill).toBe(false);
    expect(days.buckets).toHaveLength(31);
    expect(days.buckets.find((b) => b.key === 'D2026-10-18')?.count).toBe(1);
  });

  it('applies filters', () => {
    expect(drilldown(facts, [], { tags: ['健康'] }, s).total).toBe(3);
    expect(drilldown(facts, [], { recurrences: ['monthly'] }, s).total).toBe(1);
  });
});

describe('hour × weekday histogram', () => {
  it('bins by weekday and hour', () => {
    const h = histogramCpu(hourWeekdayBins(facts), 168);
    // 2026-10-18 は日曜 21時
    expect(h[0 * 24 + 21]).toBe(1);
    expect(h.reduce((a, b) => a + b, 0)).toBe(4);
  });
});

describe('achievements', () => {
  it('computes rate over past periods only', () => {
    const t = task('w', { recurrence: 'weekly', createdAt: dayjs('2026-09-28').valueOf() });
    const cs = [comp('w', '2026-09-29', 'W2026-09-28'), comp('w', '2026-10-13', 'W2026-10-12')];
    const [a] = achievements([t], cs, '2026-10-18', s);
    expect(a!.periods.map((p) => p.key)).toEqual(['W2026-09-28', 'W2026-10-05']);
    expect(a!.rate).toBe(0.5);
  });
});

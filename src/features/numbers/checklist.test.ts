import dayjs from 'dayjs';
import { describe, expect, it } from 'vitest';
import type { NumberRecord, Task } from '@/db/types';
import { numberChecklist } from './checklist';

const settings = {
  weekStartsOn: 1 as const,
  fiscalYearStartMonth: 7,
  dayStartHour: 0,
};
const task: Task = {
  id: 't',
  title: '月次仕訳',
  note: '',
  recurrence: 'monthly',
  timesPerPeriod: 1,
  tags: [],
  numberTypeIds: ['voucher', 'invoice'],
  archived: false,
  order: 0,
  createdAt: 0,
  updatedAt: 0,
};
const record = (id: string, date: string, periodKey?: string): NumberRecord => ({
  id,
  date,
  periodKey,
  taskId: 't',
  typeId: 'voucher',
  value: id,
  memo: '',
  createdAt: 0,
});

describe('number checklist', () => {
  it('shows missing work before completion and retains completed rows; respects legacy periods', () => {
    const records = [record('old', '2026-09-01'), record('current', '2026-10-01'), record('future', '2026-11-01')];
    const [row] = numberChecklist(
      [task, { ...task, id: 'archived', archived: true }],
      records,
      [{ id: 'done', taskId: 't', periodKey: 'M2026-10', slot: 0, doneAt: 0 }],
      dayjs('2026-10-18'),
      settings,
    );
    expect(row!.status.completed).toBe(true);
    expect(row!.status.missingNumberTypeIds).toEqual(['invoice']);
    expect(row!.entries[0]!.records.map((r) => r.id)).toEqual(['current']);
    expect(row!.entries[0]!.previous?.id).toBe('old');
    expect(row!.entries[1]!.records).toEqual([]);
    expect(numberChecklist([task], [], [], dayjs('2026-10-18'), settings)[0]!.entries).toHaveLength(2);
  });
  it('uses explicit period over record date, keeps other task numbers separate, and respects fiscal quarters', () => {
    const quarterly = { ...task, recurrence: 'quarterly' as const };
    const records = [record('q1', '2026-10-02', 'FY2026-Q1'), { ...record('other', '2026-07-01'), taskId: 'other' }];
    const [row] = numberChecklist([quarterly], records, [], dayjs('2026-09-30'), settings);
    expect(row!.status.period.key).toBe('FY2026-Q1');
    expect(row!.entries[0]!.records.map((r) => r.id)).toEqual(['q1']);
  });
});

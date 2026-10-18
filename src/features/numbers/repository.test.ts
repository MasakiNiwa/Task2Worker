import { beforeEach, describe, expect, it } from 'vitest';
import { db } from '@/db/db';
import { createTask, emptyTaskInput } from '@/features/tasks/repository';
import { addNumberRecord, createNumberType, deleteNumberType, suggestNumbers, updateNumberRecord } from './repository';

beforeEach(async () => {
  await Promise.all(db.tables.map((t) => t.clear()));
});

const rec = (typeId: string, value: string, taskId?: string) =>
  addNumberRecord({ typeId, value, memo: '', date: '2026-10-18', taskId });

describe('number repository', () => {
  it('suggests numbers of the same task first, newest first, without duplicates', async () => {
    const type = await createNumberType({ name: '伝票番号', description: '' });
    await rec(type, 'A-1', 'x');
    await new Promise((r) => setTimeout(r, 2));
    await rec(type, 'B-1');
    await new Promise((r) => setTimeout(r, 2));
    await rec(type, 'A-2', 'x');
    await new Promise((r) => setTimeout(r, 2));
    await rec(type, 'B-1');
    expect(await suggestNumbers(type, 'x')).toEqual(['A-2', 'A-1', 'B-1']);
    expect(await suggestNumbers(type)).toEqual(['B-1', 'A-2', 'A-1']);
  });

  it('trims values', async () => {
    const type = await createNumberType({ name: 'n', description: '' });
    await rec(type, '  123 ');
    expect((await db.numberRecords.toArray())[0]!.value).toBe('123');
  });

  it('deleting a type removes its records and detaches it from tasks', async () => {
    const type = await createNumberType({ name: 'n', description: '' });
    const taskId = await createTask({
      ...emptyTaskInput,
      title: 't',
      numberTypeIds: [type],
    });
    await rec(type, '1', taskId);
    await deleteNumberType(type);
    expect(await db.numberRecords.count()).toBe(0);
    expect((await db.tasks.get(taskId))!.numberTypeIds).toEqual([]);
  });
});

describe('task period association', () => {
  it('associates standalone entry, reassociates edited date, and detaches changed completion', async () => {
    const taskId = await createTask({
      ...emptyTaskInput,
      title: '月次仕訳',
      recurrence: 'monthly',
    });
    const typeId = await createNumberType({
      name: '伝票番号',
      description: '',
    });
    const id = await addNumberRecord({
      taskId,
      typeId,
      value: '001',
      memo: '',
      date: '2026-10-18',
    });
    expect((await db.numberRecords.get(id))!.periodKey).toBe('M2026-10');
    await updateNumberRecord(id, { completionId: 'completion' });
    await updateNumberRecord(id, { date: '2026-09-30' });
    expect((await db.numberRecords.get(id))!.periodKey).toBe('M2026-09');
    expect((await db.numberRecords.get(id))!.completionId).toBeUndefined();
    await updateNumberRecord(id, { taskId: undefined });
    expect((await db.numberRecords.get(id))!.periodKey).toBeUndefined();
  });
  it('preserves an explicitly selected period when saving and editing only the memo', async () => {
    const taskId = await createTask({
      ...emptyTaskInput,
      title: '日次',
      recurrence: 'daily',
    });
    const typeId = await createNumberType({ name: '番号', description: '' });
    const id = await addNumberRecord({
      taskId,
      typeId,
      value: '002',
      memo: '',
      date: '2026-10-18',
      periodKey: 'D2026-10-17',
    });
    await updateNumberRecord(id, { memo: '深夜の実施' });
    expect((await db.numberRecords.get(id))!.periodKey).toBe('D2026-10-17');
  });
});

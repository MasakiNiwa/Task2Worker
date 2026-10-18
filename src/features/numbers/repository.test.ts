import { beforeEach, describe, expect, it } from 'vitest';
import { db } from '@/db/db';
import { createTask, emptyTaskInput } from '@/features/tasks/repository';
import { addNumberRecord, createNumberType, deleteNumberType, suggestNumbers } from './repository';

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
    const taskId = await createTask({ ...emptyTaskInput, title: 't', numberTypeIds: [type] });
    await rec(type, '1', taskId);
    await deleteNumberType(type);
    expect(await db.numberRecords.count()).toBe(0);
    expect((await db.tasks.get(taskId))!.numberTypeIds).toEqual([]);
  });
});

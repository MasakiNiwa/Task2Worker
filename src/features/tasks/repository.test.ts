import { beforeEach, describe, expect, it } from 'vitest';
import { db } from '@/db/db';
import { completeNext, completeSlot, createTask, deleteTask, emptyTaskInput, uncompleteSlot } from './repository';

beforeEach(async () => {
  await Promise.all(db.tables.map((t) => t.clear()));
});

describe('task repository', () => {
  it('keeps the task after completing a recurring task', async () => {
    const id = await createTask({ ...emptyTaskInput, title: '朝の薬', timesPerPeriod: 3 });
    const task = (await db.tasks.get(id))!;
    await completeNext(task, 'D2026-10-18');
    await completeNext(task, 'D2026-10-18');
    expect(await db.tasks.count()).toBe(1);
    const done = await db.completions.where({ taskId: id, periodKey: 'D2026-10-18' }).toArray();
    expect(done.map((c) => c.slot).sort()).toEqual([0, 1]);
  });

  it('does not exceed timesPerPeriod', async () => {
    const id = await createTask({ ...emptyTaskInput, title: 'a' });
    const task = (await db.tasks.get(id))!;
    expect(await completeNext(task, 'D1')).not.toBeNull();
    expect(await completeNext(task, 'D1')).toBeNull();
  });

  it('completeSlot is idempotent and uncompleteSlot removes it', async () => {
    const id = await createTask({ ...emptyTaskInput, title: 'a' });
    await completeSlot(id, 'D1', 0);
    await completeSlot(id, 'D1', 0);
    expect(await db.completions.count()).toBe(1);
    await uncompleteSlot(id, 'D1', 0);
    expect(await db.completions.count()).toBe(0);
  });

  it('deleteTask removes completions but keeps number records unlinked', async () => {
    const id = await createTask({ ...emptyTaskInput, title: 'a' });
    const c = await completeSlot(id, 'D1', 0);
    await db.numberRecords.add({
      id: 'n1',
      typeId: 't',
      value: '123',
      memo: '',
      date: '2026-10-18',
      taskId: id,
      completionId: c.id,
      createdAt: 0,
    });
    await deleteTask(id);
    expect(await db.tasks.count()).toBe(0);
    expect(await db.completions.count()).toBe(0);
    const n = await db.numberRecords.get('n1');
    expect(n?.taskId).toBeUndefined();
    expect(n?.value).toBe('123');
  });
});

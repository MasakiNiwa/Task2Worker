import { db, newId } from '@/db/db';
import type { Completion, Task } from '@/db/types';

export type TaskInput = Pick<
  Task,
  'title' | 'note' | 'recurrence' | 'timesPerPeriod' | 'tags' | 'numberTypeIds' | 'dueDate'
>;

export const emptyTaskInput: TaskInput = {
  title: '',
  note: '',
  recurrence: 'daily',
  timesPerPeriod: 1,
  tags: [],
  numberTypeIds: [],
  dueDate: undefined,
};

export async function createTask(input: TaskInput): Promise<string> {
  const now = Date.now();
  const last = await db.tasks.orderBy('order').last();
  const id = newId();
  await db.tasks.add({ ...input, id, archived: false, order: (last?.order ?? 0) + 1, createdAt: now, updatedAt: now });
  return id;
}

export async function updateTask(id: string, patch: Partial<Omit<Task, 'id' | 'createdAt'>>): Promise<void> {
  await db.tasks.update(id, { ...patch, updatedAt: Date.now() });
}

/** タスクと実施記録を削除する。番号記録はタスクとの紐付けだけを外して残す */
export async function deleteTask(id: string): Promise<void> {
  await db.transaction('rw', [db.tasks, db.completions, db.numberRecords], async () => {
    await db.completions.where('taskId').equals(id).delete();
    await db.numberRecords.where('taskId').equals(id).modify((r) => {
      delete r.taskId;
      delete r.completionId;
    });
    await db.tasks.delete(id);
  });
}

/** 期間内の指定回を実施済みにする(既に実施済みなら既存の記録を返す) */
export async function completeSlot(taskId: string, periodKey: string, slot: number): Promise<Completion> {
  return db.transaction('rw', db.completions, async () => {
    const existing = await db.completions.where({ taskId, periodKey }).filter((c) => c.slot === slot).first();
    if (existing) return existing;
    const c: Completion = { id: newId(), taskId, periodKey, slot, doneAt: Date.now() };
    await db.completions.add(c);
    return c;
  });
}

/** 期間内の指定回の実施を取り消す */
export async function uncompleteSlot(taskId: string, periodKey: string, slot: number): Promise<void> {
  await db.transaction('rw', [db.completions, db.numberRecords], async () => {
    const targets = await db.completions.where({ taskId, periodKey }).filter((c) => c.slot === slot).toArray();
    const ids = targets.map((c) => c.id);
    await db.numberRecords.where('completionId').anyOf(ids).modify((r) => {
      delete r.completionId;
    });
    await db.completions.bulkDelete(ids);
  });
}

/** 未実施の最初の回を実施済みにする。全回済みなら null */
export async function completeNext(task: Task, periodKey: string): Promise<Completion | null> {
  const done = await db.completions.where({ taskId: task.id, periodKey }).toArray();
  const doneSlots = new Set(done.map((c) => c.slot));
  for (let i = 0; i < task.timesPerPeriod; i++) {
    if (!doneSlots.has(i)) return completeSlot(task.id, periodKey, i);
  }
  return null;
}

import dayjs from 'dayjs';
import { db, newId } from '@/db/db';
import type { NumberRecord, NumberType } from '@/db/types';
import { getSettings } from '@/features/settings/store';
import { periodOf } from '@/features/tasks/period';

export async function createNumberType(input: Pick<NumberType, 'name' | 'description'>): Promise<string> {
  const last = await db.numberTypes.orderBy('order').last();
  const id = newId();
  await db.numberTypes.add({
    ...input,
    id,
    order: (last?.order ?? 0) + 1,
    createdAt: Date.now(),
  });
  return id;
}

export async function updateNumberType(
  id: string,
  patch: Partial<Pick<NumberType, 'name' | 'description'>>,
): Promise<void> {
  await db.numberTypes.update(id, patch);
}

/** 種類と、その種類の番号記録を削除し、タスクの「記録する番号」からも外す */
export async function deleteNumberType(id: string): Promise<void> {
  await db.transaction('rw', [db.numberTypes, db.numberRecords, db.tasks], async () => {
    await db.numberRecords.where('typeId').equals(id).delete();
    await db.tasks.toCollection().modify((t) => {
      t.numberTypeIds = t.numberTypeIds.filter((x) => x !== id);
    });
    await db.numberTypes.delete(id);
  });
}

export type NumberRecordInput = Omit<NumberRecord, 'id' | 'createdAt'>;

async function withPeriod(input: NumberRecordInput): Promise<NumberRecordInput> {
  const task = input.taskId ? await db.tasks.get(input.taskId) : undefined;
  return {
    ...input,
    periodKey: task ? (input.periodKey ?? periodOf(task.recurrence, dayjs(input.date), getSettings()).key) : undefined,
  };
}

export async function addNumberRecord(input: NumberRecordInput): Promise<string> {
  const id = newId();
  await db.numberRecords.add({
    ...(await withPeriod(input)),
    value: input.value.trim(),
    id,
    createdAt: Date.now(),
  });
  return id;
}

export async function updateNumberRecord(id: string, patch: Partial<NumberRecordInput>): Promise<void> {
  const current = await db.numberRecords.get(id);
  if (!current) return;
  const input = { ...current, ...patch };
  if (input.taskId !== current.taskId || input.date !== current.date) {
    input.periodKey = undefined;
    input.completionId = undefined;
  }
  const normalized = await withPeriod(input);
  await db.numberRecords.update(id, {
    ...normalized,
    value: normalized.value.trim(),
  });
}

export async function deleteNumberRecord(id: string): Promise<void> {
  await db.numberRecords.delete(id);
}

/**
 * 番号の候補(再利用用)。同じタスクで使った番号を優先し、新しい順に重複なく返す。
 */
export async function suggestNumbers(typeId: string, taskId?: string, limit = 50): Promise<string[]> {
  const records = await db.numberRecords.where('typeId').equals(typeId).toArray();
  records.sort((a, b) => {
    const sameA = taskId && a.taskId === taskId ? 1 : 0;
    const sameB = taskId && b.taskId === taskId ? 1 : 0;
    return sameB - sameA || b.createdAt - a.createdAt;
  });
  return [...new Set(records.map((r) => r.value))].slice(0, limit);
}

export const todayString = () => dayjs().format('YYYY-MM-DD');

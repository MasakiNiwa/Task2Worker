import Dexie, { type EntityTable } from 'dexie';
import type { Completion, NumberRecord, NumberType, Task } from './types';

export const DB_NAME = 'task2worker';

export class Task2WorkerDB extends Dexie {
  tasks!: EntityTable<Task, 'id'>;
  completions!: EntityTable<Completion, 'id'>;
  numberTypes!: EntityTable<NumberType, 'id'>;
  numberRecords!: EntityTable<NumberRecord, 'id'>;

  constructor() {
    super(DB_NAME);
    // スキーマを変更するときは version(2) 以降を追加し、upgrade() でデータを移行すること
    this.version(1).stores({
      tasks: 'id, recurrence, archived, order, *tags',
      completions: 'id, taskId, periodKey, [taskId+periodKey], doneAt',
      numberTypes: 'id, order',
      numberRecords: 'id, typeId, value, [typeId+value], taskId, completionId, date, createdAt',
    });
  }
}

export const db = new Task2WorkerDB();

export function newId(): string {
  return crypto.randomUUID();
}

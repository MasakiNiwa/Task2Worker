import dayjs from 'dayjs';
import Papa from 'papaparse';
import { db } from '@/db/db';
import type { Completion, NumberRecord, NumberType, Task } from '@/db/types';
import { defaultSettings, getSettings, useSettings, type Settings } from '@/features/settings/store';
import { labelOfPeriodKey, recurrenceLabels } from '@/features/tasks/period';

export const BACKUP_APP = 'task2worker';
export const BACKUP_FORMAT = 1;

export interface Backup {
  app: typeof BACKUP_APP;
  format: number;
  exportedAt: string;
  settings: Settings;
  data: {
    tasks: Task[];
    completions: Completion[];
    numberTypes: NumberType[];
    numberRecords: NumberRecord[];
  };
}

export async function createBackup(): Promise<Backup> {
  return db.transaction('r', db.tables, async () => ({
    app: BACKUP_APP,
    format: BACKUP_FORMAT,
    exportedAt: new Date().toISOString(),
    settings: getSettings(),
    data: {
      tasks: await db.tasks.toArray(),
      completions: await db.completions.toArray(),
      numberTypes: await db.numberTypes.toArray(),
      numberRecords: await db.numberRecords.toArray(),
    },
  }));
}

export class BackupError extends Error {}

const isObjArray = (v: unknown): v is Record<string, unknown>[] =>
  Array.isArray(v) && v.every((x) => x && typeof x === 'object' && typeof (x as { id?: unknown }).id === 'string');

/** JSON を検証してバックアップとして読み取る。形式が違えば BackupError */
export function parseBackup(json: string): Backup {
  let raw: unknown;
  try {
    raw = JSON.parse(json);
  } catch {
    throw new BackupError('JSON として読み込めませんでした');
  }
  const b = raw as Partial<Backup>;
  if (b?.app !== BACKUP_APP) throw new BackupError('Task2Worker のバックアップファイルではありません');
  if (typeof b.format !== 'number' || b.format > BACKUP_FORMAT) {
    throw new BackupError('新しいバージョンのアプリで作られたバックアップです。アプリを更新してください');
  }
  const d = b.data;
  if (!d || !isObjArray(d.tasks) || !isObjArray(d.completions) || !isObjArray(d.numberTypes) || !isObjArray(d.numberRecords)) {
    throw new BackupError('バックアップの内容が壊れています');
  }
  return {
    ...(b as Backup),
    settings: { ...defaultSettings, ...b.settings },
    // 古い形式で欠けている項目を補う
    data: {
      ...d,
      tasks: (d.tasks as unknown as Record<string, unknown>[]).map(
        (t) => ({ tags: [], numberTypeIds: [], note: '', archived: false, timesPerPeriod: 1, ...t }) as unknown as Task,
      ),
    },
  };
}

/** 現在のデータをすべて置き換えて復元する */
export async function restoreBackup(b: Backup): Promise<void> {
  await db.transaction('rw', db.tables, async () => {
    await Promise.all(db.tables.map((t) => t.clear()));
    await db.tasks.bulkAdd(b.data.tasks);
    await db.completions.bulkAdd(b.data.completions);
    await db.numberTypes.bulkAdd(b.data.numberTypes);
    await db.numberRecords.bulkAdd(b.data.numberRecords);
  });
  useSettings.getState().update(b.settings);
}

export function downloadFile(filename: string, content: string, type: string): void {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

const stamp = () => dayjs().format('YYYYMMDD-HHmm');

export async function exportJson(): Promise<void> {
  const backup = await createBackup();
  downloadFile(`task2worker-backup-${stamp()}.json`, JSON.stringify(backup, null, 2), 'application/json');
}

/** Excel で文字化けしないよう BOM 付きで CSV を書き出す */
function toCsv(rows: Record<string, unknown>[]): string {
  return '﻿' + Papa.unparse(rows);
}

export async function exportCompletionsCsv(): Promise<void> {
  const tasks = new Map((await db.tasks.toArray()).map((t) => [t.id, t]));
  const rows = (await db.completions.orderBy('doneAt').toArray()).map((c) => {
    const t = tasks.get(c.taskId);
    return {
      実施日時: dayjs(c.doneAt).format('YYYY-MM-DD HH:mm'),
      タスク: t?.title ?? '(削除済み)',
      周期: t ? recurrenceLabels[t.recurrence] : '',
      期間: labelOfPeriodKey(c.periodKey),
      回: c.slot + 1,
      タグ: t?.tags.join(' ') ?? '',
    };
  });
  downloadFile(`task2worker-実施記録-${stamp()}.csv`, toCsv(rows), 'text/csv');
}

export async function exportNumbersCsv(): Promise<void> {
  const tasks = new Map((await db.tasks.toArray()).map((t) => [t.id, t]));
  const types = new Map((await db.numberTypes.toArray()).map((t) => [t.id, t]));
  const rows = (await db.numberRecords.orderBy('date').toArray()).map((r) => ({
    日付: r.date,
    種類: types.get(r.typeId)?.name ?? '',
    番号: r.value,
    タスク: r.taskId ? (tasks.get(r.taskId)?.title ?? '') : '',
    期間: r.periodKey ? labelOfPeriodKey(r.periodKey) : '',
    メモ: r.memo,
  }));
  downloadFile(`task2worker-番号-${stamp()}.csv`, toCsv(rows), 'text/csv');
}

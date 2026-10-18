import { beforeEach, describe, expect, it } from 'vitest';
import { db } from '@/db/db';
import { useSettings } from '@/features/settings/store';
import { createTask, completeSlot, emptyTaskInput } from '@/features/tasks/repository';
import { BackupError, createBackup, parseBackup, restoreBackup } from './backup';

beforeEach(async () => {
  await Promise.all(db.tables.map((t) => t.clear()));
  useSettings.getState().reset();
});

describe('backup', () => {
  it('round-trips all data and settings', async () => {
    const id = await createTask({ ...emptyTaskInput, title: '服薬', timesPerPeriod: 2 });
    await completeSlot(id, 'D2026-10-18', 0);
    useSettings.getState().update({ fiscalYearStartMonth: 1 });
    const json = JSON.stringify(await createBackup());

    await Promise.all(db.tables.map((t) => t.clear()));
    useSettings.getState().reset();
    await restoreBackup(parseBackup(json));

    expect((await db.tasks.get(id))?.title).toBe('服薬');
    expect(await db.completions.count()).toBe(1);
    expect(useSettings.getState().fiscalYearStartMonth).toBe(1);
  });

  it('rejects files that are not backups', () => {
    expect(() => parseBackup('not json')).toThrow(BackupError);
    expect(() => parseBackup('{"app":"other"}')).toThrow(/バックアップファイルではありません/);
    expect(() => parseBackup('{"app":"task2worker","format":99,"data":{}}')).toThrow(/新しいバージョン/);
    expect(() => parseBackup('{"app":"task2worker","format":1,"data":{"tasks":[{}]}}')).toThrow(/壊れています/);
  });
});

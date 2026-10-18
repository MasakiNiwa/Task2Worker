import { describe, expect, it } from 'vitest';
import { db, newId } from '@/db/db';
import { useSettings } from '@/features/settings/store';
import { clearAllData } from './clearAll';

describe('clearAllData', () => {
  it('removes every table row and resets settings', async () => {
    const now = Date.now();
    await db.tasks.add({
      id: newId(),
      title: 't',
      note: '',
      recurrence: 'daily',
      timesPerPeriod: 1,
      tags: [],
      numberTypeIds: [],
      archived: false,
      order: 0,
      createdAt: now,
      updatedAt: now,
    });
    await db.numberTypes.add({ id: newId(), name: '伝票番号', description: '', order: 0, createdAt: now });
    useSettings.getState().update({ fiscalYearStartMonth: 1 });

    await clearAllData();

    expect(await db.tasks.count()).toBe(0);
    expect(await db.numberTypes.count()).toBe(0);
    expect(useSettings.getState().fiscalYearStartMonth).toBe(4);
  });
});

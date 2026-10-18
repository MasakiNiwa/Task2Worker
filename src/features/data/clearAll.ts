import { db } from '@/db/db';
import { useSettings } from '@/features/settings/store';

/** すべてのデータ(タスク・実施記録・番号・設定)を削除して初期状態に戻す */
export async function clearAllData(): Promise<void> {
  await db.transaction('rw', db.tables, async () => {
    await Promise.all(db.tables.map((t) => t.clear()));
  });
  useSettings.getState().reset();
}

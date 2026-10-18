import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/db/db';
import type { NumberType } from '@/db/types';
import { suggestNumbers } from './repository';

export function useNumberTypes(): NumberType[] | undefined {
  return useLiveQuery(() => db.numberTypes.orderBy('order').toArray());
}

/** 番号の種類 ID → 種類 */
export function useNumberTypeMap(): Map<string, NumberType> {
  const types = useNumberTypes() ?? [];
  return new Map(types.map((t) => [t.id, t]));
}

export function useSuggestions(typeId: string | null | undefined, taskId?: string): string[] {
  return (
    useLiveQuery(async () => {
      if (!typeId) return [];
      return suggestNumbers(typeId, taskId);
    }, [typeId, taskId]) ?? []
  );
}

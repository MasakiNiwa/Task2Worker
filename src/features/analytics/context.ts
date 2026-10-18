import { createContext, useContext } from 'react';
import type { Task } from '@/db/types';
import type { EngineApi } from './client';
import type { FactFilter } from './facts';

export interface AnalyticsContextValue {
  engine: EngineApi;
  /** データを読み込み直すたびに増える。ツールはこれを依存に入れて再集計する */
  version: number;
  tasks: Map<string, Task>;
  filter: FactFilter;
  setFilter: (f: FactFilter) => void;
}

export const AnalyticsContext = createContext<AnalyticsContextValue | null>(null);

export function useAnalytics(): AnalyticsContextValue {
  const ctx = useContext(AnalyticsContext);
  if (!ctx) throw new Error('AnalyticsContext がありません');
  return ctx;
}

import { useEffect, useState } from 'react';
import { useAnalytics } from './context';
import type { EngineApi } from './client';

/** 分析エンジン(Worker)に問い合わせ、結果を返す。deps が変わると再計算する */
export function useEngineQuery<T>(query: (engine: EngineApi) => Promise<T> | T, deps: unknown[]): T | undefined {
  const { engine, version } = useAnalytics();
  const [result, setResult] = useState<T>();
  useEffect(() => {
    let cancelled = false;
    void Promise.resolve(query(engine)).then((r) => !cancelled && setResult(r));
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [engine, version, ...deps]);
  return result;
}

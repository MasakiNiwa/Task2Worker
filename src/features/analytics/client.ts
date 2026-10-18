import { wrap, type Remote } from 'comlink';
import { AnalyticsEngine } from './engine';

/** 分析エンジンの API。呼び出し結果は常に Promise として扱う */
export type EngineApi = Remote<AnalyticsEngine>;

let engine: EngineApi | null = null;

/** Worker 上の分析エンジン。Worker が使えない環境ではメインスレッドで動かす */
export function getEngine(): EngineApi {
  if (engine) return engine;
  if (typeof Worker === 'undefined') {
    // 同期の戻り値も await できるので、同じ型として扱える
    engine = new AnalyticsEngine() as unknown as EngineApi;
  } else {
    engine = wrap<AnalyticsEngine>(new Worker(new URL('./analytics.worker.ts', import.meta.url), { type: 'module' }));
  }
  return engine;
}

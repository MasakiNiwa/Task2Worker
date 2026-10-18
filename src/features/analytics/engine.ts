import type { Completion, Task } from '@/db/types';
import type { PeriodSettings } from '@/features/tasks/period';
import {
  achievements,
  applyFilter,
  buildFacts,
  drilldown,
  histogramCpu,
  hourWeekdayBins,
  type Achievement,
  type DrilldownResult,
  type Fact,
  type FactFilter,
} from './facts';
import { histogramGpu } from './gpu';

export type ComputeEngine = 'webgpu' | 'cpu';

/**
 * 分析エンジン。Web Worker 内で動かし(analytics.worker.ts)、UI スレッドを止めずに集計する。
 * 新しい分析ツールで集計が必要になったら、ここにメソッドを追加する。
 */
export class AnalyticsEngine {
  private tasks: Task[] = [];
  private completions: Completion[] = [];
  private facts: Fact[] = [];
  private settings!: PeriodSettings;

  load(tasks: Task[], completions: Completion[], settings: PeriodSettings): number {
    this.tasks = tasks;
    this.completions = completions;
    this.settings = settings;
    this.facts = buildFacts(tasks, completions, settings);
    return this.facts.length;
  }

  drilldown(path: string[], filter: FactFilter): DrilldownResult {
    return drilldown(this.facts, path, filter, this.settings);
  }

  async hourWeekday(filter: FactFilter, useGpu: boolean): Promise<{ counts: number[]; engine: ComputeEngine; ms: number }> {
    const t0 = performance.now();
    const bins = hourWeekdayBins(applyFilter(this.facts, filter));
    if (useGpu) {
      const counts = await histogramGpu(bins, 168);
      if (counts) return { counts, engine: 'webgpu', ms: performance.now() - t0 };
    }
    return { counts: histogramCpu(bins, 168), engine: 'cpu', ms: performance.now() - t0 };
  }

  achievements(today: string): Achievement[] {
    return achievements(this.tasks, this.completions, today, this.settings);
  }
}

import dayjs from 'dayjs';
import type { Completion, Recurrence, Task } from '@/db/types';
import { logicalDate, periodOf, type PeriodSettings } from '@/features/tasks/period';

/** 分析用に正規化した 1 件の実施記録 */
export interface Fact {
  taskId: string;
  recurrence: Recurrence;
  tags: string[];
  doneAt: number;
  /** 論理日付 (YYYY-MM-DD) */
  date: string;
  hour: number;
  /** 0: 日曜 … 6: 土曜 */
  weekday: number;
  year: string;
  quarter: string;
  month: string;
  day: string;
}

export interface FactFilter {
  taskIds?: string[];
  tags?: string[];
  recurrences?: Recurrence[];
}

export function buildFacts(tasks: Task[], completions: Completion[], s: PeriodSettings): Fact[] {
  const taskMap = new Map(tasks.map((t) => [t.id, t]));
  const facts: Fact[] = [];
  for (const c of completions) {
    const task = taskMap.get(c.taskId);
    if (!task) continue;
    const at = dayjs(c.doneAt);
    const d = logicalDate(at, s);
    facts.push({
      taskId: c.taskId,
      recurrence: task.recurrence,
      tags: task.tags,
      doneAt: c.doneAt,
      date: d.format('YYYY-MM-DD'),
      hour: at.hour(),
      weekday: at.day(),
      year: periodOf('yearly', d, s).key,
      quarter: periodOf('quarterly', d, s).key,
      month: periodOf('monthly', d, s).key,
      day: periodOf('daily', d, s).key,
    });
  }
  return facts;
}

export function applyFilter(facts: Fact[], f: FactFilter): Fact[] {
  return facts.filter(
    (x) =>
      (!f.taskIds?.length || f.taskIds.includes(x.taskId)) &&
      (!f.recurrences?.length || f.recurrences.includes(x.recurrence)) &&
      (!f.tags?.length || x.tags.some((t) => f.tags!.includes(t))),
  );
}

// ---------- 時間軸のドリルダウン ----------

export const timeLevels = ['year', 'quarter', 'month', 'day'] as const;
export type TimeLevel = (typeof timeLevels)[number];
export const timeLevelLabels: Record<TimeLevel, string> = { year: '年度', quarter: '四半期', month: '月', day: '日' };

export interface Bucket {
  key: string;
  label: string;
  count: number;
}

export interface DrilldownResult {
  level: TimeLevel;
  /** 次の階層へ掘り下げられるか */
  canDrill: boolean;
  buckets: Bucket[];
  byTask: { taskId: string; count: number }[];
  total: number;
}

const recurrenceOfLevel: Record<TimeLevel, Recurrence> = {
  year: 'yearly',
  quarter: 'quarterly',
  month: 'monthly',
  day: 'daily',
};

/** 親の期間に含まれる子の期間を(0件でも)すべて列挙する */
function childPeriods(level: TimeLevel, parentKey: string | undefined, facts: Fact[], s: PeriodSettings): Bucket[] {
  if (level === 'year') {
    const years = [...new Set(facts.map((f) => f.year))].sort();
    if (years.length === 0) return [];
    const first = Number(years[0]!.slice(2));
    const last = Number(years[years.length - 1]!.slice(2));
    return Array.from({ length: last - first + 1 }, (_, i) => {
      const key = `FY${first + i}`;
      return { key, label: s.fiscalYearStartMonth === 1 ? `${first + i}年` : `${first + i}年度`, count: 0 };
    });
  }
  const parentLevel = timeLevels[timeLevels.indexOf(level) - 1]!;
  // 親期間の初日から末日まで 1 日ずつ進め、子の期間キーを重複なく集める
  const anyFact = facts.find((f) => f[parentLevel] === parentKey);
  const start = parentStart(parentLevel, parentKey!, anyFact, s);
  const end = periodOf(recurrenceOfLevel[parentLevel], start, s).end;
  const seen = new Map<string, Bucket>();
  for (let d = start; !d.isAfter(end); d = d.add(1, 'day')) {
    const p = periodOf(recurrenceOfLevel[level], d, s);
    if (!seen.has(p.key)) seen.set(p.key, { key: p.key, label: shortLabel(level, p.key, p.label), count: 0 });
  }
  return [...seen.values()];
}

function parentStart(level: TimeLevel, key: string, sample: Fact | undefined, s: PeriodSettings) {
  if (sample) return periodOf(recurrenceOfLevel[level], dayjs(sample.date), s).start;
  if (level === 'year') return dayjs(new Date(Number(key.slice(2)), s.fiscalYearStartMonth - 1, 1));
  if (level === 'month') return dayjs(`${key.slice(1)}-01`);
  const m = /^FY(\d{4})-Q(\d)$/.exec(key)!;
  return dayjs(new Date(Number(m[1]), s.fiscalYearStartMonth - 1 + (Number(m[2]) - 1) * 3, 1));
}

function shortLabel(level: TimeLevel, key: string, label: string): string {
  if (level === 'quarter') return `Q${key.slice(-1)}`;
  if (level === 'month') return `${Number(key.slice(6))}月`;
  if (level === 'day') return `${Number(key.slice(9))}日`;
  return label;
}

/**
 * path は上の階層から選んだ期間キーの並び (例: ['FY2026', 'FY2026-Q3'])。
 * path の長さで表示する階層が決まる。
 */
export function drilldown(allFacts: Fact[], path: string[], filter: FactFilter, s: PeriodSettings): DrilldownResult {
  const depth = Math.min(path.length, timeLevels.length - 1);
  const level = timeLevels[depth]!;
  let facts = applyFilter(allFacts, filter);
  for (let i = 0; i < depth; i++) {
    const lv = timeLevels[i]!;
    facts = facts.filter((f) => f[lv] === path[i]);
  }
  const buckets = childPeriods(level, path[depth - 1], level === 'year' ? applyFilter(allFacts, filter) : facts, s);
  const index = new Map(buckets.map((b) => [b.key, b]));
  const byTask = new Map<string, number>();
  for (const f of facts) {
    const b = index.get(f[level]);
    if (b) b.count++;
    byTask.set(f.taskId, (byTask.get(f.taskId) ?? 0) + 1);
  }
  return {
    level,
    canDrill: depth < timeLevels.length - 1,
    buckets,
    byTask: [...byTask].map(([taskId, count]) => ({ taskId, count })).sort((a, b) => b.count - a.count),
    total: facts.length,
  };
}

// ---------- 時間帯 × 曜日 ----------

/** 曜日 (0-6) × 時 (0-23) のビン番号 */
export function hourWeekdayBins(facts: Fact[]): Uint32Array {
  const bins = new Uint32Array(facts.length);
  facts.forEach((f, i) => (bins[i] = f.weekday * 24 + f.hour));
  return bins;
}

export function histogramCpu(bins: Uint32Array, size: number): number[] {
  const out = new Array<number>(size).fill(0);
  for (const b of bins) if (b < size) out[b]!++;
  return out;
}

// ---------- 達成率 ----------

export interface Achievement {
  taskId: string;
  /** 対象期間(古い順) */
  periods: { key: string; label: string; done: number; target: number }[];
  rate: number;
}

const lookback: Record<Exclude<Recurrence, 'once'>, number> = {
  daily: 30,
  weekly: 12,
  monthly: 12,
  quarterly: 8,
  yearly: 5,
};

/** 直近の期間ごとの達成状況(タスク作成前の期間は除く)。今の期間は進行中なので含めない */
export function achievements(tasks: Task[], completions: Completion[], today: string, s: PeriodSettings): Achievement[] {
  const slots = new Map<string, Set<number>>();
  for (const c of completions) {
    const k = `${c.taskId}|${c.periodKey}`;
    const set = slots.get(k) ?? new Set<number>();
    set.add(c.slot);
    slots.set(k, set);
  }
  const result: Achievement[] = [];
  for (const t of tasks) {
    if (t.recurrence === 'once' || t.archived) continue;
    const created = dayjs(t.createdAt).startOf('day');
    let p = periodOf(t.recurrence, dayjs(today), s);
    const periods: Achievement['periods'] = [];
    for (let i = 0; i < lookback[t.recurrence]; i++) {
      p = periodOf(t.recurrence, p.start.subtract(1, 'day'), s);
      if (p.end.isBefore(created)) break;
      const done = [...(slots.get(`${t.id}|${p.key}`) ?? [])].filter((x) => x < t.timesPerPeriod).length;
      periods.unshift({ key: p.key, label: p.label, done, target: t.timesPerPeriod });
    }
    const achieved = periods.filter((x) => x.done >= x.target).length;
    result.push({ taskId: t.id, periods, rate: periods.length ? achieved / periods.length : NaN });
  }
  return result;
}

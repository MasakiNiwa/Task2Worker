import dayjs, { type Dayjs } from 'dayjs';
import type { Recurrence } from '@/db/types';
import type { Settings } from '@/features/settings/store';

export type PeriodSettings = Pick<Settings, 'weekStartsOn' | 'fiscalYearStartMonth' | 'dayStartHour'>;

export interface Period {
  /** 実施記録に保存するキー (例: D2026-10-18 / W2026-10-12 / M2026-10 / FY2026-Q3 / FY2026 / once) */
  key: string;
  /** 画面表示用の名前 */
  label: string;
  /** 期間の初日と最終日 (論理日付) */
  start: Dayjs;
  end: Dayjs;
}

export const recurrenceLabels: Record<Recurrence, string> = {
  yearly: '年次',
  quarterly: '四半期',
  monthly: '月次',
  weekly: '週次',
  daily: '日次',
  once: '単発',
};

/** 表示順(長い周期 → 短い周期) */
export const recurrenceOrder: Recurrence[] = ['daily', 'weekly', 'monthly', 'quarterly', 'yearly', 'once'];

/** 「1日の切り替わり時刻」を考慮した論理上の日付 */
export function logicalDate(now: Date | number | Dayjs, s: PeriodSettings): Dayjs {
  return dayjs(now).subtract(s.dayStartHour, 'hour').startOf('day');
}

function fiscalYearStart(date: Dayjs, s: PeriodSettings): Dayjs {
  const startMonth = s.fiscalYearStartMonth - 1;
  const year = date.month() >= startMonth ? date.year() : date.year() - 1;
  return dayjs(new Date(year, startMonth, 1));
}

const fmt = (d: Dayjs) => d.format('YYYY-MM-DD');

/** 指定日を含む期間を求める */
export function periodOf(recurrence: Recurrence, date: Dayjs, s: PeriodSettings): Period {
  const d = date.startOf('day');
  switch (recurrence) {
    case 'daily':
      return { key: `D${fmt(d)}`, label: d.format('M/D(dd)'), start: d, end: d };
    case 'weekly': {
      const diff = (d.day() - s.weekStartsOn + 7) % 7;
      const start = d.subtract(diff, 'day');
      const end = start.add(6, 'day');
      return { key: `W${fmt(start)}`, label: `${start.format('M/D')}〜${end.format('M/D')}`, start, end };
    }
    case 'monthly': {
      const start = d.startOf('month');
      return { key: `M${start.format('YYYY-MM')}`, label: start.format('YYYY年M月'), start, end: d.endOf('month').startOf('day') };
    }
    case 'quarterly': {
      const fy = fiscalYearStart(d, s);
      const q = Math.floor(d.diff(fy, 'month') / 3);
      const start = fy.add(q * 3, 'month');
      const end = start.add(3, 'month').subtract(1, 'day');
      return {
        key: `FY${fy.year()}-Q${q + 1}`,
        label: `${fy.year()}年度 Q${q + 1}`,
        start,
        end,
      };
    }
    case 'yearly': {
      const start = fiscalYearStart(d, s);
      const end = start.add(1, 'year').subtract(1, 'day');
      const label = s.fiscalYearStartMonth === 1 ? `${start.year()}年` : `${start.year()}年度`;
      return { key: `FY${start.year()}`, label, start, end };
    }
    case 'once':
      return { key: 'once', label: '単発', start: d, end: d };
  }
}

/** 指定日の1つ前の期間 */
export function previousPeriod(recurrence: Recurrence, period: Period, s: PeriodSettings): Period {
  return periodOf(recurrence, period.start.subtract(1, 'day'), s);
}

/** 期間の残り日数(当日を含む) */
export function daysLeft(period: Period, today: Dayjs): number {
  return period.end.diff(today.startOf('day'), 'day') + 1;
}

/** 期間キーから表示用の名前を作る(履歴表示用) */
export function labelOfPeriodKey(key: string): string {
  if (key === 'once') return '単発';
  if (key.startsWith('D')) return dayjs(key.slice(1)).format('YYYY/M/D(dd)');
  if (key.startsWith('W')) return `${dayjs(key.slice(1)).format('YYYY/M/D')}の週`;
  if (key.startsWith('M')) return dayjs(`${key.slice(1)}-01`).format('YYYY年M月');
  const m = /^FY(\d{4})(?:-Q(\d))?$/.exec(key);
  if (m) return m[2] ? `${m[1]}年度 Q${m[2]}` : `${m[1]}年度`;
  return key;
}

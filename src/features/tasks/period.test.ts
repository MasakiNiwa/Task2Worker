import dayjs from 'dayjs';
import { describe, expect, it } from 'vitest';
import { daysLeft, labelOfPeriodKey, logicalDate, periodOf, previousPeriod } from './period';

const s = { weekStartsOn: 1 as const, fiscalYearStartMonth: 4, dayStartHour: 0 };
const d = dayjs('2026-10-18'); // 日曜

describe('periodOf', () => {
  it('daily', () => expect(periodOf('daily', d, s).key).toBe('D2026-10-18'));

  it('weekly respects week start', () => {
    expect(periodOf('weekly', d, s).key).toBe('W2026-10-12');
    expect(periodOf('weekly', d, { ...s, weekStartsOn: 0 }).key).toBe('W2026-10-18');
  });

  it('monthly', () => {
    const p = periodOf('monthly', d, s);
    expect(p.key).toBe('M2026-10');
    expect(p.end.format('YYYY-MM-DD')).toBe('2026-10-31');
  });

  it('quarterly follows fiscal year', () => {
    expect(periodOf('quarterly', d, s).key).toBe('FY2026-Q3');
    expect(periodOf('quarterly', dayjs('2027-02-10'), s).key).toBe('FY2026-Q4');
    expect(periodOf('quarterly', d, { ...s, fiscalYearStartMonth: 1 }).key).toBe('FY2026-Q4');
    const p = periodOf('quarterly', dayjs('2027-02-10'), s);
    expect(p.start.format('YYYY-MM-DD')).toBe('2027-01-01');
    expect(p.end.format('YYYY-MM-DD')).toBe('2027-03-31');
  });

  it('yearly follows fiscal year', () => {
    expect(periodOf('yearly', dayjs('2027-03-31'), s).key).toBe('FY2026');
    expect(periodOf('yearly', dayjs('2027-04-01'), s).key).toBe('FY2027');
  });

  it('previous period', () => {
    expect(previousPeriod('weekly', periodOf('weekly', d, s), s).key).toBe('W2026-10-05');
    expect(previousPeriod('quarterly', periodOf('quarterly', d, s), s).key).toBe('FY2026-Q2');
  });
});

describe('logicalDate', () => {
  it('treats early-morning time as previous day when dayStartHour is set', () => {
    const t = new Date(2026, 9, 18, 3, 0);
    expect(logicalDate(t, s).format('YYYY-MM-DD')).toBe('2026-10-18');
    expect(logicalDate(t, { ...s, dayStartHour: 4 }).format('YYYY-MM-DD')).toBe('2026-10-17');
  });
});

describe('daysLeft', () => {
  it('counts today', () => {
    expect(daysLeft(periodOf('monthly', d, s), d)).toBe(14);
    expect(daysLeft(periodOf('daily', d, s), d)).toBe(1);
  });
});

describe('labelOfPeriodKey', () => {
  it('formats each key type', () => {
    expect(labelOfPeriodKey('M2026-10')).toBe('2026年10月');
    expect(labelOfPeriodKey('FY2026-Q3')).toBe('2026年度 Q3');
    expect(labelOfPeriodKey('FY2026')).toBe('2026年度');
    expect(labelOfPeriodKey('W2026-10-12')).toBe('2026/10/12の週');
  });
});

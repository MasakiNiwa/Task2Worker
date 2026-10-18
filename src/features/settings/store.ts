import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Settings {
  /** 週の始まり (0: 日曜, 1: 月曜) */
  weekStartsOn: 0 | 1;
  /** 年度の開始月 (1-12)。年次・四半期タスクの区切りに使う */
  fiscalYearStartMonth: number;
  /** 1日の切り替わり時刻 (0-23時)。深夜作業を前日扱いにしたい場合に使う */
  dayStartHour: number;
  /** 分析で GPU (WebGPU) を使う */
  useGpu: boolean;
}

export const defaultSettings: Settings = {
  weekStartsOn: 1,
  fiscalYearStartMonth: 4,
  dayStartHour: 0,
  useGpu: true,
};

interface SettingsState extends Settings {
  update: (patch: Partial<Settings>) => void;
  reset: () => void;
}

export const SETTINGS_STORAGE_KEY = 'task2worker:settings';

export const useSettings = create<SettingsState>()(
  persist(
    (set) => ({
      ...defaultSettings,
      update: (patch) => set(patch),
      reset: () => set(defaultSettings),
    }),
    { name: SETTINGS_STORAGE_KEY, version: 1 },
  ),
);

/** React 外 (集計処理など) から現在の設定値を取り出す */
export function getSettings(): Settings {
  const { weekStartsOn, fiscalYearStartMonth, dayStartHour, useGpu } = useSettings.getState();
  return { weekStartsOn, fiscalYearStartMonth, dayStartHour, useGpu };
}

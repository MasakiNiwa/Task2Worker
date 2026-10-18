/** 繰り返し周期。once は繰り返さない単発タスク */
export type Recurrence = 'once' | 'yearly' | 'quarterly' | 'monthly' | 'weekly' | 'daily';

export interface Task {
  id: string;
  title: string;
  /** タスクの中身(手順・メモ)。Markdown で記述する */
  note: string;
  recurrence: Recurrence;
  /** 1期間あたりの実施回数。daily で 3 なら「1日3回」 */
  timesPerPeriod: number;
  tags: string[];
  /** 実施時に記録したい番号の種類(伝票番号など) */
  numberTypeIds: string[];
  /** 単発タスクの期限 (YYYY-MM-DD) */
  dueDate?: string;
  archived: boolean;
  order: number;
  createdAt: number;
  updatedAt: number;
}

/**
 * 実施記録。繰り返しタスクを消化してもタスク自体は消さず、
 * 「どの期間の何回目をいつ実施したか」をここに積み上げる。
 */
export interface Completion {
  id: string;
  taskId: string;
  /** 期間キー: 2026 / 2026-Q3 / 2026-10 / 2026-W42 / 2026-10-18 / once */
  periodKey: string;
  /** 期間内の何回目か (0 始まり) */
  slot: number;
  doneAt: number;
  note?: string;
}

/** ユーザーが自由に定義する番号の種類(例: 伝票番号、請求書番号、問い合わせ番号) */
export interface NumberType {
  id: string;
  name: string;
  description: string;
  order: number;
  createdAt: number;
}

/** 番号の記録。タスクや実施記録と紐付けて、記録漏れ防止や過去番号の再利用に使う */
export interface NumberRecord {
  id: string;
  typeId: string;
  value: string;
  memo: string;
  /** 基準日 (YYYY-MM-DD) */
  date: string;
  taskId?: string;
  completionId?: string;
  periodKey?: string;
  createdAt: number;
}

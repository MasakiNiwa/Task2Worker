import { IconCalendarStats, IconClockHour4, IconTargetArrow } from '@tabler/icons-react';
import { lazy, type ComponentType, type LazyExoticComponent } from 'react';

export interface AnalysisTool {
  id: string;
  name: string;
  description: string;
  icon: ComponentType<{ size?: number | string; stroke?: number }>;
  component: LazyExoticComponent<ComponentType>;
}

/**
 * 分析ツールの登録簿。新しいツールはコンポーネントを作ってここに追加するだけで分析ページに並ぶ。
 * 集計処理が重い場合は engine.ts にメソッドを追加して Worker 側で計算すること。
 */
export const analysisTools: AnalysisTool[] = [
  {
    id: 'drilldown',
    name: '実施ドリルダウン',
    description: '年度 → 四半期 → 月 → 日と掘り下げて、いつ・何を実施したかを分析します',
    icon: IconCalendarStats,
    component: lazy(() => import('./DrilldownTool')),
  },
  {
    id: 'achievement',
    name: '達成率',
    description: '繰り返しタスクごとに、過去の期間でどれだけ達成できたかを分析します',
    icon: IconTargetArrow,
    component: lazy(() => import('./AchievementTool')),
  },
  {
    id: 'hour-weekday',
    name: '時間帯 × 曜日',
    description: 'どの曜日・時間帯に作業しているかをヒートマップで表示します(WebGPU 対応)',
    icon: IconClockHour4,
    component: lazy(() => import('./HourWeekdayTool')),
  },
];

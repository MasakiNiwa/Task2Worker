import { lazy, type ComponentType, type ReactNode } from 'react';
import {
  IconChartBar,
  IconHash,
  IconHelp,
  IconLayoutDashboard,
  IconListCheck,
  IconSettings,
} from '@tabler/icons-react';

// 各画面は遅延読み込みして初回表示を軽くする
const DashboardPage = lazy(() => import('@/pages/DashboardPage').then((m) => ({ default: m.DashboardPage })));
const TasksPage = lazy(() => import('@/pages/TasksPage').then((m) => ({ default: m.TasksPage })));
const TaskDetailPage = lazy(() => import('@/pages/TaskDetailPage').then((m) => ({ default: m.TaskDetailPage })));
const NumbersPage = lazy(() => import('@/pages/NumbersPage').then((m) => ({ default: m.NumbersPage })));
const AnalyticsPage = lazy(() => import('@/pages/AnalyticsPage').then((m) => ({ default: m.AnalyticsPage })));
const SettingsPage = lazy(() => import('@/pages/SettingsPage').then((m) => ({ default: m.SettingsPage })));
const HelpPage = lazy(() => import('@/pages/HelpPage').then((m) => ({ default: m.HelpPage })));

export interface AppRoute {
  path: string;
  label: string;
  /** 下部ナビなど狭い場所で使う短い表示名 */
  shortLabel?: string;
  icon: ComponentType<{ size?: number | string; stroke?: number }>;
  element: ReactNode;
  /** ナビゲーション(下部バー / サイドバー)に表示するか */
  nav: boolean;
}

// 画面はここに登録するだけでルーティングとナビゲーションの両方に反映される
export const appRoutes: AppRoute[] = [
  { path: '/', label: 'ダッシュボード', shortLabel: 'ホーム', icon: IconLayoutDashboard, element: <DashboardPage />, nav: true },
  { path: '/tasks', label: 'タスク', icon: IconListCheck, element: <TasksPage />, nav: true },
  { path: '/tasks/:id', label: 'タスク詳細', icon: IconListCheck, element: <TaskDetailPage />, nav: false },
  { path: '/numbers', label: '番号', icon: IconHash, element: <NumbersPage />, nav: true },
  { path: '/analytics', label: '分析', icon: IconChartBar, element: <AnalyticsPage />, nav: true },
  { path: '/settings', label: '設定', icon: IconSettings, element: <SettingsPage />, nav: true },
  { path: '/help', label: 'ヘルプ', icon: IconHelp, element: <HelpPage />, nav: false },
];

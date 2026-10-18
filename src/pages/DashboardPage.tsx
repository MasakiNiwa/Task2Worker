import { PageHeader } from '@/components/common/PageHeader';
import { ComingSoon } from '@/components/common/ComingSoon';

export function DashboardPage() {
  return (
    <>
      <PageHeader title="ダッシュボード" description="今日やるべきことを一目で" />
      <ComingSoon feature="ダッシュボード" />
    </>
  );
}

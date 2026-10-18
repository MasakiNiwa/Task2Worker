import { PageHeader } from '@/components/common/PageHeader';
import { ComingSoon } from '@/components/common/ComingSoon';

export function AnalyticsPage() {
  return (
    <>
      <PageHeader title="分析" description="実施状況をドリルダウンで分析" />
      <ComingSoon feature="分析" />
    </>
  );
}

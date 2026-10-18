import { PageHeader } from '@/components/common/PageHeader';
import { ComingSoon } from '@/components/common/ComingSoon';

export function NumbersPage() {
  return (
    <>
      <PageHeader title="番号" description="伝票番号などをタスクと紐付けて管理" />
      <ComingSoon feature="番号管理" />
    </>
  );
}

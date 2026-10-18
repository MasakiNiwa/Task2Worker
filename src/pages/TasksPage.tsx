import { PageHeader } from '@/components/common/PageHeader';
import { ComingSoon } from '@/components/common/ComingSoon';

export function TasksPage() {
  return (
    <>
      <PageHeader title="タスク" description="年次〜1日複数回の繰り返しタスクを管理" />
      <ComingSoon feature="タスク管理" />
    </>
  );
}

import { Button, Card, Group, RingProgress, SimpleGrid, Stack, Text, Title } from '@mantine/core';
import { IconConfetti, IconListCheck, IconPlus } from '@tabler/icons-react';
import { Link } from 'react-router-dom';
import { PageHeader } from '@/components/common/PageHeader';
import { EmptyState } from '@/components/common/EmptyState';
import { useTaskStatuses, useToday, type TaskStatus } from '@/features/tasks/hooks';
import { daysLeft, recurrenceLabels, recurrenceOrder } from '@/features/tasks/period';
import { TaskRow } from '@/features/tasks/components/TaskRow';
import { groupBy } from '@/lib/collections';

const rank = (s: TaskStatus) => recurrenceOrder.indexOf(s.task.recurrence);

/** 期限の近い単発タスク → 周期の短いタスクの順 */
function byUrgency(a: TaskStatus, b: TaskStatus): number {
  if (a.task.recurrence === 'once' && b.task.recurrence === 'once') {
    return (a.task.dueDate ?? '9999').localeCompare(b.task.dueDate ?? '9999');
  }
  return rank(a) - rank(b) || a.task.order - b.task.order;
}

export function DashboardPage() {
  const today = useToday();
  const statuses = useTaskStatuses();

  if (statuses === undefined) return null;

  const todo = statuses.filter((s) => !s.completed).sort(byUrgency);
  const done = statuses.filter((s) => s.completed).sort(byUrgency);
  const groups = groupBy(statuses, (s) => s.task.recurrence);

  return (
    <>
      <PageHeader title={today.format('M月D日(dd)')} description="今やるべきことを一目で" />
      {statuses.length === 0 ? (
        <EmptyState
          icon={<IconListCheck size={26} stroke={1.5} />}
          title="まずはタスクを登録しましょう"
          description="毎日・毎週・毎月の作業を登録すると、ここに今やるべきことが並びます"
          action={
            <Button mt="xs" component={Link} to="/tasks" leftSection={<IconPlus size={16} />}>
              タスクを登録する
            </Button>
          }
        />
      ) : (
        <Stack gap="lg">
          <SimpleGrid cols={{ base: 2, xs: 3, md: 6 }} spacing="sm">
            {recurrenceOrder
              .filter((r) => groups.has(r))
              .map((r) => {
                const list = groups.get(r)!;
                const doneCount = list.filter((s) => s.completed).length;
                const pct = Math.round((doneCount / list.length) * 100);
                const period = list[0]!.period;
                return (
                  <Card key={r} padding="sm">
                    <Group gap="xs" wrap="nowrap">
                      <RingProgress
                        size={54}
                        thickness={5}
                        roundCaps
                        sections={[{ value: pct, color: 'sage' }]}
                        label={
                          <Text ta="center" size="xs" fw={600}>
                            {pct}%
                          </Text>
                        }
                      />
                      <Stack gap={0} style={{ minWidth: 0 }}>
                        <Text fw={600} size="sm">
                          {recurrenceLabels[r]}
                        </Text>
                        <Text size="xs" c="dimmed">
                          {doneCount}/{list.length}
                        </Text>
                        {r !== 'once' && r !== 'daily' && (
                          <Text size="xs" c="dimmed">
                            残り{daysLeft(period, today)}日
                          </Text>
                        )}
                      </Stack>
                    </Group>
                  </Card>
                );
              })}
          </SimpleGrid>

          <Stack gap="xs">
            <Title order={3} size="h5">
              やること({todo.length})
            </Title>
            {todo.length === 0 ? (
              <Card>
                <Group gap="xs">
                  <IconConfetti size={20} />
                  <Text size="sm">今の期間のタスクはすべて完了しています。おつかれさまでした!</Text>
                </Group>
              </Card>
            ) : (
              todo.map((s) => <TaskRow key={s.task.id} status={s} />)
            )}
          </Stack>

          {done.length > 0 && (
            <Stack gap="xs">
              <Title order={3} size="h5" c="dimmed">
                完了済み({done.length})
              </Title>
              {done.map((s) => (
                <TaskRow key={s.task.id} status={s} />
              ))}
            </Stack>
          )}
        </Stack>
      )}
    </>
  );
}

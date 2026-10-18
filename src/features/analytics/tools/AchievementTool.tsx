import { Anchor, Badge, Button, Card, Group, Progress, Table, Text, Title } from '@mantine/core';
import { IconArrowLeft } from '@tabler/icons-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { EChart, type EChartOption } from '@/components/charts/EChart';
import { recurrenceLabels } from '@/features/tasks/period';
import { useToday } from '@/features/tasks/hooks';
import { useAnalytics } from '../context';
import { applyFilterToTask } from '../taskFilter';
import { useEngineQuery } from '../useEngineQuery';

const pct = (r: number) => (Number.isNaN(r) ? '—' : `${Math.round(r * 100)}%`);

export default function AchievementTool() {
  const { tasks, filter } = useAnalytics();
  const today = useToday().format('YYYY-MM-DD');
  const all = useEngineQuery((e) => e.achievements(today), [today]);
  const [selected, setSelected] = useState<string | null>(null);

  const rows = (all ?? [])
    .filter((a) => {
      const t = tasks.get(a.taskId);
      return t && applyFilterToTask(t, filter);
    })
    .sort((a, b) => (Number.isNaN(a.rate) ? 1 : Number.isNaN(b.rate) ? -1 : a.rate - b.rate));
  const current = rows.find((r) => r.taskId === selected);

  const option: EChartOption | undefined = current && {
      grid: { left: 32, right: 12, top: 16, bottom: 48 },
      tooltip: { trigger: 'axis' },
      xAxis: { type: 'category', data: current.periods.map((p) => p.label), axisLabel: { rotate: 40 } },
      yAxis: { type: 'value', minInterval: 1, max: Math.max(...current.periods.map((p) => p.target)) },
      series: [
        {
          type: 'bar',
          name: '実施回数',
          barMaxWidth: 28,
          data: current.periods.map((p) => ({
            value: p.done,
            itemStyle: { opacity: p.done >= p.target ? 1 : 0.45, borderRadius: [4, 4, 0, 0] },
          })),
        },
      ],
    };

  if (!all) return null;

  if (current && option) {
    const task = tasks.get(current.taskId)!;
    return (
      <Card>
        <Group justify="space-between" mb="sm" wrap="nowrap">
          <Button variant="subtle" color="gray" px={4} leftSection={<IconArrowLeft size={16} />} onClick={() => setSelected(null)}>
            一覧へ
          </Button>
          <Badge variant="light">達成率 {pct(current.rate)}</Badge>
        </Group>
        <Anchor component={Link} to={`/tasks/${task.id}`} fw={600}>
          {task.title}
        </Anchor>
        <Text size="xs" c="dimmed" mb="sm">
          {recurrenceLabels[task.recurrence]}・目標 {task.timesPerPeriod}回/期間(進行中の期間は含みません)
        </Text>
        <EChart option={option} />
      </Card>
    );
  }

  return (
    <Card>
      <Title order={3} size="h6" mb="xs">
        タスク別の達成率(低い順)
      </Title>
      {rows.length === 0 ? (
        <Text size="sm" c="dimmed">
          繰り返しタスクがありません
        </Text>
      ) : (
        <Table highlightOnHover verticalSpacing={6}>
          <Table.Tbody>
            {rows.map((r) => {
              const t = tasks.get(r.taskId)!;
              const achieved = r.periods.filter((p) => p.done >= p.target).length;
              return (
                <Table.Tr key={r.taskId} style={{ cursor: 'pointer' }} onClick={() => setSelected(r.taskId)}>
                  <Table.Td>
                    <Text size="sm" truncate maw={200}>
                      {t.title}
                    </Text>
                    <Text size="xs" c="dimmed">
                      {recurrenceLabels[t.recurrence]}・{achieved}/{r.periods.length}期間
                    </Text>
                  </Table.Td>
                  <Table.Td w="35%">
                    <Progress
                      value={Number.isNaN(r.rate) ? 0 : r.rate * 100}
                      color={r.rate < 0.5 ? 'orange' : 'sage'}
                      size="sm"
                    />
                  </Table.Td>
                  <Table.Td ta="right" w={56}>
                    <Text size="sm">{pct(r.rate)}</Text>
                  </Table.Td>
                </Table.Tr>
              );
            })}
          </Table.Tbody>
        </Table>
      )}
      <Text size="xs" c="dimmed" mt={4}>
        行をタップすると期間ごとの実績を表示します。作成直後のタスクは過去の期間がないため「—」になります。
      </Text>
    </Card>
  );
}

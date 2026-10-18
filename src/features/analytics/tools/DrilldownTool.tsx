import { Anchor, Breadcrumbs, Card, Group, Progress, Table, Text, Title } from '@mantine/core';
import { useMemo, useState } from 'react';
import { EChart, type EChartOption } from '@/components/charts/EChart';
import { labelOfPeriodKey } from '@/features/tasks/period';
import { useAnalytics } from '../context';
import { timeLevelLabels } from '../facts';
import { useEngineQuery } from '../useEngineQuery';

export default function DrilldownTool() {
  const { tasks, filter, setFilter } = useAnalytics();
  const [path, setPath] = useState<string[]>([]);
  const result = useEngineQuery((e) => e.drilldown(path, filter), [path, filter]);

  const option = useMemo<EChartOption>(
    () => ({
      grid: { left: 40, right: 12, top: 16, bottom: 32 },
      tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
      xAxis: { type: 'category', data: result?.buckets.map((b) => b.label) ?? [] },
      yAxis: { type: 'value', minInterval: 1 },
      series: [
        {
          type: 'bar',
          name: '実施回数',
          data: result?.buckets.map((b) => b.count) ?? [],
          barMaxWidth: 36,
          itemStyle: { borderRadius: [4, 4, 0, 0] },
        },
      ],
    }),
    [result],
  );

  if (!result) return null;

  return (
    <>
      <Card>
        <Breadcrumbs mb="sm" separatorMargin={6}>
          {[
            <Anchor key="all" size="sm" onClick={() => setPath([])} c={path.length ? undefined : 'dimmed'}>
              すべて
            </Anchor>,
            ...path.map((k, i) => (
              <Anchor
                key={k}
                size="sm"
                onClick={() => setPath(path.slice(0, i + 1))}
                c={i === path.length - 1 ? 'dimmed' : undefined}
              >
                {labelOfPeriodKey(k)}
              </Anchor>
            )),
          ]}
        </Breadcrumbs>
        <Group justify="space-between" mb="xs">
          <Text size="sm" fw={500}>
            {timeLevelLabels[result.level]}ごとの実施回数
          </Text>
          <Text size="sm" c="dimmed">
            合計 {result.total}回
          </Text>
        </Group>
        {result.buckets.length === 0 ? (
          <Text size="sm" c="dimmed" py="xl" ta="center">
            まだ実施記録がありません
          </Text>
        ) : (
          <EChart
            option={option}
            onClick={
              result.canDrill
                ? (p) => {
                    const b = result.buckets[p.dataIndex];
                    if (b && b.count > 0) setPath([...path, b.key]);
                  }
                : undefined
            }
          />
        )}
        {result.canDrill && result.buckets.length > 0 && (
          <Text size="xs" c="dimmed">
            棒をタップすると掘り下げます
          </Text>
        )}
      </Card>

      <Card>
        <Title order={3} size="h6" mb="xs">
          タスク別の内訳
        </Title>
        {result.byTask.length === 0 ? (
          <Text size="sm" c="dimmed">
            この期間の実施はありません
          </Text>
        ) : (
          <Table highlightOnHover verticalSpacing={6}>
            <Table.Tbody>
              {result.byTask.map((r) => (
                <Table.Tr
                  key={r.taskId}
                  style={{ cursor: 'pointer' }}
                  onClick={() => setFilter({ ...filter, taskIds: [r.taskId] })}
                >
                  <Table.Td>
                    <Text size="sm" truncate maw={220}>
                      {tasks.get(r.taskId)?.title ?? '(削除済み)'}
                    </Text>
                  </Table.Td>
                  <Table.Td w="40%">
                    <Progress value={(r.count / result.total) * 100} size="sm" />
                  </Table.Td>
                  <Table.Td ta="right" w={80}>
                    <Text size="sm" style={{ whiteSpace: 'nowrap' }}>
                      {r.count}回
                    </Text>
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        )}
        {!filter.taskIds?.length && result.byTask.length > 1 && (
          <Text size="xs" c="dimmed" mt={4}>
            行をタップするとそのタスクに絞り込みます
          </Text>
        )}
      </Card>
    </>
  );
}

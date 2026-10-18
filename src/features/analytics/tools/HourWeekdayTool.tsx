import { Badge, Card, Group, Text, Title, Tooltip } from '@mantine/core';
import { IconCpu, IconDeviceDesktopAnalytics } from '@tabler/icons-react';
import { useMemo } from 'react';
import { EChart, type EChartOption } from '@/components/charts/EChart';
import { useSettings } from '@/features/settings/store';
import { useAnalytics } from '../context';
import { useEngineQuery } from '../useEngineQuery';

const WEEKDAYS = ['日', '月', '火', '水', '木', '金', '土'];
const HOURS = Array.from({ length: 24 }, (_, h) => `${h}`);

export default function HourWeekdayTool() {
  const { filter } = useAnalytics();
  const useGpu = useSettings((s) => s.useGpu);
  const weekStartsOn = useSettings((s) => s.weekStartsOn);
  const result = useEngineQuery((e) => e.hourWeekday(filter, useGpu), [filter, useGpu]);

  // 週の始まりの曜日を上に並べる
  const order = useMemo(() => Array.from({ length: 7 }, (_, i) => (i + weekStartsOn) % 7).reverse(), [weekStartsOn]);

  const option = useMemo<EChartOption | null>(() => {
    if (!result) return null;
    const data: [number, number, number][] = [];
    order.forEach((wd, row) => {
      for (let h = 0; h < 24; h++) data.push([h, row, result.counts[wd * 24 + h] ?? 0]);
    });
    const max = Math.max(1, ...result.counts);
    return {
      grid: { left: 32, right: 8, top: 8, bottom: 64 },
      tooltip: {
        formatter: (p: { value: [number, number, number] }) => `${WEEKDAYS[order[p.value[1]]!]}曜 ${p.value[0]}時台: ${p.value[2]}回`,
      },
      xAxis: { type: 'category', data: HOURS, splitArea: { show: false } },
      yAxis: { type: 'category', data: order.map((d) => WEEKDAYS[d]) },
      visualMap: {
        min: 0,
        max,
        calculable: false,
        orient: 'horizontal',
        left: 'center',
        bottom: 4,
        itemHeight: 120,
        inRange: { color: ['rgba(91,143,135,0.06)', '#4b8780', '#b5cdc9'] },
        textStyle: { color: 'inherit' },
      },
      series: [{ type: 'heatmap', data, itemStyle: { borderRadius: 2, borderWidth: 1, borderColor: 'transparent' } }],
    };
  }, [result, order]);

  if (!result || !option) return null;
  const total = result.counts.reduce((a, b) => a + b, 0);

  return (
    <Card>
      <Group justify="space-between" mb="xs">
        <Title order={3} size="h6">
          曜日・時間帯ごとの実施回数
        </Title>
        <Tooltip label={`集計時間 ${result.ms.toFixed(1)}ms`}>
          <Badge
            variant="light"
            color={result.engine === 'webgpu' ? 'sage' : 'gray'}
            leftSection={result.engine === 'webgpu' ? <IconDeviceDesktopAnalytics size={12} /> : <IconCpu size={12} />}
          >
            {result.engine === 'webgpu' ? 'WebGPU' : 'CPU'}
          </Badge>
        </Tooltip>
      </Group>
      {total === 0 ? (
        <Text size="sm" c="dimmed" py="xl" ta="center">
          まだ実施記録がありません
        </Text>
      ) : (
        <EChart option={option} height={300} />
      )}
      <Text size="xs" c="dimmed">
        実際に実施ボタンを押した時刻で集計しています。
      </Text>
    </Card>
  );
}

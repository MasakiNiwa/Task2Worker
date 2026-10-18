import { Box, useComputedColorScheme, useMantineTheme } from '@mantine/core';
import { BarChart, HeatmapChart, LineChart } from 'echarts/charts';
import { GridComponent, TooltipComponent, VisualMapComponent } from 'echarts/components';
import * as echarts from 'echarts/core';
import { CanvasRenderer } from 'echarts/renderers';
import { useEffect, useRef } from 'react';

echarts.use([BarChart, LineChart, HeatmapChart, GridComponent, TooltipComponent, VisualMapComponent, CanvasRenderer]);

export type EChartOption = echarts.EChartsCoreOption;

interface Props {
  option: EChartOption;
  height?: number;
  onClick?: (params: { dataIndex: number; name: string; value: unknown; data: unknown }) => void;
}

/** ECharts の薄いラッパー。テーマ(ライト/ダーク)とリサイズに追従する */
export function EChart({ option, height = 280, onClick }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const chart = useRef<echarts.ECharts | null>(null);
  const scheme = useComputedColorScheme('dark');
  const theme = useMantineTheme();
  const clickRef = useRef(onClick);
  useEffect(() => {
    clickRef.current = onClick;
  });

  useEffect(() => {
    if (!ref.current) return;
    const c = echarts.init(ref.current, undefined, { renderer: 'canvas' });
    chart.current = c;
    c.on('click', (p) => clickRef.current?.(p as never));
    const ro = new ResizeObserver(() => c.resize());
    ro.observe(ref.current);
    return () => {
      ro.disconnect();
      c.dispose();
      chart.current = null;
    };
  }, []);

  useEffect(() => {
    const dark = scheme === 'dark';
    const text = dark ? theme.colors.dark[1] : theme.colors.gray[7];
    const line = dark ? theme.colors.dark[4] : theme.colors.gray[3];
    chart.current?.setOption(
      {
        backgroundColor: 'transparent',
        textStyle: { color: text, fontFamily: theme.fontFamily },
        color: [dark ? theme.colors.sage![6] : theme.colors.sage![7]],
        tooltip: {
          backgroundColor: dark ? theme.colors.dark[6] : theme.white,
          borderColor: line,
          textStyle: { color: dark ? theme.colors.dark[0] : theme.black },
        },
        ...option,
        xAxis: withAxisStyle(option.xAxis, text, line),
        yAxis: withAxisStyle(option.yAxis, text, line),
      },
      { notMerge: true },
    );
  }, [option, scheme, theme]);

  return <Box ref={ref} h={height} w="100%" style={{ cursor: onClick ? 'pointer' : undefined }} />;
}

function withAxisStyle(axis: unknown, text: string, line: string) {
  if (!axis) return axis;
  const style = (a: Record<string, unknown>) => ({
    axisLabel: { color: text },
    axisLine: { lineStyle: { color: line } },
    splitLine: { lineStyle: { color: line, opacity: 0.4 } },
    ...a,
  });
  return Array.isArray(axis) ? axis.map(style) : style(axis as Record<string, unknown>);
}

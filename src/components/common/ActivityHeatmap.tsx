import { Box, Group, Text, Tooltip } from '@mantine/core';
import type { Dayjs } from 'dayjs';

interface Props {
  /** YYYY-MM-DD → 件数 */
  counts: Map<string, number>;
  today: Dayjs;
  weeks?: number;
  weekStartsOn: 0 | 1;
}

const CELL = 12;
const GAP = 3;

function level(count: number, max: number): number {
  if (count <= 0) return 0;
  return Math.min(4, Math.ceil((count / Math.max(max, 1)) * 4));
}

const levelColors = [
  'light-dark(var(--mantine-color-gray-2), var(--mantine-color-dark-5))',
  'light-dark(var(--mantine-color-sage-2), var(--mantine-color-sage-9))',
  'light-dark(var(--mantine-color-sage-4), var(--mantine-color-sage-8))',
  'light-dark(var(--mantine-color-sage-6), var(--mantine-color-sage-6))',
  'light-dark(var(--mantine-color-sage-8), var(--mantine-color-sage-4))',
];

/** GitHub の草のような日別の実施状況 */
export function ActivityHeatmap({ counts, today, weeks = 20, weekStartsOn }: Props) {
  const offset = (today.day() - weekStartsOn + 7) % 7;
  const start = today.subtract(offset + (weeks - 1) * 7, 'day');
  const max = Math.max(0, ...counts.values());

  return (
    <Box style={{ overflowX: 'auto' }}>
      <Box
        style={{
          display: 'grid',
          gridTemplateRows: `repeat(7, ${CELL}px)`,
          gridAutoFlow: 'column',
          gridAutoColumns: `${CELL}px`,
          gap: GAP,
          width: 'max-content',
        }}
        role="img"
        aria-label={`過去${weeks}週間の実施状況`}
      >
        {Array.from({ length: weeks * 7 }, (_, i) => {
          const d = start.add(i, 'day');
          if (d.isAfter(today)) return <span key={i} />;
          const key = d.format('YYYY-MM-DD');
          const c = counts.get(key) ?? 0;
          return (
            <Tooltip key={key} label={`${d.format('M/D(dd)')} ${c}回`} openDelay={200}>
              <span style={{ width: CELL, height: CELL, borderRadius: 3, background: levelColors[level(c, max)] }} />
            </Tooltip>
          );
        })}
      </Box>
      <Group gap={4} mt={6} justify="flex-end">
        <Text size="xs" c="dimmed">
          少
        </Text>
        {levelColors.map((bg) => (
          <span key={bg} style={{ width: 10, height: 10, borderRadius: 2, background: bg }} />
        ))}
        <Text size="xs" c="dimmed">
          多
        </Text>
      </Group>
    </Box>
  );
}

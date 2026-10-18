import { Center, Group, Loader, MultiSelect, Pill, ScrollArea, SegmentedControl, Stack, Text } from '@mantine/core';
import { useLiveQuery } from 'dexie-react-hooks';
import { Suspense, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { PageHeader } from '@/components/common/PageHeader';
import { db } from '@/db/db';
import type { Recurrence } from '@/db/types';
import { getEngine } from '@/features/analytics/client';
import { AnalyticsContext, type AnalyticsContextValue } from '@/features/analytics/context';
import type { FactFilter } from '@/features/analytics/facts';
import { analysisTools } from '@/features/analytics/tools';
import { usePeriodSettings } from '@/features/tasks/hooks';
import { recurrenceLabels, recurrenceOrder } from '@/features/tasks/period';

export function AnalyticsPage() {
  const [params, setParams] = useSearchParams();
  const tool = analysisTools.find((t) => t.id === params.get('tool')) ?? analysisTools[0]!;
  const settings = usePeriodSettings();
  const engine = useMemo(() => getEngine(), []);
  const [version, setVersion] = useState(0);
  const [filter, setFilter] = useState<FactFilter>({});

  const data = useLiveQuery(async () => ({
    tasks: await db.tasks.toArray(),
    completions: await db.completions.toArray(),
  }));

  // データか設定が変わったら Worker に読み込ませ、各ツールに再集計させる
  useEffect(() => {
    if (!data) return;
    let cancelled = false;
    void Promise.resolve(engine.load(data.tasks, data.completions, settings)).then(() => {
      if (!cancelled) setVersion((v) => v + 1);
    });
    return () => {
      cancelled = true;
    };
  }, [data, engine, settings]);

  const tasks = useMemo(() => new Map((data?.tasks ?? []).map((t) => [t.id, t])), [data]);
  const allTags = useMemo(() => [...new Set((data?.tasks ?? []).flatMap((t) => t.tags))].sort(), [data]);
  const ctx: AnalyticsContextValue = { engine, version, tasks, filter, setFilter };
  const Tool = tool.component;

  return (
    <>
      <PageHeader title="分析" description={tool.description} />
      <Stack gap="md">
        <ScrollArea type="never">
          <SegmentedControl
            value={tool.id}
            onChange={(id) => setParams({ tool: id }, { replace: true })}
            data={analysisTools.map((t) => ({
              value: t.id,
              label: (
                <Group gap={6} wrap="nowrap">
                  <t.icon size={16} />
                  <span>{t.name}</span>
                </Group>
              ),
            }))}
          />
        </ScrollArea>

        <Group gap="xs" align="flex-end">
          <MultiSelect
            placeholder="周期で絞り込み"
            aria-label="周期で絞り込み"
            data={recurrenceOrder.map((r) => ({ value: r, label: recurrenceLabels[r] }))}
            value={filter.recurrences ?? []}
            onChange={(v) => setFilter({ ...filter, recurrences: v as Recurrence[] })}
            clearable
            style={{ flex: 1, minWidth: 160 }}
          />
          {allTags.length > 0 && (
            <MultiSelect
              placeholder="タグで絞り込み"
              aria-label="タグで絞り込み"
              data={allTags}
              value={filter.tags ?? []}
              onChange={(v) => setFilter({ ...filter, tags: v })}
              clearable
              style={{ flex: 1, minWidth: 160 }}
            />
          )}
        </Group>
        {!!filter.taskIds?.length && (
          <Group gap={6}>
            <Text size="sm" c="dimmed">
              タスク:
            </Text>
            {filter.taskIds.map((id) => (
              <Pill
                key={id}
                withRemoveButton
                onRemove={() => setFilter({ ...filter, taskIds: filter.taskIds!.filter((x) => x !== id) })}
              >
                {tasks.get(id)?.title ?? id}
              </Pill>
            ))}
          </Group>
        )}

        {version === 0 ? (
          <Center py="xl">
            <Loader size="sm" />
          </Center>
        ) : (
          <AnalyticsContext.Provider value={ctx}>
            <Suspense
              fallback={
                <Center py="xl">
                  <Loader size="sm" />
                </Center>
              }
            >
              <Stack gap="md">
                <Tool />
              </Stack>
            </Suspense>
          </AnalyticsContext.Provider>
        )}
      </Stack>
    </>
  );
}

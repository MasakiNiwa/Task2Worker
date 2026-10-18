import { Accordion, Anchor, Badge, Card, Code, Group, ScrollArea, Stack, Text, Title } from '@mantine/core';
import { IconBrandGithub, IconExternalLink } from '@tabler/icons-react';
import { PageHeader } from '@/components/common/PageHeader';
import licenses from '@/generated/licenses.json';

import { REPOSITORY_URL } from '@/app/constants';

export function HelpPage() {
  return (
    <>
      <PageHeader title="ヘルプ" description="Task2Worker — 生き抜くためのタスク管理ダッシュボード" />
      <Stack gap="md" maw={820}>
        <Card>
          <Title order={3} size="h5" mb="xs">
            使い方
          </Title>
          <Stack gap={6}>
            <Text size="sm">・「タスク」で年次〜日次、1日複数回の繰り返しタスクを登録します。</Text>
            <Text size="sm">・実施したタスクは消えずに「済み」として残り、次の期間になると再び未実施に戻ります。</Text>
            <Text size="sm">・「番号」で伝票番号などを登録し、タスクと紐付けて記録漏れを防ぎます。</Text>
            <Text size="sm">・データはこの端末のブラウザ内に保存されます。設定ページからバックアップできます。</Text>
          </Stack>
        </Card>

        <Card>
          <Title order={3} size="h5" mb="xs">
            ソースコード
          </Title>
          <Anchor href={REPOSITORY_URL} target="_blank" rel="noopener noreferrer" size="sm">
            <Group gap={6} wrap="nowrap">
              <IconBrandGithub size={18} />
              {REPOSITORY_URL.replace('https://', '')}
            </Group>
          </Anchor>
          <Text size="sm" mt="xs" c="dimmed">
            本アプリは MIT License で公開しています。
          </Text>
        </Card>

        <Card>
          <Group justify="space-between" mb="xs">
            <Title order={3} size="h5">
              利用ライブラリとライセンス
            </Title>
            <Badge variant="light">{licenses.length} packages</Badge>
          </Group>
          <Text size="sm" c="dimmed" mb="sm">
            本アプリは以下のオープンソースソフトウェアを利用しています。開発者の皆さまに感謝します。
            ライセンス全文は{' '}
            <Anchor href={`${import.meta.env.BASE_URL}THIRD_PARTY_LICENSES.txt`} target="_blank" size="sm">
              THIRD_PARTY_LICENSES.txt <IconExternalLink size={12} />
            </Anchor>{' '}
            でも確認できます。
          </Text>
          <Accordion variant="default" chevronPosition="right">
            {licenses.map((lib) => (
              <Accordion.Item key={`${lib.name}@${lib.version}`} value={`${lib.name}@${lib.version}`}>
                <Accordion.Control>
                  <Group justify="space-between" wrap="nowrap" pr="xs">
                    <Text size="sm" fw={500} truncate>
                      {lib.name} <Code>{lib.version}</Code>
                    </Text>
                    <Badge variant="outline" size="sm" style={{ flexShrink: 0 }}>
                      {lib.license}
                    </Badge>
                  </Group>
                </Accordion.Control>
                <Accordion.Panel>
                  {lib.homepage && (
                    <Anchor href={lib.homepage} target="_blank" rel="noopener noreferrer" size="xs">
                      {lib.homepage}
                    </Anchor>
                  )}
                  <ScrollArea.Autosize mah={240} mt="xs">
                    <Text component="pre" size="xs" style={{ whiteSpace: 'pre-wrap' }} ff="monospace">
                      {lib.licenseText || '(ライセンス本文はパッケージに同梱されていません)'}
                    </Text>
                  </ScrollArea.Autosize>
                </Accordion.Panel>
              </Accordion.Item>
            ))}
          </Accordion>
        </Card>
      </Stack>
    </>
  );
}

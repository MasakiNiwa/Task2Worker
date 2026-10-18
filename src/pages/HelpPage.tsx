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
            {[
              '「タスク」で年次・四半期・月次・週次・日次・単発のタスクを登録します。「1日3回」のように期間内の回数も指定できます。',
              '実施ボタンを押してもタスクは消えず「済み」として残り、次の期間になると自動で未実施に戻ります。押し直すと取り消せます。',
              '前の期間にやり残したタスクには「前回未完了」が付き、ダッシュボードの先頭に並びます。',
              '「番号」で伝票番号などの種類を作り、タスクに「実施時に記録する番号」を設定すると、実施直後に入力を促します。記録し忘れると「番号未記録」が表示されます。',
              '「番号」の作業チェック表では、対象日を含む各タスクの期間・実施チェック・番号を一覧できます。未記録のみの絞り込みや、過去の番号のコピー・今回への再利用ができます。',
              '番号の履歴表では、登録済みの番号を日付順の表で検索・編集・再利用・削除できます。関連タスクを選ぶと、番号の日付に対応する実施期間に紐付きます。',
              '作業チェック表は「実施時に記録する番号」を設定したタスクが対象です。対象日は作業の期間を選ぶための基準日です。実施チェックの時刻は実際に押した時刻で記録されます。',
              '「分析」では、実施回数のドリルダウン、達成率、曜日×時間帯のヒートマップを確認できます。',
              'データはこの端末のブラウザ内に保存されます。設定ページからバックアップ(エクスポート)と復元ができます。',
              'ブラウザのメニューから「ホーム画面に追加」すると、アプリのように起動でき、オフラインでも使えます。',
            ].map((t) => (
              <Text key={t} size="sm">
                ・{t}
              </Text>
            ))}
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
            本アプリは以下のオープンソースソフトウェアを利用しています。開発者の皆さまに感謝します。 ライセンス全文は{' '}
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

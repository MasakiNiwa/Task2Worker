import {
  Button,
  Card,
  FileButton,
  Group,
  SegmentedControl,
  Select,
  Switch,
  Stack,
  Text,
  Title,
  useMantineColorScheme,
  type MantineColorScheme,
} from '@mantine/core';
import { modals } from '@mantine/modals';
import { notifications } from '@mantine/notifications';
import { IconDownload, IconFileSpreadsheet, IconTrash, IconUpload } from '@tabler/icons-react';
import type { ReactNode } from 'react';
import { PageHeader } from '@/components/common/PageHeader';
import { useSettings } from '@/features/settings/store';
import { clearAllData } from '@/features/data/clearAll';
import {
  BackupError,
  exportCompletionsCsv,
  exportJson,
  exportNumbersCsv,
  parseBackup,
  restoreBackup,
} from '@/features/data/backup';

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Card>
      <Title order={3} size="h5" mb="sm">
        {title}
      </Title>
      <Stack gap="md">{children}</Stack>
    </Card>
  );
}

function Row({ label, description, children }: { label: string; description?: string; children: ReactNode }) {
  return (
    <Group justify="space-between" wrap="wrap" gap="xs">
      <div>
        <Text size="sm" fw={500}>
          {label}
        </Text>
        {description && (
          <Text size="xs" c="dimmed">
            {description}
          </Text>
        )}
      </div>
      {children}
    </Group>
  );
}

const monthOptions = Array.from({ length: 12 }, (_, i) => ({ value: String(i + 1), label: `${i + 1}月` }));
const hourOptions = Array.from({ length: 24 }, (_, i) => ({ value: String(i), label: `${i}:00` }));

export function SettingsPage() {
  const { colorScheme, setColorScheme } = useMantineColorScheme();
  const settings = useSettings();

  const confirmClear = () =>
    modals.openConfirmModal({
      title: 'すべてのデータを初期化しますか?',
      children: (
        <Text size="sm">
          タスク・実施記録・番号・設定がすべて削除されます。この操作は取り消せません。
          必要に応じて先にエクスポートでバックアップを取ってください。
        </Text>
      ),
      labels: { confirm: '初期化する', cancel: 'キャンセル' },
      confirmProps: { color: 'red' },
      onConfirm: async () => {
        await clearAllData();
        notifications.show({ message: 'すべてのデータを初期化しました' });
      },
    });

  const importFile = async (file: File | null) => {
    if (!file) return;
    try {
      const backup = parseBackup(await file.text());
      const d = backup.data;
      modals.openConfirmModal({
        title: 'バックアップから復元しますか?',
        children: (
          <Stack gap={4}>
            <Text size="sm">
              {new Date(backup.exportedAt).toLocaleString('ja-JP')} のバックアップです。
              現在のデータはすべて置き換えられます。
            </Text>
            <Text size="sm" c="dimmed">
              タスク {d.tasks.length}件 / 実施記録 {d.completions.length}件 / 番号の種類 {d.numberTypes.length}件 / 番号{' '}
              {d.numberRecords.length}件
            </Text>
          </Stack>
        ),
        labels: { confirm: '復元する', cancel: 'キャンセル' },
        onConfirm: async () => {
          await restoreBackup(backup);
          notifications.show({ message: 'バックアップから復元しました' });
        },
      });
    } catch (e) {
      notifications.show({
        color: 'red',
        title: '読み込めませんでした',
        message: e instanceof BackupError ? e.message : String(e),
      });
    }
  };

  return (
    <>
      <PageHeader title="設定" />
      <Stack gap="md" maw={720}>
        <Section title="表示">
          <Row label="カラーモード">
            <SegmentedControl
              value={colorScheme}
              onChange={(v) => setColorScheme(v as MantineColorScheme)}
              data={[
                { value: 'light', label: 'ライト' },
                { value: 'dark', label: 'ダーク' },
                { value: 'auto', label: '自動' },
              ]}
            />
          </Row>
        </Section>

        <Section title="期間の区切り">
          <Row label="週の始まり">
            <SegmentedControl
              value={String(settings.weekStartsOn)}
              onChange={(v) => settings.update({ weekStartsOn: Number(v) as 0 | 1 })}
              data={[
                { value: '1', label: '月曜' },
                { value: '0', label: '日曜' },
              ]}
            />
          </Row>
          <Row label="年度の開始月" description="年次・四半期タスクの区切りに使います">
            <Select
              w={110}
              data={monthOptions}
              value={String(settings.fiscalYearStartMonth)}
              onChange={(v) => v && settings.update({ fiscalYearStartMonth: Number(v) })}
              allowDeselect={false}
            />
          </Row>
          <Row label="1日の切り替わり時刻" description="深夜の作業を前日分として扱いたい場合に変更します">
            <Select
              w={110}
              data={hourOptions}
              value={String(settings.dayStartHour)}
              onChange={(v) => v && settings.update({ dayStartHour: Number(v) })}
              allowDeselect={false}
            />
          </Row>
        </Section>

        <Section title="分析">
          <Row
            label="GPU(WebGPU)で集計する"
            description={
              'gpu' in navigator ? 'この端末は WebGPU に対応しています' : 'この端末は WebGPU 非対応のため CPU で計算します'
            }
          >
            <Switch checked={settings.useGpu} onChange={(e) => settings.update({ useGpu: e.currentTarget.checked })} />
          </Row>
        </Section>

        <Section title="データ">
          <Text size="sm" c="dimmed">
            データはこの端末のブラウザ内にのみ保存されます。機種変更やブラウザのデータ削除に備えて、定期的にバックアップしてください。
          </Text>
          <Row label="バックアップ" description="すべてのデータと設定を JSON ファイルに保存します">
            <Button variant="default" leftSection={<IconDownload size={16} />} onClick={() => void exportJson()}>
              エクスポート
            </Button>
          </Row>
          <Row label="復元" description="バックアップファイルからデータを読み込みます(現在のデータは置き換え)">
            <FileButton onChange={(f) => void importFile(f)} accept="application/json,.json">
              {(props) => (
                <Button variant="default" leftSection={<IconUpload size={16} />} {...props}>
                  インポート
                </Button>
              )}
            </FileButton>
          </Row>
          <Row label="CSV 書き出し" description="Excel などで開ける形式で書き出します">
            <Group gap="xs">
              <Button
                variant="default"
                size="xs"
                leftSection={<IconFileSpreadsheet size={14} />}
                onClick={() => void exportCompletionsCsv()}
              >
                実施記録
              </Button>
              <Button
                variant="default"
                size="xs"
                leftSection={<IconFileSpreadsheet size={14} />}
                onClick={() => void exportNumbersCsv()}
              >
                番号
              </Button>
            </Group>
          </Row>
          <Row label="全データ初期化" description="タスク・実施記録・番号・設定をすべて削除します">
            <Button color="red" variant="light" leftSection={<IconTrash size={16} />} onClick={confirmClear}>
              クリア
            </Button>
          </Row>
        </Section>
      </Stack>
    </>
  );
}

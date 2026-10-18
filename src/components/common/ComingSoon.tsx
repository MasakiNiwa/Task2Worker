import { Card, Stack, Text, ThemeIcon } from '@mantine/core';
import { IconTool } from '@tabler/icons-react';

export function ComingSoon({ feature }: { feature: string }) {
  return (
    <Card>
      <Stack align="center" gap="xs" py="xl">
        <ThemeIcon variant="light" size={48} radius="xl">
          <IconTool size={26} stroke={1.5} />
        </ThemeIcon>
        <Text fw={600}>{feature}は準備中です</Text>
        <Text size="sm" c="dimmed">
          今後のアップデートで追加されます。
        </Text>
      </Stack>
    </Card>
  );
}

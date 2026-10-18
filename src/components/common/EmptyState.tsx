import { Card, Stack, Text, ThemeIcon } from '@mantine/core';
import type { ReactNode } from 'react';

export function EmptyState({ icon, title, description, action }: { icon: ReactNode; title: string; description?: string; action?: ReactNode }) {
  return (
    <Card>
      <Stack align="center" gap="xs" py="lg">
        <ThemeIcon variant="light" size={48} radius="xl">
          {icon}
        </ThemeIcon>
        <Text fw={600}>{title}</Text>
        {description && (
          <Text size="sm" c="dimmed" ta="center">
            {description}
          </Text>
        )}
        {action}
      </Stack>
    </Card>
  );
}

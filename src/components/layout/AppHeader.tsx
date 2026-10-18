import { ActionIcon, Group, Text, Tooltip, useComputedColorScheme, useMantineColorScheme } from '@mantine/core';
import { IconHelp, IconMoon, IconSun } from '@tabler/icons-react';
import { Link } from 'react-router-dom';

export function AppHeader() {
  const { setColorScheme } = useMantineColorScheme();
  const computed = useComputedColorScheme('dark', { getInitialValueInEffect: false });
  const isDark = computed === 'dark';

  return (
    <Group h="100%" px="md" justify="space-between" wrap="nowrap">
      <Group
        gap={8}
        wrap="nowrap"
        renderRoot={(props) => <Link to="/" {...props} />}
        style={{ textDecoration: 'none', color: 'inherit' }}
      >
        <img src={`${import.meta.env.BASE_URL}favicon.svg`} alt="" width={26} height={26} />
        <Text fw={700} size="lg">
          Task2Worker
        </Text>
      </Group>
      <Group gap="xs" wrap="nowrap">
        <Tooltip label={isDark ? 'ライトモードにする' : 'ダークモードにする'}>
          <ActionIcon
            variant="subtle"
            color="gray"
            size="lg"
            aria-label="ダークモード切り替え"
            onClick={() => setColorScheme(isDark ? 'light' : 'dark')}
          >
            {isDark ? <IconSun size={20} stroke={1.6} /> : <IconMoon size={20} stroke={1.6} />}
          </ActionIcon>
        </Tooltip>
        <Tooltip label="ヘルプ">
          <ActionIcon component={Link} to="/help" variant="subtle" color="gray" size="lg" aria-label="ヘルプ">
            <IconHelp size={20} stroke={1.6} />
          </ActionIcon>
        </Tooltip>
      </Group>
    </Group>
  );
}

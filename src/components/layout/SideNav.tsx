import { NavLink as MantineNavLink, Stack } from '@mantine/core';
import { NavLink } from 'react-router-dom';
import { appRoutes } from '@/app/routes';

export function SideNav() {
  return (
    <Stack gap={4}>
      {appRoutes
        .filter((r) => r.nav)
        .map((r) => (
          <NavLink key={r.path} to={r.path} end={r.path === '/'} style={{ textDecoration: 'none', color: 'inherit' }}>
            {({ isActive }) => (
              <MantineNavLink
                component="span"
                active={isActive}
                label={r.label}
                leftSection={<r.icon size={20} stroke={1.6} />}
                variant="light"
                style={{ borderRadius: 'var(--mantine-radius-md)' }}
              />
            )}
          </NavLink>
        ))}
    </Stack>
  );
}

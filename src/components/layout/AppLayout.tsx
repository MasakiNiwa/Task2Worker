import { AppShell, Center, Loader } from '@mantine/core';
import { Suspense } from 'react';
import { useMediaQuery } from '@mantine/hooks';
import { Outlet } from 'react-router-dom';
import { AppHeader } from './AppHeader';
import { SideNav } from './SideNav';
import { BottomNav, BOTTOM_NAV_HEIGHT } from './BottomNav';

export function AppLayout() {
  const isDesktop = useMediaQuery('(min-width: 48em)', true);

  return (
    <AppShell
      header={{ height: 56 }}
      navbar={{ width: 220, breakpoint: 'sm', collapsed: { mobile: true } }}
      footer={{ height: BOTTOM_NAV_HEIGHT, collapsed: isDesktop }}
      padding="md"
    >
      <AppShell.Header>
        <AppHeader />
      </AppShell.Header>
      <AppShell.Navbar p="xs">
        <SideNav />
      </AppShell.Navbar>
      <AppShell.Main>
        <Suspense
          fallback={
            <Center py="xl">
              <Loader size="sm" />
            </Center>
          }
        >
          <Outlet />
        </Suspense>
      </AppShell.Main>
      {!isDesktop && (
        <AppShell.Footer style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
          <BottomNav />
        </AppShell.Footer>
      )}
    </AppShell>
  );
}

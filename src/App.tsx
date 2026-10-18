import { HashRouter, Route, Routes } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { appRoutes } from '@/app/routes';

export function App() {
  return (
    <HashRouter>
      <Routes>
        <Route element={<AppLayout />}>
          {appRoutes.map((r) => (
            <Route key={r.path} path={r.path} element={r.element} />
          ))}
          <Route path="*" element={appRoutes[0]!.element} />
        </Route>
      </Routes>
    </HashRouter>
  );
}

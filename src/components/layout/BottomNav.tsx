import { NavLink } from 'react-router-dom';
import { appRoutes } from '@/app/routes';
import classes from './BottomNav.module.css';

export const BOTTOM_NAV_HEIGHT = 60;

export function BottomNav() {
  return (
    <nav className={classes.bar} aria-label="メインナビゲーション">
      {appRoutes
        .filter((r) => r.nav)
        .map((r) => (
          <NavLink
            key={r.path}
            to={r.path}
            end={r.path === '/'}
            className={({ isActive }) => `${classes.item} ${isActive ? classes.active : ''}`}
          >
            <r.icon size={22} stroke={1.6} />
            <span>{r.shortLabel ?? r.label}</span>
          </NavLink>
        ))}
    </nav>
  );
}

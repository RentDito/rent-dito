import { Heart, House, Search } from 'lucide-react';
import { NavLink, Outlet } from 'react-router-dom';

import { DemoRoleSwitcher } from '@/features/demo-session/DemoRoleSwitcher';
import { routes } from '@/shared/lib/routes';

import styles from './layouts.module.css';

const PUBLIC_LINKS = [
  { to: routes.home, label: 'Home', icon: House },
  { to: routes.listings, label: 'Browse rentals', icon: Search },
  { to: routes.saved, label: 'Saved', icon: Heart },
];

/** Marketplace shell: light top navigation over image-led public pages. */
export const PublicLayout = () => (
  <div className={styles.publicShell}>
    <a className={styles.skipLink} href="#main-content">
      Skip to main content
    </a>

    <header className={styles.publicHeader}>
      <div className={styles.publicHeaderInner}>
        <NavLink className={styles.brand} to={routes.home} aria-label="RentDito home">
          <img
            className={styles.brandMark}
            src="/icons/logo.png"
            alt=""
            width="598"
            height="567"
          />
          RentDito
        </NavLink>

        <nav className={styles.publicNav} aria-label="Marketplace navigation">
          {PUBLIC_LINKS.map(({ to, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === routes.home}
              className={styles.publicNavLink}
              data-navigation-link
            >
              {label}
            </NavLink>
          ))}
        </nav>

        <div className={styles.publicActions}>
          <DemoRoleSwitcher />
          <NavLink className={styles.signIn} to={routes.signIn} data-navigation-link>
            Sign in
          </NavLink>
        </div>
      </div>
    </header>

    <main className={styles.publicMain} id="main-content">
      <Outlet />
    </main>

    <footer className={styles.publicFooter}>
      <p>
        RentDito prototype. Listings, landlords, tenants, and payments are fictional demonstration
        data. Nothing on this site is sent, charged, or processed.
      </p>
    </footer>
  </div>
);

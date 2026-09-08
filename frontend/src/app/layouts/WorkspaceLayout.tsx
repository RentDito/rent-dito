import {
  Building2,
  CreditCard,
  Heart,
  Home,
  LayoutDashboard,
  MessageSquare,
  PanelLeftClose,
  PanelLeftOpen,
  Settings,
  Users,
  type LucideIcon,
} from 'lucide-react';
import { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';

import { useDemoSession } from '@/app/demo/demoSessionContext';
import { DemoRoleSwitcher } from '@/features/demo-session/DemoRoleSwitcher';
import { useIsCompact } from '@/shared/hooks/useMediaQuery';
import { routes } from '@/shared/lib/routes';

import styles from './layouts.module.css';

interface Destination {
  to: string;
  label: string;
  icon: LucideIcon;
  /** Included in the compact bottom navigation. */
  primary?: boolean;
  end?: boolean;
}

const LANDLORD_DESTINATIONS: Destination[] = [
  { to: routes.landlord.overview, label: 'Overview', icon: LayoutDashboard, primary: true, end: true },
  { to: routes.landlord.properties, label: 'Properties', icon: Building2, primary: true },
  { to: routes.landlord.tenants, label: 'Tenants', icon: Users, primary: true },
  { to: routes.landlord.payments, label: 'Payments', icon: CreditCard, primary: true },
  { to: routes.landlord.inquiries, label: 'Inquiries', icon: MessageSquare, primary: true },
  { to: routes.settings, label: 'Settings', icon: Settings },
];

const TENANT_DESTINATIONS: Destination[] = [
  { to: routes.tenant.overview, label: 'Overview', icon: LayoutDashboard, primary: true, end: true },
  { to: routes.tenant.rental, label: 'My rental', icon: Home, primary: true },
  { to: routes.tenant.payments, label: 'Payments', icon: CreditCard, primary: true },
  { to: routes.tenant.inquiries, label: 'Inquiries', icon: MessageSquare, primary: true },
  { to: routes.saved, label: 'Saved', icon: Heart },
  { to: routes.settings, label: 'Settings', icon: Settings, primary: true },
];

export interface WorkspaceLayoutProps {
  workspace: 'landlord' | 'tenant';
}

/**
 * Adaptive management shell. Wide screens get a collapsible sidebar; phones get
 * role-specific bottom navigation for the highest-frequency destinations.
 */
export const WorkspaceLayout = ({ workspace }: WorkspaceLayoutProps) => {
  const { role } = useDemoSession();
  const isCompact = useIsCompact();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const destinations = workspace === 'landlord' ? LANDLORD_DESTINATIONS : TENANT_DESTINATIONS;
  const workspaceName = workspace === 'landlord' ? 'Landlord' : 'Tenant';
  const home = workspace === 'landlord' ? routes.landlord.overview : routes.tenant.overview;

  return (
    <div className={styles.workspaceShell} data-sidebar={sidebarOpen ? 'open' : 'collapsed'}>
      <a className={styles.skipLink} href="#main-content">
        Skip to main content
      </a>

      <header className={styles.workspaceTopBar}>
        {!isCompact ? (
          <button
            type="button"
            className={styles.sidebarToggle}
            onClick={() => setSidebarOpen((previous) => !previous)}
            aria-expanded={sidebarOpen}
            aria-label={sidebarOpen ? 'Collapse workspace navigation' : 'Expand workspace navigation'}
            data-icon-button
          >
            {sidebarOpen ? <PanelLeftClose aria-hidden="true" /> : <PanelLeftOpen aria-hidden="true" />}
          </button>
        ) : null}

        <NavLink className={styles.brand} to={home} end aria-label="RentDito home">
          <img
            className={styles.brandMark}
            src="/icons/logo.png"
            alt=""
            width="598"
            height="567"
          />
          RentDito
        </NavLink>

        <p className={styles.workspaceContext}>
          {workspaceName} workspace
          {role !== workspace ? (
            <span className={styles.workspaceHint}> · viewing as {role}</span>
          ) : null}
        </p>

        <DemoRoleSwitcher />
      </header>

      {!isCompact ? (
        <nav className={styles.sidebar} aria-label={`${workspaceName} workspace`}>
          <ul className={styles.sidebarList}>
            {destinations.map(({ to, label, icon: Icon, end }) => (
              <li key={to}>
                <NavLink to={to} end={end} className={styles.sidebarLink} data-navigation-link>
                  <Icon className={styles.navIcon} aria-hidden="true" />
                  <span className={styles.sidebarLabel}>{label}</span>
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
      ) : null}

      <main className={styles.workspaceMain} id="main-content">
        <Outlet />
      </main>

      {isCompact ? (
        <nav className={styles.bottomNav} aria-label={`${workspaceName} mobile navigation`}>
          <ul className={styles.bottomNavList}>
            {destinations
              .filter((destination) => destination.primary)
              .map(({ to, label, icon: Icon, end }) => (
                <li key={to}>
                  <NavLink to={to} end={end} className={styles.bottomNavLink} data-navigation-link>
                    <Icon className={styles.navIcon} aria-hidden="true" />
                    <span className={styles.bottomNavLabel}>{label}</span>
                  </NavLink>
                </li>
              ))}
          </ul>
        </nav>
      ) : null}
    </div>
  );
};

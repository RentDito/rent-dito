import { ChevronDown } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import {
  DEMO_ROLE_LABELS,
  isDemoModeEnabled,
  useDemoSession,
  type DemoRole,
} from '@/app/demo/demoSessionContext';
import { routes } from '@/shared/lib/routes';

import styles from './DemoRoleSwitcher.module.css';

const ROLE_HOMES: Record<DemoRole, string> = {
  guest: routes.home,
  landlord: routes.landlord.overview,
  tenant: routes.tenant.overview,
};

const ROLE_ORDER: DemoRole[] = ['guest', 'landlord', 'tenant'];

/**
 * Prototype-only control for viewing RentDito as a guest, landlord, or tenant.
 * It is not part of the production navigation contract.
 */
export const DemoRoleSwitcher = () => {
  const { role, setRole } = useDemoSession();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  if (!isDemoModeEnabled()) return null;

  const choose = (next: DemoRole) => {
    setRole(next);
    setOpen(false);
    navigate(ROLE_HOMES[next]);
  };

  return (
    <div className={styles.switcher} ref={containerRef}>
      <button
        type="button"
        className={styles.trigger}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((previous) => !previous)}
      >
        View as
        {/* Hidden from the accessible name so the control reads as "View as". */}
        <span className={styles.current} aria-hidden="true">
          {DEMO_ROLE_LABELS[role]}
        </span>
        <ChevronDown className={styles.chevron} aria-hidden="true" />
      </button>

      {open ? (
        <div className={styles.menu} role="menu" aria-label="Prototype viewing role">
          {ROLE_ORDER.map((option) => (
            <button
              key={option}
              type="button"
              role="menuitem"
              className={styles.item}
              aria-current={option === role ? 'true' : undefined}
              onClick={() => choose(option)}
            >
              {DEMO_ROLE_LABELS[option]}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
};

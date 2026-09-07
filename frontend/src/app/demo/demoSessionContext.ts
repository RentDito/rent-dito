import { createContext, useContext } from 'react';

export type DemoRole = 'guest' | 'landlord' | 'tenant';

export interface DemoSession {
  role: DemoRole;
  setRole: (role: DemoRole) => void;
  /** Restores the versioned seed data and clears cached reads. */
  reset: () => Promise<void>;
}

export const DemoSessionContext = createContext<DemoSession | null>(null);

export function useDemoSession(): DemoSession {
  const session = useContext(DemoSessionContext);

  if (!session) {
    throw new Error('useDemoSession must be used inside DemoSessionProvider.');
  }

  return session;
}

export const DEMO_ROLE_LABELS: Record<DemoRole, string> = {
  guest: 'Guest browsing',
  landlord: 'Landlord demo',
  tenant: 'Tenant demo',
};

/** Demo mode can be switched off so the switcher never ships to production. */
export const isDemoModeEnabled = () => import.meta.env.VITE_DEMO_MODE !== 'false';

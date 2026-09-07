import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useMemo, useState, type ReactNode } from 'react';

import { rentDitoRepository } from '@/app/repositories';
import { getDefaultStorage } from '@/shared/lib/storage';

import { DemoSessionContext, type DemoRole, type DemoSession } from './demoSessionContext';

const ROLE_STORAGE_KEY = 'rentdito:demo-role';

const isDemoRole = (value: string | null): value is DemoRole =>
  value === 'guest' || value === 'landlord' || value === 'tenant';

const readStoredRole = (): DemoRole => {
  const stored = getDefaultStorage().getItem(ROLE_STORAGE_KEY);
  return isDemoRole(stored) ? stored : 'guest';
};

export interface DemoSessionProviderProps {
  /** Overrides the stored role. Used by tests and demo entry points. */
  initialRole?: DemoRole;
  children: ReactNode;
}

/**
 * Holds the prototype's viewing role. This stands in for authentication: in a
 * real implementation the signed-in account would determine the workspace.
 */
export const DemoSessionProvider = ({ initialRole, children }: DemoSessionProviderProps) => {
  const queryClient = useQueryClient();
  const [role, setRoleState] = useState<DemoRole>(() => initialRole ?? readStoredRole());

  const setRole = useCallback((next: DemoRole) => {
    setRoleState(next);
    getDefaultStorage().setItem(ROLE_STORAGE_KEY, next);
  }, []);

  const reset = useCallback(async () => {
    rentDitoRepository.resetDemoData();
    await queryClient.invalidateQueries();
  }, [queryClient]);

  const value = useMemo<DemoSession>(() => ({ role, setRole, reset }), [role, setRole, reset]);

  return <DemoSessionContext.Provider value={value}>{children}</DemoSessionContext.Provider>;
};

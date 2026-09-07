import { QueryClientProvider, type QueryClient } from '@tanstack/react-query';
import { useMemo } from 'react';
import { RouterProvider } from 'react-router-dom';

import { DemoSessionProvider } from '@/app/demo/DemoSessionProvider';
import type { DemoRole } from '@/app/demo/demoSessionContext';
import { createQueryClient } from '@/app/queryClient';
import { createAppRouter } from '@/app/router';

export interface AppProps {
  /** Injected by tests so each render gets an isolated cache. */
  queryClient?: QueryClient;
  initialRole?: DemoRole;
}

export const App = ({ queryClient, initialRole }: AppProps = {}) => {
  const client = useMemo(() => queryClient ?? createQueryClient(), [queryClient]);
  const router = useMemo(() => createAppRouter(), []);

  return (
    <QueryClientProvider client={client}>
      <DemoSessionProvider initialRole={initialRole}>
        <RouterProvider router={router} />
      </DemoSessionProvider>
    </QueryClientProvider>
  );
};

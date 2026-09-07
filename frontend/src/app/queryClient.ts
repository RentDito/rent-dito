import { QueryClient } from '@tanstack/react-query';

/**
 * Prototype query defaults. Reads are cached briefly so navigation feels
 * instant, and failures surface quickly instead of retrying against a mock.
 */
export const createQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: 1,
        staleTime: 30_000,
        refetchOnWindowFocus: false,
      },
      mutations: {
        retry: 0,
      },
    },
  });

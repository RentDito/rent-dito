import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, type RenderOptions, type RenderResult } from '@testing-library/react';
import type { ReactElement, ReactNode } from 'react';

import { App } from '@/app/App';
import type { DemoRole } from '@/app/demo/demoSessionContext';

import { setViewportWidth } from './setup';

/** Query client tuned for tests: no retries, no cache reuse between renders. */
export const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0, staleTime: 0 },
      mutations: { retry: false },
    },
  });

export interface RenderWithProvidersResult extends RenderResult {
  queryClient: QueryClient;
}

/**
 * Renders a single component with the application's data providers, for tests
 * that do not need routing.
 */
export function renderWithProviders(
  ui: ReactElement,
  options: Omit<RenderOptions, 'wrapper'> & { queryClient?: QueryClient } = {},
): RenderWithProvidersResult {
  const { queryClient = createTestQueryClient(), ...renderOptions } = options;

  const Wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  return { ...render(ui, { wrapper: Wrapper, ...renderOptions }), queryClient };
}

export const VIEWPORTS = {
  mobile: 390,
  tablet: 768,
  desktop: 1440,
} as const;

export interface RenderAppOptions {
  /** Path the browser history starts at. */
  route?: string;
  role?: DemoRole;
  viewport?: keyof typeof VIEWPORTS;
  queryClient?: QueryClient;
}

/**
 * Renders the whole application at a route, role, and viewport. Using the real
 * `App` composition keeps tests honest about routing, providers, and shells.
 */
export function renderApp({
  route = '/',
  role = 'guest',
  viewport = 'desktop',
  queryClient = createTestQueryClient(),
}: RenderAppOptions = {}): RenderWithProvidersResult {
  setViewportWidth(VIEWPORTS[viewport]);
  window.history.replaceState(null, '', route);

  return {
    ...render(<App queryClient={queryClient} initialRole={role} />),
    queryClient,
  };
}

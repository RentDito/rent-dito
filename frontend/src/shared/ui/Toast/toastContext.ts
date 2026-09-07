import { createContext, useContext } from 'react';

import type { Tone } from '@/shared/types/status';

export interface ToastRequest {
  title: string;
  description?: string;
  tone?: Extract<Tone, 'success' | 'info' | 'warning' | 'danger'>;
}

export interface ToastApi {
  /** Announces a short confirmation. Never the only place important news appears. */
  showToast: (toast: ToastRequest) => void;
}

export const ToastContext = createContext<ToastApi | null>(null);

export function useToast(): ToastApi {
  const api = useContext(ToastContext);

  if (!api) {
    throw new Error('useToast must be used inside ToastProvider.');
  }

  return api;
}

import { X } from 'lucide-react';
import { useCallback, useMemo, useRef, useState, type ReactNode } from 'react';

import { ToastContext, type ToastApi, type ToastRequest } from './toastContext';
import styles from './Toast.module.css';

interface ActiveToast extends ToastRequest {
  id: number;
}

const DISMISS_AFTER_MS = 6_000;

const toneClasses = {
  success: styles.success,
  info: styles.info,
  warning: styles.warning,
  danger: styles.danger,
} as const;

/**
 * Transient confirmations in a polite live region. Every message a toast shows
 * is also visible in page content, so nothing important is lost when it fades.
 */
export const ToastProvider = ({ children }: { children: ReactNode }) => {
  const [toasts, setToasts] = useState<ActiveToast[]>([]);
  const nextId = useRef(0);

  const dismiss = useCallback((id: number) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const showToast = useCallback(
    (toast: ToastRequest) => {
      const id = (nextId.current += 1);
      setToasts((current) => [...current, { ...toast, id }]);
      window.setTimeout(() => dismiss(id), DISMISS_AFTER_MS);
    },
    [dismiss],
  );

  const api = useMemo<ToastApi>(() => ({ showToast }), [showToast]);

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className={styles.region} role="status" aria-live="polite" aria-label="Notifications">
        {toasts.map((toast) => (
          <div key={toast.id} className={[styles.toast, toneClasses[toast.tone ?? 'success']].join(' ')}>
            <div>
              <p className={styles.title}>{toast.title}</p>
              {toast.description ? <p className={styles.description}>{toast.description}</p> : null}
            </div>
            <button
              type="button"
              className={styles.dismiss}
              onClick={() => dismiss(toast.id)}
              aria-label={`Dismiss ${toast.title}`}
              data-icon-button
            >
              <X aria-hidden="true" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

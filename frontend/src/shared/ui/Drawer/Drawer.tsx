import { useId, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

import { useOverlaySurface } from '@/shared/ui/Dialog/useOverlaySurface';

import styles from './Drawer.module.css';

export interface DrawerProps {
  open: boolean;
  title: string;
  /** Side the panel slides in from. Filters use the bottom sheet on mobile. */
  side?: 'bottom' | 'end';
  footer?: ReactNode;
  onClose: () => void;
  children: ReactNode;
}

/** Sliding modal panel used for mobile filters and secondary detail. */
export const Drawer = ({ open, title, side = 'bottom', footer, onClose, children }: DrawerProps) => {
  const titleId = useId();
  const panelRef = useOverlaySurface(open, onClose);

  if (!open) return null;

  return createPortal(
    <div className={styles.backdrop}>
      <div className={styles.dismissArea} aria-hidden="true" onClick={onClose} />
      <div
        ref={panelRef}
        className={[styles.panel, side === 'end' ? styles.end : styles.bottom].join(' ')}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
      >
        <header className={styles.header}>
          <h2 className={styles.title} id={titleId}>
            {title}
          </h2>
          <button
            type="button"
            className={styles.close}
            onClick={onClose}
            aria-label={`Close ${title}`}
            data-icon-button
          >
            <X aria-hidden="true" />
          </button>
        </header>

        <div className={styles.body} data-overlay-content>
          {children}
        </div>

        {footer ? <footer className={styles.footer}>{footer}</footer> : null}
      </div>
    </div>,
    document.body,
  );
};

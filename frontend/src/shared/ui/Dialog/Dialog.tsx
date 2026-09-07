import { useId, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

import styles from './Dialog.module.css';
import { useOverlaySurface } from './useOverlaySurface';

export interface DialogProps {
  open: boolean;
  title: string;
  description?: ReactNode;
  /** Confirmation and cancel controls rendered in the dialog footer. */
  footer?: ReactNode;
  onClose: () => void;
  children: ReactNode;
}

/** Modal surface used for confirmations and short focused forms. */
export const Dialog = ({ open, title, description, footer, onClose, children }: DialogProps) => {
  const titleId = useId();
  const descriptionId = useId();
  const panelRef = useOverlaySurface(open, onClose);

  if (!open) return null;

  return createPortal(
    <div className={styles.backdrop}>
      {/* Decorative dismiss area; every dialog also has a named close button. */}
      <div className={styles.dismissArea} aria-hidden="true" onClick={onClose} />
      <div
        ref={panelRef}
        className={styles.panel}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descriptionId : undefined}
        tabIndex={-1}
      >
        <header className={styles.header}>
          <div>
            <h2 className={styles.title} id={titleId}>
              {title}
            </h2>
            {description ? (
              <p className={styles.description} id={descriptionId}>
                {description}
              </p>
            ) : null}
          </div>
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

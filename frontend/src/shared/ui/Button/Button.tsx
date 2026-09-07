import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';

import styles from './Button.module.css';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type ButtonSize = 'medium' | 'large';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Stretch to the container width, used for mobile primary actions. */
  block?: boolean;
  /** Marks the control busy and prevents repeat submissions. */
  loading?: boolean;
  startIcon?: ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = 'primary',
    size = 'medium',
    block = false,
    loading = false,
    startIcon,
    className,
    disabled,
    type = 'button',
    children,
    ...rest
  },
  ref,
) {
  return (
    <button
      {...rest}
      ref={ref}
      type={type}
      className={[styles.button, styles[variant], styles[size], block ? styles.block : '', className]
        .filter(Boolean)
        .join(' ')}
      disabled={disabled ?? loading}
      aria-busy={loading || undefined}
    >
      {startIcon ? (
        <span className={styles.icon} aria-hidden="true">
          {startIcon}
        </span>
      ) : null}
      <span>{children}</span>
    </button>
  );
});

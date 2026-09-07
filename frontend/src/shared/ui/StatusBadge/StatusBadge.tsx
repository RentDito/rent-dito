import type { ReactNode } from 'react';

import type { Tone } from '@/shared/types/status';

import styles from './StatusBadge.module.css';

export interface StatusBadgeProps {
  tone?: Tone;
  /** Optional decorative icon; the label text always carries the meaning. */
  icon?: ReactNode;
  className?: string;
  children: ReactNode;
}

/** Status is always readable text, never colour alone. */
export const StatusBadge = ({ tone = 'neutral', icon, className, children }: StatusBadgeProps) => (
  <span className={[styles.badge, styles[tone], className].filter(Boolean).join(' ')}>
    {icon ? (
      <span className={styles.icon} aria-hidden="true">
        {icon}
      </span>
    ) : (
      <span className={styles.dot} aria-hidden="true" />
    )}
    {children}
  </span>
);

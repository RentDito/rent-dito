import type { CSSProperties } from 'react';

import styles from './Skeleton.module.css';

export interface SkeletonProps {
  /** Number of stacked placeholder lines. */
  lines?: number;
  width?: string;
  height?: string;
  radius?: string;
  className?: string;
  'data-testid'?: string;
}

/**
 * Shape-preserving loading placeholder. Hidden from assistive technology so
 * the surrounding live region carries the loading message instead.
 */
export const Skeleton = ({
  lines = 1,
  width,
  height,
  radius,
  className,
  'data-testid': testId,
}: SkeletonProps) => {
  const style = { '--skeleton-height': height, '--skeleton-radius': radius } as CSSProperties;

  return (
    <span
      className={[styles.stack, className].filter(Boolean).join(' ')}
      style={{ ...style, inlineSize: width }}
      aria-hidden="true"
      data-testid={testId}
    >
      {Array.from({ length: lines }, (_, index) => (
        <span
          key={index}
          className={styles.line}
          style={index === lines - 1 && lines > 1 ? { inlineSize: '60%' } : undefined}
        />
      ))}
    </span>
  );
};

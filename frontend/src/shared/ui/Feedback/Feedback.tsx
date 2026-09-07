import type { ReactNode } from 'react';

import type { Tone } from '@/shared/types/status';
import { Button } from '@/shared/ui/Button/Button';

import styles from './Feedback.module.css';

export interface InlineAlertProps {
  tone?: Extract<Tone, 'info' | 'success' | 'warning' | 'danger'>;
  title: ReactNode;
  /** Supporting explanation or corrective action. */
  children?: ReactNode;
  action?: ReactNode;
  className?: string;
}

const alertTones: Record<NonNullable<InlineAlertProps['tone']>, string> = {
  info: styles.info,
  success: styles.success,
  warning: styles.warning,
  danger: styles.danger,
};

/**
 * Section-level notice. Urgent tones are announced assertively; informational
 * and success notices stay polite so they do not interrupt reading.
 */
export const InlineAlert = ({
  tone = 'info',
  title,
  children,
  action,
  className,
}: InlineAlertProps) => (
  <div
    className={[styles.alert, alertTones[tone], className].filter(Boolean).join(' ')}
    role={tone === 'danger' || tone === 'warning' ? 'alert' : 'status'}
  >
    <div className={styles.alertText}>
      <p className={styles.alertTitle}>{title}</p>
      {children ? <div className={styles.alertBody}>{children}</div> : null}
    </div>
    {action ? <div className={styles.alertAction}>{action}</div> : null}
  </div>
);

export interface SectionErrorProps {
  title: string;
  description?: ReactNode;
  onRetry?: () => void;
  retryLabel?: string;
}

/** Recoverable failure for one page section, keeping the rest of the page usable. */
export const SectionError = ({
  title,
  description = 'Something went wrong while loading this section. Your other information is unaffected.',
  onRetry,
  retryLabel = 'Try again',
}: SectionErrorProps) => (
  <InlineAlert
    tone="danger"
    title={title}
    action={
      onRetry ? (
        <Button variant="secondary" onClick={onRetry}>
          {retryLabel}
        </Button>
      ) : null
    }
  >
    {description}
  </InlineAlert>
);

export interface EmptyStateProps {
  title: string;
  description?: ReactNode;
  icon?: ReactNode;
  action?: ReactNode;
  /** Heading level, so empty states fit the surrounding page outline. */
  headingLevel?: 2 | 3;
}

/** True-empty and no-match state. Always says what to do next. */
export const EmptyState = ({
  title,
  description,
  icon,
  action,
  headingLevel = 3,
}: EmptyStateProps) => {
  const Heading = headingLevel === 2 ? 'h2' : 'h3';

  return (
    <div className={styles.empty}>
      {icon ? (
        <span className={styles.emptyIcon} aria-hidden="true">
          {icon}
        </span>
      ) : null}
      <Heading className={styles.emptyTitle}>{title}</Heading>
      {description ? <p className={styles.emptyDescription}>{description}</p> : null}
      {action ? <div className={styles.emptyAction}>{action}</div> : null}
    </div>
  );
};

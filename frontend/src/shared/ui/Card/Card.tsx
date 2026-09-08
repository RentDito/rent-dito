import { useId, type ReactNode } from 'react';

import type { Tone } from '@/shared/types/status';

import styles from './Card.module.css';

export interface CardProps {
  /** When present the card becomes a labelled region. */
  title?: string;
  description?: ReactNode;
  /** Actions rendered beside the card heading. */
  actions?: ReactNode;
  footer?: ReactNode;
  /** Heading level, so cards nest correctly inside page sections. */
  headingLevel?: 2 | 3;
  padding?: 'default' | 'flush';
  className?: string;
  children: ReactNode;
}

export const Card = ({
  title,
  description,
  actions,
  footer,
  headingLevel = 2,
  padding = 'default',
  className,
  children,
}: CardProps) => {
  const headingId = useId();
  const Heading = headingLevel === 2 ? 'h2' : 'h3';
  const classes = [styles.card, padding === 'flush' ? styles.flush : '', className]
    .filter(Boolean)
    .join(' ');

  if (!title) {
    return <div className={classes}>{children}</div>;
  }

  return (
    <section className={classes} aria-labelledby={headingId}>
      <header className={styles.header}>
        <div className={styles.headingGroup}>
          <Heading className={styles.title} id={headingId}>
            {title}
          </Heading>
          {description ? <p className={styles.description}>{description}</p> : null}
        </div>
        {actions ? <div className={styles.actions}>{actions}</div> : null}
      </header>

      <div className={styles.body}>{children}</div>

      {footer ? <footer className={styles.footer}>{footer}</footer> : null}
    </section>
  );
};

export interface StatCardProps {
  label: string;
  value: string;
  description?: ReactNode;
  tone?: Tone;
}

const statTones: Record<Tone, string> = {
  neutral: styles.statNeutral,
  brand: styles.statBrand,
  success: styles.statSuccess,
  warning: styles.statWarning,
  danger: styles.statDanger,
  info: styles.statInfo,
};

/** Key figure for portfolio and record summaries. Tone colours the value only when it signals urgency. */
export const StatCard = ({ label, value, description, tone = 'neutral' }: StatCardProps) => {
  const labelId = useId();

  return (
    <div className={[styles.stat, statTones[tone]].join(' ')} role="group" aria-labelledby={labelId}>
      <p className={styles.statLabel} id={labelId}>
        {label}
      </p>
      <p className={styles.statValue}>{value}</p>
      {description ? <p className={styles.statDescription}>{description}</p> : null}
    </div>
  );
};

import { Children, cloneElement, isValidElement, useId, type ReactElement, type ReactNode } from 'react';

import styles from './Field.module.css';

export interface FieldProps {
  label: string;
  /** Supporting guidance rendered before any validation error. */
  hint?: ReactNode;
  error?: string;
  required?: boolean;
  /** Renders the label visually hidden while keeping it accessible. */
  hideLabel?: boolean;
  className?: string;
  children: ReactNode;
}

type ControlProps = {
  id?: string;
  'aria-describedby'?: string;
  'aria-invalid'?: boolean;
  required?: boolean;
};

/**
 * Labels a single native control and wires its hint and error text through
 * `aria-describedby` so screen readers announce guidance with the field.
 */
export const Field = ({
  label,
  hint,
  error,
  required = false,
  hideLabel = false,
  className,
  children,
}: FieldProps) => {
  const generatedId = useId();
  const controlId = `${generatedId}-control`;
  const hintId = `${generatedId}-hint`;
  const errorId = `${generatedId}-error`;

  const describedBy = [hint ? hintId : '', error ? errorId : ''].filter(Boolean).join(' ');
  const control = Children.only(children);

  return (
    <div className={[styles.field, className].filter(Boolean).join(' ')}>
      {/* The marker sits outside the label so the accessible name stays exact. */}
      <div className={hideLabel ? styles.labelRowHidden : styles.labelRow}>
        <label className={styles.label} htmlFor={controlId}>
          {label}
        </label>
        {required ? (
          <span className={styles.requiredMark} aria-hidden="true">
            *
          </span>
        ) : null}
      </div>

      {isValidElement<ControlProps>(control)
        ? cloneElement(control as ReactElement<ControlProps>, {
            id: controlId,
            required: required || undefined,
            'aria-describedby': describedBy || undefined,
            'aria-invalid': error ? true : undefined,
          })
        : control}

      {hint ? (
        <p className={styles.hint} id={hintId}>
          {hint}
        </p>
      ) : null}

      {error ? (
        <p className={styles.error} id={errorId} role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
};

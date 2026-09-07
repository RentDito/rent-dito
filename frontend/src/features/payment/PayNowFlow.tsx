import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useId, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { remainingOn, type Due } from '@/entities/payment/model';
import type { Property, Unit } from '@/entities/property/model';
import type { Tenancy } from '@/entities/tenancy/model';
import { rentDitoRepository } from '@/app/repositories';
import { dataKeys } from '@/shared/api/queryKeys';
import { OFFLINE_ACTION_MESSAGE, useOnlineStatus } from '@/shared/hooks/useOnlineStatus';
import { formatCurrency, formatDate } from '@/shared/lib/format';
import { routes } from '@/shared/lib/routes';
import { Button } from '@/shared/ui/Button/Button';
import { Card } from '@/shared/ui/Card/Card';
import { InlineAlert } from '@/shared/ui/Feedback/Feedback';
import { useToast } from '@/shared/ui/Toast/toastContext';

import {
  DEMO_PAYMENT_METHODS,
  payNowSchema,
  SIMULATED_FEE,
  type PayNowValues,
} from './payNowSchema';
import styles from './PayNowFlow.module.css';

type Step = 'review' | 'method' | 'confirmation';

const STEP_LABELS: Record<Step, string> = {
  review: 'Step 1 of 3 · What you are paying',
  method: 'Step 2 of 3 · How you are paying',
  confirmation: 'Step 3 of 3 · Confirm',
};

export interface PayNowFlowProps {
  due: Due;
  tenancy: Tenancy;
  property?: Property;
  unit?: Unit;
}

/**
 * Three-step simulated checkout. Every amount is shown before confirmation, the
 * ₱0 fee is explicit, and a failed simulation writes nothing.
 */
export const PayNowFlow = ({ due, tenancy, property, unit }: PayNowFlowProps) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isOnline = useOnlineStatus();
  const { showToast } = useToast();

  const methodFieldId = useId();
  const [step, setStep] = useState<Step>('review');
  const [method, setMethod] = useState<PayNowValues['method'] | null>(null);
  const [simulateFailure, setSimulateFailure] = useState(false);
  const [failed, setFailed] = useState(false);

  const amount = remainingOn(due);
  const total = amount + SIMULATED_FEE;
  const chosen = DEMO_PAYMENT_METHODS.find((candidate) => candidate.value === method);

  const pay = useMutation({
    mutationFn: async () => {
      if (simulateFailure) {
        throw new Error('The simulated payment provider declined this attempt.');
      }
      const parsed = payNowSchema.safeParse({ method });
      if (!parsed.success) {
        throw new Error(parsed.error.issues[0].message);
      }
      return rentDitoRepository.recordPayment({
        dueId: due.id,
        amount,
        method: parsed.data.method,
        source: 'tenant',
      });
    },
    onSuccess: async (payment) => {
      await queryClient.invalidateQueries({ queryKey: dataKeys.dues });
      await queryClient.invalidateQueries({ queryKey: dataKeys.payments });
      showToast({ title: 'Simulated payment complete', description: due.label });
      navigate(routes.tenant.receipt(payment.id));
    },
    onError: () => setFailed(true),
  });

  return (
    <div className={styles.flow}>
      <InlineAlert tone="info" title="Prototype payment simulation">
        No money moves and no payment details are collected. RentDito only stores the record on
        this device so you can see how a receipt would look.
      </InlineAlert>

      <p className={styles.stepLabel}>{STEP_LABELS[step]}</p>

      <Card title="Payment summary">
        <dl className={styles.summary}>
          <div>
            <dt>Rental</dt>
            <dd>
              {property?.title ?? 'Your rental'}
              {unit ? ` · ${unit.name}` : ''}
            </dd>
          </div>
          <div>
            <dt>Billing period</dt>
            <dd>{due.label}</dd>
          </div>
          <div>
            <dt>Due date</dt>
            <dd>{formatDate(due.dueDate)}</dd>
          </div>
          <div>
            <dt>Amount due</dt>
            <dd>{formatCurrency(amount)}</dd>
          </div>
          <div>
            <dt>Simulated service fee</dt>
            <dd>{formatCurrency(SIMULATED_FEE)}</dd>
          </div>
          <div>
            <dt>Total to pay</dt>
            <dd className={styles.total}>{formatCurrency(total)}</dd>
          </div>
        </dl>
      </Card>

      {step === 'review' ? (
        <div className={styles.actions}>
          <Button variant="secondary" onClick={() => navigate(routes.tenant.payments)}>
            Back to payments
          </Button>
          <Button size="large" onClick={() => setStep('method')}>
            Choose payment method
          </Button>
        </div>
      ) : null}

      {step === 'method' ? (
        <Card title="Simulated payment method">
          <fieldset className={styles.fieldset}>
            <legend className="visually-hidden">Choose a simulated payment method</legend>
            {DEMO_PAYMENT_METHODS.map((option) => (
              /* The note is a description, so each radio is named by its label alone. */
              <div key={option.value} className={styles.option}>
                <input
                  id={`${methodFieldId}-${option.value}`}
                  type="radio"
                  name="demo-payment-method"
                  value={option.value}
                  checked={method === option.value}
                  onChange={() => setMethod(option.value)}
                  aria-describedby={`${methodFieldId}-${option.value}-note`}
                />
                <span className={styles.optionText}>
                  <label
                    className={styles.optionLabel}
                    htmlFor={`${methodFieldId}-${option.value}`}
                  >
                    {option.label}
                  </label>
                  <span className={styles.optionNote} id={`${methodFieldId}-${option.value}-note`}>
                    {option.note}
                  </span>
                </span>
              </div>
            ))}
          </fieldset>

          <details className={styles.utilities}>
            <summary>Demo utilities</summary>
            <label className={styles.checkbox}>
              <input
                type="checkbox"
                checked={simulateFailure}
                onChange={(event) => setSimulateFailure(event.target.checked)}
              />
              Simulate a failed payment
            </label>
            <p className={styles.optionNote}>
              Use this to see the failure state. Nothing is recorded when a simulated payment fails.
            </p>
          </details>

          <div className={styles.actions}>
            <Button variant="secondary" onClick={() => setStep('review')}>
              Go back
            </Button>
            <Button disabled={!method} onClick={() => setStep('confirmation')}>
              Review payment
            </Button>
          </div>
        </Card>
      ) : null}

      {step === 'confirmation' ? (
        <Card title="Confirm this simulated payment">
          <dl className={styles.summary}>
            <div>
              <dt>Paying as</dt>
              <dd>{tenancy.tenantName}</dd>
            </div>
            <div>
              <dt>Method</dt>
              <dd>{chosen?.label ?? 'Not chosen'}</dd>
            </div>
            <div>
              <dt>Total</dt>
              <dd className={styles.total}>{formatCurrency(total)}</dd>
            </div>
          </dl>

          {failed ? (
            <InlineAlert tone="danger" title="No payment was recorded">
              {(pay.error as Error | null)?.message ??
                'The simulated payment did not go through.'}{' '}
              Your balance is unchanged and you can try again.
            </InlineAlert>
          ) : null}

          {!isOnline ? (
            <InlineAlert tone="warning" title="Reconnect to continue this simulated payment">
              {OFFLINE_ACTION_MESSAGE}
            </InlineAlert>
          ) : null}

          <div className={styles.actions}>
            <Button variant="secondary" onClick={() => setStep('method')}>
              Change method
            </Button>
            <Button
              size="large"
              loading={pay.isPending}
              disabled={!isOnline || !method}
              onClick={() => {
                setFailed(false);
                pay.mutate();
              }}
            >
              Confirm simulated payment
            </Button>
          </div>
        </Card>
      ) : null}
    </div>
  );
};

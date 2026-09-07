import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';

import { remainingOn, type Due, type PaymentMethod } from '@/entities/payment/model';
import type { Tenancy } from '@/entities/tenancy/model';
import { rentDitoRepository } from '@/app/repositories';
import { OFFLINE_ACTION_MESSAGE, useOnlineStatus } from '@/shared/hooks/useOnlineStatus';
import { formatCurrency, formatDate, PAYMENT_METHOD_LABELS } from '@/shared/lib/format';
import { dataKeys } from '@/shared/api/queryKeys';
import { Button } from '@/shared/ui/Button/Button';
import { Field } from '@/shared/ui/Field/Field';
import { InlineAlert } from '@/shared/ui/Feedback/Feedback';
import { useToast } from '@/shared/ui/Toast/toastContext';

import styles from './RecordPaymentForm.module.css';

const METHODS: PaymentMethod[] = ['gcash', 'maya', 'bank-transfer', 'cash'];

export interface RecordPaymentFormProps {
  tenancy: Tenancy;
  /** Unpaid dues for this tenancy, soonest first. */
  dues: Due[];
  unitName?: string;
  onRecorded: () => void;
  onCancel: () => void;
}

/**
 * Landlord-side payment entry. The review step names the tenant, unit, billing
 * period, amount, and resulting balance before anything is written.
 */
export const RecordPaymentForm = ({
  tenancy,
  dues,
  unitName,
  onRecorded,
  onCancel,
}: RecordPaymentFormProps) => {
  const queryClient = useQueryClient();
  const isOnline = useOnlineStatus();
  const { showToast } = useToast();

  const [dueId, setDueId] = useState(dues[0]?.id ?? '');
  const [amount, setAmount] = useState(() => String(dues[0] ? remainingOn(dues[0]) : ''));
  const [method, setMethod] = useState<PaymentMethod>('gcash');
  const [step, setStep] = useState<'edit' | 'review'>('edit');
  const [validationError, setValidationError] = useState<string | null>(null);

  const selected = dues.find((due) => due.id === dueId);
  const remaining = selected ? remainingOn(selected) : 0;
  const parsedAmount = Number(amount);

  const record = useMutation({
    mutationFn: () =>
      rentDitoRepository.recordPayment({
        dueId,
        amount: parsedAmount,
        method,
        source: 'landlord',
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: dataKeys.dues });
      await queryClient.invalidateQueries({ queryKey: dataKeys.payments });
      showToast({ title: 'Payment saved', description: `${tenancy.tenantName} · ${method}` });
      onRecorded();
    },
  });

  const review = () => {
    if (!selected) {
      setValidationError('Choose the due this payment settles.');
      return;
    }
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      setValidationError('Enter an amount greater than zero.');
      return;
    }
    if (parsedAmount > remaining) {
      setValidationError(
        `Amount cannot be more than the ${formatCurrency(remaining)} remaining on this due.`,
      );
      return;
    }

    setValidationError(null);
    setStep('review');
  };

  const chooseDue = (nextId: string) => {
    setDueId(nextId);
    const next = dues.find((due) => due.id === nextId);
    setAmount(next ? String(remainingOn(next)) : '');
    setValidationError(null);
  };

  if (dues.length === 0) {
    return (
      <div className={styles.form}>
        <InlineAlert tone="success" title="Nothing is outstanding">
          {tenancy.tenantName} has no unpaid dues, so there is nothing to record.
        </InlineAlert>
        <div className={styles.actions}>
          <Button variant="secondary" onClick={onCancel}>
            Close
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.form}>
      {step === 'edit' ? (
        <>
          <Field label="Due to settle">
            <select value={dueId} onChange={(event) => chooseDue(event.target.value)}>
              {dues.map((due) => (
                <option key={due.id} value={due.id}>
                  {`${due.label} — ${formatCurrency(remainingOn(due))} remaining`}
                </option>
              ))}
            </select>
          </Field>

          <Field
            label="Amount received"
            required
            hint={`Up to ${formatCurrency(remaining)} remains on this due.`}
            error={validationError ?? undefined}
          >
            <input
              type="number"
              min={0}
              step={100}
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
            />
          </Field>

          <Field label="Payment method">
            <select
              value={method}
              onChange={(event) => setMethod(event.target.value as PaymentMethod)}
            >
              {METHODS.map((option) => (
                <option key={option} value={option}>
                  {PAYMENT_METHOD_LABELS[option]}
                </option>
              ))}
            </select>
          </Field>

          <div className={styles.actions}>
            <Button variant="secondary" onClick={onCancel}>
              Cancel
            </Button>
            <Button onClick={review}>Review payment</Button>
          </div>
        </>
      ) : (
        <>
          <dl className={styles.review}>
            <div>
              <dt>Tenant</dt>
              <dd>{tenancy.tenantName}</dd>
            </div>
            <div>
              <dt>Unit</dt>
              <dd>{unitName ?? 'Unit'}</dd>
            </div>
            <div>
              <dt>Billing period</dt>
              <dd>{selected?.label}</dd>
            </div>
            <div>
              <dt>Due date</dt>
              <dd>{selected ? formatDate(selected.dueDate) : '—'}</dd>
            </div>
            <div>
              <dt>Amount received</dt>
              <dd>{formatCurrency(parsedAmount)}</dd>
            </div>
            <div>
              <dt>Method</dt>
              <dd>{PAYMENT_METHOD_LABELS[method]}</dd>
            </div>
            <div>
              <dt>Remaining after this payment</dt>
              <dd>{formatCurrency(remaining - parsedAmount)}</dd>
            </div>
          </dl>

          {record.isError ? (
            <InlineAlert tone="danger" title={(record.error as Error).message}>
              No payment was recorded.
            </InlineAlert>
          ) : null}

          {!isOnline ? <InlineAlert tone="warning" title={OFFLINE_ACTION_MESSAGE} /> : null}

          <div className={styles.actions}>
            <Button variant="secondary" onClick={() => setStep('edit')}>
              Go back
            </Button>
            <Button
              loading={record.isPending}
              disabled={!isOnline}
              onClick={() => record.mutate()}
            >
              Confirm payment record
            </Button>
          </div>
        </>
      )}
    </div>
  );
};

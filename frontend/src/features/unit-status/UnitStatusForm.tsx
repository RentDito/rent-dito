import { useEffect, useState } from 'react';

import {
  UNIT_STATUS_CONSEQUENCES,
  UNIT_STATUS_LABELS,
  UNIT_STATUS_ORDER,
  type Unit,
  type UnitStatus,
} from '@/entities/property/model';
import { OFFLINE_ACTION_MESSAGE, useOnlineStatus } from '@/shared/hooks/useOnlineStatus';
import { Button } from '@/shared/ui/Button/Button';
import { Field } from '@/shared/ui/Field/Field';
import { InlineAlert } from '@/shared/ui/Feedback/Feedback';
import { StatusBadge } from '@/shared/ui/StatusBadge/StatusBadge';
import { useToast } from '@/shared/ui/Toast/toastContext';

import styles from './UnitStatusForm.module.css';
import { useUpdateUnitStatus } from './useUpdateUnitStatus';

export interface UnitStatusFormProps {
  unit: Unit;
  propertyTitle: string;
  onDone: () => void;
  onCancel: () => void;
}

/**
 * Two-step status change: choose the new status, then confirm against a plain
 * statement of what it does. Domain rejections stay inline and keep the choice.
 */
export const UnitStatusForm = ({
  unit,
  propertyTitle,
  onDone,
  onCancel,
}: UnitStatusFormProps) => {
  const [step, setStep] = useState<'edit' | 'review'>('edit');
  const [status, setStatus] = useState<UnitStatus>(unit.status);
  const isOnline = useOnlineStatus();
  const { showToast } = useToast();
  const update = useUpdateUnitStatus();

  useEffect(() => {
    setStatus(unit.status);
    setStep('edit');
    update.reset();
    // Re-arm the form whenever it is opened for a different unit.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [unit.id]);

  const unchanged = status === unit.status;

  const confirm = () => {
    update.mutate(
      { unitId: unit.id, status },
      {
        onSuccess: () => {
          showToast({
            title: 'Unit status updated',
            description: `${unit.name} is now ${UNIT_STATUS_LABELS[status].toLocaleLowerCase('en-PH')}.`,
          });
          onDone();
        },
      },
    );
  };

  return (
    <div className={styles.form}>
      <dl className={styles.context}>
        <div>
          <dt>Property</dt>
          <dd>{propertyTitle}</dd>
        </div>
        <div>
          <dt>Unit</dt>
          <dd>{unit.name}</dd>
        </div>
        <div>
          <dt>Current status</dt>
          <dd>
            <StatusBadge tone="neutral">{UNIT_STATUS_LABELS[unit.status]}</StatusBadge>
          </dd>
        </div>
      </dl>

      {step === 'edit' ? (
        <>
          <Field label="New unit status" hint={UNIT_STATUS_CONSEQUENCES[status]}>
            <select
              value={status}
              onChange={(event) => setStatus(event.target.value as UnitStatus)}
            >
              {UNIT_STATUS_ORDER.map((option) => (
                <option key={option} value={option}>
                  {UNIT_STATUS_LABELS[option]}
                </option>
              ))}
            </select>
          </Field>

          <div className={styles.actions}>
            <Button variant="secondary" onClick={onCancel}>
              Cancel
            </Button>
            <Button disabled={unchanged} onClick={() => setStep('review')}>
              Review change
            </Button>
          </div>
        </>
      ) : (
        <>
          <InlineAlert
            tone="info"
            title={`${unit.name} will change to ${UNIT_STATUS_LABELS[status]}`}
          >
            {UNIT_STATUS_CONSEQUENCES[status]}
          </InlineAlert>

          {update.isError ? (
            <InlineAlert tone="danger" title={(update.error as Error).message}>
              Nothing was changed. {unit.name} is still{' '}
              {UNIT_STATUS_LABELS[unit.status].toLocaleLowerCase('en-PH')}.
            </InlineAlert>
          ) : null}

          {!isOnline ? <InlineAlert tone="warning" title={OFFLINE_ACTION_MESSAGE} /> : null}

          <div className={styles.actions}>
            <Button variant="secondary" onClick={() => setStep('edit')}>
              Go back
            </Button>
            <Button loading={update.isPending} disabled={!isOnline} onClick={confirm}>
              Confirm status change
            </Button>
          </div>
        </>
      )}
    </div>
  );
};

import { StatusBadge } from '@/shared/ui/StatusBadge/StatusBadge';

import { DUE_STATUS_LABELS, DUE_STATUS_TONES, type DueStatus } from './status';

/** One labelled presentation of due status for every workspace surface. */
export const PaymentStatusBadge = ({ status }: { status: DueStatus }) => (
  <StatusBadge tone={DUE_STATUS_TONES[status]}>{DUE_STATUS_LABELS[status]}</StatusBadge>
);

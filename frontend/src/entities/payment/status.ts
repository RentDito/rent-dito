import type { Tone } from '@/shared/types/status';

import type { Due } from './model';

export type DueStatus = 'paid' | 'partial' | 'overdue' | 'due-soon' | 'upcoming';

export type DueLike = Pick<Due, 'amount' | 'paidAmount' | 'dueDate'>;

export function getDueStatus(due: DueLike, now = new Date()): DueStatus {
  if (due.paidAmount >= due.amount) return 'paid';
  if (due.paidAmount > 0) return 'partial';

  const days = Math.ceil((new Date(due.dueDate).getTime() - now.getTime()) / 86_400_000);
  if (days < 0) return 'overdue';
  if (days <= 7) return 'due-soon';
  return 'upcoming';
}

export const DUE_STATUS_LABELS: Record<DueStatus, string> = {
  paid: 'Paid',
  partial: 'Partly paid',
  overdue: 'Overdue',
  'due-soon': 'Due soon',
  upcoming: 'Upcoming',
};

export const DUE_STATUS_TONES: Record<DueStatus, Tone> = {
  paid: 'success',
  partial: 'warning',
  overdue: 'danger',
  'due-soon': 'warning',
  upcoming: 'neutral',
};

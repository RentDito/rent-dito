export type PaymentMethod = 'gcash' | 'maya' | 'bank-transfer' | 'cash';

export interface Due {
  id: string;
  tenancyId: string;
  label: string;
  amount: number;
  paidAmount: number;
  dueDate: string;
}

export interface Payment {
  id: string;
  dueId: string;
  tenancyId: string;
  amount: number;
  method: PaymentMethod;
  source: 'landlord' | 'tenant';
  recordedAt: string;
}

/** Amount still owed on a due. */
export const remainingOn = (due: Due) => due.amount - due.paidAmount;

/**
 * Human-readable receipt reference derived from the stored payment, so the same
 * payment always shows the same reference.
 */
export const paymentReference = (payment: Payment) =>
  `RD-${new Date(payment.recordedAt).getFullYear()}-${payment.id.slice(-6).toLocaleUpperCase('en-PH')}`;

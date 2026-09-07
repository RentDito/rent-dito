import { z } from 'zod';

/**
 * Simulated payment methods only. The prototype never collects card numbers,
 * account numbers, or one-time passwords.
 */
export const DEMO_PAYMENT_METHODS = [
  { value: 'gcash', label: 'GCash demo', note: 'Simulates an e-wallet payment.' },
  { value: 'maya', label: 'Maya demo', note: 'Simulates an e-wallet payment.' },
  { value: 'bank-transfer', label: 'Bank transfer demo', note: 'Simulates an online transfer.' },
] as const;

export const payNowSchema = z.object({
  method: z.enum(['gcash', 'maya', 'bank-transfer'], {
    message: 'Choose a simulated payment method.',
  }),
});

export type PayNowValues = z.infer<typeof payNowSchema>;

/** The prototype charges nothing, and says so explicitly. */
export const SIMULATED_FEE = 0;

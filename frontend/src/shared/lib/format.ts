const peso = new Intl.NumberFormat('en-PH', {
  style: 'currency',
  currency: 'PHP',
  maximumFractionDigits: 0,
});

export const formatCurrency = (value: number) => peso.format(value);

export const formatDate = (value: string | Date) =>
  new Intl.DateTimeFormat('en-PH', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'Asia/Manila',
  }).format(new Date(value));

/** Manila-local date and time, for receipts and message timestamps. */
export const formatDateTime = (value: string | Date) =>
  new Intl.DateTimeFormat('en-PH', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZone: 'Asia/Manila',
  }).format(new Date(value));

export const PAYMENT_METHOD_LABELS = {
  gcash: 'GCash',
  maya: 'Maya',
  'bank-transfer': 'Bank transfer',
  cash: 'Cash',
} as const;

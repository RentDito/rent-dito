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

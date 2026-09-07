import type { Tone } from '@/shared/types/status';

export type TenancyStatus = 'active' | 'ended' | 'pending';

export interface Tenancy {
  id: string;
  tenantId: string;
  landlordId: string;
  propertyId: string;
  unitId: string;
  status: TenancyStatus;
  /** Denormalised tenant facts, as a tenancy API would return them. */
  tenantName: string;
  tenantEmail: string;
  tenantPhone: string;
  startDate: string;
  endDate: string;
  monthlyRent: number;
  paymentDueDay: number;
}

export const TENANCY_STATUS_LABELS: Record<TenancyStatus, string> = {
  active: 'Active',
  pending: 'Starting soon',
  ended: 'Ended',
};

export const TENANCY_STATUS_TONES: Record<TenancyStatus, Tone> = {
  active: 'success',
  pending: 'warning',
  ended: 'neutral',
};

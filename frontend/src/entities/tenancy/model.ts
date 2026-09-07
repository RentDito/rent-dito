export type TenancyStatus = 'active' | 'ended' | 'pending';

export interface Tenancy {
  id: string;
  tenantId: string;
  landlordId: string;
  propertyId: string;
  unitId: string;
  status: TenancyStatus;
  startDate: string;
  endDate: string;
  monthlyRent: number;
  paymentDueDay: number;
}

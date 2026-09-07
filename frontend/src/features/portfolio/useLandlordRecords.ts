import { useQueries } from '@tanstack/react-query';

import { rentDitoRepository } from '@/app/repositories';
import type { Due, Payment } from '@/entities/payment/model';
import type { Property } from '@/entities/property/model';
import type { Tenancy } from '@/entities/tenancy/model';
import { DEMO_LANDLORD_ID } from '@/entities/user/model';
import { listingKeys } from '@/features/listing-search/useListingSearch';
import { dataKeys } from '@/shared/api/queryKeys';

export interface LandlordRecords {
  properties: Property[];
  tenancies: Tenancy[];
  dues: Due[];
  payments: Payment[];
  propertyOf: (tenancy: Tenancy) => Property | undefined;
  unitNameOf: (tenancy: Tenancy) => string | undefined;
  duesOf: (tenancyId: string) => Due[];
  paymentsOf: (tenancyId: string) => Payment[];
  outstandingOf: (tenancyId: string) => number;
}

/**
 * The landlord's own records, joined once so every operations page reads the
 * same shape instead of re-deriving relationships.
 */
export function useLandlordRecords() {
  const [properties, tenancies, dues, payments] = useQueries({
    queries: [
      { queryKey: listingKeys.list({}), queryFn: () => rentDitoRepository.listProperties({}) },
      { queryKey: dataKeys.tenancies, queryFn: () => rentDitoRepository.listTenancies() },
      { queryKey: dataKeys.dues, queryFn: () => rentDitoRepository.listDues() },
      { queryKey: dataKeys.payments, queryFn: () => rentDitoRepository.listPayments() },
    ],
  });

  const isPending =
    properties.isPending || tenancies.isPending || dues.isPending || payments.isPending;
  const error = properties.error ?? tenancies.error ?? dues.error ?? payments.error;

  const refetch = () => {
    void properties.refetch();
    void tenancies.refetch();
    void dues.refetch();
    void payments.refetch();
  };

  if (!properties.data || !tenancies.data || !dues.data || !payments.data) {
    return { isPending, error, refetch, records: undefined };
  }

  const owned = properties.data.filter((property) => property.landlordId === DEMO_LANDLORD_ID);
  const ownedTenancies = tenancies.data.filter(
    (tenancy) => tenancy.landlordId === DEMO_LANDLORD_ID,
  );
  const ownedTenancyIds = new Set(ownedTenancies.map((tenancy) => tenancy.id));
  const ownedDues = dues.data.filter((due) => ownedTenancyIds.has(due.tenancyId));
  const ownedPayments = payments.data.filter((payment) =>
    ownedTenancyIds.has(payment.tenancyId),
  );

  const propertyLookup = new Map(owned.map((property) => [property.id, property]));
  const unitLookup = new Map(
    owned.flatMap((property) => property.units).map((unit) => [unit.id, unit]),
  );

  const duesOf = (tenancyId: string) =>
    ownedDues
      .filter((due) => due.tenancyId === tenancyId)
      .sort((left, right) => left.dueDate.localeCompare(right.dueDate));

  const records: LandlordRecords = {
    properties: owned,
    tenancies: ownedTenancies,
    dues: ownedDues,
    payments: ownedPayments,
    propertyOf: (tenancy) => propertyLookup.get(tenancy.propertyId),
    unitNameOf: (tenancy) => unitLookup.get(tenancy.unitId)?.name,
    duesOf,
    paymentsOf: (tenancyId) =>
      ownedPayments
        .filter((payment) => payment.tenancyId === tenancyId)
        .sort((left, right) => right.recordedAt.localeCompare(left.recordedAt)),
    outstandingOf: (tenancyId) =>
      duesOf(tenancyId).reduce((total, due) => total + (due.amount - due.paidAmount), 0),
  };

  return { isPending: false, error: null, refetch, records };
}

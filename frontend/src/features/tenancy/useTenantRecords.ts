import { useQueries } from '@tanstack/react-query';

import { remainingOn, type Due, type Payment } from '@/entities/payment/model';
import type { Property, Unit } from '@/entities/property/model';
import type { Tenancy } from '@/entities/tenancy/model';
import { DEMO_TENANT_ID } from '@/entities/user/model';
import { rentDitoRepository } from '@/app/repositories';
import { listingKeys } from '@/features/listing-search/useListingSearch';
import { dataKeys } from '@/shared/api/queryKeys';

export interface TenantRecords {
  tenancy?: Tenancy;
  property?: Property;
  unit?: Unit;
  /** Every due for this tenancy, soonest first. */
  dues: Due[];
  unpaidDues: Due[];
  payments: Payment[];
  outstanding: number;
  /** The due the tenant should act on next, if any. */
  nextDue?: Due;
  dueById: (dueId: string) => Due | undefined;
}

/**
 * The signed-in tenant's rental, dues, and payments, joined once so every
 * tenant page reads the same shape.
 */
export function useTenantRecords() {
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

  const mine = tenancies.data.filter((tenancy) => tenancy.tenantId === DEMO_TENANT_ID);
  const tenancy = mine.find((candidate) => candidate.status === 'active') ?? mine[0];

  const property = tenancy
    ? properties.data.find((candidate) => candidate.id === tenancy.propertyId)
    : undefined;
  const unit = property?.units.find((candidate) => candidate.id === tenancy?.unitId);

  const myDues = tenancy
    ? dues.data
        .filter((due) => due.tenancyId === tenancy.id)
        .sort((left, right) => left.dueDate.localeCompare(right.dueDate))
    : [];
  const unpaidDues = myDues.filter((due) => remainingOn(due) > 0);
  const myPayments = tenancy
    ? payments.data
        .filter((payment) => payment.tenancyId === tenancy.id)
        .sort((left, right) => right.recordedAt.localeCompare(left.recordedAt))
    : [];

  const records: TenantRecords = {
    tenancy,
    property,
    unit,
    dues: myDues,
    unpaidDues,
    payments: myPayments,
    outstanding: unpaidDues.reduce((total, due) => total + remainingOn(due), 0),
    nextDue: unpaidDues[0],
    dueById: (dueId) => myDues.find((due) => due.id === dueId),
  };

  return { isPending: false, error: null, refetch, records };
}

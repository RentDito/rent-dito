import { useQueries } from '@tanstack/react-query';

import { rentDitoRepository } from '@/app/repositories';
import { inquiryKeys } from '@/features/inquiry/inquiryKeys';
import { listingKeys } from '@/features/listing-search/useListingSearch';
import { dataKeys } from '@/shared/api/queryKeys';
import { DEMO_LANDLORD_ID } from '@/entities/user/model';
import type { Due } from '@/entities/payment/model';
import type { Property } from '@/entities/property/model';
import type { Tenancy } from '@/entities/tenancy/model';

export interface PortfolioSummary {
  propertyCount: number;
  unitCount: number;
  occupiedCount: number;
  vacantCount: number;
  occupancyRate: number;
  expectedThisMonth: number;
  collectedThisMonth: number;
  overdueAmount: number;
  overdueCount: number;
  openInquiryCount: number;
  needsReplyCount: number;
  /** Unpaid dues, soonest first, for the attention list. */
  attentionDues: Array<{ due: Due; tenancy: Tenancy; property?: Property; unitName?: string }>;
}

const isSameMonth = (isoDate: string, reference: Date) => {
  const date = new Date(isoDate);
  return (
    date.getFullYear() === reference.getFullYear() && date.getMonth() === reference.getMonth()
  );
};

/**
 * Derives the landlord's operating picture from the seeded records rather than
 * from hard-coded totals, so the numbers stay true after any mutation.
 */
export function usePortfolioSummary(now: Date = new Date()) {
  const [properties, tenancies, dues, inquiries] = useQueries({
    queries: [
      { queryKey: listingKeys.list({}), queryFn: () => rentDitoRepository.listProperties({}) },
      { queryKey: dataKeys.tenancies, queryFn: () => rentDitoRepository.listTenancies() },
      { queryKey: dataKeys.dues, queryFn: () => rentDitoRepository.listDues() },
      {
        queryKey: inquiryKeys.list('landlord'),
        queryFn: () => rentDitoRepository.listInquiries('landlord'),
      },
    ],
  });

  const isPending =
    properties.isPending || tenancies.isPending || dues.isPending || inquiries.isPending;
  const error = properties.error ?? tenancies.error ?? dues.error ?? inquiries.error;

  const refetch = () => {
    void properties.refetch();
    void tenancies.refetch();
    void dues.refetch();
    void inquiries.refetch();
  };

  if (isPending || !properties.data || !tenancies.data || !dues.data || !inquiries.data) {
    return { isPending, error, refetch, summary: undefined, properties: properties.data };
  }

  const owned = properties.data.filter((property) => property.landlordId === DEMO_LANDLORD_ID);
  const ownedTenancies = tenancies.data.filter(
    (tenancy) => tenancy.landlordId === DEMO_LANDLORD_ID,
  );
  const ownedTenancyIds = new Set(ownedTenancies.map((tenancy) => tenancy.id));
  const ownedDues = dues.data.filter((due) => ownedTenancyIds.has(due.tenancyId));

  const units = owned.flatMap((property) => property.units);
  const occupiedCount = units.filter((unit) => unit.status === 'occupied').length;
  const vacantCount = units.filter((unit) => unit.status === 'available').length;

  const monthDues = ownedDues.filter((due) => isSameMonth(due.dueDate, now));
  const unpaid = ownedDues.filter((due) => due.paidAmount < due.amount);
  const overdue = unpaid.filter((due) => new Date(due.dueDate) < now);

  const unitLookup = new Map(units.map((unit) => [unit.id, unit]));
  const propertyLookup = new Map(owned.map((property) => [property.id, property]));

  const summary: PortfolioSummary = {
    propertyCount: owned.length,
    unitCount: units.length,
    occupiedCount,
    vacantCount,
    occupancyRate: units.length === 0 ? 0 : occupiedCount / units.length,
    expectedThisMonth: monthDues.reduce((total, due) => total + due.amount, 0),
    collectedThisMonth: monthDues.reduce((total, due) => total + due.paidAmount, 0),
    overdueAmount: overdue.reduce((total, due) => total + (due.amount - due.paidAmount), 0),
    overdueCount: overdue.length,
    openInquiryCount: inquiries.data.filter((inquiry) => inquiry.status === 'open').length,
    needsReplyCount: inquiries.data.filter((inquiry) => inquiry.status !== 'closed' && !inquiry.reply)
      .length,
    attentionDues: unpaid
      .slice()
      .sort((left, right) => left.dueDate.localeCompare(right.dueDate))
      .map((due) => {
        const tenancy = ownedTenancies.find((candidate) => candidate.id === due.tenancyId)!;
        return {
          due,
          tenancy,
          property: propertyLookup.get(tenancy.propertyId),
          unitName: unitLookup.get(tenancy.unitId)?.name,
        };
      }),
  };

  return { isPending: false, error: null, refetch, summary, properties: owned };
}

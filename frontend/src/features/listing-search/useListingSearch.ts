import { useQuery } from '@tanstack/react-query';
import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';

import type { PropertyType } from '@/entities/property/model';
import { rentDitoRepository } from '@/app/repositories';
import type { ListingFilters } from '@/shared/api/contracts';

/** Query keys for every listing read, so mutations can invalidate precisely. */
export const listingKeys = {
  all: ['listings'] as const,
  list: (filters: ListingFilters) => ['listings', 'list', filters] as const,
  detail: (propertyId: string) => ['listings', 'detail', propertyId] as const,
  saved: ['listings', 'saved'] as const,
};

export const PROPERTY_TYPES: Array<{ value: PropertyType; label: string }> = [
  { value: 'apartment', label: 'Apartment' },
  { value: 'condominium', label: 'Condominium' },
  { value: 'house', label: 'House' },
  { value: 'bedspace', label: 'Bedspace' },
];

export const CITIES = [
  'Makati',
  'Quezon City',
  'Pasig',
  'Muntinlupa',
  'Cebu City',
  'Davao City',
] as const;

/** The query-string keys this feature owns; Clear all removes only these. */
export const FILTER_PARAM_KEYS = ['q', 'city', 'type', 'minRent', 'maxRent'] as const;

const isPropertyType = (value: string): value is PropertyType =>
  PROPERTY_TYPES.some((type) => type.value === value);

const toPositiveNumber = (value: string | null): number | undefined => {
  if (!value) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
};

export interface AppliedFilter {
  key: (typeof FILTER_PARAM_KEYS)[number];
  label: string;
}

/**
 * Reads listing filters from the URL so results are shareable and survive
 * reloads, and exposes the writes the filter form and chips need.
 */
export function useListingSearch() {
  const [searchParams, setSearchParams] = useSearchParams();

  const filters = useMemo<ListingFilters>(() => {
    const type = searchParams.get('type');

    return {
      query: searchParams.get('q') ?? undefined,
      city: searchParams.get('city') ?? undefined,
      types: type && isPropertyType(type) ? [type] : undefined,
      minRent: toPositiveNumber(searchParams.get('minRent')),
      maxRent: toPositiveNumber(searchParams.get('maxRent')),
    };
  }, [searchParams]);

  const hasFilters = FILTER_PARAM_KEYS.some((key) => Boolean(searchParams.get(key)));

  const appliedFilters = useMemo<AppliedFilter[]>(() => {
    const labels: AppliedFilter[] = [];
    const query = searchParams.get('q');
    const city = searchParams.get('city');
    const type = searchParams.get('type');
    const minRent = searchParams.get('minRent');
    const maxRent = searchParams.get('maxRent');

    if (query) labels.push({ key: 'q', label: `Search: ${query}` });
    if (city) labels.push({ key: 'city', label: `City: ${city}` });
    if (type && isPropertyType(type)) {
      const match = PROPERTY_TYPES.find((candidate) => candidate.value === type);
      labels.push({ key: 'type', label: `Type: ${match?.label ?? type}` });
    }
    if (minRent) labels.push({ key: 'minRent', label: `From PHP ${minRent}` });
    if (maxRent) labels.push({ key: 'maxRent', label: `Up to PHP ${maxRent}` });

    return labels;
  }, [searchParams]);

  const applyFilters = useCallback(
    (next: Partial<Record<(typeof FILTER_PARAM_KEYS)[number], string>>) => {
      const params = new URLSearchParams(searchParams);

      FILTER_PARAM_KEYS.forEach((key) => {
        const value = next[key]?.trim();
        if (value) params.set(key, value);
        else params.delete(key);
      });

      setSearchParams(params);
    },
    [searchParams, setSearchParams],
  );

  const removeFilter = useCallback(
    (key: (typeof FILTER_PARAM_KEYS)[number]) => {
      const params = new URLSearchParams(searchParams);
      params.delete(key);
      setSearchParams(params);
    },
    [searchParams, setSearchParams],
  );

  const clearFilters = useCallback(() => {
    const params = new URLSearchParams(searchParams);
    FILTER_PARAM_KEYS.forEach((key) => params.delete(key));
    setSearchParams(params);
  }, [searchParams, setSearchParams]);

  const results = useQuery({
    queryKey: listingKeys.list(filters),
    queryFn: () => rentDitoRepository.listProperties(filters),
  });

  const total = useQuery({
    queryKey: listingKeys.list({}),
    queryFn: () => rentDitoRepository.listProperties({}),
  });

  return {
    filters,
    searchParams,
    hasFilters,
    appliedFilters,
    applyFilters,
    removeFilter,
    clearFilters,
    results,
    totalCount: total.data?.length ?? 0,
  };
}

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { rentDitoRepository } from '@/app/repositories';
import type { UnitStatus } from '@/entities/property/model';
import { listingKeys } from '@/features/listing-search/useListingSearch';

export interface UpdateUnitStatusInput {
  unitId: string;
  status: UnitStatus;
}

/**
 * Persists a unit status change and refreshes every listing view, so the
 * public marketplace and the landlord workspace never disagree.
 */
export function useUpdateUnitStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpdateUnitStatusInput) => rentDitoRepository.updateUnitStatus(input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: listingKeys.all });
    },
  });
}

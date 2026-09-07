import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Heart } from 'lucide-react';

import { rentDitoRepository } from '@/app/repositories';
import { listingKeys } from '@/features/listing-search/useListingSearch';
import { useOnlineStatus } from '@/shared/hooks/useOnlineStatus';
import { useToast } from '@/shared/ui/Toast/toastContext';

import styles from './SaveListingButton.module.css';

export interface SaveListingButtonProps {
  propertyId: string;
  propertyTitle: string;
  /** Compact form is used inside property cards. */
  variant?: 'card' | 'page';
}

export const SaveListingButton = ({
  propertyId,
  propertyTitle,
  variant = 'card',
}: SaveListingButtonProps) => {
  const queryClient = useQueryClient();
  const isOnline = useOnlineStatus();
  const { showToast } = useToast();

  const saved = useQuery({
    queryKey: listingKeys.saved,
    queryFn: () => rentDitoRepository.listSavedPropertyIds(),
  });

  const isSaved = saved.data?.includes(propertyId) ?? false;

  const toggle = useMutation({
    mutationFn: () => rentDitoRepository.toggleSaved(propertyId),
    onSuccess: async (nowSaved) => {
      await queryClient.invalidateQueries({ queryKey: listingKeys.saved });
      showToast({
        title: nowSaved ? 'Added to saved rentals' : 'Removed from saved rentals',
        description: propertyTitle,
      });
    },
  });

  const label = isSaved ? `Remove ${propertyTitle} from saved` : `Save ${propertyTitle}`;

  return (
    <button
      type="button"
      className={[styles.save, variant === 'page' ? styles.page : styles.card].join(' ')}
      onClick={() => toggle.mutate()}
      aria-pressed={isSaved}
      aria-label={label}
      title={!isOnline ? 'Saving needs a connection.' : undefined}
      disabled={saved.isPending || toggle.isPending || !isOnline}
      data-icon-button
    >
      <Heart className={styles.icon} aria-hidden="true" fill={isSaved ? 'currentColor' : 'none'} />
      {variant === 'page' ? <span>{isSaved ? 'Saved' : 'Save'}</span> : null}
    </button>
  );
};

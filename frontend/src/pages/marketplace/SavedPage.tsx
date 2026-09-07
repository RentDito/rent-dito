import { useQueries, useQuery } from '@tanstack/react-query';
import { Heart } from 'lucide-react';
import { Link } from 'react-router-dom';

import { rentDitoRepository } from '@/app/repositories';
import { PropertyCard } from '@/entities/property/PropertyCard';
import { listingKeys } from '@/features/listing-search/useListingSearch';
import { routes } from '@/shared/lib/routes';
import { EmptyState, SectionError } from '@/shared/ui/Feedback/Feedback';
import { Skeleton } from '@/shared/ui/Skeleton/Skeleton';

import styles from './marketplace.module.css';

const SavedPage = () => {
  const savedIds = useQuery({
    queryKey: listingKeys.saved,
    queryFn: () => rentDitoRepository.listSavedPropertyIds(),
  });

  const properties = useQueries({
    queries: (savedIds.data ?? []).map((id) => ({
      queryKey: listingKeys.detail(id),
      queryFn: () => rentDitoRepository.getProperty(id),
    })),
  });

  const isPending = savedIds.isPending || properties.some((result) => result.isPending);
  const homes = properties.flatMap((result) => (result.data ? [result.data] : []));

  return (
    <div className={styles.page}>
      <header className={styles.pageHeader}>
        <div>
          <h1>Saved rentals</h1>
          <p className={styles.pageContext}>
            Homes you saved on this device. Saving is stored locally in this prototype.
          </p>
        </div>
      </header>

      <section className={styles.results} aria-labelledby="saved-heading">
        <h2 className="visually-hidden" id="saved-heading">
          Saved rentals
        </h2>

        {savedIds.isError ? (
          <SectionError
            title="We could not load your saved rentals"
            onRetry={() => void savedIds.refetch()}
          />
        ) : null}

        {isPending && !savedIds.isError ? (
          <div className={styles.grid}>
            {Array.from({ length: 2 }, (_, index) => (
              <Skeleton key={index} lines={4} height="3rem" />
            ))}
          </div>
        ) : null}

        {!isPending && !savedIds.isError && homes.length === 0 ? (
          <EmptyState
            icon={<Heart />}
            title="No saved rentals yet"
            description="Tap the heart on any listing to keep it here for comparison."
            action={
              <Link to={routes.listings} data-navigation-link>
                Browse rentals
              </Link>
            }
          />
        ) : null}

        {!isPending && homes.length > 0 ? (
          <div className={styles.grid}>
            {homes.map((property) => (
              <PropertyCard key={property.id} property={property} />
            ))}
          </div>
        ) : null}
      </section>
    </div>
  );
};

export default SavedPage;

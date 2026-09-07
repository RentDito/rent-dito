import { SlidersHorizontal } from 'lucide-react';
import { useState } from 'react';

import { PropertyCard } from '@/entities/property/PropertyCard';
import { ListingFilters } from '@/features/listing-search/ListingFilters';
import { useListingSearch } from '@/features/listing-search/useListingSearch';
import { useIsCompact } from '@/shared/hooks/useMediaQuery';
import { Button } from '@/shared/ui/Button/Button';
import { Drawer } from '@/shared/ui/Drawer/Drawer';
import { EmptyState, SectionError } from '@/shared/ui/Feedback/Feedback';
import { Skeleton } from '@/shared/ui/Skeleton/Skeleton';

import styles from './marketplace.module.css';

const ListingsPage = () => {
  const {
    searchParams,
    hasFilters,
    appliedFilters,
    applyFilters,
    removeFilter,
    clearFilters,
    results,
    totalCount,
  } = useListingSearch();
  const isCompact = useIsCompact();
  const [filtersOpen, setFiltersOpen] = useState(false);

  const values = {
    q: searchParams.get('q') ?? '',
    city: searchParams.get('city') ?? '',
    type: searchParams.get('type') ?? '',
    minRent: searchParams.get('minRent') ?? '',
    maxRent: searchParams.get('maxRent') ?? '',
  };

  const filterForm = (
    <ListingFilters
      values={values}
      appliedFilters={appliedFilters}
      onApply={applyFilters}
      onRemove={removeFilter}
      onClear={clearFilters}
      hideHeading={isCompact}
      onApplied={() => setFiltersOpen(false)}
    />
  );

  return (
    <div className={styles.page}>
      <header className={styles.pageHeader}>
        <div>
          <h1>Browse rentals</h1>
          <p className={styles.pageContext}>
            Filter by location, property type, and monthly rent. Filters stay in the address bar, so
            you can share or bookmark a search.
          </p>
        </div>

        {isCompact ? (
          <Button
            variant="secondary"
            startIcon={<SlidersHorizontal />}
            onClick={() => setFiltersOpen(true)}
          >
            Filters
          </Button>
        ) : null}
      </header>

      <div className={styles.searchLayout}>
        {!isCompact ? <aside className={styles.filterRail}>{filterForm}</aside> : null}

        <section className={styles.results} aria-labelledby="results-heading">
          <h2 className="visually-hidden" id="results-heading">
            Search results
          </h2>

          {results.isPending ? (
            <div className={styles.grid}>
              {Array.from({ length: 6 }, (_, index) => (
                <Skeleton key={index} lines={4} height="3rem" />
              ))}
            </div>
          ) : null}

          {results.isError ? (
            <SectionError
              title="We could not load these rentals"
              onRetry={() => void results.refetch()}
            />
          ) : null}

          {results.data ? (
            <>
              <p className={styles.resultCount} role="status">
                Showing {results.data.length} of {totalCount} rentals
              </p>

              {results.data.length === 0 ? (
                <EmptyState
                  title={hasFilters ? 'No rentals match these filters' : 'No rentals listed yet'}
                  description={
                    hasFilters
                      ? 'Your filters are still applied. Widen the rent range or remove a filter to see more homes.'
                      : 'Listings will appear here once they are published.'
                  }
                  action={
                    hasFilters ? (
                      <Button variant="secondary" onClick={clearFilters}>
                        Show all rentals
                      </Button>
                    ) : null
                  }
                />
              ) : (
                <div className={styles.grid}>
                  {results.data.map((property) => (
                    <PropertyCard key={property.id} property={property} />
                  ))}
                </div>
              )}
            </>
          ) : null}
        </section>
      </div>

      {isCompact ? (
        <Drawer open={filtersOpen} title="Filters" onClose={() => setFiltersOpen(false)}>
          {filterForm}
        </Drawer>
      ) : null}
    </div>
  );
};

export default ListingsPage;

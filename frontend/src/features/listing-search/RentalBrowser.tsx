import { SlidersHorizontal } from 'lucide-react';
import { useState } from 'react';

import { PropertyCard } from '@/entities/property/PropertyCard';
import { useIsCompact } from '@/shared/hooks/useMediaQuery';
import { Button } from '@/shared/ui/Button/Button';
import { Dialog } from '@/shared/ui/Dialog/Dialog';
import { Drawer } from '@/shared/ui/Drawer/Drawer';
import { EmptyState, SectionError } from '@/shared/ui/Feedback/Feedback';
import { Skeleton } from '@/shared/ui/Skeleton/Skeleton';

import styles from '@/pages/marketplace/marketplace.module.css';

import { ListingFilters } from './ListingFilters';
import { useListingSearch } from './useListingSearch';

/** The complete marketplace discovery surface, embedded on the public home page. */
export const RentalBrowser = () => {
  const {
    formValues,
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

  const filterForm = (
    <ListingFilters
      values={formValues}
      appliedFilters={appliedFilters}
      onApply={applyFilters}
      onRemove={removeFilter}
      onClear={clearFilters}
      hideHeading
      onApplied={() => setFiltersOpen(false)}
    />
  );

  const filtersButton = (
    <Button
      variant="secondary"
      startIcon={<SlidersHorizontal />}
      onClick={() => setFiltersOpen(true)}
    >
      Filters
    </Button>
  );

  return (
    <section className={styles.section} id="rentals" aria-labelledby="browse-rentals-heading">
      <header className={styles.pageHeader}>
        <div>
          <h2 id="browse-rentals-heading">Browse rentals</h2>
          <p className={styles.pageContext}>
            Filter by location, property type, and monthly rent. Filters stay in the address bar, so
            you can share or bookmark a search.
          </p>
        </div>
      </header>

      <section className={styles.results} aria-labelledby="results-heading">
        <h3 className="visually-hidden" id="results-heading">
          Search results
        </h3>

        <div className={styles.resultsToolbar}>
          <p className={styles.resultCount} role="status">
            {results.data
              ? `Showing ${results.data.length} of ${totalCount} rentals`
              : results.isPending
                ? 'Loading rentals…'
                : '\u00a0'}
          </p>
          {filtersButton}
        </div>

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
          results.data.length === 0 ? (
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
          )
        ) : null}
      </section>

      {isCompact ? (
        <Drawer open={filtersOpen} title="Filters" onClose={() => setFiltersOpen(false)}>
          {filterForm}
        </Drawer>
      ) : (
        <Dialog open={filtersOpen} title="Filters" onClose={() => setFiltersOpen(false)}>
          {filterForm}
        </Dialog>
      )}
    </section>
  );
};

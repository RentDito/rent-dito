import { useQuery } from '@tanstack/react-query';
import { ShieldCheck, Wallet } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { rentDitoRepository } from '@/app/repositories';
import { PropertyCard } from '@/entities/property/PropertyCard';
import { listingKeys, PROPERTY_TYPES } from '@/features/listing-search/useListingSearch';
import { routes } from '@/shared/lib/routes';
import { Button } from '@/shared/ui/Button/Button';
import { SectionError } from '@/shared/ui/Feedback/Feedback';
import { Field } from '@/shared/ui/Field/Field';
import { Skeleton } from '@/shared/ui/Skeleton/Skeleton';

import styles from './marketplace.module.css';

const TRUST_POINTS = [
  {
    icon: ShieldCheck,
    title: 'Landlord details up front',
    body: 'Every listing states who manages it and whether their details have been checked.',
  },
  {
    icon: Wallet,
    title: 'Rent and deposits in plain pesos',
    body: 'Monthly rent, deposit, and availability are shown before you inquire — no hidden charges.',
  },
];

const HomePage = () => {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');

  const featured = useQuery({
    queryKey: listingKeys.list({}),
    queryFn: () => rentDitoRepository.listProperties({}),
  });

  const search = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const params = new URLSearchParams();
    if (query.trim()) params.set('q', query.trim());
    navigate(`${routes.listings}?${params.toString()}`);
  };

  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        <div className={styles.heroText}>
          <h1 className={styles.heroTitle}>Find a rental you can trust</h1>
          <p className={styles.heroBody}>
            Apartments, condominiums, houses, and bedspaces across the Philippines — with clear rent,
            clear terms, and one place to reach the landlord.
          </p>

          <form className={styles.heroSearch} onSubmit={search}>
            <Field label="Where do you want to live?" className={styles.heroField}>
              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="City, barangay, or property name"
              />
            </Field>
            <Button type="submit" size="large">
              Search rentals
            </Button>
          </form>

          <ul className={styles.chipList} aria-label="Browse by property type">
            {PROPERTY_TYPES.map((type) => (
              <li key={type.value}>
                <Link className={styles.chipLink} to={`${routes.listings}?type=${type.value}`}>
                  {type.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className={styles.trust} aria-labelledby="trust-heading">
        <h2 id="trust-heading">Why renters use RentDito</h2>
        <div className={styles.trustGrid}>
          {TRUST_POINTS.map(({ icon: Icon, title, body }) => (
            <div key={title} className={styles.trustCard}>
              <Icon className={styles.trustIcon} aria-hidden="true" />
              <h3 className={styles.trustTitle}>{title}</h3>
              <p className={styles.trustBody}>{body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className={styles.section} aria-labelledby="featured-heading">
        <div className={styles.sectionHeader}>
          <h2 id="featured-heading">Featured rentals</h2>
          <Link className={styles.sectionLink} to={routes.listings}>
            Browse all rentals
          </Link>
        </div>

        {featured.isPending ? (
          <div className={styles.grid}>
            {Array.from({ length: 3 }, (_, index) => (
              <Skeleton key={index} lines={4} height="3rem" />
            ))}
          </div>
        ) : null}

        {featured.isError ? (
          <SectionError
            title="We could not load featured rentals"
            onRetry={() => void featured.refetch()}
          />
        ) : null}

        {featured.data ? (
          <div className={styles.grid}>
            {featured.data.slice(0, 3).map((property) => (
              <PropertyCard key={property.id} property={property} />
            ))}
          </div>
        ) : null}
      </section>
    </div>
  );
};

export default HomePage;

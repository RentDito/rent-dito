import { ShieldCheck, Wallet } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { RentalBrowser } from '@/features/listing-search/RentalBrowser';
import { PROPERTY_TYPES } from '@/features/listing-search/useListingSearch';
import { routes } from '@/shared/lib/routes';
import { Button } from '@/shared/ui/Button/Button';
import { Field } from '@/shared/ui/Field/Field';

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

  const search = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const params = new URLSearchParams();
    if (query.trim()) params.set('q', query.trim());
    const searchParams = params.toString();
    navigate(`${routes.home}${searchParams ? `?${searchParams}` : ''}#rentals`);
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
                <Link
                  className={styles.chipLink}
                  to={`${routes.home}?type=${type.value}#rentals`}
                >
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

      <RentalBrowser />
    </div>
  );
};

export default HomePage;

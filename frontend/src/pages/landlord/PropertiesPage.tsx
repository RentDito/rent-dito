import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

import {
  UNIT_STATUS_LABELS,
  UNIT_STATUS_ORDER,
  UNIT_STATUS_TONES,
  type UnitStatus,
} from '@/entities/property/model';
import { usePortfolioSummary } from '@/features/portfolio/usePortfolioSummary';
import { formatCurrency } from '@/shared/lib/format';
import { routes } from '@/shared/lib/routes';
import { Card } from '@/shared/ui/Card/Card';
import { DataTable } from '@/shared/ui/DataTable/DataTable';
import { SectionError } from '@/shared/ui/Feedback/Feedback';
import { Field } from '@/shared/ui/Field/Field';
import { Skeleton } from '@/shared/ui/Skeleton/Skeleton';
import { StatusBadge } from '@/shared/ui/StatusBadge/StatusBadge';

import styles from './landlord.module.css';

const PropertiesPage = () => {
  const { isPending, error, refetch, properties } = usePortfolioSummary();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<UnitStatus | ''>('');

  const visible = useMemo(() => {
    const owned = properties ?? [];
    const needle = search.trim().toLocaleLowerCase('en-PH');

    return owned.filter((property) => {
      const matchesSearch =
        !needle ||
        [property.title, property.city, property.barangay]
          .join(' ')
          .toLocaleLowerCase('en-PH')
          .includes(needle);
      const matchesStatus =
        !statusFilter || property.units.some((unit) => unit.status === statusFilter);

      return matchesSearch && matchesStatus;
    });
  }, [properties, search, statusFilter]);

  const hasFilters = Boolean(search.trim() || statusFilter);

  return (
    <div className={styles.page}>
      <header className={styles.pageHeader}>
        <div>
          <h1>Properties</h1>
          <p className={styles.pageContext}>
            Every property you manage, with its units and their current status.
          </p>
        </div>
        <Link className={styles.primaryAction} to={routes.landlord.overview}>
          Back to overview
        </Link>
      </header>

      {error ? <SectionError title="We could not load your properties" onRetry={refetch} /> : null}

      {isPending && !error ? <Skeleton lines={5} height="2.5rem" /> : null}

      {properties ? (
        <Card padding="flush">
          <div className={styles.filterBar}>
            <Field label="Search properties" className={styles.filterField}>
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Property, city, or barangay"
              />
            </Field>

            <Field label="Unit status" className={styles.filterField}>
              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value as UnitStatus | '')}
              >
                <option value="">Any unit status</option>
                {UNIT_STATUS_ORDER.map((status) => (
                  <option key={status} value={status}>
                    {UNIT_STATUS_LABELS[status]}
                  </option>
                ))}
              </select>
            </Field>
          </div>

          <p className={styles.recordCount} role="status">
            Showing {visible.length} of {properties.length} properties
          </p>

          <DataTable
            caption="Properties you manage"
            rows={visible}
            rowKey={(property) => property.id}
            emptyMessage={
              hasFilters ? 'No properties match these filters' : 'You have no properties yet'
            }
            columns={[
              {
                key: 'title',
                header: 'Property',
                mobileLabel: 'Property',
                cell: (property) => (
                  <Link className={styles.tableLink} to={routes.landlord.propertyDetail(property.id)}>
                    {property.title}
                  </Link>
                ),
              },
              {
                key: 'location',
                header: 'Location',
                cell: (property) => `${property.barangay}, ${property.city}`,
              },
              {
                key: 'units',
                header: 'Units',
                mobileLabel: 'Unit count',
                cell: (property) => String(property.units.length),
              },
              {
                key: 'status',
                header: 'Unit status',
                cell: (property) => (
                  <span className={styles.badgeRow}>
                    {UNIT_STATUS_ORDER.filter((status) =>
                      property.units.some((unit) => unit.status === status),
                    ).map((status) => (
                      <StatusBadge key={status} tone={UNIT_STATUS_TONES[status]}>
                        {`${
                          property.units.filter((unit) => unit.status === status).length
                        } ${UNIT_STATUS_LABELS[status].toLocaleLowerCase('en-PH')}`}
                      </StatusBadge>
                    ))}
                  </span>
                ),
              },
              {
                key: 'rent',
                header: 'Monthly rent',
                align: 'end',
                cell: (property) =>
                  formatCurrency(
                    property.units.reduce((total, unit) => total + unit.monthlyRent, 0),
                  ),
              },
            ]}
          />
        </Card>
      ) : null}
    </div>
  );
};

export default PropertiesPage;

import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

import {
  TENANCY_STATUS_LABELS,
  TENANCY_STATUS_TONES,
  type TenancyStatus,
} from '@/entities/tenancy/model';
import { useLandlordRecords } from '@/features/portfolio/useLandlordRecords';
import { formatCurrency, formatDate } from '@/shared/lib/format';
import { routes } from '@/shared/lib/routes';
import { Card } from '@/shared/ui/Card/Card';
import { DataTable } from '@/shared/ui/DataTable/DataTable';
import { SectionError } from '@/shared/ui/Feedback/Feedback';
import { Field } from '@/shared/ui/Field/Field';
import { Skeleton } from '@/shared/ui/Skeleton/Skeleton';
import { StatusBadge } from '@/shared/ui/StatusBadge/StatusBadge';

import styles from './landlord.module.css';

const STATUS_ORDER: TenancyStatus[] = ['active', 'pending', 'ended'];

const TenantsPage = () => {
  const { isPending, error, refetch, records } = useLandlordRecords();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<TenancyStatus | ''>('');

  const visible = useMemo(() => {
    const tenancies = records?.tenancies ?? [];
    const needle = search.trim().toLocaleLowerCase('en-PH');

    return tenancies.filter((tenancy) => {
      const property = records?.propertyOf(tenancy);
      const matchesSearch =
        !needle ||
        [tenancy.tenantName, property?.title ?? '', records?.unitNameOf(tenancy) ?? '']
          .join(' ')
          .toLocaleLowerCase('en-PH')
          .includes(needle);
      const matchesStatus = !statusFilter || tenancy.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [records, search, statusFilter]);

  const hasFilters = Boolean(search.trim() || statusFilter);

  return (
    <div className={styles.page}>
      <header className={styles.pageHeader}>
        <div>
          <h1>Tenants</h1>
          <p className={styles.pageContext}>
            Everyone renting from you, with their unit, lease dates, and outstanding balance.
          </p>
        </div>
        <Link className={styles.primaryAction} to={routes.landlord.payments}>
          Go to payments
        </Link>
      </header>

      {error ? <SectionError title="We could not load your tenants" onRetry={refetch} /> : null}

      {isPending && !error ? <Skeleton lines={5} height="2.5rem" /> : null}

      {records ? (
        <Card padding="flush">
          <div className={styles.filterBar}>
            <Field label="Search tenants" className={styles.filterField}>
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Tenant, property, or unit"
              />
            </Field>

            <Field label="Tenancy status" className={styles.filterField}>
              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value as TenancyStatus | '')}
              >
                <option value="">Any status</option>
                {STATUS_ORDER.map((status) => (
                  <option key={status} value={status}>
                    {TENANCY_STATUS_LABELS[status]}
                  </option>
                ))}
              </select>
            </Field>
          </div>

          <p className={styles.recordCount} role="status">
            Showing {visible.length} of {records.tenancies.length} tenants
          </p>

          <DataTable
            caption="Tenants renting from you"
            rows={visible}
            rowKey={(tenancy) => tenancy.id}
            emptyMessage={
              hasFilters ? 'No tenants match these filters' : 'You have no tenants yet'
            }
            columns={[
              {
                key: 'tenant',
                header: 'Tenant',
                cell: (tenancy) => (
                  <Link className={styles.tableLink} to={routes.landlord.tenantDetail(tenancy.id)}>
                    {tenancy.tenantName}
                  </Link>
                ),
              },
              {
                key: 'rental',
                header: 'Rental',
                cell: (tenancy) =>
                  `${records.propertyOf(tenancy)?.title ?? 'Property'} · ${
                    records.unitNameOf(tenancy) ?? 'Unit'
                  }`,
              },
              {
                key: 'status',
                header: 'Status',
                mobileLabel: 'Tenancy status',
                cell: (tenancy) => (
                  <StatusBadge tone={TENANCY_STATUS_TONES[tenancy.status]}>
                    {TENANCY_STATUS_LABELS[tenancy.status]}
                  </StatusBadge>
                ),
              },
              {
                key: 'period',
                header: 'Lease period',
                cell: (tenancy) =>
                  `${formatDate(tenancy.startDate)} – ${formatDate(tenancy.endDate)}`,
              },
              {
                key: 'balance',
                header: 'Outstanding',
                align: 'end',
                cell: (tenancy) => formatCurrency(records.outstandingOf(tenancy.id)),
              },
            ]}
          />
        </Card>
      ) : null}
    </div>
  );
};

export default TenantsPage;

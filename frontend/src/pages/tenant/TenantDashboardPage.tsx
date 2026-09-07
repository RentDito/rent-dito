import { CalendarDays, Mail, Phone } from 'lucide-react';
import { Link } from 'react-router-dom';

import { PaymentStatusBadge } from '@/entities/payment/PaymentStatusBadge';
import { remainingOn } from '@/entities/payment/model';
import { getDueStatus } from '@/entities/payment/status';
import { useTenantRecords } from '@/features/tenancy/useTenantRecords';
import {
  formatCurrency,
  formatDate,
  formatDateTime,
  PAYMENT_METHOD_LABELS,
} from '@/shared/lib/format';
import { routes } from '@/shared/lib/routes';
import { Card } from '@/shared/ui/Card/Card';
import { EmptyState, SectionError } from '@/shared/ui/Feedback/Feedback';
import { Skeleton } from '@/shared/ui/Skeleton/Skeleton';

import styles from './tenant.module.css';

const TenantDashboardPage = () => {
  const { isPending, error, refetch, records } = useTenantRecords();

  if (error) {
    return <SectionError title="We could not load your rental" onRetry={refetch} />;
  }

  if (isPending || !records) {
    return (
      <div className={styles.page}>
        <Skeleton lines={2} height="2rem" />
        <Skeleton lines={4} height="3rem" />
      </div>
    );
  }

  if (!records.tenancy) {
    return (
      <EmptyState
        headingLevel={2}
        title="You have no active rental"
        description="Browse listings and send an inquiry to get started."
        action={
          <Link to={routes.listings} data-navigation-link>
            Browse rentals
          </Link>
        }
      />
    );
  }

  const { tenancy, property, unit, nextDue, payments, outstanding } = records;

  return (
    <div className={styles.page}>
      <header className={styles.pageHeader}>
        <div>
          <h1>Your rental at a glance</h1>
          <p className={styles.pageContext}>
            {property?.title ?? 'Your rental'}
            {unit ? ` · ${unit.name}` : ''}
          </p>
        </div>
      </header>

      {/* The next required action comes first, before any other detail. */}
      <section className={styles.nextDue} aria-labelledby="next-due-heading">
        <h2 className={styles.nextDueHeading} id="next-due-heading">
          Next payment due
        </h2>

        {nextDue ? (
          <>
            <p className={styles.nextDueAmount}>{formatCurrency(remainingOn(nextDue))}</p>
            <p className={styles.nextDueMeta}>
              <CalendarDays className={styles.metaIcon} aria-hidden="true" />
              <span>{formatDate(nextDue.dueDate)}</span>
              <PaymentStatusBadge status={getDueStatus(nextDue)} />
            </p>
            <p className={styles.nextDueLabel}>{nextDue.label}</p>
            <div className={styles.nextDueActions}>
              <Link className={styles.primaryAction} to={routes.tenant.payDue(nextDue.id)}>
                Pay this due
              </Link>
              <Link className={styles.secondaryAction} to={routes.tenant.payments}>
                See all dues
              </Link>
            </div>
            {outstanding > remainingOn(nextDue) ? (
              <p className={styles.nextDueMeta}>
                {formatCurrency(outstanding)} outstanding in total across your dues.
              </p>
            ) : null}
          </>
        ) : (
          <>
            <p className={styles.nextDueAmount}>{formatCurrency(0)}</p>
            <p className={styles.nextDueMeta}>You are fully paid up. Nothing is due right now.</p>
          </>
        )}
      </section>

      <Card
        title="Current rental"
        actions={
          <Link className={styles.cardLink} to={routes.tenant.rental}>
            Rental details
          </Link>
        }
      >
        <dl className={styles.facts}>
          <div>
            <dt>Address</dt>
            <dd>
              {property ? `${property.address}, ${property.barangay}, ${property.city}` : '—'}
            </dd>
          </div>
          <div>
            <dt>Unit</dt>
            <dd>{unit?.name ?? '—'}</dd>
          </div>
          <div>
            <dt>Monthly rent</dt>
            <dd>{formatCurrency(tenancy.monthlyRent)}</dd>
          </div>
          <div>
            <dt>Lease ends</dt>
            <dd>{formatDate(tenancy.endDate)}</dd>
          </div>
        </dl>
      </Card>

      <Card
        title="Recent payments"
        actions={
          <Link className={styles.cardLink} to={routes.tenant.payments}>
            Payment history
          </Link>
        }
      >
        {payments.length === 0 ? (
          <EmptyState
            title="No payments yet"
            description="Your payments will appear here once recorded."
          />
        ) : (
          <ul className={styles.recentList}>
            {payments.slice(0, 3).map((payment) => (
              <li key={payment.id} className={styles.recentRow}>
                <div>
                  <p className={styles.recentTitle}>
                    {records.dueById(payment.dueId)?.label ?? 'Earlier period'}
                  </p>
                  <p className={styles.recentMeta}>
                    {formatDateTime(payment.recordedAt)} · {PAYMENT_METHOD_LABELS[payment.method]}
                  </p>
                </div>
                <div className={styles.recentAside}>
                  <p className={styles.recentAmount}>{formatCurrency(payment.amount)}</p>
                  <Link className={styles.cardLink} to={routes.tenant.receipt(payment.id)}>
                    View receipt
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card
        title="Landlord contact"
        actions={
          <Link className={styles.cardLink} to={routes.tenant.inquiries}>
            Your messages
          </Link>
        }
      >
        <p className={styles.landlordName}>{property?.landlordName ?? 'Your landlord'}</p>
        {property ? (
          <ul className={styles.contact}>
            <li>
              <Mail className={styles.metaIcon} aria-hidden="true" />
              <a href={`mailto:${property.landlordEmail}`}>{property.landlordEmail}</a>
            </li>
            <li>
              <Phone className={styles.metaIcon} aria-hidden="true" />
              <a href={`tel:${property.landlordPhone.replace(/\s/g, '')}`}>
                {property.landlordPhone}
              </a>
            </li>
          </ul>
        ) : null}
      </Card>
    </div>
  );
};

export default TenantDashboardPage;

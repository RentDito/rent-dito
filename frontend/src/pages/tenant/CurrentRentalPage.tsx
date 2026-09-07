import { Mail, Phone } from 'lucide-react';
import { Link } from 'react-router-dom';

import { UNIT_STATUS_LABELS, UNIT_STATUS_TONES } from '@/entities/property/model';
import { useTenantRecords } from '@/features/tenancy/useTenantRecords';
import { formatCurrency, formatDate } from '@/shared/lib/format';
import { routes } from '@/shared/lib/routes';
import { Card } from '@/shared/ui/Card/Card';
import { EmptyState, SectionError } from '@/shared/ui/Feedback/Feedback';
import { Skeleton } from '@/shared/ui/Skeleton/Skeleton';
import { StatusBadge } from '@/shared/ui/StatusBadge/StatusBadge';

import styles from './tenant.module.css';

const CurrentRentalPage = () => {
  const { isPending, error, refetch, records } = useTenantRecords();

  if (error) {
    return <SectionError title="We could not load your rental details" onRetry={refetch} />;
  }

  if (isPending || !records) {
    return (
      <div className={styles.page}>
        <Skeleton lines={2} height="2rem" />
        <Skeleton lines={4} height="3rem" />
      </div>
    );
  }

  const { tenancy, property, unit } = records;

  if (!tenancy) {
    return (
      <EmptyState
        headingLevel={2}
        title="You have no active rental"
        description="Once a landlord starts your tenancy, its details appear here."
        action={
          <Link to={routes.listings} data-navigation-link>
            Browse rentals
          </Link>
        }
      />
    );
  }

  return (
    <div className={styles.page}>
      <header className={styles.pageHeader}>
        <div>
          <h1>My rental</h1>
          <p className={styles.pageContext}>
            The home you are renting, your lease terms, and how to reach your landlord.
          </p>
        </div>
        {property ? (
          <Link className={styles.primaryAction} to={routes.listingDetail(property.id)}>
            View public listing
          </Link>
        ) : null}
      </header>

      <Card title="Where you live">
        <p className={styles.rentalTitle}>{property?.title ?? 'Your rental'}</p>
        <p className={styles.rentalAddress}>
          {property
            ? `${property.address}, ${property.barangay}, ${property.city}, ${property.province}`
            : 'Address unavailable'}
        </p>

        <dl className={styles.facts}>
          <div>
            <dt>Unit</dt>
            <dd>{unit?.name ?? '—'}</dd>
          </div>
          <div>
            <dt>Unit status</dt>
            <dd>
              {unit ? (
                <StatusBadge tone={UNIT_STATUS_TONES[unit.status]}>
                  {UNIT_STATUS_LABELS[unit.status]}
                </StatusBadge>
              ) : (
                '—'
              )}
            </dd>
          </div>
          <div>
            <dt>Bedrooms</dt>
            <dd>{unit?.bedrooms ?? '—'}</dd>
          </div>
          <div>
            <dt>Bathrooms</dt>
            <dd>{unit?.bathrooms ?? '—'}</dd>
          </div>
          <div>
            <dt>Floor area</dt>
            <dd>{unit ? `${unit.floorAreaSqm} sqm` : '—'}</dd>
          </div>
          <div>
            <dt>Deposit held</dt>
            <dd>{unit ? formatCurrency(unit.deposit) : '—'}</dd>
          </div>
        </dl>
      </Card>

      <Card title="Lease and payment schedule">
        <dl className={styles.facts}>
          <div>
            <dt>Lease period</dt>
            <dd>
              {formatDate(tenancy.startDate)} – {formatDate(tenancy.endDate)}
            </dd>
          </div>
          <div>
            <dt>Monthly rent</dt>
            <dd>{formatCurrency(tenancy.monthlyRent)}</dd>
          </div>
          <div>
            <dt>Rent due each month</dt>
            <dd>Day {tenancy.paymentDueDay}</dd>
          </div>
          <div>
            <dt>Outstanding balance</dt>
            <dd>{formatCurrency(records.outstanding)}</dd>
          </div>
        </dl>
      </Card>

      {property ? (
        <>
          <Card title="Amenities and house rules">
            <ul className={styles.tagList}>
              {property.amenities.map((amenity) => (
                <li key={amenity} className={styles.tag}>
                  {amenity}
                </li>
              ))}
            </ul>
            <ul className={styles.ruleList}>
              {property.houseRules.map((rule) => (
                <li key={rule}>{rule}</li>
              ))}
            </ul>
          </Card>

          <Card
            title="Landlord contact"
            actions={
              <Link className={styles.cardLink} to={routes.tenant.inquiries}>
                Message your landlord
              </Link>
            }
          >
            <p className={styles.landlordName}>{property.landlordName}</p>
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
          </Card>
        </>
      ) : null}
    </div>
  );
};

export default CurrentRentalPage;

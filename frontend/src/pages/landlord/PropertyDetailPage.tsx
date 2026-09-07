import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';

import { rentDitoRepository } from '@/app/repositories';
import {
  UNIT_STATUS_LABELS,
  UNIT_STATUS_TONES,
  type Unit,
} from '@/entities/property/model';
import { listingKeys } from '@/features/listing-search/useListingSearch';
import { UnitStatusForm } from '@/features/unit-status/UnitStatusForm';
import { formatCurrency, formatDate } from '@/shared/lib/format';
import { routes } from '@/shared/lib/routes';
import { Button } from '@/shared/ui/Button/Button';
import { Card } from '@/shared/ui/Card/Card';
import { Dialog } from '@/shared/ui/Dialog/Dialog';
import { EmptyState, SectionError } from '@/shared/ui/Feedback/Feedback';
import { Skeleton } from '@/shared/ui/Skeleton/Skeleton';
import { StatusBadge } from '@/shared/ui/StatusBadge/StatusBadge';

import styles from './landlord.module.css';

const PropertyDetailPage = () => {
  const { propertyId = '' } = useParams();
  const [editingUnitId, setEditingUnitId] = useState<string | null>(null);

  const property = useQuery({
    queryKey: listingKeys.detail(propertyId),
    queryFn: () => rentDitoRepository.getProperty(propertyId),
    enabled: Boolean(propertyId),
  });

  if (property.isPending) {
    return (
      <div className={styles.page}>
        <Skeleton lines={2} height="2rem" />
        <Skeleton lines={4} height="3rem" />
      </div>
    );
  }

  if (property.isError) {
    return (
      <SectionError title="We could not load this property" onRetry={() => void property.refetch()} />
    );
  }

  if (!property.data) {
    return (
      <EmptyState
        headingLevel={2}
        title="That property is not in your portfolio"
        description="It may have been removed from the prototype data."
        action={
          <Link to={routes.landlord.properties} data-navigation-link>
            Back to properties
          </Link>
        }
      />
    );
  }

  const home = property.data;
  const editingUnit: Unit | undefined = home.units.find((unit) => unit.id === editingUnitId);

  return (
    <div className={styles.page}>
      <nav className={styles.breadcrumbs} aria-label="Breadcrumb">
        <Link to={routes.landlord.properties}>Properties</Link>
        <span aria-hidden="true"> / </span>
        <span aria-current="page">{home.title}</span>
      </nav>

      <header className={styles.pageHeader}>
        <div>
          <h1>Property details</h1>
          <p className={styles.pageContext}>
            {home.title} · {home.address}, {home.barangay}, {home.city}
          </p>
        </div>
        <Link className={styles.primaryAction} to={routes.listingDetail(home.id)}>
          View public listing
        </Link>
      </header>

      <div className={styles.detailGrid}>
        <Card title="Property facts">
          <dl className={styles.factList}>
            <div>
              <dt>Units</dt>
              <dd>{home.units.length}</dd>
            </div>
            <div>
              <dt>Available from</dt>
              <dd>{formatDate(home.availableFrom)}</dd>
            </div>
            <div>
              <dt>Listed since</dt>
              <dd>{formatDate(home.createdAt)}</dd>
            </div>
            <div>
              <dt>Combined monthly rent</dt>
              <dd>
                {formatCurrency(home.units.reduce((total, unit) => total + unit.monthlyRent, 0))}
              </dd>
            </div>
          </dl>
        </Card>

        <Card title="Amenities and rules">
          <ul className={styles.tagList}>
            {home.amenities.map((amenity) => (
              <li key={amenity} className={styles.tag}>
                {amenity}
              </li>
            ))}
          </ul>
          <ul className={styles.ruleList}>
            {home.houseRules.map((rule) => (
              <li key={rule}>{rule}</li>
            ))}
          </ul>
        </Card>
      </div>

      <Card
        title="Units"
        description="Change a unit's status here so the public listing and your occupancy stay accurate."
      >
        <ul className={styles.unitList}>
          {home.units.map((unit) => (
            <li key={unit.id} className={styles.unitRow} aria-label={unit.name}>
              <div>
                <p className={styles.unitName}>{unit.name}</p>
                <p className={styles.unitMeta}>
                  {unit.bedrooms} bedroom{unit.bedrooms === 1 ? '' : 's'} · {unit.bathrooms} bathroom
                  {unit.bathrooms === 1 ? '' : 's'} · {unit.floorAreaSqm} sqm
                </p>
                <p className={styles.unitMeta}>
                  {formatCurrency(unit.monthlyRent)} per month · deposit{' '}
                  {formatCurrency(unit.deposit)}
                </p>
              </div>

              <div className={styles.unitAside}>
                <StatusBadge tone={UNIT_STATUS_TONES[unit.status]}>
                  {UNIT_STATUS_LABELS[unit.status]}
                </StatusBadge>
                <Button variant="secondary" onClick={() => setEditingUnitId(unit.id)}>
                  {`Change status for ${unit.name}`}
                </Button>
              </div>
            </li>
          ))}
        </ul>
      </Card>

      <Dialog
        open={Boolean(editingUnit)}
        title="Change unit status"
        onClose={() => setEditingUnitId(null)}
      >
        {editingUnit ? (
          <UnitStatusForm
            unit={editingUnit}
            propertyTitle={home.title}
            onDone={() => setEditingUnitId(null)}
            onCancel={() => setEditingUnitId(null)}
          />
        ) : null}
      </Dialog>
    </div>
  );
};

export default PropertyDetailPage;

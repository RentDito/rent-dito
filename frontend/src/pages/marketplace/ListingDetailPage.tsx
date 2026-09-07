import { useQuery } from '@tanstack/react-query';
import { CalendarDays, MapPin, ShieldCheck } from 'lucide-react';
import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';

import { rentDitoRepository } from '@/app/repositories';
import {
  availableUnits,
  startingRent,
  UNIT_STATUS_LABELS,
  UNIT_STATUS_TONES,
} from '@/entities/property/model';
import { InquiryForm } from '@/features/inquiry/InquiryForm';
import { listingKeys } from '@/features/listing-search/useListingSearch';
import { SaveListingButton } from '@/features/saved-listings/SaveListingButton';
import { formatCurrency, formatDate } from '@/shared/lib/format';
import { routes } from '@/shared/lib/routes';
import { Button } from '@/shared/ui/Button/Button';
import { Card } from '@/shared/ui/Card/Card';
import { Dialog } from '@/shared/ui/Dialog/Dialog';
import { EmptyState, InlineAlert, SectionError } from '@/shared/ui/Feedback/Feedback';
import { Skeleton } from '@/shared/ui/Skeleton/Skeleton';
import { StatusBadge } from '@/shared/ui/StatusBadge/StatusBadge';

import styles from './marketplace.module.css';

const TYPE_LABELS = {
  apartment: 'Apartment',
  condominium: 'Condominium',
  house: 'House',
  bedspace: 'Bedspace',
} as const;

const ListingDetailPage = () => {
  const { propertyId = '' } = useParams();
  const [inquiryOpen, setInquiryOpen] = useState(false);
  const [inquirySent, setInquirySent] = useState(false);

  const property = useQuery({
    queryKey: listingKeys.detail(propertyId),
    queryFn: () => rentDitoRepository.getProperty(propertyId),
    enabled: Boolean(propertyId),
  });

  if (property.isPending) {
    return (
      <div className={styles.page}>
        <Skeleton lines={2} height="2rem" />
        <Skeleton height="20rem" radius="1rem" />
        <Skeleton lines={5} />
      </div>
    );
  }

  if (property.isError) {
    return (
      <SectionError
        title="We could not load this property"
        onRetry={() => void property.refetch()}
      />
    );
  }

  if (!property.data) {
    return (
      <EmptyState
        headingLevel={2}
        title="This listing is no longer available"
        description="It may have been removed from the prototype data."
        action={
          <Link to={routes.listings} data-navigation-link>
            Browse other rentals
          </Link>
        }
      />
    );
  }

  const home = property.data;
  const vacancies = availableUnits(home);

  return (
    <div className={styles.page}>
      <nav className={styles.breadcrumbs} aria-label="Breadcrumb">
        <Link to={routes.listings}>Browse rentals</Link>
        <span aria-hidden="true"> / </span>
        <span aria-current="page">{home.title}</span>
      </nav>

      <div className={styles.gallery}>
        {home.imageUrls.map((url, index) => (
          <img
            key={url}
            className={index === 0 ? styles.galleryLead : styles.galleryThumb}
            src={url}
            alt={
              index === 0
                ? `Illustration of ${home.title} in ${home.city}`
                : `Additional view of ${home.title}`
            }
            width={1200}
            height={900}
          />
        ))}
      </div>

      <div className={styles.detailLayout}>
        <div className={styles.detailMain}>
          <header className={styles.detailHeader}>
            <div className={styles.badges}>
              <StatusBadge tone="brand">{TYPE_LABELS[home.type]}</StatusBadge>
              {home.landlordVerified ? (
                <StatusBadge tone="success" icon={<ShieldCheck />}>
                  Verified landlord
                </StatusBadge>
              ) : (
                <StatusBadge tone="neutral">Verification pending</StatusBadge>
              )}
              <StatusBadge tone={vacancies.length > 0 ? 'success' : 'warning'}>
                {vacancies.length > 0
                  ? `${vacancies.length} unit${vacancies.length === 1 ? '' : 's'} available`
                  : 'Fully occupied'}
              </StatusBadge>
            </div>

            <h1>{home.title}</h1>

            <p className={styles.detailLocation}>
              <MapPin className={styles.metaIcon} aria-hidden="true" />
              {home.address}, {home.barangay}, {home.city}, {home.province}
            </p>

            <p className={styles.detailRent}>
              From {formatCurrency(startingRent(home))}
              <span className={styles.rentPeriod}> per month</span>
            </p>

            <p className={styles.detailAvailability}>
              <CalendarDays className={styles.metaIcon} aria-hidden="true" />
              Available from {formatDate(home.availableFrom)}
            </p>
          </header>

          <Card title="About this property">
            <p>{home.description}</p>
          </Card>

          <Card title="Units and monthly rent">
            <ul className={styles.unitList}>
              {home.units.map((unit) => (
                <li key={unit.id} className={styles.unitRow}>
                  <div>
                    <p className={styles.unitName}>{unit.name}</p>
                    <p className={styles.unitMeta}>
                      {unit.bedrooms} bedroom{unit.bedrooms === 1 ? '' : 's'} ·{' '}
                      {unit.bathrooms} bathroom{unit.bathrooms === 1 ? '' : 's'} ·{' '}
                      {unit.floorAreaSqm} sqm
                    </p>
                    <p className={styles.unitMeta}>
                      Deposit {formatCurrency(unit.deposit)}
                    </p>
                  </div>
                  <div className={styles.unitAside}>
                    <p className={styles.unitRent}>{formatCurrency(unit.monthlyRent)}</p>
                    <StatusBadge tone={UNIT_STATUS_TONES[unit.status]}>
                      {UNIT_STATUS_LABELS[unit.status]}
                    </StatusBadge>
                  </div>
                </li>
              ))}
            </ul>
          </Card>

          <Card title="Amenities">
            <ul className={styles.tagList}>
              {home.amenities.map((amenity) => (
                <li key={amenity} className={styles.tag}>
                  {amenity}
                </li>
              ))}
            </ul>
          </Card>

          <Card title="House rules">
            <ul className={styles.ruleList}>
              {home.houseRules.map((rule) => (
                <li key={rule}>{rule}</li>
              ))}
            </ul>
          </Card>
        </div>

        <aside className={styles.detailAside}>
          <Card title="Contact the landlord">
            <p className={styles.landlordName}>{home.landlordName}</p>
            <p className={styles.landlordMeta}>
              {home.landlordVerified
                ? 'Contact details checked by RentDito.'
                : 'Verification is still pending for this landlord.'}
            </p>

            {inquirySent ? (
              <InlineAlert tone="success" title="Inquiry saved in this prototype">
                Your message is stored on this device. In a live version the landlord would receive
                it and reply here.
              </InlineAlert>
            ) : null}

            <div className={styles.asideActions}>
              <Button size="large" block onClick={() => setInquiryOpen(true)}>
                Inquire about this property
              </Button>
              <SaveListingButton
                propertyId={home.id}
                propertyTitle={home.title}
                variant="page"
              />
            </div>
          </Card>
        </aside>
      </div>

      <Dialog
        open={inquiryOpen}
        title={`Inquire about ${home.title}`}
        onClose={() => setInquiryOpen(false)}
      >
        <InquiryForm
          propertyId={home.id}
          propertyTitle={home.title}
          contextLine={`${home.title} · ${home.barangay}, ${home.city} · from ${formatCurrency(
            startingRent(home),
          )} per month`}
          onSent={() => {
            setInquiryOpen(false);
            setInquirySent(true);
          }}
          onCancel={() => setInquiryOpen(false)}
        />
      </Dialog>
    </div>
  );
};

export default ListingDetailPage;

import { BedDouble, MapPin, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';

import {
  availableUnits,
  bedroomRange,
  startingRent,
  type Property,
} from '@/entities/property/model';
import { SaveListingButton } from '@/features/saved-listings/SaveListingButton';
import { formatCurrency, formatDate } from '@/shared/lib/format';
import { routes } from '@/shared/lib/routes';
import { StatusBadge } from '@/shared/ui/StatusBadge/StatusBadge';

import styles from './PropertyCard.module.css';

const TYPE_LABELS = {
  apartment: 'Apartment',
  condominium: 'Condominium',
  house: 'House',
  bedspace: 'Bedspace',
} as const;

export interface PropertyCardProps {
  property: Property;
  /** Heading level so the card fits the surrounding page outline. */
  headingLevel?: 2 | 3;
}

export const PropertyCard = ({ property, headingLevel = 3 }: PropertyCardProps) => {
  const Heading = headingLevel === 2 ? 'h2' : 'h3';
  const vacancies = availableUnits(property).length;

  return (
    <article className={styles.card}>
      <div className={styles.media}>
        <img
          className={styles.image}
          src={property.imageUrls[0]}
          alt={`Illustration of ${property.title} in ${property.city}`}
          loading="lazy"
          width={1200}
          height={900}
        />
        <SaveListingButton propertyId={property.id} propertyTitle={property.title} />
      </div>

      <div className={styles.body}>
        <div className={styles.badges}>
          <StatusBadge tone="brand">{TYPE_LABELS[property.type]}</StatusBadge>
          {property.landlordVerified ? (
            <StatusBadge tone="success" icon={<ShieldCheck />}>
              Verified landlord
            </StatusBadge>
          ) : (
            <StatusBadge tone="neutral">Verification pending</StatusBadge>
          )}
        </div>

        <Heading className={styles.title}>{property.title}</Heading>

        <p className={styles.location}>
          <MapPin className={styles.metaIcon} aria-hidden="true" />
          {property.barangay}, {property.city}
        </p>

        <p className={styles.rent}>
          {formatCurrency(startingRent(property))}
          <span className={styles.rentPeriod}> per month</span>
        </p>

        <p className={styles.meta}>
          <BedDouble className={styles.metaIcon} aria-hidden="true" />
          {bedroomRange(property)} bedroom{bedroomRange(property) === '1' ? '' : 's'}
          <span aria-hidden="true"> · </span>
          {vacancies > 0
            ? `${vacancies} unit${vacancies === 1 ? '' : 's'} available`
            : 'Fully occupied'}
        </p>

        <p className={styles.availability}>
          Available from {formatDate(property.availableFrom)}
        </p>

        <Link className={styles.link} to={routes.listingDetail(property.id)}>
          View {property.title} details
        </Link>
      </div>
    </article>
  );
};

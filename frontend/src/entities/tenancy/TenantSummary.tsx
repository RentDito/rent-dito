import { Mail, Phone } from 'lucide-react';

import {
  TENANCY_STATUS_LABELS,
  TENANCY_STATUS_TONES,
  type Tenancy,
} from '@/entities/tenancy/model';
import { formatCurrency, formatDate } from '@/shared/lib/format';
import { StatusBadge } from '@/shared/ui/StatusBadge/StatusBadge';

import styles from './TenantSummary.module.css';

export interface TenantSummaryProps {
  tenancy: Tenancy;
  propertyTitle?: string;
  unitName?: string;
}

/** The tenant facts a landlord needs before acting: who, where, when, how much. */
export const TenantSummary = ({ tenancy, propertyTitle, unitName }: TenantSummaryProps) => (
  <div className={styles.summary}>
    <div className={styles.identity}>
      <p className={styles.name}>{tenancy.tenantName}</p>
      <StatusBadge tone={TENANCY_STATUS_TONES[tenancy.status]}>
        {TENANCY_STATUS_LABELS[tenancy.status]}
      </StatusBadge>
    </div>

    <dl className={styles.facts}>
      <div>
        <dt>Rental</dt>
        <dd>
          {propertyTitle ?? 'Property'}
          {unitName ? ` · ${unitName}` : ''}
        </dd>
      </div>
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
    </dl>

    <ul className={styles.contact}>
      <li>
        <Mail className={styles.contactIcon} aria-hidden="true" />
        <a href={`mailto:${tenancy.tenantEmail}`}>{tenancy.tenantEmail}</a>
      </li>
      <li>
        <Phone className={styles.contactIcon} aria-hidden="true" />
        <a href={`tel:${tenancy.tenantPhone.replace(/\s/g, '')}`}>{tenancy.tenantPhone}</a>
      </li>
    </ul>
  </div>
);

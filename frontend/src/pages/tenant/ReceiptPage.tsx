import { CheckCircle2 } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';

import { paymentReference } from '@/entities/payment/model';
import { useTenantRecords } from '@/features/tenancy/useTenantRecords';
import { DEMO_PAYMENT_METHODS } from '@/features/payment/payNowSchema';
import { formatCurrency, formatDateTime, PAYMENT_METHOD_LABELS } from '@/shared/lib/format';
import { routes } from '@/shared/lib/routes';
import { Card } from '@/shared/ui/Card/Card';
import { EmptyState, InlineAlert, SectionError } from '@/shared/ui/Feedback/Feedback';
import { Skeleton } from '@/shared/ui/Skeleton/Skeleton';
import { StatusBadge } from '@/shared/ui/StatusBadge/StatusBadge';

import styles from './tenant.module.css';

const ReceiptPage = () => {
  const { paymentId = '' } = useParams();
  const { isPending, error, refetch, records } = useTenantRecords();

  if (error) {
    return <SectionError title="We could not load this receipt" onRetry={refetch} />;
  }

  if (isPending || !records) {
    return (
      <div className={styles.page}>
        <Skeleton lines={2} height="2rem" />
        <Skeleton lines={4} height="3rem" />
      </div>
    );
  }

  const payment = records.payments.find((candidate) => candidate.id === paymentId);

  if (!payment) {
    return (
      <EmptyState
        headingLevel={2}
        title="That receipt is not available"
        description="It may have been removed when the prototype data was reset."
        action={
          <Link to={routes.tenant.payments} data-navigation-link>
            Back to payments
          </Link>
        }
      />
    );
  }

  const due = records.dueById(payment.dueId);
  const demoMethod = DEMO_PAYMENT_METHODS.find((option) => option.value === payment.method);

  return (
    <div className={styles.page}>
      <nav className={styles.breadcrumbs} aria-label="Breadcrumb">
        <Link to={routes.tenant.payments}>Payments</Link>
        <span aria-hidden="true"> / </span>
        <span aria-current="page">Receipt</span>
      </nav>

      <header className={styles.receiptHeader}>
        <CheckCircle2 className={styles.receiptIcon} aria-hidden="true" />
        <div>
          <h1>Payment receipt</h1>
          <p className={styles.pageContext}>
            Keep this reference. It stays available in this prototype until the demo data is reset.
          </p>
        </div>
      </header>

      <Card title="Receipt details">
        <dl className={styles.facts}>
          <div>
            <dt>Reference</dt>
            <dd className={styles.reference}>{paymentReference(payment)}</dd>
          </div>
          <div>
            <dt>Status</dt>
            <dd>
              <StatusBadge tone="success">Recorded in this prototype</StatusBadge>
            </dd>
          </div>
          <div>
            <dt>Amount paid</dt>
            <dd className={styles.receiptAmount}>{formatCurrency(payment.amount)}</dd>
          </div>
          <div>
            <dt>Method</dt>
            <dd>{demoMethod?.label ?? PAYMENT_METHOD_LABELS[payment.method]}</dd>
          </div>
          <div>
            <dt>Recorded</dt>
            <dd>{formatDateTime(payment.recordedAt)} (Manila time)</dd>
          </div>
          <div>
            <dt>Billing period</dt>
            <dd>{due?.label ?? 'Earlier period'}</dd>
          </div>
          <div>
            <dt>Rental</dt>
            <dd>
              {records.property?.title ?? 'Your rental'}
              {records.unit ? ` · ${records.unit.name}` : ''}
            </dd>
          </div>
          <div>
            <dt>Recorded by</dt>
            <dd>{payment.source === 'tenant' ? 'You' : 'Your landlord'}</dd>
          </div>
        </dl>
      </Card>

      <InlineAlert tone="info" title="This is a simulated receipt">
        No money moved and no payment provider was contacted. In a live version this receipt would
        confirm a real transaction.
      </InlineAlert>

      <div className={styles.receiptActions}>
        <Link className={styles.primaryAction} to={routes.tenant.payments}>
          Back to payments
        </Link>
        <Link className={styles.secondaryAction} to={routes.tenant.overview}>
          Go to overview
        </Link>
      </div>
    </div>
  );
};

export default ReceiptPage;

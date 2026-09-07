import { Link, useParams } from 'react-router-dom';

import { remainingOn } from '@/entities/payment/model';
import { PayNowFlow } from '@/features/payment/PayNowFlow';
import { useTenantRecords } from '@/features/tenancy/useTenantRecords';
import { routes } from '@/shared/lib/routes';
import { EmptyState, InlineAlert, SectionError } from '@/shared/ui/Feedback/Feedback';
import { Skeleton } from '@/shared/ui/Skeleton/Skeleton';

import styles from './tenant.module.css';

const PayDuePage = () => {
  const { dueId = '' } = useParams();
  const { isPending, error, refetch, records } = useTenantRecords();

  if (error) {
    return <SectionError title="We could not open this payment" onRetry={refetch} />;
  }

  if (isPending || !records) {
    return (
      <div className={styles.page}>
        <Skeleton lines={2} height="2rem" />
        <Skeleton lines={5} height="2.5rem" />
      </div>
    );
  }

  const due = records.dueById(dueId);

  if (!due || !records.tenancy) {
    return (
      <EmptyState
        headingLevel={2}
        title="That due is not on your rental"
        description="It may have been removed from the prototype data."
        action={
          <Link to={routes.tenant.payments} data-navigation-link>
            Back to payments
          </Link>
        }
      />
    );
  }

  if (remainingOn(due) <= 0) {
    return (
      <div className={styles.page}>
        <h1>Pay your due</h1>
        <InlineAlert tone="success" title="This due is already settled">
          {due.label} has been paid in full, so there is nothing to pay.
        </InlineAlert>
        <Link className={styles.primaryAction} to={routes.tenant.payments}>
          Back to payments
        </Link>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <nav className={styles.breadcrumbs} aria-label="Breadcrumb">
        <Link to={routes.tenant.payments}>Payments</Link>
        <span aria-hidden="true"> / </span>
        <span aria-current="page">{due.label}</span>
      </nav>

      <header className={styles.pageHeader}>
        <div>
          <h1>Pay your due</h1>
          <p className={styles.pageContext}>
            Review the amount, choose a simulated method, and confirm. Nothing is charged.
          </p>
        </div>
      </header>

      <PayNowFlow
        due={due}
        tenancy={records.tenancy}
        property={records.property}
        unit={records.unit}
      />
    </div>
  );
};

export default PayDuePage;

import { Link } from 'react-router-dom';

import { PaymentStatusBadge } from '@/entities/payment/PaymentStatusBadge';
import { getDueStatus } from '@/entities/payment/status';
import { remainingOn } from '@/entities/payment/model';
import { useLandlordRecords } from '@/features/portfolio/useLandlordRecords';
import {
  formatCurrency,
  formatDate,
  formatDateTime,
  PAYMENT_METHOD_LABELS,
} from '@/shared/lib/format';
import { routes } from '@/shared/lib/routes';
import { Card } from '@/shared/ui/Card/Card';
import { DataTable } from '@/shared/ui/DataTable/DataTable';
import { SectionError } from '@/shared/ui/Feedback/Feedback';
import { Skeleton } from '@/shared/ui/Skeleton/Skeleton';

import styles from './landlord.module.css';

const LandlordPaymentsPage = () => {
  const { isPending, error, refetch, records } = useLandlordRecords();

  if (error) {
    return <SectionError title="We could not load your payments" onRetry={refetch} />;
  }

  if (isPending || !records) {
    return (
      <div className={styles.page}>
        <Skeleton lines={2} height="2rem" />
        <Skeleton lines={5} height="2.5rem" />
      </div>
    );
  }

  const tenancyById = new Map(records.tenancies.map((tenancy) => [tenancy.id, tenancy]));
  const outstandingDues = records.dues
    .filter((due) => remainingOn(due) > 0)
    .sort((left, right) => left.dueDate.localeCompare(right.dueDate));
  const collected = records.payments;
  const totalOutstanding = outstandingDues.reduce((total, due) => total + remainingOn(due), 0);
  const totalCollected = collected.reduce((total, payment) => total + payment.amount, 0);

  return (
    <div className={styles.page}>
      <header className={styles.pageHeader}>
        <div>
          <h1>Payments</h1>
          <p className={styles.pageContext}>
            What is still owed and what has already come in, across every tenancy.
          </p>
        </div>
        <Link className={styles.primaryAction} to={routes.landlord.tenants}>
          Go to tenants
        </Link>
      </header>

      <Card
        title="Outstanding dues"
        description={`${formatCurrency(totalOutstanding)} still to collect`}
        padding="flush"
      >
        <DataTable
          caption="Dues still to collect"
          rows={outstandingDues}
          rowKey={(due) => due.id}
          emptyMessage="Every due is settled"
          columns={[
            {
              key: 'tenant',
              header: 'Tenant',
              cell: (due) => {
                const tenancy = tenancyById.get(due.tenancyId);
                return tenancy ? (
                  <Link
                    className={styles.tableLink}
                    to={routes.landlord.tenantDetail(tenancy.id)}
                  >
                    {tenancy.tenantName}
                  </Link>
                ) : (
                  'Unknown tenant'
                );
              },
            },
            { key: 'label', header: 'Billing period', cell: (due) => due.label },
            { key: 'dueDate', header: 'Due date', cell: (due) => formatDate(due.dueDate) },
            {
              key: 'balance',
              header: 'Balance',
              align: 'end',
              cell: (due) => formatCurrency(remainingOn(due)),
            },
            {
              key: 'status',
              header: 'Status',
              mobileLabel: 'Payment status',
              cell: (due) => <PaymentStatusBadge status={getDueStatus(due)} />,
            },
          ]}
        />
      </Card>

      <Card
        title="Payment history"
        description={`${formatCurrency(totalCollected)} recorded in this prototype`}
        padding="flush"
      >
        <DataTable
          caption="Payments received"
          rows={collected}
          rowKey={(payment) => payment.id}
          emptyMessage="No payments recorded yet"
          columns={[
            {
              key: 'recordedAt',
              header: 'Recorded',
              cell: (payment) => formatDateTime(payment.recordedAt),
            },
            {
              key: 'tenant',
              header: 'Tenant',
              cell: (payment) => tenancyById.get(payment.tenancyId)?.tenantName ?? 'Unknown tenant',
            },
            {
              key: 'method',
              header: 'Method',
              cell: (payment) => PAYMENT_METHOD_LABELS[payment.method],
            },
            {
              key: 'source',
              header: 'Recorded by',
              cell: (payment) => (payment.source === 'landlord' ? 'You' : 'Tenant'),
            },
            {
              key: 'amount',
              header: 'Amount',
              align: 'end',
              cell: (payment) => formatCurrency(payment.amount),
            },
          ]}
        />
      </Card>
    </div>
  );
};

export default LandlordPaymentsPage;

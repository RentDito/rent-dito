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
import { DataTable } from '@/shared/ui/DataTable/DataTable';
import { SectionError } from '@/shared/ui/Feedback/Feedback';
import { Skeleton } from '@/shared/ui/Skeleton/Skeleton';

import styles from './tenant.module.css';

const TenantPaymentsPage = () => {
  const { isPending, error, refetch, records } = useTenantRecords();

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

  return (
    <div className={styles.page}>
      <header className={styles.pageHeader}>
        <div>
          <h1>Payments</h1>
          <p className={styles.pageContext}>
            What you still owe, and every payment recorded against your rental.
          </p>
        </div>
      </header>

      <Card
        title="Dues to pay"
        description={`${formatCurrency(records.outstanding)} outstanding in total`}
        padding="flush"
      >
        <DataTable
          caption="Dues you still need to pay"
          rows={records.unpaidDues}
          rowKey={(due) => due.id}
          emptyMessage="You are fully paid up"
          columns={[
            { key: 'label', header: 'Billing period', cell: (due) => due.label },
            { key: 'dueDate', header: 'Due date', cell: (due) => formatDate(due.dueDate) },
            {
              key: 'balance',
              header: 'Amount to pay',
              align: 'end',
              cell: (due) => formatCurrency(remainingOn(due)),
            },
            {
              key: 'status',
              header: 'Status',
              mobileLabel: 'Payment status',
              cell: (due) => <PaymentStatusBadge status={getDueStatus(due)} />,
            },
            {
              key: 'action',
              header: 'Action',
              align: 'end',
              cell: (due) => (
                <Link className={styles.tableAction} to={routes.tenant.payDue(due.id)}>
                  {`Pay ${due.label}`}
                </Link>
              ),
            },
          ]}
        />
      </Card>

      <Card title="Payment history" padding="flush">
        <DataTable
          caption="Payments you have made"
          rows={records.payments}
          rowKey={(payment) => payment.id}
          emptyMessage="No payments recorded yet"
          columns={[
            {
              key: 'recordedAt',
              header: 'Recorded',
              cell: (payment) => formatDateTime(payment.recordedAt),
            },
            {
              key: 'period',
              header: 'Billing period',
              cell: (payment) => records.dueById(payment.dueId)?.label ?? 'Earlier period',
            },
            {
              key: 'method',
              header: 'Method',
              cell: (payment) => PAYMENT_METHOD_LABELS[payment.method],
            },
            {
              key: 'source',
              header: 'Recorded by',
              cell: (payment) => (payment.source === 'tenant' ? 'You' : 'Your landlord'),
            },
            {
              key: 'amount',
              header: 'Amount',
              align: 'end',
              cell: (payment) => formatCurrency(payment.amount),
            },
            {
              key: 'receipt',
              header: 'Receipt',
              align: 'end',
              cell: (payment) => (
                <Link className={styles.tableAction} to={routes.tenant.receipt(payment.id)}>
                  View receipt
                </Link>
              ),
            },
          ]}
        />
      </Card>
    </div>
  );
};

export default TenantPaymentsPage;

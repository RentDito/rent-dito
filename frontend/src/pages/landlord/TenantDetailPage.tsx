import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';

import { PaymentStatusBadge } from '@/entities/payment/PaymentStatusBadge';
import { getDueStatus } from '@/entities/payment/status';
import { TenantSummary } from '@/entities/tenancy/TenantSummary';
import { remainingOn } from '@/entities/payment/model';
import { RecordPaymentForm } from '@/features/payment/RecordPaymentForm';
import { useLandlordRecords } from '@/features/portfolio/useLandlordRecords';
import { formatCurrency, formatDate, formatDateTime, PAYMENT_METHOD_LABELS } from '@/shared/lib/format';
import { routes } from '@/shared/lib/routes';
import { Button } from '@/shared/ui/Button/Button';
import { Card, StatCard } from '@/shared/ui/Card/Card';
import { DataTable } from '@/shared/ui/DataTable/DataTable';
import { Dialog } from '@/shared/ui/Dialog/Dialog';
import { EmptyState, InlineAlert, SectionError } from '@/shared/ui/Feedback/Feedback';
import { Skeleton } from '@/shared/ui/Skeleton/Skeleton';

import styles from './landlord.module.css';

const TenantDetailPage = () => {
  const { tenancyId = '' } = useParams();
  const { isPending, error, refetch, records } = useLandlordRecords();
  const [recording, setRecording] = useState(false);
  const [recorded, setRecorded] = useState(false);

  if (error) {
    return <SectionError title="We could not load this tenant record" onRetry={refetch} />;
  }

  if (isPending || !records) {
    return (
      <div className={styles.page}>
        <Skeleton lines={2} height="2rem" />
        <Skeleton lines={4} height="3rem" />
      </div>
    );
  }

  const tenancy = records.tenancies.find((candidate) => candidate.id === tenancyId);

  if (!tenancy) {
    return (
      <EmptyState
        headingLevel={2}
        title="That tenant record is not in your portfolio"
        description="It may have been removed from the prototype data."
        action={
          <Link to={routes.landlord.tenants} data-navigation-link>
            Back to tenants
          </Link>
        }
      />
    );
  }

  const dues = records.duesOf(tenancy.id);
  const unpaidDues = dues.filter((due) => remainingOn(due) > 0);
  const payments = records.paymentsOf(tenancy.id);
  const outstanding = records.outstandingOf(tenancy.id);
  const property = records.propertyOf(tenancy);
  const unitName = records.unitNameOf(tenancy);

  return (
    <div className={styles.page}>
      <nav className={styles.breadcrumbs} aria-label="Breadcrumb">
        <Link to={routes.landlord.tenants}>Tenants</Link>
        <span aria-hidden="true"> / </span>
        <span aria-current="page">{tenancy.tenantName}</span>
      </nav>

      <header className={styles.pageHeader}>
        <div>
          <h1>Tenant record</h1>
          <p className={styles.pageContext}>
            {property?.title ?? 'Property'} · {unitName ?? 'Unit'}
          </p>
        </div>
        <Button size="large" onClick={() => setRecording(true)}>
          Record payment
        </Button>
      </header>

      {recorded ? (
        <InlineAlert tone="success" title="Payment recorded">
          The balance below reflects the payment. Nothing was charged — this prototype only stores
          the record on this device.
        </InlineAlert>
      ) : null}

      <div className={styles.statGrid}>
        <StatCard
          label="Outstanding balance"
          value={formatCurrency(outstanding)}
          description={`${unpaidDues.length} unpaid due${unpaidDues.length === 1 ? '' : 's'}`}
          tone={outstanding > 0 ? 'danger' : 'success'}
        />
        <StatCard
          label="Monthly rent"
          value={formatCurrency(tenancy.monthlyRent)}
          description={`Due on day ${tenancy.paymentDueDay} of each month`}
          tone="brand"
        />
        <StatCard
          label="Payments recorded"
          value={String(payments.length)}
          description="Across this tenancy"
          tone="info"
        />
      </div>

      <Card title="Tenant and tenancy">
        <TenantSummary tenancy={tenancy} propertyTitle={property?.title} unitName={unitName} />
      </Card>

      <Card title="Due history" padding="flush">
        <DataTable
          caption="Dues billed to this tenant"
          rows={dues}
          rowKey={(due) => due.id}
          emptyMessage="No dues have been billed yet"
          columns={[
            { key: 'label', header: 'Billing period', cell: (due) => due.label },
            { key: 'dueDate', header: 'Due date', cell: (due) => formatDate(due.dueDate) },
            {
              key: 'amount',
              header: 'Amount',
              align: 'end',
              cell: (due) => formatCurrency(due.amount),
            },
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

      <Card title="Payment history" padding="flush">
        <DataTable
          caption="Payments recorded for this tenant"
          rows={payments}
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
              cell: (payment) =>
                dues.find((due) => due.id === payment.dueId)?.label ?? 'Earlier period',
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

      <Dialog open={recording} title="Record a payment" onClose={() => setRecording(false)}>
        <RecordPaymentForm
          tenancy={tenancy}
          dues={unpaidDues}
          unitName={unitName}
          onRecorded={() => {
            setRecording(false);
            setRecorded(true);
          }}
          onCancel={() => setRecording(false)}
        />
      </Dialog>
    </div>
  );
};

export default TenantDetailPage;

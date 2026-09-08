import { Link } from 'react-router-dom';

import { PaymentStatusBadge } from '@/entities/payment/PaymentStatusBadge';
import { getDueStatus } from '@/entities/payment/status';
import { usePortfolioSummary } from '@/features/portfolio/usePortfolioSummary';
import { formatCurrency, formatDate } from '@/shared/lib/format';
import { routes } from '@/shared/lib/routes';
import { Card, StatCard } from '@/shared/ui/Card/Card';
import { EmptyState, SectionError } from '@/shared/ui/Feedback/Feedback';
import { Skeleton } from '@/shared/ui/Skeleton/Skeleton';

import styles from './landlord.module.css';

const LandlordDashboardPage = () => {
  const { isPending, error, refetch, summary } = usePortfolioSummary();

  return (
    <div className={styles.page}>
      <header className={styles.pageHeader}>
        <div>
          <h1>Portfolio overview</h1>
          <p className={styles.pageContext}>
            Where your rent, vacancies, and tenant messages stand right now.
          </p>
        </div>
        <Link className={styles.primaryAction} to={routes.landlord.properties}>
          Manage properties
        </Link>
      </header>

      {error ? (
        <SectionError title="We could not load your portfolio" onRetry={refetch} />
      ) : null}

      {isPending && !error ? (
        <div className={styles.statGrid}>
          {Array.from({ length: 6 }, (_, index) => (
            <Skeleton key={index} lines={2} height="1.75rem" />
          ))}
        </div>
      ) : null}

      {summary ? (
        <>
          <div className={styles.statGrid}>
            <StatCard
              label="Expected this month"
              value={formatCurrency(summary.expectedThisMonth)}
              description="Total billed across your active tenancies"
            />
            <StatCard
              label="Collected this month"
              value={formatCurrency(summary.collectedThisMonth)}
              description={`${formatCurrency(
                Math.max(summary.expectedThisMonth - summary.collectedThisMonth, 0),
              )} still to collect`}
            />
            <StatCard
              label="Overdue"
              value={formatCurrency(summary.overdueAmount)}
              description={`${summary.overdueCount} due${
                summary.overdueCount === 1 ? '' : 's'
              } past the due date`}
              tone={summary.overdueAmount > 0 ? 'danger' : 'neutral'}
            />
            <StatCard
              label="Occupancy"
              value={`${Math.round(summary.occupancyRate * 100)}%`}
              description={`${summary.occupiedCount} of ${summary.unitCount} units occupied`}
            />
            <StatCard
              label="Vacant units"
              value={String(summary.vacantCount)}
              description="Available and visible in public search"
            />
            <StatCard
              label="Open inquiries"
              value={String(summary.openInquiryCount)}
              description={`${summary.needsReplyCount} still need a reply`}
              tone={summary.needsReplyCount > 0 ? 'warning' : 'neutral'}
            />
          </div>

          <Card
            title="Needs your attention"
            description="Unpaid dues across your tenancies, soonest first."
            actions={
              <Link className={styles.cardLink} to={routes.landlord.payments}>
                All payments
              </Link>
            }
          >
            {summary.attentionDues.length === 0 ? (
              <EmptyState
                title="Every due is settled"
                description="Nothing is outstanding across your properties right now."
              />
            ) : (
              <ul className={styles.attentionList}>
                {summary.attentionDues.map(({ due, tenancy, property, unitName }) => (
                    <li key={due.id} className={styles.attentionRow}>
                      <div>
                        <p className={styles.attentionTitle}>{due.label}</p>
                        <p className={styles.attentionMeta}>
                          {property?.title ?? 'Property'} · {unitName ?? 'Unit'} · due{' '}
                          {formatDate(due.dueDate)}
                        </p>
                      </div>
                      <div className={styles.attentionAside}>
                        <p className={styles.attentionAmount}>
                          {formatCurrency(due.amount - due.paidAmount)}
                        </p>
                        <PaymentStatusBadge status={getDueStatus(due)} />
                        <Link
                          className={styles.cardLink}
                          to={routes.landlord.tenantDetail(tenancy.id)}
                        >
                          Open tenant record
                        </Link>
                      </div>
                    </li>
                ))}
              </ul>
            )}
          </Card>
        </>
      ) : null}
    </div>
  );
};

export default LandlordDashboardPage;

import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { Link } from 'react-router-dom';

import { rentDitoRepository } from '@/app/repositories';
import { InquiryTimeline } from '@/entities/inquiry/InquiryTimeline';
import type { Inquiry } from '@/entities/inquiry/model';
import { InquiryForm } from '@/features/inquiry/InquiryForm';
import { inquiryKeys } from '@/features/inquiry/inquiryKeys';
import { listingKeys } from '@/features/listing-search/useListingSearch';
import { useTenantRecords } from '@/features/tenancy/useTenantRecords';
import { routes } from '@/shared/lib/routes';
import { Button } from '@/shared/ui/Button/Button';
import { Card } from '@/shared/ui/Card/Card';
import { Dialog } from '@/shared/ui/Dialog/Dialog';
import { EmptyState, InlineAlert, SectionError } from '@/shared/ui/Feedback/Feedback';
import { Skeleton } from '@/shared/ui/Skeleton/Skeleton';

import styles from './tenant.module.css';

const TenantInquiriesPage = () => {
  const { records } = useTenantRecords();
  const [composing, setComposing] = useState(false);
  const [sent, setSent] = useState(false);

  const inquiries = useQuery({
    queryKey: inquiryKeys.list('tenant'),
    queryFn: () => rentDitoRepository.listInquiries('tenant'),
  });

  const properties = useQuery({
    queryKey: listingKeys.list({}),
    queryFn: () => rentDitoRepository.listProperties({}),
  });

  const titleFor = (inquiry: Inquiry) =>
    properties.data?.find((property) => property.id === inquiry.propertyId)?.title ??
    'This property';

  const ordered = (inquiries.data ?? []).slice().sort((left, right) => {
    const leftAt = left.repliedAt ?? left.createdAt;
    const rightAt = right.repliedAt ?? right.createdAt;
    return rightAt.localeCompare(leftAt);
  });

  const rental = records?.property;

  return (
    <div className={styles.page}>
      <header className={styles.pageHeader}>
        <div>
          <h1>Inquiries</h1>
          <p className={styles.pageContext}>
            Your messages about rentals, newest activity first. Nothing is sent to a real landlord.
          </p>
        </div>
        {rental ? (
          <Button size="large" onClick={() => setComposing(true)}>
            Message your landlord
          </Button>
        ) : (
          <Link className={styles.primaryAction} to={routes.listings}>
            Browse rentals
          </Link>
        )}
      </header>

      {sent ? (
        <InlineAlert tone="success" title="Inquiry saved in this prototype">
          Your message is stored on this device. The thread below shows what you sent.
        </InlineAlert>
      ) : null}

      {inquiries.isError ? (
        <SectionError
          title="We could not load your inquiries"
          onRetry={() => void inquiries.refetch()}
        />
      ) : null}

      {inquiries.isPending ? <Skeleton lines={4} height="3rem" /> : null}

      {inquiries.data && ordered.length === 0 ? (
        <EmptyState
          headingLevel={2}
          title="You have not sent any inquiries"
          description="Ask a landlord about a listing and the conversation appears here."
          action={
            <Link to={routes.listings} data-navigation-link>
              Browse rentals
            </Link>
          }
        />
      ) : null}

      {ordered.map((inquiry) => (
        <Card
          key={inquiry.id}
          title={titleFor(inquiry)}
          actions={
            <Link className={styles.cardLink} to={routes.listingDetail(inquiry.propertyId)}>
              View listing
            </Link>
          }
        >
          <InquiryTimeline inquiry={inquiry} tenantLabel="You" landlordLabel="Landlord" />
        </Card>
      ))}

      {rental ? (
        <Dialog
          open={composing}
          title={`Message ${rental.landlordName}`}
          onClose={() => setComposing(false)}
        >
          <InquiryForm
            propertyId={rental.id}
            propertyTitle={rental.title}
            contextLine={`${rental.title}${
              records?.unit ? ` · ${records.unit.name}` : ''
            } · your current rental`}
            onSent={() => {
              setComposing(false);
              setSent(true);
            }}
            onCancel={() => setComposing(false)}
          />
        </Dialog>
      ) : null}
    </div>
  );
};

export default TenantInquiriesPage;

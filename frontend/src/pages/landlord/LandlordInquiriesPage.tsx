import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Link } from 'react-router-dom';

import { rentDitoRepository } from '@/app/repositories';
import { InquiryTimeline } from '@/entities/inquiry/InquiryTimeline';
import { getInquiryActivity, type Inquiry } from '@/entities/inquiry/model';
import { inquiryKeys } from '@/features/inquiry/inquiryKeys';
import { useLandlordRecords } from '@/features/portfolio/useLandlordRecords';
import { OFFLINE_ACTION_MESSAGE, useOnlineStatus } from '@/shared/hooks/useOnlineStatus';
import { routes } from '@/shared/lib/routes';
import { Button } from '@/shared/ui/Button/Button';
import { Card } from '@/shared/ui/Card/Card';
import { Dialog } from '@/shared/ui/Dialog/Dialog';
import { EmptyState, InlineAlert, SectionError } from '@/shared/ui/Feedback/Feedback';
import { Field } from '@/shared/ui/Field/Field';
import { Skeleton } from '@/shared/ui/Skeleton/Skeleton';
import { useToast } from '@/shared/ui/Toast/toastContext';

import styles from './landlord.module.css';

const LandlordInquiriesPage = () => {
  const queryClient = useQueryClient();
  const isOnline = useOnlineStatus();
  const { showToast } = useToast();
  const { records } = useLandlordRecords();

  const [replyingTo, setReplyingTo] = useState<Inquiry | null>(null);
  const [reply, setReply] = useState('');
  const [replyError, setReplyError] = useState<string | null>(null);
  const [replied, setReplied] = useState(false);

  const inquiries = useQuery({
    queryKey: inquiryKeys.list('landlord'),
    queryFn: () => rentDitoRepository.listInquiries('landlord'),
  });

  const send = useMutation({
    mutationFn: (input: { inquiryId: string; reply: string }) =>
      rentDitoRepository.replyToInquiry(input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: inquiryKeys.all });
      showToast({ title: 'Reply saved' });
      setReplyingTo(null);
      setReply('');
      setReplied(true);
    },
  });

  const titleFor = (inquiry: Inquiry) =>
    records?.properties.find((property) => property.id === inquiry.propertyId)?.title ??
    'This property';

  /** Newest activity first, so threads needing a reply surface at the top. */
  const ordered = (inquiries.data ?? []).slice().sort((left, right) => {
    const leftAt = left.repliedAt ?? left.createdAt;
    const rightAt = right.repliedAt ?? right.createdAt;
    return rightAt.localeCompare(leftAt);
  });

  const submitReply = () => {
    if (!replyingTo) return;
    if (reply.trim().length < 5) {
      setReplyError('Write at least 5 characters so your tenant gets a useful answer.');
      return;
    }
    setReplyError(null);
    send.mutate({ inquiryId: replyingTo.id, reply: reply.trim() });
  };

  return (
    <div className={styles.page}>
      <header className={styles.pageHeader}>
        <div>
          <h1>Inquiries</h1>
          <p className={styles.pageContext}>
            Messages about your properties, newest activity first. Replies are stored on this
            device only.
          </p>
        </div>
        <Link className={styles.primaryAction} to={routes.landlord.properties}>
          Go to properties
        </Link>
      </header>

      {replied ? (
        <InlineAlert tone="success" title="Reply saved in this prototype">
          The thread below shows your reply. Nothing was sent to a real tenant.
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
          title="No inquiries yet"
          description="When someone asks about one of your listings, the conversation appears here."
        />
      ) : null}

      {ordered.map((inquiry) => (
        <Card
          key={inquiry.id}
          title={titleFor(inquiry)}
          actions={
            getInquiryActivity(inquiry) === 'needs-reply' ? (
              <Button
                variant="secondary"
                onClick={() => {
                  setReplyingTo(inquiry);
                  setReply('');
                  setReplyError(null);
                  send.reset();
                }}
              >
                {`Reply to ${titleFor(inquiry)} inquiry`}
              </Button>
            ) : null
          }
        >
          <InquiryTimeline
            inquiry={inquiry}
            tenantLabel="Prospective tenant"
            landlordLabel="You"
          />
        </Card>
      ))}

      <Dialog
        open={Boolean(replyingTo)}
        title="Reply to this inquiry"
        onClose={() => setReplyingTo(null)}
      >
        <div className={styles.replyForm}>
          <Field
            label="Your reply"
            required
            hint="Answer the question and say what happens next."
            error={replyError ?? (send.isError ? (send.error as Error).message : undefined)}
          >
            <textarea
              rows={5}
              value={reply}
              onChange={(event) => setReply(event.target.value)}
            />
          </Field>

          {!isOnline ? <InlineAlert tone="warning" title={OFFLINE_ACTION_MESSAGE} /> : null}

          <div className={styles.replyActions}>
            <Button variant="secondary" onClick={() => setReplyingTo(null)}>
              Cancel
            </Button>
            <Button loading={send.isPending} disabled={!isOnline} onClick={submitReply}>
              Send reply
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
};

export default LandlordInquiriesPage;

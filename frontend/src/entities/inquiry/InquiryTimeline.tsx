import {
  getInquiryActivity,
  INQUIRY_ACTIVITY_LABELS,
  INQUIRY_ACTIVITY_TONES,
  type Inquiry,
} from '@/entities/inquiry/model';
import { formatDateTime } from '@/shared/lib/format';
import { StatusBadge } from '@/shared/ui/StatusBadge/StatusBadge';

import styles from './InquiryTimeline.module.css';

export interface InquiryTimelineProps {
  inquiry: Inquiry;
  /** Names shown against each message, so the thread reads as a conversation. */
  tenantLabel: string;
  landlordLabel: string;
}

/** Chronological thread: who wrote it, when, and what they said. */
export const InquiryTimeline = ({
  inquiry,
  tenantLabel,
  landlordLabel,
}: InquiryTimelineProps) => {
  const activity = getInquiryActivity(inquiry);

  return (
    <div className={styles.thread}>
      <StatusBadge tone={INQUIRY_ACTIVITY_TONES[activity]}>
        {INQUIRY_ACTIVITY_LABELS[activity]}
      </StatusBadge>

      <ol className={styles.timeline}>
        <li className={styles.entry}>
          <p className={styles.meta}>
            <span className={styles.author}>{tenantLabel}</span>
            <time dateTime={inquiry.createdAt}>{formatDateTime(inquiry.createdAt)}</time>
          </p>
          <p className={styles.message}>{inquiry.message}</p>
        </li>

        {inquiry.reply ? (
          <li className={styles.entry}>
            <p className={styles.meta}>
              <span className={styles.author}>{landlordLabel}</span>
              {inquiry.repliedAt ? (
                <time dateTime={inquiry.repliedAt}>{formatDateTime(inquiry.repliedAt)}</time>
              ) : null}
            </p>
            <p className={styles.message}>{inquiry.reply}</p>
          </li>
        ) : null}
      </ol>
    </div>
  );
};

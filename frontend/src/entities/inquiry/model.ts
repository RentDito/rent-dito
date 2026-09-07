import type { Tone } from '@/shared/types/status';

export type InquiryStatus = 'open' | 'replied' | 'closed';

export interface Inquiry {
  id: string;
  propertyId: string;
  tenantId: string;
  landlordId: string;
  message: string;
  status: InquiryStatus;
  createdAt: string;
  reply?: string;
  repliedAt?: string;
}

/** What the landlord actually has to do about a thread. */
export type InquiryActivity = 'needs-reply' | 'replied' | 'resolved';

export const getInquiryActivity = (inquiry: Inquiry): InquiryActivity => {
  if (inquiry.status === 'closed') return 'resolved';
  return inquiry.reply ? 'replied' : 'needs-reply';
};

export const INQUIRY_ACTIVITY_LABELS: Record<InquiryActivity, string> = {
  'needs-reply': 'Needs reply',
  replied: 'Replied',
  resolved: 'Resolved',
};

export const INQUIRY_ACTIVITY_TONES: Record<InquiryActivity, Tone> = {
  'needs-reply': 'warning',
  replied: 'info',
  resolved: 'success',
};

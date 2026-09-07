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

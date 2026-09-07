/** Query keys for inquiry reads, shared by the landlord and tenant threads. */
export const inquiryKeys = {
  all: ['inquiries'] as const,
  list: (role: 'landlord' | 'tenant') => ['inquiries', role] as const,
};

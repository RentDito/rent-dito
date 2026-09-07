export type UserRole = 'tenant' | 'landlord';

export interface User {
  id: string;
  role: UserRole;
  name: string;
  email: string;
  phone: string;
  savedPropertyIds: string[];
}

/**
 * The prototype's fixed demo identities. This stands in for authentication:
 * with a real backend these ids would come from the signed-in session.
 */
export const DEMO_TENANT_ID = 'user-tenant-01';
export const DEMO_LANDLORD_ID = 'user-landlord-01';

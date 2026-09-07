export type UserRole = 'tenant' | 'landlord';

export interface User {
  id: string;
  role: UserRole;
  name: string;
  email: string;
  phone: string;
  savedPropertyIds: string[];
}
